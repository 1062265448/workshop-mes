import api from './index'

const API_BASE = '/meetings'

// ==================== 会议管理 ====================

/**
 * 创建会议
 */
export const createMeeting = (data: any) => {
  return api.post(API_BASE, data)
}

/**
 * 获取会议列表
 */
export const getMeetings = (params?: {
  type?: string
  status?: string
  page?: number
  limit?: number
}) => {
  return api.get(API_BASE, { params })
}

/**
 * 获取会议详情
 */
export const getMeetingById = (id: number) => {
  return api.get(`${API_BASE}/${id}`)
}

/**
 * 更新会议
 */
export const updateMeeting = (id: number, data: any) => {
  return api.put(`${API_BASE}/${id}`, data)
}

/**
 * 删除会议
 */
export const deleteMeeting = (id: number) => {
  return api.delete(`${API_BASE}/${id}`)
}

// ==================== 参会人员管理 ====================

/**
 * 添加参会人员
 */
export const addParticipant = (meetingId: number, userId: number) => {
  return api.post(`${API_BASE}/${meetingId}/participants`, { userId })
}

/**
 * 更新参会状态
 */
export const updateParticipantStatus = (
  meetingId: number,
  userId: number,
  status: string
) => {
  return api.put(`${API_BASE}/${meetingId}/participants/${userId}`, { status })
}

/**
 * 移除参会人员
 */
export const removeParticipant = (meetingId: number, userId: number) => {
  return api.delete(`${API_BASE}/${meetingId}/participants/${userId}`)
}

// ==================== 会议任务管理 ====================

/**
 * 创建会议任务
 */
export const createTask = (meetingId: number, data: any) => {
  return api.post(`${API_BASE}/${meetingId}/tasks`, data)
}

/**
 * 更新任务
 */
export const updateTask = (taskId: number, data: any) => {
  return api.put(`${API_BASE}/tasks/${taskId}`, data)
}

/**
 * 删除任务
 */
export const deleteTask = (taskId: number) => {
  return api.delete(`${API_BASE}/tasks/${taskId}`)
}

/**
 * 获取会议任务列表
 */
export const getTasksByMeeting = (meetingId: number) => {
  return api.get(`${API_BASE}/${meetingId}/tasks`)
}

// ==================== 会议附件管理 ====================

/**
 * 添加附件
 */
export const addAttachment = (
  meetingId: number,
  name: string,
  url: string,
  size?: number,
  type?: string
) => {
  return api.post(`${API_BASE}/${meetingId}/attachments`, {
    name,
    url,
    size,
    type,
  })
}

/**
 * 删除附件
 */
export const deleteAttachment = (attachmentId: number) => {
  return api.delete(`${API_BASE}/attachments/${attachmentId}`)
}

// ==================== 统计 ====================

/**
 * 获取会议统计
 */
export const getStatistics = (organizerId?: number) => {
  return api.get(`${API_BASE}/statistics/overview`, {
    params: { organizerId },
  })
}
