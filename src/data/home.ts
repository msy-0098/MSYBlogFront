export interface LatestPost {
  title: string
  slug: string
  summary: string
  publishedAt: string
  category: string
  tags: string[]
  accent: string
}

export interface HomeCategory {
  name: string
  slug: string
  count: number
  summary: string
  accent: string
}

export interface FeaturedProject {
  name: string
  description: string
  url: string
  techStack: string[]
  accent: string
}

export const latestPosts: LatestPost[] = [
  {
    title: '用 Go 和 Vue 搭建个人博客骨架',
    slug: 'go-vue-blog-foundation',
    summary: '记录从项目结构、统一响应到本地联调的第一阶段实践。',
    publishedAt: '2026-06-26',
    category: 'Go',
    tags: ['Go', 'Vue', '工程化'],
    accent: '#3B82F6'
  },
  {
    title: 'SQLite 在轻量博客里的取舍',
    slug: 'sqlite-for-lightweight-blog',
    summary: '从部署成本、备份方式和后续迁移角度看 SQLite 的适用边界。',
    publishedAt: '2026-06-25',
    category: '后端',
    tags: ['SQLite', 'GORM'],
    accent: '#06B6D4'
  },
  {
    title: '首页粒子穹顶动效拆解',
    slug: 'particle-dome-homepage',
    summary: '半球坐标、实例化渲染和鼠标视差如何组成轻盈的首屏记忆点。',
    publishedAt: '2026-06-24',
    category: '前端',
    tags: ['Three.js', '动效'],
    accent: '#8B5CF6'
  },
  {
    title: 'Nginx 反向代理博客 API 的配置笔记',
    slug: 'nginx-blog-api-proxy',
    summary: '梳理静态资源托管、history 回退和 /api 转发的上线配置。',
    publishedAt: '2026-06-23',
    category: '部署',
    tags: ['Nginx', 'Linux'],
    accent: '#F59E0B'
  },
  {
    title: 'AI 工具协作下的开发节奏',
    slug: 'ai-assisted-development-rhythm',
    summary: '把需求拆解、测试验证和复盘沉淀组合成稳定的交付节奏。',
    publishedAt: '2026-06-22',
    category: '随笔',
    tags: ['AI', '效率'],
    accent: '#EF4444'
  },
  {
    title: 'systemd 管理 Go 服务的最小闭环',
    slug: 'systemd-go-service-loop',
    summary: '从工作目录、重启策略到 journalctl 日志查看的部署备忘。',
    publishedAt: '2026-06-21',
    category: 'Linux',
    tags: ['systemd', 'Go'],
    accent: '#10B981'
  }
]

export const homeCategories: HomeCategory[] = [
  {
    name: 'Go',
    slug: 'go',
    count: 8,
    summary: '后端服务、工程结构和性能实践',
    accent: '#3B82F6'
  },
  {
    name: 'Vue',
    slug: 'vue',
    count: 6,
    summary: '前端体验、组件设计和动效实现',
    accent: '#10B981'
  },
  {
    name: 'Linux',
    slug: 'linux',
    count: 5,
    summary: '服务器、进程管理和日常运维',
    accent: '#F59E0B'
  },
  {
    name: '部署',
    slug: 'deploy',
    count: 4,
    summary: 'Nginx、HTTPS、备份和上线记录',
    accent: '#06B6D4'
  },
  {
    name: '后端',
    slug: 'backend',
    count: 7,
    summary: '接口设计、数据持久化和安全边界',
    accent: '#8B5CF6'
  },
  {
    name: '随笔',
    slug: 'notes',
    count: 3,
    summary: '学习复盘、工具协作和成长记录',
    accent: '#EF4444'
  }
]

export const featuredProjects: FeaturedProject[] = [
  {
    name: '个人技术博客',
    description: 'Vue3 + Go + SQLite 构建的轻量技术作品展示站。',
    url: 'https://masenyu.top',
    techStack: ['Vue3', 'Go', 'SQLite'],
    accent: '#3B82F6'
  },
  {
    name: 'AI 协作交付工作流',
    description: '围绕需求拆解、测试验证和文档沉淀打造的开发闭环。',
    url: 'https://github.com/',
    techStack: ['AI', 'TDD', 'Automation'],
    accent: '#8B5CF6'
  },
  {
    name: '轻量部署模板',
    description: 'Nginx + systemd + SQLite 的小型 Web 应用上线模板。',
    url: 'https://gitee.com/',
    techStack: ['Nginx', 'systemd', 'Linux'],
    accent: '#F59E0B'
  }
]
