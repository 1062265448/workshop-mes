# API 模块规划

## 核心模块（10 个）

### 1. Auth 认证模块
- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录
- `POST /auth/logout` - 用户登出
- `GET /auth/profile` - 获取当前用户信息

### 2. User 用户管理
- `GET /users` - 用户列表
- `GET /users/:id` - 用户详情
- `POST /users` - 创建用户
- `PUT /users/:id` - 更新用户
- `DELETE /users/:id` - 删除用户（软删除）
- `PATCH /users/:id/restore` - 恢复用户

### 3. Meeting 会议管理
- `GET /meetings` - 会议列表
- `GET /meetings/:id` - 会议详情
- `POST /meetings` - 创建会议
- `PUT /meetings/:id` - 更新会议
- `DELETE /meetings/:id` - 删除会议
- `POST /meetings/:id/participants` - 添加参与者
- `DELETE /meetings/:id/participants/:userId` - 移除参与者
- `PATCH /meetings/:id/status` - 更新会议状态

### 4. Safety 安全管理
- `GET /safety/trainings` - 培训列表
- `POST /safety/trainings` - 创建培训
- `GET /safety/inspections` - 检查列表
- `POST /safety/inspections` - 创建检查
- `GET /safety/incidents` - 事故列表
- `POST /safety/incidents` - 创建事故记录

### 5. Production 生产管理
- `GET /production/plans` - 生产计划列表
- `POST /production/plans` - 创建生产计划
- `GET /production/plans/:id/records` - 生产记录列表
- `POST /production/plans/:id/records` - 创建生产记录
- `GET /production/nickel-inventory` - 镍槽库存列表
- `POST /production/nickel-inventory` - 更新镍槽数据

### 6. Project 项目管理
- `GET /projects` - 项目列表
- `GET /projects/:id` - 项目详情
- `POST /projects` - 创建项目
- `PUT /projects/:id` - 更新项目
- `DELETE /projects/:id` - 删除项目
- `GET /projects/:id/members` - 成员列表
- `POST /projects/:id/members` - 添加成员

### 7. Defect Types 缺陷检测
- `GET /defect-types` - 缺陷类型列表
- `POST /defect-types` - 创建缺陷类型
- `GET /defect-samples` - 缺陷样本列表
- `POST /defect-samples` - 上传缺陷样本
- `PATCH /defect-samples/:id/review` - 审核样本


### 9. Upload 文件上传
- `POST /upload` - 上传文件
- `GET /upload/:filename` - 下载文件

### 10. LLM AI 模块（可选）
- `GET /llm/status` - 服务状态
- `POST /llm/chat` - 通用聊天
- `POST /llm/code/analyze` - 代码分析
- `POST /llm/code/generate` - 代码生成
- `POST /llm/code/review` - 代码审查
- `POST /llm/code/explain` - 代码解释
- `POST /llm/code/debug` - 调试辅助

---

## 数据库表（18 个）

1. users - 用户
2. meetings - 会议
3. meeting_participants - 会议参与者
4. safety_trainings - 安全培训
5. safety_inspections - 安全检查
6. safety_incidents - 安全事故
7. production_plans - 生产计划
8. production_records - 生产记录
9. nickel_inventory - 镍槽库存
10. projects - 项目
11. project_members - 项目成员
12. project_documents - 项目文档
13. defect_types - 缺陷类型
14. defect_samples - 缺陷样本
15. audit_logs - 审计日志

---

## 技术选型

- **ORM**: Prisma (类型安全，自动迁移)
- **验证**: class-validator + class-transformer
- **文档**: Swagger/OpenAPI
- **认证**: JWT + Passport
- **缓存**: Redis
