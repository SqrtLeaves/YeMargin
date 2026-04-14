use tauri::State;
use serde::Deserialize;
use crate::AppState;
use super::*;
use std::fs;

// 加载 PDF 命令
#[tauri::command]
pub fn load_pdf(path: String) -> Result<PdfDocumentInfo, String> {
    get_document_info(&path).map_err(|e| e.to_string())
}

// 获取 PDF 页面信息
#[tauri::command]
pub fn get_pdf_pages_info(state: State<AppState>, path: String) -> Result<Vec<PageInfo>, String> {
    // 优先从文件缓存读取
    {
        let file_cache = state.file_cache.lock().unwrap();
        if let Some(bytes) = file_cache.get(&path) {
            let pdfium = state.pdfium.lock().unwrap();
            return get_pages_info_from_bytes(&pdfium, bytes).map_err(|e| e.to_string());
        }
    }
    // 否则读取文件并缓存
    let bytes = fs::read(&path).map_err(|e| e.to_string())?;
    {
        let mut file_cache = state.file_cache.lock().unwrap();
        file_cache.insert(path.clone(), bytes.clone());
    }
    let pdfium = state.pdfium.lock().unwrap();
    get_pages_info_from_bytes(&pdfium, &bytes).map_err(|e| e.to_string())
}

// 渲染 PDF 页面请求参数
#[derive(Debug, Deserialize)]
pub struct RenderPageRequest {
    pub path: String,
    pub page_number: u16,
    pub scale: f32,
    pub theme: Theme,
}

// 渲染 PDF 页面
#[tauri::command]
pub fn render_pdf_page(
    state: State<AppState>,
    path: String,
    page_number: u16,
    scale: f32,
    theme: Theme,
) -> Result<RenderedPage, String> {
    // 检查缓存
    let cache_key = format!("{}:{}:{}:{:?}", path, page_number, scale, theme);
    {
        let mut cache = state.page_cache.lock().unwrap();
        if let Some((width, height, data)) = cache.get(&cache_key) {
            return Ok(RenderedPage {
                data: data.clone(),
                width: *width,
                height: *height,
            });
        }
    }

    // 优先从文件缓存读取
    let bytes = {
        let mut file_cache = state.file_cache.lock().unwrap();
        if let Some(b) = file_cache.get(&path) {
            b.clone()
        } else {
            let b = fs::read(&path).map_err(|e| e.to_string())?;
            file_cache.insert(path.clone(), b.clone());
            b
        }
    };

    // 渲染页面（复用 Pdfium 实例和文件缓存）
    let pdfium = state.pdfium.lock().unwrap();
    let config = RenderConfig { scale, theme };
    let result = render_page_from_bytes(&pdfium, &bytes, page_number, config)
        .map_err(|e| e.to_string())?;

    // 存入缓存
    {
        let mut cache = state.page_cache.lock().unwrap();
        cache.put(cache_key, (result.width, result.height, result.data.clone()));
    }

    Ok(result)
}

// 读取 PDF 文件内容为字节数组
#[tauri::command]
pub fn read_pdf_bytes(path: String) -> Result<Vec<u8>, String> {
    fs::read(&path).map_err(|e| e.to_string())
}

// 提取页面文本（用于搜索功能）
#[tauri::command]
pub fn extract_page_text(state: State<AppState>, path: String, page_number: u16) -> Result<String, String> {
    // 优先从文件缓存读取
    let bytes = {
        let mut file_cache = state.file_cache.lock().unwrap();
        if let Some(b) = file_cache.get(&path) {
            b.clone()
        } else {
            let b = fs::read(&path).map_err(|e| e.to_string())?;
            file_cache.insert(path.clone(), b.clone());
            b
        }
    };

    let pdfium = state.pdfium.lock().unwrap();
    let document = pdfium.load_pdf_from_byte_slice(&bytes, None)
        .map_err(|e| e.to_string())?;
    
    let page = document.pages().get(page_number - 1)
        .map_err(|e| e.to_string())?;
    
    let text = page.text().map_err(|e| e.to_string())?;
    let all_text: String = text.all();
    
    Ok(all_text)
}
