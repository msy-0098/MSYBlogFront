<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { getSiteProfile, type SiteProfile } from '../api/site'

const profile = ref<SiteProfile | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    profile.value = await getSiteProfile()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Profile failed to load'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="reading-page">
    <div class="reading-heading">
      <p class="section-kicker">About</p>
      <h1>{{ profile?.owner || 'About me' }}</h1>
      <p>{{ profile?.subtitle || 'Engineering notes and project practice.' }}</p>
    </div>

    <p v-if="loading" class="state-line">Loading profile...</p>
    <p v-else-if="error" class="state-line error-line">{{ error }}</p>

    <div v-else class="about-strip">
      <div>
        <h2>{{ profile?.siteTitle }}</h2>
        <p>{{ profile?.description }}</p>
        <p v-if="profile?.domain">Domain: {{ profile.domain }}</p>
      </div>
      <RouterLink class="secondary-button" to="/posts">Read posts</RouterLink>
    </div>
  </section>
</template>
