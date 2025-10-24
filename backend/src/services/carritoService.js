// ============================================
// CARRITO SERVICE - SOLID Principles
// ============================================

const { Carrito, Producto } = require('../models'); // Solo modelos necesarios aquí
const db = require('../config/database'); // Importar pool para transacciones
const logger = require('../utils/logger'); // Para logging detallado
// Asumiendo que constants.js exporta directamente los valores
const { IGV, COSTO_ENVIO_LIMA, COSTO_ENVIO_PROVINCIAS } = require('../config/constants');

/**
 * CarritoService - Responsabilidad única: Lógica de negocio del carrito
 */
class CarritoService {
    constructor() {
        this.carritoModel = Carrito;
        this.productoModel = Producto;
        // Quitar Pedido y Pago si no se usan directamente aquí
        // this.pedidoModel = Pedido;
        // this.pagoModel = Pago;
        this.db = db; // Guardar referencia al pool de DB
    }

    // ============================================
    // OBTENER CARRITO
    // ============================================

    /**
     * Obtener carrito del cliente con todos los detalles y validación de stock.
     */
    async getCarrito(id_cliente) {
        try {
            const carrito = await this.carritoModel.getCarritoWithItems(id_cliente);

            // Manejar caso de carrito no encontrado o vacío
            if (!carrito || !carrito.items || carrito.items.length === 0) {
                return {
                    success: true,
                    data: {
                        carrito_vacio: true,
                        items: [],
                        totales: this.getEmptyCartTotals(), // Devolver totales vacíos
                        stock_validation: { valid: true, unavailableItems: [] } // Vacío es válido
                    }
                };
            }

            // Calcular totales detallados (envío, IGV)
            // Asumiendo que el cliente tiene una dirección o usamos Lima por defecto
            const departamentoCliente = 'Lima'; // TODO: Obtener de la dirección principal del cliente si existe
            const totales = await this.calculateDetailedTotals(
                carrito.id_carrito,
                departamentoCliente
            );

            // Validar stock de todos los items en el carrito actual
            const stockValidation = await this.carritoModel.validateStock(carrito.id_carrito);

            return {
                success: true,
                data: {
                    carrito_vacio: false,
                    id_carrito: carrito.id_carrito,
                    // Enriquecer items con info adicional formateada y de stock
                    items: carrito.items.map(item => this.enrichCartItem(item)),
                    totales,
                    stock_validation: stockValidation,
                    // Indicar si puede proceder al checkout basado en stock
                    puede_procesar: stockValidation.valid
                }
            };
        } catch (error) {
            logger.error(`Error obteniendo carrito para cliente ${id_cliente}`, error);
            // Devolver error controlado
            return {
                 success: false,
                 statusCode: 500,
                 message: 'Error interno al obtener el carrito.'
            };
            // throw new Error(`Error obteniendo carrito: ${error.message}`); // O relanzar
        }
    }

    // ============================================
    // AGREGAR AL CARRITO - Modificado para aceptar id_talla
    // ============================================

