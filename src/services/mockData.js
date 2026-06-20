export const CASAS = ['Bet365', 'Betfair', 'Pinnacle', '1xBet', 'Betano'];

function makeCasas(base) {
  return [
    { nome: 'Bet365', odd: base },
    { nome: 'Betfair', odd: +(base + 0.03).toFixed(2) },
    { nome: 'Pinnacle', odd: +(base + 0.01).toFixed(2) },
    { nome: '1xBet', odd: +(base - 0.01).toFixed(2) },
    { nome: 'Betano', odd: +(base - 0.03).toFixed(2) },
  ];
}

export const mockSugestoes = [
  // 1X2
  { id: 's1', time1: 'Manchester City', time2: 'Arsenal', esporte: 'futebol', liga: 'Premier League', odd: 2.10, tipo: '1', confianca: 78, risco: 'baixo', casas: makeCasas(2.10), horario: '2026-06-21T15:00:00' },
  { id: 's2', time1: 'Real Madrid', time2: 'Barcelona', esporte: 'futebol', liga: 'La Liga', odd: 2.45, tipo: 'X', confianca: 62, risco: 'medio', casas: makeCasas(2.45), horario: '2026-06-21T16:00:00' },
  { id: 's3', time1: 'Flamengo', time2: 'Palmeiras', esporte: 'futebol', liga: 'Brasileirão', odd: 1.85, tipo: '1', confianca: 71, risco: 'baixo', casas: makeCasas(1.85), horario: '2026-06-21T18:00:00' },
  { id: 's4', time1: 'Lakers', time2: 'Celtics', esporte: 'basquete', liga: 'NBA', odd: 1.75, tipo: '1', confianca: 83, risco: 'baixo', casas: makeCasas(1.75), horario: '2026-06-21T21:00:00' },
  { id: 's5', time1: 'Djokovic', time2: 'Alcaraz', esporte: 'tenis', liga: 'Wimbledon', odd: 2.20, tipo: '2', confianca: 58, risco: 'medio', casas: makeCasas(2.20), horario: '2026-06-21T14:00:00' },
  { id: 's8', time1: 'Corinthians', time2: 'São Paulo', esporte: 'futebol', liga: 'Brasileirão', odd: 3.10, tipo: '2', confianca: 55, risco: 'alto', casas: makeCasas(3.10), horario: '2026-06-21T20:00:00' },
  { id: 's11', time1: 'Bayern Munich', time2: 'Dortmund', esporte: 'futebol', liga: 'Bundesliga', odd: 1.70, tipo: '1', confianca: 82, risco: 'baixo', casas: makeCasas(1.70), horario: '2026-06-22T15:30:00' },
  { id: 's12', time1: 'PSG', time2: 'Lyon', esporte: 'futebol', liga: 'Ligue 1', odd: 1.45, tipo: '1', confianca: 91, risco: 'baixo', casas: makeCasas(1.45), horario: '2026-06-22T17:00:00' },
  { id: 's14', time1: 'Santos', time2: 'Botafogo', esporte: 'futebol', liga: 'Brasileirão', odd: 2.30, tipo: 'X', confianca: 60, risco: 'medio', casas: makeCasas(2.30), horario: '2026-06-22T16:00:00' },
  // Over/Under Gols
  { id: 's6', time1: 'Liverpool', time2: 'Chelsea', esporte: 'futebol', liga: 'Premier League', odd: 1.45, tipo: 'Over 0.5', confianca: 94, risco: 'baixo', casas: makeCasas(1.45), horario: '2026-06-21T17:00:00' },
  { id: 's7', time1: 'Atletico Madrid', time2: 'Sevilla', esporte: 'futebol', liga: 'La Liga', odd: 1.65, tipo: 'Under 1.5', confianca: 80, risco: 'baixo', casas: makeCasas(1.65), horario: '2026-06-21T19:00:00' },
  { id: 's16', time1: 'Fluminense', time2: 'Grêmio', esporte: 'futebol', liga: 'Brasileirão', odd: 1.80, tipo: 'Over 1.5', confianca: 84, risco: 'baixo', casas: makeCasas(1.80), horario: '2026-06-21T20:00:00' },
  { id: 's17', time1: 'Inter Milan', time2: 'Milan', esporte: 'futebol', liga: 'Serie A', odd: 1.90, tipo: 'Over 2.5', confianca: 76, risco: 'baixo', casas: makeCasas(1.90), horario: '2026-06-21T21:30:00' },
  { id: 's18', time1: 'Porto', time2: 'Benfica', esporte: 'futebol', liga: 'Primeira Liga', odd: 2.05, tipo: 'Over 3.5', confianca: 58, risco: 'medio', casas: makeCasas(2.05), horario: '2026-06-21T22:00:00' },
  { id: 's19', time1: 'Juventus', time2: 'Napoli', esporte: 'futebol', liga: 'Serie A', odd: 1.72, tipo: 'Under 2.5', confianca: 79, risco: 'baixo', casas: makeCasas(1.72), horario: '2026-06-22T14:00:00' },
  { id: 's20', time1: 'Vasco', time2: 'Internacional', esporte: 'futebol', liga: 'Brasileirão', odd: 2.10, tipo: 'Under 3.5', confianca: 65, risco: 'medio', casas: makeCasas(2.10), horario: '2026-06-22T18:00:00' },
  // BTTS (Ambas Marcam)
  { id: 's21', time1: 'Flamengo', time2: 'São Paulo', esporte: 'futebol', liga: 'Brasileirão', odd: 1.78, tipo: 'BTTS Sim', confianca: 81, risco: 'baixo', casas: makeCasas(1.78), horario: '2026-06-21T18:00:00' },
  { id: 's22', time1: 'Ajax', time2: 'PSV', esporte: 'futebol', liga: 'Eredivisie', odd: 1.55, tipo: 'BTTS Não', confianca: 72, risco: 'baixo', casas: makeCasas(1.55), horario: '2026-06-22T15:00:00' },
  { id: 's23', time1: 'Man United', time2: 'Tottenham', esporte: 'futebol', liga: 'Premier League', odd: 1.65, tipo: 'BTTS Sim', confianca: 77, risco: 'baixo', casas: makeCasas(1.65), horario: '2026-06-22T17:30:00' },
  // Escanteios
  { id: 's24', time1: 'Bayern Munich', time2: 'PSG', esporte: 'futebol', liga: 'Champions League', odd: 1.85, tipo: 'Esc +8.5', confianca: 74, risco: 'baixo', casas: makeCasas(1.85), horario: '2026-06-22T20:00:00' },
  { id: 's25', time1: 'Liverpool', time2: 'Arsenal', esporte: 'futebol', liga: 'Premier League', odd: 1.90, tipo: 'Esc +9.5', confianca: 69, risco: 'medio', casas: makeCasas(1.90), horario: '2026-06-22T21:00:00' },
  { id: 's26', time1: 'Real Madrid', time2: 'Atletico Madrid', esporte: 'futebol', liga: 'La Liga', odd: 2.10, tipo: 'Esc +10.5', confianca: 61, risco: 'medio', casas: makeCasas(2.10), horario: '2026-06-23T16:00:00' },
  { id: 's27', time1: 'Palmeiras', time2: 'Santos', esporte: 'futebol', liga: 'Brasileirão', odd: 1.95, tipo: 'Esc -9.5', confianca: 66, risco: 'medio', casas: makeCasas(1.95), horario: '2026-06-23T18:00:00' },
  // Cartões
  { id: 's28', time1: 'Corinthians', time2: 'Flamengo', esporte: 'futebol', liga: 'Brasileirão', odd: 1.88, tipo: 'Cart +3.5', confianca: 73, risco: 'baixo', casas: makeCasas(1.88), horario: '2026-06-23T20:00:00' },
  { id: 's29', time1: 'Atletico Madrid', time2: 'Sevilla', esporte: 'futebol', liga: 'La Liga', odd: 2.05, tipo: 'Cart +4.5', confianca: 59, risco: 'medio', casas: makeCasas(2.05), horario: '2026-06-23T21:00:00' },
  // Handicap Asiático
  { id: 's9', time1: 'Warriors', time2: 'Heat', esporte: 'basquete', liga: 'NBA', odd: 1.90, tipo: 'AH -0.5', confianca: 69, risco: 'medio', casas: makeCasas(1.90), horario: '2026-06-21T22:00:00' },
  { id: 's30', time1: 'Bucks', time2: 'Nets', esporte: 'basquete', liga: 'NBA', odd: 1.75, tipo: 'AH +0.5', confianca: 74, risco: 'baixo', casas: makeCasas(1.75), horario: '2026-06-22T23:00:00' },
  // Tênis
  { id: 's10', time1: 'Nadal', time2: 'Medvedev', esporte: 'tenis', liga: 'Roland Garros', odd: 1.55, tipo: '1', confianca: 88, risco: 'baixo', casas: makeCasas(1.55), horario: '2026-06-21T13:00:00' },
  { id: 's13', time1: 'Bucks', time2: 'Nets', esporte: 'basquete', liga: 'NBA', odd: 1.60, tipo: '1', confianca: 85, risco: 'baixo', casas: makeCasas(1.60), horario: '2026-06-22T20:00:00' },
  { id: 's15', time1: 'Sinner', time2: 'Zverev', esporte: 'tenis', liga: 'US Open', odd: 1.80, tipo: '1', confianca: 74, risco: 'medio', casas: makeCasas(1.80), horario: '2026-06-22T18:00:00' },
];

