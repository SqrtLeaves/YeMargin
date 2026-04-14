import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '@/stores/appStore';
import { pdfjsLib } from '@/lib/pdfjs';
import type { PDFDocument } from '@/types';
import PDFPageComponent from './PDFPage';

interface PDFViewerProps {
  document: PDFDocument;
  bytes: Uint8Array;
}

export default function PDFViewer({ document, bytes }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { settings, setCurrentPage, setScale } = useAppStore();
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageProxies, setPageProxies] = useState<Map<number, pdfjsLib.PDFPageProxy>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const pinchTimeoutRef = useRef<number | null>(null);
  const isGesturingRef = useRef(false);
  const gestureStartScaleRef = useRef(document.scale);
  const pendingVisualScaleRef = useRef<number | null>(null);

  const getContainerEl = () => containerRef.current?.querySelector('.pdf-container') as HTMLElement | null;

  // Load PDF bytes and initialize PDF.js document
  useEffect(() => {
    let isMounted = true;

    const loadPdf = async () => {
      setIsLoading(true);
      setError(null);
      setPageProxies(new Map());

      try {
        const loadedDoc = await pdfjsLib.getDocument({ data: bytes }).promise;

        if (!isMounted) {
          loadedDoc.destroy();
          return;
        }

        setPdfDocument(loadedDoc);
        
        // 先阻塞加载第 1 页（首屏），然后后台并行加载 2-3 页
        const firstPage = await loadedDoc.getPage(1);
        if (isMounted) {
          setPageProxies((prev) => {
            const next = new Map(prev);
            next.set(1, firstPage);
            return next;
          });
          setIsLoading(false);
        }

        // 后台并行加载后续页面
        const pagesToLoad = Math.min(3, loadedDoc.numPages);
        if (pagesToLoad > 1 && isMounted) {
          const rest = await Promise.all(
            Array.from({ length: pagesToLoad - 1 }, (_, i) => loadedDoc.getPage(i + 2))
          );
          if (isMounted) {
            setPageProxies((prev) => {
              const next = new Map(prev);
              rest.forEach((page, idx) => next.set(idx + 2, page));
              return next;
            });
          }
        }
      } catch (err) {
        console.error('Failed to load PDF:', err);
        if (isMounted) {
          setError(String(err));
          setIsLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
      pageProxies.forEach((page) => {
        try { page.cleanup?.(); } catch {}
      });
      setPdfDocument((prev) => {
        prev?.destroy().catch(() => {});
        return null;
      });
    };
  }, [bytes]);

  // Sync DOM transform when document scale changes (e.g. after commit)
  useEffect(() => {
    const el = getContainerEl();
    if (el) {
      el.style.transform = '';
      el.style.transformOrigin = '';
    }
  }, [document.scale]);

  // Load visible pages on scroll
  const loadVisiblePages = useCallback(async () => {
    if (!pdfDocument || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const pageElements = container.querySelectorAll('.pdf-page-wrapper');

    let maxVisiblePage = 1;
    let maxVisibleArea = 0;
    const pagesToLoad: number[] = [];

    pageElements.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      const visibleTop = Math.max(rect.top, containerRect.top);
      const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const pageNumber = index + 1;

      if (visibleHeight > maxVisibleArea) {
        maxVisibleArea = visibleHeight;
        maxVisiblePage = pageNumber;
      }

      if (visibleHeight > 0 && !pageProxies.has(pageNumber)) {
        pagesToLoad.push(pageNumber);
      }
    });

    if (maxVisiblePage !== document.currentPage) {
      setCurrentPage(maxVisiblePage);
    }

    if (pagesToLoad.length > 0) {
      const newProxies = new Map(pageProxies);
      for (const pageNumber of pagesToLoad) {
        if (!newProxies.has(pageNumber)) {
          try {
            const page = await pdfDocument.getPage(pageNumber);
            newProxies.set(pageNumber, page);
          } catch (err) {
            console.error(`Failed to load page ${pageNumber}:`, err);
          }
        }
      }
      setPageProxies(newProxies);
    }
  }, [pdfDocument, pageProxies, document.currentPage, setCurrentPage]);

  // Scroll handler with debounce
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollTimeout: number;

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        loadVisiblePages();
      }, 100);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [loadVisiblePages]);

  // Pinch zoom handler (macOS trackpad + mouse wheel)
  useEffect(() => {
    const applyVisualScale = (scale: number) => {
      const clamped = Math.max(0.25, Math.min(5, scale));
      pendingVisualScaleRef.current = clamped;
      const el = getContainerEl();
      if (el) {
        el.style.transform = `scale(${clamped / document.scale})`;
        el.style.transformOrigin = 'top center';
      }
      return clamped;
    };

    const commitScale = () => {
      if (pendingVisualScaleRef.current !== null) {
        const clamped = pendingVisualScaleRef.current;
        setScale(clamped);
        pendingVisualScaleRef.current = null;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (isGesturingRef.current) return;

      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        const delta = -e.deltaY;
        const zoomFactor = Math.exp(delta * 0.002);
        const current = pendingVisualScaleRef.current ?? document.scale;
        applyVisualScale(current * zoomFactor);

        if (pinchTimeoutRef.current) {
          clearTimeout(pinchTimeoutRef.current);
        }
        pinchTimeoutRef.current = window.setTimeout(commitScale, 200);
      }
    };

    const handleGestureStart = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      isGesturingRef.current = true;
      gestureStartScaleRef.current = pendingVisualScaleRef.current ?? document.scale;
    };

    const handleGestureChange = (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      const newScale = gestureStartScaleRef.current * (e.scale || 1);
      applyVisualScale(newScale);
    };

    const handleGestureEnd = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      isGesturingRef.current = false;
      gestureStartScaleRef.current = pendingVisualScaleRef.current ?? document.scale;
      commitScale();
    };

    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    window.addEventListener('gesturestart', handleGestureStart, { passive: false, capture: true });
    window.addEventListener('gesturechange', handleGestureChange, { passive: false, capture: true });
    window.addEventListener('gestureend', handleGestureEnd, { passive: false, capture: true });

    return () => {
      window.removeEventListener('wheel', handleWheel, { capture: true });
      window.removeEventListener('gesturestart', handleGestureStart, { capture: true });
      window.removeEventListener('gesturechange', handleGestureChange, { capture: true });
      window.removeEventListener('gestureend', handleGestureEnd, { capture: true });
      if (pinchTimeoutRef.current) {
        clearTimeout(pinchTimeoutRef.current);
      }
    };
  }, [setScale, document.scale]);

  // Jump to page
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const targetPage = container.querySelector(`[data-page-number="${document.currentPage}"]`);
    if (targetPage) {
      targetPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [document.currentPage]);

  // Ensure copy works for selected text
  useEffect(() => {
    const handleCopy = (_e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        // Let the native copy event proceed
        return;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
          // Native copy should work; this handler ensures we don't block it
          return;
        }
      }
    };

    window.document.addEventListener('copy', handleCopy);
    window.document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.document.removeEventListener('copy', handleCopy);
      window.document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Get background color
  const getBackgroundColor = () => {
    switch (settings.theme) {
      case 'dark': return '#1a1a1a';
      case 'sepia': return '#f4ecd8';
      default: return settings.backgroundColor;
    }
  };

  // Theme CSS filter applied to the content wrapper
  const getThemeFilter = () => {
    switch (settings.theme) {
      case 'dark': return 'invert(1) hue-rotate(180deg)';
      case 'sepia': return 'sepia(0.85) contrast(0.95)';
      default: return 'none';
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

  if (error) {
    return (
      <div className="pdf-viewer">
        <div className="loading-state" style={{ color: '#c33' }}>
          <div>加载失败</div>
          <div style={{ fontSize: '14px', marginTop: '8px' }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!pdfDocument) {
    return null;
  }

  const pageCount = pdfDocument.numPages;

  return (
    <div
      className="pdf-viewer"
      ref={containerRef}
      style={{ backgroundColor: getBackgroundColor() }}
    >
      <div
        className="pdf-container"
        style={{
          filter: getThemeFilter(),
          transition: 'filter 0.2s ease-out',
        }}
      >
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNumber) => {
          const pageProxy = pageProxies.get(pageNumber);
          const hasProxy = !!pageProxy;

          return (
            <div
              key={pageNumber}
              data-page-number={pageNumber}
              className="pdf-page-wrapper"
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '20px',
                padding: `${settings.pagePadding}px 0`,
              }}
            >
              {hasProxy ? (
                <PDFPageComponent
                  pdfPage={pageProxy!}
                  scale={document.scale}
                />
              ) : (
                <PagePlaceholder pageNumber={pageNumber} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PagePlaceholder({ pageNumber }: { pageNumber: number }) {
  return (
    <div
      style={{
        width: 600,
        height: 800,
        background: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
        fontSize: '14px',
      }}
    >
      加载中... {pageNumber}
    </div>
  );
}
