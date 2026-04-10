<template>
  <div class="production-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon :size="24"><List /></el-icon>
          生产管理
        </h1>
        <p class="page-desc">镍冶炼厂成品车间产品动态管理</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="openDashboard">
          <el-icon><DataAnalysis /></el-icon>
          数据看板
        </el-button>
      </div>
    </div>

    <!-- 选项卡 -->
    <el-card class="main-card">
      <el-tabs v-model="activeTab" class="production-tabs">
        <!-- 入库管理 -->
        <el-tab-pane label="入库管理" name="inbound">
          <div class="tab-toolbar">
            <div class="toolbar-left">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 240px"
                @change="loadInboundRecords"
              />
              <el-select
                v-model="filterWorkshop"
                placeholder="选择车间"
                clearable
                style="width: 150px; margin-left: 12px"
                @change="loadInboundRecords"
              >
                <el-option
                  v-for="w in workshops"
                  :key="w.id"
                  :label="w.workshopName"
                  :value="w.id"
                />
              </el-select>
              <el-select
                v-model="filterProductCode"
                placeholder="产品类型"
                clearable
                style="width: 120px; margin-left: 12px"
                @change="loadInboundRecords"
              >
                <el-option label="9996" value="9996" />
                <el-option label="9997" value="9997" />
                <el-option label="9990" value="9990" />
                <el-option label="9950" value="9950" />
                <el-option label="9920" value="9920" />
                <el-option label="高合金" value="高合金" />
                <el-option label="含硫" value="含硫" />
              </el-select>
              <el-select
                v-model="filterSpecType"
                placeholder="产品规格"
                clearable
                style="width: 120px; margin-left: 12px"
                @change="loadInboundRecords"
              >
                <el-option label="正板" value="正板" />
                <el-option label="镍条" value="镍条" />
                <el-option label="小块镍" value="小块镍" />
                <el-option label="大板" value="大板" />
              </el-select>
            </div>
            <div class="toolbar-right">
              <el-button type="primary" @click="showInboundDialog = true">
                <el-icon><Plus /></el-icon>
                新增入库
              </el-button>
            </div>
          </div>

          <el-table :data="inboundList" v-loading="loading" stripe border class="data-table">
            <el-table-column prop="recordDate" label="日期" width="120">
              <template #default="{ row }">{{ formatDate(row.recordDate) }}</template>
            </el-table-column>
            <el-table-column label="车间" width="120">
              <template #default="{ row }">{{ row.workshop?.workshopName || '-' }}</template>
            </el-table-column>
            <el-table-column label="产品" width="180">
              <template #default="{ row }">
                {{ row.productSpec?.productName }} {{ row.productSpec?.specType }} {{ row.productSpec?.specDetail }}
              </template>
            </el-table-column>
            <el-table-column prop="totalWeight" label="总重量 (吨)" width="100" align="right" />
            <el-table-column prop="exportWeight" label="出口 (吨)" width="90" align="right" />
            <el-table-column prop="domesticWeight" label="国内 (吨)" width="90" align="right" />
            <el-table-column label="操作" fixed="right" width="180">
              <template #default="{ row }">
                <el-button link type="primary" @click="editInbound(row)">编辑</el-button>
                <el-button link type="danger" @click="deleteInbound(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="inboundPage"
            v-model:page-size="inboundPageSize"
            :total="inboundTotal"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            class="pagination"
            @change="loadInboundRecords"
          />
        </el-tab-pane>

        <!-- 发运管理 -->
        <el-tab-pane label="发运管理" name="shipping">
          <div class="tab-toolbar">
            <div class="toolbar-left">
              <el-date-picker
                v-model="shippingDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 240px"
                @change="handleShippingDateChange"
              />
              <el-select
                v-model="filterShippingWorkshop"
                placeholder="选择车间"
                clearable
                style="width: 150px; margin-left: 12px"
                @change="loadShippingRecords"
              >
                <el-option
                  v-for="w in workshops"
                  :key="w.id"
                  :label="w.workshopName"
                  :value="w.id"
                />
              </el-select>
              <el-select
                v-model="filterShippingProductCode"
                placeholder="产品类型"
                clearable
                style="width: 120px; margin-left: 12px"
                @change="loadShippingRecords"
              >
                <el-option label="9996" value="9996" />
                <el-option label="9997" value="9997" />
                <el-option label="9990" value="9990" />
                <el-option label="9950" value="9950" />
                <el-option label="9920" value="9920" />
              </el-select>
            </div>
            <div class="toolbar-right">
              <el-button type="primary" @click="showShippingDialog = true">
                <el-icon><Plus /></el-icon>
                新增发运
              </el-button>
            </div>
          </div>

          <el-table :data="shippingList" v-loading="loading" stripe border class="data-table">
            <el-table-column prop="shipDate" label="日期" width="120">
              <template #default="{ row }">{{ formatDate(row.shipDate) }}</template>
            </el-table-column>
            <el-table-column label="车间" width="120">
              <template #default="{ row }">{{ row.workshop?.workshopName || '-' }}</template>
            </el-table-column>
            <el-table-column label="产品" width="180">
              <template #default="{ row }">
                {{ row.productSpec?.productName }} {{ row.productSpec?.specType }}
              </template>
            </el-table-column>
            <el-table-column prop="totalWeight" label="总重量 (吨)" width="100" align="right" />
            <el-table-column prop="trainSectionCount" label="火车 (节)" width="80" align="right" />
            <el-table-column prop="containerCount" label="集装箱 (箱)" width="100" align="right" />
            <el-table-column prop="truckCount" label="自提 (车)" width="80" align="right" />
            <el-table-column label="操作" fixed="right" width="180">
              <template #default="{ row }">
                <el-button link type="primary" @click="editShipping(row)">编辑</el-button>
                <el-button link type="danger" @click="deleteShipping(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="shippingPage"
            v-model:page-size="shippingPageSize"
            :total="shippingTotal"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            class="pagination"
            @change="loadShippingRecords"
          />
        </el-tab-pane>

        <!-- 库存管理 -->
        <el-tab-pane label="库存管理" name="inventory">
          <div class="tab-toolbar">
            <div class="toolbar-left">
              <el-select
                v-model="filterInventoryWorkshop"
                placeholder="选择车间"
                clearable
                style="width: 150px"
                @change="loadInventory"
              >
                <el-option
                  v-for="w in workshops"
                  :key="w.id"
                  :label="w.workshopName"
                  :value="w.id"
                />
              </el-select>
              <el-select
                v-model="filterInventoryProductCode"
                placeholder="产品类型"
                clearable
                style="width: 120px; margin-left: 12px"
                @change="loadInventory"
              >
                <el-option label="9996" value="9996" />
                <el-option label="9997" value="9997" />
                <el-option label="9990" value="9990" />
                <el-option label="9950" value="9950" />
                <el-option label="9920" value="9920" />
              </el-select>
              <el-select
                v-model="filterInventorySpecType"
                placeholder="产品规格"
                clearable
                style="width: 120px; margin-left: 12px"
                @change="loadInventory"
              >
                <el-option label="正板" value="正板" />
                <el-option label="镍条" value="镍条" />
                <el-option label="小块镍" value="小块镍" />
              </el-select>
            </div>
            <div class="toolbar-right">
              <el-button type="primary" @click="showInventoryDialog = true">
                <el-icon><Plus /></el-icon>
                录入库存
              </el-button>
            </div>
          </div>

          <el-table :data="inventoryList" v-loading="loading" stripe border class="data-table">
            <el-table-column label="车间" width="120">
              <template #default="{ row }">{{ row.workshop?.workshopName || '-' }}</template>
            </el-table-column>
            <el-table-column label="产品" width="200">
              <template #default="{ row }">
                {{ row.productSpec?.productName }} {{ row.productSpec?.specType }} {{ row.productSpec?.specDetail }}
              </template>
            </el-table-column>
            <el-table-column prop="totalWeight" label="总库存 (吨)" width="100" align="right" />
            <el-table-column prop="exportWeight" label="出口 (吨)" width="90" align="right" />
            <el-table-column prop="domesticWeight" label="国内 (吨)" width="90" align="right" />
            <el-table-column label="操作" fixed="right" width="120">
              <template #default="{ row }">
                <el-button link type="primary" @click="editInventory(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 专用镍统计 -->
        <el-tab-pane label="专用镍统计" name="special">
          <div class="tab-toolbar">
            <div class="toolbar-left">
              <el-date-picker
                v-model="specialDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 240px"
                @change="loadSpecialNickelStats"
              />
            </div>
          </div>

          <el-table :data="specialList" v-loading="loading" stripe border class="data-table">
            <el-table-column prop="statDate" label="日期" width="120">
              <template #default="{ row }">{{ formatDate(row.statDate) }}</template>
            </el-table-column>
            <el-table-column prop="productType" label="产品类型" width="200" />
            <el-table-column prop="inboundWeight" label="入库 (吨)" width="90" align="right" />
            <el-table-column prop="shippingWeight" label="发运 (吨)" width="90" align="right" />
            <el-table-column prop="inventoryWeight" label="库存 (吨)" width="90" align="right" />
            <el-table-column label="操作" fixed="right" width="120">
              <template #default="{ row }">
                <el-button link type="primary" @click="editSpecial(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 统计报表 -->
        <el-tab-pane label="统计报表" name="stats">
          <div class="stats-section">
            <el-form :inline="true" :model="statsForm">
              <el-form-item label="统计类型">
                <el-select v-model="statsType" style="width: 120px">
                  <el-option label="日报" value="daily" />
                  <el-option label="月报" value="monthly" />
                  <el-option label="出口/国内" value="export" />
                </el-select>
              </el-form-item>
              <el-form-item label="日期" v-if="statsType === 'daily'">
                <el-date-picker
                  v-model="statsDate"
                  type="date"
                  placeholder="选择日期"
                  style="width: 180px"
                  @change="loadDailyStats"
                />
              </el-form-item>
              <el-form-item label="月份" v-if="statsType === 'monthly'">
                <el-date-picker
                  v-model="statsMonth"
                  type="month"
                  placeholder="选择月份"
                  style="width: 180px"
                  @change="loadMonthlyStats"
                />
              </el-form-item>
              <el-form-item label="日期范围" v-if="statsType === 'export'">
                <el-date-picker
                  v-model="exportDateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  style="width: 240px"
                  @change="loadExportStats"
                />
              </el-form-item>
            </el-form>
          </div>

          <!-- 日报统计 -->
          <div v-if="statsType === 'daily' && statsData">
            <el-descriptions title="日报统计" :column="4" border>
              <el-descriptions-item label="总入库">{{ statsData.totalWeight }} 吨</el-descriptions-item>
              <el-descriptions-item label="出口">{{ statsData.exportWeight }} 吨</el-descriptions-item>
              <el-descriptions-item label="国内">{{ statsData.domesticWeight }} 吨</el-descriptions-item>
            </el-descriptions>
            <el-table :data="statsData.inboundRecords" stripe border style="margin-top: 16px">
              <el-table-column prop="productSpec.productName" label="产品" />
              <el-table-column prop="totalWeight" label="重量 (吨)" align="right" />
              <el-table-column prop="exportWeight" label="出口 (吨)" align="right" />
              <el-table-column prop="domesticWeight" label="国内 (吨)" align="right" />
            </el-table>
          </div>

          <!-- 月报统计 -->
          <div v-if="statsType === 'monthly' && statsData">
            <el-descriptions title="月报统计" :column="4" border>
              <el-descriptions-item label="总入库">{{ statsData.totalWeight }} 吨</el-descriptions-item>
            </el-descriptions>
            <el-table :data="statsData.statsByProduct" stripe border style="margin-top: 16px">
              <el-table-column prop="productName" label="产品" />
              <el-table-column prop="specType" label="规格" />
              <el-table-column prop="totalWeight" label="总重量 (吨)" align="right" />
              <el-table-column prop="exportWeight" label="出口 (吨)" align="right" />
              <el-table-column prop="domesticWeight" label="国内 (吨)" align="right" />
            </el-table>
          </div>

          <!-- 出口/国内统计 -->
          <div v-if="statsType === 'export' && statsData">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-card>
                  <template #header>入库统计</template>
                  <el-descriptions :column="3" border>
                    <el-descriptions-item label="总计">{{ statsData.inbound.totalWeight }} 吨</el-descriptions-item>
                    <el-descriptions-item label="出口">{{ statsData.inbound.exportWeight }} 吨</el-descriptions-item>
                    <el-descriptions-item label="国内">{{ statsData.inbound.domesticWeight }} 吨</el-descriptions-item>
                  </el-descriptions>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card>
                  <template #header>发运统计</template>
                  <el-descriptions :column="3" border>
                    <el-descriptions-item label="总计">{{ statsData.shipping.totalWeight }} 吨</el-descriptions-item>
                    <el-descriptions-item label="出口">{{ statsData.shipping.exportWeight }} 吨</el-descriptions-item>
                    <el-descriptions-item label="国内">{{ statsData.shipping.domesticWeight }} 吨</el-descriptions-item>
                  </el-descriptions>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 入库对话框 -->
    <el-dialog v-model="showInboundDialog" :title="editingInboundId ? '编辑入库' : '新增入库'" width="900px">
      <el-form :model="inboundForm" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="日期" required>
              <el-date-picker
                v-model="inboundForm.recordDate"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车间" required>
              <el-select v-model="inboundForm.workshopId" placeholder="选择车间" style="width: 100%">
                <el-option v-for="w in workshops" :key="w.id" :label="w.workshopName" :value="w.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品" required>
              <el-select v-model="inboundForm.productSpecId" placeholder="选择产品" style="width: 100%">
                <el-option v-for="p in products" :key="p.id" :label="`${p.productName} ${p.specType} ${p.specDetail || ''}`" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="总包数">
              <el-input-number v-model="inboundForm.totalPackageCount" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="总重量 (吨)" required>
              <el-input-number v-model="inboundForm.totalWeight" :min="0" :precision="3" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出口包数">
              <el-input-number v-model="inboundForm.exportPackageCount" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出口重量 (吨)">
              <el-input-number v-model="inboundForm.exportWeight" :min="0" :precision="3" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="国内包数">
              <el-input-number v-model="inboundForm.domesticPackageCount" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="国内重量 (吨)">
              <el-input-number v-model="inboundForm.domesticWeight" :min="0" :precision="3" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="inboundForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showInboundDialog = false">取消</el-button>
        <el-button type="primary" @click="submitInboundForm">保存</el-button>
      </template>
    </el-dialog>

    <!-- 发运对话框 -->
    <el-dialog v-model="showShippingDialog" :title="editingShippingId ? '编辑发运' : '新增发运'" width="900px">
      <el-form :model="shippingForm" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="日期" required>
              <el-date-picker
                v-model="shippingForm.shipDate"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车间" required>
              <el-select v-model="shippingForm.workshopId" placeholder="选择车间" style="width: 100%">
                <el-option v-for="w in workshops" :key="w.id" :label="w.workshopName" :value="w.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品" required>
              <el-select v-model="shippingForm.productSpecId" placeholder="选择产品" style="width: 100%">
                <el-option v-for="p in products" :key="p.id" :label="`${p.productName} ${p.specType}`" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="总重量 (吨)" required>
              <el-input-number v-model="shippingForm.totalWeight" :min="0" :precision="3" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="火车节数">
              <el-input-number v-model="shippingForm.trainSectionCount" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="集装箱箱数">
              <el-input-number v-model="shippingForm.containerCount" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="自提车数">
              <el-input-number v-model="shippingForm.truckCount" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showShippingDialog = false">取消</el-button>
        <el-button type="primary" @click="submitShippingForm">保存</el-button>
      </template>
    </el-dialog>

    <!-- 库存对话框 -->
    <el-dialog v-model="showInventoryDialog" :title="'录入库存'" width="900px">
      <el-form :model="inventoryForm" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="日期" required>
              <el-date-picker
                v-model="inventoryForm.inventoryDate"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车间" required>
              <el-select v-model="inventoryForm.workshopId" placeholder="选择车间" style="width: 100%">
                <el-option v-for="w in workshops" :key="w.id" :label="w.workshopName" :value="w.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品" required>
              <el-select v-model="inventoryForm.productSpecId" placeholder="选择产品" style="width: 100%">
                <el-option v-for="p in products" :key="p.id" :label="`${p.productName} ${p.specType} ${p.specDetail || ''}`" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="总库存 (吨)" required>
              <el-input-number v-model="inventoryForm.totalWeight" :min="0" :precision="3" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出口库存 (吨)">
              <el-input-number v-model="inventoryForm.exportWeight" :min="0" :precision="3" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="国内库存 (吨)">
              <el-input-number v-model="inventoryForm.domesticWeight" :min="0" :precision="3" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showInventoryDialog = false">取消</el-button>
        <el-button type="primary" @click="submitInventoryForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { List, Plus, DataAnalysis } from '@element-plus/icons-vue'
