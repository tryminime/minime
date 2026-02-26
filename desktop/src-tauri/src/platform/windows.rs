//! Windows-specific activity tracking implementation.

#[cfg(target_os = "windows")]
use windows::{
    core::*,
    Win32::Foundation::*,
    Win32::UI::WindowsAndMessaging::*,
    Win32::System::Threading::*,
    Win32::System::ProcessStatus::*,
};

use crate::tracker::{ActivityTracker, WindowInfo};
use std::ffi::OsString;
use std::os::windows::ffi::OsStringExt;

const IDLE_THRESHOLD_MS: u32 = 300_000; // 5 minutes

pub struct WindowsTracker {
    last_input_time: u64,
}

impl WindowsTracker {
    pub fn new() -> Self {
        Self {
            last_input_time: 0,
        }
    }
    
    fn get_window_text(hwnd: HWND) -> String {
        unsafe {
            let length = GetWindowTextLengthW(hwnd);
            if length == 0 {
                return String::new();
            }
            
            let mut buffer: Vec<u16> = vec![0; (length + 1) as usize];
            let copied = GetWindowTextW(hwnd, &mut buffer);
            
            if copied > 0 {
                OsString::from_wide(&buffer[..copied as usize])
                    .to_string_lossy()
                    .to_string()
            } else {
                String::new()
            }
        }
    }
    
    fn get_process_name(hwnd: HWND) -> String {
        unsafe {
            let mut process_id: u32 = 0;
            GetWindowThreadProcessId(hwnd, Some(&mut process_id));
            
            if process_id == 0 {
                return String::new();
            }
            
            let handle = match OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, false, process_id) {
                Ok(h) => h,
                Err(_) => return String::new(),
            };
            
            let mut buffer: Vec<u16> = vec![0; 260];  // MAX_PATH
            let mut size = buffer.len() as u32;
            
            if QueryFullProcessImageNameW(handle, PROCESS_NAME_WIN32, PWSTR::from_raw(buffer.as_mut_ptr()), &mut size).is_ok() {
                let _ = CloseHandle(handle);
                
                // Get just the filename from the full path
                let path = OsString::from_wide(&buffer[..size as usize]).to_string_lossy().to_string();
                path.split('\\').last().unwrap_or("").to_string()
            } else {
                let _ = CloseHandle(handle);
                String::new()
            }
        }
    }
}

impl ActivityTracker for WindowsTracker {
    fn start(&mut self) -> std::result::Result<(), String> {
        log::info!("Starting Windows activity tracker");
        Ok(())
    }
    
    fn stop(&mut self) {
        log::info!("Stopping Windows activity tracker");
    }
    
    fn get_current_window(&self) -> Option<WindowInfo> {
        unsafe {
            let hwnd = GetForegroundWindow();
            if hwnd.0.is_null() {
                return None;
            }
            
            let window_title = Self::get_window_text(hwnd);
            let app_name = Self::get_process_name(hwnd);
            
            let mut process_id: u32 = 0;
            GetWindowThreadProcessId(hwnd, Some(&mut process_id));
            
            if app_name.is_empty() {
                return None;
            }
            
            Some(WindowInfo {
                app_name,
                window_title,
                process_id,
            })
        }
    }
    
    fn is_idle(&self) -> bool {
        unsafe {
            // LASTINPUTINFO struct for GetLastInputInfo
            #[repr(C)]
            struct LASTINPUTINFO {
                cb_size: u32,
                dw_time: u32,
            }

            extern "system" {
                fn GetLastInputInfo(plii: *mut LASTINPUTINFO) -> i32;
                fn GetTickCount() -> u32;
            }

            let mut lii = LASTINPUTINFO {
                cb_size: std::mem::size_of::<LASTINPUTINFO>() as u32,
                dw_time: 0,
            };

            if GetLastInputInfo(&mut lii) != 0 {
                let current_tick = GetTickCount();
                let idle_ms = current_tick.wrapping_sub(lii.dw_time);
                return idle_ms >= IDLE_THRESHOLD_MS;
            }
            false
        }
    }
}
