// ============================================
// PRODUCTO SERVICE - SOLID Principles
// ============================================
const Producto = require('../models/Producto');
const logger = require('../utils/logger');

/**
 * Responsabilidad única: Lógica de negocio de productos
 * Aplica Single Responsibility Principle (SRP) y Open/Closed Principle (OCP)
 */
class ProductoService {
    constructor() {
        this.productoModel = new Producto;
    }

    // ============================================
    // NORMALIZACIÓN DE RUTAS
    // ============================================

    normalizarRutaImagen(urlImagen) {
        if (!urlImagen) return null;
        
        // Si la ruta empieza con 'frontend/', quitarla
        if (urlImagen.startsWith('frontend/')) {
            return urlImagen.replace('frontend/', '');
        }
        
        return urlImagen;
    }

    // ============================================
    // CATÁLOGO DE PRODUCTOS
    // ============================================

    /**
     * Obtener catálogo de productos con filtros (incluye filtro por stock)
     */
    async getCatalogo(filters = {}, pagination = {}) {
        try {
            // Configurar paginación
            const limit = parseInt(pagination.limit) || 12;
            const page = parseInt(pagination.page) || 1;
            const offset = (page - 1) * limit;

            // Agregar filtro de stock si se solicita
            const filtrosConStock = { ...filters };
            
            if (filters.solo_con_stock === 'true' || filters.solo_con_stock === true) {
                filtrosConStock.con_stock = true;
            }

            // Obtener productos con filtros
            const productos = await this.productoModel.findAllWithDetails({
                ...filtrosConStock,
                limit,
                offset
            });

            // Contar total de productos activos (sin paginación)
            const total = await this.productoModel.countActive(filtrosConStock);

            // Procesar productos (normalizar rutas de imágenes)
            const productosProcessed = productos.map(producto => ({
                ...producto,
                imagen_principal: this.normalizarRutaImagen(producto.imagen_principal),
                precio_formateado: this.formatPrice(producto.precio),
                en_stock: this.checkProductStock(producto),
                stock_total: this.calculateTotalStock(producto.tallas)
            }));

            return {
                success: true,
                data: {
                    productos: productosProcessed,
                    pagination: {
                        page,
                        limit,
                        total,
                        total_pages: Math.ceil(total / limit),
                        has_next: page < Math.ceil(total / limit),
                        has_prev: page > 1
                    }
                }
            };
        } catch (error) {
            throw new Error(`Error obteniendo catálogo: ${error.message}`);
        }
    }

    /**
     * Obtener producto por ID con todos los detalles
     */
    async getProductoById(id_producto) {
        try {
            const producto = await this.productoModel.findByIdWithDetails(id_producto);

            if (!producto) {
                return {
                    success: false,
                    message: 'Producto no encontrado'
                };
            }

            // Normalizar rutas de imágenes
            if (producto.imagen_principal) {
                producto.imagen_principal = this.normalizarRutaImagen(producto.imagen_principal);
            }

            if (producto.imagenes && Array.isArray(producto.imagenes)) {
                producto.imagenes = producto.imagenes.map(img => ({
                    ...img,
                    url_imagen: this.normalizarRutaImagen(img.url_imagen)
                }));
            }

            // Enriquecer datos del producto
            const productoEnriquecido = {
                ...producto,
                precio_formateado: this.formatPrice(producto.precio),
                en_stock: producto.tallas && producto.tallas.length > 0,
                stock_total: this.calculateTotalStock(producto.tallas),
                tallas_disponibles: this.formatTallasDisponibles(producto.tallas),
                tiene_imagenes: producto.imagenes && producto.imagenes.length > 0,
                calificacion_formateada: this.formatRating(producto.calificacion_promedio)
            };

            // Obtener productos relacionados
            const relacionados = await this.productoModel.getRelatedProducts(
                id_producto,
                producto.id_categoria,
                4
            );

            // Normalizar imágenes de productos relacionados
            const relacionadosNormalizados = relacionados.map(p => ({
                ...p,
                imagen_principal: this.normalizarRutaImagen(p.imagen_principal)
            }));

            return {
                success: true,
                data: {
                    producto: productoEnriquecido,
                    productos_relacionados: relacionadosNormalizados
                }
            };
        } catch (error) {
            throw new Error(`Error obteniendo producto: ${error.message}`);
        }
    }

    // ============================================
    // BÚSQUEDA Y FILTROS
    // ============================================

