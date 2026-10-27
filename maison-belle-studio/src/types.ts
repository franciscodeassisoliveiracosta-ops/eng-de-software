/**
 * Tipos de domínio do sistema.
 * Foram desenhados para espelhar o que um backend futuro devolveria,
 * de modo que a troca do armazenamento local por uma API não exija
 * reescrever a interface.
 */

export type ISODate = string // "YYYY-MM-DD"
export type HHmm = string // "HH:mm"

export type CategoryId =
  | 'cortes'
  | 'coloracao'
  | 'tratamentos'
  | 'unhas'
  | 'maquiagem'
  | 'sobrancelhas'
  | 'estetica'

export interface Category {
  id: CategoryId
  label: string
}

export interface Service {
  id: string
  name: string
  category: CategoryId
  description: string
  price: number
  duration: number // minutos
  image: string
  active: boolean
  featured?: boolean
}

export interface Professional {
  id: string
  name: string
  role: string
  specialties: string[]
  bio: string
  photo: string
  serviceIds: string[]
  workDays: number[] // 0 = domingo ... 6 = sábado
  start: HHmm
  end: HHmm
  active: boolean
  color: string
}

export type ClientTag = 'vip' | 'ativo' | 'inativo' | 'novo'

export interface Client {
  id: string
  name: string
  phone: string // apenas dígitos
  email?: string
  birthday?: ISODate
  notes?: string
  createdAt: string
  redeemedPoints: number
}

export type AppointmentStatus = 'agendado' | 'confirmado' | 'concluido' | 'cancelado'
export type PaymentMethod = 'salao' | 'pix' | 'cartao'
export type PaymentStatus = 'pendente' | 'pago_simulado' | 'reembolso_simulado'
export type ReminderStatus = 'pendente' | 'enviado_manual' | 'nao_aplicavel'

export interface Review {
  rating: number
  comment: string
  createdAt: string
  /** true quando registrada por um usuário nesta demonstração (área do cliente) */
  fromDemoUser?: boolean
}

export interface Appointment {
  id: string
  code: string // identificador fictício exibido ao cliente
  serviceId: string
  serviceName: string // cópia para manter histórico se o serviço for removido
  professionalId: string
  professionalName: string
  clientId: string
  date: ISODate
  start: HHmm
  duration: number
  price: number
  discount: number
  couponCode?: string
  status: AppointmentStatus
  notes?: string
  payment: { method: PaymentMethod; status: PaymentStatus }
  reminder: ReminderStatus
  review?: Review
  source: 'site' | 'admin' | 'seed'
  createdAt: string
  history: { at: string; text: string }[]
}

export interface TimeBlock {
  id: string
  professionalId: string | 'all'
  date: ISODate
  start: HHmm
  end: HHmm
  reason: string
}

export interface Promotion {
  id: string
  name: string
  description: string
  serviceIds: string[]
  promoPrice: number
  validFrom: ISODate
  validUntil: ISODate
  couponCode?: string
  active: boolean
  image: string
}

export type CouponType = 'percent' | 'fixed'

export interface Coupon {
  code: string
  description: string
  type: CouponType
  value: number
  validFrom: ISODate
  validUntil: ISODate
  minValue?: number
  serviceIds?: string[] // vazio/indefinido = todos os serviços
  active: boolean
  clientId?: string // cupom pessoal (ex.: resgate de fidelidade)
}

export interface Settings {
  slotStep: number // minutos entre os inícios possíveis
  bufferMinutes: number // intervalo de preparação entre atendimentos
  bookingWindowDays: number // quantos dias à frente o cliente pode agendar
  minNoticeMinutes: number // antecedência mínima para horários de hoje
}


export interface AppData {
  version: number
  services: Service[]
  professionals: Professional[]
  clients: Client[]
  appointments: Appointment[]
  blocks: TimeBlock[]
  promotions: Promotion[]
  coupons: Coupon[]
  settings: Settings
  currentClientId: string | null
  seenNotificationsAt: string
}
