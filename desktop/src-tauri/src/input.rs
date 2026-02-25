//! Input monitoring for keystroke and mouse activity patterns.
//! Note: Only aggregate metrics, no keylogging!

use std::time::{Duration, Instant};

#[derive(Debug, Clone)]
pub struct InputMetrics {
    pub keystroke_count: u32,
    pub mouse_movement_distance: f64,
    pub mouse_click_count: u32,
    pub window_start: Instant,
}

impl InputMetrics {
    pub fn new() -> Self {
        Self {
            keystroke_count: 0,
            mouse_movement_distance: 0.0,
            mouse_click_count: 0,
            window_start: Instant::now(),
        }
    }
    
    /// Get keystrokes per minute
    pub fn get_kpm(&self) -> f64 {
        let elapsed = self.window_start.elapsed().as_secs_f64() / 60.0;
        if elapsed > 0.0 {
            self.keystroke_count as f64 / elapsed
        } else {
            0.0
        }
    }
    
    /// Get activity level (0-100 scale)
    pub fn get_activity_level(&self) -> u8 {
        let kpm = self.get_kpm();
        let click_rate = self.mouse_click_count as f64 / (self.window_start.elapsed().as_secs_f64() / 60.0);
        
        // Simple heuristic: high KPM + clicks = high activity
        let score = (kpm / 2.0).min(50.0) + (click_rate * 5.0).min(50.0);
        score.min(100.0) as u8
    }
    
    /// Reset metrics (call this when starting new window)
    pub fn reset(&mut self) {
        self.keystroke_count = 0;
        self.mouse_movement_distance = 0.0;
        self.mouse_click_count = 0;
        self.window_start = Instant::now();
    }
}

/// Platform-agnostic input monitor  
pub trait InputMonitor: Send + Sync {
    fn get_metrics(&self) -> InputMetrics;
    fn start(&mut self) -> Result<(), String>;
    fn stop(&mut self);
}

// Stub implementation for now
pub struct StubInputMonitor {
    metrics: InputMetrics,
}

impl StubInputMonitor {
    pub fn new() -> Self {
        Self {
            metrics: InputMetrics::new(),
        }
    }
}

impl InputMonitor for StubInputMonitor {
    fn get_metrics(&self) -> InputMetrics {
        self.metrics.clone()
    }
    
    fn start(&mut self) -> Result<(), String> {
        log::info!("Input monitor started (stub)");
        // TODO: Implement platform-specific input hooks
        // This is complex and requires:
        // - Windows: SetWindowsHookEx with WH_KEYBOARD_LL, WH_MOUSE_LL
        // - Linux: X11 event monitoring or /dev/input/event*
        // - macOS: CGEventTap
        Ok(())
    }
    
    fn stop(&mut self) {
        log::info!("Input monitor stopped (stub)");
    }
}

/// Focus period detector — tracks sustained focus sessions with full history.
///
/// A "focus period" is an uninterrupted stretch on a single application.
/// Sessions are classified by depth:
/// - **Deep Work** (≥25 min) — Pomodoro-level sustained focus
/// - **Focused** (≥15 min) — Meaningful concentrated work
/// - **Moderate** (≥5 min) — Engaged but not deep
/// - **Shallow** (<5 min) — Quick task or context switch
pub struct FocusDetector {
    /// When the current focus session started
    session_start: Instant,
    /// When the last window change happened
    last_window_change: Instant,
    /// Duration of the most recently completed focus session
    last_session_duration: Duration,
    /// App/window title of the current focus session
    current_app: String,
    /// Completed focus sessions (kept for rolling analytics)
    session_history: Vec<FocusSession>,
    /// Configurable: minimum seconds to count as a real focus period
    min_focus_seconds: u64,
    /// Maximum sessions to retain in memory
    max_history: usize,
}

