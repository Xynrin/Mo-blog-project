# 部署指南

> 生产环境部署完整方案

## 目录

- [1. 部署前准备](#1-部署前准备)
- [2. 使用 PM2 部署](#2-使用-pm2-部署)
- [3. Nginx 反向代理](#3-nginx-反向代理)
- [4. HTTPS 与 SSL](#4-https-与-ssl)
- [5. 域名绑定](#5-域名绑定)
- [6. 数据备份](#6-数据备份)
- [7. 监控与维护](#7-监控与维护)
- [8. Docker 部署（计划中）](#8-docker-部署计划中)

---

## 1. 部署前准备

### 1.1 环境检查

**在部署服务器上执行：**

```bash
# 检查 Node.js 版本
node -v    # 需要 >= 18.0.0

# 检查 npm 版本
npm -v     # 需要 >= 9.0.0

# 检查磁盘空间
df -h      # 确保至少有 1 GB 空闲空间

# 检查内存
free -h    # 建议 512 MB 以上
```

### 1.2 系统更新

**Ubuntu/Debian：**

```bash
sudo apt update
sudo apt upgrade
```

**CentOS/RHEL：**

```bash
sudo yum update
```

### 1.3 创建应用用户

**出于安全考虑，不建议用 root 运行应用：**

```bash
# 创建专用用户
sudo useradd -m -s /bin/bash Mo-blog-project

# 切换到新用户
sudo su - Mo-blog-project
```

### 1.4 准备项目目录

```bash
# 在用户主目录下创建项目目录
mkdir -p /home/Mo-blog-project/app
cd /home/Mo-blog-project/app

# 克隆项目
git clone https://github.com/your-username/Mo-blog-project.git .

# 安装依赖
npm install --production

# 复制环境变量配置
cp .env.example .env

# 编辑配置文件
nano .env  # 修改 JWT_SECRET、邮件设置等
```

### 1.5 配置文件权限

```bash
# 限制 .env 文件权限（仅所有者可读）
chmod 600 .env

# 设置目录权限
chmod 755 /home/Mo-blog-project/app
chmod 755 /home/Mo-blog-project/app/uploads
```

---

## 2. 使用 PM2 部署

PM2 是 Node.js 生产环境进程管理工具，可自动重启、负载均衡、日志管理。

### 2.1 安装 PM2

```bash
# 全局安装
npm install pm2 -g

# 验证安装
pm2 --version
```

### 2.2 启动应用

**方式一：命令行启动**

```bash
cd /home/Mo-blog-project/app
pm2 start server/app.js --name "Mo-blog-project"
```

**方式二：配置文件启动（推荐）**

在项目根目录创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'Mo-blog-project',
    script: 'server/app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '256M',
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

启动：

```bash
pm2 start ecosystem.config.js
```

### 2.3 常用命令

```bash
# 查看应用状态
pm2 status

# 查看详细信息
pm2 info Mo-blog-project

# 查看日志
pm2 logs Mo-blog-project

# 实时监控
pm2 monit

# 重启应用
pm2 restart Mo-blog-project

# 停止应用
pm2 stop Mo-blog-project

# 删除应用
pm2 delete Mo-blog-project

# 保存 PM2 进程
pm2 save

# 启用开机自启
pm2 startup

# 禁用开机自启
pm2 unstartup
```

### 2.4 PM2 日志管理

```bash
# 清除所有日志
pm2 flush

# 只查看错误日志
pm2 logs Mo-blog-project --err

# 查看最后 100 行日志
pm2 logs Mo-blog-project --lines 100

# 日志持久化配置
# 编辑 ~/.pm2/conf.json
{
  "log_date_format": "YYYY-MM-DD HH:mm:ss",
  "error_file": "/var/log/pm2/error.log",
  "out_file": "/var/log/pm2/out.log"
}
```

### 2.5 开机自启设置

```bash
# 保存当前进程列表
pm2 save

# 生成开机启动脚本
pm2 startup

# 这会输出一条命令，复制执行：
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u Mo-blog-project --hp /home/Mo-blog-project
```

### 2.6 负载均衡（集群模式）

如果需要处理更多并发，可使用 PM2 集群模式：

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'Mo-blog-project',
    script: 'server/app.js',
    instances: 'max',      // 使用最大 CPU 核心数
    exec_mode: 'cluster',  // 集群模式
    watch: false,
    max_memory_restart: '256M'
  }]
};
```

启动：

```bash
pm2 start ecosystem.config.js
```

---

## 3. Nginx 反向代理

### 3.1 安装 Nginx

**Ubuntu/Debian：**

```bash
sudo apt install nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

**CentOS/RHEL：**

```bash
sudo yum install nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 3.2 基础反向代理配置

创建 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/Mo-blog-project
```

**基础配置：**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;

    # 反向代理
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # 静态文件缓存
    location ~* ^/(uploads|public)/ {
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

    # 图片缓存
    location ~* \.(jpg|jpeg|png|gif|webp|avif|svg)$ {
        proxy_pass http://127.0.0.1:3000;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 禁止访问敏感文件
    location ~ /\.env {
        deny all;
    }

    location ~ /\.git {
        deny all;
    }
}
```

### 3.3 启用配置

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/Mo-blog-project /etc/nginx/sites-enabled/

# 检查配置语法
sudo nginx -t

# 重新加载 Nginx
sudo systemctl reload nginx
```

### 3.4 性能优化配置

```nginx
http {
    # 启用压缩
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
    gzip_proxied any;
    gzip_comp_level 6;

    # 连接超时
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # TCP 优化
    tcp_nodelay on;
    tcp_nopush on;
    keepalive_timeout 65;

    # 上传文件大小限制
    client_max_body_size 50M;
}
```

---

## 4. HTTPS 与 SSL

### 4.1 使用 Let's Encrypt 免费证书

**安装 Certbot：**

```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

### 4.2 获取证书

```bash
# 自动配置（推荐，会自动修改 Nginx 配置）
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 或手动模式
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com
```

### 4.3 自动续期

Let's Encrypt 证书有效期 90 天，Certbot 会自动设置续期任务：

```bash
# 测试续期（不实际续期）
sudo certbot renew --dry-run

# 手动续期
sudo certbot renew

# 查看续期计划
sudo systemctl list-timers certbot
```

### 4.4 HTTPS 配置示例

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL 证书配置（Certbot 自动填入）
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # HSTS（可选，告诉浏览器始终使用 HTTPS）
    add_header Strict-Transport-Security "max-age=31536000" always;

    # 反向代理（同上）
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 5. 域名绑定

### 5.1 域名 DNS 配置

以阿里云为例：

1. 登录 [阿里云控制台](https://www.aliyun.com/)
2. 进入 **域名 → 解析**
3. 添加记录：

| 记录类型 | 主机记录 | 记录值 | TTL |
|:---|:---|:---|:---|
| A | @ | 你的服务器 IP | 600 |
| A | www | 你的服务器 IP | 600 |
| CNAME | blog | 你的主域名 | 600 |

### 5.2 DNS 生效验证

```bash
# 查询 DNS 解析
nslookup your-domain.com

# 或使用 dig
dig your-domain.com

# 验证结果应显示你的服务器 IP
```

DNS 生效通常需要 10 分钟 ~ 48 小时。

### 5.3 本地测试（未生效时）

编辑 `/etc/hosts`（macOS/Linux）或 `C:\Windows\System32\drivers\etc\hosts`（Windows）：

```
你的服务器IP your-domain.com
```

然后访问 `http://your-domain.com` 测试。

---

## 6. 数据备份

### 6.1 自动备份脚本

创建 `backup.sh`：

```bash
#!/bin/bash
# 备份脚本

BACKUP_DIR="/home/Mo-blog-project/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
cp /home/Mo-blog-project/app/server/data.db "$BACKUP_DIR/data.db.$DATE"

# 备份上传文件
tar -czf "$BACKUP_DIR/uploads.$DATE.tar.gz" -C /home/Mo-blog-project/app uploads/

# 删除 30 天前的备份
find $BACKUP_DIR -name "data.db.*" -mtime +30 -delete
find $BACKUP_DIR -name "uploads.*.tar.gz" -mtime +30 -delete

echo "备份完成: $DATE"
```

### 6.2 定时备份（Crontab）

```bash
# 编辑 crontab
crontab -e

# 每天凌晨 2 点自动备份
0 2 * * * /home/Mo-blog-project/backup.sh >> /home/Mo-blog-project/logs/backup.log 2>&1

# 每周一凌晨备份到移动硬盘（示例）
0 3 * * 1 /home/Mo-blog-project/backup.sh && cp -r /home/Mo-blog-project/backups /mnt/backup/Mo-blog-project_$(date +\%Y\%m\%d)
```

### 6.3 远程备份

```bash
# 使用 rsync 将备份同步到远程服务器
rsync -avz /home/Mo-blog-project/backups/ backup@remote-server:/backup/Mo-blog-project/

# 或上传到云存储（OSS、S3 等）
aws s3 sync /home/Mo-blog-project/backups s3://my-bucket/Mo-blog-project-backup/
```

---

## 7. 监控与维护

### 7.1 PM2 监控

```bash
# 实时监控
pm2 monit

# Web 界面监控（推荐）
pm2 web
# 访问 http://localhost:9615 查看面板
```

### 7.2 日志监控

```bash
# 查看应用日志
pm2 logs mo-blog

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 统计访问量
sudo grep "GET /api/articles" /var/log/nginx/access.log | wc -l
```

### 7.3 性能监控

```bash
# 系统资源使用
top -p $(pm2 pid Mo-blog-project)

# 磁盘使用情况
df -h
du -sh /home/Mo-blog-project/app/uploads

# 内存使用
free -h
```

### 7.4 定期维护

**每周维护：**

- [ ] 检查日志是否有错误
- [ ] 验证备份是否成功
- [ ] 检查磁盘使用率

**每月维护：**

- [ ] 更新 npm 依赖（安全补丁）：`npm audit` 和 `npm update`
- [ ] 检查证书过期时间：`sudo certbot certs`
- [ ] 清理旧日志文件

**每季度维护：**

- [ ] 更新系统补丁
- [ ] 安全审计
- [ ] 性能优化分析

---

## 8. Docker 部署（计划中）

完整的 Docker 部署方案计划在下一个版本推出。

敬请期待 🚀

---

## 故障排除

### 服务无法启动

```bash
# 检查 3000 端口是否被占用
sudo netstat -tuln | grep 3000

# 查看详细错误日志
pm2 logs mo-blog --err
```

### Nginx 无法连接后端

```bash
# 检查 Node.js 服务是否运行
pm2 status

# 测试 localhost:3000 是否响应
curl http://127.0.0.1:3000

# 检查防火墙
sudo ufw status
```

### SSL 证书错误

```bash
# 检查证书状态
sudo certbot certificates

# 强制续期
sudo certbot renew --force-renewal
```

---

