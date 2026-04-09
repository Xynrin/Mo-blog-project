# API 接口文档



> RESTful API 接口完整说明

## 目录

- [通用说明](#通用说明)
- [认证接口](#认证接口)
- [前台 API](#前台-api)
- [后台 API](#后台-api)
- [错误处理](#错误处理)

---

## 通用说明

### 基础 URL

```
http://localhost:3000/api
```

### 认证方式

后台 API 需要 JWT 认证，在请求头中传递 Token：

```
Authorization: Bearer <token>
```

### 响应格式

所有接口统一返回 JSON 格式：

**成功响应：**

```json
{
  "success": true,
  "data": {
    // 响应数据
  }
}
```

**错误响应：**

```json
{
  "success": false,
  "error": "错误消息"
}
```

### 分页参数

支持分页的接口接受以下参数：

| 参数 | 类型 | 说明 | 默认值 |
|:---|:---|:---|:---|
| `page` | number | 页码 | 1 |
| `limit` | number | 每页条数 | 10 |

### 常用查询参数

| 参数 | 类型 | 说明 |
|:---|:---|:---|
| `sort` | string | 排序字段（如 `created_at`） |
| `order` | string | 排序方向（`asc` 或 `desc`） |
| `search` | string | 搜索关键词 |

---

## 认证接口

### 登录

<details>
<summary><b>POST /api/auth/login</b> - 管理员登录</summary>

**请求示例：**

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**参数说明：**

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| `username` | string | ✅ | 用户名 |
| `password` | string | ✅ | 密码 |

**响应示例：**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin"
    }
  }
}
```

**状态码：**

| 代码 | 说明 |
|:---|:---|
| 200 | 登录成功 |
| 401 | 用户名或密码错误 |

</details>

---

## 前台 API

### 获取网站设置

<details>
<summary><b>GET /api/settings</b> - 获取公开网站设置</summary>

**请求示例：**

```
GET /api/settings
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "siteName": "墨 · 创意博客",
    "siteDescription": "轻量、优雅、功能完备的个人博客系统",
    "author": "Xynrin",
    "authorIntro": "一个全栈开发者...",
    "articlesPerPage": 10,
    "footerText": "© 2026 Mo Blog",
    "favicon": "https://...",
    "icp": "京ICP备xxxxxxxx号",
    "icpLink": "https://beian.miit.gov.cn/",
    "socialLinks": {
      "github": "https://github.com/...",
      "bilibili": "https://space.bilibili.com/..."
    }
  }
}
```

</details>

### 获取文章列表

<details>
<summary><b>GET /api/articles</b> - 分页获取文章列表</summary>

**请求示例：**

```
GET /api/articles?page=1&limit=10&category=tech&tag=nodejs&sort=created_at&order=desc
```

**查询参数：**

| 参数 | 类型 | 说明 | 示例 |
|:---|:---|:---|:---|
| `page` | number | 页码 | 1 |
| `limit` | number | 每页条数 | 10 |
| `category` | string | 分类 slug | `tech` |
| `tag` | string | 标签名 | `nodejs` |
| `search` | string | 关键词搜索 | `博客` |
| `sort` | string | 排序字段 | `created_at`, `views` |
| `order` | string | 排序方向 | `asc`, `desc` |

**响应示例：**

```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": 1,
        "title": "如何搭建个人博客",
        "slug": "how-to-build-blog",
        "content": "Markdown 内容...",
        "excerpt": "文章摘要...",
        "category": {
          "id": 1,
          "name": "技术",
          "slug": "tech",
          "color": "#0066cc"
        },
        "tags": [
          { "id": 1, "name": "Node.js" },
          { "id": 2, "name": "Express" }
        ],
        "cover": "https://example.com/cover.jpg",
        "author": "Xynrin",
        "views": 1234,
        "created_at": "2026-04-01T00:00:00Z",
        "updated_at": "2026-04-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

</details>

### 获取文章详情

<details>
<summary><b>GET /api/articles/:slug</b> - 获取单篇文章详情</summary>

**请求示例：**

```
GET /api/articles/how-to-build-blog
```

**路径参数：**

| 参数 | 说明 |
|:---|:---|
| `slug` | 文章 slug（URL 路径） |

**响应示例：**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "如何搭建个人博客",
    "slug": "how-to-build-blog",
    "content": "完整 Markdown 内容...",
    "excerpt": "摘要...",
    "category": {
      "id": 1,
      "name": "技术",
      "slug": "tech",
      "color": "#0066cc"
    },
    "tags": [
      { "id": 1, "name": "Node.js" }
    ],
    "cover": "https://example.com/cover.jpg",
    "author": "Xynrin",
    "views": 1234,
    "created_at": "2026-04-01T00:00:00Z",
    "updated_at": "2026-04-01T00:00:00Z",
    "prevArticle": {
      "slug": "prev-article",
      "title": "上一篇文章"
    },
    "nextArticle": {
      "slug": "next-article",
      "title": "下一篇文章"
    }
  }
}
```

**副作用：** 访问时自动增加文章阅读量

</details>

### 获取分类列表

<details>
<summary><b>GET /api/categories</b> - 获取所有分类</summary>

**请求示例：**

```
GET /api/categories
```

**响应示例：**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "技术",
      "slug": "tech",
      "description": "技术文章",
      "color": "#0066cc",
      "count": 12
    },
    {
      "id": 2,
      "name": "生活",
      "slug": "life",
      "description": "生活随笔",
      "color": "#ff6600",
      "count": 8
    }
  ]
}
```

