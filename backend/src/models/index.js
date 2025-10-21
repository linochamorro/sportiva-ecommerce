// ============================================
// MODELS INDEX - Exportación centralizada
// ============================================

const Producto = require('./Producto');
const Cliente = require('./Cliente');
const Carrito = require('./Carrito');
const Pedido = require('./Pedido');
const Pago = require('./Pago');

// Instanciar modelos
const productoModel = new Producto();
const clienteModel = new Cliente();
const carritoModel = new Carrito();
const pedidoModel = new Pedido();
const pagoModel = new Pago();

// Exportar instancias
module.exports = {
    Producto: productoModel,
    Cliente: clienteModel,
    Carrito: carritoModel,
    Pedido: pedidoModel,
    Pago: pagoModel
};
