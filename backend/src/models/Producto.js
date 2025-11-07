// ============================================
// PRODUCTO MODEL - DAO Pattern
// ============================================
const BaseModel = require('./BaseModel');

class Producto extends BaseModel {
    constructor() {
        super('PRODUCTO');
    }

    // ============================================
    // PRODUCTOS - Métodos específicos
    // ============================================

    /**
     * Obtener todos los productos con información completa
     * Incluye: categoría, imágenes, tallas disponibles
     */
    async findAllWithDetails(filters = {}) {
        try {
            let query = `
                SELECT 
                    p.id_producto,
                    p.nombre_producto,
                    p.descripcion,
                    p.precio,
                    p.marca,
                    p.sku,
                    p.peso,
                    p.dimensiones,
                    p.tiene_tallas,
                    p.estado_producto,
                    p.destacado,
                    p.nuevo,
                    p.descuento_porcentaje,
                    p.id_categoria,
                    c.nombre_categoria,
                    c.descripcion as descripcion_categoria,
                    p.fecha_creacion,
                    (SELECT COUNT(*) FROM RESENA r WHERE r.id_producto = p.id_producto) as total_resenas,
                    (SELECT AVG(r.calificacion) FROM RESENA r WHERE r.id_producto = p.id_producto) as calificacion_promedio,
                    COALESCE(
                        (SELECT url_imagen FROM IMAGEN_PRODUCTO 
                          WHERE id_producto = p.id_producto AND es_principal = 1 
                          LIMIT 1),
                        (SELECT url_imagen FROM IMAGEN_PRODUCTO 
                          WHERE id_producto = p.id_producto 
                          ORDER BY orden_imagen ASC 
                          LIMIT 1)
                    ) as imagen_principal
                FROM PRODUCTO p
                INNER JOIN CATEGORIA c ON p.id_categoria = c.id_categoria
                WHERE p.estado_producto = 'Activo'
            `;

            const params = [];

    // Filtros opcionales
            if (filters.id_categoria) {
                query += ` AND p.id_categoria = ?`;
                params.push(filters.id_categoria);
            }

            if (filters.marca) {
                query += ` AND p.marca = ?`;
                params.push(filters.marca);
            }

            if (filters.precio_min) {
                query += ` AND p.precio >= ?`;
                params.push(filters.precio_min);
            }

            if (filters.precio_max) {
                query += ` AND p.precio <= ?`;
                params.push(filters.precio_max);
            }

            if (filters.search) {
                query += ` AND (p.nombre_producto LIKE ? OR p.descripcion LIKE ?)`;
                params.push(`%${filters.search}%`, `%${filters.search}%`);
            }

            if (filters.destacado) {
                query += ` AND p.destacado = 1`;
            }

            if (filters.nuevo) {
                query += ` AND p.nuevo = 1`;
            }

            // Filtro para excluir producto específico (productos relacionados)
            if (filters.excluir) {
                query += ` AND p.id_producto != ?`;
                params.push(parseInt(filters.excluir));
            }

            // Ordenamiento
            const orderBy = filters.orderBy || 'p.fecha_creacion';
            const orderDir = filters.orderDir || 'DESC';
            query += ` ORDER BY ${orderBy} ${orderDir}`;

            // Paginación
            if (filters.limit) {
                query += ` LIMIT ? OFFSET ?`;
                params.push(
                    parseInt(filters.limit),
                    parseInt(filters.offset || 0)
                );
            }

            const [rows] = await this.db.execute(query, params);
            
            // Obtener tallas con stock para cada producto
            if (rows.length > 0) {
                const productosIds = rows.map(p => p.id_producto);
                
                // Crear placeholders dinámicos para el IN clause
                const placeholders = productosIds.map(() => '?').join(',');
                
                const tallasQuery = `
                    SELECT 
                        id_talla,
                        id_producto,
                        talla,
                        stock_talla,
                        medidas
                    FROM TALLA_PRODUCTO
                    WHERE id_producto IN (${placeholders})
                    ORDER BY 
                        id_producto,
                        CASE talla
                            WHEN 'XS' THEN 1
                            WHEN 'S' THEN 2
                            WHEN 'M' THEN 3
                            WHEN 'L' THEN 4
                            WHEN 'XL' THEN 5
                            WHEN 'XXL' THEN 6
                            ELSE 7
                        END
                `;
                
                const [tallas] = await this.db.execute(tallasQuery, productosIds);
                
                // Mapear tallas a cada producto
                rows.forEach(producto => {
                    producto.tallas = tallas.filter(t => t.id_producto === producto.id_producto);
                });
            }
            
            return rows;
        } catch (error) {
            throw new Error(`Error obteniendo productos con detalles: ${error.message}`);
        }
    }