/// A completed focus session
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FocusSession {
    /// Application or window that was focused
    pub app_name: String,
    /// When the session started (epoch millis for serialization)
    pub started_at_epoch_ms: u64,
    /// Duration of the focus session in seconds
    pub duration_seconds: u64,
    /// Classification of the session depth
    pub depth: FocusDepth,
    /// Focus quality score (0-100)
    pub score: u8,
}

/// Depth classification for a focus session
#[derive(Debug, Clone, Copy, PartialEq, serde::Serialize, serde::Deserialize)]
pub enum FocusDepth {
    /// ≥25 minutes on single app — true deep work
    DeepWork,
    /// ≥15 minutes — meaningful focused work
    Focused,
    /// ≥5 minutes — moderate engagement
    Moderate,
    /// <5 minutes — shallow or context switch
    Shallow,
}

impl std::fmt::Display for FocusDepth {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FocusDepth::DeepWork => write!(f, "DeepWork"),
            FocusDepth::Focused => write!(f, "Focused"),
            FocusDepth::Moderate => write!(f, "Moderate"),
            FocusDepth::Shallow => write!(f, "Shallow"),
        }
    }
}

/// Summary of focus analytics over recent sessions
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FocusAnalytics {
    /// Current real-time focus score (0-100)
    pub current_score: u8,
    /// Whether currently in a deep work session
    pub is_deep_work: bool,
    /// Current session duration in seconds
    pub current_session_seconds: u64,
    /// Current app being focused on
    pub current_app: String,
    /// Total deep work seconds across recent sessions
    pub total_deep_work_seconds: u64,
    /// Total focused seconds (deep + focused tier)
    pub total_focused_seconds: u64,
    /// Number of focus sessions completed
    pub session_count: usize,
    /// Number of deep work sessions
    pub deep_work_count: usize,
    /// Average session duration in seconds
    pub avg_session_seconds: u64,
    /// Longest session duration in seconds
    pub longest_session_seconds: u64,
    /// Current streak: consecutive focus sessions ≥5 min
    pub focus_streak: usize,
}

impl FocusDetector {
    pub fn new() -> Self {
        Self {
            session_start: Instant::now(),
            last_window_change: Instant::now(),
            last_session_duration: Duration::from_secs(0),
            current_app: String::new(),
            session_history: Vec::new(),
            min_focus_seconds: 30, // Minimum 30s to count as a session
            max_history: 500,      // Keep last 500 sessions
        }
    }

    /// Call when the focused window/app changes.
    /// Closes the current session and opens a new one.
    /// Returns the completed session if it was above the minimum threshold.
    pub fn on_window_change(&mut self, new_app: &str) -> Option<FocusSession> {
        let elapsed = self.last_window_change.elapsed();
        self.last_session_duration = elapsed;

        let completed_session = if elapsed.as_secs() >= self.min_focus_seconds {
            let duration_secs = elapsed.as_secs();
            let depth = Self::classify_depth(duration_secs);
            let score = Self::compute_score(duration_secs);

            let session = FocusSession {
                app_name: self.current_app.clone(),
                started_at_epoch_ms: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_millis() as u64
                    - (duration_secs * 1000),
                duration_seconds: duration_secs,
                depth,
                score,
            };

            // Add to history (bounded)
            self.session_history.push(session.clone());
            if self.session_history.len() > self.max_history {
                self.session_history.remove(0);
            }

            log::info!(
                "Focus session completed: '{}' — {}s ({})",
                self.current_app,
                duration_secs,
                depth
            );

            Some(session)
        } else {
            None
        };

        // Start new session
        self.last_window_change = Instant::now();
        self.session_start = Instant::now();
        self.current_app = new_app.to_string();

        completed_session
    }

    /// Classify focus depth based on duration
    fn classify_depth(seconds: u64) -> FocusDepth {
        let minutes = seconds / 60;
        if minutes >= 25 {
            FocusDepth::DeepWork
        } else if minutes >= 15 {
            FocusDepth::Focused
        } else if minutes >= 5 {
            FocusDepth::Moderate
        } else {
            FocusDepth::Shallow
        }
    }

