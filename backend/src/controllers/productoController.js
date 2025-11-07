// ============================================
// PRODUCTO CONTROLLER
// ============================================

const productoService = require('../services/productoService');
const { Producto } = require('../models');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

// ============================================
// OBTENER TODOS LOS PRODUCTOS
// Endpoint: GET /api/productos
// ============================================

exports.obtenerTodos = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        
        // Parámetro para excluir producto específico (productos relacionados)
        const excluirProductoId = req.query.excluir ? parseInt(req.query.excluir) : null;

const filtros = {
            id_categoria: req.query.categoria ? parseInt(req.query.categoria) : null,
            precioMin: req.query.precioMin,
            precioMax: req.query.precioMax,
            genero: req.query.genero,
            busqueda: req.query.q,
            marca: req.query.marca,
            excluir: excluirProductoId
        };

        const resultado = await productoService.getCatalogo(filtros, { page, limit });

        if (resultado.success) {
            res.json(resultado);
        } else {
            res.status(400).json(resultado);
        }

    } catch (error) {
        logger.error('Error al obtener productos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos',
            error: error.message
        });
    }
};

// ============================================
// OBTENER PRODUCTO POR ID
// Endpoint: GET /api/productos/:id
// ============================================

exports.obtenerPorId = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const productoId = req.params.id;

        const resultado = await productoService.getProductoById(productoId);

        if (resultado.success) {
            res.json(resultado);
        } else {
            res.status(404).json(resultado);
        }

    } catch (error) {
        logger.error('Error al obtener producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener producto',
            error: error.message
        });
    }
};

// ============================================
// BUSCAR PRODUCTOS
// Endpoint: GET /api/productos/buscar
// ============================================

exports.buscarProductos = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const terminoBusqueda = req.query.q || '';
        const limit = parseInt(req.query.limit) || 20;

        const resultado = await productoService.searchProductos(terminoBusqueda, limit);

        if (resultado.success) {
            res.json(resultado);
        } else {
            res.status(400).json(resultado);
        }

    } catch (error) {
        logger.error('Error al buscar productos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al buscar productos',
            error: error.message
        });
    }
};

// ============================================
// OBTENER PRODUCTOS POR CATEGORÍA
// Endpoint: GET /api/productos/categoria/:categoriaId
// ============================================

exports.obtenerPorCategoria = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const categoriaId = req.params.categoriaId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;

        const resultado = await productoService.getCatalogo(
            { categoria: categoriaId },
            { page, limit }
        );

        if (resultado.success) {
            res.json(resultado);
        } else {
            res.status(400).json(resultado);
        }

    } catch (error) {
        logger.error('Error al obtener productos por categoría:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos',
            error: error.message
        });
    }
};

// ============================================
// OBTENER PRODUCTOS DESTACADOS
// Endpoint: GET /api/productos/destacados
// ============================================

exports.obtenerDestacados = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 8;

        const resultado = await productoService.getFeaturedProducts(limit);

        if (resultado.success) {
            res.json(resultado);
        } else {
            res.status(400).json(resultado);
        }

    } catch (error) {
        logger.error('Error al obtener productos destacados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos destacados',
            error: error.message
        });
    }
};

// ============================================
// OBTENER PRODUCTOS EN OFERTA
// Endpoint: GET /api/productos/ofertas
// ============================================

exports.obtenerOfertas = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;

        const productos = await Producto.findEnOferta(limit, (page - 1) * limit);
        const total = await Producto.countEnOferta();

        res.json({
            success: true,
            data: {
                productos,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        logger.error('Error al obtener productos en oferta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos en oferta',
            error: error.message
        });
    }
};

// ============================================
// OBTENER PRODUCTOS NUEVOS
// Endpoint: GET /api/productos/nuevos
// ============================================

exports.obtenerNuevos = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;

        const productos = await Producto.findAll(limit, (page - 1) * limit, 'fecha_creacion DESC');
        const total = await Producto.count();

        res.json({
            success: true,
            data: {
                productos,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        logger.error('Error al obtener productos nuevos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos nuevos',
            error: error.message
        });
    }
};

// ============================================
// VERIFICAR STOCK
// Endpoint: GET /api/productos/:id/stock
// ============================================

