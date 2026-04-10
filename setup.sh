#!/bin/bash
# ============================================================
#  墨 · 创意博客 — 一键部署脚本
#  用法: bash setup.sh [--port 端口号]
#  示例: bash setup.sh --port 8080
# ============================================================

set -e

# ---------- 颜色定义 ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ---------- 辅助函数 ----------
info()    { echo -e "${BLUE}[信息]${NC} $1"; }
success() { echo -e "${GREEN}[完成]${NC} $1"; }
warn()    { echo -e "${YELLOW}[警告]${NC} $1"; }
error()   { echo -e "${RED}[错误]${NC} $1"; exit 1; }

# ---------- 解析参数 ----------
PORT=3000
while [[ $# -gt 0 ]]; do
    case $1 in
        --port) PORT="$2"; shift 2 ;;
        *) error "未知参数: $1，用法: bash setup.sh [--port 端口号]" ;;
    esac
done

# ---------- 打印 Banner ----------
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}║          墨 · 创意博客 — 一键部署脚本                        ║${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ---------- 检测操作系统 ----------
info "检测操作系统..."
OS="$(uname -s)"
if [[ "$OS" == "Linux" ]]; then
    if command -v lsb_release &>/dev/null; then
        DISTRO=$(lsb_release -is 2>/dev/null || echo "Unknown")
    elif [[ -f /etc/os-release ]]; then
        DISTRO=$(grep '^ID=' /etc/os-release | cut -d= -f2 | tr -d '"')
    else
        DISTRO="Unknown"
    fi
    success "系统: $(uname -m) / $DISTRO"
else
    error "本脚本仅支持 Linux 服务器（当前系统: $OS）"
fi

# ---------- 检测并安装 Node.js ----------
NODE_MIN_VERSION=18
install_node() {
    info "正在安装 Node.js $NODE_MIN_VERSION.x ..."
    if command -v apt-get &>/dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_${NODE_MIN_VERSION}.x | sudo -E bash - 2>/dev/null || {
            warn "nodesource 安装失败，尝试手动安装..."
            sudo apt-get update -qq
            sudo apt-get install -y -qq nodejs npm
        }
        sudo apt-get install -y -qq nodejs
    elif command -v yum &>/dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_${NODE_MIN_VERSION}.x | sudo bash - 2>/dev/null || {
            sudo yum install -y nodejs npm
        }
        sudo yum install -y nodejs npm
    else
        error "无法自动安装 Node.js，请手动安装 Node.js >= $NODE_MIN_VERSION"
    fi
}

if command -v node &>/dev/null; then
    NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
    if [[ "$NODE_VERSION" -lt "$NODE_MIN_VERSION" ]]; then
        warn "Node.js 版本过低 (v$(node -v))，需要 >= v${NODE_MIN_VERSION}，正在升级..."
        install_node
    else
        success "Node.js $(node -v) 已安装"
    fi
else
    warn "未检测到 Node.js，正在安装..."
    install_node
    success "Node.js $(node -v) 安装完成"
fi

# 检测 npm
if command -v npm &>/dev/null; then
    success "npm $(npm -v) 已安装"
else
    info "正在安装 npm..."
    if command -v apt-get &>/dev/null; then
        sudo apt-get install -y -qq npm
    elif command -v yum &>/dev/null; then
        sudo yum install -y npm
    fi
    success "npm $(npm -v) 安装完成"
fi

# ---------- 安装构建工具 ----------
info "检测 C++ 编译工具..."
NEED_BUILD_TOOLS=false

if ! command -v python3 &>/dev/null; then NEED_BUILD_TOOLS=true; fi
if ! command -v make &>/dev/null; then NEED_BUILD_TOOLS=true; fi
if ! command -v g++ &>/dev/null && ! command -v gcc &>/dev/null; then NEED_BUILD_TOOLS=true; fi

if [[ "$NEED_BUILD_TOOLS" == true ]]; then
    info "正在安装编译工具 (python3, make, g++)..."
    if command -v apt-get &>/dev/null; then
        sudo apt-get update -qq
        sudo apt-get install -y -qq python3 make g++
    elif command -v yum &>/dev/null; then
        sudo yum install -y python3 make gcc-c++
    fi
    success "编译工具安装完成"
else
    success "编译工具已就绪"
fi

# ---------- 安装项目依赖 ----------
info "安装项目依赖..."
if [[ -d "node_modules" ]]; then
    warn "node_modules 已存在，重新安装..."
    rm -rf node_modules
fi
npm install --production 2>&1 | tail -1
success "依赖安装完成"

# ---------- 生成配置文件 ----------
if [[ ! -f ".env" ]]; then
    if [[ -f ".env.example" ]]; then
        cp .env.example .env
        # 生成随机 JWT_SECRET
        RANDOM_SECRET=$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
        if [[ "$(uname)" == "Linux" ]]; then
            sed -i "s/your-secret-key-please-change/$RANDOM_SECRET/" .env
        else
            sed -i '' "s/your-secret-key-please-change/$RANDOM_SECRET/" .env
        fi
        # 设置端口
        if [[ "$(uname)" == "Linux" ]]; then
            sed -i "s/^PORT=.*/PORT=$PORT/" .env
        else
            sed -i '' "s/^PORT=.*/PORT=$PORT/" .env
        fi
        success ".env 配置文件已生成（JWT_SECRET 已随机化）"
    else
        warn ".env.example 不存在，跳过配置生成"
    fi
else
    success ".env 配置文件已存在"
fi

# ---------- 防火墙放行 ----------
info "配置防火墙（放行端口 $PORT）..."

# ufw
if command -v ufw &>/dev/null; then
    if sudo ufw status | grep -q "active"; then
        sudo ufw allow $PORT/tcp 2>/dev/null && success "ufw: 端口 $PORT 已放行" || warn "ufw: 放行失败，请手动执行: sudo ufw allow $PORT/tcp"
    else
        warn "ufw 未启用，跳过"
    fi
fi

# firewalld
if command -v firewall-cmd &>/dev/null; then
    if sudo firewall-cmd --state &>/dev/null | grep -q "running"; then
        sudo firewall-cmd --permanent --add-port=$PORT/tcp 2>/dev/null
        sudo firewall-cmd --reload 2>/dev/null
        success "firewalld: 端口 $PORT 已放行"
    else
        warn "firewalld 未运行，跳过"
    fi
fi

# iptables（仅提示）
if command -v iptables &>/dev/null && ! command -v ufw &>/dev/null && ! command -v firewall-cmd &>/dev/null; then
    if sudo iptables -L INPUT -n | grep -q "dpt:$PORT "; then
        success "iptables: 端口 $PORT 已放行"
    else
        warn "iptables: 端口 $PORT 未放行，请手动执行:"
        echo -e "       ${YELLOW}sudo iptables -I INPUT -p tcp --dport $PORT -j ACCEPT${NC}"
        echo -e "       ${YELLOW}sudo iptables-save > /etc/iptables.rules${NC}"
    fi
fi

# 云服务器安全组提示
warn "如果使用云服务器（阿里云/腾讯云/AWS 等），请在控制台安全组中放行 TCP $PORT 端口"

# ---------- 启动服务 ----------
info "启动墨 · 创意博客服务..."

# 确保 mo 可执行
chmod +x mo 2>/dev/null || true

# 使用 mo CLI 启动（自动处理端口占用和 PID 管理）
if [[ -f "mo" ]]; then
    ./mo restart
else
    # 回退：直接启动
    EXISTING_PID=$(lsof -ti:$PORT 2>/dev/null || true)
    if [[ -n "$EXISTING_PID" ]]; then
        kill -9 $EXISTING_PID 2>/dev/null || true
        sleep 1
    fi
    nohup node server/app.js > mo-blog.log 2>&1 &
fi

# ---------- 获取公网 IP ----------
echo ""
PUBLIC_IP=$(curl -s --connect-timeout 3 ifconfig.me 2>/dev/null || curl -s --connect-timeout 3 ip.sb 2>/dev/null || echo "你的服务器IP")

# ---------- 输出结果 ----------
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║   🎉 墨 · 创意博客 部署成功！                               ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}前台首页:${NC}  http://${PUBLIC_IP}:${PORT}"
echo -e "  ${BOLD}后台管理:${NC}  http://${PUBLIC_IP}:${PORT}/admin"
echo ""
echo -e "  ${BOLD}默认账号:${NC}  admin / admin123"
echo -e "  ${YELLOW}⚠️  首次登录后请立即修改密码！${NC}"
echo ""
echo -e "  ${BOLD}日志查看:${NC}  tail -f mo-blog.log"
echo -e "  ${BOLD}服务管理:${NC}  ./mo start | ./mo stop | ./mo restart | ./mo status"
echo ""
