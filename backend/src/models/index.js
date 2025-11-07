// ============================================
// MODELS INDEX - Exportación centralizada
// ============================================

const Producto = require('./Producto');
const Cliente = require('./Cliente');
const Carrito = require('./Carrito');
const Pedido = require('./Pedido');
const Pago = require('./Pago');
const Trabajador = require('./Trabajador');

const productoModel = new Producto();
const clienteModel = new Cliente();
const carritoModel = new Carrito();
const pedidoModel = new Pedido();
const pagoModel = new Pago();
const trabajadorModel = new Trabajador();

module.exports = {
    Producto: productoModel,
    Cliente: clienteModel,
    Carrito: carritoModel,
    Pedido: pedidoModel,
    Pago: pagoModel,
    Trabajador: trabajadorModel
};
