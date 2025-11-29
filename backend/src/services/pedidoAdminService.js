// ============================================
// PEDIDO ADMIN SERVICE - Lógica de Negocio Admin
// ============================================

const Pedido = require('../models/Pedido');
const Cliente = require('../models/Cliente');
const emailService = require('./emailService');
const logger = require('../utils/logger');
const PDFGenerator = require('../utils/pdfGenerator');

class PedidoAdminService {
    constructor() {
        this.pedidoModel = new Pedido();
        this.clienteModel = new Cliente();
    }

    // ============================================
    // LISTADO DE PEDIDOS (ADMIN)
    // ============================================

    /**
     * Obtener todos los pedidos con filtros y paginación
     */
    async obtenerTodosPedidos(filtros = {}, pagination = {}) {
        try {
            const page = parseInt(pagination.page) || 1;
            const limit = parseInt(pagination.limit) || 20;
            const offset = (page - 1) * limit;

            let query = `
                SELECT 
                    p.id_pedido,
                    p.numero_pedido,
                    p.fecha_pedido,
                    p.estado_pedido,
                    p.total_pedido,
                    MAX(pg.metodo_pago) as metodo_pago,
                    CONCAT(c.nombre, ' ', c.apellido) as cliente_nombre,
                    c.email as cliente_email,
                    c.telefono as cliente_telefono,
                    COUNT(dp.id_detalle_pedido) as cantidad_items  -- <--- NUEVO CAMPO
                FROM PEDIDO p
                INNER JOIN CLIENTE c ON p.id_cliente = c.id_cliente
                LEFT JOIN PAGO pg ON p.id_pedido = pg.id_pedido
                LEFT JOIN DETALLE_PEDIDO dp ON p.id_pedido = dp.id_pedido -- <--- NUEVO JOIN
                WHERE 1=1
            `;

            const params = [];
            // Filtros
            if (filtros.estado_pedido && filtros.estado_pedido !== '') {
                query += ` AND p.estado_pedido = ?`;
                params.push(filtros.estado_pedido);
            }

            if (filtros.fecha_desde) {
                query += ` AND DATE(p.fecha_pedido) >= ?`;
                params.push(filtros.fecha_desde);
            }

            if (filtros.fecha_hasta) {
                query += ` AND DATE(p.fecha_pedido) <= ?`;
                params.push(filtros.fecha_hasta);
            }

            if (filtros.busqueda) {
                query += ` AND (
                    p.numero_pedido LIKE ? OR
                    CONCAT(c.nombre, ' ', c.apellido) LIKE ? OR
                    c.email LIKE ?
                )`;
                const searchTerm = `%${filtros.busqueda}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            // Agrupamos por pedido para evitar duplicados por los pagos
            query += ` GROUP BY p.id_pedido, p.numero_pedido, p.fecha_pedido, p.estado_pedido, p.total_pedido, c.nombre, c.apellido, c.email, c.telefono`;

            // Ordenamiento
            const ordenarPor = filtros.ordenar_por || 'fecha_pedido';
            const orden = filtros.orden === 'asc' ? 'ASC' : 'DESC';
            
            const colsValidas = ['fecha_pedido', 'total_pedido', 'estado_pedido', 'numero_pedido'];
            const colOrden = colsValidas.includes(ordenarPor) ? ordenarPor : 'fecha_pedido';

            query += ` ORDER BY p.${colOrden} ${orden}`;
            query += ` LIMIT ${limit} OFFSET ${offset}`;

            // Ejecutar consulta principal
            const [pedidos] = await this.pedidoModel.db.execute(query, params);

            let countQuery = `
                SELECT COUNT(DISTINCT p.id_pedido) as total
                FROM PEDIDO p
                INNER JOIN CLIENTE c ON p.id_cliente = c.id_cliente
                LEFT JOIN PAGO pg ON p.id_pedido = pg.id_pedido
                WHERE 1=1
            `;

            const countParams = [];
            if (filtros.estado_pedido && filtros.estado_pedido !== '') {
                countQuery += ` AND p.estado_pedido = ?`;
                countParams.push(filtros.estado_pedido);
            }
            if (filtros.fecha_desde) {
                countQuery += ` AND DATE(p.fecha_pedido) >= ?`;
                countParams.push(filtros.fecha_desde);
            }
            if (filtros.fecha_hasta) {
                countQuery += ` AND DATE(p.fecha_pedido) <= ?`;
                countParams.push(filtros.fecha_hasta);
            }
            if (filtros.busqueda) {
                countQuery += ` AND (
                    p.numero_pedido LIKE ? OR
                    CONCAT(c.nombre, ' ', c.apellido) LIKE ? OR
                    c.email LIKE ?
                )`;
                const searchTerm = `%${filtros.busqueda}%`;
                countParams.push(searchTerm, searchTerm, searchTerm);
            }

            const [countResult] = await this.pedidoModel.db.execute(countQuery, countParams);
            const total = countResult[0].total;

            return {
                success: true,
                data: {
                    pedidos,
                    pagination: {
                        page,
                        limit,
                        total,
                        total_pages: Math.ceil(total / limit)
                    }
                }
            };

        } catch (error) {
            logger.error('Error obteniendo todos los pedidos:', error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error al obtener pedidos: ' + error.message
            };
        }
    }

    // ============================================
    // DETALLE DE PEDIDO (ADMIN)
    // ============================================

    /**
     * Obtener detalle completo de un pedido (sin restricción de cliente)
     */
    async obtenerDetallePedido(id_pedido) {
        try {
            const pedido = await this.pedidoModel.findByIdWithDetails(id_pedido);

            if (!pedido) {
                return {
                    success: false,
                    statusCode: 404,
                    message: 'Pedido no encontrado'
                };
            }

            return {
                success: true,
                data: { pedido }
            };

        } catch (error) {
            logger.error('Error obteniendo detalle del pedido:', error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error al obtener el pedido'
            };
        }
    }

    // ============================================
    // CAMBIAR ESTADO DE PEDIDO (ADMIN)
    // ============================================

    /**
     * Cambiar estado del pedido y enviar email
     */
    async cambiarEstadoPedido(id_pedido, nuevoEstado, id_trabajador) {
        try {
            const estadoNormalizado = nuevoEstado.charAt(0).toUpperCase() + nuevoEstado.slice(1).toLowerCase();
        
            const estadosValidos = ['Pendiente', 'Procesando', 'Enviado', 'Entregado', 'Cancelado'];
        
            if (!estadosValidos.includes(estadoNormalizado)) {
                return {
                    success: false,
                    statusCode: 400,
                    message: `Estado inválido: ${nuevoEstado}`
                };
            }

            // Obtener pedido actual
            const pedido = await this.pedidoModel.findByIdWithDetails(id_pedido);

            if (!pedido) {
                return {
                    success: false,
                    statusCode: 404,
                    message: 'Pedido no encontrado'
                };
            }

            // Validar transiciones
            const transicionPermitida = this.validarTransicionEstado(pedido.estado, nuevoEstado);

            if (!transicionPermitida.valido) {
                return {
                    success: false,
                    statusCode: 400,
                    message: transicionPermitida.mensaje
                };
            }

            // Actualizar estado
            await this.pedidoModel.updateEstado(id_pedido, estadoNormalizado);

            logger.info(`Pedido ${id_pedido} actualizado a ${nuevoEstado} por trabajador ${id_trabajador}`);

            // Enviar email
            this.enviarEmailCambioEstado(pedido, estadoNormalizado).catch(err => 
                logger.error('Error enviando email (background):', err)
            );

            return {
                success: true,
                message: `Estado del pedido actualizado a: ${estadoNormalizado}`,
                data: {
                    id_pedido,
                    nuevo_estado: estadoNormalizado
                }
            };

        } catch (error) {
            logger.error('Error cambiando estado del pedido:', error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error al cambiar estado del pedido: ' + error.message
            };
        }
    }

    /**
     * Validar si una transición de estado es permitida
     */
    validarTransicionEstado(estadoActual, nuevoEstado) {
        const estadoActualNorm = estadoActual ? estadoActual.charAt(0).toUpperCase() + estadoActual.slice(1).toLowerCase() : '';
        const nuevoEstadoNorm = nuevoEstado.charAt(0).toUpperCase() + nuevoEstado.slice(1).toLowerCase();
        
        if (estadoActualNorm === nuevoEstadoNorm) {
            return { valido: false, mensaje: 'El pedido ya está en ese estado' };
        }

        const transicionesPermitidas = {
            'Pendiente': ['Procesando', 'Cancelado'],
            'Procesando': ['Enviado', 'Cancelado'],
            'Enviado': ['Entregado'],
            'Entregado': [],
            'Cancelado': []
        };

        const permitidas = transicionesPermitidas[estadoActualNorm] || [];

        if (!permitidas.includes(nuevoEstadoNorm)) {
            return {
                valido: false,
                mensaje: `No se puede cambiar de "${estadoActualNorm}" a "${nuevoEstadoNorm}"`
            };
        }

        return { valido: true };
    }

    /**
     * Enviar email según cambio de estado
     */
    async enviarEmailCambioEstado(pedido, nuevoEstado) {
        try {
            switch (nuevoEstado) {
                case 'Procesando': 
                    await emailService.enviarEmailPedidoProcesando(pedido); 
                    break;
                case 'Enviado': 
                    await emailService.enviarEmailPedidoEnviado(pedido); 
                    break;
                case 'Entregado': 
                    await emailService.enviarEmailPedidoEntregado(pedido); 
                    break;
            }
        } catch (error) {
            logger.error('Error enviando email de estado:', error);
        }
    }

    // ============================================
    // ANULAR PEDIDO (ADMIN)
    // ============================================

    /**
     * Anular pedido con motivo y devolución de stock
     */
    async anularPedido(id_pedido, motivo, id_trabajador) {
        try {
            // Obtener pedido
            const pedido = await this.pedidoModel.findByIdWithDetails(id_pedido);

            if (!pedido) {
                return {
                    success: false,
                    statusCode: 404,
                    message: 'Pedido no encontrado'
                };
            }

            // Validar que el pedido pueda ser anulado
            if (['entregado', 'cancelado'].includes(pedido.estado)) {
                return {
                    success: false,
                    statusCode: 400,
                    message: `No se puede anular un pedido en estado: ${pedido.estado}`
                };
            }

            // Cancelar pedido y devolver stock
            const resultado = await this.pedidoModel.cancelPedido(id_pedido, motivo);

            if (!resultado.success) {
                return {
                    success: false,
                    statusCode: 500,
                    message: resultado.message || 'Error al anular el pedido'
                };
            }

            logger.info(`Pedido ${id_pedido} anulado por trabajador ${id_trabajador}. Motivo: ${motivo}`);

            // Enviar email de cancelación
            await emailService.enviarEmailPedidoCancelado(pedido, motivo);

            return {
                success: true,
                message: 'Pedido anulado exitosamente. Stock restaurado.',
                data: {
                    id_pedido,
                    motivo
                }
            };

        } catch (error) {
            logger.error('Error anulando pedido:', error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error al anular el pedido'
            };
        }
    }

    // ============================================
    // EDITAR DIRECCIÓN DE ENVÍO (ADMIN)
    // ============================================

    /**
     * Actualizar dirección de envío de un pedido
     */
    async actualizarDireccionEnvio(id_pedido, nuevaDireccion, id_trabajador) {
        try {
            // Obtener pedido actual
            const pedido = await this.pedidoModel.findByIdWithDetails(id_pedido);

            if (!pedido) {
                return {
                    success: false,
                    statusCode: 404,
                    message: 'Pedido no encontrado'
                };
            }

            const estadosNoModificables = ['Enviado', 'Entregado', 'Cancelado'];
            if (estadosNoModificables.includes(pedido.estado)) {
                return {
                    success: false,
                    statusCode: 400,
                    message: `No se puede modificar la dirección de un pedido en estado: ${pedido.estado}`
                };
            }

            // Actualizar dirección
            await this.pedidoModel.updateDireccionEnvio(id_pedido, nuevaDireccion);

            logger.info(`Dirección del pedido ${id_pedido} actualizada por trabajador ${id_trabajador}`);

            return {
                success: true,
                message: 'Dirección de envío actualizada exitosamente',
                data: {
                    id_pedido,
                    direccion: nuevaDireccion
                }
            };

        } catch (error) {
            logger.error('Error actualizando dirección de envío:', error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error al actualizar dirección de envío'
            };
        }
    }

    // ============================================
    // ESTADÍSTICAS (ADMIN)
    // ============================================

    /**
     * Obtener estadísticas generales de pedidos
     */
    async obtenerEstadisticas(filtros = {}) {
        try {
            const stats = await this.pedidoModel.getStats(filtros);

            return {
                success: true,
                data: stats
            };

        } catch (error) {
            logger.error('Error obteniendo estadísticas:', error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error al obtener estadísticas'
            };
        }
    }

    // ============================================
    // EXPORTAR PEDIDOS
    // ============================================

    /**
     * Generar ventas en PDF
     */
    async exportarPedidosPDF(filtros = {}) {
        try {
            const resultado = await this.obtenerTodosPedidos(filtros, { limit: 10000 });

            if (!resultado.success) return resultado;

            const pedidos = resultado.data.pedidos;

            const fechaInicio = filtros.fecha_desde || 'Inicio';
            const fechaFin = filtros.fecha_hasta || 'Actualidad';
            const pdfBuffer = await PDFGenerator.generarReporteVentas(pedidos, fechaInicio, fechaFin);

            return {
                success: true,
                data: {
                    buffer: pdfBuffer,
                    filename: `Reporte_Ventas_${new Date().toISOString().split('T')[0]}.pdf`
                }
            };
        } catch (error) {
            logger.error('Error servicio PDF:', error);
            return { success: false, statusCode: 500, message: 'Error al generar PDF' };
        }
    }

    /**
     * Exportar pedidos a CSV
     */
    async exportarPedidosCSV(filtros = {}) {
        try {
            const resultado = await this.obtenerTodosPedidos(filtros, { limit: 10000 });

            if (!resultado.success) {
                return resultado;
            }

            const pedidos = resultado.data.pedidos;

            // Generar CSV
            let csv = 'ID,Número Pedido,Cliente,Email,Fecha,Estado,Total,Método Pago\n';

            pedidos.forEach(pedido => {
                csv += `${pedido.id_pedido},${pedido.numero_pedido},"${pedido.cliente_nombre}",${pedido.cliente_email},${pedido.fecha_pedido},${pedido.estado_pedido},${pedido.total_pedido},${pedido.metodo_pago}\n`;
            });

            return {
                success: true,
                data: {
                    csv,
                    filename: `pedidos_${new Date().toISOString().split('T')[0]}.csv`
                }
            };

        } catch (error) {
            logger.error('Error exportando pedidos a CSV:', error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error al exportar pedidos'
            };
        }
    }
}

module.exports = new PedidoAdminService();
