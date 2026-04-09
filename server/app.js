/**
 * Express 应用入口
 * 墨 · 创意博客 - 动态博客系统
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

// 导入数据库
const { init: initDatabase, db } = require('./database');

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
app.use('/thumbnails', express.static(path.join(__dirname, '..', 'thumbnails')));

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

app.get('/admin/messages', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'admin', 'messages.html'));
});

// ==================== RSS/Atom Feed ====================

// XML 特殊字符转义
function escapeXml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// 获取 Feed 公共数据
function getFeedData() {
    const settings = {};
    db.prepare('SELECT key, value FROM settings').all().forEach(s => { settings[s.key] = s.value; });
    const articles = db.prepare(`
        SELECT a.title, a.slug, a.excerpt, a.published_at, a.created_at,
               c.name as category_name
        FROM articles a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.is_published = 1
        ORDER BY a.published_at DESC LIMIT 20
    `).all();
    return { settings, articles };
}

// RSS 2.0 Feed
app.get('/feed/rss', (req, res) => {
    try {
        const { settings, articles } = getFeedData();
        const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
        const siteName = escapeXml(settings.site_name || '墨 · 创意博客');
        const siteDesc = escapeXml(settings.site_description || '');
        const authorName = escapeXml(settings.author_name || '');

        let items = '';
        articles.forEach(article => {
            const articleUrl = `${siteUrl}/article/${article.slug}`;
            items += `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <pubDate>${new Date(article.published_at || article.created_at).toUTCString()}</pubDate>
      <description>${escapeXml(article.excerpt || '')}</description>
      ${article.category_name ? `<category>${escapeXml(article.category_name)}</category>` : ''}
    </item>`;
        });

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteName}</title>
    <link>${siteUrl}</link>
    <description>${siteDesc}</description>
    <language>zh-CN</language>
    <copyright>All rights reserved ${new Date().getFullYear()}, ${authorName}</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed/rss" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

        res.set('Content-Type', 'application/rss+xml; charset=utf-8');
        res.send(xml);
    } catch (error) {
        console.error('RSS生成错误:', error);
        res.status(500).send('Error generating RSS feed');
    }
});

// Atom 1.0 Feed
app.get('/feed/atom', (req, res) => {
    try {
        const { settings, articles } = getFeedData();
        const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
        const siteName = escapeXml(settings.site_name || '墨 · 创意博客');
        const siteDesc = escapeXml(settings.site_description || '');
        const authorName = escapeXml(settings.author_name || '');
        const now = new Date().toISOString();

        let entries = '';
        articles.forEach(article => {
            const articleUrl = `${siteUrl}/article/${article.slug}`;
            const updated = new Date(article.published_at || article.created_at).toISOString();
            entries += `
  <entry>
    <title type="text">${escapeXml(article.title)}</title>
    <id>${articleUrl}</id>
    <link href="${articleUrl}" rel="alternate"/>
    <updated>${updated}</updated>
    <summary type="text">${escapeXml(article.excerpt || '')}</summary>
    <author><name>${authorName}</name></author>
    ${article.category_name ? `<category term="${escapeXml(article.category_name)}"/>` : ''}
  </entry>`;
        });

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="zh-CN">
  <title type="text">${siteName}</title>
  <id>${siteUrl}</id>
  <link href="${siteUrl}" rel="alternate" type="text/html"/>
  <link href="${siteUrl}/feed/atom" rel="self" type="application/atom+xml"/>
  <subtitle type="text">${siteDesc}</subtitle>
  <rights>All rights reserved ${new Date().getFullYear()}, ${authorName}</rights>
  <updated>${now}</updated>
${entries}
</feed>`;

        res.set('Content-Type', 'application/atom+xml; charset=utf-8');
        res.send(xml);
    } catch (error) {
        console.error('Atom生成错误:', error);
        res.status(500).send('Error generating Atom feed');
    }
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
