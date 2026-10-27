/**
 * Estado global da aplicação (site público, área do cliente e painel
 * compartilham o MESMO conjunto de dados). Toda alteração passa pelas
 * ações abaixo, que espelham os endpoints de um futuro backend.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createSeed } from '../data/seed'
import { checkSlot } from '../lib/availability'
import { validateCoupon } from '../lib/coupons'
import { addDays, brDate, todayISO } from '../lib/date'
import { onlyDigits } from '../lib/format'
import { bookingCode, couponCodeFrom, uid } from '../lib/id'
import { loyaltyFor, REWARDS } from '../lib/loyalty'
import type {
  AppData, Appointment, AppointmentStatus, Client, Coupon, HHmm, ISODate, PaymentMethod,
  PaymentStatus, Professional, Promotion, Service, Settings, TimeBlock,
} from '../types'
import { loadData, saveData, STORAGE_KEY } from './storage'

export type Result<T = undefined> = { ok: true; value: T } | { ok: false; error: string }
const ok = <T,>(value: T): Result<T> => ({ ok: true, value })
const fail = (error: string): Result<never> => ({ ok: false, error })

export interface BookingInput {
  serviceId: string
  professionalId: string | 'any'
  date: ISODate
  time: HHmm
  name: string
  phone: string
  email?: string
  notes?: string
  couponCode?: string
  paymentMethod: PaymentMethod
  source: 'site' | 'admin'
}

const stamp = (text: string) => ({ at: new Date().toISOString(), text })

function useStoreValue() {
  const [data, setData] = useState<AppData>(() => loadData().data)
  const ref = useRef(data)

  const commit = useCallback((next: AppData) => {
    ref.current = next
    setData(next)
    saveData(next)
  }, [])

  // Sincroniza abas abertas no mesmo navegador (ex.: site público + painel).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      const { data: fresh } = loadData()
      ref.current = fresh
      setData(fresh)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const update = useCallback((fn: (d: AppData) => AppData) => commit(fn(ref.current)), [commit])

  const patchAppointment = useCallback(
    (id: string, fn: (a: Appointment) => Appointment) =>
      update((d) => ({ ...d, appointments: d.appointments.map((a) => (a.id === id ? fn(a) : a)) })),
    [update],
  )

  // ---------------------------------------------------------------- agendamentos
  const createBooking = useCallback(
    (input: BookingInput): Result<Appointment> => {
      const d = ref.current
      const service = d.services.find((s) => s.id === input.serviceId && s.active)
      if (!service) return fail('Este serviço não está mais disponível.')
      const proId = checkSlot(d, input.serviceId, input.professionalId, input.date, input.time)
      if (!proId) return fail('Esse horário acabou de ficar indisponível. Escolha outro, por favor.')
      const pro = d.professionals.find((p) => p.id === proId)!

      const phone = onlyDigits(input.phone)
      let client = d.clients.find((c) => c.phone === phone)
      let clients = d.clients
      if (client) {
        client = { ...client, name: input.name.trim(), email: input.email?.trim() || client.email }
        clients = d.clients.map((c) => (c.id === client!.id ? client! : c))
      } else {
        client = { id: uid('cli'), name: input.name.trim(), phone, email: input.email?.trim() || undefined, createdAt: new Date().toISOString(), redeemedPoints: 0 }
        clients = [...d.clients, client]
      }

      let discount = 0
      let couponCode: string | undefined
      if (input.couponCode) {
        const r = validateCoupon(d, input.couponCode, service.id, input.date, client.id)
        if (!r.ok) return fail(r.error)
        discount = r.discount
        couponCode = r.code
      }

      const apt: Appointment = {
        id: uid('apt'),
        code: bookingCode(new Set(d.appointments.map((a) => a.code))),
        serviceId: service.id,
        serviceName: service.name,
        professionalId: pro.id,
        professionalName: pro.name,
        clientId: client.id,
        date: input.date,
        start: input.time,
        duration: service.duration,
        price: service.price,
        discount,
        couponCode,
        status: 'agendado',
        notes: input.notes?.trim() || undefined,
        payment: { method: input.paymentMethod, status: 'pendente' },
        reminder: 'pendente',
        source: input.source,
        createdAt: new Date().toISOString(),
        history: [stamp(input.source === 'site' ? 'Agendamento criado pelo site.' : 'Agendamento criado pelo painel.')],
      }
      commit({ ...d, clients, appointments: [...d.appointments, apt], currentClientId: input.source === 'site' ? client.id : d.currentClientId })
      return ok(apt)
    },
    [commit],
  )

  const cancelAppointment = useCallback(
    (id: string, by: 'cliente' | 'salão'): Result => {
      const a = ref.current.appointments.find((x) => x.id === id)
      if (!a) return fail('Agendamento não encontrado.')
      if (a.status === 'cancelado') return fail('Este agendamento já foi cancelado.')
      if (a.status === 'concluido') return fail('Atendimentos concluídos não podem ser cancelados.')
      patchAppointment(id, (x) => ({
        ...x,
        status: 'cancelado',
        reminder: 'nao_aplicavel',
        payment: { ...x.payment, status: x.payment.status === 'pago_simulado' ? 'reembolso_simulado' : x.payment.status },
        history: [...x.history, stamp(`Cancelado pelo ${by}. Horário liberado.`)],
      }))
      return ok(undefined)
    },
    [patchAppointment],
  )

  const rescheduleAppointment = useCallback(
    (id: string, date: ISODate, time: HHmm, professionalId?: string): Result => {
      const d = ref.current
      const a = d.appointments.find((x) => x.id === id)
      if (!a) return fail('Agendamento não encontrado.')
      if (a.status === 'cancelado' || a.status === 'concluido') return fail('Só é possível remarcar agendamentos ativos.')
      const proId = checkSlot(d, a.serviceId, professionalId ?? a.professionalId, date, time, a.id)
      if (!proId) return fail('Horário indisponível para remarcação.')
      const pro = d.professionals.find((p) => p.id === proId)!
      patchAppointment(id, (x) => ({
        ...x,
        date,
        start: time,
        professionalId: pro.id,
        professionalName: pro.name,
        status: 'agendado',
        reminder: 'pendente',
        history: [...x.history, stamp(`Remarcado de ${brDate(x.date)} ${x.start} para ${brDate(date)} ${time}.`)],
      }))
      return ok(undefined)
    },
    [patchAppointment],
  )

  const setAppointmentStatus = useCallback(
    (id: string, status: AppointmentStatus) =>
      patchAppointment(id, (x) => ({
        ...x,
        status,
        payment: status === 'concluido' ? { ...x.payment, status: 'pago_simulado' } : x.payment,
        history: [...x.history, stamp(`Status alterado para “${status}”.`)],
      })),
    [patchAppointment],
  )

  const markReminderSent = useCallback(
    (id: string) => patchAppointment(id, (x) => ({ ...x, reminder: 'enviado_manual', history: [...x.history, stamp('Lembrete marcado como enviado manualmente.')] })),
    [patchAppointment],
  )

  const setPaymentStatus = useCallback(
    (id: string, status: PaymentStatus) => patchAppointment(id, (x) => ({ ...x, payment: { ...x.payment, status } })),
    [patchAppointment],
  )

  const addReview = useCallback(
    (id: string, rating: number, comment: string): Result => {
      const a = ref.current.appointments.find((x) => x.id === id)
      if (!a || a.status !== 'concluido') return fail('Só é possível avaliar atendimentos concluídos.')
      if (a.review) return fail('Este atendimento já foi avaliado.')
      patchAppointment(id, (x) => ({ ...x, review: { rating, comment: comment.trim(), createdAt: new Date().toISOString(), fromDemoUser: true } }))
      return ok(undefined)
    },
    [patchAppointment],
  )

  // ---------------------------------------------------------------- catálogo
  const upsertService = useCallback(
    (s: Service) => update((d) => ({ ...d, services: d.services.some((x) => x.id === s.id) ? d.services.map((x) => (x.id === s.id ? s : x)) : [...d.services, s] })),
    [update],
  )

  const deleteService = useCallback(
    (id: string) =>
      update((d) => ({
        ...d,
        services: d.services.filter((s) => s.id !== id),
        professionals: d.professionals.map((p) => ({ ...p, serviceIds: p.serviceIds.filter((x) => x !== id) })),
        promotions: d.promotions.map((p) => ({ ...p, serviceIds: p.serviceIds.filter((x) => x !== id) })),
      })),
    [update],
  )

  const upsertProfessional = useCallback(
    (p: Professional) =>
      update((d) => ({
        ...d,
        professionals: d.professionals.some((x) => x.id === p.id) ? d.professionals.map((x) => (x.id === p.id ? p : x)) : [...d.professionals, p],
        appointments: d.appointments.map((a) => (a.professionalId === p.id ? { ...a, professionalName: p.name } : a)),
      })),
    [update],
  )

  const deleteProfessional = useCallback(
    (id: string): Result => {
      const d = ref.current
      const today = todayISO()
      const pending = d.appointments.filter((a) => a.professionalId === id && a.date >= today && (a.status === 'agendado' || a.status === 'confirmado'))
      if (pending.length) return fail(`Há ${pending.length} agendamento(s) futuro(s) com este profissional. Cancele ou remarque antes de excluir.`)
      commit({ ...d, professionals: d.professionals.filter((p) => p.id !== id), blocks: d.blocks.filter((b) => b.professionalId !== id) })
      return ok(undefined)
    },
    [commit],
  )

  // ---------------------------------------------------------------- clientes
  const upsertClient = useCallback(
    (c: Client): Result => {
      const d = ref.current
      if (d.clients.some((x) => x.id !== c.id && x.phone === c.phone)) return fail('Já existe um cliente com este telefone.')
      commit({ ...d, clients: d.clients.some((x) => x.id === c.id) ? d.clients.map((x) => (x.id === c.id ? c : x)) : [...d.clients, c] })
      return ok(undefined)
    },
    [commit],
  )

  const setCurrentClient = useCallback((id: string | null) => update((d) => ({ ...d, currentClientId: id })), [update])

  const redeemReward = useCallback(
    (clientId: string, rewardId: string): Result<Coupon> => {
      const d = ref.current
      const client = d.clients.find((c) => c.id === clientId)
      const reward = REWARDS.find((r) => r.id === rewardId)
      if (!client || !reward) return fail('Recompensa indisponível.')
      if (loyaltyFor(d, client).balance < reward.cost) return fail('Pontos insuficientes para esta recompensa.')
      const coupon: Coupon = {
        code: couponCodeFrom('FID'),
        description: reward.name,
        type: reward.type,
        value: reward.value,
        serviceIds: reward.serviceIds,
        validFrom: todayISO(),
        validUntil: addDays(todayISO(), 60),
        active: true,
        clientId,
      }
      commit({
        ...d,
        coupons: [...d.coupons, coupon],
        clients: d.clients.map((c) => (c.id === clientId ? { ...c, redeemedPoints: c.redeemedPoints + reward.cost } : c)),
      })
      return ok(coupon)
    },
    [commit],
  )

  // ---------------------------------------------------------------- promoções, cupons, bloqueios
  const upsertPromotion = useCallback(
    (p: Promotion) => update((d) => ({ ...d, promotions: d.promotions.some((x) => x.id === p.id) ? d.promotions.map((x) => (x.id === p.id ? p : x)) : [...d.promotions, p] })),
    [update],
  )
  const deletePromotion = useCallback((id: string) => update((d) => ({ ...d, promotions: d.promotions.filter((p) => p.id !== id) })), [update])

  const upsertCoupon = useCallback(
    (c: Coupon, originalCode?: string) =>
      update((d) => {
        const key = (originalCode ?? c.code).toUpperCase()
        const exists = d.coupons.some((x) => x.code.toUpperCase() === key)
        return { ...d, coupons: exists ? d.coupons.map((x) => (x.code.toUpperCase() === key ? c : x)) : [...d.coupons, c] }
      }),
    [update],
  )
  const deleteCoupon = useCallback((code: string) => update((d) => ({ ...d, coupons: d.coupons.filter((c) => c.code !== code) })), [update])

  const addBlock = useCallback(
    (b: Omit<TimeBlock, 'id'>): Result => {
      if (b.end <= b.start) return fail('O horário final precisa ser depois do inicial.')
      update((d) => ({ ...d, blocks: [...d.blocks, { ...b, id: uid('blk') }] }))
      return ok(undefined)
    },
    [update],
  )
  const removeBlock = useCallback((id: string) => update((d) => ({ ...d, blocks: d.blocks.filter((b) => b.id !== id) })), [update])

  // ---------------------------------------------------------------- configurações
  const updateSettings = useCallback((s: Settings) => update((d) => ({ ...d, settings: s })), [update])
  const markNotificationsSeen = useCallback(() => update((d) => ({ ...d, seenNotificationsAt: new Date().toISOString() })), [update])
  const resetDemo = useCallback(() => commit(createSeed()), [commit])

  return useMemo(
    () => ({
      data,
      createBooking, cancelAppointment, rescheduleAppointment, setAppointmentStatus, markReminderSent, setPaymentStatus, addReview,
      upsertService, deleteService, upsertProfessional, deleteProfessional,
      upsertClient, setCurrentClient, redeemReward,
      upsertPromotion, deletePromotion, upsertCoupon, deleteCoupon,
      addBlock, removeBlock, updateSettings, markNotificationsSeen, resetDemo,
    }),
    [data, createBooking, cancelAppointment, rescheduleAppointment, setAppointmentStatus, markReminderSent, setPaymentStatus, addReview,
      upsertService, deleteService, upsertProfessional, deleteProfessional, upsertClient, setCurrentClient, redeemReward,
      upsertPromotion, deletePromotion, upsertCoupon, deleteCoupon, addBlock, removeBlock, updateSettings, markNotificationsSeen, resetDemo],
  )
}

type Store = ReturnType<typeof useStoreValue>
const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue()
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore precisa estar dentro de <StoreProvider>')
  return ctx
}
