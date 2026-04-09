/**
 * Express 应用入口
 * 墨 · 创意博客 - 动态博客系统
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

// 导入数据库
const { init: initDatabase } = require('./database');

// 导入路由
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');

// 创建应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API 路由
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

// 页面路由 - 首页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'index.html'));
});

// 页面路由 - 文章列表
app.get('/articles', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'articles.html'));
});

// 页面路由 - 文章详情
app.get('/article/:slug', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'article.html'));
});

// 页面路由 - 关于我
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'about.html'));
});

// 页面路由 - 作品集
app.get('/portfolio', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'portfolio.html'));
});

// 页面路由 - 联系我
app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'contact.html'));
});

// 后台路由
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'admin', 'dashboard.html'));
});

app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'admin', 'login.html'));
});

app.get('/admin/articles', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'admin', 'articles.html'));
});

app.get('/admin/articles/edit/:id?', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'admin', 'article-edit.html'));
});

app.get('/admin/media', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'admin', 'media.html'));
});

app.get('/admin/categories', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'admin', 'categories.html'));
});

app.get('/admin/portfolios', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'admin', 'portfolios.html'));
});

app.get('/admin/settings', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'admin', 'settings.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ 
        success: false, 
        message: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误' 
    });
});

// 404 处理
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '..', 'public', 'pages', '404.html'));
});

// 启动服务器
async function start() {
    try {
        // 初始化数据库
        initDatabase();

        // 启动服务
        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   墨 · 创意博客 - 动态博客系统                              ║
║                                                            ║
║   服务已启动: http://localhost:${PORT}                        ║
║   后台管理:   http://localhost:${PORT}/admin                  ║
║                                                            ║
║   默认账号: admin / admin123                                ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
            `);
        });
    } catch (error) {
        console.error('启动失败:', error);
        process.exit(1);
    }
}

start();

module.exports = app;