    /**
     * Agregar producto al carrito.
     * @param {number} id_cliente
     * @param {object} itemData - { id_producto: number, id_talla: number|null, cantidad: number }
     */
    async addItem(id_cliente, itemData) {
        let connection; // Para transacción
        try {
            // Validar datos de entrada básicos
            const validation = this.validateCartItemData(itemData); // Renombrar para claridad
            if (!validation.valid) {
                return { success: false, statusCode: 400, message: validation.message };
            }

            // Iniciar transacción
            connection = await this.db.getConnection();
            await connection.beginTransaction();

            // 1. Verificar que el producto existe y está activo (dentro de la transacción)
            const producto = await this.productoModel.findById(itemData.id_producto); // Asumiendo findById existe
             if (!producto || producto.estado_producto !== 'Activo') { // Usar columna correcta 'estado_producto'
                await connection.rollback(); // Liberar transacción
                return { success: false, statusCode: 404, message: 'Producto no disponible.' };
            }


            // 2. Determinar el id_talla_producto correcto y verificar stock
            let idTallaProducto;
            let stockCheckResult;

            if (producto.tiene_tallas) {
                if (!itemData.id_talla) {
                    await connection.rollback();
                    return { success: false, statusCode: 400, message: 'Debe seleccionar una talla para este producto.' };
                }
                // Usar checkStock con el id_talla proporcionado
                 // checkStock ahora debe buscar por id_talla, no por nombre
                 stockCheckResult = await this.checkStockInTransaction(connection, itemData.id_producto, itemData.id_talla, itemData.cantidad);
                 if (!stockCheckResult.found) {
                     await connection.rollback();
                     return { success: false, statusCode: 404, message: 'Talla no encontrada para este producto.' };
                 }
                 idTallaProducto = itemData.id_talla; // Ya tenemos el ID correcto

            } else {
                 // Producto sin tallas -> Buscar ID de talla 'UNICA'
                 const tallaUnicaQuery = 'SELECT id_talla, stock_talla FROM TALLA_PRODUCTO WHERE id_producto = ? AND talla = "UNICA"';
                 const [tallaUnicaRows] = await connection.execute(tallaUnicaQuery, [itemData.id_producto]);
                 if (tallaUnicaRows.length === 0) {
                     await connection.rollback();
                     // Esto es un error de datos si el trigger no funcionó
                     logger.error(`Falta talla UNICA para producto ${itemData.id_producto} sin tallas`);
                     return { success: false, statusCode: 500, message: 'Error de configuración de stock.' };
                 }
                 idTallaProducto = tallaUnicaRows[0].id_talla;
                 // Verificar stock de UNICA
                  stockCheckResult = {
                      available: tallaUnicaRows[0].stock_talla >= itemData.cantidad,
                      stock: tallaUnicaRows[0].stock_talla,
                      id_talla: idTallaProducto,
                      found: true
                  };
            }

             // 3. Validar stock
             if (!stockCheckResult.available) {
                await connection.rollback();
                return {
                    success: false,
                    statusCode: 409, // Conflict
                    message: `Stock insuficiente. Solo quedan ${stockCheckResult.stock} unidades disponibles.`
                };
            }

            // 4. Obtener o crear carrito del cliente (dentro de la transacción)
            const carrito = await this.carritoModel.getOrCreateCarrito(id_cliente); // Asumiendo que esto no necesita la conexión
            const idCarrito = carrito.id_carrito;

             // 5. Verificar si el item ya existe en el carrito (dentro de la transacción)
             const findExistingQuery = `SELECT id_detalle, cantidad FROM DETALLE_CARRITO WHERE id_carrito = ? AND id_talla = ? FOR UPDATE`;
             const [existingItems] = await connection.execute(findExistingQuery, [idCarrito, idTallaProducto]);
             const itemExistente = existingItems[0];


            if (itemExistente) {
                // Item existe -> Actualizar cantidad
                const nuevaCantidadTotal = itemExistente.cantidad + itemData.cantidad;

                // Re-verificar stock con la cantidad acumulada
                if (stockCheckResult.stock < nuevaCantidadTotal) {
                     await connection.rollback();
                     return {
                         success: false,
                         statusCode: 409,
                         message: `No se puede agregar ${itemData.cantidad} más. Solo quedan ${stockCheckResult.stock - itemExistente.cantidad} disponibles.`
                     };
                }

                const updateQuery = `UPDATE DETALLE_CARRITO SET cantidad = ?, subtotal = precio_unitario * ? WHERE id_detalle = ?`;
                await connection.execute(updateQuery, [nuevaCantidadTotal, nuevaCantidadTotal, itemExistente.id_detalle]);
                logger.debug(`Item actualizado en carrito ${idCarrito}: DetalleID ${itemExistente.id_detalle}, Nueva Cant ${nuevaCantidadTotal}`);

            } else {
                // Item no existe -> Insertar nuevo
                const precioUnitario = parseFloat(producto.precio); // Usar precio del producto
                const subtotal = precioUnitario * itemData.cantidad;
                const insertQuery = `INSERT INTO DETALLE_CARRITO (id_carrito, id_producto, id_talla, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?)`;
                await connection.execute(insertQuery, [
                    idCarrito,
                    itemData.id_producto,
                    idTallaProducto, // ID de la talla correcta
                    itemData.cantidad,
                    precioUnitario,
                    subtotal
                ]);
                 logger.debug(`Item insertado en carrito ${idCarrito}: Prod ${itemData.id_producto}, TallaID ${idTallaProducto}, Cant ${itemData.cantidad}`);
            }

            // 6. Confirmar transacción
            await connection.commit();

            // 7. Obtener carrito actualizado (fuera de la transacción)
            const carritoActualizado = await this.getCarrito(id_cliente);

            return {
                success: true,
                message: 'Producto agregado al carrito',
                data: carritoActualizado.data // Devolver el estado completo del carrito
            };

        } catch (error) {
            // Error durante el proceso, hacer rollback
            if (connection) {
                await connection.rollback();
            }
            logger.error(`Error agregando item para cliente ${id_cliente}`, error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error interno al agregar producto al carrito.'
            };
            // throw new Error(`Error agregando item: ${error.message}`);
        } finally {
            // Liberar conexión
             if (connection) {
                connection.release();
            }
        }
    }

