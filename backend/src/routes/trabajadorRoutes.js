const express = require('express');
const router = express.Router();
const trabajadorController = require('../controllers/trabajadorController');
const { verifyToken, requireAdmin, requireTrabajador } = require('../middlewares/authMiddleware');

router.post('/login', trabajadorController.login);

router.post('/register', verifyToken, requireAdmin, trabajadorController.register);

router.get('/profile', verifyToken, requireTrabajador, trabajadorController.getProfile);

router.put('/change-password', verifyToken, requireTrabajador, trabajadorController.changePassword);

router.get('/', verifyToken, requireAdmin, trabajadorController.getAll);

router.get('/:id', verifyToken, requireAdmin, trabajadorController.getById);

router.put('/:id', verifyToken, requireAdmin, trabajadorController.update);

router.patch('/:id/estado', verifyToken, requireAdmin, trabajadorController.updateEstado);

router.patch('/:id/rol', verifyToken, requireAdmin, trabajadorController.updateRol);

module.exports = router;
