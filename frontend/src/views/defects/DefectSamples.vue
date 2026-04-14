<template>
  <div class="defect-samples-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <el-button link @click="$router.push('/defects/types')" class="back-btn">
          <el-icon><ArrowLeft /></el-icon>
          返回缺陷类型
        </el-button>
        <h1 class="page-title">
          <el-icon :size="24"><Picture /></el-icon>
          缺陷样本库
        </h1>
        <p class="page-desc">查看和管理缺陷样本图片</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleUpload">
          <el-icon><Upload /></el-icon>
          上传样本
        </el-button>
      </div>
    </div>

    <!-- 筛选工具栏 -->
    <el-card class="filter-card">
      <div class="filter-toolbar">
        <div class="filter-left">
          <el-select
            v-model="filterDefectType"
            placeholder="缺陷类型"
            clearable
            style="width: 200px"
            @change="loadSamples"
          >
            <el-option
              v-for="type in defectTypes"
              :key="type.id"
              :label="type.name"
              :value="type.id"
            />
          </el-select>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索描述..."
            prefix-icon="Search"
            style="width: 250px"
            clearable
            @input="loadSamples"
          />
        </div>

        <div class="filter-right">
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button value="grid">
              <el-icon><Grid /></el-icon>
              网格
            </el-radio-button>
            <el-radio-button value="list">
              <el-icon><List /></el-icon>
              列表
            </el-radio-button>
          </el-radio-group>

          <el-button @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 样本网格视图 -->
    <el-row v-if="viewMode === 'grid'" :gutter="20" class="samples-grid">
      <el-col
        v-for="sample in samples"
        :key="sample.id"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
      >
        <el-card class="sample-card" shadow="hover">
          <!-- 图片 -->
          <div class="sample-image-wrapper">
            <el-image
              :src="sample.imageUrl"
              fit="cover"
              class="sample-image"
              @click="openPreview(sample)"
            >
              <template #error>
                <div class="image-error">
                  <el-icon :size="48"><PictureFilled /></el-icon>
                  <span>图片加载失败</span>
                </div>
              </template>
            </el-image>
            
            <!-- 标注框覆盖层 -->
            <div 
              v-if="sample.annotations && sample.annotations.length > 0"
              class="annotation-overlay"
            >
              <div 
                v-for="(anno, index) in sample.annotations" 
                :key="index"
                class="annotation-box"
                :style="{
                  left: (normalizeCoordinate(Number(anno.x), 4000) * 100) + '%',
                  top: (normalizeCoordinate(Number(anno.y), 3000) * 100) + '%',
                  width: (normalizeCoordinate(Number(anno.width), 4000) * 100) + '%',
                  height: (normalizeCoordinate(Number(anno.height), 3000) * 100) + '%',
                  borderColor: getDefectTypeColor(anno.defectTypeId)
                }"
              >
                <span class="annotation-label">{{ getDefectTypeName(anno.defectTypeId) }}</span>
              </div>
            </div>
            
            <!-- 缺陷类型标签 -->
            <div class="sample-type-tag">
              <el-tag 
                :color="getDefectTypeColor(sample.defectType)" 
                size="small"
                style="background: #fff;"
              >
                {{ sample.defectType?.name }}
              </el-tag>
            </div>

            <!-- 状态标签 -->
            <div class="sample-status-tag">
              <el-tag
                :type="sample.status === 'reviewed' ? 'success' : sample.status === 'rejected' ? 'danger' : 'warning'"
                size="small"
              >
                {{ getStatusText(sample.status) }}
              </el-tag>
            </div>
          </div>

          <!-- 卡片内容 -->
          <div class="sample-content">
            <div class="sample-info">
              <span class="sample-id">#{{ sample.id }}</span>
              <span class="sample-date">{{ formatDate(sample.createdAt) }}</span>
            </div>

            <div v-if="sample.description" class="sample-description">
              {{ sample.description }}
            </div>

            <!-- 标注数量 -->
            <div class="sample-annotations">
              <el-icon><Edit /></el-icon>
              <span>{{ sample.annotations?.length || 0 }} 个标注</span>
            </div>
          </div>

          <!-- 底部操作 -->
          <div class="sample-actions">
            <el-button link type="primary" @click="handleEdit(sample)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button link type="success" @click="handleAnnotate(sample)">
              <el-icon><EditPen /></el-icon>
              标注
            </el-button>
            <el-button link type="danger" @click="handleDelete(sample)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 样本列表视图 -->
    <el-card v-else class="samples-list-card">
      <el-table :data="samples" v-loading="loading" stripe border>
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column label="图片" width="120" align="center">
          <template #default="{ row }">
            <el-image
              :src="row.imageUrl"
              fit="cover"
              class="thumbnail"
              :preview-src-list="[row.imageUrl]"
            />
          </template>
        </el-table-column>
        <el-table-column prop="defectType.name" label="缺陷类型" width="150">
          <template #default="{ row }">
            <el-tag 
              :color="getDefectTypeColor(row.defectType)" 
              size="small"
              style="background: #fff;"
            >
              {{ row.defectType?.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'reviewed' ? 'success' : row.status === 'rejected' ? 'danger' : 'warning'"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="标注" width="80" align="center">
          <template #default="{ row }">
            {{ row.annotations?.length || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="success" @click="handleAnnotate(row)">标注</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[12, 24, 48, 96]"
      layout="total, sizes, prev, pager, next, jumper"
      class="pagination"
      @change="loadSamples"
    />

    <!-- 上传对话框 -->
    <el-dialog
      v-model="showUploadDialog"
      title="上传缺陷样本"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="uploadForm" label-width="100px" :rules="uploadRules" ref="uploadFormRef">
        <el-form-item label="缺陷类型" prop="defectTypeId">
          <el-select v-model="uploadForm.defectTypeId" placeholder="选择缺陷类型" style="width: 100%">
            <el-option
              v-for="type in defectTypes"
              :key="type.id"
              :label="type.name"
              :value="type.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="样本图片" prop="image">
          <el-upload
            ref="uploadRef"
            class="image-uploader"
            :action="uploadUrl"
            name="image"
            :data="() => ({ defectTypeId: String(uploadForm.defectTypeId || '') })"
            :show-file-list="false"
            :before-upload="beforeUpload"
            :on-success="onUploadSuccess"
            :on-error="onUploadError"
            drag
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 jpg/png 格式
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="submitUpload" :loading="uploading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 图片放大查看对话框 -->
    <el-dialog
      v-model="showPreviewDialog"
      title="查看样本图片"
      width="80%"
      :close-on-click-modal="false"
      class="image-preview-dialog"
    >
      <div class="preview-container" ref="previewContainer">
        <div class="preview-image-wrapper">
          <img 
            :src="previewSample?.imageUrl" 
            class="preview-image"
            @load="onImageLoad"
          />
          
          <!-- 标注框覆盖层 -->
          <div 
            v-if="previewSample?.annotations && previewSample.annotations.length > 0 && imageLoaded"
            class="preview-annotation-overlay"
          >
            <div 
              v-for="(anno, index) in previewSample.annotations" 
              :key="index"
              class="preview-annotation-box"
              :style="{
                left: (normalizeCoordinate(Number(anno.x), imageWidth) * 100) + '%',
                top: (normalizeCoordinate(Number(anno.y), imageHeight) * 100) + '%',
                width: (normalizeCoordinate(Number(anno.width), imageWidth) * 100) + '%',
                height: (normalizeCoordinate(Number(anno.height), imageHeight) * 100) + '%',
                borderColor: getDefectTypeColor(anno.defectTypeId)
              }"
            >
              <span class="preview-annotation-label">{{ getDefectTypeName(anno.defectTypeId) }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑样本信息"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" label-width="100px" ref="editFormRef">
        <el-form-item label="缺陷类型">
          <el-select v-model="editForm.defectTypeId" placeholder="选择缺陷类型" style="width: 100%">
            <el-option
              v-for="type in defectTypes"
              :key="type.id"
              :label="type.name"
              :value="type.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="描述样本特征..."
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="editForm.status" placeholder="选择状态" style="width: 100%">
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="reviewed" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="submitEdit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Picture,
  PictureFilled,
  Upload,
  UploadFilled,
  ArrowLeft,
  Grid,
  List,
  Refresh,
  Search,
  Edit,
  EditPen,
  Delete,
} from '@element-plus/icons-vue'
import * as defectsApi from '@/api/defects'
import { compressImage } from '@/utils/imageCompressor'

const router = useRouter()

// 状态
const loading = ref(false)
const uploading = ref(false)
const submitting = ref(false)
const samples = ref([])
const defectTypes = ref([])
const currentPage = ref(1)
const pageSize = ref(24)
const total = ref(0)
const viewMode = ref<'grid' | 'list'>('grid')
const filterDefectType = ref<number | null>(null)
const searchKeyword = ref('')
const showUploadDialog = ref(false)
const showEditDialog = ref(false)
const showPreviewDialog = ref(false)
const editingSample = ref<any>(null)
const previewSample = ref<any>(null)
const imageLoaded = ref(false)
const imageWidth = ref(4000)
const imageHeight = ref(3000)

// 上传表单
const uploadForm = reactive({
  defectTypeId: null as number | null,
})

// 编辑表单
const editForm = reactive({
  defectTypeId: null as number | null,
  description: '',
  status: 'pending',
})

// 上传配置
const API_BASE = 'http://localhost:3001'
const uploadUrl = `${API_BASE}/defects/samples/upload`

// 上传验证规则
const uploadRules = {
  defectTypeId: [{ required: true, message: '请选择缺陷类型', trigger: 'change' }],
}

// 加载缺陷类型
const loadDefectTypes = async () => {
  try {
    const res: any = await defectsApi.getDefectTypes()
    defectTypes.value = res || []
  } catch (error: any) {
    console.error('加载缺陷类型失败:', error)
  }
}

// 加载样本列表
const loadSamples = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value,
    }
    if (filterDefectType.value) {
      params.defectTypeId = filterDefectType.value
    }

    const res: any = await defectsApi.getDefectSamples(params)
    samples.value = res.data || []
    total.value = res.total || 0
  } catch (error: any) {
    console.error('加载样本失败:', error)
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadSamples()
  ElMessage.success('刷新成功')
}

// 上传前验证
const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')

  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }

  if (!uploadForm.defectTypeId) {
    ElMessage.warning('请先选择缺陷类型')
    return false
  }

  ElMessage.info(`正在上传：${(file.size / 1024 / 1024).toFixed(2)}MB`)
  return true
}

