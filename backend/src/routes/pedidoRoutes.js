// ============================================
// PEDIDO ROUTES - Rutas de Pedidos
// ============================================

const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');
const authMiddleware = require('../middlewares/authMiddleware');

// ✅ IMPORTAR VALIDATORS PROFESIONALES
const {
    validateCrearPedido,
    validatePedidoId,
    validateListadoPedidos,
    validateCancelarPedido,
    validateProcesarPago,
    validateCrearResenaPedido,
    validateSolicitarFactura
} = require('../validators');

// ============================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ============================================
router.use(authMiddleware.verifyToken);

// ============================================
// RUTAS DE PEDIDOS
// ============================================

// GET /api/pedidos - Listar pedidos del cliente autenticado
router.get('/', 
    validateListadoPedidos,         // ✅ Validator profesional
    pedidoController.obtenerPedidos
);

// POST /api/pedidos - Crear nuevo pedido desde carrito
router.post('/', 
    validateCrearPedido,            // ✅ Validator profesional
    pedidoController.crearPedido
);

// GET /api/pedidos/:id - Obtener detalle de un pedido específico
router.get('/:id', 
    validatePedidoId,               // ✅ Validator profesional
    pedidoController.obtenerPedidoPorId
);

// PUT /api/pedidos/:id/cancelar - Cancelar un pedido
router.put('/:id/cancelar', 
    validateCancelarPedido,         // ✅ Validator profesional
    pedidoController.cancelarPedido
);

// POST /api/pedidos/:id/pago - Procesar pago de un pedido
router.post('/:id/pago', 
    validateProcesarPago,           // ✅ Validator profesional
    pedidoController.procesarPago
);

// GET /api/pedidos/:id/estado - Obtener estado de seguimiento del pedido
router.get('/:id/estado', 
    validatePedidoId,               // ✅ Validator profesional
    pedidoController.obtenerEstadoPedido
);

// POST /api/pedidos/:id/resena - Agregar reseña de producto comprado
router.post('/:id/resena',
    validateCrearResenaPedido,      // ✅ Validator profesional
    pedidoController.agregarResena
);

// GET /api/pedidos/:id/factura - Descargar factura del pedido
router.get('/:id/factura', 
    validateSolicitarFactura,       // ✅ Validator profesional (si requiere datos adicionales)
    pedidoController.descargarFactura
);

// GET /api/pedidos/resumen/estadisticas - Estadísticas de pedidos del cliente
router.get('/resumen/estadisticas', 
    pedidoController.obtenerEstadisticas
);

module.exports = router;
