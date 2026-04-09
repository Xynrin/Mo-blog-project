/**
 * 后台管理 API 路由
 */

const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authMiddleware, hashPassword } = require('../middleware/auth');
const { upload, processImage, handleUploadError } = require('../middleware/upload');
const path = require('path');

// 所有后台路由都需要认证
router.use(authMiddleware);

// ==================== 仪表盘 ====================

/**
 * 获取仪表盘数据
 * GET /api/admin/dashboard
 */
router.get('/dashboard', (req, res) => {
    try {
        const articleCount = db.prepare('SELECT COUNT(*) as count FROM articles').get();
        const publishedCount = db.prepare('SELECT COUNT(*) as count FROM articles WHERE is_published = 1').get();
        const draftCount = db.prepare('SELECT COUNT(*) as count FROM articles WHERE is_published = 0').get();
        const totalViews = db.prepare('SELECT SUM(view_count) as total FROM articles').get();
        const portfolioCount = db.prepare('SELECT COUNT(*) as count FROM portfolios').get();
        const mediaCount = db.prepare('SELECT COUNT(*) as count FROM media').get();

        // 最近文章
        const recentArticles = db.prepare(`
            SELECT id, title, is_published, created_at, published_at
            FROM articles
            ORDER BY created_at DESC
            LIMIT 5
        `).all();

        res.json({
            success: true,
            data: {
                stats: {
                    articleCount: articleCount.count,
                    publishedCount: publishedCount.count,
                    draftCount: draftCount.count,
                    totalViews: totalViews.total || 0,
                    portfolioCount: portfolioCount.count,
                    mediaCount: mediaCount.count
                },
                recentArticles
            }
        });
    } catch (error) {
        console.error('获取仪表盘数据错误:', error);
        res.status(500).json({ success: false, message: '获取数据失败' });
    }
});

// ==================== 文章管理 ====================

/**
 * 获取文章列表（后台）
 * GET /api/admin/articles
 */
