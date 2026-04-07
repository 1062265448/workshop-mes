<template>
  <div class="defect-annotate-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-button link @click="handleBack" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      
      <div class="header-title">
        <el-icon :size="24"><EditPen /></el-icon>
        <h1 class="page-title">缺陷标注工具</h1>
        <span class="page-desc">在图片上绘制标注框，标记缺陷位置</span>
      </div>
    </div>

    <!-- 图片选择 -->
    <div v-if="!selectedImage" class="image-select">
      <el-card class="select-card">
        <template #header>
          <div class="card-header">
            <span>上传新图片</span>
          </div>
        </template>
        
        <el-form :model="uploadForm" label-width="100px">
          <el-form-item label="缺陷类型" required>
            <el-select 
              v-model="uploadForm.defectTypeId" 
              placeholder="选择缺陷类型"
              style="width: 100%"
            >
              <el-option
                v-for="type in defectTypes"
                :key="type.id"
                :label="type.name"
                :value="type.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="上传图片" required>
            <el-upload
              ref="uploadRef"
              :action="uploadUrl"
              name="image"
              :data="getUploadData"
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

        <el-divider />
        
        <div style="text-align: center;">
          <el-button type="primary" @click="showSampleDialog = true">
            <el-icon><Picture /></el-icon>
            从样本库选择
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 标注工具 -->
    <div v-else class="annotate-container">
      <ImageAnnotator
        ref="annotatorRef"
        :image-url="selectedImage"
        :sample-id="sampleId"
        :defect-type-id="defectTypeId"
        @save="handleSaveAnnotations"
      />
    </div>

    <!-- 样本选择对话框 -->
    <el-dialog
      v-model="showSampleDialog"
      title="从样本库选择图片"
      width="900px"
      :close-on-click-modal="false"
    >
      <div class="sample-dialog-content">
        <!-- 筛选工具栏 -->
        <div class="filter-toolbar">
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

        <!-- 样本列表 -->
        <el-row :gutter="16" class="sample-grid">
          <el-col
            v-for="sample in samples"
            :key="sample.id"
            :span="6"
          >
            <el-card
              class="sample-card"
              :class="{ 'selected': selectedSampleId === sample.id }"
              shadow="hover"
              @click="selectSample(sample)"
            >
              <el-image
                :src="sample.imageUrl"
                fit="cover"
                class="sample-image"
              />
              <div class="sample-info">
                <div class="sample-name">{{ sample.defectType?.name }}</div>
                <div class="sample-date">{{ formatDate(sample.createdAt) }}</div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 分页 -->
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[12, 24, 48]"
          layout="total, sizes, prev, pager, next"
          class="pagination"
          @change="loadSamples"
        />
      </div>

      <template #footer>
        <el-button @click="showSampleDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          :disabled="!selectedSample"
          @click="confirmSampleSelection"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  EditPen,
  ArrowLeft,
  UploadFilled,
  Picture,
  Search,
} from '@element-plus/icons-vue'
import ImageAnnotator from '@/components/defects/ImageAnnotator.vue'
import * as defectsApi from '@/api/defects'

const router = useRouter()
const route = useRoute()

// 状态
const selectedImage = ref('')
const sampleId = ref<number | undefined>()
const defectTypeId = ref<number | undefined>()
const showSampleDialog = ref(false)
const selectedSampleId = ref<number | null>(null)
const selectedSample = ref<any>(null)

// 上传表单
const uploadForm = reactive({
  defectTypeId: null as number | null,
})

// 样本列表
const samples = ref([])
const defectTypes = ref([])
const filterDefectType = ref<number | null>(null)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(24)
const total = ref(0)

// 上传配置
const API_BASE = 'http://localhost:3001'
const uploadUrl = `${API_BASE}/defects/samples/upload`

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
  }
}

// 获取上传数据
const getUploadData = () => {
  if (!uploadForm.defectTypeId) {
    ElMessage.warning('请先选择缺陷类型')
    return { defectTypeId: '' }
  }
  return { defectTypeId: String(uploadForm.defectTypeId) }
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
    const imageUrl = `${API_BASE}${response.imageUrl}`
    selectedImage.value = imageUrl
    sampleId.value = response.sample?.id
    defectTypeId.value = uploadForm.defectTypeId || response.sample?.defectTypeId
    
    // 保存到本地存储
    sessionStorage.setItem('annotate_image', imageUrl)
    sessionStorage.setItem('annotate_sampleId', String(sampleId.value || ''))
    sessionStorage.setItem('annotate_defectTypeId', String(defectTypeId.value || ''))
    
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error('上传失败：' + (response.message || '未知错误'))
  }
}

// 上传失败
const onUploadError = () => {
  ElMessage.error('上传失败，请重试')
}

// 选择样本
const selectSample = (sample: any) => {
  selectedSampleId.value = sample.id
  selectedSample.value = sample
}

