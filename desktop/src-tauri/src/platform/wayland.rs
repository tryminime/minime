//! Wayland-compatible activity tracker for GNOME Wayland sessions.
//!
//! Approach (in priority order):
//!   1. `ydotool` — native Wayland input tool
//!   2. `xdotool` on XWayland display :1
//!   3. GNOME Shell DBus (Shell.Eval) — works on GNOME < 45, fails on 45+
//!   4. `/proc` scan — finds the highest-priority GUI process by name matching
//!      against a curated list of common desktop apps, returns the one with
//!      the highest RSS (most RAM = most likely focused)

use crate::tracker::{ActivityTracker, WindowInfo};
use std::fs;
use std::process::Command;

/// Known GUI app process names → human-readable display names
const KNOWN_GUI_APPS: &[(&str, &str)] = &[
    ("code",                "VS Code"),
    ("electron",            "Electron App"),
    ("firefox",             "Firefox"),
    ("chromium",            "Chromium"),
    ("chrome",              "Google Chrome"),
    ("google-chrome",       "Google Chrome"),
    ("brave",               "Brave Browser"),
    ("nautilus",            "File Manager"),
    ("gedit",               "Text Editor"),
    ("gnome-text-editor",   "Text Editor"),
    ("evince",              "Document Viewer"),
    ("eog",                 "Image Viewer"),
    ("libreoffice",         "LibreOffice"),
    ("soffice",             "LibreOffice"),
    ("gimp",                "GIMP"),
    ("inkscape",            "Inkscape"),
    ("vlc",                 "VLC"),
    ("mpv",                 "MPV"),
    ("spotify",             "Spotify"),
    ("slack",               "Slack"),
    ("discord",             "Discord"),
    ("telegram-desktop",    "Telegram"),
    ("signal",              "Signal"),
    ("thunderbird",         "Thunderbird"),
    ("gnome-terminal",      "Terminal"),
    ("gnome-terminal-",     "Terminal"),
    ("konsole",             "Konsole"),
    ("kitty",               "Kitty Terminal"),
    ("alacritty",           "Alacritty"),
    ("xfce4-terminal",      "XFCE Terminal"),
    ("tilix",               "Tilix"),
    ("wezterm",             "WezTerm"),
    ("idea",                "IntelliJ IDEA"),
    ("pycharm",             "PyCharm"),
    ("goland",              "GoLand"),
    ("webstorm",            "WebStorm"),
    ("clion",               "CLion"),
    ("rider",               "Rider"),
    ("datagrip",            "DataGrip"),
    ("dataedo",             "DataGrip"),
    ("postman",             "Postman"),
    ("insomnia",            "Insomnia"),
    ("dbeaver",             "DBeaver"),
    ("obsidian",            "Obsidian"),
    ("notion",              "Notion"),
    ("zoom",                "Zoom"),
    ("teams",               "Microsoft Teams"),
    ("figma",               "Figma"),
    ("blender",             "Blender"),
    ("godot",               "Godot Engine"),
    ("steam",               "Steam"),
    ("tauri",               "MiniMe"),
];

/// Processes to always skip (system/background daemons)
const SKIP_PROCS: &[&str] = &[
    "kworker", "ksoftirqd", "kthread", "migration", "rcu_",
    "bash", "sh", "zsh", "fish", "dash", "awk", "sed", "grep",
    "cat", "ls", "ps", "cut", "head", "tail", "sort", "find",
    "systemd", "dbus", "pulseaudio", "pipewire", "wireplumber",
    "Xwayland", "gnome-session", "gnome-shell", "gdm", "mutter",
    "gsd-", "gnome-settings", "at-spi", "polkit", "colord",
    "NetworkManager", "wpa_supplicant", "avahi", "bluetoothd",
    "node", "npm", "python", "python3", "uvicorn", "cargo",
    "rustc", "cc1", "ld", "make", "cmake",
];

pub struct WaylandTracker {
    running: bool,
    /// XWayland display string discovered at init (:1 or :0)
    xwayland_display: Option<String>,
}

