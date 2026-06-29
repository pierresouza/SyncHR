# Business Context (Smart Leading — Clear One IA)

> Este arquivo é a fonte de verdade para Produto. O agente `@product` atualizará este arquivo quando houver novas descobertas.

## 1. Visão do Produto
O **Smart Leading (Clear One IA)** é um copiloto inteligente de IA criado no **Programa Pulse Mais 2026** para transformar a rotina de feedbacks e reuniões 1:1 dos líderes da Clear IT. O tema estratégico de 2026, **"Adaptabilidade, Performance e Resultado"**, orienta todas as iniciativas do projeto e deve ser o fio condutor da comunicação do agente. Ele atua antes, durante e após as conversas, elevando o eNPS, impulsionando a confiança na liderança, promovendo o desenvolvimento de competências (Framework de Levels L1-L4 e Coordenador -> C-Level) e organizando a visibilidade de dados para a gestão estratégica de RH.

**Responsável pela Área (Cliente):**
- Priscila Bacelar (Gerente de RH - Clear IT)

**Integrantes do Squad:**
- **Tech:** Pierre Souza (Ponto Focal Principal), Ketelin Macedo
- **Negócio/Produto:** Gustavo Batista, Lucas Santos
- **Membros do Squad:** André Almeida
---

## 2. Dores do Cliente (Problemas que resolvemos)
- **Dispersão Geográfica e Falta de Frequência:** Operação distribuída em quatro estados principais (Manaus, São Paulo, Brasília e Rio de Janeiro) e colaboradores em outros estados (como Salvador e Santa Catarina), gerando reuniões fragmentadas, irregulares ou sem acompanhamento contínuo.
- **Líderes sem Preparação e Roteiro:** Líderes improvisando pautas ou com baixo repertório emocional para conversas difíceis (desempenho e expectativas).
- **Dados Descentralizados e Sem Visibilidade para o RH:** Informações perdidas em anotações no Word, planilhas Excel, Sólides ou sem registro algum, forçando o RH a atuar de forma reativa apagando "incêndios".
- **Descontinuidade de PDIs:** Planos de Desenvolvimento Individual genéricos ou abandonados entre os ciclos.
- **Queda nos Indicadores de Clima:** Queda expressiva no eNPS e no índice da dimensão Liderança e Confiança (Pesquisa de Clima 2025/2026).

---

## 3. Backlog de Épicos e Features
| ID | Título | Status | Notas |
|---|---|---|---|
| F-01 | Onboarding & Perfil de Liderança | Pronto para Dev | Configura perfil de líder (Técnico, Transição, Engajado) e níveis |
| F-02 | Perfil do Colaborador (Testes & Levels) | A Fazer | Testes de perfil e mapeamento com frameworks de níveis de cargo |
| F-03 | Copiloto de 1:1 e Feedbacks | Pronto para Dev | Auxílio inteligente em 3 momentos: antes (roteiros), durante (tempo real) e após |
| F-04 | Evolução Contínua de PDI | A Fazer | Sugestão e acompanhamento contínuo de PDIs entre ciclos |
| F-05 | Fluxo de Escalação e Gestão de Conflitos | Pronto para Dev | Canal de escalação claro e mediação de conflitos vinculada a histórico |
| F-06 | Dashboard Analítico e Sync HR | A Fazer | Visão consolidada para RH/C-Level e sincronização líderes-colaboradores |

## 4. Especificações Ativas (Em Detalhe)

### F-01: Onboarding & Perfil de Liderança (Pronto para Dev)

#### História do Usuário
Como **Líder**, quero passar por um fluxo de onboarding na plataforma web para que meu perfil de liderança seja mapeado e a IA adapte sua linguagem e profundidade ao meu estilo de gestão.

#### Critérios de Aceite
1. **Classificação em 3 Perfis de Liderança:** O onboarding deve classificar o líder em um dos três perfis do projeto:
   - **Líder Técnico:** Objetivo, focado em resultados, baixa tolerância à burocracia do RH. O agente deve fornecer roteiros diretos, rápidos e sem jargões.
   - **Líder em Transição:** Técnico recém-promovido a gestor, quer liderar mas carece de repertório emocional para conversas difíceis. O agente deve fornecer roteiros detalhados e validações passo a passo.
   - **Líder Engajado:** Valoriza feedbacks e o desenvolvimento de pessoas, mas sofre com falta de tempo para preparação. O agente deve focar em agilidade e produtividade diária.
2. **Mapeamento de Framework de Competências:** Permitir a seleção e cruzamento dos níveis organizacionais (Colaboradores L1-L4; Liderança de Coordenador a C-Level) para orientar os roteiros e PDIs gerados pelo agente.
3. **Persistência e Edição do Perfil:** O líder deve poder salvar o progresso de seu preenchimento e alterar suas respostas/perfil de liderança a qualquer momento na tela de configurações de conta.
4. **Feedback de Perfil Mapeado:** Ao finalizar o onboarding, o sistema deve exibir de forma gráfica e amigável uma descrição detalhada do perfil resultante (seus pontos fortes, desafios sugeridos e como a IA irá se comunicar a partir dali).

#### Regras de Negócio
* O preenchimento do perfil de liderança é pré-requisito obrigatório para desbloquear a preparação de roteiros de 1:1.
* **Segurança e LGPD (Privacidade de Dados):** É proibido inserir qualquer dado pessoal sensível dos colaboradores (nome completo, CPF, dados de saúde, advertências nominais). O líder deve utilizar apenas contexts de perfil, cargo e comportamento genéricos.

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
