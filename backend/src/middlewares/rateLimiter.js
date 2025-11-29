// ============================================
// RATE LIMITER - Middleware de Limitación de Tasa
// ============================================

const logger = require('../utils/logger');
const requestCounts = new Map();
const blockList = new Map();

// ============================================
// CONFIGURACIÓN
// ============================================

const config = {
    // General API
    general: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        maxRequests: 100,
        message: 'Demasiadas solicitudes. Por favor, intenta nuevamente más tarde.'
    },
    // Login/Auth
    auth: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        maxRequests: 5,
        blockDurationMs: 30 * 60 * 1000, // 30 minutos de bloqueo
        message: 'Demasiados intentos de inicio de sesión. Cuenta bloqueada temporalmente.'
    },
    // Registro
    register: {
        windowMs: 60 * 60 * 1000, // 1 hora
        maxRequests: 3,
        message: 'Demasiados intentos de registro. Por favor, intenta más tarde.'
    },
    // Búsqueda
    search: {
        windowMs: 1 * 60 * 1000, // 1 minuto
        maxRequests: 30,
        message: 'Demasiadas búsquedas. Por favor, espera un momento.'
    }
};

// ============================================
// OBTENER IP DEL CLIENTE
// ============================================

function getClientIp(req) {
    return req.ip || 
            req.headers['x-forwarded-for']?.split(',')[0] || 
            req.headers['x-real-ip'] || 
            req.connection.remoteAddress || 
            'unknown';
}

// ============================================
// LIMPIAR REGISTROS ANTIGUOS
// ============================================

function cleanupOldRecords() {
    const now = Date.now();

    // Limpiar request counts
    for (const [key, data] of requestCounts.entries()) {
        if (now - data.resetTime > data.windowMs) {
            requestCounts.delete(key);
        }
    }

    // Limpiar block list
    for (const [ip, blockData] of blockList.entries()) {
        if (now > blockData.unblockTime) {
            blockList.delete(ip);
            logger.info(`IP desbloqueada: ${ip}`);
        }
    }
}

// Ejecutar limpieza cada 5 minutos
setInterval(cleanupOldRecords, 5 * 60 * 1000);

// ============================================
// RATE LIMITER GENERAL
// ============================================

exports.generalLimiter = (req, res, next) => {
    return rateLimiter(req, res, next, config.general, 'general');
};

// ============================================
// RATE LIMITER PARA AUTENTICACIÓN
// ============================================

exports.authLimiter = (req, res, next) => {
    const ip = getClientIp(req);

    // Verificar si la IP está bloqueada
    if (blockList.has(ip)) {
        const blockData = blockList.get(ip);
        const remainingTime = Math.ceil((blockData.unblockTime - Date.now()) / 1000 / 60);

        logger.warn(`Intento de acceso desde IP bloqueada: ${ip}`);

        return res.status(429).json({
            success: false,
            message: `Tu cuenta ha sido bloqueada temporalmente por múltiples intentos fallidos. Intenta nuevamente en ${remainingTime} minutos.`,
            code: 'IP_BLOCKED',
            retryAfter: remainingTime
        });
    }

    return rateLimiter(req, res, next, config.auth, 'auth', ip);
};

// ============================================
// RATE LIMITER PARA REGISTRO
// ============================================

exports.registerLimiter = (req, res, next) => {
    return rateLimiter(req, res, next, config.register, 'register');
};

// ============================================
// RATE LIMITER PARA BÚSQUEDA
// ============================================

exports.searchLimiter = (req, res, next) => {
    return rateLimiter(req, res, next, config.search, 'search');
};

// ============================================
// FUNCIÓN PRINCIPAL DE RATE LIMITING
// ============================================

function rateLimiter(req, res, next, limitConfig, type, ip = null) {
    const clientIp = ip || getClientIp(req);
    const key = `${type}:${clientIp}`;
    const now = Date.now();

    // Obtener o crear registro
    let record = requestCounts.get(key);

    if (!record || now - record.resetTime > limitConfig.windowMs) {
        // Crear nuevo registro
        record = {
            count: 0,
            resetTime: now,
            windowMs: limitConfig.windowMs
        };
    }

    // Incrementar contador
    record.count++;
    requestCounts.set(key, record);

    // Calcular headers
    const remaining = Math.max(0, limitConfig.maxRequests - record.count);
    const resetTime = new Date(record.resetTime + limitConfig.windowMs);

    // Agregar headers de rate limit
    res.setHeader('X-RateLimit-Limit', limitConfig.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime.toISOString());

    // Verificar si se excedió el límite
    if (record.count > limitConfig.maxRequests) {
        logger.warn(`Rate limit excedido para ${type}`, {
            ip: clientIp,
            count: record.count,
            limit: limitConfig.maxRequests,
            path: req.path
        });

        // Si es auth y se excede, bloquear IP
        if (type === 'auth' && limitConfig.blockDurationMs) {
            const unblockTime = now + limitConfig.blockDurationMs;
            blockList.set(clientIp, { unblockTime });
            logger.warn(`IP bloqueada por múltiples intentos fallidos: ${clientIp}`);
        }

        const retryAfter = Math.ceil((record.resetTime + limitConfig.windowMs - now) / 1000);
        res.setHeader('Retry-After', retryAfter);

        return res.status(429).json({
            success: false,
            message: limitConfig.message,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: retryAfter
        });
    }

    next();
}

// ============================================
// DESBLOQUEAR IP MANUALMENTE (Para admin)
// ============================================

exports.unblockIp = (ip) => {
    if (blockList.has(ip)) {
        blockList.delete(ip);
        logger.info(`IP desbloqueada manualmente: ${ip}`);
        return true;
    }
    return false;
};

// ============================================
// OBTENER ESTADO DE IP
// ============================================

exports.getIpStatus = (ip) => {
    const blocked = blockList.get(ip);
    const requests = {};

    for (const [key, data] of requestCounts.entries()) {
        if (key.includes(ip)) {
            const type = key.split(':')[0];
            requests[type] = {
                count: data.count,
                resetTime: new Date(data.resetTime + data.windowMs)
            };
        }
    }

    return {
        ip,
        blocked: blocked ? {
            unblockTime: new Date(blocked.unblockTime)
        } : null,
        requests
    };
};

// ============================================
// LIMPIAR TODOS LOS REGISTROS (Para testing)
// ============================================

exports.clearAll = () => {
    requestCounts.clear();
    blockList.clear();
    logger.info('Todos los registros de rate limit limpiados');
};

module.exports = exports;
