import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface PDFPageProps {
  documentPath: string;
  pageNumber: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  scale: number;
  theme: 'light' | 'dark' | 'sepia';
}

export default function PDFPageComponent({
  documentPath,
  pageNumber,
  width,
  height,
  originalWidth: _originalWidth,
  originalHeight: _originalHeight,
  scale,
  theme,
}: PDFPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderPage = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      setIsRendering(true);
      setError(null);

      try {
        // 调用 Rust 后端渲染页面为图片
        const result = await invoke<{
          data: number[];  // RGBA 数据
          width: number;
          height: number;
        }>('render_pdf_page', {
          path: documentPath,
          pageNumber,
          scale,
          theme,
        });

        // 设置 canvas 尺寸
        canvas.width = result.width;
        canvas.height = result.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // 创建 ImageData 并绘制
        const imageData = new ImageData(
          new Uint8ClampedArray(result.data),
          result.width,
          result.height
        );

        ctx.putImageData(imageData, 0, 0);
      } catch (err) {
        console.error(`Failed to render page ${pageNumber}:`, err);
        setError(String(err));
      } finally {
        setIsRendering(false);
      }
    };

    renderPage();
  }, [documentPath, pageNumber, scale, theme]);

  // 应用主题滤镜（如果需要）
  const getCanvasStyle = () => {
    const baseStyle: React.CSSProperties = {
      display: 'block',
      width: '100%',
      height: '100%',
    };

    // 根据主题调整显示
    switch (theme) {
      case 'dark':
        return {
          ...baseStyle,
          // 可以在这里添加 CSS filter 作为后备方案
        };
      case 'sepia':
        return baseStyle;
      default:
        return baseStyle;
    }
  };

  if (error) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fee',
          color: '#c33',
          fontSize: '12px',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        页面渲染失败
        <br />
        {error}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width, height }}>
      <canvas
        ref={canvasRef}
        style={getCanvasStyle()}
      />
      {isRendering && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.9)',
          }}
        >
          <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
        </div>
      )}
    </div>
  );
}