     /** Helper: Verifica stock dentro de una transacción existente */
     async checkStockInTransaction(connection, id_producto, id_talla, cantidad) {
         try {
             const query = `SELECT stock_talla FROM TALLA_PRODUCTO WHERE id_talla = ? AND id_producto = ? FOR UPDATE`; // Bloquear fila
             const [rows] = await connection.execute(query, [id_talla, id_producto]);

             if (rows.length === 0) {
                 return { available: false, stock: 0, id_talla: id_talla, found: false };
             }

             const stockDisponible = rows[0].stock_talla;
             return {
                 available: stockDisponible >= cantidad,
                 stock: stockDisponible,
                 id_talla: id_talla,
                 found: true
             };
         } catch (error) {
              logger.error(`Error en checkStockInTransaction para Prod ${id_producto}, Talla ${id_talla}`, error);
              // Relanzar para que la transacción principal haga rollback
              throw error;
         }
     }


    // ============================================
    // ACTUALIZAR CARRITO
    // ============================================

    /**
     * Actualizar cantidad de un item (id_detalle)
     */
    async updateItemQuantity(id_cliente, id_detalle, nuevaCantidad) {
         let connection;
        try {
            // Validar cantidad
            if (nuevaCantidad < 1 || nuevaCantidad > 99) { // Límite práctico
                return { success: false, statusCode: 400, message: 'La cantidad debe estar entre 1 y 99.' };
            }

            connection = await this.db.getConnection();
            await connection.beginTransaction();

             // 1. Obtener info del item y verificar pertenencia al cliente (dentro de transacción)
             const itemQuery = `
                 SELECT dc.id_producto, dc.id_talla, dc.cantidad, c.id_cliente
                 FROM DETALLE_CARRITO dc
                 JOIN CARRITO c ON dc.id_carrito = c.id_carrito
                 WHERE dc.id_detalle = ? AND c.id_cliente = ? AND c.estado_carrito = 'Activo'
                 FOR UPDATE`; // Bloquear fila
             const [itemRows] = await connection.execute(itemQuery, [id_detalle, id_cliente]);

             if (itemRows.length === 0) {
                 await connection.rollback();
                 return { success: false, statusCode: 404, message: 'Item no encontrado en tu carrito.' };
             }
             const itemActual = itemRows[0];

            // 2. Verificar stock disponible para la nueva cantidad
             const stockCheckResult = await this.checkStockInTransaction(connection, itemActual.id_producto, itemActual.id_talla, nuevaCantidad);

             if (!stockCheckResult.found) { // Esto sería raro si el item existe en el carrito
                 await connection.rollback();
                  logger.error(`Talla ID ${itemActual.id_talla} no encontrada al actualizar item ${id_detalle}`);
                 return { success: false, statusCode: 500, message: 'Error de datos: Talla no encontrada.' };
             }

             if (!stockCheckResult.available) {
                await connection.rollback();
                return {
                    success: false,
                    statusCode: 409,
                    message: `Stock insuficiente. Solo quedan ${stockCheckResult.stock} unidades.`
                };
            }

            // 3. Actualizar cantidad en DB
            const updateResult = await this.carritoModel.updateItemQuantity(id_detalle, nuevaCantidad); // Usar método del modelo
             if (!updateResult.success) { // El método del modelo debería usar la transacción si se pasa `connection`
                 // Si updateItemQuantity no usa transacción, hay que hacerlo aquí:
                 // const updateQuery = `UPDATE DETALLE_CARRITO SET cantidad = ?, subtotal = precio_unitario * ? WHERE id_detalle = ?`;
                 // await connection.execute(updateQuery, [nuevaCantidad, nuevaCantidad, id_detalle]);
                  await connection.rollback(); // Asumiendo que falló
                  return { success: false, statusCode: 500, message: 'Error al actualizar la base de datos.' };
             }


            // 4. Confirmar transacción
            await connection.commit();

            // 5. Obtener carrito actualizado
            const carritoActualizado = await this.getCarrito(id_cliente);

            return {
                success: true,
                message: 'Cantidad actualizada',
                data: carritoActualizado.data
            };

        } catch (error) {
            if (connection) await connection.rollback();
            logger.error(`Error actualizando cantidad para cliente ${id_cliente}, item ${id_detalle}`, error);
             return { success: false, statusCode: 500, message: 'Error interno al actualizar cantidad.' };
            // throw new Error(`Error actualizando cantidad: ${error.message}`);
        } finally {
             if (connection) connection.release();
        }
    }

