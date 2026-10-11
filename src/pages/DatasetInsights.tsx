import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Activity, AlertTriangle, ArrowLeft, CheckCircle2, Database, FileText, Loader2, Sparkles, Tag } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { Dataset } from '@/api/types'
import { ErrorDetail } from '@/components/engine/ErrorDetail'
import { DatasetList } from '@/components/dataset/DatasetList'
import { PageTransition, FadeIn } from '@/components/motion'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDatasetInsights, useDatasets, useProject } from '@/hooks/queries'
import { useLanguage } from '@/i18n/LanguageContext'

const EMPTY_DATASETS: Dataset[] = []
const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--primary) / 0.85)', 'hsl(var(--primary) / 0.7)', 'hsl(var(--primary) / 0.55)', 'hsl(var(--primary) / 0.4)', 'hsl(var(--destructive) / 0.7)']

function readiness(score: number, t: (key: string) => string) {
  if (score >= 85) return { label: t('insights.readyToTrain'), color: 'text-emerald-500', icon: CheckCircle2 }
  if (score >= 65) return { label: t('insights.canTrainWithCaveats'), color: 'text-yellow-500', icon: AlertTriangle }
  return { label: t('insights.fixBeforeTraining'), color: 'text-destructive', icon: AlertTriangle }
}

