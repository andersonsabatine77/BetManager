import * as SQLite from 'expo-sqlite';
import { mockHistorico, mockBanca } from './mockData';

let db = null;

async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('betmanager.db');
  }
  return db;
}

export async function initDatabase() {
  const database = await getDb();

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS banca (
      id INTEGER PRIMARY KEY,
      saldo REAL NOT NULL DEFAULT 0,
      saldoInicial REAL NOT NULL DEFAULT 0,
      percentualDiario REAL NOT NULL DEFAULT 2.5,
      nivelRisco TEXT NOT NULL DEFAULT 'moderado',
      stopLossD REAL NOT NULL DEFAULT 5,
      stopLossW REAL NOT NULL DEFAULT 15
    );

    CREATE TABLE IF NOT EXISTS apostas (
      id TEXT PRIMARY KEY,
      time1 TEXT NOT NULL,
      time2 TEXT NOT NULL,
      liga TEXT,
      esporte TEXT,
      odd REAL NOT NULL,
      stake REAL NOT NULL,
      resultado TEXT NOT NULL DEFAULT 'pending',
      lucro REAL NOT NULL DEFAULT 0,
      data TEXT NOT NULL
    );
  `);

  const bancaRow = await database.getFirstAsync('SELECT * FROM banca WHERE id = 1');
  if (!bancaRow) {
    await database.runAsync(
      `INSERT INTO banca (id, saldo, saldoInicial, percentualDiario, nivelRisco, stopLossD, stopLossW)
       VALUES (1, ?, ?, ?, ?, ?, ?)`,
      [mockBanca.saldo, mockBanca.saldoInicial, mockBanca.percentualDiario, mockBanca.nivelRisco, mockBanca.stopLossD, mockBanca.stopLossW]
    );
    // Only seed historico on very first run (no banca row existed)
    for (const aposta of mockHistorico) {
      await database.runAsync(
        `INSERT OR IGNORE INTO apostas (id, time1, time2, liga, esporte, odd, stake, resultado, lucro, data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [aposta.id, aposta.time1, aposta.time2, aposta.liga, aposta.esporte, aposta.odd, aposta.stake, aposta.resultado, aposta.lucro, aposta.data]
      );
    }
  }
}

export async function getBanca() {
  const database = await getDb();
  return await database.getFirstAsync('SELECT * FROM banca WHERE id = 1');
}

export async function updateBanca(data) {
  const database = await getDb();
  await database.runAsync(
    `UPDATE banca SET saldo=?, saldoInicial=?, percentualDiario=?, nivelRisco=?, stopLossD=?, stopLossW=? WHERE id=1`,
    [data.saldo, data.saldoInicial, data.percentualDiario, data.nivelRisco, data.stopLossD, data.stopLossW]
  );
}

export async function getApostas() {
  const database = await getDb();
  return await database.getAllAsync('SELECT * FROM apostas ORDER BY data DESC');
}

export async function addAposta(aposta) {
  const database = await getDb();
  await database.runAsync(
    `INSERT INTO apostas (id, time1, time2, liga, esporte, odd, stake, resultado, lucro, data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [aposta.id, aposta.time1, aposta.time2, aposta.liga, aposta.esporte, aposta.odd, aposta.stake, aposta.resultado || 'pending', aposta.lucro || 0, aposta.data]
  );
}

export async function updateAposta(id, data) {
  const database = await getDb();
  await database.runAsync(
    `UPDATE apostas SET resultado=?, lucro=? WHERE id=?`,
    [data.resultado, data.lucro, id]
  );
}

export async function deleteAposta(id) {
  const database = await getDb();
  await database.runAsync('DELETE FROM apostas WHERE id=?', [id]);
}

export async function clearAllData() {
  const database = await getDb();
  await database.execAsync('DELETE FROM apostas;');
  await database.runAsync(
    `UPDATE banca SET saldo=1000, saldoInicial=1000, percentualDiario=2.5, nivelRisco='moderado', stopLossD=5, stopLossW=15 WHERE id=1`
  );
}
