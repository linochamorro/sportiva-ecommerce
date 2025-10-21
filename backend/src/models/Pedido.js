// ============================================
// PEDIDO MODEL - DAO Pattern
// ============================================
const BaseModel = require('./BaseModel');

class Pedido extends BaseModel {
    constructor() {
        super('PEDIDO');
    }

    // ============================================
    // CREAR PEDIDO
    // ============================================

    /**
     * Crear pedido desde carrito
     */
    async createFromCarrito(pedidoData, carritoItems) {
        try {
            return await this.executeInTransaction(async (connection) => {
                // 1. Generar número de pedido único
                const numeroPedido = await this.generateNumeroPedido(connection);

                // 2. Crear pedido principal
                const pedidoInsert = `
                    INSERT INTO PEDIDO 
                    (id_cliente, id_direccion_envio, numero_pedido, fecha_pedido, estado, 
                      subtotal, igv, costo_envio, total, metodo_pago, notas)
                    VALUES (?, ?, ?, NOW(), 'pendiente', ?, ?, ?, ?, ?, ?)
                `;

                const [pedidoResult] = await connection.execute(pedidoInsert, [
                    pedidoData.id_cliente,
                    pedidoData.id_direccion_envio,
                    numeroPedido,
                    pedidoData.subtotal,
                    pedidoData.igv,
                    pedidoData.costo_envio,
                    pedidoData.total,
                    pedidoData.metodo_pago,
                    pedidoData.notas || null
                ]);

                const id_pedido = pedidoResult.insertId;

                // 3. Crear detalles del pedido desde items del carrito
                for (const item of carritoItems) {
                    const detalleInsert = `
                        INSERT INTO DETALLE_PEDIDO 
                        (id_pedido, id_producto, id_talla_producto, cantidad, precio_unitario, subtotal)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `;

                    await connection.execute(detalleInsert, [
                        id_pedido,
                        item.id_producto,
                        item.id_talla_producto,
                        item.cantidad,
                        item.precio_unitario,
                        item.subtotal
                    ]);

                    // 4. Actualizar stock
                    const stockUpdate = `
                        UPDATE TALLA_PRODUCTO
                        SET stock = stock - ?
                        WHERE id_talla_producto = ? AND stock >= ?
                    `;

                    const [stockResult] = await connection.execute(stockUpdate, [
                        item.cantidad,
                        item.id_talla_producto,
                        item.cantidad
                    ]);

                    if (stockResult.affectedRows === 0) {
                        throw new Error(`Stock insuficiente para el producto ${item.nombre_producto}`);
                    }
                }

                return {
                    success: true,
                    id_pedido,
                    numero_pedido,
                    message: 'Pedido creado exitosamente'
                };
            });
        } catch (error) {
            throw new Error(`Error creando pedido: ${error.message}`);
        }
    }

    /**
     * Generar número de pedido único
     */
    async generateNumeroPedido(connection = null) {
        try {
            const dbConn = connection || this.db;
            const prefix = 'SP'; // Sportiva Pedido
            const date = new Date();
            const year = date.getFullYear().toString().slice(-2);
            const month = String(date.getMonth() + 1).padStart(2, '0');
            
            // Obtener último número del mes
            const query = `
                SELECT numero_pedido 
                FROM PEDIDO 
                WHERE numero_pedido LIKE ?
                ORDER BY id_pedido DESC 
                LIMIT 1
            `;

            const pattern = `${prefix}${year}${month}%`;
            const [rows] = await dbConn.execute(query, [pattern]);

            let sequence = 1;
            if (rows.length > 0) {
                const lastNumber = rows[0].numero_pedido;
                const lastSequence = parseInt(lastNumber.slice(-4));
                sequence = lastSequence + 1;
            }

            const sequenceStr = String(sequence).padStart(4, '0');
            return `${prefix}${year}${month}${sequenceStr}`;
        } catch (error) {
            throw new Error(`Error generando número de pedido: ${error.message}`);
        }
    }

    // ============================================
    // CONSULTAR PEDIDOS
    // ============================================

    /**
     * Obtener pedido por ID con detalles completos
     */
    async findByIdWithDetails(id_pedido) {
        try {
            const query = `
                SELECT 
                    p.id_pedido,
                    p.id_cliente,
                    p.numero_pedido,
                    p.fecha_pedido,
                    p.estado,
                    p.subtotal,
                    p.igv,
                    p.costo_envio,
                    p.total,
                    p.metodo_pago,
                    p.notas,
                    c.nombre as cliente_nombre,
                    c.apellido as cliente_apellido,
                    c.email as cliente_email,
                    c.telefono as cliente_telefono,
                    d.direccion,
                    d.ciudad,
                    d.departamento,
                    d.codigo_postal,
                    d.referencia
                FROM PEDIDO p
                INNER JOIN CLIENTE c ON p.id_cliente = c.id_cliente
                LEFT JOIN DIRECCION_ENVIO d ON p.id_direccion_envio = d.id_direccion
                WHERE p.id_pedido = ?
            `;

            const [rows] = await this.db.execute(query, [id_pedido]);
            
            if (rows.length === 0) {
                return null;
            }

            const pedido = rows[0];

            // Obtener detalles del pedido
            pedido.items = await this.getPedidoItems(id_pedido);

            // Obtener historial de pagos
            pedido.pagos = await this.getPagos(id_pedido);

            return pedido;
        } catch (error) {
            throw new Error(`Error obteniendo pedido por ID: ${error.message}`);
        }
    }

