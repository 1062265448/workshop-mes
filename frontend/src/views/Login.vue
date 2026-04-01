<template>
  <div class="login-page">
    <!-- 左侧装饰区 -->
    <div class="login-decoration">
      <div class="decoration-content">
        <div class="logo">
          <span class="logo-icon">🦞</span>
          <span class="logo-text">Workshop MES</span>
        </div>
        <h1 class="decoration-title">
          智能制造<br />
          <span class="highlight">引领未来</span>
        </h1>
        <p class="decoration-desc">
          集成生产管理、质量控制、安全监控于一体的现代化制造执行系统
        </p>
        <div class="feature-list">
          <div class="feature-item">
            <el-icon size="20" color="#10b981"><Check /></el-icon>
            <span>实时生产监控</span>
          </div>
          <div class="feature-item">
            <el-icon size="20" color="#10b981"><Check /></el-icon>
            <span>智能缺陷检测</span>
          </div>
          <div class="feature-item">
            <el-icon size="20" color="#10b981"><Check /></el-icon>
            <span>全面安全管理</span>
          </div>
          <div class="feature-item">
            <el-icon size="20" color="#10b981"><Check /></el-icon>
            <span>AI 智能助手</span>
          </div>
        </div>
      </div>
      <div class="decoration-pattern"></div>
    </div>

    <!-- 右侧登录表单 -->
    <div class="login-form-container">
      <div class="login-box">
        <div class="login-header">
          <h2 class="login-title">欢迎回来</h2>
          <p class="login-subtitle">请登录您的账户</p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          class="login-form"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              size="large"
              :prefix-icon="User"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <div class="login-options">
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
            <el-button link type="primary">忘记密码？</el-button>
          </div>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="login-btn"
              :loading="loading"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>

        <div class="login-divider">
          <span>其他登录方式</span>
        </div>

        <div class="social-login">
          <el-button circle class="social-btn">
            <el-icon size="20"><img src="https://api.iconify.design/ri:wechat-fill.svg" /></el-icon>
          </el-button>
          <el-button circle class="social-btn">
            <el-icon size="20"><img src="https://api.iconify.design/ri:dingding-fill.svg" /></el-icon>
          </el-button>
          <el-button circle class="social-btn">
            <el-icon size="20"><img src="https://api.iconify.design/ri:github-fill.svg" /></el-icon>
          </el-button>
        </div>

        <div class="login-footer">
          <span>还没有账户？</span>
          <el-button link type="primary">立即注册</el-button>
        </div>
      </div>

      <div class="copyright">
        © 2026 Workshop MES. All rights reserved.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Check } from '@element-plus/icons-vue'

const router = useRouter()
const formRef = ref()
const loading = ref(false)
const rememberMe = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应为 3-20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应为 6-20 个字符', trigger: 'blur' },
  ],
}

const handleLogin = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    // 模拟登录
    setTimeout(() => {
      loading.value = false
      ElMessage.success('登录成功')
      router.push('/')
    }, 1000)
  } catch (error) {
    console.error('验证失败:', error)
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
}

/* 左侧装饰区 */
.login-decoration {
  flex: 1;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px;
  position: relative;
  overflow: hidden;
}

.login-decoration::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.decoration-content {
  position: relative;
  z-index: 1;
  max-width: 480px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 48px;
}

.logo-icon {
  font-size: 40px;
  line-height: 1;
}

.logo-text {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
}

.decoration-title {
  font-size: 48px;
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
  margin: 0 0 24px 0;
}

.highlight {
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.decoration-desc {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin: 0 0 48px 0;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.9);
}

.decoration-pattern {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: linear-gradient(to top, rgba(15, 23, 42, 0.8), transparent);
  pointer-events: none;
}

/* 右侧登录表单 */
.login-form-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px;
  position: relative;
}

.login-box {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 24px;
  padding: 48px;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    0 20px 25px -5px rgba(0, 0, 0, 0.05);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.login-subtitle {
  font-size: 15px;
  color: #64748b;
  margin: 0;
}

.login-form {
  margin-bottom: 24px;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 12px;
  padding: 4px 16px;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
  transition: all 0.3s ease;
}

.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #3b82f6 inset;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #3b82f6 inset;
}

.login-form :deep(.el-input__inner) {
  height: 48px;
  font-size: 15px;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  transition: all 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.4);
}

.login-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 24px 0;
  color: #94a3b8;
  font-size: 14px;
}

.login-divider::before,
.login-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}

.social-login {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}

.social-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
  background: #fff;
  transition: all 0.3s ease;
}

.social-btn:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.login-footer {
  text-align: center;
  font-size: 14px;
  color: #64748b;
}

.copyright {
  position: absolute;
  bottom: 24px;
  font-size: 13px;
  color: #94a3b8;
}

/* 响应式 */
@media (max-width: 1024px) {
  .login-decoration {
    display: none;
  }
  
  .login-form-container {
    padding: 40px 24px;
  }
}
</style>
