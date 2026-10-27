import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Clock, Copy, CreditCard, Info, QrCode, Search, Store, Ticket, Users, X } from 'lucide-react'
import { CATEGORIES } from '../../data/catalog'
import { dayStatus, getSlots, qualifiedProfessionals } from '../../lib/availability'
import { validateCoupon, type CouponResult } from '../../lib/coupons'
import { brDate, longDate } from '../../lib/date'
import { formatDuration, formatPhone, formatPrice, normalizeText } from '../../lib/format'
import { hasErrors, validateEmail, validateName, validatePhone, type Errors } from '../../lib/validation'
import { bookingMessage, waLink } from '../../lib/whatsapp'
import { useStore } from '../../store/StoreContext'
import type { Appointment, CategoryId, ISODate, PaymentMethod } from '../../types'
import { Button, ExternalButton } from '../ui/Button'
import { WhatsAppIcon } from '../ui/BrandIcons'
import { TextArea, TextField } from '../ui/Field'
import { Modal } from '../ui/Modal'
import { Avatar, DemoTag, SmartImage } from '../ui/Misc'
import { useToast } from '../ui/Toast'
import { Calendar, SlotGrid } from './Calendar'
import type { BookingPreset } from './BookingProvider'

const STEPS = ['Serviço', 'Profissional', 'Data', 'Horário', 'Seus dados', 'Revisão'] as const

type Form = { name: string; phone: string; email: string; notes: string }
type FormKey = keyof Form

const PAYMENTS: { id: PaymentMethod; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: 'salao', label: 'Pagar no salão', desc: 'Dinheiro, cartão ou Pix no dia do atendimento.', icon: <Store size={18} /> },
  { id: 'pix', label: 'Pix antecipado', desc: 'Interface demonstrativa — nenhuma cobrança é gerada.', icon: <QrCode size={18} /> },
  { id: 'cartao', label: 'Cartão online', desc: 'Interface demonstrativa — nenhum dado de cartão é solicitado.', icon: <CreditCard size={18} /> },
]