// 上传成功
const onUploadSuccess = (response: any) => {
  if (response.success) {
    ElMessage.success('图片上传成功')
    showUploadDialog.value = false
    loadSamples()
  } else {
    ElMessage.error('上传失败：' + (response.message || '未知错误'))
  }
}

// 上传失败
const onUploadError = () => {
  ElMessage.error('上传失败，请重试')
}

// 打开上传对话框
const handleUpload = () => {
  if (defectTypes.value.length === 0) {
    ElMessage.warning('请先创建缺陷类型')
    router.push('/defects/types')
    return
  }
  showUploadDialog.value = true
}

// 提交上传
const submitUpload = async () => {
  if (!uploadFormRef.value) return

  try {
    await uploadFormRef.value.validate()
  } catch {
    return
  }

  uploading.value = true

  try {
    const dtId = uploadForm.defectTypeId

    ElMessage.info('正在压缩图片...')
    const { blob } = await compressImage(uploadForm.image, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.8,
      maxWidthKB: 500,
    })

    const compressedFile = new File([blob], uploadForm.image.name, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })

    console.log(`📦 图片压缩：${(uploadForm.image.size / 1024).toFixed(2)}KB → ${(blob.size / 1024).toFixed(2)}KB`)

    await defectsApi.uploadDefectImage(compressedFile, dtId, uploadForm.description)
    
    ElMessage.success('上传成功')
    showUploadDialog.value = false
    loadSamples()
  } catch (error: any) {
    console.error('上传失败:', error)
    ElMessage.error('上传失败：' + (error.response?.data?.message || error.message))
  } finally {
    uploading.value = false
  }
}

