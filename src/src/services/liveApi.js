const BASE = 'https://api.football-data.org/v4';

// football-data.org free tier: 10 req/min
// Free key covers: Premier League, La Liga, Champions League, etc.
// Get your free key at: https://www.football-data.org/client/register

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

// Algorithm: generate real-time suggestions based on match state
export function generateLiveSuggestions(match) {
  const homeGoals = match.score?.fullTime?.home ?? match.score?.halfTime?.home ?? 0;
  const awayGoals = match.score?.fullTime?.away ?? match.score?.halfTime?.away ?? 0;
  const minute = match.minute || 0;
  const totalGoals = homeGoals + awayGoals;
  const suggestions = [];

  // Goal pace projection
  const pace = minute > 5 ? (totalGoals / minute) * 90 : 2.2;
  const remaining = 90 - Math.min(minute, 90);
  const projected = totalGoals + (pace * (remaining / 90));

  // Over/Under based on pace
  if (minute < 75) {
    if (totalGoals >= 3) {
      suggestions.push({
        tipo: 'Mais de 3.5 Gols',
        rationale: `${totalGoals} gols em ${minute}min — ritmo alto`,
        confianca: Math.min(88, 60 + totalGoals * 8),
        icon: 'trending-up-outline',
      });
    } else if (projected >= 2.8 && minute < 60) {
      suggestions.push({
        tipo: 'Mais de 2.5 Gols',
        rationale: `Projeção: ${projected.toFixed(1)} gols no total`,
        confianca: Math.round(55 + (projected - 2.5) * 20),
        icon: 'trending-up-outline',
      });
    } else if (projected < 2.0 && minute > 20) {
      suggestions.push({
        tipo: 'Menos de 2.5 Gols',
        rationale: `Jogo truncado — ${totalGoals} gol(s) em ${minute}min`,
        confianca: Math.round(60 + (2.0 - projected) * 15),
        icon: 'trending-down-outline',
      });
    }
  }

  // BTTS
  if (homeGoals === 0 && minute < 70) {
    suggestions.push({
      tipo: 'Ambos Marcam - Sim',
      rationale: `Mandante ainda não marcou (${minute}min restantes)`,
      confianca: minute < 50 ? 67 : 55,
      icon: 'football-outline',
    });
  } else if (awayGoals === 0 && minute < 70) {
    suggestions.push({
      tipo: 'Ambos Marcam - Sim',
      rationale: `Visitante ainda não marcou (${remaining}min restantes)`,
      confianca: minute < 50 ? 65 : 52,
      icon: 'football-outline',
    });
  }

  // Winner / Next goal
  if (homeGoals > awayGoals && minute > 30) {
    suggestions.push({
      tipo: `Vitória Mandante`,
      rationale: `Vencendo por ${homeGoals}-${awayGoals} aos ${minute}min`,
      confianca: Math.min(90, 65 + (homeGoals - awayGoals) * 8 + Math.floor(minute / 10) * 2),
      icon: 'shield-checkmark-outline',
    });
  } else if (awayGoals > homeGoals && minute > 30) {
    suggestions.push({
      tipo: `Vitória Visitante`,
      rationale: `Visitante vence por ${awayGoals}-${homeGoals} aos ${minute}min`,
      confianca: Math.min(87, 62 + (awayGoals - homeGoals) * 8 + Math.floor(minute / 10) * 2),
      icon: 'shield-checkmark-outline',
    });
  }

  // Draw suggestion
  if (homeGoals === awayGoals && minute > 60) {
    suggestions.push({
      tipo: 'Empate',
      rationale: `Placar empatado em ${homeGoals}-${awayGoals} com ${remaining}min`,
      confianca: Math.round(50 + (minute - 60) * 0.8),
      icon: 'remove-circle-outline',
    });
  }

  // Cap at 3
  return suggestions.slice(0, 3);
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
