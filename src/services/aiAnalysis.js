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
      max_tokens: 1500,
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

  const limited = matches.slice(0, 4);
  const lista = limited.map(m =>
    `ID:${m.id}|${m.liga}|${m.time1} vs ${m.time2}`
  ).join('\n');

  const prompt = `Analise estes jogos de futebol. Para cada jogo, liste APENAS as apostas onde você tem confiança MÍNIMA de 60%. Escolha entre: Over/Under gols (1.5, 2.5, 3.5), BTTS, escanteios (8.5, 9.5, 10.5), cartões (3.5, 4.5), resultado (1X2, dupla chance). Se não tiver 60% de confiança em nada, coloque as mais prováveis com confiança real. Nunca invente confiança alta — seja preciso.

${lista}

JSON (sem texto fora):
{"analises":[{"id":"ID","sugestoes":[{"tipo":"Mais de 2.5 Gols","confianca":72,"razao":"razão curta"},{"tipo":"Ambos Marcam - Sim","confianca":68,"razao":"razão curta"},{"tipo":"Dupla Chance 1X","confianca":65,"razao":"razão curta"}]}]}`;

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