impl WaylandTracker {
    pub fn new() -> Self {
        // Discover XWayland display at startup
        let xwayland_display = Self::find_xwayland_display();
        if let Some(ref d) = xwayland_display {
            log::info!("WaylandTracker: found XWayland at display {}", d);
        }
        Self { running: false, xwayland_display }
    }

    fn find_xwayland_display() -> Option<String> {
        // Look for Xwayland process with its display argument
        if let Ok(entries) = fs::read_dir("/proc") {
            for entry in entries.flatten() {
                let name = entry.file_name().into_string().unwrap_or_default();
                if !name.chars().all(|c| c.is_ascii_digit()) { continue; }
                let comm = fs::read_to_string(format!("/proc/{}/comm", name))
                    .unwrap_or_default();
                if comm.trim() == "Xwayland" {
                    let cmdline = fs::read_to_string(format!("/proc/{}/cmdline", name))
                        .unwrap_or_default()
                        .replace('\0', " ");
                    // Extract ":N" display number from cmdline args
                    for arg in cmdline.split_whitespace() {
                        if arg.starts_with(':') && arg[1..].chars().all(|c| c.is_ascii_digit()) {
                            return Some(arg.to_string());
                        }
                    }
                    return Some(":1".to_string()); // default
                }
            }
        }
        None
    }

    /// Strategy 1: xdotool via XWayland (works if app is an XWayland app)
    fn try_xdotool(&self) -> Option<WindowInfo> {
        let display = self.xwayland_display.as_deref().unwrap_or(":1");

        let win_id_out = Command::new("xdotool")
            .env("DISPLAY", display)
            .args(["getactivewindow"])
            .output()
            .ok()?;
        if !win_id_out.status.success() { return None; }
        let id = String::from_utf8_lossy(&win_id_out.stdout).trim().to_string();
        if id.is_empty() || id == "0" { return None; }

        let title = Command::new("xdotool")
            .env("DISPLAY", display)
            .args(["getwindowname", &id])
            .output()
            .ok()
            .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
            .unwrap_or_default();
        if title.is_empty() { return None; }

        let class = Command::new("xdotool")
            .env("DISPLAY", display)
            .args(["getwindowclassname", &id])
            .output()
            .ok()
            .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
            .unwrap_or_else(|| "Unknown".to_string());

        Some(WindowInfo {
            app_name:     normalize_app_name(&class),
            window_title: title,
            process_id:   0,
        })
    }

    /// Strategy 2: GNOME Shell DBus (works on GNOME < 45)
    fn try_gdbus_eval(&self) -> Option<WindowInfo> {
        let script = "JSON.stringify({pid:global.display.focus_window?.get_pid(),title:global.display.focus_window?.get_title(),cls:global.display.focus_window?.get_wm_class()})";
        let output = Command::new("gdbus")
            .args(["call", "--session",
                "--dest", "org.gnome.Shell",
                "--object-path", "/org/gnome/Shell",
                "--method", "org.gnome.Shell.Eval",
                script,
            ])
            .output()
            .ok()?;
        if !output.status.success() { return None; }

        let raw = String::from_utf8_lossy(&output.stdout);
        // Response: (true, '{"pid":1234,"title":"...","cls":"..."}')
        if !raw.contains("true") { return None; }

        let json_str = raw.split('\'').nth(1)?.trim().to_string();
        if json_str.is_empty() || json_str == "null" { return None; }

        // Simple field extraction without serde_json dependency
        let get_field = |key: &str| -> String {
            let search = format!("\"{}\":\"", key);
            json_str.split(&search).nth(1)
                .and_then(|s| s.split('"').next())
                .unwrap_or("")
                .to_string()
        };
        let title = get_field("title");
        let cls   = get_field("cls");
        if title.is_empty() { return None; }

        Some(WindowInfo {
            app_name:     normalize_app_name(&cls),
            window_title: title,
            process_id:   0,
        })
    }

