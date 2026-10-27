/**
 * REGRAS DE DISPONIBILIDADE — SIMULAÇÃO LOCAL
 * ------------------------------------------------------------------
 * Os horários ocupados vêm dos agendamentos e bloqueios salvos no
 * localStorage DESTE navegador. Não existe verificação em servidor,
 * portanto a disponibilidade exibida NÃO representa a agenda real
 * do salão e não impede reservas simultâneas em outros dispositivos.
 *
 * Regras aplicadas:
 *  1. O dia precisa estar aberto no horário de funcionamento (config/salon.ts).
 *  2. O profissional precisa estar ativo, atender naquele dia da semana
 *     e realizar o serviço escolhido.
 *  3. Janela útil = interseção entre horário do salão e do profissional.
 *  4. O atendimento inteiro (início + duração) precisa caber na janela,
 *     ou seja, nunca termina depois do fechamento.
 *  5. Não pode sobrepor outro atendimento ativo do mesmo profissional,
 *     respeitando o intervalo de preparação (settings.bufferMinutes).
 *  6. Não pode sobrepor bloqueios de agenda (do profissional ou do salão).
 *  7. Para hoje, só horários a partir de agora + antecedência mínima.
 *  8. Só é possível agendar até settings.bookingWindowDays dias à frente.
 */
import { SALON } from '../config/salon'
import type { AppData, HHmm, ISODate, Professional } from '../types'
import { addDays, fromMinutes, nowMinutes, todayISO, toMinutes, weekday } from './date'

export interface Slot {
  time: HHmm
  available: boolean
  professionalIds: string[] // profissionais livres nesse horário
}

export type DayStatus = 'past' | 'closed' | 'out_of_range' | 'full' | 'available'

export function qualifiedProfessionals(data: AppData, serviceId: string): Professional[] {
  return data.professionals.filter((p) => p.active && p.serviceIds.includes(serviceId))
}

export function salonHours(date: ISODate) {
  return SALON.hours[weekday(date)] ?? null
}

export function dayWindow(date: ISODate, pro: Professional): { start: number; end: number } | null {
  const salon = salonHours(date)
  if (!salon || !pro.active || !pro.workDays.includes(weekday(date))) return null
  const start = Math.max(toMinutes(salon.open), toMinutes(pro.start))
  const end = Math.min(toMinutes(salon.close), toMinutes(pro.end))
  return end > start ? { start, end } : null
}

interface FreeCheck {
  data: AppData
  pro: Professional
  date: ISODate
  start: number
  duration: number
  excludeAppointmentId?: string
  ignoreNotice?: boolean
}

export function isProfessionalFree({ data, pro, date, start, duration, excludeAppointmentId, ignoreNotice }: FreeCheck): boolean {
  const win = dayWindow(date, pro)
  if (!win) return false
  const end = start + duration
  if (start < win.start || end > win.end) return false

  if (!ignoreNotice && date === todayISO() && start < nowMinutes() + data.settings.minNoticeMinutes) return false

  const buffer = data.settings.bufferMinutes
  for (const a of data.appointments) {
    if (a.professionalId !== pro.id || a.date !== date || a.status === 'cancelado') continue
    if (a.id === excludeAppointmentId) continue
    const aStart = toMinutes(a.start)
    const aEnd = aStart + a.duration
    if (start < aEnd + buffer && aStart < end + buffer) return false
  }
  for (const b of data.blocks) {
    if (b.date !== date || (b.professionalId !== 'all' && b.professionalId !== pro.id)) continue
    if (start < toMinutes(b.end) && toMinutes(b.start) < end) return false
  }
  return true
}

interface SlotQuery {
  data: AppData
  serviceId: string
  professionalId: string | 'any'
  date: ISODate
  excludeAppointmentId?: string
  durationOverride?: number
}

export function getSlots({ data, serviceId, professionalId, date, excludeAppointmentId, durationOverride }: SlotQuery): Slot[] {
  const service = data.services.find((s) => s.id === serviceId)
  const salon = salonHours(date)
  if (!service || !salon) return []
  const duration = durationOverride ?? service.duration
  const pros =
    professionalId === 'any'
      ? qualifiedProfessionals(data, serviceId)
      : data.professionals.filter((p) => p.id === professionalId && p.active)
  if (!pros.length) return []

  const windows = pros.map((p) => dayWindow(date, p)).filter(Boolean) as { start: number; end: number }[]
  if (!windows.length) return []
  const first = Math.min(...windows.map((w) => w.start))
  const last = Math.max(...windows.map((w) => w.end))
  const step = data.settings.slotStep
  // alinha o primeiro horário à grade a partir da abertura do salão
  const open = toMinutes(salon.open)
  const aligned = open + Math.ceil((first - open) / step) * step

  const slots: Slot[] = []
  for (let t = aligned; t + duration <= last; t += step) {
    const free = pros.filter((pro) => isProfessionalFree({ data, pro, date, start: t, duration, excludeAppointmentId }))
    slots.push({ time: fromMinutes(t), available: free.length > 0, professionalIds: free.map((p) => p.id) })
  }
  return slots
}

export function dayStatus(query: Omit<SlotQuery, 'date'> & { date: ISODate }): DayStatus {
  const today = todayISO()
  if (query.date < today) return 'past'
  if (query.date > addDays(today, query.data.settings.bookingWindowDays)) return 'out_of_range'
  if (!salonHours(query.date)) return 'closed'
  const slots = getSlots(query)
  if (!slots.length) return 'closed'
  return slots.some((s) => s.available) ? 'available' : 'full'
}

/** Verificação final usada no momento da confirmação. */
export function checkSlot(
  data: AppData,
  serviceId: string,
  professionalId: string | 'any',
  date: ISODate,
  time: HHmm,
  excludeAppointmentId?: string,
): string | null {
  const slots = getSlots({ data, serviceId, professionalId, date, excludeAppointmentId })
  const slot = slots.find((s) => s.time === time)
  if (!slot?.available) return null
  return slot.professionalIds[0] ?? null
}

/** Ocupação de um profissional em um dia (para a agenda do painel). */
export function occupancy(data: AppData, pro: Professional, date: ISODate): number {
  const win = dayWindow(date, pro)
  if (!win) return 0
  const total = win.end - win.start
  const busy = data.appointments
    .filter((a) => a.professionalId === pro.id && a.date === date && a.status !== 'cancelado')
    .reduce((s, a) => s + a.duration, 0)
  return Math.min(1, busy / total)
}
