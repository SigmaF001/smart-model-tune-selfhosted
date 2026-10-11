import { Loader2, Rocket, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import type { Template } from '@/api/types'
import { ErrorDetail } from '@/components/engine/ErrorDetail'
import { PageTransition } from '@/components/motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRateTemplate, useTemplates } from '@/hooks/queries'

export default function Templates() {
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useTemplates({ limit: 100 })
  const rating = useRateTemplate()
  const handleUseTemplate = (template: Template) => {
    if (!template.available) return
    navigate('/projects/new', { state: { template: { id: template.id, version: template.version, name: template.name, taskType: template.task_type, prompt: template.prompt, baseModel: template.base_model, epochs: template.epochs, learningRate: template.learning_rate } } })
  }

  return <PageTransition><div className="mx-auto max-w-6xl space-y-6">
    <div><h1 className="text-2xl font-bold">Templates</h1><p className="text-sm text-muted-foreground">Curated Engine settings that are recorded with the project when used.</p></div>
    {rating.error && <ErrorDetail error={{ detail: rating.error instanceof Error ? rating.error.message : 'Template rating could not be saved.' }} />}
    {isLoading ? <div role="status" className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      : isError || !data ? <ErrorDetail error={{ detail: error instanceof Error ? error.message : 'Templates could not be loaded.' }} />
        : data.items.length === 0 ? <Card><CardContent className="p-6 text-sm text-muted-foreground">No templates are available for this account.</CardContent></Card>
          : <div className="grid gap-4 md:grid-cols-2">{data.items.map((template) => <Card key={template.id} className="flex flex-col"><CardHeader className="space-y-2"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-lg">{template.name}</CardTitle><CardDescription>{template.description}</CardDescription></div><Badge variant={template.available ? 'secondary' : 'outline'}>{template.available ? 'Available' : 'Unavailable'}</Badge></div><div className="flex flex-wrap gap-1.5">{template.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}</div></CardHeader><CardContent className="mt-auto space-y-3"><p className="text-sm text-muted-foreground">{template.dataset_size.toLocaleString()} samples · {template.epochs} epochs · {template.base_model}</p>{template.unavailable_reason && <p className="text-sm text-muted-foreground">{template.unavailable_reason}</p>}<div className="flex items-center gap-1"><Star className="h-4 w-4 fill-warning text-warning" aria-hidden /><span className="text-sm">{template.rating?.toFixed(1) ?? 'Unrated'} ({template.rating_count})</span><div className="ml-auto flex gap-1">{[1, 2, 3, 4, 5].map((value) => <Button key={value} type="button" size="sm" variant={template.my_rating === value ? 'default' : 'outline'} disabled={rating.isPending} onClick={() => rating.mutate({ id: template.id, rating: value })} aria-label={`Rate ${template.name} ${value} out of 5`}>{value}</Button>)}</div></div><Button type="button" className="w-full gap-2" disabled={!template.available} onClick={() => handleUseTemplate(template)}><Rocket className="h-4 w-4" />Use template</Button></CardContent></Card>)}</div>}
  </div></PageTransition>
}
