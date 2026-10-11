import { api, pageQuery } from '@/api/client'
import type { Page, Template, TemplateRatingResponse } from '@/api/types'

const BASE = '/api/v1/templates'
export function listTemplates(params: { category?: string; featured?: boolean; search?: string; sort?: 'popular' | 'rating' | 'forks'; limit?: number; offset?: number } = {}): Promise<Page<Template>> {
  return api.get(`${BASE}${pageQuery(params)}`)
}
export function rateTemplate(id: string, rating: number): Promise<TemplateRatingResponse> { return api.put(`${BASE}/${id}/rating`, { rating }) }
