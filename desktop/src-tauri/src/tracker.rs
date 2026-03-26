//! Activity tracking engine - Platform-agnostic interface.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InputMetricsSnapshot {
    pub keystrokes_per_minute: f64,
    pub mouse_distance_px: f64,
    pub mouse_click_count: u32,
    pub activity_level: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityEvent {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub activity_type: ActivityType,
    pub app_name: Option<String>,
    pub window_title: Option<String>,
    pub domain: Option<String>,
    pub duration_seconds: Option<i64>,
    pub is_idle: bool,
    pub device_id: String,
    /// Aggregate input metrics snapshot at the time of this event
    #[serde(skip_serializing_if = "Option::is_none")]
    pub input_metrics: Option<InputMetricsSnapshot>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ActivityType {
    WindowFocus,
    AppSwitch,
    Idle,
    Break,
    FocusPeriod,
    ReadingAnalytics,
}

/// Platform-agnostic activity tracker interface
pub trait ActivityTracker: Send + Sync {
    /// Start tracking activity
    fn start(&mut self) -> Result<(), String>;
    
    /// Stop tracking
    fn stop(&mut self);
    
    /// Get current active window information
    fn get_current_window(&self) -> Option<WindowInfo>;
    
    /// Check if user is idle
    fn is_idle(&self) -> bool;
}

#[derive(Debug, Clone)]
pub struct WindowInfo {
    pub app_name: String,
    pub window_title: String,
    pub process_id: u32,
}

impl ActivityEvent {
    pub fn new(activity_type: ActivityType, device_id: String) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            timestamp: Utc::now(),
            activity_type,
            app_name: None,
            window_title: None,
            domain: None,
            duration_seconds: None,
            is_idle: false,
            device_id,
            input_metrics: None,
        }
    }
    
    pub fn with_window_info(mut self, window: WindowInfo) -> Self {
        self.app_name = Some(window.app_name);
        self.window_title = Some(window.window_title);
        self
    }
}

/// Main activity tracking manager
pub struct ActivityManager {
    tracker: Box<dyn ActivityTracker>,
    current_activity: Option<ActivityEvent>,
    device_id: String,
    idle_threshold: Duration,
}

impl ActivityManager {
    pub fn new(tracker: Box<dyn ActivityTracker>, device_id: String) -> Self {
        Self {
            tracker,
            current_activity: None,
            device_id,
            idle_threshold: Duration::from_secs(300), // 5 minutes
        }
    }
    
    pub fn start(&mut self) -> Result<(), String> {
        self.tracker.start()
    }
    
    pub fn stop(&mut self) {
        self.tracker.stop();
    }
    
    /// Poll for activity changes - call this every 500ms
    pub fn poll(&mut self) -> Option<ActivityEvent> {
        // Check if user is idle
        if self.tracker.is_idle() {
            if self.current_activity.is_none() {
                let activity = ActivityEvent {
                    id: uuid::Uuid::new_v4().to_string(),
                    timestamp: Utc::now(),
                    activity_type: ActivityType::Idle,
                    app_name: None,
                    window_title: None,
                    domain: None,
                    duration_seconds: None,
                    is_idle: true,
                    device_id: self.device_id.clone(),
                    input_metrics: None,
                };
                self.current_activity = Some(activity.clone());
                return Some(activity);
            }
            return None;
        }
        
        // Get current window
        if let Some(window) = self.tracker.get_current_window() {
            // Check if window changed
            let should_create_new = match &self.current_activity {
                None => true,
                Some(current) => {
                    current.app_name.as_ref() != Some(&window.app_name) ||
                    current.window_title.as_ref() != Some(&window.window_title)
                }
            };
            
            if should_create_new {
                let activity = ActivityEvent::new(
                    ActivityType::WindowFocus,
                    self.device_id.clone()
                ).with_window_info(window);
                
                self.current_activity = Some(activity.clone());
                return Some(activity);
            }
        }
        
        None
    }
}
