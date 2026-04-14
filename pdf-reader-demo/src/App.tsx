import { useEffect, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '@/stores/appStore';
import PDFViewer from '@/components/PDFViewer';
import Sidebar from '@/components/Sidebar';
import Toolbar from '@/components/Toolbar';
import type { PDFDocument } from '@/types';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const { 
    currentDocument, 
    openDocument, 
    addDocument,
    settings,
  } = useAppStore();

  // 应用主题
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // 打开 PDF 文件
  const handleOpenFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'PDF Files',
          extensions: ['pdf']
        }]
      });

      if (!selected) return;

      setIsLoading(true);
      
      // 调用 Rust 后端加载 PDF
      const result = await invoke<{
        id: string;
        path: string;
        name: string;
        page_count: number;
      }>('load_pdf', {
        path: selected
      });

      const newDoc: PDFDocument = {
        id: result.id,
        path: result.path,
        name: result.name,
        pageCount: result.page_count,
        currentPage: 1,
        scale: settings.defaultScale,
      };

      addDocument(newDoc);
      openDocument(newDoc);
    } catch (error) {
      console.error('Failed to open PDF:', error);
      alert('无法打开 PDF 文件: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <Sidebar onOpenFile={handleOpenFile} />
      
      <div className="main-content">
        <Toolbar 
          onOpenFile={handleOpenFile}
          isLoading={isLoading}
        />
        
        {currentDocument ? (
          <PDFViewer 
            document={currentDocument}
            key={currentDocument.id}
          />
        ) : (
          <EmptyState onOpenFile={handleOpenFile} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ onOpenFile }: { onOpenFile: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">📚</div>
      <h2 className="empty-state-title">欢迎使用 PDF Reader</h2>
      <p className="empty-state-desc">
        打开一个 PDF 文件开始阅读，或从左侧最近文档中选择
      </p>
      <br />
      <button className="toolbar-button primary" onClick={onOpenFile}>
        <span>📂</span> 打开 PDF 文件
      </button>
    </div>
  );
}

export default App;
