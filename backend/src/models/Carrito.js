// ============================================
// CARRITO MODEL
// ============================================
const BaseModel = require('./BaseModel');

class Carrito extends BaseModel {
    constructor() {
        super('CARRITO');
    }

    // ============================================
    // CARRITO - Gestión básica
    // ============================================

    async getOrCreateCarrito(id_cliente) {
        try {
            let carrito = await this.findOne({
                id_cliente,
                estado_carrito: 'Activo'
            });

            if (!carrito) {
                const result = await this.create({
                    id_cliente,
                    fecha_creacion: new Date(),
                    estado_carrito: 'Activo'
                });

                carrito = await this.findById(result.id);
            }

            return carrito;
        } catch (error) {
            throw new Error(`Error obteniendo o creando carrito: ${error.message}`);
        }
    }

    async getCarritoWithItems(id_cliente) {
        try {
            const query = `
                SELECT 
                    c.id_carrito,
                    c.id_cliente,
                    c.fecha_creacion,
                    c.estado_carrito,
                    COUNT(dc.id_detalle_carrito) as total_items,
                    COALESCE(SUM(dc.cantidad), 0) as total_productos,
                    COALESCE(SUM(p.precio * dc.cantidad), 0) as subtotal
                FROM CARRITO c
                LEFT JOIN DETALLE_CARRITO dc ON c.id_carrito = dc.id_carrito
                LEFT JOIN TALLA_PRODUCTO tp ON dc.id_talla = tp.id_talla
                LEFT JOIN PRODUCTO p ON tp.id_producto = p.id_producto
                WHERE c.id_cliente = ? AND c.estado_carrito = 'Activo'
                GROUP BY c.id_carrito
            `;

            const [rows] = await this.db.execute(query, [id_cliente]);
            
            if (rows.length === 0) {
                return null;
            }

            const carrito = rows[0];
            carrito.items = await this.getCarritoItems(carrito.id_carrito);

            return carrito;
        } catch (error) {
            throw new Error(`Error obteniendo carrito con items: ${error.message}`);
        }
    }

    async getCarritoItems(id_carrito) {
        try {
            const query = `
                SELECT 
                    dc.id_detalle_carrito,
                    dc.id_carrito,
                    dc.id_talla,
                    dc.cantidad,
                    dc.fecha_agregado,
                    p.id_producto,
                    p.nombre_producto,
                    p.marca,
                    p.precio as precio_unitario,
                    (p.precio * dc.cantidad) as subtotal,
                    tp.talla,
                    tp.stock_talla as stock,
                    (SELECT url_imagen FROM IMAGEN_PRODUCTO 
                      WHERE id_producto = p.id_producto AND es_principal = 1 
                      LIMIT 1) as imagen
                FROM DETALLE_CARRITO dc
                INNER JOIN TALLA_PRODUCTO tp ON dc.id_talla = tp.id_talla
                INNER JOIN PRODUCTO p ON tp.id_producto = p.id_producto
                WHERE dc.id_carrito = ?
                ORDER BY dc.fecha_agregado DESC
            `;

            const [rows] = await this.db.execute(query, [id_carrito]);
            return rows;
        } catch (error) {
            throw new Error(`Error obteniendo items del carrito: ${error.message}`);
        }
    }

    // ============================================
    // DETALLE CARRITO - Operaciones CRUD
    // ============================================

    async addItem(id_carrito, itemData) {
        try {
            const existingItem = await this.findCarritoItem(
                id_carrito, 
                itemData.id_talla
            );

            if (existingItem) {
                return await this.updateItemQuantity(
                    existingItem.id_detalle_carrito,
                    existingItem.cantidad + itemData.cantidad
                );
            }

            const query = `
                INSERT INTO DETALLE_CARRITO 
                (id_carrito, id_talla, cantidad)
                VALUES (?, ?, ?)
            `;

            const [result] = await this.db.execute(query, [
                id_carrito,
                itemData.id_talla,
                itemData.cantidad
            ]);

            return {
                success: true,
                id: result.insertId,
                message: 'Producto agregado al carrito'
            };
        } catch (error) {
            throw new Error(`Error agregando item al carrito: ${error.message}`);
        }
    }

