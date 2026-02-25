use tauri::State;
use crate::{AppState, settings::*, ai_chat::*};
use std::collections::HashMap;

// Helper macro to get token and API URL
macro_rules! get_auth {
    ($state:expr) => {{
        let sync = $state.sync_manager.lock().unwrap();
        let token = sync.access_token.as_ref()
            .ok_or_else(|| "Not authenticated".to_string())?
            .clone();
        let api_url = sync.api_url.clone();
        drop(sync);
        (token, api_url)
    }};
}

// ============================================
// SETTINGS COMMANDS
// ============================================

#[tauri::command]
pub async fn update_profile(
    profile: UserProfile,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let (token, api_url) = get_auth!(state);
    let settings = SettingsManager::new(api_url);
    settings.update_profile(&token, profile).await
}

#[tauri::command]
pub async fn update_tracking_settings(
    settings: TrackingSettings,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let (token, api_url) = get_auth!(state);
    let settings_mgr = SettingsManager::new(api_url);
    settings_mgr.update_tracking_settings(&token, settings).await
}

#[tauri::command]
pub async fn update_focus_settings(
    settings: FocusSettings,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let (token, api_url) = get_auth!(state);
    let settings_mgr = SettingsManager::new(api_url);
    settings_mgr.update_focus_settings(&token, settings).await
}

#[tauri::command]
pub async fn update_privacy_settings(
    settings: PrivacySettings,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let (token, api_url) = get_auth!(state);
    let settings_mgr = SettingsManager::new(api_url);
    settings_mgr.update_privacy_settings(&token, settings).await
}

#[tauri::command]
pub async fn update_notification_settings(
    settings: NotificationSettings,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let (token, api_url) = get_auth!(state);
    let settings_mgr = SettingsManager::new(api_url);
    settings_mgr.update_notification_settings(&token, settings).await
}

#[tauri::command]
pub async fn change_password(
    old_password: String,
    new_password: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let (token, api_url) = get_auth!(state);
    let settings_mgr = SettingsManager::new(api_url);
    settings_mgr.change_password(&token, &old_password, &new_password).await
}

#[tauri::command]
pub async fn enable_2fa(
    state: State<'_, AppState>,
) -> Result<HashMap<String, String>, String> {
    let (token, api_url) = get_auth!(state);
    let settings_mgr = SettingsManager::new(api_url);
    settings_mgr.enable_2fa(&token).await
}

#[tauri::command]
pub async fn disable_2fa(
    code: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let (token, api_url) = get_auth!(state);
    let settings_mgr = SettingsManager::new(api_url);
    settings_mgr.disable_2fa(&token, &code).await
}

#[tauri::command]
pub async fn export_data(
    format: String,
    state: State<'_, AppState>,
) -> Result<Vec<u8>, String> {
    let (token, api_url) = get_auth!(state);
    let settings_mgr = SettingsManager::new(api_url);
    settings_mgr.export_data(&token, &format).await
}

#[tauri::command]
pub async fn create_backup(
    state: State<'_, AppState>,
) -> Result<String, String> {
    let (token, api_url) = get_auth!(state);
    let settings_mgr = SettingsManager::new(api_url);
    settings_mgr.create_backup(&token).await
}

// ============================================
// AI CHAT COMMANDS  
// ============================================

#[tauri::command]
pub async fn send_chat_message(
    request: ChatRequest,
    state: State<'_, AppState>,
) -> Result<ChatResponse, String> {
    let (token, api_url) = get_auth!(state);
    let chat_mgr = AIChatManager::new(api_url);
    chat_mgr.send_message(&token, request).await
}

#[tauri::command]
pub async fn get_conversation_history(
    conversation_id: String,
    state: State<'_, AppState>,
) -> Result<ConversationHistory, String> {
    let (token, api_url) = get_auth!(state);
    let chat_mgr = AIChatManager::new(api_url);
    chat_mgr.get_conversation_history(&token, &conversation_id).await
}

#[tauri::command]
pub async fn get_all_conversations(
    state: State<'_, AppState>,
) -> Result<Vec<ConversationHistory>, String> {
    let (token, api_url) = get_auth!(state);
    let chat_mgr = AIChatManager::new(api_url);
    chat_mgr.get_all_conversations(&token).await
}

#[tauri::command]
pub async fn get_focus_score(
    state: State<'_, AppState>,
) -> Result<HashMap<String, serde_json::Value>, String> {
    let (token, api_url) = get_auth!(state);
    let chat_mgr = AIChatManager::new(api_url);
    chat_mgr.get_focus_score(&token).await
}

#[tauri::command]
pub async fn get_wellness_score(
    state: State<'_, AppState>,
) -> Result<HashMap<String, serde_json::Value>, String> {
    let (token, api_url) = get_auth!(state);
    let chat_mgr = AIChatManager::new(api_url);
    chat_mgr.get_wellness_score(&token).await
}

#[tauri::command]
pub async fn generate_weekly_report(
    state: State<'_, AppState>,
) -> Result<String, String> {
    let (token, api_url) = get_auth!(state);
    let chat_mgr = AIChatManager::new(api_url);
   chat_mgr.generate_weekly_report(&token).await
}

// ============================================
// SCREENSHOT COMMANDS
// ============================================

#[tauri::command]
pub fn capture_screenshot(
    label: Option<String>,
    state: State<'_, AppState>,
) -> Result<crate::screenshot::CaptureResult, String> {
    let mgr = state.screenshot_manager.lock().unwrap();
    mgr.capture(label)
}

#[tauri::command]
pub fn capture_screenshot_monitor(
    monitor_index: usize,
    label: Option<String>,
    state: State<'_, AppState>,
) -> Result<crate::screenshot::CaptureResult, String> {
    let mgr = state.screenshot_manager.lock().unwrap();
    mgr.capture_monitor_by_index(monitor_index, label)
}

#[tauri::command]
pub fn list_screenshots(
    limit: Option<usize>,
    offset: Option<usize>,
    state: State<'_, AppState>,
) -> Result<Vec<crate::screenshot::ScreenshotMeta>, String> {
    let mgr = state.screenshot_manager.lock().unwrap();
    mgr.list_screenshots(limit.unwrap_or(50), offset.unwrap_or(0))
}

#[tauri::command]
pub fn get_screenshot(
    id: String,
    state: State<'_, AppState>,
) -> Result<Vec<u8>, String> {
    let mgr = state.screenshot_manager.lock().unwrap();
    mgr.get_screenshot_data(&id)
}

#[tauri::command]
pub fn delete_screenshot(
    id: String,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let mgr = state.screenshot_manager.lock().unwrap();
    mgr.delete_screenshot(&id)
}

#[tauri::command]
pub fn list_monitors() -> Result<Vec<crate::screenshot::MonitorInfo>, String> {
    crate::screenshot::ScreenshotManager::list_monitors()
}

// ============================================
// FOCUS PERIOD COMMANDS
// ============================================

#[tauri::command]
pub async fn get_focus_analytics(
    state: State<'_, AppState>,
) -> Result<crate::input::FocusAnalytics, String> {
    let detector = state.focus_detector.lock().await;
    Ok(detector.get_analytics())
}

#[tauri::command]
pub async fn get_focus_sessions(
    limit: Option<usize>,
    state: State<'_, AppState>,
) -> Result<Vec<crate::input::FocusSession>, String> {
    let detector = state.focus_detector.lock().await;
    Ok(detector.get_sessions(limit.unwrap_or(20)))
}
