fn main() {
    // Check if X11 libraries are available on Linux
    #[cfg(target_os = "linux")]
    {
        println!("cargo:rustc-link-lib=X11");
    }
    
    tauri_build::build()
}
