<template>
  <div class="defect-types-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon :size="24"><Collection /></el-icon>
          缺陷类型管理
        </h1>
        <p class="page-desc">管理缺陷分类、查看样本数量</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新增缺陷类型
        </el-button>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 缺陷类型列表 -->
    <el-row :gutter="20" class="defect-types-grid">
      <el-col
        v-for="type in defectTypes"
        :key="type.id"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
      >
        <el-card class="defect-type-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="type-info">
                <span class="type-code">{{ type.code }}</span>
                <el-tag :color="type.color || '#ff0000'" effect="dark" size="small">
                  {{ type.name }}
                </el-tag>
              </div>
              <div class="card-actions">
                <el-button link type="primary" @click="handleEdit(type)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button link type="danger" @click="handleDelete(type)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </template>

          <!-- 缩略图 -->
          <div class="card-thumbnail" @click="handleViewSamples(type)">
            <el-image
              v-if="type.thumbnailUrl"
              :src="type.thumbnailUrl"
              fit="cover"
              class="thumbnail-image"
              :preview-src-list="[type.thumbnailUrl]"
              preview-teleported
            >
              <template #error>
                <div class="image-error">
                  <el-icon :size="48"><Picture /></el-icon>
                  <span>无缩略图</span>
                </div>
              </template>
            </el-image>
            <div v-else class="no-thumbnail">
              <el-icon :size="48"><PictureFilled /></el-icon>
              <span>点击上传缩略图</span>
            </div>
          </div>

          <!-- 统计信息 -->
          <div class="card-stats">
            <div class="stat-item">
              <el-icon><Picture /></el-icon>
              <span>{{ type._count?.samples || 0 }} 样本</span>
            </div>
            <div class="stat-item">
              <el-icon><Edit /></el-icon>
              <span>{{ type._count?.annotations || 0 }} 标注</span>
            </div>
          </div>

          <!-- 分类 -->
          <div v-if="type.category" class="card-category">
            <el-tag size="small" type="info">{{ type.category }}</el-tag>
          </div>

          <!-- 描述 -->
          <div v-if="type.description" class="card-description">
            {{ type.description }}
          </div>

          <!-- 操作按钮 -->
          <div class="card-footer">
            <el-button type="primary" plain size="small" @click="handleViewSamples(type)">
              <el-icon><FolderOpened /></el-icon>
              查看样本
            </el-button>
            <el-button type="success" plain size="small" @click="handleAddSample(type)">
              <el-icon><Plus /></el-icon>
              添加样本
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 空状态 -->
    <el-empty v-if="defectTypes.length === 0 && !loading" description="暂无缺陷类型">
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新增缺陷类型
      </el-button>
    </el-empty>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingId ? '编辑缺陷类型' : '新增缺陷类型'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="缺陷名称" prop="name">
          <el-input v-model="form.name" placeholder="如：缺角、烧板" />
        </el-form-item>

        <el-form-item label="缺陷代码" prop="code">
          <el-input v-model="form.code" placeholder="留空自动生成" />
          <div class="form-tip">格式：DEFECT-时间戳</div>
        </el-form-item>

        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" placeholder="选择分类" style="width: 100%">
            <el-option label="形状缺陷" value="形状缺陷" />
            <el-option label="表面缺陷" value="表面缺陷" />
            <el-option label="颜色缺陷" value="颜色缺陷" />
            <el-option label="其他缺陷" value="其他缺陷" />
          </el-select>
        </el-form-item>

        <el-form-item label="标注框颜色" prop="color">
          <el-color-picker v-model="form.color" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="描述缺陷特征..."
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 样本库页面跳转提示 -->
    <el-dialog v-model="showSampleDialog" title="查看样本" width="400px" center>
      <p>即将跳转到样本库页面，查看该缺陷类型的所有样本。</p>
      <template #footer>
        <el-button @click="showSampleDialog = false">取消</el-button>
        <el-button type="primary" @click="navigateToSamples">
          前往样本库
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
  Collection,
  Plus,
  Refresh,
  Edit,
  Delete,
  Picture,
  PictureFilled,
  FolderOpened,
} from '@element-plus/icons-vue'
import * as defectsApi from '@/api/defects'

