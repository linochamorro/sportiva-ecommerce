// ============================================
// PEDIDO SERVICE - Lógica de Negocio
// ============================================

const Carrito = require('../models/Carrito');
const Pedido = require('../models/Pedido');
const Pago = require('../models/Pago');
const Cliente = require('../models/Cliente');
const logger = require('../utils/logger');
const { IGV, COSTO_ENVIO_LIMA } = require('../config/constants');

class PedidoService {
    constructor() {
        this.carritoModel = new Carrito();
        this.pedidoModel = new Pedido();
        this.pagoModel = new Pago();
        this.clienteModel = new Cliente();
    }

    // ============================================
    // CREAR PEDIDO DESDE CARRITO
    // ============================================

    /**
     * Crear pedido completo desde carrito con validaciones
     */
    async crearPedidoDesdeCarrito(id_cliente, datosCheckout) {
        try {
            logger.info(`Iniciando creación de pedido para cliente ${id_cliente}`);

            // 1. Validar que el cliente existe
            const cliente = await this.clienteModel.findById(id_cliente);
            if (!cliente) {
                return {
                    success: false,
                    statusCode: 404,
                    message: 'Cliente no encontrado'
                };
            }

            // 2. Obtener carrito con items
            const carrito = await this.carritoModel.getCarritoWithItems(id_cliente);
            
            if (!carrito || !carrito.items || carrito.items.length === 0) {
                return {
                    success: false,
                    statusCode: 400,
                    message: 'El carrito está vacío'
                };
            }

            logger.info(`Carrito encontrado: ${carrito.items.length} items`);

            // 3. Validar stock de todos los items
            const validacionStock = await this.carritoModel.validateStock(carrito.id_carrito);
            
            if (!validacionStock.valid) {
                return {
                    success: false,
                    statusCode: 409,
                    message: 'Algunos productos no tienen stock disponible',
                    data: {
                        productos_no_disponibles: validacionStock.unavailableItems
                    }
                };
            }

            logger.info('Validación de stock exitosa');

            // 4. Calcular totales
            const totales = await this.carritoModel.calculateTotals(
                carrito.id_carrito,
                IGV || 0.18,
                COSTO_ENVIO_LIMA || 15.00
            );

            logger.info('Totales calculados:', totales);

            // 5. Procesar dirección de envío
            let id_direccion_envio = null;
            
            if (datosCheckout.id_direccion_envio) {
                id_direccion_envio = datosCheckout.id_direccion_envio;
            } else if (datosCheckout.direccion_envio) {
                const datosDireccion = {
                    direccion: datosCheckout.direccion_envio.direccion || 'Dirección no especificada',
                    ciudad: datosCheckout.direccion_envio.distrito || 'Lima',
                    departamento: datosCheckout.direccion_envio.departamento || 'Lima',
                    codigo_postal: datosCheckout.direccion_envio.codigo_postal || '15000',
                    referencia: datosCheckout.direccion_envio.referencia ? datosCheckout.direccion_envio.referencia : null,
                    es_principal: false,
                    pais: 'Perú'
                };

                logger.info('Creando nueva dirección con datos:', datosDireccion);

                // Crear nueva dirección si se proporcionó
                const nuevaDireccion = await this.clienteModel.addDireccion(
                    id_cliente,
                    datosDireccion
                );

                if (nuevaDireccion.success) {
                    id_direccion_envio = nuevaDireccion.id;
                    logger.info(`Nueva dirección creada: ${id_direccion_envio}`);
                } else {
                    logger.warn('Fallo al crear dirección, continuando con ID nulo');
                }
            }

            // 6. Preparar datos del pedido
            const pedidoData = {
                id_cliente: id_cliente,
                id_direccion_envio: id_direccion_envio,
                subtotal: totales.subtotal,
                igv: totales.igv,
                costo_envio: totales.costoEnvio,
                total: totales.total,
                metodo_pago: datosCheckout.metodo_pago || 'tarjeta',
                notas: datosCheckout.notas || null
            };

            // 7. Preparar items del carrito para el pedido
            const carritoItems = carrito.items.map(item => ({
                id_producto: item.id_producto,
                id_talla_producto: item.id_talla,
                cantidad: item.cantidad,
                precio_unitario: item.precio_unitario,
                subtotal: item.subtotal
            }));

            logger.info('Items preparados para pedido:', carritoItems.length);

            // 8. Crear pedido en transacción
            const resultadoPedido = await this.pedidoModel.createFromCarrito(
                pedidoData,
                carritoItems
            );

            if (!resultadoPedido.success) {
                return {
                    success: false,
                    statusCode: 500,
                    message: resultadoPedido.message || 'Error al crear el pedido'
                };
            }

            logger.info(`Pedido creado exitosamente: ${resultadoPedido.numero_pedido}`);

            // 9. Crear registro de pago
            const pagoData = {
                id_pedido: resultadoPedido.id_pedido,
                monto: totales.total,
                metodo_pago: datosCheckout.metodo_pago || 'tarjeta',
                estado_pago: 'pendiente',
                referencia_transaccion: await this.pagoModel.generateReferencia(
                    datosCheckout.metodo_pago || 'tarjeta'
                )
            };

            await this.pagoModel.createPago(pagoData);
            logger.info('Pago registrado');

            // 10. Marcar carrito como convertido
            await this.carritoModel.convertToPedido(carrito.id_carrito);
            logger.info('Carrito marcado como convertido');

            // 11. Retornar respuesta exitosa
            return {
                success: true,
                statusCode: 201,
                message: 'Pedido creado exitosamente',
                data: {
                    pedido_id: resultadoPedido.id_pedido,
                    numero_pedido: resultadoPedido.numero_pedido,
                    numero_tracking: `TRK-${resultadoPedido.numero_pedido}`,
                    total: totales.total,
                    metodo_pago: datosCheckout.metodo_pago,
                    estado: 'pendiente',
                    items_count: carritoItems.length
                }
            };

        } catch (error) {
            logger.error('Error en crearPedidoDesdeCarrito:', error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error al procesar el pedido',
                error: error.message
            };
        }
    }

