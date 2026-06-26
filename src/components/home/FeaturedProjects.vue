<script setup lang="ts">
import { featuredProjects } from '../../data/home'
</script>

<template>
  <section class="section-band" aria-labelledby="featured-projects-title">
    <div class="section-inner">
      <div class="section-heading">
        <p class="section-kicker">Builds</p>
        <h2 id="featured-projects-title">精选项目</h2>
        <RouterLink class="section-link" to="/projects">项目列表</RouterLink>
      </div>

      <div class="project-grid">
        <a
          v-for="project in featuredProjects"
          :key="project.name"
          class="project-card"
          :href="project.url"
          target="_blank"
          rel="noreferrer"
          :style="{ '--accent': project.accent }"
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
