// ============================================
// PEDIDO ADMIN CONTROLLER - Endpoints Admin
// ============================================

const pedidoAdminService = require('../services/pedidoAdminService');
const logger = require('../utils/logger');

class PedidoAdminController {
    
    // ============================================
    // LISTADO DE PEDIDOS
    // ============================================

    /**
     * GET /api/pedidos/admin/list
     * Obtener todos los pedidos (paginado y con filtros)
     */
    async listarTodosPedidos(req, res) {
        try {
            const filtros = {
                estado_pedido: req.query.estado,
                fecha_desde: req.query.fecha_desde,
                fecha_hasta: req.query.fecha_hasta,
                busqueda: req.query.busqueda,
                ordenar_por: req.query.ordenar_por,
                orden: req.query.orden
            };

            const pagination = {
                page: req.query.page,
                limit: req.query.limit
            };

            const resultado = await pedidoAdminService.obtenerTodosPedidos(filtros, pagination);

            if (!resultado.success) {
                return res.status(resultado.statusCode || 500).json(resultado);
            }

            res.status(200).json(resultado);

        } catch (error) {
            logger.error('Error en listarTodosPedidos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener pedidos'
            });
        }
    }

    // ============================================
    // DETALLE DE PEDIDO
    // ============================================

    /**
     * GET /api/pedidos/admin/:id
     * Obtener detalle completo de un pedido
     */
    async obtenerDetallePedido(req, res) {
        try {
            const { id } = req.params;

            const resultado = await pedidoAdminService.obtenerDetallePedido(id);

            if (!resultado.success) {
                return res.status(resultado.statusCode || 500).json(resultado);
            }

            res.status(200).json(resultado);

        } catch (error) {
            logger.error('Error en obtenerDetallePedido:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener detalle del pedido'
            });
        }
    }

    // ============================================
    // CAMBIAR ESTADO
    // ============================================

    /**
     * PATCH /api/pedidos/admin/:id/estado
     * Cambiar estado del pedido
     */
    async cambiarEstado(req, res) {
        try {
            const { id } = req.params;
            const { nuevo_estado } = req.body;
            const id_trabajador = req.trabajador.id;

            if (!nuevo_estado) {
                return res.status(400).json({
                    success: false,
                    message: 'El campo nuevo_estado es requerido'
                });
            }

            const resultado = await pedidoAdminService.cambiarEstadoPedido(
                id,
                nuevo_estado,
                id_trabajador
            );

            if (!resultado.success) {
                return res.status(resultado.statusCode || 500).json(resultado);
            }

            res.status(200).json(resultado);

        } catch (error) {
            logger.error('Error en cambiarEstado:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cambiar estado del pedido'
            });
        }
    }

    // ============================================
    // ANULAR PEDIDO
    // ============================================

    /**
     * POST /api/pedidos/admin/:id/anular
     * Anular pedido con motivo
     */
    async anularPedido(req, res) {
        try {
            const { id } = req.params;
            const { motivo } = req.body;
            const id_trabajador = req.trabajador.id;

            if (!motivo) {
                return res.status(400).json({
                    success: false,
                    message: 'El motivo de anulación es requerido'
                });
            }

            const resultado = await pedidoAdminService.anularPedido(
                id,
                motivo,
                id_trabajador
            );

            if (!resultado.success) {
                return res.status(resultado.statusCode || 500).json(resultado);
            }

            res.status(200).json(resultado);

        } catch (error) {
            logger.error('Error en anularPedido:', error);
            res.status(500).json({
                success: false,
                message: 'Error al anular pedido'
            });
        }
    }

    // ============================================
    // ACTUALIZAR DIRECCIÓN
    // ============================================

    /**
     * PATCH /api/pedidos/admin/:id/direccion
     * Actualizar dirección de envío
     */
    async actualizarDireccion(req, res) {
        try {
            const { id } = req.params;
            const nuevaDireccion = req.body;
            const id_trabajador = req.trabajador.id;

            // Validar campos requeridos
            if (!nuevaDireccion.direccion_linea1 || !nuevaDireccion.distrito) {
                return res.status(400).json({
                    success: false,
                    message: 'Los campos direccion_linea1 y distrito son requeridos'
                });
            }

            const resultado = await pedidoAdminService.actualizarDireccionEnvio(
                id,
                nuevaDireccion,
                id_trabajador
            );

            if (!resultado.success) {
                return res.status(resultado.statusCode || 500).json(resultado);
            }

            res.status(200).json(resultado);

        } catch (error) {
            logger.error('Error en actualizarDireccion:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar dirección'
            });
        }
    }

    // ============================================
    // ESTADÍSTICAS
    // ============================================

    /**
     * GET /api/pedidos/admin/stats
     * Obtener estadísticas de pedidos
     */
    async obtenerEstadisticas(req, res) {
        try {
            const filtros = {
                fecha_desde: req.query.fecha_desde,
                fecha_hasta: req.query.fecha_hasta
            };

            const resultado = await pedidoAdminService.obtenerEstadisticas(filtros);

            if (!resultado.success) {
                return res.status(resultado.statusCode || 500).json(resultado);
            }

            res.status(200).json(resultado);

        } catch (error) {
            logger.error('Error en obtenerEstadisticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas'
            });
        }
    }

    // ============================================
    // EXPORTAR
    // ============================================

    /**
     * GET /api/pedidos/admin/export/pdf
     * Exportar pedidos a PDF
     */
    async exportarPDF(req, res) {
        try {
            const filtros = {
                fecha_desde: req.query.fecha_desde,
                fecha_hasta: req.query.fecha_hasta
            };

            const resultado = await pedidoAdminService.exportarPedidosPDF(filtros);

            if (!resultado.success) {
                return res.status(resultado.statusCode || 500).json(resultado);
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${resultado.data.filename}"`);
            
            // Enviar PDF como descarga
            res.send(resultado.data.buffer);

        } catch (error) {
            logger.error('Error controller PDF:', error);
            res.status(500).json({ success: false, message: 'Error al exportar PDF' });
        }
    }


    /**
     * GET /api/pedidos/admin/export/csv
     * Exportar pedidos a CSV
     */
    async exportarCSV(req, res) {
        try {
            const filtros = {
                estado_pedido: req.query.estado,
                fecha_desde: req.query.fecha_desde,
                fecha_hasta: req.query.fecha_hasta
            };

            const resultado = await pedidoAdminService.exportarPedidosCSV(filtros);

            if (!resultado.success) {
                return res.status(resultado.statusCode || 500).json(resultado);
            }

            // Enviar CSV como descarga
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${resultado.data.filename}"`);
            res.status(200).send(resultado.data.csv);

        } catch (error) {
            logger.error('Error en exportarCSV:', error);
            res.status(500).json({
                success: false,
                message: 'Error al exportar pedidos'
            });
        }
    }
}

module.exports = new PedidoAdminController();
