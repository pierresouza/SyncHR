# Contexto de Negócio & Técnico - Smart Leading (SyncHR)

> **Documento Unificado - Entregável da Etapa 2 (PoC & MVP Alignment)**
> Este documento consolida a visão estratégica de produto (Negócio) e as especificações de engenharia e resultados de testes (Técnico), servindo como a única fonte de verdade para alinhamento com a cliente Priscila Bacelar (Gerente de RH - Clear IT).

---

## 1. Visão Geral do Produto e Dores Resolvidas

O **Smart Leading (Clear One IA)** é um copiloto inteligente de inteligência artificial criado para transformar e elevar o ciclo de feedbacks e reuniões 1:1 dos líderes da **Clear IT**. Guiados pelo tema estratégico de 2026, **"Adaptabilidade, Performance e Resultado"**, buscamos sanar as seguintes dores identificadas:

*   **Dispersão Geográfica:** Apoiar a liderança distribuída em Manaus, São Paulo, Brasília, Rio de Janeiro e outros estados com um acompanhamento contínuo e estruturado.
*   **Falta de Preparação de Gestores:** Eliminar roteiros improvisados ou a falta de repertório emocional para lidar com feedbacks complexos (baixa performance ou desalinhamento).
*   **Dados Descentralizados:** Substituir registros perdidos em blocos de notas locais por um painel integrado, dando visibilidade ao RH para atuar de forma proativa.
*   **Descontinuidade de PDIs:** Garantir que metas de desenvolvimento (PDIs) pactuadas em reuniões 1:1 não caiam no esquecimento.

---

## 2. Alinhamento de Escopo do MVP (Sprint 1)

O escopo do MVP foi validado e prioriza funcionalidades cruciais que habilitam o fluxo de ponta a ponta sem integrações complexas legadas:

*   **DENTRO do Escopo do MVP:**
    *   **F-01: Onboarding & Perfil de Liderança:** Mapeamento do perfil do gestor em 3 perfis e níveis de competência (L1-L4 e Coordenador a C-Level).
    *   **F-03: Copiloto de 1:1 (Antes/Durante/Após):** Geração de roteiros personalizados baseados em perfil, assistência em tempo real e consolidação de atas com plano de ação.
    *   **F-05: Fluxo de Escalação e Mediação:** Abertura de chamados de conflito para o RH vinculados ao histórico recente.
*   **FORA do Escopo do MVP:**
    *   F-02: Perfil do Colaborador (mapeamento automatizado).
    *   F-04: Evolução Contínua de PDI (acompanhamento histórico complexo).
    *   F-06: Dashboard Analítico avançado (Sync HR).
    *   Integração automática com o sistema Sólides e migração de histórico.
*   **Restrições Inegociáveis (Compliance):**
    *   **RN01 (Exigência de 1:1):** Solicitações de mediação comuns exigem pelo menos uma 1:1 documentada nos últimos 45 dias.
    *   **RN02 (Desvio Grave):** Denúncias graves de assédio ou ética pulam a barreira de 45 dias e vão direto ao RH.
    *   **RN03 (Segurança LGPD):** Proibido o tráfego de dados pessoais sensíveis dos colaboradores no copiloto da IA.

---

## 3. Arquitetura Lógica e Stack Tecnológica

O sistema foi estruturado seguindo o padrão de microsserviços modernos baseados em computação serverless, garantindo alta escalabilidade e baixo custo de manutenção:

*   **Linguagem:** TypeScript (strict mode ativado).
*   **Framework:** Next.js (App Router) com Server Actions rodando do lado do servidor para segurança de API.
*   **Banco de Dados:** Prisma ORM com PostgreSQL (Neon DB Serverless).
*   **Infraestrutura:** Hospedagem no Netlify (Next.js Runtime) rodando as Server Actions como Netlify Functions.
*   **Camada de IA:** Integração encapsulada com LLM (Gemini API) a partir de Server Actions seguras.

