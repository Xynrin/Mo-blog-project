/**
 * 前端 API 路由
 */

const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { marked } = require('marked');

// 配置 marked
marked.setOptions({
    breaks: true,
    gfm: true
});

/**
 * 获取网站设置
 * GET /api/settings
 */
router.get('/settings', (req, res) => {
    try {
        const settings = db.prepare('SELECT key, value FROM settings').all();
        const result = {};
        settings.forEach(s => {
            result[s.key] = s.value;
        });
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: '获取设置失败' });
    }
});

/**
 * 获取文章列表
 * GET /api/articles
 */
router.get('/articles', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const categoryId = req.query.category;
        const offset = (page - 1) * limit;

        let sql = `
            SELECT a.id, a.title, a.slug, a.excerpt, a.cover_image, 
                   a.view_count, a.is_featured, a.published_at,
                   c.id as category_id, c.name as category_name, c.color as category_color
            FROM articles a
            LEFT JOIN categories c ON a.category_id = c.id
            WHERE a.is_published = 1
        `;
        const params = [];

        if (categoryId) {
            sql += ' AND a.category_id = ?';
            params.push(categoryId);
        }

        sql += ' ORDER BY a.is_featured DESC, a.published_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const articles = db.prepare(sql).all(...params);

        // 获取总数
        let countSql = 'SELECT COUNT(*) as count FROM articles WHERE is_published = 1';
        const countParams = [];
        if (categoryId) {
            countSql += ' AND category_id = ?';
            countParams.push(categoryId);
        }
        const total = db.prepare(countSql).get(...countParams);

        res.json({
            success: true,
            data: {
                articles,
                pagination: {
                    page,
                    limit,
                    total: total.count,
                    totalPages: Math.ceil(total.count / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取文章列表错误:', error);
        res.status(500).json({ success: false, message: '获取文章列表失败' });
    }
});

/**
 * 获取文章详情
 * GET /api/articles/:slug
 */
router.get('/articles/:slug', (req, res) => {
    try {
        const { slug } = req.params;

        const article = db.prepare(`
            SELECT a.*, c.name as category_name, c.color as category_color
            FROM articles a
            LEFT JOIN categories c ON a.category_id = c.id
            WHERE a.slug = ? AND a.is_published = 1
        `).get(slug);

        if (!article) {
            return res.status(404).json({ success: false, message: '文章不存在' });
        }

        // 增加阅读量
        db.prepare('UPDATE articles SET view_count = view_count + 1 WHERE id = ?').run(article.id);

        // 解析 Markdown
        article.content_html = marked.parse(article.content || '');

        // 获取文章标签
        const tags = db.prepare(`
            SELECT t.id, t.name, t.slug
            FROM tags t
            JOIN article_tags at ON t.id = at.tag_id
            WHERE at.article_id = ?
        `).all(article.id);

        article.tags = tags;

        // 获取相关文章
        const related = db.prepare(`
            SELECT id, title, slug, cover_image, published_at
            FROM articles
            WHERE is_published = 1 
              AND category_id = ? 
              AND id != ?
            ORDER BY published_at DESC
            LIMIT 3
        `).all(article.category_id, article.id);

        article.related = related;

        res.json({ success: true, data: article });
    } catch (error) {
        console.error('获取文章详情错误:', error);
        res.status(500).json({ success: false, message: '获取文章详情失败' });
    }
});

/**
 * 获取分类列表
 * GET /api/categories
 */
router.get('/categories', (req, res) => {
    try {
        const categories = db.prepare(`
            SELECT c.*, 
                   (SELECT COUNT(*) FROM articles WHERE category_id = c.id AND is_published = 1) as article_count
            FROM categories c
            ORDER BY c.sort_order
        `).all();

        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: '获取分类失败' });
    }
});

/**
 * 获取标签云
 * GET /api/tags
 */
router.get('/tags', (req, res) => {
    try {
        const tags = db.prepare(`
            SELECT t.id, t.name, t.slug, 
                   COUNT(at.article_id) as article_count
            FROM tags t
            LEFT JOIN article_tags at ON t.id = at.tag_id
            LEFT JOIN articles a ON at.article_id = a.id AND a.is_published = 1
            GROUP BY t.id
            HAVING article_count > 0
            ORDER BY article_count DESC
        `).all();

        res.json({ success: true, data: tags });
    } catch (error) {
        res.status(500).json({ success: false, message: '获取标签失败' });
    }
});

/**
 * 获取作品集
 * GET /api/portfolios
 */
router.get('/portfolios', (req, res) => {
    try {
        const portfolios = db.prepare(`
            SELECT * FROM portfolios
            WHERE is_visible = 1
            ORDER BY sort_order, created_at DESC
        `).all();

        res.json({ success: true, data: portfolios });
    } catch (error) {
        res.status(500).json({ success: false, message: '获取作品集失败' });
    }
});

/**
 * 获取统计数据
 * GET /api/stats
 */
router.get('/stats', (req, res) => {
    try {
        const articleCount = db.prepare('SELECT COUNT(*) as count FROM articles WHERE is_published = 1').get();
        const totalViews = db.prepare('SELECT SUM(view_count) as total FROM articles').get();
        const portfolioCount = db.prepare('SELECT COUNT(*) as count FROM portfolios WHERE is_visible = 1').get();

        res.json({
            success: true,
            data: {
                articleCount: articleCount.count,
                totalViews: totalViews.total || 0,
                portfolioCount: portfolioCount.count
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: '获取统计失败' });
    }
});

/**
 * 提交联系表单
 * POST /api/contact
 */
router.post('/contact', (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: '请填写完整信息'
            });
        }

        // 存储到数据库
        db.prepare(`
            INSERT INTO messages (name, email, subject, message)
            VALUES (?, ?, ?, ?)
        `).run(name, email, req.body.subject || '', message);

        res.json({
            success: true,
            message: '消息已发送，感谢您的联系！'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: '发送失败' });
    }
});

module.exports = router;
