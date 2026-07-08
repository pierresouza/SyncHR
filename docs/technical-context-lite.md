# Technical Context

> Este arquivo é a fonte de verdade para Engenharia. O agente `@engineer` atualizará este arquivo quando houver mudanças na arquitetura.

## 1. Stack Tecnológica

- **Linguagem:** TypeScript (strict mode habilitado em todo o projeto).
- **Framework:** Next.js (App Router) rodando no cliente para interatividade fluida da interface.
- **Armazenamento de Dados:** Dados mockados localmente persistidos no `localStorage` do navegador, eliminando dependências de servidores ou serviços de banco de dados externos ativos para máxima portabilidade.
- **Infraestrutura:** Netlify para build e hospedagem estática, permitindo a execução offline do dashboard.

## 2. Padrões de Código (Code Standards)

- **Lint/Format:** ESLint (config `next/core-web-vitals` + `@typescript-eslint`) + Prettier. Aspas simples, ponto e vírgula obrigatório (evita bugs de ASI), `trailing comma: all`.
- **Tipagem:** `strict: true` no `tsconfig.json`; proibido `any` implícito; preferir `unknown` + narrowing a `any` explícito.
- **Nomenclatura:**
  - Arquivos/pastas de rotas (App Router): kebab-case (`user-settings/page.tsx`).
  - Componentes React: PascalCase (`UserCard.tsx`), um componente principal por arquivo.
  - Funções, variáveis, hooks: camelCase (`useOnionSession`, `getSessionById`).
  - Tipos e interfaces: PascalCase, sem prefixo `I` (`SessionRecord`, não `ISessionRecord`).
  - Modelos no LocalStorage: PascalCase/camelCase mapeados para JSON de forma estruturada.
- **Estrutura de pastas (Next.js App Router):**
  ```
  src/
    app/                # rotas, layouts, route handlers
    components/         # componentes de UI reutilizáveis
    lib/                # clients (local storage wrappers, llm), utils puros
    server/             # casos de uso e mocks locais
    types/              # tipos compartilhados
  ```
- **Testes:** Vitest para unitários/integração (validador de dados, mocks); Playwright para E2E dos fluxos críticos de onboarding e segurança. Cobertura mínima recomendada: 70%.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`), habilitando changelog automático.
- **Variáveis de ambiente:** validadas em runtime com Zod (`env.ts`), nunca acessadas via `process.env` direto nos componentes/rotas.

## 3. Arquitetura Lógica (Visão Simplificada)

```
┌────────────────────────────────────────────────────────┐
│                      Cliente (Browser)                 │
│                                                        │
│   ┌────────────────────────────────────────────────┐   │
│   │             Interface (Next.js components)     │   │
│   └───────────────────────┬────────────────────────┘   │
│                           │ Leitura/Escrita            │
│                           ▼                            │
│   ┌────────────────────────────────────────────────┐   │
│   │   Mock Storage Manager (lib/storage.ts)        │   │
│   └───────────────────────┬────────────────────────┘   │
│                           │ Criptografia/Persistência  │
│                           ▼                            │
│   ┌────────────────────────────────────────────────┐   │
│   │       LocalStorage / SessionStorage Mocks      │   │
│   └────────────────────────────────────────────────┘   │
└───────────────────────────┬────────────────────────────┘
                            │ Chamada de API Segura
                            ▼
                  ┌───────────────────┐
                  │  Provedor de LLM  │  (chamadas via lib/llm.ts,
                  │  (API externa)    │   nunca direto do client)
                  └───────────────────┘
