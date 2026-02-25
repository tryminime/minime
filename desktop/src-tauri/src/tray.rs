//! tray.rs — Full-featured system tray for MiniMe desktop.
//!
//! Features:
//!   - 3-state tracking: Tracking / Paused / Stopped
//!   - Dynamic menu items that change based on state
//!   - Live tooltip with today's tracked hours
//!   - Focus mode indicator
//!   - Double-click to show/hide main window

use tauri::{
    AppHandle, Manager, Runtime, Emitter,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};
use std::sync::atomic::{AtomicU8, Ordering};

pub const TRAY_ID: &str = "minime-tray";

// ── Tracking state shared via atomic ────────────────────────────────────────
// 0 = Stopped, 1 = Tracking, 2 = Paused
pub static TRACKING_STATE: AtomicU8 = AtomicU8::new(0);

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TrackingState {
    Stopped,
    Tracking,
    Paused,
}

impl TrackingState {
    pub fn from_atomic() -> Self {
        match TRACKING_STATE.load(Ordering::Relaxed) {
            1 => TrackingState::Tracking,
            2 => TrackingState::Paused,
            _ => TrackingState::Stopped,
        }
    }

    pub fn store(self) {
        let val = match self {
            TrackingState::Stopped => 0,
            TrackingState::Tracking => 1,
            TrackingState::Paused => 2,
        };
        TRACKING_STATE.store(val, Ordering::Relaxed);
    }

    pub fn label(&self) -> &'static str {
        match self {
            TrackingState::Stopped  => "○ Stopped",
            TrackingState::Tracking => "● Tracking",
            TrackingState::Paused   => "⏸ Paused",
        }
    }
}

// ── Build tray ──────────────────────────────────────────────────────────────

pub fn setup_tray<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let menu = build_tray_menu(app, TrackingState::Stopped, false)?;

    let mut builder = TrayIconBuilder::with_id(TRAY_ID)
        .tooltip("MiniMe — Activity Intelligence")
        .icon_as_template(true)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| {
            handle_menu_event(app, event.id().as_ref());
        })
        .on_tray_icon_event(move |tray, event| {
            handle_tray_event(tray.app_handle(), event);
        });

    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }

    builder.build(app)?;
    Ok(())
}

fn build_tray_menu<R: Runtime>(
    app: &AppHandle<R>,
    state: TrackingState,
    focus_active: bool,
) -> tauri::Result<Menu<R>> {
    // Title with status
    let status_text = format!("MiniMe  {}", state.label());
    let title = MenuItem::with_id(app, "title", &status_text, false, None::<&str>)?;
    let sep1 = PredefinedMenuItem::separator(app)?;

    // Navigation
    let open_dash = MenuItem::with_id(app, "open_dashboard", "📊  Open Dashboard", true, None::<&str>)?;
    let open_chat = MenuItem::with_id(app, "open_chat", "💬  Open Chat", true, None::<&str>)?;
    let sep2 = PredefinedMenuItem::separator(app)?;

    // Tracking controls — change based on current state
    let mut items: Vec<&dyn tauri::menu::IsMenuItem<R>> = vec![
        &title, &sep1,
        &open_dash, &open_chat,
        &sep2,
    ];

    // Dynamically build tracking controls
    let resume = MenuItem::with_id(app, "resume_tracking", "▶  Resume Tracking", true, None::<&str>)?;
    let pause = MenuItem::with_id(app, "pause_tracking", "⏸  Pause Tracking", true, None::<&str>)?;
    let stop = MenuItem::with_id(app, "stop_tracking", "⏹  Stop Tracking", true, None::<&str>)?;
    let start = MenuItem::with_id(app, "start_tracking", "▶  Start Tracking", true, None::<&str>)?;

    match state {
        TrackingState::Tracking => {
            items.push(&pause);
            items.push(&stop);
        }
        TrackingState::Paused => {
            items.push(&resume);
            items.push(&stop);
        }
        TrackingState::Stopped => {
            items.push(&start);
        }
    }

    let sep3 = PredefinedMenuItem::separator(app)?;
    items.push(&sep3);

    // Focus mode
    let focus_label = if focus_active { "⏱  Stop Focus Mode" } else { "⏱  Focus Mode (25 min)" };
    let focus = MenuItem::with_id(app, "focus_toggle", focus_label, true, None::<&str>)?;
    items.push(&focus);

    // Sync
    let sync = MenuItem::with_id(app, "sync_now", "🔄  Sync Now", true, None::<&str>)?;
    items.push(&sync);

    let sep4 = PredefinedMenuItem::separator(app)?;
    items.push(&sep4);

    // Bottom
    let settings = MenuItem::with_id(app, "settings", "⚙  Settings", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "❌  Quit MiniMe", true, None::<&str>)?;
    items.push(&settings);
    items.push(&quit);

    Menu::with_items(app, &items)
}

