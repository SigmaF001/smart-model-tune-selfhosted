import { AccountSecurity } from '@/components/settings/AccountSecurity'
import { ApiKeys } from '@/components/settings/ApiKeys'
import { PageTransition } from '@/components/motion'

export default function Settings() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Identity and account security are managed by the self-hosted Keycloak service.</p>
        </div>
        <AccountSecurity />
        <ApiKeys />
      </div>
    </PageTransition>
  )
}
