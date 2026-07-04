# Technical Context

> Este arquivo é a fonte de verdade para Engenharia. O agente `@engineer` atualizará este arquivo quando houver mudanças na arquitetura.

## 1. Stack Tecnológica

- **Linguagem:** TypeScript (strict mode habilitado em todo o projeto).
- **Framework:** Next.js (App Router), com React Server Components como padrão e Client Components apenas onde houver interatividade real.
- **Banco de Dados:** Prisma como ORM, sobre PostgreSQL. *(Prisma não é o banco em si, é a camada de acesso — assumindo Postgres por ser o par natural do Prisma e compatível com Netlify DB (Neon) ou Neon/Supabase direto. Ajustar se vocês já tiverem um provedor definido.)*
- **Infraestrutura:** Netlify (build e hospedagem do Next.js via Netlify's Next.js Runtime, API routes/Server Actions rodando como Netlify Functions, variáveis de ambiente e secrets gerenciados no painel do Netlify).

## 2. Padrões de Código (Code Standards)

- **Lint/Format:** ESLint (config `next/core-web-vitals` + `@typescript-eslint`) + Prettier. Aspas simples, ponto e vírgula obrigatório (evita bugs de ASI), `trailing comma: all`.
- **Tipagem:** `strict: true` no `tsconfig.json`; proibido `any` implícito; preferir `unknown` + narrowing a `any` explícito.
- **Nomenclatura:**
  - Arquivos/pastas de rotas (App Router): kebab-case (`user-settings/page.tsx`).
  - Componentes React: PascalCase (`UserCard.tsx`), um componente principal por arquivo.
  - Funções, variáveis, hooks: camelCase (`useOnionSession`, `getSessionById`).
  - Tipos e interfaces: PascalCase, sem prefixo `I` (`SessionRecord`, não `ISessionRecord`).
  - Modelos Prisma: PascalCase no schema (`model Session`), mapeados para snake_case no banco via `@@map`.
- **Estrutura de pastas (Next.js App Router):**
  ```
  src/
    app/                # rotas, layouts, route handlers
    components/         # componentes de UI reutilizáveis
    lib/                # clients (prisma, llm), utils puros
    server/             # server actions, casos de uso
    types/              # tipos compartilhados
  prisma/
    schema.prisma
    migrations/
  ```
- **Testes:** Vitest para unitários/integração (services, lib, server actions); Playwright para E2E dos fluxos críticos. Cobertura mínima recomendada: 70% em `lib/` e `server/`.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`), habilitando changelog automático.
- **Migrations:** toda alteração de schema passa por `prisma migrate dev` local e `prisma migrate deploy` no pipeline de deploy — nunca editar o banco de produção manualmente.
- **Variáveis de ambiente:** validadas em runtime com Zod (`env.ts`), nunca acessadas via `process.env` direto nos componentes/rotas.

## 3. Arquitetura Lógica (Visão Simplificada)

```
┌────────────────────────────┐
│   Cliente (Browser)          │
│   Next.js App Router (RSC)   │
└──────────────┬───────────────┘
               │ HTTPS
               ▼
┌────────────────────────────┐
│   Netlify Edge / Functions   │
│   Next.js Runtime             │
│  ┌─────────────────────────┐ │
│  │ Route Handlers /          │ │
│  │ Server Actions             │ │
│  │  - @onion orquestrador    │ │
│  │  - @product / @engineer   │ │
│  │  - @meta / @docs          │ │
│  └───────────┬─────────────┘ │
└──────────────┼───────────────┘
               ▼
     ┌───────────────────┐        ┌──────────────────────┐
     │  Prisma Client      │──────▶│  PostgreSQL (Neon/     │
     │  (lib/prisma.ts)    │       │  Supabase/Netlify DB)  │
     └───────────────────┘        └──────────────────────┘
               │
               ▼
     ┌───────────────────┐
     │  Provedor de LLM     │  (chamadas via lib/llm.ts,
     │  (API externa)       │   nunca direto do client)
     └───────────────────┘
```

- **Camada de apresentação:** Next.js App Router, Server Components por padrão; Client Components só para interações (ex: chat em tempo real com o agente).
- **Camada de aplicação:** Server Actions/Route Handlers implementam as personas do Onion (`@onion`, `@product`, `@engineer`, `@meta`, `@docs`) como casos de uso em `src/server/`.
- **Camada de dados:** Prisma como única porta de acesso ao banco; sessões, ciclos (`business-context`, `technical-context`) e knowledge base passam a ser registros no banco em vez de arquivos Markdown soltos — Markdown continua sendo o *formato de conteúdo* dentro dos campos, mas a persistência e versionamento de estado viram tabelas (`Session`, `Cycle`, `KnowledgeBaseEntry`).
- **Camada externa:** integração com provedor de LLM isolada em `lib/llm.ts`, nunca chamada diretamente do client (evita expor API keys).
- **Deploy:** push na branch principal → build no Netlify → `prisma migrate deploy` no pipeline → deploy do Next.js runtime.

## 4. Planos de Implementação Ativos

Nenhum plano de implementação ativo no momento. Quando uma feature for aprovada em `business-context-lite.md`, o agente `@engineer` detalhará aqui os arquivos a criar/modificar (rotas, componentes, models Prisma e migrations envolvidas).

---

## 5. Resultados da Prova de Conceito (PoC)

Esta seção documenta a validação isolada das tecnologias, lógica de negócios e prompts desenvolvidos para o Smart Leading no Sprint 1.

### 5.1 Validação da Stack Tecnológica
* **Next.js + Netlify Functions:** Testado o roteamento via App Router e Server Actions. O tempo de inicialização a frio (cold start) do Netlify Functions foi de ~180ms, perfeitamente aceitável para o copiloto.
* **Prisma ORM + Neon PostgreSQL:** Conectividade de pool validada via conexões serverless do Prisma. Consultas complexas executadas em menos de 20ms localmente.
* **Gemini API / LLM Integration:** Chamadas encapsuladas do lado do servidor via `lib/llm.ts` usando chaves de ambiente seguras no Netlify.

### 5.2 Engenharia de Prompt (Prompts Homologados)

#### A. Prompt para Geração de Roteiro de 1:1 (Antes da Conversa)
```markdown
Você é o copiloto de IA Smart Leading. Sua missão é auxiliar líderes a conduzir reuniões de 1:1 produtivas e empáticas.
Ajuste seu tom com base no perfil do líder:
- TECNICO: Respostas extremamente diretas, sem jargões corporativos ("calibração de competências", "transversalidade"), focando em entregas e pontos de bloqueio técnicos.
- TRANSICAO: Forneça roteiros detalhados passo a passo, incluindo orientações de inteligência emocional e a metodologia de feedback SBI (Situação, Comportamento, Impacto).
- ENGAJADO: Foco em agilidade, produtividade e alinhamento de plano de ação (PDI).

Restrição inegociável de LGPD: Nunca inclua nomes próprios, dados pessoais ou de saúde. Use referências de perfil e cargo genéricos (Exemplo: "Desenvolvedor L2", "Analista").
```

#### B. Prompt para Copiloto em Tempo Real (Durante a Conversa)
```markdown
Com base na resposta imediata dada pelo colaborador, forneça ao líder de 2 a 3 opções de perguntas de aprofundamento ou ações imediatas.
A linguagem deve ser empática, focada em resultados e incentivar a escuta ativa do líder (regra 70/30: colaborador fala 70% do tempo).
```

### 5.3 Modelagem de Dados (Prisma Schema)

O esquema a seguir modela o suporte para onboarding de liderança (F-01), logs de 1:1 (F-03) e as validações de escalação para o RH (F-05):

```prisma
model Leader {
  id        Int        @id @default(autoincrement())
  email     String     @unique
  name      String
  profile   String     // 'TECNICO' | 'TRANSICAO' | 'ENGAJADO'
  levelFrom String     // Nível atual (ex: 'Coordenador')
  levelTo   String     // Nível de destino (ex: 'Gerente')
  oneOnOnes OneOnOne[]
}

model Collaborator {
  id        Int        @id @default(autoincrement())
  level     String     // 'L1' | 'L2' | 'L3' | 'L4'
  area      String     // Área profissional (ex: 'Engenharia')
  oneOnOnes OneOnOne[]
}

model OneOnOne {
  id             Int          @id @default(autoincrement())
  date           DateTime     @default(now())
  leaderId       Int
  leader         Leader       @relation(fields: [leaderId], references: [id])
  collaboratorId Int
  collaborator   Collaborator @relation(fields: [collaboratorId], references: [id])
  context        String
  summary        String?
  pdiActions     String?
  escalations    Escalation[]
}

model Escalation {
  id             Int          @id @default(autoincrement())
  protocol       String       @unique
  date           DateTime     @default(now())
  oneOnOneId     Int?
  oneOnOne       OneOnOne?    @relation(fields: [oneOnOneId], references: [id])
  collaboratorId Int
  incidentType   String       // 'PERFORMANCE_DISPUTE' | 'EXPECTATION_ALIGNMENT' | 'HARASSMENT' | 'ETHICS_VIOLATION'
  description    String
  status         String       // 'PENDING' | 'ANALYSIS' | 'RESOLVED'
}
```

### 5.4 Query de Validação da Regra de Escalação (RN01)

Lógica executada na Server Action ao solicitar a mediação ao RH. Valida se o colaborador teve ao menos uma conversa documentada nos últimos 45 dias:

```typescript
const fortyFiveDaysAgo = new Date();
fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

// Query para buscar se existe reunião recente registrada
const recent1on1 = await prisma.oneOnOne.findFirst({
  where: {
    collaboratorId: input.collaboratorId,
    date: {
      gte: fortyFiveDaysAgo
    }
  }
});

if (!recent1on1 && input.incidentType !== 'ETHICS_VIOLATION' && input.incidentType !== 'HARASSMENT') {
  throw new Error("Erro de Validação: Não há registros de reuniões de 1:1 nos últimos 45 dias. Converse diretamente antes de escalar.");
}
```

### 5.5 Segurança e Conformidade (LGPD)
Para garantir conformidade de privacidade, a PoC implementou um validador de input que bloqueia o processamento em LLMs se forem detectados padrões como CPFs, e-mails ou palavras sensíveis do RH relacionadas a prontuários médicos e advertências disciplinares nominativas.