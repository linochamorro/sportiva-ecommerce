// ============================================
// LOGGER UTILITY - Winston (Logback equivalent)
// ============================================
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// ============================================
// CONFIGURACIÓN DE FORMATOS
// ============================================

/**
 * Formato personalizado para consola
 */
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `[${timestamp}] ${level}: ${message}`;
        
        // Agregar metadata si existe
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta, null, 2)}`;
        }
        
        return log;
    })
);

/**
 * Formato para archivos (JSON estructurado)
 */
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

/**
 * Formato simple para archivos de texto
 */
const simpleFileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
        
        if (Object.keys(meta).length > 0) {
            log += ` | Data: ${JSON.stringify(meta)}`;
        }
        
        return log;
    })
);

// ============================================
// NIVELES DE LOG
// ============================================
// error: 0
// warn: 1
// info: 2
// http: 3
// verbose: 4
// debug: 5
// silly: 6

// ============================================
// TRANSPORTS (Destinos de logs)
// ============================================

/**
 * Transport para consola (desarrollo)
 */
const consoleTransport = new winston.transports.Console({
    format: consoleFormat,
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
});

/**
 * Transport para archivo de errores
 */
const errorFileTransport = new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
});

/**
 * Transport para archivo combinado (todos los logs)
 */
const combinedFileTransport = new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: simpleFileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
});

/**
 * Transport para archivo de accesos HTTP
 */
const httpFileTransport = new winston.transports.File({
    filename: path.join(logsDir, 'http.log'),
    level: 'http',
    format: simpleFileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 3
});

/**
 * Transport para archivo de base de datos
 */
const dbFileTransport = new winston.transports.File({
    filename: path.join(logsDir, 'database.log'),
    format: simpleFileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 3
});

// ============================================
// CREAR LOGGER PRINCIPAL
// ============================================

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels: winston.config.npm.levels,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.metadata()
    ),
    defaultMeta: { 
        service: 'sportiva-backend',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        errorFileTransport,
        combinedFileTransport,
        httpFileTransport
    ],
    exitOnError: false
});

// Agregar consola solo en desarrollo
if (process.env.NODE_ENV !== 'production') {
    logger.add(consoleTransport);
}

// ============================================
// MÉTODOS EXTENDIDOS
// ============================================

/**
 * Log de información general
 */
logger.logInfo = (message, meta = {}) => {
    logger.info(message, meta);
};

/**
 * Log de errores
 */
logger.logError = (message, error = null, meta = {}) => {
    if (error instanceof Error) {
        logger.error(message, {
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            ...meta
        });
    } else {
        logger.error(message, meta);
    }
};

/**
 * Log de warnings
 */
logger.logWarning = (message, meta = {}) => {
    logger.warn(message, meta);
};

/**
 * Log de operaciones de base de datos
 */
logger.logDatabase = (operation, query, meta = {}) => {
    const dbLogger = winston.createLogger({
        transports: [dbFileTransport],
        format: simpleFileFormat
    });
    
    dbLogger.info(`DB Operation: ${operation}`, {
        query: query.substring(0, 200), // Limitar tamaño de query
        ...meta
    });
};

/**
 * Log de requests HTTP
 */
logger.logHttp = (method, url, statusCode, responseTime, meta = {}) => {
    logger.http(`${method} ${url} ${statusCode}`, {
        method,
        url,
        statusCode,
        responseTime: `${responseTime}ms`,
        ...meta
    });
};

/**
 * Log de autenticación
 */
logger.logAuth = (action, userId, success, meta = {}) => {
    const level = success ? 'info' : 'warn';
    logger.log(level, `Auth: ${action}`, {
        userId,
        success,
        action,
        timestamp: new Date().toISOString(),
        ...meta
    });
};

/**
 * Log de operaciones de carrito
 */
logger.logCarrito = (action, userId, details = {}) => {
    logger.info(`Carrito: ${action}`, {
        userId,
        action,
        ...details
    });
};

/**
 * Log de pedidos
 */
logger.logPedido = (action, pedidoId, userId, details = {}) => {
    logger.info(`Pedido: ${action}`, {
        pedidoId,
        userId,
        action,
        ...details
    });
};

/**
 * Log de pagos
 */
logger.logPago = (action, pagoId, monto, metodo, success, meta = {}) => {
    const level = success ? 'info' : 'error';
    logger.log(level, `Pago: ${action}`, {
        pagoId,
        monto,
        metodo,
        success,
        action,
        ...meta
    });
};

/**
 * Log de stock
 */
logger.logStock = (action, productoId, talla, cantidad, meta = {}) => {
    logger.info(`Stock: ${action}`, {
        productoId,
        talla,
        cantidad,
        action,
        ...meta
    });
};

/**
 * Log de debug (solo en desarrollo)
 */
logger.logDebug = (message, meta = {}) => {
    if (process.env.NODE_ENV !== 'production') {
        logger.debug(message, meta);
    }
};

/**
 * Log de inicio de servidor
 */
logger.logServerStart = (port, environment) => {
    logger.info('====================================');
    logger.info('🚀 SPORTIVA BACKEND SERVER STARTED');
    logger.info('====================================');
    logger.info(`Environment: ${environment}`);
    logger.info(`Port: ${port}`);
    logger.info(`Node Version: ${process.version}`);
    logger.info(`Process ID: ${process.pid}`);
    logger.info(`Time: ${new Date().toISOString()}`);
    logger.info('====================================');
};

/**
 * Log de cierre de servidor
 */
logger.logServerStop = (reason = 'Unknown') => {
    logger.info('====================================');
    logger.info('🛑 SPORTIVA BACKEND SERVER STOPPED');
    logger.info('====================================');
    logger.info(`Reason: ${reason}`);
    logger.info(`Time: ${new Date().toISOString()}`);
    logger.info('====================================');
};

// ============================================
// MIDDLEWARE EXPRESS
// ============================================

/**
 * Middleware para logging de requests HTTP
 */
logger.httpMiddleware = (req, res, next) => {
    const startTime = Date.now();
    
    // Log cuando la respuesta termina
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        
        logger.logHttp(
            req.method,
            req.originalUrl || req.url,
            res.statusCode,
            responseTime,
            {
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent'),
                userId: req.user?.id_cliente || 'anonymous'
            }
        );
    });
    
    next();
};

/**
 * Middleware para logging de errores
 */
logger.errorMiddleware = (err, req, res, next) => {
    logger.logError(
        `Error in ${req.method} ${req.url}`,
        err,
        {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userId: req.user?.id_cliente || 'anonymous',
            body: req.body,
            query: req.query
        }
    );
    
    next(err);
};

// ============================================
// MANEJO DE EXCEPCIONES NO CAPTURADAS
// ============================================

/**
 * Capturar excepciones no manejadas
 */
process.on('uncaughtException', (error) => {
    logger.logError('Uncaught Exception', error, {
        type: 'uncaughtException',
        fatal: true
    });
    
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

/**
 * Capturar promesas rechazadas no manejadas
 */
process.on('unhandledRejection', (reason, promise) => {
    logger.logError('Unhandled Rejection', reason, {
        type: 'unhandledRejection',
        promise: promise.toString()
    });
});

/**
 * Log cuando el proceso va a terminar
 */
process.on('SIGINT', () => {
    logger.logServerStop('SIGINT received');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.logServerStop('SIGTERM received');
    process.exit(0);
});

// ============================================
// UTILIDADES
// ============================================

/**
 * Limpiar logs antiguos (más de 30 días)
 */
logger.cleanOldLogs = () => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    fs.readdir(logsDir, (err, files) => {
        if (err) {
            logger.logError('Error reading logs directory', err);
            return;
        }
        
        files.forEach(file => {
            const filePath = path.join(logsDir, file);
            
            fs.stat(filePath, (err, stats) => {
                if (err) return;
                
                if (stats.mtime.getTime() < thirtyDaysAgo) {
                    fs.unlink(filePath, (err) => {
                        if (!err) {
                            logger.logInfo(`Deleted old log file: ${file}`);
                        }
                    });
                }
            });
        });
    });
};

/**
 * Obtener estadísticas de logs
 */
logger.getLogStats = () => {
    return new Promise((resolve, reject) => {
        fs.readdir(logsDir, (err, files) => {
            if (err) {
                reject(err);
                return;
            }
            
            const stats = {
                totalFiles: files.length,
                files: []
            };
            
            let pending = files.length;
            
            files.forEach(file => {
                const filePath = path.join(logsDir, file);
                
                fs.stat(filePath, (err, fileStats) => {
                    if (!err) {
                        stats.files.push({
                            name: file,
                            size: fileStats.size,
                            created: fileStats.birthtime,
                            modified: fileStats.mtime
                        });
                    }
                    
                    pending--;
                    if (pending === 0) {
                        resolve(stats);
                    }
                });
            });
        });
    });
};

// ============================================
// EXPORTAR
// ============================================

module.exports = logger;
