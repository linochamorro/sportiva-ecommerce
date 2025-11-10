// ============================================
// CLIENTE ROUTES (Admin)
// ============================================
const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

// --- Proteger todas las rutas de este módulo ---
// Solo un Admin autenticado puede gestionar clientes
router.use(verifyToken, requireAdmin);

// GET /api/clientes - Listar todos los clientes
router.get('/', clienteController.getAllClientes);

// GET /api/clientes/:id - Obtener un cliente
router.get('/:id', clienteController.getClienteById);

// PUT /api/clientes/:id - Actualizar un cliente
router.put('/:id', clienteController.updateCliente);

// PATCH /api/clientes/:id/estado - Cambiar estado (activar/desactivar)
router.patch('/:id/estado', clienteController.updateEstadoCliente);

module.exports = router;
