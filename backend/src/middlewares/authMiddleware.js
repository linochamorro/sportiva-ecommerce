const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');
const { Cliente } = require('../models');
const Trabajador = require('../models/Trabajador');
const logger = require('../utils/logger');

const trabajadorModel = new Trabajador();

exports.verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado',
                code: 'NO_TOKEN'
            });
        }

        const parts = authHeader.split(' ');
        
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({
                success: false,
                message: 'Formato de token inválido. Use: Bearer <token>',
                code: 'INVALID_FORMAT'
            });
        }

        const token = parts[1];

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

        if (decoded.tipo_usuario === 'trabajador') {
            const trabajador = await trabajadorModel.findById(decoded.id_trabajador);

            if (!trabajador) {
                return res.status(401).json({
                    success: false,
                    message: 'Trabajador no encontrado',
                    code: 'WORKER_NOT_FOUND'
                });
            }

            if (trabajador.estado !== 'Activo') {
                return res.status(403).json({
                    success: false,
                    message: 'Cuenta desactivada',
                    code: 'ACCOUNT_DISABLED'
                });
            }

            req.trabajador = {
                id: trabajador.id_trabajador,
                email: trabajador.email,
                nombre: trabajador.nombre,
                apellido: trabajador.apellido,
                rol: trabajador.rol
            };
            req.tipo_usuario = 'trabajador';
        } else {


const cliente = await Cliente.findById(decoded.id_cliente);

if (!cliente) {
    return res.status(401).json({
        success: false,
        message: 'Cliente no encontrado',
        code: 'CLIENT_NOT_FOUND'
    });
}

// Validar cuenta activa (maneja tanto campo activo como estado)
const estaActivo = cliente.activo === 1 || 
                  cliente.activo === true || 
                  cliente.activo === '1' ||
                  (cliente.estado && cliente.estado === 'Activo');

if (!estaActivo) {
    console.log('❌ Cuenta inactiva - activo:', cliente.activo, '- estado:', cliente.estado);
    return res.status(403).json({
        success: false,
        message: 'Cuenta desactivada',
        code: 'ACCOUNT_DISABLED'
    });
}

console.log('✅ Cliente autenticado:', cliente.email, '- activo:', cliente.activo);



            req.cliente = {
                id: cliente.id_cliente,
                email: cliente.email,
                nombre: cliente.nombre,
                apellido: cliente.apellido
            };
            req.tipo_usuario = 'cliente';
        }

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

exports.requireTrabajador = async (req, res, next) => {
    try {
        if (!req.trabajador) {
            return res.status(401).json({
                success: false,
                message: 'Autenticación de trabajador requerida',
                code: 'WORKER_AUTH_REQUIRED'
            });
        }

        next();
    } catch (error) {
        logger.error('Error en middleware requireTrabajador:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar permisos',
            code: 'PERMISSION_ERROR'
        });
    }
};

exports.requireAdmin = async (req, res, next) => {
    try {
        if (!req.trabajador) {
            return res.status(401).json({
                success: false,
                message: 'Autenticación de trabajador requerida',
                code: 'WORKER_AUTH_REQUIRED'
            });
        }

        if (req.trabajador.rol !== 'Administrador') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Se requieren permisos de administrador',
                code: 'ADMIN_REQUIRED'
            });
        }

        next();
    } catch (error) {
        logger.error('Error en middleware requireAdmin:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar permisos',
            code: 'PERMISSION_ERROR'
        });
    }
};

exports.requireVendedor = async (req, res, next) => {
    try {
        if (!req.trabajador) {
            return res.status(401).json({
                success: false,
                message: 'Autenticación de trabajador requerida',
                code: 'WORKER_AUTH_REQUIRED'
            });
        }

        if (req.trabajador.rol !== 'Vendedor' && req.trabajador.rol !== 'Administrador') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Se requieren permisos de vendedor',
                code: 'VENDEDOR_REQUIRED'
            });
        }

        next();
    } catch (error) {
        logger.error('Error en middleware requireVendedor:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar permisos',
            code: 'PERMISSION_ERROR'
        });
    }
};

exports.optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            req.cliente = null;
            req.trabajador = null;
            return next();
        }

        const parts = authHeader.split(' ');
        
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            req.cliente = null;
            req.trabajador = null;
            return next();
        }

        const token = parts[1];

        try {
            const decoded = jwt.verify(token, JWT_SECRET);

            if (decoded.tipo_usuario === 'trabajador') {
                const trabajador = await trabajadorModel.findById(decoded.id_trabajador);

                if (trabajador && trabajador.estado === 'Activo') {
                    req.trabajador = {
                        id: trabajador.id_trabajador,
                        email: trabajador.email,
                        nombre: trabajador.nombre,
                        apellido: trabajador.apellido,
                        rol: trabajador.rol
                    };
                    req.tipo_usuario = 'trabajador';
                } else {
                    req.trabajador = null;
                }
            } else {
                const cliente = await Cliente.findById(decoded.id_cliente);

                if (cliente && cliente.estado === 'Activo') {
                    req.cliente = {
                        id: cliente.id_cliente,
                        email: cliente.email,
                        nombre: cliente.nombre,
                        apellido: cliente.apellido
                    };
                    req.tipo_usuario = 'cliente';
                } else {
                    req.cliente = null;
                }
            }
        } catch (jwtError) {
            req.cliente = null;
            req.trabajador = null;
        }

        next();

    } catch (error) {
        logger.error('Error en middleware de autenticación opcional:', error);
        req.cliente = null;
        req.trabajador = null;
        next();
    }
};

exports.verifyAdmin = async (req, res, next) => {
    try {
        if (!req.cliente) {
            return res.status(401).json({
                success: false,
                message: 'Autenticación requerida',
                code: 'AUTH_REQUIRED'
            });
        }

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
