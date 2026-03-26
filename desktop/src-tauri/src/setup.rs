#[allow(unused_imports)]
use tauri::State;
use std::process::Command;
use std::fs;
use std::path::PathBuf;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use crate::AppState;

/// Check if Python backend is set up, and install dependencies if needed
#[tauri::command]
pub async fn check_backend_status() -> Result<bool, String> {
    println!("=== Starting Backend Status Check ===");
    
    // Check if Python 3 is installed
    let python_check = Command::new("python3")
        .arg("--version")
        .output();
    
    if python_check.is_err() {
        return Err("Python 3 is not installed. Please install Python 3.8 or higher from python.org".to_string());
    }
    
    println!("Python 3 is installed");

    // Get the backend directory path
    let backend_dir = get_backend_dir()?;
    println!("Backend directory: {:?}", backend_dir);
    
    let venv_dir = backend_dir.join("venv");
    
    // Check if venv exists, if not create it
    if !venv_dir.exists() {
        println!("Creating Python virtual environment...");
        
        let create_venv = Command::new("python3")
            .args(&["-m", "venv", "venv"])
            .current_dir(&backend_dir)
            .output()
            .map_err(|e| format!("Failed to create venv: {}", e))?;
        
        if !create_venv.status.success() {
            let error_msg = String::from_utf8_lossy(&create_venv.stderr);
            return Err(format!("Failed to create virtual environment: {}", error_msg));
        }
        
        println!("Virtual environment created!");
    } else {
        println!("Virtual environment already exists");
    }
    
    // Install/update dependencies
    println!("Installing Python dependencies...");
    let pip_path = if cfg!(windows) {
        venv_dir.join("Scripts").join("pip")
    } else {
        venv_dir.join("bin").join("pip")
    };
    
    let requirements_file = backend_dir.join("requirements.txt");
    if requirements_file.exists() {
        let install = Command::new(&pip_path)
            .args(&["install", "-q", "-r", "requirements.txt"])
            .current_dir(&backend_dir)
            .output()
            .map_err(|e| format!("Failed to install dependencies: {}", e))?;
        
        if !install.status.success() {
            let error_msg = String::from_utf8_lossy(&install.stderr);
            println!("Warning: Some dependencies may have failed: {}", error_msg);
            // Don't fail completely - continue anyway
        } else {
            println!("Dependencies installed successfully!");
        }
    }
    
    println!("=== Backend Status Check Complete ===");
    Ok(true)
}

/// Helper to get backend directory
fn get_backend_dir() -> Result<PathBuf, String> {
    // Get current executable or working directory
    let current_dir = std::env::current_dir()
        .map_err(|e| format!("Failed to get current directory: {}", e))?;
    
    println!("Current directory: {:?}", current_dir);
    
    // Check multiple possible locations
    let possible_paths = vec![
        // When running from desktop/src-tauri
        current_dir.parent().and_then(|p| p.parent()).map(|p| p.join("backend")),
        // When running from desktop  
        current_dir.parent().map(|p| p.join("backend")),
        // Direct backend sibling
        Some(current_dir.join("../backend")),
        Some(current_dir.join("../../backend")),
        // Absolute path as fallback (Linux)
        Some(PathBuf::from("/home/ansari/Documents/MiniMe/backend")),
    ];
    
    for path_opt in possible_paths {
        if let Some(path) = path_opt {
            println!("Checking path: {:?}", path);
            if path.exists() {
                let main_py = path.join("main.py");
                if main_py.exists() {
                    println!("Found backend at: {:?}", path);
                    return Ok(path);
                }
            }
        }
    }
    
    Err("Backend directory not found. Checked common locations but couldn't find main.py".to_string())
}

/// Check if Ollama is already installed
#[tauri::command]
pub async fn check_ollama_installed() -> Result<bool, String> {
    log::info!("Checking if Ollama is installed...");
    
    let output = Command::new("ollama")
        .arg("--version")
        .output();
    
    match output {
        Ok(output) if output.status.success() => {
            log::info!("Ollama is already installed");
            Ok(true)
        },
        _ => {
            log::info!("Ollama not found");
            Ok(false)
        }
    }
}

