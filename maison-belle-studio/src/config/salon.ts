/**
 * Configuração central do salão.
 * Todos os dados de contato e horários exibidos no site vêm daqui.
 * Para usar com um salão real, substitua os valores abaixo.
 *
 * ATENÇÃO: todos os dados são FICTÍCIOS (projeto demonstrativo).
 */

export const SALON = {
  name: 'Maison Belle Studio',
  shortName: 'Maison Belle',
  tagline: 'Beleza com hora marcada',
  founded: 2014,
  address: {
    street: 'Rua das Magnólias, 214',
    district: 'Jardim Aurora',
    city: 'Recife',
    state: 'PE',
    zip: '50000-000',
  },
  /** Telefone exibido (fictício). */
  phoneDisplay: '(81) 3000-0000',
  /**
   * Número de WhatsApp de DEMONSTRAÇÃO, no formato internacional sem símbolos.
   * Não pertence ao salão. Deixe vazio ('') para desativar os links externos.
   */
  whatsappDemoNumber: '5581900000000',
  whatsappIsDemo: true,
  email: 'contato@maisonbelle.exemplo',
  instagramHandle: '@maisonbelle.studio',
  instagramUrl: 'https://www.instagram.com/',
  /** Horário de funcionamento por dia da semana (0 = domingo). null = fechado. */
  hours: {
    0: null,
    1: null,
    2: { open: '09:00', close: '19:00' },
    3: { open: '09:00', close: '19:00' },
    4: { open: '09:00', close: '20:00' },
    5: { open: '09:00', close: '20:00' },
    6: { open: '08:00', close: '17:00' },
  } as Record<number, { open: string; close: string } | null>,
  mapQuery: 'Recife, PE',
  /** Unidades (fictícias). A agenda da demonstração é única para a unidade principal. */
  units: [
    { id: 'jardim-aurora', name: 'Jardim Aurora', address: 'Rua das Magnólias, 214 — Jardim Aurora, Recife/PE', note: 'Unidade principal · agendamento online', mapQuery: 'Recife, PE', open: true },
    { id: 'beira-mar', name: 'Beira-Mar', address: 'Av. Atlântica Fictícia, 1200, loja 3 — Recife/PE', note: 'Inauguração prevista para o próximo semestre', mapQuery: 'Boa Viagem, Recife', open: false },
  ],
  credit: 'Desenvolvido pela Results.AG',
} as const

export const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function formatAddress(): string {
  const a = SALON.address
  return `${a.street} — ${a.district}, ${a.city}/${a.state}`
}
