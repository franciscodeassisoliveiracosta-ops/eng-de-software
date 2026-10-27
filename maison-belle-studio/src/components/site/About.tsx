import { SALON } from '../../config/salon'
import { IMG } from '../../data/images'
import { useReveal } from '../../hooks/useReveal'
import { useStore } from '../../store/StoreContext'
import { SmartImage } from '../ui/Misc'

/**
 * “Sobre nós” + diferenciais em composição editorial assimétrica:
 * texto e foto de detalhe no topo; números discretos em uma única linha;
 * três diferenciais como pequenos ensaios, sem caixas nem ícones.
 */
const PRINCIPLES = [
  {
    title: 'Hora marcada é hora marcada.',
    text: 'A agenda tem um intervalo entre uma cliente e outra. Assim ninguém espera na recepção e o seu atendimento não é encurtado para encaixar o próximo.',
  },
  {
    title: 'Primeiro a conversa, depois a tesoura.',
    text: 'Antes de cortar ou colorir, olhamos referências e falamos da sua rotina. Se o que você pediu não for bom para o seu fio, a gente avisa — e propõe outro caminho.',
  },
  {
    title: 'Cuidado que você vê.',
    text: 'Os instrumentos de manicure saem da autoclave e as lixas são abertas na sua frente. Na coloração, damos preferência a fórmulas sem amônia.',
  },
]

export function About() {
  const { data } = useStore()
  const top = useReveal<HTMLDivElement>()
  const list = useReveal<HTMLOListElement>()
  const pros = data.professionals.filter((p) => p.active).length
  const services = data.services.filter((s) => s.active).length

  return (
    <section id="sobre" className="scroll-mt-24 bg-ivory py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div ref={top} className="reveal grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7 lg:pt-6">
            <p className="eyebrow">Sobre nós</p>
            <h2 className="display mt-5 max-w-2xl text-[2.6rem] text-ink sm:text-[3.6rem] lg:text-[4.2rem]">
              Um studio pequeno, <em className="text-rose">de propósito.</em>
            </h2>
            <div className="mt-8 max-w-xl space-y-4 text-[1.02rem] leading-relaxed text-cocoa">
              <p>
                O {SALON.name} começou em uma casa antiga do {SALON.address.district}, com duas cadeiras e clientes que se conheciam pelo nome. A equipe cresceu, mas a ideia ficou: poucos atendimentos ao mesmo tempo e tempo para ouvir.
              </p>
              <p className="text-taupe">O resultado precisa funcionar na sua rotina — não só na saída do salão.</p>
            </div>
            <p className="mt-10 text-[0.85rem] leading-loose text-taupe">
              <span className="font-display text-[1.6rem] text-ink">desde {SALON.founded}</span>
              <span className="mx-3 text-linen">/</span>
              <span className="font-display text-[1.6rem] text-ink">{pros}</span> especialistas
              <span className="mx-3 text-linen">/</span>
              <span className="font-display text-[1.6rem] text-ink">{services}</span> serviços
              <span className="block text-[0.72rem] leading-normal text-stone">Dados de demonstração</span>
            </p>
          </div>
          <figure className="lg:col-span-5">
            <SmartImage src={IMG.hairDetail} alt="Profissional finalizando uma escova com movimento" className="aspect-[4/5]" />
            <figcaption className="mt-3 font-display text-[1.05rem] text-taupe italic">Escova finalizada à mão, mecha por mecha.</figcaption>
          </figure>
        </div>

        <div className="mt-20 border-t border-linen pt-12 sm:mt-24">
          <p className="eyebrow">O que muda quando você vem aqui</p>
          <ol ref={list} className="reveal mt-10 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-x-10">
            {PRINCIPLES.map((p, i) => (
              <li
                key={p.title}
                className={i === 0 ? 'md:col-span-2 lg:col-span-5' : i === 1 ? 'lg:col-span-3 lg:col-start-7 lg:mt-14' : 'lg:col-span-3 lg:mt-28'}
              >
                <span className="font-display text-xl text-rose italic">{String(i + 1).padStart(2, '0')}</span>
                <p className={`mt-2 font-display leading-[1.12] text-ink ${i === 0 ? 'text-[2.1rem] sm:text-[2.6rem]' : 'text-[1.7rem]'}`}>{p.title}</p>
                <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-taupe">{p.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
