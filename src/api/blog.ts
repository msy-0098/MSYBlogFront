import type { AxiosInstance } from 'axios'

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

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (envelope.code !== 0) {
    throw new Error(envelope.message || '请求失败')
  }

  return envelope.data
}
