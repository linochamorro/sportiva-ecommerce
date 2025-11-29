// ============================================
// AUTH CONTROLLER - Controlador de Autenticación
// ============================================

const authService = require('../services/authService');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

// ============================================
// REGISTRO DE NUEVO CLIENTE
// ============================================

exports.register = async (req, res) => {
    try {
        // Validar errores de entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const { nombre, apellido, email, password, telefono } = req.body;

        // Registrar cliente usando el servicio
        const resultado = await authService.register({
            nombre,
            apellido,
            email,
            password,
            telefono
        });

        if (!resultado.success) {
            return res.status(409).json({
                success: false,
                message: resultado.message
            });
        }

        logger.info(`Nuevo cliente registrado: ${email}`);

        res.status(201).json({
            success: true,
            message: 'Cliente registrado exitosamente',
            token: resultado.data.token,
            usuario: resultado.data.cliente
        });

    } catch (error) {
        logger.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar cliente',
            error: error.message
        });
    }
};

// ============================================
// LOGIN DE CLIENTE
// ============================================

exports.login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Autenticar usando el servicio
        const resultado = await authService.login(email, password);

        if (!resultado.success) {
            return res.status(401).json({
                success: false,
                message: resultado.message
            });
        }

        logger.info(`Cliente autenticado: ${email}`);

        res.json({
            success: true,
            message: 'Autenticación exitosa',
            token: resultado.data.token,
            usuario: resultado.data.cliente
        });

    } catch (error) {
        logger.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al autenticar cliente',
            error: error.message
        });
    }
};

// ============================================
// LOGOUT DE CLIENTE
// ============================================

exports.logout = async (req, res) => {
    try {
        const clienteId = req.cliente.id;

        // Cerrar sesión usando el servicio
        await authService.logout(clienteId);

        logger.info(`Cliente cerró sesión: ${clienteId}`);

        res.json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });

    } catch (error) {
        logger.error('Error en logout:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cerrar sesión',
            error: error.message
        });
    }
};

// ============================================
// VERIFICAR TOKEN
// ============================================

exports.verifyToken = async (req, res) => {
    try {
        // El middleware ya verificó el token y añadió req.cliente
        const clienteId = req.cliente.id;

        // Verificar autenticación usando el servicio
        const resultado = await authService.verifyAuthentication(clienteId);

        if (!resultado.authenticated) {
            return res.status(404).json({
                success: false,
                message: resultado.message
            });
        }

        res.json({
            success: true,
            message: 'Token válido',
            data: {
                cliente: resultado.cliente
            }
        });

    } catch (error) {
        logger.error('Error al verificar token:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar token',
            error: error.message
        });
    }
};

// ============================================
// RENOVAR TOKEN
// ============================================

exports.refreshToken = async (req, res) => {
    try {
        const oldToken = req.headers.authorization?.replace('Bearer ', '');

        if (!oldToken) {
            return res.status(400).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        // Refrescar token usando el servicio
        const resultado = await authService.refreshToken(oldToken);

        if (!resultado.success) {
            return res.status(401).json({
                success: false,
                message: resultado.message
            });
        }

        logger.info(`Token renovado`);

        res.json({
            success: true,
            message: 'Token renovado exitosamente',
            data: {
                token: resultado.data.token
            }
        });

    } catch (error) {
        logger.error('Error al renovar token:', error);
        res.status(500).json({
            success: false,
            message: 'Error al renovar token',
            error: error.message
        });
    }
};

// ============================================
// OBTENER PERFIL DEL CLIENTE
// ============================================

exports.getProfile = async (req, res) => {
    try {
        const clienteId = req.cliente.id;

        // Obtener perfil usando el servicio
        const resultado = await authService.getProfile(clienteId);

        if (!resultado.success) {
            return res.status(404).json({
                success: false,
                message: resultado.message
            });
        }

        res.json({
            success: true,
            data: {
                cliente: resultado.data
            }
        });

    } catch (error) {
        logger.error('Error al obtener perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener perfil',
            error: error.message
        });
    }
};

// ============================================
// ACTUALIZAR PERFIL DEL CLIENTE
// ============================================

exports.updateProfile = async (req, res) => {
    try {
        // Validar errores de entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const clienteId = req.cliente.id;
        const datosActualizar = req.body;
        const resultado = await authService.updateProfile(clienteId, datosActualizar);

        if (!resultado.success) {
            return res.status(404).json({
                success: false,
                message: resultado.message
            });
        }

        logger.info(`Perfil actualizado para cliente: ${clienteId}`);

        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            data: {
                cliente: resultado.data
            }
        });

    } catch (error) {
        logger.error('Error al actualizar perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar perfil',
            error: error.message
        });
    }
};

// ============================================
// CAMBIAR CONTRASEÑA
// ============================================

exports.changePassword = async (req, res) => {
    try {
        // Validar errores de entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const clienteId = req.cliente.id;
        const { currentPassword, newPassword } = req.body;

        // Cambiar contraseña usando el servicio
        const resultado = await authService.changePassword(clienteId, currentPassword, newPassword);

        if (!resultado.success) {
            return res.status(400).json({
                success: false,
                message: resultado.message
            });
        }

        logger.info(`Contraseña cambiada para cliente: ${clienteId}`);

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        logger.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar contraseña',
            error: error.message
        });
    }
};

// ============================================
// OBTENER ESTADÍSTICAS DE CLIENTES (ADMIN)
// ============================================

exports.obtenerEstadisticasClientes = async (req, res) => {
    try {
        const totalClientes = await authService.clienteModel.count({ estado: 'Activo' });
        res.json({
            success: true,
            data: {
                clientes_activos: totalClientes
            }
        });
    } catch (error) {
        logger.error('Error al obtener estadísticas de clientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas de clientes',
            error: error.message
        });
    }
};

module.exports = exports;
