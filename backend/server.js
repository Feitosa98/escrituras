const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const os = require('os');

// Importar rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const escrituraRoutes = require('./routes/escrituras');
const auditRoutes = require('./routes/audit');
const adminRoutes = require('./routes/admin');
const integrityRoutes = require('./routes/integrity');
const signatureRoutes = require('./routes/signatures');
const metaRoutes = require('./routes/metas');

// Inicializar banco de dados
require('./database');

function getNetworkIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Pular endereços internos e não IPv4
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

function startServer() {
    return new Promise((resolve) => {
        const app = express();
        const PORT = process.env.PORT || 3001;

        // Middlewares de segurança
        app.use(helmet({
            contentSecurityPolicy: false // Desabilitar para permitir carregar React
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: 1000, // Limite aumentado para 1000 requisições por IP
            message: 'Muitas requisições deste IP, tente novamente mais tarde'
        });
        app.use('/api/', limiter);

        // CORS
        app.use(cors({
            origin: '*', // Permitir todas as origens (rede local)
            credentials: true
        }));

        // Body parser
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));

        // Logging de requisições
        app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });

        // Rotas da API
        app.use('/api/auth', authRoutes);
        app.use('/api/users', userRoutes);
        app.use('/api/escrituras', escrituraRoutes);
        app.use('/api/audit', auditRoutes);
        app.use('/api/admin', adminRoutes);
        app.use('/api/integrity', integrityRoutes);
        app.use('/api/signatures', signatureRoutes);
        app.use('/api/metas', metaRoutes);

        // Rota temporária para debug de client-side errors
        app.post('/api/client-log', (req, res) => {
            console.error('🔴 [CLIENT ERROR]:', req.body);
            res.sendStatus(200);
        });

        // Rota de health check
        app.get('/api/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            });
        });

        // Servir arquivos estáticos do React (produção)
        const buildPath = path.join(__dirname, '../dist');
        app.use(express.static(buildPath));

        // Fallback para React Router (SPA)
        app.get(/.*/, (req, res) => {
            res.sendFile(path.join(buildPath, 'index.html'));
        });

        // Error handler
        app.use((err, req, res, next) => {
            console.error('Erro:', err);
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        });

        // Iniciar servidor
        const server = app.listen(PORT, '0.0.0.0', () => {
            const networkIp = getNetworkIp();

            console.log('\n========================================');
            console.log('🚀 Servidor iniciado com sucesso!');
            console.log('========================================');
            console.log(`📍 Local:  http://localhost:${PORT}`);
            console.log(`🌐 Rede:   http://${networkIp}:${PORT}`);
            console.log('========================================');
            console.log('👤 Usuário padrão:');
            console.log('   Email: admin@sistema.local');
            console.log('   Senha: admin123');
            console.log('========================================\n');

            resolve({
                port: PORT,
                networkIp: networkIp,
                server: server
            });
        });
    });
}

function getServerInfo() {
    return {
        port: process.env.PORT || 3001,
        networkIp: getNetworkIp()
    };
}

module.exports = { startServer, getServerInfo };

// Iniciar se executado diretamente
if (require.main === module) {
    startServer();
}
