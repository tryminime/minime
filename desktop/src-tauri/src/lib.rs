mod tracker;
mod platform;
mod database;
mod encryption;
mod sync;
mod privacy;
mod polling;
mod input;
mod settings;
mod ai_chat;
mod commands;
mod screenshot;
mod tray;
mod focus_timer;
#[cfg(test)]
mod tests;
mod setup;

use tauri::{Manager, State, AppHandle, Emitter};
use tauri::WindowEvent;
use std::sync::Arc;
use tokio::sync::Mutex as TokioMutex;
use std::sync::Mutex as StdMutex;
use tracker::ActivityManager;
use database::Database;
use sync::SyncManager;
use privacy::PrivacyFilter;
use polling::PollingTask;
use input::{StubInputMonitor, InputMonitor, FocusDetector};
use settings::SettingsManager;
use ai_chat::AIChatManager;
use screenshot::ScreenshotManager;
use focus_timer::FocusTimer;
use tray::TrackingState;
use commands::*;

// ── Application state ────────────────────────────────────────────────────────

struct AppState {
    activity_manager: Arc<TokioMutex<ActivityManager>>,
    database: Arc<TokioMutex<Database>>,
    sync_manager: StdMutex<SyncManager>,
    privacy_filter: Arc<TokioMutex<PrivacyFilter>>,
    polling_task: Arc<TokioMutex<Option<PollingTask>>>,
    input_monitor: Arc<TokioMutex<Box<dyn InputMonitor>>>,
    focus_detector: Arc<TokioMutex<FocusDetector>>,
    settings_manager: StdMutex<SettingsManager>,
    ai_chat_manager: StdMutex<AIChatManager>,
    screenshot_manager: StdMutex<ScreenshotManager>,
    focus_timer: Arc<TokioMutex<FocusTimer>>,
    device_id: String,
}

// ── Tracking commands ─────────────────────────────────────────────────────────

#[tauri::command]
async fn start_tracking(state: State<'_, AppState>, app: AppHandle) -> Result<String, String> {
    let mut manager = state.activity_manager.lock().await;
    manager.start()?;
    drop(manager);

    let mut input = state.input_monitor.lock().await;
    input.start()?;
    drop(input);

    let polling = state.polling_task.lock().await;
    if let Some(ref task) = *polling {
        task.start().await;
    }

    TrackingState::Tracking.store();
    tray::refresh_tray(&app, false);
    log::info!("Tracking started");
    Ok("Tracking started successfully".to_string())
}

#[tauri::command]
async fn stop_tracking(state: State<'_, AppState>, app: AppHandle) -> Result<String, String> {
    let mut manager = state.activity_manager.lock().await;
    manager.stop();
    drop(manager);

    let mut input = state.input_monitor.lock().await;
    input.stop();
    drop(input);

    let polling = state.polling_task.lock().await;
    if let Some(ref task) = *polling {
        task.stop().await;
    }

    TrackingState::Stopped.store();
    tray::refresh_tray(&app, false);
    log::info!("Tracking stopped");
    Ok("Tracking stopped successfully".to_string())
}

#[tauri::command]
async fn pause_tracking(state: State<'_, AppState>, app: AppHandle) -> Result<String, String> {
    // Pause stops polling but keeps the session alive
    let polling = state.polling_task.lock().await;
    if let Some(ref task) = *polling {
        task.stop().await;
    }

    TrackingState::Paused.store();
    tray::refresh_tray(&app, false);
    log::info!("Tracking paused");
    Ok("Tracking paused successfully".to_string())
}

#[tauri::command]
async fn get_tracking_state() -> Result<String, String> {
    let state = TrackingState::from_atomic();
    match state {
        TrackingState::Tracking => Ok("tracking".to_string()),
        TrackingState::Paused   => Ok("paused".to_string()),
        TrackingState::Stopped  => Ok("stopped".to_string()),
    }
}

#[tauri::command]
async fn get_unsynced_count(state: State<'_, AppState>) -> Result<i64, String> {
    let db = state.database.lock().await;
    db.get_unsynced_count()
        .map_err(|e| format!("Database error: {}", e))
}

// ── Focus timer commands ──────────────────────────────────────────────────────

