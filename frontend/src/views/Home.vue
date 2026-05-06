<template>
  <div class="home-page">
    <!-- 欢迎区域 -->
    <section class="welcome-section">
      <div class="welcome-content">
        <h1 class="welcome-title">
          <span class="gradient-text">Workshop MES</span>
          <span class="subtitle">制造执行系统</span>
        </h1>
        <p class="welcome-desc">
          智能化车间管理平台，集成生产管理、质量控制、安全监控于一体
        </p>
        <div class="welcome-actions">
          <el-button type="primary" size="large" @click="$router.push('/production')">
            <el-icon><ArrowRight /></el-icon>
            开始生产管理
          </el-button>
          <el-button size="large" plain @click="$router.push('/ai')">
            <el-icon><MagicStick /></el-icon>
            AI 智能助手
          </el-button>
        </div>
      </div>
      <div class="welcome-stats">
        <div class="stat-card" v-for="stat in stats" :key="stat.label">
          <div class="stat-icon" :style="{ background: stat.bgColor }">
            <el-icon :size="24" :color="stat.iconColor">
              <component :is="stat.icon" />
            </el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
          <div class="stat-trend" :class="stat.trend > 0 ? 'up' : 'down'">
            <el-icon><ArrowUp v-if="stat.trend > 0" /><ArrowDown v-else /></el-icon>
            {{ Math.abs(stat.trend) }}%
          </div>
        </div>
      </div>
    </section>

    <!-- 功能模块 -->
    <section class="modules-section">
      <div class="section-header">
        <h2 class="section-title">
          <el-icon><Grid /></el-icon>
          功能模块
        </h2>
        <el-button text type="primary">
          查看全部
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="modules-grid">
        <div
          v-for="module in modules"
          :key="module.name"
          class="module-card"
          @click="$router.push(module.path)"
        >
          <div class="module-icon" :style="{ background: module.gradient }">
            <el-icon :size="28" color="#fff">
              <component :is="module.icon" />
            </el-icon>
          </div>
          <div class="module-content">
            <h3 class="module-name">{{ module.name }}</h3>
            <p class="module-desc">{{ module.desc }}</p>
            <div class="module-meta">
              <el-tag size="small" :type="module.status.type">
                {{ module.status.text }}
              </el-tag>
              <span class="module-count">{{ module.count }} 条记录</span>
            </div>
          </div>
          <el-icon class="module-arrow" :size="20"><ArrowRight /></el-icon>
        </div>
      </div>
    </section>

    <!-- 系统状态 -->
    <section class="status-section">
      <div class="section-header">
        <h2 class="section-title">
          <el-icon><Monitor /></el-icon>
          系统状态
        </h2>
      </div>
      <div class="status-grid">
        <div class="status-card" v-for="service in services" :key="service.name">
          <div class="status-header">
            <div class="status-dot" :class="service.status"></div>
            <span class="status-name">{{ service.name }}</span>
          </div>
          <div class="status-detail">
            <div class="status-value">{{ service.value }}</div>
            <div class="status-label">{{ service.label }}</div>
          </div>
          <el-progress
            :percentage="service.progress"
            :color="service.color"
            :show-text="false"
            :stroke-width="4"
          />
        </div>
      </div>
    </section>

    <!-- 快捷操作 -->
    <section class="quick-section">
      <div class="section-header">
        <h2 class="section-title">
          <el-icon><Lightning /></el-icon>
          快捷操作
        </h2>
      </div>
      <div class="quick-grid">
        <el-button
          v-for="action in quickActions"
          :key="action.name"
          class="quick-btn"
          @click="$router.push(action.path)"
        >
          <div class="quick-icon" :style="{ background: action.bgColor }">
            <el-icon :size="20" :color="action.iconColor">
              <component :is="action.icon" />
            </el-icon>
          </div>
          <span class="quick-name">{{ action.name }}</span>
        </el-button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowRight,
  MagicStick,
  ArrowUp,
  ArrowDown,
  Grid,
  Monitor,
  Lightning,
  UserFilled,
  Calendar,
  WarningFilled,
  Shop,
  FolderOpened,
  Search,
  Plus,
  Document,
  Bell,
  Setting,
} from '@element-plus/icons-vue'

const stats = [
  { label: '今日生产', value: '1,234', trend: 12.5, icon: Shop, bgColor: '#dbeafe', iconColor: '#3b82f6' },
  { label: '活跃用户', value: '56', trend: 8.2, icon: UserFilled, bgColor: '#d1fae5', iconColor: '#10b981' },
  { label: '待办事项', value: '23', trend: -5.1, icon: Calendar, bgColor: '#fef3c7', iconColor: '#f59e0b' },
  { label: '安全指数', value: '98.5%', trend: 2.3, icon: WarningFilled, bgColor: '#fee2e2', iconColor: '#ef4444' },
]

