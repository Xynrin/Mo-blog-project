# 配置文档

> 环境变量与系统配置详解

## 目录

- [1. 环境变量配置](#1-环境变量配置)
- [2. 邮件服务配置](#2-邮件服务配置)
- [3. 数据库配置](#3-数据库配置)
- [4. 上传设置](#4-上传设置)
- [5. 安全配置](#5-安全配置)

---

## 1. 环境变量配置

### 1.1 配置方法

在项目根目录创建 `.env` 文件：

```bash
cp .env.example .env
```

使用文本编辑器编辑 `.env` 文件。

### 1.2 配置项说明

#### 运行环境

```env
NODE_ENV=development
```

| 值 | 说明 |
|:---|:---|
| `development` | 开发环境，启用详细日志和调试 |
| `production` | 生产环境，优化性能 |

#### 服务端口

```env
PORT=3000
```

- 服务监听端口，默认 3000
- 修改后需要重启服务生效
- 生产环境通常通过 Nginx 反向代理，内部端口无所谓

#### JWT 配置

```env
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

| 配置项 | 说明 | 示例 |
|:---|:---|:---|
| `JWT_SECRET` | **必填**，JWT 签名密钥 | 随机 32 位字符串 |
| `JWT_EXPIRES_IN` | Token 过期时间 | `7d`、`24h`、`3600s` |

**⚠️ 安全提示：**

- `JWT_SECRET` 务必使用强随机字符串（建议 32 位以上）
- 生成安全密钥：

```bash
# Linux/macOS
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Maximum 256) }))

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 管理员账户

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

| 配置项 | 说明 | 注意 |
|:---|:---|:---|
| `ADMIN_USERNAME` | 管理员用户名 | 仅首次初始化使用 |
| `ADMIN_PASSWORD` | 管理员密码 | 仅首次初始化使用 |

**首次启动时：**

1. 如果数据库不存在，会自动创建
2. 使用 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD` 创建管理员账户
3. 修改此配置不会影响已创建的账户

**首次登录后立即修改密码：**

进入后台 **系统设置 → 账号安全 → 修改密码**

#### 文件上传配置

```env
UPLOAD_MAX_SIZE=5242880
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/avif,video/mp4,video/webm,video/ogg,application/pdf
```

| 配置项 | 说明 | 默认值 |
|:---|:---|:---|
| `UPLOAD_MAX_SIZE` | 单个文件最大字节数 | 5242880 (5MB) |
| `UPLOAD_ALLOWED_TYPES` | 允许的 MIME 类型 | 见上 |

**常用 MIME 类型：**

| 文件类型 | MIME 类型 |
|:---|:---|
| JPEG | `image/jpeg` |
| PNG | `image/png` |
| GIF | `image/gif` |
| WebP | `image/webp` |
| SVG | `image/svg+xml` |
| MP4 | `video/mp4` |
| PDF | `application/pdf` |

---

## 2. 邮件服务配置

### 2.1 SMTP 配置

```env
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your-email@qq.com
SMTP_PASS=your-auth-code
```

| 配置项 | 说明 | 必填 |
|:---|:---|:---:|
| `SMTP_HOST` | SMTP 服务器地址 | 是 |
| `SMTP_PORT` | SMTP 服务器端口 | 是 |
| `SMTP_USER` | SMTP 用户名（通常是邮箱地址） | 是 |
| `SMTP_PASS` | SMTP 密码（授权码，不是邮箱密码） | 是 |

### 2.2 常用邮箱配置

#### QQ 邮箱

```env
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=你的QQ号@qq.com
SMTP_PASS=授权码（16位字符）
```

**获取授权码：**

1. 登录 [QQ 邮箱](https://mail.qq.com)
2. 点击 **设置** → **账户**
3. 找到 **POP3/SMTP 服务** 一栏，点击 **开启**
4. 按提示发送短信，会收到一个 16 位授权码
5. 复制授权码到 `.env` 中

#### 网易 163 邮箱

```env
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_USER=你的邮箱@163.com
SMTP_PASS=授权密码
```

**获取授权密码：**

1. 登录 [163 邮箱](https://mail.163.com)
2. 点击 **设置** → **POP3/SMTP/IMAP**
3. 开启 **IMAP/SMTP** 服务
4. 设置 **客户端授权密码**（6-16 位）
5. 复制密码到 `.env` 中

#### Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=应用专用密码（16位）
```

**获取应用专用密码：**

1. 访问 [Google 账户](https://myaccount.google.com)
2. 左侧点击 **安全性**
3. 启用 **两步验证**
4. 进入 **应用专用密码**
5. 选择 **邮件** 和 **Windows 电脑**
6. 生成并复制 16 位密码到 `.env` 中

#### Outlook / Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=你的密码
```

#### 企业邮箱（以腾讯企业邮为例）

```env
SMTP_HOST=smtp.exmail.qq.com
SMTP_PORT=465
SMTP_USER=your-email@company.com
SMTP_PASS=你的密码
```

### 2.3 邮件通知设置

在后台 **系统设置 → 邮件** 配置：

```
邮件通知开关：☑ 已启用
通知邮箱地址：your-email@qq.com
```

### 2.4 测试邮件发送

在后台邮件设置页面，点击 **测试发送** 按钮验证配置是否正确。

**常见问题排查：**

| 问题 | 原因 | 解决方案 |
|:---|:---|:---|
| 发送失败 | 授权码错误 | 检查授权码是否正确，重新复制 |
| 发送失败 | 端口被拦截 | 更换端口：587（TLS）或 465（SSL） |
| 发送失败 | 服务未启用 | 确保 SMTP 服务已在邮箱设置中启用 |
| 发送失败 | 防火墙拦截 | 检查服务器防火墙规则 |

---

## 3. 数据库配置

### 3.1 数据库文件位置

SQLite 数据库文件自动保存在：

```
server/data.db
```

**备份数据库：**

```bash
# 单次备份
cp server/data.db server/data.db.backup
```

**定时备份（Linux/macOS）：**

在 crontab 中添加：

```bash
# 每天凌晨 3 点自动备份
0 3 * * * cp /path/to/Mo-blog-project/server/data.db /path/to/backup/data.db.$(date +\%Y\%m\%d)
```

### 3.2 数据库重置

**警告：此操作会删除所有数据！**

```bash
# 停止服务
npm stop

# 删除数据库文件
rm server/data.db

# 重新启动服务（会自动初始化数据库）
npm start
```

---

## 4. 上传设置

### 4.1 上传目录结构

```
uploads/
├── images/           # 图片文件
│   └── 2026-04/     # 按年月归档
│       ├── photo.jpg
│       └── photo-thumb.jpg
└── videos/          # 视频文件（计划中）
```

### 4.2 修改上传目录权限

**Linux/macOS：**

```bash
chmod 755 uploads
chmod 755 uploads/images
```

**Windows：**

右键 → 属性 → 安全 → 编辑 → 给用户完全控制权限

### 4.3 上传限制设置

在 `.env` 中配置：

```env
# 图片最大 5 MB
UPLOAD_MAX_SIZE=5242880

# 允许的文件类型
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/avif,video/mp4,application/pdf
```

不同文件类型建议的大小限制：

| 文件类型 | 推荐限制 |
|:---|:---|
| 图片 | 5 MB |
| 视频 | 50 MB |
| PDF | 20 MB |
| 其他 | 10 MB |

### 4.4 磁盘空间监测

**Linux/macOS：**

```bash
# 查看 uploads 目录大小
du -sh uploads/

# 查看磁盘空间
df -h
```

**Windows PowerShell：**

```powershell
# 查看 uploads 目录大小
(Get-ChildItem .\uploads -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB

# 查看磁盘空间
Get-Volume
```

---

## 5. 安全配置

### 5.1 生产环境检查清单

部署到生产环境前，务必检查：

- [ ] `JWT_SECRET` 已修改为强随机字符串
- [ ] `ADMIN_PASSWORD` 已修改
- [ ] `NODE_ENV` 设置为 `production`
- [ ] `.env` 文件添加到 `.gitignore`
- [ ] 启用了 HTTPS 和 SSL 证书
- [ ] 配置了 Nginx 反向代理
- [ ] 启用了文件备份机制
- [ ] 数据库备份已配置

### 5.2 密码策略

**密码要求：**

- 最少 6 个字符
- 建议包含大小写字母、数字、特殊符号
- 建议定期修改（如每 90 天）

**强密码示例：**

```
Mo@Blog2026!SecurePass123
MySite#2026-Blog_Admin.v1
```

### 5.3 文件权限设置

**Linux/macOS：**

```bash
# 只有所有者可读写
chmod 600 .env

# 目录权限
chmod 755 uploads
chmod 700 server

# 数据库权限
chmod 600 server/data.db
```

### 5.4 防火墙配置

**生产环境建议：**

- 仅开放 80（HTTP）和 443（HTTPS）端口
- 关闭 3000 的直接外网访问
- 通过 Nginx 反向代理访问内部服务

```bash
# 查看当前监听端口（Linux）
sudo netstat -tuln

# 允许 80 和 443，拒绝其他
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3000
```

---

## 完整配置示例

### 开发环境 (.env)

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
UPLOAD_MAX_SIZE=5242880
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/avif,video/mp4,video/webm,video/ogg,application/pdf
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

### 生产环境 (.env)

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-32-char-random-string-here
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourSecurePassword123!
UPLOAD_MAX_SIZE=5242880
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/avif,video/mp4,application/pdf
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your-email@qq.com
SMTP_PASS=your-16-digit-auth-code
```

---


