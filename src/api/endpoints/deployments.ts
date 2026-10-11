import { api, pageQuery } from '@/api/client'
import type { Deployment, DeploymentCreate, DeploymentUpdate, JobStatus, Page } from '@/api/types'

const BASE = '/api/v1/deployments'

export function listDeployments(params: { status?: JobStatus; limit?: number; offset?: number } = {}): Promise<Page<Deployment>> {
  return api.get(`${BASE}${pageQuery(params)}`)
}
export function getDeployment(id: string): Promise<Deployment> { return api.get(`${BASE}/${id}`) }
export function createDeployment(body: DeploymentCreate, idempotencyKey?: string): Promise<Deployment> {
  return api.post(BASE, body, { idempotencyKey })
}
export function updateDeployment(id: string, body: DeploymentUpdate): Promise<Deployment> { return api.patch(`${BASE}/${id}`, body) }
export function stopDeployment(id: string): Promise<Deployment> { return api.post(`${BASE}/${id}/stop`) }
export function deleteDeployment(id: string): Promise<void> { return api.delete(`${BASE}/${id}`) }
