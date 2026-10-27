import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { BookingFlow } from './BookingFlow'

export interface BookingPreset {
  serviceId?: string
  professionalId?: string
  couponCode?: string
  /** 'admin' quando o agendamento é criado pelo painel */
  source?: 'site' | 'admin'
}

interface BookingApi {
  open: (preset?: BookingPreset) => void
}

const Ctx = createContext<BookingApi | null>(null)

/** Disponibiliza o fluxo de agendamento em qualquer página: useBooking().open({ serviceId }) */
export function BookingProvider({ children }: { children: ReactNode }) {
  const [preset, setPreset] = useState<BookingPreset | null>(null)
  const [session, setSession] = useState(0)
  const open = useCallback((p: BookingPreset = {}) => {
    setSession((s) => s + 1)
    setPreset(p)
  }, [])
  const [api] = useState<BookingApi>(() => ({ open }))
  return (
    <Ctx.Provider value={api}>
      {children}
      {preset && <BookingFlow key={session} preset={preset} onClose={() => setPreset(null)} />}
    </Ctx.Provider>
  )
}

export function useBooking(): BookingApi {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useBooking precisa estar dentro de <BookingProvider>')
  return ctx
}