export default function DatasetInsights() {
  const { id } = useParams<{ id: string }>()
  const { t } = useLanguage()
  const project = useProject(id ?? '')
  const [selectedDataset, setSelectedDataset] = useState<string>()
  const datasetsQuery = useDatasets(project.data?.id, { limit: 100 })
  const datasets = datasetsQuery.data?.items ?? EMPTY_DATASETS
  const insightQuery = useDatasetInsights(selectedDataset ?? '', Boolean(selectedDataset))

  useEffect(() => {
    if (!selectedDataset || !datasets.some((dataset) => dataset.id === selectedDataset)) setSelectedDataset(datasets[0]?.id)
  }, [datasets, selectedDataset])

  const report = insightQuery.data
  const band = report ? readiness(report.overall_quality_score, t) : null
  const labelCoverage = useMemo(() => (report?.label_distribution ?? []).map((label) => ({ ...label, healthy: label.count >= 30 })), [report])
  const coverage = labelCoverage.length ? Math.round(labelCoverage.filter((label) => label.healthy).length / labelCoverage.length * 100) : 0
  const selected = datasets.find((dataset) => dataset.id === selectedDataset)

  if (project.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  if (project.isError) return <PageTransition><ErrorDetail error={{ detail: project.error instanceof Error ? project.error.message : 'Project could not be loaded.' }} /></PageTransition>
  if (!project.data) return <div className="py-20 text-center"><p className="text-muted-foreground">{t('projectDetail.notFound')}</p><Button variant="link" asChild><Link to="/projects">{t('projectDetail.backToProjects')}</Link></Button></div>

  return <PageTransition><div className="max-w-6xl space-y-6">
    <FadeIn><div className="flex items-center gap-3"><Button variant="ghost" size="icon" asChild><Link to={`/projects/${id}`} aria-label={t('common.back')}><ArrowLeft className="h-4 w-4" /></Link></Button><div><h1 className="flex items-center gap-2 text-xl font-bold"><Database className="h-5 w-5 text-primary" />{t('insights.title')}</h1><p className="text-sm text-muted-foreground">{project.data.name}</p></div></div></FadeIn>
    <Tabs defaultValue="datasets"><TabsList><TabsTrigger value="datasets"><Database className="mr-1.5 h-3.5 w-3.5" />Datasets</TabsTrigger><TabsTrigger value="quality"><Sparkles className="mr-1.5 h-3.5 w-3.5" />{t('insights.title')}</TabsTrigger></TabsList>
      <TabsContent value="datasets" className="mt-4"><DatasetList projectId={project.data.id} /></TabsContent>
      <TabsContent value="quality" className="mt-4 space-y-6">
        {datasetsQuery.isLoading ? <div role="status" className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          : datasetsQuery.isError ? <ErrorDetail error={{ detail: datasetsQuery.error instanceof Error ? datasetsQuery.error.message : 'Datasets could not be loaded.' }} />
            : datasets.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">Upload or generate a dataset to view its quality insights.</p>
              : insightQuery.isLoading ? <div role="status" className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                : insightQuery.isError ? <div className="space-y-3"><ErrorDetail error={{ detail: insightQuery.error instanceof Error ? insightQuery.error.message : 'Quality insights could not be loaded. Select another dataset or try again.' }} /><Button variant="outline" onClick={() => void insightQuery.refetch()}>Try again</Button></div>
                  : report && band ? <InsightsContent report={report} band={band} selectedDataset={selectedDataset} datasets={datasets} onDatasetChange={setSelectedDataset} selected={selected} coverage={coverage} labelCoverage={labelCoverage} projectId={id ?? ''} t={t} />
                    : null}
      </TabsContent>
    </Tabs>
  </div></PageTransition>
}

function InsightsContent({ report, band, selectedDataset, datasets, onDatasetChange, selected, coverage, labelCoverage, projectId, t }: { report: NonNullable<ReturnType<typeof useDatasetInsights>['data']>; band: ReturnType<typeof readiness>; selectedDataset?: string; datasets: Dataset[]; onDatasetChange: (id: string) => void; selected?: Dataset; coverage: number; labelCoverage: Array<{ label: string; count: number; percent: number; healthy: boolean }>; projectId: string; t: (key: string) => string }) {
  const BandIcon = band.icon
  return <>
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><p className="text-xs text-muted-foreground">Quality analysis is calculated from the selected dataset in the Engine.{report.scan_truncated ? ` Sampled ${report.scanned_rows.toLocaleString()} rows.` : ''}</p><Select value={selectedDataset} onValueChange={onDatasetChange}><SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger><SelectContent>{datasets.map((dataset) => <SelectItem key={dataset.id} value={dataset.id}>{dataset.name}</SelectItem>)}</SelectContent></Select></div>
    <Alert className={band.color === 'text-emerald-500' ? 'border-emerald-500/30 bg-emerald-500/5' : band.color === 'text-yellow-500' ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-destructive/30 bg-destructive/5'}><BandIcon className={`h-4 w-4 ${band.color}`} /><AlertDescription><div className="flex items-center justify-between gap-2"><div><p className="font-semibold">{band.label}</p><p className="mt-0.5 text-xs text-muted-foreground">{t('insights.readinessDesc').replace('{score}', String(report.overall_quality_score))}</p></div><Badge variant="outline">{t('insights.qualityScore')}: <span className={`ml-1 font-bold ${band.color}`}>{report.overall_quality_score}/100</span></Badge></div></AlertDescription></Alert>
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{[{ label: t('insights.totalRows'), value: report.row_count.toLocaleString(), icon: FileText }, { label: t('insights.uniqueLabels'), value: report.label_distribution.length || '—', icon: Tag }, { label: t('insights.coverage'), value: `${coverage}%`, icon: Activity }, { label: t('insights.duplicates'), value: report.duplicate_rows, icon: AlertTriangle }].map(({ label, value, icon: Icon }) => <Card key={label}><CardContent className="flex items-center gap-3 p-4"><div className="rounded-lg bg-accent p-2"><Icon className="h-4 w-4 text-primary" /></div><div><p className="text-xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></CardContent></Card>)}</div>
    {labelCoverage.length > 0 && <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Tag className="h-4 w-4 text-primary" />{t('insights.labelCoverage')}</CardTitle><CardDescription className="text-xs">{t('insights.labelCoverageDesc').replace('{n}', '30')}</CardDescription></CardHeader><CardContent><div className="grid gap-4 lg:grid-cols-2"><div className="space-y-2">{labelCoverage.map((label) => <div key={label.label} className="space-y-1"><div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1.5 font-mono">{label.healthy ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <AlertTriangle className="h-3 w-3 text-yellow-500" />}{label.label}</span><span className="text-muted-foreground">{label.count} ({label.percent}%)</span></div><Progress value={Math.min(100, label.count / 30 * 100)} className="h-1.5" /></div>)}</div><div className="h-60"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={report.label_distribution} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={90} label={(entry) => entry.label} labelLine={false}>{report.label_distribution.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}</Pie><Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} /></PieChart></ResponsiveContainer></div></div></CardContent></Card>}
    <Card><CardHeader><CardTitle className="text-sm">{t('insights.textLength')}</CardTitle><CardDescription className="text-xs">{t('insights.textLengthDesc')}</CardDescription></CardHeader><CardContent><div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={report.length_distribution}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="bucket" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} /><Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></CardContent></Card>
    <Card><CardHeader><CardTitle className="text-sm">{t('insights.actionItems')}</CardTitle><CardDescription className="text-xs">{t('insights.actionItemsDesc')}</CardDescription></CardHeader><CardContent className="space-y-2">{report.issues.length === 0 ? <Alert className="border-emerald-500/30 bg-emerald-500/5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /><AlertDescription>{t('insights.noIssues')}</AlertDescription></Alert> : report.issues.map((issue) => <div key={issue.id} className="space-y-1 rounded-lg border border-border p-3"><div className="flex items-start justify-between gap-2"><p className="text-sm font-medium">{issue.title}</p><Badge variant="outline" className="shrink-0 text-[9px]">{issue.severity}</Badge></div><p className="text-xs text-muted-foreground">{issue.description}</p><p className="flex items-start gap-1.5 text-xs"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{issue.suggestion}</p></div>)}</CardContent></Card>
    <div className="flex items-center justify-between pt-2"><p className="text-xs text-muted-foreground">{selected?.name} · {selected?.num_samples.toLocaleString()} rows</p><Button asChild><Link to={`/projects/${projectId}/training`}>{t('insights.startTraining')} →</Link></Button></div>
  </>
}
