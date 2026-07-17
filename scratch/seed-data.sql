-- Seed Data for SyncHR (Smart Leading)
-- Execute this using setup-supabase.js or directly in Supabase SQL Editor

-- 1. Insert profiles (Leaders and RH) with placeholder UUIDs
-- These UUIDs will be mapped to the actual Auth UIDs when users log in.
INSERT INTO public.profiles (id, email, name, role, profile_type, level_from, level_to) VALUES
('a0e8d1a1-1234-4321-abcd-000000000001', 'rh.priscila@clearit.com.br', 'Priscila Bacelar (RH)', 'RH', 'ADMINISTRADOR', 'Gerente', 'Gerente'),
('a0e8d1a1-1234-4321-abcd-000000000002', 'lider.thiago@clearit.com.br', 'Thiago Araujo', 'LEADER', 'TECNICO', 'Coordenador', 'Gerente'),
('a0e8d1a1-1234-4321-abcd-000000000003', 'lider.lucas@clearit.com.br', 'Lucas Silva', 'LEADER', 'TRANSICAO', 'Coordenador', 'Gerente'),
('a0e8d1a1-1234-4321-abcd-000000000004', 'lider.aline@clearit.com.br', 'Aline Souza', 'LEADER', 'ENGAJADO', 'Gerente', 'Diretor')
ON CONFLICT (email) DO NOTHING;

-- 2. Insert collaborators associated with these leaders
INSERT INTO public.collaborators (id, name, email, disc, level, role, leader_id) VALUES
('b0e8d1a1-1111-2222-3333-000000000001', 'Carlos Santos (L3)', 'carlos.santos@clearit.com.br', 'DOMINANTE', 'L3', 'Dev Back-end Sênior', 'a0e8d1a1-1234-4321-abcd-000000000002'),
('b0e8d1a1-1111-2222-3333-000000000002', 'Mariana Souza (L2)', 'mariana.souza@clearit.com.br', 'ESTAVEL', 'L2', 'Dev Front-end Pleno', 'a0e8d1a1-1234-4321-abcd-000000000003'),
('b0e8d1a1-1111-2222-3333-000000000003', 'Jorge Oliveira (L4)', 'jorge.oliveira@clearit.com.br', 'ANALITICO', 'L4', 'DevOps Principal', 'a0e8d1a1-1234-4321-abcd-000000000002'),
('b0e8d1a1-1111-2222-3333-000000000004', 'Fernanda Lima (L1)', 'fernanda.lima@clearit.com.br', 'INFLUENTE', 'L1', 'Dev Front-end Júnior', 'a0e8d1a1-1234-4321-abcd-000000000003'),
('b0e8d1a1-1111-2222-3333-000000000005', 'Rodrigo Costa (L3)', 'rodrigo.costa@clearit.com.br', 'ANALITICO', 'L3', 'QA Sênior', 'a0e8d1a1-1234-4321-abcd-000000000004'),
('b0e8d1a1-1111-2222-3333-000000000006', 'Beatriz Santos (L2)', 'beatriz.santos@clearit.com.br', 'DOMINANTE', 'L2', 'Product Designer Pleno', 'a0e8d1a1-1234-4321-abcd-000000000004')
ON CONFLICT DO NOTHING;

