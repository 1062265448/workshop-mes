<template>
  <div class="dashboard-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">
        <el-icon :size="24"><DataAnalysis /></el-icon>
        生产管理数据看板
      </h1>
      <div class="header-actions">
        <el-select v-model="selectedWorkshop" placeholder="选择车间" clearable style="width: 150px" @change="loadDashboard">
          <el-option label="全部车间" :value="undefined" />
          <el-option v-for="w in workshops" :key="w.id" :label="w.workshopName" :value="w.id" />
        </el-select>
        <el-button type="primary" @click="loadDashboard">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 关键指标卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <div class="stat-card inbound">
          <div class="stat-icon">📥</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalInbound }}</div>
            <div class="stat-label">总入库量 (吨)</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card shipping">
          <div class="stat-icon">📤</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalShipping }}</div>
            <div class="stat-label">总发运量 (吨)</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card inventory">
          <div class="stat-icon">📦</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalInventory }}</div>
            <div class="stat-label">总库存 (吨)</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card export">
          <div class="stat-icon">🌍</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.exportRatio }}%</div>
            <div class="stat-label">出口占比</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16" class="charts-row">
      <!-- 产量趋势图 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>📈 产量趋势</span>
              <el-radio-group v-model="trendType" size="small" @change="loadTrendChart">
                <el-radio-button value="daily">日报</el-radio-button>
                <el-radio-button value="monthly">月报</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 车间对比图 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span class="card-title">🏭 车间产量对比</span>
          </template>
          <div ref="workshopChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="charts-row">
      <!-- 产品类型分布 -->
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <span class="card-title">📊 产品类型分布</span>
          </template>
          <div ref="productChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 产品规格分布 -->
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <span class="card-title">📐 产品规格分布</span>
          </template>
          <div ref="specChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 库存预警 -->
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <span class="card-title">⚠️ 库存预警</span>
          </template>
          <div class="alert-list">
            <div v-for="item in inventoryAlerts" :key="item.id" class="alert-item" :class="item.level">
              <div class="alert-info">
                <div class="alert-product">{{ item.productName }}</div>
                <div class="alert-detail">{{ item.workshopName }} - {{ item.weight }} 吨</div>
              </div>
              <el-tag :type="item.level === 'high' ? 'danger' : 'warning'" size="small">
                {{ item.level === 'high' ? '高库存' : '低库存' }}
              </el-tag>
            </div>
            <div v-if="inventoryAlerts.length === 0" class="no-alerts">
              <el-empty description="暂无库存预警" :image-size="80" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { DataAnalysis, Refresh } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import * as productionApi from '@/api/production'

// 状态
const selectedWorkshop = ref()
const stats = reactive({
  totalInbound: 0,
  totalShipping: 0,
  totalInventory: 0,
  exportRatio: 0,
})
const trendType = ref('daily')
const workshops = ref([])
const inventoryAlerts = ref([])

// 图表实例
let trendChart: echarts.ECharts
let workshopChart: echarts.ECharts
let productChart: echarts.ECharts
let specChart: echarts.ECharts

const trendChartRef = ref()
const workshopChartRef = ref()
const productChartRef = ref()
const specChartRef = ref()

// 加载基础数据
const loadWorkshops = async () => {
  try {
    const res = await productionApi.getWorkshops()
    workshops.value = res.data || res || []
  } catch (error) {
    console.error('加载车间失败:', error)
    workshops.value = []
  }
}

// 加载看板数据
const loadDashboard = async () => {
  await loadStats()
  await loadTrendChart()
  await loadWorkshopChart()
  await loadProductChart()
  await loadSpecChart()
  await loadInventoryAlerts()
}

