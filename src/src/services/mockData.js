// Suggestions use daysAhead+hour (never ISO dates) + daily-seeded team rotation
// Each day, a different set of matchups is generated from the team pool
// This ensures displayed confronts never match a specific past real game

const TIMES_FUTEBOL = [
  'Flamengo', 'Palmeiras', 'Corinthians', 'São Paulo', 'Grêmio',
  'Internacional', 'Atlético MG', 'Cruzeiro', 'Fluminense', 'Botafogo',
  'Santos', 'Vasco', 'Athletico PR', 'Fortaleza', 'Bahia',
  'Bragantino', 'Ceará', 'América MG', 'Goiás', 'Sport',
];

const TIMES_BASQUETE = ['Heat', 'Celtics', 'Lakers', 'Warriors', 'Nuggets', 'Bucks', 'Suns', 'Nets'];

const LIGAS_FUTEBOL = ['Brasileirão', 'Brasileirão', 'Brasileirão', 'Copa do Brasil', 'Libertadores'];

const TIPOS_FUTEBOL = [
  'Mais de 2.5 Gols',
  'Menos de 2.5 Gols',
  'Ambos Marcam - Sim',
  'Vitória Mandante',
  'Vitória Visitante',
  'Dupla Chance 1X',
  'Dupla Chance X2',
  'Mais de 8.5 Escanteios',
  'Mais de 9.5 Escanteios',
  'Menos de 3.5 Cartões',
  'Mais de 3.5 Cartões',
  'Mais de 0.5 Gols 1T',
  'Ganhador 1T Mandante',
];

const TIPOS_BASQUETE = [
  'Mais de 215.5 Pts',
  'Mais de 220.5 Pts',
  'Menos de 215.5 Pts',
  'Vitória Mandante',
  'Vitória Visitante',
];

const HORAS = [14, 16, 16, 18, 19, 19, 21, 21, 22];

