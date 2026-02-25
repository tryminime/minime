//! Local SQLite database for activity storage.

use rusqlite::{Connection, params, Result as SqlResult, OptionalExtension};
use crate::tracker::ActivityEvent;
use std::path::PathBuf;
use chrono::Utc;

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(db_path: PathBuf) -> SqlResult<Self> {
        let conn = Connection::open(db_path)?;
        
        // Create tables
        conn.execute(
            "CREATE TABLE IF NOT EXISTS activities (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                activity_type TEXT NOT NULL,
                app_name TEXT,
                window_title TEXT,
                domain TEXT,
                duration_seconds INTEGER,
                is_idle BOOLEAN NOT NULL,
                device_id TEXT NOT NULL,
                synced BOOLEAN DEFAULT 0,
                created_at TEXT NOT NULL
            )",
            [],
        )?;
        
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp)",
            [],
        )?;
        
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_activities_synced ON activities(synced)",
            [],
        )?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )?;
        
        Ok(Self { conn })
    }
    
    pub fn insert_activity(&self, activity: &ActivityEvent) -> SqlResult<()> {
        self.conn.execute(
            "INSERT INTO activities (
                id, timestamp, activity_type, app_name, window_title, 
                domain, duration_seconds, is_idle, device_id, synced, created_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 0, ?10)",
            params![
                activity.id,
                activity.timestamp.to_rfc3339(),
                format!("{:?}", activity.activity_type),
                activity.app_name,
                activity.window_title,
                activity.domain,
                activity.duration_seconds,
                activity.is_idle,
                activity.device_id,
                Utc::now().to_rfc3339(),
            ],
        )?;
        Ok(())
    }
    
    /// Batch insert multiple activities (optimized for performance)
    pub fn insert_activities_batch(&mut self, activities: &[ActivityEvent]) -> SqlResult<()> {
        if activities.is_empty() {
            return Ok(());
        }
        
        let tx = self.conn.transaction()?;
        
        {
            let mut stmt = tx.prepare(
                "INSERT INTO activities (
                    id, timestamp, activity_type, app_name, window_title, 
                    domain, duration_seconds, is_idle, device_id, synced, created_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 0, ?10)"
            )?;
            
            let now = Utc::now().to_rfc3339();
            
            for activity in activities {
                stmt.execute(params![
                    activity.id,
                    activity.timestamp.to_rfc3339(),
                    format!("{:?}", activity.activity_type),
                    activity.app_name,
                    activity.window_title,
                    activity.domain,
                    activity.duration_seconds,
                    activity.is_idle,
                    activity.device_id,
                    &now,
                ])?;
            }
        }
        
        tx.commit()?;
        log::debug!("Batch inserted {} activities", activities.len());
        Ok(())
    }
    
    pub fn get_unsynced_activities(&self, limit: usize) -> SqlResult<Vec<ActivityEvent>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, timestamp, activity_type, app_name, window_title, 
                    domain, duration_seconds, is_idle, device_id
             FROM activities 
             WHERE synced = 0 
             ORDER BY timestamp ASC 
             LIMIT ?1"
        )?;
        
        let activities = stmt.query_map([limit], |row| {
            use crate::tracker::ActivityType;
            use chrono::DateTime;
            
            let activity_type_str: String = row.get(2)?;
            let activity_type = match activity_type_str.as_str() {
                "WindowFocus" => ActivityType::WindowFocus,
                "AppSwitch" => ActivityType::AppSwitch,
                "Idle" => ActivityType::Idle,
                "Break" => ActivityType::Break,
                "FocusPeriod" => ActivityType::FocusPeriod,
                _ => ActivityType::WindowFocus,
            };
            
            Ok(ActivityEvent {
                id: row.get(0)?,
                timestamp: DateTime::parse_from_rfc3339(&row.get::<_, String>(1)?)
                    .unwrap()
                    .with_timezone(&Utc),
                activity_type,
                app_name: row.get(3)?,
                window_title: row.get(4)?,
                domain: row.get(5)?,
                duration_seconds: row.get(6)?,
                is_idle: row.get(7)?,
                device_id: row.get(8)?,
            })
        })?;
        
        activities.collect()
    }
    
    pub fn mark_activities_synced(&mut self, activity_ids: &[String]) -> SqlResult<()> {
        let tx = self.conn.transaction()?;
        
        for id in activity_ids {
            tx.execute(
                "UPDATE activities SET synced = 1 WHERE id = ?1",
                params![id],
            )?;
        }
        
        tx.commit()?;
        Ok(())
    }
    
    pub fn get_unsynced_count(&self) -> SqlResult<i64> {
        self.conn.query_row(
            "SELECT COUNT(*) FROM activities WHERE synced = 0",
            [],
            |row| row.get(0),
        )
    }
    
    pub fn cleanup_old_activities(&self, days: i64) -> SqlResult<usize> {
        let cutoff = Utc::now() - chrono::Duration::days(days);
        
        self.conn.execute(
            "DELETE FROM activities WHERE timestamp < ?1 AND synced = 1",
            params![cutoff.to_rfc3339()],
        )
    }
    
    pub fn set_setting(&self, key: &str, value: &str) -> SqlResult<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?1, ?2, ?3)",
            params![key, value, Utc::now().to_rfc3339()],
        )?;
        Ok(())
    }
    
    pub fn get_setting(&self, key: &str) -> SqlResult<Option<String>> {
        self.conn.query_row(
            "SELECT value FROM settings WHERE key = ?1",
            params![key],
            |row| row.get(0),
        ).optional()
    }

    /// Get total tracked hours for today (non-idle activities).
    pub fn get_today_tracked_hours(&self) -> SqlResult<f64> {
        let today_start = chrono::Local::now()
            .date_naive()
            .and_hms_opt(0, 0, 0)
            .unwrap()
            .and_local_timezone(chrono::Local)
            .unwrap()
            .with_timezone(&Utc)
            .to_rfc3339();

        let total_secs: i64 = self.conn.query_row(
            "SELECT COALESCE(SUM(duration_seconds), 0) FROM activities
             WHERE timestamp >= ?1 AND is_idle = 0 AND duration_seconds IS NOT NULL",
            params![today_start],
            |row| row.get(0),
        )?;

        Ok(total_secs as f64 / 3600.0)
    }

    /// Get count of today's activity events.
    pub fn get_today_activity_count(&self) -> SqlResult<i64> {
        let today_start = chrono::Local::now()
            .date_naive()
            .and_hms_opt(0, 0, 0)
            .unwrap()
            .and_local_timezone(chrono::Local)
            .unwrap()
            .with_timezone(&Utc)
            .to_rfc3339();

        self.conn.query_row(
            "SELECT COUNT(*) FROM activities WHERE timestamp >= ?1",
            params![today_start],
            |row| row.get(0),
        )
    }
}
