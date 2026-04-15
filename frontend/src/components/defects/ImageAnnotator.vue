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

    <!-- 图片 + 标注覆盖层 -->
    <div class="canvas-container" ref="canvasContainer" @wheel="handleWheel">
      <div 
        class="canvas-wrapper" 
        :style="{
          transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
          transformOrigin: 'top left'
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
          @mousedown="onImageMouseDown"
        />

        <!-- 标注框覆盖层 (div) -->
        <div class="annotation-overlay">
          <div
            v-for="(anno, index) in annotations"
            :key="index"
            class="annotation-box"
            :class="{ 
              'selected': editingIndex === index,
              'drawing': drawingIndex === index 
            }"
            :style="getAnnotationStyle(anno)"
          >
            <!-- 标签 -->
            <div class="annotation-label" :style="{ background: getDefectTypeColor(anno.defectTypeId) }">
              {{ getDefectTypeName(anno.defectTypeId) }}
            </div>
            <!-- 删除按钮 (hover 显示) -->
            <button 
              class="annotation-delete-btn"
              @click.stop="deleteAnnotation(index)"
            >
              ×
            </button>
          </div>
        </div>

        <!-- 绘制中的临时框 -->
        <div
          v-if="isDrawing && drawStart"
          class="annotation-box drawing"
          :style="getDrawRectStyle()"
        >
          <div class="annotation-label" :style="{ background: getDefectTypeColor(selectedDefectType) }">
            {{ getDefectTypeName(selectedDefectType) || '待选择' }}
          </div>
        </div>

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
              :style="{ color: getTextColor(getDefectTypeColor(row.defectTypeId)) }"
            >
              {{ getDefectTypeName(row.defectTypeId) || '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="x" label="X" width="70" />
        <el-table-column prop="y" label="Y" width="70" />
        <el-table-column prop="width" label="宽" width="70" />
        <el-table-column prop="height" label="高" width="70" />
        <el-table-column label="操作" width="60">
          <template #default="{ $index }">
            <el-button link type="danger" size="small" @click="deleteAnnotation($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Plus, Check, Refresh, RefreshLeft, RefreshRight, Loading, Rank } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// ============== Props & Emits ==============
interface Props {
  imageUrl: string
  defectTypes: any[]
  sampleId?: number
  defectTypeId?: number
  initialAnnotations?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  sampleId: undefined,
  defectTypeId: undefined,
  initialAnnotations: () => []
})

const emit = defineEmits<{
  (e: 'save', annotations: any[]): void
  (e: 'change', annotations: any[]): void
}>()

// ============== State ==============
const imageRef = ref<HTMLImageElement | null>(null)
const canvasContainer = ref<HTMLElement | null>(null)
const imageLoaded = ref(false)
const saving = ref(false)
const hasShownShortcutTip = ref(false)

// 标注数据
interface Annotation {
  x: number
  y: number
  width: number
  height: number
  defectTypeId: number
}

const annotations = reactive<Annotation[]>([])
const selectedDefectType = ref<number | null>(null)

// 绘制状态
const isDrawing = ref(false)
const isPanning = ref(false)
const isPanningActive = ref(false)
const drawStart = ref<{ x: number; y: number } | null>(null)
const drawingIndex = ref<number | null>(null)
const editingIndex = ref<number | null>(null)

// 平移
const panX = ref(0)
const panY = ref(0)
const panStart = ref<{ x: number; y: number } | null>(null)

// 缩放
const zoomLevel = ref<string | number>('fit')

// 历史记录
const history = ref<any[][]>([])
const historyIndex = ref(0)

// ============== 图片加载 ==============
const onImageLoad = () => {
  imageLoaded.value = true
  if (props.initialAnnotations && props.initialAnnotations.length > 0) {
    annotations.splice(0, annotations.length, ...props.initialAnnotations.map(a => ({ ...a })))
    saveHistory()
  }
  if (zoomLevel.value === 'fit') {
    nextTick(() => fitToScreen())
  }
}

const onImageError = () => {
  ElMessage.error('图片加载失败')
}

// ============== 适应屏幕 ==============
const fitToScreen = () => {
  if (!canvasContainer.value || !imageRef.value) return
  const container = canvasContainer.value.getBoundingClientRect()
  const img = imageRef.value
  const scaleX = container.width / img.naturalWidth
  const scaleY = container.height / img.naturalHeight
  zoomLevel.value = Math.min(scaleX, scaleY, 1)
  panX.value = 0
  panY.value = 0
}

// ============== 缩放 ==============
const applyZoom = () => {
  if (zoomLevel.value === 'fit') {
    fitToScreen()
  }
  panX.value = 0
  panY.value = 0
}

const handleWheel = (e: WheelEvent) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newZoom = Math.max(0.1, Math.min(5, (Number(zoomLevel.value) || 1) + delta))
    zoomLevel.value = newZoom
  }
}