import * as productionApi from '@/api/production'
import { debounce } from '@/utils/debounce'

const router = useRouter()

// 状态
const activeTab = ref('inbound')
const loading = ref(false)

// 基础数据
const workshops = ref([])
const products = ref([])

// 入库管理
const inboundList = ref([])
const inboundPage = ref(1)
const inboundPageSize = ref(20)
const inboundTotal = ref(0)
const dateRange = ref([])
const filterWorkshop = ref()
const filterProductCode = ref()
const filterSpecType = ref()
const showInboundDialog = ref(false)
const editingInboundId = ref()
const inboundForm = reactive({
  recordDate: '',
  workshopId: undefined,
  productSpecId: undefined,
  totalPackageCount: 0,
  totalWeight: 0,
  exportPackageCount: 0,
  exportWeight: 0,
  domesticPackageCount: 0,
  domesticWeight: 0,
  remark: '',
})

// 发运管理
const shippingList = ref([])
const shippingPage = ref(1)
const shippingPageSize = ref(20)
const shippingTotal = ref(0)
const shippingDateRange = ref([])
const filterShippingWorkshop = ref()
const filterShippingProductCode = ref()
const showShippingDialog = ref(false)
const editingShippingId = ref()
const shippingForm = reactive({
  shipDate: '',
  workshopId: undefined,
  productSpecId: undefined,
  totalWeight: 0,
  trainSectionCount: 0,
  containerCount: 0,
  truckCount: 0,
})

