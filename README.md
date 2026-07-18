# SyncHR - Manual de Uso, Especificação do Sistema & Roadmap

O **SyncHR (Smart Leading)** é uma plataforma inteligente voltada para a calibração de lideranças e estruturação de reuniões individuais (1:1). O sistema integra inteligência artificial generativa (Gemini API) para moldar roteiros produtivos conforme os perfis comportamentais e detectar divergências de percepção nas atas bilaterais.

---

## 1. Visão Geral da Plataforma

O MVP foi projetado especificamente para apoiar as dinâmicas corporativas da **Clear IT Brasil**. O objetivo é mitigar reuniões de 1:1 ineficientes através de um copiloto de IA adaptativo e um motor automático de conformidade (governança do RH).

### Principais Pilares:
1. **Onboarding de Liderança:** Calibração inicial do perfil de liderança (Técnico, Em transição, Engajado) para moldar os prompts da IA.
2. **Onboarding de Liderados (Quiz DISC):** Questionário comportamental compulsório para determinar o perfil DISC do colaborador (Dominante, Estável, Analítico, Influente).
3. **Copiloto de IA para 1:1:** Assistente inteligente que gera pautas customizadas cruzando o perfil do líder e o perfil comportamental do liderado.
4. **Assinatura Bilateral e Auditoria Inteligente:** Sistema em que ambos (líder e liderado) inserem suas impressões sobre a reunião. A IA audita se há desalinhamento e calcula o índice de consistência, gerando protocolos de conflito automáticos.
5. **Painel de Governança do RH:** Central de métricas e de mediação de conflitos, com ferramentas para cadastrar líderes, cadastrar liderados e transferir colaboradores de gestor.

---

## 2. Arquitetura do Banco de Dados (Supabase)

A persistência do SyncHR é estruturada nas seguintes tabelas PostgreSQL no Supabase:

### A. Tabela `profiles`
Armazena as informações cadastrais e de liderança dos usuários administrativos e gestores.
*   `id` (uuid, primary key) — Vinculado ao Supabase Auth `auth.users`.
*   `email` (text) — E-mail do usuário.
*   `name` (text) — Nome completo.
*   `role` (text) — Papel no sistema (`RH`, `LEADER`, `COLLABORATOR`).
*   `profile_type` (text) — Calibração da liderança (`TECNICO`, `TRANSICAO`, `ENGAJADO`, `PENDENTE`, `ADMINISTRADOR`).
*   `level_from` / `level_to` (text) — Nível de cargo de atuação.

### B. Tabela `collaborators`
Armazena a base de colaboradores/liderados.
*   `id` (uuid, primary key) — Identificador único.
*   `name` (text) — Nome completo.
*   `email` (text) — E-mail do liderado.
*   `disc` (text) — Perfil DISC do colaborador (`DOMINANTE`, `ESTAVEL`, `ANALITICO`, `INFLUENTE`, `PENDENTE`).
*   `level` (text) — Nível de senioridade (`L1`, `L2`, `L3`, `L4`).
*   `role` (text) — Cargo ou função.
*   `leader_id` (uuid, foreign key) — ID do líder responsável na tabela `profiles`.

### C. Tabela `one_on_ones`
Armazena as reuniões e atas das dinâmicas individuais.
*   `id` (uuid, primary key) — Identificador.
*   `leader_id` (uuid, foreign key) — Autor/Líder na tabela `profiles`.
*   `collaborator_id` (uuid, foreign key) — Colaborador participante na tabela `collaborators`.
*   `date` (text) — Data da reunião.
*   `type` (text) — Foco da pauta.
*   `context` (text) — Contexto complementar ou impedimentos.
*   `script_text` (text) — Roteiro de perguntas sugerido pela IA.
*   `raw_leader_notes` (text) — Anotações reais salvas pelo gestor.
*   `raw_collaborator_notes` (text) — Percepção registrada pelo colaborador na assinatura.
*   `leader_approved` (boolean) — Status de assinatura do líder.
*   `collaborator_approved` (boolean) — Status de assinatura do colaborador.
*   `consistency_result` (jsonb) — Resultado do parecer e pontuações da IA.

### D. Tabela `conflicts`
Guarda as ocorrências de desalinhamento severo identificadas pela IA para mediação do RH.
*   `id` (uuid, primary key) — Identificador.
*   `protocol` (text) — Código alfanumérico único do protocolo.
*   `one_on_one_id` (uuid, foreign key) — Vínculo com a reunião.
*   `collaborator_id` (uuid, foreign key) — Colaborador afetado.
*   `severity` (text) — Nível de alerta (`CRITICAL` ou `WARNING`).
*   `status` (text) — Estado da ocorrência (`PENDING`, `IN_INVESTIGATION`, `RESOLVED`).
*   `notes` (text) — Parecer ou notas de mediação aplicadas pelo RH.

---

## 3. Guias de Uso e Testes das Jornadas

Para testar as jornadas integradas do SyncHR, use os três atalhos rápidos de acesso disponibilizados por padrão na tela de login (`/login`).

### 💼 A. Jornada do Líder / Gestor (Testar Onboarding & Copiloto)
1. **Login Rápido:** Clique no atalho **Líder Teste** (`lider.teste@clearit.com.br`) na tela de login.
2. **Onboarding:** Por ser uma conta de teste repetível, ela é iniciada no status de onboarding gerencial. Responda o formulário avaliativo de estilo para calibrar a IA.
3. **Construção de Pautas:** Acesse a aba **Copiloto de 1:1**, preencha os dados do colaborador, as pautas de impedimentos e clique em **Gerar Roteiro com IA**. A IA gerará um script focado no perfil DISC do liderado.
4. **Finalizar Ata:** Conduza a reunião simulada, escreva suas notas de gestor e clique em **Salvar e Enviar para Assinatura**. Isso envia o e-mail de notificação por Pipedream e gera o link de assinatura.

