<template>
  <div class="history-page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title"><el-icon><Document /></el-icon> AI 识别历史记录</h1>
      </div>
      <div class="header-actions">
        <el-button type="danger" plain size="small" :disabled="selectedHistory.length===0" @click="batchDeleteHistory">
          <el-icon><Delete /></el-icon> 批量删除 ({{ selectedHistory.length }})
        </el-button>
        <el-button @click="loadHistory"><el-icon><Refresh /></el-icon> 刷新</el-button>
        <el-button @click="$router.push('/distribution')"><el-icon><Back /></el-icon> 返回</el-button>
      </div>
    </div>

    <el-card class="main-card">
      <el-table :data="historyList" v-loading="loading" stripe border @selection-change="sel => selectedHistory=sel">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="60" align="center" />
        <el-table-column prop="itemCount" label="识别数量" width="100" align="center">
          <template #default="{ row }"><el-tag :type="row.itemCount > 0 ? 'success' : 'danger'">{{ row.itemCount }} 条</el-tag></template>
        </el-table-column>
        <el-table-column label="批号" width="140"><template #default="{ row }">{{ row.batchNo || '-' }}</template></el-table-column>
        <el-table-column label="品级" width="100"><template #default="{ row }">{{ row.grade || '-' }}</template></el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }"><el-tag :type="row.status==='success'?'success':'danger'">{{ row.status==='success'?'成功':'失败' }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="errorMessage" label="错误信息" width="250" show-overflow-tooltip>
          <template #default="{ row }"><el-tag v-if="row.errorMessage" type="danger" size="small" effect="plain">{{ truncateText(row.errorMessage, 30) }}</el-tag><span v-else style="color:#909399">-</span></template>
        </el-table-column>
        <el-table-column prop="createdAt" label="识别时间" width="180"><template #default="{ row }">{{ fmtDate(row.createdAt) }}</template></el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="showDetail(row)">查看详情</el-button>
            <el-button link type="danger" @click="deleteHistory(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
        :page-sizes="[10,20,50,100]" :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination" @change="loadHistory" />
    </el-card>

    <el-dialog v-model="showDetailDialog" title="识别详情" width="800px">
      <el-descriptions :column="3" border v-if="selectedRecord">
        <el-descriptions-item label="批号">{{ selectedRecord.batchNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="品级">{{ selectedRecord.grade || '-' }}</el-descriptions-item>
        <el-descriptions-item label="识别数量">{{ selectedRecord.itemCount }} 条</el-descriptions-item>
      </el-descriptions>
      <el-divider>识别结果明细</el-divider>
      <el-table :data="parsedResult" border max-height="500" stripe>
        <el-table-column prop="packageNo" label="包号" width="80" align="center" />
        <el-table-column prop="pieceCount" label="块数" width="80" align="right" />
        <el-table-column prop="netWeight" label="净重 (kg)" width="100" align="right" />
        <el-table-column prop="grossWeight" label="毛重 (kg)" width="100" align="right" />
        <el-table-column prop="grade" label="牌号" width="90" align="center">
          <template #default="{ row }"><el-tag size="small" :type="getGradeType(row.grade)">{{ row.grade }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="batchNo" label="批号" width="140" />
      </el-table>
      <template #footer><el-button @click="showDetailDialog=false">关闭</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Refresh, Back, Delete } from '@element-plus/icons-vue'
import * as distApi from '@/api/distribution'

const loading = ref(false)
const historyList = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const showDetailDialog = ref(false)
const selectedRecord = ref<any>(null)
const selectedHistory = ref<any[]>([])
const parsedResult = ref<any[]>([])

const loadHistory = async () => {
  loading.value = true
  try {
    const res: any = await distApi.getRecognitionHistory({ page: currentPage.value, limit: pageSize.value })
    historyList.value = res.data || []
    total.value = res.total || 0
  } catch (e: any) {
    ElMessage.error('加载失败：' + (e.response?.data?.message || e.message))
  } finally {
    loading.value = false
  }
}

const showDetail = (row: any) => {
  selectedRecord.value = row
  try {
    parsedResult.value = typeof row.result === 'string' ? JSON.parse(row.result) : (row.result || [])
  } catch {
    parsedResult.value = []
  }
  showDetailDialog.value = true
}

const deleteHistory = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定删除这条识别记录？', '删除确认', { type: 'warning' })
    await distApi.deleteRecognitionHistory(row.id)
    ElMessage.success('删除成功')
    loadHistory()
  } catch {}
}

const batchDeleteHistory = async () => {
  if (!selectedHistory.value.length) return
  try {
    await ElMessageBox.confirm(`确定删除 ${selectedHistory.value.length} 条记录？`, '批量删除', { type: 'warning' })
    const ids = selectedHistory.value.map(r => r.id)
    await distApi.batchDeleteRecognitionHistory(ids)
    ElMessage.success(`已删除 ${ids.length} 条`)
    selectedHistory.value = []
    loadHistory()
  } catch {}
}

const truncateText = (t: string, n: number) => t && t.length > n ? t.slice(0, n) + '...' : (t || '')
const fmtDate = (d: string) => d ? new Date(d).toLocaleString('zh-CN') : '-'
const getGradeType = (g: string) => ({ Ni9996:'success', Ni9990:'primary', Ni9980:'warning', Ni9950:'info' }[g] || 'info')

onMounted(() => loadHistory())
</script>

<style scoped>
.history-page { padding: 24px; background: #f5f7fa; min-height: 100vh; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { margin: 0; display: flex; align-items: center; gap: 8px; font-size: 20px; font-weight: 600; color: #1e293b; }
.header-actions { display: flex; gap: 8px; }
.main-card { border-radius: 12px; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
