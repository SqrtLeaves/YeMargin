import { useAppStore } from '@/stores/appStore';

interface ToolbarProps {
  onOpenFile: () => void;
  isLoading: boolean;
}

export default function Toolbar({ onOpenFile, isLoading }: ToolbarProps) {
  const { 
    currentDocument, 
    setScale, 
    settings, 
    updateSettings 
  } = useAppStore();

  const handleZoomIn = () => {
    if (!currentDocument) return;
    setScale(Math.min(currentDocument.scale + 0.25, 4));
  };

  const handleZoomOut = () => {
    if (!currentDocument) return;
    setScale(Math.max(currentDocument.scale - 0.25, 0.5));
  };

  const handleZoomReset = () => {
    if (!currentDocument) return;
    setScale(settings.defaultScale);
  };

  const toggleTheme = () => {
    const themes: Array<'light' | 'dark' | 'sepia'> = ['light', 'sepia', 'dark'];
    const currentIndex = themes.indexOf(settings.theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    updateSettings({ theme: nextTheme });
  };

  const getThemeIcon = () => {
    switch (settings.theme) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      case 'sepia': return '📜';
    }
  };

  const getThemeLabel = () => {
    switch (settings.theme) {
      case 'light': return '白天';
      case 'dark': return '夜间';
      case 'sepia': return '护眼';
    }
  };

  return (
    <div className="toolbar">
      <button 
        className="toolbar-button primary" 
        onClick={onOpenFile}
        disabled={isLoading}
      >
        {isLoading ? '⏳' : '📂'} 打开文件
      </button>

      <div className="toolbar-separator" />

      {currentDocument && (
        <>
          <div className="zoom-control">
            <button className="zoom-button" onClick={handleZoomOut} title="缩小">−</button>
            <span className="zoom-value" onClick={handleZoomReset} style={{ cursor: 'pointer' }}>
              {Math.round(currentDocument.scale * 100)}%
            </span>
            <button className="zoom-button" onClick={handleZoomIn} title="放大">+</button>
          </div>

          <div className="toolbar-separator" />

          <span className="page-info">
            第 {currentDocument.currentPage} / {currentDocument.pageCount} 页
          </span>

          <div className="toolbar-spacer" />
        </>
      )}

      {!currentDocument && <div className="toolbar-spacer" />}

      <button className="toolbar-button" onClick={toggleTheme} title="切换主题">
        {getThemeIcon()} {getThemeLabel()}
      </button>
    </div>
  );
}
