import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'
import { GALLERY } from '../../data/images'
import { Chip } from '../ui/Field'
import { Modal } from '../ui/Modal'
import { SmartImage } from '../ui/Misc'
import { SectionHeading } from './SectionHeading'
import { SALON } from '../../config/salon'
import { InstagramIcon } from '../ui/BrandIcons'

const CATS = ['Todos', ...Array.from(new Set(GALLERY.map((g) => g.category)))]

export function Gallery() {
  const [cat, setCat] = useState('Todos')
  const [index, setIndex] = useState<number | null>(null)
  const items = cat === 'Todos' ? GALLERY : GALLERY.filter((g) => g.category === cat)
  const current = index !== null ? items[index] : null

  useEffect(() => {
    if (index === null) return
    const on = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIndex((i) => (i === null ? i : (i + 1) % items.length))
      if (e.key === 'ArrowLeft') setIndex((i) => (i === null ? i : (i - 1 + items.length) % items.length))
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [index, items.length])

  return (
    <section id="galeria" className="scroll-mt-24 bg-ivory py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Galeria"
          title={
            <>
              Trabalhos <em className="text-rose">recentes</em>
            </>
          }
          intro={`Uma amostra do que publicamos em ${SALON.instagramHandle}. Nesta demonstração, as fotos são de referência.`}
          action={
            <a href={SALON.instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-ink/25 px-6 text-[0.86rem] font-semibold text-ink transition hover:bg-ink hover:text-cream">
              <InstagramIcon size={16} /> Seguir no Instagram
            </a>
          }
        />
        <div className="no-scrollbar -mx-5 mt-10 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filtrar galeria">
          {CATS.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
              {c}
            </Chip>
          ))}
        </div>
        <ul className="mt-8 grid grid-cols-3 gap-1 sm:gap-2">
          {items.map((g, i) => (
            <li key={g.id}>
              <button type="button" onClick={() => setIndex(i)} className="group relative block w-full overflow-hidden" aria-label={`Ampliar: ${g.alt}`}>
                <SmartImage src={g.src} alt={g.alt} className="aspect-square" imgClass="transition-transform duration-[1.2s] group-hover:scale-[1.05]" />
                <span className="absolute inset-0 flex items-end justify-between bg-ink/30 p-3 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span className="text-[0.82rem] font-semibold text-cream">{g.category}</span>
                  <Expand size={16} className="text-cream" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Modal open={!!current} onClose={() => setIndex(null)} size="xl" bare>
        {current && (
          <div className="relative bg-ink">
            <SmartImage src={current.src.replace('w=800', 'w=1600')} alt={current.alt} className="max-h-[78dvh] min-h-[50dvh]" imgClass="object-contain" />
            <button type="button" onClick={() => setIndex(null)} aria-label="Fechar imagem" className="absolute top-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink/60 text-ivory hover:bg-ink">
              <X size={20} />
            </button>
            <button type="button" onClick={() => setIndex((index! - 1 + items.length) % items.length)} aria-label="Imagem anterior" className="absolute top-1/2 left-3 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/90 text-ink hover:bg-ivory">
              <ChevronLeft size={20} />
            </button>
            <button type="button" onClick={() => setIndex((index! + 1) % items.length)} aria-label="Próxima imagem" className="absolute top-1/2 right-3 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/90 text-ink hover:bg-ivory">
              <ChevronRight size={20} />
            </button>
            <div className="flex items-center justify-between gap-4 bg-ivory px-5 py-3.5">
              <p className="text-sm text-cocoa">{current.alt}</p>
              <p className="shrink-0 text-[0.75rem] text-stone tabular-nums">
                {index! + 1} / {items.length}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}
