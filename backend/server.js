// ============================================
// SERVER.JS - Servidor Express Principal
// ============================================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const logger = require('./src/utils/logger');
const apiRoutes = require('./src/routes');
const { errorHandler, notFound } = require('./src/middlewares/errorHandler');
const { generalLimiter } = require('./src/middlewares/rateLimiter');
const { sanitizeInput } = require('./src/middlewares/validationMiddleware');

// Cargar variables de entorno
dotenv.config();

// Inicializar aplicación
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES GLOBALES
// ============================================

// CORS - Permitir solicitudes desde el Frontend
const allowedOrigins = [
    // URLs de desarrollo (comentadas en producción)
    // 'http://localhost:5500',
    // 'http://127.0.0.1:5500',
    // 'http://localhost:3000',
    // URL de producción
    'https://sportiva-ecommerce.vercel.app',    
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function(origin, callback) {
        // Permitir requests sin origin (como Postman o Tests)
        if (!origin) {
            return callback(null, true);
        }
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // En desarrollo o tests, ser permisivo
            if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
                return callback(null, true);
            }
            logger.warn(`Origen bloqueado por CORS: ${origin}`);
            return callback(new Error('Bloqueado por CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 600
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitización de inputs
app.use(sanitizeInput);

// Rate limiting general (Desactivar en tests para evitar falsos positivos)
if (process.env.NODE_ENV !== 'test') {
    app.use('/api', generalLimiter);
}

// Logging de requests (Silenciar en tests para mantener la consola limpia)
if (process.env.NODE_ENV !== 'test') {
    app.use((req, res, next) => {
        logger.info(`${req.method} ${req.path}`, {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            query: req.query
        });
        next();
    });
}

// ============================================
// RUTAS BÁSICAS
// ============================================

// Ruta de health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Sportiva API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: 'Sportiva E-commerce API',
        version: '1.0.0',
        documentation: '/api/health',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            productos: '/api/productos',
            carrito: '/api/carrito',
            pedidos: '/api/pedidos'
        }
    });
});

// ============================================
// API ROUTES
// ============================================

app.use('/api', apiRoutes);

// ============================================
// MANEJO DE ERRORES
// ============================================

// 404 - Ruta no encontrada
app.use(notFound);

// Error handler global
app.use(errorHandler);

// ============================================
// MANEJO DE PROCESOS (Restaurado de serverBK.js)
// ============================================

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM recibido, cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT recibido, cerrando servidor...');
    process.exit(0);
});

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
    logger.error('Excepción no capturada:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Promesa rechazada no manejada:', { reason, promise });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

// Solo iniciar el servidor si este archivo se ejecuta directamente
// Si se importa desde los tests, NO iniciamos el servidor aquí para evitar EADDRINUSE
if (require.main === module) {
    app.listen(PORT, () => {
        logger.info(`🚀 Servidor iniciado en puerto ${PORT}`);
        logger.info(`🔗 URL: http://localhost:${PORT}`);
        logger.info(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`📦 API Base: http://localhost:${PORT}/api`);
    });
}

// Exportar app para los tests
module.exports = app;
