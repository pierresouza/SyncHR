import { NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { 
      leaderProfile, 
      collaboratorName, 
      collaboratorDisc, 
      collaboratorLevel, 
      meetingType, 
      context,
      ataTemplateId
    } = await request.json();

    const systemInstruction = `Você é o especialista de Engenharia de Liderança do Smart Leading.
Sua missão é gerar um Roteiro de Apoio Inteligente (Cheatsheet) para uma reunião de 1:1, garantindo que o roteiro NÃO seja uma muleta (texto para ler em voz alta), mas sim tópicos de apoio concisos e práticos.

Você deve estruturar a resposta obrigatoriamente como um objeto JSON válido, contendo as seguintes propriedades:
1. "script": Texto em Markdown contendo:
   - Uma seção de preparação rápida (menos de 3 minutos).
   - "💡 Conselho da Persona de RH (Priscila Bacelar)" personalizado para o cenário.
   - De 2 a 3 "Perguntas de Ouro" concisas e provocativas sobre o contexto, sem rodeios.
   - Um checklist curto de combinados.
2. "kanbanTasks": Um array com 2 a 4 sugestões de tarefas práticas sugeridas para o plano de ação (formato: { "id": string, "title": string, "status": "todo" | "in_progress" | "done" }).
3. "deliveryAdjustment": Um objeto formatado como { "proposedDeadline": string, "scopeChange": string, "rationale": string } sugerindo um trade-off prático de prazos ou escopo se aplicável ao contexto.

Considere rigorosamente os vetores para calibrar o tom das perguntas e dicas:
- Perfil do Líder (${leaderProfile || 'TRANSICAO'}):
  * TECNICO: Linguagem curta, direta ao ponto, zero jargões de RH. Foco em entregas e blockers de infra/código.
  * TRANSICAO: Roteiro estruturado, focando no método SBI (Situação-Comportamento-Impacto) com apoio de inteligência emocional.
  * ENGAJADO: Tópicos ultra dinâmicos de PDI, alinhamento rápido e planos de carreira.
- Perfil DISC do Colaborador (${collaboratorDisc || 'ESTAVEL'}):
  * DOMINANTE: Foco em resultados, desafios, autonomia.
  * INFLUENTE: Foco em entrosamento, engajamento do time, exposição positiva.
  * ESTÁVEL: Foco em processos, ritmo de trabalho sustentável, segurança psicológica.
  * ANALÍTICO: Foco em métricas de qualidade, bugs, dados estruturados.
- Nível de Maturidade (${collaboratorLevel || 'L2'}):
  * L1 (Júnior): Requer suporte constante, tarefas menores, feedback direto de capacitação.
  * L2 (Pleno): Autonomia acompanhada com foco em desenvolvimento e calibração de complexidade.
  * L3 (Sênior): Delegação estratégica, liderança técnica, remoção de burocracias de alto nível.
  * L4 (Staff/Principal): Mentoria organizacional, arquitetura de sistemas, impacto de negócio.
  
Caso o contexto indique atrasos, use o "deliveryAdjustment" para sugerir ajustes práticos de entrega.`;

    const prompt = `Gere o roteiro para:
    Liderado: ${collaboratorName} (Nível ${collaboratorLevel}, DISC: ${collaboratorDisc})
    Tipo de Reunião: ${meetingType} (Modelo ATA: ${ataTemplateId || 'Padrao'})
    Contexto / Dor Atual: "${context || 'Alinhamento rotineiro'}"
    
    Retorne APENAS o JSON puro. Não inclua blocos de código markdown (como \`\`\`json).`;

    const aiOutput = await callGemini(systemInstruction, prompt, true);
    
    // Parse JSON
    let parsedResult;
    try {
      // Clean possible wrapper blocks
      const cleanJson = aiOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleanJson);
    } catch (parseError) {
      console.warn("Falha ao parsear JSON gerado pelo Gemini. Usando fallback estruturado.", parseError);
      parsedResult = {
        script: aiOutput || `### Roteiro de 1:1\n\n- Foco em: ${meetingType}\n- Apoio para liderado ${collaboratorDisc}\n\n${aiOutput}`,
        kanbanTasks: [
          { id: '1', title: 'Alinhar blockers de deploy', status: 'todo' },
          { id: '2', title: 'Definir plano de ação para a Sprint', status: 'todo' }
        ],
        deliveryAdjustment: {
          proposedDeadline: 'Manter cronograma atual',
          scopeChange: 'Nenhuma alteração sugerida',
          rationale: 'Contexto rotineiro de acompanhamento.'
        }
      };
    }

    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error('Erro na rota de geração de roteiro:', error);
    return NextResponse.json({ error: error.message || 'Erro ao gerar roteiro.' }, { status: 500 });
  }
}