// ============== 平移 ==============
const togglePanMode = () => {
  isPanning.value = !isPanning.value
  if (isPanning.value) isDrawing.value = false
}

const onImageMouseDown = (e: MouseEvent) => {
  if (isPanning.value || e.button === 1) {
    isPanningActive.value = true
    panStart.value = { x: e.clientX, y: e.clientY }
    e.preventDefault()
  }
}

// ============== 绘制标注框 ==============
const toggleDrawingMode = () => {
  isDrawing.value = !isDrawing.value
  if (isDrawing.value) {
    isPanning.value = false
    if (!selectedDefectType.value && props.defectTypes.length > 0) {
      selectedDefectType.value = props.defectTypes[0].id
    }
  }
}

const getImageCoords = (e: MouseEvent): { x: number; y: number } => {
  if (!imageRef.value) return { x: 0, y: 0 }
  const rect = imageRef.value.getBoundingClientRect()
  const z = typeof zoomLevel.value === 'number' && zoomLevel.value > 0 ? zoomLevel.value : 1
  return {
    x: (e.clientX - rect.left) / z,
    y: (e.clientY - rect.top) / z
  }
}

const handleCanvasMouseDown = (e: MouseEvent) => {
  if (e.button !== 0) return
  if (isPanningActive.value) return
  
  if (isDrawing.value) {
    const coords = getImageCoords(e)
    drawStart.value = { x: coords.x, y: coords.y }
    drawingIndex.value = annotations.length
  }
}

const handleCanvasMouseMove = (e: MouseEvent) => {
  if (isPanningActive.value && panStart.value) {
    panX.value += (e.clientX - panStart.value.x) / (typeof zoomLevel.value === 'number' ? zoomLevel.value : 1)
    panY.value += (e.clientY - panStart.value.y) / (typeof zoomLevel.value === 'number' ? zoomLevel.value : 1)
    panStart.value = { x: e.clientX, y: e.clientY }
    return
  }
}

const handleCanvasMouseUp = (e: MouseEvent) => {
  if (isPanningActive.value) {
    isPanningActive.value = false
    panStart.value = null
    return
  }
  
  if (isDrawing.value && drawStart.value) {
    const coords = getImageCoords(e)
    const x = Math.min(drawStart.value.x, coords.x)
    const y = Math.min(drawStart.value.y, coords.y)
    const width = Math.abs(coords.x - drawStart.value.x)
    const height = Math.abs(coords.y - drawStart.value.y)
    
    if (width > 5 && height > 5 && selectedDefectType.value) {
      annotations.push({ x, y, width, height, defectTypeId: selectedDefectType.value })
      saveHistory()
      emit('change', [...annotations])
    }
    
    drawStart.value = null
    drawingIndex.value = null
  }
}

// ============== 标注操作 ==============
// 计算图片 CSS 渲染尺寸 vs 自然尺寸的缩放比
const getImageScale = () => {
  if (!imageRef.value) return 1
  const img = imageRef.value
  const displayedWidth = img.clientWidth || img.naturalWidth
  const displayedHeight = img.clientHeight || img.naturalHeight
  return {
    scaleX: displayedWidth / img.naturalWidth,
    scaleY: displayedHeight / img.naturalHeight
  }
}

const getAnnotationStyle = (anno: Annotation) => {
  const { scaleX, scaleY } = getImageScale()
  return {
    left: (anno.x * scaleX) + 'px',
    top: (anno.y * scaleY) + 'px',
    width: (anno.width * scaleX) + 'px',
    height: (anno.height * scaleY) + 'px',
    borderColor: getDefectTypeColor(anno.defectTypeId)
  }
}

const getDrawRectStyle = () => {
  if (!drawStart.value || !imageRef.value) return {}
  // 需要获取当前鼠标位置，这里通过 CSS 无法直接获取
  // 使用全局变量跟踪
  return {
    left: Math.min(drawStart.value.x, currentMouseX.value) + 'px',
    top: Math.min(drawStart.value.y, currentMouseY.value) + 'px',
    width: Math.abs(currentMouseX.value - drawStart.value.x) + 'px',
    height: Math.abs(currentMouseY.value - drawStart.value.y) + 'px',
    borderColor: getDefectTypeColor(selectedDefectType.value)
  }
}

const currentMouseX = ref(0)
const currentMouseY = ref(0)

const updateMousePos = (e: MouseEvent) => {
  const coords = getImageCoords(e)
  currentMouseX.value = coords.x
  currentMouseY.value = coords.y
}

const deleteAnnotation = (index: number) => {
  annotations.splice(index, 1)
  saveHistory()
  emit('change', [...annotations])
}

const clearAll = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有标注吗？', '确认', { type: 'warning' })
    annotations.splice(0, annotations.length)
    saveHistory()
    emit('change', [...annotations])
    ElMessage.success('已清空')
  } catch {}
}

