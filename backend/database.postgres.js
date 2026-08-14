const path = require('path');
const bcrypt = require('bcryptjs');
const { Worker, MessageChannel } = require('worker_threads');

const BUFFER_SIZE = 16 * 1024 * 1024;
const signal = new Int32Array(new SharedArrayBuffer(4));
const payload = new Uint8Array(new SharedArrayBuffer(BUFFER_SIZE));
const { port1, port2 } = new MessageChannel();
const worker = new Worker(path.join(__dirname, 'postgres-worker.js'), {
  workerData: { databaseUrl: process.env.DATABASE_URL, signal: signal.buffer, payload: payload.buffer, port: port2 },
  transferList: [port2],
});
worker.unref();

function request(message) {
  Atomics.store(signal, 0, 0);
  port1.postMessage(message);
  const waitResult = Atomics.wait(signal, 0, 0, 30000);
  if (waitResult === 'timed-out') throw new Error('Tempo esgotado ao acessar o PostgreSQL');
  const length = Atomics.load(signal, 0);
  const result = JSON.parse(Buffer.from(payload.slice(0, length)).toString('utf8'));
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

function placeholders(sql) {
  let index = 0;
  return sql
    .replace(/COLLATE\s+NOCASE/gi, '')
    .replace(/strftime\('%Y-%m',\s*([^)]+)\)/gi, "TO_CHAR($1, 'YYYY-MM')")
    .replace(/strftime\('%Y',\s*([^)]+)\)/gi, "TO_CHAR($1, 'YYYY')")
    .replace(/\?/g, () => `$${++index}`);
}

function prepare(sql) {
  const statement = placeholders(sql);
  return {
    get: (...params) => request({ action: 'query', sql: statement, params, mode: 'get' }),
    all: (...params) => request({ action: 'query', sql: statement, params, mode: 'all' }),
    run: (...params) => request({ action: 'query', sql: statement, params, mode: 'run' }),
  };
}

function exec(sql) { return request({ action: 'exec', sql }); }
function transaction(callback) {
  return (...args) => {
    request({ action: 'begin' });
    try {
      const result = callback(...args);
      request({ action: 'commit' });
      return result;
    } catch (error) {
      request({ action: 'rollback' });
      throw error;
    }
  };
}

const db = { dialect: 'postgres', prepare, exec, transaction, pragma: () => [] };
exec(require('fs').readFileSync(path.join(__dirname, 'postgres-schema.sql'), 'utf8'));
const admin = prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1").get();
if (!admin) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error('ADMIN_PASSWORD deve ser configurada em produção');
  prepare('INSERT INTO users (nome, username, email, senha_hash, role) VALUES (?, ?, ?, ?, ?)')
    .run('Administrador do Sistema', 'admin.sistema', process.env.ADMIN_EMAIL || 'admin@sistema.local', bcrypt.hashSync(password, 12), 'admin');
}
console.log('✅ PostgreSQL inicializado');
module.exports = db;
