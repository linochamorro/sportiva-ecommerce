// ============================================
// PRODUCTO ROUTES - Rutas de Productos
// ============================================

const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const { requireAdmin, verifyToken, requireVendedor } = require('../middlewares/authMiddleware');

// IMPORTAR VALIDATORS
const {
    validateProductoId,
    validateListadoProductos,
    validateBusquedaProductos,
    validateCategoria,
    validateVerificarStock,
    validateProductosRelacionados,
    validateObtenerResenas,
    validateCrearProducto,
    validateActualizarProducto
} = require('../validators');

// ============================================
// RUTAS PÚBLICAS
// ============================================

// GET /api/productos - Listar todos los productos con filtros y paginación
router.get('/', 
    validateListadoProductos,
    productoController.obtenerTodos
);

// GET /api/productos/buscar - Búsqueda avanzada de productos
router.get('/buscar', 
    validateBusquedaProductos,
    productoController.buscarProductos
);

// GET /api/productos/destacados - Productos destacados
router.get('/destacados', 
    productoController.obtenerDestacados
);

// GET /api/productos/ofertas - Productos en oferta
router.get('/ofertas', 
    validateListadoProductos,
    productoController.obtenerOfertas
);

// GET /api/productos/nuevos - Productos nuevos/recientes
router.get('/nuevos', 
    validateListadoProductos,
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
    validateCategoria,
    productoController.obtenerPorCategoria
);

// GET /api/productos/:id - Obtener detalle de un producto
router.get('/:id', 
    validateProductoId,
    productoController.obtenerPorId
);

// GET /api/productos/:id/stock - Verificar stock por talla
router.get('/:id/stock', 
    validateVerificarStock,
    productoController.verificarStock
);

// GET /api/productos/:id/relacionados - Productos relacionados
router.get('/:id/relacionados', 
    validateProductosRelacionados,
    productoController.obtenerRelacionados
);

// GET /api/productos/:id/resenas - Obtener reseñas de un producto
router.get('/:id/resenas', 
    validateObtenerResenas,
    productoController.obtenerResenas
);

// GET /api/productos/stats/general - Estadísticas generales (Admin)
router.get('/stats/general',
    verifyToken,
    requireAdmin,
    productoController.obtenerEstadisticas
);

// ============================================
// RUTAS PROTEGIDAS (ADMIN / VENDEDOR)
// ============================================

// Se usa 'requireVendedor' que, según,
// permite el acceso a Vendedores y Administradores.

// POST /api/productos - Crear un nuevo producto
router.post('/',
    verifyToken,
    requireVendedor,
    validateCrearProducto,
    productoController.crearProducto
);

// PUT /api/productos/:id - Actualizar un producto existente
router.put('/:id',
    verifyToken,
    requireVendedor,
    validateActualizarProducto,
    productoController.actualizarProducto
);

// PATCH /api/productos/:id/estado - Cambiar el estado de un producto
router.patch('/:id/estado',
    verifyToken,
    requireVendedor,
    validateProductoId, // Reutilizamos el validador de ID
    productoController.actualizarEstadoProducto
);

module.exports = router;
