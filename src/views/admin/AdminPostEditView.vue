<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import PostEditor from '../../components/admin/PostEditor.vue'
import {
  createAdminPost,
  getAdminCategories,
  getAdminPost,
  getAdminTags,
  updateAdminPost,
  type AdminPostPayload,
  type AdminTaxonomy
} from '../../api/admin'

const route = useRoute()
const router = useRouter()

const categories = ref<AdminTaxonomy[]>([])
const tags = ref<AdminTaxonomy[]>([])
const post = ref<AdminPostPayload>(emptyPost())
const loading = ref(false)
const saving = ref(false)

const postId = computed(() => Number(route.params.id) || 0)
const isEditing = computed(() => postId.value > 0)
const heading = computed(() => (isEditing.value ? '编辑文章' : '新建文章'))

onMounted(loadEditor)

async function loadEditor() {
  loading.value = true

  try {
    const [categoryList, tagList] = await Promise.all([getAdminCategories(), getAdminTags()])
    categories.value = categoryList
    tags.value = tagList

    if (isEditing.value) {
      const existing = await getAdminPost(postId.value)
      post.value = {
        title: existing.title,
        slug: existing.slug,
        summary: existing.summary,
        content: existing.content,
        cover: existing.cover,
        status: existing.status,
        categoryId: existing.categoryId,
        tagIds: existing.tags.map((tag) => tag.id),
        publishedAt: existing.publishedAt || ''
      }
    } else {
      post.value = emptyPost()
    }
  } catch {
    ElMessage.error('编辑数据加载失败')
  } finally {
    loading.value = false
  }
}

async function savePost(payload: AdminPostPayload) {
  if (!payload.categoryId) {
    ElMessage.warning('请选择分类')
    return
  }

  saving.value = true

  try {
    if (isEditing.value) {
      await updateAdminPost(postId.value, payload)
      ElMessage.success('文章已更新')
    } else {
      await createAdminPost(payload)
      ElMessage.success('文章已创建')
    }

    router.push('/admin/posts')
  } catch {
    ElMessage.error('保存失败，请检查标题、Slug 或分类')
  } finally {
    saving.value = false
  }
}

function emptyPost(): AdminPostPayload {
  return {
    title: '',
    slug: '',
    summary: '',
    content: '',
    cover: '',
    status: 'draft',
    categoryId: 0,
    tagIds: [],
    publishedAt: ''
  }
}
</script>

<template>
  <section class="admin-page">
    <div class="admin-page-heading">
      <div>
        <p class="section-kicker">Editor</p>
        <h1>{{ heading }}</h1>
      </div>

      <RouterLink class="admin-link-button" to="/admin/posts">
        <el-icon><ArrowLeft /></el-icon>
        返回列表
      </RouterLink>
    </div>

    <div v-loading="loading">
      <PostEditor
        :categories="categories"
        :initial-value="post"
        :saving="saving"
        :submit-label="isEditing ? '更新文章' : '创建文章'"
        :tags="tags"
        @cancel="router.push('/admin/posts')"
        @submit="savePost"
      />
    </div>
  </section>
</template>
