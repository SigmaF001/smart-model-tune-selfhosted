import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getHealth, getReadiness } from '@/api/endpoints/system'
import { LanguageProvider } from '@/i18n/LanguageContext'
import { BackendStatus } from './BackendStatus'

vi.mock('@/api/endpoints/system', () => ({
  getHealth: vi.fn(),
  getReadiness: vi.fn(),
}))

function renderStatus() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider><BackendStatus /></LanguageProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  localStorage.setItem('app-language', 'en')
  vi.clearAllMocks()
})

describe('BackendStatus', () => {
  it('shows unknown readiness when health succeeds but ready is unavailable', async () => {
    vi.mocked(getHealth).mockResolvedValue({ status: 'ok' })
    vi.mocked(getReadiness).mockRejectedValue(new Error('404'))
    renderStatus()
    expect(await screen.findByText('API reachable · readiness unknown')).toBeInTheDocument()
  })

  it('shows unreachable when health fails', async () => {
    vi.mocked(getHealth).mockRejectedValue(new Error('tunnel down'))
    renderStatus()
    expect(await screen.findByText('API unreachable', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(getReadiness).not.toHaveBeenCalled()
  })

  it('only shows ready after the readiness endpoint confirms it', async () => {
    vi.mocked(getHealth).mockResolvedValue({ status: 'ok' })
    vi.mocked(getReadiness).mockResolvedValue({ status: 'ok', checks: {} })
    renderStatus()
    expect(await screen.findByText('Backend ready')).toBeInTheDocument()
  })
})
