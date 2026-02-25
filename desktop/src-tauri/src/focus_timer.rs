//! focus_timer.rs — Pomodoro-style focus timer for MiniMe desktop.
//!
//! States: Idle → Working(remaining) → Break(remaining) → Idle
//! Integrates with the system tray to show remaining time.

use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};

/// Whether focus mode is currently active (any state other than Idle).
pub static FOCUS_ACTIVE: AtomicBool = AtomicBool::new(false);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum FocusState {
    Idle,
    Working,
    Break,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FocusStatus {
    pub state: FocusState,
    pub remaining_seconds: u64,
    pub work_duration: u64,
    pub break_duration: u64,
    pub sessions_completed: u32,
}

pub struct FocusTimer {
    state: FocusState,
    remaining_secs: u64,
    work_duration_secs: u64,
    break_duration_secs: u64,
    sessions_completed: u32,
    cancel_token: Option<tokio::sync::oneshot::Sender<()>>,
}

impl FocusTimer {
    pub fn new() -> Self {
        Self {
            state: FocusState::Idle,
            remaining_secs: 0,
            work_duration_secs: 25 * 60,   // 25 minutes
            break_duration_secs: 5 * 60,    // 5 minutes
            sessions_completed: 0,
            cancel_token: None,
        }
    }

    pub fn configure(&mut self, work_mins: u64, break_mins: u64) {
        self.work_duration_secs = work_mins * 60;
        self.break_duration_secs = break_mins * 60;
    }

    pub fn status(&self) -> FocusStatus {
        FocusStatus {
            state: self.state,
            remaining_seconds: self.remaining_secs,
            work_duration: self.work_duration_secs,
            break_duration: self.break_duration_secs,
            sessions_completed: self.sessions_completed,
        }
    }

    pub fn start_work(&mut self) {
        self.state = FocusState::Working;
        self.remaining_secs = self.work_duration_secs;
        FOCUS_ACTIVE.store(true, Ordering::Relaxed);
        log::info!(
            "Focus timer started: {} min work session",
            self.work_duration_secs / 60
        );
    }

    pub fn start_break(&mut self) {
        self.state = FocusState::Break;
        self.remaining_secs = self.break_duration_secs;
        self.sessions_completed += 1;
        log::info!(
            "Focus break: {} min (session #{} completed)",
            self.break_duration_secs / 60,
            self.sessions_completed
        );
    }

    pub fn stop(&mut self) {
        self.state = FocusState::Idle;
        self.remaining_secs = 0;
        FOCUS_ACTIVE.store(false, Ordering::Relaxed);
        if let Some(token) = self.cancel_token.take() {
            let _ = token.send(());
        }
        log::info!("Focus timer stopped");
    }

    pub fn is_active(&self) -> bool {
        self.state != FocusState::Idle
    }

    /// Tick the timer by 1 second. Returns true if state transitioned.
    pub fn tick(&mut self) -> bool {
        if self.state == FocusState::Idle {
            return false;
        }

        if self.remaining_secs > 0 {
            self.remaining_secs -= 1;
            return false;
        }

        // Timer expired — transition states
        match self.state {
            FocusState::Working => {
                self.start_break();
                true
            }
            FocusState::Break => {
                self.state = FocusState::Idle;
                self.remaining_secs = 0;
                FOCUS_ACTIVE.store(false, Ordering::Relaxed);
                log::info!("Focus session complete");
                true
            }
            FocusState::Idle => false,
        }
    }

    /// Format remaining time as "MM:SS".
    pub fn remaining_display(&self) -> String {
        let mins = self.remaining_secs / 60;
        let secs = self.remaining_secs % 60;
        format!("{:02}:{:02}", mins, secs)
    }
}
