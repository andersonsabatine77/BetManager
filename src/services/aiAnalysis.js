import AsyncStorage from '@react-native-async-storage/async-storage';

export const ANTHROPIC_KEY_STORAGE = '@betmanager_anthropic_key';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';

async function callGroq(apiKey, prompt) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 3000,
    }),
  });
  if (res.status === 401) throw new Error('INVALID_AI_KEY');
  if (res.status === 429) throw new Error('QUOTA_429');
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`AI_ERROR_${res.status}: ${body.slice(0, 80)}`);
  }
  return res;
}

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

  const prompt = `Você é especialista em apostas esportivas. Analise os jogos e para CADA UM sugira as 3 melhores entradas: gols (Over/Under 0.5/1.5/2.5/3.5), BTTS, escanteios (8.5/9.5/10.5), cartões (3.5/4.5), resultado (1X2, dupla chance).

JOGOS:
${lista}

Responda SOMENTE com JSON válido (sem texto antes ou depois):
{"analises":[{"id":"ID_DO_JOGO","sugestoes":[{"tipo":"Mais de 2.5 Gols","confianca":75,"razao":"motivo curto"},{"tipo":"Ambos Marcam - Sim","confianca":70,"razao":"motivo curto"},{"tipo":"Vitória Mandante","confianca":65,"razao":"motivo curto"}]}]}`;

  try {
    const res = await callGroq(apiKey, prompt);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('PARSE_ERROR');

    const parsed = JSON.parse(jsonMatch[0]);
    const analises = parsed.analises || [];

    limited.forEach(m => {
      const found = analises.find(a => String(a.id) === String(m.id));
      onResult(m.id, { data: found?.sugestoes?.length ? found.sugestoes : null, error: null });
    });
  } catch (e) {
    const msg = e.message === 'QUOTA_429' ? 'Cota Groq atingida — tente em 1 min'
      : e.message === 'INVALID_AI_KEY' ? 'Chave Groq inválida — verifique em Configurações'
      : `Erro IA: ${e.message}`;
    limited.forEach(m => onResult(m.id, { data: null, error: msg }));
  }
}

export async function analyzeMatch() { return { sugestoes: [] }; }
