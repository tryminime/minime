//! Platform-specific module loader.

#[cfg(target_os = "windows")]
pub mod windows;

#[cfg(target_os = "macos")]
pub mod macos;

#[cfg(target_os = "linux")]
pub mod linux;

use crate::tracker::ActivityTracker;

/// Create platform-specific activity tracker
pub fn create_tracker() -> Box<dyn ActivityTracker> {
    #[cfg(target_os = "windows")]
    {
        Box::new(windows::WindowsTracker::new())
    }
    
    #[cfg(target_os = "macos")]
    {
        Box::new(macos::MacOSTracker::new())
    }
    
    #[cfg(target_os = "linux")]
    {
        Box::new(linux::LinuxTracker::new())
    }
}
