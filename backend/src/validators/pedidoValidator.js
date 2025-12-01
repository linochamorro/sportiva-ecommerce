/**
 * PEDIDO VALIDATOR
 * Validaciones para endpoints de pedidos y pagos
 * Usa express-validator (equiv Apache Commons Validator)
 */

const { param, body, query, validationResult } = require('express-validator');

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Validación para crear pedido
 */
const validateCrearPedido = [
  body('direccion_envio')
    .trim()
    .notEmpty().withMessage('La dirección de envío es obligatoria')
    .isLength({ min: 10, max: 255 }).withMessage('La dirección debe tener entre 10 y 255 caracteres'),

  body('metodo_pago')
    .trim()
    .notEmpty().withMessage('El método de pago es obligatorio')
    .isIn(['Tarjeta', 'Yape', 'Plin', 'Transferencia', 'Efectivo']) 
    .withMessage('Método de pago inválido...'),

  body('telefono_contacto')
    .trim()
    .notEmpty().withMessage('El teléfono de contacto es obligatorio')
    .matches(/^[0-9]{9}$/).withMessage('El teléfono debe tener 9 dígitos'),

  body('notas')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Las notas no pueden exceder 500 caracteres')
    .escape(), // Sanitización XSS

  body('codigo_cupon')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('El código de cupón debe tener entre 3 y 50 caracteres')
    .toUpperCase(),

  handleValidationErrors
];

/**
 * Validación para ID de pedido
 */
const validatePedidoId = [
  param('id')
    .notEmpty().withMessage('El ID del pedido es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo')
    .toInt(),

  handleValidationErrors
];

/**
 * Validación para listado de pedidos
 */