router.get('/articles', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status; // published, draft, all
        const search = req.query.search;
        const offset = (page - 1) * limit;

        let sql = `
            SELECT a.*, c.name as category_name
            FROM articles a
            LEFT JOIN categories c ON a.category_id = c.id
            WHERE 1=1
        `;
        const params = [];

        if (status === 'published') {
            sql += ' AND a.is_published = 1';
        } else if (status === 'draft') {
            sql += ' AND a.is_published = 0';
        }

        if (search) {
            sql += ' AND (a.title LIKE ? OR a.content LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        // 获取总数
        const countSql = sql.replace('SELECT a.*, c.name as category_name', 'SELECT COUNT(*) as count');
        const total = db.prepare(countSql).get(...params);

        sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const articles = db.prepare(sql).all(...params);

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
 * 获取单篇文章
 * GET /api/admin/articles/:id
 */
router.get('/articles/:id', (req, res) => {
    try {
        const { id } = req.params;

        const article = db.prepare(`
            SELECT a.*, c.name as category_name
            FROM articles a
            LEFT JOIN categories c ON a.category_id = c.id
            WHERE a.id = ?
        `).get(id);

        if (!article) {
            return res.status(404).json({ success: false, message: '文章不存在' });
        }

        // 获取文章标签
        const tags = db.prepare(`
            SELECT t.id, t.name
            FROM tags t
            JOIN article_tags at ON t.id = at.tag_id
            WHERE at.article_id = ?
        `).all(id);

        article.tags = tags;

        res.json({ success: true, data: article });
    } catch (error) {
        res.status(500).json({ success: false, message: '获取文章失败' });
    }
});

/**
 * 创建文章
 * POST /api/admin/articles
 */
router.post('/articles', (req, res) => {
    try {
        const { title, slug, content, excerpt, cover_image, category_id, is_published, is_featured, tags } = req.body;

        if (!title || !content) {
            return res.status(400).json({ success: false, message: '标题和内容不能为空' });
        }

        // 生成 slug
        const articleSlug = slug || title.toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
            .replace(/^-|-$/g, '');

        // 检查 slug 是否重复
        const existing = db.prepare('SELECT id FROM articles WHERE slug = ?').get(articleSlug);
        if (existing) {
            return res.status(400).json({ success: false, message: 'URL 标识已存在' });
        }

        const result = db.prepare(`
            INSERT INTO articles (title, slug, content, excerpt, cover_image, category_id, is_published, is_featured, published_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            title,
            articleSlug,
            content,
            excerpt || content.substring(0, 150),
            cover_image,
            category_id,
            is_published ? 1 : 0,
            is_featured ? 1 : 0,
            is_published ? new Date().toISOString() : null
        );

        const articleId = result.lastInsertRowid;

        // 处理标签
        if (tags && tags.length > 0) {
            const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)');
            const linkTag = db.prepare('INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)');

            tags.forEach(tag => {
                const tagName = typeof tag === 'string' ? tag : tag.name;
                const tagSlug = tagName.toLowerCase().replace(/[^\w]+/g, '-');
                
                insertTag.run(tagName, tagSlug);
                const tagRow = db.prepare('SELECT id FROM tags WHERE slug = ?').get(tagSlug);
                if (tagRow) {
                    linkTag.run(articleId, tagRow.id);
                }
            });
        }

        res.json({
            success: true,
            data: { id: articleId, slug: articleSlug },
            message: '文章创建成功'
        });
    } catch (error) {
        console.error('创建文章错误:', error);
        res.status(500).json({ success: false, message: '创建文章失败' });
    }
});

/**
 * 更新文章
 * PUT /api/admin/articles/:id
 */
router.put('/articles/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { title, slug, content, excerpt, cover_image, category_id, is_published, is_featured, tags } = req.body;

        // 检查文章是否存在
        const existing = db.prepare('SELECT id FROM articles WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: '文章不存在' });
        }

        // 检查 slug 是否重复
        if (slug) {
            const slugCheck = db.prepare('SELECT id FROM articles WHERE slug = ? AND id != ?').get(slug, id);
            if (slugCheck) {
                return res.status(400).json({ success: false, message: 'URL 标识已存在' });
            }
        }

        db.prepare(`
            UPDATE articles SET
                title = COALESCE(?, title),
                slug = COALESCE(?, slug),
                content = COALESCE(?, content),
                excerpt = COALESCE(?, excerpt),
                cover_image = COALESCE(?, cover_image),
                category_id = COALESCE(?, category_id),
                is_published = COALESCE(?, is_published),
                is_featured = COALESCE(?, is_featured),
                published_at = CASE WHEN ? = 1 AND published_at IS NULL THEN datetime('now') ELSE published_at END,
                updated_at = datetime('now')
            WHERE id = ?
        `).run(
            title, slug, content, excerpt, cover_image, category_id,
            is_published !== undefined ? (is_published ? 1 : 0) : null,
            is_featured !== undefined ? (is_featured ? 1 : 0) : null,
            is_published !== undefined ? (is_published ? 1 : 0) : null,
            id
        );

        // 更新标签
        if (tags !== undefined) {
            // 删除旧标签关联
            db.prepare('DELETE FROM article_tags WHERE article_id = ?').run(id);

            if (tags && tags.length > 0) {
                const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)');
                const linkTag = db.prepare('INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)');

                tags.forEach(tag => {
                    const tagName = typeof tag === 'string' ? tag : tag.name;
                    const tagSlug = tagName.toLowerCase().replace(/[^\w]+/g, '-');
                    
                    insertTag.run(tagName, tagSlug);
                    const tagRow = db.prepare('SELECT id FROM tags WHERE slug = ?').get(tagSlug);
                    if (tagRow) {
                        linkTag.run(id, tagRow.id);
                    }
                });
            }
        }

        res.json({ success: true, message: '文章更新成功' });
    } catch (error) {
        console.error('更新文章错误:', error);
        res.status(500).json({ success: false, message: '更新文章失败' });
    }
});

/**
 * 删除文章
 * DELETE /api/admin/articles/:id
 */
router.delete('/articles/:id', (req, res) => {
    try {
        const { id } = req.params;

        db.prepare('DELETE FROM article_tags WHERE article_id = ?').run(id);
        db.prepare('DELETE FROM articles WHERE id = ?').run(id);

        res.json({ success: true, message: '文章已删除' });
    } catch (error) {
        res.status(500).json({ success: false, message: '删除文章失败' });
    }
});

// ==================== 分类管理 ====================

/**
 * 获取分类列表
 * GET /api/admin/categories
 */
router.get('/categories', (req, res) => {
    try {
        const categories = db.prepare(`
            SELECT c.*, 
                   (SELECT COUNT(*) FROM articles WHERE category_id = c.id) as article_count
            FROM categories c
            ORDER BY c.sort_order
        `).all();

        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: '获取分类失败' });
    }
});

/**
 * 创建分类
 * POST /api/admin/categories
 */
router.post('/categories', (req, res) => {
    try {
        const { name, slug, description, color, sort_order } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: '分类名称不能为空' });
        }

        const categorySlug = slug || name.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-');

        const result = db.prepare(`
            INSERT INTO categories (name, slug, description, color, sort_order)
            VALUES (?, ?, ?, ?, ?)
        `).run(name, categorySlug, description, color || '#e8614d', sort_order || 0);

        res.json({ success: true, data: { id: result.lastInsertRowid }, message: '分类创建成功' });
    } catch (error) {
        if (error.message.includes('UNIQUE')) {
            return res.status(400).json({ success: false, message: '分类名称已存在' });
        }
        res.status(500).json({ success: false, message: '创建分类失败' });
    }
});

/**
 * 更新分类
 * PUT /api/admin/categories/:id
 */
router.put('/categories/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, description, color, sort_order } = req.body;

        db.prepare(`
            UPDATE categories SET
                name = COALESCE(?, name),
                slug = COALESCE(?, slug),
                description = COALESCE(?, description),
                color = COALESCE(?, color),
                sort_order = COALESCE(?, sort_order)
            WHERE id = ?
        `).run(name, slug, description, color, sort_order, id);

        res.json({ success: true, message: '分类更新成功' });
    } catch (error) {
        res.status(500).json({ success: false, message: '更新分类失败' });
    }
});

/**
 * 删除分类
 * DELETE /api/admin/categories/:id
 */
router.delete('/categories/:id', (req, res) => {
    try {
        const { id } = req.params;

        // 将该分类下的文章的分类设为空
        db.prepare('UPDATE articles SET category_id = NULL WHERE category_id = ?').run(id);
        db.prepare('DELETE FROM categories WHERE id = ?').run(id);

        res.json({ success: true, message: '分类已删除' });
    } catch (error) {
        res.status(500).json({ success: false, message: '删除分类失败' });
    }
});

// ==================== 作品集管理 ====================

/**
 * 获取作品列表
 * GET /api/admin/portfolios
 */
router.get('/portfolios', (req, res) => {
    try {
        const portfolios = db.prepare(`
            SELECT * FROM portfolios ORDER BY sort_order, created_at DESC
        `).all();

        res.json({ success: true, data: portfolios });
    } catch (error) {
        res.status(500).json({ success: false, message: '获取作品失败' });
    }
});

/**
 * 创建作品
 * POST /api/admin/portfolios
 */
router.post('/portfolios', (req, res) => {
    try {
        const { title, description, cover_image, project_url, tags, sort_order, is_visible } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, message: '作品标题不能为空' });
        }

        const result = db.prepare(`
            INSERT INTO portfolios (title, description, cover_image, project_url, tags, sort_order, is_visible)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(title, description, cover_image, project_url,
               tags || null, sort_order || 0, is_visible !== false ? 1 : 0);

        res.json({ success: true, data: { id: result.lastInsertRowid }, message: '作品创建成功' });
    } catch (error) {
        res.status(500).json({ success: false, message: '创建作品失败' });
    }
});

/**
 * 更新作品
 * PUT /api/admin/portfolios/:id
 */
router.put('/portfolios/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, cover_image, project_url, tags, sort_order, is_visible } = req.body;

        db.prepare(`
            UPDATE portfolios SET
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                cover_image = COALESCE(?, cover_image),
                project_url = COALESCE(?, project_url),
                tags = COALESCE(?, tags),
                sort_order = COALESCE(?, sort_order),
                is_visible = COALESCE(?, is_visible)
            WHERE id = ?
        `).run(title, description, cover_image, project_url,
               tags !== undefined ? tags : null, sort_order, is_visible, id);

        res.json({ success: true, message: '作品更新成功' });
    } catch (error) {
        res.status(500).json({ success: false, message: '更新作品失败' });
    }
});

/**
 * 删除作品
 * DELETE /api/admin/portfolios/:id
 */
router.delete('/portfolios/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM portfolios WHERE id = ?').run(req.params.id);
        res.json({ success: true, message: '作品已删除' });
    } catch (error) {
        res.status(500).json({ success: false, message: '删除作品失败' });
    }
});

