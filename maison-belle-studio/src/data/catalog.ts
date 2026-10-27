import type { Category, Professional, Service } from '../types'
import { IMG } from './images'

/** Catálogo inicial — preços e durações FICTÍCIOS, apenas para demonstração. */

export const CATEGORIES: Category[] = [
  { id: 'cortes', label: 'Cortes e escovas' },
  { id: 'coloracao', label: 'Coloração' },
  { id: 'tratamentos', label: 'Tratamentos' },
  { id: 'unhas', label: 'Manicure e pedicure' },
  { id: 'maquiagem', label: 'Maquiagem' },
  { id: 'sobrancelhas', label: 'Sobrancelhas e cílios' },
  { id: 'estetica', label: 'Estética' },
]

export const SEED_SERVICES: Service[] = [
  { id: 'srv-corte', name: 'Corte feminino', category: 'cortes', description: 'Consultoria de visagismo, lavagem com ativos do seu tipo de fio e corte personalizado.', price: 140, duration: 60, image: IMG.haircut, active: true, featured: true },
  { id: 'srv-corte-escova', name: 'Corte + escova', category: 'cortes', description: 'O corte completo seguido de escova modelada para sair pronta.', price: 185, duration: 90, image: IMG.blowout, active: true },
  { id: 'srv-escova', name: 'Escova modelada', category: 'cortes', description: 'Lavagem, protetor térmico e escova com movimento ou lisa, como preferir.', price: 85, duration: 45, image: IMG.blowout, active: true },
  { id: 'srv-penteado', name: 'Penteado para eventos', category: 'cortes', description: 'Preso, semipreso ou ondas soltas, com fixação para durar a noite inteira.', price: 230, duration: 90, image: IMG.updo, active: true },
  { id: 'srv-raiz', name: 'Coloração de raiz', category: 'coloracao', description: 'Retoque de raiz com coloração sem amônia e cobertura uniforme dos brancos.', price: 190, duration: 120, image: IMG.color, active: true },
  { id: 'srv-mechas', name: 'Morena iluminada', category: 'coloracao', description: 'Mechas suaves feitas à mão livre, com tonalização e tratamento pós-química.', price: 520, duration: 240, image: IMG.highlights, active: true, featured: true },
  { id: 'srv-tonalizacao', name: 'Tonalização', category: 'coloracao', description: 'Ajuste de reflexo e brilho para loiros e morenas iluminadas.', price: 150, duration: 60, image: IMG.toner, active: true },
  { id: 'srv-hidratacao', name: 'Hidratação profunda', category: 'tratamentos', description: 'Máscara de alta nutrição com vapor de ozônio e selagem de cutículas.', price: 140, duration: 60, image: IMG.treatment, active: true },
  { id: 'srv-reconstrucao', name: 'Reconstrução capilar', category: 'tratamentos', description: 'Reposição de massa para fios danificados por química ou calor.', price: 210, duration: 75, image: IMG.treatment, active: true },
  { id: 'srv-ritual', name: 'Ritual Maison', category: 'tratamentos', description: 'Diagnóstico do couro cabeludo, esfoliação, máscara e massagem relaxante.', price: 260, duration: 90, image: IMG.salon3, active: true, featured: true },
  { id: 'srv-manicure', name: 'Manicure', category: 'unhas', description: 'Cutilagem cuidadosa, lixamento e esmaltação tradicional.', price: 45, duration: 45, image: IMG.nails, active: true },
  { id: 'srv-pedicure', name: 'Pedicure', category: 'unhas', description: 'Cuidado completo dos pés com esfoliação e esmaltação.', price: 55, duration: 50, image: IMG.pedicure, active: true },
  { id: 'srv-gel', name: 'Esmaltação em gel', category: 'unhas', description: 'Brilho e durabilidade de até três semanas, com remoção inclusa.', price: 110, duration: 75, image: IMG.nails2, active: true, featured: true },
  { id: 'srv-spa-pes', name: 'Spa dos pés', category: 'unhas', description: 'Escalda-pés aromático, esfoliação, máscara hidratante e massagem.', price: 95, duration: 60, image: IMG.pedicure, active: true },
  { id: 'srv-make', name: 'Maquiagem social', category: 'maquiagem', description: 'Pele iluminada e acabamento duradouro para festas e eventos.', price: 190, duration: 60, image: IMG.makeup, active: true },
  { id: 'srv-noiva', name: 'Maquiagem para noivas', category: 'maquiagem', description: 'Prova prévia inclusa, pele à prova de lágrimas e retoque final.', price: 650, duration: 120, image: IMG.bridal, active: true },
  { id: 'srv-sobrancelha', name: 'Design de sobrancelhas', category: 'sobrancelhas', description: 'Mapeamento facial e design com pinça respeitando o desenho natural.', price: 60, duration: 30, image: IMG.brows, active: true },
  { id: 'srv-henna', name: 'Design com henna', category: 'sobrancelhas', description: 'Design completo com henna para preencher falhas e definir o olhar.', price: 80, duration: 45, image: IMG.brows, active: true },
  { id: 'srv-lash', name: 'Lash lifting', category: 'sobrancelhas', description: 'Curvatura natural dos cílios com nutrição, sem extensões.', price: 160, duration: 60, image: IMG.makeup2, active: true },
  { id: 'srv-limpeza', name: 'Limpeza de pele', category: 'estetica', description: 'Higienização profunda, extração e máscara calmante.', price: 180, duration: 75, image: IMG.skincare, active: true },
  { id: 'srv-massagem', name: 'Massagem relaxante', category: 'estetica', description: 'Sessão corporal com óleos aquecidos para aliviar tensões.', price: 150, duration: 60, image: IMG.massage, active: true },
]

