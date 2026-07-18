# SyncHR — Smart Leading · Clear IT Brasil

> Copiloto de IA para calibração de lideranças e reuniões individuais (1:1) com auditoria bilateral inteligente.

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura Tecnológica](#2-arquitetura-tecnológica)
3. [Banco de Dados (Supabase)](#3-banco-de-dados-supabase)
4. [Estrutura de Código](#4-estrutura-de-código)
5. [Guias de Uso e Jornadas](#5-guias-de-uso-e-jornadas)
6. [Integração de E-mails](#6-integração-de-e-mails-pipedream)
7. [Instalação e Execução](#7-instalação-e-execução)
8. [Roadmap — Features Não Implementadas](#8-roadmap--features-não-implementadas)

---

## 1. Visão Geral

O **SyncHR (Smart Leading)** é uma plataforma web corporativa criada para a **Clear IT Brasil** com o objetivo de estruturar reuniões de 1:1 e calibrar lideranças através de Inteligência Artificial (Google Gemini 2.5 Flash).

### Pilares do Sistema

| Pilar | Descrição |
|---|---|
| **Onboarding de Liderança** | Calibração do perfil do gestor (Técnico, Em Transição, Engajado) para personalizar os prompts da IA |
| **Onboarding DISC do Liderado** | Quiz comportamental compulsório que determina o perfil DISC do colaborador |
| **Copiloto de IA para 1:1** | Geração de pautas customizadas cruzando o perfil do líder com o DISC e nível do liderado |
| **Assinatura Bilateral & Auditoria** | Ambos inserem percepções; a IA calcula consistência e gera protocolos de conflito automáticos |
| **Painel de Governança RH** | Central de métricas, mediação de conflitos, cadastro de líderes e liderados |

### Objetivos Estratégicos

- Reverter queda de eNPS na dimensão **"Liderança e Confiança"** (pesquisa de clima 2025/2026)
- Conectar gestores e colaboradores distribuídos em **Manaus, SP, BSB, RJ, SSA e SC**
- Eliminar o "improviso sistemático" e registros perdidos de reuniões
- Apoiar líderes em conversas difíceis e elaboração de PDIs assertivos

---

## 2. Arquitetura Tecnológica

```
Browser (Next.js 14)
    │
    ├──► Supabase Auth + PostgreSQL      (Auth, CRUD, RLS)
    ├──► Next.js API Route Handlers      (Lógica server-side)
    │         ├──► Gemini 2.5 Flash API  (Roteiro, Avaliação, Chat)
    │         └──► Pipedream Webhooks    (E-mails transacionais)
    └──► localStorage (fallback offline)
```

### Stack Principal

| Camada | Tecnologia |
|---|---|
| **Frontend** | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| **Backend** | Next.js Route Handlers (serverless) |
| **Banco de Dados** | Supabase (PostgreSQL + Auth + RLS) |
| **IA Generativa** | Google Gemini 2.5 Flash |
| **E-mails** | Pipedream Webhooks (via `/api/send-email`) |
| **UI** | SweetAlert2, Lucide React |

---

## 3. Banco de Dados (Supabase)

### `profiles`
Usuários administrativos e gestores do sistema.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | Vinculado ao `auth.users` do Supabase |
| `email` | text | E-mail corporativo |
| `name` | text | Nome completo |
| `role` | text | `RH`, `LEADER`, `COLLABORATOR` |
| `profile_type` | text | `TECNICO`, `TRANSICAO`, `ENGAJADO`, `PENDENTE`, `ADMINISTRADOR` |
| `level_from` / `level_to` | text | Faixa de cargo |

### `collaborators`
Base de liderados.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | Identificador único |
| `name` | text | Nome completo |
| `email` | text | E-mail do liderado |
| `disc` | text | `DOMINANTE`, `ESTAVEL`, `ANALITICO`, `INFLUENTE`, `PENDENTE` |
| `level` | text | Senioridade: `L1`, `L2`, `L3`, `L4` |
| `role` | text | Cargo/função |
| `leader_id` | uuid FK | Referência para `profiles.id` |

### `one_on_ones`
Reuniões e atas bilaterais.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | Identificador |
| `leader_id` | uuid FK | Autor/Gestor |
| `collaborator_id` | uuid FK | Colaborador |
| `date` | text | Data da reunião |
| `type` | text | Tipo de pauta |
| `script_text` | text | Roteiro gerado pela IA |
| `raw_leader_notes` | text | Anotações do gestor |
| `raw_collaborator_notes` | text | Percepção do liderado |
| `leader_approved` | boolean | Assinatura do líder |
| `collaborator_approved` | boolean | Assinatura do colaborador |
| `consistency_result` | jsonb | Score de alinhamento e parecer da IA |

### `conflicts`
Protocolos de desalinhamento severo para mediação do RH.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | Identificador |
| `protocol` | text | Código único `SHR-2026-XXXXXX` |
| `one_on_one_id` | uuid FK | Reunião de origem |
| `collaborator_id` | uuid FK | Colaborador afetado |
| `severity` | text | `CRITICAL` ou `WARNING` |
| `status` | text | `PENDING`, `IN_INVESTIGATION`, `RESOLVED` |
| `notes` | text | Notas de mediação do RH |

---

## 4. Estrutura de Código

```
src/
├── app/
│   ├── api/
│   │   ├── chat/              # Chat live assist (Gemini API)
│   │   ├── create-user/       # Criação de usuários via Admin SDK
│   │   ├── delete-user/       # Exclusão de usuários do Supabase Auth
│   │   ├── evaluate/          # Auditoria bilateral e detecção de conflitos (Gemini)
│   │   ├── generate-script/   # Geração de roteiro 1:1 (Gemini)
│   │   ├── inbound/           # Processamento de e-mails inbound
│   │   ├── send-email/        # Dispatcher de e-mails (Pipedream webhook)
│   │   └── sync/              # Sincronização de reuniões com o banco
│   ├── feedback/              # Página de assinatura bilateral do liderado
│   ├── login/                 # Autenticação (e-mail/senha + Google OAuth)
│   ├── onboarding-liderado/   # Quiz DISC obrigatório para novos liderados
│   └── privacidade/           # Política de privacidade (LGPD)
│
├── components/
│   ├── AboutSection.tsx       # Tela inicial contextual por perfil
│   ├── ConflictSection.tsx    # Central de mediação e escalação
│   ├── CopilotoSection.tsx    # Stepper completo de 1:1 (pautas + roteiro + ata)
│   ├── HistorySection.tsx     # Gestão de atas e assinaturas digitais
│   ├── InteractiveSimulator.tsx # Simulador DISC interativo
│   ├── LeaderOnboarding.tsx   # Calibração inicial do perfil do líder
│   ├── MarkdownRenderer.tsx   # Parser de markdown para roteiros da IA
│   ├── RHPanel.tsx            # Painel de governança do RH
│   └── Sidebar.tsx            # Navegação lateral responsiva
│
├── lib/
│   ├── emailService.ts        # Abstração central de todos os e-mails
│   ├── gemini.ts              # Conector com Google Gemini API
│   ├── google-calendar.ts     # Integração Google Calendar / Meet
│   ├── storage.ts             # Gerenciador híbrido (Supabase + localStorage)
│   ├── supabase.ts            # Cliente Supabase configurado
│   └── utils.ts               # Utilitários (cn, formatadores)
│
└── types/
    └── index.ts               # Interfaces compartilhadas do sistema
```

---

## 5. Guias de Uso e Jornadas

### 💼 A. Jornada do Líder / Gestor

1. **Login** → Acesse `/login` e clique no atalho **Líder Teste** (`lider.teste@clearit.com.br`)
2. **Onboarding** → Selecione o cargo, responda 3 perguntas de calibração. A IA categoriza o perfil: `TÉCNICO`, `EM TRANSIÇÃO` ou `ENGAJADO`
3. **Copiloto 1:1** → Selecione o liderado, tipo de reunião e contexto → clique em **Gerar Roteiro com IA**
4. **Salvar Ata** → Registre notas pós-reunião e clique em **Salvar e Enviar para Assinatura** (dispara e-mail para o liderado via Pipedream)

### 👥 B. Jornada do Liderado

1. **Login** → Atalho **Liderado Teste** (`liderado.teste@clearit.com.br`)
2. **Onboarding DISC** → Perfil `PENDENTE` redireciona para `/onboarding-liderado` (quiz de 4 perguntas)
3. **Assinatura** → Em **Atas & Histórico**, localize a ata pendente, insira seu feedback e assine digitalmente
4. **Auditoria IA** → Ao assinar, a IA avalia o alinhamento bilateral e pode gerar um protocolo de conflito automaticamente

### 🛡️ C. Jornada do RH

1. **Login** → Atalho **Priscila Bacelar (RH)** (`rh.priscila@clearit.com.br`)
2. **Governança** → Monitore métricas, atas registradas e alertas de conflito
3. **Cadastros** → Crie líderes (com e-mail automático de boas-vindas) e liderados (iniciam em `PENDENTE`)
4. **Mediação** → Na central de alertas, altere status de conflitos, registre notas de mediação e finalize casos

---

## 6. Integração de E-mails (Pipedream)

Todos os disparos de e-mail são centralizados em `src/lib/emailService.ts` e roteados via `/api/send-email`.

| Evento | Destinatário | Trigger |
|---|---|---|
| Boas-vindas ao Líder | Líder cadastrado | RH cria novo líder |
| Convite de Reunião Meet | Liderado | Líder gera roteiro com link |
| Solicitação de Assinatura | Liderado | Líder salva a ata |
| Alerta de Conflito | RH (Priscila) | IA detecta desalinhamento severo |

---

## 7. Instalação e Execução

### Pré-requisitos
- Node.js ≥ 18
- Conta no [Supabase](https://supabase.com)
- Chave da [Gemini API](https://aistudio.google.com)

### Variáveis de Ambiente

Crie `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://sua-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

GEMINI_API_KEY=sua-chave-gemini
```

### Comandos

```bash
# Instalar dependências
npm install

# Desenvolvimento local (http://localhost:3000)
npm run dev

# Verificação estática de tipos e lints
npm run lint

# Build de produção
npm run build

# Sincronizar schema do banco com o Supabase
node scratch/setup-supabase.js
```

---

## 8. Roadmap — Features Não Implementadas

> Features identificadas na análise do MVP que agregar valor significativo ao produto.

---

### 🔄 A. Integração com a API da Sólides

**Situação atual:** O perfil DISC é coletado via quiz interno de 4 perguntas no onboarding do liderado.

**Feature proposta:** Webhook de sincronização com o ecossistema **Sólides HR** para importar automaticamente os perfis comportamentais tão logo o colaborador conclua o teste Profiler oficial. Elimina o quiz interno e garante dados comportamentais certificados.

---

### 📅 B. Agendamento Real no Google Calendar

**Situação atual:** A geração de link do Google Meet é simulada no frontend via `google-calendar.ts` (autenticação local no navegador, não persiste tokens).

**Feature proposta:** Microsserviço backend com conta de serviço do Google Workspace (OAuth server-to-server) para criar eventos reais no Google Calendar dos participantes, gerar salas de Google Meet autenticadas e enviar convites diretamente para os e-mails corporativos, sem interação do líder com o fluxo de consentimento.

---

### 📊 C. Exportação de Relatórios Executivos (PDF/XLS)

**Situação atual:** O painel RH exibe métricas em tempo real (volume de 1:1s, eNPS estimado, conflitos abertos), mas sem nenhuma opção de exportação.

**Feature proposta:**
- Exportação de relatórios em **PDF** e **Excel** via `pdfkit` / `exceljs`
- Relatórios agregados: adesão de líderes, tendências de eNPS, frequência de conflitos por equipe
- Filtros por período, gestor e departamento
- Geração assíncrona com notificação por e-mail ao RH quando o arquivo estiver pronto

---

### 🧠 D. Análise de Sentimento Avançada (NLP)

**Situação atual:** A auditoria da IA avalia concordância de tópicos e keywords entre as notas do líder e do liderado.

**Feature proposta:** Integrar modelos de PLN (ex: Google Cloud Natural Language API ou modelo Gemini especializado) para:
- Calcular **índice de desgaste emocional** a partir do texto do feedback do liderado
- Detectar padrões de estresse recorrente e alertar o RH com antecedência (alerta precoce de turnover)
- Gerar um **eNPS estimado individual** por colaborador com base em histórico de atas

---

### 🔔 E. Notificações Push e Lembretes Automáticos

**Situação atual:** Nenhum sistema de lembretes ativo. O líder precisa acessar a plataforma para ver atas pendentes.

**Feature proposta:**
- **Web Push Notifications** via Service Worker para alertar sobre atas pendentes de assinatura
- Lembretes automáticos para líderes que não realizaram 1:1 nos últimos 15 dias (via Pipedream cron)
- Dashboard de alertas de SLA: liderados sem feedback há mais de 30 dias entram em destaque no painel RH

---

### 📱 F. Aplicativo Mobile (PWA ou React Native)

**Situação atual:** Interface responsiva para desktop e mobile via browser, sem suporte a recursos nativos do dispositivo.

**Feature proposta:**
- Transformar o SyncHR em **Progressive Web App (PWA)** com suporte a instalação na tela inicial do celular e funcionamento offline parcial
- Ou desenvolver app nativo com **React Native + Expo**, aproveitando o backend existente e adicionando suporte a notificações push nativas, gravação de áudio da reunião e transcrição automática offline

---

### 🎙️ G. Transcrição Automática de Reuniões (Speech-to-Text)

**Situação atual:** O campo `transcription` existe na tabela `one_on_ones`, mas é preenchido manualmente pelo líder ou via `/api/inbound` com transcrições externas.

**Feature proposta:**
- Integrar **Google Speech-to-Text API** ou **Whisper (OpenAI)** para transcrever gravações de áudio da reunião diretamente na plataforma
- Processar a transcrição com a IA para extrair automaticamente: combinados, próximos passos, itens bloqueados e plano de ação (Kanban)
- Reduzir o esforço manual do líder ao registrar a ata pós-reunião

---

### 🔐 H. Autenticação Multi-Fator (MFA)

**Situação atual:** Autenticação via e-mail/senha e Google OAuth sem segundo fator.

**Feature proposta:** Ativar o suporte a **TOTP (Time-based One-Time Password)** já disponível no Supabase Auth para perfis com papel `RH` e `LEADER`. Protege o acesso a dados sensíveis de feedback e conflitos, reforçando o compliance com a **LGPD**.

---

### 📋 I. Templates Personalizáveis de Ata

**Situação atual:** A estrutura de roteiro é gerada dinamicamente pela IA, mas não existe uma biblioteca de templates fixos que o líder possa reutilizar ou personalizar.

**Feature proposta:**
- Criar uma biblioteca de **templates de ata** por tipo de reunião (PDI, Feedback Positivo, Alinhamento de Meta, Retorno de Licença)
- O RH pode aprovar, criar e versionar templates corporativos
- O líder seleciona o template antes de acionar a IA, que o usa como base estrutural do roteiro

---

### 🔗 J. Integração com Ferramentas de Produtividade

**Situação atual:** O Kanban de tarefas existe dentro do SyncHR mas é isolado.

**Feature proposta:** Sincronização bidirecional dos itens de ação (Kanban) da ata com:
- **Jira** (criação automática de issues via Jira REST API)
- **Trello** (criação de cards no quadro do líder)
- **Notion** (criação de páginas de reunião no workspace da equipe)
- **Azure DevOps** (vinculação de work items para times de desenvolvimento)

---

### 📈 K. Painel de Evolução do Colaborador (Timeline)

**Situação atual:** O histórico de atas existe e pode ser consultado, mas não há visualização de evolução temporal do colaborador.

**Feature proposta:**
- **Timeline visual** do colaborador mostrando a evolução do score de alinhamento ao longo das reuniões
- Gráfico de **tendência de engajamento** por liderado
- Indicador de frequência de 1:1s com SLA semafórico (verde/amarelo/vermelho)
- Visível para o líder (seu time) e para o RH (toda a organização)

---

### 🌐 L. Suporte a Multi-Idiomas (i18n)

**Situação atual:** Interface 100% em português brasileiro.

**Feature proposta:** Implementar **internacionalização (i18n)** com `next-intl` para suportar inglês e espanhol. Relevante para líderes que gerenciam times internacionais ou para expansão da plataforma para outras empresas do grupo.

---

### 🎯 M. Assessment DISC Adaptativo

**Situação atual:** O quiz de onboarding do liderado é composto por 4 perguntas fixas e sequenciais, sem lógica de adaptação ao perfil emergente.

**Feature proposta:**
- Quiz com **lógica de ramificação** — as próximas perguntas se adaptam com base nas respostas anteriores, convergindo mais rápido para o perfil real do colaborador
- Banco de **30+ questões categorizadas** por dimensão DISC (Dominância, Influência, Estabilidade, Conformidade)
- **Score de confiança** do perfil detectado (ex: "85% Analítico, 12% Estável") exibido ao RH
- Permite reavaliação periódica do perfil sem refazer todo o onboarding

---

### 🤝 N. Colaboração em Tempo Real

**Situação atual:** A plataforma é single-user por sessão. Não existe co-edição simultânea de atas, roteiros ou planos de ação.

**Feature proposta:**
- **Co-edição em tempo real** de atas via **Supabase Realtime** (WebSockets nativos já disponíveis na stack), permitindo que líder e liderado preencham a ata simultaneamente durante a reunião
- **Cursores colaborativos** identificados por nome/avatar para cada participante ativo
- **Histórico de alterações** por usuário com timestamp, garantindo rastreabilidade e auditoria (relevante para compliance LGPD)
- Notificação em tempo real ao liderado quando o líder inicia uma nova ata pendente de assinatura

---

### 📚 O. Base de Conhecimento de Liderança

**Situação atual:** Os prompts da IA são configuráveis via painel admin, mas não existe uma biblioteca de boas práticas acessível pelos líderes.

**Feature proposta:**
- **Biblioteca curada de metodologias** de gestão de pessoas: SBI (Situação-Comportamento-Impacto), GROW, OKR, feedback radical (Radical Candor), conversas difíceis
- Artigos e guias contextualizados **sugeridos automaticamente pela IA** de acordo com o perfil DISC do liderado e o tipo de reunião
- **Histórico de aprendizado** do líder: quais guias foram acessados, quais abordagens estão sendo mais utilizadas
- Alimentada pelo RH com conteúdos corporativos internos da Clear IT

---

### 🏢 P. Plataforma SaaS Multiempresa

**Situação atual:** O SyncHR é uma aplicação single-tenant configurada exclusivamente para a Clear IT Brasil.

**Feature proposta:**
- Arquitetura **multi-tenant** com isolamento de dados por organização (schema separado ou RLS por `org_id` no Supabase)
- **Painel de administração global** para onboarding de novas empresas clientes, configuração de marca (logo, cores) e limites de usuários
- **Planos de assinatura** (ex: Starter → Growth → Enterprise) com limites de líderes, liderados e integrações ativas
- Capacidade de **white-label** do produto, permitindo que outras empresas do grupo ou parceiros utilizem sob sua própria marca

---

### 🤖 Q. Motor de Recomendações e PDI Automatizado

**Situação atual:** A IA gera roteiros e detecta conflitos, mas não propõe planos de desenvolvimento estruturados baseados no histórico acumulado do colaborador.

**Feature proposta:**
- **Análise histórica automatizada**: após N reuniões registradas, a IA identifica padrões recorrentes de bloqueio, pontos fortes consistentes e lacunas de desenvolvimento do liderado
- **PDI gerado automaticamente** (Plano de Desenvolvimento Individual) com metas SMART, prazo sugerido e recursos de aprendizado da base de conhecimento (feature O)
- **Recomendações proativas ao líder** antes de cada 1:1: "Com base nas últimas 3 reuniões com Ana, considere abordar autonomia em decisões técnicas"
- **Score de progresso de PDI** visível no painel RH, com alertas automáticos caso o colaborador não avance nas metas definidas
