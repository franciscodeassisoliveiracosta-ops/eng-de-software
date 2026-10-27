/**
 * Persistência local (localStorage).
 * ------------------------------------------------------------------
 * PONTO DE INTEGRAÇÃO FUTURA: quando houver backend, substitua
 * loadData/saveData por chamadas à API (ex.: GET /appointments,
 * POST /appointments). As telas consomem apenas o StoreContext,
 * então não precisam ser reescritas.
 *
 * Limitações: os dados ficam somente neste navegador, não sincronizam
 * entre dispositivos e podem ser apagados pelo usuário.
 */
import { createSeed, DATA_VERSION } from '../data/seed'
import type { AppData } from '../types'

export const STORAGE_KEY = 'maison-belle-studio:data'

function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v)
}

/** Validação estrutural mínima: se algo estiver ausente ou corrompido, recomeça com o seed. */
function isValid(v: unknown): v is AppData {
  if (!v || typeof v !== 'object') return false
  const d = v as Record<string, unknown>
  return (
    d.version === DATA_VERSION &&
    isArray(d.services) &&
    isArray(d.professionals) &&
    isArray(d.clients) &&
    isArray(d.appointments) &&
    isArray(d.blocks) &&
    isArray(d.promotions) &&
    isArray(d.coupons) &&
    !!d.settings &&
    typeof d.settings === 'object'
  )
}

export function loadData(): { data: AppData; restored: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isValid(parsed)) return { data: parsed, restored: true }
      console.info('[Maison Belle] Dados locais ausentes ou de versão antiga — recriando dados de demonstração.')
    }
  } catch {
    console.info('[Maison Belle] Não foi possível ler os dados locais — usando dados de demonstração.')
  }
  return { data: createSeed(), restored: false }
}

export function saveData(data: AppData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function clearData() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* armazenamento indisponível */
  }
}