// 库存管理
const inventoryList = ref([])
const inventoryDate = ref(new Date())
const filterInventoryWorkshop = ref()
const filterInventoryProductCode = ref()
const filterInventorySpecType = ref()
const showInventoryDialog = ref(false)
const editingInventoryId = ref()
const inventoryForm = reactive({
  inventoryDate: '',
  workshopId: undefined,
  productSpecId: undefined,
  totalWeight: 0,
  exportWeight: 0,
  domesticWeight: 0,
})

// 专用镍统计
const specialList = ref([])
const specialDateRange = ref([])

// 统计报表
const statsType = ref('daily')
const statsDate = ref(new Date())
const statsMonth = ref(new Date())
const exportDateRange = ref([])
const statsData = ref(null)
const statsForm = reactive({})

// 工具函数
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

// 加载基础数据（带缓存）
const loadWorkshops = async () => {
  try {
    // 使用缓存，避免重复请求
    const res = await productionApi.getWorkshops()
    // 去重处理
    const data = res.data || res
    const uniqueData = Array.from(new Map(data.map(item => [item.id, item])).values())
    // 直接赋值，不使用 push 避免重复
    workshops.value = uniqueData
    console.log('✅ 车间数据已加载:', uniqueData.length, '条')
  } catch (error) {
    console.error('加载车间失败:', error)
  }
}

