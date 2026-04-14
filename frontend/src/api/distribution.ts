import api from './index'

// ==================== 统计 ====================

export const getStatistics = () => {
  return api.get('/distribution/statistics')
}

// ==================== 库存管理 ====================

export const getInventory = (params?: {
  page?: number
  limit?: number
  keyword?: string
  grade?: string
  status?: string
}) => {
  return api.get('/distribution/inventory', { params })
}

export const getInventoryById = (id: number) => {
  return api.get(`/distribution/inventory/${id}`)
}

export const createInventory = (data: any) => {
  return api.post('/distribution/inventory', data)
}

export const batchCreateInventory = (data: any[]) => {
  return api.post('/distribution/inventory/batch', data)
}

export const updateInventory = (id: number, data: any) => {
  return api.patch(`/distribution/inventory/${id}`, data)
}

export const deleteInventory = (id: number) => {
  return api.delete(`/distribution/inventory/${id}`)
}

export const recognizeInventory = (file: File) => {
  const formData = new FormData()
  formData.append('image', file)
  return api.post('/distribution/inventory/ai-recognize', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// ==================== 客户管理 ====================

export const getCustomers = () => {
  return api.get('/distribution/customers')
}

export const getCustomerById = (id: number) => {
  return api.get(`/distribution/customers/${id}`)
}

export const createCustomer = (data: any) => {
  return api.post('/distribution/customers', data)
}

export const updateCustomer = (id: number, data: any) => {
  return api.put(`/distribution/customers/${id}`, data)
}

export const deleteCustomer = (id: number) => {
  return api.delete(`/distribution/customers/${id}`)
}

// ==================== 配货单管理 ====================

export const getOrders = (params?: {
  page?: number
  limit?: number
  status?: string
  customerId?: number
}) => {
  return api.get('/distribution/orders', { params })
}

export const getOrderById = (id: number) => {
  return api.get(`/distribution/orders/${id}`)
}

export const createOrder = (data: any) => {
  return api.post('/distribution/orders', data)
}

export const updateOrder = (id: number, data: any) => {
  return api.put(`/distribution/orders/${id}`, data)
}

export const deleteOrder = (id: number) => {
  return api.delete(`/distribution/orders/${id}`)
}

export const batchDeleteOrders = (ids: number[]) => {
  return api.post('/distribution/orders/batch-delete', { ids })
}

export const confirmOrder = (id: number) => {
  return api.post(`/distribution/orders/${id}/confirm`)
}

export const shipOrder = (id: number, data?: { driverName?: string; vehicleNo?: string }) => {
  return api.post(`/distribution/orders/${id}/ship`, data)
}

export const deliverOrder = (id: number) => {
  return api.post(`/distribution/orders/${id}/deliver`)
}

export const cancelOrder = (id: number) => {
  return api.post(`/distribution/orders/${id}/cancel`)
}

// ==================== AI 识别历史 ====================

export const getRecognitionHistory = (params?: {
  page?: number
  limit?: number
  status?: string
}) => {
  return api.get('/distribution/recognition-history', { params })
}

export const deleteRecognitionHistory = (id: number) => {
  return api.delete(`/distribution/recognition-history/${id}`)
}

export const batchDeleteRecognitionHistory = (ids: number[]) => {
  return api.post('/distribution/recognition-history/batch-delete', { ids })
}
