// ============================================
// INDEX ROUTES - Centralizador de Rutas
// ============================================

const express = require('express');
const router = express.Router();

// Importar rutas
const authRoutes = require('./authRoutes');
const productoRoutes = require('./productoRoutes');
const carritoRoutes = require('./carritoRoutes');
const pedidoRoutes = require('./pedidoRoutes');
const trabajadorRoutes = require('./trabajadorRoutes');

// ============================================
// CONFIGURACIÓN DE RUTAS
// ============================================

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de productos
router.use('/productos', productoRoutes);

// Rutas de carrito
router.use('/carrito', carritoRoutes);

// Rutas de pedidos
router.use('/pedidos', pedidoRoutes);

// Rutas de trabajadores
router.use('/trabajadores', trabajadorRoutes);

// ============================================
// RUTA DE SALUD DE LA API
// ============================================

router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Sportiva API está funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            productos: '/api/productos',
            carrito: '/api/carrito',
            pedidos: '/api/pedidos',
            trabajadores: '/api/trabajadores'
        }
    });
});

// ============================================
// RUTA NO ENCONTRADA (404)
// ============================================

router.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
        availableEndpoints: {
            auth: '/api/auth',
            productos: '/api/productos',
            carrito: '/api/carrito',
            pedidos: '/api/pedidos',
            trabajadores: '/api/trabajadores',
            health: '/api/health'
        }
    });
});

module.exports = router;
