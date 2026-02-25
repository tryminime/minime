//! Background polling task for continuous activity tracking.

use tokio::time::{interval, Duration};
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::tracker::{ActivityManager, ActivityEvent};
use crate::database::Database;
use crate::privacy::PrivacyFilter;

pub struct PollingTask {
    activity_manager: Arc<Mutex<ActivityManager>>,
    database: Arc<Mutex<Database>>,
    privacy_filter: Arc<Mutex<PrivacyFilter>>,
    is_running: Arc<Mutex<bool>>,
}

impl PollingTask {
    pub fn new(
        activity_manager: Arc<Mutex<ActivityManager>>,
        database: Arc<Mutex<Database>>,
        privacy_filter: Arc<Mutex<PrivacyFilter>>,
    ) -> Self {
        Self {
            activity_manager,
            database,
            privacy_filter,
            is_running: Arc::new(Mutex::new(false)),
        }
    }
    
    /// Start the background polling task with batching
    pub async fn start(&self) {
        let mut is_running = self.is_running.lock().await;
        if *is_running {
            log::warn!("Polling task already running");
            return;
        }
        *is_running = true;
        drop(is_running);
        
        let activity_manager = Arc::clone(&self.activity_manager);
        let database = Arc::clone(&self.database);
        let privacy_filter = Arc::clone(&self.privacy_filter);
        let is_running = Arc::clone(&self.is_running);
        
        tokio::spawn(async move {
            let mut poll_interval = interval(Duration::from_millis(500));
            let mut activity_buffer: Vec<ActivityEvent> = Vec::with_capacity(10);
            let mut last_flush = tokio::time::Instant::now();
            
            log::info!("Background polling task started with batching");
            
            loop {
                // Check if task should stop
                {
                    let running = is_running.lock().await;
                    if !*running {
                        // Flush remaining activities before stopping
                        if !activity_buffer.is_empty() {
                            let mut db = database.lock().await;
                            if let Err(e) = db.insert_activities_batch(&activity_buffer) {
                                log::error!("Failed to flush activities on stop: {}", e);
                            }
                        }
                        log::info!("Polling task stopping");
                        break;
                    }
                }
                
                poll_interval.tick().await;
                
                // Poll for activity changes
                let activity_opt = {
                    let mut manager = activity_manager.lock().await;
                    manager.poll()
                };
                
                if let Some(mut activity) = activity_opt {
                    // Apply privacy filter
                    let filter = privacy_filter.lock().await;
                    
                    // Check if app should be tracked
                    if let Some(ref app_name) = activity.app_name {
                        if !filter.should_track_app(app_name) {
                            continue; // Skip this activity
                        }
                    }
                    
                    // Redact sensitive titles
                    if let Some(ref title) = activity.window_title {
                        activity.window_title = Some(filter.redact_title(title));
                    }
                    
                    drop(filter);
                    
                    // Add to buffer
                    activity_buffer.push(activity);
                    
                    // Flush if buffer is full or timeout reached (5 seconds)
                    let should_flush = activity_buffer.len() >= 10 
                        || last_flush.elapsed() >= Duration::from_secs(5);
                    
                    if should_flush {
                        let mut db = database.lock().await;
                        if let Err(e) = db.insert_activities_batch(&activity_buffer) {
                            log::error!("Failed to batch insert activities: {}", e);
                        } else {
                            log::debug!("Flushed {} activities to database", activity_buffer.len());
                        }
                        drop(db);
                        
                        activity_buffer.clear();
                        last_flush = tokio::time::Instant::now();
                    }
                }
            }
            
            log::info!("Background polling task stopped");
        });
    }
    
    /// Stop the polling task
    pub async fn stop(&self) {
        let mut is_running = self.is_running.lock().await;
        *is_running = false;
    }
}