// 编辑样本
const handleEdit = (sample: any) => {
  editingSample.value = sample
  editForm.defectTypeId = sample.defectTypeId
  editForm.description = sample.description || ''
  editForm.status = sample.status || 'pending'
  showEditDialog.value = true
}

// 提交编辑
const submitEdit = async () => {
  if (!editingSample.value) return

  submitting.value = true
  try {
    await defectsApi.updateDefectSample(editingSample.value.id, editForm)
    ElMessage.success('更新成功')
    showEditDialog.value = false
    loadSamples()
  } catch (error: any) {
    ElMessage.error('更新失败：' + (error.response?.data?.message || error.message))
  } finally {
    submitting.value = false
  }
}

// 删除样本
const handleDelete = async (sample: any) => {
  try {
    await ElMessageBox.confirm(
      `确定删除该样本？删除后将无法恢复。`,
      '删除确认',
      { type: 'warning' }
    )

    await defectsApi.deleteDefectSample(sample.id)
    ElMessage.success('删除成功')
    loadSamples()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + (error.response?.data?.message || error.message))
    }
  }
}

// 打开图片预览
const openPreview = (sample: any) => {
  previewSample.value = sample
  imageLoaded.value = false
  showPreviewDialog.value = true
}

// 图片加载完成
const onImageLoad = (e: Event) => {
  const img = e.target as HTMLImageElement
  imageWidth.value = img.naturalWidth || 4000
  imageHeight.value = img.naturalHeight || 3000
  imageLoaded.value = true
}