/// Install Ollama automatically
#[tauri::command]
pub async fn install_ollama() -> Result<bool, String> {
    log::info!("Installing Ollama...");
    
    // Detect OS and install accordingly
    #[cfg(target_os = "linux")]
    {
        // Use curl to download and run install script
        let output = Command::new("sh")
            .arg("-c")
            .arg("curl -fsSL https://ollama.com/install.sh | sh")
            .output()
            .map_err(|e| format!("Failed to run install script: {}", e))?;
        
        if output.status.success() {
            log::info!("Ollama installed successfully");
            Ok(true)
        } else {
            let error = String::from_utf8_lossy(&output.stderr);
            Err(format!("Ollama installation failed: {}", error))
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        // Download and install .app bundle
        let output = Command::new("sh")
            .arg("-c")
            .arg("curl -fsSL https://ollama.com/install.sh | sh")
            .output()
            .map_err(|e| format!("Failed to run install script: {}", e))?;
        
        if output.status.success() {
            Ok(true)
        } else {
            Err("Ollama installation failed".to_string())
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        // Windows: Download installer and run
        Err("Please download Ollama from https://ollama.com/download/windows manually".to_string())
    }
}

/// Download and pull an Ollama model
#[tauri::command]
pub async fn download_ollama_model(model: String) -> Result<bool, String> {
    log::info!("Downloading Ollama model: {}", model);
    
    // Run ollama pull command (this can take a long time)
    // Use spawn to avoid blocking, but wait for completion
    let mut child = Command::new("ollama")
        .arg("pull")
        .arg(&model)
        .spawn()
        .map_err(|e| format!("Failed to start model download: {}", e))?;
    
    // Wait for the process to complete
    let status = child.wait()
        .map_err(|e| format!("Failed waiting for download: {}", e))?;
    
    if status.success() {
        log::info!("Model {} downloaded successfully", model);
        Ok(true)
    } else {
        let error = format!("Model download failed with exit code: {:?}", status.code());
        log::error!("{}", error);
        Err(error)
    }
}

/// Run database migrations
#[tauri::command]
pub async fn run_database_migrations() -> Result<bool, String> {
    log::info!("Running database migrations...");
    
    let backend_dir = get_backend_dir()?;
    
    // Check if migration file exists
    let sql_path = backend_dir
        .join("database")
        .join("schemas")
        .join("002_settings_ai_chat.sql");
    
    if !sql_path.exists() {
        log::warn!("Migration file not found, skipping database setup");
        return Ok(true); // Non-blocking
    }
    
    // Check if Python and psycopg2 are available
    let python_path = match get_python_path(&backend_dir) {
        Ok(path) => path,
        Err(_) => {
            log::warn!("Python not found, skipping migrations");
            return Ok(true);
        }
    };
    
    // Check if DATABASE_URL is configured
    let db_url = match get_database_url() {
        Ok(url) if url.contains("postgresql") => url,
        _ => {
            log::info!("Database not configured, skipping migrations");
            return Ok(true);
        }
    };
    
    // Read SQL file
    let sql_content = fs::read_to_string(&sql_path)
        .map_err(|e| format!("Failed to read migration file: {}", e))?;
    
    // Execute SQL using Python script
    let output = Command::new(python_path)
        .arg("-c")
        .arg(format!(
            "import psycopg2; conn = psycopg2.connect('{}'); cur = conn.cursor(); cur.execute('''{}'''); conn.commit(); conn.close()",
            db_url,
            sql_content
        ))
        .current_dir(&backend_dir)
        .output()
        .map_err(|e| format!("Failed to run migrations: {}", e))?;
    
    if output.status.success() {
        log::info!("Database migrations completed");
        Ok(true)
    } else {
        let error = String::from_utf8_lossy(&output.stderr);
        log::warn!("Migration failed: {}, continuing anyway...", error);
        Ok(true) // Non-blocking
    }
}

/// Configure environment variables
#[tauri::command]
pub async fn configure_environment(config: serde_json::Value) -> Result<bool, String> {
    log::info!("Configuring environment...");
    
    let backend_dir = get_backend_dir()?;
    let env_path = backend_dir.parent().unwrap().join(".env");
    
    // Read existing .env or create from template
    let env_template_path = backend_dir.parent().unwrap().join(".env.example");
    let mut env_content = if env_path.exists() {
        fs::read_to_string(&env_path)
            .map_err(|e| format!("Failed to read .env: {}", e))?
    } else {
        fs::read_to_string(&env_template_path)
            .map_err(|e| format!("Failed to read .env.example: {}", e))?
    };
    
    // Update configuration values
    if let Some(use_ollama) = config.get("use_ollama").and_then(|v| v.as_bool()) {
        env_content = update_env_var(&env_content, "USE_OLLAMA", &use_ollama.to_string());
    }
    
    if let Some(api_key) = config.get("openai_api_key").and_then(|v| v.as_str()) {
        if !api_key.is_empty() {
            env_content = update_env_var(&env_content, "OPENAI_API_KEY", api_key);
        }
    }
    
    if let Some(model) = config.get("ollama_model").and_then(|v| v.as_str()) {
        env_content = update_env_var(&env_content, "OLLAMA_MODEL", model);
    }
    
    // Write updated .env
    fs::write(&env_path, env_content)
        .map_err(|e| format!("Failed to write .env: {}", e))?;
    
    log::info!("Environment configured");
    Ok(true)
}

/// Start backend services (FastAPI server and optionally Ollama)
#[tauri::command]
pub async fn start_backend_services(use_ollama: bool) -> Result<bool, String> {
    log::info!("Starting backend services...");
    
    let backend_dir = get_backend_dir()?;
    let python_path = get_python_path(&backend_dir)?;
    
    // Start Ollama if needed
    if use_ollama {
        log::info!("Starting Ollama server...");
        Command::new("ollama")
            .arg("serve")
            .spawn()
            .map_err(|e| format!("Failed to start Ollama: {}", e))?;
        
        // Wait a bit for Ollama to start
        std::thread::sleep(std::time::Duration::from_secs(2));
    }
    
    // Start FastAPI backend
    log::info!("Starting FastAPI server...");
    Command::new(python_path)
        .arg("-m")
        .arg("uvicorn")
        .arg("backend.main:app")
        .arg("--reload")
        .arg("--port")
        .arg("8000")
        .current_dir(backend_dir.parent().unwrap())
        .spawn()
        .map_err(|e| format!("Failed to start backend: {}", e))?;
    
    log::info!("Backend services started");
    Ok(true)
}

// Helper functions

fn get_python_path(backend_dir: &PathBuf) -> Result<PathBuf, String> {
    let python_path = if cfg!(windows) {
        backend_dir.join("venv").join("Scripts").join("python.exe")
    } else {
        backend_dir.join("venv").join("bin").join("python")
    };
    
    if !python_path.exists() {
        return Err("Python venv not found. Please run setup first.".to_string());
    }
    
    Ok(python_path)
}

fn get_database_url() -> Result<String, String> {
    // Read from .env or use default
    Ok("postgresql://minime:minime_dev_password@localhost:5432/minime".to_string())
}

fn update_env_var(content: &str, key: &str, value: &str) -> String {
    let lines: Vec<&str> = content.lines().collect();
    let mut updated_lines = Vec::new();
    let mut found = false;
    
    for line in lines {
        if line.starts_with(&format!("{}=", key)) || line.starts_with(&format!("# {}=", key)) {
            updated_lines.push(format!("{}={}", key, value));
            found = true;
        } else {
            updated_lines.push(line.to_string());
        }
    }
    
    // If key wasn't found, add it
    if !found {
        updated_lines.push(format!("{}={}", key, value));
    }
    
    updated_lines.join("\n")
}
