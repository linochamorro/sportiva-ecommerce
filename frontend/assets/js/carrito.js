// ========================================
// SPORTIVA E-COMMERCE - CARRITO
// Integración con API REST Backend
// Fecha actualización: 16 Octubre 2025
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
 * Cargar carrito desde API
 */
async function cargarCarrito() {
    mostrarLoader(true);
    
    try {
        if (typeof apiConfig !== 'undefined') {
            // Cargar desde API
            const response = await apiConfig.apiGet('/carrito');
            
            if (response.success && response.data) {
                carritoActual = procesarDatosCarrito(response.data);
                console.log('✅ Carrito cargado desde API:', carritoActual);
            } else {
                throw new Error('Error al cargar carrito desde API');
            }
        } else {
            // Fallback: cargar desde localStorage
            cargarCarritoLocal();
        }
        
        // Renderizar carrito
        renderizarCarrito();
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
        envio: parseFloat(data.envio || 0),
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
    
    console.log('✅ Carrito cargado desde localStorage');
}

// ===========================
// 4. RENDERIZADO
// ===========================

/**
 * Renderizar carrito completo
 */
function renderizarCarrito() {
    const container = document.getElementById('carrito-items');
    if (!container) return;
    
    if (carritoActual.items.length === 0) {
        mostrarCarritoVacio();
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
    const precio = parseFloat(item.precio || item.precio_venta || 0);
    const cantidad = parseInt(item.cantidad || 1);
    const subtotal = precio * cantidad;
    const imagen = item.imagen || item.imagen_url || '/assets/images/placeholder.jpg';
    const stockDisponible = item.stock_disponible || item.stock || 99;
    
    return `
        <div class="carrito-item" data-index="${index}" data-item-id="${item.carrito_item_id || item.producto_id}">
            <!-- Imagen del producto -->
            <div class="item-imagen">
                <img src="${imagen}" alt="${item.nombre}">
            </div>
            
            <!-- Información del producto -->
            <div class="item-info">
                <h3 class="item-nombre">
                    <a href="/producto.html?id=${item.producto_id}">${item.nombre}</a>
                </h3>
                
                <div class="item-detalles">
                    ${item.marca ? `<span class="item-marca">${item.marca}</span>` : ''}
                    ${item.talla ? `<span class="item-talla">Talla: ${item.talla}</span>` : ''}
                    ${item.color ? `<span class="item-color">Color: ${item.color}</span>` : ''}
                </div>
                
                <div class="item-stock">
                    ${stockDisponible < 5 ? 
                        `<span class="stock-bajo">¡Solo ${stockDisponible} disponibles!</span>` : 
                        `<span class="stock-ok">Stock disponible: ${stockDisponible}</span>`
                    }
                </div>
            </div>
            
            <!-- Precio unitario -->
            <div class="item-precio">
                <span class="precio-label">Precio:</span>
                <span class="precio-valor">S/ ${precio.toFixed(2)}</span>
            </div>
            
            <!-- Cantidad -->
            <div class="item-cantidad">
                <label>Cantidad:</label>
                <div class="cantidad-controls">
                    <button class="btn-cantidad" 
                            onclick="cambiarCantidad(${index}, -1)"
                            ${cantidad <= 1 ? 'disabled' : ''}>
                        <i class="fas fa-minus"></i>
                    </button>
                    <input type="number" 
                            class="cantidad-input" 
                            value="${cantidad}" 
                            min="1" 
                            max="${stockDisponible}"
                            data-index="${index}"
                            onchange="actualizarCantidadInput(${index}, this.value)">
                    <button class="btn-cantidad" 
                            onclick="cambiarCantidad(${index}, 1)"
                            ${cantidad >= stockDisponible ? 'disabled' : ''}>
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
            
            <!-- Subtotal -->
            <div class="item-subtotal">
                <span class="subtotal-label">Subtotal:</span>
                <span class="subtotal-valor">S/ ${subtotal.toFixed(2)}</span>
            </div>
            
            <!-- Botón eliminar -->
            <div class="item-acciones">
                <button class="btn-eliminar" 
                        onclick="eliminarItem(${index})"
                        title="Eliminar producto">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * Mostrar carrito vacío
 */
function mostrarCarritoVacio() {
    const container = document.getElementById('carrito-items');
    if (!container) return;
    
    container.innerHTML = `
        <div class="carrito-vacio">
            <i class="fas fa-shopping-cart"></i>
            <h2>Tu carrito está vacío</h2>
            <p>¡Descubre nuestros productos y comienza a comprar!</p>
            <a href="/catalogo.html" class="btn-primary">
                <i class="fas fa-shopping-bag"></i>
                Ir a comprar
            </a>
        </div>
    `;
    
    // Ocultar resumen
    const resumen = document.getElementById('carrito-resumen');
    if (resumen) resumen.style.display = 'none';
}

/**
 * Mostrar mensaje de login
 */
function mostrarMensajeLogin() {
    const main = document.querySelector('main') || document.body;
    main.innerHTML = `
        <div class="mensaje-login">
            <i class="fas fa-sign-in-alt"></i>
            <h2>Inicia sesión para ver tu carrito</h2>
            <p>Guarda tus productos favoritos y finaliza tu compra</p>
            <a href="/login.html?redirect=${encodeURIComponent(window.location.pathname)}" class="btn-primary">
                Iniciar sesión
            </a>
        </div>
    `;
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
            const itemId = item.carrito_item_id || item.id;
            
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
    
    // Confirmación
    if (!confirm(`¿Eliminar "${item.nombre}" del carrito?`)) {
        return;
    }
    
    mostrarLoader(true);
    
    try {
        if (typeof apiConfig !== 'undefined') {
            // Eliminar en API
            const itemId = item.carrito_item_id || item.id;
            
            const response = await apiConfig.apiDelete(`/carrito/items/${itemId}`);
            
            if (response.success) {
                mostrarNotificacion('Producto eliminado del carrito', 'success');
                
                // Recargar carrito
                await cargarCarrito();
                
                // Actualizar contador del navbar
                if (typeof actualizarCantidadCarrito === 'function') {
                    actualizarCantidadCarrito();
                }
            } else {
                throw new Error(response.message || 'Error al eliminar producto');
            }
        } else {
            // Eliminar localmente
            carritoActual.items.splice(index, 1);
            guardarCarritoLocal();
            calcularTotales();
            renderizarCarrito();
            actualizarResumen();
            
            if (typeof actualizarCantidadCarrito === 'function') {
                actualizarCantidadCarrito();
            }
        }
        
    } catch (error) {
        console.error('❌ Error al eliminar item:', error);
        mostrarNotificacion('Error al eliminar producto', 'error');
    } finally {
        mostrarLoader(false);
    }
}

/**
 * Vaciar carrito completo
 */
async function vaciarCarrito() {
    if (carritoActual.items.length === 0) return;
    
    if (!confirm('¿Estás seguro de vaciar todo el carrito?')) {
        return;
    }
    
    mostrarLoader(true);
    
    try {
        if (typeof apiConfig !== 'undefined') {
            const response = await apiConfig.apiDelete('/carrito');
            
            if (response.success) {
                mostrarNotificacion('Carrito vaciado', 'success');
                await cargarCarrito();
                
                if (typeof actualizarCantidadCarrito === 'function') {
                    actualizarCantidadCarrito();
                }
            } else {
                throw new Error('Error al vaciar carrito');
            }
        } else {
            // Vaciar localmente
            carritoActual.items = [];
            localStorage.removeItem('carrito');
            calcularTotales();
            renderizarCarrito();
            actualizarResumen();
        }
        
    } catch (error) {
        console.error('❌ Error al vaciar carrito:', error);
        mostrarNotificacion('Error al vaciar carrito', 'error');
    } finally {
        mostrarLoader(false);
    }
}

// ===========================
// 6. CUPONES DE DESCUENTO
// ===========================

/**
 * Aplicar cupón de descuento
 */
async function aplicarCupon() {
    const input = document.getElementById('cupon-input');
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
                codigo: codigoCupon
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
            // Validación local de cupones de ejemplo
            const cuponesValidos = {
                'WELCOME10': { descuento: 10, descripcion: 'Bienvenida 10%' },
                'DEPORTE15': { descuento: 15, descripcion: 'Deportes 15%' },
                'VERANO20': { descuento: 20, descripcion: 'Verano 20%' }
            };
            
            if (cuponesValidos[codigoCupon]) {
                cuponActual = {
                    codigo: codigoCupon,
                    ...cuponesValidos[codigoCupon]
                };
                
                mostrarNotificacion(`Cupón aplicado: ${cuponActual.descuento}% de descuento`, 'success');
                calcularTotales();
                actualizarResumen();
                mostrarCuponAplicado();
            } else {
                throw new Error('Cupón inválido o expirado');
            }
        }
        
        input.value = '';
        
    } catch (error) {
        console.error('❌ Error al aplicar cupón:', error);
        mostrarNotificacion(error.message || 'Error al aplicar cupón', 'error');
    } finally {
        // Rehabilitar botón
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
    if (!cuponActual && !carritoActual.cupon_aplicado) return;
    
    try {
        if (typeof apiConfig !== 'undefined') {
            const response = await apiConfig.apiDelete('/carrito/cupon');
            
            if (response.success) {
                cuponActual = null;
                mostrarNotificacion('Cupón eliminado', 'info');
                
                // Recargar carrito
                await cargarCarrito();
                
                // Ocultar cupón aplicado
                ocultarCuponAplicado();
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
        const precio = parseFloat(item.precio || item.precio_venta || 0);
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
}

/**
 * Actualizar resumen del carrito
 */
function actualizarResumen() {
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
    
    // Validar stock antes de proceder
    mostrarLoader(true);
    
    try {
        if (typeof apiConfig !== 'undefined') {
            const response = await apiConfig.apiPost('/carrito/validar');
            
            if (response.success) {
                window.location.href = '/checkout.html';
            } else {
                throw new Error(response.message || 'Algunos productos no tienen stock disponible');
            }
        } else {
            // Sin validación, ir directo
            window.location.href = '/checkout.html';
        }
    } catch (error) {
        console.error('❌ Error al validar carrito:', error);
        mostrarNotificacion(error.message || 'Error al validar carrito', 'error');
        
        // Recargar carrito para actualizar stocks
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
    // Enter en input de cupón
    const cuponInput = document.getElementById('cupon-input');
    if (cuponInput) {
        cuponInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                aplicarCupon();
            }
        });
    }
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
// 12. EXPORTAR FUNCIONES
// ===========================

window.cambiarCantidad = cambiarCantidad;
window.actualizarCantidadInput = actualizarCantidadInput;
window.eliminarItem = eliminarItem;
window.vaciarCarrito = vaciarCarrito;
window.aplicarCupon = aplicarCupon;
window.eliminarCupon = eliminarCupon;
window.irACheckout = irACheckout;

console.log('✅ carrito.js cargado correctamente');