```
┌────────────────────────────┐
│   Cliente (Browser)          │
│   Next.js App Router (RSC)   │
└──────────────┬───────────────┘
               │ HTTPS (Server Actions)
               ▼
┌────────────────────────────┐
│   Netlify Edge / Functions   │
│   Next.js Runtime             │
│  ┌─────────────────────────┐ │
│  │ Server Actions             │ │
│  │  - Tom Adaptativo (F-01)  │ │
│  │  - Copiloto LLM (F-03)    │ │
│  │  - Validação 45 dias     │ │
│  └───────────┬─────────────┘ │
└──────────────┼───────────────┘
               │
               ▼
     ┌───────────────────┐        ┌──────────────────────┐
     │  Prisma Client      │──────▶│  PostgreSQL (Neon)   │
     │  (lib/prisma.ts)    │       │  Compatível Netlify  │
     └───────────────────┘        └──────────────────────┘
```

---

## 4. Resultados da Prova de Conceito (PoC)

Partes críticas da solução foram isoladas e testadas programaticamente e visualmente para validar as tecnologias e os prompts da IA.

### 4.1 Validação de Engenharia de Prompt (F-01 / F-03)
Testamos com sucesso a capacidade da IA de alterar a estrutura de roteiros de 1:1 e conselhos em tempo real a depender do perfil mapeado no onboarding:

1.  **Líder Técnico:** Recebeu roteiros enxutos de 25 minutos, sem jargões de RH corporativos, focando em check-ins de entregas e resolução imediata de bugs ou impedimentos técnicos.
2.  **Líder em Transição:** Recebeu um guia passo a passo estruturado sob a metodologia SBI (Situation-Behavior-Impact) de feedback, incluindo dicas de inteligência emocional para manter o diálogo aberto.
3.  **Líder Engajado:** Recebeu tópicos de ação rápida adequados para o preparo de 3 minutos.

### 4.2 Lógica de Escalação de Conflitos (F-05)
A regra de validação dos 45 dias foi testada com sucesso via código Node.js. 
*   **Caso A:** O colaborador possui reuniões de 1:1 registradas no intervalo de 45 dias → Abertura de mediação permitida, histórico indexado com sucesso.
*   **Caso B:** O colaborador não possui 1:1 recentes registradas → O sistema bloqueia a abertura do chamado com mensagem explicativa incentivando o diálogo direto (RN01).
*   **Caso C (Bypass):** Flag de quebra de ética/assédio ativada → A validação de data é ignorada, encaminhando o caso de forma prioritária e gerando protocolo instantâneo (RN02).

### 4.3 Filtro de Conformidade LGPD
Criou-se uma rotina de segurança que examina os campos de entrada de dados antes de submetê-los para as APIs externas da IA:
*   Padrões de CPF (ex: `\b\d{3}\.\d{3}\.\d{3}-\d{2}\b`) e e-mails são identificados e bloqueados.
*   Palavras do dicionário sensível (ex: *atestado*, *saúde*, *médico*, *advertência nominal*) sofrem barreira de segurança para evitar tráfego de dados sensíveis na nuvem pública.

---

## 5. Apoio Visual e Validação do Protótipo

Como forma de tangibilizar a ideia para a cliente e o time, desenvolvemos dois ativos visuais funcionais:

1.  **Mockup da Interface (Design de UI):** Uma renderização em alta fidelidade demonstrando a tela do dashboard, o card de onboarding de perfis de liderança e a caixa de assistência em tempo real do copiloto.
    *   **Arquivo de Referência:** [smart-leading-dashboard-mockup.png](file:///c:/Users/pierr/Documents/estudos/pulse-mais/ClearIT/projeto-ClearIT/SyncHR/smart-leading-dashboard-mockup.png)
2.  **Protótipo Interativo Web (PoC Dashboard):** Uma página web interativa simulando o fluxo completo de ponta a ponta do Smart Leading. Permite alternar os perfis dos líderes, ver a IA adaptando os roteiros em tempo real, testar a barra de chat de assistência ativa com o colaborador e submeter chamados ao RH testando as regras dos 45 dias e bypass ético.
    *   **Link de Acesso Local:** [poc-dashboard.html](file:///c:/Users/pierr/Documents/estudos/pulse-mais/ClearIT/projeto-ClearIT/SyncHR/poc-dashboard.html) (Abrir no navegador para testar a experiência).
