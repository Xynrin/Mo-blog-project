# 墨 · 创意博客 - 动态博客系统

基于 Node.js + Express + SQLite 的个人博客系统，包含前台展示和后台管理。

## 环境要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **编译环境**：`better-sqlite3` 和 `sharp` 需要编译原生模块
  - **Windows**：安装 [windows-build-tools](https://github.com/nodejs/node-gyp#on-windows) 或 Visual Studio Build Tools
  - **macOS**：`xcode-select --install`
  - **Linux (Ubuntu/Debian)**：`sudo apt install python3 make g++`

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动服务
npm start

# 3. 访问
# 前台首页：http://localhost:3000
# 后台管理：http://localhost:3000/admin
```

默认管理员账号：`admin` / `admin123`

## 项目结构

```
├── server/                  # 服务端代码
│   ├── app.js              # Express 入口
│   ├── database.js         # 数据库初始化（SQLite）
│   ├── middleware/         # 中间件（认证、上传）
│   └── routes/             # 路由（API、后台、认证）
├── public/                  # 前端静态文件
│   ├── css/                # 样式文件
│   ├── js/                 # 脚本文件
│   └── pages/              # 页面文件
│       ├── index.html      # 首页
│       ├── articles.html   # 文章列表
│       ├── article.html    # 文章详情
│       ├── about.html      # 关于我
│       ├── portfolio.html  # 作品集
│       ├── contact.html    # 联系我
│       └── admin/          # 后台管理页面
├── uploads/                 # 上传文件目录（自动创建）
├── .env                     # 环境变量配置
└── package.json
```

## 后台功能

- **仪表盘** — 数据统计概览
- **文章管理** — 创建、编辑、发布、删除文章（支持 Markdown）
- **分类管理** — 文章分类的增删改查
- **作品集** — 作品展示管理
- **媒体库** — 图片上传与管理
- **消息管理** — 查看前台联系表单提交的消息
- **系统设置** — 站点名称、描述、作者信息、头像、页脚文字

## 配置说明

编辑 `.env` 文件可修改以下配置：

```env
PORT=3000              # 服务端口
JWT_SECRET=your-secret # JWT 密钥（请修改为随机字符串）
ADMIN_USERNAME=admin   # 管理员用户名
ADMIN_PASSWORD=admin123 # 管理员密码（首次启动后可在后台修改）
```

## 常见问题

**Q: npm install 报错 `better-sqlite3` 编译失败？**
A: 需要安装 C++ 编译工具。Linux 执行 `sudo apt install python3 make g++`，macOS 执行 `xcode-select --install`，Windows 安装 Visual Studio Build Tools。

**Q: npm install 报错 `sharp` 安装失败？**
A: sharp 需要编译环境，同上。也可尝试 `npm install --platform=linuxmusl sharp`（根据你的系统选择）。

**Q: 如何修改端口？**
A: 修改 `.env` 文件中的 `PORT` 值。

**Q: 数据存储在哪里？**
A: 使用 SQLite 数据库，数据文件为项目根目录下的 `data.db`。
