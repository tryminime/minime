//! Local full-text search using SQLite FTS5.
//!
//! Provides completely offline semantic-ish search over content ingested
//! by the browser extension and document extractor. Uses SQLite FTS5
//! (included in bundled rusqlite) — zero external dependencies.
//!
//! Table schema:
//!   content(id, title, url, doc_type, keyphrases, entities, full_text, created_at)
//!   content_fts (FTS5 virtual table over full_text + title + keyphrases)

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::AppHandle;
use tauri::Manager; // required for AppHandle::path()

// ============================================================================
// DATA MODELS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentRecord {
    pub id: String,
    pub title: String,
    pub url: String,
    pub doc_type: String,
    pub keyphrases: Vec<String>,
    pub entities: Vec<String>,
    pub text_snippet: String,
    pub word_count: u32,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub id: String,
    pub title: String,
    pub url: String,
    pub doc_type: String,
    pub snippet: String,           // highlighted matching snippet
    pub keyphrases: Vec<String>,
    pub rank: f64,                 // FTS5 rank score
    pub created_at: String,
}

// ============================================================================
// LOCAL SEARCH ENGINE
// ============================================================================

pub struct LocalSearch {
    conn: Mutex<Connection>,
}

impl LocalSearch {
    /// Open (or create) the local search database.
    pub fn open(app: &AppHandle) -> Result<Self, String> {
        let db_path = Self::db_path(app);

        // Ensure parent directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create data dir: {e}"))?;
        }

        let conn = Connection::open(&db_path)
            .map_err(|e| format!("Failed to open local search DB: {e}"))?;

        // Performance pragmas
        conn.execute_batch(
            "PRAGMA journal_mode=WAL;
             PRAGMA synchronous=NORMAL;
             PRAGMA cache_size=5000;
             PRAGMA temp_store=MEMORY;",
        )
        .map_err(|e| format!("PRAGMA failed: {e}"))?;

