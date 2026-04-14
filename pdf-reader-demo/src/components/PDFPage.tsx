import { useEffect, useRef } from 'react';
import { pdfjsLib } from '@/lib/pdfjs';

interface PDFPageProps {
  pdfPage: pdfjsLib.PDFPageProxy;
  scale: number;
}

export default function PDFPageComponent({
  pdfPage,
  scale,
}: PDFPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const renderPage = async () => {
      const canvas = canvasRef.current;
      const textLayer = textLayerRef.current;
      if (!canvas || !textLayer) return;

      // Cancel any previous render
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const viewport = pdfPage.getViewport({ scale });

      // Set canvas size to match viewport
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas before rendering
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const renderTask = pdfPage.render({ canvas, canvasContext: ctx, viewport });
      renderTaskRef.current = renderTask;

      try {
        await renderTask.promise;
      } catch (err) {
        if ((err as Error).message?.includes('cancelled')) {
          return;
        }
        console.error('Render error:', err);
        return;
      }

      if (isCancelled) return;

      // Build text layer
      const textContent = await pdfPage.getTextContent();
      textLayer.innerHTML = '';
      textLayer.style.width = `${viewport.width}px`;
      textLayer.style.height = `${viewport.height}px`;

      const fragment = document.createDocumentFragment();

      for (const item of textContent.items) {
        if (!('str' in item)) continue;

        const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
        const fontHeight = Math.hypot(tx[0], tx[1]);
        const scaleX = fontHeight ? Math.hypot(tx[2], tx[3]) / fontHeight : 1;

        // Skip empty or zero-height text
        if (!item.str || fontHeight <= 0) continue;

        const span = document.createElement('span');
        span.textContent = item.str;
        span.style.position = 'absolute';
        span.style.left = `${tx[4]}px`;
        span.style.top = `${tx[5] - fontHeight}px`;
        span.style.fontSize = `${fontHeight}px`;
        span.style.fontFamily = 'sans-serif';
        span.style.whiteSpace = 'pre';
        span.style.userSelect = 'text';
        span.style.transform = `scaleX(${scaleX})`;
        span.style.transformOrigin = 'left bottom';
        span.style.color = 'transparent';
        span.style.cursor = 'text';

        fragment.appendChild(span);
      }

      textLayer.appendChild(fragment);
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfPage, scale]);

  const viewport = pdfPage.getViewport({ scale });

  return (
    <div
      style={{
        width: viewport.width,
        height: viewport.height,
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', position: 'absolute', top: 0, left: 0 }}
      />
      <div
        ref={textLayerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          lineHeight: 1,
          pointerEvents: 'auto',
        }}
      />
    </div>
  );
}