    /**
     * Eliminar item del carrito (por id_detalle)
     */
    async removeItem(id_cliente, id_detalle) {
        try {
            // Verificar que el item pertenece al cliente antes de eliminar
            // Usar método del modelo que podría hacer esta verificación
            const result = await this.carritoModel.removeItemByCliente(id_cliente, id_detalle); // Método hipotético

             // Si el modelo no verifica pertenencia, hacerlo aquí:
             /*
             const carrito = await this.carritoModel.getCarritoWithItems(id_cliente);
             const itemExists = carrito?.items?.some(i => i.id_detalle === id_detalle);
             if (!itemExists) {
                 return { success: false, statusCode: 404, message: 'Item no encontrado en tu carrito.' };
             }
             const result = await this.carritoModel.removeItem(id_detalle); // Método simple de eliminación
             */

            if (!result.success) {
                 // Podría ser que el item no se encontró
                 return {
                     success: false,
                     statusCode: 404, // Not Found si no se eliminó nada
                     message: result.message || 'Item no encontrado o no se pudo eliminar.'
                 };
            }

            // Obtener carrito actualizado (puede estar vacío)
            const carritoActualizado = await this.getCarrito(id_cliente);

            return {
                success: true,
                message: 'Producto eliminado del carrito',
                data: carritoActualizado.data
            };
        } catch (error) {
            logger.error(`Error eliminando item ${id_detalle} para cliente ${id_cliente}`, error);
             return { success: false, statusCode: 500, message: 'Error interno al eliminar item.' };
            // throw new Error(`Error eliminando item: ${error.message}`);
        }
    }


    /**
     * Vaciar carrito completo
     */
    async clearCarrito(id_cliente) {
        try {
            const carrito = await this.carritoModel.getOrCreateCarrito(id_cliente);
            if(!carrito) {
                 // Si getOrCreateCarrito puede devolver null (no debería)
                 return { success: true, message: 'No había carrito para vaciar.', data: { carrito_vacio: true, items: [], totales: this.getEmptyCartTotals() } };
            }
            const result = await this.carritoModel.clearCarrito(carrito.id_carrito); // Limpiar por ID de carrito

            return {
                success: true,
                message: 'Carrito vaciado',
                data: {
                    carrito_vacio: true,
                    items: [],
                    totales: this.getEmptyCartTotals()
                }
            };
        } catch (error) {
            logger.error(`Error vaciando carrito para cliente ${id_cliente}`, error);
             return { success: false, statusCode: 500, message: 'Error interno al vaciar carrito.' };
            // throw new Error(`Error vaciando carrito: ${error.message}`);
        }
    }

