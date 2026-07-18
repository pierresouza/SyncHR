'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Play, Check } from 'lucide-react';
import Swal from 'sweetalert2';
import { UserSession, Collaborator } from '@/types';

interface SimAnswerOption {
  text: string;
  points: number;
  feedback: string;
  discTrait: string;
}

interface SimStepData {
  colabSpeech: string;
  options: SimAnswerOption[];
}

interface SimScenarioData {
  collaboratorId: string;
  name: string;
  disc: 'DOMINANTE' | 'ESTAVEL' | 'ANALITICO' | 'INFLUENTE';
  role: string;
  introText: string;
  abertura: SimStepData;
  desenvolvimento: SimStepData;
  fechamento: SimStepData;
}

const SIMULATOR_SCENARIOS: Record<string, SimScenarioData> = {
  'colab-01': {
    collaboratorId: 'colab-01',
    name: 'Carlos Santos (L3)',
    disc: 'DOMINANTE',
    role: 'Dev Back-end Sênior',
    introText: 'Carlos está visivelmente irritado com gargalos de homologação que atrasam o deploy de suas APIs.',
    abertura: {
      colabSpeech: '"Direto ao ponto: eu terminei minhas tarefas de backend há três dias, mas o time de QA e homologação travou tudo. Não posso responder por atraso deles."',
      options: [
        {
          text: '"Carlos, compreendo seu foco em entregar rápido. Vamos analisar os gargalos do fluxo de QA juntos com dados concretos na retro."',
          points: 10,
          feedback: 'Excelente! Você reconheceu o perfil focado em resultados do Dominante, evitou discussões subjetivas e propôs uma abordagem orientada a dados e solução conjunta.',
          discTrait: 'D (Foco em Resultados)'
        },
        {
          text: '"Calma Carlos, você precisa ser mais paciente e aprender a trabalhar de forma mais harmoniosa com as outras equipes."',
          points: 3,
          feedback: 'Inadequado. Dizer para um Dominante ter "calma" ou ser "paciente" soa condescendente e foca na atitude em vez do problema prático de entrega.',
          discTrait: 'S (Paciência)'
        },
        {
          text: '"Não se preocupe com o QA, o importante é que você fez sua parte técnica e concluiu o desenvolvimento."',
          points: 5,
          feedback: 'Razoável, mas passivo. Não resolve a dor dele sobre o gargalo e estimula o isolamento departamental (silos).',
          discTrait: 'C (Conformidade)'
        }
      ]
    },
    desenvolvimento: {
      colabSpeech: '"O processo deles de code review é burocrático e lento demais. Quero autonomia para pular a aprovação de QA e fazer deploy em produção direto nas minhas tarefas."',
      options: [
        {
          text: '"Liberar deploy direto sem code review viola nossas regras de segurança da Clear IT. But podemos revisar o processo para torná-lo mais ágil."',
          points: 10,
          feedback: 'Excelente! Definiu um limite claro de governança (segurança/processo) sem parecer autoritário, abrindo espaço para otimização prática do fluxo.',
          discTrait: 'C (Segurança e Limites)'
        },
        {
          text: '"Você tem razão, o QA é muito lento. Vou falar com o líder de QA para darem prioridade exclusiva aos seus cartões."',
          points: 4,
          feedback: 'Fraco. Cria um privilégio individual indevido, gera atritos políticos com a liderança de QA e não resolve o problema sistêmico.',
          discTrait: 'I (Influência Política)'
        },
        {
          text: '"Fazer deploy sem revisão viola as regras. Você precisa seguir os processos estabelecidos sem reclamar."',
          points: 6,
          feedback: 'Razoável por manter a segurança, mas excessivamente rígido e burocrático. Desmotiva a iniciativa de melhoria do Dominante.',
          discTrait: 'D (Autoritarismo)'
        }
      ]
    },
    fechamento: {
      colabSpeech: '"Tudo bem, entendi a barreira. Em termos práticos de plano de ação de PDI, o que vamos combinar?"',
      options: [
        {
          text: '"Vamos estabelecer um SLA de code review de 24h. Sua ação de PDI será mapear os gargalos e propor um script de automação de testes."',
          points: 10,
          feedback: 'Perfeito! Canalizou a energia do Dominante para uma liderança técnica construtiva e propositiva, vinculando ao PDI um objetivo mensurável.',
          discTrait: 'D (Liderança e Autonomia)'
        },
        {
          text: '"Eu vou monitorar as tarefas de QA e te aviso quando liberarem."',
          points: 4,
          feedback: 'Ruim. Tira a autonomia do colaborador e cria uma dependência desnecessária do líder (microgestão).',
          discTrait: 'S (Paternalismo)'
        },
        {
          text: '"O combinado é você aguardar o fluxo normal e preencher uma planilha de atrasos toda vez que travar."',
          points: 5,
          feedback: 'Burocrático e frustrante para um profissional sênior focado em resultados.',
          discTrait: 'C (Excesso de Burocracia)'
        }
      ]
    }
  },
  'colab-02': {
    collaboratorId: 'colab-02',
    name: 'Mariana Souza (L2)',
    disc: 'ESTAVEL',
    role: 'Dev Front-end Pleno',
    introText: 'Mariana está silenciosa e cansada devido a constantes mudanças de escopo que a deixam insegura.',
    abertura: {
      colabSpeech: '"Eu... eu ando muito cansada. Tem muita tarefa mudando de prioridade a cada três dias e sinto que não estou entregando nada com qualidade."',
      options: [
        {
          text: '"Mariana, sinto muito que esteja passando por isso. Vamos revisar a pauta e definir o que é prioridade inegociável esta semana para te dar previsibilidade."',
          points: 10,
          feedback: 'Excelente! O Estável precisa de segurança, clareza no processo e previsibilidade. Focar em blindar a sprint é a melhor resposta relacional.',
          discTrait: 'S (Segurança e Processos)'
        },
        {
          text: '"Mas o mercado de tecnologia na Clear IT é ágil, precisamos nos adaptar rápido às mudanças de arquitetura!"',
          points: 4,
          feedback: 'Inadequado. Desconsidera a dor emocional e a necessidade de estabilidade da colaboradora, gerando ansiedade.',
          discTrait: 'D (Cobrança Insensível)'
        },
        {
          text: '"Se você organizar melhor sua agenda e fizer horas extras conseguirá terminar tudo, mesmo mudando o escopo."',
          points: 3,
          feedback: 'Ruim. Estimula o burnout e não resolve o problema do desalinhamento gerencial.',
          discTrait: 'C (Rigidez Operacional)'
        }
      ]
    },
    desenvolvimento: {
      colabSpeech: '"O Product Manager traz requisitos novos sem atualizar a documentação. Dá vontade de parar de programar."',
      options: [
        {
          text: '"Compreendo. Vou alinhar com o PM que nenhuma alteração entra no Kanban sem especificação de API atualizada no Confluence."',
          points: 10,
          feedback: 'Excelente! Mostrou atitude de líder facilitador, protegendo os processos e estabelecendo uma governança clara para a tranquilidade de Mariana.',
          discTrait: 'S (Proteção de Equipe)'
        },
        {
          text: '"Você precisa ser mais resiliente e ir falar diretamente com o PM para resolver isso no bate-papo."',
          points: 4,
          feedback: 'Fraco. Empurra a responsabilidade política para uma desenvolvedora com perfil de comunicação estável/passiva, gerando desconforto.',
          discTrait: 'I (Delegação Relacional)'
        },
        {
          text: '"Não se preocupe com documentação. Apenas continue codificando como puder e depois ajustamos os bugs."',
          points: 5,
          feedback: 'Razoável, mas estimula o retrabalho e a falta de capricho técnico.',
          discTrait: 'C (Desenho Técnico)'
        }
      ]
    },
    fechamento: {
      colabSpeech: '"Agradeço muito o apoio. Com isso, qual será o nosso combinado de PDI real?"',
      options: [
        {
          text: '"Sua meta será focar em estruturar o novo design system e faremos check-ins quinzenais calmos nas quintas-feiras para validar o progresso."',
          points: 10,
          feedback: 'Excelente! Definiu um escopo estável de longo prazo e check-ins fixos previsíveis que transmitem alta segurança comportamental.',
          discTrait: 'S (Previsibilidade e Acolhimento)'
        },
        {
          text: '"A meta é você duplicar a velocidade de entrega para compensar os atrasos anteriores."',
          points: 3,
          feedback: 'Inadequado. Assusta a profissional que acabou de reportar estafa mental.',
          discTrait: 'D (Pressão Desmedida)'
        },
        {
          text: '"Vamos ver como as coisas fluem na próxima sprint e depois decidimos o que combinar."',
          points: 5,
          feedback: 'Vago demais para o perfil de Mariana, que necessita de metas explícitas.',
          discTrait: 'I (Improviso Relacional)'
        }
      ]
    }
  }
};