// Simple seeded RNG — deterministic per seed value
function seededRng(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function getTodaySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getSugestoes() {
  const seed = getTodaySeed();
  const rng = seededRng(seed);

  const shuffledTimes = shuffle(TIMES_FUTEBOL, rng);
  const shuffledHoras = shuffle(HORAS, rng);

  const futebolSugs = [];
  for (let i = 0; i < 8; i++) {
    const time1 = shuffledTimes[i * 2];
    const time2 = shuffledTimes[i * 2 + 1];
    const liga = LIGAS_FUTEBOL[Math.floor(rng() * LIGAS_FUTEBOL.length)];
    const tipo = TIPOS_FUTEBOL[Math.floor(rng() * TIPOS_FUTEBOL.length)];
    const hora = shuffledHoras[i % shuffledHoras.length];
    const daysAhead = i < 3 ? 0 : i < 6 ? 1 : 2;
    const confianca = 60 + Math.floor(rng() * 28); // 60-87%

    futebolSugs.push({
      id: `s${i + 1}`,
      time1,
      time2,
      esporte: 'futebol',
      liga,
      tipo,
      confianca,
      daysAhead,
      hour: hora,
    });
  }

  const rng2 = seededRng(seed + 999);
  const shuffledBkt = shuffle(TIMES_BASQUETE, rng2);
  const basqueteSugs = [
    {
      id: 's9',
      time1: shuffledBkt[0],
      time2: shuffledBkt[1],
      esporte: 'basquete',
      liga: 'NBA',
      tipo: TIPOS_BASQUETE[Math.floor(rng2() * TIPOS_BASQUETE.length)],
      confianca: 65 + Math.floor(rng2() * 22),
      daysAhead: 0,
      hour: 22,
    },
    {
      id: 's10',
      time1: shuffledBkt[2],
      time2: shuffledBkt[3],
      esporte: 'basquete',
      liga: 'NBA',
      tipo: TIPOS_BASQUETE[Math.floor(rng2() * TIPOS_BASQUETE.length)],
      confianca: 65 + Math.floor(rng2() * 22),
      daysAhead: 1,
      hour: 23,
    },
  ];

  return [...futebolSugs, ...basqueteSugs];
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const MOCK_HISTORICO = [
  { id: 'h1',  time1: 'Flamengo',      time2: 'Palmeiras',     tipo: 'Vitória Mandante',       valor: 100, odd: 1.85, resultado: 'win',  lucro: 85,   data: daysAgo(0),  esporte: 'futebol',  origem: 'sugestao' },
  { id: 'h2',  time1: 'Real Madrid',   time2: 'Barcelona',     tipo: 'Mais de 2.5 Gols',       valor: 80,  odd: 1.75, resultado: 'win',  lucro: 60,   data: daysAgo(0),  esporte: 'futebol',  origem: 'manual' },
  { id: 'h3',  time1: 'Corinthians',   time2: 'São Paulo',     tipo: 'Ambos Marcam - Sim',     valor: 60,  odd: 1.90, resultado: 'loss', lucro: -60,  data: daysAgo(1),  esporte: 'futebol',  origem: 'sugestao' },
  { id: 'h4',  time1: 'Lakers',        time2: 'Celtics',       tipo: 'Mais de 215.5 Pts',      valor: 120, odd: 1.80, resultado: 'win',  lucro: 96,   data: daysAgo(1),  esporte: 'basquete', origem: 'sugestao' },
  { id: 'h5',  time1: 'Atlético MG',   time2: 'Grêmio',        tipo: 'Vitória Mandante',       valor: 100, odd: 2.10, resultado: 'win',  lucro: 110,  data: daysAgo(2),  esporte: 'futebol',  origem: 'sugestao' },
  { id: 'h6',  time1: 'PSG',           time2: 'Lyon',          tipo: 'Vitória Mandante',       valor: 150, odd: 1.55, resultado: 'loss', lucro: -150, data: daysAgo(2),  esporte: 'futebol',  origem: 'manual' },
  { id: 'h7',  time1: 'Warriors',      time2: 'Heat',          tipo: 'Vitória Visitante',      valor: 80,  odd: 2.20, resultado: 'win',  lucro: 96,   data: daysAgo(3),  esporte: 'basquete', origem: 'sugestao' },
  { id: 'h8',  time1: 'Fluminense',    time2: 'Botafogo',      tipo: 'Menos de 2.5 Gols',     valor: 90,  odd: 1.70, resultado: 'win',  lucro: 63,   data: daysAgo(3),  esporte: 'futebol',  origem: 'sugestao' },
  { id: 'h9',  time1: 'Bayern Munich', time2: 'Dortmund',      tipo: 'Mais de 2.5 Gols',      valor: 100, odd: 1.65, resultado: 'loss', lucro: -100, data: daysAgo(4),  esporte: 'futebol',  origem: 'manual' },
  { id: 'h10', time1: 'Santos',        time2: 'Vasco',         tipo: 'Dupla Chance 1X',        valor: 70,  odd: 1.45, resultado: 'win',  lucro: 31,   data: daysAgo(4),  esporte: 'futebol',  origem: 'sugestao' },
  { id: 'h11', time1: 'Nuggets',       time2: 'Thunder',       tipo: 'Mais de 210.5 Pts',      valor: 110, odd: 1.85, resultado: 'win',  lucro: 93,   data: daysAgo(5),  esporte: 'basquete', origem: 'sugestao' },
  { id: 'h12', time1: 'Liverpool',     time2: 'Chelsea',       tipo: 'Ambos Marcam - Sim',     valor: 80,  odd: 1.80, resultado: 'loss', lucro: -80,  data: daysAgo(5),  esporte: 'futebol',  origem: 'manual' },
  { id: 'h13', time1: 'Inter Milan',   time2: 'Juventus',      tipo: 'Resultado Exato 1-0',    valor: 50,  odd: 6.50, resultado: 'win',  lucro: 275,  data: daysAgo(6),  esporte: 'futebol',  origem: 'manual' },
  { id: 'h14', time1: 'Palmeiras',     time2: 'Flamengo',      tipo: 'Menos de 3.5 Cartões',  valor: 90,  odd: 1.60, resultado: 'win',  lucro: 54,   data: daysAgo(7),  esporte: 'futebol',  origem: 'sugestao' },
  { id: 'h15', time1: 'Bucks',         time2: 'Knicks',        tipo: 'Vitória Mandante',       valor: 130, odd: 1.70, resultado: 'loss', lucro: -130, data: daysAgo(7),  esporte: 'basquete', origem: 'sugestao' },
  { id: 'h16', time1: 'Cruzeiro',      time2: 'Atlético MG',   tipo: 'Empate',                 valor: 60,  odd: 3.20, resultado: 'loss', lucro: -60,  data: daysAgo(10), esporte: 'futebol',  origem: 'manual' },
  { id: 'h17', time1: 'Fortaleza',     time2: 'Bahia',         tipo: 'Mais de 8.5 Escanteios', valor: 80, odd: 1.75, resultado: 'win',  lucro: 60,   data: daysAgo(12), esporte: 'futebol',  origem: 'sugestao' },
  { id: 'h18', time1: 'Celtics',       time2: 'Pacers',        tipo: 'Mais de 220.5 Pts',      valor: 100, odd: 1.90, resultado: 'win',  lucro: 90,   data: daysAgo(14), esporte: 'basquete', origem: 'sugestao' },
  { id: 'h19', time1: 'Botafogo',      time2: 'Bragantino',    tipo: 'Vitória Mandante',       valor: 120, odd: 2.00, resultado: 'win',  lucro: 120,  data: daysAgo(15), esporte: 'futebol',  origem: 'sugestao' },
  { id: 'h20', time1: 'Athletico PR',  time2: 'Internacional', tipo: 'Menos de 2.5 Gols',     valor: 70,  odd: 1.65, resultado: 'loss', lucro: -70,  data: daysAgo(20), esporte: 'futebol',  origem: 'manual' },
];

export const MOCK_BANCA = {
  saldoInicial: 1000,
  saldoAtual: 1000,
};
