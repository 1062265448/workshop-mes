# Git 版本控制使用指南

> 车间信息管理系统专用
> 最后更新：2026-04-16

---

## 目录

1. [Git 安装与配置](#一git-安装与配置)
2. [仓库初始化](#二仓库初始化)
3. [日常操作流程](#三日常操作流程)
4. [分支管理](#四分支管理)
5. [版本回退与恢复](#五版本回退与恢复)
6. [GitHub 推送完全指南](#六github-推送完全指南)
7. [备份策略](#七备份策略)
8. [常见问题](#八常见问题)
9. [快速参考卡](#九快速参考卡)
10. [最佳实践](#十最佳实践)

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

在项目根目录创建 `.gitignore` 文件：

```gitignore
# =====================
# 通用忽略规则
# =====================
node_modules/
.pnp/
.pnp.js
dist/
build/
out/
*.local
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
Thumbs.db
desktop.ini
.idea/
.vscode/
*.swp
*.swo
*~
tmp/
temp/
.cache/

# =====================
# 后端特定
# =====================
prisma/migrations/
*.js.map
*.d.ts

# =====================
# 前端特定
# =====================
*.local

# =====================
# 数据库
# =====================
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

## 六、GitHub 推送完全指南

> 本节为从零到一的完整 GitHub 推送指南，涵盖首次配置、日常推送、故障排查和高级用法。

### 6.1 前置准备：注册 GitHub 账号

1. 访问 https://github.com/signup
2. 填写邮箱/密码，完成验证
3. 创建个人仓库（免费账户无限私有仓库）

### 6.2 认证方式选择

GitHub 支持两种认证方式，**推荐使用 SSH**：

| 方式 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **SSH 密钥** | 免密码、安全、一次配置永久使用 | 首次配置稍复杂 | ✅ 推荐 |
| **HTTPS + PAT** | 简单直观 | 每次推送需输入密码或配置 Token | ⚠️ 备选 |

### 6.3 方式一：SSH 密钥配置（推荐）

#### 步骤 1：检查是否已有密钥

```bash
ls ~/.ssh/id_ed25519.pub
# 或
ls ~/.ssh/id_rsa.pub
```

如果文件存在，跳到步骤 3。

#### 步骤 2：生成新的 SSH 密钥

```bash
# 使用 Ed25519（推荐，更快更安全）
ssh-keygen -t ed25519 -C "your@email.com"

# 或使用 RSA（兼容旧系统）
ssh-keygen -t rsa -b 4096 -C "your@email.com"
```

按提示操作：
- **保存路径**：直接回车（使用默认 `~/.ssh/id_ed25519`）
- **密码短语**：可直接回车跳过（推荐设置密码增强安全）

#### 步骤 3：启动 SSH Agent 并添加密钥

```bash
# Windows PowerShell
ssh-agent -v
ssh-add ~/.ssh/id_ed25519

# 验证是否添加成功
ssh-add -l
```

**Windows 开机自动启动 SSH Agent**：
```powershell
# 创建配置文件
New-Item -Path "~\.ssh\config" -ItemType File -Force

# 写入配置
@"
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
"@ | Add-Content -Path "~\.ssh\config"
```

#### 步骤 4：复制公钥到剪贴板

```bash
# PowerShell
Get-Content ~/.ssh/id_ed25519.pub | Set-Clipboard

# 或 CMD
type %USERPROFILE%\.ssh\id_ed25519.pub | clip
```

#### 步骤 5：添加到 GitHub

1. 打开 https://github.com/settings/keys
2. 点击 **New SSH key**
3. **Title**：填写描述（如 `Windows Desktop`）
4. **Key**：粘贴公钥内容（`Ctrl+V`）
5. 点击 **Add SSH key**

#### 步骤 6：测试连接

```bash
ssh -T git@github.com
```

**成功输出**：
```
Hi username! You've successfully authenticated, but GitHub does not provide shell access.
```

### 6.4 方式二：HTTPS + Personal Access Token

#### 步骤 1：创建 Token

1. 打开 https://github.com/settings/tokens
2. 点击 **Generate new token** → **Generate new token (classic)**
3. **Note**：填写描述（如 `Windows Desktop`）
4. **Expiration**：选择有效期（推荐 90 天）
5. **Scopes**：勾选 `repo`（完整仓库权限）
6. 点击 **Generate token**
7. **立即复制 Token**（关闭页面后无法再次查看）

#### 步骤 2：使用 Token

```bash
# 推送时使用 Token 代替密码
git push origin main
# 用户名: 你的 GitHub 用户名
# 密码: 粘贴刚才复制的 Token
```

#### 步骤 3：缓存凭证（免重复输入）

```bash
# 缓存凭证（默认 15 分钟）
git config --global credential.helper cache

# 缓存 1 天（86400 秒）
git config --global credential.helper "cache --timeout=86400"

# Windows 推荐：使用凭据管理器（永久保存）
git config --global credential.helper manager
```

### 6.5 首次推送到 GitHub

#### 场景：本地已有仓库，首次推送到远程

```bash
# 1. 在 GitHub 上创建空仓库（不要勾选 README、.gitignore、License）
#    网址: https://github.com/new

# 2. 添加远程仓库地址（SSH 方式）
git remote add origin git@github.com:username/repo-name.git

#    或 HTTPS 方式
git remote add origin https://github.com/username/repo-name.git

# 3. 验证远程地址
git remote -v

# 4. 推送本地 main 分支到远程
git push -u origin main

# 5. 推送所有标签（如果有）
git push origin --tags
```

**`-u` 参数的作用**：建立本地分支与远程分支的追踪关系，之后可直接 `git push` 和 `git pull`。

#### 场景：克隆远程仓库

```bash
# SSH 方式
git clone git@github.com:username/repo-name.git

# HTTPS 方式
git clone https://github.com/username/repo-name.git

# 克隆到指定目录
git clone git@github.com:username/repo-name.git D:\my-project
```

### 6.6 日常推送工作流

```bash
# 1. 查看当前状态
git status

# 2. 添加变更
git add .          # 添加所有变更
git add 文件名      # 添加指定文件

# 3. 提交
git commit -m "feat: 描述你的改动"

# 4. 推送（已设置追踪关系后）
git push

# 5. 推送指定分支
git push origin feature/新分支

# 6. 同时推送标签
git push && git push --tags
```

### 6.7 推送多远程仓库

```bash
# 添加多个远程
git remote add origin git@github.com:username/repo.git
git remote add gitee git@gitee.com:username/repo.git

# 推送到所有远程
git push origin main
git push gitee main

# 查看所有远程
git remote -v

# 删除远程
git remote remove gitee
```

**一键推送到所有远程**（PowerShell）：
```powershell
git remote | ForEach-Object { git push $_ main }
```

### 6.8 推送故障排查

#### 问题 1：`Permission denied (publickey)`

**原因**：SSH 密钥未正确配置或 GitHub 未添加公钥。

**解决步骤**：
```bash
# 1. 测试连接
ssh -T git@github.com

# 2. 检查 SSH Agent
ssh-add -l
# 如果列表为空，添加密钥
ssh-add ~/.ssh/id_ed25519

# 3. 检查 SSH 配置
cat ~/.ssh/config

# 4. 详细调试
ssh -vT git@github.com
```

#### 问题 2：`fatal: remote origin already exists`

**原因**：远程仓库地址已存在。

```bash
# 查看现有远程
git remote -v

# 修改远程地址
git remote set-url origin git@github.com:username/new-repo.git

# 或先删除再添加
git remote remove origin
git remote add origin git@github.com:username/repo.git
```

#### 问题 3：`failed to push some refs to ...`

**原因**：远程有新的提交，本地落后于远程。

```bash
# 方案 A：拉取合并后再推送（推荐）
git pull --rebase origin main
git push origin main

# 方案 B：强制推送（⚠️ 会覆盖远程提交，慎用！）
git push -f origin main
```

#### 问题 4：`OpenSSL SSL_connect: Connection was reset`

**原因**：网络连接问题，常见于国内访问 GitHub。

**解决方案**：

```bash
# 方案 1：增加 Git 缓冲区
git config --global http.postBuffer 524288000

# 方案 2：降低 SSL 验证级别（不推荐长期使用）
git config --global http.sslVerify false

# 方案 3：配置代理（如果有代理工具）
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 取消代理
git config --global --unset http.proxy
git config --global --unset https.proxy

# 方案 4：改用 SSH（绕过 HTTPS 限制）
git remote set-url origin git@github.com:username/repo.git
```

#### 问题 5：`src refspec main does not match any`

**原因**：本地还没有任何提交，或者分支名不匹配。

```bash
# 确认当前分支
git branch

# 先提交至少一个文件
git add .
git commit -m "initial commit"

# 再推送
git push -u origin main
```

#### 问题 6：`Your branch is ahead of 'origin/main' by N commits`

**正常情况**：本地有未推送的提交，执行 `git push` 即可。

```bash
git push origin main
```

#### 问题 7：推送超时 / `Connection timed out`

```bash
# 1. 检查网络
ping github.com

# 2. 检查 DNS（可尝试修改 hosts）
nslookup github.com

# 3. 添加 GitHub IP 到 hosts（PowerShell 管理员权限）
# 访问 https://github.com.ipaddress.com 获取最新 IP
Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Value "140.82.114.4 github.com" -Force

# 4. 刷新 DNS
ipconfig /flushdns
```

### 6.9 推送大文件

```bash
# 安装 Git LFS
git lfs install

# 跟踪大文件类型
git lfs track "*.psd"
git lfs track "*.zip"
git lfs track "models/*"

# 提交 .gitattributes（记录 LFS 跟踪规则）
git add .gitattributes
git commit -m "chore: 配置 Git LFS"

# 正常推送即可
git push origin main

# 查看 LFS 跟踪的文件
git lfs ls-files

# 查看 LFS 状态
git lfs status
```

### 6.10 发布版本（打标签并推送）

```bash
# 1. 创建轻量标签
git tag v1.0.0

# 2. 或创建附注标签（推荐，包含信息）
git tag -a v1.0.0 -m "v1.0.0 - 平面库配货模块上线"

# 3. 推送单个标签
git push origin v1.0.0

# 4. 推送所有标签
git push origin --tags

# 5. 创建 GitHub Release（可选，通过网页或 API）
# https://github.com/username/repo/releases/new
```

**车间管理系统版本记录示例**：

```bash
git tag -a v1.3.4 -m "v1.3.4 - 13项Bug修复"
git tag -a v1.4.0 -m "v1.4.0 - macOS Sonoma风格UI + ECharts"
git tag -a v1.5.0 -m "v1.5.0 - 主题Store + 趋势图 + 骨架屏"
git tag -a v1.5.2 -m "v1.5.2 - Store数据绑定修复（关键）"
git push origin --tags
```

### 6.11 查看远程仓库信息

```bash
# 查看远程地址
git remote -v

# 查看远程仓库详情
git remote show origin

# 获取远程最新信息（不合并）
git fetch origin

# 查看本地与远程的差异
git log origin/main..HEAD       # 本地有但远程没有的
git log HEAD..origin/main       # 远程有但本地没有的
```

### 6.12 完整的 GitHub 推送 Checklist

每次重要功能完成后，按此清单操作：

- [ ] `git status` — 确认无遗漏文件
- [ ] `git add .` — 添加所有变更
- [ ] `git commit -m "feat/fix/chore: 描述"` — 提交
- [ ] `git log --oneline -3` — 确认提交信息正确
- [ ] `git push origin main` — 推送到远程
- [ ] `git push origin --tags` — 推送标签（如有新版本）
- [ ] 打开 GitHub 网页确认 — 确认代码已同步

---

## 七、备份策略

### 7.1 本地备份

```bash
# 添加本地备份远程
git remote add backup D:/backups/workshop-mes.git

# 推送到备份
git push backup develop

# 查看所有远程
git remote -v
```

### 7.2 远程备份（GitHub/Gitee）

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

### 7.3 自动备份脚本

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

### 7.4 数据库备份

```bash
# MySQL 备份
mysqldump -u root -p workshop_mes > backups/backup_20260401.sql

# Redis 备份
redis-cli BGSAVE
```

---

## 八、常见问题

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

### Q6: GitHub 推送失败怎么办？

```bash
# 1. 检查网络连接
ping github.com

# 2. 检查 SSH 连接
ssh -T git@github.com

# 3. 查看详细错误
GIT_SSH_COMMAND="ssh -v" git push origin main

# 4. 尝试 HTTPS 代替 SSH
git remote set-url origin https://github.com/username/repo.git

# 5. 配置代理（如果有）
git config --global http.proxy http://127.0.0.1:7890
```

### Q7: 如何撤销最后一次提交？

```bash
# 保留变更（可重新提交）
git reset --soft HEAD~1

# 保留变更但不暂存
git reset --mixed HEAD~1

# 完全撤销（⚠️ 删除变更）
git reset --hard HEAD~1
```

### Q8: 如何压缩多个提交？

```bash
# 压缩最近 3 个提交
git rebase -i HEAD~3

# 编辑器中会将 pick 改为 squash（或 s），保存退出
# 然后编辑新的提交信息
```

---

## 九、快速参考卡

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

### GitHub 推送速查

| 操作 | 命令 |
|------|------|
| 添加远程 | `git remote add origin git@github.com:user/repo.git` |
| 首次推送 | `git push -u origin main` |
| 日常推送 | `git push` |
| 推送标签 | `git push origin --tags` |
| 查看远程 | `git remote -v` |
| 修改远程 | `git remote set-url origin <new-url>` |
| 测试 SSH | `ssh -T git@github.com` |
| 生成密钥 | `ssh-keygen -t ed25519 -C "email"` |
| 添加密钥 | `ssh-add ~/.ssh/id_ed25519` |

---

## 十、最佳实践

### ✅ 应该做的

1. **频繁提交** — 每完成一个小功能就提交
2. **清晰的提交信息** — 说明做了什么，为什么
3. **使用分支** — 不要在 main/develop 上直接开发
4. **及时推送** — 每天结束前推送到远程
5. **定期备份** — 重要节点打标签
6. **使用 SSH 认证** — 避免每次输入密码
7. **推送前检查** — `git status` 确认无遗漏
8. **重要版本打标签** — 方便回退和发布

### ❌ 不应该做的

1. **不要提交敏感信息** — 密码、API Key 等
2. **不要提交大文件** — 使用 Git LFS 或外部存储
3. **不要强制推送公共分支** — 会影响其他人
4. **不要忽略合并冲突** — 仔细解决后再提交
5. **不要在提交中包含无关变更** — 保持提交原子性
6. **不要跳过提交信息规范** — 统一格式方便追溯

---

*文档生成时间：2026-04-01 15:00*
*最后更新：2026-04-16 — 新增 GitHub 推送完全指南*
*适用于：车间信息管理系统项目*