</details>

### 获取作品集

<details>
<summary><b>GET /api/portfolios</b> - 获取作品集列表</summary>

**请求示例：**

```
GET /api/portfolios?sort=order&order=asc
```

**查询参数：**

| 参数 | 说明 |
|:---|:---|
| `sort` | 排序字段 |
| `order` | 排序方向 |

**响应示例：**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Mo Blog",
      "description": "轻量级博客系统",
      "cover": "https://example.com/cover.jpg",
      "link": "https://github.com/...",
      "tags": ["Node.js", "Express", "SQLite"],
      "order": 1,
      "visible": true,
      "created_at": "2026-04-01T00:00:00Z"
    }
  ]
}
```

</details>

### 提交联系表单

<details>
<summary><b>POST /api/contact</b> - 提交联系表单</summary>

**请求示例：**

```json
{
  "name": "访客名称",
  "email": "visitor@example.com",
  "subject": "咨询题目",
  "message": "消息内容",
  "honeypot": ""
}
```

**参数说明：**

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| `name` | string | ✅ | 姓名 |
| `email` | string | ✅ | 邮箱 |
| `subject` | string | ✅ | 主题 |
| `message` | string | ✅ | 消息内容 |
| `honeypot` | string | ✅ | 蜜罐字段（应为空） |

**验证规则：**

- 邮箱格式必须有效
- 消息长度 1-1000 字符
- 同 IP 防刷（5 分钟内最多提交 3 次）

**响应示例：**

```json
{
  "success": true,
  "data": {
    "message": "消息已发送，感谢您的反馈"
  }
}
```

**状态码：**

| 代码 | 说明 |
|:---|:---|
| 200 | 提交成功 |
| 400 | 表单验证失败 |
| 429 | 请求过于频繁 |

</details>

### RSS 订阅源

<details>
<summary><b>GET /feed/rss</b> - RSS 2.0 订阅源</summary>

**请求示例：**

```
GET /feed/rss
```

**响应示例：** XML 格式的 RSS 2.0 源

**说明：** 包含最新 20 篇已发布文章的摘要和链接

</details>

<details>
<summary><b>GET /feed/atom</b> - Atom 1.0 订阅源</summary>

**请求示例：**

```
GET /feed/atom
```

**响应示例：** XML 格式的 Atom 1.0 源

**说明：** 包含最新 20 篇已发布文章的摘要和链接

</details>

---

## 后台 API

**所有后台接口需要 JWT 认证，请求头：**

```
Authorization: Bearer <token>
```

### 获取仪表盘数据

<details>
<summary><b>GET /api/admin/dashboard</b> - 仪表盘统计数据</summary>

**请求示例：**

```
GET /api/admin/dashboard
Authorization: Bearer <token>
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "articles": {
      "total": 25,
      "published": 20,
      "draft": 5
    },
    "categories": {
      "total": 3
    },
    "portfolios": {
      "total": 5
    },
    "media": {
      "total": 42
    },
    "messages": {
      "total": 15,
      "unread": 3
    },
    "views": 12345,
    "recentArticles": [
      {
        "id": 1,
        "title": "最新文章",
        "created_at": "2026-04-01T00:00:00Z"
      }
    ]
  }
}
```

</details>

### 文章管理

<details>
<summary><b>GET /api/admin/articles</b> - 获取文章列表（包括草稿）</summary>

**查询参数：** 同前台 GET /api/articles

**响应包含草稿和已发布文章**

</details>

<details>
<summary><b>POST /api/admin/articles</b> - 创建新文章</summary>

**请求示例：**

```json
{
  "title": "新文章标题",
  "slug": "new-article",
  "content": "Markdown 内容...",
  "excerpt": "文章摘要",
  "categoryId": 1,
  "tags": ["Node.js", "Express"],
  "cover": "https://...",
  "published": false
}
```

**参数说明：**

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| `title` | string | ✅ | 标题 |
| `slug` | string | ✅ | URL 路径 |
| `content` | string | ✅ | Markdown 内容 |
| `excerpt` | string | ❌ | 摘要（留空自动截取） |
| `categoryId` | number | ❌ | 分类 ID |
| `tags` | array | ❌ | 标签数组 |
| `cover` | string | ❌ | 封面图 URL |
| `published` | boolean | ❌ | 是否发布 |

</details>

<details>
<summary><b>GET /api/admin/articles/:id</b> - 获取文章详情</summary>

**路径参数：** `id` - 文章 ID

</details>

<details>
<summary><b>PUT /api/admin/articles/:id</b> - 更新文章</summary>

**请求体：** 同 POST /api/admin/articles

</details>

<details>
<summary><b>DELETE /api/admin/articles/:id</b> - 删除文章</summary>

**删除成功响应：**

```json
{
  "success": true,
  "data": { "message": "文章已删除" }
}
```

</details>

### 分类管理

<details>
<summary><b>GET /api/admin/categories</b> - 获取分类列表</summary>

**响应示例：**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "技术",
      "slug": "tech",
      "description": "技术文章",
      "color": "#0066cc",
      "order": 1
    }
  ]
}
```

