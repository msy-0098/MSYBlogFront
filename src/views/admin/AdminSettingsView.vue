<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

import { getAdminSettings, updateAdminSettings, type AdminSettings } from '../../api/admin'

const loading = ref(false)
const saving = ref(false)

const form = reactive<AdminSettings>({
  siteTitle: '',
  subtitle: '',
  owner: '',
  domain: '',
  description: '',
  github: '',
  gitee: '',
  email: '',
  icp: '',
  navItems: '',
  aiProvider: '',
  aiModel: '',
  aiBaseURL: '',
  aiConfigured: 'false'
})

onMounted(loadSettings)

async function loadSettings() {
  loading.value = true

  try {
    Object.assign(form, await getAdminSettings())
  } catch {
    ElMessage.error('站点设置加载失败')
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  saving.value = true

  try {
    await updateAdminSettings({ ...form })
    ElMessage.success('站点设置已保存')
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="admin-page">
    <div class="admin-page-heading">
      <div>
        <p class="section-kicker">配置</p>
        <h1>站点设置</h1>
      </div>

      <el-button :icon="Refresh" @click="loadSettings">刷新</el-button>
    </div>

    <section v-loading="loading" class="admin-panel admin-form-section">
      <el-form label-position="top" @submit.prevent="saveSettings">
        <div class="admin-form-grid">
          <el-form-item label="站点标题">
            <el-input v-model="form.siteTitle" />
          </el-form-item>

          <el-form-item label="副标题">
            <el-input v-model="form.subtitle" />
          </el-form-item>

          <el-form-item label="站长">
            <el-input v-model="form.owner" />
          </el-form-item>

          <el-form-item label="域名">
            <el-input v-model="form.domain" />
          </el-form-item>
        </div>

        <el-form-item label="站点描述">
          <el-input v-model="form.description" type="textarea" :rows="4" />
        </el-form-item>

        <el-form-item label="导航项">
          <div data-test="settings-nav-items-input">
            <el-input v-model="form.navItems" placeholder="首页,文章,分类,项目,关于" />
          </div>
        </el-form-item>

        <div class="admin-form-grid">
          <el-form-item label="GitHub">
            <el-input v-model="form.github" />
          </el-form-item>

          <el-form-item label="Gitee">
            <el-input v-model="form.gitee" />
          </el-form-item>

          <el-form-item label="邮箱">
            <el-input v-model="form.email" />
          </el-form-item>

          <el-form-item label="备案号">
            <el-input v-model="form.icp" />
          </el-form-item>
        </div>

        <div class="admin-editor-actions">
          <el-button type="primary" :loading="saving" data-test="settings-save-button" @click="saveSettings">保存设置</el-button>
        </div>

        <div class="admin-runtime-config" data-test="admin-runtime-config">
          <div class="admin-form-section-heading">
            <div>
              <span>Runtime</span>
              <strong>实际运行配置</strong>
            </div>
          </div>
          <div class="admin-runtime-grid">
            <div><span>AI 提供商</span><strong>{{ form.aiProvider || '未配置' }}</strong></div>
            <div><span>模型</span><strong>{{ form.aiModel || '未配置' }}</strong></div>
            <div><span>Base URL</span><strong>{{ form.aiBaseURL || '未配置' }}</strong></div>
          </div>
          <el-alert
            :title="form.aiConfigured === 'true' ? 'DeepSeek 已配置，管理端 AI 可直接调用' : 'DeepSeek 尚未配置 API Key'"
            :type="form.aiConfigured === 'true' ? 'success' : 'warning'"
            :closable="false"
            show-icon
          >
            API Key 只在后端环境变量中使用，不会返回浏览器，也不会保存到站点设置表。
          </el-alert>
        </div>
      </el-form>
    </section>
  </section>
</template>