    // ============================================
    // SINCRONIZACIÓN DE CARRITO LOCAL <<< NUEVA FUNCIÓN >>>
    // ============================================
    /**
     * Sincroniza (fusiona) un carrito local (array de items) con el carrito del servidor.
     * @param {number} id_cliente ID del cliente logueado.
     * @param {Array} itemsLocal Array de items del localStorage [{ productoId, cantidad, tallaId }].
     * @returns {Promise<object>} Resultado de la operación.
     */
    async sincronizarCarritoDesdeLocal(id_cliente, itemsLocal) {
        let connection;
        try {
            connection = await this.db.getConnection();
            await connection.beginTransaction();
            logger.logDebug(`Iniciando transacción para sincronizar carrito Cliente ID: ${id_cliente}`);

            const carritoServidor = await this.carritoModel.getOrCreateCarrito(id_cliente);
            const idCarritoServidor = carritoServidor.id_carrito;

            const queryItemsServidor = `SELECT id_detalle, id_producto, id_talla, cantidad FROM DETALLE_CARRITO WHERE id_carrito = ? FOR UPDATE`;
            const [itemsServidorActuales] = await connection.execute(queryItemsServidor, [idCarritoServidor]);

            let itemsConProblemas = [];
            let itemsAgregados = 0;
            let itemsActualizados = 0;

            for (const itemLocal of itemsLocal) {
                const { productoId, cantidad, tallaId } = itemLocal; // tallaId puede ser null

                if (!productoId || !cantidad || cantidad < 1) {
                    logger.logWarning(`Item local inválido omitido: ${JSON.stringify(itemLocal)}`, { clienteId: id_cliente });
                    continue;
                }

                let productoInfo;
                let stockCheckResult;
                let idTallaProducto = tallaId; // Usar ID de talla si viene

                try {
                    productoInfo = await this.productoModel.findById(productoId);
                    if (!productoInfo || productoInfo.estado_producto !== 'Activo') {
                        itemsConProblemas.push({ ...itemLocal, motivo: 'Producto no disponible' });
                        continue;
                    }

                    // Determinar ID Talla Producto y verificar stock DENTRO de la transacción
                    if (productoInfo.tiene_tallas) {
                        if (!idTallaProducto) {
                             itemsConProblemas.push({ ...itemLocal, motivo: 'Falta ID de talla' });
                             continue;
                        }
                        stockCheckResult = await this.checkStockInTransaction(connection, productoId, idTallaProducto, 1); // Verificar si existe y obtener stock
                         if(!stockCheckResult.found) {
                             itemsConProblemas.push({ ...itemLocal, motivo: 'Talla no encontrada' });
                             continue;
                         }
                    } else {
                         // Buscar talla UNICA
                         const tallaUnicaQuery = 'SELECT id_talla, stock_talla FROM TALLA_PRODUCTO WHERE id_producto = ? AND talla = "UNICA"';
                         const [tallaUnicaRows] = await connection.execute(tallaUnicaQuery, [productoId]);
                         if (tallaUnicaRows.length === 0) {
                             itemsConProblemas.push({ ...itemLocal, motivo: 'Stock no configurado (UNICA)' });
                             continue;
                         }
                         idTallaProducto = tallaUnicaRows[0].id_talla;
                         stockCheckResult = { stock: tallaUnicaRows[0].stock_talla, id_talla: idTallaProducto, found: true };
                    }

                    // Fusionar cantidades
                    const itemExistenteServidor = itemsServidorActuales.find(
                        itemSrv => itemSrv.id_producto === productoId && itemSrv.id_talla === idTallaProducto
                    );

                    const cantidadTotalRequerida = (itemExistenteServidor ? itemExistenteServidor.cantidad : 0) + cantidad;

                     // Verificar stock total requerido
                     if (stockCheckResult.stock < cantidadTotalRequerida) {
                          itemsConProblemas.push({ ...itemLocal, motivo: `Stock insuficiente (Disp: ${stockCheckResult.stock}, Req: ${cantidadTotalRequerida})` });
                          continue;
                     }

                    // Actualizar o Insertar
                    if (itemExistenteServidor) {
                        const updateQuery = `UPDATE DETALLE_CARRITO SET cantidad = ?, subtotal = precio_unitario * ? WHERE id_detalle = ?`;
                        await connection.execute(updateQuery, [cantidadTotalRequerida, cantidadTotalRequerida, itemExistenteServidor.id_detalle]);
                        itemsActualizados++;
                    } else {
                        const precioUnitario = parseFloat(productoInfo.precio);
                        const subtotal = precioUnitario * cantidad;
                        const insertQuery = `INSERT INTO DETALLE_CARRITO (id_carrito, id_producto, id_talla, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?)`;
                        await connection.execute(insertQuery, [idCarritoServidor, productoId, idTallaProducto, cantidad, precioUnitario, subtotal]);
                        itemsAgregados++;
                    }

                } catch (itemError) {
                    logger.error(`Error procesando item ${productoId} en sync para cliente ${id_cliente}`, itemError);
                    itemsConProblemas.push({ ...itemLocal, motivo: 'Error interno al procesar' });
                    // No continuar con este item, pero no necesariamente fallar toda la transacción
                }
            } // Fin for

            await connection.commit();
            logger.logDebug(`Transacción commit para sync carrito ID: ${idCarritoServidor}`);

            let mensajeRespuesta = `Carrito sincronizado. ${itemsAgregados} agregados, ${itemsActualizados} actualizados.`;
            if (itemsConProblemas.length > 0) {
                mensajeRespuesta += ` ${itemsConProblemas.length} item(s) omitidos por errores/stock.`;
                logger.logWarning(`Sync carrito cliente ${id_cliente} con ${itemsConProblemas.length} problemas`, { problemas: itemsConProblemas });
            }

            // Devolver el carrito final
            const carritoFinal = await this.getCarrito(id_cliente);

            return {
                success: true, // Consideramos éxito aunque haya problemas parciales
                message: mensajeRespuesta,
                data: {
                    itemsConProblemas: itemsConProblemas,
                    carritoActualizado: carritoFinal.data
                }
            };

        } catch (error) {
            if (connection) await connection.rollback();
            logger.error(`Rollback - Error crítico sincronizando carrito cliente ${id_cliente}`, error);
            return { success: false, statusCode: 500, message: 'Error interno al sincronizar el carrito.' };
        } finally {
            if (connection) connection.release();
        }
    }


