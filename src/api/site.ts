import axios, { type AxiosInstance, type CreateAxiosDefaults } from 'axios'

import { fromApiEnvelope, toFriendlyApiError } from '../utils/apiError'

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
    (error) => Promise.reject(toFriendlyApiError(error))
  )

  return instance
}

export const apiClient = createApiClient()

export async function getSiteProfile(client: AxiosInstance = apiClient): Promise<SiteProfile> {
  const response = await client.get<ApiEnvelope<SiteProfile>>('/site')

  if (response.data.code !== 0) {
    throw fromApiEnvelope(response.data)
  }

  return response.data.data
}
