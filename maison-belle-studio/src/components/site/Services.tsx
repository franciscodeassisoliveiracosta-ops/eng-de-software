import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { CATEGORIES } from '../../data/catalog'
import { isPromotionLive, promotionOriginalPrice } from '../../lib/coupons'
import { brDate } from '../../lib/date'
import { formatDuration, formatPrice } from '../../lib/format'
import { promoMessage, waLink } from '../../lib/whatsapp'
import { useStore } from '../../store/StoreContext'
import type { CategoryId, Service } from '../../types'
import { useBooking } from '../booking/BookingProvider'
import { Button } from '../ui/Button'
import { WhatsAppIcon } from '../ui/BrandIcons'
import { EmptyState, SmartImage } from '../ui/Misc'
import { CATEGORY_EVENT } from './Header'

const INITIAL = 8

/**
 * Catálogo no formato de “menu” de salão: categorias à esquerda e lista de
 * serviços com foto pequena, descrição, duração e preço — em vez de uma grade de cards.
 */
export function Services() {
  const { data } = useStore()
  const location = useLocation()
  const initialCat = (location.state as { category?: string } | null)?.category
  const [cat, setCat] = useState<CategoryId | 'all'>(CATEGORIES.some((c) => c.id === initialCat) ? (initialCat as CategoryId) : 'all')
  const [expanded, setExpanded] = useState(!!initialCat)

  // Atalhos do menu “Serviços” e dos destaques abrem o catálogo já filtrado
  useEffect(() => {
    const on = (e: Event) => {
      const c = (e as CustomEvent<string>).detail
      setCat(CATEGORIES.some((x) => x.id === c) ? (c as CategoryId) : 'all')
      setExpanded(true)
    }
    window.addEventListener(CATEGORY_EVENT, on)
    return () => window.removeEventListener(CATEGORY_EVENT, on)
  }, [])

  const active = useMemo(() => data.services.filter((s) => s.active), [data.services])
  const list = cat === 'all' ? [...active].sort((a, b) => Number(!!b.featured) - Number(!!a.featured)) : active.filter((s) => s.category === cat)
  const shown = cat === 'all' && !expanded ? list.slice(0, INITIAL) : list
  const cats = CATEGORIES.filter((c) => active.some((s) => s.category === c.id))
  const pick = (c: CategoryId | 'all') => {
    setCat(c)
    if (c !== 'all') setExpanded(true)
  }
  const filters = [{ id: 'all' as const, label: 'Todos', count: active.length }, ...cats.map((c) => ({ id: c.id, label: c.label, count: active.filter((s) => s.category === c.id).length }))]

  return (
    <section id="servicos" className="scroll-mt-24 bg-cream py-20 sm:py-28">
      <div className="mx-auto grid grid-cols-1 max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <p className="eyebrow">Serviços</p>
            <h2 className="display mt-4 text-[2.5rem] text-ink sm:text-5xl">
              Menu de <em className="text-rose">serviços</em>
            </h2>
            <p className="mt-4 max-w-sm text-[0.95rem] leading-relaxed text-taupe">A duração inclui conversa, lavagem e finalização. Valores de referência desta demonstração.</p>

            <div role="group" aria-label="Filtrar por categoria" className="no-scrollbar -mx-5 mt-8 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0">
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={cat === f.id}
                  onClick={() => pick(f.id)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-[0.85rem] transition lg:flex lg:items-baseline lg:justify-between lg:rounded-none lg:border-0 lg:border-b lg:border-linen lg:px-0 lg:py-3 lg:text-[0.95rem] ${
                    cat === f.id ? 'border-ink bg-ink text-cream lg:bg-transparent lg:font-semibold lg:text-rose-dark' : 'border-linen bg-ivory text-cocoa hover:border-taupe lg:bg-transparent lg:hover:text-rose-dark'
                  }`}
                >
                  {f.label} <span className="ml-1 text-[0.75rem] opacity-60">{f.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          {shown.length === 0 ? (
            <EmptyState title="Nenhum serviço nesta categoria" description="Escolha outra categoria ou veja todos os serviços." />
          ) : (
            <ul className="border-t border-linen">
              {shown.map((s) => (
                <ServiceRow key={s.id} service={s} />
              ))}
            </ul>
          )}
          {cat === 'all' && list.length > INITIAL && (
            <Button variant="secondary" className="mt-8" onClick={() => setExpanded((e) => !e)}>
              {expanded ? 'Mostrar menos' : `Ver o menu completo (${list.length})`}
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}

function ServiceRow({ service: s }: { service: Service }) {
  const { open } = useBooking()
  const label = CATEGORIES.find((c) => c.id === s.category)?.label
  return (
    <li className="group grid grid-cols-[4.5rem_1fr] gap-x-4 gap-y-3 border-b border-linen py-6 sm:grid-cols-[6rem_1fr_auto] sm:gap-x-6">
      <SmartImage src={s.image} alt={`Ilustração do serviço ${s.name}`} quiet className="aspect-square w-full self-start" imgClass="transition-transform duration-700 group-hover:scale-105" />
      <div className="min-w-0">
        <p className="text-[0.75rem] text-stone">{label}</p>
        <h3 className="mt-0.5 font-display text-[1.6rem] leading-tight text-ink">{s.name}</h3>
        <p className="mt-1.5 max-w-lg text-[0.9rem] leading-relaxed text-taupe">{s.description}</p>
      </div>
      <div className="col-span-2 flex items-center justify-between gap-4 sm:col-span-1 sm:flex-col sm:items-end sm:justify-start sm:text-right">
        <p>
          <span className="block font-display text-[1.55rem] leading-none text-ink">{formatPrice(s.price)}</span>
          <span className="mt-1 block text-[0.8rem] text-stone">{formatDuration(s.duration)}</span>
        </p>
        <button
          type="button"
          onClick={() => open({ serviceId: s.id })}
          aria-label={`Agendar serviço: ${s.name}`}
          className="inline-flex h-9 items-center gap-1 rounded-full border border-ink/25 px-4 text-[0.82rem] font-semibold text-ink transition hover:border-rose hover:bg-rose hover:text-cream sm:mt-4"
        >
          Agendar <ArrowUpRight size={14} />
        </button>
      </div>
    </li>
  )
}

/** Promoções ativas: faixa terracota com lista de pacotes (sem grade de cards). */
export function Promotions() {
  const { data } = useStore()
  const { open } = useBooking()
  const live = data.promotions.filter((p) => isPromotionLive(p))
  if (!live.length) return null
  return (
    <section id="promocoes" aria-labelledby="promo-title" className="scroll-mt-24 bg-rose-dark py-20 text-cream sm:py-24">
      <div className="mx-auto grid grid-cols-1 max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-4">
          <p className="text-[0.72rem] font-semibold tracking-[0.22em] text-peach uppercase">Pacotes da estação</p>
          <h2 id="promo-title" className="display mt-4 text-[2.5rem] sm:text-5xl">
            Para sair do salão <em className="text-peach">renovada</em>
          </h2>
          <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed text-cream/75">
            Informe o cupom ao agendar. O desconto do pacote é aplicado de forma proporcional em cada serviço incluído.
          </p>
        </div>
        <ul className="divide-y divide-cream/15 border-y border-cream/15 lg:col-span-8">
          {live.map((p) => {
            const original = promotionOriginalPrice(data, p)
            const names = p.serviceIds.map((id) => data.services.find((s) => s.id === id)?.name).filter(Boolean)
            const wa = waLink(promoMessage(p))
            const firstService = p.serviceIds.find((id) => data.services.some((s) => s.id === id && s.active))
            return (
              <li key={p.id} className="grid grid-cols-1 gap-5 py-7 sm:grid-cols-[8rem_1fr_auto] sm:gap-7">
                <SmartImage src={p.image} alt={`Promoção ${p.name}`} className="hidden aspect-square sm:block" />
                <div>
                  <h3 className="font-display text-[2rem] leading-tight">{p.name}</h3>
                  <p className="mt-1.5 text-[0.92rem] leading-relaxed text-cream/75">{p.description}</p>
                  <p className="mt-2 text-[0.8rem] text-cream/60">
                    {names.join(' + ')} · até {brDate(p.validUntil)}
                  </p>
                  {p.couponCode && (
                    <p className="mt-3 text-[0.82rem] text-cream/80">
                      Cupom <span className="rounded bg-cream/15 px-2 py-0.5 font-mono tracking-wider text-cream">{p.couponCode}</span>
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end sm:text-right">
                  <p className="mr-auto sm:mr-0">
                    {original > p.promoPrice && <span className="block text-[0.85rem] text-cream/55 line-through">{formatPrice(original)}</span>}
                    <span className="font-display text-[2.2rem] leading-none">{formatPrice(p.promoPrice)}</span>
                  </p>
                  <button
                    type="button"
                    disabled={!firstService}
                    onClick={() => firstService && open({ serviceId: firstService, couponCode: p.couponCode })}
                    className="inline-flex h-10 items-center rounded-full bg-cream px-5 text-[0.85rem] font-semibold text-rose-dark transition hover:bg-peach disabled:opacity-50"
                  >
                    Agendar com cupom
                  </button>
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[0.82rem] text-cream/80 underline-offset-4 hover:text-cream hover:underline">
                      <WhatsAppIcon size={14} /> Tirar dúvidas
                    </a>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
