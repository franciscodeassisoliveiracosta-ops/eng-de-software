/**
 * Gera o conjunto de dados DEMONSTRATIVO.
 * As datas são calculadas a partir do dia atual para que a demonstração
 * sempre tenha histórico e agendamentos futuros. Todos os nomes,
 * telefones e e-mails são fictícios.
 */
import { SALON } from '../config/salon'
import { addDays, fromMinutes, nowMinutes, todayISO, toMinutes, weekday } from '../lib/date'
import type { AppData, Appointment, AppointmentStatus, Client, Coupon, PaymentMethod, Promotion, TimeBlock } from '../types'
import { SEED_PROFESSIONALS, SEED_SERVICES } from './catalog'
import { IMG } from './images'

export const DATA_VERSION = 4

/** Gerador pseudoaleatório determinístico (mulberry32) — a demonstração fica estável. */
function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CLIENT_NAMES = [
  'Juliana Ramos', 'Beatriz Almeida', 'Carolina Mendes', 'Larissa Fontes', 'Gabriela Torres',
  'Amanda Queiroz', 'Letícia Barros', 'Isabela Freitas', 'Vanessa Lima', 'Natália Coutinho',
  'Priscila Rocha', 'Tatiane Moraes', 'Renata Siqueira', 'Débora Campos', 'Luana Pires',
  'Sofia Cavalcanti', 'Helena Prado', 'Marcela Duarte', 'Paula Nogueira', 'Camila Vieira',
  'Bruna Carvalho', 'Aline Teixeira', 'Lucas Andrade', 'Thiago Ferraz',
]

const REVIEW_COMMENTS = [
  'Atendimento impecável, saí muito satisfeita.',
  'Pontualidade e cuidado em cada detalhe.',
  'Ambiente tranquilo e profissional atenciosa.',
  'Gostei muito do resultado, já agendei o retorno.',
  'Resultado bonito, só achei que demorou um pouco.',
  'Explicou tudo antes de começar, me senti segura.',
]

function slugEmail(name: string) {
  return (
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '.') + '@exemplo.com'
  )
}

