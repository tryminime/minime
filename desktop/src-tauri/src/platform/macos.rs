//! macOS-specific activity tracking implementation.
//!
//! Uses the ObjC runtime directly via the `objc` crate.
//! NSWorkspace is looked up at runtime via class!() — no cocoa import needed.

use cocoa::base::{id, nil};
use objc::{class, msg_send, sel, sel_impl};
use crate::tracker::{ActivityTracker, WindowInfo};

const IDLE_THRESHOLD_SECS: f64 = 300.0; // 5 minutes

pub struct MacOSTracker;

impl MacOSTracker {
    pub fn new() -> Self {
        Self
    }

    fn get_frontmost_app(&self) -> Option<WindowInfo> {
        unsafe {
            // NSWorkspace.sharedWorkspace.frontmostApplication
            let workspace: id = msg_send![class!(NSWorkspace), sharedWorkspace];
            let app: id = msg_send![workspace, frontmostApplication];

            if app == nil {
                return None;
            }

            // App name
            let app_name_ns: id = msg_send![app, localizedName];
            let app_name = if app_name_ns != nil {
                let bytes: *const std::os::raw::c_char = msg_send![app_name_ns, UTF8String];
                let c_str = std::ffi::CStr::from_ptr(bytes);
                c_str.to_string_lossy().to_string()
            } else {
                "Unknown".to_string()
            };

            let process_id: i32 = msg_send![app, processIdentifier];
            let window_title = self.get_window_title(process_id).unwrap_or_default();

            Some(WindowInfo {
                app_name,
                window_title,
                process_id: process_id as u32,
            })
        }
    }

    fn get_window_title(&self, pid: i32) -> Option<String> {
        unsafe {
            // NSRunningApplication.runningApplicationWithProcessIdentifier
            let app: id = msg_send![
                class!(NSRunningApplication),
                runningApplicationWithProcessIdentifier: pid
            ];
            if app == nil {
                return None;
            }
            let name_ns: id = msg_send![app, localizedName];
            if name_ns != nil {
                let bytes: *const std::os::raw::c_char = msg_send![name_ns, UTF8String];
                let c_str = std::ffi::CStr::from_ptr(bytes);
                return Some(c_str.to_string_lossy().to_string());
            }
            None
        }
    }
}

impl ActivityTracker for MacOSTracker {
    fn start(&mut self) -> Result<(), String> {
        log::info!("Started macOS activity tracker");
        Ok(())
    }

    fn stop(&mut self) {
        log::info!("Stopped macOS activity tracker");
    }

    fn get_current_window(&self) -> Option<WindowInfo> {
        self.get_frontmost_app()
    }

    fn is_idle(&self) -> bool {
        unsafe {
            extern "C" {
                fn CGEventSourceSecondsSinceLastEventType(
                    source_state_id: i32,
                    event_type: u32,
                ) -> f64;
            }
            let idle_secs = CGEventSourceSecondsSinceLastEventType(0, u32::MAX);
            idle_secs >= IDLE_THRESHOLD_SECS
        }
    }
}
