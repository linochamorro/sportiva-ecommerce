// ============================================
// PAGO MODEL - DAO Pattern
// ============================================
const BaseModel = require('./BaseModel');

class Pago extends BaseModel {
    constructor() {
        super('PAGO');
    }

    // ============================================
    // PAGOS - Métodos específicos
    // ============================================

    /**
     * Crear nuevo pago
     */
    async createPago(pagoData) {
        try {
            const data = {
                id_pedido: pagoData.id_pedido,
                monto_pago: pagoData.monto,
                metodo_pago: pagoData.metodo_pago,
                estado_pago: pagoData.estado_pago || 'Pendiente',
                referencia_transaccion: pagoData.referencia_transaccion || null
            };

            const query = `
                INSERT INTO pago 
                (id_pedido, monto_pago, metodo_pago, estado_pago, referencia_transaccion, fecha_pago)
                VALUES (?, ?, ?, ?, ?, NOW())
            `;

            const [result] = await this.db.execute(query, [
                data.id_pedido,
                data.monto_pago,
                data.metodo_pago,
                data.estado_pago,
                data.referencia_transaccion
            ]);

            return {
                success: true,
                id: result.insertId
            };
        } catch (error) {
            throw new Error(`Error creando pago: ${error.message}`);
        }
    }

    /**
     * Obtener pagos por pedido
     */
    async findByPedido(id_pedido) {
        try {
            const query = `
                SELECT 
                    id_pago,
                    id_pedido,
                    monto,
                    metodo_pago,
                    estado_pago,
                    referencia_transaccion,
                    fecha_pago
                FROM pago
                WHERE id_pedido = ?
                ORDER BY fecha_pago DESC
            `;

            const [rows] = await this.db.execute(query, [id_pedido]);
            return rows;
        } catch (error) {
            throw new Error(`Error obteniendo pagos del pedido: ${error.message}`);
        }
    }

