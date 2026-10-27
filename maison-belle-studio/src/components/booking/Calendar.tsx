import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { WEEKDAY_SHORT } from '../../config/salon'
import type { DayStatus, Slot } from '../../lib/availability'
import { addMonths, longDate, monthGrid, monthLabel, parseISODate, startOfMonth, todayISO } from '../../lib/date'
import type { ISODate } from '../../types'

const ORDER = [1, 2, 3, 4, 5, 6, 0] // segunda a domingo

interface CalendarProps {
  value: ISODate | null
  onChange: (d: ISODate) => void
  getStatus: (d: ISODate) => DayStatus
  maxMonthsAhead?: number
}

const STATUS_HINT: Record<DayStatus, string> = {
  past: 'data passada',
  closed: 'fechado',
  out_of_range: 'fora do período de agendamento',
  full: 'sem horários livres',
  available: 'com horários disponíveis',
}

export function Calendar({ value, onChange, getStatus, maxMonthsAhead = 2 }: CalendarProps) {
  const today = todayISO()
  const [month, setMonth] = useState(() => startOfMonth(value ?? today))
  const days = useMemo(() => monthGrid(month), [month])
  const statuses = useMemo(() => new Map(days.map((d) => [d, getStatus(d)])), [days, getStatus])
  const minMonth = startOfMonth(today)
  const maxMonth = addMonths(today, maxMonthsAhead)

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, -1))}
          disabled={month <= minMonth}
          aria-label="Mês anterior"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-cocoa transition hover:bg-sand disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="font-display text-xl capitalize text-ink" aria-live="polite">
          {monthLabel(month)}
        </p>
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, 1))}
          disabled={month >= maxMonth}
          aria-label="Próximo mês"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-cocoa transition hover:bg-sand disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center" role="grid" aria-label={`Calendário de ${monthLabel(month)}`}>
        {ORDER.map((d) => (
          <div key={d} className="pb-1 text-[0.68rem] font-semibold tracking-wider text-stone uppercase" role="columnheader">
            {WEEKDAY_SHORT[d]}
          </div>
        ))}
        {days.map((d) => {
          const inMonth = d.slice(0, 7) === month.slice(0, 7)
          const status = statuses.get(d)!
          const selectable = status === 'available'
          const selected = d === value
          const isToday = d === today
          return (
            <button
              key={d}
              type="button"
              role="gridcell"
              disabled={!selectable}
              aria-selected={selected}
              aria-label={`${longDate(d)} — ${STATUS_HINT[status]}`}
              onClick={() => onChange(d)}
              className={[
                'relative mx-auto flex aspect-square w-full max-w-12 flex-col items-center justify-center rounded-full text-sm transition',
                !inMonth && 'opacity-35',
                selected
                  ? 'bg-ink font-semibold text-ivory'
                  : selectable
                    ? 'font-semibold text-ink hover:bg-blush'
                    : status === 'full'
                      ? 'text-stone line-through decoration-rose/60'
                      : 'text-stone/50',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {parseISODate(d).getDate()}
              {selectable && !selected && <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-rose" />}
              {isToday && !selected && <span className="absolute inset-0.5 rounded-full border border-gold/60" />}
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[0.72rem] text-taupe">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-rose" /> Disponível
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="text-stone line-through decoration-rose/60">12</span> Lotado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="text-stone/50">12</span> Fechado ou indisponível
        </span>
      </div>
    </div>
  )
}

const PERIODS = [
  { label: 'Manhã', from: 0, to: 12 * 60 },
  { label: 'Tarde', from: 12 * 60, to: 18 * 60 },
  { label: 'Noite', from: 18 * 60, to: 24 * 60 },
]

export function SlotGrid({ slots, value, onChange, showUnavailable = true }: { slots: Slot[]; value: string | null; onChange: (t: string) => void; showUnavailable?: boolean }) {
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3))
  const groups = PERIODS.map((p) => ({ ...p, slots: slots.filter((s) => toMin(s.time) >= p.from && toMin(s.time) < p.to && (showUnavailable || s.available)) })).filter((g) => g.slots.length)
  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-2 text-[0.7rem] font-semibold tracking-[0.2em] text-stone uppercase">
            {g.label} <span className="font-medium tracking-normal normal-case">· {g.slots.filter((s) => s.available).length} {g.slots.filter((s) => s.available).length === 1 ? 'livre' : 'livres'}</span>
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {g.slots.map((s) => (
              <button
                key={s.time}
                type="button"
                disabled={!s.available}
                aria-pressed={value === s.time}
                aria-label={s.available ? `${s.time}, disponível` : `${s.time}, ocupado`}
                onClick={() => onChange(s.time)}
                className={`h-11 rounded-lg border text-sm font-semibold tabular-nums transition ${
                  value === s.time
                    ? 'border-ink bg-ink text-ivory'
                    : s.available
                      ? 'border-linen bg-cream text-ink hover:border-rose hover:text-rose'
                      : 'cursor-not-allowed border-transparent bg-sand/60 text-stone/60 line-through'
                }`}
              >
                {s.time}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
