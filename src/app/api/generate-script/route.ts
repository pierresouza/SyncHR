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
      let cleanJson = aiOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // Attempt to extract the JSON object substring
      const firstBrace = cleanJson.indexOf('{');
      const lastBrace = cleanJson.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
      }
      
      parsedResult = JSON.parse(cleanJson);
    } catch (parseError) {
      console.warn("Falha ao parsear JSON gerado pelo Gemini. Tentando sanitização secundária.", parseError);
      try {
        let cleanJson = aiOutput.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBrace = cleanJson.indexOf('{');
        const lastBrace = cleanJson.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
        }
        
        // Clean newlines inside string properties
        let insideString = false;
        let escaped = false;
        let sanitizedJson = "";
        for (let i = 0; i < cleanJson.length; i++) {
          const char = cleanJson[i];
          if (char === '"' && !escaped) {
            insideString = !insideString;
            sanitizedJson += char;
          } else if (char === '\\' && !escaped) {
            escaped = true;
            sanitizedJson += char;
          } else {
            escaped = false;
            if (insideString && (char === '\n' || char === '\r')) {
              sanitizedJson += '\\n';
            } else {
              sanitizedJson += char;
            }
          }
        }
        parsedResult = JSON.parse(sanitizedJson);
      } catch (fallbackError) {
        console.warn("Falha na sanitização secundária. Usando fallback regex e estruturado.", fallbackError);
        
        // Try regex to extract script field content
        const scriptMatch = aiOutput.match(/"script"\s*:\s*"([\s\S]*?)"\s*(?:,|\})/i) || 
                            aiOutput.match(/"script"\s*:\s*"([\s\S]*?)"/i);
        let extractedScript = "";
        if (scriptMatch) {
          extractedScript = scriptMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
        } else {
          // If regex doesn't match a clean string, try to clean the raw output
          extractedScript = aiOutput.replace(/[{}"']/g, '').trim();
        }

        parsedResult = {
          script: extractedScript || `### Roteiro de 1:1\n\n- Foco em: ${meetingType}\n- Apoio para liderado ${collaboratorDisc}\n\n${aiOutput}`,
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
    }

    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error('Erro na rota de geração de roteiro:', error);
    return NextResponse.json({ error: error.message || 'Erro ao gerar roteiro.' }, { status: 500 });
  }
}
