<template>
  <div class="defect-annotate-page">
    <el-empty description="缺陷标注工具开发中，敬请期待...">
      <el-button type="primary" @click="$router.push('/defects/types')">
        <el-icon><ArrowLeft /></el-icon>
        返回缺陷类型
      </el-button>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'
</script>

<style scoped>
.defect-annotate-page {
  padding: 24px;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
