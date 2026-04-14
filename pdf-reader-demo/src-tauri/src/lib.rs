use std::sync::{Arc, Mutex};
use pdfium_render::prelude::*;
use lru::LruCache;
use std::num::NonZeroUsize;
use std::collections::HashMap;

pub mod pdf;

// 页面缓存数据
type PageCache = LruCache<String, (u32, u32, Vec<u8>)>;

// 应用状态 - 使用 Arc 共享
pub struct AppState {
    pub page_cache: Arc<Mutex<PageCache>>,
    // 缓存 Pdfium 实例，避免每次渲染都重新绑定动态库
    pub pdfium: Arc<Mutex<Pdfium>>,
    // 缓存 PDF 文件内容，避免每次渲染都重新读磁盘
    pub file_cache: Arc<Mutex<HashMap<String, Vec<u8>>>>,
}

impl AppState {
    pub fn new() -> Self {
        let cache = LruCache::new(NonZeroUsize::new(50).unwrap());
        let pdfium = Pdfium::default();
        
        Self {
            page_cache: Arc::new(Mutex::new(cache)),
            pdfium: Arc::new(Mutex::new(pdfium)),
            file_cache: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

// 重新导出命令
pub use pdf::commands::get_pdf_pages_info;
pub use pdf::commands::render_pdf_page;
pub use pdf::commands::read_pdf_bytes;
pub use pdf::commands::extract_page_text;