### 👥 B. Jornada do Liderado (Onboarding Obrigatório & Assinatura)
1. **Login Rápido:** Clique no atalho **Liderado Teste** (`liderado.teste@clearit.com.br`) na tela de login.
2. **Redirecionamento ao Onboarding:** Como o perfil DISC inicial do liderado é `'PENDENTE'`, o sistema redireciona-o imediatamente para `/onboarding-liderado`. Complete o teste de 4 perguntas. Após a conclusão, a tela inicial de colaborador será liberada.
3. **Feedback e Assinatura:** Na aba de Histórico do Liderado, localize a ata pendente enviada pelo gestor. Escreva o seu feedback de concordância e assine digitalmente. A IA (Gemini) avaliará o alinhamento de percepções e atualizará o banco de dados.

### 🛡️ C. Jornada de Governança do RH (Painel de Controle)
1. **Login Rápido:** Clique no atalho **Priscila Bacelar (RH)** (`rh.priscila@clearit.com.br`).
2. **Governança:** Monitore métricas corporativas, confira as atas registradas e acesse a central de alertas do RH.
3. **Gestão de Colaboradores e Líderes:**
   * Crie novos gestores (que recebem e-mail automático com suas credenciais via Pipedream webhook).
   * Cadastre novos colaboradores (que iniciam automaticamente em estado de onboarding `'PENDENTE'`).
   * **Edição & Transferência:** Use o botão **Editar** na lista de liderados para trocar o gestor atribuído a um colaborador. Isso remove o impedimento de exclusão de líderes que contêm equipes ativas.

---

## 4. Integração de E-mails com Pipedream

Neste MVP, o fluxo de envio de e-mails da aplicação (boas-vindas ao colaborador, convite de reunião Meet, link de assinatura digital e alertas críticos de atrito ao RH) foi desacoplado no cliente de frontend e isolado no módulo central de serviços `src/lib/emailService.ts`.

Em ambiente de produção, todas as chamadas de API feitas no frontend direcionam a requisição para o endpoint `/api/send-email`. Esta rota pode ser vinculada para disparar uma requisição HTTP POST (webhook) diretamente para o **Pipedream**, encaminhando os payloads contendo destinatário, assunto e template HTML para processamento e entrega assíncrona robusta.

---

## 5. Avaliação do Projeto: Próximos Passos & Features Futuras

Abaixo está o mapeamento detalhado de melhorias identificadas no MVP para elevação da plataforma a nível de produção corporativa em escala empresarial (Roadmap de Engenharia):

### 🔄 A. Integração de Dados Ativa (API da Sólides)
*   **Melhoria:** O mapeamento comportamental DISC no MVP baseia-se em um formulário interno de auto-avaliação.
*   **Feature Futura:** Integração com os webhooks públicos do ecossistema Sólides HR, sincronizando em tempo real os perfis comportamentais dos colaboradores tão logo eles concluam o teste Profiler da Sólides, eliminando a necessidade de quiz interno no SyncHR.

### 🔗 B. Integração de Escopo do Google Workspace Completa
*   **Melhoria:** A geração de links do Google Meet no MVP é simulada e necessita do fluxo local de consentimento do navegador.
*   **Feature Futura:** Um microsserviço no backend que armazena chaves e tokens de acesso OAuth persistentes e contas de serviço do Google Workspace (GSuite). Isso permitirá agendar reuniões oficiais diretamente no Google Calendar e gerar salas reais do Google Meet de forma invisível.

### 📊 C. Relatórios Executivos e Exportações
*   **Melhoria:** O RH visualiza métricas em tempo real no dashboard, mas não há exportação.
*   **Feature Futura:** Exportação de relatórios em PDF/XLS com dados agregados de adesão, clima de liderança, tendências de eNPS estimado e recorrência de atritos para apresentação em reuniões de comitê de gente e C-Levels.

### 🧠 D. Análise de Sentimento Avançada
*   **Melhoria:** A auditoria da IA avalia a concordância de tópicos e palavras no feedback.
*   **Feature Futura:** Integração de modelos de Processamento de Linguagem Natural (PLN) refinados para análise de sentimentos em frases de feedback, calculando índices preditivos de desgaste emocional e estresse do liderado (alerta precoce de turnover para o RH).

### 🚀 E. Desacoplamento Assíncrono Completo via Pipedream Webhooks
*   **Melhoria:** As rotas chamam `/api/send-email` aguardando a resposta em tempo de execução.
*   **Feature Futura:** Migrar as requisições de e-mail do backend Next.js diretamente para filas de mensageria (ex: BullMQ) ou chamadas assíncronas de webhook para workflows do Pipedream, reduzindo latência nas requisições do usuário e garantindo resiliência com políticas de retentativa automatizadas.

---

## 6. Instruções de Instalação e Execução

### Pré-requisitos
*   Node.js (versão 18 ou superior)
*   Conta no Supabase (com chaves URL e Anon Key configuradas)
*   Chave de API do Gemini (Google AI Studio)

### A. Configuração de Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto com a seguinte estrutura:
```env
NEXT_PUBLIC_SUPABASE_URL=https://sua-url-do-supabase.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui

# Copiloto Inteligente
GEMINI_API_KEY=sua-chave-da-gemini-api
```

### B. Inicializar o Projeto Localmente
Instale as dependências e rode o servidor de desenvolvimento:
```bash
# Instalar dependências
npm install

# Iniciar servidor local
npm run dev
```
Abra o navegador em [http://localhost:3000](http://localhost:3000).

### C. Compilação para Produção
Valide o projeto e gere o build estático otimizado:
```bash
npm run build
```
