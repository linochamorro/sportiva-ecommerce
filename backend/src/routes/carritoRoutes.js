// ============================================
// CARRITO ROUTES - Rutas del Carrito de Compras
// ============================================

const express = require('express');
const router = express.Router();
const carritoController = require('../controllers/carritoController');
const authMiddleware = require('../middlewares/authMiddleware');
const { body, param } = require('express-validator');

// ============================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ============================================
router.use(authMiddleware.verifyToken);

// ============================================
// VALIDACIONES
// ============================================

const agregarItemValidation = [
    body('id_producto')
        .isInt({ min: 1 }).withMessage('ID de producto inválido')
        .toInt(),
    body('cantidad')
        .isInt({ min: 1, max: 99 }).withMessage('La cantidad debe estar entre 1 y 99')
        .toInt(),
    body('id_talla')
        .optional({ nullable: true }) // Permite que el campo sea nulo
        .isInt({ min: 1 }).withMessage('ID de talla inválido')
        .toInt()
];

const actualizarItemValidation = [
    param('itemId')
        .isInt({ min: 1 }).withMessage('ID de item inválido')
        .toInt(),
    body('cantidad')
        .isInt({ min: 0, max: 99 }).withMessage('La cantidad debe estar entre 0 y 99')
        .toInt()
];

const itemIdValidation = [
    param('itemId')
        .isInt({ min: 1 }).withMessage('ID de item inválido')
        .toInt()
];

// ============================================
// RUTAS DEL CARRITO
// ============================================

// GET /api/carrito - Obtener carrito actual del cliente autenticado
router.get('/', carritoController.obtenerCarrito);

// POST /api/carrito/items - Agregar producto al carrito
router.post('/items', agregarItemValidation, carritoController.agregarItem);

// PUT /api/carrito/items/:itemId - Actualizar cantidad de un item
router.put('/items/:itemId', actualizarItemValidation, carritoController.actualizarItem);

// DELETE /api/carrito/items/:itemId - Eliminar un item del carrito
router.delete('/items/:itemId', itemIdValidation, carritoController.eliminarItem);

// DELETE /api/carrito - Vaciar carrito completo
router.delete('/', carritoController.vaciarCarrito);

// GET /api/carrito/resumen - Obtener resumen del carrito (totales, cantidad items)
router.get('/resumen', carritoController.obtenerResumen);

// POST /api/carrito/validar - Validar disponibilidad de stock antes de checkout
router.post('/validar', carritoController.validarDisponibilidad);

// POST /api/carrito/aplicar-cupon - Aplicar cupón de descuento
router.post('/aplicar-cupon', 
    [body('codigoCupon').trim().notEmpty().withMessage('El código del cupón es requerido')],
    carritoController.aplicarCupon
);

// DELETE /api/carrito/cupon - Remover cupón aplicado
router.delete('/cupon', carritoController.removerCupon);

// GET /api/carrito/count - Obtener cantidad total de items (para badge en UI)
router.get('/count', carritoController.obtenerCantidadItems);

module.exports = router;