    // ============================================
    // OBTENER PEDIDOS DEL CLIENTE
    // ============================================

    /**
     * Obtener lista de pedidos del cliente
     */
    async obtenerPedidosCliente(id_cliente, filtros = {}, pagination = {}) {
        try {
            const page = parseInt(pagination.page) || 1;
            const limit = parseInt(pagination.limit) || 10;
            const offset = (page - 1) * limit;

            const pedidos = await this.pedidoModel.findByCliente(
                id_cliente,
                filtros,
                limit,
                offset
            );

            const total = await this.pedidoModel.countByCliente(id_cliente, filtros);

            return {
                success: true,
                data: {
                    pedidos,
                    pagination: {
                        page,
                        limit,
                        total,
                        total_pages: Math.ceil(total / limit)
                    }
                }
            };

        } catch (error) {
            logger.error('Error obteniendo pedidos del cliente:', error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error al obtener pedidos'
            };
        }
    }

    // ============================================
    // OBTENER DETALLE DEL PEDIDO
    // ============================================

    /**
     * Obtener pedido por ID con validación de pertenencia
     */
    async obtenerPedidoPorId(id_pedido, id_cliente) {
        try {
            const pedido = await this.pedidoModel.findByIdWithDetails(id_pedido);

            if (!pedido) {
                return {
                    success: false,
                    statusCode: 404,
                    message: 'Pedido no encontrado'
                };
            }

            // Verificar que el pedido pertenece al cliente
            if (pedido.id_cliente !== id_cliente) {
                return {
                    success: false,
                    statusCode: 403,
                    message: 'No tienes permiso para ver este pedido'
                };
            }

            return {
                success: true,
                data: { pedido }
            };

        } catch (error) {
            logger.error('Error obteniendo detalle del pedido:', error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error al obtener el pedido'
            };
        }
    }

    // ============================================
    // CANCELAR PEDIDO
    // ============================================

    /**
     * Cancelar pedido si está en estado permitido
     */
    async cancelarPedido(id_pedido, id_cliente, motivo) {
        try {
            const pedido = await this.pedidoModel.findById(id_pedido);

            if (!pedido) {
                return {
                    success: false,
                    statusCode: 404,
                    message: 'Pedido no encontrado'
                };
            }

            // Verificar pertenencia
            if (pedido.id_cliente !== id_cliente) {
                return {
                    success: false,
                    statusCode: 403,
                    message: 'No tienes permiso para cancelar este pedido'
                };
            }

            // Verificar si el pedido puede ser cancelado
            const estadosPermitidos = ['pendiente', 'confirmado'];
            if (!estadosPermitidos.includes(pedido.estado)) {
                return {
                    success: false,
                    statusCode: 400,
                    message: `No se puede cancelar un pedido en estado: ${pedido.estado}`
                };
            }

            // Cancelar pedido
            await this.pedidoModel.updateEstado(id_pedido, 'cancelado');

            logger.info(`Pedido ${id_pedido} cancelado. Motivo: ${motivo}`);

            return {
                success: true,
                message: 'Pedido cancelado exitosamente'
            };

        } catch (error) {
            logger.error('Error cancelando pedido:', error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error al cancelar el pedido'
            };
        }
    }

    // ============================================
    // UTILIDADES
    // ============================================

    /**
     * Formatear precio
     */
    formatPrice(precio) {
        return `S/ ${parseFloat(precio).toFixed(2)}`;
    }

    /**
     * Validar método de pago
     */
    validarMetodoPago(metodo) {
        const metodosValidos = ['tarjeta', 'yape', 'plin', 'efectivo', 'transferencia'];
        return metodosValidos.includes(metodo);
    }
}

module.exports = new PedidoService();
