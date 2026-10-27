import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Clock } from 'lucide-react'
import { WEEKDAY_SHORT } from '../../config/salon'
import { formatDuration, formatPrice } from '../../lib/format'
import { useStore } from '../../store/StoreContext'
import type { Professional } from '../../types'
import { useBooking } from '../booking/BookingProvider'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { SmartImage } from '../ui/Misc'
import { SectionHeading } from './SectionHeading'

export function formatWorkDays(days: number[]): string {
  const sorted = [...days].sort((a, b) => a - b)
  if (!sorted.length) return 'Sem dias definidos'
  const consecutive = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1)
  if (consecutive && sorted.length > 2) return `${WEEKDAY_SHORT[sorted[0]]} a ${WEEKDAY_SHORT[sorted[sorted.length - 1]]}`
  return sorted.map((d) => WEEKDAY_SHORT[d]).join(', ')
}

/**
 * Carrossel sem bibliotecas: trilho com rolagem horizontal nativa (scroll-snap),
 * o que garante deslizar com o dedo no celular; as setas rolam uma “página”
 * (a largura visível) e ficam desativadas nos limites.
 */
function useCarousel() {
  const track = useRef<HTMLDivElement>(null)
  const [state, setState] = useState({ page: 0, pages: 1, atStart: true, atEnd: false })

  const measure = useCallback(() => {
    const el = track.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    const pages = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth - 0.05))
    const page = max <= 0 ? 0 : Math.round((el.scrollLeft / max) * (pages - 1))
    setState({ page, pages, atStart: el.scrollLeft <= 4, atEnd: el.scrollLeft >= max - 4 })
  }, [])

  useEffect(() => {
    const el = track.current
    if (!el) return
    measure()
    el.addEventListener('scroll', measure, { passive: true })
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', measure)
      ro.disconnect()
    }
  }, [measure])

  const step = (dir: 1 | -1) => {
    const el = track.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-slide]')
    const gap = parseFloat(getComputedStyle(el).columnGap || '0') || 0
    const unit = card ? card.offsetWidth + gap : el.clientWidth
    const perPage = Math.max(1, Math.floor((el.clientWidth + gap) / unit))
    el.scrollBy({ left: dir * unit * perPage, behavior: 'smooth' })
  }
  const goTo = (page: number) => {
    const el = track.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    el.scrollTo({ left: state.pages > 1 ? (max * page) / (state.pages - 1) : 0, behavior: 'smooth' })
  }
  return { track, ...state, step, goTo }
}

