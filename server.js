// Ponto de entrada usado pela hospedagem gerenciada da Hostinger.
import backend from './backend/server.js';

backend.startServer().catch((error) => {
  console.error('Falha ao iniciar o servidor:', error);
  process.exitCode = 1;
});