export const mockLiveGames = [
  { id: 'l1', time1: 'Fluminense', time2: 'Grêmio', esporte: 'futebol', liga: 'Brasileirão', placar: '1-0', minuto: 67, oddCasa: 1.55, oddEmpate: 3.80, oddFora: 6.50, movimentoCasa: +0.12, movimentoEmpate: -0.20, movimentoFora: +1.10 },
  { id: 'l2', time1: 'Juventus', time2: 'Inter Milan', esporte: 'futebol', liga: 'Serie A', placar: '0-0', minuto: 34, oddCasa: 2.20, oddEmpate: 3.10, oddFora: 3.40, movimentoCasa: -0.05, movimentoEmpate: +0.08, movimentoFora: -0.10 },
  { id: 'l3', time1: 'Thunder', time2: 'Celtics', esporte: 'basquete', liga: 'NBA', placar: '78-82', minuto: 28, oddCasa: 2.95, oddEmpate: null, oddFora: 1.42, movimentoCasa: +0.30, movimentoEmpate: null, movimentoFora: -0.15 },
  { id: 'l4', time1: 'Sinner', time2: 'Alcaraz', esporte: 'tenis', liga: 'Wimbledon', placar: '6-4, 3-2', minuto: null, oddCasa: 1.85, oddEmpate: null, oddFora: 2.10, movimentoCasa: -0.08, movimentoEmpate: null, movimentoFora: +0.25 },
  { id: 'l5', time1: 'Porto', time2: 'Benfica', esporte: 'futebol', liga: 'Primeira Liga', placar: '2-1', minuto: 78, oddCasa: 1.40, oddEmpate: 4.50, oddFora: 9.00, movimentoCasa: -0.22, movimentoEmpate: +0.50, movimentoFora: +2.00 },
  { id: 'l6', time1: 'Flamengo', time2: 'Palmeiras', esporte: 'futebol', liga: 'Brasileirão', placar: '1-1', minuto: 55, oddCasa: 2.10, oddEmpate: 3.20, oddFora: 3.50, movimentoCasa: +0.05, movimentoEmpate: -0.10, movimentoFora: +0.15 },
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export const mockHistorico = [
  { id: 'h1', time1: 'Manchester City', time2: 'Arsenal', liga: 'Premier League', esporte: 'futebol', odd: 2.10, stake: 150, resultado: 'win', lucro: 165, data: daysAgo(0) },
  { id: 'h2', time1: 'Real Madrid', time2: 'Barcelona', liga: 'La Liga', esporte: 'futebol', odd: 2.45, stake: 100, resultado: 'loss', lucro: -100, data: daysAgo(0) },
  { id: 'h3', time1: 'Flamengo', time2: 'Palmeiras', liga: 'Brasileirão', esporte: 'futebol', odd: 1.85, stake: 200, resultado: 'win', lucro: 170, data: daysAgo(1) },
  { id: 'h4', time1: 'Lakers', time2: 'Celtics', liga: 'NBA', esporte: 'basquete', odd: 1.75, stake: 120, resultado: 'win', lucro: 90, data: daysAgo(1) },
  { id: 'h5', time1: 'Djokovic', time2: 'Alcaraz', liga: 'Wimbledon', esporte: 'tenis', odd: 2.20, stake: 80, resultado: 'loss', lucro: -80, data: daysAgo(2) },
  { id: 'h6', time1: 'Bayern Munich', time2: 'Dortmund', liga: 'Bundesliga', esporte: 'futebol', odd: 1.70, stake: 250, resultado: 'win', lucro: 175, data: daysAgo(2) },
  { id: 'h7', time1: 'PSG', time2: 'Lyon', liga: 'Ligue 1', esporte: 'futebol', odd: 1.45, stake: 300, resultado: 'win', lucro: 135, data: daysAgo(3) },
  { id: 'h8', time1: 'Corinthians', time2: 'São Paulo', liga: 'Brasileirão', esporte: 'futebol', odd: 3.10, stake: 50, resultado: 'loss', lucro: -50, data: daysAgo(3) },
  { id: 'h9', time1: 'Warriors', time2: 'Heat', liga: 'NBA', esporte: 'basquete', odd: 1.90, stake: 180, resultado: 'win', lucro: 162, data: daysAgo(4) },
  { id: 'h10', time1: 'Liverpool', time2: 'Chelsea', liga: 'Premier League', esporte: 'futebol', odd: 2.55, stake: 100, resultado: 'loss', lucro: -100, data: daysAgo(4) },
  { id: 'h11', time1: 'Atletico Madrid', time2: 'Sevilla', liga: 'La Liga', esporte: 'futebol', odd: 1.65, stake: 220, resultado: 'win', lucro: 143, data: daysAgo(5) },
  { id: 'h12', time1: 'Nadal', time2: 'Medvedev', liga: 'Roland Garros', esporte: 'tenis', odd: 1.55, stake: 200, resultado: 'win', lucro: 110, data: daysAgo(5) },
  { id: 'h13', time1: 'Bucks', time2: 'Nets', liga: 'NBA', esporte: 'basquete', odd: 1.60, stake: 150, resultado: 'win', lucro: 90, data: daysAgo(6) },
  { id: 'h14', time1: 'Santos', time2: 'Botafogo', liga: 'Brasileirão', esporte: 'futebol', odd: 2.30, stake: 100, resultado: 'loss', lucro: -100, data: daysAgo(6) },
  { id: 'h15', time1: 'Sinner', time2: 'Zverev', liga: 'US Open', esporte: 'tenis', odd: 1.80, stake: 130, resultado: 'win', lucro: 104, data: daysAgo(7) },
  { id: 'h16', time1: 'Inter Milan', time2: 'Milan', liga: 'Serie A', esporte: 'futebol', odd: 2.00, stake: 200, resultado: 'win', lucro: 200, data: daysAgo(8) },
  { id: 'h17', time1: 'Fluminense', time2: 'Grêmio', liga: 'Brasileirão', esporte: 'futebol', odd: 1.90, stake: 100, resultado: 'loss', lucro: -100, data: daysAgo(10) },
  { id: 'h18', time1: 'Nuggets', time2: 'Suns', liga: 'NBA', esporte: 'basquete', odd: 2.40, stake: 80, resultado: 'win', lucro: 112, data: daysAgo(12) },
  { id: 'h19', time1: 'Porto', time2: 'Benfica', liga: 'Primeira Liga', esporte: 'futebol', odd: 2.10, stake: 150, resultado: 'win', lucro: 165, data: daysAgo(14) },
  { id: 'h20', time1: 'Ajax', time2: 'PSV', liga: 'Eredivisie', esporte: 'futebol', odd: 2.20, stake: 100, resultado: 'loss', lucro: -100, data: daysAgo(15) },
  { id: 'h21', time1: 'Vasco', time2: 'Internacional', liga: 'Brasileirão', esporte: 'futebol', odd: 1.75, stake: 200, resultado: 'win', lucro: 150, data: daysAgo(18) },
  { id: 'h22', time1: 'Manchester United', time2: 'Tottenham', liga: 'Premier League', esporte: 'futebol', odd: 2.50, stake: 120, resultado: 'loss', lucro: -120, data: daysAgo(20) },
  { id: 'h23', time1: 'Clippers', time2: 'Spurs', liga: 'NBA', esporte: 'basquete', odd: 1.55, stake: 250, resultado: 'win', lucro: 137, data: daysAgo(22) },
  { id: 'h24', time1: 'Atletico MG', time2: 'Cruzeiro', liga: 'Brasileirão', esporte: 'futebol', odd: 1.80, stake: 180, resultado: 'win', lucro: 144, data: daysAgo(25) },
  { id: 'h25', time1: 'Roma', time2: 'Lazio', liga: 'Serie A', esporte: 'futebol', odd: 2.80, stake: 80, resultado: 'loss', lucro: -80, data: daysAgo(28) },
  { id: 'h26', time1: 'Rublev', time2: 'Tsitsipas', liga: 'ATP Finals', esporte: 'tenis', odd: 1.95, stake: 100, resultado: 'win', lucro: 95, data: daysAgo(30) },
  { id: 'h27', time1: 'Dortmund', time2: 'Leipzig', liga: 'Bundesliga', esporte: 'futebol', odd: 2.10, stake: 150, resultado: 'win', lucro: 165, data: daysAgo(35) },
  { id: 'h28', time1: 'Celtics', time2: 'Raptors', liga: 'NBA', esporte: 'basquete', odd: 1.70, stake: 200, resultado: 'loss', lucro: -200, data: daysAgo(40) },
  { id: 'h29', time1: 'Juventus', time2: 'Napoli', liga: 'Serie A', esporte: 'futebol', odd: 2.30, stake: 100, resultado: 'win', lucro: 130, data: daysAgo(45) },
  { id: 'h30', time1: 'Cruzeiro', time2: 'Fortaleza', liga: 'Brasileirão', esporte: 'futebol', odd: 1.65, stake: 300, resultado: 'win', lucro: 195, data: daysAgo(50) },
  { id: 'h31', time1: 'Flamengo', time2: 'Vasco', liga: 'Brasileirão', esporte: 'futebol', odd: 1.55, stake: 250, resultado: 'pending', lucro: 0, data: daysAgo(0) },
  { id: 'h32', time1: 'Sinner', time2: 'Nadal', liga: 'Roland Garros', esporte: 'tenis', odd: 2.10, stake: 100, resultado: 'pending', lucro: 0, data: daysAgo(0) },
];

export const mockArbitragem = [
  {
    id: 'a1',
    time1: 'Flamengo', time2: 'Palmeiras', liga: 'Brasileirão',
    lucroGarantido: 3.2,
    apostas: [
      { casa: 'Bet365', tipo: '1', odd: 2.20, stake: 455 },
      { casa: 'Pinnacle', tipo: '2', odd: 2.90, stake: 345 },
    ],
    totalStake: 800, lucroValor: 25.6,
  },
  {
    id: 'a2',
    time1: 'Real Madrid', time2: 'Man City', liga: 'Champions League',
    lucroGarantido: 2.1,
    apostas: [
      { casa: 'Betfair', tipo: '1', odd: 3.10, stake: 323 },
      { casa: '1xBet', tipo: 'X', odd: 4.20, stake: 238 },
      { casa: 'Betano', tipo: '2', odd: 2.80, stake: 357 },
    ],
    totalStake: 918, lucroValor: 19.3,
  },
  {
    id: 'a3',
    time1: 'Lakers', time2: 'Warriors', liga: 'NBA',
    lucroGarantido: 1.8,
    apostas: [
      { casa: 'Pinnacle', tipo: '1', odd: 2.05, stake: 488 },
      { casa: 'Bet365', tipo: '2', odd: 2.10, stake: 476 },
    ],
    totalStake: 964, lucroValor: 17.4,
  },
];

export const mockBanca = {
  saldo: 5230.50,
  saldoInicial: 5000.00,
  percentualDiario: 2.5,
  nivelRisco: 'moderado',
  stopLossD: 5,
  stopLossW: 15,
};