    /**
     * Obtener items del pedido
     */
    async getPedidoItems(id_pedido) {
        try {
            const query = `
                SELECT 
                    dp.id_detalle,
                    dp.id_producto,
                    dp.cantidad,
                    dp.precio_unitario,
                    dp.subtotal,
                    p.nombre_producto,
                    p.marca,
                    tp.talla,
                    (SELECT url_imagen FROM IMAGEN_PRODUCTO 
                      WHERE id_producto = p.id_producto AND es_principal = 1 
                      LIMIT 1) as imagen
                FROM DETALLE_PEDIDO dp
                INNER JOIN PRODUCTO p ON dp.id_producto = p.id_producto
                INNER JOIN TALLA_PRODUCTO tp ON dp.id_talla_producto = tp.id_talla_producto
                WHERE dp.id_pedido = ?
                ORDER BY dp.id_detalle
            `;

            const [rows] = await this.db.execute(query, [id_pedido]);
            return rows;
        } catch (error) {
            throw new Error(`Error obteniendo items del pedido: ${error.message}`);
        }
    }

    /**
     * Obtener pedidos del cliente
     */
    async findByCliente(id_cliente, filters = {}) {
        try {
            let query = `
                SELECT 
                    p.id_pedido,
                    p.numero_pedido,
                    p.fecha_pedido,
                    p.estado,
                    p.total,
                    p.metodo_pago,
                    COUNT(dp.id_detalle) as total_items,
                    SUM(dp.cantidad) as total_productos
                FROM PEDIDO p
                LEFT JOIN DETALLE_PEDIDO dp ON p.id_pedido = dp.id_pedido
                WHERE p.id_cliente = ?
            `;

            const params = [id_cliente];

            // Filtro por estado
            if (filters.estado) {
                query += ` AND p.estado = ?`;
                params.push(filters.estado);
            }

            // Filtro por rango de fechas
            if (filters.fecha_desde) {
                query += ` AND p.fecha_pedido >= ?`;
                params.push(filters.fecha_desde);
            }

            if (filters.fecha_hasta) {
                query += ` AND p.fecha_pedido <= ?`;
                params.push(filters.fecha_hasta);
            }

            query += ` GROUP BY p.id_pedido ORDER BY p.fecha_pedido DESC`;

            // Paginación
            if (filters.limit) {
                query += ` LIMIT ? OFFSET ?`;
                params.push(
                    parseInt(filters.limit),
                    parseInt(filters.offset || 0)
                );
            }

            const [rows] = await this.db.execute(query, params);
            return rows;
        } catch (error) {
            throw new Error(`Error obteniendo pedidos del cliente: ${error.message}`);
        }
    }

