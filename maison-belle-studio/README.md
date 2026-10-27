# Maison Belle Studio — Frontend de sistema para salão de beleza

Projeto **exclusivamente frontend** (React + TypeScript + Vite + Tailwind CSS) com site público, agendamento online, área do cliente e painel administrativo, todos conectados ao mesmo conjunto de dados locais.

> Identidade visual “sunset”: fundos creme e nude, terracota como cor de ação, coral e rosa queimado em detalhes e marrom profundo no lugar do preto. Todos os tons ficam centralizados em `src/index.css` (bloco `@theme`).

> Projeto demonstrativo. Nome, marca, contatos, preços, profissionais e clientes são **fictícios**.

## Como executar

Requisitos: Node.js 18+ (testado com Node 22).

```bash
npm install
npm run dev        # ambiente de desenvolvimento → http://localhost:5173
npm run build      # verificação de tipos + build de produção em dist/
npm run preview    # serve o build → http://localhost:4173
```

Rotas (HashRouter, funciona em qualquer hospedagem estática):

| Rota | Tela |
|---|---|
| `/#/` | Site público |
| `/#/minha-conta` | Área do cliente (modo demonstração) |
| `/#/admin` | Painel administrativo (sem autenticação — apenas demonstração) |

## Foto principal (hero)

O hero procura primeiro o arquivo **`public/images/hero.jpg`**. Coloque ali a fotografia definitiva (mulher com cabelo em destaque, luz quente, área mais limpa à esquerda). Enquanto o arquivo não existir, o site usa fotos de referência online e, sem internet, um fundo neutro.

## Estrutura

```
src/
  config/salon.ts        Dados do salão (nome, contatos, horários) — ponto único de troca
  data/                  Catálogo, fotos de referência e gerador de dados demonstrativos
  types.ts               Tipos de domínio (espelham um futuro backend)
  store/                 Estado global + persistência em localStorage
  lib/                   Regras e utilitários: disponibilidade, datas, preços,
                         validações, cupons, fidelidade, WhatsApp, CSV, estatísticas
  components/
    ui/                  Botões, modais, campos, toasts, selos, imagens
    site/                Seções do site público
    booking/             Fluxo de agendamento, calendário, remarcação, detalhes
    admin/               Gráficos e componentes do painel
  layouts/               Layout público e layout do painel
  pages/                 Home, Área do cliente e páginas do painel (admin/)
```

## Funcionalidades implementadas

- **Site público:** cabeçalho responsivo com menu mobile, hero, sobre, serviços com filtros por categoria, promoções/combos, equipe, galeria com ampliação (teclado e setas), contato com mapa, horários e WhatsApp, rodapé.
- **Agendamento em 6 etapas:** serviço → profissional (ou “qualquer disponível”) → data (calendário) → horário → dados (com validação e cupom) → revisão com forma de pagamento pretendida. Gera código, salva localmente, mostra tela de sucesso e mensagem pronta para o WhatsApp. Abre pré-selecionado a partir de um serviço, profissional ou promoção.
- **Disponibilidade simulada** (`src/lib/availability.ts`): horário do salão, expediente e dias do profissional, duração do serviço, intervalo entre atendimentos, reservas existentes, bloqueios, antecedência mínima e janela máxima. Nunca permite horário que termine após o fechamento.
- **Área do cliente:** dados cadastrais (editáveis), próximos agendamentos, histórico, detalhes, cancelamento, remarcação, avaliação, pontos de fidelidade com resgate de recompensas, cupons, teste de cupom e consulta de reserva por código + telefone.
- **Painel:** visão geral com indicadores e gráficos; agenda diária (colunas por profissional), semanal e mensal com filtro, bloqueio/desbloqueio de horários; lista de agendamentos com busca, filtros, lembretes e exportação CSV; CRUD de serviços, profissionais, clientes, promoções e cupons; relatórios por período com comparação e CSV; configurações das regras de agendamento e restauração dos dados.
- Alterações do painel refletem imediatamente no site e no agendamento (inclusive entre abas do mesmo navegador).

## Somente demonstrativo

- Reservas, cancelamentos e remarcações existem apenas no `localStorage` deste navegador.
- WhatsApp: apenas abre `wa.me` com mensagem pronta para um **número fictício**; nada é enviado automaticamente.
- Pagamento: só a escolha da forma pretendida e o status fictício; nenhum dado de cartão é solicitado.
- Lembretes: controle manual de status; sem envio automático.
- Área do cliente e painel não têm login; a rota `/admin` **não é segura para produção**.
- Relatórios e faturamento usam dados fictícios gerados a partir da data atual.
- Fotos são de referência (Unsplash) e carregam pela internet; sem conexão, o site mostra um fundo elegante no lugar.

## O que exigiria backend

Banco de dados e API; autenticação e perfis de acesso; bloqueio de horários em tempo real e sincronização entre dispositivos; envio de lembretes por WhatsApp/e-mail; gateway de pagamento; upload de imagens; integração com Instagram e mapas reais; relatórios com dados comerciais reais.

**Ponto de integração:** `src/store/StoreContext.tsx` concentra todas as ações (`createBooking`, `cancelAppointment`, `upsertService`…) e `src/store/storage.ts` faz a leitura/gravação. Basta trocá-los por chamadas HTTP para conectar uma API sem refazer as telas.

## Testes realizados

Fluxos verificados com navegador automatizado (Playwright): agendamento completo, validação de formulários, cupom, horário reservado indisponível, agendamento visível no painel após recarregar, remarcação, cancelamento liberando horário, alteração de preço refletida no site, novo profissional no fluxo, bloqueio de horário, promoção ativa/inativa no site, busca e filtros, cupom expirado, reserva inexistente, menu mobile e ausência de rolagem horizontal no celular — sem erros no console.

---

Desenvolvido pela Results.AG
