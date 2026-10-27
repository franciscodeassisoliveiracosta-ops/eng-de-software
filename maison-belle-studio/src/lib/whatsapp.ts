/**
 * Links do WhatsApp (wa.me) com mensagem pré-preenchida.
 * Nenhuma mensagem é enviada automaticamente: o link apenas abre o
 * WhatsApp com o texto pronto, e a pessoa decide se envia.
 * O número usado é de DEMONSTRAÇÃO (config/salon.ts).
 */
import { SALON } from '../config/salon'
import type { Appointment, Promotion } from '../types'
import { brDate, longDate } from './date'
import { formatPrice, onlyDigits } from './format'

export function waLink(message: string, phone: string = SALON.whatsappDemoNumber): string | null {
  const number = onlyDigits(phone)
  if (!number) return null
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

/** Link para o cliente (usado pelo painel ao lembrar um atendimento). */
export function waClientLink(clientPhone: string, message: string): string | null {
  const d = onlyDigits(clientPhone)
  if (!d) return null
  return waLink(message, d.startsWith('55') ? d : `55${d}`)
}

export function bookingMessage(a: Appointment, clientName: string): string {
  return [
    `Olá, ${SALON.name}! Gostaria de confirmar meu agendamento:`,
    ``,
    `Código: ${a.code}`,
    `Serviço: ${a.serviceName}`,
    `Profissional: ${a.professionalName}`,
    `Data: ${longDate(a.date)} (${brDate(a.date)})`,
    `Horário: ${a.start}`,
    `Valor: ${formatPrice(a.price - a.discount)}`,
    ``,
    `Nome: ${clientName}`,
  ].join('\n')
}

export function reminderMessage(a: Appointment, clientName: string): string {
  return `Olá, ${clientName.split(' ')[0]}! Passando para lembrar do seu horário no ${SALON.name}: ${a.serviceName} com ${a.professionalName}, ${longDate(a.date)} às ${a.start}. Podemos confirmar sua presença?`
}

export function infoMessage(): string {
  return `Olá, ${SALON.name}! Gostaria de mais informações sobre os serviços e horários disponíveis.`
}

export function promoMessage(p: Promotion): string {
  return `Olá! Vi a promoção “${p.name}” no site do ${SALON.name} (${formatPrice(p.promoPrice)}). Ela ainda está disponível?${p.couponCode ? ` Cupom: ${p.couponCode}` : ''}`
}
