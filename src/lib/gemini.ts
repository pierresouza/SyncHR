export async function callGemini(systemInstruction: string, prompt: string, isJson?: boolean): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada no servidor. Por favor, adicione-a nas variáveis de ambiente do seu provedor de deploy.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const generationConfig: any = {
    temperature: 0.4,
    maxOutputTokens: 1500,
  };

  if (isJson) {
    generationConfig.responseMimeType = "application/json";
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Falha na chamada ao Gemini API: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
