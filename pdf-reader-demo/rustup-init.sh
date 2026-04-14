#!/bin/bash
# 配置 Rust 国内镜像

# 清华源
export RUSTUP_DIST_SERVER="https://mirrors.tuna.tsinghua.edu.cn/rustup"
export RUSTUP_UPDATE_ROOT="https://mirrors.tuna.tsinghua.edu.cn/rustup/rustup"

# 或者使用中科大源（如果清华不稳定）
# export RUSTUP_DIST_SERVER="https://mirrors.ustc.edu.cn/rust-static"
# export RUSTUP_UPDATE_ROOT="https://mirrors.ustc.edu.cn/rust-static/rustup"

echo "🚀 使用清华镜像安装 Rust..."
echo "RUSTUP_DIST_SERVER: $RUSTUP_DIST_SERVER"

# 下载并运行 rustup-init
curl --proto '=https' --tlsv1.2 -sSf https://mirrors.tuna.tsinghua.edu.cn/rustup/rustup-init.sh | sh -s -- -y

# 配置 cargo 使用国内 crates.io 镜像
mkdir -p ~/.cargo
cat > ~/.cargo/config.toml << 'CARGO_CONFIG'
[source.crates-io]
replace-with = 'tuna'

[source.tuna]
registry = "https://mirrors.tuna.tsinghua.edu.cn/git/crates.io-index.git"

# 备用：中科大镜像
# [source.ustc]
# registry = "git://mirrors.ustc.edu.cn/crates.io-index"
CARGO_CONFIG

echo "✅ Rust 安装完成！"
echo "✅ Cargo 镜像配置完成！"
echo ""
echo "请运行: source ~/.cargo/env"
echo "然后继续: npm run tauri:dev"
