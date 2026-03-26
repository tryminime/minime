//! Background polling task for continuous activity tracking.

use tokio::time::{interval, Duration};
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::tracker::{ActivityManager, ActivityEvent, ActivityType, InputMetricsSnapshot};
use crate::database::Database;
use crate::privacy::PrivacyFilter;
use crate::input::{InputMonitor, LinuxInputMonitor, BreakDetector};

/// Known document / reading applications (lowercase match).
const READING_APPS: &[&str] = &[
    // PDF viewers
    "evince", "okular", "zathura", "mupdf", "xpdf", "foxit", "foxitreader",
    "acroread", "qpdfview", "atril", "xreader",
    // Office / document editors (reading mode)
    "libreoffice", "soffice", "abiword", "wps", "onlyoffice",
    "google-chrome-stable", "chromium", // catch Google Docs via title
    // Text / markdown / ebook readers
    "gedit", "kate", "mousepad", "pluma", "xed", "leafpad",
    "calibre", "foliate", "fbreader", "bookworm", "coolreader",
    // Terminal-based readers (show up in title)
    "vim", "nvim", "nano", "less", "bat", "mdless",
];

/// File extensions that indicate document reading.
const DOC_EXTENSIONS: &[&str] = &[
    ".pdf", ".doc", ".docx", ".odt", ".rtf", ".epub", ".mobi",
    ".txt", ".md", ".tex", ".rst", ".org", ".csv", ".xlsx", ".xls",
    ".pptx", ".ppt", ".pages", ".numbers", ".key",
];

/// Returns true if the app + title combination looks like document reading.
fn is_reading_activity(app_name: &str, window_title: &str) -> bool {
    let app_lower = app_name.to_lowercase();
    let title_lower = window_title.to_lowercase();

    // Check if the app is a known reading app
    let app_match = READING_APPS.iter().any(|&ra| app_lower.contains(ra));

    // Check if the window title contains a document file extension
    let title_has_doc = DOC_EXTENSIONS.iter().any(|&ext| title_lower.contains(ext));

    // Google Docs / Sheets / Slides in browser
    let is_gdocs = title_lower.contains("google docs")
        || title_lower.contains("google sheets")
        || title_lower.contains("google slides");

    // Must be a reading app with a doc title, or Google Docs
    (app_match && title_has_doc) || is_gdocs
}

pub struct PollingTask {
    activity_manager: Arc<Mutex<ActivityManager>>,
    database: Arc<Mutex<Database>>,
    privacy_filter: Arc<Mutex<PrivacyFilter>>,
    is_running: Arc<Mutex<bool>>,
    input_monitor: Arc<Mutex<LinuxInputMonitor>>,
    break_detector: Arc<Mutex<BreakDetector>>,
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
            input_monitor: Arc::new(Mutex::new(LinuxInputMonitor::new())),
            break_detector: Arc::new(Mutex::new(BreakDetector::new())),
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

        // Start input monitor
        {
            let mut monitor = self.input_monitor.lock().await;
            if let Err(e) = monitor.start() {
                log::warn!("Failed to start input monitor: {}", e);
            }
        }
        
        let activity_manager = Arc::clone(&self.activity_manager);
        let database = Arc::clone(&self.database);
        let privacy_filter = Arc::clone(&self.privacy_filter);
        let is_running = Arc::clone(&self.is_running);
        let input_monitor = Arc::clone(&self.input_monitor);
        let break_detector = Arc::clone(&self.break_detector);
        
        tokio::spawn(async move {
            let mut poll_interval = interval(Duration::from_millis(500));
            let mut activity_buffer: Vec<ActivityEvent> = Vec::with_capacity(10);
            let mut last_flush = tokio::time::Instant::now();
            
            log::info!("Background polling task started with batching + input monitoring + break detection");
            
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
                        // Stop input monitor
                        if let Ok(mut monitor) = input_monitor.try_lock() {
                            monitor.stop();
                        }
                        log::info!("Polling task stopping");
                        break;
                    }
                }
                
                poll_interval.tick().await;
                
                // Get current input metrics snapshot
                let metrics_snapshot = {
                    if let Ok(monitor) = input_monitor.try_lock() {
                        let m = monitor.get_metrics();
                        Some(InputMetricsSnapshot {
                            keystrokes_per_minute: m.get_kpm(),
                            mouse_distance_px: m.mouse_movement_distance,
                            mouse_click_count: m.mouse_click_count,
                            activity_level: m.get_activity_level(),
                        })
                    } else {
                        None
                    }
                };

                // Poll for activity changes
                let activity_opt = {
                    let mut manager = activity_manager.lock().await;
                    manager.poll()
                };

                // Run break detector
                if let Some(ref activity) = activity_opt {
                    if let Ok(mut bd) = break_detector.try_lock() {
                        if let Some(break_duration) = bd.update(activity.is_idle) {
                            // User returned from break — emit Break event
                            let break_event = ActivityEvent {
                                id: uuid::Uuid::new_v4().to_string(),
                                timestamp: chrono::Utc::now(),
                                activity_type: ActivityType::Break,
                                app_name: None,
                                window_title: None,
                                domain: None,
                                duration_seconds: Some(break_duration as i64),
                                is_idle: false,
                                device_id: activity.device_id.clone(),
                                input_metrics: None,
                            };
                            activity_buffer.push(break_event);
                        }
                    }
                }
                
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

                    // Detect document reading: upgrade to ReadingAnalytics type
                    if !activity.is_idle {
                        let app = activity.app_name.as_deref().unwrap_or("");
                        let title = activity.window_title.as_deref().unwrap_or("");
                        if is_reading_activity(app, title) {
                            activity.activity_type = ActivityType::ReadingAnalytics;
                            log::debug!("📖 Reading detected: {} — {}", app, title);
                        }
                    }

                    // Attach input metrics to non-idle activities
                    if !activity.is_idle {
                        activity.input_metrics = metrics_snapshot;
                    }
                    
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