export function createSeed(): AppData {
  const rand = rng(20261020)
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
  const today = todayISO()
  const nowIso = new Date().toISOString()

  const clients: Client[] = CLIENT_NAMES.map((name, i) => ({
    id: `cli-${i + 1}`,
    name,
    phone: `819${String(90000000 + i * 137911).slice(0, 8)}`,
    email: i % 5 === 3 ? undefined : slugEmail(name),
    createdAt: addDays(today, -200 + i * 6) + 'T10:00:00.000Z',
    redeemedPoints: 0,
    notes: i === 0 ? 'Prefere horários pela manhã. Alergia a produtos com amônia.' : undefined,
  }))

  const settings = { slotStep: 30, bufferMinutes: 10, bookingWindowDays: 60, minNoticeMinutes: 60 }
  const appointments: Appointment[] = []
  const codes = new Set<string>()
  let seq = 0
  const code = () => {
    let c = ''
    do c = 'MB-' + Math.floor(rand() * 36 ** 6).toString(36).toUpperCase().padStart(6, '7')
    while (codes.has(c))
    codes.add(c)
    return c
  }
  const nowMin = nowMinutes()

  for (let offset = -75; offset <= 14; offset++) {
    const date = addDays(today, offset)
    const hours = SALON.hours[weekday(date)]
    if (!hours) continue
    for (const pro of SEED_PROFESSIONALS) {
      if (!pro.workDays.includes(weekday(date))) continue
      const winStart = Math.max(toMinutes(hours.open), toMinutes(pro.start))
      const winEnd = Math.min(toMinutes(hours.close), toMinutes(pro.end))
      // agenda mais cheia no passado recente e mais vazia no futuro distante
      const density = offset < 0 ? 0.7 : offset <= 3 ? 0.55 : 0.32
      let t = winStart + (rand() < 0.5 ? 0 : 30)
      while (t < winEnd) {
        const chosenId = pick(pro.serviceIds)
        const service = SEED_SERVICES.find((s) => s.id === chosenId)!
        if (t + service.duration > winEnd) break
        if (rand() < density) {
          const isPastSlot = offset < 0 || (offset === 0 && t + service.duration <= nowMin)
          let status: AppointmentStatus
          if (isPastSlot) status = rand() < 0.1 ? 'cancelado' : 'concluido'
          else status = rand() < 0.07 ? 'cancelado' : rand() < 0.55 ? 'confirmado' : 'agendado'
          const client = clients[Math.floor(rand() * clients.length)]
          const method: PaymentMethod = pick(['salao', 'salao', 'pix', 'cartao'])
          const reviewed = status === 'concluido' && rand() < 0.3
          const created = addDays(date, -Math.ceil(rand() * 12)) + 'T12:00:00.000Z'
          appointments.push({
            id: `apt-${++seq}`,
            code: code(),
            serviceId: service.id,
            serviceName: service.name,
            professionalId: pro.id,
            professionalName: pro.name,
            clientId: client.id,
            date,
            start: fromMinutes(t),
            duration: service.duration,
            price: service.price,
            discount: 0,
            status,
            payment: { method, status: status === 'concluido' ? 'pago_simulado' : 'pendente' },
            reminder: status === 'cancelado' ? 'nao_aplicavel' : isPastSlot ? 'enviado_manual' : offset <= 1 && rand() < 0.4 ? 'enviado_manual' : 'pendente',
            review: reviewed
              ? { rating: rand() < 0.75 ? 5 : 4, comment: pick(REVIEW_COMMENTS), createdAt: date + 'T20:00:00.000Z' }
              : undefined,
            source: 'seed',
            createdAt: created,
            history: [{ at: created, text: 'Agendamento criado (dados de demonstração).' }],
          })
          t += service.duration + settings.bufferMinutes
          t = Math.ceil(t / 30) * 30
        } else {
          t += 30
        }
      }
    }
  }

  // Garante uma cliente de demonstração com histórico rico (Juliana Ramos)
  const demo = clients[0]
  const pastDone = appointments.filter((a) => a.status === 'concluido' && a.date < today)
  for (let i = 0; i < 7 && i < pastDone.length; i++) {
    const a = pastDone[Math.floor((pastDone.length / 7) * i)]
    a.clientId = demo.id
    if (i === 6) a.review = undefined // um atendimento ainda aguardando avaliação
  }
  const future = appointments.filter((a) => a.date > today && a.status !== 'cancelado')
  if (future.length) {
    future[Math.min(3, future.length - 1)].clientId = demo.id
    future[Math.min(18, future.length - 1)].clientId = demo.id
  }

  const promotions: Promotion[] = [
    {
      id: 'promo-spa', name: 'Dia de Spa', description: 'Manicure, pedicure e spa dos pés em uma única visita.',
      serviceIds: ['srv-manicure', 'srv-pedicure', 'srv-spa-pes'], promoPrice: 159,
      validFrom: addDays(today, -10), validUntil: addDays(today, 40), couponCode: 'DIADESPA', active: true, image: IMG.pedicure,
    },
    {
      id: 'promo-cor', name: 'Cor & Brilho', description: 'Coloração de raiz com hidratação profunda para fechar a cutícula.',
      serviceIds: ['srv-raiz', 'srv-hidratacao'], promoPrice: 279,
      validFrom: addDays(today, -5), validUntil: addDays(today, 30), couponCode: 'CORBRILHO', active: true, image: IMG.color,
    },
    {
      id: 'promo-noiva', name: 'Ritual da Noiva', description: 'Maquiagem para noivas e penteado com prova prévia de ambos.',
      serviceIds: ['srv-noiva', 'srv-penteado'], promoPrice: 790,
      validFrom: addDays(today, -30), validUntil: addDays(today, 90), couponCode: 'NOIVAMAISON', active: true, image: IMG.bridal,
    },
    {
      id: 'promo-verao', name: 'Pré-verão', description: 'Limpeza de pele com massagem relaxante.',
      serviceIds: ['srv-limpeza', 'srv-massagem'], promoPrice: 270,
      validFrom: addDays(today, 15), validUntil: addDays(today, 60), couponCode: 'PREVERAO', active: false, image: IMG.skincare,
    },
  ]

  const coupons: Coupon[] = [
    { code: 'BEMVINDA10', description: '10% de desconto em qualquer serviço', type: 'percent', value: 10, validFrom: addDays(today, -60), validUntil: addDays(today, 60), active: true },
    { code: 'MAISON20', description: 'R$ 20 de desconto em serviços a partir de R$ 150', type: 'fixed', value: 20, minValue: 150, validFrom: addDays(today, -30), validUntil: addDays(today, 45), active: true },
    { code: 'UNHAS15', description: '15% em serviços de manicure e pedicure', type: 'percent', value: 15, serviceIds: ['srv-manicure', 'srv-pedicure', 'srv-gel', 'srv-spa-pes'], validFrom: addDays(today, -15), validUntil: addDays(today, 20), active: true },
    { code: 'INVERNO25', description: '25% de desconto (campanha encerrada)', type: 'percent', value: 25, validFrom: addDays(today, -120), validUntil: addDays(today, -30), active: true },
  ]

  const blocks: TimeBlock[] = []
  const nextTue = (() => {
    for (let i = 1; i < 8; i++) if (weekday(addDays(today, i)) === 3) return addDays(today, i)
    return addDays(today, 2)
  })()
  blocks.push({ id: 'blk-1', professionalId: 'pro-helena', date: nextTue, start: '12:00', end: '14:00', reason: 'Curso de atualização' })

  return {
    version: DATA_VERSION,
    services: SEED_SERVICES.map((s) => ({ ...s })),
    professionals: SEED_PROFESSIONALS.map((p) => ({ ...p, serviceIds: [...p.serviceIds], workDays: [...p.workDays] })),
    clients,
    appointments,
    blocks,
    promotions,
    coupons,
    settings,
    currentClientId: demo.id,
    seenNotificationsAt: nowIso,
  }
}
