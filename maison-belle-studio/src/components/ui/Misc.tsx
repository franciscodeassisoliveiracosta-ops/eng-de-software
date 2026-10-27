import { useState, type ReactNode } from 'react'
import { Flower2, Star } from 'lucide-react'
import type { AppointmentStatus, ClientTag, PaymentStatus, ReminderStatus } from '../../types'
import { initials } from '../../lib/format'

/**
 * Imagem com carregamento suave e fallback elegante (nunca exibe ícone de imagem quebrada).
 * `fallbacks` permite uma cadeia: arquivo local → foto remota → fundo neutro.
 */
export function SmartImage({
  src, alt, className = '', imgClass = '', eager = false, quiet = false, fallbacks = [],
}: { src: string; alt: string; className?: string; imgClass?: string; eager?: boolean; quiet?: boolean; fallbacks?: string[] }) {
  const chain = [src, ...fallbacks].filter(Boolean)
  const key = chain.join('|')
  const [state, setState] = useState<{ key: string; index: number; status: 'loading' | 'ok' | 'error' }>({ key, index: 0, status: 'loading' })
  const current = state.key === key ? state : { key, index: 0, status: 'loading' as const }
  if (current !== state) setState(current)
  const url = chain[current.index]
  return (
    <div className={`relative overflow-hidden bg-sand ${className}`}>
      {current.status === 'error' || !url ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-taupe/70" role="img" aria-label={alt}>
          {!quiet && (
            <>
              <Flower2 size={28} strokeWidth={1.2} />
              <span className="max-w-[80%] text-center font-display text-sm italic">{alt}</span>
            </>
          )}
        </div>
      ) : (
        <img
          key={url}
          src={url}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setState({ key, index: current.index, status: 'ok' })}
          onError={() =>
            setState(current.index + 1 < chain.length ? { key, index: current.index + 1, status: 'loading' } : { key, index: current.index, status: 'error' })
          }
          className={`h-full w-full object-cover transition-opacity duration-700 ${current.status === 'ok' ? 'opacity-100' : 'opacity-0'} ${imgClass}`}
        />
      )}
    </div>
  )
}

export function Avatar({ name, src, size = 40, color }: { name: string; src?: string; size?: number; color?: string }) {
  const [err, setErr] = useState(false)
  if (src && !err)
    return <img src={src} alt="" onError={() => setErr(true)} width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: color ?? '#8f8178', fontSize: size * 0.36 }}
    >
      {initials(name)}
    </span>
  )
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Nota ${value} de 5`} role="img">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= value ? 'fill-burnt text-burnt' : 'text-linen'} strokeWidth={1.5} />
      ))}
    </span>
  )
}

export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div role="radiogroup" aria-label="Nota" className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} estrela${i > 1 ? 's' : ''}`}
          onMouseEnter={() => setHover(i)}
          onClick={() => onChange(i)}
          className="rounded p-1 transition hover:scale-110"
        >
          <Star size={28} strokeWidth={1.4} className={i <= (hover || value) ? 'fill-burnt text-burnt' : 'text-linen'} />
        </button>
      ))}
    </div>
  )
}

type Tone = 'neutral' | 'rose' | 'sage' | 'gold' | 'danger' | 'ink'
const tones: Record<Tone, string> = {
  neutral: 'bg-sand text-cocoa',
  rose: 'bg-blush text-rose-dark',
  sage: 'bg-sage-soft text-sage',
  gold: 'bg-peach/40 text-rose-dark',
  danger: 'bg-danger-soft text-danger',
  ink: 'bg-ink text-ivory',
}

export function Badge({ tone = 'neutral', children, className = '' }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold whitespace-nowrap ${tones[tone]} ${className}`}>{children}</span>
}

const STATUS: Record<AppointmentStatus, { label: string; tone: Tone }> = {
  agendado: { label: 'Agendado', tone: 'gold' },
  confirmado: { label: 'Confirmado', tone: 'sage' },
  concluido: { label: 'Concluído', tone: 'neutral' },
  cancelado: { label: 'Cancelado', tone: 'danger' },
}
export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge>
}
export const statusLabel = (s: AppointmentStatus) => STATUS[s].label

const PAY: Record<PaymentStatus, { label: string; tone: Tone }> = {
  pendente: { label: 'Pagamento pendente', tone: 'neutral' },
  pago_simulado: { label: 'Pago (simulação)', tone: 'sage' },
  reembolso_simulado: { label: 'Reembolso (simulação)', tone: 'rose' },
}
export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <Badge tone={PAY[status].tone}>{PAY[status].label}</Badge>
}

const REM: Record<ReminderStatus, { label: string; tone: Tone }> = {
  pendente: { label: 'Lembrete pendente', tone: 'gold' },
  enviado_manual: { label: 'Lembrete enviado', tone: 'sage' },
  nao_aplicavel: { label: 'Sem lembrete', tone: 'neutral' },
}
export function ReminderBadge({ status }: { status: ReminderStatus }) {
  return <Badge tone={REM[status].tone}>{REM[status].label}</Badge>
}

const TAGS: Record<ClientTag, { label: string; tone: Tone }> = {
  vip: { label: 'VIP', tone: 'ink' },
  ativo: { label: 'Ativa', tone: 'sage' },
  inativo: { label: 'Inativa', tone: 'neutral' },
  novo: { label: 'Nova', tone: 'rose' },
}
export function ClientTagBadge({ tag }: { tag: ClientTag }) {
  return <Badge tone={TAGS[tag].tone}>{TAGS[tag].label}</Badge>
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sand text-taupe">{icon ?? <Flower2 size={24} strokeWidth={1.4} />}</div>
      <p className="font-display text-2xl text-ink">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm text-taupe">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function DemoTag({ children = 'Demonstração', className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-rose/25 bg-blush px-2.5 py-0.5 text-[0.68rem] font-semibold tracking-wide text-rose-dark uppercase ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-burnt" />
      {children}
    </span>
  )
}

export function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <span className={`inline-flex items-baseline gap-2 whitespace-nowrap ${light ? 'text-cream' : 'text-ink'}`}>
      <span className="font-display text-[1.7rem] leading-none tracking-[-0.01em]">
        Maison <em className={light ? 'text-peach' : 'text-rose'}>Belle</em>
      </span>
      {!compact && <span className={`text-[0.62rem] font-semibold tracking-[0.24em] uppercase ${light ? 'text-cream/60' : 'text-taupe'}`}>Studio</span>}
    </span>
  )
}
