#!/usr/bin/env bash
set -e

# ============================================================================
# 墨 · 创意博客 - 一键安装脚本
# 用法: bash <(curl -fsSL https://raw.githubusercontent.com/Xynrin/Mo-blog-project/main/install.sh)
# ============================================================================

# ---------- 颜色定义 ----------
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ---------- 辅助函数 ----------
print_green()  { echo -e "${GREEN}$1${NC}"; }
print_red()    { echo -e "${RED}$1${NC}"; }
print_yellow() { echo -e "${YELLOW}$1${NC}"; }
print_blue()   { echo -e "${BLUE}$1${NC}"; }
print_cyan()   { echo -e "${CYAN}$1${NC}"; }
print_bold()   { echo -e "${BOLD}$1${NC}"; }

info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }

# ---------- Banner ----------
show_banner() {
    echo ""
    print_cyan "  ╔══════════════════════════════════════════╗"
    print_cyan "  ║                                          ║"
    print_cyan "  ║       墨 · 创意博客 一键安装脚本           ║"
    print_cyan "  ║       Mo Blog Installer                  ║"
    print_cyan "  ║                                          ║"
    print_cyan "  ╚══════════════════════════════════════════╝"
    echo ""
}

# ---------- 检测系统 ----------
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS_ID="$ID"
        OS_VERSION="$VERSION_ID"
    else
        OS_ID="unknown"
        OS_VERSION="unknown"
    fi
    info "检测到系统: ${OS_ID} ${OS_VERSION}"
}

# ---------- 交互式配置 ----------
interactive_config() {
    echo ""
    print_bold "====== 交互式配置 ======"
    echo ""

    # 端口
    read -rp "请输入端口号 [默认 3000]: " INPUT_PORT
    PORT="${INPUT_PORT:-3000}"
    # 验证端口为数字且在合法范围
    if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
        error "端口号无效，使用默认值 3000"
        PORT=3000
    fi
    success "端口设置为: ${PORT}"

    # 管理员用户名
    read -rp "请输入管理员用户名 [默认 admin]: " INPUT_USER
    ADMIN_USER="${INPUT_USER:-admin}"
    success "管理员用户名: ${ADMIN_USER}"

    # 管理员密码（隐藏输入）
    echo ""
    read -rsp "请输入管理员密码 [默认 admin123]: " INPUT_PASS
    echo ""
    if [ -z "$INPUT_PASS" ]; then
        ADMIN_PASS="admin123"
    else
        ADMIN_PASS="$INPUT_PASS"
    fi
    success "管理员密码已设置"

    echo ""
    print_bold "========================="
    echo ""
}

# ---------- 检测/安装 Node.js ----------
install_nodejs() {
    info "检查 Node.js ..."

    if command -v node &>/dev/null; then
        local node_version
        node_version=$(node -v 2>/dev/null | sed 's/^v//' | cut -d. -f1)
        if [ -n "$node_version" ] && [ "$node_version" -ge 18 ]; then
            success "Node.js 已安装，版本: $(node -v)"
            return 0
        else
            warn "Node.js 版本过低（当前: $(node -v)，需要 >= 18），正在升级..."
        fi
    fi

    info "正在安装 Node.js 18.x ..."

    # 检测包管理器并安装
    if command -v apt-get &>/dev/null; then
        # 使用 NodeSource 安装
        if ! command -v curl &>/dev/null; then
            apt-get update -qq && apt-get install -y -qq curl > /dev/null 2>&1
        fi
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash - > /dev/null 2>&1
        apt-get install -y -qq nodejs > /dev/null 2>&1
    elif command -v yum &>/dev/null; then
        if ! command -v curl &>/dev/null; then
            yum install -y -q curl > /dev/null 2>&1
        fi
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - > /dev/null 2>&1
        yum install -y -q nodejs > /dev/null 2>&1
    elif command -v dnf &>/dev/null; then
        if ! command -v curl &>/dev/null; then
            dnf install -y -q curl > /dev/null 2>&1
        fi
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - > /dev/null 2>&1
        dnf install -y -q nodejs > /dev/null 2>&1
    else
        error "无法检测包管理器，请手动安装 Node.js >= 18"
        exit 1
    fi

    # 验证安装
    if command -v node &>/dev/null; then
        success "Node.js 安装成功，版本: $(node -v)"
    else
        error "Node.js 安装失败，请手动安装"
        exit 1
    fi
}

# ---------- 安装编译工具 ----------
install_build_tools() {
    info "检查编译工具 ..."

    local need_install=false

    for cmd in python3 make g++; do
        if ! command -v "$cmd" &>/dev/null; then
            need_install=true
            break
        fi
    done

    if [ "$need_install" = false ]; then
        success "编译工具已就绪"
        return 0
    fi

    info "正在安装编译工具 (python3 make g++) ..."

    if command -v apt-get &>/dev/null; then
        apt-get update -qq > /dev/null 2>&1
        apt-get install -y -qq python3 make g++ > /dev/null 2>&1
    elif command -v yum &>/dev/null; then
        yum install -y -q python3 make gcc-c++ > /dev/null 2>&1
    elif command -v dnf &>/dev/null; then
        dnf install -y -q python3 make gcc-c++ > /dev/null 2>&1
    else
        warn "无法自动安装编译工具，某些 npm 包可能编译失败"
        return 0
    fi

    success "编译工具安装完成"
}

