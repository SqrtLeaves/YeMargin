import { useAppStore } from '@/stores/appStore';

interface SidebarProps {
  onOpenFile: () => void;
}

export default function Sidebar({ onOpenFile }: SidebarProps) {
  const { documents, currentDocument, openDocument } = useAppStore();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">我的文档</div>
      </div>

      <div className="sidebar-content">
        {documents.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            color: 'var(--text-secondary)',
            fontSize: '13px'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }}>📂</div>
            暂无文档
            <br />
            <button 
              onClick={onOpenFile}
              style={{
                marginTop: '12px',
                padding: '6px 12px',
                border: '1px solid var(--accent-color)',
                background: 'transparent',
                color: 'var(--accent-color)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              + 打开 PDF
            </button>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className={`document-item ${currentDocument?.id === doc.id ? 'active' : ''}`}
              onClick={() => openDocument(doc)}
              title={doc.name}
            >
              <span className="document-icon">📄</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontWeight: 500, 
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {doc.name.replace(/\.pdf$/i, '')}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  opacity: 0.7,
                  marginTop: '2px'
                }}>
                  {doc.pageCount} 页
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