    /**
     * Buscar productos por término
     */
    async searchProductos(searchTerm, limit = 20) {
        try {
            if (!searchTerm || searchTerm.trim().length < 2) {
                return {
                    success: false,
                    message: 'El término de búsqueda debe tener al menos 2 caracteres'
                };
            }

            const productos = await this.productoModel.search(searchTerm.trim(), limit);

            const productosProcessed = productos.map(producto => ({
                ...producto,
                imagen_principal: this.normalizarRutaImagen(producto.imagen_principal),
                precio_formateado: this.formatPrice(producto.precio)
            }));

            return {
                success: true,
                data: {
                    productos: productosProcessed,
                    total: productos.length,
                    search_term: searchTerm
                }
            };
        } catch (error) {
            throw new Error(`Error buscando productos: ${error.message}`);
        }
    }

    /**
     * Obtener productos destacados para home
     */
    async getFeaturedProducts(limit = 8) {
        try {
            const productos = await this.productoModel.getFeaturedProducts(limit);

            const productosProcessed = productos.map(producto => ({
                ...producto,
                imagen_principal: this.normalizarRutaImagen(producto.imagen_principal),
                precio_formateado: this.formatPrice(producto.precio),
                calificacion_formateada: this.formatRating(producto.calificacion_promedio)
            }));

            return {
                success: true,
                data: {
                    productos: productosProcessed
                }
            };
        } catch (error) {
            throw new Error(`Error obteniendo productos destacados: ${error.message}`);
        }
    }

    /**
     * Obtener filtros disponibles (categorías, marcas, rangos de precio)
     */
    async getAvailableFilters() {
        try {
            // Obtener categorías únicas
            const categorias = await this.productoModel.db.execute(`
                SELECT DISTINCT c.id_categoria, c.nombre_categoria
                FROM categoria c
                INNER JOIN producto p ON c.id_categoria = p.id_categoria
                WHERE p.estado_producto = 'Activo'
                ORDER BY c.nombre_categoria
            `);

            // Obtener marcas únicas
            const marcas = await this.productoModel.db.execute(`
                SELECT DISTINCT marca
                FROM producto
                WHERE estado_producto = 'Activo' AND marca IS NOT NULL
                ORDER BY marca
            `);

            // Obtener rango de precios
            const precios = await this.productoModel.db.execute(`
                SELECT 
                    MIN(precio) as precio_min,
                    MAX(precio) as precio_max
                FROM producto
                WHERE estado_producto = 'Activo'
            `);

            return {
                success: true,
                data: {
                    categorias: categorias[0],
                    marcas: marcas[0].map(m => m.marca),
                    rango_precios: precios[0][0]
                }
            };
        } catch (error) {
            throw new Error(`Error obteniendo filtros: ${error.message}`);
        }
    }

    // ============================================
    // STOCK Y DISPONIBILIDAD
    // ============================================

    /**
     * Verificar disponibilidad de producto con talla específica
     */
    async checkAvailability(id_producto, talla, cantidad = 1) {
        try {
            const stockInfo = await this.productoModel.checkStock(
                id_producto,
                talla,
                cantidad
            );

            return {
                success: true,
                data: {
                    disponible: stockInfo.available,
                    stock_disponible: stockInfo.stock,
                    cantidad_solicitada: cantidad,
                    id_talla: stockInfo.id_talla,
                    mensaje: stockInfo.available 
                        ? 'Producto disponible' 
                        : `Solo hay ${stockInfo.stock} unidades disponibles`
                }
            };
        } catch (error) {
            throw new Error(`Error verificando disponibilidad: ${error.message}`);
        }
    }

    /**
     * Obtener stock por tallas de un producto
     */
    async getStockByTallas(id_producto) {
        try {
            const tallas = await this.productoModel.getTallasByProductId(id_producto);

            const tallasFormateadas = tallas.map(talla => ({
                ...talla,
                disponible: talla.stock_talla > 0,
                stock_bajo: talla.stock_talla > 0 && talla.stock_talla <= 5,
                mensaje_stock: this.getStockMessage(talla.stock_talla)
            }));

            return {
                success: true,
                data: {
                    tallas: tallasFormateadas,
                    hay_stock: tallasFormateadas.some(t => t.disponible)
                }
            };
        } catch (error) {
            throw new Error(`Error obteniendo stock por tallas: ${error.message}`);
        }
    }

    // ============================================
    // IMÁGENES
    // ============================================

