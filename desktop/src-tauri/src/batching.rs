//! Activity batching to reduce database writes.

use tokio::time::{interval, Duration, Instant};
use crate::tracker::ActivityEvent;
use crate::database::Database;

const BATCH_SIZE: usize = 10;
const BATCH_TIMEOUT_SECS: u64 = 5;

pub struct ActivityBatcher {
    buffer: Vec<ActivityEvent>,
    last_flush: Instant,
}

impl ActivityBatcher {
    pub fn new() -> Self {
        Self {
            buffer: Vec::with_capacity(BATCH_SIZE),
            last_flush: Instant::now(),
        }
    }
    
    /// Add activity to buffer and flush if needed
    pub async fn add(&mut self, activity: ActivityEvent, database: &Database) -> Result<(), String> {
        self.buffer.push(activity);
        
        // Flush if buffer is full or timeout reached
        let should_flush = self.buffer.len() >= BATCH_SIZE 
            || self.last_flush.elapsed() >= Duration::from_secs(BATCH_TIMEOUT_SECS);
        
        if should_flush {
            self.flush(database).await?;
        }
        
        Ok(())
    }
    
    /// Force flush all buffered activities
    pub async fn flush(&mut self, database: &Database) -> Result<(), String> {
        if self.buffer.is_empty() {
            return Ok(());
        }
        
        log::debug!("Flushing {} activities to database", self.buffer.len());
        
        // Batch insert
        database.insert_activities_batch(&self.buffer)
            .map_err(|e| format!("Batch insert failed: {}", e))?;
        
        self.buffer.clear();
        self.last_flush = Instant::now();
        
        Ok(())
    }
    
    /// Get current buffer size
    pub fn len(&self) -> usize {
        self.buffer.len()
    }
}
