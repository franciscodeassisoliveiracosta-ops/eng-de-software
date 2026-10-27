import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { CalendarCheck } from 'lucide-react'
import { DemoBar, Header } from '../components/site/Header'
import { Footer } from '../components/site/Contact'
import { useBooking } from '../components/booking/BookingProvider'
import { useScrolled } from '../hooks/useReveal'

export function PublicLayout() {
  const { pathname } = useLocation()
  const scrolled = useScrolled(560)
  const { open } = useBooking()
  useEffect(() => {
    if (pathname !== '/') window.scrollTo(0, 0)
  }, [pathname])
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#conteudo" onClick={(e) => { e.preventDefault(); document.getElementById('conteudo')?.focus() }} className="sr-only z-[90] rounded bg-ink px-4 py-2 text-ivory focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Pular para o conteúdo
      </a>
      <DemoBar />
      <Header />
      <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <Footer />
      {/* Atalho de agendamento fixo no celular */}
      <div className={`fixed inset-x-0 bottom-0 z-40 p-3 transition-transform duration-500 sm:hidden ${scrolled && pathname === '/' ? 'translate-y-0' : 'translate-y-full'}`}>
        <button type="button" onClick={() => open()} className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-rose text-[0.92rem] font-semibold text-cream shadow-[0_12px_30px_-12px_rgba(73,53,47,0.6)]">
          <CalendarCheck size={18} /> Agendar horário
        </button>
      </div>
    </div>
  )
}
