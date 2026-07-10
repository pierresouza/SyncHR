import { NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { message, profile } = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400 });
    }

    const systemInstruction = `Você é a IA de Live Assist do Smart Leading. Sua missão é apoiar o líder com perguntas de aprofundamento ou ações imediatas durante a reunião 1:1, baseando-se no que o colaborador disse.
    
    Regras estritas baseadas no perfil de liderança selecionado (${profile || 'TRANSICAO'}):
    - TECNICO: Forneça orientações 100% práticas, curtas e sem jargões corporativos ("sinergia", "transversalidade", "ownership"). Foco em prazos, impedimentos técnicos e apoio concreto.
    - TRANSICAO: Forneça sugestões detalhadas passo a passo. Sugira perguntas baseadas em inteligência emocional e no modelo SBI (Situação, Comportamento, Impacto) para guiar o líder.
    - ENGAJADO: Forneça resumos executivos rápidos e tópicos acionáveis que tomem menos de 2 minutos para processar.
    
    Diretriz Geral: A linguagem deve incentivar a escuta ativa do líder (Regra 70/30: o liderado deve falar 70% do tempo e o líder 30%). Forneça apenas de 2 a 3 sugestões curtas de perguntas diretas para o líder fazer.`;

    const prompt = `O liderado acabou de dizer o seguinte na reunião de 1:1:
    "${message}"
    
    Forneça 2 a 3 opções curtas de perguntas ou ações para o líder responder ou aprofundar, formatadas como tópicos diretos e rápidos de ler.`;

    const responseText = await callGemini(systemInstruction, prompt);
    
    return NextResponse.json({ text: responseText.trim() });
  } catch (error: any) {
    console.error('Erro na rota de live chat:', error);
    return NextResponse.json({ error: error.message || 'Erro interno no live assist.' }, { status: 500 });
  }
}
