<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'

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
import { useVerificationCountdown, type VerificationPurpose } from '../../composables/useVerificationCountdown'
import { FriendlyApiError, getFriendlyErrorMessage } from '../../utils/apiError'

const props = defineProps<{
  slug: string
}>()

const comments = ref<PostComment[]>([])
const commentsLoading = ref(false)
const commentError = ref('')
const authNotice = ref('')
const authError = ref('')
const commentContent = ref('')
const commentSubmitting = ref(false)
const authPanelOpen = ref(false)
const authMode = ref<'login' | 'register' | 'reset'>('login')
const authLoading = ref(false)
const codeSending = ref(false)
const authForm = ref({
  email: '',
  nickname: '',
  password: '',
  code: ''
})
const visitorSession = ref(sessionStorage.getItem('visitor_session') === '1')
const visitorUser = ref<VisitorUser | null>(readVisitorUser())
const verificationCountdown = useVerificationCountdown()
const codeCountdown = ref(0)
let activeVerification: { email: string; purpose: VerificationPurpose } | null = null
let stopCountdownWatch: (() => void) | null = null
let authRevision = 0
let activeSendRequest = 0

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
const verificationPurpose = computed<VerificationPurpose>(() => (authMode.value === 'reset' ? 'reset' : 'register'))

watch(
  () => props.slug,
  async () => {
    commentContent.value = ''
    await loadComments()
  },
  { immediate: true }
)

watch([authPanelOpen, () => authForm.value.email, authMode], syncVerificationSubscription, { immediate: true })

onUnmounted(releaseActiveVerification)

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
    commentError.value = getFriendlyErrorMessage(err, '评论加载失败')
  } finally {
    commentsLoading.value = false
  }
}

function openAuthPanel(mode: 'login' | 'register' | 'reset' = 'login') {
  authMode.value = mode
  authNotice.value = ''
  authError.value = ''
  authPanelOpen.value = true
}

function closeAuthPanel() {
  authPanelOpen.value = false
}

function syncVerificationSubscription() {
  invalidateAuthContext()
  releaseActiveVerification()
  if (!authPanelOpen.value || !authForm.value.email.trim()) return

  const email = authForm.value.email
  const purpose = verificationPurpose.value
  const remaining = verificationCountdown.remaining(email, purpose)
  activeVerification = { email, purpose }
  stopCountdownWatch = watch(remaining, (value) => {
    codeCountdown.value = value
  }, { immediate: true })
}

function invalidateAuthContext() {
  authRevision++
  activeSendRequest++
  codeSending.value = false
  authNotice.value = ''
  authError.value = ''
}

function releaseActiveVerification() {
  stopCountdownWatch?.()
  stopCountdownWatch = null
  codeCountdown.value = 0
  if (!activeVerification) return

  verificationCountdown.release(activeVerification.email, activeVerification.purpose)
  activeVerification = null
}

async function sendCode() {
  if (codeSending.value || codeCountdown.value > 0) {
    return
  }

  if (!authForm.value.email) {
    authError.value = '请先填写邮箱呀'
    return
  }

  const email = authForm.value.email
  const purpose = verificationPurpose.value
  const revision = authRevision
  const requestId = ++activeSendRequest
  codeSending.value = true
  authNotice.value = ''
  authError.value = ''

  try {
    const result = await sendVisitorEmailCode(email, purpose)
    if (!isCurrentAuthRequest(requestId, revision, email, purpose)) return
    if (!result.sent || !Number.isFinite(result.cooldownSeconds) || result.cooldownSeconds <= 0) {
      authError.value = '验证码发送失败，请稍后再试哦'
      return
    }

    verificationCountdown.start(email, purpose, result.cooldownSeconds)
    authNotice.value = '验证码已发送，请查收邮箱哦'
  } catch (err) {
    if (!isCurrentAuthRequest(requestId, revision, email, purpose)) return
    if (err instanceof FriendlyApiError && err.kind === 'rate-limit' && err.retryAfter && err.retryAfter > 0) {
      verificationCountdown.start(email, purpose, err.retryAfter)
    }
    authError.value = getFriendlyErrorMessage(err, '验证码发送失败，请稍后再试哦')
  } finally {
    if (requestId === activeSendRequest) {
      codeSending.value = false
    }
  }
}

function isCurrentAuthRequest(
  requestId: number,
  revision: number,
  email: string,
  purpose: VerificationPurpose
) {
  return (
    requestId === activeSendRequest &&
    revision === authRevision &&
    authPanelOpen.value &&
    authForm.value.email === email &&
    verificationPurpose.value === purpose
  )
}

async function submitAuth() {
  authLoading.value = true
  authNotice.value = ''
  authError.value = ''

  try {
    if (authMode.value === 'reset') {
      await resetVisitorPassword({
        email: authForm.value.email,
        code: authForm.value.code,
        newPassword: authForm.value.password
      })
      authMode.value = 'login'
      await nextTick()
      authNotice.value = '密码已重置，请用新密码登录'
      return
    }

    const result =
      authMode.value === 'register'
        ? await registerVisitor(authForm.value)
        : await loginVisitor({ email: authForm.value.email, password: authForm.value.password })

    setVisitorSession(result.user)
    closeAuthPanel()
  } catch (err) {
    authError.value = getFriendlyErrorMessage(err, '登录或注册失败，请稍后再试哦')
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
    commentError.value = getFriendlyErrorMessage(err, '评论发布失败')
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

    <p v-if="commentError" class="state-line error-line">
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
          <button data-test="close-auth-panel" type="button" @click="closeAuthPanel">关闭</button>
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
              class="visitor-send-code"
              data-test="send-code"
              type="button"
              :disabled="codeSending || codeCountdown > 0"
              @click="sendCode"
            >
              {{ codeSending ? '发送中...' : codeCountdown > 0 ? `${codeCountdown}s 后重发` : '发送验证码' }}
            </button>
          </div>
        </label>

        <p v-if="authNotice" class="state-line auth-notice" role="status">{{ authNotice }}</p>
        <p v-if="authError" class="state-line error-line" role="alert">{{ authError }}</p>

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

<style scoped>
.visitor-send-code {
  min-width: 7.5rem;
}
</style>
