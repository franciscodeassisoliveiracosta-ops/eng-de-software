import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'

type Tone = 'success' | 'error' | 'info'
interface Toast {
  id: number
  tone: Tone
  title: string
  description?: string
}

interface ToastApi {
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const Ctx = createContext<ToastApi | null>(null)
let counter = 0

const icons = {
  success: <CircleCheck size={18} className="text-sage" />,
  error: <CircleAlert size={18} className="text-danger" />,
  info: <Info size={18} className="text-rose" />,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const push = useCallback(
    (tone: Tone, title: string, description?: string) => {
      const id = ++counter
      setToasts((t) => [...t.slice(-3), { id, tone, title, description }])
      setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 4200)
    },
    [dismiss],
  )

  const [api] = useState<ToastApi>(() => ({
    success: (a, b) => push('success', a, b),
    error: (a, b) => push('error', a, b),
    info: (a, b) => push('info', a, b),
  }))

  return (
    <Ctx.Provider value={api}>
      {children}
      {createPortal(
        <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-5 sm:items-end">
          {toasts.map((t) => (
            <div
              key={t.id}
              role={t.tone === 'error' ? 'alert' : 'status'}
              className="animate-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-linen bg-cream px-4 py-3 shadow-[0_12px_40px_-12px_rgba(73,53,47,0.35)]"
            >
              <span className="mt-0.5">{icons[t.tone]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{t.title}</p>
                {t.description && <p className="mt-0.5 text-[0.8rem] leading-snug text-taupe">{t.description}</p>}
              </div>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Fechar notificação" className="-mr-1 rounded-full p-1 text-stone hover:bg-sand hover:text-ink">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </Ctx.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>')
  return ctx
}
