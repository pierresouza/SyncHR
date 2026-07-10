import { NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { 
      rawLeaderNotes, 
      rawCollaboratorNotes, 
      transcription, 
      collaboratorName, 
      collaboratorDisc 
    } = await request.json();

    const systemInstruction = `Você é o auditor de qualidade e inteligência organizacional do Smart Leading.
Sua missão é analisar os inputs de uma reunião 1:1 e gerar uma avaliação detalhada e um resumo unificado.

Você receberá três entradas brutas (RAW):
1. Notas do Líder (Percepção do Líder sobre a reunião)
2. Notas do Colaborador (Percepção do Colaborador sobre a reunião)
3. Transcrição/Notas da conversa (O que foi falado)

Sua resposta deve ser obrigatoriamente um objeto JSON contendo as seguintes propriedades:
1. "score": Uma nota de 0 a 100 avaliando a qualidade metodológica da reunião (se houve foco em soluções, empatia e clareza).
2. "feedback": Um comentário geral sobre a condução da reunião e dicas de melhoria de liderança.
3. "topics": Um array de strings com as tags de tópicos discutidos (ex: ["PDI", "Cansaço", "Deploy", "Prazo", "Conflito"]).
4. "finalSummary": Uma síntese objetiva, profissional e unificada da reunião, mesclando as percepções de ambos de forma justa.
5. "consistencyResult": Um objeto contendo:
   - "consistent": boolean (true se as percepções do líder e do colaborador estiverem em concordância; false se houver conflito ou desalinhamento claro).
   - "confidenceScore": número de 0 a 100 indicando o nível de concordância mútua.
   - "details": Explicação detalhada da análise de concordância (onde concordam, onde divergem e o que precisa ser esclarecido).
6. "hasConflict": boolean (true se for detectada alta discordância, queixas severas de sobrecarga, desvios éticos ou atrito grave).

Diretriz de Segurança:
- Se "hasConflict" for true, o sistema criará um alerta para o RH.
- Nunca inclua dados sensíveis ou informações de saúde explícitas nas respostas. Mantenha tom confidencial e ético.`;

    const prompt = `Analise os dados da 1:1 com o colaborador ${collaboratorName} (DISC: ${collaboratorDisc}):
    
    ---
    [NOTAS DO LÍDER - RAW]:
    "${rawLeaderNotes || 'Não fornecidas.'}"
    
    ---
    [NOTAS DO COLABORADOR - RAW]:
    "${rawCollaboratorNotes || 'Não fornecidas.'}"
    
    ---
    [TRANSCRIÇÃO/NOTAS DA CONVERSA - RAW]:
    "${transcription || 'Não fornecida.'}"
    
    Retorne APENAS o JSON puro. Não inclua blocos de código markdown.`;

    const aiOutput = await callGemini(systemInstruction, prompt, true);

    let parsedResult;
    try {
      const cleanJson = aiOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleanJson);
    } catch (parseError) {
      console.warn("Falha ao parsear avaliação do Gemini. Gerando fallback estruturado.", parseError);
      
      // Basic heuristic consistency check as fallback
      const leaderWords = (rawLeaderNotes || '').toLowerCase();
      const colabWords = (rawCollaboratorNotes || '').toLowerCase();
      
      let consistent = true;
      let details = "Análise automática de consistência concluída.";
      let confidenceScore = 90;
      let hasConflict = false;

      if (leaderWords.includes('atraso') && colabWords.includes('sobrecarga')) {
        consistent = false;
        confidenceScore = 50;
        details = "Divergência provável: Líder aponta atrasos de entrega, enquanto o colaborador relata sobrecarga de tarefas.";
        hasConflict = true;
      }

      parsedResult = {
        score: 75,
        feedback: "Avaliação gerada pelo motor de fallback. A reunião cobrou pontos de ação importantes, mas certifique-se de registrar as percepções de forma integrada.",
        topics: ["Rotina", "Alinhamento"],
        finalSummary: `Reunião de 1:1 realizada com ${collaboratorName}. Notas sintetizadas de alinhamento tático.`,
        consistencyResult: {
          consistent,
          confidenceScore,
          details
        },
        hasConflict
      };
    }

    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error('Erro na rota de avaliação de 1:1:', error);
    return NextResponse.json({ error: error.message || 'Erro ao avaliar reunião.' }, { status: 500 });
  }
}
