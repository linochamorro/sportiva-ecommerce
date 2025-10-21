/**
 * PRODUCTO VALIDATOR
 * Validaciones para endpoints de productos
 * Usa express-validator (equiv Apache Commons Validator)
 */

const { query, param, body, validationResult } = require('express-validator');

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
 * Validación para ID de producto
 */
const validateProductoId = [
  param('id')
    .notEmpty().withMessage('El ID del producto es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo')
    .toInt(),

  handleValidationErrors
];

/**
 * Validación para listado de productos con filtros
 */
const validateListadoProductos = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('La página debe ser un número entero positivo')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100')
    .toInt(),

  query('categoria_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de categoría debe ser un número entero positivo')
    .toInt(),

  query('marca')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('La marca debe tener entre 1 y 100 caracteres'),

  query('precioMin')
    .optional()
    .isFloat({ min: 0 }).withMessage('El precio mínimo debe ser un número positivo')
    .toFloat(),

  query('precioMax')
    .optional()
    .isFloat({ min: 0 }).withMessage('El precio máximo debe ser un número positivo')
    .toFloat()
    .custom((value, { req }) => {
      if (req.query.precioMin && value < parseFloat(req.query.precioMin)) {
        throw new Error('El precio máximo debe ser mayor al precio mínimo');
      }
      return true;
    }),

  query('stock')
    .optional()
    .isIn(['disponible', 'agotado', 'todos']).withMessage('Stock debe ser: disponible, agotado o todos'),

  query('descuento')
    .optional()
    .isBoolean().withMessage('Descuento debe ser true o false')
    .toBoolean(),

  query('ordenar')
    .optional()
    .isIn(['precio_asc', 'precio_desc', 'nombre_asc', 'nombre_desc', 'reciente', 'popular'])
    .withMessage('Ordenar debe ser: precio_asc, precio_desc, nombre_asc, nombre_desc, reciente o popular'),

  handleValidationErrors
];

/**
 * Validación para búsqueda de productos
 */
const validateBusquedaProductos = [
  query('q')
    .trim()
    .notEmpty().withMessage('El término de búsqueda es obligatorio')
    .isLength({ min: 2, max: 100 }).withMessage('El término debe tener entre 2 y 100 caracteres')
    .escape(), // Sanitización XSS

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('La página debe ser un número entero positivo')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100')
    .toInt(),

  query('categoria_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de categoría debe ser un número entero positivo')
    .toInt(),

  handleValidationErrors
];

/**
 * Validación para filtros por categoría
 */
const validateCategoria = [
  param('id')
    .notEmpty().withMessage('El ID de categoría es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo')
    .toInt(),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('La página debe ser un número entero positivo')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100')
    .toInt(),

  handleValidationErrors
];

/**
 * Validación para crear reseña de producto
 */
const validateCrearResena = [
  param('id')
    .notEmpty().withMessage('El ID del producto es obligatorio')
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
    .escape(), // Sanitización XSS

  handleValidationErrors
];

/**
 * Validación para obtener reseñas
 */
const validateObtenerResenas = [
  param('id')
    .notEmpty().withMessage('El ID del producto es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo')
    .toInt(),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('La página debe ser un número entero positivo')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('El límite debe estar entre 1 y 50')
    .toInt(),

  query('ordenar')
    .optional()
    .isIn(['reciente', 'calificacion_alta', 'calificacion_baja', 'util'])
    .withMessage('Ordenar debe ser: reciente, calificacion_alta, calificacion_baja o util'),

  handleValidationErrors
];

/**
 * Validación para verificar stock
 */
const validateVerificarStock = [
  param('id')
    .notEmpty().withMessage('El ID del producto es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo')
    .toInt(),

  query('cantidad')
    .optional()
    .isInt({ min: 1 }).withMessage('La cantidad debe ser un número entero positivo')
    .toInt(),

  handleValidationErrors
];

/**
 * Validación para productos relacionados
 */
const validateProductosRelacionados = [
  param('id')
    .notEmpty().withMessage('El ID del producto es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 }).withMessage('El límite debe estar entre 1 y 20')
    .toInt(),

  handleValidationErrors
];

/**
 * Validación para crear producto (ADMIN)
 */
const validateCrearProducto = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 3, max: 200 }).withMessage('El nombre debe tener entre 3 y 200 caracteres'),

  body('descripcion')
    .trim()
    .notEmpty().withMessage('La descripción es obligatoria')
    .isLength({ min: 10, max: 2000 }).withMessage('La descripción debe tener entre 10 y 2000 caracteres'),

  body('precio')
    .notEmpty().withMessage('El precio es obligatorio')
    .isFloat({ min: 0.01 }).withMessage('El precio debe ser mayor a 0')
    .toFloat(),

  body('precio_descuento')
    .optional()
    .isFloat({ min: 0 }).withMessage('El precio de descuento debe ser positivo')
    .toFloat()
    .custom((value, { req }) => {
      if (value && value >= req.body.precio) {
        throw new Error('El precio de descuento debe ser menor al precio original');
      }
      return true;
    }),

  body('stock')
    .notEmpty().withMessage('El stock es obligatorio')
    .isInt({ min: 0 }).withMessage('El stock debe ser un número entero positivo o cero')
    .toInt(),

  body('categoria_id')
    .notEmpty().withMessage('La categoría es obligatoria')
    .isInt({ min: 1 }).withMessage('El ID de categoría debe ser un número entero positivo')
    .toInt(),

  body('marca')
    .trim()
    .notEmpty().withMessage('La marca es obligatoria')
    .isLength({ min: 2, max: 100 }).withMessage('La marca debe tener entre 2 y 100 caracteres'),

  body('imagen_url')
    .optional()
    .trim()
    .isURL().withMessage('La URL de imagen no es válida'),

  handleValidationErrors
];

/**
 * Validación para actualizar producto (ADMIN)
 */
const validateActualizarProducto = [
  param('id')
    .notEmpty().withMessage('El ID del producto es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo')
    .toInt(),

  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('El nombre debe tener entre 3 y 200 caracteres'),

  body('descripcion')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 }).withMessage('La descripción debe tener entre 10 y 2000 caracteres'),

  body('precio')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('El precio debe ser mayor a 0')
    .toFloat(),

  body('precio_descuento')
    .optional()
    .isFloat({ min: 0 }).withMessage('El precio de descuento debe ser positivo')
    .toFloat(),

  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('El stock debe ser un número entero positivo o cero')
    .toInt(),

  body('categoria_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de categoría debe ser un número entero positivo')
    .toInt(),

  body('marca')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('La marca debe tener entre 2 y 100 caracteres'),

  body('activo')
    .optional()
    .isBoolean().withMessage('Activo debe ser true o false')
    .toBoolean(),

  handleValidationErrors
];

module.exports = {
  validateProductoId,
  validateListadoProductos,
  validateBusquedaProductos,
  validateCategoria,
  validateCrearResena,
  validateObtenerResenas,
  validateVerificarStock,
  validateProductosRelacionados,
  validateCrearProducto,
  validateActualizarProducto
};
