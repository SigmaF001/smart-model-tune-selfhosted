import { api, pageQuery } from '@/api/client'
import type { ApiKey, ApiKeyCreate, ApiKeyCreated, Page } from '@/api/types'

const BASE = '/api/v1/api-keys'
export function listApiKeys(params: { limit?: number; offset?: number } = {}): Promise<Page<ApiKey>> { return api.get(`${BASE}${pageQuery(params)}`) }
export function createApiKey(body: ApiKeyCreate): Promise<ApiKeyCreated> { return api.post(BASE, body) }
export function revokeApiKey(id: string): Promise<void> { return api.delete(`${BASE}/${id}`) }
