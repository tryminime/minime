//! Platform-specific module loader.

#[cfg(target_os = "windows")]
pub mod windows;

#[cfg(target_os = "macos")]
pub mod macos;

#[cfg(target_os = "linux")]
pub mod linux;

#[cfg(target_os = "linux")]
pub mod wayland;

use crate::tracker::ActivityTracker;

/// Create platform-specific activity tracker.
/// On Linux, detects whether the session is Wayland or X11 at runtime.
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
        let is_wayland = std::env::var("WAYLAND_DISPLAY").is_ok()
            || std::env::var("XDG_SESSION_TYPE")
                .map(|v| v.to_lowercase() == "wayland")
                .unwrap_or(false);

        if is_wayland {
            log::info!("Wayland session detected — using WaylandTracker");
            Box::new(wayland::WaylandTracker::new())
        } else {
            log::info!("X11 session detected — using LinuxTracker");
            Box::new(linux::LinuxTracker::new())
        }
    }
}
