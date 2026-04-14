<template>
  <div class="meeting-detail-page">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <div class="header-left">
        <el-button link @click="$router.back()">
          <el-icon><Back /></el-icon> 返回
        </el-button>
        <h1 class="page-title">
          <el-tag :type="getTypeTag(meeting.type)" size="large">
            {{ getTypeLabel(meeting.type) }}
          </el-tag>
          {{ meeting.title }}
        </h1>
      </div>
      <div class="header-actions">
        <el-select
          v-model="meeting.status"
          size="small"
          style="width: 120px; margin-right: 12px"
          @change="handleStatusChange"
        >
          <el-option label="计划中" value="scheduled" />
          <el-option label="进行中" value="ongoing" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-button type="primary" @click="handleEdit">
          <el-icon><Edit /></el-icon> 编辑
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" v-loading="loading">
      <!-- 左列：基本信息 + 参会人员 + 任务 -->
      <el-col :span="16">
        <!-- 基本信息 -->
        <el-card class="section-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><InfoFilled /></el-icon> 基本信息</span>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="会议主题" :span="2">{{ meeting.title }}</el-descriptions-item>
            <el-descriptions-item label="会议类型">
              <el-tag :type="getTypeTag(meeting.type)">{{ getTypeLabel(meeting.type) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="会议状态">
              <el-tag :type="getStatusTag(meeting.status)">{{ getStatusLabel(meeting.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="开始时间">{{ formatDateTime(meeting.startTime) }}</el-descriptions-item>
            <el-descriptions-item label="结束时间">{{ formatDateTime(meeting.endTime) }}</el-descriptions-item>
            <el-descriptions-item label="会议地点">{{ meeting.location || '未定' }}</el-descriptions-item>
            <el-descriptions-item label="主持人">{{ meeting.organizer?.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDateTime(meeting.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatDateTime(meeting.updatedAt) }}</el-descriptions-item>
            <el-descriptions-item label="会议描述" :span="2">
              {{ meeting.description || '暂无描述' }}
            </el-descriptions-item>
            <el-descriptions-item label="会议纪要" :span="2">
              <div v-if="!editingNotes">
                <span v-if="meeting.notes" style="white-space: pre-wrap">{{ meeting.notes }}</span>
                <el-text type="info" v-else>暂无纪要</el-text>
                <el-button link size="small" @click="editingNotes = true" style="margin-left: 8px">
                  {{ meeting.notes ? '编辑' : '添加' }}
                </el-button>
              </div>
              <div v-else>
                <el-input
                  v-model="notesDraft"
                  type="textarea"
                  :rows="4"
                  placeholder="输入会议纪要..."
                />
                <div style="margin-top: 8px">
                  <el-button size="small" type="primary" @click="saveNotes" :loading="savingNotes">保存</el-button>
                  <el-button size="small" @click="cancelNotes">取消</el-button>
                </div>
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 参会人员 -->
        <el-card class="section-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><User /></el-icon> 参会人员（{{ meeting.participants?.length || 0 }}人）</span>
              <el-button type="primary" size="small" @click="showAddParticipant = true">
                <el-icon><Plus /></el-icon> 添加人员
              </el-button>
            </div>
          </template>
          <el-table :data="meeting.participants || []" stripe size="small">
            <el-table-column label="姓名" prop="user.name" width="120" />
            <el-table-column label="用户名" prop="user.username" width="120" />
            <el-table-column label="邮箱" prop="user.email" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-select
                  v-model="row.status"
                  size="small"
                  style="width: 90px"
                  @change="(val) => handleParticipantStatusChange(row, val)"
                >
                  <el-option label="待定" value="pending" />
                  <el-option label="已确认" value="confirmed" />
                  <el-option label="缺席" value="absent" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="70">
              <template #default="{ row }">
                <el-popconfirm
                  title="确定移除该参会人员？"
                  @confirm="handleRemoveParticipant(row)"
                >
                  <template #reference>
                    <el-button link type="danger" size="small">移除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 会议任务 -->
        <el-card class="section-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><List /></el-icon> 会议任务（{{ tasks.length }}个）</span>
              <el-button type="primary" size="small" @click="showAddTask = true">
                <el-icon><Plus /></el-icon> 添加任务
              </el-button>
            </div>
          </template>
          <el-table :data="tasks" stripe size="small">
            <el-table-column label="任务标题" prop="title" min-width="180" />
            <el-table-column label="优先级" width="90">
              <template #default="{ row }">
                <el-tag :type="getPriorityTag(row.priority)" size="small">
                  {{ getPriorityLabel(row.priority) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <el-select
                  v-model="row.status"
                  size="small"
                  style="width: 100px"
                  @change="(val) => handleTaskUpdate(row)"
                >
                  <el-option label="待处理" value="pending" />
                  <el-option label="进行中" value="in_progress" />
                  <el-option label="已完成" value="done" />
                  <el-option label="已取消" value="cancelled" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="截止日期" width="120">
              <template #default="{ row }">
                {{ row.dueDate ? formatDate(row.dueDate) : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="70">
              <template #default="{ row }">
                <el-popconfirm
                  title="确定删除该任务？"
                  @confirm="handleDeleteTask(row)"
                >
                  <template #reference>
                    <el-button link type="danger" size="small">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 右列：附件 + 快捷操作 -->
      <el-col :span="8">
        <!-- 会议附件 -->
        <el-card class="section-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><Paperclip /></el-icon> 附件（{{ meeting.attachments?.length || 0 }}个）</span>
            </div>
          </template>
          <el-empty v-if="!meeting.attachments?.length" description="暂无附件" :image-size="80" />
          <el-empty v-if="!meeting.attachments?.length" description="暂无附件" :image-size="80" />

          <div v-if="meeting.attachments?.length" class="attachment-list">
            <div
              v-for="att in meeting.attachments"
              :key="att.id"
              class="attachment-item"
            >
              <!-- 图片：显示缩略图 -->
              <div v-if="isImage(att)" class="attachment-image-wrapper">
                <img
                  :src="getFullUrl(att.url)"
                  :alt="att.name"
                  class="attachment-thumb"
                  @click="previewImage(att)"
                />
                <div class="attachment-info">
                  <div class="attachment-name" :title="att.name">{{ att.name }}</div>
                  <div class="attachment-meta">
                    {{ att.size ? formatSize(att.size) : '-' }}
                    {{ att.type ? '· ' + att.type : '' }}
                  </div>
                </div>
                <div class="attachment-actions">
                  <el-button link type="primary" size="small" @click="previewImage(att)">预览</el-button>
                  <el-popconfirm title="确定删除该附件？" @confirm="handleDeleteAttachment(att)">
                    <template #reference>
                      <el-button link type="danger" size="small">删除</el-button>
                    </template>
                  </el-popconfirm>
                </div>
              </div>
              <!-- 非图片文件 -->
              <div v-else class="attachment-info">
                <el-icon class="file-icon"><Document /></el-icon>
                <div class="attachment-name" :title="att.name">{{ att.name }}</div>
                <div class="attachment-meta">
                  {{ att.size ? formatSize(att.size) : '-' }}
                  {{ att.type ? '· ' + att.type : '' }}
                </div>
              </div>
              <div v-if="!isImage(att)" class="attachment-actions">
                <el-button link type="primary" size="small" @click="viewAttachment(att)">
                  {{ isPdf(att) ? '查看' : '下载' }}
                </el-button>
                <el-popconfirm title="确定删除该附件？" @confirm="handleDeleteAttachment(att)">
                  <template #reference>
                    <el-button link type="danger" size="small">删除</el-button>
                  </template>
                </el-popconfirm>
              </div>
            </div>
          </div>
          <div class="attachment-upload" style="margin-top: 12px">
            <el-upload
              :action="''"
              :auto-upload="false"
              :on-change="handleFileSelect"
              :show-file-list="false"
              :limit="5"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip,.rar,.txt,.csv"
            >
              <el-button size="small" type="primary" :loading="uploading">
                <el-icon><Upload /></el-icon> 选择文件上传
              </el-button>
            </el-upload>
            <el-text type="info" size="small" style="margin-top: 8px; display: block">
              支持 PDF/Word/Excel/PPT/图片/压缩包，单个文件最大 50MB
            </el-text>
          </div>
        </el-card>

        <!-- 快捷统计 -->
        <el-card class="section-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><DataAnalysis /></el-icon> 快捷统计</span>
            </div>
          </template>
          <div class="quick-stats">
            <div class="stat-row">
              <span class="stat-label">参会人数</span>
              <span class="stat-value">{{ meeting.participants?.length || 0 }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">已确认</span>
              <span class="stat-value success">
                {{ (meeting.participants || []).filter(p => p.status === 'confirmed').length }}
              </span>
            </div>
            <div class="stat-row">
              <span class="stat-label">任务总数</span>
              <span class="stat-value">{{ tasks.length }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">已完成任务</span>
              <span class="stat-value success">
                {{ tasks.filter(t => t.status === 'done').length }}
              </span>
            </div>
            <div class="stat-row">
              <span class="stat-label">附件数</span>
              <span class="stat-value">{{ meeting.attachments?.length || 0 }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 添加参会人员对话框 -->
    <el-dialog v-model="showAddParticipant" title="添加参会人员" width="400px">
      <el-form label-width="60px">
        <el-form-item label="用户ID">
          <el-input-number v-model="newParticipant.userId" :min="1" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddParticipant = false">取消</el-button>
        <el-button type="primary" @click="handleAddParticipant" :loading="savingParticipant">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加任务对话框 -->
    <el-dialog v-model="showAddTask" title="添加任务" width="500px">
      <el-form :model="taskForm" label-width="80px">
        <el-form-item label="任务标题" required>
          <el-input v-model="taskForm.title" placeholder="输入任务标题" />
        </el-form-item>
        <el-form-item label="任务描述">
          <el-input v-model="taskForm.description" type="textarea" :rows="3" placeholder="任务描述（可选）" />
        </el-form-item>
        <el-form-item label="负责人ID">
          <el-input-number v-model="taskForm.assigneeId" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker
            v-model="taskForm.dueDate"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="taskForm.priority" style="width: 100%">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddTask = false">取消</el-button>
        <el-button type="primary" @click="handleAddTask" :loading="savingTask">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑会议对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑会议" width="600px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="会议主题" required>
          <el-input v-model="editForm.title" />
        </el-form-item>
        <el-form-item label="会议类型">
          <el-select v-model="editForm.type" style="width: 100%">
            <el-option label="常规会议" value="general" />
            <el-option label="周会" value="weekly" />
            <el-option label="评审会" value="review" />
            <el-option label="紧急会议" value="emergency" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间" required>
          <el-date-picker
            v-model="editForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="结束时间" required>
          <el-date-picker
            v-model="editForm.endTime"
            type="datetime"
            placeholder="选择结束时间"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="会议地点">
          <el-input v-model="editForm.location" />
        </el-form-item>
        <el-form-item label="会议描述">
          <el-input v-model="editForm.description" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEdit" :loading="savingEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 图片预览对话框 -->
    <el-dialog v-model="showImagePreview" title="图片预览" width="80%" :close-on-click-modal="true">
      <div class="image-preview-container">
        <img :src="previewImageUrl" :alt="previewImageName" class="preview-image" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Back, Edit, InfoFilled, User, Plus, List,
  Paperclip, Document, DataAnalysis, Upload,
} from '@element-plus/icons-vue'
import * as meetingsApi from '@/api/meetings'

const route = useRoute()
const router = useRouter()

const meetingId = Number(route.params.id)

// 状态
const loading = ref(false)
const meeting = ref<any>({})
const tasks = ref<any[]>([])

// 纪要编辑
const editingNotes = ref(false)
const notesDraft = ref('')
const savingNotes = ref(false)

// 参会人员
const showAddParticipant = ref(false)
const newParticipant = reactive({ userId: 1 })
const savingParticipant = ref(false)

// 任务
const showAddTask = ref(false)
const savingTask = ref(false)
const taskForm = reactive({
  title: '',
  description: '',
  assigneeId: undefined as number | undefined,
  dueDate: '',
  priority: 'medium',
})

// 编辑会议
const showEditDialog = ref(false)
const savingEdit = ref(false)

// 上传附件
const uploading = ref(false)

// 图片预览
const showImagePreview = ref(false)
const previewImageUrl = ref('')
const previewImageName = ref('')

const handleFileSelect = async (file: any) => {
  if (!file.raw) return
  uploading.value = true
  try {
    await meetingsApi.uploadAttachment(meetingId, file.raw)
    ElMessage.success('附件上传成功')
    loadMeeting()
  } catch (error: any) {
    ElMessage.error('上传失败：' + (error.message || '未知错误'))
  } finally {
    uploading.value = false
  }
}

// 附件预览/查看
const API_BASE = 'http://localhost:3001'

const getFullUrl = (url: string) => {
  if (!url) return ''
  return url.startsWith('http') ? url : `${API_BASE}${url}`
}

const isImage = (att: any) => {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
  return imageTypes.includes(att.type?.toLowerCase())
}

const isPdf = (att: any) => {
  return att.type === 'application/pdf' || att.name?.toLowerCase().endsWith('.pdf')
}

const previewImage = (att: any) => {
  previewImageUrl.value = getFullUrl(att.url)
  previewImageName.value = att.name
  showImagePreview.value = true
}

const viewAttachment = (att: any) => {
  const url = getFullUrl(att.url)
  if (isPdf(att)) {
    // PDF 在新标签页中打开
    window.open(url, '_blank')
  } else {
    // 其他文件触发下载
    const a = document.createElement('a')
    a.href = url
    a.download = att.name
    a.click()
  }
}

const editForm = reactive({
  title: '',
  type: 'general',
  startTime: '',
  endTime: '',
  location: '',
  description: '',
})

// 加载会议详情
const loadMeeting = async () => {
  loading.value = true
  try {
    const res: any = await meetingsApi.getMeetingById(meetingId)
    meeting.value = res
    tasks.value = res.tasks || []
    notesDraft.value = res.notes || ''
  } catch (error: any) {
    ElMessage.error('加载会议详情失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 状态变更
const handleStatusChange = async (val: string) => {
  try {
    await meetingsApi.updateMeeting(meetingId, { status: val })
    ElMessage.success('状态已更新')
  } catch (error: any) {
    ElMessage.error('状态更新失败')
    loadMeeting() // 回滚
  }
}

// 保存纪要
const saveNotes = async () => {
  savingNotes.value = true
  try {
    await meetingsApi.updateMeeting(meetingId, { notes: notesDraft.value })
    meeting.value.notes = notesDraft.value
    editingNotes.value = false
    ElMessage.success('纪要已保存')
  } catch (error: any) {
    ElMessage.error('保存失败')
  } finally {
    savingNotes.value = false
  }
}

const cancelNotes = () => {
  notesDraft.value = meeting.value.notes || ''
  editingNotes.value = false
}

// 参会人员操作
const handleAddParticipant = async () => {
  savingParticipant.value = true
  try {
    await meetingsApi.addParticipant(meetingId, newParticipant.userId)
    ElMessage.success('已添加参会人员')
    showAddParticipant.value = false
    loadMeeting()
  } catch (error: any) {
    ElMessage.error('添加失败：' + (error.message || '未知错误'))
  } finally {
    savingParticipant.value = false
  }
}

const handleParticipantStatusChange = async (row: any, val: string) => {
  try {
    await meetingsApi.updateParticipantStatus(meetingId, row.user.id, val)
    ElMessage.success('状态已更新')
  } catch (error: any) {
    ElMessage.error('状态更新失败')
    loadMeeting()
  }
}

const handleRemoveParticipant = async (row: any) => {
  try {
    await meetingsApi.removeParticipant(meetingId, row.user.id)
    ElMessage.success('已移除参会人员')
    loadMeeting()
  } catch (error: any) {
    ElMessage.error('移除失败')
  }
}

// 任务操作
const handleAddTask = async () => {
  if (!taskForm.title) {
    ElMessage.warning('请输入任务标题')
    return
  }
  savingTask.value = true
  try {
    await meetingsApi.createTask(meetingId, { ...taskForm })
    ElMessage.success('任务已添加')
    showAddTask.value = false
    Object.assign(taskForm, { title: '', description: '', assigneeId: undefined, dueDate: '', priority: 'medium' })
    loadMeeting()
  } catch (error: any) {
    ElMessage.error('添加失败')
  } finally {
    savingTask.value = false
  }
}

const handleTaskUpdate = async (row: any) => {
  try {
    await meetingsApi.updateTask(row.id, { status: row.status })
    ElMessage.success('任务状态已更新')
  } catch (error: any) {
    ElMessage.error('更新失败')
    loadMeeting()
  }
}

const handleDeleteTask = async (row: any) => {
  try {
    await meetingsApi.deleteTask(row.id)
    ElMessage.success('任务已删除')
    loadMeeting()
  } catch (error: any) {
    ElMessage.error('删除失败')
  }
}

// 附件操作
const handleDeleteAttachment = async (row: any) => {
  try {
    await meetingsApi.deleteAttachment(row.id)
    ElMessage.success('附件已删除')
    loadMeeting()
  } catch (error: any) {
    ElMessage.error('删除失败')
  }
}

// 编辑会议
const handleEdit = () => {
  Object.assign(editForm, {
    title: meeting.value.title,
    type: meeting.value.type,
    startTime: meeting.value.startTime,
    endTime: meeting.value.endTime,
    location: meeting.value.location,
    description: meeting.value.description,
  })
  showEditDialog.value = true
}

const handleSaveEdit = async () => {
  if (!editForm.title || !editForm.startTime || !editForm.endTime) {
    ElMessage.warning('请填写必填项')
    return
  }
  savingEdit.value = true
  try {
    await meetingsApi.updateMeeting(meetingId, editForm)
    ElMessage.success('会议信息已更新')
    showEditDialog.value = false
    loadMeeting()
  } catch (error: any) {
    ElMessage.error('保存失败')
  } finally {
    savingEdit.value = false
  }
}

// 工具函数
const formatDateTime = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const getTypeTag = (type: string): any => {
  const map: any = { general: undefined, weekly: 'success', review: 'warning', emergency: 'danger' }
  return map[type] || undefined
}

const getTypeLabel = (type: string) => {
  const map: any = { general: '常规', weekly: '周会', review: '评审', emergency: '紧急' }
  return map[type] || type
}

const getStatusTag = (status: string): any => {
  const map: any = { scheduled: undefined, ongoing: 'warning', completed: 'success', cancelled: 'info' }
  return map[status] || undefined
}

const getStatusLabel = (status: string) => {
  const map: any = { scheduled: '计划中', ongoing: '进行中', completed: '已完成', cancelled: '已取消' }
  return map[status] || status
}

const getPriorityTag = (priority: string): any => {
  const map: any = { low: 'info', medium: undefined, high: 'warning', urgent: 'danger' }
  return map[priority] || undefined
}

const getPriorityLabel = (priority: string) => {
  const map: any = { low: '低', medium: '中', high: '高', urgent: '紧急' }
  return map[priority] || priority
}

onMounted(() => {
  loadMeeting()
})
</script>

<style scoped>
.meeting-detail-page {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.section-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.attachment-list {
  max-height: 300px;
  overflow-y: auto;
}

.attachment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.attachment-item:last-child {
  border-bottom: none;
}

.attachment-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.file-icon {
  color: #409eff;
  font-size: 20px;
  flex-shrink: 0;
}

.attachment-name {
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-meta {
  font-size: 12px;
  color: #909399;
}

.quick-stats .stat-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.quick-stats .stat-row:last-child {
  border-bottom: none;
}

.stat-label {
  color: #606266;
  font-size: 14px;
}

.stat-value {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.stat-value.success {
  color: #67c23a;
}

/* 附件样式 */
.attachment-image-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.attachment-thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
  border: 1px solid #e4e7ed;
  transition: box-shadow 0.2s;
}

.attachment-thumb:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.attachment-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.image-preview-container {
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
}
</style>
