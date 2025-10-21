// ============================================
// CARRITO SERVICE - SOLID Principles
// ============================================
const { Carrito, Producto, Pedido, Pago } = require('../models');
const { IGV, COSTO_ENVIO_LIMA, COSTO_ENVIO_PROVINCIAS } = require('../config/constants');

/**
 * CarritoService - Responsabilidad única: Lógica de negocio del carrito
 * Aplica Single Responsibility Principle (SRP) y Dependency Inversion (DIP)
 */
class CarritoService {
    constructor() {
        this.carritoModel = Carrito;
        this.productoModel = Producto;
        this.pedidoModel = Pedido;
        this.pagoModel = Pago;
    }

    // ============================================
    // OBTENER CARRITO
    // ============================================

    /**
     * Obtener carrito del cliente con todos los detalles
     */
    async getCarrito(id_cliente) {
        try {
            const carrito = await this.carritoModel.getCarritoWithItems(id_cliente);

            if (!carrito || carrito.total_items === 0) {
                return {
                    success: true,
                    data: {
                        carrito_vacio: true,
                        items: [],
                        totales: this.getEmptyCartTotals()
                    }
                };
            }

            // Calcular totales con IGV y envío
            const totales = await this.calculateDetailedTotals(
                carrito.id_carrito,
                carrito.departamento || 'Lima'
            );

            // Validar stock de items
            const stockValidation = await this.carritoModel.validateStock(carrito.id_carrito);

            return {
                success: true,
                data: {
                    carrito_vacio: false,
                    id_carrito: carrito.id_carrito,
                    items: carrito.items.map(item => this.enrichCartItem(item)),
                    totales,
                    stock_validation: stockValidation,
                    puede_procesar: stockValidation.valid
                }
            };
        } catch (error) {
            throw new Error(`Error obteniendo carrito: ${error.message}`);
        }
    }

    // ============================================
    // AGREGAR AL CARRITO
    // ============================================

    /**
     * Agregar producto al carrito
     */
    async addItem(id_cliente, itemData) {
        try {
            // Validar datos de entrada
            const validation = this.validateCartItem(itemData);
            if (!validation.valid) {
                return {
                    success: false,
                    message: validation.message
                };
            }

            // Verificar que el producto existe y está activo
            const producto = await this.productoModel.findById(itemData.id_producto);
            if (!producto || !producto.activo) {
                return {
                    success: false,
                    message: 'Producto no disponible'
                };
            }

            // Verificar disponibilidad de stock
            const stockCheck = await this.productoModel.checkStock(
                itemData.id_producto,
                itemData.talla,
                itemData.cantidad
            );

            if (!stockCheck.available) {
                return {
                    success: false,
                    message: `Stock insuficiente. Solo hay ${stockCheck.stock} unidades disponibles`
                };
            }

            // Obtener o crear carrito del cliente
            const carrito = await this.carritoModel.getOrCreateCarrito(id_cliente);

            // Agregar item al carrito
            const result = await this.carritoModel.addItem(carrito.id_carrito, {
                id_producto: itemData.id_producto,
                id_talla_producto: stockCheck.id_talla_producto,
                cantidad: itemData.cantidad,
                precio_unitario: producto.precio
            });

            if (!result.success) {
                return {
                    success: false,
                    message: 'Error agregando producto al carrito'
                };
            }

            // Obtener carrito actualizado
            const carritoActualizado = await this.getCarrito(id_cliente);

            return {
                success: true,
                message: 'Producto agregado al carrito',
                data: carritoActualizado.data
            };
        } catch (error) {
            throw new Error(`Error agregando item: ${error.message}`);
        }
    }

    // ============================================
    // ACTUALIZAR CARRITO
    // ============================================

    /**
     * Actualizar cantidad de un item
     */
    async updateItemQuantity(id_cliente, id_detalle, nuevaCantidad) {
        try {
            // Validar cantidad
            if (nuevaCantidad < 1 || nuevaCantidad > 10) {
                return {
                    success: false,
                    message: 'Cantidad debe estar entre 1 y 10'
                };
            }

            // Verificar que el item pertenece al cliente
            const carrito = await this.carritoModel.getCarritoWithItems(id_cliente);
            const item = carrito.items.find(i => i.id_detalle === id_detalle);

            if (!item) {
                return {
                    success: false,
                    message: 'Item no encontrado en el carrito'
                };
            }

            // Verificar stock disponible
            const stockCheck = await this.productoModel.checkStock(
                item.id_producto,
                item.talla,
                nuevaCantidad
            );

            if (!stockCheck.available) {
                return {
                    success: false,
                    message: `Stock insuficiente. Solo hay ${stockCheck.stock} unidades disponibles`
                };
            }

            // Actualizar cantidad
            await this.carritoModel.updateItemQuantity(id_detalle, nuevaCantidad);

            // Obtener carrito actualizado
            const carritoActualizado = await this.getCarrito(id_cliente);

            return {
                success: true,
                message: 'Cantidad actualizada',
                data: carritoActualizado.data
            };
        } catch (error) {
            throw new Error(`Error actualizando cantidad: ${error.message}`);
        }
    }

