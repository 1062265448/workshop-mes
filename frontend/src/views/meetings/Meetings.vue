<template>
  <div class="meetings-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon><Calendar /></el-icon>
          会议管理
        </h1>
        <el-tag type="success">方案 A - 基础版</el-tag>
      </div>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        创建会议
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="statistics">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #3b82f6;">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalMeetings }}</div>
              <div class="stat-label">总会议数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #22c55e;">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.completedMeetings }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #f59e0b;">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.pendingTasks }}</div>
              <div class="stat-label">待办任务</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #ef4444;">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.overdueTasks }}</div>
              <div class="stat-label">逾期任务</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选工具栏 -->
    <div class="filter-toolbar">
      <el-select
        v-model="filterType"
        placeholder="会议类型"
        clearable
        style="width: 150px"
        @change="loadMeetings"
      >
        <el-option label="全部" value="" />
        <el-option label="常规会议" value="general" />
        <el-option label="周会" value="weekly" />
        <el-option label="评审会" value="review" />
        <el-option label="紧急会议" value="emergency" />
      </el-select>
      <el-select
        v-model="filterStatus"
        placeholder="状态"
        clearable
        style="width: 150px"
        @change="loadMeetings"
      >
        <el-option label="全部" value="" />
        <el-option label="计划中" value="scheduled" />
        <el-option label="进行中" value="ongoing" />
        <el-option label="已完成" value="completed" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
      <el-input
        v-model="searchKeyword"
        placeholder="搜索会议主题..."
        prefix-icon="Search"
        style="width: 250px"
        clearable
        @input="loadMeetings"
      />
    </div>

    <!-- 会议列表 -->
    <el-table
      v-loading="loading"
      :data="meetings"
      stripe
      highlight-current-row
      @row-click="handleRowClick"
    >
      <el-table-column label="会议主题" min-width="200">
        <template #default="{ row }">
          <div class="meeting-title">
            <el-tag
              :type="getTypeTag(row.type)"
              size="small"
              style="margin-right: 8px;"
            >
              {{ getTypeLabel(row.type) }}
            </el-tag>
            <span>{{ row.title }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="时间" width="180">
        <template #default="{ row }">
          <div class="meeting-time">
            <div>{{ formatDateTime(row.startTime) }}</div>
            <div class="time-end">至 {{ formatTime(row.endTime) }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="地点" width="120">
        <template #default="{ row }">
          {{ row.location || '未定' }}
        </template>
      </el-table-column>
      <el-table-column label="主持人" width="100">
        <template #default="{ row }">
          {{ row.organizer?.name }}
        </template>
      </el-table-column>
      <el-table-column label="参会人数" width="100">
        <template #default="{ row }">
          <el-tag size="small" type="info">
            {{ row._count?.participants || 0 }} 人
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="任务" width="100">
        <template #default="{ row }">
          <el-tag
            :type="row._count?.tasks > 0 ? 'warning' : 'info'"
            size="small"
          >
            {{ row._count?.tasks || 0 }} 个
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusTag(row.status)">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            size="small"
            @click.stop="viewMeeting(row)"
          >
            查看
          </el-button>
          <el-button
            link
            type="success"
            size="small"
            @click.stop="editMeeting(row)"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            size="small"
            @click.stop="deleteMeeting(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next"
      class="pagination"
      @change="loadMeetings"
    />

    <!-- 创建/编辑会议对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingMeeting ? '编辑会议' : '创建会议'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="meetingFormRef"
        :model="meetingForm"
        :rules="meetingRules"
        label-width="80px"
      >
        <el-form-item label="会议主题" prop="title">
          <el-input v-model="meetingForm.title" placeholder="请输入会议主题" />
        </el-form-item>
        <el-form-item label="会议类型" prop="type">
          <el-select v-model="meetingForm.type" style="width: 100%">
            <el-option label="常规会议" value="general" />
            <el-option label="周会" value="weekly" />
            <el-option label="评审会" value="review" />
            <el-option label="紧急会议" value="emergency" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="meetingForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
            v-model="meetingForm.endTime"
            type="datetime"
            placeholder="选择结束时间"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="会议地点" prop="location">
          <el-input v-model="meetingForm.location" placeholder="会议室或地点" />
        </el-form-item>
        <el-form-item label="会议描述">
          <el-input
            v-model="meetingForm.description"
            type="textarea"
            :rows="4"
            placeholder="会议描述（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitMeeting" :loading="saving">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Calendar,
  Plus,
  Check,
  Clock,
  Warning,
  Search,
} from '@element-plus/icons-vue'
import * as meetingsApi from '@/api/meetings'

// 状态
const loading = ref(false)
const saving = ref(false)
const showCreateDialog = ref(false)
const editingMeeting = ref<any>(null)

// 会议列表
const meetings = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 筛选
const filterType = ref('')
const filterStatus = ref('')
const searchKeyword = ref('')

// 统计
const statistics = ref({
  totalMeetings: 0,
  completedMeetings: 0,
  pendingTasks: 0,
  overdueTasks: 0,
})

// 表单
const meetingFormRef = ref()
const meetingForm = reactive({
  title: '',
  type: 'general',
  startTime: '',
  endTime: '',
  location: '',
  description: '',
})

const meetingRules = {
  title: [{ required: true, message: '请输入会议主题', trigger: 'blur' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
}

// 加载会议列表
const loadMeetings = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value,
    }
    if (filterType.value) params.type = filterType.value
    if (filterStatus.value) params.status = filterStatus.value

    const res: any = await meetingsApi.getMeetings(params)
    meetings.value = res.data || []
    total.value = res.total || 0
  } catch (error: any) {
    ElMessage.error('加载会议列表失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 加载统计
const loadStatistics = async () => {
  try {
    const res: any = await meetingsApi.getStatistics()
    statistics.value = res || {}
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

// 提交会议
const submitMeeting = async () => {
  await meetingFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    saving.value = true
    try {
      if (editingMeeting.value) {
        await meetingsApi.updateMeeting(editingMeeting.value.id, meetingForm)
        ElMessage.success('会议更新成功')
      } else {
        await meetingsApi.createMeeting(meetingForm)
        ElMessage.success('会议创建成功')
      }
      showCreateDialog.value = false
      loadMeetings()
      loadStatistics()
    } catch (error: any) {
      ElMessage.error('操作失败：' + (error.message || '未知错误'))
    } finally {
      saving.value = false
    }
  })
}

// 查看会议
const viewMeeting = (row: any) => {
  // TODO: 跳转到详情页
  ElMessage.info('详情页开发中...')
}

// 编辑会议
const editMeeting = (row: any) => {
  editingMeeting.value = row
  Object.assign(meetingForm, {
    title: row.title,
    type: row.type,
    startTime: row.startTime,
    endTime: row.endTime,
    location: row.location,
    description: row.description,
  })
  showCreateDialog.value = true
}

// 删除会议
const deleteMeeting = (row: any) => {
  ElMessageBox.confirm('确定删除该会议吗？', '提示', {
    type: 'warning',
  }).then(async () => {
    try {
      await meetingsApi.deleteMeeting(row.id)
      ElMessage.success('删除成功')
      loadMeetings()
      loadStatistics()
    } catch (error: any) {
      ElMessage.error('删除失败：' + (error.message || '未知错误'))
    }
  }).catch(() => {})
}

// 行点击
const handleRowClick = (row: any) => {
  viewMeeting(row)
}

// 格式化
const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatTime = (date: string) => {
  return new Date(date).toLocaleString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getTypeTag = (type: string) => {
  const map: any = {
    general: '',
    weekly: 'success',
    review: 'warning',
    emergency: 'danger',
  }
  return map[type] || ''
}

const getTypeLabel = (type: string) => {
  const map: any = {
    general: '常规',
    weekly: '周会',
    review: '评审',
    emergency: '紧急',
  }
  return map[type] || type
}

const getStatusTag = (status: string) => {
  const map: any = {
    scheduled: '',
    ongoing: 'warning',
    completed: 'success',
    cancelled: 'info',
  }
  return map[status] || ''
}

const getStatusLabel = (status: string) => {
  const map: any = {
    scheduled: '计划中',
    ongoing: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return map[status] || status
}

// 生命周期
onMounted(() => {
  loadMeetings()
  loadStatistics()
})
</script>

<style scoped>
.meetings-page {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.statistics {
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.filter-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
}

.meeting-title {
  display: flex;
  align-items: center;
}

.meeting-time {
  font-size: 13px;
}

.time-end {
  color: #94a3b8;
  font-size: 12px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding: 16px 0;
  background: #fff;
}
</style>
