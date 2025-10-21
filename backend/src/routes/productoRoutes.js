// ============================================
// PRODUCTO ROUTES - Rutas de Productos
// ============================================

const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

// ✅ IMPORTAR VALIDATORS PROFESIONALES
const {
    validateProductoId,
    validateListadoProductos,
    validateBusquedaProductos,
    validateCategoria,
    validateVerificarStock,
    validateProductosRelacionados,
    validateObtenerResenas
} = require('../validators');

// ============================================
// RUTAS PÚBLICAS
// ============================================

// GET /api/productos - Listar todos los productos con filtros y paginación
router.get('/', 
    validateListadoProductos,       // ✅ Validator profesional
    productoController.obtenerTodos
);

// GET /api/productos/buscar - Búsqueda avanzada de productos
router.get('/buscar', 
    validateBusquedaProductos,      // ✅ Validator profesional
    productoController.buscarProductos
);

// GET /api/productos/destacados - Productos destacados
router.get('/destacados', 
    productoController.obtenerDestacados
);

// GET /api/productos/ofertas - Productos en oferta
router.get('/ofertas', 
    validateListadoProductos,       // ✅ Reutiliza validator con paginación
    productoController.obtenerOfertas
);

// GET /api/productos/nuevos - Productos nuevos/recientes
router.get('/nuevos', 
    validateListadoProductos,       // ✅ Reutiliza validator con paginación
    productoController.obtenerNuevos
);

// GET /api/productos/stats/categorias - Estadísticas por categoría
router.get('/stats/categorias', 
    productoController.obtenerEstadisticasCategorias
);

// GET /api/productos/stats/precios - Rango de precios disponibles
router.get('/stats/precios', 
    productoController.obtenerRangoPrecios
);

// GET /api/productos/categoria/:id - Filtrar por categoría
router.get('/categoria/:id', 
    validateCategoria,              // ✅ Validator profesional
    productoController.obtenerPorCategoria
);

// GET /api/productos/:id - Obtener detalle de un producto
router.get('/:id', 
    validateProductoId,             // ✅ Validator profesional
    productoController.obtenerPorId
);

// GET /api/productos/:id/stock - Verificar stock por talla
router.get('/:id/stock', 
    validateVerificarStock,         // ✅ Validator profesional
    productoController.verificarStock
);

// GET /api/productos/:id/relacionados - Productos relacionados
router.get('/:id/relacionados', 
    validateProductosRelacionados,  // ✅ Validator profesional
    productoController.obtenerRelacionados
);

// GET /api/productos/:id/resenas - Obtener reseñas de un producto
router.get('/:id/resenas', 
    validateObtenerResenas,         // ✅ Validator profesional
    productoController.obtenerResenas
);

module.exports = router;
