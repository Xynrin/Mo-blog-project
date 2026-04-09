# 安装指南

> 详细的环境配置与安装步骤

## 目录

- [1. 系统要求](#1-系统要求)
- [2. Node.js 安装](#2-nodejs-安装)
- [3. 编译工具安装](#3-编译工具安装)
- [4. 依赖安装](#4-依赖安装)
- [5. 故障排除](#5-故障排除)

---

## 1. 系统要求

| 要求 | 版本 |
|:---|:---|
| Node.js | >= 18.0.0 |
| npm | >= 9.0.0 |
| 磁盘空间 | >= 200 MB |
| RAM | >= 256 MB |

## 2. Node.js 安装

### 方式一：官方安装程序（推荐）

访问 [Node.js 官网](https://nodejs.org)，下载 LTS 版本并按提示安装。

### 方式二：使用 NVM（版本管理）

推荐使用 [nvm](https://github.com/nvm-sh/nvm) 管理 Node.js 版本。

**macOS / Linux 安装 NVM：**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

**Windows 用户建议使用 [nvm-windows](https://github.com/coreybutler/nvm-windows)**

**安装 Node.js：**

```bash
nvm install --lts          # 安装最新 LTS 版本
nvm use --lts              # 切换到 LTS 版本
node -v                    # 验证版本
npm -v                     # 验证 npm 版本
```

### 方式三：使用包管理器

**Ubuntu/Debian：**

```bash
sudo apt update
sudo apt install nodejs npm
```

**macOS（Homebrew）：**

```bash
brew install node
```

**Fedora/RHEL：**

```bash
sudo dnf install nodejs npm
```

---

## 3. 编译工具安装

`better-sqlite3` 和 `sharp` 需要 C++ 编译环境来编译原生模块。

### Windows

**安装 Visual Studio Build Tools：**

1. 访问 [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
2. 下载安装程序
3. 运行安装程序，选择 **「C++ 桌面开发」** 工作负载
4. 完成安装（约需 5-15 GB 磁盘空间）

**验证安装：**

```powershell
# 在 PowerShell 中检查 npm 编译工具配置
npm config list | findstr python
```

### macOS

**安装 Xcode Command Line Tools：**

```bash
xcode-select --install
```

按提示完成安装，如果已安装可跳过。

**验证：**

```bash
gcc --version
```

### Linux (Ubuntu/Debian)

**安装必要的编译工具：**

```bash
sudo apt update
sudo apt install python3 make g++ build-essential
```

**验证：**

```bash
gcc --version
make --version
python3 --version
```

### Linux (CentOS/RHEL)

```bash
sudo yum groupinstall "Development Tools"
sudo yum install python3
```

---

## 4. 依赖安装

### 4.1 克隆项目

```bash
git clone https://github.com/Xynrin/Mo-blog-project.git
cd Mo-blog-project
```

### 4.2 安装 npm 依赖

```bash
npm install
```

**安装过程说明：**

- `npm install` 会根据 `package.json` 下载所有依赖
- 系统会自动编译 `better-sqlite3` 和 `sharp` 的原生模块
- 整个过程可能需要 2-5 分钟（首次较长）

**成功标志：**

```
added 156 packages in 2m
```

### 4.3 验证安装

```bash
npm list --depth=0
```

确保以下关键包已安装：

```
express@^4.18.0
better-sqlite3@^8.0.0
sharp@^0.32.0
nodemailer@^6.9.0
jsonwebtoken@^9.0.0
bcryptjs@^2.4.3
```

### 4.4 可选：全局安装开发工具

```bash
npm install -g nodemon    # 热重载工具
npm install -g pm2        # 进程管理工具
npm install -g sqlite3    # SQLite CLI（调试用）
```

---

## 5. 故障排除

### Q: npm install 报错 `better-sqlite3` 编译失败？

**原因：** C++ 编译工具未正确安装

**解决方案：**

1. 检查是否安装了编译工具（见上文）
2. 清除缓存重新安装：

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

3. 如果仍失败，尝试指定 Python 版本：

```bash
npm install --python=python3
```

---

### Q: npm install 报错 `sharp` 安装失败？

**常见原因：**

1. 缺少系统库文件
2. 磁盘空间不足
3. 网络连接问题

**解决方案：**

**Linux 用户：**

```bash
# 安装额外的系统库
sudo apt install libvips-dev
npm install
```

**所有用户：**

```bash
# 清除缓存并重新安装
npm cache clean --force
npm rebuild sharp
```

---

### Q: Windows 上 npm install 出错？

**常见原因：** Visual Studio Build Tools 未正确配置

**解决方案：**

1. 打开命令提示符（CMD），检查编译工具：

```cmd
npm config get msbuild_path
```

2. 如果输出为空，手动配置：

```cmd
npm config set msbuild_path "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe"
```

3. 重新运行 `npm install`

---

### Q: 安装后某个模块仍报错？

**解决方案：**

```bash
# 清除 node_modules 并重新安装
rm -rf node_modules
npm install --legacy-peer-deps
```

---

### Q: npm install 超级慢？

**原因：** npm 源较慢或网络问题

**解决方案：**

使用淘宝 npm 源（中国用户）：

```bash
npm install -g cnpm --registry=https://registry.npmmirror.com
cnpm install
```

或临时修改 npm 源：

```bash
npm install --registry https://registry.npmmirror.com
```

恢复官方源：

```bash
npm config set registry https://registry.npmjs.org/
```

---