const loadProducts = async () => {
  try {
    // 使用缓存，避免重复请求
    const res = await productionApi.getProducts()
    // 去重处理
    const data = res.data || res
    const uniqueData = Array.from(new Map(data.map(item => [item.id, item])).values())
    // 直接赋值，不使用 push 避免重复
    products.value = uniqueData
    console.log('✅ 产品数据已加载:', uniqueData.length, '条')
  } catch (error) {
    console.error('加载产品失败:', error)
  }
}

// 入库管理
// 防抖版本的加载函数
const loadInboundRecords = debounce(async () => {
  loading.value = true
  try {
    const params: any = {
      page: inboundPage.value,
      limit: inboundPageSize.value,
    }
    if (filterWorkshop.value) {
      params.workshopId = filterWorkshop.value
    }
    if (filterProductCode.value) {
      params.productCode = filterProductCode.value
    }
    if (filterSpecType.value) {
      params.specType = filterSpecType.value
    }
    const res = await productionApi.getInboundRecords(params)
    inboundList.value = res.data || []
    inboundTotal.value = res.total || 0
  } catch (error: any) {
    console.error('加载入库记录失败:', error)
  } finally {
    loading.value = false
  }
}, 300)

const handleDateChange = () => {
  inboundPage.value = 1
  loadInboundRecords()
}

