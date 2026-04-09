# 快速开始

> 五分钟快速启动 Mo Blog 博客系统

## 前置要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- C++ 编译环境（用于 `better-sqlite3` 和 `sharp`）

> 详细编译工具安装请参阅 [安装指南 → 编译工具安装](INSTALLATION.md#12-编译工具安装)

## 安装步骤

### 1. 克隆项目

```bash
git clone https://github.com/Xynrin/Mo-blog-project.git
cd Mo-blog-project
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，**至少修改以下必填项**：

```env
JWT_SECRET=你的随机密钥（32位以上）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

> 完整配置说明请参阅 [配置文档](CONFIGURATION.md)

### 4. 启动服务

```bash
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

## 首次登录

1. 打开浏览器访问：`http://localhost:3000/admin`
2. 使用默认账号 `admin / admin123` 登录
3. **⚠️ 重要**：进入 **系统设置 → 账号安全** 立即修改密码

> 详细使用说明见 [使用文档](USAGE.md)

## 开发模式

使用 `nodemon` 实现热重载开发：

```bash
npm run dev
```

## 常见问题

遇到问题？查看 [常见问题 FAQ](FAQ.md) 获取快速解决方案。

---

## 下一步

- 📖 [完整使用文档](USAGE.md) — 详细的功能使用说明
- ⚙️ [配置文档](CONFIGURATION.md) — 深入配置选项
- ✨ [功能特性](FEATURES.md) — 功能模块总览
- 🚀 [部署指南](DEPLOYMENT.md) — 生产环境部署
- 🔗 [API 接口](API.md) — 开发者接口文档