    // ============================================
    // CHECKOUT (Placeholder - Lógica más compleja iría aquí o en PedidoService)
    // ============================================
    async processCheckout(id_cliente, checkoutData) {
        // ... (lógica existente o futura para crear pedido desde carrito) ...
        // Esta función necesitaría validaciones robustas de stock ANTES de crear el pedido.
        // La función getCarrito ya incluye `stock_validation`, se podría usar eso.
         logger.info(`Iniciando checkout para cliente ${id_cliente}`);
         // Placeholder:
         return { success: false, statusCode: 501, message: 'Checkout aún no implementado en servicio.' };
    }

    // ============================================
    // CÁLCULOS Y TOTALES (Podrían moverse a un CalculationService)
    // ============================================

    /**
     * Calcular totales detallados con IGV y envío (basado en ID de carrito)
     */
    async calculateDetailedTotals(id_carrito, departamento = 'Lima') {
        try {
            // Obtener subtotal y conteo de items directamente de la BD
            const totalsQuery = `
                SELECT COALESCE(SUM(subtotal), 0) as subtotal, COUNT(*) as total_items, COALESCE(SUM(cantidad), 0) as total_productos
                FROM DETALLE_CARRITO WHERE id_carrito = ?`;
            const [rows] = await this.db.execute(totalsQuery, [id_carrito]);
            const { subtotal, total_items, total_productos } = rows[0];

            const subtotalNum = parseFloat(subtotal);
            const costoEnvio = this.getCostoEnvio(departamento, subtotalNum); // Pasar subtotal para envío gratis
            // Asumiendo que el descuento se maneja por separado (cupones) y no está en DETALLE_CARRITO
            const descuento = 0; // TODO: Obtener descuento aplicado al carrito si existe

            const baseImponible = subtotalNum - descuento;
            const igvMonto = baseImponible * IGV; // IGV sobre subtotal - descuento
            const total = baseImponible + costoEnvio; // Asumiendo que precios ya incluyen IGV o ajustar cálculo

             // Corrección: Total debe ser base + envío (si precios no incluyen IGV, añadir igvMonto aquí)
             // Asumamos que los precios en PRODUCTO ya incluyen IGV (común en Perú B2C)
             // Entonces el IGV calculado es solo informativo.
             // Total = (Subtotal - Descuento) + CostoEnvio
             const totalFinal = baseImponible + costoEnvio;
             // El IGV informativo sería: (TotalFinal / (1 + IGV)) * IGV
             const igvInformativo = (totalFinal / (1 + IGV)) * IGV;


            return {
                subtotal: subtotalNum,
                igv: igvInformativo, // IGV calculado sobre el total (si precios incluyen IGV)
                // igv: igvMonto, // Usar este si precios NO incluyen IGV
                costo_envio: costoEnvio,
                descuento: descuento, // Añadir lógica de cupones aquí
                total: totalFinal, // Usar totalFinal
                total_items: parseInt(total_items),
                total_productos: parseInt(total_productos),
                // Formateados
                subtotal_formateado: this.formatPrice(subtotalNum),
                igv_formateado: this.formatPrice(igvInformativo), // Usar igvInformativo
                costo_envio_formateado: this.formatPrice(costoEnvio),
                descuento_formateado: this.formatPrice(descuento),
                total_formateado: this.formatPrice(totalFinal), // Usar totalFinal
                igv_porcentaje: (IGV * 100).toFixed(0) + '%',
                departamento: departamento
            };
        } catch (error) {
            logger.error(`Error calculando totales para carrito ${id_carrito}`, error);
            throw new Error(`Error calculando totales: ${error.message}`);
        }
    }


