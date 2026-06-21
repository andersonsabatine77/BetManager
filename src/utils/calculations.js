export function calcROI(totalInvestido, lucroLiquido) {
  if (!totalInvestido || totalInvestido === 0) return 0;
  return (lucroLiquido / totalInvestido) * 100;
}

export function calcWinRate(apostas) {
  const fin = apostas.filter(a => a.resultado !== 'pending');
  if (fin.length === 0) return 0;
  return (fin.filter(a => a.resultado === 'win').length / fin.length) * 100;
}

export function calcStats(apostas) {
  const fin = apostas.filter(a => a.resultado !== 'pending');
  const wins = fin.filter(a => a.resultado === 'win');
  const losses = fin.filter(a => a.resultado === 'loss');
  const totalInvestido = fin.reduce((s, a) => s + (Number(a.valor) || 0), 0);
  const totalGanho = wins.reduce((s, a) => s + (Number(a.lucro) || 0), 0);
  const totalPerdido = losses.reduce((s, a) => s + (Number(a.valor) || 0), 0);
  const lucroLiquido = totalGanho - totalPerdido;
  const roi = totalInvestido ? (lucroLiquido / totalInvestido) * 100 : 0;
  const winRate = fin.length ? (wins.length / fin.length) * 100 : 0;
  const melhor = fin.reduce((b, a) => (!b || Number(a.lucro) > Number(b.lucro) ? a : b), null);
  const pior = fin.reduce((b, a) => (!b || Number(a.lucro) < Number(b.lucro) ? a : b), null);
  let streak = 0, streakType = null;
  for (let i = fin.length - 1; i >= 0; i--) {
    const r = fin[i].resultado;
    if (!streakType) { streakType = r; streak = 1; }
    else if (r === streakType) streak++;
    else break;
  }
  return { totalInvestido, totalGanho, totalPerdido, lucroLiquido, roi, winRate, melhor, pior, streak, streakType, total: fin.length, wins: wins.length, losses: losses.length };
}

export function calcStatsByTipo(apostas) {
  const tipos = [...new Set(apostas.map(a => a.tipo).filter(Boolean))];
  return tipos.map(tipo => ({ tipo, ...calcStats(apostas.filter(a => a.tipo === tipo)) })).sort((a, b) => b.lucroLiquido - a.lucroLiquido);
}

export function buildChartData(apostas, period, saldoInicial = 0) {
  const now = new Date();
  const sorted = [...apostas].filter(a => a.resultado !== 'pending').sort((a, b) => new Date(a.data) - new Date(b.data));

  // Retorna saldo acumulado: saldoInicial + soma cumulativa dos lucros até aquele ponto
  function cumulativeAt(cutDate) {
    return saldoInicial + sorted
      .filter(a => new Date(a.data) <= cutDate)
      .reduce((s, a) => s + (Number(a.lucro) || 0), 0);
  }

  if (period === 'hoje') {
    return Array.from({ length: 24 }, (_, h) => {
      const cut = new Date(now); cut.setHours(h, 59, 59, 999);
      if (h > now.getHours()) return { label: `${h}h`, value: cumulativeAt(new Date(now.setHours(now.getHours(), 59, 59, 999))) };
      const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
      const val = saldoInicial + sorted
        .filter(a => { const d = new Date(a.data); return d >= dayStart && d.getHours() <= h; })
        .reduce((s, a) => s + (Number(a.lucro) || 0), 0);
      return { label: `${h}h`, value: val };
    });
  }

  const days = period === '7dias' ? 7 : period === '30dias' ? 30 : null;
  if (days !== null) {
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - (days - 1 - i));
      const cut = new Date(d); cut.setHours(23, 59, 59, 999);
      return { label: `${d.getDate()}/${d.getMonth() + 1}`, value: cumulativeAt(cut) };
    });
  }

  if (!sorted.length) return [{ label: 'Início', value: saldoInicial }];
  const first = new Date(sorted[0].data);
  const weeks = Math.max(1, Math.ceil((now - first) / (7 * 86400000)));
  return Array.from({ length: Math.min(weeks, 16) }, (_, i) => {
    const e = new Date(first); e.setDate(e.getDate() + (i + 1) * 7); e.setHours(23, 59, 59, 999);
    return { label: `S${i + 1}`, value: cumulativeAt(e) };
  });
}

export function getSportEmoji(esporte) {
  return esporte === 'basquete' ? '🏀' : '⚽';
}
