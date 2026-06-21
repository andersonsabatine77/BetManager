const BASE = 'https://api.football-data.org/v4';

export async function fetchLiveMatches(apiKey) {
  if (!apiKey) throw new Error('NO_KEY');
  const res = await fetch(`${BASE}/matches?status=LIVE`, {
    headers: { 'X-Auth-Token': apiKey },
  });
  if (res.status === 403) throw new Error('INVALID_KEY');
  if (!res.ok) throw new Error(`API_ERROR_${res.status}`);
  const data = await res.json();
  return data.matches || [];
}

export async function fetchTodayMatches(apiKey) {
  if (!apiKey) throw new Error('NO_KEY');
  const today = new Date().toISOString().slice(0, 10);
  const res = await fetch(`${BASE}/matches?dateFrom=${today}&dateTo=${today}`, {
    headers: { 'X-Auth-Token': apiKey },
  });
  if (res.status === 403) throw new Error('INVALID_KEY');
  if (!res.ok) throw new Error(`API_ERROR_${res.status}`);
  const data = await res.json();
  return data.matches || [];
}

// Modelo de xG simulado baseado em dados disponíveis na API gratuita.
// Sem acesso a chutes/posse/escanteios — estimamos a partir do placar e minuto.
function estimateXG(goals, minute, isHome) {
  if (minute <= 0) return 0;
  // xG base pela taxa de gols do jogo + bônus mandante
  const goalRate = goals / minute;
  const homeBias = isHome ? 0.08 : 0;
  return (goalRate * 90) + homeBias;
}

function xGconfidence(xG, threshold) {
  // Quanto maior o xG acima do threshold, maior a confiança (65–90)
  const delta = xG - threshold;
  return Math.max(62, Math.min(90, Math.round(65 + delta * 18)));
}

