use std::sync::{Arc, Mutex};
use pdfium_render::prelude::*;
use lru::LruCache;
use std::num::NonZeroUsize;

pub mod pdf;

// 页面缓存数据
type PageCache = LruCache<String, (u32, u32, Vec<u8>)>;

// 应用状态 - 使用 Arc 共享
pub struct AppState {
    pub page_cache: Arc<Mutex<PageCache>>,
}

impl AppState {
    pub fn new() -> Self {
        let cache = LruCache::new(NonZeroUsize::new(50).unwrap());
        
        Self {
            page_cache: Arc::new(Mutex::new(cache)),
        }
    }
}

// 重新导出命令
pub use pdf::commands::load_pdf;
pub use pdf::commands::get_pdf_pages_info;
pub use pdf::commands::render_pdf_page;
