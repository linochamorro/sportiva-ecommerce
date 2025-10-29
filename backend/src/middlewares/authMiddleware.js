// ============================================
// AUTH MIDDLEWARE - Middleware de Autenticación
// ============================================

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');
const { Cliente } = require('../models');
const logger = require('../utils/logger');

// ============================================
// VERIFICAR TOKEN JWT
// ============================================

exports.verifyToken = async (req, res, next) => {
    try {
        // Obtener token del header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado',
                code: 'NO_TOKEN'
            });
        }

        // Verificar formato: "Bearer TOKEN"
        const parts = authHeader.split(' ');
        
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({
                success: false,
                message: 'Formato de token inválido. Use: Bearer <token>',
                code: 'INVALID_FORMAT'
            });
        }

        const token = parts[1];

        // Verificar y decodificar token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expirado',
                    code: 'TOKEN_EXPIRED'
                });
            }

            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token inválido',
                    code: 'INVALID_TOKEN'
                });
            }

            throw jwtError;
        }

        const cliente = await Cliente.findById(decoded.id_cliente);

        if (!cliente) {
            return res.status(401).json({
                success: false,
                message: 'Cliente no encontrado',
                code: 'CLIENT_NOT_FOUND'
            });
        }

        if (!cliente.activo) {
            return res.status(403).json({
                success: false,
                message: 'Cuenta desactivada',
                code: 'ACCOUNT_DISABLED'
            });
        }

        req.cliente = {
            id: cliente.id_cliente,
            email: cliente.email,
            nombre: cliente.nombre,
            apellido: cliente.apellido
        };
        next();
    } catch (error) {
        logger.error('Error en middleware de autenticación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar autenticación',
            code: 'AUTH_ERROR'
        });
    }
};

// ============================================
// VERIFICAR TOKEN OPCIONAL (Para rutas públicas con funcionalidad extra para autenticados)
// ============================================

exports.optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Si no hay token, continuar sin autenticación
        if (!authHeader) {
            req.cliente = null;
            return next();
        }

        const parts = authHeader.split(' ');
        
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            req.cliente = null;
            return next();
        }

        const token = parts[1];

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const cliente = await Cliente.findById(decoded.id_cliente);

            if (cliente && cliente.activo) {
                req.cliente = {
                  id: cliente.id_cliente,
                  email: cliente.email,
                  nombre: cliente.nombre,
                  apellido: cliente.apellido
                };
            } else {
                req.cliente = null;
            }
        } catch (jwtError) {
            // Si hay error con el token, continuar sin autenticación
            req.cliente = null;
        }

        next();

    } catch (error) {
        logger.error('Error en middleware de autenticación opcional:', error);
        req.cliente = null;
        next();
    }
};

// ============================================
// VERIFICAR ROL DE ADMINISTRADOR (Para futuras funcionalidades admin)
// ============================================

exports.verifyAdmin = async (req, res, next) => {
    try {
        // Primero verificar que el usuario está autenticado
        if (!req.cliente) {
            return res.status(401).json({
                success: false,
                message: 'Autenticación requerida',
                code: 'AUTH_REQUIRED'
            });
        }

        // Verificar rol de administrador (por ahora solo verificamos campo)
        const cliente = await Cliente.findById(req.cliente.id);

        if (!cliente.es_admin) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Se requieren permisos de administrador',
                code: 'ADMIN_REQUIRED'
            });
        }

        next();

    } catch (error) {
        logger.error('Error en middleware de verificación de admin:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar permisos',
            code: 'PERMISSION_ERROR'
        });
    }
};

module.exports = exports;