exports.verificarStock = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const productoId = req.params.id;
        const { talla_id, cantidad } = req.query;

        if (talla_id && cantidad) {
            // Verificar disponibilidad específica
            const resultado = await productoService.checkAvailability(
                parseInt(productoId), 
                parseInt(talla_id), 
                parseInt(cantidad)
            );
            
            if (resultado.success) {
                res.json(resultado);
            } else {
                res.status(400).json(resultado);
            }
        } else {
            const resultado = await productoService.getStockByTallas(productoId);
            
            if (resultado.success) {
                res.json(resultado);
            } else {
                res.status(400).json(resultado);
            }
        }

    } catch (error) {
        logger.error('Error al verificar stock:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar stock',
            error: error.message
        });
    }
};

// ============================================
// OBTENER PRODUCTOS RELACIONADOS
// Endpoint: GET /api/productos/:id/relacionados
// ============================================

exports.obtenerRelacionados = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const productoId = req.params.id;

        // Obtener producto con relacionados incluidos
        const resultado = await productoService.getProductoById(productoId);

        if (!resultado.success) {
            return res.status(404).json(resultado);
        }

        res.json({
            success: true,
            data: {
                productos: resultado.data.productos_relacionados || []
            }
        });

    } catch (error) {
        logger.error('Error al obtener productos relacionados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos relacionados',
            error: error.message
        });
    }
};

// ============================================
// OBTENER IMÁGENES DE UN PRODUCTO
// Endpoint: GET /api/productos/:id/imagenes
// ============================================

exports.obtenerImagenes = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const productoId = req.params.id;

        const resultado = await productoService.getProductoImages(productoId);

        if (resultado.success) {
            res.json(resultado);
        } else {
            res.status(400).json(resultado);
        }

    } catch (error) {
        logger.error('Error al obtener imágenes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener imágenes',
            error: error.message
        });
    }
};

// ============================================
// OBTENER RESEÑAS DE UN PRODUCTO
// Endpoint: GET /api/productos/:id/resenas
// ============================================

exports.obtenerResenas = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const productoId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const resenas = await Producto.getResenas(productoId, limit, (page - 1) * limit);
        const estadisticas = await Producto.getEstadisticasResenas(productoId);

        res.json({
            success: true,
            data: {
                resenas,
                estadisticas,
                pagination: {
                    page,
                    limit
                }
            }
        });

    } catch (error) {
        logger.error('Error al obtener reseñas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener reseñas',
            error: error.message
        });
    }
};

// ============================================
// OBTENER ESTADÍSTICAS POR CATEGORÍA
// Endpoint: GET /api/productos/estadisticas/categorias
// ============================================

exports.obtenerEstadisticasCategorias = async (req, res) => {
    try {
        const estadisticas = await Producto.getCategoriaStats();

        res.json({
            success: true,
            data: {
                categorias: estadisticas
            }
        });

    } catch (error) {
        logger.error('Error al obtener estadísticas de categorías:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};

// ============================================
// OBTENER RANGO DE PRECIOS
// Endpoint: GET /api/productos/rango-precios
// ============================================

exports.obtenerRangoPrecios = async (req, res) => {
    try {
        const rango = await Producto.getPriceRange();

        res.json({
            success: true,
            data: {
                precioMinimo: rango.min,
                precioMaximo: rango.max
            }
        });

    } catch (error) {
        logger.error('Error al obtener rango de precios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener rango de precios',
            error: error.message
        });
    }
};

// ============================================
// OBTENER FILTROS DISPONIBLES
// Endpoint: GET /api/productos/filtros
// ============================================

exports.obtenerFiltros = async (req, res) => {
    try {
        const resultado = await productoService.getAvailableFilters();

        if (resultado.success) {
            res.json(resultado);
        } else {
            res.status(400).json(resultado);
        }

    } catch (error) {
        logger.error('Error al obtener filtros:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener filtros',
            error: error.message
        });
    }
};

// ============================================
// OBTENER ESTADÍSTICAS GENERALES
// Endpoint: GET /api/productos/estadisticas
// ============================================

exports.obtenerEstadisticas = async (req, res) => {
    try {
        const resultado = await productoService.getStats();

        if (resultado.success) {
            res.json(resultado);
        } else {
            res.status(400).json(resultado);
        }

    } catch (error) {
        logger.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};

module.exports = exports;
