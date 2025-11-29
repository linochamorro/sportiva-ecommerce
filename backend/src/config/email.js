// ============================================
// EMAIL CONFIGURATION
// ============================================

require('dotenv').config();

module.exports = {
    // Configuración SMTP
    smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true' || false,
        auth: {
            user: process.env.SMTP_USER || 'sportiva.ecommerce@gmail.com',
            pass: process.env.SMTP_PASS || ''
        }
    },

    // Remitente por defecto
    from: {
        name: process.env.EMAIL_FROM_NAME || 'Sportiva E-Commerce',
        address: process.env.EMAIL_FROM_ADDRESS || 'no-reply@sportiva.com'
    },

    // Plantillas de correo
    templates: {
        pedidoConfirmado: {
            subject: '✅ Pedido Confirmado - Sportiva',
            template: 'pedido-confirmado'
        },
        pedidoProcesando: {
            subject: '📦 Tu pedido está en proceso - Sportiva',
            template: 'pedido-procesando'
        },
        pedidoEnviado: {
            subject: '🚚 Tu pedido ha sido enviado - Sportiva',
            template: 'pedido-enviado'
        },
        pedidoEntregado: {
            subject: '🎉 Tu pedido ha sido entregado - Sportiva',
            template: 'pedido-entregado'
        },
        pedidoCancelado: {
            subject: '❌ Pedido Cancelado - Sportiva',
            template: 'pedido-cancelado'
        }
    },

    // Configuración general
    options: {
        // Tiempo de espera para envío (ms)
        timeout: 10000,
        
        // Reintentos en caso de fallo
        maxRetries: 3,
        
        // Habilitar/deshabilitar envío de emails
        enabled: process.env.EMAIL_ENABLED === 'true' || false
    }
};
