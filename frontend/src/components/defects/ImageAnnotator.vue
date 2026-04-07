<template>
  <div class="image-annotator">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button 
          type="primary" 
          :icon="Plus"
          :disabled="!imageLoaded"
          @click="startDrawing"
        >
          绘制标注框
        </el-button>
        
        <el-select 
          v-model="selectedDefectType"
          placeholder="选择缺陷类型"
          style="width: 200px; margin-left: 12px;"
          :disabled="!imageLoaded"
        >
          <el-option
            v-for="type in defectTypes"
            :key="type.id"
            :label="type.name"
            :value="type.id"
          >
            <span>{{ type.name }}</span>
            <el-tag 
              :color="getTextColor(type.color)" 
              size="small" 
              style="margin-left: 8px; background: #fff;"
            >
              {{ type.code }}
            </el-tag>
          </el-option>
        </el-select>
      </div>

      <div class="toolbar-right">
        <el-button @click="resetView">
          <el-icon><Refresh /></el-icon>
          重置视图
        </el-button>
        <el-button type="success" @click="saveAnnotations">
          <el-icon><Check /></el-icon>
          保存标注 ({{ annotations.length }})
        </el-button>
      </div>
    </div>

    <!-- 画布区域 -->
    <div class="canvas-container" ref="canvasContainer">
      <div class="canvas-wrapper">
        <!-- 图片 -->
        <img 
          ref="imageRef"
          :src="imageUrl"
          class="annotation-image"
          :class="{ 'loading': !imageLoaded }"
          @load="onImageLoad"
          @error="onImageError"
        />

        <!-- Canvas 层 -->
        <canvas
          ref="canvasRef"
          class="annotation-canvas"
          :style="{
            cursor: isDrawing ? 'crosshair' : 'default'
          }"
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @mouseleave="onMouseUp"
        ></canvas>

        <!-- 加载提示 -->
        <div v-if="!imageLoaded" class="loading-overlay">
          <el-icon class="is-loading" :size="48"><Loading /></el-icon>
          <p>图片加载中...</p>
        </div>
      </div>
    </div>

    <!-- 标注列表 -->
    <div class="annotations-panel">
      <div class="panel-header">
        <h3>标注列表 ({{ annotations.length }})</h3>
        <el-button link type="danger" :disabled="annotations.length === 0" @click="clearAll">
          清空全部
        </el-button>
      </div>

      <el-table 
        :data="annotations" 
        size="small"
        max-height="300"
        stripe
      >
        <el-table-column label="缺陷类型" width="150">
          <template #default="{ row }">
            <el-tag 
              :color="getDefectTypeColor(row.defectTypeId)" 
              size="small"
              style="background: #fff;"
            >
              {{ getDefectTypeName(row.defectTypeId) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="位置" width="120">
          <template #default="{ row }">
            ({{ Math.round(row.x) }}, {{ Math.round(row.y) }})
          </template>
        </el-table-column>
        <el-table-column label="尺寸" width="100">
          <template #default="{ row }">
            {{ Math.round(row.width) }}×{{ Math.round(row.height) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row, $index }">
            <el-button link type="primary" size="small" @click="editAnnotation($index)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="deleteAnnotation($index)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Check, Loading, Edit, Delete } from '@element-plus/icons-vue'
import * as defectsApi from '@/api/defects'

// Props
const props = defineProps<{
  imageUrl?: string
  sampleId?: number
  defectTypeId?: number
}>()

// Emits
const emit = defineEmits<{
  (e: 'save', annotations: any[]): void
  (e: 'close'): void
}>()

// 加载已保存的标注
const loadSavedAnnotations = async () => {
  if (!props.sampleId) return
  
  try {
    const sample: any = await defectsApi.getDefectSampleById(props.sampleId)
    if (sample && sample.annotations && sample.annotations.length > 0) {
      // 清空现有标注，替换为已保存的标注
      annotations.splice(0, annotations.length)
      
      sample.annotations.forEach((anno: any) => {
        annotations.push({
          x: Number(anno.x),
          y: Number(anno.y),
          width: Number(anno.width),
          height: Number(anno.height),
          defectTypeId: anno.defectTypeId,
        })
      })
      // 重新绘制
      setTimeout(() => {
        drawAllAnnotations()
      }, 100)
    }
  } catch (error: any) {
    console.error('加载标注失败:', error)
  }
}

// 状态
const imageLoaded = ref(false)
const imageRef = ref<HTMLImageElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasContainer = ref<HTMLElement | null>(null)

// 缺陷类型
const defectTypes = ref<any[]>([])
const selectedDefectType = ref<number | null>(null)

// 标注数据
const annotations = reactive<any[]>([])

// 绘制状态
const isDrawing = ref(false)
const currentRect = ref<any>(null)
const startX = ref(0)
const startY = ref(0)

// 编辑状态
const editingIndex = ref<number | null>(null)
const isDragging = ref(false)
const isResizing = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const resizeHandle = ref<string>('')

// 加载缺陷类型
const loadDefectTypes = async () => {
  try {
    const res: any = await defectsApi.getDefectTypes()
    defectTypes.value = res || []
    if (defectTypes.value.length > 0 && !selectedDefectType.value) {
      selectedDefectType.value = defectTypes.value[0].id
    }
    if (props.defectTypeId) {
      selectedDefectType.value = props.defectTypeId
    }
  } catch (error: any) {
    console.error('加载缺陷类型失败:', error)
  }
}

// 图片加载完成
const onImageLoad = () => {
  imageLoaded.value = true
  setTimeout(initCanvas, 100)
}

// 图片加载失败
const onImageError = () => {
  imageLoaded.value = false
  ElMessage.error('图片加载失败')
}

// 初始化 Canvas
const initCanvas = () => {
  if (!imageRef.value || !canvasRef.value) return

  const img = imageRef.value
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  
  if (!ctx) return

  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  drawAllAnnotations()
}

// 绘制所有标注
const drawAllAnnotations = () => {
  if (!canvasRef.value) return
  
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  annotations.forEach((anno, index) => {
    drawRectangle(ctx, anno, index === editingIndex.value)
  })

  if (currentRect.value) {
    drawRectangle(ctx, currentRect.value, true)
  }
}

// 绘制单个矩形
const drawRectangle = (ctx: CanvasRenderingContext2D, rect: any, isActive: boolean = false) => {
  const color = getDefectTypeColor(rect.defectTypeId) || '#ff0000'
  
  ctx.strokeStyle = color
  ctx.lineWidth = isActive ? 4 : 2
  ctx.fillStyle = color + '33'

  ctx.beginPath()
  ctx.rect(rect.x, rect.y, rect.width, rect.height)
  ctx.fill()
  ctx.stroke()

  if (rect.defectTypeId) {
    const name = getDefectTypeName(rect.defectTypeId)
    ctx.font = 'bold 24px Arial'
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 4
    ctx.strokeText(name, rect.x, rect.y - 12)
    ctx.fillText(name, rect.x, rect.y - 12)
  }

  if (isActive) {
    drawResizeHandles(ctx, rect, color)
  }
}

// 绘制调整大小的控制点
const drawResizeHandles = (ctx: CanvasRenderingContext2D, rect: any, color: string) => {
  const handles = [
    { x: rect.x, y: rect.y, name: 'nw' },
    { x: rect.x + rect.width, y: rect.y, name: 'ne' },
    { x: rect.x, y: rect.y + rect.height, name: 'sw' },
    { x: rect.x + rect.width, y: rect.y + rect.height, name: 'se' },
  ]

  ctx.fillStyle = '#fff'
  ctx.strokeStyle = color
  ctx.lineWidth = 2

  handles.forEach(handle => {
    ctx.beginPath()
    ctx.rect(handle.x - 5, handle.y - 5, 10, 10)
    ctx.fill()
    ctx.stroke()
  })
}

// 开始绘制
const startDrawing = () => {
  if (!selectedDefectType.value) {
    ElMessage.warning('请先选择缺陷类型')
    return
  }
  isDrawing.value = true
  editingIndex.value = null
}

// 鼠标按下
const onMouseDown = (e: MouseEvent) => {
  if (!canvasRef.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const scaleX = canvasRef.value.width / rect.width
  const scaleY = canvasRef.value.height / rect.height

  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY

  if (editingIndex.value !== null) {
    const anno = annotations[editingIndex.value]
    const handle = getResizeHandle(x, y, anno)
    
    if (handle) {
      isResizing.value = true
      resizeHandle.value = handle
      dragStart.value = { x, y }
      return
    }

    if (x >= anno.x && x <= anno.x + anno.width &&
        y >= anno.y && y <= anno.y + anno.height) {
      isDragging.value = true
      dragStart.value = { x, y }
      return
    }
  }

  if (isDrawing.value) {
    startX.value = x
    startY.value = y

    currentRect.value = {
      x: startX.value,
      y: startY.value,
      width: 0,
      height: 0,
      defectTypeId: selectedDefectType.value,
    }
  }
}

// 获取调整大小的控制点
const getResizeHandle = (x: number, y: number, rect: any): string => {
  const handles = [
    { x: rect.x, y: rect.y, name: 'nw' },
    { x: rect.x + rect.width, y: rect.y, name: 'ne' },
    { x: rect.x, y: rect.y + rect.height, name: 'sw' },
    { x: rect.x + rect.width, y: rect.y + rect.height, name: 'se' },
  ]

  for (const handle of handles) {
    if (Math.abs(x - handle.x) < 10 && Math.abs(y - handle.y) < 10) {
      return handle.name
    }
  }

  return ''
}

// 鼠标移动
const onMouseMove = (e: MouseEvent) => {
  if (!canvasRef.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const scaleX = canvasRef.value.width / rect.width
  const scaleY = canvasRef.value.height / rect.height

  const currentX = (e.clientX - rect.left) * scaleX
  const currentY = (e.clientY - rect.top) * scaleY

  if (isDragging.value && editingIndex.value !== null) {
    const dx = currentX - dragStart.value.x
    const dy = currentY - dragStart.value.y
    
    annotations[editingIndex.value].x += dx
    annotations[editingIndex.value].y += dy
    
    dragStart.value = { x: currentX, y: currentY }
    drawAllAnnotations()
    return
  }

  if (isResizing.value && editingIndex.value !== null) {
    const anno = annotations[editingIndex.value]
    const dx = currentX - dragStart.value.x
    const dy = currentY - dragStart.value.y

    if (resizeHandle.value.includes('e')) {
      anno.width += dx
    }
    if (resizeHandle.value.includes('w')) {
      anno.x += dx
      anno.width -= dx
    }
    if (resizeHandle.value.includes('s')) {
      anno.height += dy
    }
    if (resizeHandle.value.includes('n')) {
      anno.y += dy
      anno.height -= dy
    }

    dragStart.value = { x: currentX, y: currentY }
    drawAllAnnotations()
    return
  }

  if (isDrawing.value && currentRect.value) {
    currentRect.value.width = currentX - startX.value
    currentRect.value.height = currentY - startY.value

    drawAllAnnotations()
  }
}

// 鼠标释放
const onMouseUp = () => {
  if (isDragging.value) {
    isDragging.value = false
    return
  }

  if (isResizing.value) {
    isResizing.value = false
    return
  }

  if (isDrawing.value && currentRect.value) {
    if (Math.abs(currentRect.value.width) < 10 || Math.abs(currentRect.value.height) < 10) {
      ElMessage.warning('标注框太小，请重新绘制')
      isDrawing.value = false
      currentRect.value = null
      return
    }

    if (currentRect.value.width < 0) {
      currentRect.value.x += currentRect.value.width
      currentRect.value.width = Math.abs(currentRect.value.width)
    }
    if (currentRect.value.height < 0) {
      currentRect.value.y += currentRect.value.height
      currentRect.value.height = Math.abs(currentRect.value.height)
    }

    annotations.push({ ...currentRect.value })

    isDrawing.value = false
    currentRect.value = null

    drawAllAnnotations()

    ElMessage.success('标注已添加')
  }
}

// 获取缺陷类型颜色（统一使用固定的颜色配置）
const getDefectTypeColor = (defectTypeId: number) => {
  const type = defectTypes.value.find(t => t.id === defectTypeId)
  if (!type) return '#ff0000'
  
  // 统一的颜色配置（蓝色/橙色/粉色）
  const colorMap: any = {
    '不锈钢专用镍 (3#)': '#3b82f6',        // 蓝色
    '不锈钢专用镍 (绿色结晶)': '#f97316',  // 橙色
    '不锈钢专用镍 (氢氧化镍)': '#ec4899',  // 粉色
  }
  
  return colorMap[type.name] || type.color || '#ff0000'
}

// 获取文字颜色（与 getDefectTypeColor 相同）
const getTextColor = (color: string) => {
  return color || '#ff0000'
}

// 获取缺陷类型名称
const getDefectTypeName = (defectTypeId: number) => {
  const type = defectTypes.value.find(t => t.id === defectTypeId)
  return type?.name || '未知'
}

// 编辑标注
const editAnnotation = (index: number) => {
  editingIndex.value = index
  isDrawing.value = false
  currentRect.value = null
  drawAllAnnotations()
  ElMessage.info('已进入编辑模式，可以拖拽或调整标注框大小')
}

// 删除标注
const deleteAnnotation = (index: number) => {
  const newAnnotations = [...annotations]
  newAnnotations.splice(index, 1)
  annotations.splice(0, annotations.length, ...newAnnotations)
  
  if (editingIndex.value === index) {
    editingIndex.value = null
  }
  drawAllAnnotations()
  ElMessage.success('标注已删除')
}

// 清空全部
const clearAll = () => {
  ElMessageBox.confirm('确定清空所有标注吗？', '提示', {
    type: 'warning'
  }).then(() => {
    annotations.splice(0, annotations.length)
    editingIndex.value = null
    drawAllAnnotations()
    ElMessage.success('已清空所有标注')
  }).catch(() => {})
}

// 重置视图
const resetView = () => {
  initCanvas()
  editingIndex.value = null
  isDrawing.value = false
  currentRect.value = null
}

// 保存标注
const saveAnnotations = () => {
  // 即使没有标注也要保存（表示清空所有标注）
  emit('save', annotations)
}

// 生命周期
onMounted(async () => {
  await loadDefectTypes()
  // 加载已保存的标注
  await loadSavedAnnotations()
})

// 监听图片变化
watch(() => props.imageUrl, () => {
  imageLoaded.value = false
  annotations.splice(0, annotations.length)
  editingIndex.value = null
})
</script>

<style scoped>
.image-annotator {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f7fa;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.canvas-container {
  flex: 1;
  overflow: auto;
  padding: 24px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.canvas-wrapper {
  position: relative;
  display: inline-block;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.annotation-image {
  display: block;
  max-width: 100%;
  height: auto;
}

.annotation-image.loading {
  opacity: 0.5;
}

.annotation-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  color: #64748b;
  gap: 12px;
}

.annotations-panel {
  background: #fff;
  border-top: 1px solid #e2e8f0;
  max-height: 400px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}
</style>