    /// Compute focus quality score (0-100)
    fn compute_score(seconds: u64) -> u8 {
        let minutes = seconds / 60;
        if minutes >= 50 {
            100
        } else if minutes >= 25 {
            85 + ((minutes - 25) as u8).min(15) // 85-100
        } else if minutes >= 15 {
            70 + ((minutes - 15) as u8) // 70-80+
        } else if minutes >= 5 {
            40 + ((minutes - 5) as u8 * 3) // 40-70
        } else {
            (minutes as u8 * 8).min(39) // 0-39
        }
    }

    /// Determine if the current session is deep work (≥15 min on same app)
    pub fn is_currently_deep_work(&self) -> bool {
        self.last_window_change.elapsed() >= Duration::from_secs(15 * 60)
    }

    /// Determine if last completed period was deep work
    pub fn was_deep_work(&self) -> bool {
        self.last_session_duration >= Duration::from_secs(15 * 60)
    }

    /// Get real-time focus quality score for the current session (0-100)
    pub fn get_focus_score(&self) -> u8 {
        Self::compute_score(self.last_window_change.elapsed().as_secs())
    }

    /// Get the current session duration in seconds
    pub fn current_session_seconds(&self) -> u64 {
        self.last_window_change.elapsed().as_secs()
    }

    /// Get full focus analytics over recent sessions
    pub fn get_analytics(&self) -> FocusAnalytics {
        let total_deep = self
            .session_history
            .iter()
            .filter(|s| s.depth == FocusDepth::DeepWork)
            .map(|s| s.duration_seconds)
            .sum();

        let total_focused: u64 = self
            .session_history
            .iter()
            .filter(|s| matches!(s.depth, FocusDepth::DeepWork | FocusDepth::Focused))
            .map(|s| s.duration_seconds)
            .sum();

        let deep_count = self
            .session_history
            .iter()
            .filter(|s| s.depth == FocusDepth::DeepWork)
            .count();

        let avg_duration = if self.session_history.is_empty() {
            0
        } else {
            self.session_history.iter().map(|s| s.duration_seconds).sum::<u64>()
                / self.session_history.len() as u64
        };

        let longest = self
            .session_history
            .iter()
            .map(|s| s.duration_seconds)
            .max()
            .unwrap_or(0);

        // Streak: count consecutive sessions from the end that are ≥ Moderate
        let streak = self
            .session_history
            .iter()
            .rev()
            .take_while(|s| matches!(s.depth, FocusDepth::DeepWork | FocusDepth::Focused | FocusDepth::Moderate))
            .count();

        FocusAnalytics {
            current_score: self.get_focus_score(),
            is_deep_work: self.is_currently_deep_work(),
            current_session_seconds: self.current_session_seconds(),
            current_app: self.current_app.clone(),
            total_deep_work_seconds: total_deep,
            total_focused_seconds: total_focused,
            session_count: self.session_history.len(),
            deep_work_count: deep_count,
            avg_session_seconds: avg_duration,
            longest_session_seconds: longest,
            focus_streak: streak,
        }
    }

    /// Get recent session history
    pub fn get_sessions(&self, limit: usize) -> Vec<FocusSession> {
        self.session_history
            .iter()
            .rev()
            .take(limit)
            .cloned()
            .collect()
    }

    /// Update minimum focus threshold (in seconds)
    pub fn set_min_focus_seconds(&mut self, seconds: u64) {
        self.min_focus_seconds = seconds;
    }

    /// Test helper: expose score computation for unit tests
    #[cfg(test)]
    pub fn compute_score_for_test(seconds: u64) -> u8 {
        Self::compute_score(seconds)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_input_metrics() {
        let mut metrics = InputMetrics::new();
        metrics.keystroke_count = 120;
        
        // Simulate 1 minute elapsed
        std::thread::sleep(Duration::from_millis(100));
        
        let level = metrics.get_activity_level();
        assert!(level > 0);
    }
    
    #[test]
    fn test_focus_detector() {
        let detector = FocusDetector::new();
        assert!(!detector.was_deep_work());
    }
}
