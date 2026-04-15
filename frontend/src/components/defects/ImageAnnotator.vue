<template>
  <div class="image-annotator">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button 
          :type="isDrawing ? 'warning' : 'primary'" 
          :icon="Plus"
          :disabled="!imageLoaded"
          @click="toggleDrawingMode"
        >
          {{ isDrawing ? '取消绘制' : '绘制标注框' }}
        </el-button>
        
        <el-button
          :type="isPanning ? 'warning' : 'default'"
          @click="togglePanMode"
          :disabled="!imageLoaded"
        >
          <el-icon><Rank /></el-icon>
          {{ isPanning ? '平移模式' : '拖动平移' }}
        </el-button>
        
        <el-select 
          v-model="selectedDefectType"
          placeholder="选择缺陷类型"
          style="width: 220px; margin-left: 12px;"
          :disabled="!imageLoaded || isDrawing"
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
        <el-tooltip content="缩放 (Ctrl+ 滚轮)" placement="bottom">
          <el-select 
            v-model="zoomLevel" 
            style="width: 100px;"
            @change="applyZoom"
          >
            <el-option label="50%" :value="0.5" />
            <el-option label="75%" :value="0.75" />
            <el-option label="100%" :value="1" />
            <el-option label="125%" :value="1.25" />
            <el-option label="150%" :value="1.5" />
            <el-option label="200%" :value="2" />
            <el-option label="适应" :value="'fit'" />
          </el-select>
        </el-tooltip>
        
        <el-tooltip content="重置视图 (R)" placement="bottom">
          <el-button @click="resetView">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-tooltip>
        
        <el-tooltip :content="`保存标注 (Ctrl+S)`" placement="bottom">
          <el-button 
            type="success" 
            @click="saveAnnotations"
            :loading="saving"
          >
            <el-icon><Check /></el-icon>
            保存 ({{ annotations.length }})
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- 画布区域 -->
    <div class="canvas-container" ref="canvasContainer" @wheel="handleWheel">
      <div 
        class="canvas-wrapper" 
        :style="{
          transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
          transformOrigin: 'center center'
        }"
      >
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
            cursor: getCursorStyle()
          }"
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @mouseleave="onMouseLeave"
          @contextmenu.prevent
        ></canvas>

        <!-- 加载提示 -->
        <div v-if="!imageLoaded" class="loading-overlay">
          <el-icon class="is-loading" :size="48"><Loading /></el-icon>
          <p>图片加载中...</p>
        </div>

        <!-- 快捷键提示 -->
        <div v-if="imageLoaded && !hasShownShortcutTip" class="shortcut-tip">
          <el-tag type="info" size="small" effect="dark">
            💡 提示：Ctrl+S 保存 · Esc 取消 · R 重置 · 滚轮缩放
          </el-tag>
          <el-button 
            link 
            type="primary" 
            size="small" 
            @click="hasShownShortcutTip = true"
          >
            不再显示
          </el-button>
        </div>
      </div>
    </div>

    <!-- 标注列表 -->
    <div class="annotations-panel">
      <div class="panel-header">
        <div class="header-left">
          <h3>标注列表</h3>
          <el-tag :type="annotations.length > 0 ? 'success' : 'info'" size="small">
            {{ annotations.length }} 个标注
          </el-tag>
        </div>
        <div class="header-right">
          <el-tooltip content="撤销 (Ctrl+Z)" placement="top">
            <el-button 
              link 
              type="primary" 
              :disabled="historyIndex <= 0"
              @click="undo"
            >
              <el-icon><RefreshLeft /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="重做 (Ctrl+Y)" placement="top">
            <el-button 
              link 
              type="primary" 
              :disabled="historyIndex >= history.length - 1"
              @click="redo"
            >
              <el-icon><RefreshRight /></el-icon>
            </el-button>
          </el-tooltip>
          <el-button 
            link 
            type="danger" 
            :disabled="annotations.length === 0"
            @click="clearAll"
          >
            清空全部
          </el-button>
        </div>
      </div>

      <el-empty 
        v-if="annotations.length === 0" 
        description='暂无标注，点击上方"绘制标注框"开始' 
        :image-size="80"
      />
      
      <el-table 
        v-else
        :data="annotations" 
        size="small"
        max-height="250"
        stripe
        highlight-current-row
        @current-change="onAnnotationSelect"
      >
        <el-table-column type="index" width="50" />
        <el-table-column label="缺陷类型" min-width="150">
          <template #default="{ row }">
            <el-tag 
              :color="getDefectTypeColor(row.defectTypeId)" 
              size="small"
              style="background: #fff; color: #333;"
            >
              {{ getDefectTypeName(row.defectTypeId) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="位置" width="140">
          <template #default="{ row }">
            <span class="mono-text">
              ({{ Math.round(row.x) }}, {{ Math.round(row.y) }})
            </span>
          </template>
        </el-table-column>
        <el-table-column label="尺寸" width="120">
          <template #default="{ row }">
            <span class="mono-text">
              {{ Math.round(row.width) }} × {{ Math.round(row.height) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row, $index }">
            <el-button 
              link 
              type="primary" 
              size="small" 
              @click="editAnnotation($index)"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button 
              link 
              type="danger" 
              size="small" 
              @click="deleteAnnotation($index)"
            >
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
import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Refresh, Check, Loading, Edit, Delete, 
  RefreshLeft, RefreshRight, Rank
} from '@element-plus/icons-vue'
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
  (e: 'change', count: number): void  // 标注数量变化时触发
  (e: 'close'): void
}>()

// 加载已保存的标注
const loadSavedAnnotations = async () => {
  if (!props.sampleId) return
  
  try {
    const sample: any = await defectsApi.getDefectSampleById(props.sampleId)
    if (sample && sample.annotations && sample.annotations.length > 0) {
      annotations.splice(0, annotations.length)
      
      sample.annotations.forEach((anno: any) => {
        // 存储是百分比 (0-1)，需转为像素坐标
        annotations.push({
          x: Number(anno.x) * (originalImageWidth.value || 1),
          y: Number(anno.y) * (originalImageHeight.value || 1),
          width: Number(anno.width) * (originalImageWidth.value || 1),
          height: Number(anno.height) * (originalImageHeight.value || 1),
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
const saving = ref(false)
const hasShownShortcutTip = ref(false)

// 缺陷类型
const defectTypes = ref<any[]>([])
const selectedDefectType = ref<number | null>(null)

// 标注数据
const annotations = reactive<any[]>([])

// 撤销/重做历史
const history = ref<any[][]>([[]])
const historyIndex = ref(0)
const maxHistoryLength = 50

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

// 缩放
const zoomLevel = ref<number | 'fit'>(1)
const originalImageWidth = ref(0)
const originalImageHeight = ref(0)

// 平移状态
const isPanning = ref(false)
const isPanningActive = ref(false) // 实际拖拽中
const panX = ref(0)
const panY = ref(0)
const panStart = ref({ x: 0, y: 0 })

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
  originalImageWidth.value = imageRef.value?.naturalWidth || 0
  originalImageHeight.value = imageRef.value?.naturalHeight || 0
  nextTick(() => {
    initCanvas()
    fitToScreen()
  })
}

// 图片加载失败
const onImageError = () => {
  imageLoaded.value = false
  ElMessage.error('图片加载失败，请检查图片链接是否有效')
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

// 适应屏幕
const fitToScreen = () => {
  if (!canvasContainer.value || !canvasRef.value) return
  
  const containerRect = canvasContainer.value.getBoundingClientRect()
  const imgWidth = originalImageWidth.value
  const imgHeight = originalImageHeight.value
  
  const scaleX = (containerRect.width - 48) / imgWidth
  const scaleY = (containerRect.height - 48) / imgHeight
  const scale = Math.min(scaleX, scaleY, 1)
  
  zoomLevel.value = scale < 0.5 ? 0.5 : scale > 2 ? 2 : scale
  applyZoom()
}

// 应用缩放
const applyZoom = () => {
  if (!canvasRef.value) return
  
  if (zoomLevel.value === 'fit') {
    fitToScreen()
    return
  }
  
  const canvas = canvasRef.value
  canvas.style.transform = `scale(${zoomLevel.value})`
  canvas.style.transformOrigin = 'center center'
}

// 滚轮缩放
const handleWheel = (e: WheelEvent) => {
  if (!e.ctrlKey) return
  e.preventDefault()
  
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  const newZoom = typeof zoomLevel.value === 'number' 
    ? Math.max(0.5, Math.min(3, zoomLevel.value + delta)) 
    : 1
  
  zoomLevel.value = Math.round(newZoom * 100) / 100
  applyZoom()
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

// 绘制单个矩形（根据缩放级别调整线宽和字体大小）
const drawRectangle = (ctx: CanvasRenderingContext2D, rect: any, isActive: boolean = false) => {
  const color = getDefectTypeColor(rect.defectTypeId) || '#ff0000'
  const z = typeof zoomLevel.value === 'number' ? zoomLevel.value : 1
  // 反向缩放：zoom 越大线越细，保持视觉一致
  const inv = 1 / z
  
  ctx.strokeStyle = color
  ctx.lineWidth = (isActive ? 4 : 2) * inv
  ctx.fillStyle = color + '33'

  ctx.beginPath()
  ctx.rect(rect.x, rect.y, rect.width, rect.height)
  ctx.fill()
  ctx.stroke()

  if (rect.defectTypeId) {
    const name = getDefectTypeName(rect.defectTypeId)
    const fontSize = Math.round(24 * inv)
    ctx.font = `bold ${fontSize}px Arial`
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 4 * inv
    const labelY = Math.round(12 * inv)
    ctx.strokeText(name, rect.x, rect.y - labelY)
    ctx.fillText(name, rect.x, rect.y - labelY)
  }

  if (isActive) {
    drawResizeHandles(ctx, rect, color, inv)
  }
}

// 绘制调整大小的控制点
const drawResizeHandles = (ctx: CanvasRenderingContext2D, rect: any, color: string, inv: number = 1) => {
  const handles = [
    { x: rect.x, y: rect.y, name: 'nw' },
    { x: rect.x + rect.width, y: rect.y, name: 'ne' },
    { x: rect.x, y: rect.y + rect.height, name: 'sw' },
    { x: rect.x + rect.width, y: rect.y + rect.height, name: 'se' },
  ]

  const size = Math.round(10 * inv)
  const half = Math.round(5 * inv)

  ctx.fillStyle = '#fff'
  ctx.strokeStyle = color
  ctx.lineWidth = 2 * inv

  handles.forEach(handle => {
    ctx.beginPath()
    ctx.rect(handle.x - half, handle.y - half, size, size)
    ctx.fill()
    ctx.stroke()
  })
}

// 切换平移模式
const togglePanMode = () => {
  isPanning.value = !isPanning.value
  if (isPanning.value) {
    isDrawing.value = false
    editingIndex.value = null
    currentRect.value = null
    ElMessage.info('平移模式：在画布上拖拽移动图片')
  }
}

// 切换绘制模式
const toggleDrawingMode = () => {
  if (!selectedDefectType.value) {
    ElMessage.warning('请先选择缺陷类型')
    return
  }
  isDrawing.value = !isDrawing.value
  editingIndex.value = null
  currentRect.value = null
  
  if (isDrawing.value) {
    ElMessage.info('绘制模式：在图片上拖拽绘制标注框')
  } else {
    ElMessage.info('已取消绘制模式')
  }
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

// 获取光标样式
const getCursorStyle = () => {
  if (!imageLoaded.value) return 'not-allowed'
  if (isPanningActive.value) return 'grabbing'
  if (isPanning.value) return 'grab'
  if (isDrawing.value) return 'crosshair'
  if (isResizing.value) return 'nwse-resize'
  if (isDragging.value) return 'move'
  if (editingIndex.value !== null) return 'default'
  return 'default'
}

// 选择标注（点击列表项）
const onAnnotationSelect = (annotation: any) => {
  const index = annotations.indexOf(annotation)
  if (index !== -1) {
    editAnnotation(index)
  }
}

// 鼠标按下
const onMouseDown = (e: MouseEvent) => {
  if (!canvasRef.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const scaleX = canvasRef.value.width / rect.width
  const scaleY = canvasRef.value.height / rect.height

  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY

  // 中键或平移模式 → 平移图片
  if (e.button === 1 || isPanning.value) {
    if (e.button === 1) e.preventDefault()
    isPanningActive.value = true
    panStart.value = { x: e.clientX, y: e.clientY }
    return
  }

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

  // 平移中
  if (isPanningActive.value) {
    const dx = e.clientX - panStart.value.x
    const dy = e.clientY - panStart.value.y
    panX.value += dx
    panY.value += dy
    panStart.value = { x: e.clientX, y: e.clientY }
    return
  }

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
  if (isPanningActive.value) {
    isPanningActive.value = false
    return
  }

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
    emit('change', annotations.length)

    isDrawing.value = false
    currentRect.value = null

    drawAllAnnotations()

    ElMessage.success('标注已添加')
  }
}

// 鼠标离开画布（取消平移/拖拽/绘制/缩放）
const onMouseLeave = () => {
  isPanningActive.value = false
  isDragging.value = false
  isResizing.value = false
  if (isDrawing.value) {
    isDrawing.value = false
    currentRect.value = null
    ElMessage.info('鼠标离开画布，已取消绘制')
  }
}

// 获取缺陷类型颜色（直接使用 type.color，不再硬编码）
const getDefectTypeColor = (defectTypeId: number) => {
  const type = defectTypes.value.find(t => t.id === defectTypeId)
  return type?.color || '#ff0000'
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
  emit('change', annotations.length)
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
    emit('change', 0)
    ElMessage.success('已清空所有标注')
  }).catch(() => {})
}

// 重置视图
const resetView = () => {
  initCanvas()
  editingIndex.value = null
  isDrawing.value = false
  currentRect.value = null
  // 重置平移
  panX.value = 0
  panY.value = 0
  isPanning.value = false
}

// 保存标注
const saveAnnotations = async () => {
  if (saving.value) return
  
  saving.value = true
  try {
    emit('save', annotations)
    ElMessage.success('标注保存成功')
    addToHistory()
  } catch (error: any) {
    ElMessage.error('保存失败：' + (error.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

// ==================== 撤销/重做 ====================

const addToHistory = () => {
  // 移除当前索引之后的历史
  history.value = history.value.slice(0, historyIndex.value + 1)
  
  // 添加新状态
  history.value.push(JSON.parse(JSON.stringify(annotations)))
  
  // 限制历史记录长度
  if (history.value.length > maxHistoryLength) {
    history.value.shift()
  } else {
    historyIndex.value++
  }
}

const undo = () => {
  if (historyIndex.value > 0) {
    historyIndex.value--
    const prevState = history.value[historyIndex.value]
    annotations.splice(0, annotations.length, ...prevState)
    drawAllAnnotations()
    ElMessage.info('已撤销')
  }
}

const redo = () => {
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++
    const nextState = history.value[historyIndex.value]
    annotations.splice(0, annotations.length, ...nextState)
    drawAllAnnotations()
    ElMessage.info('已重做')
  }
}

// ==================== 快捷键 ====================

const handleKeyDown = (e: KeyboardEvent) => {
  // Ctrl+S 保存
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    saveAnnotations()
    return
  }
  
  // Ctrl+Z 撤销
  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault()
    undo()
    return
  }
  
  // Ctrl+Y 重做
  if (e.ctrlKey && e.key === 'y') {
    e.preventDefault()
    redo()
    return
  }
  
  // Esc 取消绘制
  if (e.key === 'Escape') {
    if (isDrawing.value) {
      isDrawing.value = false
      currentRect.value = null
      ElMessage.info('已取消绘制')
    } else if (editingIndex.value !== null) {
      editingIndex.value = null
      drawAllAnnotations()
      ElMessage.info('已退出编辑模式')
    }
    return
  }
  
  // R 重置视图
  if (e.key === 'r' || e.key === 'R') {
    resetView()
    return
  }
  
  // Space 快速切换平移
  if (e.key === ' ') {
    e.preventDefault()
    togglePanMode()
    return
  }
  
  // Delete 删除选中
  if (e.key === 'Delete' && editingIndex.value !== null) {
    deleteAnnotation(editingIndex.value)
    return
  }
}

// ==================== 生命周期 ====================

onMounted(async () => {
  await loadDefectTypes()
  // 加载已保存的标注
  await loadSavedAnnotations()
  // 初始化历史记录
  addToHistory()
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

// 监听图片变化
watch(() => props.imageUrl, () => {
  imageLoaded.value = false
  annotations.splice(0, annotations.length)
  editingIndex.value = null
  history.value = [[]]
  historyIndex.value = 0
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
  padding: 12px 24px;
  background: linear-gradient(to bottom, #fff, #f8fafc);
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-right .el-button {
  display: flex;
  align-items: center;
  gap: 4px;
}

.canvas-container {
  flex: 1;
  overflow: auto;
  padding: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #0f172a;
  position: relative;
}

.canvas-wrapper {
  position: relative;
  display: inline-block;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  transition: transform 0.2s ease;
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
  background: rgba(255, 255, 255, 0.95);
  color: #64748b;
  gap: 12px;
  z-index: 10;
}

.shortcut-tip {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.8);
  padding: 8px 16px;
  border-radius: 20px;
  z-index: 20;
  color: #fff;
  font-size: 12px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.annotations-panel {
  background: #fff;
  border-top: 1px solid #e2e8f0;
  max-height: 350px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: linear-gradient(to bottom, #f8fafc, #fff);
  border-bottom: 1px solid #e2e8f0;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mono-text {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #64748b;
}
</style>
