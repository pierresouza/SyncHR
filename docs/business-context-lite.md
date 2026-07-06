# Business Context (Smart Leading — Clear One IA)

> Este arquivo é a fonte de verdade para Produto. O agente `@product` atualizará este arquivo quando houver novas descobertas.

## 1. Visão do Produto
O **Smart Leading (Clear One IA)** é um copiloto inteligente de IA criado no **Programa Pulse Mais 2026** para transformar a rotina de feedbacks e reuniões 1:1 dos líderes da Clear IT. O tema estratégico de 2026, **"Adaptabilidade, Performance e Resultado"**, orienta todas as iniciativas do projeto e deve ser o fio condutor da comunicação do agente. Ele atua antes, durante e após as conversas, elevando o eNPS, impulsionando a confiança na liderança, promovendo o desenvolvimento de competências (Framework de Levels L1-L4 e Coordenador -> C-Level) e organizando a visibilidade de dados para a gestão estratégica de RH.

**Responsável pela Área (Cliente):**
- Priscila Bacelar (Gerente de RH - Clear IT)

**Integrantes do Squad:**
- **Tech:** Pierre Souza (Ponto Focal Principal), Ketelin Macedo
- **Negócio/Produto:** Gustavo Batista, Lucas Santos, André Almeida
---

## 2. Dores do Cliente (Problemas que resolvemos)
- **Dispersão Geográfica e Falta de Frequência:** Operação distribuída em quatro estados principais (Manaus, São Paulo, Brasília e Rio de Janeiro) e colaboradores em outros estados (como Salvador e Santa Catarina), gerando reuniões fragmentadas, irregulares ou sem acompanhamento contínuo.
- **Líderes sem Preparação e Roteiro:** Líderes improvisando pautas ou com baixo repertório emocional para conversas difíceis (desempenho e expectativas).
- **Dados Descentralizados e Sem Visibilidade para o RH:** Informações perdidas em anotações no Word, planilhas Excel, Sólides ou sem registro algum, forçando o RH a atuar de forma reativa apagando "incêndios".
- **Descontinuidade de PDIs:** Planos de Desenvolvimento Individual genéricos ou abandonados entre os ciclos.
- **Queda nos Indicadores de Clima:** Queda expressiva no eNPS e no índice da dimensão Liderança e Confiança (Pesquisa de Clima 2025/2026).

---

## 3. Backlog de Épicos e Features
| ID | Título | Status | Responsável | Notas |
|---|---|---|---|---|
| F-01 | Onboarding & Perfil de Liderança | Pronto para Dev | Pierre / Ketelin | Configura perfil de líder (Técnico, Transição, Engajado) e níveis |
| F-02 | Perfil do Colaborador (Testes & DISC) | Pronto para Dev | Pierre / Ketelin | Mapeamento DISC do liderado e sugestões dinâmicas de pautas da IA |
| F-03 | Copiloto de 1:1 e Feedbacks | Pronto para Dev | Pierre / Ketelin | Auxílio inteligente: antes (roteiros), durante (tempo real) e após (sugestões e banco) |
| F-04 | Evolução Contínua de PDI | A Fazer | — | Sugestão e acompanhamento contínuo de PDIs entre ciclos |
| F-05 | Fluxo de Escalação e Gestão de Conflitos | Pronto para Dev | Gustavo / Lucas | Canal de escalação claro e mediação de conflitos vinculada a histórico |
| F-06 | Dashboard Analítico e Sync HR | Pronto para Dev | Pierre / Ketelin | Painel RH de Conflitos, Fluxo de Resolução, Admin Panel de Prompts e LGPD |

## 4. Especificações Ativas (Em Detalhe)

### F-01: Onboarding Estruturado do Líder (Pronto para Dev)

#### História do Usuário
Como **Líder**, quero passar por um fluxo de onboarding interativo na plataforma web para que minhas preferências de cargo (atual e destino) e estilo de gestão sejam mapeados e a IA adapte sua linguagem e profundidade ao meu contexto real.

#### Critérios de Aceite
1. **Mapeamento do Perfil de Liderança:** O onboarding deve classificar o líder em um dos três perfis do projeto (Técnico, Em Transição ou Engajado) com base em suas respostas ou seleção direta.
2. **Nível Organizacional:** Permitir o cadastro do nível de cargo atual e do nível alvo de desenvolvimento (Coordenador, Gerente, Diretor/C-Level).
3. **Persistência do Perfil:** Os dados de perfil de liderança devem ser salvos no armazenamento local do navegador (`localStorage`) de modo que o copiloto carregue esses dados dinamicamente.
4. **Resumo Visual:** Apresentar uma tela de conclusão detalhando os pontos fortes do perfil de liderança mapeado e como a IA se adaptará a partir dali.

