import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'center' | 'drawer'
  labelledBy?: string
  bare?: boolean
}

const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }

/** Trava a rolagem do body enquanto houver modais abertos (suporta modais empilhados). */
let openCount = 0

function useModalBehavior(open: boolean, onClose: () => void, panel: React.RefObject<HTMLDivElement | null>) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    openCount++
    document.body.style.overflow = 'hidden'
    const focusFirst = () => {
      const el = panel.current?.querySelector<HTMLElement>('[data-autofocus], input, select, textarea, button:not([data-close])')
      ;(el ?? panel.current)?.focus()
    }
    const t = setTimeout(focusFirst, 30)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // fecha apenas o modal mais recente
        const all = document.querySelectorAll('[data-modal-panel]')
        if (all[all.length - 1] === panel.current) {
          e.stopPropagation()
          closeRef.current()
        }
      }
      if (e.key === 'Tab' && panel.current) {
        const items = panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      openCount--
      if (openCount <= 0) document.body.style.overflow = ''
      previous?.focus?.()
    }
  }, [open, panel])
}

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md', variant = 'center', bare }: ModalProps) {
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useModalBehavior(open, onClose, panel)
  if (!open) return null

  const isDrawer = variant === 'drawer'
  return createPortal(
    <div className="fixed inset-0 z-[80]" role="presentation">
      <div className="animate-fade-in absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden="true" />
      <div
        className={
          isDrawer
            ? 'absolute inset-y-0 right-0 flex w-full max-w-lg'
            : 'absolute inset-0 flex items-end justify-center overflow-y-auto sm:items-center sm:p-6'
        }
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          ref={panel}
          data-modal-panel
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          tabIndex={-1}
          className={
            isDrawer
              ? 'animate-slide-in-right flex h-full w-full flex-col bg-ivory shadow-2xl outline-none'
              : `animate-fade-up relative flex max-h-[94dvh] w-full ${widths[size]} flex-col overflow-hidden rounded-t-2xl bg-ivory shadow-2xl outline-none sm:rounded-2xl`
          }
        >
          {!bare && (title || subtitle) && (
            <header className="flex items-start justify-between gap-4 border-b border-linen px-5 py-4 sm:px-7 sm:py-5">
              <div className="min-w-0">
                {title && (
                  <h2 id={titleId} className="font-display text-2xl leading-tight text-ink sm:text-[1.75rem]">
                    {title}
                  </h2>
                )}
                {subtitle && <p className="mt-1 text-sm text-taupe">{subtitle}</p>}
              </div>
              <button
                type="button"
                data-close
                onClick={onClose}
                aria-label="Fechar"
                className="-mr-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-taupe transition hover:bg-sand hover:text-ink"
              >
                <X size={20} />
              </button>
            </header>
          )}
          <div className={bare ? 'flex min-h-0 flex-1 flex-col' : 'min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6'}>{children}</div>
          {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-linen bg-cream/70 px-5 py-4 sm:px-7">{footer}</footer>}
        </div>
      </div>
    </div>,
    document.body,
  )
}

interface ConfirmProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Voltar', tone = 'danger', onConfirm, onClose }: ConfirmProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-[0.95rem] leading-relaxed text-cocoa">{message}</div>
    </Modal>
  )
}