interface InteractiveSimulatorProps {
  currentUser: UserSession;
  collaborators: Collaborator[];
  fetchDatabaseData: (user: UserSession) => void;
}

export default function InteractiveSimulator({
  currentUser,
  collaborators,
  fetchDatabaseData
}: InteractiveSimulatorProps) {
  const [simColabId, setSimColabId] = useState('colab-01');
  const [simPhase, setSimPhase] = useState<'intro' | 'abertura' | 'desenvolvimento' | 'fechamento' | 'feedback'>('intro');
  const [simScore, setSimScore] = useState(0);
  const [simAnswersHistory, setSimAnswersHistory] = useState<any[]>([]);
  const [simIaFeedback, setSimIaFeedback] = useState('');

  const handleStartSimulation = () => {
    setSimPhase('abertura');
    setSimScore(0);
    setSimAnswersHistory([]);
    setSimIaFeedback('');
  };

  const handleChooseSimOption = (option: SimAnswerOption) => {
    const scenario = SIMULATOR_SCENARIOS[simColabId];
    const newHistory = [
      ...simAnswersHistory,
      {
        phase: simPhase,
        question: scenario[simPhase as 'abertura' | 'desenvolvimento' | 'fechamento'].colabSpeech,
        answer: option.text,
        points: option.points,
        feedback: option.feedback,
        discTrait: option.discTrait
      }
    ];

    setSimAnswersHistory(newHistory);
    setSimScore(prev => prev + option.points);

    if (simPhase === 'abertura') {
      setSimPhase('desenvolvimento');
    } else if (simPhase === 'desenvolvimento') {
      setSimPhase('fechamento');
    } else {
      setSimPhase('feedback');
      const totalPoints = simScore + option.points;
      const percentage = Math.round((totalPoints / 30) * 100);
      let review = "";
      if (percentage >= 85) {
        review = `Excelente calibração relacional! Você se provou apto a liderar colaboradores do tipo ${scenario.disc} na Clear IT, minimizando ruídos e focando em planos de PDI tangíveis.`;
      } else if (percentage >= 60) {
        review = `Bom aproveitamento. Você ouviu as dores do liderado, mas algumas respostas focaram excessivamente em jargões formais em vez de sanar as necessidades específicas do perfil DISC.`;
      } else {
        review = `Atenção: Seu comportamento tendeu a ser desalinhado com as necessidades do liderado. Revise as diretrizes do guia DISC de liderança corporativa da Clear IT.`;
      }
      setSimIaFeedback(review);
    }
  };

  const handleSaveSimToDb = async () => {
    const scenario = SIMULATOR_SCENARIOS[simColabId];
    const percentage = Math.round((simScore / 30) * 100);
    const summaryScript = `### Resumo da Reunião Simulada (DISC)
**Colaborador:** ${scenario.name}
**Perfil DISC:** ${scenario.disc}
**Cargo:** ${scenario.role}
**Aproveitamento do Gestor:** ${percentage}% (${simScore}/30 pts)

---
` + simAnswersHistory.map(h => `* **Fase:** ${h.phase.toUpperCase()}
  * **Fala:** ${h.question}
  * **Sua Resposta:** ${h.answer}
  * **Conselho:** ${h.feedback}`).join('\n');

    try {
      const { error } = await supabase.from('one_on_ones').insert({
        collaborator_id: collaborators[0]?.id || null,
        date: new Date().toISOString().split('T')[0],
        type: 'Simulada (DISC)',
        context: scenario.introText,
        script_text: summaryScript,
        raw_leader_notes: `Aproveitamento na simulação: ${percentage}%`,
        raw_collaborator_notes: 'Feedback da simulação de IA gravado.',
        final_summary: `O líder realizou uma simulação de 1:1 com a persona de teste ${scenario.name} com um aproveitamento final de ${percentage}%.`,
        leader_approved: true,
        collaborator_approved: true
      });

      if (error) throw error;

      Swal.fire({
        title: 'Simulação Arquivada!',
        text: 'A simulação foi gravada no Supabase como registro de evolução contínua da liderança.',
        icon: 'success',
        background: '#0f172a',
        color: '#cbd5e1'
      });

      setSimPhase('intro');
      fetchDatabaseData(currentUser);
    } catch (err: any) {
      Swal.fire('Erro ao salvar', err.message, 'error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in text-left">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-100 font-title">Simulador de Diálogos DISC</h2>
        <p className="text-xs text-slate-400">Treine suas respostas como líder escolhendo a melhor abordagem para lidar com as reações comportamentais dos seus liderados.</p>
      </div>

      {simPhase === 'intro' ? (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-950/40 text-center space-y-4">
          <Play className="w-12 h-12 mx-auto text-indigo-400 animate-pulse" />
          <div className="space-y-1">
            <h3 className="font-bold text-slate-200 text-sm font-title">Iniciar Nova Simulação</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Selecione um perfil de colaborador na lista e tente maximizar seus pontos escolhendo a atitude empática correta.
            </p>
          </div>

          <div className="space-y-2 max-w-sm mx-auto">
            <label className="text-xs text-slate-500 font-mono block">Escolher Colaborador de Teste:</label>
            <select
              value={simColabId}
              onChange={(e) => setSimColabId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-slate-200 text-xs focus:outline-none"
            >
              <option value="colab-01">Carlos Santos (DOMINANTE)</option>
              <option value="colab-02">Mariana Souza (ESTÁVEL)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleStartSimulation}
            className="bg-indigo-650 hover:bg-indigo-550 text-slate-100 text-xs font-bold py-2.5 px-8 rounded-xl transition-all"
          >
            Iniciar Simulação de Reunião
          </button>
        </div>
      ) : (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-6">
          {/* Status header */}
          <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-3">
            <span className="text-slate-400 font-mono">Fase: <strong>{simPhase.toUpperCase()}</strong></span>
            <span className="bg-indigo-950 border border-indigo-900 text-indigo-400 px-2 py-0.5 rounded font-bold font-mono">Pontos: {simScore}</span>
          </div>

          {simPhase !== 'feedback' ? (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-850 space-y-2">
                <div className="text-[10px] text-indigo-400 font-bold uppercase font-mono tracking-wider">Frente de Conversa:</div>
                <p className="text-xs text-slate-200 leading-relaxed italic">
                  {SIMULATOR_SCENARIOS[simColabId][simPhase as 'abertura' | 'desenvolvimento' | 'fechamento'].colabSpeech}
                </p>
              </div>

              <div className="space-y-2.5">
                {SIMULATOR_SCENARIOS[simColabId][simPhase as 'abertura' | 'desenvolvimento' | 'fechamento'].options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleChooseSimOption(opt)}
                    className="w-full p-3.5 text-xs text-left bg-slate-900/20 border border-slate-900 hover:border-indigo-950 hover:bg-slate-900/50 rounded-xl text-slate-300 transition-all leading-relaxed"
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-center animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold">✓</div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-200">Simulação Concluída!</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  A IA avaliou seu estilo de calibragem.
                </p>
                <div className="text-2xl font-black text-indigo-400 font-mono">{simScore} / 30 Pontos</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-850 max-w-md mx-auto text-xs text-slate-400 leading-relaxed text-left space-y-3">
                <div className="font-bold text-slate-300">Análise do Copiloto de IA:</div>
                <p className="italic">"{simIaFeedback}"</p>
                <div className="border-t border-slate-850 pt-2 space-y-2">
                  <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wider block">Histórico de Escolhas:</span>
                  {simAnswersHistory.map((h, i) => (
                    <div key={i} className="text-[11px] pb-1 border-b border-slate-900 last:border-0">
                      <p><strong>{h.phase.toUpperCase()}:</strong> {h.points} pts - <span className="text-indigo-400 font-semibold">{h.discTrait}</span></p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 max-w-sm mx-auto pt-2">
                <button
                  onClick={() => setSimPhase('intro')}
                  className="bg-slate-900 border border-slate-850 text-slate-400 text-xs font-bold py-2.5 px-5 rounded-xl flex-1"
                >
                  Tentar Novamente
                </button>
                <button
                  onClick={handleSaveSimToDb}
                  className="bg-indigo-650 hover:bg-indigo-550 text-slate-100 text-xs font-bold py-2.5 px-5 rounded-xl flex-1"
                >
                  Gravar no Supabase
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