    /**
     * Obtener costo de envío (considerando envío gratis)
     */
    getCostoEnvio(departamento, subtotal) {
        // Usar config global si existe
        const envioGratisMin = typeof CONFIG !== 'undefined' ? CONFIG.ENVIO_GRATIS_MINIMO : 200.00;
        if (subtotal >= envioGratisMin) {
            return 0; // Envío gratis
        }
        const costoLima = typeof CONFIG !== 'undefined' ? CONFIG.COSTO_ENVIO_LIMA : 15.00;
        const costoProvincias = typeof CONFIG !== 'undefined' ? CONFIG.COSTO_ENVIO_PROVINCIAS : 25.00;

        const departamentosLima = ['Lima', 'Callao']; // Considerar Callao como Lima
        return departamentosLima.includes(departamento) ? costoLima : costoProvincias;
    }

    /**
     * Obtener totales de carrito vacío
     */
    getEmptyCartTotals() {
        const zeroPrice = this.formatPrice(0);
        return {
            subtotal: 0, igv: 0, costo_envio: 0, descuento: 0, total: 0,
            total_items: 0, total_productos: 0,
            subtotal_formateado: zeroPrice, igv_formateado: zeroPrice,
            costo_envio_formateado: this.formatPrice(configCostoEnvioLima), // Mostrar costo base
            descuento_formateado: zeroPrice, total_formateado: zeroPrice,
            igv_porcentaje: (IGV * 100).toFixed(0) + '%'
        };
    }

    // ============================================
    // VALIDACIONES
    // ============================================

    /** Validar datos básicos de un item del carrito */
     validateCartItemData(itemData) {
        if (!itemData.id_producto || itemData.id_producto < 1) {
            return { valid: false, message: 'ID de producto inválido.' };
        }
        // id_talla puede ser null para 'UNICA'
        if (itemData.id_talla !== null && (itemData.id_talla < 1 || isNaN(parseInt(itemData.id_talla)))) {
             return { valid: false, message: 'ID de talla inválido.' };
        }
        if (!itemData.cantidad || itemData.cantidad < 1 || itemData.cantidad > 99) {
            return { valid: false, message: 'Cantidad debe ser entre 1 y 99.' };
        }
        return { valid: true };
    }


    // ============================================
    // UTILIDADES
    // ============================================

