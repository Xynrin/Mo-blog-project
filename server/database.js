/**
 * 数据库初始化模块
 * 使用 better-sqlite3 创建和管理 SQLite 数据库
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '..', 'data.db');

// 创建数据库连接
const db = new Database(dbPath);

// 启用外键约束
db.pragma('foreign_keys = ON');

// 初始化表结构
function initTables() {
    // 文章表
    db.exec(`
        CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            content TEXT NOT NULL,
            excerpt TEXT,
            cover_image TEXT,
            category_id INTEGER,
            author_id INTEGER DEFAULT 1,
            view_count INTEGER DEFAULT 0,
            is_published INTEGER DEFAULT 0,
            is_featured INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            published_at DATETIME,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )
    `);

    // 分类表
    db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            slug TEXT UNIQUE NOT NULL,
            description TEXT,
            color TEXT DEFAULT '#e8614d',
            sort_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 标签表
    db.exec(`
        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            slug TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 文章-标签关联表
    db.exec(`
        CREATE TABLE IF NOT EXISTS article_tags (
            article_id INTEGER,
            tag_id INTEGER,
            PRIMARY KEY (article_id, tag_id),
            FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        )
    `);

    // 作品集表
    db.exec(`
        CREATE TABLE IF NOT EXISTS portfolios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            cover_image TEXT,
            project_url TEXT,
            tags TEXT,
            sort_order INTEGER DEFAULT 0,
            is_visible INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 媒体库表
    db.exec(`
        CREATE TABLE IF NOT EXISTS media (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            original_name TEXT,
            file_path TEXT NOT NULL,
            file_size INTEGER,
            mime_type TEXT,
            width INTEGER,
            height INTEGER,
            alt_text TEXT,
            uploaded_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 管理员表
    db.exec(`
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email TEXT,
            display_name TEXT,
            avatar TEXT,
            last_login DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 网站设置表
    db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 创建索引
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
        CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(is_published, published_at);
        CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
        CREATE INDEX IF NOT EXISTS idx_article_tags_article ON article_tags(article_id);
        CREATE INDEX IF NOT EXISTS idx_article_tags_tag ON article_tags(tag_id);
    `);

    console.log('✓ 数据库表结构初始化完成');
}

// 初始化默认数据
function initDefaultData() {
    // 检查是否已有数据
    const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get();
    if (adminCount.count > 0) {
        console.log('✓ 默认数据已存在，跳过初始化');
        return;
    }

    // 插入默认分类
    const insertCategory = db.prepare(`
        INSERT INTO categories (name, slug, description, color, sort_order) VALUES (?, ?, ?, ?, ?)
    `);

    const categories = [
        ['设计思考', 'design-thinking', '关于设计的深度思考与实践', '#e8614d', 1],
        ['前端开发', 'frontend-dev', '前端技术与开发实践', '#d4a853', 2],
        ['UI/UX', 'ui-ux', '用户界面与用户体验设计', '#2dd4a8', 3],
        ['创意灵感', 'creative', '创意来源与灵感记录', '#a78bfa', 4],
        ['旅行随笔', 'travel', '旅途中的所见所闻', '#e8614d', 5],
        ['工具推荐', 'tools', '效率工具与资源推荐', '#d4a853', 6]
    ];

    categories.forEach(cat => insertCategory.run(...cat));
    console.log('✓ 默认分类初始化完成');

    // 插入默认管理员
    const passwordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
    db.prepare(`
        INSERT INTO admins (username, password_hash, email, display_name) VALUES (?, ?, ?, ?)
    `).run(
        process.env.ADMIN_USERNAME || 'admin',
        passwordHash,
        'admin@mo-blog.com',
        '墨 · Mo'
    );
    console.log('✓ 默认管理员初始化完成');

    // 插入默认设置
    const insertSetting = db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)`);
    const settings = [
        ['site_name', '墨 · 创意博客'],
        ['site_description', '在这里，我分享关于设计、技术与生活的思考碎片'],
        ['author_name', '墨 · Mo'],
        ['author_bio', '独立设计师 / 创意写作者 / 数字游民'],
        ['author_avatar', ''],
        ['posts_per_page', '10'],
        ['footer_text', '© 2026 墨 · Mo — 以文字记录灵感']
    ];

    settings.forEach(s => insertSetting.run(...s));
    console.log('✓ 默认设置初始化完成');

    // 插入示例文章
    const insertArticle = db.prepare(`
        INSERT INTO articles (title, slug, content, excerpt, category_id, is_published, is_featured, published_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    const articles = [
        [
            '极简设计的悖论：为什么少即是多并不总是对的',
            'minimalism-paradox',
            '## 引言\n\n我们常常听到"少即是多"的设计箴言，但在实际项目中，极简主义并非万能钥匙。\n\n## 极简的边界\n\n极简设计追求的是形式的纯粹和功能的直接，但过度简化可能导致信息传递的缺失...\n\n## 何时打破规则\n\n1. **品牌个性表达**：有些品牌需要丰富的视觉语言\n2. **情感连接**：用户需要温度而非冷冰冰的界面\n3. **信息密度**：某些场景下用户需要高效获取大量信息\n\n## 总结\n\n设计没有绝对的对错，关键是找到适合的平衡点。',
            '我们常常听到"少即是多"的设计箴言，但在实际项目中，极简主义并非万能钥匙。本文探讨极简设计的边界，以及何时需要打破规则来创造更有意义的用户体验……',
            1, 1, 1
        ],
        [
            'CSS 容器查询实战：响应式设计的新范式',
            'css-container-queries',
            '## 什么是容器查询\n\n容器查询（Container Queries）是 CSS 的新特性，它允许组件根据其容器大小而非视口大小来调整样式。\n\n## 基础用法\n\n```css\n.container {\n  container-type: inline-size;\n}\n\n@container (min-width: 400px) {\n  .card {\n    flex-direction: row;\n  }\n}\n```\n\n## 实战案例\n\n让我们通过一个实际的卡片组件来演示容器查询的强大之处...',
            '容器查询终于获得了主流浏览器的全面支持。这篇文章通过实际案例，展示如何利用容器查询构建真正组件级的响应式布局……',
            2, 1, 0
        ],
        [
            '京都的七天：在古寺与咖啡馆之间寻找灵感',
            'kyoto-seven-days',
            '## Day 1: 抵达\n\n三月的京都，樱花尚未盛开，却有一种静谧的美。\n\n## Day 2: 清水寺\n\n清晨的清水寺，游客还未到来。站在舞台上，俯瞰京都城...\n\n## Day 3: 哲学之道\n\n沿着哲学之道漫步，两旁的树枝在风中摇曳...\n\n## 灵感记录\n\n这次旅行让我重新思考了"留白"在设计中的意义。',
            '三月的京都，樱花尚未盛开，却有一种静谧的美。我带着笔记本和相机，在古老的街巷中穿行，记录下那些触动心灵的瞬间……',
            5, 1, 0
        ]
    ];

    articles.forEach(a => insertArticle.run(...a));
    console.log('✓ 示例文章初始化完成');

    // 插入默认标签
    const insertTag = db.prepare(`INSERT INTO tags (name, slug) VALUES (?, ?)`);
    const tags = [
        ['设计', 'design'],
        ['UX', 'ux'],
        ['CSS', 'css'],
        ['前端', 'frontend'],
        ['旅行', 'travel'],
        ['日本', 'japan']
    ];
    tags.forEach(t => insertTag.run(...t));
    console.log('✓ 默认标签初始化完成');
}

// 初始化数据库
function init() {
    console.log('\n📦 初始化数据库...');
    initTables();
    initDefaultData();
    console.log('✅ 数据库初始化完成\n');
}

// 导出
module.exports = { db, init };
