import type { HHmm, ISODate } from '../types'

/** Datas sempre manipuladas no fuso local do navegador, no formato YYYY-MM-DD. */

const pad = (n: number) => String(n).padStart(2, '0')

export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseISODate(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function todayISO(): ISODate {
  return toISODate(new Date())
}

export function addDays(s: ISODate, days: number): ISODate {
  const d = parseISODate(s)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export function diffDays(a: ISODate, b: ISODate): number {
  const ms = parseISODate(a).getTime() - parseISODate(b).getTime()
  return Math.round(ms / 86_400_000)
}

export function weekday(s: ISODate): number {
  return parseISODate(s).getDay()
}

export function startOfWeek(s: ISODate): ISODate {
  // semana começando na segunda-feira
  const wd = weekday(s)
  const delta = wd === 0 ? -6 : 1 - wd
  return addDays(s, delta)
}

export function startOfMonth(s: ISODate): ISODate {
  return s.slice(0, 8) + '01'
}

export function addMonths(s: ISODate, months: number): ISODate {
  const d = parseISODate(startOfMonth(s))
  d.setMonth(d.getMonth() + months)
  return toISODate(d)
}

export function daysInMonth(s: ISODate): number {
  const d = parseISODate(s)
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

/** Matriz de 6 semanas para um calendário mensal (segunda a domingo). */
export function monthGrid(monthISO: ISODate): ISODate[] {
  const first = startOfMonth(monthISO)
  const gridStart = startOfWeek(first)
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
}

export function toMinutes(t: HHmm): number {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export function fromMinutes(min: number): HHmm {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
}

export function addMinutes(t: HHmm, min: number): HHmm {
  return fromMinutes(toMinutes(t) + min)
}

export function nowMinutes(): number {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']

export function monthLabel(s: ISODate): string {
  const d = parseISODate(s)
  return `${MONTHS[d.getMonth()]} de ${d.getFullYear()}`
}

/** "terça-feira, 20 de outubro" */
export function longDate(s: ISODate, withYear = false): string {
  const d = parseISODate(s)
  const base = `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`
  return withYear ? `${base} de ${d.getFullYear()}` : base
}

/** "20 out" */
export function shortDate(s: ISODate): string {
  const d = parseISODate(s)
  return `${pad(d.getDate())} ${MONTHS_SHORT[d.getMonth()]}`
}

/** "20/10/2026" */
export function brDate(s: ISODate): string {
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

export function relativeDayLabel(s: ISODate): string {
  const diff = diffDays(s, todayISO())
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Amanhã'
  if (diff === -1) return 'Ontem'
  return shortDate(s)
}

export function isPast(date: ISODate, time?: HHmm): boolean {
  const today = todayISO()
  if (date < today) return true
  if (date > today) return false
  if (!time) return false
  return toMinutes(time) <= nowMinutes()
}

export function dateRange(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d)
  return out
}
