//! Screenshot capture module — on-demand screenshot with encryption.
//!
//! Privacy-first: screenshots are ONLY captured on explicit user command,
//! never automatically. Images are encrypted before storage.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::io::Cursor;
use xcap::Monitor;

use crate::encryption::EncryptionManager;

/// Metadata for a captured screenshot
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenshotMeta {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub width: u32,
    pub height: u32,
    pub monitor_name: String,
    pub file_size_bytes: usize,
    /// Optional user-provided label
    pub label: Option<String>,
}

/// Result of a screenshot capture
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureResult {
    pub meta: ScreenshotMeta,
    pub success: bool,
    pub message: String,
}

/// Screenshot manager — captures, encrypts, stores, and retrieves screenshots
pub struct ScreenshotManager {
    db_path: std::path::PathBuf,
}

impl ScreenshotManager {
    pub fn new(app_data_dir: std::path::PathBuf) -> Self {
        let db_path = app_data_dir.join("screenshots.db");

        // Initialize screenshots database
        if let Ok(conn) = rusqlite::Connection::open(&db_path) {
            conn.execute_batch(
                "CREATE TABLE IF NOT EXISTS screenshots (
                    id TEXT PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    width INTEGER NOT NULL,
                    height INTEGER NOT NULL,
                    monitor_name TEXT NOT NULL,
                    label TEXT,
                    encrypted_data BLOB NOT NULL,
                    file_size_bytes INTEGER NOT NULL,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                );
                CREATE INDEX IF NOT EXISTS idx_screenshots_timestamp ON screenshots(timestamp);",
            )
            .ok();
        }

