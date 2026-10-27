import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Bell, CalendarDays, ChartColumn, ClipboardList, ExternalLink, LayoutDashboard, Menu, Scissors, Settings, ShieldAlert, Tag, UserRound, Users, X,
} from 'lucide-react'
import { addDays, brDate, longDate, todayISO } from '../lib/date'
import { useStore } from '../store/StoreContext'
import { Avatar, Logo } from '../components/ui/Misc'

const MODULES = [
  { to: '/admin', label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: '/admin/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/admin/agendamentos', label: 'Agendamentos', icon: ClipboardList },
  { to: '/admin/servicos', label: 'Serviços', icon: Scissors },
  { to: '/admin/profissionais', label: 'Profissionais', icon: UserRound },
  { to: '/admin/clientes', label: 'Clientes', icon: Users },
  { to: '/admin/promocoes', label: 'Promoções', icon: Tag },
  { to: '/admin/relatorios', label: 'Relatórios', icon: ChartColumn },
  { to: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col border-r border-linen bg-cream text-cocoa">
      <div className="px-6 pt-6 pb-8">
        <Link to="/" onClick={onNavigate} aria-label="Ir para o site">
          <Logo />
        </Link>
        <p className="mt-2 text-[0.78rem] text-stone">Painel do salão</p>
      </div>
      <nav aria-label="Módulos do painel" className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-0.5">
          {MODULES.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex h-10 items-center gap-3 rounded-lg px-3 text-[0.85rem] font-medium transition ${isActive ? 'bg-blush font-semibold text-rose-dark' : 'text-cocoa hover:bg-sand/60 hover:text-ink'}`
                }
              >
                <Icon size={17} strokeWidth={1.6} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="m-3 rounded-lg bg-sand/70 p-3 text-[0.75rem] leading-snug text-taupe">
        <p className="flex items-center gap-1.5 font-semibold text-rose-dark">
          <ShieldAlert size={13} /> Sem autenticação
        </p>
        <p className="mt-1">Rota aberta apenas para demonstração. Não use em produção.</p>
      </div>
      <Link to="/" onClick={onNavigate} className="mx-3 mb-4 flex h-10 items-center gap-2 rounded-lg px-3 text-[0.84rem] text-cocoa hover:bg-sand/60 hover:text-ink">
        <ExternalLink size={15} /> Ver site público
      </Link>
    </div>
  )
}

function Notifications() {
  const { data, markNotificationsSeen } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const today = todayISO()
  const fresh = data.appointments
    .filter((a) => a.source === 'site' && a.createdAt > data.seenNotificationsAt)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  const recent = data.appointments
    .filter((a) => a.source !== 'seed')
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 5)
  const reminders = data.appointments.filter((a) => a.reminder === 'pendente' && a.date >= today && a.date <= addDays(today, 1) && a.status !== 'cancelado')
  const count = fresh.length + (reminders.length ? 1 : 0)

  useEffect(() => {
    if (!open) return
    const on = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', on)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('mousedown', on)
      document.removeEventListener('keydown', key)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Notificações${count ? ` (${count} novas)` : ''}`}
        aria-expanded={open}
        onClick={() => {
          setOpen(!open)
          if (!open && fresh.length) setTimeout(markNotificationsSeen, 1500)
        }}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-cocoa hover:bg-sand"
      >
        <Bell size={19} />
        {count > 0 && <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose px-1 text-[0.6rem] font-bold text-white">{count}</span>}
      </button>
      {open && (
        <div className="animate-fade-up absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-linen bg-cream shadow-xl">
          <p className="border-b border-linen px-4 py-3 text-sm font-semibold text-ink">Notificações</p>
          <ul className="max-h-80 divide-y divide-linen overflow-y-auto text-[0.8rem]">
            {reminders.length > 0 && (
              <li className="px-4 py-3">
                <Link to="/admin/agendamentos?lembrete=pendente" onClick={() => setOpen(false)} className="block">
                  <p className="font-semibold text-ink">{reminders.length} lembrete(s) pendente(s)</p>
                  <p className="text-taupe">Atendimentos de hoje e amanhã aguardando lembrete manual.</p>
                </Link>
              </li>
            )}
            {recent.map((a) => (
              <li key={a.id} className={`px-4 py-3 ${fresh.includes(a) ? 'bg-blush/30' : ''}`}>
                <p className="font-semibold text-ink">
                  {a.status === 'cancelado' ? 'Cancelamento' : 'Novo agendamento'} · {a.code}
                </p>
                <p className="text-taupe">
                  {a.serviceName} com {a.professionalName} — {brDate(a.date)} às {a.start}
                </p>
              </li>
            ))}
            {!reminders.length && !recent.length && <li className="px-4 py-6 text-center text-taupe">Nada novo por aqui. Agendamentos feitos pelo site aparecem nesta lista.</li>}
          </ul>
        </div>
      )}
    </div>
  )
}

export function AdminLayout() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => {
    setOpen(false)
    window.scrollTo(0, 0)
  }, [pathname])
  useEffect(() => {
    document.title = 'Painel · Maison Belle Studio'
    return () => {
      document.title = 'Maison Belle Studio'
    }
  }, [])

  return (
    <div className="min-h-dvh bg-shell">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <Sidebar />
      </aside>
      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu do painel">
          <div className="animate-fade-in absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 shadow-2xl">
            <Sidebar onNavigate={() => setOpen(false)} />
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar menu" className="absolute top-5 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-taupe hover:bg-sand">
              <X size={18} />
            </button>
          </div>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 border-b border-linen bg-shell/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-8">
            <button type="button" onClick={() => setOpen(true)} aria-label="Abrir menu" className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-sand lg:hidden">
              <Menu size={20} />
            </button>
            <p className="min-w-0 flex-1 truncate text-[0.82rem] text-taupe first-letter:uppercase">{longDate(todayISO(), true)}</p>
            <span className="hidden rounded-full border border-rose/25 bg-blush px-2.5 py-0.5 text-[0.65rem] font-semibold tracking-wide text-rose-dark uppercase md:inline">Demonstração</span>
            <Notifications />
            <div className="flex items-center gap-2.5 border-l border-linen pl-3">
              <Avatar name="Helena Duarte" size={34} color="#b9614a" />
              <div className="hidden leading-tight sm:block">
                <p className="text-[0.8rem] font-semibold text-ink">Helena Duarte</p>
                <p className="text-[0.68rem] text-stone">Administradora (demo)</p>
              </div>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
