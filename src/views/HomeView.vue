<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import {
  getCategories,
  getPosts,
  getProjects,
  type PostSummary,
  type Project,
  type Taxonomy
} from '../api/blog'
import { getSiteProfile, type SiteProfile } from '../api/site'
import CategoryCloud from '../components/home/CategoryCloud.vue'
import FeaturedEssay from '../components/home/FeaturedEssay.vue'
import FeaturedProjects from '../components/home/FeaturedProjects.vue'
import FeaturedCodeMax from '../components/home/FeaturedCodeMax.vue'
import LatestPosts from '../components/home/LatestPosts.vue'

const fallbackProfile: SiteProfile = {
  siteTitle: '马森雨的技术博客',
  subtitle: 'Go、Vue 与 AI 工具的真实项目笔记',
  owner: '马森雨',
  domain: 'masenyu.top',
  description: '记录项目实践、技术复盘和持续成长。',
  aboutIntro: '像产品官网一样呈现个人技术品牌，也像工程日志一样保留真实实践。',
  navItems: ['首页', '文章', '分类', '项目', '关于']
}

const profile = ref<SiteProfile>(fallbackProfile)
const apiStatus = ref('Connecting /api/site')
const posts = ref<PostSummary[]>([])
const categories = ref<Taxonomy[]>([])
const projects = ref<Project[]>([])
const featuredPostOverride = ref<PostSummary | null>(null)
const contentLoading = ref(true)
const contentError = ref('')

const featuredPost = computed(() => {
  if (featuredPostOverride.value) {
    return featuredPostOverride.value
  }

  if (!posts.value.length) {
    return null
  }

  const preferredPost = profile.value.featuredPostSlug
    ? posts.value.find((post) => post.slug === profile.value.featuredPostSlug)
    : null

  return preferredPost || posts.value[0]
})

const latestPosts = computed(() =>
  posts.value.filter((post) => (featuredPost.value ? post.slug !== featuredPost.value.slug : true))
)

async function loadHomeContent() {
  contentLoading.value = true
  contentError.value = ''
  featuredPostOverride.value = null

  try {
    const [postPage, categoryList, projectList] = await Promise.all([
      getPosts({ page: 1, pageSize: 6 }),
      getCategories(),
      getProjects()
    ])

    const featuredSlug = profile.value.featuredPostSlug
    const featuredInLatest = featuredSlug ? postPage.list.find((post) => post.slug === featuredSlug) : null

    if (featuredSlug && !featuredInLatest) {
      try {
        const featuredFallbackPage = await getPosts({ slug: featuredSlug, page: 1, pageSize: 1 })
        featuredPostOverride.value = featuredFallbackPage.list[0] ?? null
      } catch {
        featuredPostOverride.value = null
      }
    }

    posts.value = postPage.list
    categories.value = categoryList
    projects.value = projectList.slice(0, 3)
  } catch (err) {
    contentError.value = err instanceof Error ? err.message : '首页内容加载失败'
  } finally {
    contentLoading.value = false
  }
}

onMounted(async () => {
  try {
    profile.value = await getSiteProfile()
    apiStatus.value = '站点配置已连接'
  } catch {
    apiStatus.value = '后端暂不可用，正在使用本地兜底资料'
  }

  await loadHomeContent()
})
</script>

<template>
  <div class="home-page">
    <FeaturedEssay
      :post="featuredPost"
      :loading="contentLoading"
      :error="contentError"
      :owner="profile.owner"
      :intro="profile.aboutIntro || profile.subtitle"
    />
    <LatestPosts :posts="latestPosts" :loading="contentLoading" :error="contentError" />
    <CategoryCloud :categories="categories" :loading="contentLoading" :error="contentError" />
    <FeaturedProjects :projects="projects" :loading="contentLoading" :error="contentError" />
    <FeaturedCodeMax />

    <section class="about-strip google-flow-section" aria-labelledby="about-strip-title">
      <div>
        <p class="section-kicker">关于</p>
        <h2 id="about-strip-title">关于我</h2>
        <p class="section-lead">
          {{ profile.aboutIntro || '像产品官网一样呈现个人技术品牌，也像工程日志一样保留真实实践。' }}
        </p>
        <p>{{ profile.description }}</p>
      </div>
      <RouterLink class="secondary-button" to="/about">了解更多</RouterLink>
    </section>

    <p class="api-status" aria-live="polite">{{ apiStatus }}</p>
  </div>
</template>
