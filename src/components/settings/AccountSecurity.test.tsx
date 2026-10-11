import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountSecurity } from './AccountSecurity'

const mocks = vi.hoisted(() => ({ manageAccount: vi.fn() }))
vi.mock('@/auth/keycloak', () => ({ manageAccount: mocks.manageAccount }))
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { email: 'user@example.com' } }),
}))
vi.mock('@/i18n/LanguageContext', () => ({ useLanguage: () => ({ t: (key: string) => key }) }))

beforeEach(() => vi.clearAllMocks())

describe('AccountSecurity', () => {
  it('opens the provider account portal for security settings', async () => {
    mocks.manageAccount.mockResolvedValue(undefined)
    render(<AccountSecurity />)
    fireEvent.click(screen.getByRole('button', { name: 'security.manageAccount' }))
    await waitFor(() => expect(mocks.manageAccount).toHaveBeenCalledOnce())
    expect(screen.getByText(/user@example.com/)).toBeInTheDocument()
  })
})