    /**
     * Eliminar item del carrito
     */
    async removeItem(id_cliente, id_detalle) {
        try {
            // Verificar que el item pertenece al cliente
            const carrito = await this.carritoModel.getCarritoWithItems(id_cliente);
            const item = carrito.items.find(i => i.id_detalle === id_detalle);

            if (!item) {
                return {
                    success: false,
                    message: 'Item no encontrado en el carrito'
                };
            }

            // Eliminar item
            await this.carritoModel.removeItem(id_detalle);

            // Obtener carrito actualizado
            const carritoActualizado = await this.getCarrito(id_cliente);

            return {
                success: true,
                message: 'Producto eliminado del carrito',
                data: carritoActualizado.data
            };
        } catch (error) {
            throw new Error(`Error eliminando item: ${error.message}`);
        }
    }

    /**
     * Vaciar carrito completo
     */
    async clearCarrito(id_cliente) {
        try {
            const carrito = await this.carritoModel.getOrCreateCarrito(id_cliente);
            await this.carritoModel.clearCarrito(carrito.id_carrito);

            return {
                success: true,
                message: 'Carrito vaciado',
                data: {
                    carrito_vacio: true,
                    items: [],
                    totales: this.getEmptyCartTotals()
                }
            };
        } catch (error) {
            throw new Error(`Error vaciando carrito: ${error.message}`);
        }
    }

    // ============================================
    // CHECKOUT - CONVERSIÓN A PEDIDO
    // ============================================

    /**
     * Procesar checkout - Convertir carrito a pedido
     */
    async processCheckout(id_cliente, checkoutData) {
        try {
            // Validar datos de checkout
            const validation = this.validateCheckoutData(checkoutData);
            if (!validation.valid) {
                return {
                    success: false,
                    message: validation.message
                };
            }

            // Obtener carrito con items
            const carrito = await this.carritoModel.getCarritoWithItems(id_cliente);

            if (!carrito || carrito.total_items === 0) {
                return {
                    success: false,
                    message: 'El carrito está vacío'
                };
            }

            // Validar stock de todos los items
            const stockValidation = await this.carritoModel.validateStock(carrito.id_carrito);
            if (!stockValidation.valid) {
                return {
                    success: false,
                    message: 'Algunos productos no tienen stock suficiente',
                    items_sin_stock: stockValidation.unavailableItems
                };
            }

            // Calcular totales
            const totales = await this.calculateDetailedTotals(
                carrito.id_carrito,
                checkoutData.departamento || 'Lima'
            );

            // Crear pedido desde carrito
            const pedidoResult = await this.pedidoModel.createFromCarrito(
                {
                    id_cliente,
                    id_direccion_envio: checkoutData.id_direccion_envio,
                    subtotal: totales.subtotal,
                    igv: totales.igv,
                    costo_envio: totales.costo_envio,
                    total: totales.total,
                    metodo_pago: checkoutData.metodo_pago,
                    notas: checkoutData.notas || null
                },
                carrito.items
            );

            if (!pedidoResult.success) {
                return {
                    success: false,
                    message: pedidoResult.message || 'Error creando el pedido'
                };
            }

            // Registrar pago
            if (checkoutData.pagar_ahora) {
                await this.pagoModel.registrarPago({
                    id_pedido: pedidoResult.id_pedido,
                    monto: totales.total,
                    metodo_pago: checkoutData.metodo_pago,
                    estado_pago: 'completado',
                    referencia_transaccion: await this.pagoModel.generateReferencia(checkoutData.metodo_pago)
                });
            }

            // Vaciar carrito
            await this.carritoModel.clearCarrito(carrito.id_carrito);
            await this.carritoModel.convertToPedido(carrito.id_carrito);

            return {
                success: true,
                message: 'Pedido creado exitosamente',
                data: {
                    id_pedido: pedidoResult.id_pedido,
                    numero_pedido: pedidoResult.numero_pedido,
                    total: totales.total,
                    redirect_url: `/confirmacion.html?pedido=${pedidoResult.numero_pedido}`
                }
            };
        } catch (error) {
            throw new Error(`Error procesando checkout: ${error.message}`);
        }
    }

    // ============================================
    // CÁLCULOS Y TOTALES
    // ============================================

