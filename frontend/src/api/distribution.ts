import api from './index'

// 导出 api 实例供历史记录页面使用
export { api }

// ==================== 库存管理 ====================

/**
 * 获取库存列表
 */
export const getInventory = (params?: { page?: number; limit?: number; keyword?: string }) => {
  return api.get('/distribution/inventory', { params })
}

/**
 * 创建库存
 */
export const createInventory = (data: any) => {
  return api.post('/distribution/inventory', data)
}

/**
 * 批量创建库存
 */
export const batchCreateInventory = (data: any[]) => {
  return api.post('/distribution/inventory/batch', data)
}

/**
 * 删除库存
 */
export const deleteInventory = (id: number) => {
  return api.delete(`/distribution/inventory/${id}`)
}

/**
 * 更新库存
 */
export const updateInventory = (id: number, data: any) => {
  return api.patch(`/distribution/inventory/${id}`, data)
}

/**
 * AI 识别库存图片
 */
export const recognizeInventory = (file: File) => {
  const formData = new FormData()
  formData.append('image', file)
  return api.post('/distribution/inventory/ai-recognize', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

// ==================== 客户管理 ====================

/**
 * 获取客户列表
 */
export const getCustomers = () => {
  return api.get('/distribution/customers')
}

/**
 * 创建客户
 */
export const createCustomer = (data: any) => {
  return api.post('/distribution/customers', data)
}

// ==================== 配货单管理 ====================

/**
 * 获取配货单列表
 */
export const getOrders = (params?: { page?: number; limit?: number }) => {
  return api.get('/distribution/orders', { params })
}

/**
 * 获取配货单详情
 */
export const getOrderDetail = (id: number) => {
  return api.get(`/distribution/order/${id}`)
}

/**
 * 创建配货单
 */
export const createOrder = (data: any) => {
  return api.post('/distribution/order', data)
}

/**
 * 删除配货单
 */
export const deleteOrder = (id: number) => {
  return api.delete(`/distribution/order/${id}`)
}

/**
 * 确认配货单
 */
export const confirmOrder = (id: number) => {
  return api.post(`/distribution/order/${id}/confirm`)
}

/**
 * 发货配货单
 */
export const shipOrder = (id: number, data: { driverName?: string; vehicleNo?: string }) => {
  return api.post(`/distribution/order/${id}/ship`, data)
}

/**
 * 更新配货单
 */
export const updateOrder = (id: number, data: any) => {
  return api.patch(`/distribution/order/${id}`, data)
}