export function Team() {
  const { data } = useStore()
  const [profile, setProfile] = useState<string | null>(null)
  const pros = data.professionals.filter((p) => p.active)
  const c = useCarousel()

  const arrow = 'inline-flex h-12 w-12 items-center justify-center rounded-full border border-ink/25 text-ink transition hover:border-rose hover:bg-rose hover:text-cream focus-visible:border-rose disabled:cursor-not-allowed disabled:border-linen disabled:bg-transparent disabled:text-linen'

  return (
    <section id="profissionais" className="scroll-mt-24 bg-ivory py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Profissionais"
          title={
            <>
              Quem vai cuidar <em className="text-rose">de você</em>
            </>
          }
          intro="Ao agendar pelo card de uma profissional, mostramos só os serviços e horários dela."
          action={
            <div className="hidden items-center gap-3 md:flex">
              <button type="button" className={arrow} onClick={() => c.step(-1)} disabled={c.atStart} aria-label="Profissionais anteriores" aria-controls="carrossel-equipe">
                <ArrowLeft size={18} />
              </button>
              <button type="button" className={arrow} onClick={() => c.step(1)} disabled={c.atEnd} aria-label="Próximos profissionais" aria-controls="carrossel-equipe">
                <ArrowRight size={18} />
              </button>
            </div>
          }
        />

        <div
          id="carrossel-equipe"
          ref={c.track}
          role="region"
          aria-roledescription="carrossel"
          aria-label="Equipe de profissionais"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') { e.preventDefault(); c.step(1) }
            if (e.key === 'ArrowLeft') { e.preventDefault(); c.step(-1) }
          }}
          className="no-scrollbar -mx-5 mt-12 flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto scroll-smooth px-5 pb-2 outline-none sm:mx-0 sm:scroll-px-0 sm:px-0 lg:gap-6"
        >
          {pros.map((p, i) => (
            <ProCard key={p.id} pro={p} index={i} total={pros.length} onProfile={() => setProfile(p.id)} />
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          {c.pages > 1 ? (
            <div className="flex items-center gap-2" role="group" aria-label="Posição no carrossel">
              {Array.from({ length: c.pages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => c.goTo(i)}
                  aria-label={`Ir para o grupo ${i + 1} de ${c.pages}`}
                  aria-current={i === c.page}
                  className={`h-1.5 rounded-full transition-all duration-500 ${i === c.page ? 'w-8 bg-rose' : 'w-3 bg-ink/20 hover:bg-ink/40'}`}
                />
              ))}
            </div>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3 md:hidden">
            <button type="button" className={arrow} onClick={() => c.step(-1)} disabled={c.atStart} aria-label="Profissional anterior" aria-controls="carrossel-equipe">
              <ArrowLeft size={18} />
            </button>
            <button type="button" className={arrow} onClick={() => c.step(1)} disabled={c.atEnd} aria-label="Próximo profissional" aria-controls="carrossel-equipe">
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
      <ProfileModal id={profile} onClose={() => setProfile(null)} />
    </section>
  )
}

function ProCard({ pro: p, index, total, onProfile }: { pro: Professional; index: number; total: number; onProfile: () => void }) {
  const { open } = useBooking()
  const first = p.name.split(' ')[0]
  return (
    <article
      data-slide
      aria-roledescription="slide"
      aria-label={`${index + 1} de ${total}: ${p.name}`}
      className="group flex w-[80%] shrink-0 snap-start flex-col sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-3rem)/3)]"
    >
      <button type="button" onClick={onProfile} className="block overflow-hidden text-left" aria-label={`Ver perfil de ${p.name}`}>
        <SmartImage src={p.photo} alt={`Retrato de ${p.name}`} className="aspect-[4/5]" imgClass="transition-transform duration-[1.2s] ease-[var(--ease-soft)] group-hover:scale-[1.03]" />
      </button>
      <div className="flex flex-1 flex-col pt-5">
        <p className="text-[0.78rem] font-semibold text-rose-dark">{p.role}</p>
        <h3 className="mt-1 font-display text-[1.9rem] leading-tight text-ink">{p.name}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-[0.92rem] leading-relaxed text-taupe">{p.bio}</p>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Button size="sm" variant="primary" onClick={() => open({ professionalId: p.id })} aria-label={`Agendar com ${p.name}`}>
            Agendar com {first}
          </Button>
          <button type="button" onClick={onProfile} className="text-[0.84rem] font-semibold text-ink underline decoration-linen decoration-2 underline-offset-4 transition hover:decoration-rose">
            Ver perfil
          </button>
        </div>
      </div>
    </article>
  )
}

function ProfileModal({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data } = useStore()
  const { open } = useBooking()
  const p = data.professionals.find((x) => x.id === id)
  if (!p) return null
  const services = p.serviceIds.map((sid) => data.services.find((s) => s.id === sid && s.active)).filter((s): s is NonNullable<typeof s> => !!s)
  return (
    <Modal open onClose={onClose} size="lg" title={p.name} subtitle={p.role}>
      <div className="grid grid-cols-1 gap-7 sm:grid-cols-[200px_1fr]">
        <SmartImage src={p.photo} alt={`Retrato de ${p.name}`} className="aspect-[4/5] w-full max-w-[220px]" />
        <div>
          <p className="leading-relaxed text-cocoa">{p.bio}</p>
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {p.specialties.map((s) => (
              <li key={s} className="rounded-full bg-blush px-2.5 py-1 text-[0.75rem] text-rose-dark">
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-5 flex items-center gap-2 text-sm text-taupe">
            <CalendarDays size={15} className="text-rose" /> {formatWorkDays(p.workDays)} · {p.start} às {p.end}
          </p>
        </div>
      </div>
      <h3 className="mt-8 mb-3 text-[0.72rem] font-semibold tracking-[0.18em] text-stone uppercase">Serviços que realiza</h3>
      <ul className="divide-y divide-linen border-y border-linen">
        {services.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 py-3">
            <span>
              <span className="block font-medium text-ink">{s.name}</span>
              <span className="inline-flex items-center gap-1 text-[0.75rem] text-taupe">
                <Clock size={12} /> {formatDuration(s.duration)} · {formatPrice(s.price)}
              </span>
            </span>
            <button type="button" onClick={() => { onClose(); open({ serviceId: s.id, professionalId: p.id }) }} className="shrink-0 text-[0.84rem] font-semibold text-rose-dark hover:underline">
              Agendar
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex justify-end">
        <Button onClick={() => { onClose(); open({ professionalId: p.id }) }}>Agendar com {p.name.split(' ')[0]}</Button>
      </div>
    </Modal>
  )
}