# ---------- 生成随机 JWT_SECRET ----------
generate_jwt_secret() {
    if command -v openssl &>/dev/null; then
        openssl rand -hex 32
    elif command -v head &>/dev/null && command -v tr &>/dev/null; then
        head -c 64 /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c 32
    else
        # 回退方案：使用日期和随机数
        echo "jwt_secret_$(date +%s)_${RANDOM}"
    fi
}

# ---------- 生成 .env 文件 ----------
generate_env() {
    local jwt_secret
    jwt_secret=$(generate_jwt_secret)

    cat > "${PROJECT_DIR}/.env" <<EOF
# 墨 · 创意博客 配置文件
# 由安装脚本自动生成

PORT=${PORT}
ADMIN_USER=${ADMIN_USER}
ADMIN_PASS=${ADMIN_PASS}
JWT_SECRET=${jwt_secret}
EOF

    chmod 600 "${PROJECT_DIR}/.env"
    success ".env 配置文件已生成"
}

# ---------- 防火墙放行 ----------
configure_firewall() {
    info "配置防火墙放行端口 ${PORT} ..."

    # ufw
    if command -v ufw &>/dev/null; then
        if ufw status | grep -q "active"; then
            ufw allow "$PORT/tcp" > /dev/null 2>&1
            success "ufw 已放行端口 ${PORT}"
            return 0
        fi
    fi

    # firewalld
    if command -v firewall-cmd &>/dev/null; then
        if systemctl is-active --quiet firewalld 2>/dev/null; then
            firewall-cmd --permanent --add-port="${PORT}/tcp" > /dev/null 2>&1
            firewall-cmd --reload > /dev/null 2>&1
            success "firewalld 已放行端口 ${PORT}"
            return 0
        fi
    fi

    # iptables
    if command -v iptables &>/dev/null; then
        if iptables -C INPUT -p tcp --dport "$PORT" -j ACCEPT 2>/dev/null; then
            success "iptables 已存在端口 ${PORT} 的放行规则"
        else
            iptables -I INPUT -p tcp --dport "$PORT" -j ACCEPT 2>/dev/null
            # 尝试保存规则
            if command -v iptables-save &>/dev/null; then
                iptables-save > /etc/iptables.rules 2>/dev/null || true
            fi
            success "iptables 已放行端口 ${PORT}"
        fi
        return 0
    fi

    warn "未检测到防火墙，跳过防火墙配置"
}

# ---------- 获取公网 IP ----------
get_public_ip() {
    # 尝试多种方式获取公网 IP
    local ip=""

    ip=$(curl -s --connect-timeout 5 --max-time 10 ifconfig.me 2>/dev/null) && [ -n "$ip" ] && echo "$ip" && return

    ip=$(curl -s --connect-timeout 5 --max-time 10 ip.sb 2>/dev/null) && [ -n "$ip" ] && echo "$ip" && return

    ip=$(curl -s --connect-timeout 5 --max-time 10 ipinfo.io/ip 2>/dev/null) && [ -n "$ip" ] && echo "$ip" && return

    echo "未知"
}

# ---------- 主流程 ----------
main() {
    show_banner
    detect_os

    # 交互式配置
    interactive_config

    # 检测/安装 Node.js
    install_nodejs

    # 安装编译工具
    install_build_tools

    # 克隆项目
    PROJECT_NAME="Mo-blog-project"
    if [ -d "${PROJECT_NAME}" ]; then
        warn "项目目录 ${PROJECT_NAME} 已存在，跳过克隆"
    else
        info "正在克隆项目..."
        git clone https://github.com/Xynrin/Mo-blog-project.git "${PROJECT_NAME}" || {
            error "项目克隆失败，请检查网络连接后重试"
            exit 1
        }
        success "项目克隆完成"
    fi

    PROJECT_DIR="$(cd "${PROJECT_NAME}" && pwd)"

    # 安装依赖
    info "正在安装项目依赖..."
    cd "$PROJECT_DIR"
    npm install --production || {
        error "依赖安装失败，请查看上方错误信息"
        exit 1
    }
    success "项目依赖安装完成"

    # 生成 .env
    generate_env

    # 防火墙配置
    configure_firewall

    # 启动服务
    echo ""
    info "正在启动墨 · 创意博客..."
    chmod +x mo && ./mo start || {
        error "服务启动失败，请查看日志排查问题"
        exit 1
    }

    # 获取公网 IP
    echo ""
    info "正在获取公网 IP..."
    PUBLIC_IP=$(get_public_ip)

    # 输出结果
    echo ""
    print_green "============================================"
    print_green "  墨 · 创意博客 安装完成！"
    print_green "============================================"
    echo ""
    print_bold "  访问地址:"
    print_cyan "    本地:   http://localhost:${PORT}"
    print_cyan "    公网:   http://${PUBLIC_IP}:${PORT}"
    echo ""
    print_bold "  管理员账号:"
    print_cyan "    用户名: ${ADMIN_USER}"
    print_cyan "    密码:   ${ADMIN_PASS}"
    echo ""
    print_yellow "  提示: 首次登录后请立即修改默认密码！"
    echo ""
    print_bold "  管理命令:"
    print_cyan "    cd ${PROJECT_DIR}"
    print_cyan "    ./mo start     # 启动服务"
    print_cyan "    ./mo stop      # 停止服务"
    print_cyan "    ./mo restart   # 重启服务"
    print_cyan "    ./mo status    # 查看状态"
    echo ""
    print_green "============================================"
    echo ""
}

main "$@"