const editInbound = (row) => {
  editingInboundId.value = row.id
  inboundForm.recordDate = row.recordDate?.split('T')[0]
  inboundForm.workshopId = row.workshopId
  inboundForm.productSpecId = row.productSpecId
  inboundForm.totalPackageCount = row.totalPackageCount
  inboundForm.totalWeight = Number(row.totalWeight)
  inboundForm.exportPackageCount = row.exportPackageCount
  inboundForm.exportWeight = Number(row.exportWeight)
  inboundForm.domesticPackageCount = row.domesticPackageCount
  inboundForm.domesticWeight = Number(row.domesticWeight)
  inboundForm.remark = row.remark
  showInboundDialog.value = true
}

const submitInboundForm = async () => {
  try {
    if (!inboundForm.recordDate || !inboundForm.workshopId || !inboundForm.productSpecId) {
      ElMessage.warning('请填写必填项')
      return
    }
    if (editingInboundId.value) {
      await productionApi.updateInboundRecord(editingInboundId.value, inboundForm)
      ElMessage.success('更新成功')
    } else {
      await productionApi.createInboundRecord(inboundForm)
      ElMessage.success('创建成功')
    }
    showInboundDialog.value = false
    editingInboundId.value = undefined
    resetInboundForm()
    loadInboundRecords()
  } catch (error: any) {
    ElMessage.error('操作失败：' + (error.response?.data?.message || error.message))
  }
}

