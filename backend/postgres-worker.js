const { workerData } = require('worker_threads');
const { Pool, types } = require('pg');
types.setTypeParser(20, Number);
const pool = new Pool({ connectionString: workerData.databaseUrl, max: 10, idleTimeoutMillis: 30000 });
const signal = new Int32Array(workerData.signal);
const payload = new Uint8Array(workerData.payload);
const port = workerData.port;
let transactionClient = null;

function reply(value) {
  const bytes = Buffer.from(JSON.stringify(value));
  if (bytes.length > payload.length) throw new Error('Resposta PostgreSQL excedeu o limite interno');
  payload.fill(0, 0, bytes.length);
  payload.set(bytes);
  Atomics.store(signal, 0, bytes.length);
  Atomics.notify(signal, 0);
}

function insertReturning(sql) {
  const trimmed = sql.trim().replace(/;$/, '');
  return /^INSERT\s+/i.test(trimmed) && !/\bRETURNING\b/i.test(trimmed) ? `${trimmed} RETURNING id` : trimmed;
}

port.on('message', async (message) => {
  try {
    if (message.action === 'begin') {
      transactionClient = await pool.connect();
      await transactionClient.query('BEGIN');
      return reply({ ok: true, data: true });
    }
    if (message.action === 'commit' || message.action === 'rollback') {
      if (transactionClient) {
        await transactionClient.query(message.action.toUpperCase());
        transactionClient.release();
        transactionClient = null;
      }
      return reply({ ok: true, data: true });
    }
    const client = transactionClient || pool;
    if (message.action === 'exec') {
      await client.query(message.sql);
      return reply({ ok: true, data: true });
    }
    const sql = message.mode === 'run' ? insertReturning(message.sql) : message.sql;
    const result = await client.query(sql, message.params || []);
    const data = message.mode === 'get' ? (result.rows[0] || undefined)
      : message.mode === 'all' ? result.rows
      : { changes: result.rowCount, lastInsertRowid: result.rows[0]?.id };
    reply({ ok: true, data });
  } catch (error) {
    if (transactionClient && message.action !== 'rollback') {
      try { await transactionClient.query('ROLLBACK'); } catch {}
      transactionClient.release();
      transactionClient = null;
    }
    reply({ ok: false, error: error.message });
  }
});
