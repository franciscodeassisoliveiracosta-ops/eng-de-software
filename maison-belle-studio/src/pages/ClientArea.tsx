import { useMemo, useState } from 'react'
import { Award, CalendarPlus, ChevronRight, Gift, Pencil, Search, Ticket, UserRound } from 'lucide-react'
import { AppointmentDetails } from '../components/booking/AppointmentDetails'
import { useBooking } from '../components/booking/BookingProvider'
import { Button } from '../components/ui/Button'
import { SelectField, TextField } from '../components/ui/Field'
import { Modal } from '../components/ui/Modal'
import { Avatar, Badge, DemoTag, EmptyState, StatusBadge } from '../components/ui/Misc'
import { useToast } from '../components/ui/Toast'
import { validateCoupon } from '../lib/coupons'
import { brDate, longDate, relativeDayLabel, shortDate, todayISO } from '../lib/date'
import { formatDuration, formatPhone, formatPrice, onlyDigits } from '../lib/format'
import { loyaltyFor, POINTS_PER_REVIEW, REWARDS } from '../lib/loyalty'
import { hasErrors, validateEmail, validateName, validatePhone, type Errors } from '../lib/validation'
import { useStore } from '../store/StoreContext'
import type { Appointment, Client } from '../types'

type Tab = 'proximos' | 'historico' | 'fidelidade' | 'consultar'

export function ClientArea() {
  const { data, setCurrentClient } = useStore()
  const { open } = useBooking()
  const [tab, setTab] = useState<Tab>('proximos')
  const [detail, setDetail] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const client = data.clients.find((c) => c.id === data.currentClientId) ?? null
  const today = todayISO()

  const mine = useMemo(() => (client ? data.appointments.filter((a) => a.clientId === client.id) : []), [data.appointments, client])
  const upcoming = mine.filter((a) => a.date >= today && (a.status === 'agendado' || a.status === 'confirmado')).sort((a, b) => (a.date + a.start < b.date + b.start ? -1 : 1))
  const history = mine.filter((a) => !upcoming.includes(a)).sort((a, b) => (a.date + a.start < b.date + b.start ? 1 : -1))
  const pendingReviews = history.filter((a) => a.status === 'concluido' && !a.review).length

  const clientOptions = useMemo(
    () => [...data.clients].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [data.clients],
  )

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'proximos', label: 'Próximos', count: upcoming.length },
    { id: 'historico', label: 'Histórico', count: history.length },
    { id: 'fidelidade', label: 'Fidelidade e cupons' },
    { id: 'consultar', label: 'Consultar reserva' },
  ]

  return (
    <div className="mx-auto max-w-5xl px-5 pt-8 pb-24 sm:px-8 sm:pt-12">
      <div className="rounded-2xl border border-rose/20 bg-blush p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-md">
            <DemoTag>Modo demonstração</DemoTag>
            <p className="mt-2 text-[0.82rem] leading-relaxed text-rose-dark">
              Não há login nem proteção de conta: escolha um cadastro fictício para visualizar a área do cliente. Após agendar pelo site, seu cadastro é selecionado aqui automaticamente.
            </p>
          </div>
          <SelectField label="Visualizar como" value={client?.id ?? ''} onChange={(e) => setCurrentClient(e.target.value || null)} wrapClass="sm:w-64">
            <option value="">— selecione —</option>
            {clientOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
        </div>
      </div>

      {!client ? (
        <EmptyState icon={<UserRound size={24} />} title="Nenhum cadastro selecionado" description="Escolha um cliente fictício acima ou faça um agendamento para ver sua área." action={<Button onClick={() => open()}>Agendar horário</Button>} />
      ) : (
        <>
          <ProfileHeader client={client} onEdit={() => setEditing(true)} />

          <div role="tablist" aria-label="Seções da área do cliente" className="no-scrollbar -mx-5 mt-10 flex gap-6 overflow-x-auto border-b border-linen px-5 sm:mx-0 sm:px-0">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`relative shrink-0 pb-3 text-sm font-semibold transition ${tab === t.id ? 'text-ink' : 'text-stone hover:text-cocoa'}`}
              >
                {t.label}
                {t.count !== undefined && <span className="ml-1.5 text-[0.72rem] text-stone">{t.count}</span>}
                {tab === t.id && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-rose" />}
              </button>
            ))}
          </div>

          <div className="pt-6" role="tabpanel">
            {tab === 'proximos' &&
              (upcoming.length ? (
                <ul className="space-y-3">
                  {upcoming.map((a) => (
                    <AptRow key={a.id} a={a} onOpen={() => setDetail(a.id)} />
                  ))}
                </ul>
              ) : (
                <EmptyState icon={<CalendarPlus size={24} />} title="Nenhum horário marcado" description="Que tal reservar seu próximo momento de cuidado?" action={<Button onClick={() => open()}>Agendar horário</Button>} />
              ))}

            {tab === 'historico' && (
              <>
                {pendingReviews > 0 && (
                  <p className="mb-4 rounded-xl bg-blush/50 px-4 py-3 text-sm text-rose-dark">
                    Você tem {pendingReviews} atendimento(s) para avaliar. Cada avaliação vale +{POINTS_PER_REVIEW} pontos.
                  </p>
                )}
                {history.length ? (
                  <ul className="space-y-3">
                    {history.map((a) => (
                      <AptRow key={a.id} a={a} onOpen={() => setDetail(a.id)} />
                    ))}
                  </ul>
                ) : (
                  <EmptyState title="Ainda sem histórico" description="Atendimentos concluídos e cancelados aparecerão aqui." />
                )}
              </>
            )}

            {tab === 'fidelidade' && <Loyalty client={client} />}
            {tab === 'consultar' && <Lookup onOpen={setDetail} />}
          </div>
        </>
      )}

      <AppointmentDetails appointmentId={detail} onClose={() => setDetail(null)} />
      {editing && client && <EditClient client={client} onClose={() => setEditing(false)} />}
    </div>
  )
}

