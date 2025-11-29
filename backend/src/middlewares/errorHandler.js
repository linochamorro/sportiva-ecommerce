// ============================================
// ERROR HANDLER - Middleware de Manejo de Errores
// ============================================

const logger = require('../utils/logger');

// ============================================
// MANEJADOR GLOBAL DE ERRORES
// ============================================

exports.errorHandler = (err, req, res, next) => {
    logger.error('Error capturado:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        body: req.body,
        params: req.params,
        query: req.query
    });

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Error de validación',
            errors: err.errors || [err.message]
        });
    }

    // Error de JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Token inválido',
            code: 'INVALID_TOKEN'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expirado',
            code: 'TOKEN_EXPIRED'
        });
    }

    // Error de MySQL
    if (err.code) {
        return handleMySQLError(err, res);
    }

    // Error de sintaxis JSON
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'JSON inválido en el cuerpo de la solicitud'
        });
    }

    // Error 404 - Ruta no encontrada
    if (err.status === 404) {
        return res.status(404).json({
            success: false,
            message: 'Recurso no encontrado',
            path: req.originalUrl
        });
    }

    // Error genérico del servidor
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Error interno del servidor';

    // En desarrollo, enviar stack trace
    const response = {
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            error: err
        })
    };

    res.status(statusCode).json(response);
};

// ============================================
// MANEJADOR DE ERRORES DE MYSQL
// ============================================

function handleMySQLError(err, res) {
    logger.error('Error de MySQL:', {
        code: err.code,
        errno: err.errno,
        sqlMessage: err.sqlMessage,
        sql: err.sql
    });

    switch (err.code) {
        case 'ER_DUP_ENTRY':
            return res.status(409).json({
                success: false,
                message: 'El registro ya existe en la base de datos',
                code: 'DUPLICATE_ENTRY'
            });

        case 'ER_NO_REFERENCED_ROW':
        case 'ER_NO_REFERENCED_ROW_2':
            return res.status(400).json({
                success: false,
                message: 'Referencia inválida a otro registro',
                code: 'INVALID_REFERENCE'
            });

        case 'ER_ROW_IS_REFERENCED':
        case 'ER_ROW_IS_REFERENCED_2':
            return res.status(409).json({
                success: false,
                message: 'No se puede eliminar porque existen referencias a este registro',
                code: 'REFERENCED_RECORD'
            });

        case 'ER_PARSE_ERROR':
            return res.status(500).json({
                success: false,
                message: 'Error de sintaxis en la consulta SQL',
                code: 'SQL_PARSE_ERROR'
            });

        case 'ER_NO_SUCH_TABLE':
            return res.status(500).json({
                success: false,
                message: 'Tabla no encontrada en la base de datos',
                code: 'TABLE_NOT_FOUND'
            });

        case 'ER_BAD_FIELD_ERROR':
            return res.status(500).json({
                success: false,
                message: 'Campo no encontrado en la tabla',
                code: 'FIELD_NOT_FOUND'
            });

        case 'ECONNREFUSED':
            return res.status(503).json({
                success: false,
                message: 'No se puede conectar a la base de datos',
                code: 'DB_CONNECTION_REFUSED'
            });

        case 'PROTOCOL_CONNECTION_LOST':
            return res.status(503).json({
                success: false,
                message: 'Conexión perdida con la base de datos',
                code: 'DB_CONNECTION_LOST'
            });

        case 'ER_TOO_MANY_USER_CONNECTIONS':
            return res.status(503).json({
                success: false,
                message: 'Demasiadas conexiones a la base de datos',
                code: 'TOO_MANY_CONNECTIONS'
            });

        case 'ER_ACCESS_DENIED_ERROR':
            return res.status(500).json({
                success: false,
                message: 'Acceso denegado a la base de datos',
                code: 'DB_ACCESS_DENIED'
            });

        default:
            return res.status(500).json({
                success: false,
                message: 'Error de base de datos',
                code: err.code || 'DB_ERROR'
            });
    }
}

// ============================================
// MANEJADOR DE RUTAS NO ENCONTRADAS (404)
// ============================================

exports.notFound = (req, res, next) => {
    const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
    error.status = 404;
    next(error);
};

// ============================================
// MANEJADOR DE ERRORES ASÍNCRONOS
// ============================================

exports.asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// ============================================
// CREAR ERROR PERSONALIZADO
// ============================================

exports.createError = (status, message, code = null) => {
    const error = new Error(message);
    error.status = status;
    error.statusCode = status;
    if (code) {
        error.code = code;
    }
    return error;
};

// ============================================
// VALIDAR ERROR DE NEGOCIO
// ============================================

exports.businessError = (message, code = 'BUSINESS_ERROR') => {
    const error = new Error(message);
    error.status = 400;
    error.statusCode = 400;
    error.code = code;
    return error;
};

// ============================================
// ERROR NO AUTORIZADO
// ============================================

exports.unauthorizedError = (message = 'No autorizado') => {
    const error = new Error(message);
    error.status = 401;
    error.statusCode = 401;
    error.code = 'UNAUTHORIZED';
    return error;
};

// ============================================
// ERROR PROHIBIDO
// ============================================

exports.forbiddenError = (message = 'Acceso prohibido') => {
    const error = new Error(message);
    error.status = 403;
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    return error;
};

// ============================================
// ERROR NO ENCONTRADO
// ============================================

exports.notFoundError = (message = 'Recurso no encontrado') => {
    const error = new Error(message);
    error.status = 404;
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    return error;
};

module.exports = exports;