    async findCarritoItem(id_carrito, id_talla) {
        try {
            const query = `
                SELECT *
                FROM DETALLE_CARRITO
                WHERE id_carrito = ? 
                AND id_talla = ?
            `;

            const [rows] = await this.db.execute(query, [id_carrito, id_talla]);
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Error buscando item en carrito: ${error.message}`);
        }
    }

    async updateItemQuantity(id_detalle_carrito, nuevaCantidad) {
        try {
            const query = `
                UPDATE DETALLE_CARRITO
                SET cantidad = ?
                WHERE id_detalle_carrito = ?
            `;

            const [result] = await this.db.execute(query, [
                nuevaCantidad,
                id_detalle_carrito
            ]);

            return {
                success: result.affectedRows > 0,
                message: 'Cantidad actualizada'
            };
        } catch (error) {
            throw new Error(`Error actualizando cantidad: ${error.message}`);
        }
    }

    async removeItem(id_detalle_carrito) {
        try {
            const query = `
                DELETE FROM DETALLE_CARRITO
                WHERE id_detalle_carrito = ?
            `;

            const [result] = await this.db.execute(query, [id_detalle_carrito]);

            return {
                success: result.affectedRows > 0,
                message: 'Producto eliminado del carrito'
            };
        } catch (error) {
            throw new Error(`Error eliminando item del carrito: ${error.message}`);
        }
    }

    async clearCarrito(id_carrito) {
        try {
            const query = `
                DELETE FROM DETALLE_CARRITO
                WHERE id_carrito = ?
            `;

            const [result] = await this.db.execute(query, [id_carrito]);

            return {
                success: true,
                deletedItems: result.affectedRows,
                message: 'Carrito vaciado'
            };
        } catch (error) {
            throw new Error(`Error vaciando carrito: ${error.message}`);
        }
    }

    // ============================================
    // VALIDACIONES Y UTILIDADES
    // ============================================

    async validateStock(id_carrito) {
        try {
            const query = `
                SELECT 
                    dc.id_detalle_carrito,
                    dc.id_talla,
                    dc.cantidad as cantidad_solicitada,
                    tp.stock_talla as stock_disponible,
                    tp.talla,
                    p.nombre_producto
                FROM DETALLE_CARRITO dc
                INNER JOIN TALLA_PRODUCTO tp ON dc.id_talla = tp.id_talla
                INNER JOIN PRODUCTO p ON tp.id_producto = p.id_producto
                WHERE dc.id_carrito = ?
            `;

            const [items] = await this.db.execute(query, [id_carrito]);

            const unavailableItems = items.filter(
                item => item.cantidad_solicitada > item.stock_disponible
            );

            return {
                valid: unavailableItems.length === 0,
                unavailableItems: unavailableItems.map(item => ({
                    nombre: item.nombre_producto,
                    talla: item.talla,
                    solicitado: item.cantidad_solicitada,
                    disponible: item.stock_disponible
                }))
            };
        } catch (error) {
            throw new Error(`Error validando stock: ${error.message}`);
        }
    }

    async calculateTotals(id_carrito, igv = 0.18, costoEnvio = 15.00) {
        try {
            const query = `
                SELECT 
                    COALESCE(SUM(p.precio * dc.cantidad), 0) as subtotal,
                    COUNT(*) as total_items,
                    COALESCE(SUM(dc.cantidad), 0) as total_productos
                FROM DETALLE_CARRITO dc
                INNER JOIN TALLA_PRODUCTO tp ON dc.id_talla = tp.id_talla
                INNER JOIN PRODUCTO p ON tp.id_producto = p.id_producto
                WHERE dc.id_carrito = ?
            `;

            const [rows] = await this.db.execute(query, [id_carrito]);
            const { subtotal, total_items, total_productos } = rows[0];

            const subtotalNum = parseFloat(subtotal) || 0;
            const igvMonto = subtotalNum * igv;
            const total = subtotalNum + igvMonto + costoEnvio;

            return {
                subtotal: parseFloat(subtotalNum.toFixed(2)),
                igv: parseFloat(igvMonto.toFixed(2)),
                costoEnvio: parseFloat(costoEnvio.toFixed(2)),
                total: parseFloat(total.toFixed(2)),
                total_items: parseInt(total_items) || 0,
                total_productos: parseInt(total_productos) || 0
            };
        } catch (error) {
            throw new Error(`Error calculando totales: ${error.message}`);
        }
    }

    async verifyOwnership(id_carrito, id_cliente) {
        try {
            const query = `
                SELECT id_carrito
                FROM CARRITO
                WHERE id_carrito = ? AND id_cliente = ?
            `;

            const [rows] = await this.db.execute(query, [id_carrito, id_cliente]);
            return rows.length > 0;
        } catch (error) {
            throw new Error(`Error verificando propiedad del carrito: ${error.message}`);
        }
    }

    async convertToPedido(id_carrito) {
        try {
            const query = `
                UPDATE CARRITO
                SET estado_carrito = 'Convertido'
                WHERE id_carrito = ?
            `;

            const [result] = await this.db.execute(query, [id_carrito]);

            return {
                success: result.affectedRows > 0,
                message: 'Carrito convertido a pedido'
            };
        } catch (error) {
            throw new Error(`Error convirtiendo carrito: ${error.message}`);
        }
    }

    async getSummary(id_cliente) {
        try {
            const carrito = await this.getCarritoWithItems(id_cliente);
            
            if (!carrito) {
                return {
                    empty: true,
                    total_items: 0,
                    total_productos: 0,
                    subtotal: 0
                };
            }

            const totals = await this.calculateTotals(carrito.id_carrito);

            return {
                empty: false,
                id_carrito: carrito.id_carrito,
                items: carrito.items,
                ...totals
            };
        } catch (error) {
            throw new Error(`Error obteniendo resumen del carrito: ${error.message}`);
        }
    }

    async cleanAbandonedCarritos() {
        try {
            const query = `
                DELETE FROM CARRITO
                WHERE estado_carrito = 'Activo'
                AND fecha_creacion < DATE_SUB(NOW(), INTERVAL 30 DAY)
            `;

            const [result] = await this.db.execute(query);

            return {
                success: true,
                deletedCarritos: result.affectedRows
            };
        } catch (error) {
            throw new Error(`Error limpiando carritos abandonados: ${error.message}`);
        }
    }
}

module.exports = Carrito;
