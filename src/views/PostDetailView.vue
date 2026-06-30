<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import {
  createPostComment,
  getPostComments,
  getPostDetail,
  loginVisitor,
  registerVisitor,
  sendVisitorEmailCode,
  type PostComment,
  type PostDetail,
  type VisitorUser
} from '../api/blog'
import MarkdownRenderer from '../components/blog/MarkdownRenderer.vue'

const route = useRoute()
const post = ref<PostDetail | null>(null)
const comments = ref<PostComment[]>([])
const loading = ref(true)
const commentsLoading = ref(false)
const error = ref('')
const commentError = ref('')
const commentContent = ref('')
const commentSubmitting = ref(false)
const authPanelOpen = ref(false)
const authMode = ref<'login' | 'register'>('login')
const authLoading = ref(false)
const codeSending = ref(false)
const authForm = ref({
  email: '',
  nickname: '',
  password: '',
  code: ''
})
const visitorToken = ref(localStorage.getItem('visitor_token') || '')
const visitorUser = ref<VisitorUser | null>(readVisitorUser())

const slug = computed(() => String(route.params.slug ?? ''))
const isVisitorLoggedIn = computed(() => Boolean(visitorToken.value && visitorUser.value))

async function loadPost() {
  loading.value = true
  error.value = ''

  try {
    post.value = await getPostDetail(slug.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '文章加载失败'
  } finally {
    loading.value = false
  }

  await loadComments()
}

async function loadComments() {
  if (!slug.value) {
    return
  }

  commentsLoading.value = true
  commentError.value = ''

  try {
    const result = await getPostComments(slug.value)
    comments.value = result.list
  } catch (err) {
    commentError.value = err instanceof Error ? err.message : '评论加载失败'
  } finally {
    commentsLoading.value = false
  }
}

function openAuthPanel(mode: 'login' | 'register' = 'login') {
  authMode.value = mode
  authPanelOpen.value = true
}

function closeAuthPanel() {
  authPanelOpen.value = false
}

async function sendCode() {
  if (!authForm.value.email) {
    commentError.value = '请先填写邮箱呀'
    return
  }

  codeSending.value = true
  commentError.value = ''

  try {
    await sendVisitorEmailCode(authForm.value.email)
    commentError.value = '验证码已发送，请查收邮箱哦'
  } catch (err) {
    commentError.value = err instanceof Error ? err.message : '验证码发送失败'
  } finally {
    codeSending.value = false
  }
}

async function submitAuth() {
  authLoading.value = true
  commentError.value = ''

  try {
    const result =
      authMode.value === 'register'
        ? await registerVisitor(authForm.value)
        : await loginVisitor({ email: authForm.value.email, password: authForm.value.password })
    setVisitorSession(result.token, result.user)
    closeAuthPanel()
  } catch (err) {
    commentError.value = err instanceof Error ? err.message : '登录注册失败'
  } finally {
    authLoading.value = false
  }
}

async function submitComment() {
  if (!isVisitorLoggedIn.value) {
    openAuthPanel('login')
    return
  }

  if (commentContent.value.trim().length < 2) {
    commentError.value = '评论至少写两个字哦'
    return
  }

  commentSubmitting.value = true
  commentError.value = ''

  try {
    await createPostComment(slug.value, commentContent.value.trim(), visitorToken.value)
    commentContent.value = ''
    await loadComments()
  } catch (err) {
    commentError.value = err instanceof Error ? err.message : '评论发布失败'
  } finally {
    commentSubmitting.value = false
  }
}

function logoutVisitor() {
  visitorToken.value = ''
  visitorUser.value = null
  localStorage.removeItem('visitor_token')
  localStorage.removeItem('visitor_user')
}

function setVisitorSession(token: string, user: VisitorUser) {
  visitorToken.value = token
  visitorUser.value = user
  localStorage.setItem('visitor_token', token)
  localStorage.setItem('visitor_user', JSON.stringify(user))
}

function readVisitorUser(): VisitorUser | null {
  const raw = localStorage.getItem('visitor_user')
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as VisitorUser
  } catch {
    localStorage.removeItem('visitor_user')
    return null
  }
}

function formatCommentTime(value: string): string {
  if (!value) {
    return ''
  }

  return value.slice(0, 10)
}

onMounted(loadPost)
watch(slug, loadPost)
</script>

