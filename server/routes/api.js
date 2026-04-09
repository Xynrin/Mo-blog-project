/**
 * 前端 API 路由
 */

const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { marked } = require('marked');
const rateLimit = require('express-rate-limit');

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

        // 为每篇文章查询标签
        const articlesWithTags = articles.map(article => {
            const tags = db.prepare(`
                SELECT t.name FROM tags t
                JOIN article_tags at ON t.id = at.tag_id
                WHERE at.article_id = ?
            `).all(article.id);
            article.tags = tags.map(t => t.name);
            return article;
        });

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
                articles: articlesWithTags,
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

        const prevArticle = db.prepare('SELECT slug, title FROM articles WHERE id < ? AND is_published = 1 ORDER BY id DESC LIMIT 1').get(article.id);
        const nextArticle = db.prepare('SELECT slug, title FROM articles WHERE id > ? AND is_published = 1 ORDER BY id ASC LIMIT 1').get(article.id);

        res.json({ success: true, data: { ...article, prevArticle, nextArticle } });
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

        // 修复历史双重编码的 tags 数据
        portfolios.forEach(p => {
            if (p.tags && typeof p.tags === 'string') {
                try {
                    let parsed = JSON.parse(p.tags);
                    if (typeof parsed === 'string') {
                        parsed = JSON.parse(parsed);
                    }
                    p.tags = JSON.stringify(parsed);
                } catch(e) {}
            }
        });

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

// 验证码存储（内存，生产环境用 Redis）
const verificationCodes = new Map();

// 频率限制器
const sendCodeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: '发送验证码过于频繁，请15分钟后再试' },
    standardHeaders: true,
    legacyHeaders: false,
});

const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: { success: false, message: '提交过于频繁，请15分钟后再试' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * 发送邮箱验证码
 * POST /api/contact/send-code
 */
router.post('/contact/send-code', sendCodeLimiter, async (req, res) => {
    try {
        // 蜜罐检查：website 字段非空则为机器人，静默返回成功
        if (req.body.website) {
            return res.json({ success: true, message: '验证码已发送' });
        }

        // 时间检测：表单提交过快（< 3秒）则拒绝
        if (req.body._timestamp && Date.now() - parseInt(req.body._timestamp) < 3000) {
            return res.status(429).json({ success: false, message: '操作过快，请稍后再试' });
        }

        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: '请输入邮箱地址' });
        
        // 频率限制：60秒内只能发一次
        const existing = verificationCodes.get(email);
        if (existing && Date.now() - existing.sentAt < 60000) {
            return res.status(429).json({ success: false, message: '请60秒后再试' });
        }
        
        const crypto = require('crypto');
        const code = crypto.randomInt(100000, 999999).toString();
        
        // 获取邮件配置
        const settings = {};
        db.prepare('SELECT key, value FROM settings').all().forEach(s => { settings[s.key] = s.value; });
        
        const smtpHost = settings.smtp_host || process.env.SMTP_HOST;
        const smtpPort = parseInt(settings.smtp_port || process.env.SMTP_PORT || '587');
        const smtpUser = settings.smtp_user || process.env.EMAIL_USER;
        const smtpPass = settings.smtp_pass || process.env.EMAIL_PASS;
        
        if (!smtpUser || !smtpPass) {
            return res.status(500).json({ success: false, message: '邮件服务未配置，请在后台系统设置中配置SMTP信息' });
        }
        
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            host: smtpHost, port: smtpPort, secure: smtpPort === 465,
            auth: { user: smtpUser, pass: smtpPass }
        });
        
        const siteName = settings.site_name || '博客';
        let htmlTemplate = settings.email_template;
        if (!htmlTemplate) {
            htmlTemplate = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;background:#f4f4f7;margin:0;padding:20px}.container{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden}.header{background:linear-gradient(135deg,#e8614d,#d4a853);padding:30px;text-align:center}.header h1{color:#fff;margin:0;font-size:24px}.content{padding:30px}.code-box{background:#f8f9fa;border:2px dashed #e8614d;border-radius:8px;padding:20px;text-align:center;margin:20px 0}.code{font-size:36px;font-weight:bold;color:#e8614d;letter-spacing:8px;font-family:'Courier New',monospace}.footer{background:#f8f9fa;padding:20px;text-align:center;color:#999;font-size:12px}</style></head><body><div class="container"><div class="header"><h1>{{site_name}} - 邮箱验证</h1></div><div class="content"><p>您好，</p><p>您正在{{site_name}}提交联系表单，您的验证码为：</p><div class="code-box"><div class="code">{{code}}</div></div><p>验证码有效期为 <strong>5 分钟</strong>，请尽快使用。</p><p>如果这不是您本人的操作，请忽略此邮件。</p></div><div class="footer"><p>此邮件由系统自动发送，请勿回复。</p></div></div></body></html>`;
        }
        
        htmlTemplate = htmlTemplate.replace(/\{\{code\}\}/g, code).replace(/\{\{site_name\}\}/g, siteName).replace(/\{\{expire_minutes\}\}/g, '5');
        
        await transporter.sendMail({
            from: `"${siteName}" <${smtpUser}>`,
            to: email,
            subject: `${siteName} - 邮箱验证码`,
            html: htmlTemplate
        });
        
        verificationCodes.set(email, { code, sentAt: Date.now(), attempts: 0 });
        res.json({ success: true, message: '验证码已发送' });
    } catch (error) {
        console.error('发送验证码失败:', error);
        res.status(500).json({ success: false, message: '发送失败: ' + error.message });
    }
});