#### Regras de Negócio
* O preenchimento do perfil de liderança é obrigatório para desbloquear a preparação de roteiros de 1:1.
* **Segurança e LGPD:** Os dados de onboarding do líder são privados e armazenados localmente na sessão do usuário.

---

### F-02: Onboarding Estruturado do Colaborador (Testes & DISC) (Pronto para Dev)

#### História do Usuário
Como **Líder**, quero que meu liderado passe por um questionário comportamental estruturado de DISC no onboarding (ou que eu preencha de forma simulada baseada nas atitudes dele) para que o sistema mapeie o perfil dele no armazenamento local e recomende pautas de conversa personalizadas.

#### Critérios de Aceite
1. **Questionário DISC Estruturado:** O sistema deve conter um questionário comportamental situacional (quiz de 4 perguntas principais) focado em tomada de decisões, trabalho em grupo, reação à pressão e recepção de feedbacks. O resultado mapeia o colaborador em uma das quatro vertentes: Dominância (D), Influência (I), Estabilidade (S) ou Conformidade (C).
2. **Framework de Cargo (Levels):** Mapear o liderado no framework de competências organizacionais da Clear IT (L1 a L4).
3. **Persistência e Cadastro do Liderado:** Armazenar os dados de perfil DISC do colaborador no repositório de dados local (mock de banco de dados/localStorage) para viabilizar as recomendações de pauta e personalização de feedbacks.

#### Regras de Negócio
* Se o preenchimento do questionário DISC do colaborador for pulado no onboarding inicial, o sistema deve exigir que o líder selecione o perfil comportamental dele manualmente antes de iniciar a primeira 1:1.
* **Anonimização no Front:** Os nomes dos perfis e descrições técnicas de comportamento devem seguir guias organizacionais positivos e construtivos, evitando rótulos depreciativos.

---

### F-03: Copiloto de 1:1 e Feedbacks (Pronto para Dev)

#### História do Usuário
Como **Líder**, quero usar o copiloto inteligente web para me apoiar antes, durante e após as conversas de feedback e 1:1, de modo que eu gaste menos tempo me preparando e tenha mais qualidade nos diálogos.

#### Critérios de Aceite
1. **Antes da Conversa (Preparação < 3 min):** O líder preenche um breve formulário informando o tipo de reunião, contexto da situação, objetivo e perfil do liderado. O agente gera: roteiro personalizado, perguntas estratégicas, estrutura da reunião, abordagens sugeridas e sugestões de PDI.
2. **Durante a Conversa (Tempo Real):** Painel web que atua como copiloto sugerindo perguntas de aprofundamento a partir da resposta do colaborador (ex: "estou sobrecarregado" -> sugere investigar causas e prioridades), apoio para conversas difíceis e equilíbrio entre fala e escuta.
3. **Após a Conversa (Registro e PDI):** Geração de resumo e plano de ação (PDI) consolidado para registro rápido e rastreabilidade na plataforma.

#### Regras de Negócio
* **Princípio Human-in-the-loop:** O agente de IA atua como suporte e orientação, nunca substituindo o julgamento do líder. Toda decisão sobre tom, conteúdo final e encaminhamentos é de responsabilidade exclusiva do gestor humano (aviso visível em destaque na interface).
* **Restrição de Tom:** Os roteiros e sugestões da IA devem seguir o tom organizacional da Clear IT: direto, focado em resultados, empático e com calor humano, sem jargões de RH corporativos desconectados.

---

### F-04: Evolução Contínua de PDI (A Fazer)

#### História do Usuário
- Como **Líder**
- Quero **acompanhar o progresso do PDI entre ciclos**
- Para que **eu não perca a rastreabilidade dos compromissos acordados nas 1:1s**

#### Critérios de Aceite
- CAs: a definir no Sprint de especificação desta feature

---

### F-05: Fluxo de Escalação e Gestão de Conflitos (Pronto para Dev)

#### História do Usuário
Como **Colaborador / Líder**, quero ter acesso a um canal estruturado para solicitar suporte do RH na mediação de conflitos, garantindo que o processo seja embasado em dados históricos e não apenas em reações emocionais imediatas.

