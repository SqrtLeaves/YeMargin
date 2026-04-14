// PDF 文档类型
export interface PDFDocument {
  id: string;
  path: string;
  name: string;
  pageCount: number;
  currentPage: number;
  scale: number;
}

// PDF 页面信息
export interface PDFPage {
  number: number;
  width: number;
  height: number;
  rendered: boolean;
}

// 标注类型
export type AnnotationType = 'highlight' | 'note' | 'ink' | 'region';

export interface Annotation {
  id: string;
  documentId: string;
  page: number;
  type: AnnotationType;
  color: string;
  // 高亮区域
  rects?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  // 笔记内容
  content?: string;
  // 手写路径
  paths?: Array<{
    points: Array<{ x: number; y: number }>;
    pressure: number;
  }>;
  // 区域笔记
  region?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  createdAt: number;
  updatedAt: number;
}

// 学习集
export interface StudySet {
  id: string;
  name: string;
  color: string;
  documentIds: string[];
  createdAt: number;
}

// 应用状态
export interface AppState {
  currentDocument: PDFDocument | null;
  documents: PDFDocument[];
  studySets: StudySet[];
  annotations: Annotation[];
  
  // 阅读器设置
  settings: {
    theme: 'light' | 'dark' | 'sepia';
    pagePadding: number;      // 页面周围空白
    backgroundColor: string;  // 背景色
    defaultScale: number;
  };
}

// 渲染设置
export interface RenderSettings {
  scale: number;
  theme: 'light' | 'dark' | 'sepia';
  padding: number;
}
