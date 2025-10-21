// ============================================
// CARRITO CONTROLLER - Controlador del Carrito
// ============================================

const carritoService = require('../services/carritoService');
const { Carrito } = require('../models');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

// ============================================
// OBTENER CARRITO DEL CLIENTE
// ============================================

exports.obtenerCarrito = async (req, res) => {
    try {
        const clienteId = req.cliente.id;

        const carrito = await carritoService.obtenerCarritoCompleto(clienteId);

        res.json({
            success: true,
            data: {
                carrito
            }
        });

    } catch (error) {
        logger.error('Error al obtener carrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener carrito',
            error: error.message
        });
    }
};

// ============================================
// AGREGAR ITEM AL CARRITO
// ============================================

exports.agregarItem = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const clienteId = req.cliente.id;
        const { productoId, cantidad, tallaId } = req.body;

        const resultado = await carritoService.agregarProducto(clienteId, productoId, cantidad, tallaId);

        if (!resultado.success) {
            return res.status(400).json({
                success: false,
                message: resultado.message
            });
        }

        logger.info(`Item agregado al carrito - Cliente: ${clienteId}, Producto: ${productoId}`);

        res.status(201).json({
            success: true,
            message: 'Producto agregado al carrito',
            data: {
                carrito: resultado.carrito
            }
        });

    } catch (error) {
        logger.error('Error al agregar item al carrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al agregar producto al carrito',
            error: error.message
        });
    }
};

// ============================================
// ACTUALIZAR CANTIDAD DE ITEM
// ============================================

exports.actualizarItem = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const clienteId = req.cliente.id;
        const itemId = req.params.itemId;
        const { cantidad } = req.body;

        // Si cantidad es 0, eliminar el item
        if (cantidad === 0) {
            const eliminado = await Carrito.removeItem(clienteId, itemId);
            
            if (!eliminado) {
                return res.status(404).json({
                    success: false,
                    message: 'Item no encontrado en el carrito'
                });
            }

            logger.info(`Item eliminado del carrito - Cliente: ${clienteId}, Item: ${itemId}`);

            return res.json({
                success: true,
                message: 'Producto eliminado del carrito'
            });
        }

        const resultado = await carritoService.actualizarCantidad(clienteId, itemId, cantidad);

        if (!resultado.success) {
            return res.status(400).json({
                success: false,
                message: resultado.message
            });
        }

        logger.info(`Cantidad actualizada - Cliente: ${clienteId}, Item: ${itemId}, Nueva cantidad: ${cantidad}`);

        res.json({
            success: true,
            message: 'Cantidad actualizada',
            data: {
                carrito: resultado.carrito
            }
        });

    } catch (error) {
        logger.error('Error al actualizar item:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar cantidad',
            error: error.message
        });
    }
};

// ============================================
// ELIMINAR ITEM DEL CARRITO
// ============================================

exports.eliminarItem = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const clienteId = req.cliente.id;
        const itemId = req.params.itemId;

        const eliminado = await Carrito.removeItem(clienteId, itemId);

        if (!eliminado) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado en el carrito'
            });
        }

        logger.info(`Item eliminado - Cliente: ${clienteId}, Item: ${itemId}`);

        res.json({
            success: true,
            message: 'Producto eliminado del carrito'
        });

    } catch (error) {
        logger.error('Error al eliminar item:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar producto',
            error: error.message
        });
    }
};

// ============================================
// VACIAR CARRITO COMPLETO
// ============================================

exports.vaciarCarrito = async (req, res) => {
    try {
        const clienteId = req.cliente.id;

        const vaciado = await Carrito.clear(clienteId);

        if (!vaciado) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró carrito para vaciar'
            });
        }

        logger.info(`Carrito vaciado - Cliente: ${clienteId}`);

        res.json({
            success: true,
            message: 'Carrito vaciado exitosamente'
        });

    } catch (error) {
        logger.error('Error al vaciar carrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al vaciar carrito',
            error: error.message
        });
    }
};

// ============================================
// OBTENER RESUMEN DEL CARRITO
// ============================================

exports.obtenerResumen = async (req, res) => {
    try {
        const clienteId = req.cliente.id;

        const resumen = await carritoService.calcularTotales(clienteId);

        res.json({
            success: true,
            data: {
                resumen
            }
        });

    } catch (error) {
        logger.error('Error al obtener resumen del carrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener resumen',
            error: error.message
        });
    }
};

// ============================================
// VALIDAR DISPONIBILIDAD DE STOCK
// ============================================

exports.validarDisponibilidad = async (req, res) => {
    try {
        const clienteId = req.cliente.id;

        const resultado = await carritoService.validarStock(clienteId);

        if (!resultado.disponible) {
            return res.status(400).json({
                success: false,
                message: 'Algunos productos no tienen stock disponible',
                data: {
                    productosNoDisponibles: resultado.productosNoDisponibles
                }
            });
        }

        res.json({
            success: true,
            message: 'Todos los productos están disponibles',
            data: {
                disponible: true
            }
        });

    } catch (error) {
        logger.error('Error al validar disponibilidad:', error);
        res.status(500).json({
            success: false,
            message: 'Error al validar disponibilidad',
            error: error.message
        });
    }
};

// ============================================
// APLICAR CUPÓN DE DESCUENTO
// ============================================

exports.aplicarCupon = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const clienteId = req.cliente.id;
        const { codigoCupon } = req.body;

        // Por ahora retornamos mensaje que la funcionalidad está en desarrollo
        // En producción se implementaría tabla de cupones y validación
        logger.info(`Intento de aplicar cupón - Cliente: ${clienteId}, Código: ${codigoCupon}`);

        res.status(501).json({
            success: false,
            message: 'Funcionalidad de cupones en desarrollo'
        });

    } catch (error) {
        logger.error('Error al aplicar cupón:', error);
        res.status(500).json({
            success: false,
            message: 'Error al aplicar cupón',
            error: error.message
        });
    }
};

// ============================================
// REMOVER CUPÓN APLICADO
// ============================================

exports.removerCupon = async (req, res) => {
    try {
        const clienteId = req.cliente.id;

        logger.info(`Intento de remover cupón - Cliente: ${clienteId}`);

        res.status(501).json({
            success: false,
            message: 'Funcionalidad de cupones en desarrollo'
        });

    } catch (error) {
        logger.error('Error al remover cupón:', error);
        res.status(500).json({
            success: false,
            message: 'Error al remover cupón',
            error: error.message
        });
    }
};

// ============================================
// OBTENER CANTIDAD DE ITEMS
// ============================================

exports.obtenerCantidadItems = async (req, res) => {
    try {
        const clienteId = req.cliente.id;

        const carrito = await Carrito.findByClienteId(clienteId);

        let cantidadTotal = 0;
        if (carrito && carrito.items) {
            cantidadTotal = carrito.items.reduce((total, item) => total + item.cantidad, 0);
        }

        res.json({
            success: true,
            data: {
                cantidadItems: cantidadTotal
            }
        });

    } catch (error) {
        logger.error('Error al obtener cantidad de items:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener cantidad de items',
            error: error.message
        });
    }
};

module.exports = exports;
