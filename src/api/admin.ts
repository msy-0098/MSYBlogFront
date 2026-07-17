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
  email?: string
  nickname?: string
  role?: string
  createdAt?: string
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

export interface AdminFriendLink {
  id: number
  name: string
  url: string
  description: string
  logo: string
  sort: number
  visible: boolean
}

export type AdminFriendLinkPayload = Omit<AdminFriendLink, 'id'>

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
  aiProvider?: string
  aiModel?: string
  aiBaseURL?: string
  aiConfigured?: string
}

export interface AdminUploadResult {
  id: number
  filename: string
  path: string
  mimeType: string
  size: number
}

export interface AdminComment {
  id: number
  postId: number
  postTitle: string
  content: string
  status: 'approved' | 'hidden'
  author: {
    email: string
    nickname: string
  }
  createdAt: string
}

export interface AdminDashboardStats {
  postCount: number
  publishedPostCount: number
  draftPostCount?: number
  totalViews: number
  commentCount: number
  approvedCommentCount?: number
  hiddenCommentCount?: number
  visitorCount: number
}

export interface AdminAIAnalysis {
  mode: string
  summary: string
  signals: string[]
}

export interface AdminIPBan {
  id: number
  ip: string
  reason: string
  active: boolean
  expiresAt?: string | null
  createdAt: string
}

export interface AdminTopIP {
  ip: string
  requests: number
  failures: number
  lastSeen: string
  banned: boolean
}

export interface AdminAnalytics {
  totalRequests: number
  todayRequests: number
  uniqueIPs: number
  failedRequests: number
  topIPs: AdminTopIP[]
  topPaths: Array<{ path: string; requests: number }>
  recentBans: AdminIPBan[]
}

export interface AdminTrendPoint {
  date: string
  requests: number
  uniqueIPs: number
  comments: number
  newVisitors: number
}

export interface AdminTrends {
  days: number
  points: AdminTrendPoint[]
}

export interface AdminVisitor {
  id: number
  username: string
  email: string
  nickname: string
  role: string
  createdAt: string
}

export interface AdminAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AdminDashboard {
  stats: AdminDashboardStats
  analytics?: AdminAnalytics
  trends?: AdminTrends
  aiAnalysis?: AdminAIAnalysis
  recentComments: AdminComment[]
}

export type AdminAIConversationMessageStatus = 'streaming' | 'completed' | 'aborted' | 'failed'

export interface AdminAIConversationMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  status?: AdminAIConversationMessageStatus
  sequence?: number
  createdAt?: string
}

export interface AdminAIConversationSummary {
  id: number
  title: string
  messageCount: number
  lastMessageAt: string | null
}