    /// Strategy 3: /proc scan — find the most likely focused GUI app
    /// by matching process names against KNOWN_GUI_APPS and ranking by RSS.
    fn try_proc_scan(&self) -> Option<WindowInfo> {
        let proc_dir = fs::read_dir("/proc").ok()?;

        struct Candidate {
            rss:        u64,
            app_name:   String,
            title:      String,
        }

        let mut best: Option<Candidate> = None;

        for entry in proc_dir.flatten() {
            let fname = entry.file_name();
            let pid_str = fname.to_string_lossy();
            if !pid_str.chars().all(|c| c.is_ascii_digit()) { continue; }

            let comm = match fs::read_to_string(format!("/proc/{}/comm", pid_str)) {
                Ok(c) => c.trim().to_string(),
                Err(_) => continue,
            };

            // Skip system daemons
            if SKIP_PROCS.iter().any(|s| comm.starts_with(s)) { continue; }

            // Must be a known GUI app
            let known = KNOWN_GUI_APPS.iter()
                .find(|(proc_name, _)| comm.to_lowercase().contains(proc_name));
            if known.is_none() { continue; }
            let display_name = known.unwrap().1;

            // Get RSS (pages of memory — higher = more likely active app)
            let stat = fs::read_to_string(format!("/proc/{}/stat", pid_str))
                .unwrap_or_default();
            let fields: Vec<&str> = stat.splitn(52, ' ').collect();
            if fields.get(2) == Some(&"Z") { continue; } // skip zombies
            let rss: u64 = fields.get(23)
                .and_then(|s| s.parse().ok())
                .unwrap_or(0);
            if rss < 1000 { continue; }

            // Get window title from /proc/[pid]/environ WAYLAND_DISPLAY
            // and use comm or cmdline basename as fallback title
            let cmdline = fs::read_to_string(format!("/proc/{}/cmdline", pid_str))
                .unwrap_or_default()
                .replace('\0', " ");
            let title = cmdline.split_whitespace().next()
                .and_then(|s| s.split('/').last())
                .unwrap_or(&comm)
                .to_string();

            if best.as_ref().map(|b| rss > b.rss).unwrap_or(true) {
                best = Some(Candidate {
                    rss,
                    app_name: display_name.to_string(),
                    title,
                });
            }
        }

        best.map(|c| WindowInfo {
            app_name:     c.app_name,
            window_title: c.title,
            process_id:   0,
        })
    }
}

impl ActivityTracker for WaylandTracker {
    fn start(&mut self) -> Result<(), String> {
        self.running = true;
        log::info!("WaylandTracker started (xdotool → gdbus → /proc fallback)");
        Ok(())
    }

    fn stop(&mut self) {
        self.running = false;
    }

    fn get_current_window(&self) -> Option<WindowInfo> {
        if !self.running { return None; }

        if let Some(info) = self.try_xdotool() {
            return Some(info);
        }
        if let Some(info) = self.try_gdbus_eval() {
            return Some(info);
        }
        self.try_proc_scan()
    }

    fn is_idle(&self) -> bool {
        // Try xprintidle (works via XWayland)
        let display = self.xwayland_display.as_deref().unwrap_or(":1");
        if let Ok(o) = Command::new("xprintidle").env("DISPLAY", display).output() {
            if o.status.success() {
                if let Ok(ms) = String::from_utf8_lossy(&o.stdout).trim().parse::<u64>() {
                    return ms >= 300_000; // 5 min
                }
            }
        }
        false
    }
}

/// Normalize a raw WM class string to a human-readable app name.
fn normalize_app_name(raw: &str) -> String {
    if raw.is_empty() { return "Unknown".to_string(); }
    let lower = raw.to_lowercase();
    for (proc_name, display) in KNOWN_GUI_APPS {
        if lower.contains(proc_name) {
            return display.to_string();
        }
    }
    // Title-case the raw name as a best-effort fallback
    let cleaned = raw.trim().replace('-', " ").replace('_', " ");
    let mut chars = cleaned.chars();
    match chars.next() {
        None => String::new(),
        Some(c) => c.to_uppercase().collect::<String>() + chars.as_str(),
    }
}
