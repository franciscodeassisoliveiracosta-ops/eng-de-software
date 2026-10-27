import { useState, type ReactNode } from 'react'
import { BellRing, CalendarClock, CalendarX, Check, CheckCheck, Clock, Wallet } from 'lucide-react'
import { brDate, isPast, longDate } from '../../lib/date'
import { formatDuration, formatPhone, formatPrice } from '../../lib/format'
import { reminderMessage, waClientLink } from '../../lib/whatsapp'
import { useStore } from '../../store/StoreContext'
import { RescheduleModal } from '../booking/RescheduleModal'
import { Button, ExternalButton } from '../ui/Button'
import { WhatsAppIcon } from '../ui/BrandIcons'
import { ConfirmDialog, Modal } from '../ui/Modal'
import { PaymentBadge, ReminderBadge, Stars, StatusBadge } from '../ui/Misc'
import { useToast } from '../ui/Toast'

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-[2.1rem] leading-tight text-ink sm:text-4xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-taupe">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ title, action, children, className = '', pad = true }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`min-w-0 rounded-xl border border-linen bg-cream ${className}`}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-linen px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {action}
        </header>
      )}
      <div className={pad ? 'p-5' : ''}>{children}</div>
    </section>
  )
}

export function StatCard({ label, value, hint, icon, trend }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; trend?: number | null }) {
  return (
    <div className="min-w-0 rounded-xl border border-linen bg-cream p-4 sm:p-5 [.gap-px>&]:rounded-none [.gap-px>&]:border-0">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.75rem] font-semibold text-taupe">{label}</p>
        {icon && <span className="text-stone">{icon}</span>}
      </div>
      <p className="mt-2 font-display text-[1.8rem] leading-none whitespace-nowrap text-ink tabular-nums sm:text-[2.1rem]">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-[0.72rem] text-stone">
        {trend !== undefined && trend !== null && Number.isFinite(trend) && (
          <span className={`font-semibold ${trend >= 0 ? 'text-sage' : 'text-danger'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(Math.round(trend * 100))}%
          </span>
        )}
        {hint}
      </div>
    </div>
  )
}

const PAY_LABEL = { salao: 'No salão', pix: 'Pix (demo)', cartao: 'Cartão (demo)' }

/** Painel lateral com detalhes e ações do agendamento (visão do salão). */
export function AppointmentDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data, cancelAppointment, setAppointmentStatus, markReminderSent, setPaymentStatus } = useStore()
  const toast = useToast()
  const [cancel, setCancel] = useState(false)
  const [resched, setResched] = useState(false)
  const a = data.appointments.find((x) => x.id === id)
  if (!a) return null
  const client = data.clients.find((c) => c.id === a.clientId)
  const active = a.status === 'agendado' || a.status === 'confirmado'
  const remind = client ? waClientLink(client.phone, reminderMessage(a, client.name)) : null

  return (
    <>
      <Modal open onClose={onClose} variant="drawer" title={a.serviceName} subtitle={<span className="font-mono tracking-wider">{a.code}</span>}>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={a.status} />
          <PaymentBadge status={a.payment.status} />
          <ReminderBadge status={a.reminder} />
        </div>
        <dl className="mt-6 space-y-3 text-sm">
          {[
            ['Data', <span className="first-letter:uppercase">{longDate(a.date, true)}</span>],
            ['Horário', `${a.start} · ${formatDuration(a.duration)}`],
            ['Profissional', a.professionalName],
            ['Cliente', client ? `${client.name} · ${formatPhone(client.phone)}` : 'Cliente removido'],
            ['Valor', `${formatPrice(a.price - a.discount)}${a.discount ? ` (desconto ${formatPrice(a.discount)} · ${a.couponCode})` : ''}`],
            ['Pagamento', PAY_LABEL[a.payment.method]],
            ['Origem', a.source === 'site' ? 'Site' : a.source === 'admin' ? 'Painel' : 'Dados de demonstração'],
            ...(a.notes ? [['Observações', a.notes]] : []),
          ].map(([k, v], i) => (
            <div key={i} className="flex gap-4">
              <dt className="w-28 shrink-0 text-taupe">{k}</dt>
              <dd className="min-w-0 flex-1 text-ink">{v}</dd>
            </div>
          ))}
        </dl>

        {a.review && (
          <div className="mt-5 rounded-xl bg-sand/60 p-4">
            <Stars value={a.review.rating} />
            {a.review.comment && <p className="mt-1.5 text-sm text-cocoa">“{a.review.comment}”</p>}
          </div>
        )}

        {active && (
          <div className="mt-7 grid grid-cols-2 gap-2">
            {a.status === 'agendado' && (
              <Button size="sm" variant="secondary" icon={<Check size={15} />} onClick={() => { setAppointmentStatus(a.id, 'confirmado'); toast.success('Presença confirmada') }}>
                Confirmar
              </Button>
            )}
            {isPast(a.date, a.start) && (
              <Button size="sm" variant="secondary" icon={<CheckCheck size={15} />} onClick={() => { setAppointmentStatus(a.id, 'concluido'); toast.success('Atendimento concluído') }}>
                Concluir
              </Button>
            )}
            <Button size="sm" variant="secondary" icon={<CalendarClock size={15} />} onClick={() => setResched(true)}>
              Remarcar
            </Button>
            <Button size="sm" variant="ghost" className="text-danger hover:bg-danger-soft" icon={<CalendarX size={15} />} onClick={() => setCancel(true)}>
              Cancelar
            </Button>
          </div>
        )}

        {active && (
          <div className="mt-6 rounded-xl border border-linen p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <BellRing size={15} /> Lembrete manual
            </p>
            <p className="mt-1 text-[0.78rem] text-taupe">Abre o WhatsApp do cliente com a mensagem pronta. Nenhum envio automático.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {remind && (
                <ExternalButton href={remind} size="sm" variant="secondary" icon={<WhatsAppIcon size={15} />} onClick={() => markReminderSent(a.id)}>
                  Abrir lembrete
                </ExternalButton>
              )}
              {a.reminder === 'pendente' && (
                <Button size="sm" variant="ghost" onClick={() => { markReminderSent(a.id); toast.success('Lembrete marcado como enviado') }}>
                  Marcar como enviado
                </Button>
              )}
            </div>
          </div>
        )}

        {a.status !== 'cancelado' && a.payment.status === 'pendente' && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-linen p-4">
            <p className="flex items-center gap-2 text-sm text-ink">
              <Wallet size={15} /> Pagamento (simulação)
            </p>
            <Button size="sm" variant="ghost" onClick={() => { setPaymentStatus(a.id, 'pago_simulado'); toast.success('Pagamento registrado (simulação)') }}>
              Registrar pago
            </Button>
          </div>
        )}

        <div className="mt-7">
          <p className="mb-2 flex items-center gap-2 text-[0.72rem] font-semibold tracking-wide text-stone uppercase">
            <Clock size={13} /> Histórico
          </p>
          <ol className="space-y-1.5 text-[0.8rem] text-taupe">
            {[...a.history].reverse().map((h, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-12 shrink-0 tabular-nums">{brDate(h.at.slice(0, 10)).slice(0, 5)}</span>
                <span>{h.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </Modal>
      <ConfirmDialog
        open={cancel}
        onClose={() => setCancel(false)}
        title="Cancelar este agendamento?"
        message={`${a.serviceName} de ${client?.name ?? 'cliente'} em ${brDate(a.date)} às ${a.start}. O horário será liberado.`}
        confirmLabel="Cancelar agendamento"
        onConfirm={() => {
          const r = cancelAppointment(a.id, 'salão')
          if (r.ok) toast.success('Agendamento cancelado', 'Horário liberado na agenda.')
          else toast.error(r.error)
        }}
      />
      {resched && <RescheduleModal appointment={a} onClose={() => setResched(false)} by="salão" />}
    </>
  )
}
