# 🚀 快速启动指南

## ✅ 已完成

### 项目结构
```
D:\workshop_management/
├── .gitignore              ✅
├── README.md               ✅
├── backend/
│   ├── package.json        ✅
│   ├── tsconfig.json       ✅
│   ├── nest-cli.json       ✅
│   ├── .env.example        ✅
│   ├── prisma/
│   │   └── schema.prisma   ✅ (18 个表)
│   └── src/
│       ├── main.ts         ✅
│       └── app.module.ts   ✅
├── frontend/
│   ├── package.json        ✅
│   ├── index.html          ✅
│   ├── vite.config.ts      ✅
│   ├── tsconfig.json       ✅
│   ├── .env.example        ✅
│   └── src/
│       ├── main.ts         ✅
│       ├── App.vue         ✅
│       ├── router/index.ts ✅
│       └── views/
│           ├── Home.vue    ✅
│           └── Login.vue   ✅
├── docker/
│   └── docker-compose.yml  ✅
└── docs/
    ├── API_MODULES.md      ✅
    └── QUICKSTART.md       ✅ (本文件)
```

### Git 仓库
- ✅ 已初始化
- ✅ 第一次提交完成

### Docker 容器
- ✅ MySQL 8.0 运行中 (端口 3306)
- ✅ Redis 7 运行中 (端口 6379)

---

## 📋 下一步行动

### 1️⃣ 配置环境变量

**后端配置：**
```bash
cd D:\workshop_management\backend
copy .env.example .env
```

编辑 `.env` 文件，确认数据库密码：
```env
DATABASE_PASSWORD=你的 MySQL root 密码
```

**前端配置：**
```bash
cd D:\workshop_management\frontend
copy .env.example .env
```

### 2️⃣ 安装依赖

**后端：**
```bash
cd D:\workshop_management\backend
npm install
```

**前端：**
```bash
cd D:\workshop_management\frontend
npm install
```

### 3️⃣ 数据库初始化

```bash
cd D:\workshop_management\backend

# 生成 Prisma 客户端
npm run prisma:generate

# 创建数据库（如果不存在）
# 手动执行 SQL: CREATE DATABASE IF NOT EXISTS workshop_mes;

# 运行迁移
npm run prisma:migrate
```

### 4️⃣ 启动开发服务器

**后端（终端 1）：**
```bash
cd D:\workshop_management\backend
npm run start:dev
```
访问：http://localhost:3000
Swagger: http://localhost:3000/api/docs

**前端（终端 2）：**
```bash
cd D:\workshop_management\frontend
npm run dev
```
访问：http://localhost:5173

---

## 🎯 后续开发任务

### 第一阶段：核心模块
- [ ] Auth 模块（登录/注册/JWT）
- [ ] User 模块（CRUD）
- [ ] 前端路由和布局框架

### 第二阶段：业务模块
- [ ] Meeting 会议管理
- [ ] Safety 安全管理
- [ ] Production 生产管理

### 第三阶段：扩展模块
- [ ] Project 项目管理
- [ ] Defect 缺陷检测
- [ ] Distribution 配货管理
- [ ] LLM AI 模块（可选）

---

## 📝 重要提示

### MySQL 密码
如果不知道现有 MySQL 容器的 root 密码，可以：
1. 查看 Docker 容器环境变量
2. 或者重置密码：
```bash
docker exec workshop-mysql mysql -uroot -e "ALTER USER 'root'@'%' IDENTIFIED BY '新密码';"
```

### 数据库连接
后端通过 `host.docker.internal` 连接宿主机的 MySQL 容器，确保：
- MySQL 允许远程连接（root@'%'）
- 防火墙未阻止 3306 端口

---

## 🦞 需要帮助？

随时告诉我：
- "安装后端依赖"
- "配置数据库连接"
- "创建 Auth 模块"
- "启动开发服务器"

我会一步步帮你完成！
