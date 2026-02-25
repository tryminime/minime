//! Linux-specific activity tracking implementation using X11.

#[cfg(target_os = "linux")]
use x11::xlib::*;
#[cfg(target_os = "linux")]
use x11::xss::*;
use crate::tracker::{ActivityTracker, WindowInfo};
use std::ffi::CStr;
use std::ptr;
use std::sync::Arc;
use std::sync::Mutex as StdMutex;

const IDLE_THRESHOLD_MS: u64 = 300_000; // 5 minutes

// Wrapper to make X11 Display thread-safe
struct ThreadSafeDisplay(Arc<StdMutex<Option<*mut Display>>>);

unsafe impl Send for ThreadSafeDisplay {}
unsafe impl Sync for ThreadSafeDisplay {}

pub struct LinuxTracker {
    display: ThreadSafeDisplay,
}

impl LinuxTracker {
    pub fn new() -> Self {
        Self {
            display: ThreadSafeDisplay(Arc::new(StdMutex::new(None))),
        }
    }
    
    fn get_active_window(&self) -> Option<Window> {
        unsafe {
            let display_guard = self.display.0.lock().unwrap();
            if let Some(display) = *display_guard {
                let root = XDefaultRootWindow(display);
                let mut actual_type: Atom = 0;
                let mut actual_format: i32 = 0;
                let mut nitems: u64 = 0;
                let mut bytes_after: u64 = 0;
                let mut prop: *mut u8 = ptr::null_mut();
                
                let atom = XInternAtom(display, b"_NET_ACTIVE_WINDOW\0".as_ptr() as *const i8, 0);
                
                if XGetWindowProperty(
                    display,
                    root,
                    atom,
                    0,
                    1,
                    0,
                    0,
                    &mut actual_type,
                    &mut actual_format,
                    &mut nitems,
                    &mut bytes_after,
                    &mut prop,
                ) == 0 && !prop.is_null() {
                    let window = *(prop as *const Window);
                    XFree(prop as *mut _);
                    return Some(window);
                }
            }
            None
        }
    }
}

impl ActivityTracker for LinuxTracker {
    fn start(&mut self) -> Result<(), String> {
        unsafe {
            let display = XOpenDisplay(ptr::null());
            if display.is_null() {
                return Err("Failed to open X11 display".to_string());
            }
            let mut display_guard = self.display.0.lock().unwrap();
            *display_guard = Some(display);
            log::info!("Started Linux activity tracker");
            Ok(())
        }
    }
    
    fn stop(&mut self) {
        unsafe {
            let mut display_guard = self.display.0.lock().unwrap();
            if let Some(display) = *display_guard {
                XCloseDisplay(display);
                *display_guard = None;
            }
        }
        log::info!("Stopped Linux activity tracker");
    }
    
    fn get_current_window(&self) -> Option<WindowInfo> {
        unsafe {
            let window = self.get_active_window()?;
            let display_guard = self.display.0.lock().unwrap();
            let display = (*display_guard)?;
            
            // Get window title
            let mut name: *mut i8 = ptr::null_mut();
            if XFetchName(display, window, &mut name) != 0 && !name.is_null() {
                let title = CStr::from_ptr(name).to_string_lossy().to_string();
                XFree(name as *mut _);
                
                // Get window class (app name)
                let mut class_hint: XClassHint = std::mem::zeroed();
                if XGetClassHint(display, window, &mut class_hint) != 0 {
                    let app_name = if !class_hint.res_class.is_null() {
                        CStr::from_ptr(class_hint.res_class).to_string_lossy().to_string()
                    } else if !class_hint.res_name.is_null() {
                        CStr::from_ptr(class_hint.res_name).to_string_lossy().to_string()
                    } else {
                        "Unknown".to_string()
                    };
                    
                    if !class_hint.res_name.is_null() {
                        XFree(class_hint.res_name as *mut _);
                    }
                    if !class_hint.res_class.is_null() {
                        XFree(class_hint.res_class as *mut _);
                    }
                    
                    return Some(WindowInfo {
                        app_name,
                        window_title: title,
                        process_id: 0,
                    });
                }
            }
            None
        }
    }
    
    fn is_idle(&self) -> bool {
        unsafe {
            let display_guard = self.display.0.lock().unwrap();
            if let Some(display) = *display_guard {
                let mut event_base: i32 = 0;
                let mut error_base: i32 = 0;
                if XScreenSaverQueryExtension(display, &mut event_base, &mut error_base) == 0 {
                    return false;
                }

                let info = XScreenSaverAllocInfo();
                if info.is_null() {
                    return false;
                }

                let root = XDefaultRootWindow(display);
                if XScreenSaverQueryInfo(display, root, info) != 0 {
                    let idle_ms = (*info).idle;
                    XFree(info as *mut _);
                    return idle_ms as u64 >= IDLE_THRESHOLD_MS;
                }
                XFree(info as *mut _);
            }
            false
        }
    }
}

impl Drop for LinuxTracker {
    fn drop(&mut self) {
        self.stop();
    }
}

