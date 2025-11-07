/**
 * AUTH VALIDATOR
 * Validaciones para endpoints de autenticación
 * Usa express-validator
 */

const { body, validationResult } = require('express-validator');

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
 * Validación para registro de CLIENTE (bloquea @sportiva.com)
 */
const validateRegister = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre solo puede contener letras y espacios'),

  body('apellido')
    .trim()
    .notEmpty().withMessage('El apellido es obligatorio')
    .isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El apellido solo puede contener letras y espacios'),

  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('El email no puede exceder 100 caracteres')
    .custom((value) => {
      // BLOQUEAR emails @sportiva.com en registro de clientes
      if (value.toLowerCase().endsWith('@sportiva.com')) {
        throw new Error('No puedes registrarte como cliente con un email @sportiva.com. Si eres trabajador, contacta a un administrador.');
      }
      return true;
    }),

  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('La contraseña debe contener al menos: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial (@$!%*?&)'),

  body('telefono')
    .optional()
    .trim()
    .matches(/^[0-9]{9}$/).withMessage('El teléfono debe tener 9 dígitos'),

  body('direccion')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('La dirección no puede exceder 255 caracteres'),

  handleValidationErrors
];

/**
 * Validación para login
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('Contraseña inválida'),

  handleValidationErrors
];

/**
 * Validación para cambio de contraseña
 */
const validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('La contraseña actual es obligatoria'),

  body('newPassword')
    .notEmpty().withMessage('La nueva contraseña es obligatoria')
    .isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('La contraseña debe contener al menos: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial'),

  body('confirmPassword')
    .notEmpty().withMessage('Debe confirmar la nueva contraseña')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * Validación para actualización de perfil
 */
const validateUpdateProfile = [
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre solo puede contener letras y espacios'),

  body('apellido')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El apellido solo puede contener letras y espacios'),

  body('telefono')
    .optional()
    .trim()
    .matches(/^[0-9]{9}$/).withMessage('El teléfono debe tener 9 dígitos'),

  body('direccion')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('La dirección no puede exceder 255 caracteres'),

  handleValidationErrors
];

/**
 * Validación para refresh token
 */
const validateRefreshToken = [
  body('refreshToken')
    .notEmpty().withMessage('El refresh token es obligatorio')
    .isJWT().withMessage('Token inválido'),

  handleValidationErrors
];

/**
 * Validación para verificación de email
 */
const validateVerifyEmail = [
  body('token')
    .notEmpty().withMessage('El token de verificación es obligatorio')
    .isLength({ min: 32 }).withMessage('Token inválido'),

  handleValidationErrors
];

/**
 * Validación para recuperación de contraseña
 */
const validateForgotPassword = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),

  handleValidationErrors
];

/**
 * Validación para resetear contraseña
 */
const validateResetPassword = [
  body('token')
    .notEmpty().withMessage('El token es obligatorio')
    .isLength({ min: 32 }).withMessage('Token inválido'),

  body('newPassword')
    .notEmpty().withMessage('La nueva contraseña es obligatoria')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('La contraseña debe contener al menos: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial'),

  body('confirmPassword')
    .notEmpty().withMessage('Debe confirmar la nueva contraseña')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),

  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateUpdateProfile,
  validateRefreshToken,
  validateVerifyEmail,
  validateForgotPassword,
  validateResetPassword
};
