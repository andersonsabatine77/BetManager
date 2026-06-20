import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY_STORAGE = '@betmanager_football_api_key';

export async function getApiKey() {
  return await AsyncStorage.getItem(API_KEY_STORAGE);
}

export async function saveApiKey(key) {
  await AsyncStorage.setItem(API_KEY_STORAGE, key.trim());
}

// football-data.org free API — covers PL, CL, Bundesliga, Serie A, La Liga, Brasileirão (BSA)
async function fetchLiveMatches(apiKey) {
  const res = await fetch('https://api.football-data.org/v4/matches?status=LIVE', {
    headers: { 'X-Auth-Token': apiKey },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.matches || [];
}

async function fetchScheduledToday(apiKey) {
  const today = new Date().toISOString().split('T')[0];
  const res = await fetch(
    `https://api.football-data.org/v4/matches?dateFrom=${today}&dateTo=${today}&status=SCHEDULED,IN_PLAY,PAUSED`,
    { headers: { 'X-Auth-Token': apiKey } }
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.matches || [];
}

function mapMatch(match) {
  const home = match.homeTeam?.shortName || match.homeTeam?.name || '?';
  const away = match.awayTeam?.shortName || match.awayTeam?.name || '?';
  const scoreHome = match.score?.fullTime?.home ?? match.score?.halfTime?.home ?? 0;
  const scoreAway = match.score?.fullTime?.away ?? match.score?.halfTime?.away ?? 0;
  const minuto = match.minute ?? null;
  const liga = match.competition?.name || '';

  return {
    id: String(match.id),
    time1: home,
    time2: away,
    esporte: 'futebol',
    liga,
    placar: `${scoreHome}-${scoreAway}`,
    minuto,
    status: match.status,
    oddCasa: 0,
    oddEmpate: 0,
    oddFora: 0,
    movimentoCasa: 0,
    movimentoEmpate: 0,
    movimentoFora: 0,
    isReal: true,
  };
}

export async function getLiveGames() {
  const apiKey = await getApiKey();
  if (!apiKey) return { games: [], hasKey: false };

  try {
    const [live, today] = await Promise.all([
      fetchLiveMatches(apiKey),
      fetchScheduledToday(apiKey),
    ]);

    // Merge: live first, then today's scheduled, dedup by id
    const all = [...live];
    const liveIds = new Set(live.map(m => m.id));
    today.forEach(m => { if (!liveIds.has(m.id)) all.push(m); });

    const games = all.slice(0, 20).map(mapMatch);
    return { games, hasKey: true, error: null };
  } catch (e) {
    return { games: [], hasKey: true, error: e.message };
  }
}
