use serde::{Deserialize, Serialize};
use reqwest::Client;
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct UserProfile {
    pub full_name: String,
    pub email: String,
    pub account_type: String,
    pub timezone: String,
    pub two_factor_enabled: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TrackingSettings {
    pub enabled: bool,
    pub track_projects: bool,
    pub track_files: bool,
    pub track_commits: bool,
    pub track_documents: bool,
    pub track_ide: bool,
    pub track_browser: bool,
    pub track_writing: bool,
    pub track_communication: bool,
    pub track_video_calls: bool,
    pub idle_threshold_minutes: i32,
    pub pause_on_lock: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FocusSettings {
    pub enabled: bool,
    pub auto_detect_deep_work: bool,
    pub min_duration_minutes: i32,
    pub default_duration_minutes: i32,
    pub auto_break_minutes: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PrivacySettings {
    pub https_only: bool,
    pub filter_credit_cards: bool,
    pub filter_ssn: bool,
    pub filter_api_keys: bool,
    pub filter_emails: bool,
    pub local_encryption: bool,
    pub e2e_encryption: bool,
    pub retention_days: i32,
    pub auto_delete: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NotificationSettings {
    pub in_app_enabled: bool,
    pub email_enabled: bool,
    pub browser_enabled: bool,
    pub daily_summary: bool,
    pub deadline_reminders: bool,
    pub focus_reminders: bool,
    pub break_suggestions: bool,
    pub wellness_summary: bool,
    pub ai_insights: bool,
    pub sync_errors: bool,
    pub dnd_enabled: bool,
    pub dnd_from: String,
    pub dnd_to: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AllSettings {
    pub profile: UserProfile,
    pub tracking: TrackingSettings,
    pub focus: FocusSettings,
    pub privacy: PrivacySettings,
    pub notifications: NotificationSettings,
    pub theme: String,
}

pub struct SettingsManager {
    pub api_url: String,
    pub client: Client,
}

impl SettingsManager {
    pub fn new(api_url: String) -> Self {
        Self {
            api_url,
            client: Client::new(),
        }
    }

    pub async fn get_settings(&self, token: &str) -> Result<AllSettings, String> {
        let response = self.client
            .get(format!("{}/api/settings", self.api_url))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to get settings: {}", response.status()));
        }

        response.json::<AllSettings>()
            .await
            .map_err(|e| format!("Failed to parse settings: {}", e))
    }

    pub async fn update_profile(&self, token: &str, profile: UserProfile) -> Result<String, String> {
        let response = self.client
            .put(format!("{}/api/settings/profile", self.api_url))
            .header("Authorization", format!("Bearer {}", token))
            .json(&profile)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to update profile: {}", response.status()));
        }

        Ok("Profile updated successfully".to_string())
    }

    pub async fn update_tracking_settings(&self, token: &str, settings: TrackingSettings) -> Result<String, String> {
        let response = self.client
            .put(format!("{}/api/settings/tracking", self.api_url))
            .header("Authorization", format!("Bearer {}", token))
            .json(&settings)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to update tracking settings: {}", response.status()));
        }

        Ok("Tracking settings updated successfully".to_string())
    }

    pub async fn update_focus_settings(&self, token: &str, settings: FocusSettings) -> Result<String, String> {
        let response = self.client
            .put(format!("{}/api/settings/focus", self.api_url))
            .header("Authorization", format!("Bearer {}", token))
            .json(&settings)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to update focus settings: {}", response.status()));
        }

        Ok("Focus settings updated successfully".to_string())
    }

    pub async fn update_privacy_settings(&self, token: &str, settings: PrivacySettings) -> Result<String, String> {
        let response = self.client
            .put(format!("{}/api/settings/privacy", self.api_url))
            .header("Authorization", format!("Bearer {}", token))
            .json(&settings)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to update privacy settings: {}", response.status()));
        }

        Ok("Privacy settings updated successfully".to_string())
    }

    pub async fn update_notification_settings(&self, token: &str, settings: NotificationSettings) -> Result<String, String> {
        let response = self.client
            .put(format!("{}/api/settings/notifications", self.api_url))
            .header("Authorization", format!("Bearer {}", token))
            .json(&settings)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to update notification settings: {}", response.status()));
        }

        Ok("Notification settings updated successfully".to_string())
    }

    pub async fn change_password(&self, token: &str, old_password: &str, new_password: &str) -> Result<String, String> {
        let mut params = HashMap::new();
        params.insert("old_password", old_password);
        params.insert("new_password", new_password);

        let response = self.client
            .post(format!("{}/api/auth/change-password", self.api_url))
            .header("Authorization", format!("Bearer {}", token))
            .json(&params)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to change password: {}", response.status()));
        }

        Ok("Password changed successfully".to_string())
    }

    pub async fn enable_2fa(&self, token: &str) -> Result<HashMap<String, String>, String> {
        let response = self.client
            .post(format!("{}/api/auth/2fa/enable", self.api_url))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to enable 2FA: {}", response.status()));
        }

        response.json::<HashMap<String, String>>()
            .await
            .map_err(|e| format!("Failed to parse 2FA response: {}", e))
    }

    pub async fn disable_2fa(&self, token: &str, code: &str) -> Result<String, String> {
        let mut params = HashMap::new();
        params.insert("code", code);

        let response = self.client
            .post(format!("{}/api/auth/2fa/disable", self.api_url))
            .header("Authorization", format!("Bearer {}", token))
            .json(&params)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to disable 2FA: {}", response.status()));
        }

        Ok("2FA disabled successfully".to_string())
    }

    pub async fn export_data(&self, token: &str, format: &str) -> Result<Vec<u8>, String> {
        let response = self.client
            .get(format!("{}/api/data/export?format={}", self.api_url, format))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to export data: {}", response.status()));
        }

        response.bytes()
            .await
            .map(|b| b.to_vec())
            .map_err(|e| format!("Failed to download data: {}", e))
    }

    pub async fn create_backup(&self, token: &str) -> Result<String, String> {
        let response = self.client
            .post(format!("{}/api/backups/create", self.api_url))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to create backup: {}", response.status()));
        }

        Ok("Backup created successfully".to_string())
    }
}
