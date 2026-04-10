import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

// API 基础 URL (后端没有 /api 前缀)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

// 请求缓存
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 分钟缓存

// 创建 axios 实例
const request: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 添加缓存支持
request.interceptors.request.use(
  (config) => {
    // GET 请求且启用缓存
    if (config.method === 'get' && config.useCache !== false) {
      const cacheKey = `${config.url}:${JSON.stringify(config.params)}`
      const cached = cache.get(cacheKey)
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        // 返回缓存数据（使用自定义标记）
        return Promise.resolve({
          ...config,
          fromCache: true,
          cachedData: cached.data,
        })
      }
    }
    
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器 - 缓存响应数据
request.interceptors.response.use(
  (response) => {
    const config = response.config as any
    
    // 如果是缓存请求，直接返回缓存数据
    if (config.fromCache) {
      return config.cachedData
    }
    
    // GET 请求且成功，缓存数据
    if (config.method === 'get' && config.useCache !== false && response.status === 200) {
      const cacheKey = `${config.url}:${JSON.stringify(config.params)}`
      cache.set(cacheKey, {
        data: response,
        timestamp: Date.now(),
      })
      
      // 清理过期缓存（每 10 次请求清理一次）
      if (Math.random() < 0.1) {
        const now = Date.now()
        cache.forEach((value, key) => {
          if (now - value.timestamp > CACHE_DURATION) {
            cache.delete(key)
          }
        })
      }
    }
    
    return response.data
  },
  (error) => {
    console.error('响应错误:', error)
    
    // 处理常见错误
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          ElMessage.error(data?.message || '请求参数错误')
          break
        case 401:
          ElMessage.error('未授权，请重新登录')
          break
        case 403:
          ElMessage.error('拒绝访问')
          break
        case 404:
          ElMessage.error('请求资源不存在')
          break
        case 500:
          ElMessage.error(data?.message || '服务器内部错误')
          break
        default:
          ElMessage.error(data?.message || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      ElMessage.error(error.message || '请求失败')
    }
    
    return Promise.reject(error)
  }
)

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 可以在这里添加 token 等认证信息
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    // 直接返回响应数据
    return response.data
  },
  (error) => {
    console.error('响应错误:', error)
    
    // 处理常见错误
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          ElMessage.error(data?.message || '请求参数错误')
          break
        case 401:
          ElMessage.error('未授权，请重新登录')
          // 可以在这里跳转登录页
          break
        case 403:
          ElMessage.error('拒绝访问')
          break
        case 404:
          ElMessage.error('请求资源不存在')
          break
        case 500:
          ElMessage.error(data?.message || '服务器内部错误')
          break
        default:
          ElMessage.error(data?.message || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      ElMessage.error(error.message || '请求失败')
    }
    
    return Promise.reject(error)
  }
)

export default request
