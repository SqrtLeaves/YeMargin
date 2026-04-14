import * as pdfjsLib from 'pdfjs-dist';
import { TextLayerBuilder, EventBus } from 'pdfjs-dist/web/pdf_viewer.mjs';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export { pdfjsLib, TextLayerBuilder, EventBus };