// 加载统计数据
const loadStats = async () => {
  try {
    const [inboundRes, shippingRes, inventoryRes] = await Promise.all([
      productionApi.getInboundRecords({ page: 1, limit: 100, workshopId: selectedWorkshop.value }),
      productionApi.getShippingRecords({ page: 1, limit: 100, workshopId: selectedWorkshop.value }),
      productionApi.getInventory({ page: 1, limit: 100, workshopId: selectedWorkshop.value }),
    ])

    const inboundData = inboundRes.data || inboundRes || []
    const shippingData = shippingRes.data || shippingRes || []
    const inventoryData = inventoryRes.data || inventoryRes || []

    stats.totalInbound = Number(inboundData.reduce((sum: number, item: any) => sum + Number(item.totalWeight), 0).toFixed(4))
    stats.totalShipping = Number(shippingData.reduce((sum: number, item: any) => sum + Number(item.totalWeight), 0).toFixed(4))
    stats.totalInventory = Number(inventoryData.reduce((sum: number, item: any) => sum + Number(item.totalWeight), 0).toFixed(4))
    
    // 计算出口占比
    const totalExport = inboundData.reduce((sum: number, item: any) => sum + Number(item.exportWeight), 0)
    stats.exportRatio = stats.totalInbound > 0 ? Number(((totalExport / stats.totalInbound) * 100).toFixed(4)) : 0
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 加载产量趋势图
const loadTrendChart = async () => {
  if (!trendChartRef.value) return
  
  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }

  try {
    const res = await productionApi.getInboundRecords({ page: 1, limit: 100, workshopId: selectedWorkshop.value })
    const data = res.data || res || []

    // 按日期分组统计
    const grouped: any = {}
    data.forEach((item: any) => {
      const date = new Date(item.recordDate).toLocaleDateString('zh-CN')
      if (!grouped[date]) {
        grouped[date] = 0
      }
      grouped[date] += Number(item.totalWeight)
    })

    const dates = Object.keys(grouped).slice(-30) // 最近 30 天
    const values = Object.values(grouped).map((v: any) => Number(v).toFixed(4))

    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>入库量：{c} 吨',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        name: '吨',
      },
      series: [{
        name: '入库量',
        type: 'line',
        smooth: true,
        data: values,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' },
          ]),
        },
        itemStyle: {
          color: '#409EFF',
        },
      }],
    }

    trendChart.setOption(option)
  } catch (error) {
    console.error('加载趋势图失败:', error)
  }
}

// 加载车间对比图
const loadWorkshopChart = async () => {
  if (!workshopChartRef.value) return
  
  if (!workshopChart) {
    workshopChart = echarts.init(workshopChartRef.value)
  }

  try {
    const res = await productionApi.getInboundRecords({ page: 1, limit: 100 })
    const data = res.data || res || []

    // 按车间分组统计
    const grouped: any = {}
    data.forEach((item: any) => {
      const workshopName = item.workshop?.workshopName || '未知车间'
      if (!grouped[workshopName]) {
        grouped[workshopName] = 0
      }
      grouped[workshopName] += Number(item.totalWeight)
    })

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: '{b}<br/>入库量：{c} 吨',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        name: '吨',
      },
      yAxis: {
        type: 'category',
        data: Object.keys(grouped),
      },
      series: [{
        name: '入库量',
        type: 'bar',
        data: Object.values(grouped).map((v: any) => Number(v).toFixed(4)),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#36cfc9' },
            { offset: 1, color: '#1890ff' },
          ]),
        },
        barWidth: '60%',
      }],
    }

    workshopChart.setOption(option)
  } catch (error) {
    console.error('加载车间对比图失败:', error)
  }
}

// 加载产品类型分布图
const loadProductChart = async () => {
  if (!productChartRef.value) return
  
  if (!productChart) {
    productChart = echarts.init(productChartRef.value)
  }

  try {
    const res = await productionApi.getInboundRecords({ page: 1, limit: 100 })
    const data = res.data || res || []

    // 按产品类型分组统计
    const grouped: any = {}
    data.forEach((item: any) => {
      const productCode = item.productSpec?.productCode || '其他'
      if (!grouped[productCode]) {
        grouped[productCode] = 0
      }
      grouped[productCode] += Number(item.totalWeight)
    })

    const pieData = Object.entries(grouped).map(([key, value]) => ({
      name: key,
      value: Number(value).toFixed(4),
    }))

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} 吨 ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
      },
      series: [{
        name: '产品类型',
        type: 'pie',
        radius: '70%',
        data: pieData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      }],
    }

    productChart.setOption(option)
  } catch (error) {
    console.error('加载产品类型图失败:', error)
  }
}