    /**
     * Buscar pedido por número
     */
    async findByNumeroPedido(numero_pedido) {
        try {
            const query = `
                SELECT * FROM PEDIDO
                WHERE numero_pedido = ?
            `;

            const [rows] = await this.db.execute(query, [numero_pedido]);
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Error buscando pedido por número: ${error.message}`);
        }
    }

    // ============================================
    // ACTUALIZAR ESTADO
    // ============================================

    /**
     * Actualizar estado del pedido
     */
    async updateEstado(id_pedido, nuevoEstado) {
        try {
            const estadosValidos = [
                'pendiente', 
                'confirmado', 
                'procesando', 
                'enviado', 
                'entregado', 
                'cancelado'
            ];

            if (!estadosValidos.includes(nuevoEstado)) {
                throw new Error(`Estado inválido: ${nuevoEstado}`);
            }

            const query = `
                UPDATE PEDIDO
                SET estado = ?,
                    fecha_actualizacion = NOW()
                WHERE id_pedido = ?
            `;

            const [result] = await this.db.execute(query, [nuevoEstado, id_pedido]);

            return {
                success: result.affectedRows > 0,
                message: `Pedido actualizado a estado: ${nuevoEstado}`
            };
        } catch (error) {
            throw new Error(`Error actualizando estado: ${error.message}`);
        }
    }

    /**
     * Cancelar pedido
     */
    async cancelPedido(id_pedido, motivo = null) {
        try {
            return await this.executeInTransaction(async (connection) => {
                // 1. Actualizar estado del pedido
                const updateQuery = `
                    UPDATE PEDIDO
                    SET estado = 'cancelado',
                        notas = CONCAT(COALESCE(notas, ''), '\nMotivo cancelación: ', ?),
                        fecha_actualizacion = NOW()
                    WHERE id_pedido = ? AND estado NOT IN ('enviado', 'entregado', 'cancelado')
                `;

                const [updateResult] = await connection.execute(updateQuery, [
                    motivo || 'Sin motivo especificado',
                    id_pedido
                ]);

                if (updateResult.affectedRows === 0) {
                    throw new Error('El pedido no puede ser cancelado en su estado actual');
                }

                // 2. Devolver stock
                const itemsQuery = `
                    SELECT id_talla_producto, cantidad
                    FROM DETALLE_PEDIDO
                    WHERE id_pedido = ?
                `;

                const [items] = await connection.execute(itemsQuery, [id_pedido]);

                for (const item of items) {
                    const stockQuery = `
                        UPDATE TALLA_PRODUCTO
                        SET stock = stock + ?
                        WHERE id_talla_producto = ?
                    `;

                    await connection.execute(stockQuery, [
                        item.cantidad,
                        item.id_talla_producto
                    ]);
                }

                return {
                    success: true,
                    message: 'Pedido cancelado y stock restaurado'
                };
            });
        } catch (error) {
            throw new Error(`Error cancelando pedido: ${error.message}`);
        }
    }

    // ============================================
    // PAGOS
    // ============================================

    /**
     * Registrar pago
     */
    async registrarPago(pagoData) {
        try {
            const query = `
                INSERT INTO PAGO 
                (id_pedido, monto, metodo_pago, estado_pago, referencia_transaccion, fecha_pago)
                VALUES (?, ?, ?, ?, ?, NOW())
            `;

            const [result] = await this.db.execute(query, [
                pagoData.id_pedido,
                pagoData.monto,
                pagoData.metodo_pago,
                pagoData.estado_pago || 'completado',
                pagoData.referencia_transaccion || null
            ]);

            // Si el pago es exitoso, actualizar estado del pedido
            if (pagoData.estado_pago === 'completado') {
                await this.updateEstado(pagoData.id_pedido, 'confirmado');
            }

            return {
                success: true,
                id_pago: result.insertId,
                message: 'Pago registrado exitosamente'
            };
        } catch (error) {
            throw new Error(`Error registrando pago: ${error.message}`);
        }
    }

    /**
     * Obtener pagos del pedido
     */
    async getPagos(id_pedido) {
        try {
            const query = `
                SELECT 
                    id_pago,
                    monto,
                    metodo_pago,
                    estado_pago,
                    referencia_transaccion,
                    fecha_pago
                FROM PAGO
                WHERE id_pedido = ?
                ORDER BY fecha_pago DESC
            `;

            const [rows] = await this.db.execute(query, [id_pedido]);
            return rows;
        } catch (error) {
            throw new Error(`Error obteniendo pagos: ${error.message}`);
        }
    }

    // ============================================
    // ESTADÍSTICAS Y REPORTES
    // ============================================

    /**
     * Obtener estadísticas generales
     */
    async getStats(filters = {}) {
        try {
            let query = `
                SELECT 
                    COUNT(*) as total_pedidos,
                    COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pedidos_pendientes,
                    COUNT(CASE WHEN estado = 'confirmado' THEN 1 END) as pedidos_confirmados,
                    COUNT(CASE WHEN estado = 'procesando' THEN 1 END) as pedidos_procesando,
                    COUNT(CASE WHEN estado = 'enviado' THEN 1 END) as pedidos_enviados,
                    COUNT(CASE WHEN estado = 'entregado' THEN 1 END) as pedidos_entregados,
                    COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as pedidos_cancelados,
                    COALESCE(SUM(total), 0) as ventas_totales,
                    COALESCE(AVG(total), 0) as ticket_promedio
                FROM PEDIDO
                WHERE 1=1
            `;

            const params = [];

            if (filters.fecha_desde) {
                query += ` AND fecha_pedido >= ?`;
                params.push(filters.fecha_desde);
            }

            if (filters.fecha_hasta) {
                query += ` AND fecha_pedido <= ?`;
                params.push(filters.fecha_hasta);
            }

            const [rows] = await this.db.execute(query, params);
            return rows[0];
        } catch (error) {
            throw new Error(`Error obteniendo estadísticas: ${error.message}`);
        }
    }

    /**
     * Obtener productos más vendidos
     */
    async getTopProducts(limit = 10) {
        try {
            const query = `
                SELECT 
                    p.id_producto,
                    p.nombre_producto,
                    p.marca,
                    COUNT(dp.id_detalle) as veces_comprado,
                    SUM(dp.cantidad) as total_vendido,
                    SUM(dp.subtotal) as ingresos_generados
                FROM DETALLE_PEDIDO dp
                INNER JOIN PRODUCTO p ON dp.id_producto = p.id_producto
                INNER JOIN PEDIDO ped ON dp.id_pedido = ped.id_pedido
                WHERE ped.estado NOT IN ('cancelado')
                GROUP BY p.id_producto
                ORDER BY total_vendido DESC
                LIMIT ?
            `;

            const [rows] = await this.db.execute(query, [limit]);
            return rows;
        } catch (error) {
            throw new Error(`Error obteniendo productos más vendidos: ${error.message}`);
        }
    }
}

module.exports = Pedido;