export function generateLiveSuggestions(match) {
  const homeGoals = match.score?.fullTime?.home ?? match.score?.halfTime?.home ?? 0;
  const awayGoals = match.score?.fullTime?.away ?? match.score?.halfTime?.away ?? 0;
  const minute   = match.minute || 0;
  const totalGoals = homeGoals + awayGoals;
  const remaining  = Math.max(0, 90 - minute);
  const isHalf     = match.status === 'HALFTIME';
  const suggestions = [];

  // xG simulado por time
  const xGHome = estimateXG(homeGoals, Math.max(minute, 1), true);
  const xGAway = estimateXG(awayGoals, Math.max(minute, 1), false);
  const xGTotal = xGHome + xGAway;

  // Projeção de gols ao fim dos 90min
  const projectedTotal = minute > 5
    ? totalGoals + (xGTotal / 90) * remaining
    : 2.3;

  // ── Mais de 2.5 Gols ────────────────────────────────────────────────
  if (projectedTotal >= 2.8 && minute < 70 && totalGoals >= 2) {
    const conf = xGconfidence(projectedTotal, 2.5);
    suggestions.push({
      tipo: 'Mais de 2.5 Gols',
      rationale: `xG total ${xGTotal.toFixed(1)} — projeção ${projectedTotal.toFixed(1)} gols`,
      confianca: conf,
      icon: 'trending-up-outline',
    });
  }

  // ── Menos de 2.5 Gols ───────────────────────────────────────────────
  if (projectedTotal < 1.9 && minute > 25 && totalGoals <= 1) {
    const conf = xGconfidence(2.5 - projectedTotal, 0);
    suggestions.push({
      tipo: 'Menos de 2.5 Gols',
      rationale: `xG baixo (${xGTotal.toFixed(1)}) — jogo truncado aos ${minute}'`,
      confianca: conf,
      icon: 'trending-down-outline',
    });
  }

  // ── Mais de 3.5 Gols ────────────────────────────────────────────────
  if (totalGoals >= 3 && minute < 65) {
    suggestions.push({
      tipo: 'Mais de 3.5 Gols',
      rationale: `${totalGoals} gols em ${minute}' — ritmo muito alto`,
      confianca: Math.min(90, 68 + totalGoals * 5),
      icon: 'flame-outline',
    });
  }

  // ── Ambos Marcam ────────────────────────────────────────────────────
  if (homeGoals >= 1 && awayGoals === 0 && minute < 65 && xGAway >= 0.5) {
    suggestions.push({
      tipo: 'Ambos Marcam - Sim',
      rationale: `xG visitante ${xGAway.toFixed(1)} — visitante deve marcar`,
      confianca: Math.round(62 + xGAway * 8),
      icon: 'football-outline',
    });
  } else if (awayGoals >= 1 && homeGoals === 0 && minute < 65 && xGHome >= 0.5) {
    suggestions.push({
      tipo: 'Ambos Marcam - Sim',
      rationale: `xG mandante ${xGHome.toFixed(1)} — mandante deve responder`,
      confianca: Math.round(62 + xGHome * 8),
      icon: 'football-outline',
    });
  }

  // ── Vitória Mandante ─────────────────────────────────────────────────
  if (homeGoals > awayGoals && minute > 30) {
    const diff = homeGoals - awayGoals;
    const timeConf = Math.floor(minute / 10) * 2;
    const conf = Math.min(92, 63 + diff * 9 + timeConf);
    suggestions.push({
      tipo: 'Vitória Mandante',
      rationale: `Vence por ${homeGoals}–${awayGoals} (${minute}') — xG ${xGHome.toFixed(1)}×${xGAway.toFixed(1)}`,
      confianca: conf,
      icon: 'shield-checkmark-outline',
    });
  }

  // ── Vitória Visitante ────────────────────────────────────────────────
  if (awayGoals > homeGoals && minute > 30) {
    const diff = awayGoals - homeGoals;
    const timeConf = Math.floor(minute / 10) * 2;
    const conf = Math.min(90, 61 + diff * 9 + timeConf);
    suggestions.push({
      tipo: 'Vitória Visitante',
      rationale: `Visitante vence ${awayGoals}–${homeGoals} (${minute}') — xG ${xGAway.toFixed(1)}×${xGHome.toFixed(1)}`,
      confianca: conf,
      icon: 'shield-checkmark-outline',
    });
  }

  // ── Empate ───────────────────────────────────────────────────────────
  if (homeGoals === awayGoals && minute > 65) {
    const conf = Math.round(55 + (minute - 65) * 0.9);
    if (conf >= 60) {
      suggestions.push({
        tipo: 'Empate',
        rationale: `${homeGoals}–${awayGoals} empatado com ${remaining}' restantes`,
        confianca: Math.min(82, conf),
        icon: 'remove-circle-outline',
      });
    }
  }

  // ── Dupla Chance ─────────────────────────────────────────────────────
  if (homeGoals > awayGoals && minute < 45 && homeGoals - awayGoals === 1) {
    suggestions.push({
      tipo: 'Dupla Chance - Casa/Empate',
      rationale: `Mandante 1 gol à frente no início — boa cobertura`,
      confianca: 65,
      icon: 'shield-half-outline',
    });
  }

  // Filtra abaixo de 60% e limita a 3
  return suggestions
    .filter(s => s.confianca >= 60)
    .sort((a, b) => b.confianca - a.confianca)
    .slice(0, 3);
}

export function getMatchMinute(match) {
  if (match.status === 'HALFTIME') return 45;
  if (match.status === 'IN_PLAY') return match.minute || '?';
  return null;
}

export function formatLeague(competition) {
  const map = {
    'PL': 'Premier League',
    'PD': 'La Liga',
    'BL1': 'Bundesliga',
    'SA': 'Serie A',
    'FL1': 'Ligue 1',
    'CL': 'Champions League',
    'EL': 'Europa League',
    'EC': 'Eurocopa',
    'WC': 'Copa do Mundo',
    'CLI': 'Libertadores',
    'BSA': 'Brasileirão',
  };
  return map[competition?.code] || competition?.name || 'Futebol';
}