</details>

<details>
<summary><b>POST /api/admin/categories</b> - 创建分类</summary>

**请求示例：**

```json
{
  "name": "技术",
  "slug": "tech",
  "description": "技术相关文章",
  "color": "#0066cc",
  "order": 1
}
```

</details>

<details>
<summary><b>PUT /api/admin/categories/:id</b> - 更新分类</summary>

**请求体：** 同 POST 创建分类

</details>

<details>
<summary><b>DELETE /api/admin/categories/:id</b> - 删除分类</summary>

</details>

### 作品集管理

<details>
<summary><b>GET /api/admin/portfolios</b> - 获取作品集列表</summary>

</details>

<details>
<summary><b>POST /api/admin/portfolios</b> - 创建作品</summary>

**请求示例：**

```json
{
  "title": "项目名称",
  "description": "项目描述",
  "cover": "https://...",
  "link": "https://github.com/...",
  "tags": ["Node.js", "Express"],
  "order": 1,
  "visible": true
}
```

</details>

<details>
<summary><b>PUT /api/admin/portfolios/:id</b> - 更新作品</summary>

</details>

<details>
<summary><b>DELETE /api/admin/portfolios/:id</b> - 删除作品</summary>

</details>

### 媒体库

<details>
<summary><b>GET /api/admin/media</b> - 获取媒体文件列表</summary>

**查询参数：**

| 参数 | 说明 |
|:---|:---|
| `type` | 文件类型（image, video, pdf） |
| `search` | 文件名搜索 |
| `page` | 页码 |
| `limit` | 每页条数 |

**响应包含：** 文件列表，带缩略图 URL

</details>

<details>
<summary><b>POST /api/admin/upload</b> - 上传文件</summary>

**请求示例：** multipart/form-data

```
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: <binary file data>
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "filename": "photo.jpg",
    "url": "/uploads/images/2026-04/photo.jpg",
    "thumbnail": "/uploads/images/2026-04/photo-thumb.jpg",
    "size": 102400,
    "mimeType": "image/jpeg"
  }
}
```

</details>

<details>
<summary><b>PUT /api/admin/media/:id</b> - 重命名文件</summary>

**请求示例：**

```json
{
  "filename": "新文件名"
}
```

</details>

<details>
<summary><b>DELETE /api/admin/media/:id</b> - 删除文件</summary>

</details>

### 消息管理

<details>
<summary><b>GET /api/admin/messages</b> - 获取消息列表</summary>

**查询参数：**

| 参数 | 说明 |
|:---|:---|
| `read` | true/false，已读/未读 |
| `page` | 页码 |
| `limit` | 每页条数 |

</details>

<details>
<summary><b>PUT /api/admin/messages/:id</b> - 标记已读/未读</summary>

**请求示例：**

```json
{
  "read": true
}
```

</details>

<details>
<summary><b>DELETE /api/admin/messages/:id</b> - 删除消息</summary>

</details>

### 系统设置

<details>
<summary><b>GET /api/admin/settings</b> - 获取系统设置</summary>

**响应示例：** 返回所有网站、社交、邮件设置

</details>

<details>
<summary><b>PUT /api/admin/settings</b> - 更新系统设置</summary>

**请求示例：**

```json
{
  "siteName": "新博客标题",
  "author": "新作者名",
  "smtp": {
    "host": "smtp.qq.com",
    "port": 587
  }
}
```

</details>

### 账户管理

<details>
<summary><b>PUT /api/admin/password</b> - 修改密码</summary>

**请求示例：**

```json
{
  "currentPassword": "当前密码",
  "newPassword": "新密码"
}
```

</details>

<details>
<summary><b>PUT /api/admin/username</b> - 修改用户名</summary>

**请求示例：**

```json
{
  "username": "新用户名"
}
```

</details>

---

## 错误处理

### 错误响应格式

```json
{
  "success": false,
  "error": "错误消息"
}
```

### 常见错误码

| HTTP 状态码 | 错误消息 | 说明 |
|:---|:---|:---|
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未授权或 Token 过期 |
| 403 | Forbidden | 无权限访问 |
| 404 | Not Found | 资源不存在 |
| 429 | Too Many Requests | 请求过于频繁 |
| 500 | Internal Server Error | 服务器错误 |

### 前端错误处理示例（JavaScript）

```javascript
async function fetchAPI(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const data = await response.json();
  
  if (!data.success) {
    if (response.status === 401) {
      // Token 过期，清除并重定向登录
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
    throw new Error(data.error);
  }

  return data.data;
}
```

---

## 相关文档


