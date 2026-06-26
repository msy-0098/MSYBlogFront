<script setup lang="ts">
import { Delete, Edit, Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, ref, watch } from 'vue'

import {
  createAdminCategory,
  createAdminTag,
  deleteAdminCategory,
  deleteAdminTag,
  getAdminCategories,
  getAdminTags,
  updateAdminCategory,
  updateAdminTag,
  type AdminTaxonomy
} from '../../api/admin'

const props = defineProps<{
  mode: 'categories' | 'tags'
}>()

const items = ref<AdminTaxonomy[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editingItem = ref<AdminTaxonomy | null>(null)

const form = reactive({
  name: '',
  slug: ''
})

const copy = computed(() =>
  props.mode === 'categories'
    ? {
        kicker: 'Categories',
        title: '分类管理',
        itemName: '分类'
      }
    : {
        kicker: 'Tags',
        title: '标签管理',
        itemName: '标签'
      }
)

watch(
  () => props.mode,
  () => {
    closeDialog()
    loadItems()
  }
)

onMounted(loadItems)

async function loadItems() {
  loading.value = true

  try {
    items.value = props.mode === 'categories' ? await getAdminCategories() : await getAdminTags()
  } catch {
    ElMessage.error(`${copy.value.itemName}加载失败`)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingItem.value = null
  form.name = ''
  form.slug = ''
  dialogVisible.value = true
}

function openEdit(item: AdminTaxonomy) {
  editingItem.value = item
  form.name = item.name
  form.slug = item.slug
  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
  editingItem.value = null
  form.name = ''
  form.slug = ''
}

async function saveItem() {
  saving.value = true

  try {
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim()
    }

    if (editingItem.value) {
      if (props.mode === 'categories') {
        await updateAdminCategory(editingItem.value.id, payload)
      } else {
        await updateAdminTag(editingItem.value.id, payload)
      }
      ElMessage.success(`${copy.value.itemName}已更新`)
    } else {
      if (props.mode === 'categories') {
        await createAdminCategory(payload)
      } else {
        await createAdminTag(payload)
      }
      ElMessage.success(`${copy.value.itemName}已创建`)
    }

    closeDialog()
    await loadItems()
  } catch {
    ElMessage.error('保存失败，请检查名称或 Slug')
  } finally {
    saving.value = false
  }
}

async function removeItem(item: AdminTaxonomy) {
  try {
    await ElMessageBox.confirm(`确认删除「${item.name}」吗？`, `删除${copy.value.itemName}`, {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })

    if (props.mode === 'categories') {
      await deleteAdminCategory(item.id)
    } else {
      await deleteAdminTag(item.id)
    }

    ElMessage.success(`${copy.value.itemName}已删除`)
    await loadItems()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(props.mode === 'categories' ? '删除失败，可能仍有关联文章' : '删除失败')
    }
  }
}
</script>

<template>
  <section class="admin-page">
    <div class="admin-page-heading">
      <div>
        <p class="section-kicker">{{ copy.kicker }}</p>
        <h1>{{ copy.title }}</h1>
      </div>

      <div class="admin-page-actions">
        <el-button :icon="Refresh" @click="loadItems">刷新</el-button>
        <el-button :icon="Plus" type="primary" @click="openCreate">新建{{ copy.itemName }}</el-button>
      </div>
    </div>

    <section class="admin-panel admin-table-panel">
      <el-table v-loading="loading" :data="items" row-key="id">
        <el-table-column label="名称" min-width="180">
          <template #default="{ row }">
            <div class="admin-table-title">
              <strong>{{ row.name }}</strong>
              <span>{{ row.slug }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="文章数" prop="postCount" width="120" />

        <el-table-column align="right" label="操作" width="160">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" :icon="Delete" @click="removeItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="dialogVisible" :title="editingItem ? `编辑${copy.itemName}` : `新建${copy.itemName}`" width="420px">
      <el-form label-position="top" @submit.prevent="saveItem">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="例如：Go 实战" />
        </el-form-item>
        <el-form-item label="Slug">
          <el-input v-model="form.slug" placeholder="go-practice" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveItem">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>
