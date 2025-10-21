// ============================================
// CARRITO MODEL - DAO Pattern
// ============================================
const BaseModel = require('./BaseModel');

class Carrito extends BaseModel {
    constructor() {
        super('CARRITO');
    }

    // ============================================
    // CARRITO - Gestión básica
    // ============================================

    /**
     * Obtener o crear carrito del cliente
     */
    async getOrCreateCarrito(id_cliente) {
        try {
            // Buscar carrito activo
            let carrito = await this.findOne({
                id_cliente,
                estado: 'activo'
            });

            // Si no existe, crear uno nuevo
            if (!carrito) {
                const result = await this.create({
                    id_cliente,
                    fecha_creacion: new Date(),
                    estado: 'activo'
                });

                carrito = await this.findById(result.id);
            }

            return carrito;
        } catch (error) {
            throw new Error(`Error obteniendo o creando carrito: ${error.message}`);
        }
    }

    /**
     * Obtener carrito completo con items
     */
    async getCarritoWithItems(id_cliente) {
        try {
            const query = `
                SELECT 
                    c.id_carrito,
                    c.id_cliente,
                    c.fecha_creacion,
                    c.estado,
                    COUNT(dc.id_detalle) as total_items,
                    COALESCE(SUM(dc.cantidad), 0) as total_productos,
                    COALESCE(SUM(dc.subtotal), 0) as subtotal
                FROM CARRITO c
                LEFT JOIN DETALLE_CARRITO dc ON c.id_carrito = dc.id_carrito
                WHERE c.id_cliente = ? AND c.estado = 'activo'
                GROUP BY c.id_carrito
            `;

            const [rows] = await this.db.execute(query, [id_cliente]);
            
            if (rows.length === 0) {
                return null;
            }

            const carrito = rows[0];

            // Obtener items del carrito
            carrito.items = await this.getCarritoItems(carrito.id_carrito);

            return carrito;
        } catch (error) {
            throw new Error(`Error obteniendo carrito con items: ${error.message}`);
        }
    }

