<div align="center">

# 🎓 马克思主义基本原理在线智能刷题系统

![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Cloud-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Gemini](https://img.shields.io/badge/Google-Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)

**📚 专为马克思主义基本原理课程打造的智能在线刷题平台**

**🌐 云端数据同步 · 🤖 AI智能解析 · 📊 实时成绩追踪**

</div>

---

## 📋 项目简介

> 💡 **"理论联系实际，学以致用"** —— 本系统致力于帮助学生高效掌握马克思主义基本原理

本项目是一款现代化的在线刷题系统，专门针对高校《马克思主义基本原理》课程设计开发。系统涵盖**导论及七大章节**的重点难点，通过**智能化的练习模式**和**AI辅助解析**，帮助学生轻松掌握理论知识，从容应对考试。

---

## ✨ 功能特性

### 🎯 核心功能

| 功能 | 描述 |
|:---:|:---|
| 📚 **章节练习** | 涵盖导论及七大章节，分类清晰 |
| 🎲 **多题型支持** | 单选、多选、判断题全覆盖 |
| ⏱️ **计时模式** | 模拟真实考试环境 |
| 📊 **实时评分** | 答题即出分，即时反馈 |
| 📝 **错题回顾** | 查看答案解析，巩固薄弱点 |
| 📈 **历史记录** | 追踪学习进度，见证成长 |

### 🤖 智能特性

| 功能 | 描述 |
|:---:|:---|
| 🧠 **AI解析** | Google Gemini 智能答疑，支持 **LaTeX 数学公式渲染** |
| 📝 **富文本笔记** | **所见即所得 (WYSIWYG)** 编辑器，支持颜色、高亮、划线 |
| ☁️ **云端同步** | 题库、用户数据多端实时同步，支持管理员在线改题 |
| ⚙️ **核心控制中心** | 全局开关管理（同步权限、维护模式、注册开放） |
| 👥 **身份通知** | 针对 ADMIN/VIP/MEMBER 的定向身份公告推送 |
| 📱 **响应式设计** | 完美适配手机/平板/电脑，表格支持横向滚动 |

---

## 🛠️ 技术架构

| 类别 | 技术 |
|:---:|:---|
| 🎨 **前端** | React 19 + TypeScript + Tailwind CSS |
| 📄 **渲染** | React-Markdown + **KaTeX** + Remark-GFM |
| ☁️ **数据库** | Supabase (PostgreSQL) + Storage |
| 🤖 **AI** | Google Gemini API |
| 🚀 **部署** | Zeabur |

---

## 📖 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/yud25007/marxism-smartexam.git
cd marxism-smartexam
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

创建 `.env.local` 文件：

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

---

## 👥 用户角色

| 角色 | 权限 |
|:---:|:---|
| 👤 **游客** | 浏览首页、查看章节列表 |
| 👨‍🎓 **普通用户** | 答题练习、查看历史记录、AI解析 |
| 👨‍💼 **管理员** | 用户管理、审核注册、权限配置 |

---

## 📁 项目结构

```
marxism-smartexam/
├── components/          # React 组件
├── services/            # 服务层
├── public/              # 静态资源
├── App.tsx              # 主应用
├── constants.ts         # 题库数据
├── types.ts             # 类型定义
└── vite.config.ts       # Vite配置
```

---

## 🤝 联系我们

<div align="center">

**微信搜一搜：清言观**

如有问题或建议，欢迎通过公众号后台私信联系！

---

**🎓 学好马原，筑牢信仰之基 🎓**

*Made with ❤️ by 清言观*

Copyright © 2025 清言观

</div>
