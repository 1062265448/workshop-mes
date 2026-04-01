<template>
  <div class="app-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">🦞</span>
          <span class="logo-text" v-show="!isCollapsed">Workshop</span>
        </div>
        <button class="collapse-btn" @click="toggleSidebar">
          <el-icon>
            <Fold v-if="!isCollapsed" />
            <Expand v-else />
          </el-icon>
        </button>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: $route.path === item.path }"
        >
          <el-icon :size="20">
            <component :is="item.icon" />
          </el-icon>
          <span class="nav-text" v-show="!isCollapsed">{{ item.title }}</span>
          <el-badge
            v-if="item.badge && !isCollapsed"
            :value="item.badge"
            class="nav-badge"
          />
        </router-link>
      </nav>

      <div class="sidebar-footer" v-show="!isCollapsed">
        <div class="user-info">
          <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
          <div class="user-meta">
            <div class="user-name">管理员</div>
            <div class="user-role">系统管理员</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 顶部栏 -->
      <header class="top-header">
        <div class="breadcrumb">
          <el-breadcrumb>
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.meta.title">
              {{ $route.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-actions">
          <el-button text>
            <el-icon><Bell /></el-icon>
          </el-button>
          <el-button text>
            <el-icon><Setting /></el-icon>
          </el-button>
          <el-dropdown>
            <el-button text>
              <el-icon><User /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人设置</el-dropdown-item>
                <el-dropdown-item>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 页面内容 -->
      <div class="page-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  HomeFilled,
  UserFilled,
  Calendar,
  WarningFilled,
  Shop,
  FolderOpened,
  Search,
  ShoppingCart,
  MagicStick,
  Fold,
  Expand,
  Bell,
  Setting,
  User,
} from '@element-plus/icons-vue'

const isCollapsed = ref(false)

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

const menuItems = [
  { path: '/', title: '首页', icon: HomeFilled },
  { path: '/users', title: '用户管理', icon: UserFilled },
  { path: '/meetings', title: '会议管理', icon: Calendar },
  { path: '/safety', title: '安全管理', icon: WarningFilled },
  { path: '/production', title: '生产管理', icon: Shop },
  { path: '/projects', title: '项目管理', icon: FolderOpened },
  { path: '/defects', title: '缺陷检测', icon: Search },
  { path: '/distribution', title: '平面库配货', icon: ShoppingCart },
  { path: '/ai', title: 'AI 助手', icon: MagicStick, badge: 'New' },
]
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-secondary);
}

/* 侧边栏 */
.sidebar {
  width: var(--sidebar-width);
  background: var(--bg-dark);
  color: var(--text-inverse);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-normal);
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.logo-icon {
  font-size: 28px;
  line-height: 1;
}

.logo-text {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--text-inverse);
}

.collapse-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-inverse);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 导航菜单 */
.sidebar-nav {
  flex: 1;
  padding: var(--space-4);
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-2);
  border-radius: var(--radius-md);
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: all var(--transition-fast);
  position: relative;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-inverse);
}

.nav-item.active {
  background: var(--color-primary);
  color: var(--text-inverse);
  box-shadow: var(--shadow-glow);
}

.nav-text {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  white-space: nowrap;
}

.nav-badge {
  margin-left: auto;
}

/* 侧边栏底部 */
.sidebar-footer {
  padding: var(--space-4);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.user-meta {
  flex: 1;
}

.user-name {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-inverse);
}

.user-role {
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.5);
}

/* 主内容区 */
.main-content {
  flex: 1;
  margin-left: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  transition: margin-left var(--transition-normal);
}

.sidebar.collapsed + .main-content {
  margin-left: var(--sidebar-collapsed);
}

/* 顶部栏 */
.top-header {
  height: var(--header-height);
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
  position: sticky;
  top: 0;
  z-index: 50;
}

.breadcrumb {
  font-size: var(--text-sm);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* 页面内容 */
.page-content {
  flex: 1;
  padding: var(--space-6);
  overflow-y: auto;
}

/* 响应式 */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
  }
}
</style>
