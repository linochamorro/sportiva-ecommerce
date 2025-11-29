// ========================================
// SPORTIVA E-COMMERCE - CARRITO
// Integración con API REST Backend
// ========================================

// ===========================
// 1. VARIABLES GLOBALES
// ===========================

let carritoActual = {
    items: [],
    subtotal: 0,
    descuento: 0,
    envio: 0,
    igv: 0,
    total: 0,
    cupon_aplicado: null
};

let cuponActual = null;
const ENVIO_GRATIS_MINIMO = 150;
const COSTO_ENVIO = 15;
const IGV_PORCENTAJE = 0.18;

// ===========================
// 2. INICIALIZACIÓN
// ===========================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🛒 Inicializando carrito...');
    
    // Verificar si apiConfig está disponible
    if (typeof apiConfig === 'undefined') {
        console.warn('⚠️ apiConfig no disponible - usando modo fallback');
    }
    
    // Verificar autenticación
    const isAuthenticated = typeof authService !== 'undefined' && authService.isLoggedIn();
    
    if (!isAuthenticated) {
        mostrarMensajeLogin();
        return;
    }
    
    // Cargar carrito
    await cargarCarrito();
    
    // Inicializar event listeners
    inicializarEventListeners();
    
    console.log('✅ Carrito inicializado correctamente');
});

// ===========================
// 3. CARGA DE CARRITO
// ===========================

/**
 * Cargar carrito desde API o localStorage
 */
async function cargarCarrito() {
    mostrarLoader(true);
    
    try {
        if (typeof apiConfig !== 'undefined' && typeof ENDPOINTS !== 'undefined') {
            // Cargar desde API usando endpoint correcto
            const response = await apiConfig.apiGet(ENDPOINTS.CARRITO.RESUMEN);
            
            console.log('📦 Respuesta API carrito:', response);
            
            if (response.success && response.data && !response.data.empty) {
                carritoActual = procesarDatosCarrito(response.data);
                
                // Si hay un cupón activo en memoria, reaplicarlo
                if (cuponActual && cuponActual.descuento) {
                    carritoActual.descuento = cuponActual.descuento;
                    carritoActual.total = Math.max(0, carritoActual.total - carritoActual.descuento);
                }
                console.log('✅ Carrito cargado desde API:', carritoActual);
            } else if (response.success && response.data && response.data.empty) {
                // Carrito vacío
                carritoActual.items = [];
                calcularTotales();
                console.log('📭 Carrito vacío');
            } else {
                throw new Error('Error al cargar carrito desde API');
            }
        } else {
            // Fallback: cargar desde localStorage
            cargarCarritoLocal();
        }
        
        // Renderizar carrito
        renderizarCarrito();
        
        // Actualizar resumen
        actualizarResumen();
        
    } catch (error) {
        console.error('❌ Error al cargar carrito:', error);
        
        // Intentar fallback
        cargarCarritoLocal();
        renderizarCarrito();
        actualizarResumen();
    } finally {
        mostrarLoader(false);
    }
}

/**
 * Procesar datos del carrito desde API
 */
function procesarDatosCarrito(data) {
    
    return {
        items: data.items || [],
        subtotal: parseFloat(data.subtotal || 0),
        descuento: parseFloat(data.descuento || 0),
        envio: parseFloat(data.costoEnvio || data.envio || 0),
        igv: parseFloat(data.igv || 0),
        total: parseFloat(data.total || 0),
        cupon_aplicado: data.cupon_aplicado || null
    };
}

/**
 * Cargar carrito desde localStorage (fallback)
 */
function cargarCarritoLocal() {
    const carritoLocal = JSON.parse(localStorage.getItem('carrito')) || [];
    
    carritoActual.items = carritoLocal;
    
    calcularTotales();
    
    console.log('✅ Carrito cargado desde localStorage:', {
        items: carritoActual.items.length,
        subtotal: carritoActual.subtotal,
        total: carritoActual.total
    });
}

// ===========================
// 4. RENDERIZADO
// ===========================

/**
 * Renderizar carrito completo
 */