// ── Update tray state ───────────────────────────────────────────────────────

/// Rebuild the tray menu to reflect current tracking state.
pub fn refresh_tray<R: Runtime>(app: &AppHandle<R>, focus_active: bool) {
    let state = TrackingState::from_atomic();

    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        if let Ok(menu) = build_tray_menu(app, state, focus_active) {
            let _ = tray.set_menu(Some(menu));
        }
    }
}

/// Update the tray tooltip with live stats.
pub fn update_tray_tooltip<R: Runtime>(
    app: &AppHandle<R>,
    tracked_hours: f64,
    focus_score: f64,
    unsynced: i64,
) {
    let state = TrackingState::from_atomic();
    let mut tooltip = format!(
        "MiniMe {} · {:.1}h tracked today",
        state.label(),
        tracked_hours,
    );
    if focus_score > 0.0 {
        tooltip.push_str(&format!(" · Focus {:.1}/10", focus_score));
    }
    if unsynced > 0 {
        tooltip.push_str(&format!(" · {} unsynced", unsynced));
    }

    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        let _ = tray.set_tooltip(Some(&tooltip));
    }
}

// ── Event handlers ──────────────────────────────────────────────────────────

fn handle_menu_event<R: Runtime>(app: &AppHandle<R>, id: &str) {
    match id {
        "open_dashboard" => open_url(app, "/dashboard/overview"),
        "open_chat"      => open_url(app, "/dashboard/chat"),
        "settings"       => open_url(app, "/dashboard/settings"),

        "start_tracking" | "resume_tracking" => {
            TrackingState::Tracking.store();
            let _ = app.emit("tray-start-tracking", ());
            refresh_tray(app, false);
            log::info!("Tracking started via tray");
        }
        "pause_tracking" => {
            TrackingState::Paused.store();
            let _ = app.emit("tray-pause-tracking", ());
            refresh_tray(app, false);
            log::info!("Tracking paused via tray");
        }
        "stop_tracking" => {
            TrackingState::Stopped.store();
            let _ = app.emit("tray-stop-tracking", ());
            refresh_tray(app, false);
            log::info!("Tracking stopped via tray");
        }

        "focus_toggle" => {
            let _ = app.emit("tray-toggle-focus", ());
        }
        "sync_now" => {
            let _ = app.emit("tray-sync-now", ());
        }

        "quit" => {
            log::info!("Quit requested from tray");
            app.exit(0);
        }

        _ => {}
    }
}

fn handle_tray_event<R: Runtime>(app: &AppHandle<R>, event: TrayIconEvent) {
    if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
    } = event
    {
        toggle_main_window(app);
    }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

fn open_url<R: Runtime>(app: &AppHandle<R>, path: &str) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
        let _ = window.unminimize();
        // Navigate to the path — the webview will handle routing
        let url = format!("http://localhost:3000{}", path);
        let _ = window.eval(&format!("window.location.href = '{}'", url));
    }
}

fn toggle_main_window<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}
