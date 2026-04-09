/**
 * 墨 · 管理后台 - 通用工具函数
 */

// API 基础地址
const API_BASE = '';

/**
 * 获取认证请求头
 */
function getAuthHeaders(includeContentType = false) {
    const token = localStorage.getItem('admin_token');
    const headers = {};
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (includeContentType) {
        // 不设置 Content-Type，让浏览器自动处理 multipart/form-data
    } else {
        headers['Content-Type'] = 'application/json';
    }
    
    return headers;
}

/**
 * 检查登录状态
 */
function checkAuth() {
    const token = localStorage.getItem('admin_token');
    const user = localStorage.getItem('admin_user');
    
    if (!token) {
        window.location.href = '/admin/login';
        return false;
    }
    
    // 更新用户信息显示
    if (user) {
        try {
            const userData = JSON.parse(user);
            const avatarEl = document.getElementById('userAvatar');
            const nameEl = document.getElementById('userName');
            
            if (avatarEl) {
                avatarEl.textContent = (userData.displayName || userData.username || 'M').charAt(0).toUpperCase();
            }
            if (nameEl) {
                nameEl.textContent = userData.displayName || userData.username || '管理员';
            }
        } catch (e) {
            console.error('解析用户信息失败:', e);
        }
    }
    
    return true;
}

/**
 * 退出登录
 */
function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/admin/login';
}

/**
 * 显示 Toast 提示
 */
function showToast(message, type = 'info') {
    let container = document.querySelector('.admin-toast-container');
    
    if (!container) {
        container = document.createElement('div');
        container.className = 'admin-toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `<span class="icon">${icon}</span><span>${escapeHtml(message)}</span>`;
    
    container.appendChild(toast);
    
    // 3秒后自动移除
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * HTML 转义
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 格式化日期
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}.${month}.${day}`;
}

/**
 * 格式化日期时间
 */
function formatDateTime(dateString) {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}.${month}.${day} ${hours}:${minutes}`;
}

/**
 * 格式化数字（添加千分位）
 */
function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    
    if (num >= 10000) {
        return (num / 10000).toFixed(1) + 'W';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 防抖函数
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 节流函数
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 移动端侧边栏切换
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// 全局错误处理
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (event.reason && event.reason.message) {
        // 如果是认证错误，跳转到登录页
        if (event.reason.message.includes('401') || event.reason.message.includes('认证')) {
            logout();
        }
    }
});
