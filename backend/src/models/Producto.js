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
    async findAllWithDetails(filtros = {}) {
        try {
            const {
                categoria,
                busqueda,
                marca,
                precioMin,
                precioMax,
                destacado,
                nuevo,
                excluir,
                page = 1,
                limit = 12
            } = filtros;

            const numLimit = parseInt(limit) || 12;
            const numPage = parseInt(page) || 1;
            const offset = (numPage - 1) * numLimit;

            let query = `
                SELECT 
                    p.id_producto,
                    p.nombre_producto,
                    p.descripcion,
                    p.precio,
                    p.marca,
                    p.sku,
                    p.tiene_tallas,
                    p.destacado,
                    p.nuevo,
                    p.descuento_porcentaje,
                    p.estado_producto,
                    c.id_categoria,
                    c.nombre_categoria,
                    c.slug,
                    GROUP_CONCAT(DISTINCT CONCAT(tp.id_talla, ':', tp.talla, ':', tp.stock_talla) SEPARATOR '|') as tallas_info,
                    SUM(tp.stock_talla) as stock_total,
                    (SELECT url_imagen 
                    FROM imagen_producto
                    WHERE id_producto = p.id_producto 
                    AND es_principal = TRUE 
                    LIMIT 1) as imagen_principal
                FROM producto p
                LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
                LEFT JOIN talla_producto tp ON p.id_producto = tp.id_producto
                WHERE p.estado_producto = 'Activo'
            `;
            const params = [];

            if (categoria) {
                query += ' AND p.id_categoria = ?';
                params.push(parseInt(categoria));
            }

            if (busqueda) {
                query += ' AND (p.nombre_producto LIKE ? OR p.descripcion LIKE ? OR p.marca LIKE ?)';
                const searchTerm = `%${busqueda}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            if (marca) {
                query += ' AND p.marca = ?';
                params.push(marca);
            }

            if (precioMin) {
                query += ' AND p.precio >= ?';
                params.push(parseFloat(precioMin));
            }

            if (precioMax) {
                query += ' AND p.precio <= ?';
                params.push(parseFloat(precioMax));
            }

            if (destacado !== undefined) {
                query += ' AND p.destacado = ?';
                params.push(destacado === 'true' || destacado === true ? 1 : 0);
            }

            if (nuevo !== undefined) {
                query += ' AND p.nuevo = ?';
                params.push(nuevo === 'true' || nuevo === true ? 1 : 0);
            }

            if (excluir) {
                query += ' AND p.id_producto != ?';
                params.push(parseInt(excluir));
            }

            query += ' GROUP BY p.id_producto, p.nombre_producto, p.descripcion, p.precio, p.marca, p.sku, p.tiene_tallas, p.destacado, p.nuevo, p.descuento_porcentaje, p.estado_producto, p.fecha_creacion, c.id_categoria, c.nombre_categoria, c.slug';
            query += ' ORDER BY p.fecha_creacion DESC';
            query += ` LIMIT ${numLimit} OFFSET ${offset}`;

            const [rows] = params.length > 0 
                ? await this.db.execute(query, params)
                : await this.db.query(query);

            const productos = rows.map(row => {
                const producto = {
                    id_producto: row.id_producto,
                    nombre_producto: row.nombre_producto,
                    descripcion: row.descripcion,
                    precio: parseFloat(row.precio),
                    marca: row.marca,
                    sku: row.sku,
                    tiene_tallas: Boolean(row.tiene_tallas),
                    destacado: Boolean(row.destacado),
                    nuevo: Boolean(row.nuevo),
                    descuento_porcentaje: parseFloat(row.descuento_porcentaje || 0),
                    estado_producto: row.estado_producto,
                    categoria: {
                        id_categoria: row.id_categoria,
                        nombre_categoria: row.nombre_categoria,
                        slug: row.slug
                    },
                    stock_total: parseInt(row.stock_total || 0),
                    imagen_principal: row.imagen_principal || '/assets/images/placeholder.jpg',
                    tallas: []
                };

                if (row.tallas_info) {
                    producto.tallas = row.tallas_info.split('|').map(tallaStr => {
                        const [id_talla, talla, stock_talla] = tallaStr.split(':');
                        return {
                            id_talla: parseInt(id_talla),
                            talla: talla,
                            stock_talla: parseInt(stock_talla)
                        };
                    });
                }

                return producto;
            });

            return productos;
        } catch (error) {
            logger.error('Error en findAllWithDetails:', error);
            throw error;
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
                    (SELECT COUNT(*) FROM resena r WHERE r.id_producto = p.id_producto) as total_resenas,
                    (SELECT AVG(r.calificacion) FROM resena r WHERE r.id_producto = p.id_producto) as calificacion_promedio,
                    COALESCE(
                        (SELECT url_imagen FROM imagen_producto 
                          WHERE id_producto = p.id_producto AND es_principal = 1 
                          LIMIT 1),
                        (SELECT url_imagen FROM imagen_producto 
                          WHERE id_producto = p.id_producto 
                          ORDER BY orden_imagen ASC 
                          LIMIT 1)
                    ) as imagen_principal
                FROM producto p
                INNER JOIN categoria c ON p.id_categoria = c.id_categoria
                WHERE p.id_producto = ? AND p.estado_producto = 'Activo'
            `;

            const [rows] = await this.db.execute(query, [id_producto]);
            
            if (rows.length === 0) {
                return null;
            }

            const producto = rows[0];

            producto.imagenes = await this.getImagesByProductId(id_producto);
            const tallasQuery = `
                SELECT 
                    id_talla,
                    id_producto,
                    talla,
                    stock_talla,
                    medidas
                FROM talla_producto
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
                FROM imagen_producto
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
                FROM talla_producto
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
                FROM talla_producto
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
                UPDATE talla_producto
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
            const numLimit = parseInt(limit) || 4;

            const query = `
                SELECT 
                    p.id_producto,
                    p.nombre_producto,
                    p.precio,
                    p.descuento_porcentaje,
                    COALESCE(
                        (SELECT url_imagen FROM imagen_producto 
                          WHERE id_producto = p.id_producto AND es_principal = 1 
                          LIMIT 1),
                        (SELECT url_imagen FROM imagen_producto 
                          WHERE id_producto = p.id_producto 
                          ORDER BY orden_imagen ASC 
                          LIMIT 1)
                    ) as imagen_principal
                FROM PRODUCTO p
                WHERE p.id_categoria = ? 
                AND p.id_producto != ? 
                AND p.estado_producto = 'Activo'
                ORDER BY RAND()
                LIMIT ${numLimit}
            `;

            const [rows] = await this.db.execute(query, [id_categoria, id_producto]);
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
            const numLimit = parseInt(limit) || 8;
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
                    /* CORRECCIÓN: Calculamos el stock total sumando las tallas */
                    (SELECT COALESCE(SUM(stock_talla), 0) FROM talla_producto WHERE id_producto = p.id_producto) as stock_total,
                    COALESCE(
                        (SELECT url_imagen FROM imagen_producto 
                          WHERE id_producto = p.id_producto AND es_principal = 1 
                          LIMIT 1),
                        (SELECT url_imagen FROM imagen_producto 
                          WHERE id_producto = p.id_producto 
                          ORDER BY orden_imagen ASC 
                          LIMIT 1)
                    ) as imagen_principal,
                    (SELECT AVG(r.calificacion) FROM resena r 
                      WHERE r.id_producto = p.id_producto) as calificacion_promedio
                FROM producto p
                INNER JOIN categoria c ON p.id_categoria = c.id_categoria
                WHERE p.estado_producto = 'Activo'
                AND (p.destacado = 1)
                ORDER BY p.destacado DESC, p.fecha_creacion DESC
                LIMIT ${numLimit}
            `;

            const [rows] = await this.db.query(query);
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
                        (SELECT url_imagen FROM imagen_producto 
                          WHERE id_producto = p.id_producto AND es_principal = 1 
                          LIMIT 1),
                        (SELECT url_imagen FROM imagen_producto 
                          WHERE id_producto = p.id_producto 
                          ORDER BY orden_imagen ASC 
                          LIMIT 1)
                    ) as imagen_principal
                FROM producto p
                INNER JOIN categoria c ON p.id_categoria = c.id_categoria
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
                FROM producto
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
                FROM producto p
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
                FROM resena r
                LEFT JOIN cliente c ON r.id_cliente = c.id_cliente
                WHERE r.id_producto = ?
                ORDER BY r.fecha_resena DESC
            `;

            const [rows] = await this.db.execute(query, [id_producto]);
            return rows;
        } catch (error) {
            throw new Error(`Error obteniendo reseñas: ${error.message}`);
        }
    }

    static async findRelated(id_producto, limit = 4) {
        try {
          const numIdProducto = parseInt(id_producto);
          const numLimit = parseInt(limit) || 4;
          const [productoCurrent] = await this.db.execute(
            'SELECT id_categoria FROM producto WHERE id_producto = ?',
            [numIdProducto]
          );

          if (!productoCurrent || productoCurrent.length === 0) {
            return [];
          }

          const id_categoria = parseInt(productoCurrent[0].id_categoria);
          const query = `
            SELECT 
              p.id_producto,
              p.nombre_producto,
              p.precio,
              p.descuento_porcentaje,
              p.marca,
              c.nombre_categoria,
              c.slug as categoria_slug,
              (SELECT url_imagen 
              FROM imagen_producto 
              WHERE id_producto = p.id_producto 
              AND es_principal = 1
              LIMIT 1) as imagen_principal,
              COALESCE(SUM(tp.stock_talla), 0) as stock_total
            FROM producto p
            LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
            LEFT JOIN talla_producto tp ON p.id_producto = tp.id_producto
            WHERE p.id_categoria = ${id_categoria}
              AND p.id_producto != ${numIdProducto}
              AND p.estado_producto = 'Activo'
            GROUP BY p.id_producto
            ORDER BY p.destacado DESC, p.fecha_creacion DESC
            LIMIT ${numLimit}
          `;

          const [rows] = await this.db.query(query);
          return rows;

        } catch (error) {
          logger.error('Error en findRelated:', error);
          throw error;
        }
      }
}      

module.exports = Producto;
