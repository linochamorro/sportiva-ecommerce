// ============================================
// AUTH CONTROLLER - Controlador de Autenticación
// ============================================

const authService = require('../services/authService');
const { Cliente } = require('../models');
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

        // Verificar si el email ya existe
        const clienteExistente = await Cliente.findByEmail(email);
        if (clienteExistente) {
            return res.status(409).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Registrar cliente usando el servicio
        const resultado = await authService.registrarCliente({
            nombre,
            apellido,
            email,
            password,
            telefono
        });

        logger.info(`Nuevo cliente registrado: ${email}`);

        res.status(201).json({
            success: true,
            message: 'Cliente registrado exitosamente',
            data: {
                cliente: resultado.cliente,
                token: resultado.token
            }
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
        // Validar errores de entrada
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
        const resultado = await authService.autenticarCliente(email, password);

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
            data: {
                cliente: resultado.cliente,
                token: resultado.token
            }
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
        await authService.cerrarSesion(clienteId);

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

        // Obtener datos actualizados del cliente
        const cliente = await Cliente.findById(clienteId);

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Token válido',
            data: {
                cliente: {
                    id: cliente.id,
                    nombre: cliente.nombre,
                    apellido: cliente.apellido,
                    email: cliente.email,
                    telefono: cliente.telefono
                }
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
        const clienteId = req.cliente.id;

        // Generar nuevo token
        const nuevoToken = await authService.renovarToken(clienteId);

        logger.info(`Token renovado para cliente: ${clienteId}`);

        res.json({
            success: true,
            message: 'Token renovado exitosamente',
            data: {
                token: nuevoToken
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

        const cliente = await Cliente.findById(clienteId);

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        res.json({
            success: true,
            data: {
                cliente: {
                    id: cliente.id,
                    nombre: cliente.nombre,
                    apellido: cliente.apellido,
                    email: cliente.email,
                    telefono: cliente.telefono,
                    fecha_registro: cliente.fecha_registro
                }
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

        // No permitir actualizar email o password por esta ruta
        delete datosActualizar.email;
        delete datosActualizar.password;

        const clienteActualizado = await Cliente.update(clienteId, datosActualizar);

        if (!clienteActualizado) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        logger.info(`Perfil actualizado para cliente: ${clienteId}`);

        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            data: {
                cliente: clienteActualizado
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
        const resultado = await authService.cambiarPassword(clienteId, currentPassword, newPassword);

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

module.exports = exports;
