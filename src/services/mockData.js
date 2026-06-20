// Suggestions store daysAhead + hour — never a computed date
// The component calls getJogoLabel(daysAhead, hour) fresh at render time
const SUGESTOES_BASE = [
  { id: 's1',  time1: 'Flamengo',       time2: 'Corinthians',   esporte: 'futebol',  liga: 'Brasileirão',      tipo: 'Mais de 2.5 Gols',    confianca: 82, daysAhead: 0, hour: 16 },
  { id: 's2',  time1: 'Palmeiras',      time2: 'São Paulo',     esporte: 'futebol',  liga: 'Brasileirão',      tipo: 'Ambos Marcam - Sim',  confianca: 74, daysAhead: 0, hour: 19 },
  { id: 's3',  time1: 'Atlético MG',    time2: 'Grêmio',        esporte: 'futebol',  liga: 'Brasileirão',      tipo: 'Vitória Mandante',    confianca: 78, daysAhead: 0, hour: 21 },
  { id: 's4',  time1: 'Vasco',          time2: 'Fortaleza',     esporte: 'futebol',  liga: 'Brasileirão',      tipo: 'Mais de 8.5 Escanteios', confianca: 70, daysAhead: 1, hour: 16 },
  { id: 's5',  time1: 'Santos',         time2: 'Botafogo',      esporte: 'futebol',  liga: 'Brasileirão',      tipo: 'Menos de 3.5 Cartões', confianca: 65, daysAhead: 1, hour: 18 },
  { id: 's6',  time1: 'Fluminense',     time2: 'Cruzeiro',      esporte: 'futebol',  liga: 'Brasileirão',      tipo: 'Dupla Chance 1X',     confianca: 71, daysAhead: 1, hour: 20 },
  { id: 's7',  time1: 'Internacional',  time2: 'Bahia',         esporte: 'futebol',  liga: 'Brasileirão',      tipo: 'Vitória Mandante',    confianca: 80, daysAhead: 2, hour: 19 },
  { id: 's8',  time1: 'Athletico PR',   time2: 'Bragantino',    esporte: 'futebol',  liga: 'Brasileirão',      tipo: 'Menos de 2.5 Gols',   confianca: 68, daysAhead: 2, hour: 21 },
  { id: 's9',  time1: 'Heat',           time2: 'Celtics',       esporte: 'basquete', liga: 'NBA Playoffs',     tipo: 'Mais de 215.5 Pts',   confianca: 76, daysAhead: 0, hour: 22 },
  { id: 's10', time1: 'Lakers',         time2: 'Warriors',      esporte: 'basquete', liga: 'NBA',              tipo: 'Vitória Mandante',    confianca: 72, daysAhead: 1, hour: 23 },
];

