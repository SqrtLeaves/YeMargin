# 快速开始指南

## 环境要求

- **macOS**: 10.15+ (Catalina 或更高版本)
- **Node.js**: 18+
- **Rust**: 1.75+

## 一键安装

```bash
# 进入项目目录
cd pdf-reader-demo

# 运行安装脚本
./setup.sh
```

## 手动安装

如果你不想使用脚本，可以手动安装：

### 1. 安装 Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### 2. 安装 Node 依赖

```bash
npm install
```

### 3. 安装 Tauri CLI (可选)

```bash
npm install -g @tauri-apps/cli@^2.0.0
```

## 运行开发版本

```bash
npm run tauri:dev
```

首次运行会：
1. 编译 Rust 后端（可能需要 2-5 分钟）
2. 启动 Vite 开发服务器
3. 打开 Tauri 应用窗口

## 构建生产版本

```bash
npm run tauri:build
```

构建完成后：
- `.dmg` 安装包: `src-tauri/target/release/bundle/dmg/`
- `.app` 应用: `src-tauri/target/release/bundle/macos/`

## 项目预览

运行后你会看到：

1. **左侧边栏** - 最近打开的 PDF 列表
2. **顶部工具栏** - 打开文件、缩放控制、主题切换
3. **主阅读区** - PDF 渲染区域，支持：
   - 平滑滚动浏览
   - 25% - 400% 缩放
   - 白天/夜间/护眼三种主题
   - 页面周围留白方便批注

## 常见问题

### Q: 编译失败，提示找不到 pdfium?
A: pdfium-render 会自动下载 pdfium 库。如果失败，可以尝试：
```bash
cargo clean
cargo build
```

### Q: 运行时报错 "Failed to initialize PDF engine"?
A: 确保你的系统支持 pdfium。macOS 需要 10.15+。

### Q: 如何添加更多功能？
A: 查看 `src-tauri/src/pdf/` 目录的 Rust 代码，和 `src/components/` 的前端代码。

## 技术栈说明

| 层级 | 技术 | 用途 |
|------|------|------|
| 前端 | React 18 + TypeScript | UI 界面 |
| 构建 | Vite | 前端构建工具 |
| 状态 | Zustand | 状态管理 |
| 后端 | Rust + Tauri 2.0 | 原生层 |
| PDF | pdfium-render | PDF 渲染引擎 |
| 缓存 | LRU | 页面渲染缓存 |

## 下一步开发

你可以在这个 Demo 基础上添加：

- [ ] 文本高亮标注
- [ ] 手写批注 (Apple Pencil)
- [ ] 区域笔记 (MarginNote 风格)
- [ ] 学习集管理
- [ ] 思维导图视图
- [ ] 云端同步
- [ ] OCR 文字识别

## 需要帮助？

- Tauri 文档: https://tauri.app/
- pdfium-render 文档: https://github.com/ajrcarey/pdfium-render
- React 文档: https://react.dev/
