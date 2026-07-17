<script setup lang="ts">
import { Delete, Edit, Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

import {
  createAdminLink,
  deleteAdminLink,
  getAdminLinks,
  updateAdminLink,
  type AdminFriendLink,
  type AdminFriendLinkPayload
} from '../../api/admin'

const links = ref<AdminFriendLink[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editing = ref<AdminFriendLink | null>(null)

const form = reactive({
  name: '',
  url: '',
  description: '',
  logo: '',
  sort: 0,
  visible: true
})

onMounted(loadLinks)

async function loadLinks() {
  loading.value = true
  try {
    links.value = await getAdminLinks()
  } catch {
    ElMessage.error('友链列表加载失败')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  Object.assign(form, { name: '', url: '', description: '', logo: '', sort: 0, visible: true })
  dialogVisible.value = true
}

function openEdit(link: AdminFriendLink) {
  editing.value = link
  Object.assign(form, {
    name: link.name,
    url: link.url,
    description: link.description,
    logo: link.logo,
    sort: link.sort,
    visible: link.visible
  })
  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
  editing.value = null
}

async function saveLink() {
  saving.value = true
  try {
    const payload: AdminFriendLinkPayload = {
      name: form.name.trim(),
      url: form.url.trim(),
      description: form.description.trim(),
      logo: form.logo.trim(),
      sort: Number(form.sort) || 0,
      visible: Boolean(form.visible)
    }
    if (editing.value) {
      await updateAdminLink(editing.value.id, payload)
      ElMessage.success('友链已更新')
    } else {
      await createAdminLink(payload)
      ElMessage.success('友链已创建')
    }
    closeDialog()
    await loadLinks()
  } catch {
    ElMessage.error('保存失败，请检查名称和链接')
  } finally {
    saving.value = false
  }
}

async function removeLink(link: AdminFriendLink) {
  try {
    await ElMessageBox.confirm(`确认删除友链「${link.name}」？`, '删除确认', { type: 'warning' })
    await deleteAdminLink(link.id)
    ElMessage.success('已删除')
    await loadLinks()
  } catch {
    // cancelled or failed
  }
}
</script>

<template>
  <section class="admin-page">
    <div class="admin-page-heading">
      <div>
        <p class="section-kicker">内容</p>
        <h1>友情链接</h1>
      </div>
      <div class="admin-heading-actions">
        <el-button :icon="Refresh" @click="loadLinks">刷新</el-button>
        <el-button type="primary" :icon="Plus" data-test="admin-link-create" @click="openCreate">新增友链</el-button>
      </div>
    </div>

    <section v-loading="loading" class="admin-panel">
      <el-table :data="links" empty-text="还没有友链">
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column prop="url" label="链接" min-width="220" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="90" />
        <el-table-column label="展示" width="90">
          <template #default="{ row }">
            <el-tag :type="row.visible ? 'success' : 'info'" size="small">
              {{ row.visible ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" :icon="Delete" @click="removeLink(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑友链' : '新增友链'" width="520px" @close="closeDialog">
      <el-form label-position="top" @submit.prevent="saveLink">
        <el-form-item label="名称">
          <el-input v-model="form.name" data-test="admin-link-name" />
        </el-form-item>
        <el-form-item label="链接">
          <el-input v-model="form.url" placeholder="https://example.com" data-test="admin-link-url" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="Logo">
          <el-input v-model="form.logo" placeholder="/uploads/logo.png" />
        </el-form-item>
        <div class="admin-form-grid">
          <el-form-item label="排序">
            <el-input-number v-model="form.sort" :step="1" />
          </el-form-item>
          <el-form-item label="前台展示">
            <el-switch v-model="form.visible" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" :loading="saving" data-test="admin-link-save" @click="saveLink">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>