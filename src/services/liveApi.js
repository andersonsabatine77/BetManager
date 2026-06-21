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

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// Gera sugestões usando estatísticas reais (xG, posse, chutes) quando disponíveis,
// ou heurística por placar/minuto como fallback
export function generateLiveSuggestions(match, stats = null) {
  const homeGoals = match.score?.fullTime?.home ?? match.score?.halfTime?.home ?? 0;
  const awayGoals = match.score?.fullTime?.away ?? match.score?.halfTime?.away ?? 0;
  const minute    = match.minute || 0;
  const totalGoals = homeGoals + awayGoals;
  const remaining  = Math.max(0, 90 - minute);
  const suggestions = [];
  const hasStats = stats && (stats.home.xg !== null || stats.home.shots !== null);

  // ── xG e projeção ────────────────────────────────────────────────────
  let xGHome, xGAway, xGTotal, projectedTotal;

  if (hasStats && stats.home.xg !== null && stats.away.xg !== null) {
    xGHome = stats.home.xg;
    xGAway = stats.away.xg;
    xGTotal = xGHome + xGAway;
    // xG projetado ao fim: escala pelo tempo restante
    const xGPerMin = xGTotal / Math.max(minute, 1);
    projectedTotal = totalGoals + xGPerMin * remaining * 0.7;
  } else if (hasStats && stats.home.shots !== null) {
    // Estima xG a partir de chutes (média de 0.1 xG por chute)
    xGHome = (stats.home.shotsOnTarget ?? stats.home.shots * 0.4) * 0.28;
    xGAway = (stats.away.shotsOnTarget ?? stats.away.shots * 0.4) * 0.28;
    xGTotal = xGHome + xGAway;
    projectedTotal = totalGoals + (xGTotal / Math.max(minute, 1)) * remaining * 0.7;
  } else {
    // Fallback: heurística por placar
    const rate = minute > 5 ? totalGoals / minute : 0.026;
    xGHome = rate * 90 * 0.55 + 0.05;
    xGAway = rate * 90 * 0.45;
    xGTotal = xGHome + xGAway;
    projectedTotal = totalGoals + rate * remaining;
  }

  const posHome = stats?.home.possession ?? 50;
  const corners = (stats?.home.corners ?? 0) + (stats?.away.corners ?? 0);
  const shots   = (stats?.home.shots ?? 0) + (stats?.away.shots ?? 0);
  const xGLabel = hasStats && stats.home.xg !== null
    ? `xG real ${xGHome.toFixed(2)}–${xGAway.toFixed(2)}`
    : `xG est. ${xGHome.toFixed(1)}–${xGAway.toFixed(1)}`;

  // ── Mais de 2.5 Gols ─────────────────────────────────────────────────
  if (minute < 72 && projectedTotal >= 2.8) {
    let conf = clamp(62 + (projectedTotal - 2.5) * 16, 62, 90);
    if (hasStats && shots > 20) conf = clamp(conf + 4, 62, 90);
    suggestions.push({
      tipo: 'Mais de 2.5 Gols',
      rationale: `${xGLabel} | projeção ${projectedTotal.toFixed(1)} gols`,
      confianca: Math.round(conf),
      icon: 'trending-up-outline',
    });
  }

  // ── Menos de 2.5 Gols ────────────────────────────────────────────────
  if (minute > 22 && totalGoals <= 1 && projectedTotal < 2.0) {
    let conf = clamp(62 + (2.0 - projectedTotal) * 14, 62, 88);
    if (hasStats && shots < 10) conf = clamp(conf + 5, 62, 88);
    suggestions.push({
      tipo: 'Menos de 2.5 Gols',
      rationale: `${xGLabel} | jogo truncado (${shots > 0 ? shots + ' chutes' : minute + 'min'})`,
      confianca: Math.round(conf),
      icon: 'trending-down-outline',
    });
  }

  // ── Mais de 3.5 Gols ─────────────────────────────────────────────────
  if (totalGoals >= 3 && minute < 68) {
    suggestions.push({
      tipo: 'Mais de 3.5 Gols',
      rationale: `${totalGoals} gols em ${minute}' — ritmo muito alto`,
      confianca: clamp(68 + totalGoals * 5, 68, 90),
      icon: 'flame-outline',
    });
  }

  // ── Mais de 9.5 Escanteios ───────────────────────────────────────────
  if (hasStats && corners >= 7 && minute < 65) {
    const projCorners = corners + (corners / Math.max(minute, 1)) * remaining;
    if (projCorners >= 10) {
      suggestions.push({
        tipo: 'Mais de 9.5 Escanteios',
        rationale: `${corners} escanteios em ${minute}' — projeção ${projCorners.toFixed(0)}`,
        confianca: clamp(62 + (projCorners - 9.5) * 5, 62, 86),
        icon: 'flag-outline',
      });
    }
  }

  // ── Ambos Marcam ─────────────────────────────────────────────────────
  if (minute < 68) {
    if (homeGoals >= 1 && awayGoals === 0 && xGAway >= 0.6) {
      suggestions.push({
        tipo: 'Ambos Marcam - Sim',
        rationale: `${xGLabel} | visitante com boa pressão`,
        confianca: clamp(Math.round(60 + xGAway * 10), 60, 84),
        icon: 'football-outline',
      });
    } else if (awayGoals >= 1 && homeGoals === 0 && xGHome >= 0.6) {
      suggestions.push({
        tipo: 'Ambos Marcam - Sim',
        rationale: `${xGLabel} | mandante deve responder`,
        confianca: clamp(Math.round(60 + xGHome * 10), 60, 84),
        icon: 'football-outline',
      });
    }
  }

  // ── Vitória Mandante ──────────────────────────────────────────────────
  if (homeGoals > awayGoals && minute > 28) {
    const diff = homeGoals - awayGoals;
    const timeBonus = Math.floor(minute / 10) * 2;
    const xGAdv = xGHome > xGAway ? 3 : 0;
    suggestions.push({
      tipo: 'Vitória Mandante',
      rationale: `${homeGoals}–${awayGoals} (${minute}') | ${xGLabel}`,
      confianca: clamp(63 + diff * 9 + timeBonus + xGAdv, 63, 93),
      icon: 'shield-checkmark-outline',
    });
  }

  // ── Vitória Visitante ─────────────────────────────────────────────────
  if (awayGoals > homeGoals && minute > 28) {
    const diff = awayGoals - homeGoals;
    const timeBonus = Math.floor(minute / 10) * 2;
    const xGAdv = xGAway > xGHome ? 3 : 0;
    suggestions.push({
      tipo: 'Vitória Visitante',
      rationale: `${awayGoals}–${homeGoals} para visitante (${minute}') | ${xGLabel}`,
      confianca: clamp(61 + diff * 9 + timeBonus + xGAdv, 61, 91),
      icon: 'shield-checkmark-outline',
    });
  }

  // ── Empate ────────────────────────────────────────────────────────────
  if (homeGoals === awayGoals && minute > 63) {
    const conf = clamp(Math.round(55 + (minute - 63) * 0.9), 60, 82);
    if (conf >= 60) {
      suggestions.push({
        tipo: 'Empate',
        rationale: `${homeGoals}–${awayGoals} com ${remaining}' restantes | ${xGLabel}`,
        confianca: conf,
        icon: 'remove-circle-outline',
      });
    }
  }

  // ── Posse dominante + vencendo ────────────────────────────────────────
  if (hasStats && posHome > 62 && homeGoals > awayGoals && minute > 20) {
    const existsVit = suggestions.find(s => s.tipo === 'Vitória Mandante');
    if (!existsVit) {
      suggestions.push({
        tipo: 'Vitória Mandante',
        rationale: `${posHome}% posse + vence ${homeGoals}–${awayGoals}`,
        confianca: clamp(63 + Math.round((posHome - 62) * 0.8), 63, 82),
        icon: 'shield-checkmark-outline',
      });
    }
  }

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
