# Business Context — SyncHR / Smart Leading

> **Documento de Negócio · Versão Completa · Pulse Mais 2026**
> **Empresa cliente:** Clear IT Brasil (Clear Tecnologia da Informação S.A.)
> **Grupo:** Pierre Souza · Ketelin Macedo · Gustavo Batista · Lucas Santos · André Almeida
> **Repositório:** [github.com/pierresouza/SyncHR](https://github.com/pierresouza/SyncHR) · Julho / 2026

---

## 1. Contextualização do Projeto

### 1.1 Quem é a Clear IT?
A Clear IT Brasil (Clear Tecnologia da Informação S.A.) é uma integradora nacional especializada em arquitetura de dados, infraestrutura crítica, segurança cibernética e computação em nuvem. Opera sob o modelo de Provedora de Serviços Gerenciados (MSP) atendendo clientes do setor privado e da administração pública, com centros operacionais SOC e COPS funcionando 24h/7 dias.

### 1.2 O Problema Identificado
Líderes da Clear IT, distribuídos em 4 estados principais, conduzem reuniões 1:1 e feedbacks de forma improvisada: sem pauta estruturada, com registros descentralizados em Word/Excel/Sólides e PDIs genéricos que são abandonados entre ciclos. O resultado é a queda no eNPS e no índice de Liderança & Confiança da Pesquisa de Clima 2025/2026.

**Principais dores identificadas:**
*   Ausência de pauta estruturada antes das reuniões 1:1.
*   Registros descentralizados e sem padronização.
*   PDIs criados mas não acompanhados entre ciclos.
*   Líderes sem repertório para tratar situações de conflito.
*   RH sem visibilidade analítica sobre a qualidade das lideranças.

### 1.3 A Solução — SyncHR / Smart Leading
Copiloto inteligente de IA que apoia líderes em 3 momentos:
*   **ANTES:** Roteiros personalizados em menos de 3 minutos.
*   **DURANTE:** Sugestões e perguntas de aprofundamento empático em tempo real.
*   **APÓS:** Resumos estruturados e PDIs consolidados, fornecendo visibilidade analítica para o RH.

---

## 2. Personas

As personas são os perfis dos usuários reais que vão usar o SyncHR:

| Persona | Perfil | O que o SyncHR resolve para ela |
| :--- | :--- | :--- |
| **Líder Técnico** | Direto, prefere objetividade. Não domina jargões de RH e fica inseguro em conversas emocionais. | Roteiros prontos, sem jargões, com foco em dados e metas claras. |
| **Líder em Transição** | Recém-promovido, precisa de passo a passo emocional e segurança para lidar com conflitos. | Guias estruturados e suporte em tempo real durante a conversa. |
| **Líder Engajado** | Experiente, busca agilidade e quer histórico organizado para acompanhar evolução da equipe. | Dashboard de progresso e registro automático das 1:1s realizadas. |
| **Gerente de RH (Priscila Bacelar)** | Precisa de visão analítica consolidada para tomar decisões de clima organizacional. | Dashboard com frequência e qualidade das 1:1s por líder, com base em dados. |

---

## 3. Histórias de Usuário (User Stories)

### F-01 — Onboarding & Perfil de Liderança
*   **Como:** Líder (qualquer perfil)
*   **Quero:** Configurar meu perfil de liderança informando meu estilo, equipe e contexto
*   **Para que:** O copiloto gere roteiros adaptados à minha realidade específica
*   **Critérios de Aceite:**
    1. Perfil salvo com sucesso no armazenamento.
    2. Roteiro gerado reflete o perfil configurado.
    3. LGPD respeitada (sem dados pessoais sensíveis expostos).
    4. Processo concluído em menos de 5 min.

### F-02 — Perfil do Colaborador (DISC)
*   **Como:** Líder
*   **Quero:** Visualizar o nível de competência (L1-L4) e o perfil comportamental DISC do meu liderado
*   **Para que:** Eu adapte o tom de voz e as sugestões de roteiro ao perfil psicológico e técnico do liderado, minimizando atritos.
*   **Critérios de Aceite:**
    1. Exibir badge do perfil DISC (Dominante, Influente, Estável, Analítico) na listagem.
    2. Apresentar resumo descritivo do perfil comportamental e preferências do liderado.
    3. Demonstrar o cargo e nível atual de maturidade técnica do liderado.

### F-03 — Copiloto de 1:1 e Feedbacks
*   **Como:** Líder
*   **Quero:** Receber sugestões de pauta antes, orientações durante e um resumo após a reunião 1:1
*   **Para que:** Eu conduza conversas mais estruturadas e mantenha registro consolidado para acompanhamento futuro
*   **Critérios de Aceite:**
    1. Roteiro gerado em menos de 3 min.
    2. Human-in-the-loop respeitado (líder edita e aprova).
    3. Resumo gerado automaticamente ao final.
    4. Capacidade de enviar roteiro gerado como e-mail simulado.

### F-04 — Evolução Contínua de PDI
*   **Como:** Líder
*   **Quero:** Registrar e acompanhar as metas e ações de PDI pactuadas entre ciclos de 1:1
*   **Para que:** Eu não perca a rastreabilidade dos compromissos de desenvolvimento acordados com meu liderado.
*   **Critérios de Aceite:**
    1. Associação de ações práticas ao Plano de Desenvolvimento Individual do liderado.
    2. Persistência do progresso do PDI de forma local e integrada à linha do tempo de 1:1.
    3. Gravação de resultados da simulação interativa de conversas no PDI.

### F-05 — Escalação e Gestão de Conflitos
*   **Como:** Líder
*   **Quero:** Receber orientações sobre como lidar com conflitos e, quando necessário, acionar o RH
*   **Para que:** Eu resolva situações sensíveis de forma estruturada, sem improvisar e sem prejudicar o colaborador
*   **Critérios de Aceite:**
    1. Fluxo de escalação comum acionado somente após 45 dias sem resolução de 1:1.
    2. Casos de desvio ético grave/assédio com bypass direto ao RH.
    3. Orientações geradas no tom Clear IT.
    4. Registro da ocorrência e protocolo gerado.

### F-06 — Dashboard Analítico do RH
*   **Como:** Gerente de RH (Priscila Bacelar)
*   **Quero:** Ver um painel consolidado com a adesão, volume e qualidade das 1:1s, além de gerenciar incidentes
*   **Para que:** Eu tome decisões estratégicas de clima organizacional com base em dados.
*   **Critérios de Aceite:**
    1. Dashboard com eNPS simulado, volume de reuniões e logs de auditoria.
    2. Listagem clara e atualização de status dos chamados de conflito (Pendente, Em Mediação, Resolvido).
    3. Acesso à alteração de prompts globais e visualização de e-mails simulados enviados.

### F-07 — Simulação de Notificações de E-mail
*   **Como:** Líder
*   **Quero:** Disparar de forma simulada os roteiros e atas por e-mail para homologação da equipe
*   **Para que:** Eu verifique o fluxo de ponta a ponta sem necessidade de enviar e-mails reais de produção usando APIs de terceiros.
*   **Critérios de Aceite:**
    1. Botão de disparo 100% simulado integrado ao Copiloto.
    2. Armazenamento e listagem dos e-mails disparados no dashboard do RH para fins de auditoria.
    3. Exibição de pop-up e logs indicando o sucesso do envio fictício.

---

## 4. Requisitos Funcionais

| Código | Feature | Descrição |
| :--- | :--- | :--- |
| **RF01** | Onboarding | O sistema deve permitir que o líder configure seu perfil de liderança na primeira vez que acessa a plataforma. |
| **RF02** | Perfil do Colaborador | O sistema deve exibir o perfil comportamental e histórico de cada liderado do líder cadastrado. |
| **RF03** | Geração de Roteiro | O sistema deve gerar um roteiro de 1:1 personalizado em menos de 3 minutos com base no perfil do líder e do liderado. |
| **RF04** | Sugestões em Tempo Real | Durante a reunião, o sistema deve oferecer sugestões de perguntas e abordagens conforme o andamento da conversa. |
| **RF05** | Resumo Pós-Reunião | Ao encerrar a sessão, o sistema deve gerar automaticamente um resumo com pontos discutidos e compromissos assumidos. |
| **RF06** | Acompanhamento de PDI | O sistema deve permitir registrar e acompanhar o progresso do Plano de Desenvolvimento Individual entre ciclos de 1:1. |
| **RF07** | Escalação de Conflitos | O sistema deve detectar situações de conflito prolongado e orientar o líder sobre como acionar o fluxo de escalação para o RH. |
| **RF08** | Dashboard RH | O sistema deve disponibilizar para o RH um painel com métricas de frequência e qualidade das 1:1s realizadas por líder. |

---

## 5. Requisitos Não Funcionais

| Código | Categoria | Descrição |
| :--- | :--- | :--- |
| **RNF01** | Desempenho | O roteiro de 1:1 deve ser gerado em no máximo 3 segundos após a solicitação do líder. |
| **RNF02** | Disponibilidade | O sistema deve estar disponível 24h/7 dias, com tolerância máxima de 0,5% de indisponibilidade mensal. |
| **RNF03** | Segurança | Toda comunicação entre cliente e servidor deve ser criptografada via HTTPS. Dados sensíveis em repouso devem ser criptografados. |
| **RNF04** | Privacidade / LGPD | Nenhum dado pessoal sensível dos colaboradores pode ser armazenado sem consentimento explícito e base legal definida. |
| **RNF05** | Usabilidade | A plataforma deve ser intuitiva o suficiente para que um líder sem experiência técnica consiga gerar seu primeiro roteiro sem treinamento. |
| **RNF06** | Compatibilidade | O sistema deve funcionar nos principais navegadores modernos (Chrome, Edge, Firefox) e ser responsivo para uso em tablet. |
| **RNF07** | Manutenibilidade | O código deve seguir padrões de documentação que permitam a qualquer membro da equipe dar manutenção sem dependência de um único desenvolvedor. |

---

## 6. Regras de Negócio

| Código | Regra | Descrição | Por que existe |
| :--- | :--- | :--- | :--- |
| **RN01** | LGPD | Nenhum dado pessoal sensível do colaborador é armazenado sem base legal e consentimento explícito. | Conformidade legal obrigatória com a Lei Geral de Proteção de Dados (Lei 13.709/2018). |
| **RN02** | Human-in-the-loop | O copiloto sempre sugere — o líder sempre decide. Nenhuma ação (envio, escalação, registro) é executada de forma automática sem aprovação humana. | Garante responsabilidade humana sobre as decisões de liderança e evita erros gerados por IA. |
| **RN03** | Regra dos 45 dias | Situações de conflito registradas e sem resolução após 45 dias corridos disparam automaticamente um alerta de escalação para o RH. | Evita que conflitos crônicos fiquem invisíveis e prejudiquem o clima organizacional. |
| **RN04** | Bypass ético | Casos envolvendo assédio moral, sexual ou violação ética grave acionam diretamente o canal de RH, sem necessidade de aguardar o prazo de 45 dias. | Proteção imediata ao colaborador em situações de vulnerabilidade. |
| **RN05** | Tom organizacional | Todos os roteiros e sugestões gerados pelo copiloto devem seguir a linguagem, valores e cultura organizacional da Clear IT. | Garante consistência de comunicação e evita que a IA gere respostas inadequadas ao contexto da empresa. |
| **RN06** | Restrição de acesso | Dados de 1:1s e feedbacks são visíveis apenas para o líder envolvido e para o RH (com permissão). Pares de mesmo nível não têm acesso. | Preserva a confidencialidade da relação líder-liderado e a confiança no sistema. |
| **RN07** | Human-in-the-loop Ampliado | O copiloto atua de forma consultiva e todos os roteiros e resumos devem ser ativamente revisados pelo gestor humano. | Mantém o controle e a empatia da liderança humana. |
| **RN08** | Tom de Voz | Linguagem direta, empática e humana, desprovida de jargões corporativos burocráticos. | Aproxima as lideranças técnicas da gestão humanizada de pessoas. |
| **RN09** | Higienização LGPD | Sanitização de CPFs, e-mails, dados de prontuário e termos médicos no input antes do envio à IA. | Garante conformidade técnica estrita e previne o vazamento de PII. |

---

## 7. Escopo do MVP e Validação

### 7.1 Backlog de Funcionalidades

| ID | Funcionalidade | Prioridade | Status | Sprint | Responsável |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F-01** | Onboarding & Perfil de Liderança | Alta | ✅ Concluído | MVP | Pierre / Ketelin |
| **F-02** | Perfil do Colaborador (DISC) | Média | ✅ Concluído | MVP | Ketelin |
| **F-03** | Copiloto de 1:1 e Feedbacks | Alta | ✅ Concluído | MVP | Pierre / Ketelin |
| **F-04** | Evolução Contínua de PDI | Média | ✅ Concluído | MVP | André |
| **F-05** | Escalação e Gestão de Conflitos | Alta | ✅ Concluído | MVP | Gustavo / Lucas |
| **F-06** | Dashboard Analítico do RH | Média | ✅ Concluído | MVP | Pierre |
| **F-07** | Simulação de Notificações de E-mail | Alta | ✅ Concluído | MVP | Grupo SyncHR |

### 7.2 Dentro e Fora do Escopo

*   **Dentro do Escopo (MVP):**
    *   F-01: Onboarding & perfil de liderança.
    *   F-02: Perfil do colaborador (DISC no Simulador).
    *   F-03: Copiloto de 1:1 (antes/durante/após).
    *   F-04: Evolução de PDI (registro de planos de ação).
    *   F-05: Fluxo de escalação e gestão de conflitos.
    *   F-06: Dashboard analítico do RH com auditoria.
    *   F-07: Simulação offline de envio de e-mails.
*   **Fora do Escopo:**
    *   Integração física com a API externa do Resend.
    *   Integração automática com o sistema Sólides e migração de histórico.

### 7.3 Validação de Escopo

| Campo | Informação |
| :--- | :--- |
| **Escopo aprovado em** | 2026-06-29 |
| **Aprovado por** | Priscila Bacelar (Gerente de RH — Clear IT) / Instrutor Pulse Mais |
| **Dentro do escopo** | F-01 Onboarding, F-03 Copiloto 1:1, F-05 Escalação |
| **Fora do escopo (MVP)** | Integração Sólides, migração de histórico, PDI completo |
| **Restrições inegociáveis** | LGPD (RN01), Human-in-the-loop (RN02), Regra 45 dias (RN03) |
| **Próxima revisão** | Ao iniciar Sprint 2 / fase técnica |

---

## 8. Riscos e Pontos de Atenção

| Risco / Pendência | Impacto | Ação recomendada |
| :--- | :--- | :--- |
| **Escopo sem validação formal** | Retrabalho na fase técnica | Registrar quem aprovou, quando e o que ficou fora (preenchido no item 7.3). |
| **Backlog sem coluna de Responsável** | Falta de accountability do grupo | Responsáveis definidos e tabela atualizada no item 7.1. |
| **Histórias de usuário incompletas** | Avaliação parcial do escopo | Planejar detalhamento de F-02, F-04 e F-06 nos sprints futuros. |
| **Contexto técnico vazio** | Bloqueio no desenvolvimento técnico | Sincronizar o [technical-context-lite.md](file:///c:/Users/pierr/Documents/estudos/pulse-mais/ClearIT/projeto-ClearIT/SyncHR/docs/technical-context-lite.md) com a modelagem do localStorage e do Prisma. |
| **Adesão dos líderes ao sistema** | Maior risco não-técnico | Definir um grupo piloto com líderes mais receptivos à inovação e tecnologia. |

---

## 9. Glossário

*   **1:1 (One-on-One):** Reunião periódica entre líder e liderado para alinhamento, feedback e desenvolvimento.
*   **PDI:** Plano de Desenvolvimento Individual — documento que registra metas de crescimento do colaborador.
*   **eNPS:** Employee Net Promoter Score — métrica que mede o quanto os funcionários indicariam a empresa como boa para trabalhar.
*   **LGPD:** Lei Geral de Proteção de Dados (Lei 13.709/2018) — regula o uso de dados pessoais no Brasil.
*   **Human-in-the-loop:** Princípio de que toda decisão importante deve passar pela aprovação de um ser humano, mesmo que a IA sugira.
*   **MVP:** Minimum Viable Product (Produto Mínimo Viável) — a versão mais enxuta do produto que ainda entrega valor ao cliente.
*   **Sprint:** Ciclo de desenvolvimento ágil com duração fixa (geralmente 1-2 semanas) com entregas definidas.
*   **SLA:** Service Level Agreement — acordo formal de nível de serviço entre a empresa e o cliente.
*   **MSP:** Managed Service Provider — empresa que gerencia serviços de TI de outras empresas.
*   **Backlog:** Lista priorizada de funcionalidades e tarefas que o sistema precisa ter.
*   **Persona:** Perfil fictício mas realista que representa um tipo de usuário do sistema.
*   **Copiloto de IA:** Sistema que usa inteligência artificial para sugerir ações e conteúdos, mas sem substituir a decisão humana.
