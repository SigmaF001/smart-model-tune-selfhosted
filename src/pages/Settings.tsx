import { AccountSecurity } from '@/components/settings/AccountSecurity'
import { PageTransition } from '@/components/motion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Settings() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Identity and account security are managed by the self-hosted Keycloak service.</p>
        </div>
        <AccountSecurity />
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">API keys</CardTitle>
              <Badge variant="outline">Prototype</Badge>
            </div>
            <CardDescription>The Engine does not currently expose API-key management.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            API-key creation and revocation are not available yet.
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
