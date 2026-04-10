#!/usr/bin/env bash
set -e

# ============================================================================
# 墨 · 创意博客 CLI 管理工具
# ============================================================================

# ---------- 颜色定义 ----------
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ---------- 路径 ----------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="${SCRIPT_DIR}/.mo.pid"
LOG_FILE="${SCRIPT_DIR}/mo-blog.log"
PROJECT_DIR="${SCRIPT_DIR}"

# ---------- 辅助函数 ----------
print_green()  { echo -e "${GREEN}$1${NC}"; }
print_red()    { echo -e "${RED}$1${NC}"; }
print_yellow() { echo -e "${YELLOW}$1${NC}"; }
print_blue()   { echo -e "${BLUE}$1${NC}"; }

# 检查是否在项目目录中（通过判断 server/app.js 是否存在）
check_project_dir() {
    if [ ! -f "${PROJECT_DIR}/server/app.js" ]; then
        print_red "错误：请在墨 · 创意博客项目目录中运行此脚本。"
        print_red "未找到 server/app.js"
        exit 1
    fi
}

# 从 .env 读取端口
get_port() {
    local port=3000
    if [ -f "${PROJECT_DIR}/.env" ]; then
        local env_port
        env_port=$(grep -E '^PORT=' "${PROJECT_DIR}/.env" 2>/dev/null | head -1 | cut -d'=' -f2 | tr -d '[:space:]')
        if [ -n "$env_port" ]; then
            port="$env_port"
        fi
    fi
    echo "$port"
}

# 检查端口是否被占用
check_port() {
    local port="$1"
    if command -v ss &>/dev/null; then
        ss -tlnp 2>/dev/null | grep -q ":${port} " && return 0
    elif command -v netstat &>/dev/null; then
        netstat -tlnp 2>/dev/null | grep -q ":${port} " && return 0
    elif command -v lsof &>/dev/null; then
        lsof -i :"$port" &>/dev/null && return 0
    fi
    return 1
}

# 检查 PID 文件中的进程是否存活
is_pid_alive() {
    local pid="$1"
    [ -z "$pid" ] && return 1
    kill -0 "$pid" 2>/dev/null
}

# 验证进程是否为 node server/app.js
verify_process() {
    local pid="$1"
    if [ ! -d "/proc/${pid}" ]; then
        return 1
    fi
    local cmdline
    cmdline=$(tr '\0' ' ' < "/proc/${pid}/cmdline" 2>/dev/null)
    echo "$cmdline" | grep -q "node.*server/app.js"
}

# 获取进程运行时间
get_uptime() {
    local pid="$1"
    if [ ! -d "/proc/${pid}" ]; then
        echo "未知"
        return
    fi
    local etime
    etime=$(ps -o etime= -p "$pid" 2>/dev/null | tr -d ' ')
    if [ -n "$etime" ]; then
        echo "$etime"
    else
        echo "未知"
    fi
}

# ---------- 命令实现 ----------

do_start() {
    check_project_dir

    # 检查是否已在运行
    if [ -f "$PID_FILE" ]; then
        local old_pid
        old_pid=$(cat "$PID_FILE" 2>/dev/null)
        if is_pid_alive "$old_pid" && verify_process "$old_pid"; then
            print_yellow "墨 · 创意博客已在运行中 (PID: ${old_pid})"
            exit 0
        else
            print_yellow "发现残留 PID 文件，正在清理..."
            rm -f "$PID_FILE"
        fi
    fi

    # 检查端口
    local port
    port=$(get_port)
    if check_port "$port"; then
        print_red "错误：端口 ${port} 已被占用，请检查或修改 .env 中的 PORT 配置。"
        exit 1
    fi

    # 检查 node 是否可用
    if ! command -v node &>/dev/null; then
        print_red "错误：未找到 node，请先安装 Node.js。"
        exit 1
    fi

    # 启动服务
    print_blue "正在启动墨 · 创意博客..."
    cd "$PROJECT_DIR"
    nohup node server/app.js > "$LOG_FILE" 2>&1 &
    local pid=$!
    echo "$pid" > "$PID_FILE"

    # 等待并验证启动
    sleep 1
    if is_pid_alive "$pid"; then
        print_green "墨 · 创意博客启动成功！"
        print_green "  PID:  ${pid}"
        print_green "  端口: ${port}"
        print_green "  日志: ${LOG_FILE}"
    else
        print_red "启动失败，请查看日志：${LOG_FILE}"
        rm -f "$PID_FILE"
        exit 1
    fi
}

