import { useState } from 'react'
import { ArrowRight, ArrowUpRight, MapPin } from 'lucide-react'
import { SALON } from '../../config/salon'
import { IMG } from '../../data/images'
import { POSTS, type Post } from '../../data/posts'
import { useReveal } from '../../hooks/useReveal'
import { useStore } from '../../store/StoreContext'
import { useBooking } from '../booking/BookingProvider'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { SmartImage } from '../ui/Misc'
import { useSectionNav } from './Header'
import { SectionHeading } from './SectionHeading'

function Tile({ category, title, text, image, big = false }: { category: string; title: string; text: string; image: string; big?: boolean }) {
  const go = useSectionNav()
  return (
    <button type="button" onClick={() => go('servicos', category)} className="group block w-full text-left">
      <SmartImage src={image} alt={`Serviços de ${title.toLowerCase()}`} className={big ? 'aspect-[4/5] lg:aspect-[6/5]' : 'aspect-[16/10]'} imgClass="transition-transform duration-[1.2s] ease-[var(--ease-soft)] group-hover:scale-[1.03]" />
      <span className="mt-4 flex items-baseline justify-between gap-4">
        <span className={`font-display text-ink ${big ? 'text-[2.4rem]' : 'text-[1.9rem]'}`}>{title}</span>
        <span className="inline-flex shrink-0 items-center gap-1 text-[0.84rem] font-semibold text-rose-dark transition-all group-hover:gap-2">
          Ver serviços <ArrowRight size={14} />
        </span>
      </span>
      <span className="mt-1 block max-w-md text-[0.92rem] leading-relaxed text-taupe">{text}</span>
    </button>
  )
}

/**
 * Três frentes do studio em composição assimétrica: uma imagem grande (cabelo)
 * e duas menores empilhadas — evitando a grade de três cards idênticos.
 */
