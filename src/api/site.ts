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
  navItems: string[]
}

export function createApiClient(config: CreateAxiosDefaults = {}): AxiosInstance {
  return axios.create({
    baseURL: '/api',
    timeout: 10000,
    ...config
  })
}

export const apiClient = createApiClient()

export async function getSiteProfile(client: AxiosInstance = apiClient): Promise<SiteProfile> {
  const response = await client.get<ApiEnvelope<SiteProfile>>('/site')

  if (response.data.code !== 0) {
    throw new Error(response.data.message || '站点信息加载失败')
  }

  return response.data.data
}