// 确认样本选择
const confirmSampleSelection = () => {
  if (!selectedSample.value) return

  selectedImage.value = selectedSample.value.imageUrl
  sampleId.value = selectedSample.value.id
  defectTypeId.value = selectedSample.value.defectTypeId
  showSampleDialog.value = false

  ElMessage.success('已选择样本')
}

// 保存标注
const handleSaveAnnotations = async (annotations: any[]) => {
  try {
    if (!sampleId.value) {
      // 创建新样本和标注
      const sampleData = {
        defectTypeId: defectTypeId.value,
        imageUrl: selectedImage.value.replace(API_BASE, ''),
        annotations: annotations.map(anno => ({
          x: anno.x,
          y: anno.y,
          width: anno.width,
          height: anno.height,
          defectTypeId: anno.defectTypeId,
        })),
      }
      await defectsApi.createDefectSample(sampleData)
    } else {
      // 更新现有样本的标注：先删除所有旧标注，再创建新标注
      // 1. 获取现有标注
      const sample: any = await defectsApi.getDefectSampleById(sampleId.value)
      
      // 2. 删除所有旧标注
      if (sample.annotations && sample.annotations.length > 0) {
        for (const anno of sample.annotations) {
          await defectsApi.deleteAnnotation(anno.id)
        }
      }
      
      // 3. 如果有新标注，创建新标注（如果 annotations 为空，表示清空所有标注）
      if (annotations && annotations.length > 0) {
        for (const anno of annotations) {
          await defectsApi.createAnnotation(
            sampleId.value,
            anno.defectTypeId,
            {
              x: anno.x,
              y: anno.y,
              width: anno.width,
              height: anno.height,
            }
          )
        }
      }
    }

    ElMessage.success('标注保存成功')
    
    // 不清除本地存储，保持在标注页面
    // sessionStorage.removeItem('annotate_image')
    // sessionStorage.removeItem('annotate_sampleId')
    // sessionStorage.removeItem('annotate_defectTypeId')
    
    // 不跳转，留在标注页面
    // router.push('/defects/samples')
  } catch (error: any) {
    console.error('保存标注失败:', error)
    ElMessage.error('保存失败：' + (error.response?.data?.message || error.message))
  }
}

// 返回
const handleBack = () => {
  ElMessageBox.confirm('确定要返回吗？未保存的标注将会丢失。', '提示', {
    type: 'warning'
  }).then(() => {
    // 清除本地存储
    sessionStorage.removeItem('annotate_image')
    sessionStorage.removeItem('annotate_sampleId')
    sessionStorage.removeItem('annotate_defectTypeId')
    router.push('/defects/samples')
  }).catch(() => {})
}

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadDefectTypes()
  loadSamples()

  // 先从 URL 参数加载
  if (route.query.sampleId) {
    const id = Number(route.query.sampleId)
    defectsApi.getDefectSampleById(id).then((sample: any) => {
      selectedImage.value = `${API_BASE}${sample.imageUrl}`
      sampleId.value = sample.id
      defectTypeId.value = sample.defectTypeId
      // 保存标注信息到 sessionStorage，方便标注工具加载
      sessionStorage.setItem('annotate_image', selectedImage.value)
      sessionStorage.setItem('annotate_sampleId', String(sample.id))
      sessionStorage.setItem('annotate_defectTypeId', String(sample.defectTypeId))
    }).catch(() => {
      ElMessage.error('加载样本失败')
    })
  } else {
    // 否则从本地存储恢复
    const savedImage = sessionStorage.getItem('annotate_image')
    const savedSampleId = sessionStorage.getItem('annotate_sampleId')
    const savedDefectTypeId = sessionStorage.getItem('annotate_defectTypeId')
    
    if (savedImage) {
      selectedImage.value = savedImage
      if (savedSampleId) sampleId.value = Number(savedSampleId)
      if (savedDefectTypeId) defectTypeId.value = Number(savedDefectTypeId)
    }
  }
})
</script>

<style scoped>
.defect-annotate-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f7fa;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.back-btn {
  padding: 8px;
  flex-shrink: 0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.header-title .el-icon {
  color: #1e293b;
  flex-shrink: 0;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  flex-shrink: 0;
}

.page-desc {
  margin: 0;
  font-size: 13px;
  color: #94a3b8;
  padding-left: 12px;
  border-left: 1px solid #e2e8f0;
}

.image-select {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.select-card {
  width: 100%;
  max-width: 600px;
  border-radius: 12px;
}

.annotate-container {
  flex: 1;
  overflow: hidden;
}

.sample-dialog-content {
  padding: 16px 0;
}

.filter-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  padding: 0 16px;
}

.sample-grid {
  padding: 0 16px;
}

.sample-card {
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.sample-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.sample-card.selected {
  border-color: #3b82f6;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
}

.sample-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

.sample-info {
  padding: 12px 0 0 0;
}

.sample-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.sample-date {
  font-size: 12px;
  color: #94a3b8;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding: 0 16px;
}
</style>
