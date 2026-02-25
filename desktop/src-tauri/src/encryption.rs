//! AES-256-GCM encryption for sensitive data.

use ring::aead::{Aad, LessSafeKey, Nonce, UnboundKey, AES_256_GCM, NONCE_LEN};
use ring::error::Unspecified;
use ring::rand::{SecureRandom, SystemRandom};

pub struct Encryptor {
    key: Vec<u8>,
    rng: SystemRandom,
}

impl Encryptor {
    /// Create new encryptor with a random key
    pub fn new() -> Result<Self, Unspecified> {
        let mut key = vec![0u8; 32]; // 256 bits
        let rng = SystemRandom::new();
        rng.fill(&mut key)?;
        
        Ok(Self { key, rng })
    }
    
    /// Create encryptor from existing key
    pub fn from_key(key: Vec<u8>) -> Result<Self, Unspecified> {
        if key.len() != 32 {
            return Err(Unspecified);
        }
        
        Ok(Self {
            key,
            rng: SystemRandom::new(),
        })
    }
    
    /// Get the encryption key (for storage)
    pub fn get_key(&self) -> &[u8] {
        &self.key
    }
    
    /// Encrypt data
    pub fn encrypt(&self, data: &[u8]) -> Result<Vec<u8>, Unspecified> {
        let unbound_key = UnboundKey::new(&AES_256_GCM, &self.key)?;
        let key = LessSafeKey::new(unbound_key);
        
        let mut nonce_bytes = [0u8; NONCE_LEN];
        self.rng.fill(&mut nonce_bytes)?;
        let nonce = Nonce::assume_unique_for_key(nonce_bytes);
        
        let mut in_out = data.to_vec();
        key.seal_in_place_append_tag(nonce, Aad::empty(), &mut in_out)
            .map_err(|_| Unspecified)?;
        
        // Prepend nonce to ciphertext
        let mut result = nonce_bytes.to_vec();
        result.extend_from_slice(&in_out);
        
        Ok(result)
    }
    
    /// Decrypt data
    pub fn decrypt(&self, data: &[u8]) -> Result<Vec<u8>, Unspecified> {
        if data.len() < NONCE_LEN + 16 { // nonce + tag
            return Err(Unspecified);
        }
        
        let nonce_bytes = &data[..NONCE_LEN];
        let ciphertext = &data[NONCE_LEN..];
        
        let mut nonce_array = [0u8; NONCE_LEN];
        nonce_array.copy_from_slice(nonce_bytes);
        let nonce = Nonce::assume_unique_for_key(nonce_array);
        
        let unbound_key = UnboundKey::new(&AES_256_GCM, &self.key)?;
        let key = LessSafeKey::new(unbound_key);
        
        let mut in_out = ciphertext.to_vec();
        let plaintext = key.open_in_place(nonce, Aad::empty(), &mut in_out)
            .map_err(|_| Unspecified)?;
        
        Ok(plaintext.to_vec())
    }
    
    /// Encrypt string to base64
    pub fn encrypt_string(&self, data: &str) -> Result<String, Unspecified> {
        let encrypted = self.encrypt(data.as_bytes())?;
        Ok(base64::encode(encrypted))
    }
    
    /// Decrypt base64 string
    pub fn decrypt_string(&self, data: &str) -> Result<String, Unspecified> {
        let encrypted = base64::decode(data).map_err(|_| Unspecified)?;
        let decrypted = self.decrypt(&encrypted)?;
        String::from_utf8(decrypted).map_err(|_| Unspecified)
    }
}

/// Convenience wrapper providing static encrypt/decrypt methods.
/// Used by screenshot.rs which needs fire-and-forget encryption.
pub struct EncryptionManager;

impl EncryptionManager {
    /// Encrypt data with a fresh random key (key is prepended to output)
    pub fn encrypt_data(data: &[u8]) -> Result<Vec<u8>, Unspecified> {
        let encryptor = Encryptor::new()?;
        let encrypted = encryptor.encrypt(data)?;
        // Prepend the 32-byte key so we can decrypt later
        let mut out = encryptor.get_key().to_vec();
        out.extend_from_slice(&encrypted);
        Ok(out)
    }

    /// Decrypt data that was encrypted with encrypt_data
    pub fn decrypt_data(data: &[u8]) -> Result<Vec<u8>, Unspecified> {
        if data.len() < 32 {
            return Err(Unspecified);
        }
        let key = data[..32].to_vec();
        let ciphertext = &data[32..];
        let encryptor = Encryptor::from_key(key)?;
        encryptor.decrypt(ciphertext)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_encrypt_decrypt() {
        let encryptor = Encryptor::new().unwrap();
        let plaintext = b"Hello, World!";
        
        let encrypted = encryptor.encrypt(plaintext).unwrap();
        let decrypted = encryptor.decrypt(&encrypted).unwrap();
        
        assert_eq!(plaintext, decrypted.as_slice());
    }
    
    #[test]
    fn test_encrypt_decrypt_string() {
        let encryptor = Encryptor::new().unwrap();
        let plaintext = "Hello, World!";
        
        let encrypted = encryptor.encrypt_string(plaintext).unwrap();
        let decrypted = encryptor.decrypt_string(&encrypted).unwrap();
        
        assert_eq!(plaintext, decrypted);
    }
}
