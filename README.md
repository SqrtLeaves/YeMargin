# YeMargin

一个基于 **Tauri 2.0 + React + Rust + pdfium** 的高性能 PDF 阅读器原型项目，目标是为 macOS 打造一款类似 MarginNote 的深度学习阅读工具。

---

## 📁 仓库结构

```
.
├── pdf-reader-demo/              # PDF 阅读器 Demo 源码
│   ├── src/                      # 前端 (React + TypeScript)
│   ├── src-tauri/                # 后端 (Rust + Tauri 2.0)
│   ├── README.md                 # Demo 详细说明
│   ├── QUICKSTART.md             # 快速开始指南
│   ├── DEMO.md                   # 功能演示与操作说明
│   └── PROJECT_STRUCTURE.md      # 项目架构详解
├── kimi-export-*.md              # 开发过程对话记录
└── README.md                     # 本文件
```

---

## ✨ 核心特性

- 🚀 **高性能渲染** — 使用 Google PDFium 引擎（Chrome 同款），直接渲染位图，比 PDF.js 快数倍
- 🎨 **三种阅读主题** — 白天 / 夜间 / 护眼模式，后端 Rust 滤镜实时处理
- 📄 **页面边距** — 周围留白设计，为后续批注、笔记功能预留空间
- 💾 **智能缓存** — LRU 页面缓存（50 页），二次查看瞬间加载
- 🔍 **平滑缩放** — 支持 25% - 400% 无级缩放
- 📚 **最近文档** — 左侧边栏管理已打开文件，快速切换
- 🎯 **虚拟滚动** — 只渲染可视区域，千页文档也能流畅滚动

---

## 🖥️ 环境要求

- **macOS**: 10.15+ (Catalina)
- **Node.js**: 18+
- **Rust**: 1.75+

---

## 🚀 快速开始

```bash
# 1. 进入 Demo 目录
cd pdf-reader-demo

# 2. 一键安装依赖（安装 Rust + Node 依赖）
./setup.sh

# 3. 启动开发服务器
npm run tauri:dev
```

首次编译 Rust 后端需要 2-5 分钟，完成后会自动打开应用窗口。

详细说明请参阅 [pdf-reader-demo/QUICKSTART.md](./pdf-reader-demo/QUICKSTART.md)。

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────┐
│  Frontend (React 18 + TypeScript)           │
│  ├── PDFViewer: 虚拟滚动、页面管理          │
│  ├── PDFPage:   调用 Rust 渲染              │
│  ├── Toolbar:   缩放、主题控制              │
│  └── Zustand:   状态管理                    │
└─────────────────────────────────────────────┘
                      │
              Tauri IPC (invoke)
                      │
┌─────────────────────────────────────────────┐
│  Backend (Rust + Tauri 2.0)                 │
│  ├── pdfium-render: Google PDFium 绑定      │
│  ├── LRU Cache:     页面渲染缓存            │
│  └── Theme Filter:  颜色矩阵变换            │
└─────────────────────────────────────────────┘
```

---

## 📂 项目文档

| 文档 | 说明 |
|------|------|
| [pdf-reader-demo/README.md](./pdf-reader-demo/README.md) | Demo 的完整项目说明 |
| [pdf-reader-demo/QUICKSTART.md](./pdf-reader-demo/QUICKSTART.md) | 环境搭建与运行指南 |
| [pdf-reader-demo/DEMO.md](./pdf-reader-demo/DEMO.md) | 功能演示、操作说明、界面预览 |
| [pdf-reader-demo/PROJECT_STRUCTURE.md](./pdf-reader-demo/PROJECT_STRUCTURE.md) | 代码结构、数据流、缓存策略详解 |

---

## 🛠️ 未来计划

基于这个 Demo，可以进一步扩展：

- [ ] **文本高亮** — 多颜色标注、下划线
- [ ] **手写批注** — Apple Pencil / 触控板支持
- [ ] **区域笔记** — MarginNote 风格的边栏笔记
- [ ] **学习集管理** — 分类、标签、思维导图视图
- [ ] **闪卡复习** — 从标注生成 Anki 卡片
- [ ] **云端同步** — iCloud / Dropbox 数据目录同步
- [ ] **OCR 识别** — 扫描版 PDF 文字提取
- [ ] **全文搜索** — 跨文档内容检索

---

## 📝 开发记录

仓库根目录下的 `kimi-export-*.md` 文件保留了本项目的开发过程对话记录，包括：

- 技术选型讨论（原生 Swift vs Tauri vs Electron）
- 架构设计思路
- PDF 渲染引擎对比（PDFKit vs PDF.js vs PDFium）
- Demo 代码生成与调试过程

---

## 📄 License

MIT License — 自由使用和修改。

---

**Made with ❤️ for deep readers.**