-- 3. Insert past One-on-Ones
INSERT INTO public.one_on_ones (id, collaborator_id, date, type, context, script_text, raw_leader_notes, raw_collaborator_notes, transcription, final_summary, leader_approved, collaborator_approved, consistency_result) VALUES
(
  'c0e8d1a1-aaaa-bbbb-cccc-000000000001',
  'b0e8d1a1-1111-2222-3333-000000000002',
  '2026-06-15',
  'Quinzenal Rotineira',
  'Atrasos frequentes nas últimas duas sprints e pouca comunicação.',
  '### Roteiro Recomendado\n\n1. Pergunta Quebra-Gelo\n2. Alinhamento de Entregas\n3. Metas de Melhoria',
  'Mariana relatou cansaço mental devido à sobrecarga de tarefas e falta de clareza nas prioridades da squad.',
  'Concordo com os pontos. A divisão de tarefas ficou muito pesada após a saída do dev sênior da squad.',
  'Líder: Como estão as coisas, Mariana? Notei atrasos.\nColaborador: Estou exausta, a squad está sem sênior e acumulei tarefas.',
  'Reunião focada em discutir a sobrecarga de Mariana devido à vacância técnica na squad. Alinhado redução temporária de escopo até a contratação de novo suporte.',
  TRUE,
  TRUE,
  '{"consistent": true, "confidenceScore": 95, "details": "Ambas as partes concordam sobre a sobrecarga devido à falta de profissional sênior."}'
),
(
  'c0e8d1a1-aaaa-bbbb-cccc-000000000002',
  'b0e8d1a1-1111-2222-3333-000000000001',
  '2026-07-10',
  'Alinhamento Técnico',
  'Gargalos no fluxo de homologação e code review da squad de APIs.',
  '### Roteiro Recomendado\n\n1. Discussão de gargalos\n2. Autonomia de deploys\n3. Métricas de qualidade',
  'Carlos demonstra irritação com o fluxo de QA corporativo. Exige autonomia total para pular revisões.',
  'A revisão de código atual é muito lenta. Atraso meu trabalho por burocracia desnecessária.',
  'Líder: Carlos, precisamos falar sobre o deploy.\nColaborador: É lento demais, quero autonomia total.',
  'Alinhamento sobre processos de code review. Líder reforçou limites de governança mas acordou em levar a discussão à retrospectiva para acelerar o fluxo do QA.',
  TRUE,
  FALSE,
  NULL
),
(
  'c0e8d1a1-aaaa-bbbb-cccc-000000000003',
  'b0e8d1a1-1111-2222-3333-000000000005',
  '2026-07-08',
  'Acompanhamento de PDI',
  'Revisão do PDI focado em automação de testes com Selenium.',
  '### Pauta de PDI\n\n1. Progresso dos estudos\n2. Aplicação prática no projeto\n3. Próximos objetivos',
  'Rodrigo avançou 70% no curso. Já iniciou scripts de teste no repositório piloto.',
  'Muito feliz com a oportunidade. Estou conseguindo aplicar os conceitos em tempo real.',
  'Líder: Como vai o PDI?\nColaborador: Ótimo, já automatizei 5 fluxos críticos.',
  'Sessão focada na evolução do PDI de automação de Rodrigo. Progresso excelente comprovado com entrega prática no repositório piloto. Próxima meta: automação de APIs.',
  TRUE,
  TRUE,
  '{"consistent": true, "confidenceScore": 100, "details": "Alinhamento perfeito sobre o sucesso do PDI."}'
)
ON CONFLICT DO NOTHING;

-- 4. Insert conflicts
INSERT INTO public.conflicts (id, protocol, collaborator_id, description, date, status, notes, has_history, is_bypass) VALUES
(
  'd0e8d1a1-ffff-eeee-dddd-000000000001',
  'SHR-2026-882710',
  'b0e8d1a1-1111-2222-3333-000000000002',
  'Colaborador Mariana Souza apresenta sintomas severos de burnout e insatisfação com a sobrecarga de tarefas após saída do sênior. Caso escalado após duas conversas de 1:1 sem resolução prática.',
  '2026-07-15',
  'PENDING',
  'Ata de 15/06 aponta desalinhamento crônico e exaustão mental.',
  TRUE,
  FALSE
),
(
  'd0e8d1a1-ffff-eeee-dddd-000000000002',
  'SHR-2026-993812',
  'b0e8d1a1-1111-2222-3333-000000000005',
  'Rodrigo Costa solicitou bypass direto devido a atrito severo de comunicação técnica com a coordenação de QA. Bypass acionado diretamente para RH.',
  '2026-07-14',
  'IN_INVESTIGATION',
  'Agendada reunião de mediação com Priscila Bacelar para 20/07.',
  FALSE,
  TRUE
)
ON CONFLICT DO NOTHING;
