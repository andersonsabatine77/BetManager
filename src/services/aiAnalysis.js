import AsyncStorage from '@react-native-async-storage/async-storage';

export const ANTHROPIC_KEY_STORAGE = '@betmanager_anthropic_key'; // reused as generic AI key storage

// Models to try in order — first that works is used
const GEMINI_MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-pro',
];

async function callGemini(apiKey, prompt) {
  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
      }),
    });

    if (res.status === 400 || res.status === 403) throw new Error('INVALID_AI_KEY');
    if (res.status === 404) continue; // try next model
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`AI_ERROR_${res.status}: ${body.slice(0, 100)}`);
    }
    return res;
  }
  throw new Error('AI_ERROR_404: nenhum modelo disponível');
}

export async function analyzeMatch(match) {
  const apiKey = await AsyncStorage.getItem(ANTHROPIC_KEY_STORAGE);
  if (!apiKey) throw new Error('NO_AI_KEY');

  const prompt = `Você é um especialista em análise estatística para apostas esportivas. Analise o seguinte jogo:

Competição: ${match.liga}
Mandante: ${match.time1}
Visitante: ${match.time2}

Com base no histórico recente dessas equipes e padrões da ${match.liga}, identifique as 3 MELHORES entradas de aposta. Analise obrigatoriamente:
- Gols: Over/Under 0.5, 1.5, 2.5, 3.5
- Ambos Marcam (BTTS): Sim ou Não
- Escanteios: Mais/Menos de 8.5, 9.5, 10.5
- Cartões: Mais/Menos de 3.5, 4.5
- Resultado: Vitória Mandante, Empate, Vitória Visitante, Dupla Chance 1X ou X2

Escolha as entradas com MAIOR probabilidade baseada no padrão histórico real das equipes.

Responda SOMENTE com JSON válido, sem texto antes ou depois:
{
  "sugestoes": [
    {"tipo": "...", "confianca": 75, "razao": "explicação curta em português"},
    {"tipo": "...", "confianca": 70, "razao": "explicação curta em português"},
    {"tipo": "...", "confianca": 65, "razao": "explicação curta em português"}
  ]
}`;

  const res = await callGemini(apiKey, prompt);

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('PARSE_ERROR');
  return JSON.parse(jsonMatch[0]);
}

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