    /**
     * Buscar pago por referencia de transacción
     */
    async findByReferencia(referencia_transaccion) {
        try {
            const query = `
                SELECT * FROM pago
                WHERE referencia_transaccion = ?
            `;

            const [rows] = await this.db.execute(query, [referencia_transaccion]);
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Error buscando pago por referencia: ${error.message}`);
        }
    }

    /**
     * Actualizar estado del pago
     */
    async updateEstado(id_pago, nuevoEstado) {
        try {
            const estadosValidos = ['pendiente', 'completado', 'rechazado', 'reembolsado'];

            if (!estadosValidos.includes(nuevoEstado)) {
                throw new Error(`Estado de pago inválido: ${nuevoEstado}`);
            }

            const query = `
                UPDATE pago
                SET estado_pago = ?
                WHERE id_pago = ?
            `;

            const [result] = await this.db.execute(query, [nuevoEstado, id_pago]);

            return {
                success: result.affectedRows > 0,
                message: `Estado de pago actualizado a: ${nuevoEstado}`
            };
        } catch (error) {
            throw new Error(`Error actualizando estado de pago: ${error.message}`);
        }
    }

    /**
     * Verificar si un pedido está completamente pagado
     */
    async isPedidoPagado(id_pedido) {
        try {
            const query = `
                SELECT 
                    p.total as total_pedido,
                    COALESCE(SUM(CASE WHEN pg.estado_pago = 'completado' THEN pg.monto ELSE 0 END), 0) as total_pagado
                FROM pedido p
                LEFT JOIN pago pg ON p.id_pedido = pg.id_pedido
                WHERE p.id_pedido = ?
                GROUP BY p.id_pedido
            `;

            const [rows] = await this.db.execute(query, [id_pedido]);

            if (rows.length === 0) {
                return { pagado: false, total_pedido: 0, total_pagado: 0 };
            }

            const { total_pedido, total_pagado } = rows[0];

            return {
                pagado: parseFloat(total_pagado) >= parseFloat(total_pedido),
                total_pedido: parseFloat(total_pedido),
                total_pagado: parseFloat(total_pagado),
                saldo_pendiente: parseFloat(total_pedido) - parseFloat(total_pagado)
            };
        } catch (error) {
            throw new Error(`Error verificando estado de pago del pedido: ${error.message}`);
        }
    }

    /**
     * Obtener resumen de pagos por método
     */
    async getSummaryByMetodo(filters = {}) {
        try {
            let query = `
                SELECT 
                    metodo_pago,
                    COUNT(*) as total_transacciones,
                    SUM(CASE WHEN estado_pago = 'completado' THEN monto ELSE 0 END) as monto_completado,
                    SUM(CASE WHEN estado_pago = 'pendiente' THEN monto ELSE 0 END) as monto_pendiente,
                    SUM(CASE WHEN estado_pago = 'rechazado' THEN monto ELSE 0 END) as monto_rechazado
                FROM pago
                WHERE 1=1
            `;

            const params = [];

            if (filters.fecha_desde) {
                query += ` AND fecha_pago >= ?`;
                params.push(filters.fecha_desde);
            }

            if (filters.fecha_hasta) {
                query += ` AND fecha_pago <= ?`;
                params.push(filters.fecha_hasta);
            }

            query += ` GROUP BY metodo_pago`;

            const [rows] = await this.db.execute(query, params);
            return rows;
        } catch (error) {
            throw new Error(`Error obteniendo resumen de pagos: ${error.message}`);
        }
    }

    /**
     * Obtener pagos completados en un rango de fechas
     */
    async getCompletedPayments(fecha_desde, fecha_hasta) {
        try {
            const query = `
                SELECT 
                    pg.id_pago,
                    pg.id_pedido,
                    pg.monto,
                    pg.metodo_pago,
                    pg.referencia_transaccion,
                    pg.fecha_pago,
                    p.numero_pedido,
                    c.nombre as cliente_nombre,
                    c.apellido as cliente_apellido,
                    c.email as cliente_email
                FROM pago pg
                INNER JOIN pedido p ON pg.id_pedido = p.id_pedido
                INNER JOIN cliente c ON p.id_cliente = c.id_cliente
                WHERE pg.estado_pago = 'completado'
                AND pg.fecha_pago BETWEEN ? AND ?
                ORDER BY pg.fecha_pago DESC
            `;

            const [rows] = await this.db.execute(query, [fecha_desde, fecha_hasta]);
            return rows;
        } catch (error) {
            throw new Error(`Error obteniendo pagos completados: ${error.message}`);
        }
    }

    /**
     * Generar referencia de transacción única
     */
    async generateReferencia(metodo_pago) {
        try {
            const prefix = metodo_pago.substring(0, 3).toUpperCase();
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            
            return `${prefix}${timestamp}${random}`;
        } catch (error) {
            throw new Error(`Error generando referencia: ${error.message}`);
        }
    }

    /**
     * Procesar reembolso
     */
    async processRefund(id_pago, motivo = null) {
        try {
            return await this.executeInTransaction(async (connection) => {
                // Verificar que el pago esté completado
                const checkQuery = `
                    SELECT estado_pago, monto, id_pedido
                    FROM pago
                    WHERE id_pago = ?
                `;

                const [pagoRows] = await connection.execute(checkQuery, [id_pago]);

                if (pagoRows.length === 0) {
                    throw new Error('Pago no encontrado');
                }

                if (pagoRows[0].estado_pago !== 'completado') {
                    throw new Error('Solo se pueden reembolsar pagos completados');
                }

                const updateQuery = `
                    UPDATE pago
                    SET estado_pago = 'reembolsado'
                    WHERE id_pago = ?
                `;

                await connection.execute(updateQuery, [id_pago]);

                return {
                    success: true,
                    monto_reembolsado: pagoRows[0].monto,
                    message: 'Reembolso procesado exitosamente'
                };
            });
        } catch (error) {
            throw new Error(`Error procesando reembolso: ${error.message}`);
        }
    }

    /**
     * Obtener estadísticas de pagos
     */
    async getStats(filters = {}) {
        try {
            let query = `
                SELECT 
                    COUNT(*) as total_pagos,
                    COUNT(CASE WHEN estado_pago = 'completado' THEN 1 END) as pagos_completados,
                    COUNT(CASE WHEN estado_pago = 'pendiente' THEN 1 END) as pagos_pendientes,
                    COUNT(CASE WHEN estado_pago = 'rechazado' THEN 1 END) as pagos_rechazados,
                    COUNT(CASE WHEN estado_pago = 'reembolsado' THEN 1 END) as pagos_reembolsados,
                    COALESCE(SUM(CASE WHEN estado_pago = 'completado' THEN monto ELSE 0 END), 0) as ingresos_totales,
                    COALESCE(AVG(CASE WHEN estado_pago = 'completado' THEN monto END), 0) as ticket_promedio
                FROM pago
                WHERE 1=1
            `;

            const params = [];

            if (filters.fecha_desde) {
                query += ` AND fecha_pago >= ?`;
                params.push(filters.fecha_desde);
            }

            if (filters.fecha_hasta) {
                query += ` AND fecha_pago <= ?`;
                params.push(filters.fecha_hasta);
            }

            const [rows] = await this.db.execute(query, params);
            return rows[0];
        } catch (error) {
            throw new Error(`Error obteniendo estadísticas de pagos: ${error.message}`);
        }
    }

    /**
     * Validar monto del pago contra el pedido
     */
    async validateMonto(id_pedido, monto_pago) {
        try {
            const query = `
                SELECT 
                    total,
                    COALESCE(SUM(pg.monto), 0) as total_pagado
                FROM pedido p
                LEFT JOIN pago pg ON p.id_pedido = pg.id_pedido 
                    AND pg.estado_pago = 'completado'
                WHERE p.id_pedido = ?
                GROUP BY p.id_pedido
            `;

            const [rows] = await this.db.execute(query, [id_pedido]);

            if (rows.length === 0) {
                return { valid: false, message: 'Pedido no encontrado' };
            }

            const { total, total_pagado } = rows[0];
            const saldo_pendiente = parseFloat(total) - parseFloat(total_pagado);

            if (parseFloat(monto_pago) > saldo_pendiente) {
                return {
                    valid: false,
                    message: 'El monto del pago excede el saldo pendiente',
                    saldo_pendiente
                };
            }

            return {
                valid: true,
                saldo_pendiente,
                total_pedido: parseFloat(total),
                total_pagado: parseFloat(total_pagado)
            };
        } catch (error) {
            throw new Error(`Error validando monto: ${error.message}`);
        }
    }
}

module.exports = Pago;
