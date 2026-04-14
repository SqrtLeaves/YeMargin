import { useEffect, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '@/stores/appStore';
import { pdfjsLib } from '@/lib/pdfjs';
import PDFViewer from '@/components/PDFViewer';
import Sidebar from '@/components/Sidebar';
import Toolbar from '@/components/Toolbar';
import type { PDFDocument } from '@/types';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
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

  // 当切换文档或恢复当前文档时，自动读取 PDF bytes
  useEffect(() => {
    const loadBytes = async () => {
      if (!currentDocument) {
        setPdfBytes(null);
        return;
      }
      try {
        const arr = await invoke<ArrayBuffer>('read_pdf_bytes', { path: currentDocument.path });
        setPdfBytes(new Uint8Array(arr));
      } catch (err) {
        console.error('Failed to read PDF bytes:', err);
        setPdfBytes(null);
      }
    };
    loadBytes();
  }, [currentDocument?.path]);

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
      
      // 读取文件字节
      const arr = await invoke<ArrayBuffer>('read_pdf_bytes', { path: selected });
      const bytes = new Uint8Array(arr);

      // 用 PDF.js 解析获取页数（避免调用可能卡住的 load_pdf）
      const pdfDoc = await pdfjsLib.getDocument({ data: bytes }).promise;
      const pageCount = pdfDoc.numPages;
      pdfDoc.destroy();

      const name = selected.split('/').pop()?.replace(/\.pdf$/i, '') || 'Untitled';

      const newDoc: PDFDocument = {
        id: crypto.randomUUID(),
        path: selected,
        name,
        pageCount,
        currentPage: 1,
        scale: settings.defaultScale,
      };

      setPdfBytes(bytes);
      addDocument(newDoc);
      openDocument(newDoc);
    } catch (error) {
      console.error('Failed to open PDF:', error);
      alert('无法打开 PDF 文件: ' + String(error));
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
        
        {currentDocument && pdfBytes ? (
          <PDFViewer 
            document={currentDocument}
            bytes={pdfBytes}
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
