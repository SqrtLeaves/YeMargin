#!/bin/bash

set -e

echo "🚀 PDF Reader Demo 安装脚本 (国内加速版)"
echo "========================================="

# 配置 Rust 国内镜像
export RUSTUP_DIST_SERVER="https://mirrors.tuna.tsinghua.edu.cn/rustup"
export RUSTUP_UPDATE_ROOT="https://mirrors.tuna.tsinghua.edu.cn/rustup/rustup"

echo "📦 使用清华镜像: $RUSTUP_DIST_SERVER"

# 检查是否安装了 Rust
if ! command -v rustc &> /dev/null; then
    echo "⚠️  未检测到 Rust，正在通过清华镜像安装..."
    curl --proto '=https' --tlsv1.2 -sSf https://mirrors.tuna.tsinghua.edu.cn/rustup/rustup-init.sh | sh -s -- -y
    source $HOME/.cargo/env
    
    # 配置 cargo 使用国内 crates.io 镜像
    mkdir -p ~/.cargo
    cat > ~/.cargo/config.toml << 'CARGO_CONFIG'
[source.crates-io]
replace-with = 'tuna'

[source.tuna]
registry = "https://mirrors.tuna.tsinghua.edu.cn/git/crates.io-index.git"
CARGO_CONFIG
    
    echo "✅ Rust 安装完成"
    echo "✅ Cargo 清华镜像配置完成"
else
    echo "✅ Rust 已安装: $(rustc --version)"
fi

# 检查是否安装了 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js 18+"
    echo "   推荐: https://nodejs.org/ 下载 LTS 版本"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本过低，需要 18+，当前: $(node --version)"
    exit 1
fi

echo "✅ Node.js 已安装: $(node --version)"

# 安装 Node 依赖
echo ""
echo "📦 安装 Node 依赖..."
npm install

# 安装 Tauri CLI
echo ""
echo "📦 安装 Tauri CLI..."
npm install -g @tauri-apps/cli@^2.0.0

echo ""
echo "✅ 安装完成！"
echo ""
echo "🎉 现在可以运行开发服务器:"
echo "   source ~/.cargo/env  # 如果是刚安装的 Rust"
echo "   npm run tauri:dev"
echo ""
echo "📦 或者构建生产版本:"
echo "   npm run tauri:build"
echo ""
