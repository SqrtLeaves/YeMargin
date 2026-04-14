pub mod commands;
#[cfg(test)]
mod commands_test;

use pdfium_render::prelude::*;
use serde::{Deserialize, Serialize};

// PDF 文档信息
#[derive(Debug, Serialize)]
pub struct PdfDocumentInfo {
    pub id: String,
    pub path: String,
    pub name: String,
    pub page_count: u16,
}

// 页面信息
#[derive(Debug, Serialize)]
pub struct PageInfo {
    pub width: f32,
    pub height: f32,
}

// 渲染结果
#[derive(Debug, Serialize)]
pub struct RenderedPage {
    pub data: Vec<u8>,  // RGBA 像素数据
    pub width: u32,
    pub height: u32,
}

// 主题设置
#[derive(Debug, Deserialize, Clone, Copy)]
#[serde(rename_all = "lowercase")]
pub enum Theme {
    Light,
    Dark,
    Sepia,
}

impl Theme {
    // 应用主题到像素数据
    pub fn apply_to_rgba(&self, data: &mut [u8]) {
        match self {
            Theme::Light => {} // 原样返回
            Theme::Dark => Self::apply_dark_theme(data),
            Theme::Sepia => Self::apply_sepia_theme(data),
        }
    }

    fn apply_dark_theme(data: &mut [u8]) {
        // 暗黑模式：反色并降低亮度
        for chunk in data.chunks_exact_mut(4) {
            let r = chunk[0] as f32 / 255.0;
            let g = chunk[1] as f32 / 255.0;
            let b = chunk[2] as f32 / 255.0;
            
            // 反色并调暗
            chunk[0] = ((1.0 - r) * 0.8 * 255.0) as u8;
            chunk[1] = ((1.0 - g) * 0.8 * 255.0) as u8;
            chunk[2] = ((1.0 - b) * 0.8 * 255.0) as u8;
            // Alpha 保持不变
        }
    }

    fn apply_sepia_theme(data: &mut [u8]) {
        // 护眼模式：应用棕褐色滤镜
        for chunk in data.chunks_exact_mut(4) {
            let r = chunk[0] as f32;
            let g = chunk[1] as f32;
            let b = chunk[2] as f32;
            
            // Sepia 矩阵
            let new_r = (r * 0.393 + g * 0.769 + b * 0.189).min(255.0);
            let new_g = (r * 0.349 + g * 0.686 + b * 0.168).min(255.0);
            let new_b = (r * 0.272 + g * 0.534 + b * 0.131).min(255.0);
            
            // 稍微调亮一点，更适合阅读
            chunk[0] = (new_r * 0.95 + 20.0).min(255.0) as u8;
            chunk[1] = (new_g * 0.95 + 15.0).min(255.0) as u8;
            chunk[2] = (new_b * 0.95 + 10.0).min(255.0) as u8;
        }
    }
}

// 渲染配置
pub struct RenderConfig {
    pub scale: f32,
    pub theme: Theme,
}

// 渲染 PDF 页面（从已缓存的字节加载）
pub fn render_page_from_bytes(
    pdfium: &Pdfium,
    bytes: &[u8],
    page_number: u16,
    config: RenderConfig,
) -> Result<RenderedPage, PdfiumError> {
    // 加载文档
    let document = pdfium.load_pdf_from_byte_slice(bytes, None)?;
    
    // 获取页面（页码从 0 开始）
    let page = document.pages().get(page_number - 1)?;
    
    // 获取页面尺寸（以 points 为单位，72 dpi）
    let width_points = page.width();
    let height_points = page.height();
    
    // 计算渲染尺寸（像素）
    let scale = config.scale;
    let width = ((width_points.value / 72.0) * 96.0 * scale) as i32;
    let height = ((height_points.value / 72.0) * 96.0 * scale) as i32;
    
    // 渲染为位图
    let bitmap = page.render(
        width,
        height,
        None,  // matrix transform
    )?;
    
    // 获取 RGBA 数据
    let mut rgba_data = bitmap.as_raw_bytes().to_vec();
    
    // 应用主题
    config.theme.apply_to_rgba(&mut rgba_data);
    
    Ok(RenderedPage {
        data: rgba_data,
        width: width as u32,
        height: height as u32,
    })
}

// 兼容旧接口：直接从文件路径渲染
pub fn render_page(
    _pdfium: &Pdfium,
    path: &str,
    page_number: u16,
    config: RenderConfig,
) -> Result<RenderedPage, PdfiumError> {
    let pdfium = Pdfium::default();
    let bytes = std::fs::read(path).map_err(|e| PdfiumError::IoError(e))?;
    render_page_from_bytes(&pdfium, &bytes, page_number, config)
}

// 获取文档信息
pub fn get_document_info(path: &str) -> Result<PdfDocumentInfo, PdfiumError> {
    let pdfium = Pdfium::default();
    let document = pdfium.load_pdf_from_file(path, None)?;
    
    // 从路径提取文件名
    let name = std::path::Path::new(path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Unknown")
        .to_string();
    
    Ok(PdfDocumentInfo {
        id: uuid::Uuid::new_v4().to_string(),
        path: path.to_string(),
        name,
        page_count: document.pages().len() as u16,
    })
}

// 获取所有页面的尺寸信息（从字节加载，用于后端缓存场景）
pub fn get_pages_info_from_bytes(
    pdfium: &Pdfium,
    bytes: &[u8],
) -> Result<Vec<PageInfo>, PdfiumError> {
    let document = pdfium.load_pdf_from_byte_slice(bytes, None)?;
    
    let mut pages = Vec::new();
    for i in 0..document.pages().len() {
        let page = document.pages().get(i)?;
        let width = page.width().value;
        let height = page.height().value;
        pages.push(PageInfo {
            width,
            height,
        });
    }
    
    Ok(pages)
}

// 兼容旧接口
pub fn get_pages_info(path: &str) -> Result<Vec<PageInfo>, PdfiumError> {
    let pdfium = Pdfium::default();
    let document = pdfium.load_pdf_from_file(path, None)?;
    
    let mut pages = Vec::new();
    for i in 0..document.pages().len() {
        let page = document.pages().get(i)?;
        let width = page.width().value;
        let height = page.height().value;
        pages.push(PageInfo {
            width,
            height,
        });
    }
    
    Ok(pages)
}
