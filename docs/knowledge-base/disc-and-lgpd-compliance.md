# Metodologias de 1:1, DISC, Governança LGPD e Transmissão Externa

> **Base de Conhecimento — SyncHR (Clear One IA)**
> Este documento reúne pesquisas de mercado, metodologias consagradas e requisitos de conformidade de privacidade de dados para orientar o desenvolvimento e a operação do SyncHR na Clear IT.

---

## 1. Técnicas de Reuniões 1:1 e Feedbacks

As reuniões 1:1 (One-on-Ones) não são "status reports" técnicos. São espaços sagrados do liderado, focados em desenvolvimento, motivação, alinhamento e resolução de impedimentos.

### A. Metodologia GROW Model
Focada em coaching e desenvolvimento contínuo de competências:
*   **G (Goal - Objetivo):** Onde o colaborador quer chegar? (Ex: "Qual competência você quer desenvolver nesta quinzena?")
*   **R (Reality - Realidade):** Qual é a situação atual? (Ex: "O que tem te impedido de alcançar essa meta?")
*   **O (Options - Opções):** Quais são os caminhos possíveis? (Ex: "O que você pode fazer para contornar esse gargalo?")
*   **W (Will - Vontade/Combinados):** O que será feito e quando? (Ex: "Quais são suas duas ações imediatas no plano de ação?")

### B. Metodologia Radical Candor (Empatia Assertiva)
Baseada em desafiar diretamente importando-se pessoalmente:
*   **Desafiar Diretamente:** Dar feedbacks claros, honestos e sem rodeios sobre problemas de desempenho ou atitude.
*   **Importar-se Pessoalmente:** Demonstrar interesse real pela pessoa, seus sentimentos, sua rotina e seus objetivos pessoais.

### C. Checklist de Perguntas Padrões de Início (Quebra-Gelo)
Para os líderes iniciarem suas conversas de maneira produtiva, o sistema sugere o seguinte checklist de início:

| Categoria | Pergunta Padrão de Início | Objetivo |
| :--- | :--- | :--- |
| **Humor & Clima** | "Como está a sua energia hoje de 1 a 5 e o que influenciou essa nota?" | Medir o estado emocional imediato do liderado. |
| **Pessoal** | "Como estão as coisas fora do trabalho? Alguma novidade que queira compartilhar?" | Demonstrar calor humano e conexão pessoal. |
| **Foco** | "O que aconteceu de melhor nos seus projetos na última semana?" | Iniciar com conquistas e reforço positivo. |
| **Obstáculos** | "Se você pudesse eliminar um problema ou gargalo do seu dia hoje, qual seria?" | Descobrir pontos de bloqueio para o líder atuar. |
| **Futuro** | "Qual foi o tema ou aprendizado que mais te empolgou ultimamente?" | Estimular o autodesenvolvimento. |

---

## 2. O Framework Comportamental DISC

O perfil comportamental do liderado dita como ele absorve feedbacks e como prefere se comunicar. A IA deve calibrar os roteiros usando essas diretrizes:

### D - Dominância (Executor)
*   **Perfil:** Focado em resultados, direto, assertivo, competitivo e dinâmico.
*   **Como o líder deve agir:** Sem rodeios. Vá direto ao ponto, apresente fatos, ofereça opções de escolha e dê autonomia na solução.
*   **Evitar:** Microgerenciamento, explicações longas ou tom paternalista.

### I - Influência (Comunicador)
*   **Perfil:** Extrovertido, entusiasmado, focado em pessoas, amigável e otimista.
*   **Como o líder deve agir:** Crie um ambiente caloroso, reconheça publicamente os sucessos, ouça as ideias dele e deixe-o falar.
*   **Evitar:** Foco excessivo e frio em planilhas ou dados logo no início; isolamento social do colaborador.

