import axios, {
  AxiosError,
  type AxiosAdapter,
  type AxiosInstance,
  type AxiosResponse,
  type CreateAxiosDefaults
} from 'axios'

import type { ApiEnvelope } from './site'

export const ADMIN_UNAUTHORIZED_EVENT = 'admin:unauthorized'

export interface AdminUser {
  id: number
  username: string
}

export interface AdminLoginPayload {
  username: string
  password: string
}

export interface AdminLoginResult {
  token: string
  user: AdminUser
}

export interface AdminListResult<T> {
  list: T[]
}

export interface AdminPageResult<T> extends AdminListResult<T> {
  page: number
  pageSize: number
  total: number
}

export interface AdminTaxonomy {
  id: number
  name: string
  slug: string
  postCount?: number
}

export type AdminPostStatus = 'draft' | 'published' | 'hidden'

export interface AdminPost {
  id: number
  title: string
  slug: string
  summary: string
  content: string
  cover: string
  status: AdminPostStatus
  viewCount: number
  categoryId: number
  category: AdminTaxonomy | null
  tags: AdminTaxonomy[]
  publishedAt: string
  createdAt: string
  updatedAt: string
}

export interface AdminPostPayload {
  title: string
  slug: string
  summary: string
  content: string
  cover: string
  status: AdminPostStatus
  categoryId: number
  tagIds: number[]
  publishedAt: string
}

export interface AdminProject {
  id: number
  name: string
  description: string
  url: string
  cover: string
  techStack: string[]
  sort: number
  visible: boolean
}

export type AdminProjectPayload = Omit<AdminProject, 'id'>

export interface AdminSettings {
  siteTitle: string
  subtitle: string
  owner: string
  domain: string
  description: string
  github: string
  gitee: string
  email: string
  icp: string
  navItems: string
}

export interface AdminUploadResult {
  id: number
  filename: string
  path: string
  mimeType: string
  size: number
}

export interface CreateAdminApiClientOptions extends CreateAxiosDefaults {
  getToken?: () => string | null | undefined
  onUnauthorized?: () => void
  adapter?: AxiosAdapter
}

export function createAdminApiClient(options: CreateAdminApiClientOptions = {}): AxiosInstance {
  const { getToken, onUnauthorized, ...axiosOptions } = options
  const client = axios.create({
    baseURL: '/api',
    timeout: 10000,
    ...axiosOptions
  })

  client.interceptors.request.use((config) => {
    const token = getToken?.()

    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }

    return config
  })

  client.interceptors.response.use(
    (response) => {
      if (response.status === 401 || response.data?.code === 401) {
        notifyUnauthorized(onUnauthorized)
        return Promise.reject(toUnauthorizedError(response))
      }

      return response
    },
    (error) => {
      if (error.response?.status === 401 || error.response?.data?.code === 401) {
        notifyUnauthorized(onUnauthorized)
      }

      return Promise.reject(error)
    }
  )

  return client
}

function notifyUnauthorized(onUnauthorized?: () => void) {
  onUnauthorized?.()

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(ADMIN_UNAUTHORIZED_EVENT))
  }
}

export const adminApiClient = createAdminApiClient({
  getToken: () => localStorage.getItem('admin_token'),
  onUnauthorized: () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
  }
})

export async function loginAdmin(
  payload: AdminLoginPayload,
  client: AxiosInstance = adminApiClient
): Promise<AdminLoginResult> {
  return unwrap((await client.post<ApiEnvelope<AdminLoginResult>>('/admin/login', payload)).data)
}

export async function getAdminProfile(client: AxiosInstance = adminApiClient): Promise<AdminUser> {
  return unwrap((await client.get<ApiEnvelope<AdminUser>>('/admin/profile')).data)
}

export async function getAdminPosts(
  params: { page?: number; pageSize?: number } = {},
  client: AxiosInstance = adminApiClient
): Promise<AdminPageResult<AdminPost>> {
  return unwrap((await client.get<ApiEnvelope<AdminPageResult<AdminPost>>>('/admin/posts', { params })).data)
}

export async function getAdminPost(id: number, client: AxiosInstance = adminApiClient): Promise<AdminPost> {
  return unwrap((await client.get<ApiEnvelope<AdminPost>>(`/admin/posts/${id}`)).data)
}

export async function createAdminPost(
  payload: AdminPostPayload,
  client: AxiosInstance = adminApiClient
): Promise<AdminPost> {
  return unwrap((await client.post<ApiEnvelope<AdminPost>>('/admin/posts', payload)).data)
}

export async function updateAdminPost(
  id: number,
  payload: AdminPostPayload,
  client: AxiosInstance = adminApiClient
): Promise<AdminPost> {
  return unwrap((await client.put<ApiEnvelope<AdminPost>>(`/admin/posts/${id}`, payload)).data)
}

