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
          <p class="section-kicker">支持性内容</p>
          <h2 id="featured-projects-title">项目侧写</h2>
          <p class="section-lead">首页只保留几块轻量项目卡片，作为文章之外的补充上下文，而不是同权主角。</p>
        </div>
        <RouterLink class="section-link" to="/projects">项目列表</RouterLink>
      </div>

      <p v-if="loading" class="state-line">正在加载项目...</p>
      <p v-else-if="error" class="state-line error-line">{{ error }}</p>
      <p v-else-if="projects.length === 0" class="state-line">暂时还没有公开展示的项目。</p>

      <div v-else class="project-grid google-flow-grid project-support-grid">
        <a
          v-for="(project, index) in projects"
          :key="project.id || project.name"
          class="project-card project-support-card"
          :href="project.url || '/projects'"
          target="_blank"
          rel="noreferrer"
          :style="{ '--accent': accents[index % accents.length] }"
        >
          <span class="project-cover project-support-card__cover" aria-hidden="true">
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

<style scoped>
.project-support-grid {
  gap: 0.95rem;
}

.project-support-card {
  min-height: 0;
  padding: 0.95rem;
  border-radius: 1.25rem;
}

.project-support-card__cover {
  aspect-ratio: 16 / 8;
  margin-bottom: 0.85rem;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(226, 232, 240, 0.92)),
    #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.project-support-card .project-title {
  margin-top: 0;
  font-size: 1.05rem;
}

.project-support-card .project-description {
  color: #64748b;
  font-size: 0.92rem;
  line-height: 1.65;
}

.project-support-card .tag-row {
  margin-top: 0.85rem;
}

@media (max-width: 980px) {
  .project-support-grid {
    grid-template-columns: 1fr;
  }
}
</style>
