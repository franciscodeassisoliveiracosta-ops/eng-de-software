/**
 * Validação de cupons DEMONSTRATIVOS.
 *
 * Regras:
 *  - O código não diferencia maiúsculas/minúsculas.
 *  - O cupom precisa estar ativo.
 *  - A data do atendimento precisa estar dentro da validade (validFrom..validUntil).
 *    Sem data escolhida, usa-se a data de hoje.
 *  - Se o cupom tiver serviceIds, só vale para esses serviços.
 *  - Se tiver minValue, o preço do serviço precisa ser igual ou maior.
 *  - Cupons pessoais (clientId) só valem para o cliente dono — conferido pelo telefone na confirmação.
 *  - Cupons de promoções ativas aplicam a mesma proporção de desconto
 *    do pacote ao serviço escolhido, se ele fizer parte da promoção.
 *  - O desconto nunca deixa o preço negativo.
 */
import type { AppData, ISODate, Promotion } from '../types'
import { brDate, todayISO } from './date'
import { formatPrice } from './format'

export type CouponResult =
  | { ok: true; code: string; discount: number; label: string }
  | { ok: false; error: string }

export function promotionOriginalPrice(data: AppData, promo: Promotion): number {
  return promo.serviceIds.reduce((s, id) => s + (data.services.find((x) => x.id === id)?.price ?? 0), 0)
}

export function isPromotionLive(promo: Promotion, date: ISODate = todayISO()): boolean {
  return promo.active && date >= promo.validFrom && date <= promo.validUntil
}

export function validateCoupon(
  data: AppData,
  rawCode: string,
  serviceId: string,
  date: ISODate | null,
  clientId?: string | null,
): CouponResult {
  const code = rawCode.trim().toUpperCase()
  if (!code) return { ok: false, error: 'Digite um código de cupom.' }
  const service = data.services.find((s) => s.id === serviceId)
  if (!service) return { ok: false, error: 'Escolha um serviço antes de aplicar o cupom.' }
  const when = date ?? todayISO()

  const coupon = data.coupons.find((c) => c.code.toUpperCase() === code)
  if (coupon) {
    if (!coupon.active) return { ok: false, error: 'Este cupom está desativado.' }
    if (coupon.clientId && clientId && coupon.clientId !== clientId)
      return { ok: false, error: 'Este cupom é pessoal e pertence a outro cadastro.' }
    if (when < coupon.validFrom) return { ok: false, error: `Cupom válido somente a partir de ${brDate(coupon.validFrom)}.` }
    if (when > coupon.validUntil) return { ok: false, error: `Cupom expirado em ${brDate(coupon.validUntil)}.` }
    if (coupon.serviceIds?.length && !coupon.serviceIds.includes(serviceId))
      return { ok: false, error: 'Este cupom não vale para o serviço escolhido.' }
    if (coupon.minValue && service.price < coupon.minValue)
      return { ok: false, error: `Válido para serviços a partir de ${formatPrice(coupon.minValue)}.` }
    const raw = coupon.type === 'percent' ? (service.price * coupon.value) / 100 : coupon.value
    const discount = Math.min(service.price, Math.round(raw * 100) / 100)
    return { ok: true, code, discount, label: coupon.description }
  }

  const promo = data.promotions.find((p) => p.couponCode?.toUpperCase() === code)
  if (promo) {
    if (!promo.active) return { ok: false, error: 'Esta promoção não está ativa.' }
    if (when < promo.validFrom || when > promo.validUntil)
      return { ok: false, error: `Promoção válida de ${brDate(promo.validFrom)} a ${brDate(promo.validUntil)}.` }
    if (!promo.serviceIds.includes(serviceId)) return { ok: false, error: `O cupom vale para os serviços da promoção “${promo.name}”.` }
    const original = promotionOriginalPrice(data, promo)
    if (original <= promo.promoPrice) return { ok: false, error: 'Promoção sem desconto aplicável.' }
    const ratio = 1 - promo.promoPrice / original
    const discount = Math.round(service.price * ratio * 100) / 100
    return { ok: true, code, discount, label: `Promoção ${promo.name} (${Math.round(ratio * 100)}% off)` }
  }

  return { ok: false, error: 'Cupom não encontrado.' }
}
