import { useState } from 'react'
import { CalendarClock, CalendarX, Clock, MessageSquareText, Star, Wallet } from 'lucide-react'
import { brDate, isPast, longDate } from '../../lib/date'
import { formatDuration, formatPrice } from '../../lib/format'
import { bookingMessage, waLink } from '../../lib/whatsapp'
import { useStore } from '../../store/StoreContext'
import type { Appointment } from '../../types'
import { Button, ExternalButton } from '../ui/Button'
import { WhatsAppIcon } from '../ui/BrandIcons'
import { TextArea } from '../ui/Field'
import { ConfirmDialog, Modal } from '../ui/Modal'
import { PaymentBadge, StarInput, Stars, StatusBadge } from '../ui/Misc'
import { useToast } from '../ui/Toast'
import { RescheduleModal } from './RescheduleModal'

const PAY_LABEL = { salao: 'No salão', pix: 'Pix (demonstração)', cartao: 'Cartão online (demonstração)' }

/** Detalhes de uma reserva vistos pelo cliente, com cancelar, remarcar e avaliar. */
export function AppointmentDetails({ appointmentId, onClose }: { appointmentId: string | null; onClose: () => void }) {
  const { data, cancelAppointment } = useStore()
  const toast = useToast()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [reschedule, setReschedule] = useState(false)
  const [review, setReview] = useState(false)
  const a = data.appointments.find((x) => x.id === appointmentId) ?? null
  if (!a) return null
  const client = data.clients.find((c) => c.id === a.clientId)
  const active = a.status === 'agendado' || a.status === 'confirmado'
  const started = isPast(a.date, a.start)
  const wa = waLink(bookingMessage(a, client?.name ?? ''))

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={a.serviceName}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono tracking-wider">{a.code}</span> <StatusBadge status={a.status} />
          </span>
        }
        footer={
          active && !started ? (
            <>
              <Button variant="ghost" icon={<CalendarX size={16} />} onClick={() => setConfirmCancel(true)} className="text-danger hover:bg-danger-soft">
                Cancelar
              </Button>
              <Button variant="secondary" icon={<CalendarClock size={16} />} onClick={() => setReschedule(true)}>
                Remarcar
              </Button>
            </>
          ) : a.status === 'concluido' && !a.review ? (
            <Button icon={<Star size={16} />} onClick={() => setReview(true)}>
              Avaliar atendimento
            </Button>
          ) : undefined
        }
      >
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <Item k="Data">
            <span className="first-letter:uppercase">{longDate(a.date, true)}</span>
          </Item>
          <Item k="Horário">
            {a.start} <span className="text-taupe">· {formatDuration(a.duration)}</span>
          </Item>
          <Item k="Profissional">{a.professionalName}</Item>
          <Item k="Valor">
            {formatPrice(a.price - a.discount)}
            {a.discount > 0 && <span className="ml-1 text-[0.78rem] text-sage">({a.couponCode}: −{formatPrice(a.discount)})</span>}
          </Item>
          <Item k="Pagamento">
            <span className="flex flex-wrap items-center gap-2">
              <Wallet size={14} className="text-taupe" /> {PAY_LABEL[a.payment.method]} <PaymentBadge status={a.payment.status} />
            </span>
          </Item>
          {a.notes && <Item k="Observações">{a.notes}</Item>}
        </dl>

        {a.review && (
          <div className="mt-6 rounded-xl bg-sand/60 p-4">
            <p className="mb-1 text-[0.75rem] font-semibold text-stone">Sua avaliação</p>
            <Stars value={a.review.rating} />
            {a.review.comment && <p className="mt-2 text-sm text-cocoa">“{a.review.comment}”</p>}
          </div>
        )}

        {active && started && <p className="mt-6 rounded-xl bg-sand/60 p-4 text-sm text-taupe">O horário já começou ou passou. Para alterações, fale com o salão.</p>}

        {active && wa && (
          <ExternalButton href={wa} variant="secondary" size="sm" className="mt-6" icon={<WhatsAppIcon size={15} />}>
            Abrir confirmação no WhatsApp
          </ExternalButton>
        )}

        <div className="mt-6 border-t border-linen pt-4">
          <p className="mb-2 flex items-center gap-2 text-[0.75rem] font-semibold tracking-wide text-stone uppercase">
            <Clock size={13} /> Histórico
          </p>
          <ol className="space-y-1.5 text-[0.8rem] text-taupe">
            {[...a.history].reverse().map((h, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-20 shrink-0 tabular-nums">{brDate(h.at.slice(0, 10)).slice(0, 5)}</span>
                <span>{h.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Cancelar agendamento?"
        message={
          <>
            O horário de <strong>{brDate(a.date)} às {a.start}</strong> será liberado para outras pessoas. Esta ação não pode ser desfeita.
          </>
        }
        confirmLabel="Sim, cancelar"
        onConfirm={() => {
          const r = cancelAppointment(a.id, 'cliente')
          if (r.ok) toast.success('Agendamento cancelado', 'O horário foi liberado na agenda.')
          else toast.error(r.error)
        }}
      />
      {reschedule && <RescheduleModal appointment={a} onClose={() => setReschedule(false)} by="cliente" />}
      {review && <ReviewModal appointment={a} onClose={() => setReview(false)} />}
    </>
  )
}

function Item({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[0.72rem] font-semibold tracking-wide text-stone uppercase">{k}</dt>
      <dd className="mt-1 text-ink">{children}</dd>
    </div>
  )
}

export function ReviewModal({ appointment: a, onClose }: { appointment: Appointment; onClose: () => void }) {
  const { addReview } = useStore()
  const toast = useToast()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const submit = () => {
    if (!rating) {
      setError('Escolha de 1 a 5 estrelas.')
      return
    }
    const r = addReview(a.id, rating, comment)
    if (r.ok) {
      toast.success('Obrigada pela avaliação!', '+30 pontos de fidelidade (demonstração).')
      onClose()
    } else toast.error(r.error)
  }
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Avaliar atendimento"
      subtitle={`${a.serviceName} com ${a.professionalName} · ${brDate(a.date)}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Agora não
          </Button>
          <Button onClick={submit} icon={<MessageSquareText size={16} />}>
            Enviar avaliação
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center">
        <StarInput value={rating} onChange={(v) => { setRating(v); setError('') }} />
        {error && <p className="mt-2 text-[0.78rem] font-medium text-danger">{error}</p>}
      </div>
      <TextArea label="Comentário" optional rows={4} maxLength={280} value={comment} onChange={(e) => setComment(e.target.value)} wrapClass="mt-5" placeholder="Conte como foi sua experiência" hint="A avaliação fica salva somente neste navegador (demonstração)." />
    </Modal>
  )
}
