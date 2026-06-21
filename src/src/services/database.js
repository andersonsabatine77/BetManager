import * as SQLite from 'expo-sqlite';
import { MOCK_HISTORICO, MOCK_BANCA } from './mockData';

let db = null;

async function getDb() {
  if (!db) db = await SQLite.openDatabaseAsync('betmanager2.db');
  return db;
}

export async function initDatabase() {
  const database = await getDb();
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS banca (
      id INTEGER PRIMARY KEY,
      saldoInicial REAL NOT NULL DEFAULT 1000,
      saldoAtual REAL NOT NULL DEFAULT 1000,
      dataAtualizacao TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS apostas (
      id TEXT PRIMARY KEY,
      time1 TEXT NOT NULL,
      time2 TEXT NOT NULL,
      tipo TEXT NOT NULL,
      valor REAL NOT NULL,
      odd REAL NOT NULL DEFAULT 0,
      resultado TEXT NOT NULL DEFAULT 'pending',
      lucro REAL NOT NULL DEFAULT 0,
      data TEXT NOT NULL,
      esporte TEXT NOT NULL DEFAULT 'futebol',
      origem TEXT NOT NULL DEFAULT 'manual'
    );
  `);

  const row = await database.getFirstAsync('SELECT id FROM banca WHERE id = 1');
  if (!row) {
    const now = new Date().toISOString();
    await database.runAsync(
      'INSERT INTO banca (id, saldoInicial, saldoAtual, dataAtualizacao) VALUES (1, ?, ?, ?)',
      [MOCK_BANCA.saldoInicial, MOCK_BANCA.saldoAtual, now]
    );
    let saldo = MOCK_BANCA.saldoAtual;
    for (const a of MOCK_HISTORICO) {
      await database.runAsync(
        'INSERT OR IGNORE INTO apostas (id,time1,time2,tipo,valor,odd,resultado,lucro,data,esporte,origem) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        [a.id, a.time1, a.time2, a.tipo, a.valor, a.odd, a.resultado, a.lucro, a.data, a.esporte, a.origem]
      );
      if (a.resultado === 'win') saldo += a.lucro;
      else if (a.resultado === 'loss') saldo -= a.valor;
    }
    await database.runAsync('UPDATE banca SET saldoAtual = ?, dataAtualizacao = ? WHERE id = 1', [saldo, now]);
  }
}

export async function getBanca() {
  const database = await getDb();
  return await database.getFirstAsync('SELECT * FROM banca WHERE id = 1');
}

export async function updateBanca(saldoAtual, saldoInicial) {
  const database = await getDb();
  const now = new Date().toISOString();
  if (saldoInicial !== undefined) {
    await database.runAsync('UPDATE banca SET saldoAtual=?, saldoInicial=?, dataAtualizacao=? WHERE id=1', [saldoAtual, saldoInicial, now]);
  } else {
    await database.runAsync('UPDATE banca SET saldoAtual=?, dataAtualizacao=? WHERE id=1', [saldoAtual, now]);
  }
}

export async function getApostas() {
  const database = await getDb();
  return await database.getAllAsync('SELECT * FROM apostas ORDER BY data DESC');
}

export async function addAposta(aposta) {
  const database = await getDb();
  await database.runAsync(
    'INSERT INTO apostas (id,time1,time2,tipo,valor,odd,resultado,lucro,data,esporte,origem) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [aposta.id, aposta.time1, aposta.time2, aposta.tipo, aposta.valor, aposta.odd, aposta.resultado, aposta.lucro, aposta.data, aposta.esporte, aposta.origem]
  );
}

export async function updateAposta(id, resultado, lucro) {
  const database = await getDb();
  await database.runAsync('UPDATE apostas SET resultado=?, lucro=? WHERE id=?', [resultado, lucro, id]);
}

export async function deleteAposta(id) {
  const database = await getDb();
  await database.runAsync('DELETE FROM apostas WHERE id=?', [id]);
}

export async function clearAllData() {
  const database = await getDb();
  const now = new Date().toISOString();
  await database.execAsync('DELETE FROM apostas;');
  await database.runAsync('UPDATE banca SET saldoAtual=1000, saldoInicial=1000, dataAtualizacao=? WHERE id=1', [now]);
}

export async function resetBanca(novoSaldo) {
  const database = await getDb();
  const now = new Date().toISOString();
  await database.runAsync('UPDATE banca SET saldoAtual=?, saldoInicial=?, dataAtualizacao=? WHERE id=1', [novoSaldo, novoSaldo, now]);
}
