# 项目结构

```
pdf-reader-demo/
├── 📁 src/                          # 前端源码 (React + TypeScript)
│   ├── 📁 components/               # React 组件
│   │   ├── 📄 PDFViewer.tsx        # PDF 阅读器主组件
│   │   ├── 📄 PDFPage.tsx          # 单页渲染组件
│   │   ├── 📄 Toolbar.tsx          # 工具栏组件
│   │   └── 📄 Sidebar.tsx          # 侧边栏组件
│   ├── 📁 stores/                   # 状态管理
│   │   └── 📄 appStore.ts          # Zustand 全局状态
│   ├── 📁 types/                    # TypeScript 类型定义
│   │   └── 📄 index.ts             # 所有类型定义
│   ├── 📄 App.tsx                  # 主应用组件
│   ├── 📄 main.tsx                 # React 入口
│   ├── 📄 index.css                # 全局样式 (主题变量)
│   ├── 📄 App.css                  # App 组件样式
│   └── 📄 vite-env.d.ts            # Vite 类型声明
│
├── 📁 src-tauri/                    # Rust 后端源码
│   ├── 📁 src/                      
│   │   ├── 📁 pdf/                  # PDF 处理模块
│   │   │   ├── 📄 mod.rs           # PDF 渲染核心逻辑
│   │   │   └── 📄 commands.rs      # Tauri 命令
│   │   ├── 📄 main.rs              # 程序入口
│   │   └── 📄 lib.rs               # 库入口
│   ├── 📁 capabilities/             # Tauri v2 权限配置
│   │   └── 📄 default.json
│   ├── 📁 icons/                    # 应用图标
│   ├── 📄 Cargo.toml               # Rust 依赖配置
│   ├── 📄 tauri.conf.json          # Tauri 配置
│   └── 📄 build.rs                 # 构建脚本
│
├── 📄 package.json                  # Node 依赖配置
├── 📄 tsconfig.json                 # TypeScript 配置
├── 📄 vite.config.ts                # Vite 配置
├── 📄 index.html                    # HTML 模板
├── 📄 setup.sh                      # 一键安装脚本
├── 📄 README.md                     # 项目说明
├── 📄 QUICKSTART.md                 # 快速开始指南
└── 📄 .gitignore                    # Git 忽略规则
```

## 核心文件说明

### 前端核心

| 文件 | 作用 |
|------|------|
| `PDFViewer.tsx` | 虚拟滚动、页面管理、主题应用 |
| `PDFPage.tsx` | 通过 Tauri invoke 调用 Rust 渲染页面 |
| `appStore.ts` | 全局状态：文档列表、当前文档、设置 |
| `index.css` | CSS 变量定义主题（白天/夜间/护眼）|

### 后端核心

| 文件 | 作用 |
|------|------|
| `pdf/mod.rs` | pdfium 封装、主题滤镜、缓存逻辑 |
| `pdf/commands.rs` | Tauri IPC 命令：load_pdf, render_page |
| `main.rs` | 初始化 pdfium 引擎，注册命令 |

## 数据流

```
用户打开 PDF
    ↓
前端: App.tsx 调用 invoke('load_pdf')
    ↓
后端: commands.rs 使用 pdfium 加载文档
    ↓
前端: 获取页数，初始化页面数组
    ↓
前端: PDFViewer 组件开始渲染
    ↓
前端: PDFPage 调用 invoke('render_pdf_page')
    ↓
后端: mod.rs 渲染页面为 RGBA 位图
    ↓
后端: 应用主题滤镜（如果需要）
    ↓
后端: 存入 LRU 缓存
    ↓
前端: 将 RGBA 数据绘制到 Canvas
    ↓
用户: 看到渲染的页面
```

## 缓存策略

```
LRU Cache (50 pages max)
├── Key: "{path}:{page}:{scale}:{theme}"
├── Value: [width(4 bytes) + height(4 bytes) + rgba_data]
└── 自动淘汰最久未使用的页面
```

## 主题系统

```css
/* 通过 data-theme 属性切换 */
html[data-theme="light"] {
  --bg-primary: #f5f5f5;
  --text-primary: #333333;
}

html[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --text-primary: #ffffff;
}

html[data-theme="sepia"] {
  --bg-primary: #f4ecd8;
  --text-primary: #5f4b32;
}
```

## 页面布局

```
┌─────────────────────────────────────┐
│ Toolbar                             │
├──────────┬──────────────────────────┤
│          │                          │
│ Sidebar  │    PDF Viewer            │
│          │    ┌────────────────┐   │
│ (文件列表)│    │  Page Margin   │   │
│          │    │  ┌──────────┐  │   │
│          │    │  │  Content │  │   │
│          │    │  │  (PDF)   │  │   │
│          │    │  └──────────┘  │   │
│          │    └────────────────┘   │
│          │                          │
└──────────┴──────────────────────────┘
```
