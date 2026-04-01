# Git 版本控制使用指南

> 车间信息管理系统专用
> 生成时间：2026-04-01

---

## 目录

1. [Git 安装与配置](#一git-安装与配置)
2. [仓库初始化](#二仓库初始化)
3. [日常操作流程](#三日常操作流程)
4. [分支管理](#四分支管理)
5. [版本回退与恢复](#五版本回退与恢复)
6. [备份策略](#六备份策略)
7. [常见问题](#七常见问题)

---

## 一、Git 安装与配置

### 1.1 下载安装

**下载地址**：https://git-scm.com/download/win

**安装步骤**：
1. 运行安装程序
2. 选择安装路径（推荐默认）
3. 选择默认编辑器（推荐 VS Code）
4. 完成安装

**验证安装**：
```bash
git --version
```

### 1.2 首次配置

```bash
# 配置用户信息（必须）
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# 配置默认分支名
git config --global init.defaultBranch main

# 配置换行符（Windows）
git config --global core.autocrlf true

# 查看配置
git config --list
```

### 1.3 配置中文支持

```bash
# 解决中文显示问题
git config --global core.quotepath false
git config --global gui.encoding utf-8
git config --global i18n.commitencoding utf-8
git config --global i18n.logoutputencoding utf-8
```

---

## 二、仓库初始化

### 2.1 创建新仓库

```bash
# 创建项目目录
mkdir workshop-mes
cd workshop-mes

# 初始化 Git 仓库
git init

# 查看仓库状态
git status
```

### 2.2 创建 .gitignore

在项目根目录创建 `.gitignore` 文件，内容如下：

```gitignore
# =====================
# 通用忽略规则
# =====================

# 依赖目录
node_modules/
.pnp/
.pnp.js

# 构建输出
dist/
build/
out/
*.local

# 环境变量（重要！不要提交敏感信息）
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# 日志文件
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 系统文件
.DS_Store
Thumbs.db
desktop.ini

# IDE 配置（可选，根据团队习惯）
.idea/
.vscode/
*.swp
*.swo
*~

# 临时文件
tmp/
temp/
.cache/

# =====================
# 后端特定
# =====================

# Prisma
prisma/migrations/

# 编译输出
*.js.map
*.d.ts

# =====================
# 前端特定
# =====================

# Vite
*.local

# =====================
# 数据库
# =====================

# SQLite
*.sqlite
*.sqlite3
*.db

# =====================
# 备份
# =====================

backups/
*.bak
```

### 2.3 第一次提交

```bash
# 添加所有文件
git add .

# 或者选择性添加
git add .gitignore
git add README.md

# 提交
git commit -m "chore: 项目初始化"

# 查看提交历史
git log --oneline
```

---

## 三、日常操作流程

### 3.1 每天开始工作

```bash
# 1. 切换到开发分支
git checkout develop

# 2. 拉取最新代码
git pull origin develop

# 3. 查看当前状态
git status
```

### 3.2 开发过程中

```bash
# 1. 创建功能分支
git checkout -b feature/功能名称

# 2. 开发过程中频繁提交
git add .
git commit -m "feat: 实现 XXX 功能"

# 3. 查看变更
git diff
git diff --stat
```

### 3.3 完成功能后

```bash
# 1. 切换回开发分支
git checkout develop

# 2. 合并功能分支
git merge feature/功能名称

# 3. 推送到远程
git push origin develop

# 4. 删除功能分支
git branch -d feature/功能名称
```

### 3.4 提交信息规范

```
格式：<type>(<scope>): <subject>

type 类型：
  feat     - 新功能
  fix      - Bug 修复
  docs     - 文档更新
  style    - 代码格式（不影响功能）
  refactor - 代码重构
  test     - 测试相关
  chore    - 构建/工具/配置

示例：
  feat(auth): 实现用户登录功能
  fix(api): 修复生产计划查询接口 bug
  docs(readme): 更新安装说明
  refactor(user): 重构用户服务代码
  chore(deps): 更新依赖版本
```

---

## 四、分支管理

### 4.1 分支策略

```
main (生产分支 - 稳定版本)
  │
  ├── develop (开发分支 - 日常开发)
  │     │
  │     ├── feature/user-auth (用户认证功能)
  │     ├── feature/production (生产管理功能)
  │     └── feature/equipment (设备管理功能)
  │
  └── hotfix/bug-fix (紧急修复)
```

### 4.2 分支操作

```bash
# 创建新分支
git branch feature/new-feature

# 切换分支
git checkout feature/new-feature

# 创建并切换（简写）
git checkout -b feature/new-feature

# 查看所有分支
git branch

# 查看远程分支
git branch -r

# 查看所有分支（包括远程）
git branch -a

# 删除本地分支
git branch -d feature/new-feature

# 强制删除（未合并）
git branch -D feature/new-feature

# 推送分支到远程
git push -u origin feature/new-feature

# 删除远程分支
git push origin --delete feature/new-feature
```

### 4.3 合并分支

```bash
# 普通合并
git checkout develop
git merge feature/new-feature

# 压缩合并（多个 commit 合并为一个）
git merge --squash feature/new-feature
git commit -m "feat: 完成 XXX 功能"

# 变基合并（保持线性历史）
git rebase develop
```

---

## 五、版本回退与恢复

### 5.1 查看历史

```bash
# 查看提交历史（简洁）
git log --oneline

# 查看详细信息
git log

# 查看最近 10 条
git log -10

# 查看文件变更历史
git log --follow 文件名

# 查看操作记录（包括已删除的）
git reflog
```

### 5.2 回退方法

#### 方法 1：revert（推荐，安全）

```bash
# 撤销指定提交（生成新提交）
git revert <commit-id>

# 撤销多个提交
git revert <commit-id-1>..<commit-id-2>

# 撤销后推送到远程
git push origin develop
```

**优点**：不会丢失历史，可安全用于已推送的提交

#### 方法 2：reset（危险，慎用）

```bash
# 软重置（保留变更，可重新提交）
git reset --soft <commit-id>

# 混合重置（保留变更，不提交）
git reset --mixed <commit-id>

# 硬重置（删除所有变更！）
git reset --hard <commit-id>

# 推送到远程（强制）
git push -f origin develop
```

**警告**：`--hard` 会永久删除变更，仅用于本地未推送的提交

### 5.3 恢复误操作

```bash
# 1. 查看操作历史
git reflog

# 2. 找到误操作前的 commit-id

# 3. 恢复
git reset --hard <commit-id>

# 或者创建新分支恢复
git checkout -b recovered-branch <commit-id>
```

### 5.4 恢复已删除的文件

```bash
# 恢复工作区删除的文件
git checkout -- 文件名

# 恢复暂存区删除的文件
git reset HEAD 文件名
git checkout -- 文件名

# 恢复已提交后删除的文件
git checkout <commit-id> -- 文件名
```

### 5.5 版本标签

```bash
# 创建标签
git tag -a v1.0.0 -m "第一版正式发布"

# 查看标签
git tag -l

# 推送标签
git push origin v1.0.0

# 推送所有标签
git push origin --tags

# 切换到指定版本
git checkout v1.0.0

# 删除标签
git tag -d v1.0.0
git push origin --delete v1.0.0
```

---

## 六、备份策略

### 6.1 本地备份

```bash
# 添加本地备份远程
git remote add backup D:/backups/workshop-mes.git

# 推送到备份
git push backup develop

# 查看所有远程
git remote -v
```

### 6.2 远程备份（GitHub/Gitee）

```bash
# 添加 GitHub 远程
git remote add github https://github.com/username/workshop-mes.git

# 添加 Gitee 远程
git remote add gitee https://gitee.com/username/workshop-mes.git

# 推送到多个远程
git push origin develop
git push github develop
git push gitee develop
```

### 6.3 自动备份脚本

创建 `backup.bat`：

```batch
@echo off
cd /d D:\workshop-mes
git add .
git commit -m "auto: 每日备份 %date% %time%"
git push origin develop
git push backup develop
echo 备份完成！
pause
```

### 6.4 数据库备份

```bash
# MySQL 备份
mysqldump -u root -p workshop_mes > backups/backup_20260401.sql

# Redis 备份
redis-cli BGSAVE
```

---

## 七、常见问题

### Q1: 提交错了文件怎么办？

```bash
# 如果还没提交
git reset HEAD 文件名
git checkout -- 文件名

# 如果已经提交但未推送
git reset --soft HEAD~1
git reset HEAD 文件名
git commit -m "正确的提交信息"

# 如果已经推送
git revert <commit-id>
```

### Q2: 合并冲突怎么解决？

```bash
# 1. 查看冲突文件
git status

# 2. 打开冲突文件，找到冲突标记
<<<<<<< HEAD
你的代码
=======
对方的代码
>>>>>>> branch-name

# 3. 手动解决冲突，保留需要的代码

# 4. 标记为解决
git add 文件名

# 5. 完成合并
git commit -m "fix: 解决合并冲突"
```

### Q3: 误删了分支怎么办？

```bash
# 1. 查看操作历史
git reflog

# 2. 找到删除前的 commit-id

# 3. 恢复分支
git checkout -b 分支名 <commit-id>
```

### Q4: 如何忽略已提交的文件？

```bash
# 1. 从 Git 跟踪中移除（保留本地文件）
git rm --cached 文件名

# 2. 添加到 .gitignore

# 3. 提交
git commit -m "chore: 忽略 XXX 文件"
```

### Q5: 如何查看某行的修改历史？

```bash
# 查看某行的提交历史
git blame -L 行号，行号 文件名

# 图形化查看
gitk 文件名
```

---

## 八、快速参考卡

### 常用命令速查

| 操作 | 命令 |
|------|------|
| 初始化 | `git init` |
| 克隆 | `git clone <url>` |
| 添加 | `git add .` |
| 提交 | `git commit -m "message"` |
| 推送 | `git push origin branch` |
| 拉取 | `git pull origin branch` |
| 分支 | `git branch` |
| 切换 | `git checkout branch` |
| 合并 | `git merge branch` |
| 历史 | `git log --oneline` |
| 状态 | `git status` |
| 差异 | `git diff` |
| 回退 | `git revert <id>` |
| 重置 | `git reset --hard <id>` |
| 标签 | `git tag -a v1.0.0 -m "msg"` |

### 提交类型速查

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(auth): 添加登录` |
| `fix` | Bug 修复 | `fix(api): 修复查询` |
| `docs` | 文档 | `docs(readme): 更新` |
| `style` | 格式 | `style: 格式化代码` |
| `refactor` | 重构 | `refactor(user): 重构` |
| `test` | 测试 | `test: 添加单元测试` |
| `chore` | 杂项 | `chore(deps): 更新依赖` |

---

## 九、最佳实践

### ✅ 应该做的

1. **频繁提交** - 每完成一个小功能就提交
2. **清晰的提交信息** - 说明做了什么，为什么
3. **使用分支** - 不要在 main/develop 上直接开发
4. **及时推送** - 每天结束前推送到远程
5. **定期备份** - 重要节点打标签

### ❌ 不应该做的

1. **不要提交敏感信息** - 密码、API Key 等
2. **不要提交大文件** - 使用 Git LFS 或外部存储
3. **不要强制推送公共分支** - 会影响其他人
4. **不要忽略合并冲突** - 仔细解决后再提交
5. **不要在提交中包含无关变更** - 保持提交原子性

---

*文档生成时间：2026-04-01 15:00*
*适用于：车间信息管理系统项目*
