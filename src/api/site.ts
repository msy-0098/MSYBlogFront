import axios, { type AxiosInstance, type CreateAxiosDefaults } from 'axios'

export interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

export interface SiteProfile {
  siteTitle: string
  subtitle: string
  owner: string
  domain: string
  description: string
  featuredPostSlug?: string
  aboutIntro?: string
  navItems: string[]
}

export function createApiClient(config: CreateAxiosDefaults = {}): AxiosInstance {
  const instance = axios.create({
    baseURL: '/api',
    timeout: 10000,
    withCredentials: true,
    ...config
  })

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.data && typeof error.response.data.message === 'string' && error.response.data.message.trim() !== '') {
        return Promise.reject(new Error(error.response.data.message))
      }
      if (error.response?.status === 429) {
        return Promise.reject(new Error('请求过于频繁，请 60 秒后再试哦'))
      }
      if (error.response?.status === 401) {
        return Promise.reject(new Error('未登录或登录已失效，请重新登录哦'))
      }
      if (error.response?.status === 403) {
        return Promise.reject(new Error('暂无权限执行此操作哦'))
      }
      if (error.response?.status === 404) {
        return Promise.reject(new Error('请求的资源不存在'))
      }
      if (error.response?.status >= 500) {
        return Promise.reject(new Error('服务器开了小差，请稍后再试哦'))
      }
      if (error.code === 'ECONNABORTED' || !error.response) {
        return Promise.reject(new Error('网络开小差了，请检查网络连接哦'))
      }
      return Promise.reject(error)
    }
  )

  return instance
}

export const apiClient = createApiClient()

export async function getSiteProfile(client: AxiosInstance = apiClient): Promise<SiteProfile> {
  const response = await client.get<ApiEnvelope<SiteProfile>>('/site')

  if (response.data.code !== 0) {
    throw new Error(response.data.message || '站点信息加载失败')
  }

  return response.data.data
}
