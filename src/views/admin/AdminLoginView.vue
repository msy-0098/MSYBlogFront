<script setup lang="ts">
import { Lock, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  username: '',
  password: ''
})

async function submitLogin() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  try {
    await authStore.login(form.username, form.password)
    router.push(resolveAdminRedirect(route.query.redirect))
  } catch {
    ElMessage.error('登录失败，请检查账号或密码')
  }
}

function resolveAdminRedirect(value: unknown): string {
  if (typeof value !== 'string') {
    return '/admin'
  }

  return value.startsWith('/admin') && !value.startsWith('//') ? value : '/admin'
}
</script>

<template>
  <main class="admin-login-page">
    <section class="admin-login-panel">
      <p class="section-kicker">管理端</p>
      <h1>后台登录</h1>
      <p>维护文章、项目和站点信息。</p>

      <el-form class="admin-login-form" label-position="top" @submit.prevent="submitLogin">
        <el-form-item label="用户名">
          <el-input
            v-model="form.username"
            autocomplete="username"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            autocomplete="current-password"
            :prefix-icon="Lock"
            show-password
            size="large"
            type="password"
          />
        </el-form-item>

        <el-button
          class="admin-login-button"
          native-type="submit"
          size="large"
          type="primary"
          :loading="authStore.loading"
        >
          登录
        </el-button>
      </el-form>
    </section>
  </main>
</template>