<template>
  <section class="post-detail-page">
    <p v-if="loading" class="state-line">正在加载正文呀...</p>
    <p v-else-if="error" class="state-line error-line">{{ error }}</p>

    <template v-else-if="post">
      <header class="post-detail-header">
        <RouterLink class="section-link" to="/posts">返回文章</RouterLink>
        <p class="post-meta">{{ post.publishedAt }} · {{ post.category.name }} · {{ post.viewCount }} 次阅读</p>
        <h1>{{ post.title }}</h1>
        <p>{{ post.summary }}</p>
        <div class="tag-row">
          <RouterLink v-for="tag in post.tags" :key="tag.slug" :to="`/tags/${tag.slug}`">
            {{ tag.name }}
          </RouterLink>
        </div>
      </header>

      <MarkdownRenderer :content="post.content" />

      <nav class="adjacent-posts" aria-label="上一篇和下一篇文章">
        <RouterLink v-if="post.prev" :to="`/posts/${post.prev.slug}`">
          <span>上一篇</span>
          {{ post.prev.title }}
        </RouterLink>
        <RouterLink v-if="post.next" :to="`/posts/${post.next.slug}`">
          <span>下一篇</span>
          {{ post.next.title }}
        </RouterLink>
      </nav>

      <section class="comment-section" aria-label="文章评论">
        <div class="comment-heading">
          <div>
            <p class="section-kicker">Comments</p>
            <h2>评论</h2>
          </div>
          <button
            v-if="!isVisitorLoggedIn"
            class="comment-auth-button"
            data-test="open-comment-auth"
            type="button"
            @click="openAuthPanel('register')"
          >
            登录/注册后评论
          </button>
          <button v-else class="comment-auth-button" type="button" @click="logoutVisitor">
            {{ visitorUser?.nickname }} · 退出
          </button>
        </div>

        <p v-if="commentError" class="state-line" :class="{ 'error-line': !commentError.includes('已发送') }">
          {{ commentError }}
        </p>

        <div class="comment-composer">
          <textarea
            v-model="commentContent"
            :disabled="!isVisitorLoggedIn"
            placeholder="写下你的想法呀..."
            rows="4"
          ></textarea>
          <div class="comment-composer-actions">
            <span v-if="!isVisitorLoggedIn">登录后就可以参与讨论啦</span>
            <button class="primary-button" type="button" :disabled="commentSubmitting" @click="submitComment">
              {{ commentSubmitting ? '发布中...' : '发布评论' }}
            </button>
          </div>
        </div>

        <p v-if="commentsLoading" class="state-line">正在加载评论呀...</p>
        <div v-else class="comment-list">
          <article v-for="comment in comments" :key="comment.id" class="comment-item">
            <div>
              <strong>{{ comment.author.nickname || comment.author.email }}</strong>
              <time>{{ formatCommentTime(comment.createdAt) }}</time>
            </div>
            <p>{{ comment.content }}</p>
          </article>
          <p v-if="comments.length === 0" class="state-line">还没有评论，等你来开个头哦。</p>
        </div>

        <div v-if="authPanelOpen" class="visitor-auth-panel" role="dialog" aria-modal="true">
          <div class="visitor-auth-card">
            <div class="visitor-auth-header">
              <div>
                <p class="section-kicker">Account</p>
                <h3>{{ authMode === 'login' ? '邮箱登录' : '邮箱验证码注册' }}</h3>
              </div>
              <button type="button" @click="closeAuthPanel">关闭</button>
            </div>

            <label class="visitor-field">
              <span>邮箱</span>
              <input v-model="authForm.email" data-test="visitor-email" autocomplete="email" />
            </label>
            <label v-if="authMode === 'register'" class="visitor-field">
              <span>昵称</span>
              <input v-model="authForm.nickname" autocomplete="nickname" />
            </label>
            <label class="visitor-field">
              <span>密码</span>
              <input v-model="authForm.password" autocomplete="current-password" type="password" />
            </label>
            <label v-if="authMode === 'register'" class="visitor-field">
              <span>验证码</span>
              <div class="visitor-code-row">
                <input v-model="authForm.code" autocomplete="one-time-code" />
                <button type="button" :disabled="codeSending" @click="sendCode">
                  {{ codeSending ? '发送中' : '发送验证码' }}
                </button>
              </div>
            </label>

            <button class="primary-button visitor-submit" type="button" :disabled="authLoading" @click="submitAuth">
              {{ authLoading ? '处理中...' : authMode === 'login' ? '登录' : '注册并登录' }}
            </button>
            <button
              class="visitor-switch"
              type="button"
              @click="authMode = authMode === 'login' ? 'register' : 'login'"
            >
              {{ authMode === 'login' ? '没有账号？去注册' : '已有账号？去登录' }}
            </button>
          </div>
        </div>
      </section>
    </template>
  </section>
</template>
