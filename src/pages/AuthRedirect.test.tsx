import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthRedirect from './AuthRedirect'

const mocks = vi.hoisted(() => ({ signIn: vi.fn(), register: vi.fn(), manageAccount: vi.fn() }))
vi.mock('@/auth/keycloak', () => ({
  signIn: mocks.signIn,
  register: mocks.register,
  manageAccount: mocks.manageAccount,
  safeRedirectPath: (path: string) => path,
}))
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }))
vi.mock('@/i18n/LanguageContext', () => ({ useLanguage: () => ({ t: (key: string) => key }) }))

function renderPage(path: '/login' | '/signup') {
  return render(<MemoryRouter initialEntries={[{ pathname: path, state: { from: { pathname: '/projects', search: '?page=2' } } }]}>
    <Routes>
      <Route path="/login" element={<AuthRedirect />} />
      <Route path="/signup" element={<AuthRedirect mode="register" />} />
      <Route path="/projects" element={<div>projects destination</div>} />
    </Routes>
  </MemoryRouter>)
}

beforeEach(() => vi.clearAllMocks())

describe('Keycloak account pages', () => {
  it('starts Keycloak login with the protected destination', async () => {
    mocks.signIn.mockResolvedValue(undefined)
    renderPage('/login')
    fireEvent.click(screen.getByRole('button', { name: 'authPage.loginAction' }))
    await waitFor(() => expect(mocks.signIn).toHaveBeenCalledWith('/projects?page=2'))
  })

  it('starts Keycloak account registration', async () => {
    mocks.register.mockResolvedValue(undefined)
    renderPage('/signup')
    fireEvent.click(screen.getByRole('button', { name: 'authPage.registerAction' }))
    await waitFor(() => expect(mocks.register).toHaveBeenCalledWith('/projects?page=2'))
  })
})
