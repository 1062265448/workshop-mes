<template>
  <div class="home-page">
    <el-container>
      <el-header>
        <h1>🦞 Workshop MES</h1>
        <span>制造执行系统</span>
      </el-header>
      <el-main>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="welcome-card">
              <template #header>
                <div class="card-header">
                  <span>👋 欢迎</span>
                </div>
              </template>
              <p>全新系统已就绪！</p>
              <p>技术栈：Vue 3 + NestJS + MySQL + Redis</p>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="status-card">
              <template #header>
                <div class="card-header">
                  <span>📊 系统状态</span>
                </div>
              </template>
              <el-tag type="success">后端：准备中</el-tag>
              <el-tag type="success">前端：准备中</el-tag>
              <el-tag type="success">MySQL：运行中</el-tag>
              <el-tag type="success">Redis：运行中</el-tag>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="quick-links-card">
              <template #header>
                <div class="card-header">
                  <span>🔗 快速链接</span>
                </div>
              </template>
              <ul>
                <li><a href="http://localhost:3000/api/docs" target="_blank">Swagger API</a></li>
                <li><a href="http://localhost:5173" target="_blank">前端首页</a></li>
              </ul>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="modules-card">
              <template #header>
                <div class="card-header">
                  <span>📦 功能模块</span>
                </div>
              </template>
              <ul>
                <li>用户管理</li>
                <li>会议管理</li>
                <li>安全管理</li>
                <li>生产管理</li>
                <li>项目管理</li>
                <li>缺陷检测</li>
                <li>平面库配货</li>
              </ul>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
// 首页
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.el-header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.el-header h1 {
  margin: 0;
  font-size: 24px;
  color: #3b82f6;
}

.el-main {
  padding: 24px;
}

.welcome-card,
.status-card,
.quick-links-card,
.modules-card {
  height: 100%;
}

.card-header {
  font-weight: bold;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  padding: 8px 0;
  color: #606266;
}

a {
  color: #3b82f6;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.el-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}
</style>
