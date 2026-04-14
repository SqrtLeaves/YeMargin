import { useEffect, useRef } from 'react';
import { pdfjsLib, TextLayerBuilder } from '@/lib/pdfjs';

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
      const textLayerContainer = textLayerRef.current;
      if (!canvas || !textLayerContainer) return;

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

      // Build text layer using PDF.js official TextLayerBuilder
      textLayerContainer.innerHTML = '';
      const textLayerBuilder = new TextLayerBuilder({
        pdfPage,
      });

      await textLayerBuilder.render({ viewport, images: null as any });

      if (isCancelled) return;

      // Append the built text layer into our container
      textLayerContainer.appendChild(textLayerBuilder.div);
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
        style={{
          display: 'block',
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      />
      <div
        ref={textLayerRef}
        className="pdf-text-layer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: viewport.width,
          height: viewport.height,
          lineHeight: 1,
          zIndex: 2,
        }}
      />
    </div>
  );
}
