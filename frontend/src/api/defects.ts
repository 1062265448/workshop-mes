import api from './index'

// 导出 api 实例供页面直接使用
export { api }

// ==================== 缺陷类型管理 ====================

/**
 * 获取缺陷类型列表
 */
export const getDefectTypes = () => {
  return api.get('/defects/types')
}

/**
 * 获取缺陷类型详情
 */
export const getDefectTypeById = (id: number) => {
  return api.get(`/defects/types/${id}`)
}

/**
 * 创建缺陷类型
 */
export const createDefectType = (data: any) => {
  return api.post('/defects/types', data)
}

/**
 * 更新缺陷类型
 */
export const updateDefectType = (id: number, data: any) => {
  return api.put(`/defects/types/${id}`, data)
}

/**
 * 删除缺陷类型
 */
export const deleteDefectType = (id: number) => {
  return api.delete(`/defects/types/${id}`)
}

// ==================== 缺陷样本管理 ====================

/**
 * 获取缺陷样本列表
 */
export const getDefectSamples = (params?: { defectTypeId?: number; page?: number; limit?: number }) => {
  // 将数字转换为字符串，符合后端 ParseIntPipe 的要求
  const queryParams: any = {}
  if (params?.defectTypeId !== undefined && params?.defectTypeId !== null) {
    queryParams.defectTypeId = String(params.defectTypeId)
  }
  if (params?.page !== undefined && params?.page !== null) {
    queryParams.page = String(params.page)
  }
  if (params?.limit !== undefined && params?.limit !== null) {
    queryParams.limit = String(params.limit)
  }
  return api.get('/defects/samples', { params: queryParams })
}

/**
 * 获取缺陷样本详情
 */
export const getDefectSampleById = (id: number) => {
  return api.get(`/defects/samples/${id}`)
}

/**
 * 创建缺陷样本
 */
export const createDefectSample = (data: any) => {
  return api.post('/defects/samples', data)
}

/**
 * 更新缺陷样本
 */
export const updateDefectSample = (id: number, data: any) => {
  return api.put(`/defects/samples/${id}`, data)
}

/**
 * 删除缺陷样本
 */
export const deleteDefectSample = (id: number) => {
  return api.delete(`/defects/samples/${id}`)
}

/**
 * 上传缺陷图片
 */
export const uploadDefectImage = (file: File, defectTypeId: number, description?: string) => {
  const formData = new FormData()
  formData.append('image', file)
  if (defectTypeId) {
    formData.append('defectTypeId', defectTypeId.toString())
  }
  if (description) {
    formData.append('description', description)
  }
  return api.post('/defects/samples/upload', formData)
}

/**
 * 批量保存标注（一次性替换样本全部标注，事务保证原子性）
 */
export const saveAnnotations = (sampleId: number, defectTypeId: number, annotations: any[]) => {
  return api.post(`/defects/samples/${sampleId}/annotations/batch`, {
    defectTypeId,
    annotations,
  })
}

// ==================== 缺陷标注管理 ====================

/**
 * 创建缺陷标注
 */
export const createAnnotation = (sampleId: number, defectTypeId: number, annotation: any) => {
  return api.post(`/defects/samples/${sampleId}/annotations`, {
    defectTypeId,
    ...annotation,
  })
}

/**
 * 获取样本的所有标注
 */
export const getAnnotationsBySample = (sampleId: number) => {
  return api.get(`/defects/samples/${sampleId}/annotations`)
}

/**
 * 删除标注
 */
export const deleteAnnotation = (id: number) => {
  return api.delete(`/defects/annotations/${id}`)
}
