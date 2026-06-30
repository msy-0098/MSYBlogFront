<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { getProjects, type Project } from '../api/blog'

const projects = ref<Project[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    projects.value = await getProjects()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Projects failed to load'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="reading-page">
    <div class="reading-heading">
      <p class="section-kicker">Builds</p>
      <h1>Projects</h1>
      <p>Project entries come from the backend project manager.</p>
    </div>

    <p v-if="loading" class="state-line">Loading projects...</p>
    <p v-else-if="error" class="state-line error-line">{{ error }}</p>

    <div v-else-if="projects.length" class="project-grid reading-grid">
      <a
        v-for="project in projects"
        :key="project.id"
        class="project-card"
        :href="project.url || '#'"
        target="_blank"
        rel="noreferrer"
      >
        <span class="project-cover" aria-hidden="true">
          <img v-if="project.cover" :src="project.cover" :alt="project.name" loading="lazy" decoding="async" />
          <span v-else>{{ project.name }}</span>
        </span>
        <span class="project-title">{{ project.name }}</span>
        <span class="project-description">{{ project.description }}</span>
        <span class="tag-row">
          <span v-for="tech in project.techStack" :key="tech">{{ tech }}</span>
        </span>
      </a>
    </div>

    <p v-else class="state-line">No visible projects yet.</p>
  </section>
</template>
