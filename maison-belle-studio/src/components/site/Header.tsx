import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronDown, Menu, Phone, UserRound, X } from 'lucide-react'
import { SALON } from '../../config/salon'
import { CATEGORIES } from '../../data/catalog'
import { useScrolled } from '../../hooks/useReveal'
import { infoMessage, waLink } from '../../lib/whatsapp'
import { useBooking } from '../booking/BookingProvider'
import { InstagramIcon, WhatsAppIcon } from '../ui/BrandIcons'
import { Logo } from '../ui/Misc'

export const NAV = [
  { id: 'inicio', label: 'Início' },
  { id: 'servicos', label: 'Serviços' },
  { id: 'profissionais', label: 'Profissionais' },
  { id: 'sobre', label: 'Sobre nós' },
  { id: 'novidades', label: 'Novidades' },
  { id: 'galeria', label: 'Galeria' },
  { id: 'contato', label: 'Contato' },
]

/** Evento usado para abrir o catálogo já filtrado por uma categoria. */
export const CATEGORY_EVENT = 'mb:categoria'

/** Navega até uma seção da página inicial (funciona a partir de qualquer rota). */
export function useSectionNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return (id: string, category?: string) => {
    if (pathname !== '/') {
      navigate('/', { state: { scrollTo: id, category } })
      return
    }
    if (category) window.dispatchEvent(new CustomEvent(CATEGORY_EVENT, { detail: category }))
    if (id === 'inicio') window.scrollTo({ top: 0, behavior: 'smooth' })
    else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

/** Barra superior: aviso de demonstração + contatos rápidos. */
export function DemoBar() {
  const wa = waLink(infoMessage())
  return (
    <div className="bg-sand text-cocoa">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-4 px-5 text-[0.74rem] sm:px-8">
        <p className="truncate">
          <span className="font-semibold text-rose-dark">Site de demonstração</span>
          <span className="hidden sm:inline"> · dados e reservas fictícios, salvos só neste navegador</span>
        </p>
        <div className="flex shrink-0 items-center gap-5">
          <span className="hidden items-center gap-1.5 md:inline-flex">
            <Phone size={12} /> {SALON.phoneDisplay}
          </span>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 hover:text-rose-dark sm:inline-flex">
              <WhatsAppIcon size={13} /> Agende via WhatsApp
            </a>
          )}
          <Link to="/admin" className="inline-flex items-center gap-1 font-semibold text-ink hover:text-rose-dark">
            Painel do salão <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  )
}

function ServicesMenu({ onPick }: { onPick: (category?: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLLIElement>(null)
  useEffect(() => {
    if (!open) return
    const out = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', out)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', out)
      document.removeEventListener('keydown', esc)
    }
  }, [open])
  return (
    <li ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 py-6 text-[0.86rem] font-medium whitespace-nowrap text-cocoa transition hover:text-rose-dark">
        Serviços <ChevronDown size={13} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="animate-fade-in absolute top-full left-1/2 z-50 w-64 -translate-x-1/2 rounded-xl border border-linen bg-cream py-2 shadow-[0_18px_40px_-18px_rgba(73,53,47,0.35)]">
          <ul>
            {CATEGORIES.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => { setOpen(false); onPick(c.id) }} className="block w-full px-5 py-2.5 text-left text-[0.88rem] text-cocoa transition hover:bg-blush hover:text-rose-dark">
                  {c.label}
                </button>
              </li>
            ))}
            <li className="mt-1 border-t border-linen pt-1">
              <button type="button" onClick={() => { setOpen(false); onPick() }} className="block w-full px-5 py-2.5 text-left text-[0.86rem] font-semibold text-rose-dark">
                Todos os serviços
              </button>
            </li>
          </ul>
        </div>
      )}
    </li>
  )
}