function ProfileHeader({ client, onEdit }: { client: Client; onEdit: () => void }) {
  const { data } = useStore()
  const l = loyaltyFor(data, client)
  return (
    <section className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Avatar name={client.name} size={64} color="#b9614a" />
        <div>
          <p className="eyebrow">Minha área</p>
          <h1 className="font-display text-4xl leading-tight text-ink">Olá, {client.name.split(' ')[0]}</h1>
          <p className="mt-1 text-[0.82rem] text-taupe">
            {formatPhone(client.phone)}
            {client.email && ` · ${client.email}`} · cliente desde {brDate(client.createdAt.slice(0, 10)).slice(3)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-linen bg-cream px-4 py-2.5 text-right">
          <p className="text-[0.68rem] font-semibold tracking-wider text-stone uppercase">Nível {l.tier.name}</p>
          <p className="font-display text-2xl text-ink">{l.balance.toLocaleString('pt-BR')} pts</p>
        </div>
        <Button variant="secondary" size="sm" icon={<Pencil size={14} />} onClick={onEdit}>
          Editar dados
        </Button>
      </div>
    </section>
  )
}

function AptRow({ a, onOpen }: { a: Appointment; onOpen: () => void }) {
  return (
    <li>
      <button type="button" onClick={onOpen} className="flex w-full items-center gap-4 rounded-xl border border-linen bg-cream p-4 text-left transition hover:border-taupe">
        <div className="w-14 shrink-0 text-center">
          <p className="text-[0.68rem] font-semibold tracking-wider text-rose uppercase">{shortDate(a.date).split(' ')[1]}</p>
          <p className="font-display text-3xl leading-none text-ink">{a.date.slice(8)}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">
            {a.serviceName}
            {['Hoje', 'Amanhã'].includes(relativeDayLabel(a.date)) && a.status !== 'cancelado' && <Badge tone="rose" className="ml-2 align-middle">{relativeDayLabel(a.date)}</Badge>}
          </p>
          <p className="truncate text-[0.8rem] text-taupe first-letter:uppercase">
            {longDate(a.date)} · {a.start} · {a.professionalName} · {formatDuration(a.duration)}
          </p>
        </div>
        <div className="hidden flex-col items-end gap-1 sm:flex">
          <StatusBadge status={a.status} />
          {a.status === 'concluido' && !a.review && <Badge tone="rose">Avaliar</Badge>}
        </div>
        <ChevronRight size={18} className="shrink-0 text-stone" />
      </button>
    </li>
  )
}

function Loyalty({ client }: { client: Client }) {
  const { data, redeemReward } = useStore()
  const toast = useToast()
  const l = loyaltyFor(data, client)
  const progress = l.next ? (l.earned - l.tier.min) / (l.next.min - l.tier.min) : 1
  const today = todayISO()
  const coupons = data.coupons.filter((c) => c.active && c.validUntil >= today && (!c.clientId || c.clientId === client.id))
  const [code, setCode] = useState('')
  const [serviceId, setServiceId] = useState(data.services.find((s) => s.active)?.id ?? '')
  const [result, setResult] = useState<ReturnType<typeof validateCoupon> | null>(null)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl bg-rose-dark p-6 text-cream sm:p-7">
        <p className="flex items-center gap-2 text-[0.8rem] font-semibold text-peach">
          <Award size={14} /> Clube Maison · demonstração
        </p>
        <p className="mt-4 font-display text-6xl">{l.balance.toLocaleString('pt-BR')}</p>
        <p className="text-sm text-cream/70">pontos disponíveis · {l.earned.toLocaleString('pt-BR')} acumulados</p>
        <div className="mt-6">
          <div className="flex justify-between text-[0.75rem] text-cream/75">
            <span>Nível {l.tier.name}</span>
            <span>{l.next ? `${(l.next.min - l.earned).toLocaleString('pt-BR')} pts para ${l.next.name}` : 'Nível máximo'}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream/20">
            <div className="h-full rounded-full bg-peach transition-all duration-700" style={{ width: `${Math.max(4, progress * 100)}%` }} />
          </div>
        </div>
        <ul className="mt-6 space-y-1.5 text-[0.8rem] text-cream/75">
          <li>• 1 ponto a cada R$ 1 em atendimentos concluídos ({l.fromServices} pts)</li>
          <li>• +{POINTS_PER_REVIEW} pontos por avaliação ({l.fromReviews} pts)</li>
          <li>• Benefício do nível: {l.tier.perk}</li>
        </ul>
      </section>

      <section>
        <h2 className="flex items-center gap-2 font-display text-2xl text-ink">
          <Gift size={20} strokeWidth={1.5} className="text-rose" /> Recompensas
        </h2>
        <ul className="mt-4 space-y-2.5">
          {REWARDS.map((r) => {
            const can = l.balance >= r.cost
            return (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-linen bg-cream p-4">
                <div>
                  <p className="font-semibold text-ink">{r.name}</p>
                  <p className="text-[0.78rem] text-taupe">{r.cost} pontos · gera cupom pessoal válido por 60 dias</p>
                </div>
                <Button
                  size="sm"
                  variant={can ? 'primary' : 'secondary'}
                  disabled={!can}
                  onClick={() => {
                    const res = redeemReward(client.id, r.id)
                    if (res.ok) toast.success('Recompensa resgatada', `Use o cupom ${res.value.code} no agendamento.`)
                    else toast.error(res.error)
                  }}
                >
                  Resgatar
                </Button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-linen bg-cream p-6">
        <h2 className="flex items-center gap-2 font-display text-2xl text-ink">
          <Ticket size={20} strokeWidth={1.5} className="text-rose" /> Meus cupons
        </h2>
        {coupons.length ? (
          <ul className="mt-4 divide-y divide-linen">
            {coupons.map((c) => (
              <li key={c.code} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-mono text-sm font-semibold tracking-wider text-ink">{c.code}</p>
                  <p className="text-[0.78rem] text-taupe">{c.description}</p>
                </div>
                <div className="text-right text-[0.72rem] text-stone">
                  {c.clientId && <Badge tone="rose" className="mb-1">Pessoal</Badge>}
                  <p>até {brDate(c.validUntil)}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-taupe">Nenhum cupom disponível.</p>
        )}
      </section>

      <section className="rounded-2xl border border-linen bg-cream p-6">
        <h2 className="font-display text-2xl text-ink">Testar um cupom</h2>
        <p className="mt-1 text-[0.8rem] text-taupe">Veja o desconto simulado antes de agendar. Experimente também INVERNO25 (expirado).</p>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            setResult(validateCoupon(data, code, serviceId, null, client.id))
          }}
        >
          <SelectField label="Serviço" value={serviceId} onChange={(e) => { setServiceId(e.target.value); setResult(null) }}>
            {data.services.filter((s) => s.active).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {formatPrice(s.price)}
              </option>
            ))}
          </SelectField>
          <div className="flex gap-2">
            <TextField label="Código" value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setResult(null) }} placeholder="BEMVINDA10" wrapClass="flex-1" className="uppercase" />
            <Button type="submit" variant="secondary" className="mt-6" disabled={!code.trim()}>
              Validar
            </Button>
          </div>
          {result &&
            (result.ok ? (
              <p className="rounded-lg bg-sage-soft px-3 py-2 text-sm text-sage">
                Válido · {result.label}: −{formatPrice(result.discount)} → total {formatPrice(Math.max(0, (data.services.find((s) => s.id === serviceId)?.price ?? 0) - result.discount))}
              </p>
            ) : (
              <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{result.error}</p>
            ))}
        </form>
      </section>
    </div>
  )
}

function Lookup({ onOpen }: { onOpen: (id: string) => void }) {
  const { data } = useStore()
  const [code, setCode] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const c = code.trim().toUpperCase()
    if (!c || !onlyDigits(phone)) {
      setError('Informe o código e o telefone usados no agendamento.')
      return
    }
    const a = data.appointments.find((x) => x.code.toUpperCase() === c)
    const client = a && data.clients.find((x) => x.id === a.clientId)
    if (!a || !client || client.phone !== onlyDigits(phone)) {
      setError('Nenhuma reserva encontrada com esses dados nesta demonstração.')
      return
    }
    setError('')
    onOpen(a.id)
  }
  return (
    <form onSubmit={submit} noValidate className="max-w-lg rounded-2xl border border-linen bg-cream p-6">
      <h2 className="flex items-center gap-2 font-display text-2xl text-ink">
        <Search size={20} strokeWidth={1.5} className="text-rose" /> Encontrar uma reserva
      </h2>
      <p className="mt-1 text-[0.82rem] text-taupe">Use o código recebido na confirmação (ex.: MB-7KQ2XR) e o telefone informado.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <TextField label="Código da reserva" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="font-mono uppercase" />
        <TextField label="Telefone" type="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="(81) 99999-9999" />
      </div>
      {error && <p className="mt-3 text-sm font-medium text-danger" role="alert">{error}</p>}
      <Button type="submit" className="mt-5">
        Consultar
      </Button>
    </form>
  )
}

