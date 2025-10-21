// ============================================
// PEDIDO CONTROLLER - Controlador de Pedidos
// ============================================

const { Pedido, Carrito, Pago } = require('../models');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

// ============================================
// OBTENER PEDIDOS DEL CLIENTE
// ============================================

exports.obtenerPedidos = async (req, res) => {
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
        const { estado, fechaInicio, fechaFin, page = 1, limit = 10 } = req.query;

        const filtros = {
            estado,
            fechaInicio,
            fechaFin
        };

        const offset = (page - 1) * limit;
        const pedidos = await Pedido.findByClienteId(clienteId, filtros, limit, offset);
        const total = await Pedido.countByClienteId(clienteId, filtros);

        res.json({
            success: true,
            data: {
                pedidos,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        logger.error('Error al obtener pedidos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pedidos',
            error: error.message
        });
    }
};

// ============================================
// CREAR NUEVO PEDIDO DESDE CARRITO
// ============================================

exports.crearPedido = async (req, res) => {
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
        const { direccionEnvioId, nuevaDireccion, metodoPago, notasAdicionales } = req.body;

        // Validar que existe carrito con items
        const carrito = await Carrito.findByClienteId(clienteId);
        
        if (!carrito || !carrito.items || carrito.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El carrito está vacío'
            });
        }

        // Validar stock disponible
        const stockValido = await Carrito.validateStock(clienteId);
        if (!stockValido) {
            return res.status(400).json({
                success: false,
                message: 'Algunos productos no tienen stock disponible'
            });
        }

        // Crear pedido desde carrito
        const pedido = await Pedido.createFromCarrito(
            clienteId, 
            direccionEnvioId || nuevaDireccion,
            notasAdicionales
        );

        if (!pedido) {
            return res.status(500).json({
                success: false,
                message: 'Error al crear el pedido'
            });
        }

        // Vaciar carrito después de crear pedido
        await Carrito.clear(clienteId);

        logger.info(`Pedido creado - ID: ${pedido.id}, Cliente: ${clienteId}`);

        res.status(201).json({
            success: true,
            message: 'Pedido creado exitosamente',
            data: {
                pedido: {
                    id: pedido.id,
                    numero_pedido: pedido.numero_pedido,
                    total: pedido.total,
                    estado: pedido.estado,
                    fecha_pedido: pedido.fecha_pedido
                }
            }
        });

    } catch (error) {
        logger.error('Error al crear pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear pedido',
            error: error.message
        });
    }
};

// ============================================
// OBTENER DETALLE DE UN PEDIDO
// ============================================

exports.obtenerPedidoPorId = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const pedidoId = req.params.id;
        const clienteId = req.cliente.id;

        const pedido = await Pedido.findByIdWithDetails(pedidoId);

        if (!pedido) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        // Verificar que el pedido pertenece al cliente autenticado
        if (pedido.cliente_id !== clienteId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver este pedido'
            });
        }

        res.json({
            success: true,
            data: {
                pedido
            }
        });

    } catch (error) {
        logger.error('Error al obtener pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pedido',
            error: error.message
        });
    }
};

// ============================================
// CANCELAR PEDIDO
// ============================================

exports.cancelarPedido = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const pedidoId = req.params.id;
        const clienteId = req.cliente.id;
        const { motivo } = req.body;

        const pedido = await Pedido.findById(pedidoId);

        if (!pedido) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        // Verificar que el pedido pertenece al cliente
        if (pedido.cliente_id !== clienteId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para cancelar este pedido'
            });
        }

        // Verificar que el pedido puede ser cancelado
        const estadosNoCancelables = ['enviado', 'entregado', 'cancelado'];
        if (estadosNoCancelables.includes(pedido.estado)) {
            return res.status(400).json({
                success: false,
                message: `No se puede cancelar un pedido en estado: ${pedido.estado}`
            });
        }

        const cancelado = await Pedido.cancel(pedidoId, motivo);

        if (!cancelado) {
            return res.status(500).json({
                success: false,
                message: 'Error al cancelar el pedido'
            });
        }

        logger.info(`Pedido cancelado - ID: ${pedidoId}, Cliente: ${clienteId}, Motivo: ${motivo}`);

        res.json({
            success: true,
            message: 'Pedido cancelado exitosamente'
        });

    } catch (error) {
        logger.error('Error al cancelar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cancelar pedido',
            error: error.message
        });
    }
};

// ============================================
// PROCESAR PAGO DE PEDIDO
// ============================================

