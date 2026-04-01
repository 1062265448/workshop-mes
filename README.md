# Workshop MES - 制造执行系统

全新的 Workshop 制造执行系统，采用现代化技术栈。

## 🏗️ 技术栈

### 后端
- **框架**: NestJS (Node.js)
- **数据库**: MySQL 8.0
- **ORM**: Prisma
- **缓存**: Redis 7
- **API 文档**: Swagger/OpenAPI

### 前端
- **框架**: Vue 3 + Vite
- **UI**: 统一设计系统
- **状态管理**: Pinia
- **HTTP**: Axios

### 基础设施
- **容器**: Docker + Docker Compose
- **版本控制**: Git

## 📁 项目结构

```
workshop_management/
├── backend/          # NestJS 后端服务
├── frontend/         # Vue 3 前端应用
├── docker/           # Docker 配置文件
├── docs/             # 项目文档
├── scripts/          # 工具脚本
└── memory/           # 运行时数据
```

## 🚀 快速开始

### 1. 启动基础设施

```bash
docker ps  # 确认 workshop-mysql 和 workshop-redis 运行中
```

### 2. 后端开发

```bash
cd backend
npm install
npm run start:dev
```

### 3. 前端开发

```bash
cd frontend
npm install
npm run dev
```

## 📋 功能模块

- 用户管理
- 会议管理
- 安全管理
- 生产管理
- 项目管理
- 缺陷检测
- 平面库配货
- AI 智能助手 (可选)

## 🌐 访问地址

- 前端：http://localhost:5173
- 后端 API: http://localhost:3000
- Swagger 文档：http://localhost:3000/api/docs

---

**创建时间**: 2026-04-01
**仓库位置**: D:\workshop_management
