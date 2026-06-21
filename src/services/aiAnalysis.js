import AsyncStorage from '@react-native-async-storage/async-storage';

export const ANTHROPIC_KEY_STORAGE = '@betmanager_anthropic_key'; // reused as generic AI key storage

const GEMINI_MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-pro',
];

async function callGemini(apiKey, prompt, maxTokens = 2000) {
  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: maxTokens },
      }),
    });
    if (res.status === 400 || res.status === 403) throw new Error('INVALID_AI_KEY');
    if (res.status === 404) continue;
    if (res.status === 429) throw new Error('QUOTA_429');
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`AI_ERROR_${res.status}: ${body.slice(0, 80)}`);
    }
    return res;
  }
  throw new Error('AI_ERROR_404');
}

// UMA única chamada com todos os jogos — evita rate limiting
export async function analyzeMatchesBatch(matches, onResult) {
  const apiKey = await AsyncStorage.getItem(ANTHROPIC_KEY_STORAGE);
  if (!apiKey) {
    matches.forEach(m => onResult(m.id, { data: null, error: 'NO_AI_KEY' }));
    return;
  }

  const limited = matches.slice(0, 8);

  const lista = limited.map((m, i) =>
    `${i + 1}. ID:${m.id} | ${m.liga} | Mandante: ${m.time1} | Visitante: ${m.time2}`
  ).join('\n');

  const prompt = `Você é um especialista em análise de apostas esportivas. Analise os jogos abaixo e para CADA UM sugira as 3 melhores entradas considerando: gols (Over/Under 0.5/1.5/2.5/3.5), BTTS (ambos marcam), escanteios (8.5/9.5/10.5), cartões (3.5/4.5), resultado (1X2, dupla chance).

JOGOS:
${lista}

Responda SOMENTE com JSON válido neste formato exato (sem texto antes ou depois):
{
  "analises": [
    {
      "id": "ID_DO_JOGO",
      "sugestoes": [
        {"tipo": "Mais de 2.5 Gols", "confianca": 75, "razao": "motivo curto"},
        {"tipo": "Ambos Marcam - Sim", "confianca": 70, "razao": "motivo curto"},
        {"tipo": "Vitória Mandante", "confianca": 65, "razao": "motivo curto"}
      ]
    }
  ]
}`;

  try {
    const res = await callGemini(apiKey, prompt, 3000);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('PARSE_ERROR');

    const parsed = JSON.parse(jsonMatch[0]);
    const analises = parsed.analises || [];

    // Distribui resultados para cada jogo
    limited.forEach(m => {
      const found = analises.find(a => a.id === m.id);
      if (found?.sugestoes?.length > 0) {
        onResult(m.id, { data: found.sugestoes, error: null });
      } else {
        onResult(m.id, { data: null, error: null }); // sem sugestão mas sem erro
      }
    });
  } catch (e) {
    const msg = e.message === 'QUOTA_429'
      ? 'Cota do Gemini atingida — aguarde 1 minuto'
      : e.message === 'INVALID_AI_KEY'
      ? 'Chave Gemini inválida'
      : `Erro IA: ${e.message}`;
    limited.forEach(m => onResult(m.id, { data: null, error: msg }));
  }
}

// Mantido para compatibilidade (não usado mais)
export async function analyzeMatch(match) {
  return { sugestoes: [] };
}
