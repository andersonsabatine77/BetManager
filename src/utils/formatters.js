export function formatBRL(value) {
  const num = Number(value) || 0;
  const abs = Math.abs(num).toFixed(2);
  const [intPart, dec] = abs.split('.');
  const fmt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${num < 0 ? '-' : ''}R$ ${fmt},${dec}`;
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// Converts daysAhead + hour to a human label — computed fresh at render time
export function getJogoLabel(daysAhead, hour) {
  const h = String(hour).padStart(2, '0');
  if (daysAhead === 0) return `Hoje • ${h}:00`;
  if (daysAhead === 1) return `Amanhã • ${h}:00`;
  return `Em ${daysAhead} dias • ${h}:00`;
}

export function formatPercent(value) {
  return `${(Number(value) || 0).toFixed(1)}%`;
}
