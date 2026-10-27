import { useMemo, useState } from 'react'
import { Download, Info } from 'lucide-react'
import { ColumnChart, HBarChart } from '../../components/admin/Charts'
import { PageHeader, Panel, StatCard } from '../../components/admin/Common'
import { Button } from '../../components/ui/Button'
import { Segmented, TextField } from '../../components/ui/Field'
import { downloadCSV } from '../../lib/csv'
import { addDays, brDate, diffDays, shortDate, todayISO } from '../../lib/date'
import { formatPrice } from '../../lib/format'
import { dailySeries, finalPrice, inRange, periodStats, topServices } from '../../lib/stats'
import { useStore } from '../../store/StoreContext'

type Preset = '7' | '30' | '90' | 'custom'

export function Reports() {
  const { data } = useStore()
  const today = todayISO()
  const [preset, setPreset] = useState<Preset>('30')
  const [custom, setCustom] = useState({ from: addDays(today, -13), to: today })
  const [metric, setMetric] = useState<'count' | 'revenue'>('count')

  const { from, to } = preset === 'custom' ? custom : { from: addDays(today, -(Number(preset) - 1)), to: today }
  const validRange = from <= to
  const len = diffDays(to, from) + 1
  const prevTo = addDays(from, -1)
  const prevFrom = addDays(prevTo, -(len - 1))

  const apts = data.appointments
  const cur = periodStats(apts, from, to)
  const prev = periodStats(apts, prevFrom, prevTo)
  const series = useMemo(() => (validRange ? dailySeries(apts, from, to) : []), [apts, from, to, validRange])
  const prevSeries = useMemo(() => (validRange ? dailySeries(apts, prevFrom, prevTo) : []), [apts, prevFrom, prevTo, validRange])
  const inPeriod = apts.filter((a) => inRange(a, from, to))
  const services = topServices(inPeriod, 8)

  const pros = data.professionals.map((p) => {
    const list = inPeriod.filter((a) => a.professionalId === p.id)
    const done = list.filter((a) => a.status === 'concluido')
    const reviews = done.filter((a) => a.review)
    return {
      id: p.id,
      name: p.name,
      total: list.filter((a) => a.status !== 'cancelado').length,
      done: done.length,
      cancelled: list.filter((a) => a.status === 'cancelado').length,
      revenue: done.reduce((s, a) => s + finalPrice(a), 0),
      rating: reviews.length ? reviews.reduce((s, a) => s + a.review!.rating, 0) / reviews.length : null,
    }
  }).sort((a, b) => b.revenue - a.revenue)

  const trend = (a: number, b: number) => (b ? a / b - 1 : null)
  const money = (v: number) => formatPrice(v).replace(',00', '')

  const exportCsv = () =>
    downloadCSV(`relatorio-demo-${from}_${to}.csv`, [
      ['RELATÓRIO DEMONSTRATIVO — dados fictícios', `${brDate(from)} a ${brDate(to)}`],
      [],
      ['Indicador', 'Período atual', 'Período anterior'],
      ['Agendamentos', cur.total, prev.total],
      ['Concluídos', cur.concluded, prev.concluded],
      ['Cancelamentos', cur.cancelled, prev.cancelled],
      ['Faturamento estimado (R$)', cur.revenue.toFixed(2).replace('.', ','), prev.revenue.toFixed(2).replace('.', ',')],
      [],
      ['Data', 'Atendimentos', 'Faturamento (R$)'],
      ...series.map((d) => [brDate(d.date), d.count, d.revenue.toFixed(2).replace('.', ',')]),
      [],
      ['Serviço', 'Quantidade', 'Faturamento (R$)'],
      ...services.map((s) => [s.name, s.count, s.revenue.toFixed(2).replace('.', ',')]),
      [],
      ['Profissional', 'Atendimentos', 'Concluídos', 'Cancelamentos', 'Faturamento (R$)', 'Nota média'],
      ...pros.map((p) => [p.name, p.total, p.done, p.cancelled, p.revenue.toFixed(2).replace('.', ','), p.rating?.toFixed(1).replace('.', ',') ?? '—']),
    ])

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description={`${brDate(from)} a ${brDate(to)} · comparado com ${brDate(prevFrom)} a ${brDate(prevTo)}`}
        actions={
          <Button variant="secondary" icon={<Download size={15} />} onClick={exportCsv} disabled={!validRange}>
            Exportar CSV
          </Button>
        }
      />
      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-linen bg-cream p-3 md:flex-row md:items-end md:justify-between">
        <Segmented label="Período" value={preset} onChange={setPreset} options={[{ value: '7', label: '7 dias' }, { value: '30', label: '30 dias' }, { value: '90', label: '90 dias' }, { value: 'custom', label: 'Personalizado' }]} />
        {preset === 'custom' && (
          <div className="flex gap-2">
            <TextField label="De" type="date" value={custom.from} max={custom.to} onChange={(e) => setCustom({ ...custom, from: e.target.value })} className="h-10 py-1.5" />
            <TextField label="Até" type="date" value={custom.to} min={custom.from} onChange={(e) => setCustom({ ...custom, to: e.target.value })} className="h-10 py-1.5" />
          </div>
        )}
      </div>
      <p className="mb-5 flex items-center gap-2 text-[0.75rem] text-stone">
        <Info size={14} /> Resultados gerados a partir de dados fictícios. Não representam dados financeiros reais.
      </p>

      {!validRange ? (
        <p className="rounded-xl bg-danger-soft p-4 text-sm text-danger">A data inicial precisa ser anterior à final.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Agendamentos" value={cur.total} trend={trend(cur.total, prev.total)} hint="vs. anterior" />
            <StatCard label="Concluídos" value={cur.concluded} trend={trend(cur.concluded, prev.concluded)} hint="vs. anterior" />
            <StatCard label="Cancelamentos" value={cur.cancelled} hint={`${Math.round(cur.cancelRate * 100)}% · anterior ${prev.cancelled}`} />
            <StatCard label="Faturamento estimado" value={money(cur.revenue)} trend={trend(cur.revenue, prev.revenue)} hint={`ticket ${money(cur.ticket)}`} />
          </div>

          <Panel
            className="mt-5"
            title={metric === 'count' ? 'Atendimentos por dia' : 'Faturamento estimado por dia'}
            action={<Segmented label="Métrica" value={metric} onChange={setMetric} options={[{ value: 'count', label: 'Qtd.' }, { value: 'revenue', label: 'R$' }]} />}
          >
            <ColumnChart
              ariaLabel="Série diária do período comparada ao período anterior"
              primaryLabel="Período atual"
              secondaryLabel="Período anterior"
              format={metric === 'count' ? (v) => String(v) : money}
              data={series.map((d, i) => ({ key: d.date, label: shortDate(d.date), value: metric === 'count' ? d.count : d.revenue, secondary: metric === 'count' ? prevSeries[i]?.count ?? 0 : prevSeries[i]?.revenue ?? 0 }))}
            />
          </Panel>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <Panel title="Serviços mais procurados">
              <HBarChart ariaLabel="Serviços mais procurados no período" data={services.map((s) => ({ label: s.name, value: s.count, hint: money(s.revenue) }))} format={(v) => `${v}×`} />
            </Panel>
            <Panel title="Desempenho dos profissionais" pad={false}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-linen text-[0.7rem] tracking-wide text-taupe uppercase">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Profissional</th>
                      <th className="px-3 py-2.5 text-right font-semibold">Atend.</th>
                      <th className="px-3 py-2.5 text-right font-semibold">Canc.</th>
                      <th className="px-3 py-2.5 text-right font-semibold">Nota</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Faturamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-linen">
                    {pros.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-2.5 whitespace-nowrap text-ink">{p.name}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{p.total}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{p.cancelled}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{p.rating ? p.rating.toFixed(1).replace('.', ',') : '—'}</td>
                        <td className="px-4 py-2.5 text-right font-semibold whitespace-nowrap tabular-nums">{money(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  )
}
