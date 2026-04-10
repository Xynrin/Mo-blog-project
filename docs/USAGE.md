# 墨 · 创意博客 — 使用文档

> 本文档涵盖墨 · 创意博客的安装、配置、使用、部署等完整指南。

---

## 目录

- [1. 环境配置](#1-环境配置)
- [2. 安装指南](#2-安装指南)
- [3. 前台功能](#3-前台功能)
- [4. 后台管理](#4-后台管理)
- [5. 文章编写](#5-文章编写)
- [6. 媒体库使用](#6-媒体库使用)
- [7. 系统设置详解](#7-系统设置详解)
- [8. 邮件通知配置](#8-邮件通知配置)
- [9. 账号安全](#9-账号安全)
- [10. 服务管理（mo CLI）](#10-服务管理mo-cli)
- [11. 部署指南](#11-部署指南)
- [12. 数据备份与迁移](#12-数据备份与迁移)
- [13. API 接口](#13-api-接口)
- [14. 常见问题](#14-常见问题)
- [15. 更新日志](#15-更新日志)

---

## 1. 环境配置

### 1.1 Node.js 安装

本系统要求 **Node.js >= 18.0.0** 和 **npm >= 9.0.0**。

推荐使用 [nvm](https://github.com/nvm-sh/nvm)（Node Version Manager）管理 Node.js 版本：

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 安装 Node.js LTS
nvm install --lts

# 验证版本
node -v   # v18.x.x 或更高
npm -v    # 9.x.x 或更高
```

### 1.2 编译工具安装

`better-sqlite3` 和 `sharp` 需要编译原生 C++ 模块，请根据操作系统安装编译工具：

**Linux (Ubuntu/Debian)：**

```bash
sudo apt update
sudo apt install python3 make g++
```

**macOS：**

```bash
xcode-select --install
```

**Windows：**

安装 [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)，勾选「C++ 桌面开发」工作负载。

### 1.3 环境变量配置

复制环境变量模板并修改：

```bash
cp .env.example .env
```

编辑 `.env` 文件，完整配置项说明如下：

| 配置项 | 说明 | 默认值 | 是否必填 |
|:---|:---|:---|:---:|
| `NODE_ENV` | 运行环境 | `development` | 否 |
| `PORT` | 服务监听端口 | `3000` | 否 |
| `JWT_SECRET` | JWT 签名密钥 | `your-secret-key` | **是** |
| `JWT_EXPIRES_IN` | Token 过期时间 | `7d` | 否 |
| `ADMIN_USERNAME` | 管理员用户名（仅首次初始化） | `admin` | 否 |
| `ADMIN_PASSWORD` | 管理员密码（仅首次初始化） | `admin123` | 否 |
| `UPLOAD_MAX_SIZE` | 上传文件大小限制（字节） | `5242880` (5MB) | 否 |
| `UPLOAD_ALLOWED_TYPES` | 允许上传的文件类型 | `image/jpeg,image/png,...` | 否 |
| `SMTP_HOST` | SMTP 服务器地址 | `smtp.qq.com` | 邮件功能必填 |
| `SMTP_PORT` | SMTP 服务器端口 | `587` | 邮件功能必填 |
| `SMTP_USER` | SMTP 用户名（邮箱地址） | 空 | 邮件功能必填 |
| `SMTP_PASS` | SMTP 授权码（非登录密码） | 空 | 邮件功能必填 |

> ⚠️ **安全提示**：生产环境中务必将 `JWT_SECRET` 修改为随机字符串（建议 32 位以上），并修改默认管理员密码。

---

## 2. 安装指南

### 2.0 一键在线安装（推荐）

在 Linux 服务器上一行命令即可完成安装和启动：

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/Xynrin/Mo-blog-project/main/install.sh)
```

脚本会交互式引导你配置：
- **端口**（默认 3000）
- **管理员用户名**（默认 admin）
- **管理员密码**（默认 admin123，输入时隐藏）

配置完成后自动完成：安装 Node.js → 安装编译工具 → 克隆项目 → 安装依赖 → 生成配置 → 放行防火墙 → 启动服务。

### 2.1 本地一键部署

在已有项目文件的服务器上：

```bash
bash setup.sh

# 或指定端口
bash setup.sh --port 8080
```

### 2.2 从源码安装

```bash
# 1. 克隆项目
git clone https://github.com/your-username/mo-blog.git
cd mo-blog

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，修改 JWT_SECRET 等配置

# 4. 启动服务
npm start
```

启动成功后，控制台会显示：

```
╔════════════════════════════════════════════════════════════╗
║   墨 · 创意博客 - 动态博客系统                              ║
║   服务已启动: http://localhost:3000                        ║
║   后台管理:   http://localhost:3000/admin                  ║
║   默认账号: admin / admin123                                ║
╚════════════════════════════════════════════════════════════╝
```

### 2.2 开发模式

使用 `nodemon` 实现代码修改后自动重启：

```bash
npm run dev
```

### 2.3 首次登录安全操作

1. 访问 `http://localhost:3000/admin`，使用默认账号 `admin / admin123` 登录
2. 进入 **系统设置 → 账号安全**，立即修改密码
3. 可选：修改用户名（用户名会同步更新为网站作者名称）

---

## 3. 前台功能

### 3.1 首页

首页展示已发布的文章列表，包含文章封面、标题、摘要、分类、标签、发布时间和阅读量。支持翻页浏览。

### 3.2 文章列表

访问 `/articles` 查看所有已发布文章，支持：
- 按分类筛选
- 按标签筛选
- 分页浏览

### 3.3 文章详情

文章详情页支持：
- **Markdown 渲染**：标题、段落、列表、引用、代码块、表格等
- **代码高亮**：代码块自动语法高亮
- **图片展示**：响应式图片适配
- **视频嵌入**：支持 YouTube、Bilibili、MP4 视频播放
- **阅读量统计**：每次访问自动 +1
- **分类与标签**：点击可跳转到对应筛选页

### 3.4 作品集

访问 `/portfolio` 查看作品展示，以卡片形式呈现，包含封面图、标题、描述和标签。

### 3.5 联系表单

访问 `/contact` 可向站长发送消息，包含：
- 姓名、邮箱、主题、消息内容
- 表单验证（必填项检查、邮箱格式校验）
- 防垃圾提交机制（时间戳验证、蜜罐字段、频率限制）

### 3.6 RSS 订阅

系统自动生成 RSS 2.0 和 Atom 1.0 订阅源：

| 格式 | 地址 |
|:---|:---|
| RSS 2.0 | `/feed/rss` |
| Atom 1.0 | `/feed/atom` |

将以上地址添加到 RSS 阅读器（如 Inoreader、Feedly）即可订阅。

### 3.7 页脚

页脚固定在页面底部，包含：
- **左侧**：页脚自定义文字（在系统设置中配置）
- **中间**：ICP 备案信息（配置后显示，含超链接和盾牌图标）
- **右侧**：RSS 订阅链接

---

## 4. 后台管理

访问 `/admin` 进入后台管理，所有页面需要登录认证。

### 4.1 仪表盘

`/admin` — 首页概览，展示：
- 文章总数、已发布数、草稿数
- 总阅读量
- 作品集数量、媒体文件数量
- 最近 5 篇文章

### 4.2 文章管理

`/admin/articles` — 文章列表与操作：

| 操作 | 说明 |
|:---|:---|
| 新建文章 | 点击「写文章」按钮，进入 Markdown 编辑器 |
| 编辑文章 | 点击文章标题或编辑按钮 |
| 删除文章 | 点击删除按钮，二次确认后删除 |
| 发布/撤回 | 切换文章的发布状态 |

文章编辑页 (`/admin/article-edit`) 功能：
- **标题**：文章标题
- **Slug**：URL 友好路径（自动生成，可手动修改）
- **分类**：从已有分类中选择
- **标签**：输入标签名后回车添加，支持多个
- **封面图**：从媒体库选择或上传新图片（建议 16:9 比例）
- **摘要**：文章简介（留空则自动截取正文前 200 字）
- **内容**：Markdown 编辑器，支持工具栏快捷插入
- **视频嵌入**：支持 YouTube、Bilibili 链接和 MP4 直链

### 4.3 分类管理

`/admin/categories` — 文章分类的增删改查：

- **分类名称**：显示名称
- **Slug**：URL 路径标识
- **描述**：分类说明
- **颜色**：分类标识颜色，同时控制文章标签按钮的背景颜色
- **排序**：数字越小越靠前

### 4.4 作品集管理

`/admin/portfolios` — 作品展示管理：

- **标题**：作品名称
- **描述**：作品简介
- **封面图**：作品封面（建议 16:9 比例）
- **项目链接**：外部链接地址
- **标签**：作品标签（JSON 数组格式）
- **排序**：数字越小越靠前
- **可见性**：控制是否在前台展示

### 4.5 媒体库

`/admin/media` — 文件管理器（类似 Windows 资源管理器风格）：

- **上传**：点击上传按钮或拖拽文件到上传区域
- **文件类型**：图片（JPG/PNG/GIF/WebP/SVG/AVIF）、视频（MP4/WebM/OGG）、文件（PDF）
- **大小限制**：图片 5MB、视频 50MB、PDF 20MB
- **视图切换**：网格视图 / 列表视图
- **搜索**：按文件名搜索
- **筛选**：按文件类型筛选
- **重命名**：修改文件显示名称
- **删除**：删除不需要的文件
- **图片处理**：上传后自动生成缩略图（Sharp 处理）

### 4.6 消息管理

`/admin/messages` — 查看前台联系表单提交的消息：

- 显示发送人姓名、邮箱、主题、消息内容、时间
- 支持标记已读/未读
- 支持删除消息
- 开启邮件通知后，新消息会自动发送邮件提醒

---

## 5. 文章编写

### 5.1 Markdown 语法

编辑器支持标准 Markdown 语法，常用格式：

```markdown
# 一级标题
## 二级标题

**加粗文本** *斜体文本* ~~删除线~~

- 无序列表项 1
- 无序列表项 2

1. 有序列表项 1
2. 有序列表项 2

> 引用文本

[链接文字](https://example.com)
![图片描述](图片地址)

`行内代码`

```javascript
// 代码块
const hello = 'world';
```

| 表头 1 | 表头 2 |
|:---:|:---:|
| 内容 1 | 内容 2 |
```

### 5.2 插入图片

**方式一：从媒体库插入**

1. 点击编辑器工具栏的「图片」按钮
2. 在媒体库弹窗中选择已有图片或上传新图片
3. 点击「插入」即可

**方式二：使用外链**

直接在 Markdown 中写入图片 URL：

```markdown
![图片描述](https://example.com/image.jpg)
```

### 5.3 插入视频

点击编辑器工具栏的「视频」按钮，支持以下格式：

| 平台 | 输入格式 |
|:---|:---|
| YouTube | `https://www.youtube.com/watch?v=VIDEO_ID` |
| Bilibili | `https://www.bilibili.com/video/BVxxxxxx` |
| MP4 直链 | `https://example.com/video.mp4` |

### 5.4 文章状态

- **草稿**：仅管理员可见，不出现在前台
- **已发布**：在前台展示，可通过文章列表访问

---

## 6. 媒体库使用

### 6.1 支持的文件格式

| 类型 | 格式 | 大小限制 |
|:---|:---|:---|
| 图片 | JPG、PNG、GIF、WebP、SVG、AVIF | 5MB |
| 视频 | MP4、WebM、OGG | 50MB |
| 文件 | PDF | 20MB |

### 6.2 图片处理

上传图片后，系统使用 Sharp 自动处理：

- **压缩优化**：减小文件体积，提升加载速度
- **缩略图生成**：自动生成 `-thumb` 后缀的缩略图
- **按月归档**：文件自动存储到 `uploads/images/YYYY-MM/` 目录

### 6.3 文件管理操作

- **上传**：支持点击上传和拖拽上传，可同时选择多个文件
- **搜索**：在搜索框输入文件名关键词
- **类型筛选**：通过下拉菜单筛选图片/视频/文件
- **重命名**：点击文件的重命名按钮，修改显示名称
- **删除**：点击删除按钮移除文件（同时删除缩略图）
- **复制链接**：获取文件的访问路径，用于文章引用

---

## 7. 系统设置详解

访问 `/admin/settings`，包含以下设置分组：

### 7.1 网站信息（站点 Tab）

| 设置项 | 说明 |
|:---|:---|
| 站点名称 | 博客标题，显示在浏览器标签页和页面头部 |
| 站点描述 | 博客简介，用于 SEO 和 RSS 描述 |
| 作者名称 | 显示在页脚和文章作者处 |
| 作者简介 | 「关于我」页面的个人介绍 |
| 作者头像 | 「关于我」页面展示的头像（支持裁剪上传） |
| 每页文章数 | 文章列表每页显示的文章数量 |
| 页脚文字 | 页脚左侧显示的自定义文字 |
| Favicon | 网站图标，显示在浏览器标签页和书签栏（支持上传或输入 URL） |
| 备案文本 | ICP 备案号文字（如「京ICP备xxxxxxxx号」） |
| 备案链接 | 备案信息指向的 URL（如工信部查询页面） |

### 7.2 社交媒体（社交 Tab）

配置社交平台链接，显示在页脚：

- GitHub、Bilibili、YouTube、X (Twitter)、Gitee、QQ、邮箱

### 7.3 邮件服务（邮件 Tab）

配置 SMTP 邮件服务，用于发送联系表单通知：

- SMTP 服务器地址和端口
- SMTP 用户名和授权码
- 邮件模板自定义

### 7.4 新消息通知（邮件 Tab 内）

| 设置项 | 说明 |
|:---|:---|
| 邮件通知开关 | 勾选后，收到新消息时通过邮件通知管理员 |
| 通知邮箱地址 | 接收通知的邮箱地址 |

---

## 8. 邮件通知配置

### 8.1 获取 SMTP 授权码

邮件通知功能需要配置 SMTP 服务。以下是常用邮箱的配置方法：

#### QQ 邮箱

1. 登录 QQ 邮箱 → 设置 → 账户
2. 开启「POP3/SMTP 服务」
3. 按提示发送短信获取**授权码**
4. 配置参数：

```
SMTP_HOST = smtp.qq.com
SMTP_PORT = 587（或 465）
SMTP_USER = 你的QQ邮箱@qq.com
SMTP_PASS = 授权码（非QQ密码）
```

#### 163 网易邮箱

1. 登录 163 邮箱 → 设置 → POP3/SMTP/IMAP
2. 开启「IMAP/SMTP 服务」
3. 设置客户端授权密码
4. 配置参数：

```
SMTP_HOST = smtp.163.com
SMTP_PORT = 465
SMTP_USER = 你的邮箱@163.com
SMTP_PASS = 客户端授权密码
```

#### Gmail

1. Google 账户 → 安全性 → 两步验证
2. 生成「应用专用密码」
3. 配置参数：

```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = 你的邮箱@gmail.com
SMTP_PASS = 应用专用密码
```

### 8.2 配置步骤

1. 在后台 **系统设置 → 邮件** 中填写 SMTP 信息
2. 点击「测试发送」验证配置是否正确
3. 在 **新消息通知** 区域勾选「收到新消息时邮件通知我」
4. 填写接收通知的邮箱地址
5. 点击「保存通知设置」

### 8.3 通知触发

当访客通过前台联系表单提交消息时，系统会自动发送邮件到配置的通知邮箱，邮件包含：
- 发送人姓名和邮箱
- 消息主题和内容
- 提交时间

---

## 9. 账号安全

### 9.1 修改密码

1. 进入 **系统设置 → 账号安全**
2. 在「修改密码」区域输入当前密码和新密码
3. 新密码至少 6 位
4. 点击「修改密码」

### 9.2 修改用户名

1. 进入 **系统设置 → 账号安全**
2. 在「用户名」区域查看当前用户名
3. 输入新用户名（2-20 个字符）
4. 点击「修改用户名」

> **注意**：修改用户名会同步更新网站设置中的「作者名称」，影响页脚和文章作者显示。修改后需要重新登录。

### 9.3 JWT 认证说明

系统使用 JWT (JSON Web Token) 进行无状态认证：

- 登录成功后返回 Token，存储在浏览器 localStorage
- Token 默认有效期 7 天（可通过 `.env` 中的 `JWT_EXPIRES_IN` 修改）
- Token 过期后需要重新登录
- 生产环境请使用强随机字符串作为 `JWT_SECRET`

---

## 10. 服务管理（mo CLI）

项目内置 `mo` CLI 工具，用于管理博客服务进程：

```bash
# 启动服务（后台运行，断开终端不会中断）
./mo start

# 停止服务（通过 PID 文件安全停止）
./mo stop

# 重启服务
./mo restart

# 查看服务状态
./mo status

# 显示帮助
./mo help
```

也可以通过 npm scripts 调用：

```bash
npm run stop     # 停止
npm run restart  # 重启
npm run status   # 状态
```

**工作原理：**
- 启动时将进程 PID 写入 `.mo.pid` 文件
- 停止时读取 PID，通过 `/proc/PID/cmdline` 验证进程身份，防止误杀
- 从 `.env` 读取端口配置，启动前检测端口占用

> `npm start` 是前台运行（开发调试用），`./mo start` 是后台运行（生产部署用）。

---

## 11. 部署指南

### 11.1 PM2 部署（推荐）

PM2 是 Node.js 生产环境进程管理工具，支持自动重启、日志管理和开机自启。

```bash
# 全局安装 PM2
npm install pm2 -g

# 启动应用
pm2 start server/app.js --name mo-blog

# 查看状态
pm2 status

# 查看日志
pm2 logs mo-blog

# 重启应用
pm2 restart mo-blog

# 停止应用
pm2 stop mo-blog

# 设置开机自启
pm2 startup
pm2 save
```

**PM2 配置文件**（`ecosystem.config.js`）：

```javascript
module.exports = {
  apps: [{
    name: 'mo-blog',
    script: 'server/app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '256M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

使用配置文件启动：`pm2 start ecosystem.config.js`

### 11.2 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 静态文件缓存
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # CSS/JS 缓存
    location ~* \.(css|js)$ {
        proxy_pass http://127.0.0.1:3000;
        expires 7d;
        add_header Cache-Control "public";
    }

    # 反向代理
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 11.3 HTTPS 配置（Let's Encrypt）

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书（自动修改 Nginx 配置）
sudo certbot --nginx -d your-domain.com

# 自动续期（certbot 会自动添加定时任务）
sudo certbot renew --dry-run
```

### 11.4 域名绑定

1. 在域名服务商（如阿里云、腾讯云、Cloudflare）添加 DNS 解析
2. 添加 A 记录，指向服务器 IP 地址
3. 等待 DNS 生效（通常 10 分钟 ~ 48 小时）
4. 配置 Nginx 后访问域名验证

---

## 12. 数据备份与迁移

### 11.1 数据库备份

SQLite 数据库文件位于 `server/data.db`：

```bash
# 手动备份
cp server/data.db server/data.db.backup.$(date +%Y%m%d)

# 定时备份（crontab）
# 每天凌晨 3 点自动备份
0 3 * * * cp /path/to/mo-blog/server/data.db /path/to/backup/data.db.$(date +\%Y\%m\%d)
```

### 11.2 上传文件备份

```bash
# 备份 uploads 目录
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/
```

### 11.3 完整备份脚本

```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/path/to/backup"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp server/data.db "$BACKUP_DIR/data.db.$DATE"
tar -czf "$BACKUP_DIR/uploads.$DATE.tar.gz" uploads/

# 保留最近 30 天的备份
find $BACKUP_DIR -name "data.db.*" -mtime +30 -delete
find $BACKUP_DIR -name "uploads.*.tar.gz" -mtime +30 -delete

echo "备份完成: $DATE"
```

### 11.4 数据迁移

将整个项目目录复制到新服务器：

```bash
# 在旧服务器打包（排除 node_modules）
tar -czf mo-blog-migrate.tar.gz --exclude=node_modules --exclude=.git .

# 传输到新服务器
scp mo-blog-migrate.tar.gz user@new-server:/path/to/

# 在新服务器解压
cd /path/to/
tar -xzf mo-blog-migrate.tar.gz
npm install --production
pm2 start server/app.js --name mo-blog
```

---

## 13. API 接口

### 12.1 认证接口

| 方法 | 路径 | 说明 |
|:---|:---|:---|
| POST | `/api/auth/login` | 管理员登录 |

**请求示例：**

```json
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}
```

**响应：**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": 1, "username": "admin" }
  }
}
```

### 12.2 前台 API

| 方法 | 路径 | 说明 |
|:---|:---|:---|
| GET | `/api/settings` | 获取网站公开设置 |
| GET | `/api/articles` | 获取文章列表（支持分页、分类、标签筛选） |
| GET | `/api/articles/:slug` | 获取文章详情 |
| GET | `/api/categories` | 获取分类列表 |
| GET | `/api/portfolios` | 获取作品集列表 |
| POST | `/api/contact` | 提交联系表单 |
| GET | `/feed/rss` | RSS 2.0 订阅源 |
| GET | `/feed/atom` | Atom 1.0 订阅源 |

### 12.3 后台 API

所有后台接口需要 JWT 认证，请求头携带 `Authorization: Bearer <token>`。

| 方法 | 路径 | 说明 |
|:---|:---|:---|
| GET | `/api/admin/dashboard` | 仪表盘数据 |
| GET/POST | `/api/admin/articles` | 文章列表/创建 |
| GET/PUT/DELETE | `/api/admin/articles/:id` | 文章详情/更新/删除 |
| GET/POST | `/api/admin/categories` | 分类列表/创建 |
| PUT/DELETE | `/api/admin/categories/:id` | 分类更新/删除 |
| GET/POST | `/api/admin/portfolios` | 作品集列表/创建 |
| PUT/DELETE | `/api/admin/portfolios/:id` | 作品集更新/删除 |
| GET | `/api/admin/media` | 媒体文件列表 |
| POST | `/api/admin/upload` | 上传文件 |
| PUT/DELETE | `/api/admin/media/:id` | 重命名/删除媒体 |
| GET | `/api/admin/messages` | 消息列表 |
| PUT/DELETE | `/api/admin/messages/:id` | 标记已读/删除消息 |
| GET/PUT | `/api/admin/settings` | 获取/更新系统设置 |
| PUT | `/api/admin/password` | 修改密码 |
| PUT | `/api/admin/username` | 修改用户名 |

---

## 14. 常见问题

### Q: npm install 报错 `better-sqlite3` 编译失败？

**A:** 需要安装 C++ 编译工具：
- **Linux**：`sudo apt install python3 make g++`
- **macOS**：`xcode-select --install`
- **Windows**：安装 [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

### Q: npm install 报错 `sharp` 安装失败？

**A:** sharp 需要编译环境，同上。也可尝试清除缓存后重新安装：

```bash
npm cache clean --force
npm install
```

### Q: 启动报错 `EADDRINUSE: address already in use`？

**A:** 端口 3000 被占用，解决方法：

```bash
# 查看占用端口的进程
lsof -i:3000

# 杀掉进程（替换 PID）
kill -9 <PID>

# 或修改 .env 中的 PORT 为其他端口
```

### Q: 上传图片失败？

**A:** 检查以下几点：
1. 图片格式是否在允许列表中（JPG/PNG/GIF/WebP/SVG/AVIF）
2. 图片大小是否超过 5MB 限制
3. `uploads/` 目录是否有写入权限
4. 是否安装了 Sharp 图片处理库

### Q: 邮件发送失败？

**A:** 常见原因：
1. SMTP 授权码错误（注意不是邮箱登录密码）
2. SMTP 端口被防火墙拦截（尝试 587 或 465）
3. 邮箱未开启 SMTP 服务
4. 使用 SSL 时端口应为 465，使用 TLS 时端口应为 587

### Q: 如何修改网站端口？

**A:** 修改 `.env` 文件中的 `PORT` 值，然后重启服务。

### Q: 数据存储在哪里？

**A:** 使用 SQLite 数据库，数据文件为 `server/data.db`。上传的文件存储在 `uploads/` 目录下。

### Q: 如何重置管理员密码？

**A:** 删除 `server/data.db` 文件，重启服务会自动重新初始化数据库（注意：这会清空所有数据）。建议通过数据库工具直接修改 `admins` 表中的 `password_hash` 字段。

### Q: 前台页面样式错乱？

**A:** 确保以下文件存在：
- `/public/css/variables.css`
- `/public/css/main.css`
- `/public/js/main.js`

---

## 15. 更新日志

### v1.0.0 (2026-04)

**功能特性：**

- ✅ 文章系统（Markdown 编辑、分类、标签、封面图、草稿/发布）
- ✅ 作品集展示（卡片布局、封面图、标签、排序）
- ✅ 媒体库（多格式上传、图片处理、缩略图、搜索筛选、重命名）
- ✅ 联系表单（防垃圾提交、邮件通知）
- ✅ RSS 订阅（RSS 2.0 + Atom 1.0）
- ✅ 后台管理（仪表盘、文章、分类、作品集、媒体、消息、设置）
- ✅ 系统设置（站点信息、作者信息、社交链接、Favicon、备案设置）
- ✅ 账号安全（JWT 认证、密码修改、用户名修改）
- ✅ 响应式设计（桌面端 + 移动端适配）
- ✅ 页面动画（滚动揭示、卡片悬浮、粒子背景）
- ✅ 视频嵌入（YouTube、Bilibili、MP4）
- ✅ 头像裁剪（Cropper.js）
- ✅ 页脚固定底部（ICP 备案、RSS 链接、自定义文字）
- ✅ 分类颜色联动标签背景色

**技术栈：**

- Node.js + Express 4.x
- SQLite (better-sqlite3)
- Sharp 图片处理
- Multer 文件上传
- Nodemailer 邮件发送
- JWT 认证
- marked Markdown 渲染
- 原生 HTML/CSS/JS 前端
