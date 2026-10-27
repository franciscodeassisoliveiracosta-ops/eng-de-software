import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Plus, Search } from 'lucide-react'
import { AppointmentDrawer, PageHeader } from '../../components/admin/Common'
import { useBooking } from '../../components/booking/BookingProvider'
import { Button } from '../../components/ui/Button'
import { EmptyState, ReminderBadge, StatusBadge, statusLabel } from '../../components/ui/Misc'
import { downloadCSV } from '../../lib/csv'
import { brDate, todayISO } from '../../lib/date'
import { formatPhone, formatPrice, normalizeText } from '../../lib/format'
import { finalPrice } from '../../lib/stats'
import { useStore } from '../../store/StoreContext'
import type { AppointmentStatus } from '../../types'

const PAGE = 25

export function Appointments() {
  const { data } = useStore()
  const { open } = useBooking()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<AppointmentStatus | 'all'>('all')
  const [period, setPeriod] = useState<'futuros' | 'hoje' | 'passados' | 'todos'>('futuros')
  const [pro, setPro] = useState('all')
  const [limit, setLimit] = useState(PAGE)
  const [drawer, setDrawer] = useState<string | null>(null)
  const reminderOnly = params.get('lembrete') === 'pendente'
  const today = todayISO()
  const clients = useMemo(() => new Map(data.clients.map((c) => [c.id, c])), [data.clients])

  const list = useMemo(() => {
    const n = normalizeText(q)
    return data.appointments
      .filter((a) => {
        if (status !== 'all' && a.status !== status) return false
        if (pro !== 'all' && a.professionalId !== pro) return false
        if (period === 'futuros' && a.date < today) return false
        if (period === 'hoje' && a.date !== today) return false
        if (period === 'passados' && a.date >= today) return false
        if (reminderOnly && (a.reminder !== 'pendente' || a.status === 'cancelado' || a.date < today)) return false
        if (n) {
          const c = clients.get(a.clientId)
          const hay = normalizeText(`${a.code} ${a.serviceName} ${a.professionalName} ${c?.name ?? ''} ${c?.phone ?? ''}`)
          if (!hay.includes(n)) return false
        }
        return true
      })
      .sort((a, b) => {
        const k = (x: typeof a) => x.date + x.start
        return period === 'passados' || period === 'todos' ? (k(a) < k(b) ? 1 : -1) : k(a) < k(b) ? -1 : 1
      })
  }, [data.appointments, q, status, pro, period, reminderOnly, today, clients])

  const exportCsv = () =>
    downloadCSV(`agendamentos-demo-${today}.csv`, [
      ['Código', 'Data', 'Horário', 'Cliente', 'Telefone', 'Serviço', 'Profissional', 'Status', 'Valor (R$)', 'Lembrete'],
      ...list.map((a) => {
        const c = clients.get(a.clientId)
        return [a.code, brDate(a.date), a.start, c?.name ?? '', c ? formatPhone(c.phone) : '', a.serviceName, a.professionalName, statusLabel(a.status), finalPrice(a).toFixed(2).replace('.', ','), a.reminder]
      }),
    ])

  const sel = 'field h-10 w-auto py-1.5 text-sm'
  return (
    <div>
      <PageHeader
        title="Agendamentos"
        description={`${list.length} resultado(s) · dados demonstrativos`}
        actions={
          <>
            <Button variant="secondary" icon={<Download size={15} />} onClick={exportCsv} disabled={!list.length}>
              Exportar CSV
            </Button>
            <Button icon={<Plus size={16} />} onClick={() => open({ source: 'admin' })}>
              Novo
            </Button>
          </>
        }
      />
      <div className="mb-4 flex flex-col gap-2 rounded-xl border border-linen bg-cream p-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-stone" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE) }} placeholder="Buscar por cliente, código, serviço ou telefone" aria-label="Buscar agendamentos" className="field h-10 pl-10" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <select aria-label="Período" value={period} onChange={(e) => setPeriod(e.target.value as typeof period)} className={sel}>
            <option value="futuros">Hoje e futuros</option>
            <option value="hoje">Somente hoje</option>
            <option value="passados">Passados</option>
            <option value="todos">Todos</option>
          </select>
          <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={sel}>
            <option value="all">Todos os status</option>
            <option value="agendado">Agendado</option>
            <option value="confirmado">Confirmado</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <select aria-label="Profissional" value={pro} onChange={(e) => setPro(e.target.value)} className={`${sel} col-span-2`}>
            <option value="all">Todos os profissionais</option>
            {data.professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {reminderOnly && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-blush px-4 py-2.5 text-sm text-rose-dark">
          Mostrando apenas lembretes pendentes.
          <button type="button" className="font-semibold hover:underline" onClick={() => setParams({})}>
            Limpar
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <div className="rounded-xl border border-linen bg-cream">
          <EmptyState icon={<Search size={22} />} title="Nenhum agendamento encontrado" description="Ajuste a busca ou os filtros." />
        </div>
      ) : (
        <>
          {/* Tabela (desktop) */}
          <div className="hidden overflow-hidden rounded-xl border border-linen bg-cream md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-linen bg-sand/40 text-[0.72rem] tracking-wide text-taupe uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Serviço</th>
                  <th className="hidden px-4 py-3 font-semibold xl:table-cell">Profissional</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="hidden px-4 py-3 font-semibold lg:table-cell">Lembrete</th>
                  <th className="px-4 py-3 text-right font-semibold">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linen">
                {list.slice(0, limit).map((a) => (
                  <tr key={a.id} onClick={() => setDrawer(a.id)} className="cursor-pointer transition hover:bg-sand/30">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button type="button" className="text-left font-semibold text-ink tabular-nums" onClick={(e) => { e.stopPropagation(); setDrawer(a.id) }}>
                        {brDate(a.date).slice(0, 5)} · {a.start}
                      </button>
                      <p className="font-mono text-[0.68rem] text-stone">{a.code}</p>
                    </td>
                    <td className="px-4 py-3">{clients.get(a.clientId)?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-cocoa">{a.serviceName}</td>
                    <td className="hidden px-4 py-3 text-cocoa xl:table-cell">{a.professionalName}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="hidden px-4 py-3 lg:table-cell"><ReminderBadge status={a.reminder} /></td>
                    <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-ink tabular-nums">{formatPrice(finalPrice(a))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Cartões (celular) */}
          <ul className="space-y-2 md:hidden">
            {list.slice(0, limit).map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => setDrawer(a.id)} className="w-full rounded-xl border border-linen bg-cream p-4 text-left">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-ink">{clients.get(a.clientId)?.name}</p>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="mt-1 text-[0.8rem] text-taupe">
                    {brDate(a.date)} · {a.start} · {a.serviceName}
                  </p>
                  <p className="text-[0.8rem] text-taupe">
                    {a.professionalName} · {formatPrice(finalPrice(a))}
                  </p>
                </button>
              </li>
            ))}
          </ul>
          {list.length > limit && (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" onClick={() => setLimit(limit + PAGE)}>
                Carregar mais ({list.length - limit} restantes)
              </Button>
            </div>
          )}
        </>
      )}
      <AppointmentDrawer id={drawer} onClose={() => setDrawer(null)} />
    </div>
  )
}