    /**
     * Calcular totales detallados con IGV y envío
     */
    async calculateDetailedTotals(id_carrito, departamento = 'Lima') {
        try {
            const totales = await this.carritoModel.calculateTotals(
                id_carrito,
                IGV,
                this.getCostoEnvio(departamento)
            );

            return {
                ...totales,
                subtotal_formateado: this.formatPrice(totales.subtotal),
                igv_formateado: this.formatPrice(totales.igv),
                costo_envio_formateado: this.formatPrice(totales.costo_envio),
                total_formateado: this.formatPrice(totales.total),
                igv_porcentaje: (IGV * 100).toFixed(0) + '%',
                departamento
            };
        } catch (error) {
            throw new Error(`Error calculando totales: ${error.message}`);
        }
    }

    /**
     * Obtener costo de envío según departamento
     */
    getCostoEnvio(departamento) {
        const departamentosLima = ['Lima', 'Callao'];
        return departamentosLima.includes(departamento) 
            ? COSTO_ENVIO_LIMA 
            : COSTO_ENVIO_PROVINCIAS;
    }

    /**
     * Obtener totales de carrito vacío
     */
    getEmptyCartTotals() {
        return {
            subtotal: 0,
            igv: 0,
            costo_envio: 0,
            total: 0,
            total_items: 0,
            total_productos: 0,
            subtotal_formateado: 'S/ 0.00',
            igv_formateado: 'S/ 0.00',
            costo_envio_formateado: 'S/ 0.00',
            total_formateado: 'S/ 0.00'
        };
    }

    // ============================================
    // VALIDACIONES
    // ============================================

    /**
     * Validar item del carrito
     */
    validateCartItem(itemData) {
        if (!itemData.id_producto) {
            return { valid: false, message: 'ID de producto requerido' };
        }

        if (!itemData.talla) {
            return { valid: false, message: 'Talla requerida' };
        }

        if (!itemData.cantidad || itemData.cantidad < 1) {
            return { valid: false, message: 'Cantidad debe ser mayor a 0' };
        }

        if (itemData.cantidad > 10) {
            return { valid: false, message: 'Cantidad máxima: 10 unidades' };
        }

        return { valid: true };
    }

    /**
     * Validar datos de checkout
     */
    validateCheckoutData(data) {
        if (!data.id_direccion_envio) {
            return { valid: false, message: 'Dirección de envío requerida' };
        }

        if (!data.metodo_pago) {
            return { valid: false, message: 'Método de pago requerido' };
        }

        const metodosValidos = ['tarjeta', 'yape', 'plin', 'pagoefectivo', 'transferencia'];
        if (!metodosValidos.includes(data.metodo_pago.toLowerCase())) {
            return { valid: false, message: 'Método de pago inválido' };
        }

        return { valid: true };
    }

    // ============================================
    // UTILIDADES
    // ============================================

    /**
     * Enriquecer item del carrito con información adicional
     */
    enrichCartItem(item) {
        return {
            ...item,
            subtotal_formateado: this.formatPrice(item.subtotal),
            precio_unitario_formateado: this.formatPrice(item.precio_unitario),
            stock_disponible: item.stock,
            stock_suficiente: item.stock >= item.cantidad,
            puede_aumentar: item.cantidad < Math.min(item.stock, 10)
        };
    }

    /**
     * Formatear precio
     */
    formatPrice(precio) {
        return `S/ ${parseFloat(precio).toFixed(2)}`;
    }

    /**
     * Obtener resumen rápido del carrito (para header/badge)
     */
    async getQuickSummary(id_cliente) {
        try {
            const summary = await this.carritoModel.getSummary(id_cliente);

            return {
                success: true,
                data: {
                    total_items: summary.total_items || 0,
                    total_productos: summary.total_productos || 0,
                    empty: summary.empty
                }
            };
        } catch (error) {
            throw new Error(`Error obteniendo resumen: ${error.message}`);
        }
    }

    /**
     * Verificar si hay items con stock bajo
     */
    async checkLowStock(id_carrito) {
        try {
            const items = await this.carritoModel.getCarritoItems(id_carrito);
            
            const itemsStockBajo = items.filter(item => 
                item.stock > 0 && item.stock <= 5 && item.stock >= item.cantidad
            );

            return {
                tiene_stock_bajo: itemsStockBajo.length > 0,
                items: itemsStockBajo.map(item => ({
                    nombre: item.nombre_producto,
                    talla: item.talla,
                    stock: item.stock,
                    mensaje: `¡Solo quedan ${item.stock} unidades!`
                }))
            };
        } catch (error) {
            throw new Error(`Error verificando stock bajo: ${error.message}`);
        }
    }
}

// Exportar instancia única (Singleton pattern)
module.exports = new CarritoService();
