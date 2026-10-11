import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/i18n/LanguageContext'
import { getAuthState, initAuth, signOut, subscribeAuth, type AuthState } from '@/auth/keycloak'

type AuthContextValue = AuthState & {
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(getAuthState)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const queryClient = useQueryClient()
  const { t } = useLanguage()

  useEffect(() => {
    let active = true
    let previousUser = getAuthState().user?.id
    const unsubscribe = subscribeAuth((next) => {
      if (!active) return
      if (previousUser !== next.user?.id) queryClient.clear()
      previousUser = next.user?.id
      setState(next)
    })
    void initAuth().then(() => {
      if (active) setState(getAuthState())
    }).catch(() => {
      if (active) setFailed(true)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [queryClient])

  if (loading || failed) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 text-center">
      {failed ? <><p role="alert">{t('authPage.failed')}</p><Button onClick={() => window.location.reload()}>{t('authPage.reload')}</Button></> :
        <div role="status"><Loader2 aria-hidden="true" className="h-6 w-6 animate-spin" /><span className="sr-only">{t('common.loading')}</span></div>}
    </div>
  )
  return (
    <AuthContext.Provider value={{ ...state, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
