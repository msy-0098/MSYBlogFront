<script setup lang="ts">
import { Delete, Edit, Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

import {
  createAdminProject,
  deleteAdminProject,
  getAdminProjects,
  updateAdminProject,
  type AdminProject,
  type AdminProjectPayload
} from '../../api/admin'
import { getFriendlyErrorMessage } from '../../utils/apiError'

const projects = ref<AdminProject[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editingProject = ref<AdminProject | null>(null)

const form = reactive({
  name: '',
  description: '',
  url: '',
  cover: '',
  techStackText: '',
  sort: 0,
  visible: true
})

onMounted(loadProjects)

async function loadProjects() {
  loading.value = true

  try {
    projects.value = await getAdminProjects()
  } catch (reason) {
    ElMessage.error(getFriendlyErrorMessage(reason, '项目列表加载失败'))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingProject.value = null
  Object.assign(form, {
    name: '',
    description: '',
    url: '',
    cover: '',
    techStackText: '',
    sort: 0,
    visible: true
  })
  dialogVisible.value = true
}

function openEdit(project: AdminProject) {
  editingProject.value = project
  Object.assign(form, {
    name: project.name,
    description: project.description,
    url: project.url,
    cover: project.cover,
    techStackText: project.techStack.join(', '),
    sort: project.sort,
    visible: project.visible
  })
  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
  editingProject.value = null
}

async function saveProject() {
  saving.value = true

  try {
    const payload: AdminProjectPayload = {
      name: form.name.trim(),
      description: form.description.trim(),
      url: form.url.trim(),
      cover: form.cover.trim(),
      techStack: form.techStackText
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean),
      sort: Number(form.sort) || 0,
      visible: Boolean(form.visible)
    }

    if (editingProject.value) {
      await updateAdminProject(editingProject.value.id, payload)
      ElMessage.success('项目已更新')
    } else {
      await createAdminProject(payload)
      ElMessage.success('项目已创建')
    }

    closeDialog()
    await loadProjects()
  } catch (reason) {
    ElMessage.error(getFriendlyErrorMessage(reason, '保存失败，请检查项目名称'))
  } finally {
    saving.value = false
  }
}

async function removeProject(project: AdminProject) {
  try {
    await ElMessageBox.confirm(`确认删除「${project.name}」吗？`, '删除项目', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteAdminProject(project.id)
    ElMessage.success('项目已删除')
    await loadProjects()
  } catch (reason) {
    if (reason !== 'cancel') {
      ElMessage.error(getFriendlyErrorMessage(reason, '删除项目失败'))
    }
  }
}
</script>

<template>
  <section class="admin-page">
    <div class="admin-page-heading">
      <div>
        <p class="section-kicker">作品</p>
        <h1>项目管理</h1>
      </div>

      <div class="admin-page-actions">
        <el-button :icon="Refresh" @click="loadProjects">刷新</el-button>
        <el-button :icon="Plus" type="primary" @click="openCreate">新建项目</el-button>
      </div>
    </div>

    <section class="admin-panel admin-table-panel">
      <el-table v-loading="loading" :data="projects" row-key="id">
        <el-table-column label="项目" min-width="220">
          <template #default="{ row }">
            <div class="admin-table-title">
              <strong>{{ row.name }}</strong>
              <span>{{ row.url || '-' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="简介" min-width="260" prop="description" />

        <el-table-column label="技术栈" min-width="180">
          <template #default="{ row }">
            <div class="admin-inline-tags">
              <el-tag v-for="tech in row.techStack" :key="tech" size="small">{{ tech }}</el-tag>
              <span v-if="!row.techStack?.length">-</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="排序" prop="sort" width="90" />

        <el-table-column label="可见" width="90">
          <template #default="{ row }">
            <el-tag :type="row.visible ? 'success' : 'info'" size="small">
              {{ row.visible ? '可见' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column align="right" label="操作" width="160">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" :icon="Delete" @click="removeProject(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="dialogVisible" :title="editingProject ? '编辑项目' : '新建项目'" width="620px">
      <el-form label-position="top" @submit.prevent="saveProject">
        <div class="admin-form-grid">
          <el-form-item label="名称">
            <el-input v-model="form.name" placeholder="项目名称" />
          </el-form-item>

          <el-form-item label="链接">
            <el-input v-model="form.url" placeholder="https://example.com" />
          </el-form-item>
        </div>

        <el-form-item label="简介">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>

        <el-form-item label="封面">
          <el-input v-model="form.cover" placeholder="/uploads/project.png" />
        </el-form-item>

        <el-form-item label="技术栈">
          <el-input v-model="form.techStackText" type="textarea" :rows="2" placeholder="Go、Vue、MySQL" />
        </el-form-item>

        <div class="admin-form-grid">
          <el-form-item label="排序">
            <el-input-number v-model="form.sort" :min="0" />
          </el-form-item>

          <el-form-item label="前台展示">
            <el-switch v-model="form.visible" active-text="可见" inactive-text="隐藏" />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveProject">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>