// ============== 标注列表交互 ==============
const onAnnotationSelect = (annotation: any) => {
  if (!annotation) return
  const index = annotations.indexOf(annotation)
  if (index !== -1) {
    editingIndex.value = index
  }
}

// ============== 工具方法 ==============
const getDefectTypeColor = (typeId: number) => {
  const type = props.defectTypes.find(t => t.id === typeId)
  return type?.color || '#409EFF'
}

const getDefectTypeName = (typeId: number) => {
  const type = props.defectTypes.find(t => t.id === typeId)
  return type?.name || '未知'
}

const getTextColor = (bgColor: string) => {
  if (!bgColor) return '#fff'
  const hex = bgColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128 ? '#000' : '#fff'
}

// ============== 历史记录 ==============
const saveHistory = () => {
  const snapshot = JSON.parse(JSON.stringify(annotations))
  history.value.splice(historyIndex.value + 1)
  history.value.push(snapshot)
  historyIndex.value = history.value.length - 1
}

const undo = () => {
  if (historyIndex.value > 0) {
    historyIndex.value--
    annotations.splice(0, annotations.length, ...JSON.parse(JSON.stringify(history.value[historyIndex.value])))
    emit('change', [...annotations])
  }
}

const redo = () => {
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++
    annotations.splice(0, annotations.length, ...JSON.parse(JSON.stringify(history.value[historyIndex.value])))
    emit('change', [...annotations])
  }
}

// ============== 保存 ==============
const saveAnnotations = async () => {
  if (annotations.length === 0) {
    ElMessage.warning('暂无标注')
    return
  }
  saving.value = true
  try {
    emit('save', [...annotations])
    ElMessage.success('标注已保存')
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

// ============== 重置 ==============
const resetView = () => {
  zoomLevel.value = 'fit'
  panX.value = 0
  panY.value = 0
  nextTick(() => fitToScreen())
}

// ============== 快捷键 ==============
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    isDrawing.value = false
    drawStart.value = null
  }
  if (e.key === 'r' || e.key === 'R') {
    if (!e.ctrlKey && !e.metaKey) resetView()
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    saveAnnotations()
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault()
    undo()
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
    e.preventDefault()
    redo()
  }
}

// ============== 生命周期 ==============
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  if (canvasContainer.value) {
    canvasContainer.value.addEventListener('mousedown', handleCanvasMouseDown)
    window.addEventListener('mousemove', (e) => {
      updateMousePos(e)
      handleCanvasMouseMove(e)
    })
    window.addEventListener('mouseup', handleCanvasMouseUp)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  if (canvasContainer.value) {
    canvasContainer.value.removeEventListener('mousedown', handleCanvasMouseDown)
  }
  window.removeEventListener('mousemove', handleCanvasMouseMove)
  window.removeEventListener('mouseup', handleCanvasMouseUp)
})

// 监听图片 URL 变化
watch(() => props.imageUrl, () => {
  imageLoaded.value = false
  annotations.splice(0, annotations.length)
  history.value = []
  historyIndex.value = 0
  zoomLevel.value = 'fit'
  panX.value = 0
  panY.value = 0
})

// 暴露方法
defineExpose({
  annotations,
  getAnnotations: () => [...annotations],
  setAnnotations: (list: any[]) => {
    annotations.splice(0, annotations.length, ...list.map(a => ({ ...a })))
    saveHistory()
  }
})
</script>

<style scoped>
.image-annotator {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.canvas-container {
  flex: 1;
  overflow: hidden;
  background: #f5f7fa;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.canvas-wrapper {
  position: relative;
  display: inline-block;
}

.annotation-image {
  display: block;
  max-width: 100%;
  height: auto;
  user-select: none;
  -webkit-user-drag: none;
}

.annotation-image.loading {
  opacity: 0.5;
}

/* 标注框覆盖层 */
.annotation-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.annotation-box {
  position: absolute;
  border: 2px solid #409EFF;
  background: rgba(64, 158, 255, 0.1);
  pointer-events: auto;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.annotation-box:hover {
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
}

.annotation-box.selected {
  border-width: 3px;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.4);
}

.annotation-box.drawing {
  border-style: dashed;
  opacity: 0.8;
}

.annotation-label {
  position: absolute;
  top: -22px;
  left: 0;
  padding: 2px 8px;
  color: #fff;
  font-size: 12px;
  white-space: nowrap;
  border-radius: 2px 2px 0 0;
}

.annotation-delete-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #F56C6C;
  color: #fff;
  border: none;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.annotation-box:hover .annotation-delete-btn {
  display: flex;
}

.loading-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #909399;
}

.shortcut-tip {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
}

.annotations-panel {
  background: #fff;
  border-top: 1px solid #ebeef5;
  padding: 12px 16px;
  max-height: 350px;
  overflow: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-left h3 {
  margin: 0;
  font-size: 14px;
}

.header-right {
  display: flex;
  gap: 4px;
}
</style>