export function BookingFlow({ preset, onClose }: { preset: BookingPreset; onClose: () => void }) {
  const { data, createBooking } = useStore()
  const toast = useToast()
  const navigate = useNavigate()

  const presetService = data.services.find((s) => s.id === preset.serviceId && s.active)
  const presetPro = data.professionals.find((p) => p.id === preset.professionalId && p.active)

  const [step, setStep] = useState(presetService ? (presetPro ? 2 : 1) : 0)
  const [serviceId, setServiceId] = useState<string | null>(presetService?.id ?? null)
  const [proFilter, setProFilter] = useState<string | null>(presetPro?.id ?? null)
  const [professionalId, setProfessionalId] = useState<string | 'any' | null>(
    presetService && presetPro && presetPro.serviceIds.includes(presetService.id) ? presetPro.id : null,
  )
  const [date, setDate] = useState<ISODate | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [form, setForm] = useState<Form>({ name: '', phone: '', email: '', notes: '' })
  const [errors, setErrors] = useState<Errors<FormKey>>({})
  const [couponInput, setCouponInput] = useState(preset.couponCode ?? '')
  const [coupon, setCoupon] = useState<CouponResult | null>(null)
  const [payment, setPayment] = useState<PaymentMethod>('salao')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<Appointment | null>(null)
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [query, setQuery] = useState('')

  const service = data.services.find((s) => s.id === serviceId) ?? null
  const pros = useMemo(() => (serviceId ? qualifiedProfessionals(data, serviceId) : []), [data, serviceId])
  const chosenPro = professionalId && professionalId !== 'any' ? data.professionals.find((p) => p.id === professionalId) ?? null : null

  const visibleServices = useMemo(() => {
    const q = normalizeText(query)
    return data.services.filter(
      (s) =>
        s.active &&
        (category === 'all' || s.category === category) &&
        (!proFilter || data.professionals.find((p) => p.id === proFilter)?.serviceIds.includes(s.id)) &&
        (!q || normalizeText(s.name + ' ' + s.description).includes(q)),
    )
  }, [data, category, proFilter, query])

  const getStatus = useCallback(
    (d: ISODate) => (serviceId && professionalId ? dayStatus({ data, serviceId, professionalId, date: d }) : 'closed'),
    [data, serviceId, professionalId],
  )
  const slots = useMemo(() => (serviceId && professionalId && date ? getSlots({ data, serviceId, professionalId, date }) : []), [data, serviceId, professionalId, date])

  // Revalida cupom quando serviço/data mudam
  const appliedCoupon = useMemo(() => {
    if (!coupon?.ok || !serviceId) return null
    const r = validateCoupon(data, coupon.code, serviceId, date)
    return r.ok ? r : null
  }, [coupon, data, serviceId, date])
  const discount = appliedCoupon?.discount ?? 0
  const total = service ? Math.max(0, service.price - discount) : 0

  const selectService = (id: string) => {
    setServiceId(id)
    const stillValid = professionalId && (professionalId === 'any' || data.professionals.find((p) => p.id === professionalId)?.serviceIds.includes(id))
    if (!stillValid) setProfessionalId(proFilter && data.professionals.find((p) => p.id === proFilter)?.serviceIds.includes(id) ? proFilter : null)
    setDate(null)
    setTime(null)
  }

  const canNext = [!!service, !!professionalId, !!date, !!time, true, true][step]

  const next = () => {
    if (step === 4) {
      const e: Errors<FormKey> = { name: validateName(form.name), phone: validatePhone(form.phone), email: validateEmail(form.email) }
      setErrors(e)
      if (hasErrors(e)) {
        toast.error('Confira os campos destacados.')
        return
      }
    }
    setStep((s) => Math.min(5, s + 1))
  }
  const back = () => setStep((s) => Math.max(0, s - 1))

  const applyCoupon = () => {
    if (!serviceId) return
    const r = validateCoupon(data, couponInput, serviceId, date)
    setCoupon(r)
    if (r.ok) toast.success('Cupom aplicado', `${r.label} — ${formatPrice(r.discount)} de desconto.`)
  }

  const confirm = () => {
    if (!serviceId || !professionalId || !date || !time) return
    setSubmitting(true)
    // pequeno atraso apenas para feedback visual; nada é enviado a servidores
    setTimeout(() => {
      const r = createBooking({
        serviceId, professionalId, date, time,
        name: form.name, phone: form.phone, email: form.email, notes: form.notes,
        couponCode: appliedCoupon?.code, paymentMethod: payment, source: preset.source ?? 'site',
      })
      setSubmitting(false)
      if (r.ok) {
        setDone(r.value)
        toast.success('Agendamento registrado', `Código ${r.value.code}`)
      } else {
        toast.error('Não foi possível concluir', r.error)
        if (r.error.includes('horário')) {
          setTime(null)
          setStep(3)
        }
      }
    }, 650)
  }

  if (done) return <SuccessView appointment={done} clientName={form.name} onClose={onClose} onAccount={preset.source === 'admin' ? undefined : () => { onClose(); navigate('/minha-conta') }} />

  return (
    <Modal open onClose={onClose} size="xl" bare>
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Cabeçalho com progresso */}
        <header className="border-b border-linen px-5 pt-4 pb-3 sm:px-7 sm:pt-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Agendamento online</p>
              <h2 className="mt-1 font-display text-[1.7rem] leading-tight text-ink sm:text-3xl">{STEPS[step]}</h2>
            </div>
            <div className="flex items-center gap-2">
              <DemoTag className="max-sm:hidden" />
              <button type="button" onClick={onClose} aria-label="Fechar agendamento" className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-taupe hover:bg-sand hover:text-ink">
                <X size={20} />
              </button>
            </div>
          </div>
          <ol className="mt-4 flex gap-1.5" aria-label="Etapas do agendamento">
            {STEPS.map((label, i) => (
              <li key={label} className="flex-1">
                <button
                  type="button"
                  disabled={i > step}
                  onClick={() => setStep(i)}
                  aria-current={i === step ? 'step' : undefined}
                  aria-label={`Etapa ${i + 1}: ${label}`}
                  className="group block w-full text-left disabled:cursor-default"
                >
                  <span className={`block h-[3px] rounded-full transition-colors duration-500 ${i <= step ? 'bg-rose' : 'bg-linen'}`} />
                  <span className={`mt-1.5 hidden text-[0.68rem] font-semibold tracking-wide md:block ${i === step ? 'text-ink' : i < step ? 'text-taupe group-hover:text-rose' : 'text-stone/60'}`}>
                    {i + 1}. {label}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_300px]">
          <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
            {step === 0 && (
              <div>
                {proFilter && (
                  <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-blush/60 px-4 py-2.5 text-sm text-rose-dark">
                    <span>
                      Mostrando serviços de <strong>{data.professionals.find((p) => p.id === proFilter)?.name}</strong>
                    </span>
                    <button type="button" className="font-semibold underline-offset-2 hover:underline" onClick={() => setProFilter(null)}>
                      Ver todos
                    </button>
                  </div>
                )}
                <div className="relative mb-3">
                  <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-stone" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar serviço" aria-label="Buscar serviço" className="field pl-10" />
                </div>
                <div className="no-scrollbar -mx-5 mb-4 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
                  {[{ id: 'all' as const, label: 'Todos' }, ...CATEGORIES].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      aria-pressed={category === c.id}
                      className={`h-8 shrink-0 rounded-full border px-3.5 text-[0.75rem] font-semibold transition ${category === c.id ? 'border-ink bg-ink text-ivory' : 'border-linen bg-cream text-cocoa hover:border-taupe'}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                {visibleServices.length === 0 ? (
                  <p className="rounded-lg bg-sand/60 px-4 py-8 text-center text-sm text-taupe">Nenhum serviço encontrado com esses filtros.</p>
                ) : (
                  <ul className="grid gap-2.5 sm:grid-cols-2">
                    {visibleServices.map((s) => {
                      const selected = s.id === serviceId
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => selectService(s.id)}
                            aria-pressed={selected}
                            className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${selected ? 'border-ink bg-cream ring-1 ring-ink' : 'border-linen bg-cream/70 hover:border-taupe'}`}
                          >
                            <SmartImage src={s.image} alt="" className="h-16 w-16 shrink-0 rounded-lg" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-semibold text-ink">{s.name}</span>
                              <span className="mt-0.5 flex items-center gap-2 text-[0.78rem] text-taupe">
                                <Clock size={12} /> {formatDuration(s.duration)}
                              </span>
                              <span className="mt-0.5 block text-sm font-semibold text-rose">{formatPrice(s.price)}</span>
                            </span>
                            <span className={`mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selected ? 'border-ink bg-ink text-ivory' : 'border-linen'}`}>
                              {selected && <Check size={14} />}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}

            {step === 1 && service && (
              <div>
                <p className="mb-4 text-sm text-taupe">
                  Profissionais que realizam <strong className="text-ink">{service.name}</strong>.
                </p>
                {pros.length === 0 ? (
                  <p className="rounded-lg bg-sand/60 px-4 py-8 text-center text-sm text-taupe">Nenhum profissional ativo realiza este serviço no momento.</p>
                ) : (
                  <ul className="grid gap-2.5 sm:grid-cols-2">
                    <li className="sm:col-span-2">
                      <ProOption
                        selected={professionalId === 'any'}
                        onClick={() => { setProfessionalId('any'); setDate(null); setTime(null) }}
                        title="Qualquer profissional disponível"
                        subtitle="Mostramos todos os horários livres e definimos a profissional na confirmação."
                        avatar={<span className="flex h-14 w-14 items-center justify-center rounded-full bg-sand text-cocoa"><Users size={22} strokeWidth={1.5} /></span>}
                      />
                    </li>
                    {pros.map((p) => (
                      <li key={p.id}>
                        <ProOption
                          selected={professionalId === p.id}
                          onClick={() => { setProfessionalId(p.id); setDate(null); setTime(null) }}
                          title={p.name}
                          subtitle={p.role}
                          meta={p.specialties.slice(0, 2).join(' · ')}
                          avatar={<Avatar name={p.name} src={p.photo} size={56} color={p.color} />}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="mx-auto max-w-md">
                <Calendar
                  value={date}
                  getStatus={getStatus}
                  onChange={(d) => {
                    setDate(d)
                    setTime(null)
                    setStep(3)
                  }}
                />
              </div>
            )}

            {step === 3 && date && (
              <div>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-taupe">
                    <span className="inline-block font-semibold text-ink first-letter:uppercase">{longDate(date)}</span> · {service && formatDuration(service.duration)} de atendimento
                  </p>
                  <button type="button" onClick={() => setStep(2)} className="text-sm font-semibold text-rose hover:underline">
                    Trocar data
                  </button>
                </div>
                {slots.some((s) => s.available) ? (
                  <SlotGrid slots={slots} value={time} onChange={setTime} />
                ) : (
                  <p className="rounded-lg bg-sand/60 px-4 py-8 text-center text-sm text-taupe">Não há horários livres nesta data. Escolha outro dia.</p>
                )}
                <p className="mt-5 flex items-start gap-2 text-[0.75rem] text-stone">
                  <Info size={14} className="mt-0.5 shrink-0" />
                  Horários calculados em modo de demonstração com os dados salvos neste navegador; não representam a agenda real.
                </p>
              </div>
            )}

            {step === 4 && (
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault()
                  next()
                }}
                className="grid gap-4 sm:grid-cols-2"
              >
                <TextField label="Nome completo" autoComplete="name" value={form.name} error={errors.name} wrapClass="sm:col-span-2"
                  onChange={(e) => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: undefined }) }} />
                <TextField label="Telefone / WhatsApp" type="tel" inputMode="tel" autoComplete="tel" placeholder="(81) 99999-9999" value={form.phone} error={errors.phone}
                  onChange={(e) => { setForm({ ...form, phone: formatPhone(e.target.value) }); if (errors.phone) setErrors({ ...errors, phone: undefined }) }} />
                <TextField label="E-mail" type="email" autoComplete="email" optional placeholder="voce@email.com" value={form.email} error={errors.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: undefined }) }} />
                <TextArea label="Observações" optional rows={3} placeholder="Alergias, preferências ou referências de resultado" value={form.notes} wrapClass="sm:col-span-2"
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={300} />
                <div className="sm:col-span-2">
                  <p className="mb-1.5 text-[0.8rem] font-semibold text-cocoa">Cupom de desconto</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Ticket size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-stone" />
                      <input
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCoupon(null) }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon() } }}
                        placeholder="Ex.: BEMVINDA10"
                        aria-label="Código do cupom"
                        className={`field pl-10 uppercase ${coupon && !coupon.ok ? 'field-error' : ''}`}
                      />
                    </div>
                    <Button variant="secondary" onClick={applyCoupon} disabled={!couponInput.trim()}>
                      Aplicar
                    </Button>
                  </div>
                  {coupon && !coupon.ok && <p className="mt-1.5 text-[0.78rem] font-medium text-danger">{coupon.error}</p>}
                  {appliedCoupon && <p className="mt-1.5 text-[0.78rem] font-medium text-sage">✓ {appliedCoupon.label}: −{formatPrice(appliedCoupon.discount)}</p>}
                  {coupon?.ok && !appliedCoupon && <p className="mt-1.5 text-[0.78rem] font-medium text-danger">O cupom não vale para a data escolhida.</p>}
                  <p className="mt-1.5 text-[0.72rem] text-stone">Cupons demonstrativos: BEMVINDA10, MAISON20, UNHAS15, DIADESPA.</p>
                </div>
                <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
              </form>
            )}

            {step === 5 && service && date && time && (
              <div className="space-y-6">
                <dl className="divide-y divide-linen rounded-xl border border-linen bg-cream">
                  {[
                    ['Serviço', service.name, 0],
                    ['Profissional', chosenPro?.name ?? 'Qualquer profissional disponível (definido na confirmação)', 1],
                    ['Data', `${longDate(date, true)}`, 2],
                    ['Horário', `${time} · duração ${formatDuration(service.duration)}`, 3],
                    ['Cliente', `${form.name} · ${form.phone}${form.email ? ' · ' + form.email : ''}`, 4],
                    ...(form.notes ? [['Observações', form.notes, 4] as const] : []),
                  ].map(([k, v, s]) => (
                    <div key={String(k)} className="flex items-start justify-between gap-4 px-4 py-3">
                      <dt className="w-24 shrink-0 text-[0.78rem] font-semibold text-stone">{k}</dt>
                      <dd className="min-w-0 flex-1 text-sm text-ink first-letter:uppercase">{v}</dd>
                      <button type="button" onClick={() => setStep(Number(s))} className="shrink-0 text-[0.78rem] font-semibold text-rose hover:underline">
                        Alterar
                      </button>
                    </div>
                  ))}
                </dl>

                <fieldset>
                  <legend className="mb-2 text-[0.8rem] font-semibold text-cocoa">Forma de pagamento pretendida</legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {PAYMENTS.map((p) => (
                      <label key={p.id} className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition ${payment === p.id ? 'border-ink bg-cream ring-1 ring-ink' : 'border-linen bg-cream/70 hover:border-taupe'}`}>
                        <input type="radio" name="payment" value={p.id} checked={payment === p.id} onChange={() => setPayment(p.id)} className="sr-only" />
                        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                          {p.icon} {p.label}
                        </span>
                        <span className="text-[0.72rem] leading-snug text-taupe">{p.desc}</span>
                      </label>
                    ))}
                  </div>
                  <p className="mt-2 text-[0.72rem] text-stone">Nenhum pagamento é processado nesta demonstração. O status ficará como “pendente”.</p>
                </fieldset>
              </div>
            )}
          </div>

          {/* Resumo lateral */}
          <aside className="hidden border-l border-linen bg-sand/40 p-6 lg:block">
            <Summary
              serviceName={service?.name}
              image={service?.image}
              duration={service?.duration}
              price={service?.price}
              discount={discount}
              total={total}
              pro={professionalId === 'any' ? 'Qualquer profissional' : chosenPro?.name}
              date={date}
              time={time}
            />
          </aside>
        </div>

        <footer className="flex items-center gap-3 border-t border-linen bg-cream/70 px-5 py-3.5 sm:px-7">
          <div className="min-w-0 flex-1 lg:hidden">
            {service ? (
              <>
                <p className="truncate text-[0.78rem] text-taupe">
                  {service.name}
                  {date && ` · ${brDate(date).slice(0, 5)}`}
                  {time && ` · ${time}`}
                </p>
                <p className="text-sm font-semibold text-ink">{formatPrice(total)}</p>
              </>
            ) : (
              <p className="text-[0.8rem] text-taupe">Escolha um serviço</p>
            )}
          </div>
          <div className="ml-auto flex gap-2">
            {step > 0 && (
              <Button variant="ghost" onClick={back} icon={<ArrowLeft size={16} />} aria-label="Voltar etapa">
                <span className="hidden sm:inline">Voltar</span>
              </Button>
            )}
            {step < 5 ? (
              <Button onClick={next} disabled={!canNext}>
                Continuar <ArrowRight size={16} />
              </Button>
            ) : (
              <Button variant="rose" onClick={confirm} disabled={submitting}>
                {submitting ? 'Confirmando…' : 'Confirmar agendamento'}
              </Button>
            )}
          </div>
        </footer>
      </div>
    </Modal>
  )
}

function ProOption({ selected, onClick, title, subtitle, meta, avatar }: { selected: boolean; onClick: () => void; title: string; subtitle: string; meta?: string; avatar: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3.5 rounded-xl border p-3 text-left transition ${selected ? 'border-ink bg-cream ring-1 ring-ink' : 'border-linen bg-cream/70 hover:border-taupe'}`}
    >
      {avatar}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink">{title}</span>
        <span className="block text-[0.8rem] text-taupe">{subtitle}</span>
        {meta && <span className="mt-0.5 block text-[0.72rem] text-rose">{meta}</span>}
      </span>
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selected ? 'border-ink bg-ink text-ivory' : 'border-linen'}`}>{selected && <Check size={14} />}</span>
    </button>
  )
}

function Summary(p: { serviceName?: string; image?: string; duration?: number; price?: number; discount: number; total: number; pro?: string; date: ISODate | null; time: string | null }) {
  if (!p.serviceName)
    return (
      <div className="flex h-full flex-col items-center justify-center text-center text-sm text-taupe">
        <p className="font-display text-xl text-cocoa">Seu horário</p>
        <p className="mt-1">O resumo aparece aqui conforme você escolhe.</p>
      </div>
    )
  return (
    <div>
      <p className="eyebrow">Resumo</p>
      {p.image && <SmartImage src={p.image} alt="" className="mt-3 aspect-[4/3] rounded-xl" />}
      <p className="mt-4 font-display text-2xl leading-tight text-ink">{p.serviceName}</p>
      <dl className="mt-4 space-y-2.5 text-sm">
        <Row k="Profissional" v={p.pro ?? '—'} />
        <Row k="Data" v={p.date ? brDate(p.date) : '—'} />
        <Row k="Horário" v={p.time ?? '—'} />
        <Row k="Duração" v={p.duration ? formatDuration(p.duration) : '—'} />
      </dl>
      <div className="mt-5 space-y-1.5 border-t border-linen pt-4 text-sm">
        <Row k="Valor" v={formatPrice(p.price ?? 0)} />
        {p.discount > 0 && <Row k="Desconto" v={`− ${formatPrice(p.discount)}`} accent />}
        <div className="flex items-baseline justify-between pt-1">
          <span className="font-semibold text-ink">Total</span>
          <span className="font-display text-2xl text-ink">{formatPrice(p.total)}</span>
        </div>
      </div>
    </div>
  )
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-taupe">{k}</dt>
      <dd className={`text-right font-medium ${accent ? 'text-sage' : 'text-ink'}`}>{v}</dd>
    </div>
  )
}

function SuccessView({ appointment: a, clientName, onClose, onAccount }: { appointment: Appointment; clientName: string; onClose: () => void; onAccount?: () => void }) {
  const toast = useToast()
  const link = waLink(bookingMessage(a, clientName))
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(a.code)
      toast.success('Código copiado')
    } catch {
      toast.info('Código da reserva', a.code)
    }
  }
  return (
    <Modal open onClose={onClose} size="md" bare>
      <div className="overflow-y-auto">
        <div className="relative bg-blush px-6 pt-10 pb-8 text-center text-ink sm:px-10">
          <button type="button" onClick={onClose} aria-label="Fechar" className="absolute top-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-taupe hover:bg-cream hover:text-ink">
            <X size={20} />
          </button>
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose text-cream">
            <Check size={26} strokeWidth={1.6} />
          </span>
          <h2 className="mt-5 font-display text-4xl leading-tight">Horário reservado</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-taupe">Obrigada, {clientName.split(' ')[0]}. Guarde o código abaixo para consultar, remarcar ou cancelar.</p>
          <button type="button" onClick={copy} className="mt-5 inline-flex items-center gap-2 rounded-full border border-rose/30 bg-cream px-5 py-2 font-mono text-lg tracking-[0.2em] text-ink transition hover:border-rose">
            {a.code} <Copy size={14} />
          </button>
        </div>
        <div className="px-6 py-6 sm:px-10">
          <dl className="space-y-2.5 text-sm">
            <Row k="Serviço" v={a.serviceName} />
            <Row k="Profissional" v={a.professionalName} />
            <Row k="Data" v={`${brDate(a.date)} · ${longDate(a.date).split(',')[0]}`} />
            <Row k="Horário" v={`${a.start} (${formatDuration(a.duration)})`} />
            {a.discount > 0 && <Row k="Desconto" v={`− ${formatPrice(a.discount)} (${a.couponCode})`} accent />}
            <Row k="Total" v={formatPrice(a.price - a.discount)} />
            <Row k="Pagamento" v={a.payment.method === 'salao' ? 'No salão · pendente' : 'Online (demonstração) · pendente'} />
          </dl>
          <div className="mt-6 rounded-xl bg-sand/70 p-4 text-[0.78rem] leading-relaxed text-taupe">
            Reserva registrada apenas neste navegador (modo demonstração). Para confirmar com o salão, use o botão abaixo: ele abre o WhatsApp com a mensagem pronta, e o envio depende de você.
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {link ? (
              <ExternalButton href={link} variant="rose" icon={<WhatsAppIcon size={17} />} className="sm:col-span-2">
                Abrir mensagem no WhatsApp
              </ExternalButton>
            ) : null}
            {onAccount && (
              <Button variant="secondary" onClick={onAccount}>
                Ver minha área
              </Button>
            )}
            <Button variant="ghost" onClick={onClose} className={onAccount ? '' : 'sm:col-span-2'}>
              {onAccount ? 'Voltar ao site' : 'Fechar'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