const validateListadoPedidos = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('La página debe ser un número entero positivo')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100')
    .toInt(),

  query('estado')
    .optional()
    .isIn(['pendiente', 'confirmado', 'en_proceso', 'enviado', 'entregado', 'cancelado'])
    .withMessage('Estado inválido'),

  query('fecha_inicio')
    .optional()
    .isISO8601().withMessage('Fecha de inicio inválida (formato: YYYY-MM-DD)')
    .toDate(),

  query('fecha_fin')
    .optional()
    .isISO8601().withMessage('Fecha fin inválida (formato: YYYY-MM-DD)')
    .toDate()
    .custom((value, { req }) => {
      if (req.query.fecha_inicio && value < new Date(req.query.fecha_inicio)) {
        throw new Error('La fecha fin debe ser posterior a la fecha de inicio');
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * Validación para cancelar pedido
 */
const validateCancelarPedido = [
  param('id')
    .notEmpty().withMessage('El ID del pedido es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo')
    .toInt(),

  body('motivo')
    .trim()
    .notEmpty().withMessage('El motivo de cancelación es obligatorio')
    .isLength({ min: 10, max: 500 }).withMessage('El motivo debe tener entre 10 y 500 caracteres')
    .escape(),

  handleValidationErrors
];

/**
 * Validación para procesar pago
 */
const validateProcesarPago = [
  param('id')
    .notEmpty().withMessage('El ID del pedido es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo')
    .toInt(),

  body('metodo_pago')
    .trim()
    .notEmpty().withMessage('El método de pago es obligatorio')
    .isIn(['tarjeta', 'yape', 'plin', 'efectivo', 'transferencia'])
    .withMessage('Método de pago inválido'),

  body('monto')
    .notEmpty().withMessage('El monto es obligatorio')
    .isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0')
    .toFloat(),

  // Validaciones específicas para tarjeta
  body('numero_tarjeta')
    .if(body('metodo_pago').equals('tarjeta'))
    .notEmpty().withMessage('El número de tarjeta es obligatorio')
    .matches(/^[0-9]{16}$/).withMessage('El número de tarjeta debe tener 16 dígitos'),

  body('nombre_titular')
    .if(body('metodo_pago').equals('tarjeta'))
    .trim()
    .notEmpty().withMessage('El nombre del titular es obligatorio')
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre solo puede contener letras y espacios'),

  body('cvv')
    .if(body('metodo_pago').equals('tarjeta'))
    .notEmpty().withMessage('El CVV es obligatorio')
    .matches(/^[0-9]{3,4}$/).withMessage('El CVV debe tener 3 o 4 dígitos'),

  body('fecha_expiracion')
    .if(body('metodo_pago').equals('tarjeta'))
    .notEmpty().withMessage('La fecha de expiración es obligatoria')
    .matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/).withMessage('Formato de fecha inválido (MM/YY)')
    .custom((value) => {
      const [month, year] = value.split('/');
      const expDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
      if (expDate < new Date()) {
        throw new Error('La tarjeta está vencida');
      }
      return true;
    }),

  // Validaciones para Yape/Plin
  body('numero_operacion')
    .if(body('metodo_pago').isIn(['yape', 'plin', 'transferencia']))
    .trim()
    .notEmpty().withMessage('El número de operación es obligatorio')
    .isLength({ min: 6, max: 50 }).withMessage('El número de operación debe tener entre 6 y 50 caracteres'),

  handleValidationErrors
];

/**
 * Validación para actualizar estado de pedido (ADMIN)
 */
const validateActualizarEstado = [
  param('id')
    .notEmpty().withMessage('El ID del pedido es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo')
    .toInt(),

  body('estado')
    .trim()
    .notEmpty().withMessage('El estado es obligatorio')
    .isIn(['pendiente', 'confirmado', 'en_proceso', 'enviado', 'entregado', 'cancelado'])
    .withMessage('Estado inválido'),

  body('notas_admin')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Las notas no pueden exceder 500 caracteres')
    .escape(),

  handleValidationErrors
];

/**
 * Validación para crear reseña de pedido
 */
const validateCrearResenaPedido = [
  param('id')
    .notEmpty().withMessage('El ID del pedido es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo')
    .toInt(),

  body('calificacion')
    .notEmpty().withMessage('La calificación es obligatoria')
    .isInt({ min: 1, max: 5 }).withMessage('La calificación debe estar entre 1 y 5')
    .toInt(),

  body('comentario')
    .trim()
    .notEmpty().withMessage('El comentario es obligatorio')
    .isLength({ min: 10, max: 1000 }).withMessage('El comentario debe tener entre 10 y 1000 caracteres')
    .escape(),

  handleValidationErrors
];

/**
 * Validación para solicitar factura
 */
const validateSolicitarFactura = [
  param('id')
    .notEmpty().withMessage('El ID del pedido es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo')
    .toInt(),

  body('tipo_documento')
    .trim()
    .notEmpty().withMessage('El tipo de documento es obligatorio')
    .isIn(['boleta', 'factura']).withMessage('Tipo de documento inválido: boleta o factura'),

  // Campos obligatorios solo para factura
  body('ruc')
    .if(body('tipo_documento').equals('factura'))
    .trim()
    .notEmpty().withMessage('El RUC es obligatorio para facturas')
    .matches(/^[0-9]{11}$/).withMessage('El RUC debe tener 11 dígitos'),

  body('razon_social')
    .if(body('tipo_documento').equals('factura'))
    .trim()
    .notEmpty().withMessage('La razón social es obligatoria para facturas')
    .isLength({ min: 3, max: 200 }).withMessage('La razón social debe tener entre 3 y 200 caracteres'),

  body('direccion_fiscal')
    .if(body('tipo_documento').equals('factura'))
    .trim()
    .notEmpty().withMessage('La dirección fiscal es obligatoria para facturas')
    .isLength({ min: 10, max: 255 }).withMessage('La dirección fiscal debe tener entre 10 y 255 caracteres'),

  // Campos opcionales para boleta
  body('dni')
    .if(body('tipo_documento').equals('boleta'))
    .optional()
    .trim()
    .matches(/^[0-9]{8}$/).withMessage('El DNI debe tener 8 dígitos'),

  body('nombre_completo')
    .if(body('tipo_documento').equals('boleta'))
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('El nombre completo debe tener entre 3 y 200 caracteres'),

  handleValidationErrors
];

/**
 * Validación para aplicar cupón de descuento
 */
const validateAplicarCupon = [
  body('codigo_cupon')
    .trim()
    .notEmpty().withMessage('El código de cupón es obligatorio')
    .isLength({ min: 3, max: 50 }).withMessage('El código debe tener entre 3 y 50 caracteres')
    .toUpperCase(),

  handleValidationErrors
];

/**
 * Validación para estadísticas de pedidos (ADMIN)
 */
const validateEstadisticas = [
  query('fecha_inicio')
    .optional()
    .isISO8601().withMessage('Fecha de inicio inválida (formato: YYYY-MM-DD)')
    .toDate(),

  query('fecha_fin')
    .optional()
    .isISO8601().withMessage('Fecha fin inválida (formato: YYYY-MM-DD)')
    .toDate(),

  query('agrupar_por')
    .optional()
    .isIn(['dia', 'semana', 'mes', 'año']).withMessage('Agrupación inválida: dia, semana, mes, año'),

  handleValidationErrors
];

/**
 * Validación para solicitar reembolso
 */
const validateSolicitarReembolso = [
  param('id')
    .notEmpty().withMessage('El ID del pedido es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo')
    .toInt(),

  body('motivo')
    .trim()
    .notEmpty().withMessage('El motivo del reembolso es obligatorio')
    .isLength({ min: 20, max: 1000 }).withMessage('El motivo debe tener entre 20 y 1000 caracteres')
    .escape(),

  body('monto_reembolso')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0')
    .toFloat(),

  handleValidationErrors
];

module.exports = {
  validateCrearPedido,
  validatePedidoId,
  validateListadoPedidos,
  validateCancelarPedido,
  validateProcesarPago,
  validateActualizarEstado,
  validateCrearResenaPedido,
  validateSolicitarFactura,
  validateAplicarCupon,
  validateEstadisticas,
  validateSolicitarReembolso
};
