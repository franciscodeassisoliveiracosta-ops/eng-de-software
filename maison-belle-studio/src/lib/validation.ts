import { onlyDigits } from './format'

export type Errors<T extends string> = Partial<Record<T, string>>

export function validateName(v: string): string | undefined {
  const t = v.trim()
  if (!t) return 'Informe seu nome completo.'
  if (t.length < 3) return 'O nome precisa ter pelo menos 3 letras.'
  if (t.split(/\s+/).length < 2) return 'Informe nome e sobrenome.'
  if (/\d/.test(t)) return 'O nome não deve conter números.'
  return undefined
}

/** Telefone brasileiro: DDD + 8 ou 9 dígitos (celulares com 9 iniciando por 9). */
export function validatePhone(v: string): string | undefined {
  const d = onlyDigits(v)
  if (!d) return 'Informe um telefone para contato.'
  if (d.length !== 10 && d.length !== 11) return 'Use o formato (DDD) 99999-9999.'
  if (Number(d.slice(0, 2)) < 11) return 'DDD inválido.'
  if (d.length === 11 && d[2] !== '9') return 'Celulares com 11 dígitos começam com 9 após o DDD.'
  return undefined
}

export function validateEmail(v: string, required = false): string | undefined {
  const t = v.trim()
  if (!t) return required ? 'Informe um e-mail.' : undefined
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t)) return 'E-mail inválido. Ex.: nome@email.com'
  return undefined
}

export function validateRequired(v: string, label: string): string | undefined {
  return v.trim() ? undefined : `${label} é obrigatório.`
}

export function validatePositive(v: number, label: string): string | undefined {
  if (!Number.isFinite(v) || v <= 0) return `${label} deve ser maior que zero.`
  return undefined
}

export function hasErrors<T extends string>(e: Errors<T>): boolean {
  return Object.values(e).some(Boolean)
}
