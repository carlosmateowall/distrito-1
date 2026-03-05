

## Análise: O que falta do spec vs. o que já está implementado

### Implementado (MVP completo)

| Seção | Status |
|-------|--------|
| **01 — Treino** | Dashboard semanal, execução com timer, histórico com PRs e calendário, geração por IA |
| **02 — Dieta** | Plano alimentar por IA, 6 refeições/dia, macros, marcar refeições, disclaimer legal |
| **03 — Agenda** | Lista de eventos, filtro por tipo, confirmação de presença, detalhe com Google Calendar/Maps/WhatsApp |
| **04 — Checklist** | 3 protocolos (9 itens), streak, confetti, badges, ranking semanal |
| **05 — Comunidade** | Ranking, membros com filtro por cidade, grupos WhatsApp (placeholder), feed de vitórias |
| **Perfil** | Avatar, streak, badges, stats, editar perfil, logout |
| **Admin** | Criar/deletar eventos, acesso restrito por role |
| **Onboarding** | Quiz de 4 passos + cidade + restrições |
| **Gamificação** | Streak diário, badges (7/21/30/60/100), ranking semanal, celebração visual |

---

### O que falta ou está parcialmente implementado

**1. Dashboard — Treino de Hoje (dados reais)**
O componente `TodayWorkout` usa dados hardcoded ("PEITO + TRÍCEPS", status "pendente"). Deveria buscar o treino real do dia atual no banco.

**2. Dashboard — Próximo Evento (dados reais)**
O componente `NextEvent` é totalmente estático (hardcoded "MEETUP DISTRITO 1%"). Deveria buscar o próximo evento real do Supabase.

**3. Dashboard — Devocional do Dia**
O devocional é estático (sempre "Filipenses 4:13"). O spec menciona "card de devocional da home — marca ao abrir" vinculado ao checklist. A marcação como "lido" não persiste no banco e não atualiza o item `devocional_lido` do checklist.

**4. Dieta — Macro bars com cores fora da paleta**
As barras de Proteína (blue-400), Carbs (amber-400) e Gordura (rose-400) usam cores fora da paleta dourada. Segundo a diretriz visual, tudo deveria ser em tons de dourado/neutro.

**5. Agenda — Tipo badges com cores fora da paleta**
`TYPE_CONFIG` usa verde, roxo e azul para os tipos de eventos. Mesma questão de paleta.

**6. Treino — Sem opção de regenerar**
Não há botão para regenerar o treino da semana caso o usuário queira um novo plano.

**7. Checklist — Deveres customizáveis (V2)**
O spec menciona que admin pode adicionar deveres extras e usuário pode adicionar 1 pessoal. Não implementado (aceitável como V2).

**8. Loja (Seção 06) — Não implementada**
Marcada como V2 no spec, então aceitável não ter.

**9. PWA / manifest.json**
O spec pede que funcione como PWA. Não há `manifest.json` nem service worker.

**10. Push Notifications**
Mencionado no spec para eventos (24h e 1h antes) e checklist (6h). Não implementado.

**11. Skeleton loaders com shimmer dourado**
A classe `skeleton-gold` foi criada no CSS mas a maioria das páginas usa texto "CARREGANDO..." em vez de skeletons. Apenas Admin, Comunidade e Perfil usam skeletons.

**12. Nome no cadastro**
A página de Login/Cadastro deveria pedir o nome do usuário no signup para que o perfil tenha um nome real desde o início. Atualmente o `handle_new_user` trigger só salva email.

---

### Resumo de prioridades para completar o MVP

| Prioridade | Item |
|-----------|------|
| Alta | Dashboard: buscar treino de hoje e próximo evento reais do banco |
| Alta | Dashboard: devocional marcar como lido → persistir no checklist |
| Alta | Cadastro: pedir nome no signup |
| Média | Corrigir cores fora da paleta (dieta macros, agenda type badges) |
| Média | Skeleton loaders em todas as páginas (trocar "CARREGANDO..." por skeleton-gold) |
| Média | PWA manifest.json + ícones |
| Baixa | Botão regenerar treino |
| Baixa | Push notifications (requer serviço externo) |
| V2 | Loja, deveres customizáveis, perfil público compartilhável |

Quer que eu implemente os itens de alta e média prioridade?

