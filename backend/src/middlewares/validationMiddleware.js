// ============================================
// VALIDATION MIDDLEWARE - Middleware de Validación
// ============================================

const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// ============================================
// PROCESAR ERRORES DE VALIDACIÓN
// ============================================

exports.handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(error => ({
            field: error.path || error.param,
            message: error.msg,
            value: error.value
        }));

        logger.warn('Errores de validación:', {
            path: req.path,
            method: req.method,
            errors: formattedErrors
        });

        return res.status(400).json({
            success: false,
            message: 'Errores de validación en la solicitud',
            errors: formattedErrors
        });
    }

    next();
};

// ============================================
// VALIDAR ID NUMÉRICO
// ============================================

exports.validateId = (paramName = 'id') => {
    return (req, res, next) => {
        const id = req.params[paramName];

        if (!id) {
            return res.status(400).json({
                success: false,
                message: `El parámetro '${paramName}' es requerido`
            });
        }

        const numId = parseInt(id);

        if (isNaN(numId) || numId <= 0) {
            return res.status(400).json({
                success: false,
                message: `El parámetro '${paramName}' debe ser un número entero positivo`
            });
        }

        req.params[paramName] = numId;
        next();
    };
};

// ============================================
// VALIDAR PAGINACIÓN
// ============================================

exports.validatePagination = (req, res, next) => {
    let { page, limit } = req.query;

    // Valores por defecto
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 12;

    // Validar rangos
    if (page < 1) {
        page = 1;
    }

    if (limit < 1) {
        limit = 12;
    }

    if (limit > 100) {
        limit = 100;
    }

    // Agregar al request
    req.pagination = {
        page,
        limit,
        offset: (page - 1) * limit
    };

    next();
};

// ============================================
// SANITIZAR BÚSQUEDA
// ============================================

exports.sanitizeSearch = (req, res, next) => {
    if (req.query.q) {
        // Remover caracteres especiales peligrosos
        req.query.q = req.query.q
            .trim()
            .replace(/[<>]/g, '')
            .substring(0, 100);
    }

    next();
};

// ============================================
// VALIDAR RANGO DE PRECIOS
// ============================================

exports.validatePriceRange = (req, res, next) => {
    let { precioMin, precioMax } = req.query;

    if (precioMin) {
        precioMin = parseFloat(precioMin);
        if (isNaN(precioMin) || precioMin < 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio mínimo debe ser un número válido mayor o igual a 0'
            });
        }
        req.query.precioMin = precioMin;
    }

    if (precioMax) {
        precioMax = parseFloat(precioMax);
        if (isNaN(precioMax) || precioMax < 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio máximo debe ser un número válido mayor o igual a 0'
            });
        }
        req.query.precioMax = precioMax;
    }

    if (precioMin && precioMax && precioMin > precioMax) {
        return res.status(400).json({
            success: false,
            message: 'El precio mínimo no puede ser mayor al precio máximo'
        });
    }

    next();
};

// ============================================
// VALIDAR TIPO DE ORDENAMIENTO
// ============================================

exports.validateSortOrder = (allowedFields = []) => {
    return (req, res, next) => {
        const { ordenar } = req.query;

        if (!ordenar) {
            return next();
        }

        const validOrders = [
            'precio_asc',
            'precio_desc',
            'nombre_asc',
            'nombre_desc',
            'nuevo',
            'popular',
            ...allowedFields
        ];

        if (!validOrders.includes(ordenar)) {
            return res.status(400).json({
                success: false,
                message: `Tipo de ordenamiento inválido. Valores permitidos: ${validOrders.join(', ')}`
            });
        }

        next();
    };
};

// ============================================
// VALIDAR TIPO DE CONTENIDO
// ============================================

exports.validateContentType = (allowedTypes = ['application/json']) => {
    return (req, res, next) => {
        const contentType = req.headers['content-type'];

        if (!contentType) {
            return res.status(400).json({
                success: false,
                message: 'Content-Type header es requerido'
            });
        }

        const isValid = allowedTypes.some(type => contentType.includes(type));

        if (!isValid) {
            return res.status(415).json({
                success: false,
                message: `Content-Type no soportado. Tipos permitidos: ${allowedTypes.join(', ')}`
            });
        }

        next();
    };
};

// ============================================
// VALIDAR TAMAÑO DE BODY
// ============================================

exports.validateBodySize = (maxSizeKB = 100) => {
    return (req, res, next) => {
        const contentLength = req.headers['content-length'];

        if (!contentLength) {
            return next();
        }

        const sizeKB = parseInt(contentLength) / 1024;

        if (sizeKB > maxSizeKB) {
            return res.status(413).json({
                success: false,
                message: `El tamaño del body excede el límite permitido de ${maxSizeKB}KB`
            });
        }

        next();
    };
};

// ============================================
// VALIDAR CAMPOS REQUERIDOS
// ============================================

exports.validateRequiredFields = (fields = []) => {
    return (req, res, next) => {
        const missingFields = [];

        fields.forEach(field => {
            if (!req.body[field] && req.body[field] !== 0 && req.body[field] !== false) {
                missingFields.push(field);
            }
        });

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Campos requeridos faltantes',
                missingFields
            });
        }

        next();
    };
};

// ============================================
// SANITIZAR DATOS DE ENTRADA
// ============================================

exports.sanitizeInput = (req, res, next) => {
    // Sanitizar query params
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
                req.query[key] = req.query[key].trim();
            }
        });
    }

    // Sanitizar body
    if (req.body && typeof req.body === 'object') {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim();
            }
        });
    }

    next();
};

module.exports = exports;