    /**
     * Obtener imágenes de un producto
     */
    async getProductoImages(id_producto) {
        try {
            const imagenes = await this.productoModel.getImagesByProductId(id_producto);

            // Normalizar rutas de imágenes
            const imagenesNormalizadas = imagenes.map(img => ({
                ...img,
                url_imagen: this.normalizarRutaImagen(img.url_imagen)
            }));

            return {
                success: true,
                data: {
                    imagenes: imagenesNormalizadas,
                    total: imagenesNormalizadas.length,
                    imagen_principal: imagenesNormalizadas.find(img => img.es_principal) || imagenesNormalizadas[0]
                }
            };
        } catch (error) {
            throw new Error(`Error obteniendo imágenes: ${error.message}`);
        }
    }

    // ============================================
    // ESTADÍSTICAS Y REPORTES
    // ============================================

    /**
     * Obtener estadísticas generales de productos
     */
    async getStats() {
        try {
            const stats = await this.productoModel.getStats();

            return {
                success: true,
                data: {
                    ...stats,
                    precio_promedio_formateado: this.formatPrice(stats.precio_promedio),
                    precio_minimo_formateado: this.formatPrice(stats.precio_minimo),
                    precio_maximo_formateado: this.formatPrice(stats.precio_maximo)
                }
            };
        } catch (error) {
            throw new Error(`Error obteniendo estadísticas: ${error.message}`);
        }
    }

    // ============================================
    // UTILIDADES Y FORMATEO
    // ============================================

    /**
     * Formatear precio a moneda local
     */
    formatPrice(precio) {
        return `S/ ${parseFloat(precio).toFixed(2)}`;
    }

    /**
     * Formatear calificación (rating)
     */
    formatRating(calificacion) {
        if (!calificacion) return '0.0';
        return parseFloat(calificacion).toFixed(1);
    }

    /**
     * Verificar si el producto tiene stock disponible
     */
    checkProductStock(producto) {
        if (!producto.tallas || producto.tallas.length === 0) {
            return false;
        }
        return producto.tallas.some(talla => talla.stock_talla > 0);
    }

    /**
     * Calcular stock total de todas las tallas
     */
    calculateTotalStock(tallas) {
        if (!tallas || tallas.length === 0) return 0;
        return tallas.reduce((total, talla) => total + (talla.stock_talla || 0), 0);
    }

    /**
     * Formatear tallas disponibles
     */
    formatTallasDisponibles(tallas) {
        if (!tallas || tallas.length === 0) return [];
        return tallas
            .filter(talla => talla.stock_talla > 0)
            .map(talla => talla.talla);
    }

    /**
     * Obtener mensaje de stock
     */
    getStockMessage(stock) {
        if (stock === 0) return 'Sin stock';
        if (stock <= 5) return `¡Solo quedan ${stock} unidades!`;
        return 'Disponible';
    }

    /**
     * Aplicar descuento a un producto
     */
    applyDiscount(precio, descuentoPorcentaje) {
        const descuento = (precio * descuentoPorcentaje) / 100;
        const precioFinal = precio - descuento;
        return {
            precio_original: precio,
            descuento_porcentaje: descuentoPorcentaje,
            descuento_monto: descuento,
            precio_final: precioFinal,
            precio_final_formateado: this.formatPrice(precioFinal)
        };
    }

    /**
     * Validar ID de producto
     */
    validateProductoId(id_producto) {
        const id = parseInt(id_producto);
        if (isNaN(id) || id <= 0) {
            return {
                valid: false,
                message: 'ID de producto inválido'
            };
        }
        return { valid: true, id };
    }

    /**
     * Construir breadcrumb para navegación
     */
    async buildBreadcrumb(id_producto) {
        try {
            const producto = await this.productoModel.findByIdWithDetails(id_producto);
            
            if (!producto) {
                return [];
            }

            return [
                { label: 'Inicio', url: '/' },
                { label: 'Catálogo', url: '/catalogo.html' },
                { label: producto.nombre_categoria, url: `/catalogo.html?categoria=${producto.id_categoria}` },
                { label: producto.nombre_producto, url: `/producto.html?id=${producto.id_producto}` }
            ];
        } catch (error) {
            return [];
        }
    }


