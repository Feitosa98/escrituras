// Ponto de entrada CommonJS para hospedagens que iniciam o arquivo diretamente.
const { startServer } = require('./backend/server');

startServer().catch((error) => {
  console.error('Falha ao iniciar o servidor:', error);
  process.exitCode = 1;
});
