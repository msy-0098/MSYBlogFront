<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { reactive, ref, watch } from 'vue'

import {
  type AdminPostPayload,
  type AdminPostStatus,
  type AdminTaxonomy,
  beautifyAdminPost,
  uploadAdminImage
} from '../../api/admin'

const props = withDefaults(
  defineProps<{
    categories: AdminTaxonomy[]
    tags: AdminTaxonomy[]
    initialValue: AdminPostPayload
    saving?: boolean
    submitLabel?: string
  }>(),
  {
    saving: false,
    submitLabel: '保存文章'
  }
)

const emit = defineEmits<{
  submit: [payload: AdminPostPayload]
  cancel: []
}>()

const statusOptions: Array<{ label: string; value: AdminPostStatus }> = [
  { label: '草稿', value: 'draft' },
  { label: '发布', value: 'published' },
  { label: '隐藏', value: 'hidden' }
]

const beautifying = ref(false)

const form = reactive({
  title: '',
  slug: '',
  summary: '',
  content: '',
  cover: '',
  status: 'draft' as AdminPostStatus,
  categoryId: '',
  tagIds: [] as string[],
  publishedAt: '',
  uploadingCover: false
})

watch(
  () => props.initialValue,
  (value) => {
    form.title = value.title || ''
    form.slug = value.slug || ''
    form.summary = value.summary || ''
    form.content = value.content || ''
    form.cover = value.cover || ''
    form.status = value.status || 'draft'
    form.categoryId = value.categoryId ? String(value.categoryId) : ''
    form.tagIds = Array.isArray(value.tagIds) ? value.tagIds.map(String) : []
    form.publishedAt = toDateTimeInputValue(value.publishedAt)
  },
  { immediate: true, deep: true }
)

function submitForm() {
  emit('submit', {
    title: form.title.trim(),
    slug: form.slug.trim(),
    summary: form.summary.trim(),
    content: form.content,
    cover: form.cover.trim(),
    status: form.status,
    categoryId: Number(form.categoryId) || 0,
    tagIds: form.tagIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0),
    publishedAt: toRfc3339(form.publishedAt)
  })
}

async function beautifyContent() {
  if (!form.content.trim()) {
    ElMessage.warning('请先填写文章正文呀')
    return
  }

  beautifying.value = true
  try {
    const result = await beautifyAdminPost({
      title: form.title,
      summary: form.summary,
      content: form.content
    })
    form.title = result.title
    form.summary = result.summary
    form.content = result.content
    ElMessage.success('DeepSeek 润色完成啦')
  } catch {
    ElMessage.error('DeepSeek 暂时不可用，请检查服务端配置')
  } finally {
    beautifying.value = false
  }
}

async function uploadCover(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  try {
    form.uploadingCover = true
    const result = await uploadAdminImage(file)
    form.cover = result.path
    ElMessage.success('封面已上传')
  } catch {
    ElMessage.error('上传失败，请选择 5MB 内的图片')
  } finally {
    form.uploadingCover = false
    input.value = ''
  }
}

function toRfc3339(value: string): string {
  if (!value) {
    return ''
  }

  const [datePart, timePart = ''] = value.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour = 0, minute = 0, second = 0] = timePart.split(':').map(Number)
  const date = new Date(year, month - 1, day, hour, minute, second)

  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

function toDateTimeInputValue(value: string): string {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate())
  ].join('-') + `T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0')
}
</script>

<template>
  <form class="post-editor" @submit.prevent="submitForm">
    <section class="admin-panel admin-form-section">
      <div class="admin-form-section-heading">
        <div>
          <span>Content</span>
          <strong>文章内容</strong>
        </div>
      </div>

      <div class="admin-form-grid">
        <label class="admin-field" data-test="post-title-input">
          <span>标题</span>
          <input
            v-model="form.title"
            required
            type="text"
            placeholder="例如：第四阶段后台管理复盘"
          />
        </label>

        <label class="admin-field" data-test="post-slug-input">
          <span>Slug</span>
          <input
            v-model="form.slug"
            required
            type="text"
            placeholder="fourth-stage-admin"
          />
        </label>
      </div>

      <label class="admin-field" data-test="post-summary-input">
        <span>摘要</span>
        <textarea
          v-model="form.summary"
          rows="3"
          placeholder="用于文章列表展示的简短摘要"
        />
      </label>

      <label class="admin-field" data-test="post-content-input">
        <span>正文 Markdown</span>
        <textarea
          v-model="form.content"
          class="post-editor-content"
          rows="14"
          placeholder="# 标题&#10;&#10;开始记录你的内容"
        />
      </label>
    </section>

    <section class="admin-panel admin-form-section">
      <div class="admin-form-section-heading">
        <div>
          <span>Publishing</span>
          <strong>发布设置</strong>
        </div>
      </div>

      <div class="admin-form-grid">
        <label class="admin-field">
          <span>状态</span>
          <select v-model="form.status" data-test="post-status-select">
            <option v-for="status in statusOptions" :key="status.value" :value="status.value">
              {{ status.label }}
            </option>
          </select>
        </label>

        <label class="admin-field">
          <span>分类</span>
          <select v-model="form.categoryId" data-test="post-category-select" required>
            <option value="">选择分类</option>
            <option v-for="category in categories" :key="category.id" :value="String(category.id)">
              {{ category.name }}
            </option>
          </select>
        </label>

        <label class="admin-field">
          <span>标签</span>
          <select v-model="form.tagIds" data-test="post-tags-select" multiple>
            <option v-for="tag in tags" :key="tag.id" :value="String(tag.id)">
              {{ tag.name }}
            </option>
          </select>
        </label>

        <label class="admin-field" data-test="post-published-at-input">
          <span>发布时间</span>
          <input v-model="form.publishedAt" type="datetime-local" />
        </label>
      </div>

      <div class="admin-cover-tools">
        <label class="admin-field" data-test="post-cover-input">
          <span>封面地址</span>
          <input
            v-model="form.cover"
            type="text"
            placeholder="/uploads/cover.png"
          />
        </label>

        <label class="admin-upload-button">
          <input accept="image/*" type="file" @change="uploadCover" />
          <span>{{ form.uploadingCover ? '上传中...' : '上传封面' }}</span>
        </label>
      </div>
    </section>

    <div class="admin-editor-actions">
      <button class="admin-native-button secondary" type="button" @click="emit('cancel')">取消</button>
      <button class="admin-native-button primary" type="submit" :disabled="saving">
        {{ saving ? '保存中...' : submitLabel }}
      </button>
    </div>
  </form>
</template>
