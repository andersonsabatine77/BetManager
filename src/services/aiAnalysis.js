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

  const prompt = `You are a sports betting analyst. For each football match below, suggest up to 3 bets with real confidence above 60%. Options: Over/Under goals (1.5,2.5,3.5), BTTS, corners (8.5,9.5,10.5), cards (3.5,4.5), match result (home win, draw, away win, double chance). Be honest about confidence.

Matches:
${lista}

Respond with ONLY a JSON object, no other text:
{"analises":[{"id":"MATCH_ID","sugestoes":[{"tipo":"Over 2.5 Goals","confianca":72,"razao":"short reason in portuguese"}]}]}`;

  try {
    const res = await callGroq(apiKey, prompt);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';

    // Extrai o primeiro objeto JSON válido que contenha "analises"
    const start = text.indexOf('{"analises"');
    if (start === -1) throw new Error('PARSE_ERROR');
    let depth = 0, end = -1;
    for (let i = start; i < text.length; i++) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end === -1) throw new Error('PARSE_ERROR');

    const parsed = JSON.parse(text.slice(start, end + 1));
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