    /**
     * Obtener items del carrito
     */
    async getCarritoItems(id_carrito) {
        try {
            const query = `
                SELECT 
                    dc.id_detalle,
                    dc.id_carrito,
                    dc.id_producto,
                    dc.id_talla_producto,
                    dc.cantidad,
                    dc.precio_unitario,
                    dc.subtotal,
                    p.nombre_producto,
                    p.marca,
                    tp.talla,
                    tp.stock,
                    (SELECT url_imagen FROM IMAGEN_PRODUCTO 
                      WHERE id_producto = p.id_producto AND es_principal = 1 
                      LIMIT 1) as imagen
                FROM DETALLE_CARRITO dc
                INNER JOIN PRODUCTO p ON dc.id_producto = p.id_producto
                INNER JOIN TALLA_PRODUCTO tp ON dc.id_talla_producto = tp.id_talla_producto
                WHERE dc.id_carrito = ?
                ORDER BY dc.id_detalle DESC
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

    /**
     * Agregar producto al carrito
     */
    async addItem(id_carrito, itemData) {
        try {
            // Verificar si el item ya existe
            const existingItem = await this.findCarritoItem(
                id_carrito, 
                itemData.id_producto, 
                itemData.id_talla_producto
            );

            if (existingItem) {
                // Actualizar cantidad si ya existe
                return await this.updateItemQuantity(
                    existingItem.id_detalle,
                    existingItem.cantidad + itemData.cantidad
                );
            }

            // Agregar nuevo item
            const subtotal = itemData.precio_unitario * itemData.cantidad;

            const query = `
                INSERT INTO DETALLE_CARRITO 
                (id_carrito, id_producto, id_talla_producto, cantidad, precio_unitario, subtotal)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            const [result] = await this.db.execute(query, [
                id_carrito,
                itemData.id_producto,
                itemData.id_talla_producto,
                itemData.cantidad,
                itemData.precio_unitario,
                subtotal
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

    /**
     * Buscar item específico en el carrito
     */
    async findCarritoItem(id_carrito, id_producto, id_talla_producto) {
        try {
            const query = `
                SELECT *
                FROM DETALLE_CARRITO
                WHERE id_carrito = ? 
                AND id_producto = ? 
                AND id_talla_producto = ?
            `;

            const [rows] = await this.db.execute(query, [
                id_carrito, 
                id_producto, 
                id_talla_producto
            ]);

            return rows[0] || null;
        } catch (error) {
            throw new Error(`Error buscando item en carrito: ${error.message}`);
        }
    }

    /**
     * Actualizar cantidad de un item
     */
    async updateItemQuantity(id_detalle, nuevaCantidad) {
        try {
            const query = `
                UPDATE DETALLE_CARRITO
                SET cantidad = ?,
                    subtotal = precio_unitario * ?
                WHERE id_detalle = ?
            `;

            const [result] = await this.db.execute(query, [
                nuevaCantidad,
                nuevaCantidad,
                id_detalle
            ]);

            return {
                success: result.affectedRows > 0,
                message: 'Cantidad actualizada'
            };
        } catch (error) {
            throw new Error(`Error actualizando cantidad: ${error.message}`);
        }
    }

    /**
     * Eliminar item del carrito
     */
    async removeItem(id_detalle) {
        try {
            const query = `
                DELETE FROM DETALLE_CARRITO
                WHERE id_detalle = ?
            `;

            const [result] = await this.db.execute(query, [id_detalle]);

            return {
                success: result.affectedRows > 0,
                message: 'Producto eliminado del carrito'
            };
        } catch (error) {
            throw new Error(`Error eliminando item del carrito: ${error.message}`);
        }
    }

    /**
     * Vaciar carrito completo
     */
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

    /**
     * Validar disponibilidad de stock para items del carrito
     */
    async validateStock(id_carrito) {
        try {
            const query = `
                SELECT 
                    dc.id_detalle,
                    dc.id_producto,
                    dc.cantidad as cantidad_solicitada,
                    tp.stock as stock_disponible,
                    tp.talla,
                    p.nombre_producto
                FROM DETALLE_CARRITO dc
                INNER JOIN TALLA_PRODUCTO tp ON dc.id_talla_producto = tp.id_talla_producto
                INNER JOIN PRODUCTO p ON dc.id_producto = p.id_producto
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

    /**
     * Calcular totales del carrito
     */
    async calculateTotals(id_carrito, igv = 0.18, costoEnvio = 15.00) {
        try {
            const query = `
                SELECT 
                    COALESCE(SUM(subtotal), 0) as subtotal,
                    COUNT(*) as total_items,
                    COALESCE(SUM(cantidad), 0) as total_productos
                FROM DETALLE_CARRITO
                WHERE id_carrito = ?
            `;

            const [rows] = await this.db.execute(query, [id_carrito]);
            const { subtotal, total_items, total_productos } = rows[0];

            const igvMonto = subtotal * igv;
            const total = subtotal + igvMonto + costoEnvio;

            return {
                subtotal: parseFloat(subtotal.toFixed(2)),
                igv: parseFloat(igvMonto.toFixed(2)),
                costoEnvio: parseFloat(costoEnvio.toFixed(2)),
                total: parseFloat(total.toFixed(2)),
                total_items: parseInt(total_items),
                total_productos: parseInt(total_productos)
            };
        } catch (error) {
            throw new Error(`Error calculando totales: ${error.message}`);
        }
    }

    /**
     * Verificar si el carrito pertenece al cliente
     */
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

    /**
     * Convertir carrito a pedido (cambiar estado)
     */
    async convertToPedido(id_carrito) {
        try {
            const query = `
                UPDATE CARRITO
                SET estado = 'convertido'
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

    /**
     * Obtener resumen del carrito
     */
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

    /**
     * Limpiar carritos antiguos abandonados (más de 30 días)
     */
    async cleanAbandonedCarritos() {
        try {
            const query = `
                DELETE FROM CARRITO
                WHERE estado = 'activo'
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
