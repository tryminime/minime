use serde::{Deserialize, Serialize};
use reqwest::Client;
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatMessage {
    pub role: String, // "user" or "assistant"
    pub content: String,
    pub timestamp: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatRequest {
    pub message: String,
    pub conversation_id: Option<String>,
    pub context: Option<HashMap<String, String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatResponse {
    pub message: String,
    pub conversation_id: String,
    pub timestamp: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConversationHistory {
    pub conversation_id: String,
    pub messages: Vec<ChatMessage>,
}

pub struct AIChatManager {
    pub api_url: String,
    pub client: Client,
}

impl AIChatManager {
    pub fn new(api_url: String) -> Self {
        Self {
            api_url,
            client: Client::new(),
        }
    }

    pub async fn send_message(
        &self,
        token: &str,
        request: ChatRequest,
    ) -> Result<ChatResponse, String> {
        let response = self.client
            .post(format!("{}/api/ai/chat", self.api_url))
            .header("Authorization", format!("Bearer {}", token))
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to send message: {}", response.status()));
        }

        response.json::<ChatResponse>()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))
    }

    pub async fn get_conversation_history(
        &self,
        token: &str,
        conversation_id: &str,
    ) -> Result<ConversationHistory, String> {
        let response = self.client
            .get(format!("{}/api/ai/conversations/{}", self.api_url, conversation_id))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to get conversation: {}", response.status()));
        }

        response.json::<ConversationHistory>()
            .await
            .map_err(|e| format!("Failed to parse conversation: {}", e))
    }

    pub async fn get_all_conversations(
        &self,
        token: &str,
    ) -> Result<Vec<ConversationHistory>, String> {
        let response = self.client
            .get(format!("{}/api/ai/conversations", self.api_url))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to get conversations: {}", response.status()));
        }

        response.json::<Vec<ConversationHistory>>()
            .await
            .map_err(|e| format!("Failed to parse conversations: {}", e))
    }

    // Data query methods for AI to access user data
    pub async fn get_focus_score(&self, token: &str) -> Result<HashMap<String, serde_json::Value>, String> {
        let response = self.client
            .get(format!("{}/api/analytics/focus-score", self.api_url))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to get focus score: {}", response.status()));
        }

        response.json::<HashMap<String, serde_json::Value>>()
            .await
            .map_err(|e| format!("Failed to parse focus score: {}", e))
    }

    pub async fn get_wellness_score(&self, token: &str) -> Result<HashMap<String, serde_json::Value>, String> {
        let response = self.client
            .get(format!("{}/api/analytics/wellness", self.api_url))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to get wellness score: {}", response.status()));
        }

        response.json::<HashMap<String, serde_json::Value>>()
            .await
            .map_err(|e| format!("Failed to parse wellness score: {}", e))
    }

    pub async fn generate_weekly_report(&self, token: &str) -> Result<String, String> {
        let response = self.client
            .post(format!("{}/api/reports/weekly", self.api_url))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to generate report: {}", response.status()));
        }

        response.text()
            .await
            .map_err(|e| format!("Failed to get report: {}", e))
    }
}
