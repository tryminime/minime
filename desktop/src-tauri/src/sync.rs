//! Sync functionality to backend API.

use reqwest::Client;
use serde::{Deserialize, Serialize};
use crate::tracker::{ActivityEvent, ActivityType};
use std::time::Duration;

/// Maps ActivityEvent to the backend's ActivityCreate schema
#[derive(Debug, Serialize)]
struct ActivityCreatePayload {
    #[serde(rename = "type")]
    activity_type: String,
    source: String,
    app: Option<String>,
    title: Option<String>,
    domain: Option<String>,
    url: Option<String>,
    duration_seconds: Option<i64>,
    data: serde_json::Value,
}

#[derive(Debug, Serialize)]
struct SyncRequest {
    activities: Vec<ActivityCreatePayload>,
}

#[derive(Debug, Deserialize)]
pub struct SyncResponse {
    pub synced: usize,
    pub failed: usize,
    pub message: String,
}

pub struct SyncManager {
    client: Client,
    pub api_url: String,
    pub access_token: Option<String>,
}

impl SyncManager {
    pub fn new(api_url: String) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .unwrap();
        
        Self {
            client,
            api_url,
            access_token: None,
        }
    }
    
    pub fn set_token(&mut self, token: String) {
        self.access_token = Some(token);
    }
    
    pub async fn sync_activities(&self, activities: Vec<ActivityEvent>) -> Result<SyncResponse, String> {
        let token = self.access_token.as_ref()
            .ok_or_else(|| "No access token set".to_string())?;
        
        let url = format!("{}/api/v1/activities/sync", self.api_url);
        
        // Map ActivityEvent to the backend's ActivityCreate schema
        let payloads: Vec<ActivityCreatePayload> = activities.into_iter().map(|a| {
            let type_str = match a.activity_type {
                ActivityType::WindowFocus => "window_focus",
                ActivityType::AppSwitch   => "app_focus",
                ActivityType::Idle        => "idle",
                ActivityType::Break       => "break",
                ActivityType::FocusPeriod => "focus_period",
                ActivityType::ReadingAnalytics => "reading_analytics",
            }.to_string();

            let mut data = serde_json::json!({
                "device_id": a.device_id,
                "is_idle": a.is_idle,
                "timestamp": a.timestamp.to_rfc3339(),
            });

            // Attach input metrics if present
            if let Some(ref metrics) = a.input_metrics {
                data["input_metrics"] = serde_json::json!({
                    "keystrokes_per_minute": metrics.keystrokes_per_minute,
                    "mouse_distance_px": metrics.mouse_distance_px,
                    "mouse_click_count": metrics.mouse_click_count,
                    "activity_level": metrics.activity_level,
                });
            }
            
            ActivityCreatePayload {
                activity_type: type_str,
                source: "desktop".to_string(),
                app: a.app_name.clone(),
                title: a.window_title.clone(),
                domain: a.domain.clone(),
                url: None,
                duration_seconds: a.duration_seconds,
                data,
            }
        }).collect();
        
        let response = self.client
            .post(&url)
            .header("Authorization", format!("Bearer {}", token))
            .json(&SyncRequest { activities: payloads })
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;
        
        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!("Sync failed with status: {} — {}", status, body));
        }
        
        response.json::<SyncResponse>()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))
    }
    
    pub async fn login(&mut self, email: &str, password: &str) -> Result<String, String> {
        #[derive(Serialize)]
        struct LoginRequest {
            email: String,
            password: String,
        }
        
        #[derive(Deserialize)]
        struct LoginResponse {
            access_token: String,
            refresh_token: String,
        }
        
        let url = format!("{}/api/v1/auth/login", self.api_url);
        
        let response = self.client
            .post(&url)
            .json(&LoginRequest {
                email: email.to_string(),
                password: password.to_string(),
            })
            .send()
            .await
            .map_err(|e| format!("Login request failed: {}", e))?;
        
        if !response.status().is_success() {
            return Err(format!("Login failed with status: {}", response.status()));
        }
        
        let login_response = response.json::<LoginResponse>()
            .await
            .map_err(|e| format!("Failed to parse login response: {}", e))?;
        
        self.access_token = Some(login_response.access_token.clone());
        
        Ok(login_response.access_token)
    }
}
