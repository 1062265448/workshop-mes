import request from '@/utils/request'

// ==================== 基础数据 ====================

/**
 * 获取车间列表
 */
export function getWorkshops() {
  return request({
    url: '/production/workshops',
    method: 'get',
  })
}

/**
 * 获取产品规格列表
 */
export function getProducts(params?: any) {
  return request({
    url: '/production/products',
    method: 'get',
    params,
  })
}

// ==================== 入库管理 ====================

/**
 * 获取入库记录列表
 */
export function getInboundRecords(params?: any) {
  return request({
    url: '/production/inbound',
    method: 'get',
    params,
  })
}

/**
 * 获取入库记录详情
 */
export function getInboundRecord(id: number) {
  return request({
    url: `/production/inbound/${id}`,
    method: 'get',
  })
}

/**
 * 创建入库记录
 */
export function createInboundRecord(data: any) {
  return request({
    url: '/production/inbound',
    method: 'post',
    data,
  })
}

/**
 * 更新入库记录
 */
export function updateInboundRecord(id: number, data: any) {
  return request({
    url: `/production/inbound/${id}`,
    method: 'put',
    data,
  })
}

/**
 * 删除入库记录
 */
export function deleteInboundRecord(id: number) {
  return request({
    url: `/production/inbound/${id}`,
    method: 'delete',
  })
}

// ==================== 发运管理 ====================

/**
 * 获取发运记录列表
 */
export function getShippingRecords(params?: any) {
  return request({
    url: '/production/shipping',
    method: 'get',
    params,
  })
}

/**
 * 获取发运记录详情
 */
export function getShippingRecord(id: number) {
  return request({
    url: `/production/shipping/${id}`,
    method: 'get',
  })
}

/**
 * 创建发运记录
 */
export function createShippingRecord(data: any) {
  return request({
    url: '/production/shipping',
    method: 'post',
    data,
  })
}

/**
 * 更新发运记录
 */
export function updateShippingRecord(id: number, data: any) {
  return request({
    url: `/production/shipping/${id}`,
    method: 'put',
    data,
  })
}

/**
 * 删除发运记录
 */
export function deleteShippingRecord(id: number) {
  return request({
    url: `/production/shipping/${id}`,
    method: 'delete',
  })
}

// ==================== 库存管理 ====================

/**
 * 获取库存列表
 */
export function getInventory(params?: any) {
  return request({
    url: '/production/inventory',
    method: 'get',
    params,
  })
}

/**
 * 创建/更新库存
 */
export function saveInventory(data: any) {
  return request({
    url: '/production/inventory',
    method: 'post',
    data,
  })
}

// ==================== 专用镍统计 ====================

/**
 * 获取专用镍统计
 */
export function getSpecialNickelStats(params?: any) {
  return request({
    url: '/production/special-nickel',
    method: 'get',
    params,
  })
}

/**
 * 创建专用镍统计
 */
export function createSpecialNickelStat(data: any) {
  return request({
    url: '/production/special-nickel',
    method: 'post',
    data,
  })
}

/**
 * 更新专用镍统计
 */
export function updateSpecialNickelStat(id: number, data: any) {
  return request({
    url: `/production/special-nickel/${id}`,
    method: 'put',
    data,
  })
}

// ==================== 统计报表 ====================

/**
 * 获取日报统计
 */
export function getDailyStats(params: any) {
  return request({
    url: '/production/stats/daily',
    method: 'get',
    params,
  })
}

/**
 * 获取月报统计
 */
export function getMonthlyStats(params: any) {
  return request({
    url: '/production/stats/monthly',
    method: 'get',
    params,
  })
}

/**
 * 获取出口/国内统计
 */
export function getExportDomesticStats(params: any) {
  return request({
    url: '/production/stats/export-domestic',
    method: 'get',
    params,
  })
}
