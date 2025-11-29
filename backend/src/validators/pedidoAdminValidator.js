// ============================================
// PEDIDO ADMIN VALIDATOR - Validaciones
// ============================================

const { body, param, query } = require('express-validator');

// Validar cambio de estado
const validateCambiarEstado = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID de pedido inválido'),
    
    body('nuevo_estado')
        .notEmpty()
        .withMessage('El nuevo estado es requerido')
        .isIn(['pendiente', 'confirmado', 'procesando', 'enviado', 'entregado', 'cancelado'])
        .withMessage('Estado inválido')
];

// Validar anulación de pedido
const validateAnularPedido = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID de pedido inválido'),
    
    body('motivo')
        .notEmpty()
        .withMessage('El motivo de anulación es requerido')
        .isString()
        .withMessage('El motivo debe ser texto')
        .isLength({ min: 10, max: 500 })
        .withMessage('El motivo debe tener entre 10 y 500 caracteres')
];

// Validar actualización de dirección
const validateActualizarDireccion = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID de pedido inválido'),
    
    body('direccion_linea1')
        .notEmpty()
        .withMessage('La dirección línea 1 es requerida')
        .isString()
        .isLength({ min: 5, max: 200 })
        .withMessage('La dirección debe tener entre 5 y 200 caracteres'),
    
    body('direccion_linea2')
        .optional()
        .isString()
        .isLength({ max: 200 }),
    
    body('distrito')
        .notEmpty()
        .withMessage('El distrito es requerido')
        .isString()
        .isLength({ max: 50 }),
    
    body('provincia')
        .optional()
        .isString()
        .isLength({ max: 50 }),
    
    body('departamento')
        .optional()
        .isString()
        .isLength({ max: 50 })
        .withMessage('El departamento no puede exceder 50 caracteres'),
    
    body('codigo_postal')
        .optional()
        .isString()
        .isLength({ max: 10 }),
    
    body('referencia')
        .optional()
        .isString()
        .isLength({ max: 200 })
];

// Validar parámetros de listado
const validateListarPedidos = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La página debe ser un número positivo'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('El límite debe estar entre 1 y 100'),
    
    query('estado')
        .optional()
        .isIn(['pendiente', 'confirmado', 'procesando', 'enviado', 'entregado', 'cancelado'])
        .withMessage('Estado inválido'),
    
    query('fecha_desde')
        .optional()
        .isISO8601()
        .withMessage('Formato de fecha inválido (usar YYYY-MM-DD)'),
    
    query('fecha_hasta')
        .optional()
        .isISO8601()
        .withMessage('Formato de fecha inválido (usar YYYY-MM-DD)'),
    
    query('ordenar_por')
        .optional()
        .isIn(['fecha_pedido', 'total', 'estado_pedido'])
        .withMessage('Campo de ordenamiento inválido'),
    
    query('orden')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Orden inválido (usar asc o desc)')
];

// Validar ID de pedido
const validatePedidoId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID de pedido inválido')
];

module.exports = {
    validateCambiarEstado,
    validateAnularPedido,
    validateActualizarDireccion,
    validateListarPedidos,
    validatePedidoId
};