export async function deleteAdminPost(id: number, client: AxiosInstance = adminApiClient): Promise<{ deleted: boolean }> {
  return unwrap((await client.delete<ApiEnvelope<{ deleted: boolean }>>(`/admin/posts/${id}`)).data)
}

export async function getAdminCategories(client: AxiosInstance = adminApiClient): Promise<AdminTaxonomy[]> {
  return unwrap((await client.get<ApiEnvelope<AdminListResult<AdminTaxonomy>>>('/admin/categories')).data).list
}

export async function createAdminCategory(
  payload: Pick<AdminTaxonomy, 'name' | 'slug'>,
  client: AxiosInstance = adminApiClient
): Promise<AdminTaxonomy> {
  return unwrap((await client.post<ApiEnvelope<AdminTaxonomy>>('/admin/categories', payload)).data)
}

export async function updateAdminCategory(
  id: number,
  payload: Pick<AdminTaxonomy, 'name' | 'slug'>,
  client: AxiosInstance = adminApiClient
): Promise<AdminTaxonomy> {
  return unwrap((await client.put<ApiEnvelope<AdminTaxonomy>>(`/admin/categories/${id}`, payload)).data)
}

export async function deleteAdminCategory(id: number, client: AxiosInstance = adminApiClient): Promise<{ deleted: boolean }> {
  return unwrap((await client.delete<ApiEnvelope<{ deleted: boolean }>>(`/admin/categories/${id}`)).data)
}

export async function getAdminTags(client: AxiosInstance = adminApiClient): Promise<AdminTaxonomy[]> {
  return unwrap((await client.get<ApiEnvelope<AdminListResult<AdminTaxonomy>>>('/admin/tags')).data).list
}

export async function createAdminTag(
  payload: Pick<AdminTaxonomy, 'name' | 'slug'>,
  client: AxiosInstance = adminApiClient
): Promise<AdminTaxonomy> {
  return unwrap((await client.post<ApiEnvelope<AdminTaxonomy>>('/admin/tags', payload)).data)
}

export async function updateAdminTag(
  id: number,
  payload: Pick<AdminTaxonomy, 'name' | 'slug'>,
  client: AxiosInstance = adminApiClient
): Promise<AdminTaxonomy> {
  return unwrap((await client.put<ApiEnvelope<AdminTaxonomy>>(`/admin/tags/${id}`, payload)).data)
}

export async function deleteAdminTag(id: number, client: AxiosInstance = adminApiClient): Promise<{ deleted: boolean }> {
  return unwrap((await client.delete<ApiEnvelope<{ deleted: boolean }>>(`/admin/tags/${id}`)).data)
}

export async function getAdminProjects(client: AxiosInstance = adminApiClient): Promise<AdminProject[]> {
  return unwrap((await client.get<ApiEnvelope<AdminListResult<AdminProject>>>('/admin/projects')).data).list
}

export async function createAdminProject(
  payload: AdminProjectPayload,
  client: AxiosInstance = adminApiClient
): Promise<AdminProject> {
  return unwrap((await client.post<ApiEnvelope<AdminProject>>('/admin/projects', payload)).data)
}

export async function updateAdminProject(
  id: number,
  payload: AdminProjectPayload,
  client: AxiosInstance = adminApiClient
): Promise<AdminProject> {
  return unwrap((await client.put<ApiEnvelope<AdminProject>>(`/admin/projects/${id}`, payload)).data)
}

export async function deleteAdminProject(id: number, client: AxiosInstance = adminApiClient): Promise<{ deleted: boolean }> {
  return unwrap((await client.delete<ApiEnvelope<{ deleted: boolean }>>(`/admin/projects/${id}`)).data)
}

export async function getAdminSettings(client: AxiosInstance = adminApiClient): Promise<AdminSettings> {
  return unwrap((await client.get<ApiEnvelope<AdminSettings>>('/admin/settings')).data)
}

export async function updateAdminSettings(
  payload: AdminSettings,
  client: AxiosInstance = adminApiClient
): Promise<AdminSettings> {
  return unwrap((await client.put<ApiEnvelope<AdminSettings>>('/admin/settings', payload)).data)
}

export async function uploadAdminImage(file: File, client: AxiosInstance = adminApiClient): Promise<AdminUploadResult> {
  const formData = new FormData()
  formData.append('file', file)

  return unwrap((await client.post<ApiEnvelope<AdminUploadResult>>('/admin/upload', formData)).data)
}

export function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (envelope.code !== 0) {
    throw new Error(envelope.message || '请求失败')
  }

  return envelope.data
}

function toUnauthorizedError(response: AxiosResponse): AxiosError {
  return new AxiosError(
    response.data?.message || 'unauthorized',
    AxiosError.ERR_BAD_REQUEST,
    response.config,
    response.request,
    response
  )
}
