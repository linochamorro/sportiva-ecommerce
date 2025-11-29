// ============================================
// CLIENTE CONTROLLER (Admin)
// ============================================
const { Cliente } = require('../models');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

/**
 * Obtener todos los clientes (Admin)
 */
exports.getAllClientes = async (req, res) => {
    try {
        const clientes = await Cliente.findAll();
        res.json({
            success: true,
            data: clientes.map(c => {
                const { password_hash, ...safeData } = c;
                return safeData;
            })
        });
    } catch (error) {
        logger.error('Error al obtener clientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener clientes',
            error: error.message
        });
    }
};

/**
 * Obtener un cliente por ID (Admin)
 */
exports.getClienteById = async (req, res) => {
    try {
        const cliente = await Cliente.findById(req.params.id);
        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }
        // Ocultar hash de password
        const { password_hash, ...safeData } = cliente;
        res.json({
            success: true,
            data: safeData
        });
    } catch (error) {
        logger.error('Error al obtener cliente por ID:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener cliente',
            error: error.message
        });
    }
};

/**
 * Actualizar un cliente (Admin)
 */
exports.updateCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, telefono, email, estado, verificado } = req.body;

        // Validar que el email no esté duplicado
        if (email) {
            const emailExists = await Cliente.emailExists(email, id);
            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message: 'El email ya está en uso por otro cliente'
                });
            }
        }

        const updateData = { nombre, apellido, telefono, email, estado, verificado };

        // Limpiar datos undefined
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        const result = await Cliente.update(id, updateData);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado o sin cambios'
            });
        }

        res.json({
            success: true,
            message: 'Cliente actualizado exitosamente'
        });
    } catch (error) {
        logger.error('Error al actualizar cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar cliente',
            error: error.message
        });
    }
};

/**
 * Cambiar estado de un cliente (Activo/Inactivo) (Admin)
 */
exports.updateEstadoCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (estado === undefined || (estado !== 0 && estado !== 1)) {
            return res.status(400).json({
                success: false,
                message: "Estado inválido. Debe ser 0 (Inactivo) o 1 (Activo)."
            });
        }

        const result = await Cliente.updateEstado(id, estado);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        res.json({
            success: true,
            message: `Cliente ${estado === 1 ? 'activado' : 'desactivado'} exitosamente.`
        });
    } catch (error) {
        logger.error('Error al cambiar estado de cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar estado del cliente',
            error: error.message
        });
    }
};
