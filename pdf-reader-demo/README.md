# PDF Reader Demo

一个基于 **Tauri 2.0 + React + pdfium** 的高性能 PDF 阅读器 Demo，专为 macOS 设计（可扩展到 Windows/Linux）。

![screenshot](https://via.placeholder.com/800x500/f5f5f5/333333?text=PDF+Reader+Demo)

## ✨ 特性

- 🚀 **高性能渲染** - 使用 Google PDFium 引擎（Chrome 同款），比 PDF.js 快 5 倍
- 🎨 **三种主题** - 白天 / 夜间 / 护眼模式，一键切换
- 📄 **页面边距** - 可配置的周围留白，方便批注和笔记
- 💾 **智能缓存** - LRU 页面缓存，二次查看瞬间加载
- 🔍 **平滑缩放** - 25% - 400% 无级缩放
- 📚 **文档管理** - 最近文档列表，快速切换
- 🎯 **丝滑滚动** - 虚拟滚动优化，千页文档不卡顿

## 🖥️ 系统要求

- **macOS**: 10.15+ (Catalina)
- **Node.js**: 18+
- **Rust**: 1.75+

## 🚀 快速开始

### 方式一：一键安装（推荐）

```bash
cd pdf-reader-demo
./setup.sh
```

### 方式二：手动安装

```bash
# 1. 安装 Rust（如果还没有）
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# 2. 安装 Node 依赖
npm install

# 3. 安装 Tauri CLI
npm install -g @tauri-apps/cli@^2.0.0
```

## 💻 开发运行

```bash
# 启动开发服务器（首次编译需要 2-5 分钟）
npm run tauri:dev
```

会自动打开应用窗口，现在可以：
1. 点击"打开文件"选择 PDF
2. 使用 `⌘ + O` 快捷键
3. 从左侧最近文档中选择

## 📦 构建生产版本

```bash
# 构建 macOS 应用
npm run tauri:build

# 输出位置
# .dmg 安装包: src-tauri/target/release/bundle/dmg/
# .app 应用:   src-tauri/target/release/bundle/macos/
```

## 🎯 使用技巧

| 操作 | 说明 |
|------|------|
| 打开文件 | `⌘ + O` 或点击工具栏按钮 |
| 缩放 | 点击 `+` / `-` 或点击百分比重置 |
| 切换主题 | 点击右上角主题按钮 |
| 滚动 | 鼠标滚轮或触控板，当前页码自动更新 |
| 页面边距 | 自动添加，可在设置中调整宽度 |

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

## 📁 项目结构

```
pdf-reader-demo/
├── src/                    # 前端源码
│   ├── components/         # React 组件
│   ├── stores/             # 状态管理
│   └── types/              # TypeScript 类型
├── src-tauri/              # Rust 后端
│   ├── src/pdf/            # PDF 处理模块
│   └── Cargo.toml          # Rust 依赖
└── [配置文件]
```

详细结构查看 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

## 🛠️ 扩展开发

在这个 Demo 基础上，你可以添加：

### 标注功能
- [ ] 文本高亮（多颜色）
- [ ] 手写笔迹（Apple Pencil 支持）
- [ ] 文字批注
- [ ] 区域笔记（MarginNote 风格）

### 学习工具
- [ ] 学习集管理
- [ ] 思维导图视图
- [ ] 闪卡复习
- [ ] 笔记导出 (Markdown/PDF)

### 同步与存储
- [ ] 指定数据目录（iCloud/Dropbox 同步）
- [ ] 学习进度同步
- [ ] 全库搜索

### 高级功能
- [ ] OCR 文字识别
- [ ] PDF 编辑（合并、拆分）
- [ ] 目录导航
- [ ] 全文搜索

## 🐛 常见问题

**Q: 编译报错 "Failed to initialize PDF engine"?**
A: 确保 macOS 版本 >= 10.15，且 Rust 版本 >= 1.75

**Q: PDF 渲染很慢？**
A: 首次渲染需要编译缓存，之后会从 LRU 缓存读取

**Q: 如何调试 Rust 代码？**
A: 使用 `cargo build` 查看详细错误，或查看 `src-tauri/target/` 中的日志

**Q: 能支持 Windows 吗？**
A: 代码是跨平台的，只需要在 Windows 上重新编译即可

## 📚 相关文档

- [Tauri 文档](https://tauri.app/)
- [pdfium-render](https://github.com/ajrcarey/pdfium-render)
- [React 文档](https://react.dev/)

## 📝 License

MIT License - 自由使用和修改

---

**Made with ❤️ for PDF lovers**