export function getSugestoes() {
  return SUGESTOES_BASE;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const MOCK_HISTORICO = [
  { id: 'h1',  time1: 'Flamengo',      time2: 'Palmeiras',   tipo: 'Vitória Mandante',     valor: 100, odd: 1.85, resultado: 'win',  lucro: 85,   data: daysAgo(0),  esporte: 'futebol',  origem: 'sugestao' },
  { id: 'h2',  time1: 'Real Madrid',   time2: 'Barcelona',   tipo: 'Mais de 2.5 Gols',     valor: 80,  odd: 1.75, resultado: 'win',  lucro: 60,   data: daysAgo(0),  esporte: 'futebol',  origem: 'manual' },
  { id: 'h3',  time1: 'Corinthians',   time2: 'São Paulo',   tipo: 'Ambos Marcam - Sim',   valor: 60,  odd: 1.90, resultado: 'loss', lucro: -60,  data: daysAgo(1),  esporte: 'futebol',  origem: 'sugestao' },
  { id: 'h4',  time1: 'Lakers',        time2: 'Celtics',     tipo: 'Mais de 215.5 Pts',    valor: 120, odd: 1.80, resultado: 'win',  lucro: 96,   data: daysAgo(1),  esporte: 'basquete', origem: 'sugestao' },
  { id: 'h5',  time1: 'Atletico MG',   time2: 'Grêmio',      tipo: 'Vitória Mandante',     valor: 100, odd: 2.10, resultado: 'win',  lucro: 110,  data: daysAgo(2),  esporte: 'futebol',  origem: 'sugestao' },
  { id: 'h6',  time1: 'PSG',           time2: 'Lyon',        tipo: 'Vitória Mandante',     valor: 150, odd: 1.55, resultado: 'loss', lucro: -150, data: daysAgo(2),  esporte: 'futebol',  origem: 'manual' },
  { id: 'h7',  time1: 'Warriors',      time2: 'Heat',        tipo: 'Vitória Visitante',    valor: 80,  odd: 2.20, resultado: 'win',  lucro: 96,   data: daysAgo(3),  esporte: 'basquete', origem: 'sugestao' },
  { id: 'h8',  time1: 'Fluminense',    time2: 'Botafogo',    tipo: 'Menos de 2.5 Gols',   valor: 90,  odd: 1.70, resultado: 'win',  lucro: 63,   data: daysAgo(3),  esporte: 'futebol',  origem: 'sugestao' },
  { id: 'h9',  time1: 'Bayern Munich', time2: 'Dortmund',    tipo: 'Mais de 2.5 Gols',    valor: 100, odd: 1.65, resultado: 'loss', lucro: -100, data: daysAgo(4),  esporte: 'futebol',  origem: 'manual' },
  { id: 'h10', time1: 'Santos',        time2: 'Vasco',       tipo: 'Dupla Chance 1X',      valor: 70,  odd: 1.45, resultado: 'win',  lucro: 31,   data: daysAgo(4),  esporte: 'futebol',  origem: 'sugestao' },
  { id: 'h11', time1: 'Nuggets',       time2: 'Thunder',     tipo: 'Mais de 210.5 Pts',    valor: 110, odd: 1.85, resultado: 'win',  lucro: 93,   data: daysAgo(5),  esporte: 'basquete', origem: 'sugestao' },
  { id: 'h12', time1: 'Liverpool',     time2: 'Chelsea',     tipo: 'Ambos Marcam - Sim',   valor: 80,  odd: 1.80, resultado: 'loss', lucro: -80,  data: daysAgo(5),  esporte: 'futebol',  origem: 'manual' },
  { id: 'h13', time1: 'Inter Milan',   time2: 'Juventus',    tipo: 'Resultado Exato 1-0',  valor: 50,  odd: 6.50, resultado: 'win',  lucro: 275,  data: daysAgo(6),  esporte: 'futebol',  origem: 'manual' },
  { id: 'h14', time1: 'Palmeiras',     time2: 'Flamengo',    tipo: 'Menos de 3.5 Cartões', valor: 90,  odd: 1.60, resultado: 'win',  lucro: 54,   data: daysAgo(7),  esporte: 'futebol',  origem: 'sugestao' },
  { id: 'h15', time1: 'Bucks',         time2: 'Knicks',      tipo: 'Vitória Mandante',     valor: 130, odd: 1.70, resultado: 'loss', lucro: -130, data: daysAgo(7),  esporte: 'basquete', origem: 'sugestao' },
  { id: 'h16', time1: 'Cruzeiro',      time2: 'Atlético MG', tipo: 'Empate',               valor: 60,  odd: 3.20, resultado: 'loss', lucro: -60,  data: daysAgo(10), esporte: 'futebol',  origem: 'manual' },
  { id: 'h17', time1: 'Fortaleza',     time2: 'Bahia',       tipo: 'Mais de 8.5 Escanteios', valor: 80, odd: 1.75, resultado: 'win', lucro: 60,   data: daysAgo(12), esporte: 'futebol',  origem: 'sugestao' },
  { id: 'h18', time1: 'Celtics',       time2: 'Pacers',      tipo: 'Mais de 220.5 Pts',    valor: 100, odd: 1.90, resultado: 'win',  lucro: 90,   data: daysAgo(14), esporte: 'basquete', origem: 'sugestao' },
  { id: 'h19', time1: 'Botafogo',      time2: 'Bragantino',  tipo: 'Vitória Mandante',     valor: 120, odd: 2.00, resultado: 'win',  lucro: 120,  data: daysAgo(15), esporte: 'futebol',  origem: 'sugestao' },
  { id: 'h20', time1: 'Athletico PR',  time2: 'Internacional', tipo: 'Menos de 2.5 Gols', valor: 70,  odd: 1.65, resultado: 'loss', lucro: -70,  data: daysAgo(20), esporte: 'futebol',  origem: 'manual' },
];

export const MOCK_BANCA = {
  saldoInicial: 1000,
  saldoAtual: 1000,
};