    /**
     * Obtener producto por ID con toda la información
     */
    async findByIdWithDetails(id_producto) {
        try {
            const query = `
                SELECT 
                    p.id_producto,
                    p.nombre_producto,
                    p.descripcion,
                    p.precio,
                    p.marca,
                    p.sku,
                    p.peso,
                    p.dimensiones,
                    p.tiene_tallas,
                    p.estado_producto,
                    p.destacado,
                    p.nuevo,
                    p.descuento_porcentaje,
                    p.id_categoria,
                    c.nombre_categoria,
                    c.descripcion as descripcion_categoria,
                    p.fecha_creacion,
                    (SELECT COUNT(*) FROM RESENA r WHERE r.id_producto = p.id_producto) as total_resenas,
                    (SELECT AVG(r.calificacion) FROM RESENA r WHERE r.id_producto = p.id_producto) as calificacion_promedio,
                    COALESCE(
                        (SELECT url_imagen FROM IMAGEN_PRODUCTO 
                          WHERE id_producto = p.id_producto AND es_principal = 1 
                          LIMIT 1),
                        (SELECT url_imagen FROM IMAGEN_PRODUCTO 
                          WHERE id_producto = p.id_producto 
                          ORDER BY orden_imagen ASC 
                          LIMIT 1)
                    ) as imagen_principal
                FROM PRODUCTO p
                INNER JOIN CATEGORIA c ON p.id_categoria = c.id_categoria
                WHERE p.id_producto = ? AND p.estado_producto = 'Activo'
            `;

            const [rows] = await this.db.execute(query, [id_producto]);
            
            if (rows.length === 0) {
                return null;
            }

            const producto = rows[0];

            // Obtener imágenes del producto
            producto.imagenes = await this.getImagesByProductId(id_producto);

            // Obtener TODAS las tallas (incluyendo 'UNICA') para este producto
            // Se ignora el flag 'tiene_tallas' y se confía en TALLA_PRODUCTO como fuente de verdad
            const tallasQuery = `
                SELECT 
                    id_talla,
                    id_producto,
                    talla,
                    stock_talla,
                    medidas
                FROM TALLA_PRODUCTO
                WHERE id_producto = ?
                ORDER BY 
                    CASE talla
                        WHEN 'XS' THEN 1
                        WHEN 'S' THEN 2
                        WHEN 'M' THEN 3
                        WHEN 'L' THEN 4
                        WHEN 'XL' THEN 5
                        WHEN 'XXL' THEN 6
                        ELSE 7
                    END
            `;
            
            const [tallas] = await this.db.execute(tallasQuery, [id_producto]);
            producto.tallas = tallas;
            return producto;

        } catch (error) {
            throw new Error(`Error obteniendo producto por ID: ${error.message}`);
        }
    }

    /**
     * Obtener imágenes de un producto
     */
    async getImagesByProductId(id_producto) {
        try {
            const query = `
                SELECT 
                    id_imagen,
                    url_imagen,
                    es_principal,
                    orden_imagen
                FROM IMAGEN_PRODUCTO
                WHERE id_producto = ?
                ORDER BY es_principal DESC, orden_imagen ASC
            `;

            const [rows] = await this.db.execute(query, [id_producto]);
            return rows;
        } catch (error) {
            throw new Error(`Error obteniendo imágenes del producto: ${error.message}`);
        }
    }

    /**
     * Obtener tallas disponibles con stock
     */
    async getTallasByProductId(id_producto) {
        try {
            const query = `
                SELECT 
                    id_talla,
                    talla,
                    stock_talla,
                    medidas
                FROM TALLA_PRODUCTO
                WHERE id_producto = ? AND stock_talla > 0
                ORDER BY 
                    CASE talla
                        WHEN 'XS' THEN 1
                        WHEN 'S' THEN 2
                        WHEN 'M' THEN 3
                        WHEN 'L' THEN 4
                        WHEN 'XL' THEN 5
                        WHEN 'XXL' THEN 6
                        ELSE 7
                    END
            `;

            const [rows] = await this.db.execute(query, [id_producto]);
            return rows;
        } catch (error) {
            throw new Error(`Error obteniendo tallas del producto: ${error.message}`);
        }
    }