export const SEED_PROFESSIONALS: Professional[] = [
  {
    id: 'pro-helena', name: 'Helena Duarte', role: 'Hair stylist e fundadora',
    specialties: ['Cortes', 'Visagismo', 'Coloração'],
    bio: 'Fundou o studio depois de doze anos em salões de São Paulo. Gosta de cortes que crescem bonitos e dispensam esforço no dia a dia.',
    photo: IMG.pro1,
    serviceIds: ['srv-corte', 'srv-corte-escova', 'srv-escova', 'srv-raiz', 'srv-mechas', 'srv-tonalizacao'],
    workDays: [2, 3, 4, 5, 6], start: '09:00', end: '18:00', active: true, color: '#b9614a',
  },
  {
    id: 'pro-camila', name: 'Camila Arantes', role: 'Colorista e terapeuta capilar',
    specialties: ['Mechas', 'Loiros', 'Tratamentos'],
    bio: 'Especialista em loiros saudáveis. Cada coloração começa com um diagnóstico do fio para planejar o caminho até a cor desejada.',
    photo: IMG.pro2,
    serviceIds: ['srv-raiz', 'srv-mechas', 'srv-tonalizacao', 'srv-hidratacao', 'srv-reconstrucao', 'srv-ritual', 'srv-escova'],
    workDays: [3, 4, 5, 6], start: '09:00', end: '19:00', active: true, color: '#d08a5e',
  },
  {
    id: 'pro-bianca', name: 'Bianca Moura', role: 'Nail designer',
    specialties: ['Esmaltação em gel', 'Spa dos pés', 'Nail art'],
    bio: 'Detalhista e rápida, cuida das unhas com materiais esterilizados em autoclave e um acervo de cores atualizado a cada estação.',
    photo: IMG.pro3,
    serviceIds: ['srv-manicure', 'srv-pedicure', 'srv-gel', 'srv-spa-pes'],
    workDays: [2, 3, 4, 5, 6], start: '09:00', end: '19:00', active: true, color: '#8c8459',
  },
  {
    id: 'pro-larissa', name: 'Larissa Teles', role: 'Maquiadora',
    specialties: ['Noivas', 'Pele iluminada', 'Sobrancelhas'],
    bio: 'Assina produções de casamentos e formaturas. Acredita em maquiagem que realça sem esconder quem você é.',
    photo: IMG.pro4,
    serviceIds: ['srv-make', 'srv-noiva', 'srv-sobrancelha', 'srv-henna', 'srv-lash', 'srv-penteado'],
    workDays: [2, 4, 5, 6], start: '10:00', end: '19:00', active: true, color: '#b96f78',
  },
  {
    id: 'pro-rafael', name: 'Rafael Nunes', role: 'Hair stylist',
    specialties: ['Cortes curtos', 'Escovas', 'Penteados'],
    bio: 'Domina tesoura e navalha. Atende no fim do dia, ideal para quem sai do trabalho direto para o salão.',
    photo: IMG.pro5,
    serviceIds: ['srv-corte', 'srv-corte-escova', 'srv-escova', 'srv-penteado', 'srv-hidratacao'],
    workDays: [2, 3, 4, 5], start: '11:00', end: '20:00', active: true, color: '#5f7f7a',
  },
  {
    id: 'pro-ana', name: 'Ana Clara Ribeiro', role: 'Esteticista',
    specialties: ['Limpeza de pele', 'Massagem', 'Lash lifting'],
    bio: 'Formada em estética e cosmetologia, conduz protocolos de pele e massagens em uma sala reservada e silenciosa.',
    photo: IMG.pro6,
    serviceIds: ['srv-limpeza', 'srv-massagem', 'srv-lash', 'srv-sobrancelha'],
    workDays: [2, 3, 5, 6], start: '09:00', end: '17:00', active: true, color: '#7e5f70',
  },
]
