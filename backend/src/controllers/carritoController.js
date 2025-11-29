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

        const carrito = await carritoService.getCarrito(clienteId);

        res.json({
            success: true,
            data: carrito.data
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
        const clienteEmail = req.cliente.email;
        
        // Validación: Bloquear compras de trabajadores (@sportiva.com)
        if (clienteEmail && clienteEmail.toLowerCase().endsWith('@sportiva.com')) {
            return res.status(403).json({
                success: false,
                message: 'Las cuentas de trabajadores (@sportiva.com) no pueden realizar compras. Por favor, usa una cuenta de cliente.',
                code: 'TRABAJADOR_NO_PUEDE_COMPRAR'
            });
        }
        
        // El frontend envía { id_producto, id_talla, cantidad }
        const { id_producto, cantidad, id_talla } = req.body;

        console.log('📥 Controller recibió:', { id_producto, cantidad, id_talla });

        // Transformar a números
        const itemData = {
            id_producto: parseInt(id_producto),
            id_talla: id_talla ? parseInt(id_talla) : null,
            cantidad: parseInt(cantidad)
        };

        console.log('📦 Controller transformó a:', itemData);

        // Validar que no sean NaN
        if (isNaN(itemData.id_producto) || !itemData.id_producto) {
            console.error('❌ id_producto es NaN o inválido:', itemData.id_producto);
            return res.status(400).json({
                success: false,
                message: 'ID de producto inválido.'
            });
        }

        const resultado = await carritoService.addItem(clienteId, itemData);

        if (!resultado.success) {
            return res.status(resultado.statusCode || 400).json({
                success: false,
                message: resultado.message
            });
        }

        logger.info(`Item agregado al carrito - Cliente: ${clienteId}, Producto: ${id_producto}`);

        res.status(201).json({
            success: true,
            message: 'Producto agregado al carrito',
            data: resultado.data || {}
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
            const eliminado = await Carrito.removeItem(parseInt(itemId));
            
            if (!eliminado.success) {
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

        // Actualizar cantidad
        const resultado = await carritoService.updateItem(
            clienteId, 
            parseInt(itemId), 
            parseInt(cantidad)
        );

        if (!resultado.success) {
            return res.status(resultado.statusCode || 400).json({
                success: false,
                message: resultado.message
            });
        }

        logger.info(`Cantidad actualizada - Cliente: ${clienteId}, Item: ${itemId}, Nueva cantidad: ${cantidad}`);

        res.json({
            success: true,
            message: 'Cantidad actualizada',
            data: resultado.data
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

        const eliminado = await Carrito.removeItem(parseInt(itemId));

        if (!eliminado.success) {
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

        // Obtener el carrito del cliente
        const carritoResult = await Carrito.getOrCreateCarrito(clienteId);
        
        if (!carritoResult) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró carrito para vaciar'
            });
        }

        const vaciado = await Carrito.clearCarrito(carritoResult.id_carrito);

        if (!vaciado.success) {
            return res.status(404).json({
                success: false,
                message: 'No se pudo vaciar el carrito'
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
        if (req.trabajador) {
            logger.info('Solicitud de resumen de carrito por trabajador, devolviendo vacío.');
            return res.json({
                success: true,
                data: {
                    items: [], total_items: 0, total_productos: 0, subtotal: 0,
                    igv: 0, costoEnvio: 0, total: 0, subtotal_formateado: "S/ 0.00",
                    empty: true
                }
            });
        }
        const clienteId = req.cliente.id;
        const resumen = await carritoService.getQuickSummary(clienteId);

        res.json({
            success: true,
            data: resumen.data
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

        const carrito = await Carrito.getOrCreateCarrito(clienteId);
        const resultado = await Carrito.validateStock(carrito.id_carrito);

        if (!resultado.valid) {
            return res.status(400).json({
                success: false,
                message: 'Algunos productos no tienen stock disponible',
                data: {
                    productosNoDisponibles: resultado.unavailableItems
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
        const { codigoCupon } = req.body;
        const clienteId = req.cliente.id;

        if (!codigoCupon) return res.status(400).json({ success: false, message: 'Código requerido' });

        const resultado = await carritoService.validarCupon(clienteId, codigoCupon);

        if (!resultado.valid) {
            return res.status(400).json({ success: false, message: resultado.message });
        }

        res.json({
            success: true,
            message: 'Cupón aplicado',
            data: { cupon: resultado.cupon }
        });
    } catch (error) {
        logger.error('Error aplicando cupón:', error);
        res.status(500).json({ success: false, message: 'Error interno' });
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
        if (req.trabajador) {
            logger.info('Solicitud de cantidad de items por trabajador, devolviendo 0.');
            return res.json({
                success: true,
                data: {
                    cantidadItems: 0,
                    totalProductos: 0
                }
            });
        }
        const clienteId = req.cliente.id;
        const resumen = await carritoService.getQuickSummary(clienteId);

        res.json({
            success: true,
            data: {
                cantidadItems: resumen.data.total_items || 0,
                totalProductos: resumen.data.total_productos || 0
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