#[tauri::command]
async fn start_focus_mode(
    state: State<'_, AppState>,
    app: AppHandle,
    work_mins: Option<u64>,
    break_mins: Option<u64>,
) -> Result<String, String> {
    let mut timer = state.focus_timer.lock().await;
    if let Some(w) = work_mins {
        let b = break_mins.unwrap_or(5);
        timer.configure(w, b);
    }
    timer.start_work();
    drop(timer);
    tray::refresh_tray(&app, true);
    Ok("Focus mode started".to_string())
}

#[tauri::command]
async fn stop_focus_mode(state: State<'_, AppState>, app: AppHandle) -> Result<String, String> {
    let mut timer = state.focus_timer.lock().await;
    timer.stop();
    drop(timer);
    tray::refresh_tray(&app, false);
    Ok("Focus mode stopped".to_string())
}

#[tauri::command]
async fn get_focus_status(state: State<'_, AppState>) -> Result<focus_timer::FocusStatus, String> {
    let timer = state.focus_timer.lock().await;
    Ok(timer.status())
}

#[tauri::command]
async fn login(
    email: String,
    password: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let api_url = {
        let sync = state.sync_manager.lock().unwrap();
        sync.api_url.clone()
    };
    let mut sync_mgr = SyncManager::new(api_url);
    let token = sync_mgr.login(&email, &password).await?;
    let mut sync = state.sync_manager.lock().unwrap();
    sync.set_token(token.clone());
    Ok(token)
}

#[tauri::command]
async fn sync_now(state: State<'_, AppState>) -> Result<String, String> {
    let (activities, api_url) = {
         let db = state.database.lock().await;
        let sync = state.sync_manager.lock().unwrap();
        let activities = db.get_unsynced_activities(100)
            .map_err(|e| format!("Failed to get activities: {}", e))?;
        if activities.is_empty() {
            return Ok("No activities to sync".to_string());
        }
        (activities, sync.api_url.clone())
    };

    let mut sync_mgr = SyncManager::new(api_url);
    {
        let sync = state.sync_manager.lock().unwrap();
        if let Some(ref token) = sync.access_token {
            sync_mgr.set_token(token.clone());
        }
    }

    let response = sync_mgr.sync_activities(activities.clone()).await?;
    {
        let mut db = state.database.lock().await;
        let ids: Vec<String> = activities.iter().map(|a| a.id.clone()).collect();
        db.mark_activities_synced(&ids)
            .map_err(|e| format!("Failed to mark synced: {}", e))?;
    }
    Ok(format!("Synced {} activities", response.synced))
}

// ── Privacy commands ──────────────────────────────────────────────────────────

#[tauri::command]
async fn add_to_blacklist(app_name: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut filter = state.privacy_filter.lock().await;
    filter.add_to_blacklist(app_name);
    Ok(())
}

#[tauri::command]
async fn get_blacklist(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let filter = state.privacy_filter.lock().await;
    Ok(filter.get_blacklist())
}

#[tauri::command]
async fn get_whitelist(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let filter = state.privacy_filter.lock().await;
    Ok(filter.get_whitelist())
}

#[tauri::command]
async fn toggle_tracking(enabled: bool, state: State<'_, AppState>) -> Result<(), String> {
    let mut filter = state.privacy_filter.lock().await;
    filter.enabled = enabled;
    Ok(())
}

// ── Autostart command ─────────────────────────────────────────────────────────

#[tauri::command]
async fn set_autostart(enabled: bool, app: AppHandle) -> Result<bool, String> {
    use tauri_plugin_autostart::ManagerExt;
    let autostart = app.autolaunch();
    if enabled {
        autostart.enable().map_err(|e| format!("Failed to enable autostart: {}", e))?;
        log::info!("Auto-launch on login: enabled");
    } else {
        autostart.disable().map_err(|e| format!("Failed to disable autostart: {}", e))?;
        log::info!("Auto-launch on login: disabled");
    }
    let is_enabled = autostart.is_enabled()
        .map_err(|e| format!("Failed to check autostart state: {}", e))?;
    Ok(is_enabled)
}

#[tauri::command]
async fn get_autostart(app: AppHandle) -> Result<bool, String> {
    use tauri_plugin_autostart::ManagerExt;
    app.autolaunch()
        .is_enabled()
        .map_err(|e| format!("Failed to check autostart state: {}", e))
}

// ── Backend health check & auto-start ────────────────────────────────────────

