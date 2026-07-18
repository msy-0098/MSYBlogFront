<script setup lang="ts">
import { Delete, Refresh, View } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref } from 'vue'

import OrbitPagination from '../../components/common/OrbitPagination.vue'

import {
  deleteAdminComment,
  getAdminComments,
  updateAdminComment,
  type AdminComment
} from '../../api/admin'

const comments = ref<AdminComment[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

onMounted(loadComments)

async function loadComments() {
  loading.value = true

  try {
    const result = await getAdminComments({ page: page.value, pageSize: pageSize.value })
    comments.value = result.list
    total.value = result.total
  } catch {
    ElMessage.error('评论列表加载失败')
  } finally {
    loading.value = false
  }
}

async function toggleComment(comment: AdminComment) {
  const nextStatus = comment.status === 'approved' ? 'hidden' : 'approved'

  try {
    await updateAdminComment(comment.id, nextStatus)
    ElMessage.success(nextStatus === 'approved' ? '评论已显示' : '评论已隐藏')
    await loadComments()
  } catch {
    ElMessage.error('评论状态更新失败')
  }
}

async function removeComment(comment: AdminComment) {
  try {
    await ElMessageBox.confirm('确认删除这条评论吗？', '删除评论', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteAdminComment(comment.id)
    ElMessage.success('评论已删除')
    await loadComments()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

function changePage(nextPage: number) {
  page.value = nextPage
  loadComments()
}

function formatDate(value: string): string {
  return value ? value.slice(0, 10) : '-'
}
</script>

<template>
  <section class="admin-page">
    <div class="admin-page-heading">
      <div>
        <p class="section-kicker">互动</p>
        <h1>评论管理</h1>
      </div>

      <div class="admin-page-actions">
        <el-button :icon="Refresh" @click="loadComments">刷新</el-button>
      </div>
    </div>

    <section class="admin-panel admin-table-panel">
      <el-table v-loading="loading" :data="comments" row-key="id">
        <el-table-column label="评论" min-width="280">
          <template #default="{ row }">
            <div class="admin-table-title">
              <strong>{{ row.content }}</strong>
              <span>{{ row.author.nickname || row.author.email }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="文章" min-width="180">
          <template #default="{ row }">
            {{ row.postTitle || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'approved' ? 'success' : 'info'" size="small">
              {{ row.status === 'approved' ? '显示中' : '已隐藏' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="时间" width="120">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column align="right" label="操作" width="180">
          <template #default="{ row }">
            <el-button link :icon="View" @click="toggleComment(row)">
              {{ row.status === 'approved' ? '隐藏' : '显示' }}
            </el-button>
            <el-button link type="danger" :icon="Delete" @click="removeComment(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="admin-pagination">
        <OrbitPagination
          :current-page="page"
          :total-pages="totalPages"
          variant="admin"
          @change="changePage"
        />
      </div>
    </section>
  </section>
</template>
