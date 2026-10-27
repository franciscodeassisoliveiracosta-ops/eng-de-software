import { useState } from 'react'

/**
 * Gráficos leves em SVG, sem bibliotecas externas.
 * Série única em rosa queimado; textos sempre em tons neutros; tooltip ao passar o mouse/tocar.
 */

interface BarDatum {
  label: string
  value: number
  hint?: string
}

export function HBarChart({ data, format = (v: number) => String(v), ariaLabel }: { data: BarDatum[]; format?: (v: number) => string; ariaLabel: string }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  if (!data.length) return <p className="py-8 text-center text-sm text-taupe">Sem dados no período.</p>
  return (
    <ul className="space-y-3" aria-label={ariaLabel}>
      {data.map((d) => (
        <li key={d.label} className="group" title={d.hint ? `${d.label}: ${format(d.value)} · ${d.hint}` : `${d.label}: ${format(d.value)}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[0.8rem]">
            <span className="truncate text-cocoa">{d.label}</span>
            <span className="shrink-0 font-semibold text-ink tabular-nums">{format(d.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-sand">
            <div className="h-full rounded-full bg-rose transition-all duration-700 group-hover:bg-rose-dark" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

interface ColumnDatum {
  key: string
  label: string
  value: number
  secondary?: number
}

/** Colunas verticais com tooltip. secondary é exibida como marca fina (período anterior). */
export function ColumnChart({
  data, format = (v: number) => String(v), height = 200, ariaLabel, secondaryLabel, primaryLabel,
}: { data: ColumnDatum[]; format?: (v: number) => string; height?: number; ariaLabel: string; secondaryLabel?: string; primaryLabel?: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...data.map((d) => Math.max(d.value, d.secondary ?? 0)))
  const ticks = [0, 0.5, 1].map((t) => t * max)
  const labelEvery = Math.max(1, Math.ceil(data.length / 7))
  return (
    <div className="relative">
      <div className="flex gap-2" style={{ height }}>
        <div className="flex w-12 shrink-0 flex-col justify-between pb-5 text-right text-[0.65rem] text-stone tabular-nums">
          {[...ticks].reverse().map((t, i) => (
            <span key={i}>{format(Math.round(t))}</span>
          ))}
        </div>
        <div className="relative flex-1" role="img" aria-label={ariaLabel}>
          <div className="absolute inset-x-0 top-0 bottom-5 flex flex-col justify-between">
            {ticks.map((_, i) => (
              <span key={i} className="border-t border-dashed border-linen" />
            ))}
          </div>
          <div className="absolute inset-x-0 top-0 bottom-5 flex items-end gap-[2px]">
            {data.map((d, i) => (
              <div
                key={d.key}
                className="relative flex h-full flex-1 items-end justify-center"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setHover(hover === i ? null : i)}
              >
                <div
                  className={`w-full max-w-7 rounded-t-[4px] transition-colors ${hover === i ? 'bg-rose-dark' : 'bg-rose'}`}
                  style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 2 : 0 }}
                />
                {d.secondary !== undefined && (
                  <div className="absolute inset-x-0 mx-auto h-[2px] w-full max-w-7 bg-ink/55" style={{ bottom: `${(d.secondary / max) * 100}%` }} />
                )}
                <span className="absolute -bottom-5 text-[0.62rem] whitespace-nowrap text-stone">{i % labelEvery === 0 ? d.label : ''}</span>
              </div>
            ))}
          </div>
          {hover !== null && data[hover] && (
            <div
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-ink px-3 py-2 text-[0.72rem] whitespace-nowrap text-cream shadow-lg"
              style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}
            >
              <p className="font-semibold">{data[hover].label}</p>
              <p>
                {primaryLabel ?? 'Valor'}: {format(data[hover].value)}
              </p>
              {data[hover].secondary !== undefined && (
                <p className="text-cream/70">
                  {secondaryLabel ?? 'Anterior'}: {format(data[hover].secondary!)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      {secondaryLabel && (
        <div className="mt-6 flex gap-4 text-[0.72rem] text-taupe">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-rose" /> {primaryLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-[2px] w-3 bg-ink/55" /> {secondaryLabel}
          </span>
        </div>
      )}
    </div>
  )
}

export function Donut({ value, label }: { value: number; label: string }) {
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20" role="img" aria-label={`${label}: ${Math.round(value * 100)}%`}>
      <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-sand)" strokeWidth="7" />
      <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-rose)" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${c * value} ${c}`} transform="rotate(-90 40 40)" />
      <text x="40" y="45" textAnchor="middle" className="fill-ink text-[15px] font-semibold">
        {Math.round(value * 100)}%
      </text>
    </svg>
  )
}
