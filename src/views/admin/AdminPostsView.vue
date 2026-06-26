<script setup lang="ts">
import { Delete, Edit, Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import {
  deleteAdminPost,
  getAdminPosts,
  type AdminPost,
  type AdminPostStatus
} from '../../api/admin'

const posts = ref<AdminPost[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const statusLabels: Record<AdminPostStatus, string> = {
  draft: '草稿',
  published: '已发布',
  hidden: '隐藏'
}

const statusTypes: Record<AdminPostStatus, 'info' | 'success' | 'warning'> = {
  draft: 'info',
  published: 'success',
  hidden: 'warning'
}

onMounted(loadPosts)

async function loadPosts() {
  loading.value = true

  try {
    const result = await getAdminPosts({ page: page.value, pageSize: pageSize.value })
    posts.value = result.list
    total.value = result.total
  } catch {
    ElMessage.error('文章列表加载失败')
  } finally {
    loading.value = false
  }
}

async function removePost(post: AdminPost) {
  try {
    await ElMessageBox.confirm(`确认删除「${post.title}」吗？`, '删除文章', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteAdminPost(post.id)
    ElMessage.success('文章已删除')
    await loadPosts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

function changePage(nextPage: number) {
  page.value = nextPage
  loadPosts()
}

function formatDate(value: string): string {
  if (!value) {
    return '-'
  }

  return value.slice(0, 10)
}
</script>

<template>
  <section class="admin-page">
    <div class="admin-page-heading">
      <div>
        <p class="section-kicker">Posts</p>
        <h1>文章管理</h1>
      </div>

      <div class="admin-page-actions">
        <el-button :icon="Refresh" @click="loadPosts">刷新</el-button>
        <RouterLink class="admin-link-button admin-link-button-primary" to="/admin/posts/create">
          <el-icon><Plus /></el-icon>
          新建文章
        </RouterLink>
      </div>
    </div>

    <section class="admin-panel admin-table-panel">
      <el-table v-loading="loading" :data="posts" row-key="id">
        <el-table-column label="标题" min-width="240">
          <template #default="{ row }">
            <div class="admin-table-title">
              <strong>{{ row.title }}</strong>
              <span>{{ row.slug }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="分类" min-width="120">
          <template #default="{ row }">
            {{ row.category?.name || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="标签" min-width="180">
          <template #default="{ row }">
            <div class="admin-inline-tags">
              <el-tag v-for="tag in row.tags" :key="tag.id" size="small">{{ tag.name }}</el-tag>
              <span v-if="!row.tags?.length">-</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTypes[row.status as AdminPostStatus]" size="small">
              {{ statusLabels[row.status as AdminPostStatus] || row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="发布时间" width="120">
          <template #default="{ row }">
            {{ formatDate(row.publishedAt) }}
          </template>
        </el-table-column>

        <el-table-column align="right" label="操作" width="160">
          <template #default="{ row }">
            <RouterLink class="admin-icon-link" :to="`/admin/posts/${row.id}/edit`" aria-label="编辑文章">
              <el-icon><Edit /></el-icon>
            </RouterLink>
            <el-button link type="danger" :icon="Delete" @click="removePost(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="admin-pagination">
        <el-pagination
          background
          layout="prev, pager, next, total"
          :current-page="page"
          :page-size="pageSize"
          :total="total"
          @current-change="changePage"
        />
      </div>
    </section>
  </section>
</template>
