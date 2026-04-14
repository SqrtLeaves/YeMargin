// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use pdf_reader_demo_lib::AppState;

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;
#[cfg(target_os = "macos")]
use objc::runtime::Object;
#[cfg(target_os = "macos")]
use tauri::Manager;

fn main() {
    env_logger::init();
    
    // 初始化应用状态
    let app_state = AppState::new();

    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            pdf_reader_demo_lib::get_pdf_pages_info,
            pdf_reader_demo_lib::render_pdf_page,
            pdf_reader_demo_lib::read_pdf_bytes,
            pdf_reader_demo_lib::extract_page_text,
        ]);

    #[cfg(target_os = "macos")]
    {
        builder = builder.setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            window.with_webview(|webview| {
                let wkwebview = webview.inner() as *mut Object;
                unsafe {
                    let _: () = msg_send![wkwebview, setAllowsMagnification: false];
                }
            }).unwrap();
            Ok(())
        });
    }

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
