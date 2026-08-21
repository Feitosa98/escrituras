require('dotenv').config();
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
const consultaRoutes = require('./routes/consulta');
const agendamentoRoutes = require('./routes/agendamentos');

// Inicializar banco de dados
const database = require('./database');

if (database.dialect !== 'postgres') {
// Rodar migração de protocolo automaticamente
try { require('./migrate_protocolo'); } catch(e) { console.warn('Aviso migração protocolo:', e.message); }

// Rodar migração de novo fluxo (6 etapas)
try {
  const { migrarFluxo } = require('./migrate_fluxo');
  migrarFluxo();
} catch(e) { console.warn('Aviso migração fluxo:', e.message); }

// Garantir a tabela de histórico usada pelo painel e pelo Kanban
try { require('./migrate_workflow'); } catch(e) { console.warn('Aviso migração workflow:', e.message); }

// Garantir o campo usado para notificar o cliente por e-mail
try { require('./migrate_email_cliente'); } catch(e) { console.warn('Aviso migração e-mail do cliente:', e.message); }

// Credenciais públicas de acompanhamento e janela de acesso dos usuários
try { require('./migrate_acompanhamento_acesso'); } catch(e) { console.warn('Aviso migração acompanhamento/acesso:', e.message); }
}

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

        if (process.env.NODE_ENV === 'production') {
            app.set('trust proxy', 1);
        }

        // Middlewares de segurança
        app.disable('x-powered-by');
        app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", 'data:', 'blob:'],
                    fontSrc: ["'self'", 'data:'],
                    connectSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    baseUri: ["'self'"],
                    formAction: ["'self'"],
                    frameAncestors: ["'self'"],
                }
            }
        }));
        app.use((req, res, next) => {
            res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
            if (req.path.startsWith('/api/')) {
                res.setHeader('Cache-Control', 'no-store');
            }
            next();
        });

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: 300,
            standardHeaders: true,
            legacyHeaders: false,
            message: { error: 'Muitas requisições deste IP, tente novamente mais tarde' }
        });
        app.use('/api/', limiter);

        const loginLimiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 10,
            skipSuccessfulRequests: true,
            standardHeaders: true,
            legacyHeaders: false,
            message: { error: 'Muitas tentativas de acesso. Aguarde 15 minutos e tente novamente.' }
        });
        const consultaLimiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 30,
            standardHeaders: true,
            legacyHeaders: false,
            message: { error: 'Muitas tentativas de consulta. Aguarde 15 minutos e tente novamente.' }
        });
        app.use('/api/auth/login', loginLimiter);
        app.use('/api/consulta', consultaLimiter);

        // CORS
        const allowedOrigins = (process.env.CORS_ORIGIN || '')
            .split(',')
            .map(origin => origin.trim())
            .filter(Boolean);
        app.use(cors({
            origin: allowedOrigins.length > 0 ? allowedOrigins : true,
            credentials: true
        }));

        // Body parser
        app.use(express.json({ limit: '100kb' }));
        app.use(express.urlencoded({ extended: true, limit: '100kb' }));

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
        app.use('/api/consulta', consultaRoutes); // Rota pública - sem autenticação
        app.use('/api/agendamentos', agendamentoRoutes);

        if (process.env.NODE_ENV === 'development') {
            app.post('/api/client-log', (req, res) => {
                console.error('🔴 [CLIENT ERROR]:', req.body);
                res.sendStatus(200);
            });
        }

        // Rota de health check
        app.get('/api/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            });
        });

        app.use('/api', (req, res) => {
            res.status(404).json({ error: 'Rota não encontrada' });
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
            if (process.env.NODE_ENV === 'development') {
                console.log('👤 Usuário padrão:');
                console.log('   Usuário: admin.sistema');
                console.log('   Senha: admin123');
            }
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