const deleteInbound = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该入库记录？', '删除确认', { type: 'warning' })
    await productionApi.deleteInboundRecord(id)
    ElMessage.success('删除成功')
    loadInboundRecords()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + (error.response?.data?.message || error.message))
    }
  }
}

const resetInboundForm = () => {
  inboundForm.recordDate = ''
  inboundForm.workshopId = undefined
  inboundForm.productSpecId = undefined
  inboundForm.totalPackageCount = 0
  inboundForm.totalWeight = 0
  inboundForm.exportPackageCount = 0
  inboundForm.exportWeight = 0
  inboundForm.domesticPackageCount = 0
  inboundForm.domesticWeight = 0
  inboundForm.remark = ''
}

// 发运管理
// 防抖版本的加载函数
const loadShippingRecords = debounce(async () => {
  loading.value = true
  try {
    const params: any = { page: shippingPage.value, limit: shippingPageSize.value }
    if (filterShippingWorkshop.value) {
      params.workshopId = filterShippingWorkshop.value
    }
    if (filterShippingProductCode.value) {
      params.productCode = filterShippingProductCode.value
    }
    const res = await productionApi.getShippingRecords(params)
    shippingList.value = res.data || []
    shippingTotal.value = res.total || 0
  } catch (error: any) {
    console.error('加载发运记录失败:', error)
  } finally {
    loading.value = false
  }
}, 300)

const handleShippingDateChange = () => {
  shippingPage.value = 1
  loadShippingRecords()
}

const editShipping = (row) => {
  editingShippingId.value = row.id
  shippingForm.shipDate = row.shipDate?.split('T')[0]
  shippingForm.workshopId = row.workshopId
  shippingForm.productSpecId = row.productSpecId
  shippingForm.totalWeight = Number(row.totalWeight)
  shippingForm.trainSectionCount = row.trainSectionCount
  shippingForm.containerCount = row.containerCount
  shippingForm.truckCount = row.truckCount
  showShippingDialog.value = true
}

const submitShippingForm = async () => {
  try {
    if (!shippingForm.shipDate || !shippingForm.workshopId || !shippingForm.productSpecId) {
      ElMessage.warning('请填写必填项')
      return
    }
    if (editingShippingId.value) {
      await productionApi.updateShippingRecord(editingShippingId.value, shippingForm)
      ElMessage.success('更新成功')
    } else {
      await productionApi.createShippingRecord(shippingForm)
      ElMessage.success('创建成功')
    }
    showShippingDialog.value = false
    editingShippingId.value = undefined
    resetShippingForm()
    loadShippingRecords()
  } catch (error: any) {
    ElMessage.error('操作失败')
  }
}

const deleteShipping = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该发运记录？', '删除确认', { type: 'warning' })
    await productionApi.deleteShippingRecord(id)
    ElMessage.success('删除成功')
    loadShippingRecords()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const resetShippingForm = () => {
  shippingForm.shipDate = ''
  shippingForm.workshopId = undefined
  shippingForm.productSpecId = undefined
  shippingForm.totalWeight = 0
  shippingForm.trainSectionCount = 0
  shippingForm.containerCount = 0
  shippingForm.truckCount = 0
}

