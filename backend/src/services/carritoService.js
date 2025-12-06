// ============================================
// CARRITO SERVICE
// ============================================

const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto');
const Pedido = require('../models/Pedido');
const db = require('../config/database');
const logger = require('../utils/logger');

// EXTRAER CUPONES
const { BUSINESS_CONFIG } = require('../config/constants');
const { IGV, COSTO_ENVIO_LIMA, ENVIO_GRATIS_MINIMO, CUPONES } = BUSINESS_CONFIG;

class CarritoService {
    constructor() {
        this.carritoModel = new Carrito();
        this.productoModel = new Producto();
        this.pedidoModel = new Pedido();
        this.db = db;
    }

    // ============================================
    // AGREGAR AL CARRITO
    // ============================================

    async addItem(id_cliente, itemData) {
        let connection;
        try {
            console.log('📥 addItem recibió:', { id_cliente, itemData });

            // 1. Validar datos
            if (!itemData.id_producto || itemData.id_producto < 1) {
                console.log('❌ Validación falló: ID producto inválido');
                return {
                    success: false,
                    statusCode: 400,
                    message: 'ID de producto inválido.'
                };
            }

            if (!itemData.cantidad || itemData.cantidad < 1 || itemData.cantidad > 99) {
                return {
                    success: false,
                    statusCode: 400,
                    message: 'Cantidad debe ser entre 1 y 99.'
                };
            }

            // 2. Iniciar transacción
            connection = await this.db.getConnection();
            await connection.beginTransaction();
            console.log('✓ Transacción iniciada');

            // 3. Verificar que el producto existe y está activo
            const productoQuery = `SELECT * FROM producto WHERE id_producto = ? AND estado_producto = 'Activo' FOR UPDATE`;
            const [productoRows] = await connection.execute(productoQuery, [itemData.id_producto]);

            if (productoRows.length === 0) {
                await connection.rollback();
                console.log('❌ Producto no encontrado o inactivo');
                return {
                    success: false,
                    statusCode: 404,
                    message: 'Producto no disponible.'
                };
            }

            const producto = productoRows[0];
            console.log('✓ Producto encontrado:', producto.nombre_producto);

            // 4. Determinar id_talla y verificar stock
            let id_talla_final;
            let stock_disponible;

            if (producto.tiene_tallas && itemData.id_talla) {
                const tallaQuery = `SELECT * FROM talla_producto WHERE id_talla = ? AND id_producto = ? FOR UPDATE`;
                const [tallaRows] = await connection.execute(tallaQuery, [itemData.id_talla, itemData.id_producto]);

                if (tallaRows.length === 0) {
                    await connection.rollback();
                    console.log('❌ Talla no encontrada');
                    return {
                        success: false,
                        statusCode: 404,
                        message: 'Talla no encontrada para este producto.'
                    };
                }

                id_talla_final = tallaRows[0].id_talla;
                stock_disponible = tallaRows[0].stock_talla;
                console.log(`✓ Talla encontrada: ${tallaRows[0].talla}, Stock: ${stock_disponible}`);

            } else {
                const tallaUnicaQuery = `SELECT * FROM talla_producto WHERE id_producto = ? AND talla = 'UNICA' FOR UPDATE`;
                const [tallaUnicaRows] = await connection.execute(tallaUnicaQuery, [itemData.id_producto]);

                if (tallaUnicaRows.length === 0) {
                    await connection.rollback();
                    console.log('❌ Talla UNICA no encontrada');
                    return {
                        success: false,
                        statusCode: 500,
                        message: 'Error de configuración de stock.'
                    };
                }

                id_talla_final = tallaUnicaRows[0].id_talla;
                stock_disponible = tallaUnicaRows[0].stock_talla;
                console.log(`✓ Talla UNICA encontrada, Stock: ${stock_disponible}`);
            }

            // 5. Verificar stock suficiente
            if (stock_disponible < itemData.cantidad) {
                await connection.rollback();
                console.log(`❌ Stock insuficiente: Disponible ${stock_disponible}, Solicitado ${itemData.cantidad}`);
                return {
                    success: false,
                    statusCode: 409,
                    message: `Stock insuficiente. Solo quedan ${stock_disponible} unidades disponibles.`
                };
            }

            console.log('✓ Stock suficiente');

            // 6. Obtener o crear carrito
            const carritoQuery = `SELECT id_carrito FROM carrito WHERE id_cliente = ? AND estado_carrito = 'Activo'`;
            let [carritoRows] = await connection.execute(carritoQuery, [id_cliente]);

            let id_carrito;
            if (carritoRows.length === 0) {
                const createCarritoQuery = `INSERT INTO carrito (id_cliente, estado_carrito) VALUES (?, 'Activo')`;
                const [createResult] = await connection.execute(createCarritoQuery, [id_cliente]);
                id_carrito = createResult.insertId;
                console.log(`✓ Carrito creado: ${id_carrito}`);
            } else {
                id_carrito = carritoRows[0].id_carrito;
                console.log(`✓ Carrito existente: ${id_carrito}`);
            }

            // 7. Verificar si el item ya existe en el carrito
            const existingItemQuery = `SELECT * FROM detalle_carrito WHERE id_carrito = ? AND id_talla = ? FOR UPDATE`;
            const [existingItems] = await connection.execute(existingItemQuery, [id_carrito, id_talla_final]);

            if (existingItems.length > 0) {
                const item_existente = existingItems[0];
                const nueva_cantidad = item_existente.cantidad + itemData.cantidad;

                if (nueva_cantidad > stock_disponible) {
                    await connection.rollback();
                    return {
                        success: false,
                        statusCode: 409,
                        message: `No se puede agregar. Solo quedan ${stock_disponible} unidades disponibles y ya tienes ${item_existente.cantidad} en el carrito.`
                    };
                }

                const updateQuery = `UPDATE detalle_carrito SET cantidad = ? WHERE id_detalle_carrito = ?`;
                await connection.execute(updateQuery, [nueva_cantidad, item_existente.id_detalle_carrito]);
                console.log(`✓ Cantidad actualizada a ${nueva_cantidad}`);

            } else {
                const insertQuery = `INSERT INTO detalle_carrito (id_carrito, id_talla, cantidad) VALUES (?, ?, ?)`;
                await connection.execute(insertQuery, [id_carrito, id_talla_final, itemData.cantidad]);
                console.log(`✓ Nuevo item agregado`);
            }

            // 8. Commit transacción
            await connection.commit();
            console.log('✅ Transacción completada exitosamente');

            return {
                success: true,
                statusCode: 201,
                message: 'Producto agregado al carrito',
                data: {
                    id_carrito: id_carrito,
                    mensaje: 'Producto agregado correctamente'
                }
            };

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error('❌ Error en addItem:', error);
            logger.error(`Error agregando item para cliente ${id_cliente}`, error);
            
            return {
                success: false,
                statusCode: 500,
                message: 'Error interno al agregar producto al carrito.',
                error: error.message
            };
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    // ============================================
    // OBTENER CARRITO
    // ============================================

    async getCarrito(id_cliente) {
        try {
            const carrito = await this.carritoModel.getCarritoWithItems(id_cliente);

            if (!carrito || !carrito.items || carrito.items.length === 0) {
                return {
                    success: true,
                    data: {
                        carrito_vacio: true,
                        items: [],
                        totales: this.getEmptyCartTotals()
                    }
                };
            }

            const totales = await this.calculateDetailedTotals(carrito.id_carrito);
            const stockValidation = await this.carritoModel.validateStock(carrito.id_carrito);

            return {
                success: true,
                data: {
                    carrito_vacio: false,
                    id_carrito: carrito.id_carrito,
                    items: carrito.items,
                    totales,
                    stock_validation: stockValidation,
                    puede_procesar: stockValidation.valid
                }
            };
        } catch (error) {
            logger.error(`Error obteniendo carrito para cliente ${id_cliente}`, error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error interno al obtener el carrito.'
            };
        }
    }

    // ============================================
    // ACTUALIZAR CANTIDAD DE ITEM
    // ============================================

    async updateItem(id_cliente, id_detalle, nuevaCantidad) {
        try {
            const [rows] = await this.db.execute('SELECT * FROM detalle_carrito WHERE id_detalle_carrito = ?', [id_detalle]);
            const item = rows[0];

            if (!item) {
                return {
                    success: false,
                    statusCode: 404,
                    message: 'Item no encontrado'
                };
            }

            // Verificar que el carrito pertenece al cliente
            const carritoQuery = `SELECT * FROM carrito WHERE id_carrito = ? AND id_cliente = ?`;
            const [carritoRows] = await this.db.execute(carritoQuery, [item.id_carrito, id_cliente]);
            
            if (carritoRows.length === 0) {
                return {
                    success: false,
                    statusCode: 403,
                    message: 'No autorizado'
                };
            }

            // Verificar stock
            const tallaQuery = `SELECT stock_talla FROM talla_producto WHERE id_talla = ?`;
            const [tallaRows] = await this.db.execute(tallaQuery, [item.id_talla]);
            
            if (tallaRows.length === 0 || tallaRows[0].stock_talla < nuevaCantidad) {
                return {
                    success: false,
                    statusCode: 409,
                    message: 'Stock insuficiente'
                };
            }

            // Actualizar cantidad
            await this.carritoModel.updateItemQuantity(id_detalle, nuevaCantidad);

            return {
                success: true,
                message: 'Cantidad actualizada'
            };

        } catch (error) {
            logger.error(`Error actualizando item ${id_detalle}`, error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error actualizando item'
            };
        }
    }

    // ============================================
    // ELIMINAR ITEM
    // ============================================

    async removeItem(id_cliente, id_detalle) {
        try {
            const [rows] = await this.db.execute('SELECT * FROM detalle_carrito WHERE id_detalle_carrito = ?', [id_detalle]);
            const item = rows[0];

            if (!item) {
                return {
                    success: false,
                    statusCode: 404,
                    message: 'Item no encontrado'
                };
            }

            const carritoQuery = `SELECT * FROM carrito WHERE id_carrito = ? AND id_cliente = ?`;
            const [carritoRows] = await this.db.execute(carritoQuery, [item.id_carrito, id_cliente]);
            
            if (carritoRows.length === 0) {
                return {
                    success: false,
                    statusCode: 403,
                    message: 'No autorizado'
                };
            }

            await this.carritoModel.removeItem(id_detalle);

            return {
                success: true,
                message: 'Producto eliminado'
            };

        } catch (error) {
            logger.error(`Error eliminando item ${id_detalle}`, error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error eliminando item'
            };
        }
    }

    // ============================================
    // VACIAR CARRITO
    // ============================================

    async clearCarrito(id_cliente) {
        try {
            const carrito = await this.carritoModel.getOrCreateCarrito(id_cliente);
            await this.carritoModel.clearCarrito(carrito.id_carrito);

            return {
                success: true,
                message: 'Carrito vaciado'
            };

        } catch (error) {
            logger.error(`Error vaciando carrito para cliente ${id_cliente}`, error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error vaciando carrito'
            };
        }
    }

    // ============================================
    // CALCULAR TOTALES
    // ============================================

    async calculateDetailedTotals(id_carrito) {
        try {
            const totals = await this.carritoModel.calculateTotals(id_carrito);
            let costoEnvioFinal = totals.costoEnvio;
            
            if (totals.subtotal >= ENVIO_GRATIS_MINIMO) {
                costoEnvioFinal = 0;
            }

            const totalFinal = totals.subtotal + totals.igv + costoEnvioFinal;

            return {
                subtotal: totals.subtotal,
                igv: totals.igv,
                costo_envio: costoEnvioFinal,
                total: parseFloat(totalFinal.toFixed(2)),
                total_items: totals.total_items,
                total_productos: totals.total_productos,
                subtotal_formateado: this.formatPrice(totals.subtotal),
                igv_formateado: this.formatPrice(totals.igv),
                costo_envio_formateado: this.formatPrice(costoEnvioFinal),
                total_formateado: this.formatPrice(totalFinal)
            };
        } catch (error) {
            logger.error(`Error calculando totales para carrito ${id_carrito}`, error);
            throw error;
        }
    }

    // ============================================
    // RESUMEN RÁPIDO
    // ============================================

    async getQuickSummary(id_cliente) {
        try {
            const carrito = await this.carritoModel.getCarritoWithItems(id_cliente);
            
            if (!carrito || !carrito.items || carrito.items.length === 0) {
                return {
                    success: true,
                    data: {
                        items: [],
                        total_items: 0,
                        total_productos: 0,
                        subtotal: 0,
                        igv: 0,
                        costoEnvio: 0,
                        total: 0,
                        subtotal_formateado: this.formatPrice(0),
                        empty: true
                    }
                };
            }

            const totals = await this.calculateDetailedTotals(carrito.id_carrito);

            return {
                success: true,
                data: {
                    items: carrito.items,
                    total_items: totals.total_items,
                    total_productos: totals.total_productos,
                    subtotal: totals.subtotal,
                    igv: totals.igv,
                    costoEnvio: totals.costo_envio,
                    total: totals.total,
                    subtotal_formateado: totals.subtotal_formateado,
                    empty: false
                }
            };
        } catch (error) {
            logger.error(`Error obteniendo resumen rápido para cliente ${id_cliente}`, error);
            return {
                success: false,
                message: 'Error al obtener resumen del carrito.'
            };
        }
    }

    // ============================================
    // CUPONES
    // ============================================

    async validarCupon(id_cliente, codigoCupon) {
        try {
            const codigo = codigoCupon.toUpperCase().trim();
            const configCupon = CUPONES[codigo];
            
            // 1. Validar existencia
            if (!configCupon) {
                return { valid: false, message: 'Cupón no válido' };
            }

            // 2. Validar uso único
            if (configCupon.unico) {
                const yaUsado = await this.pedidoModel.haUsadoCupon(id_cliente, codigo);
                if (yaUsado) {
                    return { valid: false, message: 'Este cupón es de uso único y ya lo has utilizado' };
                }
            }

            // 3. Obtener subtotal actual
            const carritoResumen = await this.getQuickSummary(id_cliente);
            if (carritoResumen.data.empty) {
                return { valid: false, message: 'El carrito está vacío' };
            }
            const subtotal = carritoResumen.data.subtotal;

            // 4. Validar monto mínimo
            if (configCupon.minimo && subtotal < configCupon.minimo) {
                return { valid: false, message: `Compra mínima: S/ ${configCupon.minimo.toFixed(2)}` };
            }

            // 5. Calcular descuento
            let descuento = 0;
            if (configCupon.tipo === 'PORCENTAJE') {
                descuento = subtotal * (configCupon.valor / 100);
            } else {
                descuento = configCupon.valor;
            }
            
            return {
                valid: true,
                cupon: {
                    codigo: codigo,
                    descuento: parseFloat(descuento.toFixed(2)),
                    mensaje: `Cupón aplicado: -S/ ${descuento.toFixed(2)}`
                }
            };

        } catch (error) {
            logger.error(`Error validando cupón:`, error);
            return { valid: false, message: 'Error al validar el cupón' };
        }
    }

    // ============================================
    // UTILIDADES
    // ============================================

    getEmptyCartTotals() {
        const zeroPrice = this.formatPrice(0);
        return {
            subtotal: 0,
            igv: 0,
            costo_envio: COSTO_ENVIO_LIMA || 15.00,
            total: 0,
            total_items: 0,
            total_productos: 0,
            subtotal_formateado: zeroPrice,
            igv_formateado: zeroPrice,
            costo_envio_formateado: this.formatPrice(COSTO_ENVIO_LIMA || 15.00),
            total_formateado: zeroPrice
        };
    }

    formatPrice(precio) {
        const num = parseFloat(precio);
        if (isNaN(num)) return 'S/ 0.00';
        return `S/ ${num.toFixed(2)}`;
    }
}

module.exports = new CarritoService();