#### Critérios de Aceite
1. **Solicitação Vinculada:** A abertura de mediação/escalação deve obrigar o solicitante a indicar uma 1:1 documentada recente onde o assunto foi tratado previamente com o gestor direto.
2. **Notificação Estruturada ao RH:** O RH recebe a notificação no painel consolidada com a linha do tempo de 1:1s e metas de PDI do colaborador, permitindo uma análise estratégica do histórico.
3. **Detalhamento do Conflito:** Permitir que o solicitante relate, em campo de texto próprio, os fatos ocorridos, observando as diretrizes de LGPD (sem inclusão de dados sensíveis).
4. **Geração de Protocolo e Rastreamento:** O sistema deve gerar um número de protocolo de atendimento exclusivo e notificar o solicitante sobre a abertura do chamado e a estimativa de prazo do RH.

#### Regras de Negócio
* Exigência de histórico: Apenas conflitos discutidos em 1:1s nos últimos 45 dias podem ser escalados via fluxo padrão. Denúncias graves de assédio ou quebra do código de ética pulam essa regra e são enviadas diretamente ao RH.
* O colaborador pode acompanhar o status da escalação (Pendente, Em Análise, Concluída) por sua interface.

---

### F-06: Dashboard Analítico e Sync HR (Pronto para Dev)

#### História do Usuário
Como **Gerente de RH (Priscila Bacelar) e Administrador**, quero ter acesso a um painel consolidado para gerenciar prompts da IA, analisar transcrições persistidas localmente, mapear conflitos de forma automatizada e acionar um fluxo de mediação de conflitos resolvidos, de modo que o clima da Clear IT seja gerido estrategicamente e com plena segurança LGPD.

#### Critérios de Aceite
1. **Armazenamento de Transcrições Localmente:** Toda a transcrição da reunião de 1:1/feedback deve ser salva de forma estruturada no armazenamento local do navegador (`localStorage`), associada ao ID da 1:1, data, ID do líder e ID do colaborador.
2. **Sugestões de Assuntos pós-1:1 e Aprendizado Contínuo:** Após cada 1:1, a IA deve avaliar a transcrição em comparação com o roteiro gerado e sugerir assuntos ou abordagens futuras mais eficientes. O sistema deve alimentar a ficha do colaborador localmente com estas preferências para calibrar os próximos roteiros de forma inteligente.
3. **Mapeamento Automatizado de Conflitos:** A IA deve varrer a transcrição da reunião buscando indícios de atrito, insatisfação grave ou sobrecarga, gerando um registro automático na aba de Conflitos local se encontrar algo relevante.
4. **Painel de Conflitos do RH com Fluxo de Resolução:** Uma aba protegida e acessível apenas pelo RH que exiba todos os conflitos detectados/escalados. O RH deve poder atualizar o status do conflito (ex: de PENDENTE para EM_RESOLUCAO ou SOLUCIONADO) através de um fluxo com notas de mediação e checklist de encerramento.
5. **Painel do Administrador para Fine-Tuning de Prompts:** Área administrativa para visualizar e editar os prompts de sistema da IA (Roteiro e Copiloto Live). Modificações salvas devem atualizar as chamadas de IA imediatamente a partir do armazenamento local editável.
6. **Controle de Transmissão de Dados Externos:** A interface administrativa deve exibir orientações e um fluxo para exportar dados anonimizados e encriptados caso as informações precisem ser enviadas para empresas parceiras, respeitando os direitos do colaborador.

#### Regras de Negócio
* **Acesso Restrito:** Apenas usuários com a flag `role === 'RH'` podem acessar a visualização de conflitos detalhada. Líderes normais não têm acesso a essa aba.
* **Segurança e LGPD (Consentimento):** Antes de iniciar a transcrição ou o processamento de áudio/texto de uma 1:1, o sistema deve registrar o consentimento explícito do colaborador (Opt-in) salvo localmente no localStorage.
* **Fine-Tuning Localizável:** O prompt modelo (fine-tuning) deve residir no armazenamento local (localStorage) para permitir que administradores testem e ajustem diretrizes em tempo real sem a necessidade de novos deploys.

---

## 5. Validação de Escopo — Sprint 1 / MVP

- **Escopo aprovado em:** 2026-06-29
- **Aprovado por:** Priscila Bacelar (Gerente de RH — Clear IT) / Instrutor Pulse Mais
- **Dentro do escopo:** F-01 Onboarding, F-03 Copiloto 1:1, F-05 Escalação
- **Fora do escopo (MVP):** Integração Sólides, migração de histórico, PDI
- **Restrições inegociáveis:** LGPD (RN01), Human-in-the-loop (RN02), 45 dias (RN03)
- **Próxima revisão:** ao iniciar Sprint 2 / fase técnica