// 库存管理
// 防抖版本的加载函数
const loadInventory = debounce(async () => {
  loading.value = true
  try {
    const params: any = {
      page: 1,
      limit: 100,
    }
    if (filterInventoryWorkshop.value) {
      params.workshopId = filterInventoryWorkshop.value
    }
    if (filterInventoryProductCode.value) {
      params.productCode = filterInventoryProductCode.value
    }
    if (filterInventorySpecType.value) {
      params.specType = filterInventorySpecType.value
    }
    inventoryList.value = await productionApi.getInventory(params)
  } catch (error: any) {
    console.error('加载库存失败:', error)
  } finally {
    loading.value = false
  }
}, 300)

const editInventory = (row) => {
  editingInventoryId.value = row.id
  inventoryForm.inventoryDate = row.inventoryDate?.split('T')[0]
  inventoryForm.workshopId = row.workshopId
  inventoryForm.productSpecId = row.productSpecId
  inventoryForm.totalWeight = Number(row.totalWeight)
  inventoryForm.exportWeight = Number(row.exportWeight)
  inventoryForm.domesticWeight = Number(row.domesticWeight)
  showInventoryDialog.value = true
}

const submitInventoryForm = async () => {
  try {
    if (!inventoryForm.inventoryDate || !inventoryForm.workshopId || !inventoryForm.productSpecId) {
      ElMessage.warning('请填写必填项')
      return
    }
    await productionApi.saveInventory(inventoryForm)
    ElMessage.success('保存成功')
    showInventoryDialog.value = false
    editingInventoryId.value = undefined
    resetInventoryForm()
    loadInventory()
  } catch (error: any) {
    ElMessage.error('操作失败')
  }
}

const resetInventoryForm = () => {
  inventoryForm.inventoryDate = ''
  inventoryForm.workshopId = undefined
  inventoryForm.productSpecId = undefined
  inventoryForm.totalWeight = 0
  inventoryForm.exportWeight = 0
  inventoryForm.domesticWeight = 0
}

// 专用镍统计
const loadSpecialNickelStats = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (specialDateRange.value && specialDateRange.value.length === 2) {
      params.startDate = specialDateRange.value[0]
      params.endDate = specialDateRange.value[1]
    }
    specialList.value = await productionApi.getSpecialNickelStats(params)
  } catch (error: any) {
    ElMessage.error('加载专用镍统计失败')
  } finally {
    loading.value = false
  }
}

const editSpecial = (row) => {
  ElMessage.info('编辑功能开发中')
}

// 统计报表
const loadDailyStats = async () => {
  try {
    const params = { date: statsDate.value.toISOString().split('T')[0] }
    statsData.value = await productionApi.getDailyStats(params)
  } catch (error: any) {
    ElMessage.error('加载日报失败')
  }
}

const loadMonthlyStats = async () => {
  try {
    const date = new Date(statsMonth.value)
    const params = { year: date.getFullYear(), month: date.getMonth() + 1 }
    statsData.value = await productionApi.getMonthlyStats(params)
  } catch (error: any) {
    ElMessage.error('加载月报失败')
  }
}

const loadExportStats = async () => {
  try {
    if (!exportDateRange.value || exportDateRange.value.length !== 2) return
    const params = {
      startDate: exportDateRange.value[0],
      endDate: exportDateRange.value[1],
    }
    statsData.value = await productionApi.getExportDomesticStats(params)
  } catch (error: any) {
    ElMessage.error('加载统计失败')
  }
}

// 打开数据看板
const openDashboard = () => {
  router.push('/production/dashboard')
}

onMounted(() => {
  loadWorkshops()
  loadProducts()
  loadInboundRecords()
  loadShippingRecords()
  loadInventory()
  loadSpecialNickelStats()
})
</script>

<style scoped>
.production-page {
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

.main-card {
  border-radius: 16px;
}

.production-tabs :deep(.el-tabs__header) {
  margin-bottom: 24px;
}

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

.data-table {
  width: 100%;
}

.data-table :deep(.el-table__header th) {
  background: #f8fafc;
  font-weight: 600;
}

.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

.stats-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}
</style>