function renderizarCarrito() {
    // Buscar elementos en múltiples IDs (compatibilidad con ambos HTMLs)
    const container = document.getElementById('carrito-items') || document.getElementById('listaProductosCarrito');
    const carritoVacio = document.getElementById('carritoVacio');
    const carritoConProductos = document.getElementById('carritoConProductos');
    
    if (carritoActual.items.length === 0) {
        // Mostrar mensaje de carrito vacío
        if (carritoVacio) carritoVacio.classList.remove('hidden');
        if (carritoConProductos) carritoConProductos.classList.add('hidden');
        return;
    }
    
    // Ocultar mensaje vacío y mostrar productos
    if (carritoVacio) carritoVacio.classList.add('hidden');
    if (carritoConProductos) carritoConProductos.classList.remove('hidden');
    
    if (!container) {
        console.error('❌ Contenedor del carrito no encontrado');
        return;
    }
    
    container.innerHTML = carritoActual.items.map((item, index) => 
        crearItemCarrito(item, index)
    ).join('');
    
    // Agregar event listeners
    agregarEventListenersItems();
}

/**
 * Crear HTML de item del carrito
 */
function crearItemCarrito(item, index) {
    // Mapear propiedades
    const precio = parseFloat(item.precio_unitario || item.precio || item.precio_venta || 0);
    const cantidad = parseInt(item.cantidad || 1);
    const subtotal = parseFloat(item.subtotal || (precio * cantidad));
    const nombre = item.nombre_producto || item.nombre || 'Producto';
    const idProducto = item.id_producto || item.producto_id || 0;
    
    let rawImg = item.imagen || item.imagen_url || item.url_imagen || '';
    
    if (rawImg && !rawImg.startsWith('http')) {
        rawImg = rawImg.replace(/^frontend\//, '').replace(/^public\//, '');
        
        if (rawImg.startsWith('/')) rawImg = rawImg.substring(1);

        if (rawImg.startsWith('assets/')) {
            rawImg = '../' + rawImg;
        }
    }
    // Fallback final
    if (!rawImg) rawImg = '../assets/images/placeholder.jpg';
    // ------------------------------------
    
    const stockDisponible = item.stock_disponible || item.stock || 99;
    
    return `
        <div class="carrito-item" data-index="${index}" data-item-id="${item.id_detalle_carrito || item.carrito_item_id || item.id}">
            <div class="carrito-imagen">
                <img src="${rawImg}" alt="${nombre}" 
                    style="width: 100%; height: 100%; object-fit: cover;"
                    onerror="this.onerror=null; this.src='../assets/images/placeholder.jpg';">
            </div>
            
            <div style="flex: 1; padding: 0 16px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">
                    <a href="producto.html?id=${idProducto}" style="color: var(--color-black); text-decoration: none;">
                        ${nombre}
                    </a>
                </h3>
                
                ${item.marca ? `<p style="color: var(--color-gray-medium); font-size: 14px; margin: 4px 0;">Marca: ${item.marca}</p>` : ''}
                ${item.talla ? `<p style="color: var(--color-gray-medium); font-size: 14px; margin: 4px 0;">Talla: ${item.talla}</p>` : ''}
                
                <p style="color: var(--color-gray-medium); font-size: 14px; margin: 8px 0 0 0;">
                    Precio unitario: <strong style="color: var(--color-black);">S/ ${precio.toFixed(2)}</strong>
                </p>
                
                <div class="cantidad-control" style="margin-top: 12px;">
                    <button onclick="cambiarCantidad(${index}, -1)" ${cantidad <= 1 ? 'disabled' : ''}>-</button>
                    <input type="number" value="${cantidad}" min="1" max="${stockDisponible}" 
                          data-index="${index}" onchange="actualizarCantidadInput(${index}, this.value)">
                    <button onclick="cambiarCantidad(${index}, 1)" ${cantidad >= stockDisponible ? 'disabled' : ''}>+</button>
                </div>
            </div>
            
            <div style="text-align: right;">
                <p style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0;">
                    S/ ${subtotal.toFixed(2)}
                </p>
                <button class="btn btn-outline" onclick="eliminarItem(${index})" style="padding: 8px 16px; font-size: 12px;">
                    ELIMINAR
                </button>
            </div>
        </div>
    `;
}

/**
 * Mostrar mensaje de login
 */
function mostrarMensajeLogin() {
    const carritoVacio = document.getElementById('carritoVacio');
    const carritoConProductos = document.getElementById('carritoConProductos');
    
    if (carritoVacio && carritoConProductos) {
        carritoConProductos.classList.add('hidden');
        carritoVacio.classList.remove('hidden');
        
        carritoVacio.innerHTML = `
            <h2 style="margin-bottom: 16px;">Inicia sesión para ver tu carrito</h2>
            <p class="text-secondary" style="margin-bottom: 32px;">Guarda tus productos favoritos y finaliza tu compra</p>
            <button class="btn btn-primary" onclick="window.location.href='login.html'">
                Iniciar sesión
            </button>
        `;
    }
}

// ===========================
// 5. ACTUALIZACIÓN DE CARRITO
// ===========================

/**
 * Cambiar cantidad de un item
 */
async function cambiarCantidad(index, delta) {
    const item = carritoActual.items[index];
    if (!item) return;
    
    const nuevaCantidad = parseInt(item.cantidad) + delta;
    
    // Validar límites
    if (nuevaCantidad < 1) return;
    
    const stockDisponible = item.stock_disponible || item.stock || 99;
    if (nuevaCantidad > stockDisponible) {
        mostrarNotificacion(`Solo hay ${stockDisponible} unidades disponibles`, 'warning');
        return;
    }
    
    // Actualizar cantidad
    await actualizarCantidadItem(index, nuevaCantidad);
}

/**
 * Actualizar cantidad desde input
 */
async function actualizarCantidadInput(index, valor) {
    const cantidad = parseInt(valor);
    const item = carritoActual.items[index];
    
    if (!item || isNaN(cantidad) || cantidad < 1) {
        // Restaurar valor anterior
        const input = document.querySelector(`input[data-index="${index}"]`);
        if (input) input.value = item.cantidad;
        return;
    }
    
    const stockDisponible = item.stock_disponible || item.stock || 99;
    if (cantidad > stockDisponible) {
        mostrarNotificacion(`Solo hay ${stockDisponible} unidades disponibles`, 'warning');
        const input = document.querySelector(`input[data-index="${index}"]`);
        if (input) input.value = item.cantidad;
        return;
    }
    
    await actualizarCantidadItem(index, cantidad);
}

/**
 * Actualizar cantidad de item
 */
async function actualizarCantidadItem(index, nuevaCantidad) {
    const item = carritoActual.items[index];
    if (!item) return;  
    mostrarLoader(true);
    
    try {
        if (typeof apiConfig !== 'undefined') {
            // Actualizar en API
            const itemId = item.id_detalle_carrito || item.carrito_item_id || item.id;
            
            const response = await apiConfig.apiPut(`/carrito/items/${itemId}`, {
                cantidad: nuevaCantidad
            });
            
            if (response.success) {
                // Actualizar localmente
                item.cantidad = nuevaCantidad;
                
                // Recargar carrito completo para obtener nuevos totales
                await cargarCarrito();
                
                mostrarNotificacion('Cantidad actualizada', 'success');
            } else {
                throw new Error(response.message || 'Error al actualizar cantidad');
            }
        } else {
            // Actualizar localmente
            item.cantidad = nuevaCantidad;
            guardarCarritoLocal();
            calcularTotales();
            renderizarCarrito();
            actualizarResumen();
        }
        
    } catch (error) {
        console.error('❌ Error al actualizar cantidad:', error);
        mostrarNotificacion('Error al actualizar cantidad', 'error');
        
        // Revertir cambio
        await cargarCarrito();
    } finally {
        mostrarLoader(false);
    }
}

/**
 * Eliminar item del carrito
 */
async function eliminarItem(index) {
    const item = carritoActual.items[index];
    if (!item) return;
    
    const nombreProducto = item.nombre_producto || item.nombre || 'este producto';
    
    mostrarModalConfirmacion(
        `¿Estás seguro de eliminar "${nombreProducto}" del carrito?`,
        async () => {
            mostrarLoader(true);
            
            try {
                if (typeof apiConfig !== 'undefined' && typeof ENDPOINTS !== 'undefined') {
                    const itemId = item.id_detalle_carrito || item.carrito_item_id || item.id;
                    
                    const response = await apiConfig.apiDelete(ENDPOINTS.CARRITO.ELIMINAR_ITEM(itemId));
                    
                    if (response.success) {
                        mostrarNotificacion('Producto eliminado del carrito', 'success');
                        await cargarCarrito();
                        
                        if (typeof actualizarContadorCarrito === 'function') {
                            await actualizarContadorCarrito();
                        }
                    } else {
                        throw new Error(response.message || 'Error al eliminar producto');
                    }
                } else {
                    // Modo fallback
                    carritoActual.items.splice(index, 1);
                    guardarCarritoLocal();
                    calcularTotales();
                    renderizarCarrito();
                    actualizarResumen();
                    
                    if (typeof actualizarContadorCarrito === 'function') {
                        actualizarContadorCarrito();
                    }
                    
                    mostrarNotificacion('Producto eliminado del carrito', 'success');
                }
                
            } catch (error) {
                console.error('❌ Error al eliminar item:', error);
                mostrarNotificacion('Error al eliminar producto', 'error');
            } finally {
                mostrarLoader(false);
            }
        }
    );
}

/**
 * Vaciar carrito completo
 */
async function vaciarCarrito() {
    if (carritoActual.items.length === 0) return;
    
    mostrarModalConfirmacion(
        '¿Estás seguro de vaciar todo el carrito? Esta acción no se puede deshacer.',
        async () => {
            mostrarLoader(true);
            
            try {
                if (typeof apiConfig !== 'undefined') {
                    const response = await apiConfig.apiDelete('/carrito');
                    
                    if (response.success) {
                        mostrarNotificacion('Carrito vaciado', 'success');
                        await cargarCarrito();
                        
                        if (typeof actualizarContadorCarrito === 'function') {
                            await actualizarContadorCarrito();
                        }
                    } else {
                        throw new Error('Error al vaciar carrito');
                    }
                } else {
                    carritoActual.items = [];
                    localStorage.removeItem('carrito');
                    calcularTotales();
                    renderizarCarrito();
                    actualizarResumen();
                    
                    if (typeof actualizarContadorCarrito === 'function') {
                        actualizarContadorCarrito();
                    }
                }
                
            } catch (error) {
                console.error('❌ Error al vaciar carrito:', error);
                mostrarNotificacion('Error al vaciar carrito', 'error');
            } finally {
                mostrarLoader(false);
            }
        }
    );
}

// ===========================
// 6. CUPONES DE DESCUENTO
// ===========================

/**
 * Aplicar cupón de descuento
 */
async function aplicarCupon() {
    const input = document.getElementById('cupon-input') || document.getElementById('inputCupon');
    if (!input) return;
    
    const codigoCupon = input.value.trim().toUpperCase();
    
    if (!codigoCupon) {
        mostrarNotificacion('Ingresa un código de cupón', 'warning');
        return;
    }
    
    // Deshabilitar botón
    const btnAplicar = document.getElementById('btn-aplicar-cupon');
    if (btnAplicar) {
        btnAplicar.disabled = true;
        btnAplicar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Aplicando...';
    }
    
    try {
        if (typeof apiConfig !== 'undefined') {
            const response = await apiConfig.apiPost('/carrito/aplicar-cupon', {
                codigoCupon: codigoCupon
            });
            
            if (response.success) {
                cuponActual = response.data.cupon;
                mostrarNotificacion(`Cupón aplicado: ${cuponActual.descuento}% de descuento`, 'success');
                
                // Recargar carrito
                await cargarCarrito();
                
                // Mostrar cupón aplicado
                mostrarCuponAplicado();
            } else {
                throw new Error(response.message || 'Cupón inválido o expirado');
            }
        } else {
            // Simulación para testing
            if (codigoCupon === 'DESCUENTO10') {
                cuponActual = {
                    codigo: codigoCupon,
                    descuento: 10
                };
                
                calcularTotales();
                actualizarResumen();
                
                mostrarNotificacion('Cupón aplicado: 10% de descuento', 'success');
            } else {
                throw new Error('Cupón inválido');
            }
        }
        
        input.value = '';
        
    } catch (error) {
        console.error('❌ Error al aplicar cupón:', error);
        mostrarNotificacion(error.message || 'Error al aplicar cupón', 'error');
    } finally {
        if (btnAplicar) {
            btnAplicar.disabled = false;
            btnAplicar.innerHTML = 'Aplicar';
        }
    }
}

/**
 * Eliminar cupón aplicado
 */
async function eliminarCupon() {
    mostrarLoader(true);
    
    try {
        if (typeof apiConfig !== 'undefined') {
            const response = await apiConfig.apiDelete('/carrito/cupon');
            
            if (response.success) {
                cuponActual = null;
                mostrarNotificacion('Cupón eliminado', 'success');
                await cargarCarrito();
                ocultarCuponAplicado();
            } else {
                throw new Error('Error al eliminar cupón');
            }
        } else {
            cuponActual = null;
            calcularTotales();
            actualizarResumen();
            ocultarCuponAplicado();
        }
        
    } catch (error) {
        console.error('❌ Error al eliminar cupón:', error);
        mostrarNotificacion('Error al eliminar cupón', 'error');
    } finally {
        mostrarLoader(false);
    }
}

/**
 * Mostrar cupón aplicado
 */
function mostrarCuponAplicado() {
    const container = document.getElementById('cupon-aplicado');
    if (!container) return;
    
    const cupon = cuponActual || carritoActual.cupon_aplicado;
    if (!cupon) return;
    
    container.innerHTML = `
        <div class="cupon-activo">
            <i class="fas fa-tag"></i>
            <span>${cupon.codigo || cupon.descripcion} - ${cupon.descuento}% OFF</span>
            <button class="btn-eliminar-cupon" onclick="eliminarCupon()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    container.style.display = 'block';
    
    // Ocultar formulario de cupón
    const formularioCupon = document.getElementById('formulario-cupon');
    if (formularioCupon) formularioCupon.style.display = 'none';
}

/**
 * Ocultar cupón aplicado
 */
function ocultarCuponAplicado() {
    const container = document.getElementById('cupon-aplicado');
    if (container) {
        container.style.display = 'none';
        container.innerHTML = '';
    }
    
    // Mostrar formulario de cupón
    const formularioCupon = document.getElementById('formulario-cupon');
    if (formularioCupon) formularioCupon.style.display = 'block';
}

// ===========================
// 7. CÁLCULOS
// ===========================

/**
 * Calcular totales del carrito
 */
function calcularTotales() {
    // Subtotal
    carritoActual.subtotal = carritoActual.items.reduce((sum, item) => {
        const precio = parseFloat(item.precio_unitario || item.precio || item.precio_venta || 0);
        const cantidad = parseInt(item.cantidad || 1);
        return sum + (precio * cantidad);
    }, 0);
    
    // Descuento por cupón
    if (cuponActual) {
        carritoActual.descuento = (carritoActual.subtotal * cuponActual.descuento) / 100;
    } else {
        carritoActual.descuento = 0;
    }
    
    // Envío
    const subtotalConDescuento = carritoActual.subtotal - carritoActual.descuento;
    carritoActual.envio = subtotalConDescuento >= ENVIO_GRATIS_MINIMO ? 0 : COSTO_ENVIO;
    
    // Base imponible (subtotal - descuento + envío)
    const baseImponible = subtotalConDescuento + carritoActual.envio;
    
    // IGV (18%)
    carritoActual.igv = baseImponible * IGV_PORCENTAJE;
    
    // Total
    carritoActual.total = baseImponible + carritoActual.igv;
    
    console.log('💰 Totales calculados:', {
        subtotal: carritoActual.subtotal,
        descuento: carritoActual.descuento,
        envio: carritoActual.envio,
        igv: carritoActual.igv,
        total: carritoActual.total
    });
}

/**
 * Actualizar resumen del carrito
 */
function actualizarResumen() {
    actualizarResumenFormato1();
    actualizarResumenFormato2();
}

/**
 * Actualizar resumen - Formato 1 (IDs individuales)
 */
function actualizarResumenFormato1() {
    const cantidadItems = document.getElementById('cantidadItems');
    const subtotalCarrito = document.getElementById('subtotalCarrito');
    const igvCarrito = document.getElementById('igvCarrito');
    const envioCarrito = document.getElementById('envioCarrito');
    const totalCarrito = document.getElementById('totalCarrito');
    const filaDescuento = document.getElementById('filaDescuento');
    const descuentoCarrito = document.getElementById('descuentoCarrito');
    
    // Si no existen estos elementos, este formato no aplica
    if (!subtotalCarrito && !igvCarrito && !envioCarrito && !totalCarrito) {
        return;
    }
    
    // Actualizar valores
    if (cantidadItems) {
        cantidadItems.textContent = carritoActual.items.length;
    }
    
    if (subtotalCarrito) {
        subtotalCarrito.textContent = `S/ ${carritoActual.subtotal.toFixed(2)}`;
    }
    
    if (igvCarrito) {
        igvCarrito.textContent = `S/ ${carritoActual.igv.toFixed(2)}`;
    }
    
    if (envioCarrito) {
        if (carritoActual.envio === 0) {
            envioCarrito.textContent = 'GRATIS';
            envioCarrito.style.color = '#10b981';
            envioCarrito.style.fontWeight = '700';
        } else {
            envioCarrito.textContent = `S/ ${carritoActual.envio.toFixed(2)}`;
            envioCarrito.style.color = '';
            envioCarrito.style.fontWeight = '';
        }
    }
    
    // Actualizar fila de descuento
    if (filaDescuento && descuentoCarrito) {
        if (carritoActual.descuento > 0) {
            filaDescuento.style.display = 'flex';
            descuentoCarrito.textContent = `- S/ ${carritoActual.descuento.toFixed(2)}`;
        } else {
            filaDescuento.style.display = 'none';
        }
    }

    if (totalCarrito) {
        totalCarrito.textContent = `S/ ${carritoActual.total.toFixed(2)}`;
    }
    
    console.log('✅ Resumen actualizado (Formato 1)');
}

/**
 * Actualizar resumen - Formato 2 (HTML dinámico)
 */
function actualizarResumenFormato2() {
    const resumen = document.getElementById('carrito-resumen');
    if (!resumen) return;
    
    if (carritoActual.items.length === 0) {
        resumen.style.display = 'none';
        return;
    }
    
    resumen.style.display = 'block';
    
    const subtotalConDescuento = carritoActual.subtotal - carritoActual.descuento;
    const faltaEnvioGratis = ENVIO_GRATIS_MINIMO - subtotalConDescuento;
    
    resumen.innerHTML = `
        <div class="resumen-header">
            <h2>Resumen de Compra</h2>
        </div>
        
        <div class="resumen-contenido">
            <!-- Subtotal -->
            <div class="resumen-linea">
                <span>Subtotal (${carritoActual.items.length} ${carritoActual.items.length === 1 ? 'producto' : 'productos'})</span>
                <span>S/ ${carritoActual.subtotal.toFixed(2)}</span>
            </div>
            
            <!-- Descuento -->
            ${carritoActual.descuento > 0 ? `
                <div class="resumen-linea descuento">
                    <span>Descuento</span>
                    <span>-S/ ${carritoActual.descuento.toFixed(2)}</span>
                </div>
            ` : ''}
            
            <!-- Envío -->
            <div class="resumen-linea">
                <span>Envío</span>
                <span>${carritoActual.envio === 0 ? 'GRATIS' : 'S/ ' + carritoActual.envio.toFixed(2)}</span>
            </div>
            
            <!-- Mensaje envío gratis -->
            ${faltaEnvioGratis > 0 && carritoActual.envio > 0 ? `
                <div class="mensaje-envio-gratis">
                    <i class="fas fa-truck"></i>
                    ¡Agrega S/ ${faltaEnvioGratis.toFixed(2)} más para envío gratis!
                    <div class="barra-progreso">
                        <div class="barra-progreso-fill" 
                             style="width: ${(subtotalConDescuento / ENVIO_GRATIS_MINIMO * 100).toFixed(0)}%">
                        </div>
                    </div>
                </div>
            ` : ''}
            
            <!-- IGV -->
            <div class="resumen-linea">
                <span>IGV (18%)</span>
                <span>S/ ${carritoActual.igv.toFixed(2)}</span>
            </div>
            
            <div class="resumen-divider"></div>
            
            <!-- Total -->
            <div class="resumen-linea total">
                <span>Total</span>
                <span>S/ ${carritoActual.total.toFixed(2)}</span>
            </div>
        </div>
        
        <!-- Cupón de descuento -->
        <div class="resumen-cupon">
            <div id="cupon-aplicado" style="display: none;"></div>
            
            <div id="formulario-cupon" class="cupon-form">
                <input type="text" 
                        id="cupon-input" 
                        placeholder="Código de cupón"
                        maxlength="20">
                <button id="btn-aplicar-cupon" 
                        class="btn-secondary" 
                        onclick="aplicarCupon()">
                    Aplicar
                </button>
            </div>
        </div>
        
        <!-- Botones de acción -->
        <div class="resumen-acciones">
            <button class="btn-primary btn-lg btn-block" onclick="irACheckout()">
                <i class="fas fa-lock"></i>
                Proceder al pago
            </button>
            
            <a href="/catalogo.html" class="btn-link">
                <i class="fas fa-arrow-left"></i>
                Seguir comprando
            </a>
            
            <button class="btn-link-danger" onclick="vaciarCarrito()">
                <i class="fas fa-trash"></i>
                Vaciar carrito
            </button>
        </div>
        
        <!-- Garantías -->
        <div class="resumen-garantias">
            <div class="garantia-item">
                <i class="fas fa-shield-alt"></i>
                <span>Compra segura</span>
            </div>
            <div class="garantia-item">
                <i class="fas fa-undo"></i>
                <span>Devolución gratis</span>
            </div>
            <div class="garantia-item">
                <i class="fas fa-headset"></i>
                <span>Soporte 24/7</span>
            </div>
        </div>
    `;
    
    // Mostrar cupón si está aplicado
    if (cuponActual || carritoActual.cupon_aplicado) {
        mostrarCuponAplicado();
    }
    
    console.log('✅ Resumen actualizado (Formato 2)');
}

// ===========================
// 8. NAVEGACIÓN
// ===========================

/**
 * Ir a checkout
 */
async function irACheckout() {
    if (carritoActual.items.length === 0) {
        mostrarNotificacion('Tu carrito está vacío', 'warning');
        return;
    }
    
    if (carritoActual.descuento > 0) {
        const datosCupon = {
            codigo: cuponActual ? cuponActual.codigo : '',
            descuento: carritoActual.descuento,
            tipo: cuponActual ? cuponActual.tipo : 'MONTO',
            valor: cuponActual ? cuponActual.valor : 0
        };
        localStorage.setItem('sportiva_cupon_checkout', JSON.stringify(datosCupon));
    } else {
        localStorage.removeItem('sportiva_cupon_checkout');
    }

    // VALIDACIÓN DE STOCK
    mostrarLoader(true);
    
    try {
        if (typeof apiConfig !== 'undefined') {
            try {
                // Intentar validar stock
                const response = await apiConfig.apiPost('/carrito/validar');
                
                if (!response.success) {
                    throw new Error(response.message || 'Stock no disponible');
                }
            } catch (apiError) {
                console.warn("Advertencia en validación:", apiError);

                const msg = apiError.message || '';
                if (msg.includes('stock') || msg.includes('disponible') || msg.includes('insuficiente')) {
                    throw apiError;
                }
            }
            
            window.location.href = 'checkout.html';
            
        } else {
            // Fallback
            window.location.href = 'checkout.html';
        }
    } catch (error) {
        console.error('❌ Error bloqueante al validar:', error);
        mostrarNotificacion(error.message || 'Error al validar carrito', 'error');
        await cargarCarrito();
    } finally {
        mostrarLoader(false);
    }
}

// ===========================
// 9. PERSISTENCIA LOCAL
// ===========================

/**
 * Guardar carrito en localStorage
 */
function guardarCarritoLocal() {
    localStorage.setItem('carrito', JSON.stringify(carritoActual.items));
}

// ===========================
// 10. EVENT LISTENERS
// ===========================

/**
 * Inicializar event listeners
 */
function inicializarEventListeners() {
    // Enter en input de cupón (ambos IDs)
    const cuponInputs = [
        document.getElementById('cupon-input'),
        document.getElementById('inputCupon')
    ].filter(el => el !== null);
    
    cuponInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                aplicarCupon();
            }
        });
    });
}

/**
 * Agregar event listeners a items
 */
function agregarEventListenersItems() {
    // Event listeners para inputs de cantidad
    document.querySelectorAll('.cantidad-input').forEach(input => {
        input.addEventListener('blur', () => {
            const index = parseInt(input.dataset.index);
            const valor = parseInt(input.value);
            
            if (isNaN(valor) || valor < 1) {
                input.value = carritoActual.items[index].cantidad;
            }
        });
    });
}

// ===========================
// 11. HELPERS
// ===========================

/**
 * Mostrar/ocultar loader
 */
function mostrarLoader(mostrar) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = mostrar ? 'flex' : 'none';
    }
}

/**
 * Mostrar notificación
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion notificacion-${tipo}`;
    notificacion.innerHTML = `
        <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'times-circle' : tipo === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${mensaje}</span>
    `;
    
    document.body.appendChild(notificacion);
    setTimeout(() => notificacion.classList.add('show'), 10);
    
    setTimeout(() => {
        notificacion.classList.remove('show');
        setTimeout(() => notificacion.remove(), 300);
    }, 3000);
}

// ===========================
// 12. MODAL DE CONFIRMACIÓN
// CON COLORES DE MARCA SPORTIVA
// ===========================

/**
 * Mostrar modal de confirmación con colores Sportiva
 * @param {string} mensaje - Mensaje a mostrar
 * @param {function} onConfirm - Callback al confirmar
 */
function mostrarModalConfirmacion(mensaje, onConfirm) {
    const modal = document.createElement('div');
    modal.id = 'modalConfirmacionSportiva';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            padding: 32px;
            border-radius: 8px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
        ">
            <h3 style="
                margin: 0 0 16px 0;
                font-size: 20px;
                font-weight: 700;
                color: #000;
            ">Confirmar eliminación</h3>
            
            <p style="
                margin: 0 0 24px 0;
                font-size: 14px;
                color: #6b7280;
                line-height: 1.5;
            ">${mensaje}</p>
            
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button id="btnConfirmar" style="
                    padding: 10px 20px;
                    border: none;
                    background: #ff6b35;
                    color: #fff;
                    border-radius: 4px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background-color 0.2s;
                "
                onmouseover="this.style.backgroundColor='#ff8555'"
                onmouseout="this.style.backgroundColor='#ff6b35'">
                    Aceptar
                </button>
                
                <button id="btnCancelar" style="
                    padding: 10px 20px;
                    border: none;
                    background: #000;
                    color: #fff;
                    border-radius: 4px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background-color 0.2s;
                " 
                onmouseover="this.style.backgroundColor='#333'"
                onmouseout="this.style.backgroundColor='#000'">
                    Cancelar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const btnCancelar = modal.querySelector('#btnCancelar');
    const btnConfirmar = modal.querySelector('#btnConfirmar');
    
    const cerrarModal = () => {
        document.body.removeChild(modal);
    };
    
    btnCancelar.addEventListener('click', cerrarModal);
    
    btnConfirmar.addEventListener('click', () => {
        cerrarModal();
        if (onConfirm) onConfirm();
    });
    
    // Cerrar al hacer clic fuera del modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModal();
    });
}

// ===========================
// 13. EXPORTAR FUNCIONES
// ===========================

window.cambiarCantidad = cambiarCantidad;
window.actualizarCantidadInput = actualizarCantidadInput;
window.eliminarItem = eliminarItem;
window.vaciarCarrito = vaciarCarrito;
window.aplicarCupon = aplicarCupon;
window.eliminarCupon = eliminarCupon;
window.irACheckout = irACheckout;

console.log('✅ carrito.js v1.0 cargado correctamente - Sportiva E-Commerce');
