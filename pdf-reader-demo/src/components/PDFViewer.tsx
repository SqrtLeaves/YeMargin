import { useEffect, useRef, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '@/stores/appStore';
import type { PDFDocument, PDFPage } from '@/types';
import PDFPageComponent from './PDFPage';

interface PDFViewerProps {
  document: PDFDocument;
}

export default function PDFViewer({ document }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { settings, setCurrentPage } = useAppStore();
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const renderQueueRef = useRef<number[]>([]);
  const isRenderingRef = useRef(false);

  // 初始化页面信息
  useEffect(() => {
    const initPages = async () => {
      setIsLoading(true);
      try {
        // 获取所有页面的尺寸
        const pageInfos = await invoke<Array<{ width: number; height: number }>>(
          'get_pdf_pages_info',
          { path: document.path }
        );

        const newPages: PDFPage[] = pageInfos.map((info, index) => ({
          number: index + 1,
          width: info.width,
          height: info.height,
          rendered: false,
        }));

        setPages(newPages);
        
        // 优先加载当前页和附近页面
        const currentPage = document.currentPage;
        const priorityPages = [
          currentPage,
          currentPage - 1,
          currentPage + 1,
          currentPage - 2,
          currentPage + 2,
        ].filter(p => p >= 1 && p <= newPages.length);
        
        renderQueueRef.current = priorityPages;
        processRenderQueue();
      } catch (error) {
        console.error('Failed to load PDF pages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initPages();
  }, [document.path, document.pageCount]);

  // 处理渲染队列
  const processRenderQueue = useCallback(async () => {
    if (isRenderingRef.current || renderQueueRef.current.length === 0) return;
    
    isRenderingRef.current = true;
    
    while (renderQueueRef.current.length > 0) {
      const pageNumber = renderQueueRef.current.shift()!;
      
      if (loadedPages.has(pageNumber)) continue;
      
      try {
        // 通知页面组件渲染
        setLoadedPages(prev => new Set(prev).add(pageNumber));
        
        // 小延迟让 UI 有机会更新
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch (error) {
        console.error(`Failed to render page ${pageNumber}:`, error);
      }
    }
    
    isRenderingRef.current = false;
  }, [loadedPages]);

  // 滚动处理 - 更新当前页码并加载可见页面
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollTimeout: number;

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        // 计算当前最可见的页面
        let maxVisiblePage = 1;
        let maxVisibleArea = 0;
        
        const pageElements = container.querySelectorAll('.pdf-page-wrapper');
        pageElements.forEach((el, index) => {
          const rect = el.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          const visibleTop = Math.max(rect.top, containerRect.top);
          const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
          const visibleHeight = Math.max(0, visibleBottom - visibleTop);
          
          if (visibleHeight > maxVisibleArea) {
            maxVisibleArea = visibleHeight;
            maxVisiblePage = index + 1;
          }
        });
        
        if (maxVisiblePage !== document.currentPage) {
          setCurrentPage(maxVisiblePage);
        }

        // 加载可见区域附近的页面
        const startPage = Math.max(1, maxVisiblePage - 2);
        const endPage = Math.min(pages.length, maxVisiblePage + 2);
        
        const pagesToLoad: number[] = [];
        for (let i = startPage; i <= endPage; i++) {
          if (!loadedPages.has(i)) {
            pagesToLoad.push(i);
          }
        }
        
        if (pagesToLoad.length > 0) {
          renderQueueRef.current = [...renderQueueRef.current, ...pagesToLoad];
          processRenderQueue();
        }
      }, 100);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [document.currentPage, pages.length, loadedPages, setCurrentPage, processRenderQueue]);

  // 跳转到指定页面
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const targetPage = container.querySelector(`[data-page-number="${document.currentPage}"]`);
    if (targetPage) {
      targetPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [document.currentPage]);

  // 计算带边距的页面尺寸
  const getPageStyle = (page: PDFPage) => {
    const scale = document.scale;
    const padding = settings.pagePadding;
    
    const contentWidth = page.width * scale;
    const contentHeight = page.height * scale;
    
    const totalWidth = contentWidth + padding * 2;
    const totalHeight = contentHeight + padding * 2;
    
    return {
      width: totalWidth,
      height: totalHeight,
      contentWidth,
      contentHeight,
      padding,
    };
  };

  // 获取背景色
  const getBackgroundColor = () => {
    switch (settings.theme) {
      case 'dark': return '#1a1a1a';
      case 'sepia': return '#f4ecd8';
      default: return settings.backgroundColor;
    }
  };

  if (isLoading) {
    return (
      <div className="pdf-viewer">
        <div className="loading-state">
          <div className="spinner" />
          <div>正在加载 PDF...</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="pdf-viewer" 
      ref={containerRef}
      style={{ backgroundColor: getBackgroundColor() }}
    >
      <div className="pdf-container">
        {pages.map((page) => {
          const style = getPageStyle(page);
          const shouldRender = loadedPages.has(page.number);
          
          return (
            <div
              key={page.number}
              data-page-number={page.number}
              className="pdf-page-with-margin"
              style={{
                width: style.width,
                height: style.height,
                marginBottom: '20px',
              }}
            >
              <div
                className="pdf-content-area"
                style={{
                  left: style.padding,
                  bottom: style.padding,
                  width: style.contentWidth,
                  height: style.contentHeight,
                }}
              >
                {shouldRender ? (
                  <PDFPageComponent
                    documentPath={document.path}
                    pageNumber={page.number}
                    width={style.contentWidth}
                    height={style.contentHeight}
                    originalWidth={page.width}
                    originalHeight={page.height}
                    scale={document.scale}
                    theme={settings.theme}
                  />
                ) : (
                  <PagePlaceholder 
                    width={style.contentWidth} 
                    height={style.contentHeight}
                    pageNumber={page.number}
                  />
                )}
              </div>
              
              {/* 页码指示器 */}
              <div className="pdf-page-number">{page.number}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 页面占位符
function PagePlaceholder({ width, height, pageNumber }: { width: number; height: number; pageNumber: number }) {
  return (
    <div 
      style={{ 
        width, 
        height, 
        background: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
        fontSize: '14px'
      }}
    >
      加载中... {pageNumber}
    </div>
  );
}
