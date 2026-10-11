import { FormEvent, useState } from 'react'
import { KeyRound, Loader2, Plus } from 'lucide-react'

import { ConfirmDialog } from '@/components/engine/ConfirmDialog'
import { CopyButton } from '@/components/engine/CopyButton'
import { ErrorDetail } from '@/components/engine/ErrorDetail'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '@/hooks/queries'

export function ApiKeys() {
  const [name, setName] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [pendingRevoke, setPendingRevoke] = useState<string | null>(null)
  const keys = useApiKeys({ limit: 100 })
  const create = useCreateApiKey()
  const revoke = useRevokeApiKey()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || create.isPending) return
    create.mutate(trimmed, { onSuccess: (result) => { setCreatedKey(result.key); setName('') } })
  }

  return <Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><KeyRound className="h-5 w-5 text-primary" />API keys</CardTitle><CardDescription>Create a key for programmatic inference. Its plaintext value is shown only once.</CardDescription></CardHeader><CardContent className="space-y-4">
    <form noValidate className="flex flex-col gap-2 sm:flex-row" onSubmit={submit}><div className="min-w-0 flex-1"><Label className="sr-only" htmlFor="api-key-name">Key name</Label><Input id="api-key-name" maxLength={200} placeholder="e.g. local evaluation script" value={name} onChange={(event) => setName(event.target.value)} disabled={create.isPending} /></div><Button type="submit" disabled={!name.trim() || create.isPending}>{create.isPending ? <Loader2 className="animate-spin" /> : <Plus />}Create key</Button></form>
    {create.error && <ErrorDetail error={{ detail: create.error instanceof Error ? create.error.message : 'API key could not be created.' }} />}
    {createdKey && <div className="rounded-md border border-warning/40 bg-warning/10 p-3"><p className="text-sm font-medium">Copy this key now. It will not be shown again.</p><div className="mt-2 flex items-center gap-2"><code className="min-w-0 flex-1 truncate rounded bg-background px-2 py-1 text-xs">{createdKey}</code><CopyButton value={createdKey} label="Copy new API key" /></div><Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => setCreatedKey(null)}>I saved it</Button></div>}
    {keys.isLoading ? <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> : keys.isError ? <ErrorDetail error={{ detail: keys.error instanceof Error ? keys.error.message : 'API keys could not be loaded.' }} /> : keys.data?.items.length ? <div className="divide-y rounded-md border">{keys.data.items.map((key) => <div key={key.id} className="flex items-center gap-3 p-3"><div className="min-w-0 flex-1"><p className="font-medium">{key.name}</p><p className="font-mono text-xs text-muted-foreground">{key.prefix}••••{key.last4}</p></div><Badge variant="outline" className="capitalize">{key.status}</Badge>{key.status === 'active' && <Button type="button" size="sm" variant="outline" onClick={() => setPendingRevoke(key.id)}>Revoke</Button>}</div>)}</div> : <p className="text-sm text-muted-foreground">No API keys yet.</p>}
    <ConfirmDialog open={pendingRevoke !== null} onOpenChange={(open) => !open && setPendingRevoke(null)} title="Revoke API key?" description="This key will immediately stop working and cannot be restored." confirmLabel="Revoke key" destructive loading={revoke.isPending} onConfirm={() => pendingRevoke && revoke.mutate(pendingRevoke, { onSuccess: () => setPendingRevoke(null) })} />
  </CardContent></Card>
}