/// Check if the backend is running; if not, start it.
async fn ensure_backend_running(api_url: &str) {
    let health_url = format!("{}/health", api_url);
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(3))
        .build()
        .unwrap_or_default();

    match client.get(&health_url).send().await {
        Ok(r) if r.status().is_success() => {
            log::info!("Backend already running at {}", api_url);
        }
        _ => {
            log::warn!("Backend not detected — attempting to start...");
            if let Err(e) = setup::start_backend_services(false).await {
                log::error!("Could not auto-start backend: {}", e);
            } else {
                log::info!("Backend started");
            }
        }
    }
}

// ── App entry point ───────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // If a second instance is launched, just show the existing window
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            // ── Data directory ────────────────────────────────────
            let app_dir = app.path().app_data_dir()
                .expect("Failed to get app data directory");
            std::fs::create_dir_all(&app_dir).expect("Failed to create app directory");

            // ── Database ──────────────────────────────────────────
            let db_path = app_dir.join("minime.db");
            let database = Database::new(db_path)
                .expect("Failed to initialize database");

            // ── Activity tracking ─────────────────────────────────
            let tracker = platform::create_tracker();
            let device_id = uuid::Uuid::new_v4().to_string();
            let activity_manager = ActivityManager::new(tracker, device_id.clone());

            // ── Services ──────────────────────────────────────────
            let api_url = std::env::var("API_URL")
                .unwrap_or_else(|_| "http://localhost:8000".to_string());
            let sync_manager = SyncManager::new(api_url.clone());
            let settings_manager = SettingsManager::new(api_url.clone());
            let ai_chat_manager = AIChatManager::new(api_url.clone());
            let screenshot_manager = ScreenshotManager::new(app_dir.clone());
            let privacy_filter = PrivacyFilter::new();
            let focus_timer = FocusTimer::new();
            let input_monitor: Box<dyn InputMonitor> = Box::new(StubInputMonitor::new());
            let focus_detector = FocusDetector::new();

            // ── Arc wrappers ──────────────────────────────────────
            let activity_manager_arc = Arc::new(TokioMutex::new(activity_manager));
            let database_arc = Arc::new(TokioMutex::new(database));
            let privacy_filter_arc = Arc::new(TokioMutex::new(privacy_filter));
            let input_monitor_arc = Arc::new(TokioMutex::new(input_monitor));
            let focus_detector_arc = Arc::new(TokioMutex::new(focus_detector));

            let polling_task = PollingTask::new(
                Arc::clone(&activity_manager_arc),
                Arc::clone(&database_arc),
                Arc::clone(&privacy_filter_arc),
            );

            let focus_timer_arc = Arc::new(TokioMutex::new(focus_timer));
            let polling_task_arc = Arc::new(TokioMutex::new(Some(polling_task)));

            app.manage(AppState {
                activity_manager: activity_manager_arc.clone(),
                database: database_arc.clone(),
                sync_manager: StdMutex::new(sync_manager),
                privacy_filter: privacy_filter_arc,
                polling_task: polling_task_arc.clone(),
                input_monitor: input_monitor_arc,
                focus_detector: focus_detector_arc,
                settings_manager: StdMutex::new(settings_manager),
                ai_chat_manager: StdMutex::new(ai_chat_manager),
                screenshot_manager: StdMutex::new(screenshot_manager),
                focus_timer: focus_timer_arc.clone(),
                device_id,
            });

            // ── System tray ───────────────────────────────────────
            let handle = app.handle();
            tray::setup_tray(handle)?;

            // ── Auto-start backend if not running ─────────────────
            let api_url_clone = api_url.clone();
            let handle2 = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                ensure_backend_running(&api_url_clone).await;
                // Update tray tooltip once backend check is done
                tray::update_tray_tooltip(&handle2, 0.0, 0.0, 0);
            });

            // ── Auto-start activity tracking (2s after init) ──────
            let manager_arc2 = activity_manager_arc.clone();
            let handle3 = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
                let mut manager = manager_arc2.lock().await;
                if let Err(e) = manager.start() {
                    log::warn!("Auto-start tracking failed: {}", e);
                } else {
                    TrackingState::Tracking.store();
                    tray::refresh_tray(&handle3, false);
                    log::info!("Activity tracking auto-started");
                }
            });

            // ── Periodic tray tooltip refresh (every 60s) ────────
            let handle4 = app.handle().clone();
            let db_arc2 = database_arc.clone();
            tauri::async_runtime::spawn(async move {
                loop {
                    tokio::time::sleep(tokio::time::Duration::from_secs(60)).await;
                    // Calculate today's tracked hours from local DB
                    let tracked_hours = {
                        let db = db_arc2.lock().await;
                        db.get_today_tracked_hours().unwrap_or(0.0)
                    };
                    let unsynced = {
                        let db = db_arc2.lock().await;
                        db.get_unsynced_count().unwrap_or(0)
                    };
                    tray::update_tray_tooltip(&handle4, tracked_hours, 0.0, unsynced);
                }
            });

            // ── Focus timer tick (every 1s when active) ──────────
            let handle5 = app.handle().clone();
            let focus_arc2 = focus_timer_arc.clone();
            tauri::async_runtime::spawn(async move {
                loop {
                    tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
                    let mut timer = focus_arc2.lock().await;
                    if timer.is_active() {
                        let transitioned = timer.tick();
                        if transitioned {
                            let status = timer.status();
                            drop(timer);
                            tray::refresh_tray(&handle5, status.state != focus_timer::FocusState::Idle);
                            // Send notification on state transition
                            let _ = handle5.emit("focus-timer-transition", &status);
                        }
                    }
                }
            });

            // ── Global shortcut: Ctrl+Shift+M toggles tracking ───
            {
                use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, Modifiers, Code};

                let shortcut = Shortcut::new(
                    Some(Modifiers::CONTROL | Modifiers::SHIFT),
                    Code::KeyM,
                );
                let handle_gs = app.handle().clone();
                let am = activity_manager_arc.clone();
                let pt = polling_task_arc.clone();

                app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, _event| {
                    let current = TrackingState::from_atomic();
                    let handle_inner = handle_gs.clone();
                    let am_inner = am.clone();
                    let pt_inner = pt.clone();

                    tauri::async_runtime::spawn(async move {
                        match current {
                            TrackingState::Tracking => {
                                // Pause
                                let polling = pt_inner.lock().await;
                                if let Some(ref task) = *polling {
                                    task.stop().await;
                                }
                                TrackingState::Paused.store();
                                tray::refresh_tray(&handle_inner, false);
                                log::info!("Tracking paused via Ctrl+Shift+M");
                            }
                            TrackingState::Paused | TrackingState::Stopped => {
                                // Resume / Start
                                let mut manager = am_inner.lock().await;
                                let _ = manager.start();
                                drop(manager);
                                let polling = pt_inner.lock().await;
                                if let Some(ref task) = *polling {
                                    task.start().await;
                                }
                                TrackingState::Tracking.store();
                                tray::refresh_tray(&handle_inner, false);
                                log::info!("Tracking resumed via Ctrl+Shift+M");
                            }
                        }
                    });
                }).unwrap_or_else(|e| {
                    log::warn!("Failed to register global shortcut Ctrl+Shift+M: {}", e);
                });
                log::info!("Global shortcut Ctrl+Shift+M registered");
            }

            log::info!("MiniMe desktop app initialized");
            Ok(())
        })
        // ── Minimize to tray on close ─────────────────────────────
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                // Prevent the window from actually closing — just hide it
                window.hide().unwrap_or(());
                api.prevent_close();
                log::debug!("Window hidden to tray (close button intercepted)");
            }
        })
        .invoke_handler(tauri::generate_handler![
            start_tracking,
            stop_tracking,
            pause_tracking,
            get_tracking_state,
            get_unsynced_count,
            login,
            sync_now,
            add_to_blacklist,
            get_blacklist,
            get_whitelist,
            toggle_tracking,
            // Autostart
            set_autostart,
            get_autostart,
            // Settings commands
            update_profile,
            update_tracking_settings,
            update_focus_settings,
            update_privacy_settings,
            update_notification_settings,
            change_password,
            enable_2fa,
            disable_2fa,
            export_data,
            create_backup,
            // AI Chat commands
            send_chat_message,
            get_conversation_history,
            get_all_conversations,
            get_focus_score,
            get_wellness_score,
            generate_weekly_report,
            // Screenshot commands
            capture_screenshot,
            capture_screenshot_monitor,
            list_screenshots,
            get_screenshot,
            delete_screenshot,
            list_monitors,
            // Focus timer commands
            start_focus_mode,
            stop_focus_mode,
            get_focus_status,
            get_focus_analytics,
            get_focus_sessions,
            // Setup commands
            setup::check_backend_status,
            setup::check_ollama_installed,
            setup::install_ollama,
            setup::download_ollama_model,
            setup::run_database_migrations,
            setup::configure_environment,
            setup::start_backend_services,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