exports.procesarPago = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const pedidoId = req.params.id;
        const clienteId = req.cliente.id;
        const { metodoPago, numeroTransaccion, datosPago } = req.body;

        const pedido = await Pedido.findById(pedidoId);

        if (!pedido) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        // Verificar que el pedido pertenece al cliente
        if (pedido.cliente_id !== clienteId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para procesar este pago'
            });
        }

        // Verificar que el pedido está pendiente de pago
        if (pedido.estado !== 'pendiente') {
            return res.status(400).json({
                success: false,
                message: 'El pedido no está en estado pendiente'
            });
        }

        // Crear registro de pago
        const pago = await Pago.create({
            pedido_id: pedidoId,
            monto: pedido.total,
            metodo_pago: metodoPago,
            numero_transaccion: numeroTransaccion || `TXN-${Date.now()}`,
            estado: 'completado'
        });

        if (!pago) {
            return res.status(500).json({
                success: false,
                message: 'Error al procesar el pago'
            });
        }

        // Actualizar estado del pedido
        await Pedido.updateEstado(pedidoId, 'confirmado');

        logger.info(`Pago procesado - Pedido: ${pedidoId}, Pago: ${pago.id}, Monto: ${pedido.total}`);

        res.json({
            success: true,
            message: 'Pago procesado exitosamente',
            data: {
                pago: {
                    id: pago.id,
                    monto: pago.monto,
                    metodo_pago: pago.metodo_pago,
                    numero_transaccion: pago.numero_transaccion,
                    estado: pago.estado
                },
                pedido: {
                    id: pedidoId,
                    estado: 'confirmado'
                }
            }
        });

    } catch (error) {
        logger.error('Error al procesar pago:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar pago',
            error: error.message
        });
    }
};

// ============================================
// OBTENER ESTADO DE SEGUIMIENTO
// ============================================

exports.obtenerEstadoPedido = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const pedidoId = req.params.id;
        const clienteId = req.cliente.id;

        const pedido = await Pedido.findById(pedidoId);

        if (!pedido) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        // Verificar que el pedido pertenece al cliente
        if (pedido.cliente_id !== clienteId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver este pedido'
            });
        }

        res.json({
            success: true,
            data: {
                estado: pedido.estado,
                fecha_pedido: pedido.fecha_pedido,
                fecha_entrega_estimada: pedido.fecha_entrega_estimada,
                numero_pedido: pedido.numero_pedido
            }
        });

    } catch (error) {
        logger.error('Error al obtener estado del pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estado',
            error: error.message
        });
    }
};

// ============================================
// AGREGAR RESEÑA DE PRODUCTO
// ============================================

exports.agregarResena = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const pedidoId = req.params.id;
        const clienteId = req.cliente.id;
        const { productoId, calificacion, comentario } = req.body;

        // Verificar que el pedido existe y pertenece al cliente
        const pedido = await Pedido.findById(pedidoId);

        if (!pedido) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        if (pedido.cliente_id !== clienteId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para reseñar este pedido'
            });
        }

        // Verificar que el pedido está entregado
        if (pedido.estado !== 'entregado') {
            return res.status(400).json({
                success: false,
                message: 'Solo puedes reseñar productos de pedidos entregados'
            });
        }

        // Crear reseña (por ahora retornamos mensaje de funcionalidad en desarrollo)
        logger.info(`Intento de agregar reseña - Pedido: ${pedidoId}, Producto: ${productoId}, Cliente: ${clienteId}`);

        res.status(501).json({
            success: false,
            message: 'Funcionalidad de reseñas en desarrollo'
        });

    } catch (error) {
        logger.error('Error al agregar reseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error al agregar reseña',
            error: error.message
        });
    }
};

// ============================================
// DESCARGAR FACTURA
// ============================================

exports.descargarFactura = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const pedidoId = req.params.id;
        const clienteId = req.cliente.id;

        const pedido = await Pedido.findByIdWithDetails(pedidoId);

        if (!pedido) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        if (pedido.cliente_id !== clienteId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para descargar esta factura'
            });
        }

        // Funcionalidad de generación de PDF pendiente
        logger.info(`Solicitud de factura - Pedido: ${pedidoId}, Cliente: ${clienteId}`);

        res.status(501).json({
            success: false,
            message: 'Funcionalidad de facturas en desarrollo'
        });

    } catch (error) {
        logger.error('Error al descargar factura:', error);
        res.status(500).json({
            success: false,
            message: 'Error al descargar factura',
            error: error.message
        });
    }
};

// ============================================
// OBTENER ESTADÍSTICAS DE PEDIDOS
// ============================================

exports.obtenerEstadisticas = async (req, res) => {
    try {
        const clienteId = req.cliente.id;

        const estadisticas = await Pedido.getEstadisticas(clienteId);

        res.json({
            success: true,
            data: {
                estadisticas
            }
        });

    } catch (error) {
        logger.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};

module.exports = exports;
