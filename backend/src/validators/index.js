/**
 * VALIDATORS INDEX
 * Exportación centralizada de todos los validators
 * Facilita importación en routes: const { validateLogin } = require('../validators');
 */

const authValidator = require('./authValidator');
const productoValidator = require('./productoValidator');
const pedidoValidator = require('./pedidoValidator');

module.exports = {
  // Auth Validators
  ...authValidator,
  
  // Producto Validators
  ...productoValidator,
  
  // Pedido Validators
  ...pedidoValidator
};