const router = useRouter()

// 状态
const loading = ref(false)
const submitting = ref(false)
const defectTypes = ref([])
const showCreateDialog = ref(false)
const showSampleDialog = ref(false)
const editingId = ref<number | null>(null)
const currentType = ref<any>(null)
const formRef = ref()

// 表单
const form = reactive({
  name: '',
  code: '',
  category: '',
  color: '#ff0000',
  description: '',
})

// 验证规则
const rules = {
  name: [{ required: true, message: '请输入缺陷名称', trigger: 'blur' }],
}

// 加载缺陷类型列表
const loadDefectTypes = async () => {
  loading.value = true
  try {
    const res: any = await defectsApi.getDefectTypes()
    defectTypes.value = res || []
  } catch (error: any) {
    console.error('加载缺陷类型失败:', error)
    ElMessage.error('加载缺陷类型失败：' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadDefectTypes()
  ElMessage.success('刷新成功')
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    if (editingId.value) {
      // 更新
      await defectsApi.updateDefectType(editingId.value, form)
      ElMessage.success('缺陷类型已更新')
    } else {
      // 新增
      await defectsApi.createDefectType(form)
      ElMessage.success('缺陷类型已创建')
    }

    showCreateDialog.value = false
    resetForm()
    loadDefectTypes()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败：' + (error.response?.data?.message || error.message))
    }
  } finally {
    submitting.value = false
  }
}

// 编辑
const handleEdit = (type: any) => {
  editingId.value = type.id
  form.name = type.name
  form.code = type.code
  form.category = type.category || ''
  form.color = type.color || '#ff0000'
  form.description = type.description || ''
  showCreateDialog.value = true
}

// 删除
const handleDelete = async (type: any) => {
  try {
    await ElMessageBox.confirm(
      `确定删除缺陷类型 "${type.name}"？删除后将无法恢复。`,
      '删除确认',
      { type: 'warning' }
    )

    await defectsApi.deleteDefectType(type.id)
    ElMessage.success('删除成功')
    loadDefectTypes()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + (error.response?.data?.message || error.message))
    }
  }
}

// 查看样本
const handleViewSamples = (type: any) => {
  currentType.value = type
  showSampleDialog.value = true
}

const navigateToSamples = () => {
  router.push({
    path: '/defects/samples',
    query: { defectTypeId: currentType.value?.id }
  })
  showSampleDialog.value = false
}

// 添加样本
const handleAddSample = (type: any) => {
  router.push({
    path: '/defects/samples',
    query: { defectTypeId: type.id, action: 'add' }
  })
}

// 重置表单
const resetForm = () => {
  editingId.value = null
  form.name = ''
  form.code = ''
  form.category = ''
  form.color = '#ff0000'
  form.description = ''
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

onMounted(() => {
  loadDefectTypes()
})
</script>

<style scoped>
.defect-types-page {
  padding: 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
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
  margin: 8px 0 0 48px;
  font-size: 14px;
  color: #64748b;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 缺陷类型网格 */
.defect-types-grid {
  margin-bottom: 24px;
}

/* 缺陷类型卡片 */
.defect-type-card {
  margin-bottom: 20px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.defect-type-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.type-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.type-code {
  font-size: 12px;
  color: #94a3b8;
  font-family: monospace;
}

.card-actions {
  display: flex;
  gap: 4px;
}

/* 缩略图区域 */
.card-thumbnail {
  height: 200px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.card-thumbnail:hover {
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
}

.thumbnail-image {
  width: 100%;
  height: 100%;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  gap: 8px;
}

.no-thumbnail {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  gap: 8px;
  font-size: 14px;
}

/* 统计信息 */
.card-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  color: #64748b;
  font-size: 13px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 分类 */
.card-category {
  margin-bottom: 8px;
}

/* 描述 */
.card-description {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 16px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 底部按钮 */
.card-footer {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

/* 表单提示 */
.form-tip {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .page-desc {
    margin: 8px 0 0 0;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