    /**
     * Verificar stock de una talla específica
     */
    async checkStock(id_producto, talla, cantidad = 1) {
        try {
            const query = `
                SELECT 
                    id_talla,
                    stock_talla
                FROM TALLA_PRODUCTO
                WHERE id_producto = ? AND talla = ?
            `;

            const [rows] = await this.db.execute(query, [id_producto, talla]);
            
            if (rows.length === 0) {
                return { available: false, stock: 0 };
            }

            const stockDisponible = rows[0].stock_talla;
            return {
                available: stockDisponible >= cantidad,
                stock: stockDisponible,
                id_talla: rows[0].id_talla
            };
        } catch (error) {
            throw new Error(`Error verificando stock: ${error.message}`);
        }
    }

    /**
     * Actualizar stock de una talla
     */
    async updateStock(id_talla, cantidad, operation = 'subtract') {
        try {
            const operator = operation === 'subtract' ? '-' : '+';
            const query = `
                UPDATE TALLA_PRODUCTO
                SET stock_talla = stock_talla ${operator} ?
                WHERE id_talla = ? AND stock_talla >= ?
            `;

            const minStock = operation === 'subtract' ? cantidad : 0;
            const [result] = await this.db.execute(query, [cantidad, id_talla, minStock]);

            return {
                success: result.affectedRows > 0,
                affectedRows: result.affectedRows
            };
        } catch (error) {
            throw new Error(`Error actualizando stock: ${error.message}`);
        }
    }

    /**
     * Obtener productos relacionados (misma categoría)
     */
    async getRelatedProducts(id_producto, id_categoria, limit = 4) {
        try {
            const query = `
                SELECT 
                    p.id_producto,
                    p.nombre_producto,
                    p.precio,
                    p.descuento_porcentaje,
                    COALESCE(
                        (SELECT url_imagen FROM IMAGEN_PRODUCTO 
                          WHERE id_producto = p.id_producto AND es_principal = 1 
                          LIMIT 1),
                        (SELECT url_imagen FROM IMAGEN_PRODUCTO 
                          WHERE id_producto = p.id_producto 
                          ORDER BY orden_imagen ASC 
                          LIMIT 1)
                    ) as imagen_principal
                FROM PRODUCTO p
                WHERE p.id_categoria = ? 
                AND p.id_producto != ? 
                AND p.estado_producto = 'Activo'
                ORDER BY RAND()
                LIMIT ?
            `;

            const [rows] = await this.db.execute(query, [id_categoria, id_producto, limit]);
            return rows;
        } catch (error) {
            throw new Error(`Error obteniendo productos relacionados: ${error.message}`);
        }
    }

    /**
     * Obtener productos destacados
     */
    async getFeaturedProducts(limit = 8) {
        try {
            const query = `
                SELECT 
                    p.id_producto,
                    p.nombre_producto,
                    p.precio,
                    p.marca,
                    p.destacado,
                    p.nuevo,
                    p.descuento_porcentaje,
                    c.nombre_categoria,
                    COALESCE(
                        (SELECT url_imagen FROM IMAGEN_PRODUCTO 
                          WHERE id_producto = p.id_producto AND es_principal = 1 
                          LIMIT 1),
                        (SELECT url_imagen FROM IMAGEN_PRODUCTO 
                          WHERE id_producto = p.id_producto 
                          ORDER BY orden_imagen ASC 
                          LIMIT 1)
                    ) as imagen_principal,
                    (SELECT AVG(r.calificacion) FROM RESENA r 
                      WHERE r.id_producto = p.id_producto) as calificacion_promedio
                FROM PRODUCTO p
                INNER JOIN CATEGORIA c ON p.id_categoria = c.id_categoria
                WHERE p.estado_producto = 'Activo'
                AND (p.destacado = 1 OR p.nuevo = 1)
                ORDER BY p.destacado DESC, p.fecha_creacion DESC
                LIMIT ?
            `;

            const [rows] = await this.db.execute(query, [limit]);
            return rows;
        } catch (error) {
            throw new Error(`Error obteniendo productos destacados: ${error.message}`);
        }
    }