do_stop() {
    check_project_dir

    if [ ! -f "$PID_FILE" ]; then
        print_yellow "墨 · 创意博客未在运行（未找到 PID 文件）。"
        exit 0
    fi

    local pid
    pid=$(cat "$PID_FILE" 2>/dev/null)

    if [ -z "$pid" ]; then
        print_yellow "PID 文件为空，正在清理..."
        rm -f "$PID_FILE"
        exit 0
    fi

    if ! is_pid_alive "$pid"; then
        print_yellow "进程 ${pid} 已不存在，正在清理 PID 文件..."
        rm -f "$PID_FILE"
        exit 0
    fi

    if ! verify_process "$pid"; then
        print_red "错误：PID ${pid} 对应的进程不是 node server/app.js，为防止误杀，拒绝操作。"
        print_red "如确需停止，请手动删除 ${PID_FILE} 后重试。"
        exit 1
    fi

    print_blue "正在停止墨 · 创意博客 (PID: ${pid})..."
    kill "$pid"

    # 等待进程退出（最多 10 秒）
    local retry=0
    while is_pid_alive "$pid" && [ $retry -lt 10 ]; do
        sleep 1
        retry=$((retry + 1))
    done

    if is_pid_alive "$pid"; then
        print_yellow "进程未响应 SIGTERM，发送 SIGKILL..."
        kill -9 "$pid" 2>/dev/null || true
        sleep 1
    fi

    rm -f "$PID_FILE"
    print_green "墨 · 创意博客已停止。"
}

do_restart() {
    print_blue "正在重启墨 · 创意博客..."
    do_stop
    echo ""
    do_start
}

do_status() {
    check_project_dir

    if [ ! -f "$PID_FILE" ]; then
        print_red "墨 · 创意博客未在运行。"
        exit 0
    fi

    local pid
    pid=$(cat "$PID_FILE" 2>/dev/null)

    if [ -z "$pid" ]; then
        print_red "PID 文件为空，服务状态异常。"
        exit 1
    fi

    if ! is_pid_alive "$pid"; then
        print_red "墨 · 创意博客未在运行（进程 ${pid} 已退出）。"
        print_yellow "如需启动，请执行: mo start"
        rm -f "$PID_FILE"
        exit 0
    fi

    if ! verify_process "$pid"; then
        print_red "墨 · 创意博客状态异常：PID ${pid} 对应的进程不是 node server/app.js。"
        exit 1
    fi

    local port uptime
    port=$(get_port)
    uptime=$(get_uptime "$pid")

    print_green "墨 · 创意博客正在运行"
    print_green "  PID:     ${pid}"
    print_green "  端口:    ${port}"
    print_green "  运行时间: ${uptime}"
    print_green "  日志:    ${LOG_FILE}"
}

do_help() {
    print_blue "========================================"
    print_blue "  墨 · 创意博客 CLI 管理工具"
    print_blue "========================================"
    echo ""
    echo "用法: mo <command>"
    echo ""
    echo "命令:"
    echo "  start    启动服务"
    echo "  stop     停止服务"
    echo "  restart  重启服务"
    echo "  status   查看服务状态"
    echo "  help     显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  mo start     # 启动博客服务"
    echo "  mo status    # 查看运行状态"
    echo "  mo restart   # 重启服务"
    echo ""
}

# ---------- 入口 ----------
case "${1:-}" in
    start)
        do_start
        ;;
    stop)
        do_stop
        ;;
    restart)
        do_restart
        ;;
    status)
        do_status
        ;;
    help|--help|-h)
        do_help
        ;;
    "")
        do_help
        ;;
    *)
        print_red "未知命令: $1"
        echo ""
        do_help
        exit 1
        ;;
esac
