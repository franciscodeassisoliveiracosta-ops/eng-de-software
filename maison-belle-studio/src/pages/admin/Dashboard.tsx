import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BellRing, Plus } from 'lucide-react'
import { ColumnChart, HBarChart } from '../../components/admin/Charts'
import { AppointmentDrawer, PageHeader, Panel, StatCard } from '../../components/admin/Common'
import { useBooking } from '../../components/booking/BookingProvider'
import { Button } from '../../components/ui/Button'
import { Avatar, EmptyState, ReminderBadge, StatusBadge } from '../../components/ui/Misc'
import { addDays, addMonths, diffDays, shortDate, startOfMonth, todayISO } from '../../lib/date'
import { formatPrice } from '../../lib/format'
import { dailySeries, finalPrice, periodStats, topServices } from '../../lib/stats'
import { useStore } from '../../store/StoreContext'

export function Dashboard() {
  const { data } = useStore()
  const { open } = useBooking()
  const [drawer, setDrawer] = useState<string | null>(null)
  const today = todayISO()
  const apts = data.appointments

  const todayList = useMemo(
    () => apts.filter((a) => a.date === today && a.status !== 'cancelado').sort((a, b) => (a.start < b.start ? -1 : 1)),
    [apts, today],
  )
  const upcoming = apts.filter((a) => a.date > today && (a.status === 'agendado' || a.status === 'confirmado')).length
  const monthFrom = startOfMonth(today)
  const month = periodStats(apts, monthFrom, today)
  // compara com o mesmo intervalo de dias do mês anterior
  const prevFrom = addMonths(monthFrom, -1)
  const prev = periodStats(apts, prevFrom, addDays(prevFrom, diffDays(today, monthFrom)))
  const todayRevenue = todayList.reduce((s, a) => s + finalPrice(a), 0)
  const last14 = dailySeries(apts, addDays(today, -13), today)
  const top = topServices(apts.filter((a) => a.date >= addDays(today, -30) && a.date <= today), 5)
  const reminders = apts
    .filter((a) => a.reminder === 'pendente' && a.date >= today && a.date <= addDays(today, 2) && a.status !== 'cancelado')
    .sort((a, b) => (a.date + a.start < b.date + b.start ? -1 : 1))

  return (
    <div>
      <PageHeader
        title="Visão geral"
        description="Indicadores calculados a partir dos dados demonstrativos salvos neste navegador."
        actions={
          <Button icon={<Plus size={16} />} onClick={() => open({ source: 'admin' })}>
            Novo agendamento
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-linen bg-linen lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Atendimentos hoje" value={todayList.length} hint={`${todayList.filter((a) => a.status === 'concluido').length} concluídos`} />
        <StatCard label="Agendamentos futuros" value={upcoming} hint="a partir de amanhã" />
        <StatCard label="Concluídos no mês" value={month.concluded} />
        <StatCard label="Cancelamentos no mês" value={month.cancelled} hint={`${Math.round(month.cancelRate * 100)}% dos agendamentos`} />
        <StatCard label="Faturamento estimado (mês)" value={formatPrice(month.revenue).replace(',00', '')} hint="vs. mesmo período do mês anterior" trend={prev.revenue ? month.revenue / prev.revenue - 1 : null} />
        <StatCard label="Previsto para hoje" value={formatPrice(todayRevenue).replace(',00', '')} hint="valores fictícios" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Panel title="Atendimentos — últimos 14 dias" className="xl:col-span-2">
          <ColumnChart
            ariaLabel="Atendimentos por dia nos últimos 14 dias"
            primaryLabel="Atendimentos"
            data={last14.map((d) => ({ key: d.date, label: shortDate(d.date), value: d.count }))}
          />
        </Panel>
        <Panel title="Serviços mais procurados (30 dias)">
          <HBarChart ariaLabel="Serviços mais procurados" data={top.map((t) => ({ label: t.name, value: t.count }))} format={(v) => `${v}×`} />
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Panel
          title="Agenda de hoje"
          className="xl:col-span-2"
          pad={false}
          action={
            <Link to="/admin/agenda" className="inline-flex items-center gap-1 text-[0.78rem] font-semibold text-rose hover:underline">
              Abrir agenda <ArrowRight size={13} />
            </Link>
          }
        >
          {todayList.length ? (
            <ul className="divide-y divide-linen">
              {todayList.map((a) => {
                const pro = data.professionals.find((p) => p.id === a.professionalId)
                const client = data.clients.find((c) => c.id === a.clientId)
                return (
                  <li key={a.id}>
                    <button type="button" onClick={() => setDrawer(a.id)} className="flex w-full items-center gap-4 px-5 py-3 text-left transition hover:bg-sand/40">
                      <span className="w-12 shrink-0 font-semibold text-ink tabular-nums">{a.start}</span>
                      <Avatar name={a.professionalName} src={pro?.photo} size={32} color={pro?.color} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">{client?.name ?? 'Cliente'}</span>
                        <span className="block truncate text-[0.78rem] text-taupe">
                          {a.serviceName} · {a.professionalName}
                        </span>
                      </span>
                      <StatusBadge status={a.status} />
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyState title="Sem atendimentos hoje" description="O salão pode estar fechado hoje ou ainda não há reservas." />
          )}
        </Panel>
        <Panel title={<span className="flex items-center gap-2"><BellRing size={15} /> Lembretes pendentes (48h)</span>} pad={false}>
          {reminders.length ? (
            <ul className="divide-y divide-linen">
              {reminders.slice(0, 7).map((a) => (
                <li key={a.id}>
                  <button type="button" onClick={() => setDrawer(a.id)} className="w-full px-5 py-3 text-left transition hover:bg-sand/40">
                    <p className="text-sm font-semibold text-ink">{data.clients.find((c) => c.id === a.clientId)?.name}</p>
                    <p className="flex flex-wrap items-center gap-2 text-[0.75rem] text-taupe">
                      {shortDate(a.date)} · {a.start} · {a.serviceName} <ReminderBadge status={a.reminder} />
                    </p>
                  </button>
                </li>
              ))}
              {reminders.length > 7 && (
                <li className="px-5 py-3">
                  <Link to="/admin/agendamentos?lembrete=pendente" className="text-[0.78rem] font-semibold text-rose hover:underline">
                    Ver todos ({reminders.length})
                  </Link>
                </li>
              )}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-taupe">Todos os lembretes estão em dia.</p>
          )}
        </Panel>
      </div>
      <AppointmentDrawer id={drawer} onClose={() => setDrawer(null)} />
    </div>
  )
}
