// ============================================
// AUTH ROUTES - Rutas de Autenticación
// ============================================

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// IMPORTAR VALIDATORS PROFESIONALES
const { 
    validateRegister,
    validateLogin,
    validateChangePassword,
    validateUpdateProfile
} = require('../validators');

// ============================================
// RUTAS PÚBLICAS
// ============================================

// POST /api/auth/register - Registro de nuevo cliente
router.post('/register', 
    validateRegister,
    authController.register
);

// POST /api/auth/login - Login de cliente
router.post('/login', 
    validateLogin,
    authController.login
);

// ============================================
// RUTAS PROTEGIDAS
// ============================================

// POST /api/auth/logout - Logout (requiere token)
router.post('/logout', 
    authMiddleware.verifyToken, 
    authController.logout
);

// GET /api/auth/verify - Verificar token válido
router.get('/verify', 
    authMiddleware.verifyToken, 
    authController.verifyToken
);

// POST /api/auth/refresh - Renovar token
router.post('/refresh', 
    authMiddleware.verifyToken, 
    authController.refreshToken
);

// GET /api/auth/profile - Obtener perfil del usuario autenticado
router.get('/profile', 
    authMiddleware.verifyToken, 
    authController.getProfile
);

// PUT /api/auth/profile - Actualizar perfil del usuario
router.put('/profile', 
    authMiddleware.verifyToken,
    validateUpdateProfile,
    authController.updateProfile
);

// PUT /api/auth/change-password - Cambiar contraseña
router.put('/change-password',
    authMiddleware.verifyToken,
    validateChangePassword,
    authController.changePassword
);

module.exports = router;
