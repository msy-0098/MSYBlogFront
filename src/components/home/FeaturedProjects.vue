<script setup lang="ts">
import type { Project } from '../../api/blog'

defineProps<{
  projects: Project[]
  loading?: boolean
  error?: string
}>()

const accents = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981']
</script>

<template>
  <section class="section-band google-flow-section" aria-labelledby="featured-projects-title">
    <div class="section-inner">
      <div class="section-heading google-flow-heading">
        <div>
          <p class="section-kicker">Builds</p>
          <h2 id="featured-projects-title">Featured projects</h2>
          <p class="section-lead">Visible projects managed from the backend, ordered by sort weight and update time.</p>
        </div>
        <RouterLink class="section-link" to="/projects">Project list</RouterLink>
      </div>

      <p v-if="loading" class="state-line">Loading projects...</p>
      <p v-else-if="error" class="state-line error-line">{{ error }}</p>
      <p v-else-if="projects.length === 0" class="state-line">No visible projects yet.</p>

      <div v-else class="project-grid google-flow-grid">
        <a
          v-for="(project, index) in projects"
          :key="project.id || project.name"
          class="project-card"
          :href="project.url || '/projects'"
          target="_blank"
          rel="noreferrer"
          :style="{ '--accent': accents[index % accents.length] }"
        >
          <span class="project-cover" aria-hidden="true">
            <span>{{ project.name }}</span>
          </span>
          <span class="project-title">{{ project.name }}</span>
          <span class="project-description">{{ project.description }}</span>
          <span class="tag-row">
            <span v-for="tech in project.techStack" :key="tech">{{ tech }}</span>
          </span>
        </a>
      </div>
    </div>
  </section>
</template>
