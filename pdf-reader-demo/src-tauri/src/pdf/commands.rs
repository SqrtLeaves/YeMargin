use tauri::State;
use serde::Deserialize;
use crate::AppState;
use super::*;

// 加载 PDF 命令
#[tauri::command]
pub fn load_pdf(path: String) -> Result<PdfDocumentInfo, String> {
    get_document_info(&path).map_err(|e| e.to_string())
}

// 获取 PDF 页面信息
#[tauri::command]
pub fn get_pdf_pages_info(path: String) -> Result<Vec<PageInfo>, String> {
    get_pages_info(&path).map_err(|e| e.to_string())
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

    // 渲染页面
    let pdfium = Pdfium::default();
    let config = RenderConfig { scale, theme };
    let result = render_page(&pdfium, &path, page_number, config)
        .map_err(|e| e.to_string())?;

    // 存入缓存
    {
        let mut cache = state.page_cache.lock().unwrap();
        cache.put(cache_key, (result.width, result.height, result.data.clone()));
    }

    Ok(result)
}

// 提取页面文本（用于搜索功能）
#[tauri::command]
pub fn extract_page_text(path: String, page_number: u16) -> Result<String, String> {
    let pdfium = Pdfium::default();
    let document = pdfium.load_pdf_from_file(&path, None)
        .map_err(|e| e.to_string())?;
    
    let page = document.pages().get(page_number - 1)
        .map_err(|e| e.to_string())?;
    
    let text = page.text().map_err(|e| e.to_string())?;
    let all_text: String = text.all();
    
    Ok(all_text)
}
