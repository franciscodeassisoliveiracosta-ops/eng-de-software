import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Lock, LockOpen, Plus } from 'lucide-react'
import { AppointmentDrawer, PageHeader, Panel } from '../../components/admin/Common'
import { useBooking } from '../../components/booking/BookingProvider'
import { Button, IconButton } from '../../components/ui/Button'
import { Segmented, SelectField, TextField } from '../../components/ui/Field'
import { ConfirmDialog, Modal } from '../../components/ui/Modal'
import { Avatar, EmptyState, StatusBadge } from '../../components/ui/Misc'
import { useToast } from '../../components/ui/Toast'
import { WEEKDAY_SHORT } from '../../config/salon'
import { dayWindow, salonHours } from '../../lib/availability'
import { addDays, addMonths, fromMinutes, longDate, monthGrid, monthLabel, parseISODate, shortDate, startOfMonth, startOfWeek, todayISO, toMinutes } from '../../lib/date'
import { useStore } from '../../store/StoreContext'
import type { Appointment, ISODate, TimeBlock } from '../../types'

type View = 'dia' | 'semana' | 'mes'
const PX = 1.5 // pixels por minuto na visão diária

export function Agenda() {
  const { data, removeBlock } = useStore()
  const { open } = useBooking()
  const toast = useToast()
  const [view, setView] = useState<View>('dia')
  const [date, setDate] = useState<ISODate>(todayISO())
  const [params] = useSearchParams()
  const [proFilter, setProFilter] = useState<string>(() => params.get('pro') ?? 'all')
  const [drawer, setDrawer] = useState<string | null>(null)
  const [blockForm, setBlockForm] = useState<Partial<TimeBlock> | null>(null)
  const [unblock, setUnblock] = useState<TimeBlock | null>(null)

  const pros = data.professionals.filter((p) => p.active && (proFilter === 'all' || p.id === proFilter))
  const visible = (a: Appointment) => a.status !== 'cancelado' && (proFilter === 'all' || a.professionalId === proFilter)

  const move = (dir: number) => setDate(view === 'dia' ? addDays(date, dir) : view === 'semana' ? addDays(date, dir * 7) : addMonths(date, dir))
  const title =
    view === 'dia' ? longDate(date, true) : view === 'semana' ? `${shortDate(startOfWeek(date))} – ${shortDate(addDays(startOfWeek(date), 6))}` : monthLabel(date)

  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Clique em um atendimento para ver detalhes ou em um horário livre para bloqueá-lo."
        actions={
          <>
            <Button variant="secondary" icon={<Lock size={15} />} onClick={() => setBlockForm({ date, professionalId: proFilter === 'all' ? 'all' : proFilter, start: '12:00', end: '13:00', reason: '' })}>
              Bloquear horário
            </Button>
            <Button icon={<Plus size={16} />} onClick={() => open({ source: 'admin', professionalId: proFilter === 'all' ? undefined : proFilter })}>
              Novo agendamento
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-linen bg-cream p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-1">
          <IconButton label="Anterior" onClick={() => move(-1)}>
            <ChevronLeft size={18} />
          </IconButton>
          <Button size="sm" variant="ghost" onClick={() => setDate(todayISO())}>
            Hoje
          </Button>
          <IconButton label="Próximo" onClick={() => move(1)}>
            <ChevronRight size={18} />
          </IconButton>
          <p className="ml-2 truncate font-display text-xl text-ink first-letter:uppercase">{title}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Filtrar por profissional" value={proFilter} onChange={(e) => setProFilter(e.target.value)} className="field h-10 w-auto py-1.5 text-sm">
            <option value="all">Todos os profissionais</option>
            {data.professionals.filter((p) => p.active).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Segmented label="Visualização" value={view} onChange={setView} options={[{ value: 'dia', label: 'Dia' }, { value: 'semana', label: 'Semana' }, { value: 'mes', label: 'Mês' }]} />
        </div>
      </div>

      {view === 'dia' && <DayView date={date} pros={pros} visible={visible} onOpen={setDrawer} onBlockSlot={(proId, start) => setBlockForm({ date, professionalId: proId, start, end: fromMinutes(toMinutes(start) + 30), reason: '' })} onUnblock={setUnblock} />}
      {view === 'semana' && <WeekView date={date} visible={visible} onOpen={setDrawer} onPickDay={(d) => { setDate(d); setView('dia') }} />}
      {view === 'mes' && <MonthView date={date} visible={visible} onPickDay={(d) => { setDate(d); setView('dia') }} />}

      <AppointmentDrawer id={drawer} onClose={() => setDrawer(null)} />
      {blockForm && <BlockModal initial={blockForm} onClose={() => setBlockForm(null)} />}
      <ConfirmDialog
        open={!!unblock}
        onClose={() => setUnblock(null)}
        title="Desbloquear horário?"
        tone="default"
        message={unblock ? `${unblock.start}–${unblock.end} · ${unblock.reason || 'sem motivo'}. O período volta a ficar disponível para agendamento.` : ''}
        confirmLabel="Desbloquear"
        onConfirm={() => {
          if (unblock) {
            removeBlock(unblock.id)
            toast.success('Horário desbloqueado')
          }
        }}
      />
    </div>
  )
}

function DayView({
  date, pros, visible, onOpen, onBlockSlot, onUnblock,
}: {
  date: ISODate
  pros: ReturnType<typeof useStore>['data']['professionals']
  visible: (a: Appointment) => boolean
  onOpen: (id: string) => void
  onBlockSlot: (proId: string, start: string) => void
  onUnblock: (b: TimeBlock) => void
}) {
  const { data } = useStore()
  const hours = salonHours(date)
  if (!hours) return <Panel><EmptyState title="Salão fechado neste dia" description="Use as setas para navegar até um dia de funcionamento." /></Panel>
  const working = pros.filter((p) => dayWindow(date, p))
  if (!working.length) return <Panel><EmptyState title="Nenhum profissional atende neste dia" description="Altere o filtro ou escolha outra data." /></Panel>

  const open = toMinutes(hours.open)
  const close = toMinutes(hours.close)
  const rows = Array.from({ length: (close - open) / 30 }, (_, i) => open + i * 30)
  const clients = new Map(data.clients.map((c) => [c.id, c.name]))

  return (
    <div className="overflow-hidden rounded-xl border border-linen bg-cream">
      <div className="overflow-x-auto">
        <div className="min-w-fit">
          <div className="sticky top-0 z-10 flex border-b border-linen bg-cream">
            <div className="w-14 shrink-0" />
            {working.map((p) => (
              <div key={p.id} className="flex w-44 shrink-0 grow basis-0 items-center gap-2 border-l border-linen px-3 py-2.5 sm:w-52">
                <Avatar name={p.name} src={p.photo} size={28} color={p.color} />
                <div className="min-w-0">
                  <p className="truncate text-[0.8rem] font-semibold text-ink">{p.name.split(' ')[0]}</p>
                  <p className="text-[0.68rem] text-stone">
                    {p.start}–{p.end}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex">
            <div className="w-14 shrink-0">
              {rows.map((m) => (
                <div key={m} className="relative text-right text-[0.65rem] text-stone tabular-nums" style={{ height: 30 * PX }}>
                  <span className="absolute top-0.5 right-2">{m % 60 === 0 ? fromMinutes(m) : ''}</span>
                </div>
              ))}
            </div>
            {working.map((p) => {
              const win = dayWindow(date, p)!
              const apts = data.appointments.filter((a) => a.professionalId === p.id && a.date === date && visible(a))
              const blocks = data.blocks.filter((b) => b.date === date && (b.professionalId === p.id || b.professionalId === 'all'))
              return (
                <div key={p.id} className="relative w-44 shrink-0 grow basis-0 border-l border-linen sm:w-52">
                  {rows.map((m) => {
                    const inWindow = m >= win.start && m + 30 <= win.end
                    const busy = apts.some((a) => m < toMinutes(a.start) + a.duration && toMinutes(a.start) < m + 30) || blocks.some((b) => m < toMinutes(b.end) && toMinutes(b.start) < m + 30)
                    return (
                      <button
                        key={m}
                        type="button"
                        disabled={!inWindow || busy}
                        onClick={() => onBlockSlot(p.id, fromMinutes(m))}
                        aria-label={inWindow && !busy ? `${p.name}, ${fromMinutes(m)} livre — bloquear` : undefined}
                        className={`block w-full border-b border-dashed border-linen/70 text-left text-[0.65rem] transition ${inWindow ? (busy ? '' : 'group hover:bg-blush/30') : 'cursor-not-allowed bg-[repeating-linear-gradient(135deg,#f6e9df_0_6px,#fff_6px_12px)]'}`}
                        style={{ height: 30 * PX }}
                      >
                        {inWindow && !busy && <span className="hidden px-2 text-rose group-hover:inline">+ bloquear</span>}
                      </button>
                    )
                  })}
                  {blocks.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => onUnblock(b)}
                      className="absolute inset-x-1 flex flex-col overflow-hidden rounded-md border border-stone/30 bg-[repeating-linear-gradient(135deg,#efdccf_0_6px,#f9eee5_6px_12px)] px-2 py-1 text-left text-[0.7rem] text-cocoa hover:border-taupe"
                      style={{ top: (Math.max(toMinutes(b.start), open) - open) * PX + 1, height: (Math.min(toMinutes(b.end), close) - Math.max(toMinutes(b.start), open)) * PX - 2 }}
                      title="Clique para desbloquear"
                    >
                      <span className="flex items-center gap-1 font-semibold">
                        <Lock size={11} /> Bloqueado
                      </span>
                      <span className="truncate">{b.reason || `${b.start}–${b.end}`}</span>
                    </button>
                  ))}
                  {apts.map((a) => {
                    const top = (toMinutes(a.start) - open) * PX
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => onOpen(a.id)}
                        className="absolute inset-x-1 overflow-hidden rounded-md border-l-[3px] px-2 py-1 text-left text-[0.7rem] leading-tight shadow-sm transition hover:shadow-md"
                        style={{ top: top + 1, height: a.duration * PX - 2, borderColor: p.color, background: `${p.color}1f` }}
                      >
                        <span className="block font-semibold text-ink tabular-nums">
                          {a.start} · {a.serviceName}
                        </span>
                        <span className="block truncate text-cocoa">{clients.get(a.clientId)}</span>
                        {a.duration >= 60 && (
                          <span className="mt-1 inline-block">
                            <StatusBadge status={a.status} />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <p className="border-t border-linen px-4 py-2.5 text-[0.72rem] text-stone">Áreas listradas: fora do expediente ou bloqueadas. Clique em um bloqueio para desbloquear.</p>
    </div>
  )
}

function WeekView({ date, visible, onOpen, onPickDay }: { date: ISODate; visible: (a: Appointment) => boolean; onOpen: (id: string) => void; onPickDay: (d: ISODate) => void }) {
  const { data } = useStore()
  const start = startOfWeek(date)
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const today = todayISO()
  return (
    <div className="grid gap-3 md:grid-cols-7">
      {days.map((d) => {
        const list = data.appointments.filter((a) => a.date === d && visible(a)).sort((a, b) => (a.start < b.start ? -1 : 1))
        const closed = !salonHours(d)
        return (
          <div key={d} className={`flex min-h-32 flex-col rounded-xl border bg-cream ${d === today ? 'border-rose' : 'border-linen'}`}>
            <button type="button" onClick={() => onPickDay(d)} className="flex items-baseline justify-between border-b border-linen px-3 py-2 text-left hover:bg-sand/40">
              <span className="text-[0.7rem] font-semibold tracking-wider text-stone uppercase">{WEEKDAY_SHORT[parseISODate(d).getDay()]}</span>
              <span className="font-display text-2xl text-ink">{parseISODate(d).getDate()}</span>
            </button>
            <div className="flex-1 space-y-1 p-1.5">
              {closed ? (
                <p className="py-4 text-center text-[0.72rem] text-stone">Fechado</p>
              ) : list.length ? (
                list.map((a) => {
                  const color = data.professionals.find((p) => p.id === a.professionalId)?.color ?? '#8f8178'
                  return (
                    <button key={a.id} type="button" onClick={() => onOpen(a.id)} className="block w-full rounded-md border-l-[3px] px-2 py-1 text-left text-[0.7rem] leading-tight hover:brightness-95" style={{ borderColor: color, background: `${color}18` }}>
                      <span className="font-semibold text-ink tabular-nums">{a.start}</span> <span className="text-cocoa">{a.serviceName}</span>
                      <span className="block truncate text-stone">{a.professionalName.split(' ')[0]}</span>
                    </button>
                  )
                })
              ) : (
                <p className="py-4 text-center text-[0.72rem] text-stone">Livre</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MonthView({ date, visible, onPickDay }: { date: ISODate; visible: (a: Appointment) => boolean; onPickDay: (d: ISODate) => void }) {
  const { data } = useStore()
  const days = useMemo(() => monthGrid(startOfMonth(date)), [date])
  const today = todayISO()
  const counts = new Map<string, number>()
  for (const a of data.appointments) if (visible(a)) counts.set(a.date, (counts.get(a.date) ?? 0) + 1)
  const max = Math.max(1, ...counts.values())
  return (
    <div className="overflow-hidden rounded-xl border border-linen bg-cream">
      <div className="grid grid-cols-7 border-b border-linen text-center text-[0.68rem] font-semibold tracking-wider text-stone uppercase">
        {[1, 2, 3, 4, 5, 6, 0].map((d) => (
          <div key={d} className="py-2">
            {WEEKDAY_SHORT[d]}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const n = counts.get(d) ?? 0
          const inMonth = d.slice(0, 7) === date.slice(0, 7)
          const closed = !salonHours(d)
          return (
            <button
              key={d}
              type="button"
              onClick={() => onPickDay(d)}
              className={`flex aspect-square flex-col items-start justify-between border-r border-b border-linen p-1.5 text-left transition hover:bg-sand/40 sm:aspect-auto sm:h-24 sm:p-2.5 ${inMonth ? '' : 'opacity-40'} ${closed ? 'bg-[#fbf3ec]' : ''}`}
              aria-label={`${longDate(d)}: ${n} atendimentos`}
            >
              <span className={`text-sm ${d === today ? 'flex h-6 w-6 items-center justify-center rounded-full bg-ink font-semibold text-ivory' : 'text-ink'}`}>{parseISODate(d).getDate()}</span>
              {closed ? (
                <span className="text-[0.62rem] text-stone">fechado</span>
              ) : n > 0 ? (
                <span className="w-full">
                  <span className="hidden text-[0.7rem] font-semibold text-cocoa sm:block">{n} atend.</span>
                  <span className="sm:hidden text-[0.65rem] font-semibold text-cocoa">{n}</span>
                  <span className="mt-1 block h-1 rounded-full bg-sand">
                    <span className="block h-full rounded-full bg-rose" style={{ width: `${(n / max) * 100}%` }} />
                  </span>
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function BlockModal({ initial, onClose }: { initial: Partial<TimeBlock>; onClose: () => void }) {
  const { data, addBlock } = useStore()
  const toast = useToast()
  const [f, setF] = useState({ professionalId: initial.professionalId ?? 'all', date: initial.date ?? todayISO(), start: initial.start ?? '12:00', end: initial.end ?? '13:00', reason: initial.reason ?? '' })
  const [error, setError] = useState('')
  const conflicts = data.appointments.filter(
    (a) => a.date === f.date && a.status !== 'cancelado' && (f.professionalId === 'all' || a.professionalId === f.professionalId) && toMinutes(a.start) < toMinutes(f.end) && toMinutes(a.start) + a.duration > toMinutes(f.start),
  )
  const save = () => {
    if (f.date < todayISO()) return setError('Não é possível bloquear datas passadas.')
    const r = addBlock({ ...f, professionalId: f.professionalId as TimeBlock['professionalId'] })
    if (!r.ok) return setError(r.error)
    toast.success('Horário bloqueado', 'O período não aparece mais como disponível no site.')
    onClose()
  }
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Bloquear horário"
      subtitle="O período fica indisponível para novos agendamentos."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} icon={<Lock size={15} />}>
            Bloquear
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Profissional" value={f.professionalId} onChange={(e) => setF({ ...f, professionalId: e.target.value })} wrapClass="col-span-2">
          <option value="all">Salão inteiro (todos)</option>
          {data.professionals.filter((p) => p.active).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </SelectField>
        <TextField label="Data" type="date" value={f.date} min={todayISO()} onChange={(e) => setF({ ...f, date: e.target.value })} wrapClass="col-span-2" />
        <TextField label="Início" type="time" step={1800} value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} />
        <TextField label="Fim" type="time" step={1800} value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} />
        <TextField label="Motivo" optional value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="Ex.: almoço, curso, manutenção" wrapClass="col-span-2" />
      </div>
      {conflicts.length > 0 && (
        <p className="mt-4 flex gap-2 rounded-lg bg-blush p-3 text-[0.78rem] text-rose-dark">
          <LockOpen size={15} className="shrink-0" /> Existem {conflicts.length} atendimento(s) nesse intervalo. Eles não serão cancelados automaticamente.
        </p>
      )}
      {error && <p className="mt-3 text-sm font-medium text-danger">{error}</p>}
    </Modal>
  )
}