// 标注
const handleAnnotate = (sample: any) => {
  router.push({
    path: '/defects/annotate',
    query: { sampleId: sample.id }
  })
}

// 工具函数
const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

const getStatusText = (status: string) => {
  const map: any = { pending: '待审核', reviewed: '已通过', rejected: '已拒绝' }
  return map[status] || status
}

// 获取缺陷类型颜色（支持传入 defectType 对象或 defectTypeId）
const getDefectTypeColor = (defectTypeOrId: any) => {
  if (!defectTypeOrId) return '#ff0000'
  // 如果是对象，直接取 color
  if (typeof defectTypeOrId === 'object') return defectTypeOrId.color || '#ff0000'
  // 如果是 ID，从 defectTypes 中查找
  const type = defectTypes.value.find((t: any) => t.id === defectTypeOrId)
  return type?.color || '#ff0000'
}

// 将像素值转换为百分比（假设图片最大尺寸为 4000x3000）
const normalizeCoordinate = (value: number, max: number = 4000) => {
  // 如果值 <= 1，说明已经是百分比，直接返回
  if (value <= 1) return value
  // 否则转换为百分比
  return value / max
}

// 获取缺陷类型名称
const getDefectTypeName = (defectTypeId: number) => {
  if (!defectTypeId) return ''
  const type = defectTypes.value.find(t => t.id === defectTypeId)
  return type ? type.name : ''
}

onMounted(() => {
  loadDefectTypes()
  loadSamples()
})
</script>

<style scoped>
.defect-samples-page {
  padding: 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
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

.back-btn {
  padding: 8px;
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
  font-size: 13px;
  color: #64748b;
}

.filter-card {
  margin-bottom: 24px;
  border-radius: 12px;
}

.filter-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-left, .filter-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.samples-grid {
  margin-bottom: 24px;
}

.sample-card {
  margin-bottom: 20px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.sample-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.sample-image-wrapper {
  position: relative;
  height: 200px;
  margin: -16px -16px 0 -16px;
  border-radius: 12px 12px 0 0;
  overflow: hidden;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
}

.sample-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94a3b8;
  gap: 8px;
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
  border: 2px solid;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.annotation-label {
  position: absolute;
  top: -24px;
  left: 0;
  background: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  white-space: nowrap;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.sample-type-tag, .sample-status-tag {
  position: absolute;
  top: 12px;
}

.sample-type-tag {
  left: 12px;
}

.sample-status-tag {
  right: 12px;
}

.sample-content {
  padding: 16px 0 0 0;
}

.sample-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 4px;
}

.sample-description {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sample-annotations {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
}

.sample-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.samples-list-card {
  margin-bottom: 24px;
  border-radius: 12px;
}

.thumbnail {
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

.image-uploader {
  width: 100%;
}

.image-uploader :deep(.el-upload-dragger) {
  padding: 40px 20px;
  border-radius: 12px;
}

/* 图片预览对话框 */
.image-preview-dialog {
  .el-dialog__body {
    padding: 20px;
    background: #f5f7fa;
    height: auto;
    max-height: 80vh;
    overflow: auto;
  }
}

.preview-container {
  position: relative;
  width: 100%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.preview-image-wrapper {
  position: relative;
  display: inline-block;
}

.preview-image {
  display: block;
  max-width: 100%;
  height: auto;
  max-height: 70vh;
}

.preview-annotation-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.preview-annotation-box {
  position: absolute;
  border: 2px solid;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
  background: rgba(255, 255, 255, 0.2);
  cursor: pointer;
}

.preview-annotation-label {
  position: absolute;
  top: -24px;
  left: 0;
  background: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  white-space: nowrap;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}
</style>
