# 常见问题 (FAQ)

> Mo Blog 常见问题与解决方案

## 目录

- [安装问题](#安装问题)
- [运行问题](#运行问题)
- [功能问题](#功能问题)
- [配置问题](#配置问题)
- [部署问题](#部署问题)

---

## 安装问题

### Q: npm install 报错 `better-sqlite3` 编译失败？

**A:** 需要安装 C++ 编译工具。

**解决方案：**

详见 [安装指南 → 编译工具安装](INSTALLATION.md#12-编译工具安装)

**快速命令：**

```bash
# Linux (Ubuntu/Debian)
sudo apt install python3 make g++

# macOS
xcode-select --install

# Windows
# 访问 https://visualstudio.microsoft.com/visual-cpp-build-tools/
# 下载并安装 Visual Studio Build Tools，勾选「C++ 桌面开发」
```

---

### Q: npm install 报错 `sharp` 安装失败？

**A:** sharp 需要编译环境。

**解决方案：**

1. 确保已安装编译工具（同上条）
2. **Linux 用户额外需要：**

```bash
sudo apt install libvips-dev
npm cache clean --force
npm install
```

3. **所有用户都可尝试：**

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

### Q: npm install 超级慢？

**A:** npm 源较慢或网络问题。

**解决方案：**

**方案一：使用淘宝 npm 源（中国用户推荐）**

```bash
# 临时使用淘宝源
npm install --registry https://registry.npmmirror.com

# 或永久修改源
npm config set registry https://registry.npmmirror.com
```

**方案二：使用 cnpm**

```bash
npm install -g cnpm --registry=https://registry.npmmirror.com
cnpm install
```

**恢复官方源：**

```bash
npm config set registry https://registry.npmjs.org/
```

---

### Q: Windows 上 npm install 出错且提示找不到编译工具？

**A:** Visual Studio Build Tools 配置问题。

**解决方案：**

1. 重新安装 Visual Studio Build Tools（勾选「C++ 桌面开发」）
2. 检查 msbuild 路径：

```cmd
npm config get msbuild_path
```

3. 如果为空，手动配置：

```cmd
npm config set msbuild_path "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe"
```

4. 重新运行 `npm install`

---

### Q: npm install 时提示 `legacy peer deps`？

**A:** 依赖版本兼容性提示。

**解决方案：**

```bash
npm install --legacy-peer-deps
```

---

## 运行问题

### Q: 启动报错 `EADDRINUSE: address already in use`？

**A:** 端口 3000 被占用。

**解决方案：**

**方案一：杀掉占用进程**

```bash
# Linux/macOS - 查看占用进程
lsof -i :3000

# 杀掉进程（替换 PID）
kill -9 <PID>
```

```powershell
# Windows PowerShell - 查看占用进程
netstat -ano | findstr :3000

# 杀掉进程（替换 PID）
taskkill /PID <PID> /F
```

**方案二：修改服务端口**

编辑 `.env` 文件：

```env
PORT=3001
```

然后重新启动服务。

---

### Q: 启动报错 `Cannot find module 'xyz'`？

**A:** 模块未安装。

**解决方案：**

```bash
# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 或只安装缺失的模块
npm install <module-name>
```

---

### Q: 服务启动后，访问 `http://localhost:3000` 空白或 404？

**A:** 静态文件路径问题。

**检查方案：**

1. 验证文件是否存在：

```bash
ls -la public/
ls -la public/pages/index.html
```

2. 检查数据库是否初始化成功（查看控制台日志）
3. 重启服务：

```bash
npm start
```

---

### Q: 后台无法登录，提示「用户名或密码错误」？

**A:** 默认账号或密码错误。

**解决方案：**

1. 确认默认账号是 `admin / admin123`
2. 如果修改过，检查 `.env` 中的 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD`
3. **重置账号密码：**

删除数据库重新初始化（注意：会清空所有数据）：

```bash
rm server/data.db
npm start
```

---

### Q: 访问后台时提示 401 Unauthorized？

**A:** JWT Token 过期或无效。

**解决方案：**

1. 清除浏览器 localStorage：

```javascript
// 在浏览器控制台执行
localStorage.removeItem('token');
```

2. 刷新页面，重新登录
3. 如果仍有问题，清除所有网站数据

---

## 功能问题

### Q: 上传图片失败？

**A:** 可能原因：格式、大小或权限问题。

**检查清单：**

1. **文件格式** - 支持：JPG、PNG、GIF、WebP、SVG、AVIF
2. **文件大小** - 限制：5 MB
3. **目录权限** - 确保 `uploads/` 目录可写：

```bash
chmod 755 uploads
chmod 755 uploads/images
```

4. **磁盘空间** - 检查是否有足够空间：

```bash
df -h
```

---

### Q: 上传文件后，后台媒体库看不到？

**A:** 文件上传成功但显示问题。

**解决方案：**

1. 刷新页面
2. 检查浏览器控制台是否有错误
3. 查看 `uploads/images/` 目录是否有新文件：

```bash
ls -la uploads/images/2026-04/
```

---

### Q: 邮件发送失败？

**A:** SMTP 配置问题。

**常见原因和解决方案：**

| 原因 | 解决方案 |
|:---|:---|
| 授权码错误 | 重新获取授权码（非邮箱登录密码） |
| SMTP 端口被拦截 | 尝试 587 (TLS) 或 465 (SSL) |
| 邮箱未启用 SMTP | 在邮箱设置中开启 SMTP 服务 |
| 防火墙阻止 | 检查服务器防火墙设置 |

**调试方法：**

1. 在后台邮件设置页面点击「测试发送」
2. 查看错误日志：

```bash
tail -f server/logs/error.log    # 如果配置了日志
pm2 logs                          # 如果使用 PM2
```

3. 测试 SMTP 连接：

```bash
# 使用 telnet 测试连接
telnet smtp.qq.com 587

# 或使用 Node.js 脚本测试（详见配置文档）
```

详细配置见 [配置文档 → 邮件服务配置](CONFIGURATION.md#2-邮件服务配置)

---

### Q: 文章中包含代码块，但没有语法高亮？

**A:** 代码块缺少语言标识。

**解决方案：**

编写 Markdown 时指定语言：

```markdown
错误的写法：
```
const hello = 'world';
```

正确的写法：
```javascript
const hello = 'world';
```
```

支持的语言：javascript、python、java、go、bash、sql、html、css 等

---

### Q: 视频无法嵌入？

**A:** 输入格式错误。

**支持的格式：**

| 平台 | 输入格式 | 示例 |
|:---|:---|:---|
| YouTube | 标准 URL | `https://www.youtube.com/watch?v=VIDEO_ID` |
| Bilibili | 标准 URL | `https://www.bilibili.com/video/BV1234567890` |
| MP4 直链 | 完整 URL | `https://example.com/video.mp4` |

确保 URL 完整且有效。

---

### Q: RSS 订阅页面显示 XML 而不是订阅？

**A:** 这是浏览器默认行为，正常现象。

**正确用法：**

在 RSS 阅读器中输入：

```
http://你的域名/feed/rss
```

或

```
http://你的域名/feed/atom
```

测试：使用 [Feedly](https://feedly.com) 或其他阅读器添加订阅源

---

## 配置问题

### Q: 如何修改管理员密码？

**A:** 进入后台系统设置。

**步骤：**

1. 进入 `http://localhost:3000/admin`
2. 点击 **系统设置**
3. 进入 **账号安全** 标签
4. 输入当前密码和新密码
5. 点击 **修改密码**

---

### Q: 如何修改网站标题和描述？

**A:** 在系统设置中配置。

**步骤：**

1. 后台 → **系统设置** → **网站信息**
2. 修改：
   - 站点名称
   - 站点描述
   - 作者名称
3. 点击 **保存**

---

### Q: 如何配置社交媒体链接？

**A:** 在系统设置中配置。

**步骤：**

1. 后台 → **系统设置** → **社交媒体**
2. 填写各平台链接
3. 点击 **保存**

**支持的平台：** GitHub、Bilibili、YouTube、X (Twitter)、Gitee、QQ、邮箱

---

### Q: 如何更改登录默认密码？

**A:** 首次登录后立即修改（见上一个问题）。

**注意：** 修改 `.env` 中的密码仅对首次初始化有效，已创建的账户不受影响。

---

### Q: 数据存储在哪里？

**A:** 使用 SQLite 数据库。

**数据位置：**

```
server/data.db          # 数据库文件
uploads/                # 上传的文件
uploads/images/2026-04/ # 按月份组织的图片
```

**备份建议：**

```bash
# 定期备份数据库和上传文件
cp -r server/data.db ~/backup/data.db.$(date +%Y%m%d)
cp -r uploads ~/backup/uploads.$(date +%Y%m%d)
```

详见 [部署指南 → 数据备份](DEPLOYMENT.md#6-数据备份)

---

## 部署问题

### Q: PM2 启动应用后，访问仍然 404？

**A:** Nginx 配置或 PM2 进程问题。

**检查步骤：**

1. 验证应用是否运行：

```bash
pm2 status
```

2. 查看应用日志：

```bash
pm2 logs
```

3. 测试直接访问：

```bash
curl http://127.0.0.1:3000
```

4. 检查 Nginx 配置：

```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

### Q: HTTPS 证书过期了怎么办？

**A:** Certbot 会自动续期。

**手动续期：**

```bash
sudo certbot renew

# 或强制续期
sudo certbot renew --force-renewal
```

**检查证书状态：**

```bash
sudo certbot certificates
```

---

### Q: 域名无法访问？

**A:** DNS 解析或网络问题。

**检查步骤：**

1. **DNS 解析验证：**

```bash
nslookup your-domain.com

# 或
dig your-domain.com
```

应该返回你的服务器 IP 地址

2. **Ping 测试：**

```bash
ping your-domain.com
```

3. **查看 Nginx 状态：**

```bash
sudo systemctl status nginx
```

4. **检查防火墙：**

```bash
sudo ufw status
sudo ufw allow 80
sudo ufw allow 443
```

---

### Q: 服务器 CPU 或内存占用很高？

**A:** 可能是应用泄漏或配置问题。

**诊断步骤：**

1. **查看 PM2 监控：**

```bash
pm2 monit
```

2. **查看详细日志：**

```bash
pm2 logs

# 如果日志中有 Error，解决具体错误
```

3. **重启应用：**

```bash
pm2 restart Mo-blog-project
```

4. **查看数据库大小：**

```bash
du -h server/data.db
du -h uploads/
```

**如果上传文件过多，可清理旧文件：**

```bash
# 删除 3 个月前的文件
find uploads/ -type f -mtime +90 -delete
```

---

### Q: 定时备份脚本不执行？

**A:** Crontab 配置问题。

**检查步骤：**

1. **查看 crontab 任务列表：**

```bash
crontab -l
```

2. **检查备份脚本权限：**

```bash
chmod +x backup.sh
```

3. **查看 crontab 日志：**

```bash
# Linux
sudo tail -f /var/log/syslog | grep CRON
```

4. **手动测试脚本：**

```bash
./backup.sh
```

详见 [部署指南 → 自动备份脚本](DEPLOYMENT.md#61-自动备份脚本)

---

## 其他问题

### Q: 如何联系开发者获取帮助？

**A:** 提交 Issue 或发送邮件。

- **GitHub Issues**: https://github.com/Xynrin/Mo-blog-project/issues
- **Email**: 见项目 README

---

### Q: 能否二次开发或修改源码？

**A:** 可以。项目基于 [GPL-V3 LICENSE](../LICENSE) 开源。

**注意：**

1. 遵守 [GPL-V3 LICENSE](../LICENSE) 条款
2. 修改文件时注明修改内容
3. 如有改进欢迎提交 PR

详见项目 LICENSE 文件

---

### Q: 有更新版本如何升级？

**A:** 使用 Git 拉取最新代码。

**升级步骤：**

```bash
# 1. 备份当前数据和配置
cp -r server/data.db ~/backup/
cp .env ~/backup/.env.bak

# 2. 拉取最新代码
git pull origin main

# 3. 安装新依赖
npm install

# 4. 重启服务
pm2 restart Mo-blog-project

# 5. 检查日志
pm2 logs
```

---

### Q: 卸载或删除博客？

**A:** 简单清理步骤。

```bash
# 停止 PM2 进程
pm2 stop Mo-blog-project
pm2 delete Mo-blog-project

# 删除项目文件
rm -rf /path/to/Mo-blog-project/

# 可选：删除数据库备份
rm -rf ~/backup/
```

---

