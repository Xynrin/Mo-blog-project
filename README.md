# 墨 · 创意博客

一个基于 Node.js + Express + SQLite 的动态博客系统，包含前端博客展示页面与后台管理面板。

## 项目概述

该项目提供：

- 文章列表、文章详情、分类、标签、作品集等前端展示功能
- 后台管理面板，可进行文章管理、分类管理、作品集管理、图片上传与设置管理
- JWT 登录认证，权限保护后台接口
- SQLite 数据存储，支持本地快速部署
- 文件上传与图片处理（使用 multer 与 sharp）

## 主要技术栈

- Node.js
- Express
- better-sqlite3
- JSON Web Token (`jsonwebtoken`)
- bcryptjs
- multer
- sharp
- marked
- dotenv
- cors
- express-validator

## 项目结构

```
├── index.html
├── package.json
├── public/                # 前端静态资源
│   ├── css/
│   ├── js/
│   └── pages/
│       ├── 404.html
│       ├── about.html
│       ├── article.html
│       ├── articles.html
│       ├── contact.html
│       ├── index.html
│       ├── portfolio.html
│       └── admin/
│           ├── article-edit.html
│           ├── articles.html
│           ├── categories.html
│           ├── dashboard.html
│           ├── login.html
│           ├── media.html
│           ├── portfolios.html
│           └── settings.html
├── server/                # 后端逻辑
│   ├── app.js
│   ├── database.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   └── routes/
│       ├── admin.js
│       ├── api.js
│       └── auth.js
└── uploads/               # 图片上传目录
    └── images/
```

## 安装与运行

```bash
npm install
```

### 运行项目

```bash
npm start
```

### 开发模式

```bash
npm run dev
```

### 默认访问地址

- 前台网站：`http://localhost:3000`
- 后台管理：`http://localhost:3000/admin`

## 环境变量

项目使用 `dotenv` 加载环境变量，可在根目录创建 `.env` 文件。

支持的变量：

```env
PORT=3000
JWT_SECRET=your-secret-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
UPLOAD_MAX_SIZE=5242880
NODE_ENV=development
```

> 如果未设置，项目会使用内置默认值。

## 默认账号

- 用户名：`admin`
- 密码：`admin123`

该用户数据在数据库初始化时自动创建。

## 功能说明

### 前台功能

- 首页、文章列表、文章详情、关于页、作品集页、联系页
- 分类、标签支持
- Markdown 文章内容解析
- 文章阅读量统计
- 相关文章推荐

### 后台功能

- 管理员登录认证
- 仪表盘数据
- 文章新增、编辑、删除、发布/草稿、搜索、分页
- 分类管理
- 作品集管理
- 媒体库图片上传与处理
- 站点设置
- 密码修改

## API 概览

### 公共 API

- `GET /api/settings` - 获取网站设置
- `GET /api/articles` - 获取文章列表
- `GET /api/articles/:slug` - 获取文章详情
- `GET /api/categories` - 获取分类列表
- `GET /api/tags` - 获取标签列表
- `GET /api/portfolios` - 获取作品集

### 认证 API

- `POST /api/auth/login` - 管理员登录
- `GET /api/auth/verify` - 验证 JWT 登录状态
- `POST /api/auth/change-password` - 修改管理员密码

### 后台管理 API（需要 JWT）

- `GET /api/admin/dashboard`
- `GET /api/admin/articles`
- `GET /api/admin/articles/:id`
- `POST /api/admin/articles`
- `PUT /api/admin/articles/:id`
- `DELETE /api/admin/articles/:id`
- 其他管理路由见 `server/routes/admin.js`

## 数据库说明

- 使用 SQLite 数据库文件：`data.db`
- 自动创建表结构与默认数据
- 支持文章、分类、标签、作品集、媒体、管理员与设置

## 本地部署注意事项

- `uploads/images/` 目录需要写入权限
- 如果使用 `PORT` 以外的端口，请更新 `.env` 和静态访问路径
- 生产环境建议设置安全的 `JWT_SECRET` 和更强的管理员密码

## 贡献与扩展

你可以基于本项目继续扩展：

- 增加评论功能
- 添加文章标签页与搜索页
- 支持 Markdown 编辑器
- 增加邮箱通知、RSS、Sitemap
- 使用更完善的前端框架重构页面

## 版权与许可

此项目为个人博客系统模板，基于现有代码自由使用与修改。请根据你的实际需求补充许可证信息。
