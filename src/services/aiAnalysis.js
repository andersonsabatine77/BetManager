import AsyncStorage from '@react-native-async-storage/async-storage';

export const ANTHROPIC_KEY_STORAGE = '@betmanager_anthropic_key';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';

// Mapa de tradução PT-BR para tipos de aposta (caso IA responda em inglês)
const TIPO_TRADUCAO = {
  'over 2.5 goals': 'Mais de 2.5 Gols',
  'over 1.5 goals': 'Mais de 1.5 Gols',
  'over 3.5 goals': 'Mais de 3.5 Gols',
  'under 2.5 goals': 'Menos de 2.5 Gols',
  'under 1.5 goals': 'Menos de 1.5 Gols',
  'under 3.5 goals': 'Menos de 3.5 Gols',
  'home win': 'Vitória Mandante',
  'away win': 'Vitória Visitante',
  'draw': 'Empate',
  'btts': 'Ambos Marcam - Sim',
  'btts yes': 'Ambos Marcam - Sim',
  'btts no': 'Ambos Marcam - Não',
  'both teams to score': 'Ambos Marcam - Sim',
  'both teams to score - yes': 'Ambos Marcam - Sim',
  'both teams to score - no': 'Ambos Marcam - Não',
  'double chance home/draw': 'Dupla Chance - Casa/Empate',
  'double chance away/draw': 'Dupla Chance - Fora/Empate',
  'double chance home/away': 'Dupla Chance - Casa/Fora',
  'double chance 1x': 'Dupla Chance - Casa/Empate',
  'double chance x2': 'Dupla Chance - Fora/Empate',
  'double chance 12': 'Dupla Chance - Casa/Fora',
  'corners over 8.5': 'Mais de 8.5 Escanteios',
  'corners over 9.5': 'Mais de 9.5 Escanteios',
  'corners under 8.5': 'Menos de 8.5 Escanteios',
  'over 4.5 cards': 'Mais de 4.5 Cartões',
  'over 3.5 cards': 'Mais de 3.5 Cartões',
  'result: home win': 'Vitória Mandante',
  'result: away win': 'Vitória Visitante',
  'result: draw': 'Empate',
};

export function traduzirTipo(tipo) {
  if (!tipo) return tipo;
  const lower = tipo.toLowerCase().trim();
  return TIPO_TRADUCAO[lower] || tipo;
}

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
      temperature: 0.3,
      max_tokens: 2500,
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

function extractJSON(str) {
  const start = str.indexOf('{');
  if (start === -1) return null;
  let depth = 0, end = -1;
  for (let i = start; i < str.length; i++) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) return null;
  try { return JSON.parse(str.slice(start, end + 1)); } catch { return null; }
}

// Analisa um lote de até 8 partidas
async function analyzeBatch(apiKey, batch, onResult) {
  const lista = batch.map(m => `ID:${m.id}|${m.liga}|${m.time1} vs ${m.time2}`).join('\n');

  const prompt = `Você é um analista de apostas esportivas. Para cada jogo de futebol abaixo, sugira até 2 apostas APENAS se a confiança for MAIOR QUE 60%. Se não tiver certeza, não inclua o jogo na resposta.

Opções: Vitória Mandante, Vitória Visitante, Empate, Mais de 2.5 Gols, Menos de 2.5 Gols, Mais de 1.5 Gols, Ambos Marcam - Sim, Dupla Chance - Casa/Empate, Dupla Chance - Fora/Empate.

Jogos:
${lista}

Responda APENAS com um objeto JSON, sem nenhum texto adicional:
{"analises":[{"id":"ID_DO_JOGO","sugestoes":[{"tipo":"Vitória Mandante","confianca":72,"razao":"razao curta em portugues"}]}]}

IMPORTANTE: O campo "tipo" DEVE estar em português. A "confianca" deve ser um número entre 61 e 95. Não inclua jogos sem sugestão acima de 60%.`;

  try {
    const res = await callGroq(apiKey, prompt);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const parsed = extractJSON(text);

    if (!parsed) throw new Error('PARSE_ERROR: ' + text.slice(0, 80));

    const analises = parsed.analises || parsed.analyses || parsed.jogos || [];

    batch.forEach(m => {
      const found = analises.find(a => String(a.id) === String(m.id));
      const sugestoes = (found?.sugestoes || [])
        .map(s => ({ ...s, tipo: traduzirTipo(s.tipo) }))
        .filter(s => (parseInt(s.confianca, 10) || 0) >= 60);
      onResult(m.id, { data: sugestoes.length ? sugestoes : null, error: null });
    });
  } catch (e) {
    const msg = e.message === 'QUOTA_429' ? 'Cota Groq atingida — tente em 1 min'
      : e.message === 'INVALID_AI_KEY' ? 'Chave Groq inválida — verifique em Configurações'
      : `Erro IA: ${e.message}`;
    batch.forEach(m => onResult(m.id, { data: null, error: msg }));
  }
}

// Analisa TODOS os jogos em lotes de 8, sequencialmente
export async function analyzeMatchesBatch(matches, onResult) {
  const apiKey = await AsyncStorage.getItem(ANTHROPIC_KEY_STORAGE);
  if (!apiKey) {
    matches.forEach(m => onResult(m.id, { data: null, error: 'NO_AI_KEY' }));
    return;
  }

  const BATCH_SIZE = 8;
  for (let i = 0; i < matches.length; i += BATCH_SIZE) {
    const batch = matches.slice(i, i + BATCH_SIZE);
    await analyzeBatch(apiKey, batch, onResult);
    // Pequena pausa entre batches para não saturar a API
    if (i + BATCH_SIZE < matches.length) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }
}

export async function analyzeMatch() { return { sugestoes: [] }; }