// ==================== 媒体库 ====================

/**
 * 获取媒体列表
 * GET /api/admin/media
 */
router.get('/media', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const type = req.query.type; // image, video, file
        const search = req.query.search; // 搜索文件名

        let whereClause = '1=1';
        const params = [];

        if (type) {
            if (type === 'image') {
                whereClause += " AND mime_type LIKE 'image/%'";
            } else if (type === 'video') {
                whereClause += " AND mime_type LIKE 'video/%'";
            } else if (type === 'file') {
                whereClause += " AND mime_type NOT LIKE 'image/%' AND mime_type NOT LIKE 'video/%'";
            }
        }

        if (search) {
            whereClause += ' AND original_name LIKE ?';
            params.push(`%${search}%`);
        }

        const media = db.prepare(`
            SELECT * FROM media WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?
        `).all(...params, limit, offset);

        const total = db.prepare(`SELECT COUNT(*) as count FROM media WHERE ${whereClause}`).get(...params);

        res.json({
            success: true,
            data: {
                media,
                pagination: {
                    page,
                    limit,
                    total: total.count,
                    totalPages: Math.ceil(total.count / limit)
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: '获取媒体列表失败' });
    }
});

/**
 * 上传图片
 * POST /api/admin/media/upload
 */
router.post('/media/upload', upload.single('image'), processImage, (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: '请选择要上传的图片' });
        }

        const { file, imageMetadata } = req;
        const relativePath = path.relative(path.join(__dirname, '..', '..'), file.path);

        const result = db.prepare(`
            INSERT INTO media (filename, original_name, file_path, file_size, mime_type, width, height)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            file.filename,
            file.originalname,
            '/' + relativePath.replace(/\\/g, '/'),
            file.size,
            file.mimetype,
            imageMetadata?.width,
            imageMetadata?.height
        );

        res.json({
            success: true,
            data: {
                id: result.lastInsertRowid,
                filename: file.filename,
                url: '/' + relativePath.replace(/\\/g, '/'),
                originalName: file.originalname,
                size: file.size,
                width: imageMetadata?.width,
                height: imageMetadata?.height
            },
            message: '上传成功'
        });
    } catch (error) {
        console.error('上传错误:', error);
        res.status(500).json({ success: false, message: '上传失败' });
    }
});

/**
 * 重命名媒体
 * PUT /api/admin/media/:id
 */
router.put('/media/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { original_name, alt_text } = req.body;

        const media = db.prepare('SELECT * FROM media WHERE id = ?').get(id);
        if (!media) {
            return res.status(404).json({ success: false, message: '文件不存在' });
        }

        db.prepare(`
            UPDATE media SET
                original_name = COALESCE(?, original_name),
                alt_text = COALESCE(?, alt_text)
            WHERE id = ?
        `).run(original_name, alt_text, id);

        res.json({ success: true, message: '重命名成功' });
    } catch (error) {
        res.status(500).json({ success: false, message: '重命名失败' });
    }
});

/**
 * 删除媒体
 * DELETE /api/admin/media/:id
 */
router.delete('/media/:id', (req, res) => {
    try {
        const { id } = req.params;

        const media = db.prepare('SELECT * FROM media WHERE id = ?').get(id);
        if (!media) {
            return res.status(404).json({ success: false, message: '文件不存在' });
        }

        // 删除文件
        const fs = require('fs');
        const filePath = path.join(__dirname, '..', '..', media.file_path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // 删除缩略图
        const thumbPath = filePath.replace(/(\.\w+)$/, '-thumb$1');
        if (fs.existsSync(thumbPath)) {
            fs.unlinkSync(thumbPath);
        }

        db.prepare('DELETE FROM media WHERE id = ?').run(id);

        res.json({ success: true, message: '文件已删除' });
    } catch (error) {
        res.status(500).json({ success: false, message: '删除失败' });
    }
});

// ==================== 设置管理 ====================

/**
 * 获取所有设置
 * GET /api/admin/settings
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
 * 更新设置
 * PUT /api/admin/settings
 */
router.put('/settings', (req, res) => {
    try {
        const settings = req.body;

        const updateStmt = db.prepare(`
            INSERT INTO settings (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
        `);

        Object.entries(settings).forEach(([key, value]) => {
            updateStmt.run(key, value);
        });

        res.json({ success: true, message: '设置已保存' });
    } catch (error) {
        res.status(500).json({ success: false, message: '保存设置失败' });
    }
});

// ==================== 消息管理 ====================

/**
 * 获取消息列表
 * GET /api/admin/messages
 */
router.get('/messages', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const messages = db.prepare(`
            SELECT * FROM messages ORDER BY created_at DESC LIMIT ? OFFSET ?
        `).all(limit, offset);

        const total = db.prepare('SELECT COUNT(*) as count FROM messages').get();
        const unread = db.prepare('SELECT COUNT(*) as count FROM messages WHERE is_read = 0').get();

        res.json({
            success: true,
            data: {
                messages,
                pagination: { page, limit, total: total.count, totalPages: Math.ceil(total.count / limit) },
                unreadCount: unread.count
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: '获取消息失败' });
    }
});

/**
 * 标记消息已读
 * PUT /api/admin/messages/:id
 */
router.put('/messages/:id', (req, res) => {
    try {
        db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?').run(req.params.id);
        res.json({ success: true, message: '已标记为已读' });
    } catch (error) {
        res.status(500).json({ success: false, message: '操作失败' });
    }
});

/**
 * 删除消息
 * DELETE /api/admin/messages/:id
 */
router.delete('/messages/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);
        res.json({ success: true, message: '消息已删除' });
    } catch (error) {
        res.status(500).json({ success: false, message: '删除失败' });
    }
});

/**
 * 修改用户名
 * PUT /api/admin/username
 */
router.put('/username', authMiddleware, (req, res) => {
    try {
        const { username } = req.body;
        if (!username || username.trim().length < 2 || username.trim().length > 20) {
            return res.status(400).json({ success: false, message: '用户名长度应在2-20个字符之间' });
        }

        const trimmed = username.trim();

        // 检查用户名唯一性
        const existing = db.prepare('SELECT id FROM admins WHERE username = ? AND id != ?').get(trimmed, req.user.id);
        if (existing) {
            return res.status(400).json({ success: false, message: '用户名已存在' });
        }

        // 更新用户名
        db.prepare('UPDATE admins SET username = ? WHERE id = ?').run(trimmed, req.user.id);

        // 同步更新作者名称
        db.prepare(`INSERT INTO settings (key, value) VALUES ('author_name', ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`).run(trimmed);

        res.json({ success: true, message: '用户名修改成功' });
    } catch (error) {
        console.error('修改用户名错误:', error);
        res.status(500).json({ success: false, message: '修改用户名失败' });
    }
});

// 错误处理
router.use(handleUploadError);

module.exports = router;
