<template>
  <div class="distribution-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon><ShoppingCart /></el-icon>
          平面库配货管理
        </h1>
      </div>
      <div class="header-actions">
        <el-button @click="$router.push('/distribution/history')">
          <el-icon><Document /></el-icon> 识别历史
        </el-button>
        <el-button @click="refreshAll">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background:#3b82f6">📦</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.inventory?.total || 0 }}</div>
            <div class="stat-label">库存批次</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background:#22c55e">✅</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.inventory?.available || 0 }}</div>
            <div class="stat-label">可用库存</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background:#f59e0b">📋</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.orders?.total || 0 }}</div>
            <div class="stat-label">配货单</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background:#ef4444">⏳</div>
          <div class="stat-info">
            <div class="stat-value">{{ (stats.orders?.draft || 0) + (stats.orders?.confirmed || 0) }}</div>
            <div class="stat-label">待处理订单</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 选项卡 -->
    <el-card class="main-card">
      <el-tabs v-model="activeTab">
        <!-- 库存管理 -->
        <el-tab-pane label="库存管理" name="inventory">
          <div class="toolbar">
            <el-input v-model="invKeyword" placeholder="搜索批号、品级、规格..." prefix-icon="Search" clearable style="width:280px" @input="loadInventory" />
            <el-select v-model="invGrade" placeholder="品级" clearable style="width:120px" @change="loadInventory">
              <el-option label="Ni9996" value="Ni9996" />
              <el-option label="Ni9990" value="Ni9990" />
              <el-option label="Ni9980" value="Ni9980" />
              <el-option label="Ni9950" value="Ni9950" />
            </el-select>
            <el-select v-model="invStatus" placeholder="状态" clearable style="width:120px" @change="loadInventory">
              <el-option label="可用" value="available" />
              <el-option label="已锁定" value="reserved" />
              <el-option label="已发货" value="shipped" />
            </el-select>
            <el-button type="success" @click="openAddInventory">
              <el-icon><Plus /></el-icon> 新增库存
            </el-button>
          </div>

          <el-table :data="inventoryList" v-loading="invLoading" stripe border>
            <el-table-column label="批号" prop="batchNo" width="140" />
            <el-table-column label="品级" width="100">
              <template #default="{ row }">
                <el-tag :type="getGradeType(row.grade)">{{ row.grade }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="规格" prop="specification" width="100" />
            <el-table-column label="重量 (kg)" width="110" align="right">
              <template #default="{ row }">{{ Number(row.weight).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="片数" prop="pieceCount" width="80" align="right" />
            <el-table-column label="位置" prop="location" width="120" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="来源" width="80">
              <template #default="{ row }">
                <el-tag size="small" v-if="row.sourceType === 'ai'">AI</el-tag>
                <el-tag size="small" type="info" v-else>手动</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="160">
              <template #default="{ row }">
                <el-button link type="primary" @click="openEditInventory(row)">编辑</el-button>
                <el-popconfirm title="确定删除？" @confirm="handleDeleteInventory(row)">
                  <template #reference><el-button link type="danger">删除</el-button></template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="invPage" v-model:page-size="invPageSize"
            :total="invTotal" :page-sizes="[10,20,50,100]"
            layout="total, sizes, prev, pager, next"
            class="pagination" @change="loadInventory"
          />
        </el-tab-pane>

        <!-- 配货单管理 -->
        <el-tab-pane label="配货单" name="orders">
          <div class="toolbar">
            <el-select v-model="orderStatus" placeholder="状态" clearable style="width:130px" @change="loadOrders">
              <el-option label="草稿" value="draft" />
              <el-option label="已确认" value="confirmed" />
              <el-option label="运输中" value="shipping" />
              <el-option label="已发货" value="shipped" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
            <el-button type="danger" plain size="small" :disabled="selectedOrders.length===0" @click="batchDeleteOrders">
              <el-icon><Delete /></el-icon> 批量删除 ({{ selectedOrders.length }})
            </el-button>
            <el-button type="primary" @click="openCreateOrder">
              <el-icon><Plus /></el-icon> 新建配货单
            </el-button>
          </div>

          <el-table :data="orderList" v-loading="orderLoading" stripe border @selection-change="sel => selectedOrders=sel">
            <el-table-column type="selection" width="50" />
            <el-table-column prop="orderNo" label="配货单号" width="180" />
            <el-table-column prop="customerName" label="客户" width="130" />
            <el-table-column prop="targetGrade" label="目标品级" width="100" />
            <el-table-column label="总重量(kg)" width="110" align="right">
              <template #default="{ row }">{{ row.totalWeight ? Number(row.totalWeight).toFixed(2) : '-' }}</template>
            </el-table-column>
            <el-table-column prop="totalPieces" label="总片数" width="80" align="right" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getOrderStatusType(row.status)">{{ getOrderStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="160">
              <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="300">
              <template #default="{ row }">
                <el-button link type="primary" @click="viewOrder(row)">查看</el-button>
                <el-button link type="warning" v-if="row.status==='draft'" @click="confirmOrder(row)">确认</el-button>
                <el-button link type="success" v-if="row.status==='confirmed'" @click="shipOrder(row)">发货</el-button>
                <el-button link type="info" v-if="row.status==='shipping'" @click="deliverOrder(row)">送达</el-button>
                <el-button link type="danger" v-if="row.status==='draft'" @click="cancelOrder(row)">取消</el-button>
                <el-popconfirm title="确定删除？" @confirm="deleteOrder(row)">
                  <template #reference><el-button link type="danger">删除</el-button></template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="orderPage" v-model:page-size="orderPageSize"
            :total="orderTotal" :page-sizes="[10,20,50]"
            layout="total, sizes, prev, pager, next"
            class="pagination" @change="loadOrders"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 新增/编辑库存对话框 -->
    <el-dialog v-model="showInvDialog" :title="editingInvId ? '编辑库存' : '新增库存'" width="900px" :close-on-click-modal="false">
      <!-- AI 拍照识别区域（仅新增模式显示） -->
      <div v-if="!editingInvId" class="ai-recognize-section">
        <el-alert title="🤖 AI 智能识别" description="上传库存计量报表照片，自动识别包号、块数、重量等信息" type="info" :closable="false" show-icon />

        <el-upload ref="uploadRef" :action="''" :auto-upload="true" :before-upload="beforeAIUpload" :http-request="handleCustomUpload" name="image" accept="image/*" drag :show-file-list="false">
          <el-icon :size="48" style="color:#409eff"><PictureFilled /></el-icon>
          <div class="upload-text">拖拽文件到此处或 <em>点击上传</em></div>
          <template #tip><div class="upload-tip">支持 jpg/png 格式，不超过 10MB</div></template>
        </el-upload>

        <!-- AI 识别结果预览 -->
        <div v-if="aiRecognizedData.length > 0" class="ai-preview">
          <el-divider style="margin:16px 0">AI 识别结果（{{ aiRecognizedData.length }} 条）</el-divider>
          <div class="preview-actions">
            <el-checkbox v-model="selectAll" @change="handleSelectAllChange">全选</el-checkbox>
            <el-button type="primary" size="small" @click="batchImportAll" :disabled="selectedRecords.length===0">批量导入（{{ selectedRecords.length }} 条）</el-button>
          </div>
          <el-table :data="paginatedData" max-height="400" border size="small" @selection-change="sel=>selectedRecords=sel">
            <el-table-column type="selection" width="50" />
            <el-table-column prop="packageNo" label="包号" width="70" align="center" />
            <el-table-column prop="pieceCount" label="块数" width="70" align="right" />
            <el-table-column prop="netWeight" label="净重(kg)" width="100" align="right" />
            <el-table-column prop="grade" label="牌号" width="90" align="center">
              <template #default="{ row }"><el-tag size="small" :type="getGradeType(row.grade)">{{ row.grade }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="batchNo" label="批号" width="130" />
            <el-table-column label="操作" width="170" fixed="right">
              <template #default="{ $index }">
                <el-button link type="primary" size="small" @click="quickAddRecord($index)">导入</el-button>
                <el-button link type="warning" size="small" @click="removeAIRecord($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination v-model:current-page="aiPage" v-model:page-size="aiPageSize" :page-sizes="[10,20,50]" :total="aiRecognizedData.length" layout="total, sizes, prev, pager, next" class="ai-pagination" />
        </div>

        <!-- 识别进度 -->
        <div v-if="showRecognizing" class="recognizing-toast">
          <div class="toast-content"><el-icon :size="24"><Loading /></el-icon><div>{{ recognizingDetail }}</div></div>
          <el-progress :percentage="recognizeProgress" :stroke-width="4" :show-text="false" />
        </div>

        <el-divider />
      </div>

      <!-- 手动表单 -->
      <el-form :model="invForm" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="批号" required>
              <el-input v-model="invForm.batchNo" placeholder="如 B20260414001" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="品级" required>
              <el-select v-model="invForm.grade" placeholder="选择品级" style="width:100%">
                <el-option label="Ni9996" value="Ni9996" />
                <el-option label="Ni9990" value="Ni9990" />
                <el-option label="Ni9980" value="Ni9980" />
                <el-option label="Ni9950" value="Ni9950" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规格">
              <el-input v-model="invForm.specification" placeholder="如 99.96%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="重量 (kg)" required>
              <el-input-number v-model="invForm.weight" :min="0" :precision="3" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="片数" required>
              <el-input-number v-model="invForm.pieceCount" :min="0" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="存放位置">
              <el-input v-model="invForm.location" placeholder="如 A区-01排" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="镍含量 (%)">
              <el-input-number v-model="invForm.nickelContent" :min="0" :max="100" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="检测日期">
              <el-date-picker v-model="invForm.inspectionDate" type="date" placeholder="选择日期" style="width:100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="质量证明书">
              <el-input v-model="invForm.certificateNo" placeholder="编号（可选）" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="invForm.remark" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showInvDialog=false">取消</el-button>
        <el-button type="primary" @click="submitInventory" :loading="invSubmitting">保存</el-button>
      </template>
    </el-dialog>

    <!-- 新建配货单对话框 -->
    <el-dialog v-model="showOrderDialog" title="新建配货单" width="900px" :close-on-click-modal="false">
      <el-form :model="orderForm" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="客户" required>
              <el-select v-model="orderForm.customerId" filterable placeholder="选择客户" style="width:100%" @change="onCustomerChange">
                <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目标品级">
              <el-select v-model="orderForm.targetGrade" placeholder="选择品级" style="width:100%">
                <el-option label="Ni9996" value="Ni9996" />
                <el-option label="Ni9990" value="Ni9990" />
                <el-option label="Ni9980" value="Ni9980" />
                <el-option label="Ni9950" value="Ni9950" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="orderForm.remark" placeholder="可选" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider>选择库存</el-divider>
        <el-table :data="availableStock" @selection-change="sel => selectedStock=sel" border>
          <el-table-column type="selection" width="50" />
          <el-table-column prop="batchNo" label="批号" width="140" />
          <el-table-column label="品级" width="100">
            <template #default="{ row }"><el-tag size="small" :type="getGradeType(row.grade)">{{ row.grade }}</el-tag></template>
          </el-table-column>
          <el-table-column label="重量(kg)" width="100" align="right">
            <template #default="{ row }">{{ Number(row.weight).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="pieceCount" label="片数" width="80" align="right" />
          <el-table-column prop="location" label="位置" width="120" />
        </el-table>

        <div class="order-summary" style="margin-top:16px">
          <el-descriptions :column="3" border>
            <el-descriptions-item label="已选批次">{{ selectedStock.length }}</el-descriptions-item>
            <el-descriptions-item label="总重量">{{ orderTotalWeight.toFixed(2) }} kg</el-descriptions-item>
            <el-descriptions-item label="总片数">{{ orderTotalPieces }} 片</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showOrderDialog=false">取消</el-button>
        <el-button type="primary" @click="submitOrder" :disabled="selectedStock.length===0" :loading="orderSubmitting">创建配货单</el-button>
      </template>
    </el-dialog>

    <!-- 配货单详情对话框 -->
    <el-dialog v-model="showOrderDetail" title="配货单详情" width="900px">
      <el-descriptions v-if="currentOrder" :column="3" border>
        <el-descriptions-item label="配货单号">{{ currentOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ currentOrder.customerName || currentOrder.customer?.name }}</el-descriptions-item>
        <el-descriptions-item label="目标品级">{{ currentOrder.targetGrade || '-' }}</el-descriptions-item>
        <el-descriptions-item label="总重量">{{ currentOrder.totalWeight ? Number(currentOrder.totalWeight).toFixed(2)+' kg' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="总片数">{{ currentOrder.totalPieces || 0 }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getOrderStatusType(currentOrder.status)">{{ getOrderStatusLabel(currentOrder.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="司机">{{ currentOrder.driverName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="车牌号">{{ currentOrder.vehicleNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ fmtDate(currentOrder.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="3">{{ currentOrder.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider>配货明细</el-divider>
      <el-table :data="currentOrder?.items || []" border>
        <el-table-column label="批号" width="140">
          <template #default="{ row }">{{ row.stock?.batchNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="品级" width="100">
          <template #default="{ row }"><el-tag size="small" :type="getGradeType(row.stock?.grade)">{{ row.stock?.grade }}</el-tag></template>
        </el-table-column>
        <el-table-column label="配货重量(kg)" width="120" align="right">
          <template #default="{ row }">{{ row.weight ? Number(row.weight).toFixed(2) : '-' }}</template>
        </el-table-column>
        <el-table-column label="配货片数" width="100" align="right">
          <template #default="{ row }">{{ row.pieceCount || 0 }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 发货对话框 -->
    <el-dialog v-model="showShipDialog" title="发货确认" width="500px">
      <el-form :model="shipForm" label-width="80px">
        <el-form-item label="司机">
          <el-input v-model="shipForm.driverName" placeholder="司机姓名" />
        </el-form-item>
        <el-form-item label="车牌号">
          <el-input v-model="shipForm.vehicleNo" placeholder="如 京A12345" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showShipDialog=false">取消</el-button>
        <el-button type="primary" @click="confirmShip" :loading="shipSubmitting">确认发货</el-button>
      </template>
    </el-dialog>

    <!-- 客户管理对话框 -->
    <el-dialog v-model="showCustomerDialog" title="客户管理" width="600px">
      <div style="margin-bottom:12px">
        <el-button type="primary" size="small" @click="openAddCustomer"><el-icon><Plus /></el-icon> 新增客户</el-button>
      </div>
      <el-table :data="customers" border>
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="phone" label="电话" width="140" />
        <el-table-column prop="contact" label="联系人" width="120" />
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button link type="danger" @click="deleteCustomer(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 新增客户对话框 -->
    <el-dialog v-model="showAddCustomerDialog" title="新增客户" width="500px" append-to-body>
      <el-form :model="customerForm" label-width="80px">
        <el-form-item label="名称" required><el-input v-model="customerForm.name" /></el-form-item>
        <el-form-item label="联系人"><el-input v-model="customerForm.contact" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="customerForm.phone" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="customerForm.address" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddCustomerDialog=false">取消</el-button>
        <el-button type="primary" @click="submitCustomer">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ShoppingCart, Document, Refresh, Plus, Delete, Loading, PictureFilled } from '@element-plus/icons-vue'
import * as distApi from '@/api/distribution'

// ==================== 状态 ====================
const activeTab = ref('inventory')
const stats = ref<any>({ inventory: {}, orders: {} })
const customers = ref<any[]>([])

// 库存
const invLoading = ref(false)
const inventoryList = ref<any[]>([])
const invKeyword = ref('')
const invGrade = ref('')
const invStatus = ref('')
const invPage = ref(1)
const invPageSize = ref(20)
const invTotal = ref(0)

// 配货单
const orderLoading = ref(false)
const orderList = ref<any[]>([])
const orderStatus = ref('')
const orderPage = ref(1)
const orderPageSize = ref(20)
const orderTotal = ref(0)
const selectedOrders = ref<any[]>([])

// 库存对话框
const showInvDialog = ref(false)
const editingInvId = ref<number | null>(null)
const invSubmitting = ref(false)
const invForm = reactive<any>({
  batchNo: '', grade: '', specification: '', weight: 0, pieceCount: 0,
  location: '', nickelContent: null, inspectionDate: null, certificateNo: '', remark: ''
})

// 配货单对话框
const showOrderDialog = ref(false)
const orderSubmitting = ref(false)
const orderForm = reactive<any>({ customerId: null, targetGrade: '', remark: '' })
const availableStock = ref<any[]>([])
const selectedStock = ref<any[]>([])

// 订单详情
const showOrderDetail = ref(false)
const currentOrder = ref<any>(null)

// 发货对话框
const showShipDialog = ref(false)
const shipSubmitting = ref(false)
const shippingOrderId = ref<number | null>(null)
const shipForm = reactive({ driverName: '', vehicleNo: '' })

// 客户对话框
const showCustomerDialog = ref(false)
const showAddCustomerDialog = ref(false)
const customerForm = reactive({ name: '', contact: '', phone: '', address: '' })

// AI 识别
const showRecognizing = ref(false)
const recognizeProgress = ref(0)
const recognizingDetail = ref('')
const aiRecognizedData = ref<any[]>([])
const selectedRecords = ref<any[]>([])
const selectAll = ref(false)
const aiPage = ref(1)
const aiPageSize = ref(10)

// ==================== 计算属性 ====================
const paginatedData = computed(() => {
  const start = (aiPage.value - 1) * aiPageSize.value
  return aiRecognizedData.value.slice(start, start + aiPageSize.value)
})

const orderTotalWeight = computed(() =>
  selectedStock.value.reduce((s, i) => s + Number(i.weight || 0), 0)
)

const orderTotalPieces = computed(() =>
  selectedStock.value.reduce((s, i) => s + Number(i.pieceCount || 0), 0)
)

// ==================== 数据加载 ====================
const loadStats = async () => {
  try {
    const res = await distApi.getStatistics()
    stats.value = res
  } catch {}
}

const loadInventory = async () => {
  invLoading.value = true
  try {
    const res: any = await distApi.getInventory({
      page: invPage.value, limit: invPageSize.value,
      keyword: invKeyword.value || undefined,
      grade: invGrade.value || undefined,
      status: invStatus.value || undefined,
    })
    inventoryList.value = res.data || []
    invTotal.value = res.total || 0
  } catch (e: any) {
    ElMessage.error('加载库存失败：' + (e.response?.data?.message || e.message))
  } finally {
    invLoading.value = false
  }
}

const loadOrders = async () => {
  orderLoading.value = true
  try {
    const res: any = await distApi.getOrders({
      page: orderPage.value, limit: orderPageSize.value,
      status: orderStatus.value || undefined,
    })
    orderList.value = res.data || []
    orderTotal.value = res.total || 0
  } catch (e: any) {
    ElMessage.error('加载订单失败：' + (e.response?.data?.message || e.message))
  } finally {
    orderLoading.value = false
  }
}

const loadCustomers = async () => {
  try {
    const res = await distApi.getCustomers()
    customers.value = res as any[]
  } catch {}
}

const refreshAll = async () => {
  await Promise.all([loadStats(), loadInventory(), loadOrders(), loadCustomers()])
  ElMessage.success('刷新完成')
}

// ==================== 库存操作 ====================
const openAddInventory = () => {
  editingInvId.value = null
  Object.assign(invForm, {
    batchNo: '', grade: '', specification: '', weight: 0, pieceCount: 0,
    location: '', nickelContent: null, inspectionDate: null, certificateNo: '', remark: ''
  })
  aiRecognizedData.value = []
  showInvDialog.value = true
}

const openEditInventory = (row: any) => {
  editingInvId.value = row.id
  Object.assign(invForm, { ...row })
  showInvDialog.value = true
}

const submitInventory = async () => {
  if (!invForm.batchNo || !invForm.grade) {
    ElMessage.warning('请填写批号和品级')
    return
  }
  invSubmitting.value = true
  try {
    if (editingInvId.value) {
      await distApi.updateInventory(editingInvId.value, invForm)
      ElMessage.success('更新成功')
    } else {
      await distApi.createInventory(invForm)
      ElMessage.success('创建成功')
    }
    showInvDialog.value = false
    loadInventory()
    loadStats()
  } catch (e: any) {
    ElMessage.error('保存失败：' + (e.response?.data?.message || e.message))
  } finally {
    invSubmitting.value = false
  }
}

const handleDeleteInventory = async (row: any) => {
  try {
    await distApi.deleteInventory(row.id)
    ElMessage.success('删除成功')
    loadInventory()
    loadStats()
  } catch (e: any) {
    ElMessage.error('删除失败：' + (e.response?.data?.message || e.message))
  }
}

// ==================== AI 识别 ====================
const beforeAIUpload = (file: File) => {
  if (!file.type.startsWith('image/')) {
    ElMessage.error('只支持图片文件')
    return false
  }
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('图片大小不超过 10MB')
    return false
  }
  return true
}

const handleCustomUpload = async ({ file }: any) => {
  showRecognizing.value = true
  recognizeProgress.value = 10
  recognizingDetail.value = '正在上传图片...'

  setTimeout(() => { recognizeProgress.value = 40; recognizingDetail.value = 'AI 正在识别中...' }, 500)

  try {
    const result = await distApi.recognizeInventory(file)
    recognizeProgress.value = 90
    recognizingDetail.value = '识别完成，正在解析...'

    if (result.success) {
      aiRecognizedData.value = result.data || []
      ElMessage.success(`识别成功，共 ${result.count} 条记录`)
    } else {
      ElMessage.error('识别失败：' + (result.error || '未知错误'))
    }
  } catch (e: any) {
    ElMessage.error('识别失败：' + (e.response?.data?.message || e.message))
  } finally {
    recognizeProgress.value = 100
    setTimeout(() => { showRecognizing.value = false }, 500)
  }
}

const handleSelectAllChange = (val: boolean) => {
  selectedRecords.value = val ? [...paginatedData.value] : []
}

const batchImportAll = async () => {
  if (!selectedRecords.value.length) return
  try {
    const importData = selectedRecords.value.map((r: any) => ({
      batchNo: r.batchNo || `B${Date.now()}`,
      grade: r.grade || 'Ni9996',
      specification: `${r.grade || 'Ni9996'}`,
      weight: r.netWeight || 0,
      pieceCount: r.pieceCount || 0,
      sourceType: 'ai',
    }))
    await distApi.batchCreateInventory(importData)
    ElMessage.success(`成功导入 ${importData.length} 条记录`)
    aiRecognizedData.value = aiRecognizedData.value.filter((_: any, i: number) => !selectedRecords.value.includes(paginatedData.value[i]))
    selectedRecords.value = []
    loadInventory()
    loadStats()
  } catch (e: any) {
    ElMessage.error('导入失败：' + (e.response?.data?.message || e.message))
  }
}

const quickAddRecord = (index: number) => {
  const r = paginatedData.value[index]
  if (!r) return
  Object.assign(invForm, {
    batchNo: r.batchNo || invForm.batchNo,
    grade: r.grade || invForm.grade,
    weight: r.netWeight || 0,
    pieceCount: r.pieceCount || 0,
    specification: r.grade || 'Ni9996',
  })
}

const removeAIRecord = (index: number) => {
  const globalIndex = (aiPage.value - 1) * aiPageSize.value + index
  aiRecognizedData.value.splice(globalIndex, 1)
}

// ==================== 配货单操作 ====================
const openCreateOrder = async () => {
  await loadCustomers()
  // 加载可用库存
  try {
    const res: any = await distApi.getInventory({ limit: 100, status: 'available' })
    availableStock.value = res.data || []
  } catch {}
  Object.assign(orderForm, { customerId: null, targetGrade: '', remark: '' })
  selectedStock.value = []
  showOrderDialog.value = true
}

const onCustomerChange = () => {
  const c = customers.value.find(x => x.id === orderForm.customerId)
  if (c) orderForm.customerName = c.name
}

const submitOrder = async () => {
  if (!orderForm.customerId) {
    ElMessage.warning('请选择客户')
    return
  }
  if (!selectedStock.value.length) {
    ElMessage.warning('请选择库存')
    return
  }
  orderSubmitting.value = true
  try {
    const items = selectedStock.value.map(s => ({
      stockId: s.id,
      weight: Number(s.weight),
      pieceCount: Number(s.pieceCount),
    }))
    await distApi.createOrder({
      customerId: orderForm.customerId,
      customerName: orderForm.customerName,
      targetGrade: orderForm.targetGrade,
      remark: orderForm.remark,
      items,
    })
    ElMessage.success('创建成功')
    showOrderDialog.value = false
    loadOrders()
    loadStats()
  } catch (e: any) {
    ElMessage.error('创建失败：' + (e.response?.data?.message || e.message))
  } finally {
    orderSubmitting.value = false
  }
}

const viewOrder = async (row: any) => {
  try {
    const res = await distApi.getOrderById(row.id)
    currentOrder.value = res
    showOrderDetail.value = true
  } catch (e: any) {
    ElMessage.error('加载失败：' + (e.response?.data?.message || e.message))
  }
}

const confirmOrder = async (row: any) => {
  try {
    await ElMessageBox.confirm('确认此配货单？', '确认', { type: 'warning' })
    await distApi.confirmOrder(row.id)
    ElMessage.success('已确认')
    loadOrders()
    loadStats()
  } catch {}
}

const shipOrder = (row: any) => {
  shippingOrderId.value = row.id
  shipForm.driverName = ''
  shipForm.vehicleNo = ''
  showShipDialog.value = true
}

const confirmShip = async () => {
  if (!shippingOrderId.value) return
  shipSubmitting.value = true
  try {
    await distApi.shipOrder(shippingOrderId.value, shipForm)
    ElMessage.success('已发货')
    showShipDialog.value = false
    loadOrders()
    loadStats()
  } catch (e: any) {
    ElMessage.error('发货失败：' + (e.response?.data?.message || e.message))
  } finally {
    shipSubmitting.value = false
  }
}

const deliverOrder = async (row: any) => {
  try {
    await ElMessageBox.confirm('确认已送达？', '送达', { type: 'warning' })
    await distApi.deliverOrder(row.id)
    ElMessage.success('已送达')
    loadOrders()
    loadStats()
  } catch {}
}

const cancelOrder = async (row: any) => {
  try {
    await ElMessageBox.confirm('取消此配货单？已锁定的库存将释放。', '取消', { type: 'warning' })
    await distApi.cancelOrder(row.id)
    ElMessage.success('已取消')
    loadOrders()
    loadStats()
  } catch {}
}

const deleteOrder = async (row: any) => {
  try {
    await distApi.deleteOrder(row.id)
    ElMessage.success('删除成功')
    loadOrders()
    loadStats()
  } catch (e: any) {
    ElMessage.error('删除失败：' + (e.response?.data?.message || e.message))
  }
}

const batchDeleteOrders = async () => {
  if (!selectedOrders.value.length) return
  try {
    await ElMessageBox.confirm(`确定删除 ${selectedOrders.value.length} 个配货单？`, '批量删除', { type: 'warning' })
    const ids = selectedOrders.value.map(r => r.id)
    await distApi.batchDeleteOrders(ids)
    ElMessage.success(`已删除 ${ids.length} 个`)
    selectedOrders.value = []
    loadOrders()
    loadStats()
  } catch {}
}

// ==================== 客户操作 ====================
const openAddCustomer = () => {
  Object.assign(customerForm, { name: '', contact: '', phone: '', address: '' })
  showAddCustomerDialog.value = true
}

const submitCustomer = async () => {
  if (!customerForm.name) {
    ElMessage.warning('请填写客户名称')
    return
  }
  try {
    await distApi.createCustomer(customerForm)
    ElMessage.success('添加成功')
    showAddCustomerDialog.value = false
    loadCustomers()
  } catch (e: any) {
    ElMessage.error('添加失败：' + (e.response?.data?.message || e.message))
  }
}

const deleteCustomer = async (row: any) => {
  try {
    await distApi.deleteCustomer(row.id)
    ElMessage.success('删除成功')
    loadCustomers()
  } catch (e: any) {
    ElMessage.error('删除失败：' + (e.response?.data?.message || e.message))
  }
}

// ==================== 工具函数 ====================
const getGradeType = (g: string) => ({ Ni9996:'success', Ni9990:'primary', Ni9980:'warning', Ni9950:'info' }[g] || 'info')
const getStatusType = (s: string) => ({ available:'success', reserved:'warning', shipped:'info' }[s] || 'info')
const getStatusLabel = (s: string) => ({ available:'可用', reserved:'已锁定', shipped:'已发货' }[s] || s)
const getOrderStatusType = (s: string) => ({ draft:'info', confirmed:'primary', shipping:'warning', shipped:'success', cancelled:'danger' }[s] || 'info')
const getOrderStatusLabel = (s: string) => ({ draft:'草稿', confirmed:'已确认', shipping:'运输中', shipped:'已发货', cancelled:'已取消' }[s] || s)
const fmtDate = (d: string) => d ? new Date(d).toLocaleString('zh-CN') : '-'

// ==================== 初始化 ====================
onMounted(() => {
  refreshAll()
})

watch(activeTab, () => {
  if (activeTab.value === 'inventory') loadInventory()
  if (activeTab.value === 'orders') loadOrders()
})
</script>

<style scoped>
.distribution-page { padding: 24px; background: #f5f7fa; min-height: 100vh; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { margin: 0; display: flex; align-items: center; gap: 8px; font-size: 20px; font-weight: 600; color: #1e293b; }
.header-actions { display: flex; gap: 8px; }

.stats-row { margin-bottom: 24px; }
.stat-card { display: flex; align-items: center; gap: 16px; padding: 20px; background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
.stat-info { display: flex; flex-direction: column; }
.stat-value { font-size: 24px; font-weight: 700; color: #1e293b; }
.stat-label { font-size: 13px; color: #94a3b8; margin-top: 2px; }

.toolbar { display: flex; gap: 8px; margin-bottom: 16px; align-items: center; flex-wrap: wrap; }
.main-card { border-radius: 12px; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }

.ai-recognize-section { margin-bottom: 16px; }
.upload-text { margin: 12px 0 4px; font-size: 14px; color: #606266; }
.upload-tip { font-size: 12px; color: #909399; margin-top: 8px; }
.ai-preview { margin-top: 16px; }
.preview-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.recognizing-toast { position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,.8); color: #fff; padding: 16px 24px; border-radius: 12px; z-index: 9999; min-width: 260px; text-align: center; }
.toast-content { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }

.order-summary { padding: 12px 0; }
</style>
