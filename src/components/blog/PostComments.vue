<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import {
  createPostComment,
  getPostComments,
  loginVisitor,
  registerVisitor,
  sendVisitorEmailCode,
  type PostComment,
  type VisitorUser
} from '../../api/blog'

const props = defineProps<{
  slug: string
}>()

const comments = ref<PostComment[]>([])
const commentsLoading = ref(false)
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

const isVisitorLoggedIn = computed(() => Boolean(visitorToken.value && visitorUser.value))

watch(
  () => props.slug,
  async () => {
    commentContent.value = ''
    await loadComments()
  },
  { immediate: true }
)

async function loadComments() {
  if (!props.slug) {
    comments.value = []
    return
  }

  commentsLoading.value = true
  commentError.value = ''

  try {
    const result = await getPostComments(props.slug)
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
    await createPostComment(props.slug, commentContent.value.trim(), visitorToken.value)
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
</script>

<template>
  <section class="comment-section" data-test="comment-section" aria-label="文章评论">
    <div class="comment-heading">
      <div>
        <p class="section-kicker">讨论</p>
        <h2>读者评论</h2>
        <p>用邮箱登录后就能留下想法，评论会同步保存到 MySQL。</p>
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
            <p class="section-kicker">账号</p>
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
            <button data-test="send-visitor-code" type="button" :disabled="codeSending" @click="sendCode">
              {{ codeSending ? '发送中' : '发送验证码' }}
            </button>
          </div>
        </label>

        <button class="primary-button visitor-submit" type="button" :disabled="authLoading" @click="submitAuth">
          {{ authLoading ? '处理中...' : authMode === 'login' ? '登录' : '注册并登录' }}
        </button>
        <button
          class="visitor-switch"
          data-test="switch-visitor-auth-mode"
          type="button"
          @click="authMode = authMode === 'login' ? 'register' : 'login'"
        >
          {{ authMode === 'login' ? '没有账号？去注册' : '已有账号？去登录' }}
        </button>
      </div>
    </div>
  </section>
</template>
