import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { formatAddress, SALON, WEEKDAY_LABELS } from '../../config/salon'
import { todayISO, weekday } from '../../lib/date'
import { infoMessage, waLink } from '../../lib/whatsapp'
import { useBooking } from '../booking/BookingProvider'
import { Button, ExternalButton } from '../ui/Button'
import { InstagramIcon, WhatsAppIcon } from '../ui/BrandIcons'
import { Logo } from '../ui/Misc'
import { NAV, useSectionNav } from './Header'
import { useStore } from '../../store/StoreContext'
import { Units } from './Highlights'

const ORDER = [1, 2, 3, 4, 5, 6, 0]

export function HoursList({ compact = false }: { compact?: boolean }) {
  const today = weekday(todayISO())
  return (
    <ul className={compact ? 'space-y-1' : 'divide-y divide-linen'}>
      {ORDER.map((d) => {
        const h = SALON.hours[d]
        return (
          <li key={d} className={`flex justify-between gap-4 ${compact ? 'text-[0.82rem]' : 'py-2.5 text-sm'} ${d === today ? (compact ? 'font-semibold text-cream' : 'font-semibold text-ink') : ''}`}>
            <span>
              {WEEKDAY_LABELS[d]}
              {d === today && !compact && <span className="ml-2 text-[0.7rem] font-semibold text-rose">hoje</span>}
            </span>
            <span className="tabular-nums">{h ? `${h.open} – ${h.close}` : 'Fechado'}</span>
          </li>
        )
      })}
    </ul>
  )
}

export function Contact() {
  const { open } = useBooking()
  const wa = waLink(infoMessage())
  const rows: [string, ReactNode][] = [
    ['Endereço', <>{formatAddress()}<span className="block text-[0.78rem] text-stone">Endereço fictício · CEP {SALON.address.zip}</span></>],
    ['Telefone', <>{SALON.phoneDisplay}<span className="block text-[0.78rem] text-stone">Número demonstrativo</span></>],
    ['E-mail', SALON.email],
    ['Instagram', <a href={SALON.instagramUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-linen decoration-2 underline-offset-4 hover:decoration-rose">{SALON.instagramHandle}</a>],
  ]
  return (
    <section id="contato" className="scroll-mt-24 bg-cream py-20 sm:py-28">
      <div className="mx-auto grid grid-cols-1 max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-5">
          <p className="eyebrow">Contato</p>
          <h2 className="display mt-4 text-[2.5rem] text-ink sm:text-5xl">
            Venha nos <em className="text-rose">visitar</em>
          </h2>
          <dl className="mt-10 space-y-5 text-[0.98rem] text-ink">
            {rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[6.5rem_1fr] gap-4">
                <dt className="pt-0.5 text-[0.8rem] text-stone">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-10">
            <p className="mb-2 text-[0.8rem] text-stone">Horário de funcionamento</p>
            <HoursList />
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button variant="rose" onClick={() => open()}>Agendar horário</Button>
            {wa && (
              <ExternalButton href={wa} variant="secondary" icon={<WhatsAppIcon size={17} />}>
                Conversar no WhatsApp
              </ExternalButton>
            )}
          </div>
          {SALON.whatsappIsDemo && <p className="mt-3 text-[0.75rem] text-stone">O WhatsApp abre com uma mensagem pronta para um número de demonstração. Nada é enviado automaticamente.</p>}
        </div>
        <div className="lg:col-span-7">
          <div className="relative aspect-[4/3] overflow-hidden bg-sand sm:aspect-[16/10]">
            <iframe
              title="Mapa com a região do salão (localização ilustrativa)"
              src={`https://www.google.com/maps?q=${encodeURIComponent(SALON.mapQuery)}&z=13&output=embed`}
              className="absolute inset-0 h-full w-full sepia-[0.25] saturate-[0.8]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <p className="mt-2 text-[0.75rem] text-stone">Localização ilustrativa.</p>
          <div className="mt-10">
            <p className="mb-1 text-[0.8rem] text-stone">Unidades</p>
            <Units />
          </div>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  const go = useSectionNav()
  const { data } = useStore()
  const featured = data.services.filter((s) => s.active && s.featured).slice(0, 5)
  const { open } = useBooking()
  return (
    <footer className="bg-ink text-cream/70">
      <div className="mx-auto grid grid-cols-1 max-w-7xl gap-12 px-5 pt-16 pb-10 sm:px-8 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo light />
          <p className="mt-5 max-w-xs text-sm leading-relaxed">Cabelo, unhas, maquiagem e pele, sempre com hora marcada, no {SALON.address.district}.</p>
          <div className="mt-6 flex gap-2">
            <a href={SALON.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cream/20 transition hover:bg-cream hover:text-ink">
              <InstagramIcon size={17} />
            </a>
            {waLink(infoMessage()) && (
              <a href={waLink(infoMessage())!} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cream/20 transition hover:bg-cream hover:text-ink">
                <WhatsAppIcon size={17} />
              </a>
            )}
          </div>
        </div>
        <nav aria-label="Rodapé" className="lg:col-span-2">
          <p className="mb-4 text-[0.8rem] font-semibold text-peach">Navegação</p>
          <ul className="space-y-2.5 text-sm">
            {NAV.map((n) => (
              <li key={n.id}>
                <button type="button" onClick={() => go(n.id)} className="transition hover:text-cream">
                  {n.label}
                </button>
              </li>
            ))}
            <li>
              <Link to="/minha-conta" className="transition hover:text-cream">
                Minha área
              </Link>
            </li>
            <li>
              <Link to="/admin" className="transition hover:text-cream">
                Painel (demo)
              </Link>
            </li>
          </ul>
        </nav>
        <div className="lg:col-span-3">
          <p className="mb-4 text-[0.8rem] font-semibold text-peach">Serviços</p>
          <ul className="space-y-2.5 text-sm">
            {featured.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => open({ serviceId: s.id })} className="transition hover:text-cream">
                  {s.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-2 lg:col-span-3">
          <p className="mb-4 text-[0.8rem] font-semibold text-peach">Contato e horários</p>
          <p className="text-sm">{formatAddress()}</p>
          <p className="mt-1 text-sm">{SALON.phoneDisplay}</p>
          <div className="mt-4 max-w-xs">
            <HoursList compact />
          </div>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-[0.75rem] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            © {new Date().getFullYear()} {SALON.name}. Marca provisória · projeto demonstrativo.
          </p>
          <p className="text-cream/45">{SALON.credit}</p>
        </div>
      </div>
    </footer>
  )
}