```

- **Camada de apresentação:** Next.js App Router, Server Components por padrão; Client Components só para interações (ex: chat em tempo real com o agente).
- **Camada de aplicação:** Mocks locais implementam as personas do Onion (`@onion`, `@pm`, `@frontend`, `@backend`, `@security`, `@testing`, `@validator`) como casos de uso em `src/server/`.
- **Camada de dados:** `lib/storage.ts` gerencia de forma segura as gravações e leituras em strings serializadas em JSON no `localStorage`.
- **Camada externa:** integração com provedor de LLM isolada em `lib/llm.ts`, nunca chamada diretamente do client (evita expor API keys).
- **Deploy:** push na branch principal → build no Netlify → deploy da aplicação estática e funções edge.

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

### 5.3 Modelagem de Dados (Estrutura LocalStorage JSON)

O estado da aplicação é armazenado e persistido de forma estruturada no `localStorage` do navegador utilizando as seguintes chaves de dados:

#### A. Chave `synchr_leader_profile` (Perfil do Líder Logado)
```json
{
  "id": 1,
  "email": "lider.tech@clearit.com.br",
  "name": "Gestor Principal",
  "profile": "TRANSICAO",
  "levelFrom": "Coordenador",
  "levelTo": "Gerente"
}
```

#### B. Chave `synchr_collaborators` (Lista de Liderados com DISC)
```json
[
  {
    "id": 101,
    "name": "Colaborador A",
    "level": "L2",
    "area": "Engenharia",
    "disc": "S",
    "notes": "Estável. Prefere segurança e orientações claras de processo.",
    "feedbackHistory": [
      "Sobrecarga de prazos sinalizada na sprint passada."
    ]
  }
]
```

#### C. Chave `synchr_one_on_ones` (Ata e Transcrições de 1:1)
```json
[
  {
    "id": 1001,
    "date": "2026-06-25T14:00:00Z",
    "leaderId": 1,
    "collaboratorId": 101,
    "context": "Atrasos em entregas devido a sobrecarga.",
    "transcription": "Colaborador: Estou muito sobrecarregado... Líder: Entendo, vamos reajustar.",
    "summary": "Colaborador expressou sobrecarga. Acordado fatiar demandas.",
    "pdiActions": "Organizar backlog semanalmente com o líder.",
    "aiEvaluation": "O roteiro gerado foi bem aproveitado...",
    "nextSuggestions": [
      "Acompanhar o progresso do fatiamento das tarefas"
    ]
  }
]
```

#### D. Chave `synchr_conflicts` (Conflitos Detectados/Escalados)
```json
[
  {
    "id": 501,
    "protocol": "SHR-2026-1049",
    "date": "2026-06-25T14:30:00Z",
    "oneOnOneId": 1001,
    "collaboratorId": 101,
    "incidentType": "PERFORMANCE_DISPUTE",
    "description": "Atrito por conta de sobrecarga sistemática na equipe.",
    "status": "RESOLVED",
    "resolutionNotes": "Parecer do RH: capacidade de entrega ajustada.",
    "resolutionDate": "2026-06-28T16:00:00Z"
  }
]
```

#### E. Chave `synchr_prompts` (Configuração dos Prompts Modelos)
```json
[
  {
    "id": "master-prompt",
    "name": "Prompt do Copiloto Smart Leading",
    "systemPrompt": "Você é o copiloto de IA Smart Leading...",
    "lastUpdated": "2026-07-06T18:00:00Z"
  }
]
```

### 5.4 Lógica de Validação da Regra de Escalação (localStorage/Memória)

Lógica executada na função do cliente (ou Serverless Edge) ao solicitar mediação ao RH, lendo dados diretamente do `localStorage`:

```typescript
function validateEscalationLocal(collaboratorId: number, incidentType: string): boolean {
  // Casos de desvios graves ética/assédio ignoram a validação de 1:1 recente
  if (incidentType === 'ETHICS_VIOLATION' || incidentType === 'HARASSMENT') {
    return true; 
  }

  const fortyFiveDaysAgo = new Date();
  fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

  // Recupera histórico do localStorage
  const oneOnOnesRaw = localStorage.getItem('synchr_one_on_ones');
  if (!oneOnOnesRaw) {
    throw new Error("Erro de Validação: Não há registros de reuniões de 1:1 nos últimos 45 dias.");
  }

  const oneOnOnes = JSON.parse(oneOnOnesRaw);
  const recent1on1 = oneOnOnes.find((item: any) => 
    item.collaboratorId === collaboratorId && 
    new Date(item.date) >= fortyFiveDaysAgo
  );

  if (!recent1on1) {
    throw new Error("Erro de Validação: Não há registros de reuniões de 1:1 nos últimos 45 dias. Converse diretamente antes de escalar.");
  }

  return true;
}
```

### 5.5 Segurança e Conformidade (LGPD)
Para garantir conformidade de privacidade, a PoC implementou um validador de input que bloqueia o processamento em LLMs se forem detectados padrões como CPFs, e-mails ou palavras sensíveis do RH relacionadas a prontuários médicos e advertências disciplinares nominativas.

### 5.6 Modelagem de Dados Local (Carregamento de Mock Inicial)
Para inicialização da demonstração offline, os dados mockados estruturados são carregados no `localStorage` na primeira execução caso as chaves estejam vazias:

```json
{
  "leaders": [
    {
      "id": 1,
      "email": "lider.tech@clearit.com.br",
      "name": "Gestor Principal",
      "profile": "TECNICO",
      "levelFrom": "Coordenador",
      "levelTo": "Gerente",
      "disc": "D"
    }
  ],
  "collaborators": [
    {
      "id": 101,
      "name": "Colaborador A",
      "level": "L2",
      "area": "Engenharia",
      "disc": "S",
      "notes": "Prefere comunicações tranquilas e prazos detalhados.",
      "feedbackHistory": [
        "Identificada sobrecarga com prazos na sprint anterior. IA sugeriu fatiar entregas."
      ]
    }
  ],
  "oneOnOnes": [
    {
      "id": 1001,
      "date": "2026-06-25T14:00:00Z",
      "leaderId": 1,
      "collaboratorId": 101,
      "context": "Sobrecarregado com demandas da Sprint",
      "transcription": "Colaborador: Estou muito sobrecarregado e não sei se consigo entregar tudo a tempo. Líder: Vamos ver o que podemos organizar.",
      "summary": "Colaborador expressou sobrecarga. Acordado fatiar demandas.",
      "pdiActions": "Organizar backlog semanalmente com o líder.",
      "aiEvaluation": "O roteiro gerado focou muito na entrega técnica. Sugere-se dedicar mais tempo na escuta de fatores ambientais (ritmo de trabalho) da próxima vez.",
      "nextSuggestions": [
        "Acompanhar o progresso do fatiamento das tarefas",
        "Investigar se a sobrecarga diminuiu na próxima semana"
      ]
    }
  ],
  "conflicts": [
    {
      "id": 501,
      "protocol": "SHR-2026-1049",
      "date": "2026-06-25T14:30:00Z",
      "oneOnOneId": 1001,
      "collaboratorId": 101,
      "incidentType": "PERFORMANCE_DISPUTE",
      "description": "Colaborador em atrito por conta de sobrecarga sistemática nas sprints de engenharia.",
      "status": "RESOLVED",
      "resolutionNotes": "Realizado alinhamento de capacidade de equipe. Rebalanceamento efetuado.",
      "resolutionDate": "2026-06-28T16:00:00Z"
    }
  ],
  "prompts": [
    {
      "id": "master-prompt",
      "name": "Prompt do Copiloto Smart Leading",
      "systemPrompt": "Você é o copiloto de IA Smart Leading. Sua missão é auxiliar líderes a conduzir reuniões de 1:1... Restrição de LGPD: Nunca use nomes...",
      "lastUpdated": "2026-07-06T18:00:00Z"
    }
  ]
}
```

### 5.7 Fluxo de Processamento de Transcrições e Análise de Conflitos
A transcrição das 1:1 é processada em um pipeline composto por três etapas:
1. **Anonimização (Filtro LGPD):** O input bruto passa pela sanitização regex de e-mails, CPFs e blacklist de termos médicos ou advertências nominativas.
2. **Avaliação da Conversa (Post-1:1 Learning):** O motor de IA lê a transcrição e o roteiro inicial proposto, gera um feedback avaliativo sobre a condução da reunião e atualiza as `feedbackHistory` do colaborador para otimizar roteiros subsequentes.
3. **Varredura e Extração de Conflitos:** Um módulo de análise sintática e semântica busca disparadores de conflito (ex: termos como *"atrito"*, *"sobrecarregado"*, *"demissão"*, *"injusto"*, *"briga"*). Caso a pontuação de criticidade seja atingida, um chamado de conflito é criado na tabela `conflicts` com status `PENDING`, disponibilizado imediatamente no painel do RH.

### 5.8 Administração de Prompts (Fine-Tuning Dinâmico)
Para permitir ajustes na inteligência artificial sem alteração de código fonte, os prompts do sistema são armazenados no repositório local do navegador (`localStorage` sob a chave `synchr_prompts`).
- **Acesso Técnico:** O frontend lê a chave `synchr_prompts` antes de compor o prompt e enviar à API da LLM. Caso o administrador edite e salve, a chave correspondente é atualizada localmente via JavaScript.
- **Admin Panel:** Uma interface administrativa CRUD permite a leitura, edição direta e salvamento das diretrizes operacionais de prompt diretamente no `localStorage`.

### 5.9 Estudo Técnico: Envio de Dados Externos (Inter-empresas)
Para transmitir relatórios consolidados a outras empresas parceiras, o SyncHR adota o padrão de conformidade e segurança detalhado abaixo:
1. **Camada de Transporte (Segurança):** Uso obrigatório de HTTPS com autenticação mútua TLS (mTLS) ou chaves de API rotativas integradas ao cabeçalho HTTP (`Authorization: Bearer <token>`).
2. **Anonimização Criptográfica:** Os dados de identificação do colaborador e do líder são convertidos em hashes irreversíveis (SHA-256 combinados com um salt gerido na aplicação da Clear IT) ou totalmente removidos do payload (LGPD Art. 12).
3. **Payload Estruturado:** Transmissão em formato JSON padronizado com criptografia simétrica AES-256-GCM para os dados de texto (transcrições/anotações) caso sejam confidenciais, conforme o modelo abaixo:

```json
{
  "sender_org": "Clear IT",
  "recipient_org": "Parceira Consultoria S/A",
  "transmission_date": "2026-07-06T21:15:00Z",
  "collaborator_pseudonym": "hash_8f7b2c9d...",
  "disc_profile": "S",
  "evaluation_metrics": {
    "collaboration_score": 8.5,
    "conflict_risk": "low"
  },
  "encrypted_data": "aes_gcm_ciphertext_goes_here...",
  "encryption_iv": "iv_vector_hex..."
}
```
4. **Registro de Logs de Consentimento:** O armazenamento local do navegador mantém uma trilha de auditoria de logs registrando a data, hora, ID do colaborador e a versão do termo de consentimento assinado pelo titular que permitiu a transferência dos dados para fora do ambiente corporativo primário.