// 加载产品规格分布图
const loadSpecChart = async () => {
  if (!specChartRef.value) return
  
  if (!specChart) {
    specChart = echarts.init(specChartRef.value)
  }

  try {
    const res = await productionApi.getInboundRecords({ page: 1, limit: 100 })
    const data = res.data || res || []

    // 按产品规格分组统计
    const grouped: any = {}
    data.forEach((item: any) => {
      const specType = item.productSpec?.specType || '其他'
      if (!grouped[specType]) {
        grouped[specType] = 0
      }
      grouped[specType] += Number(item.totalWeight)
    })

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} 吨 ({d}%)',
      },
      series: [{
        name: '产品规格',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: Object.entries(grouped).map(([key, value]) => ({
          name: key,
          value: Number(value).toFixed(4),
        })),
      }],
    }

    specChart.setOption(option)
  } catch (error) {
    console.error('加载产品规格图失败:', error)
  }
}

// 加载库存预警
const loadInventoryAlerts = async () => {
  try {
    const res = await productionApi.getInventory({ page: 1, limit: 100, workshopId: selectedWorkshop.value })
    const data = res.data || res || []

    if (data.length === 0) {
      inventoryAlerts.value = []
      return
    }

    // 找出库存过高或过低的产品
    const weights = data.map((item: any) => Number(item.totalWeight))
    const avgWeight = weights.reduce((sum: number, w: number) => sum + w, 0) / weights.length
    const alerts: any = []

    data.forEach((item: any) => {
      const weight = Number(item.totalWeight)
      if (weight > avgWeight * 2) {
        alerts.push({
          id: item.id,
          productName: item.productSpec?.productName || '未知产品',
          workshopName: item.workshop?.workshopName || '未知车间',
          weight: weight.toFixed(2),
          level: 'high',
        })
      } else if (weight < avgWeight * 0.3) {
        alerts.push({
          id: item.id,
          productName: item.productSpec?.productName || '未知产品',
          workshopName: item.workshop?.workshopName || '未知车间',
          weight: weight.toFixed(2),
          level: 'low',
        })
      }
    })

    inventoryAlerts.value = alerts.slice(0, 10) // 最多显示 10 条
  } catch (error) {
    console.error('加载库存预警失败:', error)
    inventoryAlerts.value = []
  }
}

// 窗口大小变化时重新渲染图表
const handleResize = () => {
  trendChart?.resize()
  workshopChart?.resize()
  productChart?.resize()
  specChart?.resize()
}

onMounted(async () => {
  await loadWorkshops()
  await loadDashboard()
  window.addEventListener('resize', handleResize)
})
</script>

<style scoped>
.dashboard-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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

.stat-card.inbound .stat-icon { background: #e6f7ff; }
.stat-card.shipping .stat-icon { background: #f6ffed; }
.stat-card.inventory .stat-icon { background: #fff7e6; }
.stat-card.export .stat-icon { background: #f0f5ff; }

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

/* 图表区域 */
.charts-row {
  margin-bottom: 16px;
}

.chart-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-weight: 600;
}

.chart-container {
  height: 300px;
  width: 100%;
}

/* 库存预警 */
.alert-list {
  max-height: 300px;
  overflow-y: auto;
}

.alert-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #e5e7eb;
}

.alert-item.high {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.alert-item.low {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.alert-info {
  flex: 1;
}

.alert-product {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.alert-detail {
  font-size: 13px;
  color: #64748b;
}

.no-alerts {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}
</style>
