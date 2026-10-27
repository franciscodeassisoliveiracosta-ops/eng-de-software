/**
 * Fotografias de referência (Unsplash, licença livre para uso).
 * São apenas ilustrativas — substitua pelas fotos reais do salão.
 * O componente <SmartImage> exibe um fundo elegante caso alguma
 * imagem não carregue (ex.: sem internet).
 */
const u = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`

/**
 * Foto do hero: o site tenta primeiro o arquivo local public/images/hero.jpg
 * (coloque ali a foto definitiva da marca) e, se ele não existir, usa as
 * fotos de referência abaixo. Direção: mulher com cabelo longo em destaque,
 * luz quente e natural, espaço livre à esquerda para o texto.
 */
export const HERO_LOCAL = `${import.meta.env.BASE_URL}images/hero.jpg`
export const HERO_FALLBACKS = [u('1529626455594-4ff0802cfb7e', 1600), u('1500917293891-ef795e70e1f6', 1600)]

export const IMG = {
  hairDetail: u('1522337360788-8b13dee7a37e', 900),
  salon1: u('1600948836101-f9ffda59d250', 1100),
  salon2: u('1521590832167-7bcbfaa6381f', 900),
  salon3: u('1633681926022-84c23e8cb2d6', 900),

  haircut: u('1562322140-8baeececf3df', 800),
  blowout: u('1595476108010-b4d1f102b1b1', 800),
  updo: u('1519699047748-de8e457a634e', 800),
  color: u('1580618672591-eb180b1a973f', 800),
  highlights: u('1527799820374-dcf8d9d4a388', 800),
  toner: u('1522337360788-8b13dee7a37e', 800),
  treatment: u('1516975080664-ed2fc6a32937', 800),
  nails: u('1604654894610-df63bc536371', 800),
  nails2: u('1610992015732-2449b76344bc', 800),
  pedicure: u('1519014816548-bf5fe059798b', 800),
  makeup: u('1487412947147-5cebf100ffc2', 800),
  makeup2: u('1512496015851-a90fb38ba796', 800),
  bridal: u('1457972729786-0411a3b2b626', 800),
  brows: u('1522335789203-aabd1fc54bc9', 800),
  skincare: u('1570172619644-dfd03ed5d881', 800),
  massage: u('1544161515-4ab6ce6db874', 800),

  pro1: u('1494790108377-be9c29b29330', 700),
  pro2: u('1438761681033-6461ffad8d80', 700),
  pro3: u('1544005313-94ddf0286df2', 700),
  pro4: u('1534528741775-53994a69daeb', 700),
  pro5: u('1507003211169-0a1dd7228f2d', 700),
  pro6: u('1517841905240-472988babdf9', 700),
}

/** Opções rápidas oferecidas no painel ao trocar a imagem de um serviço. */
export const IMAGE_PRESETS: { label: string; url: string }[] = [
  { label: 'Corte', url: IMG.haircut },
  { label: 'Escova', url: IMG.blowout },
  { label: 'Penteado', url: IMG.updo },
  { label: 'Coloração', url: IMG.color },
  { label: 'Mechas', url: IMG.highlights },
  { label: 'Tratamento', url: IMG.treatment },
  { label: 'Unhas', url: IMG.nails },
  { label: 'Unhas 2', url: IMG.nails2 },
  { label: 'Maquiagem', url: IMG.makeup },
  { label: 'Produtos', url: IMG.makeup2 },
  { label: 'Sobrancelhas', url: IMG.brows },
  { label: 'Pele', url: IMG.skincare },
]

export const GALLERY: { id: string; src: string; alt: string; category: string }[] = [
  { id: 'g1', src: IMG.haircut, alt: 'Corte em camadas finalizado com escova leve', category: 'Cortes' },
  { id: 'g2', src: IMG.color, alt: 'Coloração em tons de castanho iluminado', category: 'Coloração' },
  { id: 'g3', src: IMG.nails, alt: 'Unhas com esmaltação nude e acabamento brilhante', category: 'Unhas' },
  { id: 'g4', src: IMG.makeup, alt: 'Maquiagem social com pele luminosa', category: 'Maquiagem' },
  { id: 'g5', src: IMG.updo, alt: 'Penteado preso para evento', category: 'Penteados' },
  { id: 'g6', src: IMG.highlights, alt: 'Transformação de visual com mechas suaves', category: 'Transformações' },
  { id: 'g7', src: IMG.nails2, alt: 'Detalhe de unhas decoradas', category: 'Unhas' },
  { id: 'g8', src: IMG.blowout, alt: 'Escova modelada com movimento', category: 'Cortes' },
  { id: 'g9', src: IMG.bridal, alt: 'Preparação de maquiagem para noiva', category: 'Maquiagem' },
]
