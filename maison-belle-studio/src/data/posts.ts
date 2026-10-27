import { IMG } from './images'

/** Artigos FICTÍCIOS para a seção "Novidades" (conteúdo demonstrativo). */
export interface Post {
  id: string
  title: string
  category: string
  date: string // texto livre
  image: string
  excerpt: string
  body: string[]
}

export const POSTS: Post[] = [
  {
    id: 'loiro-saudavel',
    title: 'Como manter o loiro bonito entre uma visita e outra',
    category: 'Cabelo',
    date: 'Outubro',
    image: IMG.highlights,
    excerpt: 'Matizador na medida certa, água morna e uma rotina simples fazem a cor durar semanas a mais.',
    body: [
      'O loiro perde brilho principalmente por três motivos: água muito quente, excesso de matizador e falta de nutrição. Ajustar esses pontos já muda o resultado.',
      'Use o shampoo matizador no máximo uma vez por semana e deixe agir só o tempo indicado. Nos outros dias, prefira fórmulas suaves e finalize sempre com protetor térmico.',
      'A cada quatro ou cinco semanas, uma tonalização rápida no salão devolve o reflexo planejado sem precisar repetir a descoloração.',
    ],
  },
  {
    id: 'pele-de-festa',
    title: 'Pele de festa: o preparo começa uma semana antes',
    category: 'Maquiagem',
    date: 'Setembro',
    image: IMG.makeup,
    excerpt: 'Hidratação, sono e uma limpeza de pele bem programada deixam a maquiagem mais leve e duradoura.',
    body: [
      'A maquiagem dura mais quando a pele está hidratada e sem descamação. Por isso, evite esfoliações fortes nos três dias anteriores ao evento.',
      'Se você pretende fazer limpeza de pele, agende com pelo menos cinco dias de antecedência para a pele se recuperar.',
      'No dia, chegue com o rosto limpo e conte para a maquiadora se usa algum ácido ou medicamento tópico.',
    ],
  },
  {
    id: 'gel-sem-danos',
    title: 'Esmaltação em gel sem enfraquecer as unhas',
    category: 'Unhas',
    date: 'Agosto',
    image: IMG.nails2,
    excerpt: 'O segredo está na remoção correta e em intervalos de descanso para a lâmina da unha.',
    body: [
      'O gel em si não enfraquece a unha; o que causa danos é a remoção forçada. Nunca puxe o produto quando ele começar a soltar.',
      'Faça a remoção sempre no salão, com o tempo certo de amolecimento, e hidrate as cutículas com óleo todos os dias.',
      'A cada três aplicações, uma semana de descanso com base fortalecedora ajuda a manter as unhas resistentes.',
    ],
  },
]
