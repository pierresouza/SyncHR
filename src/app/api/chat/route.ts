import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message, profile } = await request.json();
    
    // Simulate real-time processing delay
    await new Promise((resolve) => setTimeout(resolve, 400));

    let aiResponse = "";
    const cleanMsg = message.toLowerCase();

    if (cleanMsg.includes("sobrecarregado")) {
      if (profile === 'TECNICO') {
        aiResponse = "Oriente o líder a revisar a distribuição de tarefas técnicas da sprint. Questione: 'Quais itens do backlog podemos repassar ou adiar?'";
      } else if (profile === 'ENGAJADO') {
        aiResponse = "Ação rápida recomendada: Faça um exercício de 2 minutos priorizando as top 3 entregas dele e limpe as distrações secundárias da agenda.";
      } else {
        aiResponse = "Foque na escuta ativa. Pergunte: 'Entendo perfeitamente. O que especificamente na carga atual está demandando mais de você? É um bloqueio técnico ou volume?'";
      }
    } else if (cleanMsg.includes("pdi") || cleanMsg.includes("carreira")) {
      aiResponse = "Conecte a tarefa atual a uma competência técnica L3/L4. Pergunte quais tecnologias do projeto ele quer dominar nas próximas sprints e construam uma meta simples.";
    } else if (cleanMsg.includes("confiança") || cleanMsg.includes("anterior")) {
      aiResponse = "Valide o sentimento (Regra 70/30). Pergunte o que causou essa percepção e combinem um registro transparente compartilhado das atas de 1:1 a partir de hoje para reconstruir a relação.";
    } else {
      aiResponse = `[IA de Tempo Real] Para o perfil de liderança ${profile}, guie a conversa pedindo que ele detalhe o ponto levantado: "${message}". Lembre-se de manter a regra 70/30 (ouça 70%, fale 30%).`;
    }

    return NextResponse.json({ text: aiResponse });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno de processamento.' }, { status: 500 });
  }
}