    /**
     * Buscar productos
     */
    async search(searchTerm, limit = 20) {
        try {
            const query = `
                SELECT 
                    p.id_producto,
                    p.nombre_producto,
                    p.precio,
                    p.marca,
                    p.descuento_porcentaje,
                    c.nombre_categoria,
                    COALESCE(
                        (SELECT url_imagen FROM IMAGEN_PRODUCTO 
                          WHERE id_producto = p.id_producto AND es_principal = 1 
                          LIMIT 1),
                        (SELECT url_imagen FROM IMAGEN_PRODUCTO 
                          WHERE id_producto = p.id_producto 
                          ORDER BY orden_imagen ASC 
                          LIMIT 1)
                    ) as imagen_principal
                FROM PRODUCTO p
                INNER JOIN CATEGORIA c ON p.id_categoria = c.id_categoria
                WHERE p.estado_producto = 'Activo'
                AND (
                    p.nombre_producto LIKE ? OR
                    p.descripcion LIKE ? OR
                    p.marca LIKE ? OR
                    c.nombre_categoria LIKE ?
                )
                ORDER BY 
                    CASE 
                        WHEN p.nombre_producto LIKE ? THEN 1
                        WHEN p.marca LIKE ? THEN 2
                        ELSE 3
                    END,
                    p.nombre_producto
                LIMIT ?
            `;

            const searchPattern = `%${searchTerm}%`;
            const exactPattern = `${searchTerm}%`;

            const [rows] = await this.db.execute(query, [
                searchPattern, searchPattern, searchPattern, searchPattern,
                exactPattern, exactPattern,
                limit
            ]);

            return rows;
        } catch (error) {
            throw new Error(`Error buscando productos: ${error.message}`);
        }
    }

    /**
     * Obtener estadísticas de productos
     */
    async getStats() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_productos,
                    COUNT(CASE WHEN estado_producto = 'Activo' THEN 1 END) as productos_activos,
                    COUNT(CASE WHEN destacado = 1 THEN 1 END) as productos_destacados,
                    COUNT(CASE WHEN nuevo = 1 THEN 1 END) as productos_nuevos,
                    COUNT(DISTINCT id_categoria) as total_categorias,
                    COUNT(DISTINCT marca) as total_marcas,
                    AVG(precio) as precio_promedio,
                    MIN(precio) as precio_minimo,
                    MAX(precio) as precio_maximo
                FROM PRODUCTO
            `;

            const [rows] = await this.db.execute(query);
            return rows[0];
        } catch (error) {
            throw new Error(`Error obteniendo estadísticas: ${error.message}`);
        }
    }

    /**
     * Contar productos activos (para paginación)
     */
    async countActive(filters = {}) {
        try {
            let query = `
                SELECT COUNT(*) as total
                FROM PRODUCTO p
                WHERE p.estado_producto = 'Activo'
            `;

            const params = [];

            if (filters.id_categoria) {
                query += ` AND p.id_categoria = ?`;
                params.push(filters.id_categoria);
            }

            if (filters.marca) {
                query += ` AND p.marca = ?`;
                params.push(filters.marca);
            }

            if (filters.precio_min) {
                query += ` AND p.precio >= ?`;
                params.push(filters.precio_min);
            }

            if (filters.precio_max) {
                query += ` AND p.precio <= ?`;
                params.push(filters.precio_max);
            }

            if (filters.search) {
                query += ` AND (p.nombre_producto LIKE ? OR p.descripcion LIKE ?)`;
                params.push(`%${filters.search}%`, `%${filters.search}%`);
            }

            const [rows] = await this.db.execute(query, params);
            return rows[0].total;
        } catch (error) {
            throw new Error(`Error contando productos activos: ${error.message}`);
        }
    }

    /**
     * Obtener reseñas de un producto
     */
    async getResenas(id_producto) {
        try {
            const query = `
                SELECT 
                    r.id_resena,
                    r.calificacion,
                    r.comentario,
                    r.fecha_resena,
                    r.id_cliente,
                    CONCAT(COALESCE(c.nombre, 'Usuario'), ' ', COALESCE(c.apellido, 'Anónimo')) as nombre_cliente
                FROM RESENA r
                LEFT JOIN CLIENTE c ON r.id_cliente = c.id_cliente
                WHERE r.id_producto = ?
                ORDER BY r.fecha_resena DESC
            `;

            const [rows] = await this.db.execute(query, [id_producto]);
            return rows;
        } catch (error) {
            throw new Error(`Error obteniendo reseñas: ${error.message}`);
        }
    }
}

module.exports = Producto;
