<template>
  <div class="history-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon :size="24"><Document /></el-icon>
          AI 识别历史记录
        </h1>
        <p class="page-desc">查看历史识别记录和结果</p>
      </div>
      <div class="header-actions">
        <el-button @click="loadHistory">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="$router.push('/distribution')">
          <el-icon><Back /></el-icon>
          返回
        </el-button>
      </div>
    </div>

    <!-- 历史记录列表 -->
    <el-card class="main-card">
      <div class="table-wrapper">
        <el-table
          :data="historyList"
          v-loading="loading"
          stripe
          border
          class="history-table"
          @row-click="showDetail"
        >
        <el-table-column prop="id" label="ID" width="60" align="center" />
        <el-table-column prop="itemCount" label="识别数量" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.itemCount > 0 ? 'success' : 'danger'">
              {{ row.itemCount }} 条
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="errorMessage" label="错误信息" width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag 
              v-if="row.errorMessage" 
              type="danger" 
              size="small"
              effect="plain"
            >
              {{ truncateText(row.errorMessage, 30) }}
            </el-tag>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="识别时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="showDetail(row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @change="loadHistory"
        @size-change="loadHistory"
      />
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="识别详情"
      width="800px"
    >
      <h3>识别结果明细</h3>
      <el-table
        :data="selectedRecord?.result || []"
        border
        size="small"
        max-height="500"
        stripe
      >
        <el-table-column prop="packageNo" label="包号" width="80" align="center" />
        <el-table-column prop="pieceCount" label="块数" width="80" align="right" />
        <el-table-column prop="netWeight" label="净重 (kg)" width="100" align="right" />
        <el-table-column prop="netWeightSubtotal" label="净重小计" width="100" align="right" />
        <el-table-column prop="grossWeight" label="毛重 (kg)" width="100" align="right" />
        <el-table-column prop="grade" label="牌号" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getGradeType(row.grade)">{{ row.grade }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="batchNo" label="批号" width="140" />
        <el-table-column prop="inspector" label="计量员" width="100" align="center" />
        <el-table-column prop="date" label="日期" width="110" align="center" />
      </el-table>
      
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Refresh, Back } from '@element-plus/icons-vue'
import * as distributionApi from '@/api/distribution'

const loading = ref(false)
const historyList = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const showDetailDialog = ref(false)
const selectedRecord = ref<any>(null)

// 获取牌号类型
const getGradeType = (grade: string) => {
  const map: any = {
    'Ni9996': 'success',
    'Ni9990': 'primary',
    'Ni9980': 'warning',
    'Ni9950': 'info',
  }
  return map[grade] || 'info'
}



// 加载历史记录
const loadHistory = async () => {
  loading.value = true
  try {
    const res: any = await distributionApi.api.get('/distribution/recognition-history', {
      params: {
        page: currentPage.value,
        limit: pageSize.value,
      },
    })
    
    historyList.value = res.data || []
    total.value = res.total || 0
    
    // 解析 JSON 结果
    historyList.value.forEach((item: any) => {
      try {
        item.result = JSON.parse(item.result)
      } catch {
        item.result = []
      }
    })
  } catch (error: any) {
    ElMessage.error('加载历史记录失败：' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

// 显示详情
const showDetail = (row: any) => {
  selectedRecord.value = row
  showDetailDialog.value = true
}

// 截断文本
const truncateText = (text: string, maxLength: number) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.history-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-desc {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.main-card {
  border-radius: 16px;
}

.history-table {
  width: 100%;
}

.history-table :deep(.el-table__header th) {
  background: #f8fafc;
  font-weight: 600;
}

.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.el-dialog :deep(.el-dialog__body) {
  padding: 20px;
}
</style>
