import { useCallback, useMemo, useState } from 'react'
import { dayStatus, getSlots, qualifiedProfessionals } from '../../lib/availability'
import { brDate, longDate } from '../../lib/date'
import { useStore } from '../../store/StoreContext'
import type { Appointment, ISODate } from '../../types'
import { Button } from '../ui/Button'
import { SelectField } from '../ui/Field'
import { Modal } from '../ui/Modal'
import { useToast } from '../ui/Toast'
import { Calendar, SlotGrid } from './Calendar'

/** Remarcação: escolhe nova data/horário livres para o mesmo serviço (opcionalmente outro profissional). */
export function RescheduleModal({ appointment, onClose, by }: { appointment: Appointment | null; onClose: () => void; by: 'cliente' | 'salão' }) {
  if (!appointment) return null
  return <Inner a={appointment} onClose={onClose} by={by} />
}

function Inner({ a, onClose, by }: { a: Appointment; onClose: () => void; by: 'cliente' | 'salão' }) {
  const { data, rescheduleAppointment } = useStore()
  const toast = useToast()
  const [proId, setProId] = useState<string>(a.professionalId)
  const [date, setDate] = useState<ISODate | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const pros = qualifiedProfessionals(data, a.serviceId)
  const serviceExists = data.services.some((s) => s.id === a.serviceId)

  const getStatus = useCallback(
    (d: ISODate) => dayStatus({ data, serviceId: a.serviceId, professionalId: proId, date: d, excludeAppointmentId: a.id }),
    [data, a, proId],
  )
  const slots = useMemo(
    () => (date ? getSlots({ data, serviceId: a.serviceId, professionalId: proId, date, excludeAppointmentId: a.id }) : []),
    [data, a, proId, date],
  )

  const submit = () => {
    if (!date || !time) return
    const r = rescheduleAppointment(a.id, date, time, proId)
    if (r.ok) {
      toast.success('Agendamento remarcado', `${brDate(date)} às ${time}. O horário anterior foi liberado.`)
      onClose()
    } else toast.error('Não foi possível remarcar', r.error)
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Remarcar horário"
      subtitle={`${a.serviceName} · atual: ${brDate(a.date)} às ${a.start} com ${a.professionalName}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!date || !time}>
            Confirmar remarcação
          </Button>
        </>
      }
    >
      {!serviceExists ? (
        <p className="text-sm text-taupe">Este serviço foi removido do catálogo e não pode ser remarcado online. Entre em contato com o salão.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            {pros.length > 1 && by === 'salão' && (
              <SelectField label="Profissional" value={proId} onChange={(e) => { setProId(e.target.value); setDate(null); setTime(null) }} wrapClass="mb-5">
                {pros.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </SelectField>
            )}
            <Calendar value={date} onChange={(d) => { setDate(d); setTime(null) }} getStatus={getStatus} />
          </div>
          <div>
            {date ? (
              <>
                <p className="mb-4 text-sm font-semibold text-ink first-letter:uppercase">{longDate(date)}</p>
                {slots.some((s) => s.available) ? <SlotGrid slots={slots} value={time} onChange={setTime} showUnavailable={false} /> : <p className="text-sm text-taupe">Sem horários livres neste dia.</p>}
              </>
            ) : (
              <div className="flex h-full min-h-40 items-center justify-center rounded-xl border border-dashed border-linen p-6 text-center text-sm text-taupe">Escolha uma nova data no calendário.</div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
