import AsyncStorage from '@react-native-async-storage/async-storage';

export const ANTHROPIC_KEY_STORAGE = '@betmanager_anthropic_key';

// Analisa um jogo e retorna as 3 melhores sugestões de entrada
export async function analyzeMatch(match) {
  const apiKey = await AsyncStorage.getItem(ANTHROPIC_KEY_STORAGE);
  if (!apiKey) throw new Error('NO_AI_KEY');

  const prompt = `Você é um especialista em análise estatística para apostas esportivas. Analise o seguinte jogo:

Competição: ${match.liga}
Mandante: ${match.time1}
Visitante: ${match.time2}

Com base no histórico recente dessas equipes, padrões da ${match.liga} e estatísticas gerais, identifique as 3 MELHORES entradas de aposta. Analise obrigatoriamente estes mercados:
- Gols: Over/Under 0.5, 1.5, 2.5, 3.5
- Ambos Marcam (BTTS): Sim ou Não
- Escanteios: Mais/Menos de 8.5, 9.5, 10.5
- Cartões: Mais/Menos de 3.5, 4.5
- Resultado: Vitória Mandante, Empate, Vitória Visitante, Dupla Chance 1X ou X2

Critérios: escolha entradas com MAIOR probabilidade real baseada em padrão histórico das equipes. Seja específico na razão.

Responda SOMENTE com JSON válido, sem texto antes ou depois:
{
  "sugestoes": [
    {"tipo": "...", "confianca": 75, "razao": "..."},
    {"tipo": "...", "confianca": 70, "razao": "..."},
    {"tipo": "...", "confianca": 65, "razao": "..."}
  ]
}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (res.status === 401) throw new Error('INVALID_AI_KEY');
  if (!res.ok) throw new Error(`AI_ERROR_${res.status}`);

  const data = await res.json();
  const text = data.content?.[0]?.text || '';

  // Extract JSON even if model adds surrounding text
  const match2 = text.match(/\{[\s\S]*\}/);
  if (!match2) throw new Error('PARSE_ERROR');
  return JSON.parse(match2[0]);
}

// Analisa múltiplos jogos com concorrência limitada
export async function analyzeMatchesBatch(matches, onResult, concurrency = 2) {
  for (let i = 0; i < matches.length; i += concurrency) {
    const batch = matches.slice(i, i + concurrency);
    await Promise.allSettled(
      batch.map(async (match) => {
        try {
          const result = await analyzeMatch(match);
          onResult(match.id, { data: result.sugestoes, error: null });
        } catch (e) {
          onResult(match.id, { data: null, error: e.message });
        }
      })
    );
  }
}