export interface AdminAIConversationDetail extends AdminAIConversationSummary {
  messages: AdminAIConversationMessage[]
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
    withCredentials: true,
    ...axiosOptions
  })

  client.interceptors.request.use((config) => {
    const token = getToken?.()

    // Prefer cookie session; still allow Bearer for tests / legacy clients.
    if (token && token !== 'cookie') {
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

function clearStoredAdminSession() {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('admin_session')
    sessionStorage.removeItem('admin_user')
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
  }
}

export function handleAdminUnauthorized() {
  notifyUnauthorized(clearStoredAdminSession)
}

export const adminApiClient = createAdminApiClient({
  // Cookie session is primary; leave getToken empty so no Bearer header is forced.
  onUnauthorized: clearStoredAdminSession
})

export async function loginAdmin(
  payload: AdminLoginPayload,
  client: AxiosInstance = adminApiClient
): Promise<AdminLoginResult> {
  return unwrap((await client.post<ApiEnvelope<AdminLoginResult>>('/admin/login', payload)).data)
}

export async function logoutAdmin(client: AxiosInstance = adminApiClient): Promise<{ loggedOut: boolean }> {
  return unwrap((await client.post<ApiEnvelope<{ loggedOut: boolean }>>('/admin/logout')).data)
}

export async function getAdminProfile(client: AxiosInstance = adminApiClient): Promise<AdminUser> {
  return unwrap((await client.get<ApiEnvelope<AdminUser>>('/admin/profile')).data)
}

export interface AdminChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export async function changeAdminPassword(
  payload: AdminChangePasswordPayload,
  client: AxiosInstance = adminApiClient
): Promise<{ updated: boolean }> {
  return unwrap((await client.put<ApiEnvelope<{ updated: boolean }>>('/admin/password', payload)).data)
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

export async function getAdminLinks(client: AxiosInstance = adminApiClient): Promise<AdminFriendLink[]> {
  return unwrap((await client.get<ApiEnvelope<AdminListResult<AdminFriendLink>>>('/admin/links')).data).list
}

export async function createAdminLink(
  payload: AdminFriendLinkPayload,
  client: AxiosInstance = adminApiClient
): Promise<AdminFriendLink> {
  return unwrap((await client.post<ApiEnvelope<AdminFriendLink>>('/admin/links', payload)).data)
}

export async function updateAdminLink(
  id: number,
  payload: AdminFriendLinkPayload,
  client: AxiosInstance = adminApiClient
): Promise<AdminFriendLink> {
  return unwrap((await client.put<ApiEnvelope<AdminFriendLink>>(`/admin/links/${id}`, payload)).data)
}

export async function deleteAdminLink(id: number, client: AxiosInstance = adminApiClient): Promise<{ deleted: boolean }> {
  return unwrap((await client.delete<ApiEnvelope<{ deleted: boolean }>>(`/admin/links/${id}`)).data)
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

export async function getAdminUsers(
  params: { page?: number; pageSize?: number } = {},
  client: AxiosInstance = adminApiClient
): Promise<AdminPageResult<AdminVisitor>> {
  return unwrap((await client.get<ApiEnvelope<AdminPageResult<AdminVisitor>>>('/admin/users', { params })).data)
}

export async function getAdminAnalytics(client: AxiosInstance = adminApiClient): Promise<AdminAnalytics> {
  return unwrap((await client.get<ApiEnvelope<AdminAnalytics>>('/admin/analytics')).data)
}

export async function getAdminBans(client: AxiosInstance = adminApiClient): Promise<AdminIPBan[]> {
  return unwrap((await client.get<ApiEnvelope<AdminListResult<AdminIPBan>>>('/admin/ip-bans')).data).list
}

export async function createAdminBan(
  payload: { ip: string; reason?: string; duration?: number },
  client: AxiosInstance = adminApiClient
): Promise<AdminIPBan> {
  return unwrap((await client.post<ApiEnvelope<AdminIPBan>>('/admin/ip-bans', payload)).data)
}

export async function removeAdminBan(id: number, client: AxiosInstance = adminApiClient): Promise<{ deleted: boolean }> {
  return unwrap((await client.delete<ApiEnvelope<{ deleted: boolean }>>(`/admin/ip-bans/${id}`)).data)
}

export async function listAdminAIConversations(
  client: AxiosInstance = adminApiClient
): Promise<AdminAIConversationSummary[]> {
  return unwrap((await client.get<ApiEnvelope<AdminAIConversationSummary[]>>('/admin/ai/conversations')).data)
}

export async function createAdminAIConversation(
  client: AxiosInstance = adminApiClient
): Promise<AdminAIConversationSummary> {
  return unwrap((await client.post<ApiEnvelope<AdminAIConversationSummary>>('/admin/ai/conversations', {})).data)
}

export async function getAdminAIConversation(
  id: number,
  client: AxiosInstance = adminApiClient
): Promise<AdminAIConversationDetail> {
  return unwrap((await client.get<ApiEnvelope<AdminAIConversationDetail>>(`/admin/ai/conversations/${id}`)).data)
}

export async function renameAdminAIConversation(
  id: number,
  title: string,
  client: AxiosInstance = adminApiClient
): Promise<AdminAIConversationSummary> {
  return unwrap((await client.patch<ApiEnvelope<AdminAIConversationSummary>>(`/admin/ai/conversations/${id}`, { title })).data)
}

export async function deleteAdminAIConversation(
  id: number,
  client: AxiosInstance = adminApiClient
): Promise<{ deleted: boolean }> {
  return unwrap((await client.delete<ApiEnvelope<{ deleted: boolean }>>(`/admin/ai/conversations/${id}`)).data)
}

export async function clearAdminAIConversations(
  client: AxiosInstance = adminApiClient
): Promise<{ deleted: boolean }> {
  return unwrap((await client.delete<ApiEnvelope<{ deleted: boolean }>>('/admin/ai/conversations')).data)
}
export async function chatWithAdminAI(
  messages: AdminAIMessage[],
  client: AxiosInstance = adminApiClient
): Promise<{ answer: string; mode: string; model: string }> {
  return unwrap((await client.post<ApiEnvelope<{ answer: string; mode: string; model: string }>>('/admin/ai/chat', { messages })).data)
}

export async function beautifyAdminPost(
  payload: Pick<AdminPostPayload, 'title' | 'summary' | 'content'>,
  client: AxiosInstance = adminApiClient
): Promise<Pick<AdminPostPayload, 'title' | 'summary' | 'content'>> {
  return unwrap((await client.post<ApiEnvelope<Pick<AdminPostPayload, 'title' | 'summary' | 'content'>>>('/admin/ai/beautify', payload)).data)
}

export async function uploadAdminImage(file: File, client: AxiosInstance = adminApiClient): Promise<AdminUploadResult> {
  const formData = new FormData()
  formData.append('file', file)

  return unwrap((await client.post<ApiEnvelope<AdminUploadResult>>('/admin/upload', formData)).data)
}

export async function getAdminDashboard(client: AxiosInstance = adminApiClient): Promise<AdminDashboard> {
  return unwrap((await client.get<ApiEnvelope<AdminDashboard>>('/admin/dashboard')).data)
}

export async function getAdminComments(
  params: { page?: number; pageSize?: number } = {},
  client: AxiosInstance = adminApiClient
): Promise<AdminPageResult<AdminComment>> {
  return unwrap((await client.get<ApiEnvelope<AdminPageResult<AdminComment>>>('/admin/comments', { params })).data)
}

export async function updateAdminComment(
  id: number,
  status: AdminComment['status'],
  client: AxiosInstance = adminApiClient
): Promise<AdminComment> {
  return unwrap((await client.put<ApiEnvelope<AdminComment>>(`/admin/comments/${id}`, { status })).data)
}

export async function deleteAdminComment(
  id: number,
  client: AxiosInstance = adminApiClient
): Promise<{ deleted: boolean }> {
  return unwrap((await client.delete<ApiEnvelope<{ deleted: boolean }>>(`/admin/comments/${id}`)).data)
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