export function Header() {
  const scrolled = useScrolled(40)
  const [open, setOpen] = useState(false)
  const go = useSectionNav()
  const { open: openBooking } = useBooking()
  const wa = waLink(infoMessage())

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const nav = (id: string, category?: string) => {
    setOpen(false)
    setTimeout(() => go(id, category), open ? 60 : 0)
  }

  return (
    <>
      <header className={`sticky top-0 z-50 border-b transition-colors duration-500 ${scrolled ? 'border-linen bg-ivory/95 backdrop-blur' : 'border-transparent bg-ivory'}`}>
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
          <button type="button" onClick={() => nav('inicio')} aria-label={`${SALON.name} — ir para o início`} className="shrink-0">
            <Logo />
          </button>
          <nav aria-label="Principal" className="hidden xl:block">
            <ul className="flex items-center gap-7">
              {NAV.map((n) =>
                n.id === 'servicos' ? (
                  <ServicesMenu key={n.id} onPick={(c) => nav('servicos', c ?? 'all')} />
                ) : (
                  <li key={n.id}>
                    <button type="button" onClick={() => nav(n.id)} className="py-6 text-[0.86rem] font-medium whitespace-nowrap text-cocoa transition hover:text-rose-dark">
                      {n.label}
                    </button>
                  </li>
                ),
              )}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/minha-conta" aria-label="Minha área" className="hidden h-10 items-center gap-2 rounded-full px-3 text-[0.86rem] font-medium text-cocoa transition hover:bg-sand md:inline-flex">
              <UserRound size={16} /> <span className="hidden whitespace-nowrap 2xl:inline">Minha área</span>
            </Link>
            <button type="button" onClick={() => openBooking()} className="hidden h-10 items-center rounded-full bg-rose px-5 text-[0.84rem] font-semibold whitespace-nowrap text-cream transition hover:bg-rose-dark sm:inline-flex">
              Agendar horário
            </button>
            <button type="button" onClick={() => setOpen(true)} aria-label="Abrir menu" aria-expanded={open} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-sand xl:hidden">
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[70] xl:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="animate-fade-in absolute inset-0 bg-ivory" />
          <div className="relative flex h-full flex-col overflow-y-auto px-6 pt-4 pb-8 text-ink">
            <div className="flex h-14 items-center justify-between">
              <Logo />
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar menu" className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-sand">
                <X size={22} />
              </button>
            </div>
            <nav className="mt-6 flex-1" aria-label="Menu principal">
              <ul>
                {NAV.map((n, i) => (
                  <li key={n.id} className="animate-fade-up border-b border-linen" style={{ animationDelay: `${i * 40}ms` }}>
                    <button type="button" onClick={() => nav(n.id, n.id === 'servicos' ? 'all' : undefined)} className="flex w-full items-baseline py-3.5 text-left">
                                            <span className="font-display text-[1.9rem] leading-none">{n.label}</span>
                    </button>
                    {n.id === 'servicos' && (
                      <div className="no-scrollbar -mt-1 flex gap-2 overflow-x-auto pb-3">
                        {CATEGORIES.map((c) => (
                          <button key={c.id} type="button" onClick={() => nav('servicos', c.id)} className="shrink-0 rounded-full border border-linen bg-cream px-3 py-1.5 text-[0.78rem] text-cocoa">
                            {c.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
                <li>
                  <Link to="/minha-conta" onClick={() => setOpen(false)} className="flex items-center gap-2 py-4 text-sm font-semibold text-cocoa">
                    <UserRound size={16} /> Minha área (demonstração)
                  </Link>
                </li>
              </ul>
            </nav>
            <div className="space-y-3 pt-4">
              <button type="button" className="h-13 w-full rounded-full bg-rose text-[0.92rem] font-semibold text-cream" onClick={() => { setOpen(false); openBooking() }}>
                Agendar horário
              </button>
              <div className="flex justify-center gap-6 pt-2 text-sm text-taupe">
                {wa && (
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-rose-dark">
                    <WhatsAppIcon size={16} /> WhatsApp
                  </a>
                )}
                <a href={SALON.instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-rose-dark">
                  <InstagramIcon size={16} /> Instagram
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