        let search = Self {
            conn: Mutex::new(conn),
        };
        search.init_schema()?;
        Ok(search)
    }

    fn db_path(app: &AppHandle) -> PathBuf {
        app.path()
            .app_local_data_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join("local_search.db")
    }

    fn init_schema(&self) -> Result<(), String> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS content (
                id           TEXT PRIMARY KEY,
                title        TEXT NOT NULL DEFAULT '',
                url          TEXT NOT NULL DEFAULT '',
                doc_type     TEXT NOT NULL DEFAULT 'webpage',
                keyphrases   TEXT NOT NULL DEFAULT '[]',
                entities     TEXT NOT NULL DEFAULT '[]',
                full_text    TEXT NOT NULL DEFAULT '',
                text_snippet TEXT NOT NULL DEFAULT '',
                word_count   INTEGER NOT NULL DEFAULT 0,
                created_at   TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE VIRTUAL TABLE IF NOT EXISTS content_fts USING fts5(
                title,
                keyphrases,
                full_text,
                content=content,
                content_rowid=rowid,
                tokenize='porter ascii'
            );

            -- Keep FTS5 in sync with content table
            CREATE TRIGGER IF NOT EXISTS content_ai AFTER INSERT ON content BEGIN
                INSERT INTO content_fts(rowid, title, keyphrases, full_text)
                VALUES (new.rowid, new.title, new.keyphrases, new.full_text);
            END;
            CREATE TRIGGER IF NOT EXISTS content_ad AFTER DELETE ON content BEGIN
                INSERT INTO content_fts(content_fts, rowid, title, keyphrases, full_text)
                VALUES ('delete', old.rowid, old.title, old.keyphrases, old.full_text);
            END;
            CREATE TRIGGER IF NOT EXISTS content_au AFTER UPDATE ON content BEGIN
                INSERT INTO content_fts(content_fts, rowid, title, keyphrases, full_text)
                VALUES ('delete', old.rowid, old.title, old.keyphrases, old.full_text);
                INSERT INTO content_fts(rowid, title, keyphrases, full_text)
                VALUES (new.rowid, new.title, new.keyphrases, new.full_text);
            END;",
        )
        .map_err(|e| format!("Schema init failed: {e}"))?;
        Ok(())
    }

    // ========================================================================
    // WRITE OPERATIONS
    // ========================================================================

    /// Index a content record (insert or replace).
    pub fn index(&self, record: &ContentRecord) -> Result<(), String> {
        let conn = self.conn.lock().unwrap();

        let keyphrases_json = serde_json::to_string(&record.keyphrases)
            .unwrap_or_else(|_| "[]".to_string());
        let entities_json = serde_json::to_string(&record.entities)
            .unwrap_or_else(|_| "[]".to_string());

        conn.execute(
            "INSERT OR REPLACE INTO content
                (id, title, url, doc_type, keyphrases, entities, full_text, text_snippet, word_count, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                record.id,
                record.title,
                record.url,
                record.doc_type,
                keyphrases_json,
                entities_json,
                record.text_snippet,  // store snippet as searchable text (not full text to save space)
                record.text_snippet,
                record.word_count,
                record.created_at,
            ],
        )
        .map_err(|e| format!("Index insert failed: {e}"))?;

        Ok(())
    }

    /// Delete a content record by ID.
    pub fn delete(&self, id: &str) -> Result<bool, String> {
        let conn = self.conn.lock().unwrap();
        let rows = conn
            .execute("DELETE FROM content WHERE id = ?1", params![id])
            .map_err(|e| format!("Delete failed: {e}"))?;
        Ok(rows > 0)
    }

    /// Clear all content records.
    pub fn clear_all(&self) -> Result<usize, String> {
        let conn = self.conn.lock().unwrap();
        let rows = conn
            .execute("DELETE FROM content", [])
            .map_err(|e| format!("Clear failed: {e}"))?;
        Ok(rows)
    }

    // ========================================================================
    // SEARCH
    // ========================================================================

    /// Full-text search using SQLite FTS5 with Porter stemmer.
    ///
    /// Returns results ranked by FTS5 BM25 score.
    pub fn search(&self, query: &str, limit: usize) -> Result<Vec<SearchResult>, String> {
        if query.trim().is_empty() {
            return Ok(vec![]);
        }

        let conn = self.conn.lock().unwrap();

        // Sanitize query for FTS5 (remove special chars)
        let safe_query = Self::sanitize_fts_query(query);

        let mut stmt = conn
            .prepare(
                "SELECT c.id, c.title, c.url, c.doc_type, c.keyphrases,
                        c.text_snippet, c.created_at,
                        content_fts.rank
                 FROM content_fts
                 JOIN content c ON content_fts.rowid = c.rowid
                 WHERE content_fts MATCH ?1
                 ORDER BY content_fts.rank
                 LIMIT ?2",
            )
            .map_err(|e| format!("Search prepare failed: {e}"))?;

        let results = stmt
            .query_map(params![safe_query, limit as i64], |row| {
                let keyphrases_json: String = row.get(4)?;
                let keyphrases: Vec<String> =
                    serde_json::from_str(&keyphrases_json).unwrap_or_default();
                let snippet: String = row.get(5)?;
                let rank: f64 = row.get(7)?;

                Ok(SearchResult {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    url: row.get(2)?,
                    doc_type: row.get(3)?,
                    snippet: Self::highlight_snippet(&snippet, ""),
                    keyphrases,
                    rank: -rank,   // FTS5 rank is negative; flip for ascending relevance
                    created_at: row.get(6)?,
                })
            })
            .map_err(|e| format!("Search query failed: {e}"))?;

        let mut out = Vec::new();
        for r in results {
            out.push(r.map_err(|e| format!("Row error: {e}"))?);
        }
        Ok(out)
    }

    /// List most recently indexed content (no query).
    pub fn list_recent(&self, limit: usize) -> Result<Vec<SearchResult>, String> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn
            .prepare(
                "SELECT id, title, url, doc_type, keyphrases, text_snippet, created_at
                 FROM content ORDER BY created_at DESC LIMIT ?1",
            )
            .map_err(|e| format!("List prepare failed: {e}"))?;

        let results = stmt
            .query_map(params![limit as i64], |row| {
                let keyphrases_json: String = row.get(4)?;
                let keyphrases: Vec<String> =
                    serde_json::from_str(&keyphrases_json).unwrap_or_default();
                Ok(SearchResult {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    url: row.get(2)?,
                    doc_type: row.get(3)?,
                    snippet: row.get(5)?,
                    keyphrases,
                    rank: 1.0,
                    created_at: row.get(6)?,
                })
            })
            .map_err(|e| format!("List query failed: {e}"))?;

        let mut out = Vec::new();
        for r in results {
            out.push(r.map_err(|e| format!("Row error: {e}"))?);
        }
        Ok(out)
    }

    /// Get count of indexed records.
    pub fn count(&self) -> Result<i64, String> {
        let conn = self.conn.lock().unwrap();
        conn.query_row("SELECT COUNT(*) FROM content", [], |row| row.get(0))
            .map_err(|e| format!("Count failed: {e}"))
    }

    // ========================================================================
    // HELPERS
    // ========================================================================

    fn sanitize_fts_query(q: &str) -> String {
        // Escape FTS5 special chars, wrap in quotes for phrase search if multi-word
        let cleaned: String = q
            .chars()
            .filter(|c| c.is_alphanumeric() || c.is_whitespace() || *c == '-' || *c == '.')
            .collect();
        let trimmed = cleaned.trim();
        if trimmed.contains(' ') {
            // Multi-word: allow partial matching on each token
            trimmed
                .split_whitespace()
                .map(|w| format!("{w}*"))
                .collect::<Vec<_>>()
                .join(" ")
        } else {
            format!("{trimmed}*")
        }
    }

    fn highlight_snippet(text: &str, _query: &str) -> String {
        // Return first 250 chars as snippet
        if text.len() <= 250 {
            text.to_string()
        } else {
            format!("{}…", &text[..247])
        }
    }
}