    /** Enriquecer item del carrito con información adicional */
    enrichCartItem(item) {
        const subtotal = parseFloat(item.precio_unitario) * parseInt(item.cantidad);
        const stockTalla = parseInt(item.stock || item.stock_talla || 0); // Stock de la TALLA
        return {
            ...item,
            subtotal: subtotal,
            precio_unitario_formateado: this.formatPrice(item.precio_unitario),
            subtotal_formateado: this.formatPrice(subtotal),
            stock_disponible: stockTalla, // Renombrar para claridad
            stock_suficiente: stockTalla >= item.cantidad,
            // Puede aumentar si cantidad actual es menor que stock Y menor que límite práctico (ej. 10)
            puede_aumentar: item.cantidad < Math.min(stockTalla, 10),
             // Puede disminuir si cantidad > 1
             puede_disminuir: item.cantidad > 1,
             // Mensaje de stock bajo
             mensaje_stock_bajo: (stockTalla > 0 && stockTalla <= 5) ? `¡Solo quedan ${stockTalla}!` : null
        };
    }

    /** Formatear precio */
    formatPrice(precio) {
        const num = parseFloat(precio);
        if (isNaN(num)) return 'S/ 0.00'; // Fallback
        return `S/ ${num.toFixed(2)}`;
    }

    /** Obtener resumen rápido del carrito (para header/badge) */
    async getQuickSummary(id_cliente) {
        try {
            // Usar el método del modelo Carrito que hace el COUNT y SUM
            const summary = await this.carritoModel.getSummary(id_cliente); // Asumiendo que getSummary existe y es eficiente

            // Si getSummary no existe, podríamos hacer un cálculo simple aquí,
            // pero es mejor que lo haga la BD.
            /*
            if (!summary) {
                 const carrito = await this.carritoModel.getCarritoWithItems(id_cliente);
                 if (!carrito || !carrito.items || carrito.items.length === 0) {
                      summary = { total_items: 0, total_productos: 0, subtotal: 0, empty: true };
                 } else {
                      const totales = await this.calculateDetailedTotals(carrito.id_carrito);
                      summary = {
                           total_items: totales.total_items,
                           total_productos: totales.total_productos,
                           subtotal: totales.subtotal,
                           empty: false
                      };
                 }
            }
            */

            return {
                success: true,
                data: {
                    total_items: summary?.total_items || 0, // Usar ?. por si summary es null
                    total_productos: summary?.total_productos || 0,
                    subtotal: summary?.subtotal || 0,
                    subtotal_formateado: this.formatPrice(summary?.subtotal || 0),
                    empty: summary?.empty ?? true // Default a true si no hay summary
                }
            };
        } catch (error) {
            logger.error(`Error obteniendo resumen rápido para cliente ${id_cliente}`, error);
            // Devolver un estado vacío/error controlado
            return {
                 success: false,
                 message: 'Error al obtener resumen del carrito.',
                 data: { total_items: 0, total_productos: 0, subtotal: 0, subtotal_formateado: this.formatPrice(0), empty: true }
             };
            // throw new Error(`Error obteniendo resumen: ${error.message}`);
        }
    }

    /** Verificar si hay items con stock bajo (ej. <= 5) */
    async checkLowStock(id_carrito) {
        // ... (lógica similar a la versión anterior, usando getCarritoItems) ...
         try {
            const items = await this.carritoModel.getCarritoItems(id_carrito);
            const itemsStockBajo = items.filter(item =>
                item.stock > 0 && item.stock <= 5 && item.stock >= item.cantidad // Stock bajo pero suficiente para la cantidad actual
            );
             return {
                tiene_stock_bajo: itemsStockBajo.length > 0,
                items: itemsStockBajo.map(item => ({
                    nombre: item.nombre_producto,
                    talla: item.talla,
                    stock: item.stock,
                    mensaje: `¡Solo quedan ${item.stock} unidades!`
                }))
            };
         } catch (error) {
             logger.error(`Error verificando stock bajo para carrito ${id_carrito}`, error);
             return { tiene_stock_bajo: false, items: [] }; // Devolver estado seguro en caso de error
         }
    }
}

// Exportar instancia única
module.exports = new CarritoService();
