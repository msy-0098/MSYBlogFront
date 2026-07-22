<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'

import {
  createPostComment,
  getPostComments,
  loginVisitor,
  logoutVisitor as requestVisitorLogout,
  registerVisitor,
  resetVisitorPassword,
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
const authMode = ref<'login' | 'register' | 'reset'>('login')
const authLoading = ref(false)
const codeSending = ref(false)
const codeCountdown = ref(0)
let codeTimer: ReturnType<typeof setInterval> | null = null
const authForm = ref({
  email: '',
  nickname: '',
  password: '',
  code: ''
})
const visitorSession = ref(sessionStorage.getItem('visitor_session') === '1')
const visitorUser = ref<VisitorUser | null>(readVisitorUser())

const isVisitorLoggedIn = computed(() => Boolean(visitorSession.value && visitorUser.value))
const authTitle = computed(() => {
  if (authMode.value === 'register') return '邮箱验证码注册'
  if (authMode.value === 'reset') return '重置密码'
  return '邮箱登录'
})
const authSubmitLabel = computed(() => {
  if (authLoading.value) return '处理中...'
  if (authMode.value === 'register') return '注册并登录'
  if (authMode.value === 'reset') return '确认重置'
  return '登录'
})

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

function openAuthPanel(mode: 'login' | 'register' | 'reset' = 'login') {
  authMode.value = mode
  authPanelOpen.value = true
}

function closeAuthPanel() {
  authPanelOpen.value = false
}

function startCodeCountdown(duration = 60) {
  codeCountdown.value = duration
  if (codeTimer) {
    clearInterval(codeTimer)
  }
  codeTimer = setInterval(() => {
    if (codeCountdown.value > 1) {
      codeCountdown.value--
    } else {
      codeCountdown.value = 0
      if (codeTimer) {
        clearInterval(codeTimer)
        codeTimer = null
      }
    }
  }, 1000)
}

onUnmounted(() => {
  if (codeTimer) {
    clearInterval(codeTimer)
    codeTimer = null
  }
})

async function sendCode() {
  if (codeSending.value || codeCountdown.value > 0) {
    return
  }

  if (!authForm.value.email) {
    commentError.value = '请先填写邮箱呀'
    return
  }

  codeSending.value = true
  commentError.value = ''

  try {
    const purpose = authMode.value === 'reset' ? 'reset' : 'register'
    await sendVisitorEmailCode(authForm.value.email, purpose)
    commentError.value = '验证码已发送，请查收邮箱哦'
    startCodeCountdown(60)
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
    if (authMode.value === 'reset') {
      await resetVisitorPassword({
        email: authForm.value.email,
        code: authForm.value.code,
        newPassword: authForm.value.password
      })
      commentError.value = '密码已重置，请用新密码登录'
      authMode.value = 'login'
      return
    }

    const result =
      authMode.value === 'register'
        ? await registerVisitor(authForm.value)
        : await loginVisitor({ email: authForm.value.email, password: authForm.value.password })

    setVisitorSession(result.user)
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
    // Cookie session carries auth; Bearer kept only as optional fallback in API client tests.
    await createPostComment(props.slug, commentContent.value.trim())
    commentContent.value = ''
    await loadComments()
  } catch (err) {
    commentError.value = err instanceof Error ? err.message : '评论发布失败'
  } finally {
    commentSubmitting.value = false
  }
}

async function logoutVisitor() {
  try {
    await requestVisitorLogout()
  } catch {
    // ignore
  }
  visitorSession.value = false
  visitorUser.value = null
  sessionStorage.removeItem('visitor_session')
  sessionStorage.removeItem('visitor_user')
  localStorage.removeItem('visitor_token')
  localStorage.removeItem('visitor_user')
}

function setVisitorSession(user: VisitorUser) {
  visitorSession.value = true
  visitorUser.value = user
  sessionStorage.setItem('visitor_session', '1')
  sessionStorage.setItem('visitor_user', JSON.stringify(user))
  localStorage.removeItem('visitor_token')
  localStorage.removeItem('visitor_user')
}

function readVisitorUser(): VisitorUser | null {
  const raw = sessionStorage.getItem('visitor_user') || localStorage.getItem('visitor_user')
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as VisitorUser
  } catch {
    sessionStorage.removeItem('visitor_user')
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
        <p>用邮箱登录后就能留下想法，评论会同步保存。</p>
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

    <p v-if="commentError" class="state-line" :class="{ 'error-line': !commentError.includes('已发送') && !commentError.includes('已重置') }">
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
            <h3>{{ authTitle }}</h3>
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
          <span>{{ authMode === 'reset' ? '新密码' : '密码' }}</span>
          <input
            v-model="authForm.password"
            :autocomplete="authMode === 'login' ? 'current-password' : 'new-password'"
            type="password"
          />
        </label>
        <label v-if="authMode === 'register' || authMode === 'reset'" class="visitor-field">
          <span>验证码</span>
          <div class="visitor-code-row">
            <input v-model="authForm.code" autocomplete="one-time-code" />
            <button
              data-test="send-visitor-code"
              type="button"
              :disabled="codeSending || codeCountdown > 0"
              @click="sendCode"
            >
              {{ codeSending ? '发送中...' : codeCountdown > 0 ? `${codeCountdown}s 后重发` : '发送验证码' }}
            </button>
          </div>
        </label>

        <button class="primary-button visitor-submit" type="button" :disabled="authLoading" @click="submitAuth">
          {{ authSubmitLabel }}
        </button>
        <button
          v-if="authMode === 'login'"
          class="visitor-switch"
          data-test="switch-visitor-auth-mode"
          type="button"
          @click="authMode = 'register'"
        >
          没有账号？去注册
        </button>
        <button
          v-if="authMode === 'login'"
          class="visitor-switch"
          data-test="open-visitor-reset"
          type="button"
          @click="authMode = 'reset'"
        >
          忘记密码？
        </button>
        <button
          v-if="authMode !== 'login'"
          class="visitor-switch"
          data-test="switch-visitor-auth-mode"
          type="button"
          @click="authMode = 'login'"
        >
          已有账号？去登录
        </button>
      </div>
    </div>
  </section>
</template>
