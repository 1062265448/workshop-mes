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
      <el-table
        :data="historyList"
        v-loading="loading"
        stripe
        border
        class="history-table"
        @row-click="showDetail"
      >
        <el-table-column prop="id" label="ID" width="60" align="center" />
        <el-table-column label="预览" width="100" align="center">
          <template #default="{ row }">
            <el-image
              :src="getImageUrl(row.imageUrl)"
              :preview-src-list="[getImageUrl(row.imageUrl)]"
              fit="cover"
              style="width: 60px; height: 60px; cursor: pointer"
              :hide-on-click-modal="true"
            >
              <template #error>
                <div class="image-error">
                  <el-icon :size="20"><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
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
        <el-table-column prop="errorMessage" label="错误信息" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.errorMessage || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="识别时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="showDetail(row)">
              查看详情
            </el-button>
            <el-button link type="danger" @click.stop="deleteHistory(row)">
              删除
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
      width="900px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <h3>原始图片</h3>
          <el-image
            :src="getImageUrl(selectedRecord?.imageUrl)"
            fit="contain"
            style="width: 100%; max-height: 400px"
            :preview-src-list="[getImageUrl(selectedRecord?.imageUrl)]"
          >
            <template #error>
              <div class="image-error">
                <el-icon :size="40"><Picture /></el-icon>
                <p>图片加载失败</p>
              </div>
            </template>
          </el-image>
        </el-col>
        <el-col :span="12">
          <h3>识别结果</h3>
          <el-table
            :data="selectedRecord?.result || []"
            border
            size="small"
            max-height="400"
          >
            <el-table-column prop="packageNo" label="包号" width="60" />
            <el-table-column prop="pieceCount" label="块数" width="60" align="right" />
            <el-table-column prop="netWeight" label="净重" width="80" align="right" />
            <el-table-column prop="grossWeight" label="毛重" width="80" align="right" />
            <el-table-column prop="grade" label="牌号" width="80" />
            <el-table-column prop="batchNo" label="批号" width="120" />
          </el-table>
        </el-col>
      </el-row>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Refresh, Back, Picture } from '@element-plus/icons-vue'
import * as distributionApi from '@/api/distribution'

const API_BASE = 'http://localhost:3001'

// 获取图片完整 URL
const getImageUrl = (url: string | undefined) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${API_BASE}${url}`
}

const loading = ref(false)
const historyList = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const showDetailDialog = ref(false)
const selectedRecord = ref<any>(null)

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

// 删除历史记录
const deleteHistory = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定删除这条识别历史记录？`,
      '删除确认',
      { type: 'warning' }
    )
    
    // 调用 API 删除
    await distributionApi.api.delete(`/distribution/recognition-history/${row.id}`)
    
    // 从列表中移除
    const index = historyList.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      historyList.value.splice(index, 1)
      total.value--
    }
    
    ElMessage.success('删除成功')
  } catch (error: any) {
    console.error('删除失败:', error)
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + (error.response?.data?.message || error.message))
    }
  }
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
}

h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: #f5f7fa;
  border-radius: 4px;
  color: #909399;
}

.image-error p {
  margin: 4px 0 0 0;
  font-size: 10px;
}
</style>
