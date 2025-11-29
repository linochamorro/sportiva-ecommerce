// ============================================
// SPORTIVA - Constantes del Sistema
// ============================================

require('dotenv').config();

// ============================================
// CONFIGURACIÓN JWT
// ============================================
const JWT_SECRET = process.env.JWT_SECRET || 'sportiva-secret-key-development-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Estados de pedido
const ESTADOS_PEDIDO = {
    PENDIENTE: 'PENDIENTE',
    PROCESANDO: 'PROCESANDO',
    ENVIADO: 'ENVIADO',
    ENTREGADO: 'ENTREGADO',
    CANCELADO: 'CANCELADO'
};

// Estados de pago
const ESTADOS_PAGO = {
    PENDIENTE: 'PENDIENTE',
    APROBADO: 'APROBADO',
    RECHAZADO: 'RECHAZADO',
    REEMBOLSADO: 'REEMBOLSADO'
};

// Métodos de pago
const METODOS_PAGO = {
    TARJETA: 'TARJETA',
    YAPE: 'YAPE',
    PLIN: 'PLIN',
    TRANSFERENCIA: 'TRANSFERENCIA',
    CONTRA_ENTREGA: 'CONTRA_ENTREGA'
};

// Configuración de negocio
const BUSINESS_CONFIG = {
    IGV: parseFloat(process.env.IGV) || 0.18,
    COSTO_ENVIO_LIMA: parseFloat(process.env.COSTO_ENVIO_LIMA) || 15.00,
    COSTO_ENVIO_PROVINCIAS: parseFloat(process.env.COSTO_ENVIO_PROVINCIAS) || 25.00,
    MONEDA: process.env.MONEDA || 'S/',
    ENVIO_GRATIS_MINIMO: 150.00,
    CUPONES: {
        'PRIMERACOMPRA': { 
            tipo: 'PORCENTAJE', 
            valor: 20,     // 20%
            minimo: 100.00, // Mínimo S/ 100
            unico: true    // Uso único por cliente
        }
    }
};

// Roles de usuario
const ROLES_USUARIO = {
    ADMIN: 'ADMIN',
    CLIENTE: 'CLIENTE'
};

// Categorías disponibles
const CATEGORIAS = {
    FUTBOL: 1,
    BASQUET: 2,
    RUNNING: 3,
    GYM: 4,
    NATACION: 5
};

// Tallas disponibles
const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// Códigos de respuesta HTTP
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
};

// Mensajes de error comunes
const MENSAJES_ERROR = {
    SERVER_ERROR: 'Error interno del servidor',
    VALIDATION_ERROR: 'Error de validación de datos',
    UNAUTHORIZED: 'No autorizado',
    NOT_FOUND: 'Recurso no encontrado',
    DUPLICATE_ENTRY: 'El registro ya existe',
    DATABASE_ERROR: 'Error en la base de datos'
};

// Mensajes de éxito comunes
const MENSAJES_EXITO = {
    CREATED: 'Recurso creado exitosamente',
    UPDATED: 'Recurso actualizado exitosamente',
    DELETED: 'Recurso eliminado exitosamente',
    LOGIN_SUCCESS: 'Inicio de sesión exitoso',
    LOGOUT_SUCCESS: 'Cierre de sesión exitoso'
};

module.exports = {
    // Exportar JWT_SECRET y JWT_EXPIRES_IN
    JWT_SECRET,
    JWT_EXPIRES_IN,
    
    // Exportaciones existentes
    ESTADOS_PEDIDO,
    ESTADOS_PAGO,
    METODOS_PAGO,
    BUSINESS_CONFIG,
    ROLES_USUARIO,
    CATEGORIAS,
    TALLAS,
    HTTP_STATUS,
    MENSAJES_ERROR,
    MENSAJES_EXITO
};

