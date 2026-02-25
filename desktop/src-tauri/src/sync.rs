//! Sync functionality to backend API.

use reqwest::Client;
use serde::{Deserialize, Serialize};
use crate::tracker::ActivityEvent;
use std::time::Duration;

#[derive(Debug, Serialize)]
struct SyncRequest {
    activities: Vec<ActivityEvent>,
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
        
        let response = self.client
            .post(&url)
            .header("Authorization", format!("Bearer {}", token))
            .json(&SyncRequest { activities })
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;
        
        if !response.status().is_success() {
            return Err(format!("Sync failed with status: {}", response.status()));
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
