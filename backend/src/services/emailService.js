// ============================================
// EMAIL SERVICE - Servicio de Envío de Emails
// ============================================

const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');
const logger = require('../utils/logger');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    /**
     * Inicializar transportador de nodemailer
     */
    initializeTransporter() {
        try {
            if (!emailConfig.options.enabled) {
                logger.info('⚠️ Servicio de email deshabilitado en configuración');
                return;
            }

            this.transporter = nodemailer.createTransport({
                host: emailConfig.smtp.host,
                port: emailConfig.smtp.port,
                secure: emailConfig.smtp.secure,
                auth: {
                    user: emailConfig.smtp.auth.user,
                    pass: emailConfig.smtp.auth.pass
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            logger.info('✅ Transportador de email inicializado correctamente');
        } catch (error) {
            logger.error('❌ Error inicializando transportador de email:', error);
        }
    }

    // ============================================
    // ENVÍO DE EMAILS
    // ============================================

    /**
     * Enviar email genérico
     */
    async sendEmail(to, subject, htmlContent, textContent = null) {
        try {
            if (!emailConfig.options.enabled) {
                logger.info(`📧 [SIMULADO] Email a ${to}: ${subject}`);
                return {
                    success: true,
                    simulated: true,
                    message: 'Email simulado (servicio deshabilitado)'
                };
            }

            if (!this.transporter) {
                throw new Error('Transportador de email no inicializado');
            }

            const mailOptions = {
                from: `${emailConfig.from.name} <${emailConfig.from.address}>`,
                to: to,
                subject: subject,
                html: htmlContent,
                text: textContent || this.stripHtml(htmlContent)
            };

            const info = await this.transporter.sendMail(mailOptions);

            logger.info(`✅ Email enviado exitosamente a ${to}`);
            
            return {
                success: true,
                messageId: info.messageId,
                message: 'Email enviado exitosamente'
            };

        } catch (error) {
            logger.error(`❌ Error enviando email a ${to}:`, error);
            return {
                success: false,
                error: error.message,
                message: 'Error al enviar email'
            };
        }
    }

    /**
     * Enviar email con reintentos
     */
    async sendEmailWithRetry(to, subject, htmlContent, textContent = null) {
        const maxRetries = emailConfig.options.maxRetries;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await this.sendEmail(to, subject, htmlContent, textContent);
                
                if (result.success) {
                    return result;
                }

                if (attempt < maxRetries) {
                    logger.warn(`⚠️ Intento ${attempt} fallido, reintentando...`);
                    await this.delay(2000 * attempt); // Esperar progresivamente
                }
            } catch (error) {
                if (attempt === maxRetries) {
                    throw error;
                }
            }
        }

        return {
            success: false,
            message: `No se pudo enviar el email después de ${maxRetries} intentos`
        };
    }

    // ============================================
    // EMAILS DE ESTADO DE PEDIDO
    // ============================================

    /**
     * Email: Pedido Confirmado
     */
    async enviarEmailPedidoConfirmado(pedido) {
        try {
            const subject = emailConfig.templates.pedidoConfirmado.subject;
            const htmlContent = this.generarHtmlPedidoConfirmado(pedido);

            return await this.sendEmailWithRetry(
                pedido.cliente_email,
                subject,
                htmlContent
            );
        } catch (error) {
            logger.error('Error enviando email de pedido confirmado:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Email: Pedido en Procesamiento
     */
    async enviarEmailPedidoProcesando(pedido) {
        try {
            const subject = emailConfig.templates.pedidoProcesando.subject;
            const htmlContent = this.generarHtmlPedidoProcesando(pedido);

            return await this.sendEmailWithRetry(
                pedido.cliente_email,
                subject,
                htmlContent
            );
        } catch (error) {
            logger.error('Error enviando email de pedido en procesamiento:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Email: Pedido Enviado
     */
    async enviarEmailPedidoEnviado(pedido) {
        try {
            const subject = emailConfig.templates.pedidoEnviado.subject;
            const htmlContent = this.generarHtmlPedidoEnviado(pedido);

            return await this.sendEmailWithRetry(
                pedido.cliente_email,
                subject,
                htmlContent
            );
        } catch (error) {
            logger.error('Error enviando email de pedido enviado:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Email: Pedido Entregado
     */
    async enviarEmailPedidoEntregado(pedido) {
        try {
            const subject = emailConfig.templates.pedidoEntregado.subject;
            const htmlContent = this.generarHtmlPedidoEntregado(pedido);

            return await this.sendEmailWithRetry(
                pedido.cliente_email,
                subject,
                htmlContent
            );
        } catch (error) {
            logger.error('Error enviando email de pedido entregado:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Email: Pedido Cancelado
     */
    async enviarEmailPedidoCancelado(pedido, motivo) {
        try {
            const subject = emailConfig.templates.pedidoCancelado.subject;
            const htmlContent = this.generarHtmlPedidoCancelado(pedido, motivo);

            return await this.sendEmailWithRetry(
                pedido.cliente_email,
                subject,
                htmlContent
            );
        } catch (error) {
            logger.error('Error enviando email de pedido cancelado:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // GENERADORES DE HTML
    // ============================================

    generarHtmlPedidoConfirmado(pedido) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #000; color: #fff; padding: 20px; text-align: center; }
                    .content { background: #fff; padding: 30px; border: 1px solid #e5e5e5; }
                    .order-info { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .button { display: inline-block; background: #FF6B35; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #767676; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>SPORTIVA</h1>
                    </div>
                    <div class="content">
                        <h2>✅ ¡Pedido Confirmado!</h2>
                        <p>Hola <strong>${pedido.cliente_nombre} ${pedido.cliente_apellido}</strong>,</p>
                        <p>Tu pedido ha sido confirmado y está siendo preparado.</p>
                        
                        <div class="order-info">
                            <p><strong>Número de Pedido:</strong> ${pedido.numero_pedido}</p>
                            <p><strong>Fecha:</strong> ${new Date(pedido.fecha_pedido).toLocaleDateString('es-PE')}</p>
                            <p><strong>Total:</strong> S/ ${parseFloat(pedido.total).toFixed(2)}</p>
                            <p><strong>Método de Pago:</strong> ${pedido.metodo_pago}</p>
                        </div>

                        <p>Te notificaremos cuando tu pedido sea enviado.</p>
                        
                        <p style="text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:5500'}/mis-pedidos.html" class="button">Ver Mi Pedido</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Sportiva E-Commerce. Todos los derechos reservados.</p>
                        <p>Este es un correo automático, por favor no responder.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generarHtmlPedidoProcesando(pedido) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #000; color: #fff; padding: 20px; text-align: center; }
                    .content { background: #fff; padding: 30px; border: 1px solid #e5e5e5; }
                    .order-info { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .footer { text-align: center; padding: 20px; color: #767676; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>SPORTIVA</h1>
                    </div>
                    <div class="content">
                        <h2>📦 Tu pedido está en proceso</h2>
                        <p>Hola <strong>${pedido.cliente_nombre} ${pedido.cliente_apellido}</strong>,</p>
                        <p>Tu pedido está siendo preparado por nuestro equipo.</p>
                        
                        <div class="order-info">
                            <p><strong>Número de Pedido:</strong> ${pedido.numero_pedido}</p>
                            <p><strong>Estado:</strong> En Procesamiento</p>
                        </div>

                        <p>Pronto recibirás la confirmación de envío.</p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Sportiva E-Commerce. Todos los derechos reservados.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generarHtmlPedidoEnviado(pedido) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #000; color: #fff; padding: 20px; text-align: center; }
                    .content { background: #fff; padding: 30px; border: 1px solid #e5e5e5; }
                    .order-info { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .tracking { background: #FF6B35; color: #fff; padding: 10px; text-align: center; font-weight: bold; border-radius: 4px; margin: 15px 0; }
                    .footer { text-align: center; padding: 20px; color: #767676; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>SPORTIVA</h1>
                    </div>
                    <div class="content">
                        <h2>🚚 ¡Tu pedido ha sido enviado!</h2>
                        <p>Hola <strong>${pedido.cliente_nombre} ${pedido.cliente_apellido}</strong>,</p>
                        <p>¡Buenas noticias! Tu pedido está en camino.</p>
                        
                        <div class="order-info">
                            <p><strong>Número de Pedido:</strong> ${pedido.numero_pedido}</p>
                            <p><strong>Estado:</strong> Enviado</p>
                        </div>

                        <div class="tracking">
                            Código de Seguimiento: ${pedido.numero_pedido}
                        </div>

                        <p>Tiempo estimado de entrega: 2-3 días hábiles</p>
                        <p><strong>Dirección de envío:</strong><br>
                        ${pedido.direccion}<br>
                        ${pedido.ciudad}, ${pedido.departamento}</p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Sportiva E-Commerce. Todos los derechos reservados.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generarHtmlPedidoEntregado(pedido) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #000; color: #fff; padding: 20px; text-align: center; }
                    .content { background: #fff; padding: 30px; border: 1px solid #e5e5e5; }
                    .order-info { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .success { background: #4CAF50; color: #fff; padding: 15px; text-align: center; border-radius: 4px; margin: 15px 0; }
                    .footer { text-align: center; padding: 20px; color: #767676; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>SPORTIVA</h1>
                    </div>
                    <div class="content">
                        <h2>🎉 ¡Tu pedido ha sido entregado!</h2>
                        <p>Hola <strong>${pedido.cliente_nombre} ${pedido.cliente_apellido}</strong>,</p>
                        
                        <div class="success">
                            ✅ Pedido entregado exitosamente
                        </div>

                        <div class="order-info">
                            <p><strong>Número de Pedido:</strong> ${pedido.numero_pedido}</p>
                            <p><strong>Fecha de entrega:</strong> ${new Date().toLocaleDateString('es-PE')}</p>
                        </div>

                        <p>Esperamos que disfrutes tu compra. ¡Gracias por confiar en Sportiva!</p>
                        <p>Si tienes algún problema con tu pedido, no dudes en contactarnos.</p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Sportiva E-Commerce. Todos los derechos reservados.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generarHtmlPedidoCancelado(pedido, motivo) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #000; color: #fff; padding: 20px; text-align: center; }
                    .content { background: #fff; padding: 30px; border: 1px solid #e5e5e5; }
                    .order-info { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .warning { background: #F44336; color: #fff; padding: 15px; text-align: center; border-radius: 4px; margin: 15px 0; }
                    .footer { text-align: center; padding: 20px; color: #767676; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>SPORTIVA</h1>
                    </div>
                    <div class="content">
                        <h2>❌ Pedido Cancelado</h2>
                        <p>Hola <strong>${pedido.cliente_nombre} ${pedido.cliente_apellido}</strong>,</p>
                        
                        <div class="warning">
                            Tu pedido ha sido cancelado
                        </div>

                        <div class="order-info">
                            <p><strong>Número de Pedido:</strong> ${pedido.numero_pedido}</p>
                            <p><strong>Motivo:</strong> ${motivo || 'No especificado'}</p>
                        </div>

                        <p>Si el pago ya fue procesado, el reembolso se realizará en un plazo de 5-7 días hábiles.</p>
                        <p>Si tienes alguna duda, contáctanos.</p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Sportiva E-Commerce. Todos los derechos reservados.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // ============================================
    // UTILIDADES
    // ============================================

    /**
     * Eliminar tags HTML de un string
     */
    stripHtml(html) {
        return html.replace(/<[^>]*>/g, '');
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Verificar configuración de email
     */
    async verifyConnection() {
        try {
            if (!emailConfig.options.enabled) {
                return {
                    success: false,
                    message: 'Servicio de email deshabilitado'
                };
            }

            if (!this.transporter) {
                return {
                    success: false,
                    message: 'Transportador no inicializado'
                };
            }

            await this.transporter.verify();
            
            return {
                success: true,
                message: 'Conexión SMTP verificada exitosamente'
            };
        } catch (error) {
            return {
                success: false,
                message: `Error en conexión SMTP: ${error.message}`
            };
        }
    }
}

module.exports = new EmailService();
