import { useQuery } from '@tanstack/react-query'

import { getHealth, getReadiness } from '@/api/endpoints/system'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/i18n/LanguageContext'

export function BackendStatus() {
  const { t } = useLanguage()
  const status = useQuery({
    queryKey: ['system', 'status'],
    queryFn: async () => {
      const health = await getHealth()
      const readiness = await getReadiness().catch(() => null)
      return { health, readiness }
    },
    refetchInterval: 30_000,
    retry: 1,
  })

  const state = status.isError
    ? 'offline'
    : !status.data
      ? 'checking'
      : status.data.readiness === null
        ? 'unknown'
        : status.data.readiness.status === 'ok'
          ? 'ready'
          : 'degraded'

  const style = state === 'offline'
    ? 'border-destructive/40 text-destructive'
    : state === 'ready'
      ? 'border-emerald-500/40 text-emerald-600'
      : 'border-amber-500/40 text-amber-600'

  return (
    <Badge variant="outline" className={style} title={t(`backendStatus.${state}Hint`)}>
      {t(`backendStatus.${state}`)}
    </Badge>
  )
}
