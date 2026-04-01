<template>
  <div class="placeholder-page">
    <el-empty description="页面开发中">
      <template #image>
        <div class="placeholder-icon">
          <el-icon size="64" color="#3b82f6"><Tools /></el-icon>
        </div>
      </template>
      <template #description>
        <div class="placeholder-content">
          <h2 class="placeholder-title">{{ $route.meta.title }}</h2>
          <p class="placeholder-desc">该功能模块正在开发中，敬请期待...</p>
        </div>
      </template>
      <el-button type="primary" @click="$router.push('/')">
        <el-icon><ArrowLeft /></el-icon>
        返回首页
      </el-button>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { Tools, ArrowLeft } from '@element-plus/icons-vue'
</script>

<style scoped>
.placeholder-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 24px;
}

.placeholder-icon {
  width: 120px;
  height: 120px;
  border-radius: 24px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.placeholder-content {
  text-align: center;
  margin-bottom: 24px;
}

.placeholder-title {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.placeholder-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}
</style>
