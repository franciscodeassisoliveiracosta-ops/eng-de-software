import type { AppData, Appointment, Client, ClientTag, ISODate } from '../types'
import { addDays, diffDays, todayISO } from './date'

export const finalPrice = (a: Appointment) => Math.max(0, a.price - a.discount)

export function inRange(a: Appointment, from: ISODate, to: ISODate) {
  return a.date >= from && a.date <= to
}

export interface PeriodStats {
  total: number
  concluded: number
  cancelled: number
  upcoming: number
  revenue: number
  ticket: number
  cancelRate: number
}

export function periodStats(apts: Appointment[], from: ISODate, to: ISODate): PeriodStats {
  const list = apts.filter((a) => inRange(a, from, to))
  const concluded = list.filter((a) => a.status === 'concluido')
  const cancelled = list.filter((a) => a.status === 'cancelado').length
  const revenue = concluded.reduce((s, a) => s + finalPrice(a), 0)
  return {
    total: list.length,
    concluded: concluded.length,
    cancelled,
    upcoming: list.filter((a) => a.status === 'agendado' || a.status === 'confirmado').length,
    revenue,
    ticket: concluded.length ? revenue / concluded.length : 0,
    cancelRate: list.length ? cancelled / list.length : 0,
  }
}

export function topServices(apts: Appointment[], limit = 5) {
  const map = new Map<string, { name: string; count: number; revenue: number }>()
  for (const a of apts) {
    if (a.status === 'cancelado') continue
    const cur = map.get(a.serviceId) ?? { name: a.serviceName, count: 0, revenue: 0 }
    cur.count++
    if (a.status === 'concluido') cur.revenue += finalPrice(a)
    map.set(a.serviceId, cur)
  }
  return [...map.values()].sort((x, y) => y.count - x.count).slice(0, limit)
}

export function dailySeries(apts: Appointment[], from: ISODate, to: ISODate) {
  const days = diffDays(to, from) + 1
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(from, i)
    const list = apts.filter((a) => a.date === date)
    return {
      date,
      count: list.filter((a) => a.status !== 'cancelado').length,
      revenue: list.filter((a) => a.status === 'concluido').reduce((s, a) => s + finalPrice(a), 0),
    }
  })
}

export function clientStats(data: AppData, client: Client) {
  const mine = data.appointments.filter((a) => a.clientId === client.id)
  const done = mine.filter((a) => a.status === 'concluido').sort((a, b) => (a.date < b.date ? 1 : -1))
  const last = done[0]?.date ?? null
  const spent = done.reduce((s, a) => s + finalPrice(a), 0)
  return { total: mine.length, done: done.length, last, spent, appointments: mine }
}

/** Situação calculada automaticamente a partir do histórico (regra demonstrativa). */
export function clientTag(data: AppData, client: Client): ClientTag {
  const { done, last } = clientStats(data, client)
  if (done >= 6) return 'vip'
  if (!last) return 'novo'
  return diffDays(todayISO(), last) <= 60 ? 'ativo' : 'inativo'
}

export const TAG_LABEL: Record<ClientTag, string> = { vip: 'VIP', ativo: 'Ativa', inativo: 'Inativa', novo: 'Nova' }
