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
                // Generar número de pedido único
                const numeroPedido = await this.generateNumeroPedido(connection);

                // Crear pedido principal
                const pedidoInsert = `
                    INSERT INTO PEDIDO 
                    (id_cliente, id_direccion, numero_pedido, fecha_pedido, estado_pedido, 
                      subtotal, descuento, codigo_cupon, impuestos, costo_envio, total_pedido, observaciones)
                    VALUES (?, ?, ?, NOW(), 'Pendiente', ?, ?, ?, ?, ?, ?, ?)
                `;

                const [pedidoResult] = await connection.execute(pedidoInsert, [
                    pedidoData.id_cliente,
                    pedidoData.id_direccion_envio,
                    numeroPedido,
                    pedidoData.subtotal,
                    pedidoData.descuento || 0.00,
                    pedidoData.codigo_cupon || null,
                    pedidoData.igv,
                    pedidoData.costo_envio,
                    pedidoData.total,
                    pedidoData.notas || null
                ]);

                const id_pedido = pedidoResult.insertId;

                // Crear detalles del pedido
                for (const item of carritoItems) {
                    const detalleInsert = `
                        INSERT INTO DETALLE_PEDIDO 
                        (id_pedido, id_talla, cantidad, precio_unitario, subtotal)
                        VALUES (?, ?, ?, ?, ?)
                    `;

                    await connection.execute(detalleInsert, [
                        id_pedido,
                        item.id_talla_producto,
                        item.cantidad,
                        item.precio_unitario,
                        item.subtotal
                    ]);

                    // Actualizar stock
                    const stockUpdate = `
                        UPDATE TALLA_PRODUCTO
                        SET stock_talla = stock_talla - ?
                        WHERE id_talla = ? AND stock_talla >= ?
                    `;

                    const [stockResult] = await connection.execute(stockUpdate, [
                        item.cantidad,
                        item.id_talla_producto,
                        item.cantidad
                    ]);

                    if (stockResult.affectedRows === 0) {
                        throw new Error(`Stock insuficiente para el producto (Talla ID: ${item.id_talla_producto})`);
                    }
                }

                return {
                    success: true,
                    id_pedido,
                    numero_pedido: numeroPedido,
                    message: 'Pedido creado exitosamente'
                };
            });
        } catch (error) {
            console.error("SQL Error en createFromCarrito:", error.message);
            throw new Error(`Error creando pedido: ${error.message}`);
        }
    }

    /**
     * Generar número de pedido único
     */
    async generateNumeroPedido(connection = null) {
        try {
            const dbConn = connection || this.db;
            const prefix = 'SPT';
            const date = new Date();
            const year = date.getFullYear().toString().slice(-2);
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            // Obtener último número del día
            const query = `
                SELECT numero_pedido 
                FROM PEDIDO 
                WHERE numero_pedido LIKE ?
                ORDER BY id_pedido DESC 
                LIMIT 1
            `;

            const pattern = `${prefix}${year}${month}${day}%`;
            const [rows] = await dbConn.execute(query, [pattern]);

            let sequence = 1;
            if (rows.length > 0) {
                const lastNumber = rows[0].numero_pedido;
                const lastSequence = parseInt(lastNumber.slice(-5));
                sequence = lastSequence + 1;
            }

            const sequenceStr = String(sequence).padStart(5, '0');
            return `${prefix}${year}${month}${day}${sequenceStr}`;
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
                    p.estado_pedido as estado,
                    p.subtotal,
                    p.impuestos as igv,
                    p.costo_envio,
                    p.total_pedido,
                    p.observaciones as notas,
                    c.nombre as cliente_nombre,
                    c.apellido as cliente_apellido,
                    c.email as cliente_email,
                    c.telefono as cliente_telefono,
                    d.direccion_linea1 as direccion,
                    d.distrito as ciudad,
                    d.provincia as departamento,
                    d.codigo_postal,
                    d.referencia
                FROM PEDIDO p
                INNER JOIN CLIENTE c ON p.id_cliente = c.id_cliente
                LEFT JOIN DIRECCION_ENVIO d ON p.id_direccion = d.id_direccion
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
                    dp.id_detalle_pedido as id_detalle,
                    tp.id_producto,
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
                INNER JOIN TALLA_PRODUCTO tp ON dp.id_talla = tp.id_talla
                INNER JOIN PRODUCTO p ON tp.id_producto = p.id_producto
                WHERE dp.id_pedido = ?
                ORDER BY dp.id_detalle_pedido
            `;

            const [rows] = await this.db.execute(query, [id_pedido]);
            return rows;
        } catch (error) {
            throw new Error(`Error obteniendo items del pedido: ${error.message}`);
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
                    id_pedido,
                    monto_pago as monto,
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
            throw new Error(`Error obteniendo pagos del pedido: ${error.message}`);
        }
    }

    // ============================================
    // MÉTODOS ADMIN - LISTADO Y CONSULTAS
    // ============================================

    /**
     * Obtener todos los pedidos con filtros (Admin)
     */
    async findAllWithFilters(filtros = {}, limit = 20, offset = 0) {
        try {
            let query = `
                SELECT 
                    p.id_pedido,
                    p.numero_pedido,
                    p.fecha_pedido,
                    p.estado_pedido,
                    p.total_pedido,
                    p.metodo_pago,
                    p.id_cliente,
                    CONCAT(c.nombre, ' ', c.apellido) as cliente_nombre,
                    c.email as cliente_email,
                    c.telefono as cliente_telefono
                FROM PEDIDO p
                INNER JOIN CLIENTE c ON p.id_cliente = c.id_cliente
                WHERE 1=1
            `;

            const params = [];

            // Aplicar filtros
            if (filtros.estado_pedido) {
                query += ` AND p.estado_pedido = ?`;
                params.push(filtros.estado_pedido);
            }

            if (filtros.fecha_desde) {
                query += ` AND DATE(p.fecha_pedido) >= ?`;
                params.push(filtros.fecha_desde);
            }

            if (filtros.fecha_hasta) {
                query += ` AND DATE(p.fecha_pedido) <= ?`;
                params.push(filtros.fecha_hasta);
            }

            if (filtros.busqueda) {
                query += ` AND (
                    p.numero_pedido LIKE ? OR
                    CONCAT(c.nombre, ' ', c.apellido) LIKE ? OR
                    c.email LIKE ?
                )`;
                const searchTerm = `%${filtros.busqueda}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            // Ordenamiento
            const ordenarPor = filtros.ordenar_por || 'fecha_pedido';
            const orden = filtros.orden === 'asc' ? 'ASC' : 'DESC';
            query += ` ORDER BY p.${ordenarPor} ${orden}`;

            // Paginación
            query += ` LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const [rows] = await this.db.execute(query, params);
            return rows;
        } catch (error) {
            throw new Error(`Error obteniendo pedidos con filtros: ${error.message}`);
        }
    }

    /**
     * Contar pedidos con filtros (Admin)
     */
    async countWithFilters(filtros = {}) {
        try {
            let query = `
                SELECT COUNT(*) as total
                FROM PEDIDO p
                INNER JOIN CLIENTE c ON p.id_cliente = c.id_cliente
                WHERE 1=1
            `;

            const params = [];

            if (filtros.estado_pedido) {
                query += ` AND p.estado_pedido = ?`;
                params.push(filtros.estado_pedido);
            }

            if (filtros.fecha_desde) {
                query += ` AND DATE(p.fecha_pedido) >= ?`;
                params.push(filtros.fecha_desde);
            }

            if (filtros.fecha_hasta) {
                query += ` AND DATE(p.fecha_pedido) <= ?`;
                params.push(filtros.fecha_hasta);
            }

            if (filtros.busqueda) {
                query += ` AND (
                    p.numero_pedido LIKE ? OR
                    CONCAT(c.nombre, ' ', c.apellido) LIKE ? OR
                    c.email LIKE ?
                )`;
                const searchTerm = `%${filtros.busqueda}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            const [rows] = await this.db.execute(query, params);
            return rows[0].total;
        } catch (error) {
            throw new Error(`Error contando pedidos: ${error.message}`);
        }
    }

    /**
     * Obtener pedidos del cliente con filtros
     */
    async findByCliente(id_cliente, filters = {}) {
        try {
            if (!id_cliente) {
                throw new Error("El ID del cliente es requerido.");
            }

            let query = `
                SELECT 
                    p.id_pedido,
                    p.numero_pedido,
                    p.fecha_pedido,
                    p.estado_pedido as estado,
                    p.total_pedido as total,
                    (SELECT metodo_pago FROM PAGO WHERE id_pedido = p.id_pedido LIMIT 1) as metodo_pago,
                    COUNT(dp.id_detalle_pedido) as total_items
                FROM PEDIDO p
                LEFT JOIN DETALLE_PEDIDO dp ON p.id_pedido = dp.id_pedido
                WHERE p.id_cliente = ?
            `;

            const params = [id_cliente];

            if (filters.estado) {
                query += ` AND p.estado_pedido = ?`; 
                params.push(filters.estado);
            }

            if (filters.fechaInicio && filters.fechaInicio !== 'undefined') {
                query += ` AND p.fecha_pedido >= ?`;
                params.push(filters.fechaInicio);
            }

            if (filters.fechaFin && filters.fechaFin !== 'undefined') {
                query += ` AND p.fecha_pedido <= ?`;
                params.push(filters.fechaFin);
            }

            query += `
                GROUP BY p.id_pedido, p.numero_pedido, p.fecha_pedido, p.estado_pedido, p.total_pedido
                ORDER BY p.fecha_pedido DESC
            `;

            const limit = parseInt(filters.limit) || 10;
            const offset = parseInt(filters.offset) || 0;
            
            query += ` LIMIT ${limit} OFFSET ${offset}`;

            const [rows] = await this.db.execute(query, params);
            return rows;

        } catch (error) {
            console.error("Error SQL en findByCliente:", error); 
            throw new Error(`Error obteniendo pedidos del cliente: ${error.message}`);
        }
    }

    /**
     * Contar pedidos de un cliente
     */
    async countByCliente(id_cliente, filters = {}) {
        try {
            let query = `SELECT COUNT(*) as total FROM PEDIDO WHERE id_cliente = ?`;
            const params = [id_cliente];

            if (filters.estado) {
                query += ` AND estado_pedido = ?`;
                params.push(filters.estado);
            }
            
            // Filtros de fecha
            if (filters.fechaInicio) {
                query += ` AND fecha_pedido >= ?`;
                params.push(filters.fechaInicio);
            }
            if (filters.fechaFin) {
                query += ` AND fecha_pedido <= ?`;
                params.push(filters.fechaFin);
            }

            const [rows] = await this.db.execute(query, params);
            return rows[0].total;
        } catch (error) {
            throw new Error(`Error contando pedidos del cliente: ${error.message}`);
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
                'Pendiente', 
                'Procesando', 
                'Enviado', 
                'Entregado', 
                'Cancelado'
            ];

            if (!estadosValidos.includes(nuevoEstado)) {
                throw new Error(`Estado inválido para la base de datos: ${nuevoEstado}`);
            }

            const query = `
                UPDATE PEDIDO
                SET estado_pedido = ?
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
     * Actualizar dirección de envío de un pedido (Admin)
     */
    async updateDireccionEnvio(id_pedido, nuevaDireccion) {
        try {
            const pedidoQuery = `
                SELECT id_direccion 
                FROM PEDIDO 
                WHERE id_pedido = ?
            `;
            
            const [pedidoRows] = await this.db.execute(pedidoQuery, [id_pedido]);
            
            if (pedidoRows.length === 0) {
                throw new Error('Pedido no encontrado');
            }

            const id_direccion = pedidoRows[0].id_direccion;

            if (!id_direccion) {
                throw new Error('El pedido no tiene dirección de envío asignada');
            }

            // Normalizar datos
            const direccion_linea1 = nuevaDireccion.direccion_linea1 || '';
            const direccion_linea2 = nuevaDireccion.direccion_linea2 || '';
            const distrito = nuevaDireccion.distrito || '';
            const provincia = nuevaDireccion.provincia || '';
            const departamento = nuevaDireccion.departamento || '';
            const codigo_postal = nuevaDireccion.codigo_postal || '';
            const referencia = nuevaDireccion.referencia || '';

            // Validar campos requeridos
            if (!direccion_linea1) {
                throw new Error('La dirección línea 1 es requerida');
            }
            if (!distrito) {
                throw new Error('El distrito es requerido');
            }

            // Actualizar la dirección
            const updateQuery = `
                UPDATE DIRECCION_ENVIO
                SET 
                    direccion_linea1 = ?,
                    direccion_linea2 = ?,
                    distrito = ?,
                    provincia = ?,
                    codigo_postal = ?,
                    referencia = ?
                WHERE id_direccion = ?
            `;

            const [result] = await this.db.execute(updateQuery, [
                direccion_linea1,
                direccion_linea2,
                distrito,
                provincia,
                codigo_postal,
                referencia,
                id_direccion
            ]);

            if (result.affectedRows === 0) {
                throw new Error('No se pudo actualizar la dirección');
            }
            return {
                success: true,
                message: 'Dirección actualizada exitosamente'
            };
        } catch (error) {
            throw new Error(`Error actualizando dirección: ${error.message}`);
        }
    }

    /**
     * Cancelar pedido
     */
    async cancelPedido(id_pedido, motivo = null) {
        try {
            return await this.executeInTransaction(async (connection) => {
                const updateQuery = `
                    UPDATE PEDIDO
                    SET estado_pedido = 'Cancelado',
                        observaciones = CONCAT(COALESCE(observaciones, ''), '\nMotivo cancelación: ', ?)
                    WHERE id_pedido = ? AND estado_pedido NOT IN ('Enviado', 'Entregado', 'Cancelado')
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
                    SELECT id_talla, cantidad
                    FROM DETALLE_PEDIDO
                    WHERE id_pedido = ?
                `;

                const [items] = await connection.execute(itemsQuery, [id_pedido]);

                for (const item of items) {
                    const stockQuery = `
                        UPDATE TALLA_PRODUCTO
                        SET stock_talla = stock_talla + ?
                        WHERE id_talla = ?
                    `;

                    await connection.execute(stockQuery, [
                        item.cantidad,
                        item.id_talla
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

            if (pagoData.estado_pago === 'completado') {
                await this.updateEstado(pagoData.id_pedido, 'Procesando');
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

    // ============================================
    // ESTADÍSTICAS Y REPORTES
    // ============================================

    /**
     * Obtener estadísticas con filtros de fecha
     */
    async getStats(filtros = {}) {
        try {
            const fecha_desde = filtros.fecha_desde || '2024-01-01';
            const fecha_hasta = filtros.fecha_hasta || new Date().toISOString().split('T')[0];
            const statsQuery = `
                SELECT 
                    COUNT(*) as total_pedidos,
                    COALESCE(SUM(CASE WHEN estado_pedido != 'Cancelado' THEN total_pedido ELSE 0 END), 0) as total_ventas,
                    COALESCE(AVG(CASE WHEN estado_pedido != 'Cancelado' THEN total_pedido END), 0) as ticket_promedio
                FROM PEDIDO
                WHERE fecha_pedido BETWEEN ? AND ?
            `;

            const [statsRows] = await this.db.execute(statsQuery, [fecha_desde, fecha_hasta]);
            const stats = statsRows[0];
            const estadosQuery = `
                SELECT 
                    estado_pedido,
                    COUNT(*) as cantidad
                FROM PEDIDO
                WHERE fecha_pedido BETWEEN ? AND ?
                GROUP BY estado_pedido
                ORDER BY cantidad DESC
            `;

            const [estadosRows] = await this.db.execute(estadosQuery, [fecha_desde, fecha_hasta]);
            
            // Convertir array a objeto
            const por_estado = {};
            estadosRows.forEach(row => {
                por_estado[row.estado_pedido] = row.cantidad;
            });

            // 3. VENTAS POR MES
            const ventasPorMesQuery = `
                SELECT 
                    DATE_FORMAT(fecha_pedido, '%Y-%m') as mes,
                    COUNT(*) as pedidos,
                    COALESCE(SUM(CASE WHEN estado_pedido != 'Cancelado' THEN total_pedido ELSE 0 END), 0) as total
                FROM PEDIDO
                WHERE fecha_pedido BETWEEN ? AND ?
                GROUP BY DATE_FORMAT(fecha_pedido, '%Y-%m')
                ORDER BY mes ASC
            `;

            const [ventasMesRows] = await this.db.execute(ventasPorMesQuery, [fecha_desde, fecha_hasta]);

            // Formatear ventas por mes
            const ventas_por_mes = ventasMesRows.map(row => ({
                mes: row.mes,
                pedidos: row.pedidos,
                total: parseFloat(row.total).toFixed(2)
            }));

            return {
                total_pedidos: stats.total_pedidos,
                ventas_totales: parseFloat(stats.total_ventas).toFixed(2),
                ticket_promedio: parseFloat(stats.ticket_promedio).toFixed(2),
                por_estado,
                ventas_por_mes,
                periodo: {
                    desde: fecha_desde,
                    hasta: fecha_hasta
                }
            };

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

    // ============================================
    // DASHBOARD ADMIN
    // ============================================

    /**
     * Obtener pedidos recientes para dashboard
     */
    async getPedidosRecientes(limit = 10) {
        try {
            const query = `
                SELECT 
                    p.id_pedido,
                    p.numero_pedido,
                    p.fecha_pedido,
                    p.estado_pedido,
                    p.total,
                    p.metodo_pago,
                    CONCAT(c.nombre, ' ', c.apellido) as cliente_nombre,
                    c.email as cliente_email
                FROM PEDIDO p
                INNER JOIN CLIENTE c ON p.id_cliente = c.id_cliente
                ORDER BY p.fecha_pedido DESC
                LIMIT ?
            `;

            const [rows] = await this.db.execute(query, [limit]);
            return rows;
        } catch (error) {
            throw new Error(`Error obteniendo pedidos recientes: ${error.message}`);
        }
    }

    /**
     * Obtener resumen de ventas por método de pago
     */
    async getVentasPorMetodoPago(filters = {}) {
        try {
            let query = `
                SELECT 
                    metodo_pago,
                    COUNT(*) as cantidad_pedidos,
                    COALESCE(SUM(total), 0) as total_ventas
                FROM PEDIDO
                WHERE estado_pedido != 'Cancelado'
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

            query += ` GROUP BY metodo_pago ORDER BY total_ventas DESC`;

            const [rows] = await this.db.execute(query, params);
            return rows;
          } catch (error) {
              throw new Error(`Error obteniendo ventas por método de pago: ${error.message}`);
          }
    }

    /**
     * Verificar si el cliente ya usó este cupón
     */
    async haUsadoCupon(id_cliente, codigo_cupon) {
        try {
            const query = `
                SELECT COUNT(*) as total 
                FROM PEDIDO 
                WHERE id_cliente = ? 
                AND codigo_cupon = ? 
                AND estado_pedido != 'Cancelado'
            `;
            
            const [rows] = await this.db.execute(query, [id_cliente, codigo_cupon]);
            return rows[0].total > 0;
        } catch (error) {
            throw new Error(`Error verificando cupón: ${error.message}`);
        }
    }
}

module.exports = Pedido;
