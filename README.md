# Short Link Platform & Web Proxy (Next.js)

[![Next.js](https://img.shields.io/badge/Framework-Next.js-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

这是一个基于 Next.js 构建的高级 Web 代理工具，具有极强的隐蔽性，伪装成一个极简、现代的 **短链接生成平台**。

## 🌟 核心特性

- **高强度伪装**：首页 (`/`) 采用现代 Glassmorphism (毛玻璃) 风格设计，伪装成一个专业的短链接服务。
    - 包含功能完备的短链生成 UI。
    - 包含模拟的后台管理登录页面。
- **隐形路由**：通过 `next.config.js` 配置，所有不存在的路径都会自动重定向到伪装页，并在页面上处理特定伪装逻辑，最大程度规避自动化扫描。
- **全功能代理 API**：
    - **SSL/TLS 穿透**：自动忽略目标站点的证书错误。
    - **智能内容重写**：自动重写 HTML/CSS/JS 中的链接，确保代理后的页面跳转依然走代理。
    - **前端 Hook 注入**：动态拦截并重写网页中的 `fetch` 和 `XHR` 请求。
    - **流式传输**：支持大文件、视频资源的二进制透传，低延迟加载。

## 🚀 快速开始

### 环境依赖
- Node.js 18.x+
- npm 或 yarn

### 安装
```bash
git clone https://github.com/your-username/fg-link-accelerator.git
cd fg-link-accelerator
npm install
```

### 开发环境运行
```bash
npm run dev
# 访问 http://localhost:3000
```

### 生产环境部署
```bash
npm run build
npm run start
```

## 🛠 使用指南

### 1. 访问代理
接口地址：`/api/proxy`  
参数：`url` (需进行 URL 编码)

**示例：**
```text
http://your-domain.com/api/proxy?url=https%3A%2F%2Fwww.google.com
```

### 2. 伪装策略
- **直接访问首页**：访客将看到一个白色的简约短链接生成工具页。
- **访问后台地址**：可以直接访问 `/admin`（或重定向逻辑）看到模拟的管理员登录界面，进一步增强伪装真实性。
- **无效路径探测**：访问任何非预设路径都会触发伪装页逻辑，增加探测难度。

## 📦 部署建议

本项目基于标准的 Next.js 结构，支持各种部署方式：
- **Vercel** (推荐)
- **Docker** 容器环境
- **私有 VPS** (使用 PM2 维护)

> [!NOTE]
> 在 Vercel 等环境部署时，由于 Serverless 函数有运行时间限制，代理超大文件可能会中断。

## ⚠️ 免责声明

本项目仅供技术研究和学习使用。请在遵守当地法律法规的前提下使用。使用者因非法用途而产生的一切后果由其自行承担，开发者概不负责。
