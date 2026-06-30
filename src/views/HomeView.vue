<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { getCategories, getPosts, getProjects, type PostSummary, type Project, type Taxonomy } from '../api/blog'
import { getSiteProfile, type SiteProfile } from '../api/site'
import CategoryCloud from '../components/home/CategoryCloud.vue'
import FeaturedProjects from '../components/home/FeaturedProjects.vue'
import HomeHero from '../components/home/HomeHero.vue'
import LatestPosts from '../components/home/LatestPosts.vue'

const fallbackProfile: SiteProfile = {
  siteTitle: 'MSY Blog',
  subtitle: 'Go, Vue and AI practice notes',
  owner: 'MSY',
  domain: 'masenyu.top',
  description: 'Real project notes, technical retrospectives, and continuous growth.',
  navItems: ['Home', 'Posts', 'Categories', 'Projects', 'About']
}

const profile = ref<SiteProfile>(fallbackProfile)
const apiStatus = ref('Connecting /api/site')
const posts = ref<PostSummary[]>([])
const categories = ref<Taxonomy[]>([])
const projects = ref<Project[]>([])
const contentLoading = ref(true)
const contentError = ref('')

async function loadHomeContent() {
  contentLoading.value = true
  contentError.value = ''

  try {
    const [postPage, categoryList, projectList] = await Promise.all([
      getPosts({ page: 1, pageSize: 6 }),
      getCategories(),
      getProjects()
    ])
    posts.value = postPage.list
    categories.value = categoryList
    projects.value = projectList.slice(0, 3)
  } catch (err) {
    contentError.value = err instanceof Error ? err.message : 'Homepage content failed to load'
  } finally {
    contentLoading.value = false
  }
}

onMounted(async () => {
  try {
    profile.value = await getSiteProfile()
    apiStatus.value = '/api/site connected'
  } catch {
    apiStatus.value = 'Backend unavailable, using local fallback profile'
  }

  await loadHomeContent()
})
</script>

<template>
  <div class="home-page">
    <HomeHero
      :owner="profile.owner"
      :subtitle="profile.subtitle"
      :description="profile.description"
    />
    <LatestPosts :posts="posts" :loading="contentLoading" :error="contentError" />
    <CategoryCloud :categories="categories" :loading="contentLoading" :error="contentError" />
    <FeaturedProjects :projects="projects" :loading="contentLoading" :error="contentError" />

    <section class="about-strip google-flow-section" aria-labelledby="about-strip-title">
      <div>
        <p class="section-kicker">About</p>
        <h2 id="about-strip-title">关于我</h2>
        <p class="section-lead">像产品官网一样呈现个人技术品牌，也像工程日志一样保留真实实践。</p>
        <p>{{ profile.description }}</p>
      </div>
      <RouterLink class="secondary-button" to="/about">了解更多</RouterLink>
    </section>

    <p class="api-status" aria-live="polite">{{ apiStatus }}</p>
  </div>
</template>
