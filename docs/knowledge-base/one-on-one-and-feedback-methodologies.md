# Metodologias de 1:1, Feedback e Perfis (Smart Leading — Clear One IA)

> Este arquivo é a base de conhecimento do projeto. O agente `@meta` atualizará este arquivo quando houver novas pesquisas de ferramentas e temas técnicos.

Este documento centraliza as melhores práticas de mercado e diretrizes metodológicas oficiais do projeto **Smart Leading** (copiloto Clear One IA) para a Clear IT.

---

## 1. Visão Geral
Reuniões de 1:1 (One-on-One) consistentes, feedbacks estruturados e a correta compreensão do perfil comportamental dos líderes e colaboradores são os principais vetores para reverter a queda no **eNPS** e na dimensão de **Liderança e Confiança** identificados na pesquisa de clima de 2026. 

O Smart Leading serve como copiloto inteligente para os líderes da Clear IT em três momentos:
- **Antes da Conversa:** Preparação em menos de 3 minutos com pautas personalizadas.
- **Durante a Conversa:** Apoio e direcionamento emocional/prático em tempo real.
- **Após a Conversa:** Centralização de registros e estruturação orgânica de PDIs.

---

## 2. Conceitos Chave

### A. Os 3 Perfis de Usuários (Líderes) e Diversidade Multigeracional
A Clear IT possui um corpo de colaboradores e líderes com ampla diversidade de gerações, variando em suas expectativas de comunicação, facilidade tecnológica e relacionamento interpessoal. O agente não deve pressupor um "usuário padrão"; a profundidade metodológica e a linguagem devem se adequar tanto à maturidade de gestão (conforme os 3 perfis abaixo) quanto ao nível de fluência e conforto de cada faixa geracional, mantendo o tom acessível e sem jargões.

1.  **Líder Técnico:**
    *   *Características:* Objetivo, direto, pragmático e focado em resultados rápidos. Possui baixa tolerância a processos de RH percebidos como "burocráticos".
    *   *Abordagem da IA:* Roteiros enxutos, perguntas diretas, sem jargões corporativos de RH.
2.  **Líder em Transição (Técnico para Gestão):**
    *   *Características:* Técnico promovido recentemente. Possui forte desejo de liderar, mas carece de repertório emocional para lidar com conversas complexas (baixa performance, desalinhamento de expectativas).
    *   *Abordagem da IA:* Roteiro extremamente detalhado, orientações de inteligência emocional e validação passo a passo do fluxo da conversa.
3.  **Líder Engajado:**
    *   *Características:* Acredita no valor estratégico do desenvolvimento de pessoas e de reuniões periódicas, porém sofre com a falta de tempo e organização para preparar as conversas no dia a dia.
    *   *Abordagem da IA:* Foco em agilidade, roteiros rápidos de preparação e organização dos históricos de PDI.

### B. Restrição de Tom e Linguagem
- **O que deve ser:** Linguagem direta, assertiva, prática, empática e com calor humano (identidade cultural da Clear IT).
- **O que evitar:** Jargões excessivos e abstratos de RH (ex: "calibração de competência transversal intangível") sem contextualização. O agente deve soar como uma troca amigável de suporte e não como um manual corporativo engessado.

### C. LGPD e Privacidade de Dados
Nenhum dado pessoal sensível dos colaboradores (nome completo, CPF, dados médicos ou disciplinares nominais) deve ser inserido nas interações com o agente. As interações devem ser baseadas em:
- Perfil comportamental genérico (ex: DISC/MBTI).
- Função/cargo (ex: Desenvolvedor Nível L2).
- Contexto de situação generalizado (ex: "colaborador demonstrando frustração com prazos").

---

## 3. Exemplos Práticos

### A. Roteiros de Reunião Customizados por Perfil de Líder

#### 1. Roteiro para Líder Técnico (Direto e Sem Jargões)
```markdown
Foco: 1:1 Quinzenal - Colaborador L2 (Tech)
Tempo Estimado: 25 minutos

1. Check-in Rápido (3 min): "Como foi sua última quinzena no projeto?"
2. Alinhamento de Demandas (10 min): "Quais impedimentos técnicos você encontrou?"
3. Próximos Passos (7 min): "Qual é o principal foco para os próximos 15 dias?"
4. Fechamento (5 min): Registro dos combinados de entrega.
```

#### 2. Roteiro para Líder em Transição (Estruturado e Empático)
```markdown
Foco: Conversa Difícil (Feedback de Baixa Performance)
Tempo Estimado: 45 minutos

1. Quebra-gelo & Empatia (5 min): Estabeleça um ambiente seguro e de escuta ativa.
2. Fato Gerador (SBI) (15 min): Apresente o caso prático de forma objetiva:
   - "Na entrega da sprint passada (Situação), o código de validação foi enviado com 3 dias de atraso (Comportamento), o que travou o deploy da equipe (Impacto)."
3. Escuta do Colaborador (10 min): "O que aconteceu da sua perspectiva?"
4. Plano de Ação Conjunto (10 min): Desenhar as metas de PDI para corrigir o desvio.
5. Fechamento & Apoio (5 min): "Estou aqui para apoiar sua evolução. Vamos nos falar na próxima semana para acompanhar."
```

### B. Estrutura de Feedback SBI (Situation-Behavior-Impact)
*   **Situation:** "Durante a apresentação de arquitetura na terça-feira..."
*   **Behavior:** "...você respondeu de forma ríspida à pergunta do cliente técnico..."
*   **Impact:** "...o que gerou um clima de tensão e nos custou 2 dias a mais para restabelecer a confiança no alinhamento."

### C. Fluxo de Validação de Escalação de Conflito (Pseudocódigo)
```python
def check_escalation_rules(collaborator_id, incident_type):
    # Denúncias graves de assédio ou quebra ética pulam a validação
    if incident_type in ["ETHICS_VIOLATION", "HARASSMENT"]:
        return open_direct_rh_channel(collaborator_id)
        
    # Casos comuns exigem pelo menos uma 1:1 registrada recentemente
    recent_1on1s = db.get_1on1s_within_days(collaborator_id, days=45)
    if not recent_1on1s:
        raise ValidationError(
            "Antes de escalar ao RH, é necessário ter pelo menos uma reunião de 1:1 registrada discutindo o assunto com seu líder."
        )
    return open_standard_rh_mediation(collaborator_id)
```

---

## 4. Armadilhas (Gotchas) - O que Evitar
1.  **Improviso Sistemático:** Entrar na reunião de 1:1 ou feedback sem preparação prévia de pauta. O copiloto deve ser utilizado antes da conversa para garantir estrutura.
2.  **Sólides/Planilhas como Fins e não Meios:** Líderes que preenchem os relatórios apenas para "bater a meta de RH", sem que a conversa real tenha qualidade.
3.  **Descumprimento de LGPD:** Inserir dados nominais no prompt da IA, gerando riscos de segurança da informação.
4.  **RH como Escudo:** Líderes que tentam acionar o fluxo de escalação do RH sem antes tentar resolver o conflito em conversas 1:1 diretas com os liderados.