    // ============================================
    // CREAR PRODUCTO (ADMIN)
    // ============================================
    async crearProducto(data) {
        return await this.productoModel.executeInTransaction(async (connection) => {
            
            // 1. Insertar en la tabla PRODUCTO
            const productoData = {
                nombre_producto: data.nombre_producto,
                descripcion: data.descripcion,
                precio: data.precio,
                stock_minimo: data.stock_minimo,
                id_categoria: data.id_categoria,
                marca: data.marca,
                sku: data.sku,
                peso: data.peso,
                dimensiones: data.dimensiones,
                tiene_tallas: data.tiene_tallas,
                estado_producto: data.estado_producto || 'Activo',
                destacado: data.destacado,
                nuevo: data.nuevo,
                descuento_porcentaje: data.descuento_porcentaje
            };

            const campos = Object.keys(productoData);
            const valores = Object.values(productoData);
            const placeholders = campos.map(() => '?').join(', ');
            
            const queryProducto = `INSERT INTO producto (${campos.join(', ')}) VALUES (${placeholders})`;
            const [resultProducto] = await connection.execute(queryProducto, valores);
            const newProductoId = resultProducto.insertId;

            // 2. Insertar Stock en TALLA_PRODUCTO
            if (!data.tiene_tallas) {
                const queryTalla = `INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (?, 'UNICA', ?)`;
                await connection.execute(queryTalla, [newProductoId, data.stock_unica || 0]);
            }

            // 3. Insertar Imagen Principal en IMAGEN_PRODUCTO
            if (data.imagen_url) {
                const queryImagen = `INSERT INTO imagen_producto (id_producto, url_imagen, es_principal) VALUES (?, ?, 1)`;
                await connection.execute(queryImagen, [newProductoId, data.imagen_url]);
            }

            return { success: true, id: newProductoId, message: 'Producto creado exitosamente' };
        });
    }

    // ============================================
    // ACTUALIZAR PRODUCTO (ADMIN)
    // ============================================
    async actualizarProducto(id_producto, data) {
        return await this.productoModel.executeInTransaction(async (connection) => {
            
            // 1. Actualizar tabla PRODUCTO
            const productoData = {
                nombre_producto: data.nombre_producto,
                descripcion: data.descripcion,
                precio: data.precio,
                stock_minimo: data.stock_minimo,
                id_categoria: data.id_categoria,
                marca: data.marca,
                sku: data.sku,
                peso: data.peso,
                dimensiones: data.dimensiones,
                tiene_tallas: data.tiene_tallas,
                estado_producto: data.estado_producto,
                destacado: data.destacado,
                nuevo: data.nuevo,
                descuento_porcentaje: data.descuento_porcentaje
            };

            const campos = Object.keys(productoData);
            const valores = Object.values(productoData);
            const setClause = campos.map(campo => `${campo} = ?`).join(', ');
            
            const queryProducto = `UPDATE producto SET ${setClause} WHERE id_producto = ?`;
            await connection.execute(queryProducto, [...valores, id_producto]);

            // 2. Actualizar Stock en talla_producto
            if (!data.tiene_tallas) {
                const queryUpdateStock = `
                    INSERT INTO talla_producto (id_producto, talla, stock_talla) 
                    VALUES (?, 'UNICA', ?)
                    ON DUPLICATE KEY UPDATE stock_talla = VALUES(stock_talla)
                `;
                await connection.execute(queryUpdateStock, [id_producto, data.stock_unica || 0]);
            }

            // 3. Actualizar Imagen Principal en imagen_producto
            if (data.imagen_url) {
                const queryDeleteImg = `DELETE FROM imagen_producto WHERE id_producto = ? AND es_principal = 1`;
                await connection.execute(queryDeleteImg, [id_producto]);
                
                const queryInsertImg = `INSERT INTO imagen_producto (id_producto, url_imagen, es_principal) VALUES (?, ?, 1)`;
                await connection.execute(queryInsertImg, [id_producto, data.imagen_url]);
            }

            return { success: true, message: 'Producto actualizado exitosamente' };
        });
    }

    // ============================================
    // ACTUALIZAR ESTADO DE PRODUCTO (ADMIN)
    // ============================================
    async actualizarEstadoProducto(id_producto, estado) {
        const query = `UPDATE producto SET estado_producto = ? WHERE id_producto = ?`;
        const [result] = await this.productoModel.db.execute(query, [estado, id_producto]);

        if (result.affectedRows === 0) {
            return { success: false, message: 'Producto no encontrado' };
        }
        
        return { success: true, message: `Producto ${estado === 'Activo' ? 'activado' : 'desactivado'}` };
    }
}

// Exportar instancia única (Singleton pattern)
module.exports = new ProductoService();
