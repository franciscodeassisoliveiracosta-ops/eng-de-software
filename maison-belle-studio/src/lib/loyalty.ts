/**
 * PROGRAMA DE FIDELIDADE — REGRAS FICTÍCIAS (demonstração)
 * ------------------------------------------------------------------
 *  - 1 ponto para cada R$ 1,00 pago em atendimentos CONCLUÍDOS
 *    (valor final, já com descontos; centavos são descartados).
 *  - +30 pontos por avaliação registrada.
 *  - Agendamentos cancelados ou futuros não geram pontos.
 *  - Saldo = pontos ganhos − pontos já resgatados.
 *  - Níveis por pontos acumulados no total (não pelo saldo):
 *      Essência 0+ · Rosé 600+ · Ouro 1.500+
 *  - Recompensas geram um cupom pessoal válido por 60 dias.
 */
import type { AppData, Client, CouponType } from '../types'

export const POINTS_PER_REAL = 1
export const POINTS_PER_REVIEW = 30

export interface Tier {
  id: string
  name: string
  min: number
  perk: string
}

export const TIERS: Tier[] = [
  { id: 'essencia', name: 'Essência', min: 0, perk: 'Acúmulo de pontos em todos os serviços' },
  { id: 'rose', name: 'Rosé', min: 600, perk: 'Prioridade na lista de espera' },
  { id: 'ouro', name: 'Ouro', min: 1500, perk: 'Ritual de aniversário cortesia' },
]

export interface Reward {
  id: string
  name: string
  cost: number
  type: CouponType
  value: number
  serviceIds?: string[]
}

export const REWARDS: Reward[] = [
  { id: 'rw-30', name: 'R$ 30 em qualquer serviço', cost: 300, type: 'fixed', value: 30 },
  { id: 'rw-gel', name: 'Esmaltação em gel cortesia', cost: 600, type: 'percent', value: 100, serviceIds: ['srv-gel'] },
  { id: 'rw-hidra', name: 'Hidratação profunda cortesia', cost: 800, type: 'percent', value: 100, serviceIds: ['srv-hidratacao'] },
]

export function loyaltyFor(data: AppData, client: Client) {
  const mine = data.appointments.filter((a) => a.clientId === client.id && a.status === 'concluido')
  const fromServices = mine.reduce((s, a) => s + Math.floor((a.price - a.discount) * POINTS_PER_REAL), 0)
  const fromReviews = mine.filter((a) => a.review).length * POINTS_PER_REVIEW
  const earned = fromServices + fromReviews
  const balance = Math.max(0, earned - client.redeemedPoints)
  const tier = [...TIERS].reverse().find((t) => earned >= t.min) ?? TIERS[0]
  const next = TIERS.find((t) => t.min > earned) ?? null
  return { earned, balance, tier, next, visits: mine.length, fromServices, fromReviews }
}