function EditClient({ client, onClose }: { client: Client; onClose: () => void }) {
  const { upsertClient } = useStore()
  const toast = useToast()
  const [f, setF] = useState({ name: client.name, phone: formatPhone(client.phone), email: client.email ?? '' })
  const [e, setE] = useState<Errors<'name' | 'phone' | 'email'>>({})
  const save = () => {
    const errs = { name: validateName(f.name), phone: validatePhone(f.phone), email: validateEmail(f.email) }
    setE(errs)
    if (hasErrors(errs)) return
    const r = upsertClient({ ...client, name: f.name.trim(), phone: onlyDigits(f.phone), email: f.email.trim() || undefined })
    if (r.ok) {
      toast.success('Dados atualizados')
      onClose()
    } else toast.error(r.error)
  }
  return (
    <Modal open onClose={onClose} size="sm" title="Meus dados" footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={save}>Salvar</Button></>}>
      <div className="space-y-4">
        <TextField label="Nome completo" value={f.name} error={e.name} onChange={(ev) => setF({ ...f, name: ev.target.value })} />
        <TextField label="Telefone" type="tel" value={f.phone} error={e.phone} onChange={(ev) => setF({ ...f, phone: formatPhone(ev.target.value) })} />
        <TextField label="E-mail" type="email" optional value={f.email} error={e.email} onChange={(ev) => setF({ ...f, email: ev.target.value })} />
      </div>
    </Modal>
  )
}
