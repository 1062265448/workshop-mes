<template>
  <div class="distribution-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon :size="24"><ShoppingCart /></el-icon>
          平面库配货管理
        </h1>
        <p class="page-desc">库存管理与配货单创建</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateOrder = true">
          <el-icon><Plus /></el-icon>
          新建配货单
        </el-button>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <div class="stat-card inventory">
          <div class="stat-icon">📦</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalInventory }}</div>
            <div class="stat-label">库存批次</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card available">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.availableInventory }}</div>
            <div class="stat-label">可用库存</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card orders">
          <div class="stat-icon">📋</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalOrders }}</div>
            <div class="stat-label">配货单总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card pending">
          <div class="stat-icon">⏳</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.pendingOrders }}</div>
            <div class="stat-label">待处理订单</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 选项卡 -->
    <el-card class="main-card">
      <el-tabs v-model="activeTab" class="distribution-tabs">
        <!-- 库存管理 -->
        <el-tab-pane label="库存管理" name="inventory">
          <div class="tab-toolbar">
            <div class="toolbar-left">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索批号、品级、规格..."
                prefix-icon="Search"
                style="width: 300px"
                clearable
                @input="handleSearch"
              />
            </div>
            <div class="toolbar-right">
              <el-button type="success" @click="showAddInventory = true">
                <el-icon><Plus /></el-icon>
                新增库存
              </el-button>
            </div>
          </div>

          <el-table
            :data="inventoryList"
            v-loading="loading"
            stripe
            border
            class="data-table"
          >
            <el-table-column prop="batchNo" label="批号" width="150" />
            <el-table-column prop="grade" label="品级" width="100">
              <template #default="{ row }">
                <el-tag :type="getGradeType(row.grade)">{{ row.grade }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="specification" label="规格" width="120" />
            <el-table-column prop="weight" label="重量 (kg)" width="100" align="right">
              <template #default="{ row }">{{ row.weight?.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="pieceCount" label="片数" width="80" align="right" />
            <el-table-column prop="location" label="储位" width="100" />
            <el-table-column prop="nickelContent" label="镍含量 (%)" width="100" align="right">
              <template #default="{ row }">{{ row.nickelContent?.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="入库时间" width="160">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="180">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleEditInventory(row)">编辑</el-button>
                <el-button link type="danger" @click="handleDeleteInventory(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="inventoryPage"
            v-model:page-size="inventoryPageSize"
            :total="inventoryTotal"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            class="pagination"
            @change="loadInventory"
          />
        </el-tab-pane>

        <!-- 配货单管理 -->
        <el-tab-pane label="配货单" name="orders">
          <div class="tab-toolbar">
            <div class="toolbar-left">
              <el-select v-model="orderStatusFilter" placeholder="订单状态" clearable style="width: 150px">
                <el-option label="草稿" value="draft" />
                <el-option label="已确认" value="confirmed" />
                <el-option label="已发货" value="shipped" />
                <el-option label="已完成" value="completed" />
              </el-select>
            </div>
          </div>

          <el-table
            :data="orderList"
            v-loading="loading"
            stripe
            border
            class="data-table"
          >
            <el-table-column prop="orderNo" label="配货单号" width="180" />
            <el-table-column prop="customerName" label="客户" width="150" />
            <el-table-column prop="productName" label="产品" width="100" />
            <el-table-column prop="targetGrade" label="目标品级" width="100" />
            <el-table-column prop="totalWeight" label="总重量 (kg)" width="100" align="right">
              <template #default="{ row }">{{ row.totalWeight?.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="totalPieces" label="总片数" width="80" align="right" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getOrderStatusType(row.status)">
                  {{ getOrderStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="160">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="280">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleViewOrder(row)">查看</el-button>
                <el-button link type="success" @click="handleExportOrder(row)">导出</el-button>
                <el-button link type="warning" v-if="row.status === 'draft'" @click="handleConfirmOrder(row)">确认</el-button>
                <el-button link type="danger" v-if="row.status === 'draft'" @click="handleDeleteOrder(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="orderPage"
            v-model:page-size="orderPageSize"
            :total="orderTotal"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            class="pagination"
            @change="loadOrders"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 新建配货单对话框 -->
    <el-dialog
      v-model="showCreateOrder"
      title="新建配货单"
      width="900px"
      :close-on-click-modal="false"
    >
      <el-form :model="orderForm" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="客户名称">
              <el-input v-model="orderForm.customerName" placeholder="输入客户名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品规格">
              <el-input v-model="orderForm.productSpec" placeholder="如：电解镍" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目标品级">
              <el-select v-model="orderForm.targetGrade" placeholder="选择品级" style="width: 100%">
                <el-option label="Ni9996" value="Ni9996" />
                <el-option label="Ni9990" value="Ni9990" />
                <el-option label="Ni9980" value="Ni9980" />
                <el-option label="Ni9950" value="Ni9950" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="备注">
              <el-input v-model="orderForm.remark" placeholder="可选" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider>选择库存</el-divider>

        <el-table
          :data="availableInventory"
          @selection-change="handleSelectionChange"
          border
        >
          <el-table-column type="selection" width="50" />
          <el-table-column prop="batchNo" label="批号" width="120" />
          <el-table-column prop="grade" label="品级" width="80" />
          <el-table-column prop="weight" label="重量 (kg)" width="100" />
          <el-table-column prop="pieceCount" label="片数" width="80" />
          <el-table-column prop="location" label="储位" width="100" />
        </el-table>

        <div class="order-summary">
          <el-descriptions :column="3" border>
            <el-descriptions-item label="已选批次">{{ selectedInventory.length }}</el-descriptions-item>
            <el-descriptions-item label="总重量">{{ orderTotalWeight.toFixed(2) }} kg</el-descriptions-item>
            <el-descriptions-item label="总片数">{{ orderTotalPieces }} 片</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="showCreateOrder = false">取消</el-button>
        <el-button type="primary" @click="submitOrder" :disabled="selectedInventory.length === 0">
          创建配货单
        </el-button>
      </template>
    </el-dialog>

    <!-- 新增库存对话框 -->
    <el-dialog
      v-model="showAddInventory"
      title="新增库存"
      width="600px"
    >
      <el-form :model="inventoryForm" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="批号" required>
              <el-input v-model="inventoryForm.batchNo" placeholder="输入批号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="品级" required>
              <el-select v-model="inventoryForm.grade" placeholder="选择品级" style="width: 100%">
                <el-option label="Ni9996" value="Ni9996" />
                <el-option label="Ni9990" value="Ni9990" />
                <el-option label="Ni9980" value="Ni9980" />
                <el-option label="Ni9950" value="Ni9950" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规格" required>
              <el-input v-model="inventoryForm.specification" placeholder="如：99.96%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="重量 (kg)" required>
              <el-input-number v-model="inventoryForm.weight" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="片数" required>
              <el-input-number v-model="inventoryForm.pieceCount" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="储位">
              <el-input v-model="inventoryForm.location" placeholder="如：A-01-01" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="镍含量 (%)" required>
              <el-input-number v-model="inventoryForm.nickelContent" :min="0" :max="100" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="检测日期" required>
              <el-date-picker
                v-model="inventoryForm.inspectionDate"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="showAddInventory = false">取消</el-button>
        <el-button type="primary" @click="submitInventory">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ShoppingCart,
  Plus,
  Refresh,
  Search,
} from '@element-plus/icons-vue'

// 状态
const activeTab = ref('inventory')
const loading = ref(false)
const searchKeyword = ref('')
const orderStatusFilter = ref('')

// 统计数据
const stats = reactive({
  totalInventory: 0,
  availableInventory: 0,
  totalOrders: 0,
  pendingOrders: 0,
})

// 库存相关
const inventoryList = ref([])
const inventoryPage = ref(1)
const inventoryPageSize = ref(20)
const inventoryTotal = ref(0)
const showAddInventory = ref(false)
const inventoryForm = reactive({
  batchNo: '',
  grade: '',
  specification: '',
  weight: 0,
  pieceCount: 0,
  location: '',
  nickelContent: 0,
  inspectionDate: '',
})

// 订单相关
const orderList = ref([])
const orderPage = ref(1)
const orderPageSize = ref(20)
const orderTotal = ref(0)
const showCreateOrder = ref(false)
const orderForm = reactive({
  customerName: '',
  productSpec: '',
  targetGrade: '',
  remark: '',
})

// 选中的库存
const selectedInventory = ref([])
const availableInventory = computed(() => inventoryList.value.filter((item: any) => item.status === 'available'))

// 订单汇总
const orderTotalWeight = computed(() => {
  return selectedInventory.value.reduce((sum, item) => sum + (item.weight || 0), 0)
})

const orderTotalPieces = computed(() => {
  return selectedInventory.value.reduce((sum, item) => sum + (item.pieceCount || 0), 0)
})

// 加载数据
const loadInventory = async () => {
  loading.value = true
  try {
    // TODO: 调用 API
    // const res = await api.get('/distribution/inventory', { params: { page: inventoryPage.value, limit: inventoryPageSize.value, keyword: searchKeyword.value } })
    // inventoryList.value = res.data.data
    // inventoryTotal.value = res.data.total
    // stats.totalInventory = res.data.total
    // stats.availableInventory = res.data.data.filter((i: any) => i.status === 'available').length
    
    // 模拟数据
    inventoryList.value = [
      { id: 1, batchNo: 'Ni20260401-001', grade: 'Ni9996', specification: '99.96%', weight: 1000, pieceCount: 100, location: 'A-01-01', nickelContent: 99.96, status: 'available', createdAt: '2026-04-01 10:00:00' },
      { id: 2, batchNo: 'Ni20260401-002', grade: 'Ni9990', specification: '99.90%', weight: 1500, pieceCount: 150, location: 'A-01-02', nickelContent: 99.90, status: 'available', createdAt: '2026-04-01 11:00:00' },
    ]
    inventoryTotal.value = 2
    stats.totalInventory = 2
    stats.availableInventory = 2
  } catch (error) {
    ElMessage.error('加载库存失败')
  } finally {
    loading.value = false
  }
}

const loadOrders = async () => {
  loading.value = true
  try {
    // TODO: 调用 API
    // const res = await api.get('/distribution/orders', { params: { page: orderPage.value, limit: orderPageSize.value } })
    // orderList.value = res.data.data
    // orderTotal.value = res.data.total
    // stats.totalOrders = res.data.total
    
    // 模拟数据
    orderList.value = [
      { id: 1, orderNo: 'DO202604010001', customerName: '某某公司', productName: '电解镍', targetGrade: 'Ni9996', totalWeight: 2500, totalPieces: 250, status: 'draft', createdAt: '2026-04-01 14:00:00' },
    ]
    orderTotal.value = 1
    stats.totalOrders = 1
  } catch (error) {
    ElMessage.error('加载订单失败')
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadInventory()
  loadOrders()
  ElMessage.success('刷新成功')
}

// 搜索
const handleSearch = () => {
  inventoryPage.value = 1
  loadInventory()
}

// 选择库存
const handleSelectionChange = (selection: any[]) => {
  selectedInventory.value = selection
}

// 提交配货单
const submitOrder = async () => {
  try {
    // TODO: 调用 API
    // await api.post('/distribution/order', { ...orderForm, items: selectedInventory.value })
    ElMessage.success('配货单创建成功')
    showCreateOrder.value = false
    loadOrders()
  } catch (error) {
    ElMessage.error('创建失败')
  }
}

// 提交库存
const submitInventory = async () => {
  try {
    // TODO: 调用 API
    // await api.post('/distribution/inventory', inventoryForm)
    ElMessage.success('库存添加成功')
    showAddInventory.value = false
    loadInventory()
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

// 编辑库存
const handleEditInventory = (row: any) => {
  ElMessage.info('编辑功能开发中')
}

// 删除库存
const handleDeleteInventory = (row: any) => {
  ElMessageBox.confirm('确定删除该库存？', '警告', { type: 'warning' })
    .then(() => {
      ElMessage.success('删除成功')
      loadInventory()
    })
    .catch(() => {})
}

// 查看订单
const handleViewOrder = (row: any) => {
  ElMessage.info('查看订单详情')
}

// 导出订单
const handleExportOrder = (row: any) => {
  ElMessage.success('导出 Excel 功能开发中')
}

// 确认订单
const handleConfirmOrder = (row: any) => {
  ElMessageBox.confirm('确认该配货单？', '提示', { type: 'info' })
    .then(() => {
      ElMessage.success('确认成功')
      loadOrders()
    })
    .catch(() => {})
}

// 删除订单
const handleDeleteOrder = (row: any) => {
  ElMessageBox.confirm('确定删除该配货单？', '警告', { type: 'warning' })
    .then(() => {
      ElMessage.success('删除成功')
      loadOrders()
    })
    .catch(() => {})
}

// 工具函数
const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

const getGradeType = (grade: string) => {
  const map: any = { Ni9996: 'success', Ni9990: 'primary', Ni9980: 'warning', Ni9950: 'info' }
  return map[grade] || 'info'
}

const getStatusType = (status: string) => {
  const map: any = { available: 'success', reserved: 'warning', used: 'info' }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: any = { available: '可用', reserved: '已预留', used: '已使用' }
  return map[status] || status
}

const getOrderStatusType = (status: string) => {
  const map: any = { draft: 'info', confirmed: 'success', shipped: 'warning', completed: 'success' }
  return map[status] || 'info'
}

const getOrderStatusText = (status: string) => {
  const map: any = { draft: '草稿', confirmed: '已确认', shipped: '已发货', completed: '已完成' }
  return map[status] || status
}

onMounted(() => {
  loadInventory()
  loadOrders()
})
</script>

<style scoped>
.distribution-page {
  padding: 24px;
}

/* 页面头部 */
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

/* 统计卡片 */
.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  font-size: 36px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.stat-card.inventory .stat-icon { background: #dbeafe; }
.stat-card.available .stat-icon { background: #d1fae5; }
.stat-card.orders .stat-icon { background: #fef3c7; }
.stat-card.pending .stat-icon { background: #fee2e2; }

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

/* 主卡片 */
.main-card {
  border-radius: 16px;
}

.distribution-tabs :deep(.el-tabs__header) {
  margin-bottom: 24px;
}

/* 工具栏 */
.tab-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.toolbar-left, .toolbar-right {
  display: flex;
  gap: 12px;
}

/* 数据表格 */
.data-table {
  width: 100%;
}

.data-table :deep(.el-table__header th) {
  background: #f8fafc;
  font-weight: 600;
}

/* 分页 */
.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

/* 订单汇总 */
.order-summary {
  margin-top: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .stats-row {
    grid-template-columns: 1fr;
  }
}
</style>
