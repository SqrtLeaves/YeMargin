// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use pdf_reader_demo_lib::AppState;

fn main() {
    env_logger::init();
    
    // 初始化应用状态
    let app_state = AppState::new();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            pdf_reader_demo_lib::load_pdf,
            pdf_reader_demo_lib::get_pdf_pages_info,
            pdf_reader_demo_lib::render_pdf_page,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