const modules = [
  { name: '用户管理', desc: '系统用户权限管理', icon: UserFilled, path: '/users', gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)', status: { type: 'success', text: '正常' }, count: 156 },
  { name: '会议管理', desc: '会议安排与记录', icon: Calendar, path: '/meetings', gradient: 'linear-gradient(135deg, #10b981, #34d399)', status: { type: 'success', text: '正常' }, count: 42 },
  { name: '安全管理', desc: '安全培训与检查', icon: WarningFilled, path: '/safety', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)', status: { type: 'warning', text: '注意' }, count: 8 },
  { name: '生产管理', desc: '生产计划与执行', icon: Shop, path: '/production', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', status: { type: 'success', text: '正常' }, count: 1234 },
  { name: '项目管理', desc: '项目进度跟踪', icon: FolderOpened, path: '/projects', gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)', status: { type: 'success', text: '正常' }, count: 23 },
  { name: '缺陷检测', desc: '质量问题追踪', icon: Search, path: '/defects', gradient: 'linear-gradient(135deg, #ec4899, #f472b6)', status: { type: 'danger', text: '紧急' }, count: 5 },
  { name: 'AI 助手', desc: '智能分析与辅助', icon: MagicStick, path: '/ai', gradient: 'linear-gradient(135deg, #f97316, #fb923c)', status: { type: 'info', text: 'Beta' }, count: 0 },
]

const services = [
  { name: '后端服务', status: 'running', value: '3001', label: '端口', progress: 95, color: '#10b981' },
  { name: '前端服务', status: 'running', value: '5173', label: '端口', progress: 98, color: '#3b82f6' },
  { name: 'MySQL 数据库', status: 'running', value: '8.0', label: '版本', progress: 92, color: '#06b6d4' },
  { name: 'Redis 缓存', status: 'running', value: '7.0', label: '版本', progress: 88, color: '#f59e0b' },
]

const quickActions = [
  { name: '新建生产计划', icon: Plus, path: '/production', bgColor: '#dbeafe', iconColor: '#3b82f6' },
  { name: '创建会议', icon: Calendar, path: '/meetings', bgColor: '#d1fae5', iconColor: '#10b981' },
  { name: '提交缺陷', icon: Document, path: '/defects', bgColor: '#fee2e2', iconColor: '#ef4444' },
  { name: '查看通知', icon: Bell, path: '/', bgColor: '#fef3c7', iconColor: '#f59e0b' },
  { name: '系统设置', icon: Setting, path: '/', bgColor: '#f3f4f6', iconColor: '#6b7280' },
]
</script>

<style scoped>
.home-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 欢迎区域 */
.welcome-section {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  border-radius: 24px;
  padding: 48px;
  margin-bottom: 32px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.welcome-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

.welcome-title {
  margin: 0 0 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gradient-text {
  font-size: 48px;
  font-weight: 800;
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 24px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.welcome-desc {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  margin: 0 0 24px 0;
  max-width: 480px;
}

.welcome-actions {
  display: flex;
  gap: 16px;
}

/* 统计卡片 */
.welcome-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 20px;
}

.stat-trend.up {
  color: #34d399;
  background: rgba(52, 211, 153, 0.1);
}

.stat-trend.down {
  color: #f87171;
  background: rgba(248, 113, 113, 0.1);
}

/* 区块标题 */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title .el-icon {
  color: #3b82f6;
}

/* 功能模块 */
.modules-section {
  margin-bottom: 32px;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.module-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e2e8f0;
  position: relative;
  overflow: hidden;
}

.module-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.module-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.module-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.module-desc {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.module-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.module-count {
  font-size: 12px;
  color: #94a3b8;
}

.module-arrow {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: #cbd5e1;
  opacity: 0;
  transition: all 0.3s ease;
}

.module-card:hover .module-arrow {
  opacity: 1;
  color: #3b82f6;
  transform: translateY(-50%) translateX(4px);
}

/* 系统状态 */
.status-section {
  margin-bottom: 32px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.status-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.running {
  background: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.status-dot.stopped {
  background: #ef4444;
}

.status-name {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
}

.status-detail {
  margin-bottom: 12px;
}

.status-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

.status-label {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

/* 快捷操作 */
.quick-section {
  margin-bottom: 32px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.quick-btn {
  height: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #fff;
  transition: all 0.3s ease;
}

.quick-btn:hover {
  border-color: #3b82f6;
  box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.2);
  transform: translateY(-2px);
}

.quick-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

/* 响应式 */
@media (max-width: 1200px) {
  .modules-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .status-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .welcome-section {
    grid-template-columns: 1fr;
    padding: 32px;
  }
  
  .welcome-stats {
    grid-template-columns: 1fr;
  }
  
  .modules-grid {
    grid-template-columns: 1fr;
  }
  
  .status-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
