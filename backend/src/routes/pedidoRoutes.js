// ============================================
// PEDIDO ROUTES - Rutas de Pedidos
// ============================================

const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireAdmin, requireVendedor, verifyToken } = require('../middlewares/authMiddleware');
const pedidoAdminController = require('../controllers/pedidoAdminController');

// IMPORTAR VALIDATORS
const {
    validateCrearPedido,
    validatePedidoId,
    validateListadoPedidos,
    validateCancelarPedido,
    validateProcesarPago,
    validateCrearResenaPedido,
    validateSolicitarFactura
} = require('../validators');

const {
    validateCambiarEstado,
    validateAnularPedido,
    validateActualizarDireccion,
    validateListarPedidos,
    validatePedidoId: validatePedidoIdAdmin
} = require('../validators/pedidoAdminValidator');

// ============================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ============================================
router.use(authMiddleware.verifyToken);

// ============================================
// RUTAS VENDEDOR - GESTIÓN DE PEDIDOS
// (DEBEN IR ANTES DE LAS RUTAS CON :id)
// ============================================

// GET /api/pedidos/vendedor/list - Listar todos los pedidos (Vendedor)
router.get('/vendedor/list',
    requireVendedor,
    validateListarPedidos,
    pedidoAdminController.listarTodosPedidos
);

// GET /api/pedidos/vendedor/:id - Detalle de pedido (Vendedor)
router.get('/vendedor/:id',
    requireVendedor,
    validatePedidoIdAdmin,
    pedidoAdminController.obtenerDetallePedido
);

// PATCH /api/pedidos/vendedor/:id/estado - Cambiar estado del pedido (Vendedor)
router.patch('/vendedor/:id/estado',
    requireVendedor,
    validateCambiarEstado,
    pedidoAdminController.cambiarEstado
);

// ============================================
// RUTAS ADMIN - GESTIÓN DE PEDIDOS
// (DEBEN IR ANTES DE LAS RUTAS CON :id)
// ============================================

// GET /api/pedidos/admin/stats - Estadísticas de pedidos (Admin)
router.get('/admin/stats',
    requireAdmin,
    pedidoAdminController.obtenerEstadisticas
);

// GET /api/pedidos/stats/admin - Estadísticas generales (Admin)
router.get('/stats/admin', 
    requireAdmin,               
    pedidoController.obtenerEstadisticasGenerales
);

// GET /api/pedidos/admin/list - Listar todos los pedidos (Admin)
router.get('/admin/list',
    requireAdmin,
    validateListarPedidos,
    pedidoAdminController.listarTodosPedidos
);

// GET /api/pedidos/admin/export/pdf - Exportar reporte PDF
router.get('/admin/export/pdf',
    requireAdmin,
    pedidoAdminController.exportarPDF
);

// GET /api/pedidos/admin/export/csv - Exportar pedidos a CSV (Admin)
router.get('/admin/export/csv',
    requireAdmin,
    validateListarPedidos,
    pedidoAdminController.exportarCSV
);

// GET /api/pedidos/admin/:id - Detalle de pedido (Admin)
router.get('/admin/:id',
    requireAdmin,
    validatePedidoIdAdmin,
    pedidoAdminController.obtenerDetallePedido
);

// PATCH /api/pedidos/admin/:id/estado - Cambiar estado del pedido (Admin)
router.patch('/admin/:id/estado',
    requireAdmin,
    validateCambiarEstado,
    pedidoAdminController.cambiarEstado
);

// POST /api/pedidos/admin/:id/anular - Anular pedido (Admin)
router.post('/admin/:id/anular',
    requireAdmin,
    validateAnularPedido,
    pedidoAdminController.anularPedido
);

// PATCH /api/pedidos/admin/:id/direccion - Actualizar dirección de envío (Admin)
router.patch('/admin/:id/direccion',
    requireAdmin,
    validateActualizarDireccion,
    pedidoAdminController.actualizarDireccion
);

// ============================================
// RUTAS ESPECIALES SIN :id
// (DEBEN IR ANTES DE LAS RUTAS CON :id)
// ============================================

// GET /api/pedidos/resumen/estadisticas - Estadísticas de pedidos del cliente
router.get('/resumen/estadisticas', 
    pedidoController.obtenerEstadisticas
);

// ============================================
// RUTAS DE PEDIDOS (CLIENTES)
// ============================================

// GET /api/pedidos - Listar pedidos del cliente autenticado
router.get('/', 
    validateListadoPedidos,
    pedidoController.obtenerPedidos
);

// POST /api/pedidos - Crear nuevo pedido desde carrito
router.post('/', 
    validateCrearPedido,
    pedidoController.crearPedido
);

// ============================================
// RUTAS CON PARÁMETRO :id
// ============================================

// GET /api/pedidos/:id - Obtener detalle de un pedido específico
router.get('/:id', 
    validatePedidoId,
    pedidoController.obtenerPedidoPorId
);

// PUT /api/pedidos/:id/cancelar - Cancelar un pedido
router.put('/:id/cancelar', 
    validateCancelarPedido,
    pedidoController.cancelarPedido
);

// POST /api/pedidos/:id/pago - Procesar pago de un pedido
router.post('/:id/pago', 
    validateProcesarPago,
    pedidoController.procesarPago
);

// GET /api/pedidos/:id/estado - Obtener estado de seguimiento del pedido
router.get('/:id/estado', 
    validatePedidoId,
    pedidoController.obtenerEstadoPedido
);

// POST /api/pedidos/:id/resena - Agregar reseña de producto comprado
router.post('/:id/resena',
    validateCrearResenaPedido,
    pedidoController.agregarResena
);

// GET /api/pedidos/:id/factura - Descargar factura del pedido
router.get('/:id/factura', 
    validateSolicitarFactura,
    pedidoController.descargarFactura
);

module.exports = router;