### S - Estabilidade (Planejador)
*   **Perfil:** Paciente, bom ouvinte, leal, focado em processos e avesso a conflitos bruscos.
*   **Como o líder deve agir:** Demonstre segurança psicológica. Explique mudanças com antecedência, forneça previsibilidade e mostre que se importa com a pessoa antes dos prazos.
*   **Evitar:** Feedbacks abruptos sem contextualização de apoio ou pressões de prazo excessivas sem suporte próximo.

### C - Conformidade (Analítico)
*   **Perfil:** Detalhista, preciso, focado em fatos, cauteloso e sistemático.
*   **Como o líder deve agir:** Baseie os feedbacks em dados tangíveis, métricas claras e descrições detalhadas. Prepare uma pauta estruturada antes da reunião.
*   **Evitar:** Generalizações emocionais (Ex: "Acho que você está desligado") ou falta de lógica nos argumentos.

---

## 3. Segurança de Dados e Conformidade LGPD

O SyncHR manipula dados altamente sensíveis de comportamento e relacionamento profissional. A governança de dados deve seguir a LGPD (Lei Geral de Proteção de Dados - Lei 13.709/2018):

### A. Base Legal do Consentimento (Opt-in)
*   **Transcrições e Gravações:** Toda transcrição ou áudio de 1:1 só pode ser efetuada se houver o consentimento explícito e documentado do colaborador. 
*   **Revogabilidade:** O colaborador tem o direito de solicitar a exclusão de suas transcrições a qualquer momento, mantendo apenas metadados agregados para fins de folha/presença de 1:1.

### B. Minimização de Dados (Art. 6º, III)
*   A transcrição enviada para processamento de IA deve passar por filtros que barram dados pessoais nominativos (PII). A IA atua sobre "Colaborador Nível L2 - Desenvolvedor" e nunca sobre "João da Silva - CPF 123.456...".

### C. Controle de Acesso Baseado em Perfis (RBAC)
*   **Líderes:** Apenas visualizam dados consolidados dos seus próprios liderados diretos.
*   **RH (Priscila Bacelar):** Apenas o RH tem acesso à aba de "Conflitos" e mediações. As transcrições brutas não devem ser expostas livremente; apenas resumos executivos anonimizados e os protocolos de conflito abertos são exibidos no painel do RH.

### D. Recomendações de Segurança LGPD para o Projeto
1.  **Criptografia em Repouso:** Transcrições guardadas localmente no `localStorage` devem ser criptografadas via JavaScript antes de serem serializadas (ex: usando bibliotecas como CryptoJS com chaves AES-256 baseadas em hash de sessão).
2.  **Trilha de Auditoria:** Registrar no log local qualquer acesso do RH ou líderes aos históricos dos colaboradores (Quem visualizou, Quando e Por quê), persistindo a auditoria em chave protegida.

---

## 4. Estudo de Viabilidade: Transmissão de Dados Externos

Caso a Clear IT precise enviar dados de feedbacks e avaliações compartilhadas para consultorias de clima organizacionais ou empresas parceiras, o processo deve obedecer às seguintes diretrizes:

### A. Requisitos de Conformidade Legal
1.  **Autorização Contratual específica (Data Processing Agreement):** A empresa parceira que receber os dados atuará como *Operadora* e deve assinar cláusulas de confidencialidade rígidas.
2.  **Consentimento Específico para Compartilhamento:** O termo de onboarding do colaborador deve conter uma seção explícita detalhando quais dados serão compartilhados, para quais fins e com quais parceiros.

### B. Protocolo de Segurança Técnica
*   **Pseudonimização Obrigatória:** Substituir nomes e CPFs por códigos/pseudônimos gerados de forma irreversível (hashes criptográficos SHA-256 combinados com um Salt interno e secreto).
*   **Criptografia no Envio:** Transmitir os payloads em JSON encriptados com chaves públicas da empresa receptora (criptografia assimétrica RSA-4096) ou simétrica (AES-256-GCM) trafegando por canais privados (VPN site-to-site ou mTLS).
*   **Tratamento de Transcrições:** É altamente recomendado **nunca enviar transcrições completas** para o exterior. Deve-se enviar apenas as métricas de score DISC e riscos de conflito calculados localmente e consolidados.