/**
 * 验证邮箱验证码
 * POST /api/contact/verify-code
 */
router.post('/contact/verify-code', (req, res) => {
    const { email, code } = req.body;
    const stored = verificationCodes.get(email);
    if (!stored) return res.status(400).json({ success: false, message: '请先获取验证码' });
    if (Date.now() - stored.sentAt > 5 * 60 * 1000) {
        verificationCodes.delete(email);
        return res.status(400).json({ success: false, message: '验证码已过期' });
    }
    if (stored.attempts >= 5) {
        verificationCodes.delete(email);
        return res.status(400).json({ success: false, message: '尝试次数过多，请重新获取' });
    }
    if (stored.code !== code) {
        stored.attempts++;
        return res.status(400).json({ success: false, message: '验证码错误' });
    }
    verificationCodes.set(email, { code: stored.code, sentAt: stored.sentAt, verified: true });
    res.json({ success: true, message: '验证成功' });
});

/**
 * 提交联系表单
 * POST /api/contact
 */
router.post('/contact', contactLimiter, (req, res) => {
    try {
        // 蜜罐检查：website 字段非空则为机器人，静默返回成功
        if (req.body.website) {
            return res.json({ success: true, message: '消息已发送，感谢您的联系！' });
        }

        const { name, email, message } = req.body;

        // 输入长度限制
        if (!name || name.trim().length < 2 || name.trim().length > 50) {
            return res.status(400).json({ success: false, message: '姓名长度应在2-50个字符之间' });
        }
        if (!email || email.length > 254) {
            return res.status(400).json({ success: false, message: '请输入有效的邮箱地址' });
        }
        if (!message || message.trim().length < 10 || message.trim().length > 2000) {
            return res.status(400).json({ success: false, message: '消息长度应在10-2000个字符之间' });
        }

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: '请填写完整信息'
            });
        }

        // 检查邮箱是否已验证
        const verified = verificationCodes.get(email);
        if (!verified || verified.verified !== true) {
            return res.status(403).json({ success: false, message: '请先完成邮箱验证' });
        }
        verificationCodes.delete(email);

        // 存储到数据库
        db.prepare(`
            INSERT INTO messages (name, email, subject, message)
            VALUES (?, ?, ?, ?)
        `).run(name, email, req.body.subject || '', message);

        // 邮件通知管理员
        try {
            const settings = {};
            db.prepare('SELECT key, value FROM settings').all().forEach(s => { settings[s.key] = s.value; });

            if (settings.notify_email === 'true' && settings.notify_email_address && settings.smtp_host && settings.smtp_user) {
                const nodemailer = require('nodemailer');
                const transporter = nodemailer.createTransport({
                    host: settings.smtp_host,
                    port: parseInt(settings.smtp_port) || 587,
                    secure: parseInt(settings.smtp_port) === 465,
                    auth: { user: settings.smtp_user, pass: settings.smtp_pass }
                });

                transporter.sendMail({
                    from: `"${settings.site_name || '博客'}" <${settings.smtp_user}>`,
                    to: settings.notify_email_address,
                    subject: `[新消息] ${name} 通过联系表单发来消息`,
                    html: `
                        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                            <h2 style="color:#333;">收到新消息</h2>
                            <p><strong>发件人：</strong>${name}</p>
                            <p><strong>邮箱：</strong>${email}</p>
                            <p><strong>时间：</strong>${new Date().toLocaleString('zh-CN')}</p>
                            <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0;">
                                <p style="margin:0;white-space:pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                            </div>
                        </div>
                    `
                }).catch(err => console.error('通知邮件发送失败:', err.message));
            }
        } catch (notifyErr) {
            console.error('通知处理失败:', notifyErr.message);
        }

        res.json({
            success: true,
            message: '消息已发送，感谢您的联系！'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: '发送失败' });
    }
});

module.exports = router;
