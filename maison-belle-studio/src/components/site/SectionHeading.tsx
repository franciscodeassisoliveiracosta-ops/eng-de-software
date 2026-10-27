import type { ReactNode } from 'react'
import { useReveal } from '../../hooks/useReveal'

/** Cabeçalho de seção. Alinhamento e largura variam entre seções para evitar um ritmo repetitivo. */
export function SectionHeading({
  eyebrow, title, intro, align = 'left', action, light = false,
}: { index?: string; eyebrow: string; title: ReactNode; intro?: ReactNode; align?: 'left' | 'center'; action?: ReactNode; light?: boolean }) {
  const ref = useReveal<HTMLDivElement>()
  return (
    <div ref={ref} className={`reveal ${align === 'center' ? 'mx-auto max-w-2xl text-center' : 'flex flex-col gap-6 md:flex-row md:items-end md:justify-between'}`}>
      <div className={align === 'center' ? '' : 'max-w-2xl'}>
        <p className={`eyebrow ${light ? 'text-peach' : ''}`}>{eyebrow}</p>
        <h2 className={`display mt-4 text-[2.5rem] sm:text-5xl lg:text-[3.5rem] ${light ? 'text-cream' : 'text-ink'}`}>{title}</h2>
        {intro && <p className={`mt-4 max-w-xl text-[1rem] leading-relaxed ${light ? 'text-cream/70' : 'text-taupe'}`}>{intro}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
