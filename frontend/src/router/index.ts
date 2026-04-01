import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'

const routes = [
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页' },
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/Placeholder.vue'),
        meta: { title: '用户管理' },
      },
      {
        path: 'meetings',
        name: 'Meetings',
        component: () => import('@/views/Placeholder.vue'),
        meta: { title: '会议管理' },
      },
      {
        path: 'safety',
        name: 'Safety',
        component: () => import('@/views/Placeholder.vue'),
        meta: { title: '安全管理' },
      },
      {
        path: 'production',
        name: 'Production',
        component: () => import('@/views/Placeholder.vue'),
        meta: { title: '生产管理' },
      },
      {
        path: 'projects',
        name: 'Projects',
        component: () => import('@/views/Placeholder.vue'),
        meta: { title: '项目管理' },
      },
      {
        path: 'defects',
        name: 'Defects',
        component: () => import('@/views/Placeholder.vue'),
        meta: { title: '缺陷检测' },
      },
      {
        path: 'distribution',
        name: 'Distribution',
        component: () => import('@/views/distribution/DistributionOrder.vue'),
        meta: { title: '平面库配货' },
      },
      {
        path: 'ai',
        name: 'AI',
        component: () => import('@/views/Placeholder.vue'),
        meta: { title: 'AI 助手' },
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', public: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
