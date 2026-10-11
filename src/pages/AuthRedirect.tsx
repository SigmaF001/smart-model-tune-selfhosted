import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Loader2, Zap } from 'lucide-react'

import { manageAccount, register, signIn, safeRedirectPath } from '@/auth/keycloak'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

type Mode = 'login' | 'register' | 'forgot' | 'reset' | 'mfa'

export default function AuthRedirect({ mode = 'login' }: { mode?: Mode }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const state = location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null
  const from = state?.from
  const destination = safeRedirectPath((from?.pathname || '/dashboard') + (from?.search || '') + (from?.hash || ''))
  const recovery = mode === 'forgot' || mode === 'reset'

  if (mode === 'mfa') return <Navigate to="/login" state={location.state} replace />
  if (user && !recovery) return <Navigate to={destination} replace />

  const submit = async () => {
    if (busy) return
    setBusy(true)
    setFailed(false)
    try {
      if (recovery && user) await manageAccount()
      else if (mode === 'register') await register(destination)
      else await signIn(destination)
    } catch {
      setFailed(true)
      setBusy(false)
    }
  }

  const title = mode === 'register' ? t('authPage.registerTitle') : recovery ? t('authPage.forgotTitle') : t('authPage.loginTitle')
  const action = mode === 'register' ? t('authPage.registerAction') : recovery && user ? t('security.manageAccount') : t('authPage.loginAction')
  const description = recovery ? t(user ? 'security.accountDescription' : 'security.recoveryDescription') : t('authPage.sharedAccount')

  return (
    <main className="min-h-screen grid place-items-center bg-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="mb-3 inline-flex items-center justify-center gap-2 font-semibold"><Zap className="h-5 w-5 text-primary" />TuneLab</Link>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {failed && <p role="alert" className="mb-4 text-sm text-destructive">{t('authPage.failed')}</p>}
          <Button type="button" className="w-full relative" disabled={busy} aria-busy={busy} onClick={() => void submit()}>
            {busy && <Loader2 aria-hidden="true" className="absolute left-4 h-4 w-4 animate-spin" />}{action}
          </Button>
        </CardContent>
        <CardFooter className="justify-center gap-4 text-sm">
          {mode !== 'login' && <Link className="text-primary hover:underline" to="/login" state={location.state}>{t('authPage.backToLogin')}</Link>}
          {mode === 'login' && <Link className="text-primary hover:underline" to="/signup" state={location.state}>{t('authPage.registerAction')}</Link>}
          {mode === 'login' && <Link className="text-muted-foreground hover:underline" to="/forgot-password">{t('authPage.forgotTitle')}</Link>}
        </CardFooter>
      </Card>
    </main>
  )
}
