//! Privacy filtering for sensitive data protection.

use std::collections::HashSet;

pub struct PrivacyFilter {
    // Apps to never track
    blacklist: HashSet<String>,
    
    // Only track these apps (if not empty)
    whitelist: HashSet<String>,
    
    // Sensitive keywords in window titles
    sensitive_keywords: HashSet<String>,
    
    pub enabled: bool,
}

impl PrivacyFilter {
    pub fn new() -> Self {
        let mut filter = Self {
            blacklist: HashSet::new(),
            whitelist: HashSet::new(),
            sensitive_keywords: HashSet::new(),
            enabled: true,
        };
        
        // Default sensitive keywords
        filter.add_sensitive_keywords();
        filter.add_default_blacklist();
        
        filter
    }
    
    fn add_sensitive_keywords(&mut self) {
        // Password managers
        self.sensitive_keywords.insert("password".to_lowercase());
        self.sensitive_keywords.insert("1password".to_lowercase());
        self.sensitive_keywords.insert("lastpass".to_lowercase());
        self.sensitive_keywords.insert("bitwarden".to_lowercase());
        self.sensitive_keywords.insert("keepass".to_lowercase());
        
        // Private browsing
        self.sensitive_keywords.insert("incognito".to_lowercase());
        self.sensitive_keywords.insert("private browsing".to_lowercase());
        self.sensitive_keywords.insert("inprivate".to_lowercase());
        
        // Banking/Finance
        self.sensitive_keywords.insert("bank".to_lowercase());
        self.sensitive_keywords.insert("credit card".to_lowercase());
        self.sensitive_keywords.insert("payment".to_lowercase());
        
        // Health
        self.sensitive_keywords.insert("health".to_lowercase());
        self.sensitive_keywords.insert("medical".to_lowercase());
    }
    
    fn add_default_blacklist(&mut self) {
        // System utilities that shouldn't be tracked
        self.blacklist.insert("keychain access".to_lowercase());
        self.blacklist.insert("credential manager".to_lowercase());
        self.blacklist.insert("system preferences".to_lowercase());
        self.blacklist.insert("settings".to_lowercase());
    }
    
    /// Check if an app should be tracked
    pub fn should_track_app(&self, app_name: &str) -> bool {
        if !self.enabled {
            return true;
        }
        
        let app_lower = app_name.to_lowercase();
        
        // If blacklisted, don't track
        if self.blacklist.contains(&app_lower) {
            return false;
        }
        
        // If whitelist is not empty, only track whitelisted apps
        if !self.whitelist.is_empty() {
            return self.whitelist.contains(&app_lower);
        }
        
        true
    }
    
    /// Check if window title is sensitive
    pub fn is_sensitive_title(&self, title: &str) -> bool {
        if !self.enabled {
            return false;
        }
        
        let title_lower = title.to_lowercase();
        
        for keyword in &self.sensitive_keywords {
            if title_lower.contains(keyword) {
                return true;
            }
        }
        
        false
    }
    
    /// Redact sensitive title
    pub fn redact_title(&self, title: &str) -> String {
        if self.is_sensitive_title(title) {
            "[REDACTED]".to_string()
        } else {
            title.to_string()
        }
    }
    
    /// Add app to blacklist
    pub fn add_to_blacklist(&mut self, app_name: String) {
        self.blacklist.insert(app_name.to_lowercase());
    }
    
    /// Add app to whitelist
    pub fn add_to_whitelist(&mut self, app_name: String) {
        self.whitelist.insert(app_name.to_lowercase());
    }
    
    /// Remove from blacklist
    pub fn remove_from_blacklist(&mut self, app_name: &str) {
        self.blacklist.remove(&app_name.to_lowercase());
    }
    
    /// Get current blacklist
    pub fn get_blacklist(&self) -> Vec<String> {
        self.blacklist.iter().cloned().collect()
    }
    
    /// Get current whitelist
    pub fn get_whitelist(&self) -> Vec<String> {
        self.whitelist.iter().cloned().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_sensitive_title_detection() {
        let filter = PrivacyFilter::new();
        
        assert!(filter.is_sensitive_title("1Password - Login"));
        assert!(filter.is_sensitive_title("Chrome - Incognito Mode"));
        assert!(filter.is_sensitive_title("Bank of America - Sign In"));
        assert!(!filter.is_sensitive_title("Google - Search"));
    }
    
    #[test]
    fn test_blacklist() {
        let mut filter = PrivacyFilter::new();
        filter.add_to_blacklist("slack".to_string());
        
        assert!(!filter.should_track_app("Slack"));
        assert!(filter.should_track_app("Chrome"));
    }
}