        Self { db_path }
    }

    /// Capture the full primary monitor screen
    pub fn capture(&self, label: Option<String>) -> Result<CaptureResult, String> {
        let monitors = Monitor::all().map_err(|e| format!("Failed to enumerate monitors: {}", e))?;

        let monitor = monitors
            .first()
            .ok_or_else(|| "No monitors found".to_string())?;

        self.capture_monitor(monitor, label)
    }

    /// Capture a specific monitor by index
    pub fn capture_monitor_by_index(
        &self,
        index: usize,
        label: Option<String>,
    ) -> Result<CaptureResult, String> {
        let monitors = Monitor::all().map_err(|e| format!("Failed to enumerate monitors: {}", e))?;

        let monitor = monitors
            .get(index)
            .ok_or_else(|| format!("Monitor index {} not found, {} available", index, monitors.len()))?;

        self.capture_monitor(monitor, label)
    }

    /// Internal: capture from a specific monitor
    fn capture_monitor(
        &self,
        monitor: &Monitor,
        label: Option<String>,
    ) -> Result<CaptureResult, String> {
        // Capture the screen
        let image = monitor
            .capture_image()
            .map_err(|e| format!("Screenshot capture failed: {}", e))?;

        let width = image.width();
        let height = image.height();
        let monitor_name = monitor.name().to_string();

        // Encode as PNG into memory buffer
        let mut png_buffer = Vec::new();
        let mut cursor = Cursor::new(&mut png_buffer);
        image
            .write_to(&mut cursor, xcap::image::ImageFormat::Png)
            .map_err(|e| format!("PNG encoding failed: {}", e))?;

        let file_size_bytes = png_buffer.len();

        // Encrypt the image data
        let encrypted_data = EncryptionManager::encrypt_data(&png_buffer)
            .map_err(|e| format!("Encryption failed: {}", e))?;

        // Generate metadata
        let id = uuid::Uuid::new_v4().to_string();
        let timestamp = Utc::now();

        let meta = ScreenshotMeta {
            id: id.clone(),
            timestamp,
            width,
            height,
            monitor_name: monitor_name.clone(),
            file_size_bytes,
            label: label.clone(),
        };

        // Store in SQLite
        let conn = rusqlite::Connection::open(&self.db_path)
            .map_err(|e| format!("DB open failed: {}", e))?;

        conn.execute(
            "INSERT INTO screenshots (id, timestamp, width, height, monitor_name, label, encrypted_data, file_size_bytes)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            rusqlite::params![
                id,
                timestamp.to_rfc3339(),
                width,
                height,
                monitor_name,
                label,
                encrypted_data,
                file_size_bytes as i64,
            ],
        )
        .map_err(|e| format!("DB insert failed: {}", e))?;

        log::info!(
            "Screenshot captured: {}x{} from '{}' ({} bytes, encrypted)",
            width,
            height,
            monitor_name,
            file_size_bytes
        );

        Ok(CaptureResult {
            meta,
            success: true,
            message: format!("Screenshot captured ({}x{})", width, height),
        })
    }

    /// List all screenshot metadata (without image data)
    pub fn list_screenshots(
        &self,
        limit: usize,
        offset: usize,
    ) -> Result<Vec<ScreenshotMeta>, String> {
        let conn = rusqlite::Connection::open(&self.db_path)
            .map_err(|e| format!("DB open failed: {}", e))?;

        let mut stmt = conn
            .prepare(
                "SELECT id, timestamp, width, height, monitor_name, label, file_size_bytes
                 FROM screenshots
                 ORDER BY timestamp DESC
                 LIMIT ?1 OFFSET ?2",
            )
            .map_err(|e| format!("Query prepare failed: {}", e))?;

        let rows = stmt
            .query_map(rusqlite::params![limit as i64, offset as i64], |row| {
                let timestamp_str: String = row.get(1)?;
                Ok(ScreenshotMeta {
                    id: row.get(0)?,
                    timestamp: DateTime::parse_from_rfc3339(&timestamp_str)
                        .unwrap_or_default()
                        .with_timezone(&Utc),
                    width: row.get(2)?,
                    height: row.get(3)?,
                    monitor_name: row.get(4)?,
                    label: row.get(5)?,
                    file_size_bytes: row.get::<_, i64>(6)? as usize,
                })
            })
            .map_err(|e| format!("Query failed: {}", e))?;

        let mut screenshots = Vec::new();
        for row in rows {
            if let Ok(meta) = row {
                screenshots.push(meta);
            }
        }

        Ok(screenshots)
    }

    /// Get a decrypted screenshot by ID (returns raw PNG bytes)
    pub fn get_screenshot_data(&self, id: &str) -> Result<Vec<u8>, String> {
        let conn = rusqlite::Connection::open(&self.db_path)
            .map_err(|e| format!("DB open failed: {}", e))?;

        let encrypted_data: Vec<u8> = conn
            .query_row(
                "SELECT encrypted_data FROM screenshots WHERE id = ?1",
                rusqlite::params![id],
                |row| row.get(0),
            )
            .map_err(|e| format!("Screenshot not found: {}", e))?;

        let decrypted = EncryptionManager::decrypt_data(&encrypted_data)
            .map_err(|e| format!("Decryption failed: {}", e))?;

        Ok(decrypted)
    }

    /// Delete a screenshot by ID
    pub fn delete_screenshot(&self, id: &str) -> Result<bool, String> {
        let conn = rusqlite::Connection::open(&self.db_path)
            .map_err(|e| format!("DB open failed: {}", e))?;

        let rows_affected = conn
            .execute(
                "DELETE FROM screenshots WHERE id = ?1",
                rusqlite::params![id],
            )
            .map_err(|e| format!("Delete failed: {}", e))?;

        Ok(rows_affected > 0)
    }

    /// Delete all screenshots (privacy purge)
    pub fn delete_all(&self) -> Result<usize, String> {
        let conn = rusqlite::Connection::open(&self.db_path)
            .map_err(|e| format!("DB open failed: {}", e))?;

        let rows = conn
            .execute("DELETE FROM screenshots", [])
            .map_err(|e| format!("Purge failed: {}", e))?;

        log::info!("Purged {} screenshots", rows);
        Ok(rows)
    }

    /// Get screenshot count
    pub fn count(&self) -> Result<i64, String> {
        let conn = rusqlite::Connection::open(&self.db_path)
            .map_err(|e| format!("DB open failed: {}", e))?;

        conn.query_row("SELECT COUNT(*) FROM screenshots", [], |row| row.get(0))
            .map_err(|e| format!("Count failed: {}", e))
    }

    /// List available monitors
    pub fn list_monitors() -> Result<Vec<MonitorInfo>, String> {
        let monitors = Monitor::all().map_err(|e| format!("Failed to enumerate monitors: {}", e))?;

        Ok(monitors
            .iter()
            .enumerate()
            .map(|(i, m)| MonitorInfo {
                index: i,
                name: m.name().to_string(),
                width: m.width(),
                height: m.height(),
                is_primary: i == 0,
            })
            .collect())
    }
}

/// Info about an available monitor
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitorInfo {
    pub index: usize,
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub is_primary: bool,
}
