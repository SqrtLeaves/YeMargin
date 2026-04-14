import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PDFDocument, StudySet, Annotation, AppState } from '@/types';

interface AppStore extends AppState {
  // 文档操作
  openDocument: (doc: PDFDocument) => void;
  closeDocument: () => void;
  addDocument: (doc: PDFDocument) => void;
  removeDocument: (id: string) => void;
  setCurrentPage: (page: number) => void;
  setScale: (scale: number) => void;
  
  // 学习集操作
  createStudySet: (name: string, color: string) => void;
  deleteStudySet: (id: string) => void;
  addToStudySet: (documentId: string, studySetId: string) => void;
  removeFromStudySet: (documentId: string, studySetId: string) => void;
  
  // 标注操作
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAnnotation: (id: string, data: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  getAnnotationsByPage: (documentId: string, page: number) => Annotation[];
  
  // 设置
  updateSettings: (settings: Partial<AppState['settings']>) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      currentDocument: null,
      documents: [],
      studySets: [],
      annotations: [],
      
      settings: {
        theme: 'light',
        pagePadding: 100,
        backgroundColor: '#f5f5f5',
        defaultScale: 1.5,
      },
      
      // 文档操作
      openDocument: (doc) => {
        set({ currentDocument: doc });
      },
      
      closeDocument: () => {
        set({ currentDocument: null });
      },
      
      addDocument: (doc) => {
        set((state) => ({
          documents: [...state.documents.filter(d => d.id !== doc.id), doc],
        }));
      },
      
      removeDocument: (id) => {
        set((state) => ({
          documents: state.documents.filter(d => d.id !== id),
          currentDocument: state.currentDocument?.id === id ? null : state.currentDocument,
        }));
      },
      
      setCurrentPage: (page) => {
        const { currentDocument } = get();
        if (!currentDocument) return;
        
        set({
          currentDocument: { ...currentDocument, currentPage: page },
        });
      },
      
      setScale: (scale) => {
        const { currentDocument } = get();
        if (!currentDocument) return;
        
        set({
          currentDocument: { ...currentDocument, scale },
        });
      },
      
      // 学习集操作
      createStudySet: (name, color) => {
        const newSet: StudySet = {
          id: crypto.randomUUID(),
          name,
          color,
          documentIds: [],
          createdAt: Date.now(),
        };
        set((state) => ({
          studySets: [...state.studySets, newSet],
        }));
      },
      
      deleteStudySet: (id) => {
        set((state) => ({
          studySets: state.studySets.filter(s => s.id !== id),
        }));
      },
      
      addToStudySet: (documentId, studySetId) => {
        set((state) => ({
          studySets: state.studySets.map(s =>
            s.id === studySetId && !s.documentIds.includes(documentId)
              ? { ...s, documentIds: [...s.documentIds, documentId] }
              : s
          ),
        }));
      },
      
      removeFromStudySet: (documentId, studySetId) => {
        set((state) => ({
          studySets: state.studySets.map(s =>
            s.id === studySetId
              ? { ...s, documentIds: s.documentIds.filter(id => id !== documentId) }
              : s
          ),
        }));
      },
      
      // 标注操作
      addAnnotation: (annotation) => {
        const newAnnotation: Annotation = {
          ...annotation,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          annotations: [...state.annotations, newAnnotation],
        }));
      },
      
      updateAnnotation: (id, data) => {
        set((state) => ({
          annotations: state.annotations.map(a =>
            a.id === id ? { ...a, ...data, updatedAt: Date.now() } : a
          ),
        }));
      },
      
      deleteAnnotation: (id) => {
        set((state) => ({
          annotations: state.annotations.filter(a => a.id !== id),
        }));
      },
      
      getAnnotationsByPage: (documentId, page) => {
        return get().annotations.filter(
          a => a.documentId === documentId && a.page === page
        );
      },
      
      // 设置
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },
    }),
    {
      name: 'pdf-reader-storage',
      partialize: (state) => ({
        documents: state.documents,
        studySets: state.studySets,
        annotations: state.annotations,
        settings: state.settings,
      }),
    }
  )
);
