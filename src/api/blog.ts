import type { AxiosInstance } from 'axios'

import { fromApiEnvelope } from '../utils/apiError'
import { apiClient, type ApiEnvelope } from './site'

export interface Taxonomy {
  id?: number
  name: string
  slug: string
  postCount?: number
}

export interface PostSummary {
  title: string
  slug: string
  summary: string
  cover: string
  viewCount: number
  likeCount?: number
  category: Taxonomy
  tags: Taxonomy[]
  publishedAt: string
}

export interface PostPointer {
  title: string
  slug: string
  publishedAt: string
}

export interface PostDetail extends PostSummary {
  content: string
  prev: PostPointer | null
  next: PostPointer | null
}

export interface PageResult<T> {
  list: T[]
  page: number
  pageSize: number
  total: number
}

export interface ListResult<T> {
  list: T[]
}

export interface Project {
  id: number
  name: string
  description: string
  url: string
  cover: string
  techStack: string[]
  sort: number
  visible: boolean
}

export interface FriendLink {
  id: number
  name: string
  url: string
  description: string
  logo: string
  sort: number
  visible?: boolean
}

export interface VisitorUser {
  id: number
  email: string
  nickname: string
  role: 'visitor'
}

export interface VisitorAuthResult {
  token: string
  user: VisitorUser
}

export interface VisitorRegisterPayload {
  email: string
  nickname: string
  password: string
  code: string
}

export interface VisitorLoginPayload {
  email: string
  password: string
}

export type VerificationPurpose = 'register' | 'reset'

export interface EmailCodeResult {
  sent: boolean
  cooldownSeconds: number
  expiresIn: number
}

export interface CommentAuthor {
  email: string
  nickname: string
}

export interface PostComment {
  id: number
  postId?: number
  postTitle?: string
  content: string
  status: 'approved' | 'hidden'
  author: CommentAuthor
  createdAt: string
}

export interface ArchiveMonth {
  month: number
  posts: PostSummary[]
}

export interface ArchiveYear {
  year: number
  months: ArchiveMonth[]
}

export interface PostQuery {
  page?: number
  pageSize?: number
  category?: string
  tag?: string
  q?: string
  slug?: string
}

export async function getPosts(
  params: PostQuery = {},
  client: AxiosInstance = apiClient
): Promise<PageResult<PostSummary>> {
  return unwrap((await client.get<ApiEnvelope<PageResult<PostSummary>>>('/posts', { params })).data)
}

export async function getPostDetail(
  slug: string,
  client: AxiosInstance = apiClient
): Promise<PostDetail> {
  return unwrap((await client.get<ApiEnvelope<PostDetail>>(`/posts/${slug}`)).data)
}

export async function getCategories(client: AxiosInstance = apiClient): Promise<Taxonomy[]> {
  const result = unwrap((await client.get<ApiEnvelope<ListResult<Taxonomy>>>('/categories')).data)

  return result.list
}

export async function getCategoryPosts(
  slug: string,
  params: PostQuery = {},
  client: AxiosInstance = apiClient
): Promise<PageResult<PostSummary>> {
  return unwrap(
    (await client.get<ApiEnvelope<PageResult<PostSummary>>>(`/categories/${slug}/posts`, { params })).data
  )
}

export async function getTags(client: AxiosInstance = apiClient): Promise<Taxonomy[]> {
  const result = unwrap((await client.get<ApiEnvelope<ListResult<Taxonomy>>>('/tags')).data)

  return result.list
}

export async function getTagPosts(
  slug: string,
  params: PostQuery = {},
  client: AxiosInstance = apiClient
): Promise<PageResult<PostSummary>> {
  return unwrap(
    (await client.get<ApiEnvelope<PageResult<PostSummary>>>(`/tags/${slug}/posts`, { params })).data
  )
}

export interface SearchQuery {
  q: string
  page?: number
  pageSize?: number
}

export async function searchPosts(
  query: SearchQuery | string,
  client: AxiosInstance = apiClient
): Promise<PageResult<PostSummary>> {
  const params = typeof query === 'string' ? { q: query } : query

  return unwrap((await client.get<ApiEnvelope<PageResult<PostSummary>>>('/search', { params })).data)
}

export async function getArchive(client: AxiosInstance = apiClient): Promise<ArchiveYear[]> {
  const result = unwrap((await client.get<ApiEnvelope<ListResult<ArchiveYear>>>('/archive')).data)

  return result.list
}

export async function getProjects(client: AxiosInstance = apiClient): Promise<Project[]> {
  const result = unwrap((await client.get<ApiEnvelope<ListResult<Project>>>('/projects')).data)

  return result.list
}

export async function getFriendLinks(client: AxiosInstance = apiClient): Promise<FriendLink[]> {
  const result = unwrap((await client.get<ApiEnvelope<ListResult<FriendLink>>>('/links')).data)
  return result.list
}

export async function likePost(
  slug: string,
  client: AxiosInstance = apiClient
): Promise<{ likeCount: number; liked: boolean }> {
  return unwrap((await client.post<ApiEnvelope<{ likeCount: number; liked: boolean }>>(`/posts/${slug}/like`)).data)
}

export async function sendVisitorEmailCode(
  email: string,
  purpose: VerificationPurpose = 'register',
  client: AxiosInstance = apiClient
): Promise<EmailCodeResult> {
  return unwrap(
    (await client.post<ApiEnvelope<EmailCodeResult>>('/auth/email-code', { email, purpose })).data
  )
}

export async function registerVisitor(
  payload: VisitorRegisterPayload,
  client: AxiosInstance = apiClient
): Promise<VisitorAuthResult> {
  return unwrap((await client.post<ApiEnvelope<VisitorAuthResult>>('/auth/register', payload)).data)
}

export async function loginVisitor(
  payload: VisitorLoginPayload,
  client: AxiosInstance = apiClient
): Promise<VisitorAuthResult> {
  return unwrap((await client.post<ApiEnvelope<VisitorAuthResult>>('/auth/login', payload)).data)
}

export async function logoutVisitor(client: AxiosInstance = apiClient): Promise<{ loggedOut: boolean }> {
  return unwrap((await client.post<ApiEnvelope<{ loggedOut: boolean }>>('/auth/logout')).data)
}

export async function resetVisitorPassword(
  payload: { email: string; code: string; newPassword: string },
  client: AxiosInstance = apiClient
): Promise<{ updated: boolean }> {
  return unwrap((await client.post<ApiEnvelope<{ updated: boolean }>>('/auth/reset-password', payload)).data)
}

export async function getPostComments(
  slug: string,
  client: AxiosInstance = apiClient
): Promise<PageResult<PostComment>> {
  return unwrap((await client.get<ApiEnvelope<PageResult<PostComment>>>(`/posts/${slug}/comments`)).data)
}

export async function createPostComment(
  slug: string,
  content: string,
  token?: string,
  client: AxiosInstance = apiClient
): Promise<PostComment> {
  const headers =
    token && token !== 'cookie'
      ? {
          Authorization: `Bearer ${token}`
        }
      : undefined

  return unwrap(
    (
      await client.post<ApiEnvelope<PostComment>>(
        `/posts/${slug}/comments`,
        { content },
        headers ? { headers } : undefined
      )
    ).data
  )
}

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (envelope.code !== 0) {
    throw fromApiEnvelope(envelope)
  }

  return envelope.data
}