export function Signature() {
  const go = useSectionNav()
  const ref = useReveal<HTMLDivElement>()
  return (
    <section aria-labelledby="assinatura-title" className="bg-ivory pb-20 sm:pb-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div ref={ref} className="reveal grid grid-cols-1 gap-x-10 gap-y-12 border-t border-linen pt-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 id="assinatura-title" className="display max-w-lg text-[2.4rem] text-ink sm:text-5xl">
              Do corte às unhas, <em className="text-rose">no mesmo endereço</em>
            </h2>
            <div className="mt-10">
              <Tile big category="cortes" title="Cabelo" image={IMG.haircut} text="Corte, escova, cor e tratamento planejados a partir do seu fio — e do tempo que você tem para arrumá-lo em casa." />
            </div>
          </div>
          <div className="flex flex-col gap-12 lg:col-span-5 lg:pt-28">
            <Tile category="maquiagem" title="Maquiagem" image={IMG.makeup} text="Pele com aparência de pele, feita para durar do primeiro brinde ao fim da festa." />
            <Tile category="unhas" title="Unhas" image={IMG.nails} text="Manicure, pedicure e gel com cartela renovada a cada estação." />
            <Button variant="secondary" className="self-start" onClick={() => go('servicos', 'all')}>
              Ver todos os serviços
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Fundadora em destaque — fundo nude, foto e citação, sem molduras decorativas. */
export function Director() {
  const { data } = useStore()
  const { open } = useBooking()
  const ref = useReveal<HTMLDivElement>()
  const helena = data.professionals.find((p) => p.id === 'pro-helena')
  return (
    <section aria-labelledby="diretora-title" className="bg-blush">
      <div className="mx-auto grid grid-cols-1 max-w-7xl items-center gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-12 lg:gap-14">
        <SmartImage src={helena?.photo ?? IMG.pro1} alt="Retrato da fundadora" className="aspect-[4/5] w-full max-w-md lg:col-span-5 lg:max-w-none" />
        <div ref={ref} className="reveal lg:col-span-6 lg:col-start-7">
          <p className="eyebrow">Fundadora e diretora criativa</p>
          <blockquote className="mt-6 font-display text-[2rem] leading-[1.2] text-ink sm:text-[2.6rem]">
            “Um bom corte é aquele que continua bonito quando <em className="text-rose">você mesma</em> arruma o cabelo em casa.”
          </blockquote>
          <p className="mt-6 font-semibold text-ink">{helena?.name ?? 'Helena Duarte'}</p>
          <p className="mt-4 max-w-lg leading-relaxed text-taupe">
            Depois de anos em salões de São Paulo, Helena voltou para {SALON.address.city} para abrir um studio com poucas cadeiras. Ela coordena a equipe, escolhe a cartela de cores de cada estação e continua atendendo de terça a sábado.
          </p>
          {helena?.active && (
            <Button variant="primary" className="mt-8" onClick={() => open({ professionalId: helena.id })}>
              Agendar com a Helena
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}

/** Novidades: um artigo em destaque e os demais em lista. */
export function News() {
  const [post, setPost] = useState<Post | null>(null)
  const { open } = useBooking()
  const [featured, ...rest] = POSTS
  return (
    <section id="novidades" className="scroll-mt-24 bg-cream py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading eyebrow="Novidades" title={<>Dicas da <em className="text-rose">equipe</em></>} intro="Textos curtos sobre cuidados entre uma visita e outra. Conteúdo demonstrativo." />
        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          <button type="button" onClick={() => setPost(featured)} className="group text-left lg:col-span-7">
            <SmartImage src={featured.image} alt="" className="aspect-[16/10]" imgClass="transition-transform duration-[1.2s] group-hover:scale-[1.03]" />
            <p className="mt-5 text-[0.8rem] text-stone">
              <span className="font-semibold text-rose-dark">{featured.category}</span> · {featured.date}
            </p>
            <h3 className="mt-2 max-w-xl font-display text-[2.1rem] leading-tight text-ink transition group-hover:text-rose-dark">{featured.title}</h3>
            <p className="mt-2 max-w-xl leading-relaxed text-taupe">{featured.excerpt}</p>
          </button>
          <ul className="divide-y divide-linen border-y border-linen lg:col-span-5 lg:self-start">
            {rest.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => setPost(p)} className="group grid w-full grid-cols-[1fr_5.5rem] gap-5 py-6 text-left">
                  <span>
                    <span className="text-[0.8rem] text-stone">
                      <span className="font-semibold text-rose-dark">{p.category}</span> · {p.date}
                    </span>
                    <span className="mt-1 block font-display text-[1.45rem] leading-tight text-ink transition group-hover:text-rose-dark">{p.title}</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-[0.82rem] font-semibold text-ink">
                      Ler <ArrowUpRight size={13} />
                    </span>
                  </span>
                  <SmartImage src={p.image} alt="" className="aspect-square" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Modal open={!!post} onClose={() => setPost(null)} size="lg" title={post?.title} subtitle={post && `${post.category} · ${post.date}`}>
        {post && (
          <article>
            <SmartImage src={post.image} alt="" className="aspect-[16/8]" />
            <div className="mt-6 space-y-4 leading-relaxed text-cocoa">
              {post.body.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-linen pt-5">
              <p className="text-[0.78rem] text-stone">Artigo fictício para demonstração.</p>
              <Button size="sm" onClick={() => { setPost(null); open() }}>
                Agendar horário
              </Button>
            </div>
          </article>
        )}
      </Modal>
    </section>
  )
}

export function Units() {
  return (
    <ul className="divide-y divide-linen border-y border-linen">
      {SALON.units.map((u) => (
        <li key={u.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-[1.6rem] leading-tight text-ink">
              {u.name} {!u.open && <span className="ml-2 align-middle text-[0.75rem] font-sans font-semibold text-rose-dark">em breve</span>}
            </p>
            <p className="mt-1 flex gap-2 text-[0.9rem] text-cocoa">
              <MapPin size={15} className="mt-0.5 shrink-0 text-rose" /> {u.address}
            </p>
            <p className="mt-1 text-[0.78rem] text-stone">{u.note} · endereço fictício</p>
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(u.mapQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-[0.85rem] font-semibold text-ink underline decoration-linen decoration-2 underline-offset-4 hover:decoration-rose"
          >
            Ver no mapa <ArrowUpRight size={13} />
          </a>
        </li>
      ))}
    </ul>
  )
}
