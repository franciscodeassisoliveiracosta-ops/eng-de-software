import { SALON } from '../../config/salon'
import { HERO_FALLBACKS, HERO_LOCAL } from '../../data/images'
import { nowMinutes, todayISO, toMinutes, weekday } from '../../lib/date'
import { useBooking } from '../booking/BookingProvider'
import { Button } from '../ui/Button'
import { SmartImage } from '../ui/Misc'
import { useSectionNav } from './Header'

function openNowLabel(): string {
  const wd = weekday(todayISO())
  const h = SALON.hours[wd]
  const now = nowMinutes()
  if (h && now >= toMinutes(h.open) && now < toMinutes(h.close)) return `Aberto agora, até as ${h.close.replace(':00', 'h')}`
  for (let i = 0; i < 7; i++) {
    const day = (wd + i) % 7
    const hh = SALON.hours[day]
    if (!hh) continue
    if (i === 0 && now < toMinutes(hh.open)) return `Abrimos hoje às ${hh.open.replace(':00', 'h')}`
    if (i === 1) return `Fechado agora · abrimos amanhã às ${hh.open.replace(':00', 'h')}`
    if (i > 1) return `Fechado agora · voltamos ${['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][day]}`
  }
  return 'Consulte os horários'
}

/**
 * Hero editorial: a fotografia (cabelo em destaque) ocupa a metade direita
 * até a borda da tela; o texto fica sobre fundo claro, sem sobreposição escura.
 * No celular a foto vem primeiro, enquadrada pelo topo para manter o cabelo visível.
 */
export function Hero() {
  const { open } = useBooking()
  const go = useSectionNav()
  return (
    <section id="inicio" className="relative overflow-hidden bg-ivory">
      <div className="lg:grid lg:min-h-[min(88dvh,52rem)] lg:grid-cols-12">
        <div className="relative lg:order-2 lg:col-span-6">
          <SmartImage
            src={HERO_LOCAL}
            fallbacks={HERO_FALLBACKS}
            alt="Mulher de cabelos longos e brilhantes sob luz natural do fim de tarde"
            eager
            quiet
            className="aspect-[4/5] max-h-[78dvh] w-full sm:aspect-[16/11] lg:absolute lg:inset-0 lg:aspect-auto lg:max-h-none"
            imgClass="object-[center_22%]"
          />
          {/* véu creme bem estreito só na emenda com o texto */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-ivory to-transparent lg:block" />
        </div>

        <div className="relative px-5 pt-10 pb-14 sm:px-8 lg:order-1 lg:col-span-6 lg:flex lg:items-center lg:py-20 lg:pr-4 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))]">
          <div className="max-w-xl">
            <p className="eyebrow">Studio de beleza em {SALON.address.city}</p>
            <h1 className="display mt-5 text-[2.9rem] text-ink sm:text-6xl xl:text-[4.4rem]">
              Realce sua beleza.
              <span className="mt-1 block text-rose italic">Viva sua melhor versão.</span>
            </h1>
            <p className="mt-6 max-w-md text-[1.05rem] leading-relaxed text-taupe">
              Cuidado, estilo e sofisticação em cada detalhe — com hora marcada e tempo de verdade para você.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" variant="rose" onClick={() => open()}>
                Agendar meu horário
              </Button>
              <Button size="lg" variant="secondary" onClick={() => go('servicos', 'all')}>
                Conheça nossos serviços
              </Button>
            </div>
            <p className="mt-10 border-t border-linen pt-5 text-[0.82rem] text-taupe">
              <span className="font-semibold text-ink">{openNowLabel()}</span>
              <span className="mx-2 text-linen">|</span>
              {SALON.address.district}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
