// ========================================
// SPORTIVA E-COMMERCE - CHECKOUT
// Integración con API REST Backend
// ========================================

// ===========================
// 1. VARIABLES GLOBALES
// ===========================

let pasoActual = 1;
const TOTAL_PASOS = 3;

let datosCheckout = {
    // Paso 1: Dirección de envío
    direccion_envio: {
        nombres: '',
        apellidos: '',
        documento_tipo: 'DNI',
        documento_numero: '',
        telefono: '',
        email: '',
        direccion: '',
        referencia: '',
        departamento: '',
        provincia: '',
        distrito: '',
        codigo_postal: ''
    },
    
    // Facturación
    requiere_factura: false,
    datos_facturacion: {
        razon_social: '',
        ruc: '',
        direccion_fiscal: ''
    },
    
    // Paso 2: Método de pago
    metodo_pago: '',
    datos_pago: {},
    
    // Resumen
    carrito: null,
    total: 0,
    
    // Confirmación
    pedido_id: null,
    numero_pedido: null
};

// ===========================
// 2. INICIALIZACIÓN
// ===========================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('💳 Inicializando checkout...');
    
    // Verificar autenticación
    const isAuthenticated = typeof authService !== 'undefined' && authService.isLoggedIn();
    
    if (!isAuthenticated) {
        mostrarMensajeLogin();
        return;
    }
    
    // Verificar que hay items en el carrito
    await verificarCarrito();
    
    // Cargar datos del usuario
    await cargarDatosUsuario();
    
    // Mostrar paso inicial
    mostrarPaso(1);
    
    // Inicializar event listeners
    inicializarEventListeners();
    
    console.log('✅ Checkout inicializado correctamente');
});

// ===========================
// 3. VERIFICACIÓN INICIAL
// ===========================

/**
 * Verificar que hay items en el carrito
 */
async function verificarCarrito() {
    try {
        if (typeof apiConfig !== 'undefined') {
            const response = await apiConfig.apiGet('/carrito');
            
            if (!response.success || !response.data || response.data.items.length === 0) {
                redirigirACarrito('Tu carrito está vacío');
                return;
            }
            
            datosCheckout.carrito = response.data;
            datosCheckout.total = response.data.total;
            
        } else {
            // Verificar carrito local
            const carritoLocal = JSON.parse(localStorage.getItem('carrito')) || [];
            
            if (carritoLocal.length === 0) {
                redirigirACarrito('Tu carrito está vacío');
                return;
            }
            
            datosCheckout.carrito = { items: carritoLocal };
        }
        
        console.log('✅ Carrito verificado:', datosCheckout.carrito);
        
    } catch (error) {
        console.error('❌ Error al verificar carrito:', error);
        redirigirACarrito('Error al cargar el carrito');
    }
}

/**
 * Cargar datos del usuario autenticado
 */
async function cargarDatosUsuario() {
    try {
        if (typeof authService !== 'undefined' && authService.isLoggedIn()) {
            const usuario = authService.getCurrentUser();
            
            if (usuario) {
                // Pre-llenar formulario con datos del usuario
                datosCheckout.direccion_envio.nombres = usuario.nombre || '';
                datosCheckout.direccion_envio.apellidos = usuario.apellidos || '';
                datosCheckout.direccion_envio.email = usuario.email || '';
                datosCheckout.direccion_envio.telefono = usuario.telefono || '';
                datosCheckout.direccion_envio.documento_numero = usuario.dni || usuario.documento_numero || '';
            }
        }
    } catch (error) {
        console.error('❌ Error al cargar datos del usuario:', error);
    }
}

/**
 * Redirigir al carrito con mensaje
 */
function redirigirACarrito(mensaje) {
    alert(mensaje);
    window.location.href = '/carrito.html';
}

/**
 * Mostrar mensaje de login
 */
function mostrarMensajeLogin() {
    const main = document.querySelector('main') || document.body;
    main.innerHTML = `
        <div class="mensaje-login">
            <i class="fas fa-sign-in-alt"></i>
            <h2>Inicia sesión para continuar</h2>
            <p>Necesitas estar autenticado para realizar una compra</p>
            <a href="/login.html?redirect=${encodeURIComponent(window.location.pathname)}" class="btn-primary">
                Iniciar sesión
            </a>
        </div>
    `;
}

// ===========================
// 4. NAVEGACIÓN ENTRE PASOS
// ===========================

/**
 * Mostrar paso específico
 */
function mostrarPaso(numeroPaso) {
    pasoActual = numeroPaso;
    
    // Actualizar indicador de pasos
    actualizarIndicadorPasos();
    
    // Ocultar todos los pasos
    document.querySelectorAll('.paso-content').forEach(paso => {
        paso.style.display = 'none';
    });
    
    // Mostrar paso actual
    const pasoElement = document.getElementById(`paso-${numeroPaso}`);
    if (pasoElement) {
        pasoElement.style.display = 'block';
    }
    
    // Renderizar contenido del paso
    switch (numeroPaso) {
        case 1:
            renderizarPaso1();
            break;
        case 2:
            renderizarPaso2();
            break;
        case 3:
            renderizarPaso3();
            break;
    }
    
    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Actualizar indicador de pasos
 */
function actualizarIndicadorPasos() {
    for (let i = 1; i <= TOTAL_PASOS; i++) {
        const indicador = document.querySelector(`.paso-indicador[data-paso="${i}"]`);
        
        if (indicador) {
            indicador.classList.remove('activo', 'completado');
            
            if (i < pasoActual) {
                indicador.classList.add('completado');
            } else if (i === pasoActual) {
                indicador.classList.add('activo');
            }
        }
    }
}

/**
 * Ir al siguiente paso
 */
async function siguientePaso() {
    // Validar paso actual antes de avanzar
    const esValido = await validarPaso(pasoActual);
    
    if (!esValido) {
        return;
    }
    
    // Avanzar al siguiente paso
    if (pasoActual < TOTAL_PASOS) {
        mostrarPaso(pasoActual + 1);
    }
}

/**
 * Volver al paso anterior
 */
function pasoAnterior() {
    if (pasoActual > 1) {
        mostrarPaso(pasoActual - 1);
    }
}

// ===========================
// 5. PASO 1: DIRECCIÓN
// ===========================

/**
 * Renderizar paso 1
 */
function renderizarPaso1() {
    const container = document.getElementById('paso-1');
    if (!container) return;
    
    const datos = datosCheckout.direccion_envio;
    
    container.innerHTML = `
        <div class="paso-header">
            <h2>Dirección de Envío</h2>
            <p>Completa los datos para la entrega de tu pedido</p>
        </div>
        
        <div class="formulario-checkout">
            <!-- Datos personales -->
            <div class="formulario-seccion">
                <h3>Datos Personales</h3>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Nombres *</label>
                        <input type="text" 
                                id="nombres" 
                                value="${datos.nombres}"
                                placeholder="Ingresa tus nombres"
                                required>
                    </div>
                    
                    <div class="form-group">
                        <label>Apellidos *</label>
                        <input type="text" 
                                id="apellidos" 
                                value="${datos.apellidos}"
                                placeholder="Ingresa tus apellidos"
                                required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Tipo de Documento *</label>
                        <select id="documento_tipo">
                            <option value="DNI" ${datos.documento_tipo === 'DNI' ? 'selected' : ''}>DNI</option>
                            <option value="CE" ${datos.documento_tipo === 'CE' ? 'selected' : ''}>Carné de Extranjería</option>
                            <option value="Pasaporte" ${datos.documento_tipo === 'Pasaporte' ? 'selected' : ''}>Pasaporte</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Número de Documento *</label>
                        <input type="text" 
                                id="documento_numero" 
                                value="${datos.documento_numero}"
                                placeholder="Ej: 12345678"
                                maxlength="15"
                                required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Teléfono *</label>
                        <input type="tel" 
                                id="telefono" 
                                value="${datos.telefono}"
                                placeholder="Ej: 987654321"
                                maxlength="9"
                                required>
                    </div>
                    
                    <div class="form-group">
                        <label>Email *</label>
                        <input type="email" 
                                id="email" 
                                value="${datos.email}"
                                placeholder="tu@email.com"
                                required>
                    </div>
                </div>
            </div>
            
            <!-- Dirección de envío -->
            <div class="formulario-seccion">
                <h3>Dirección de Envío</h3>
                
                <div class="form-group">
                    <label>Dirección Completa *</label>
                    <input type="text" 
                            id="direccion" 
                            value="${datos.direccion}"
                            placeholder="Calle, número, urbanización"
                            required>
                </div>
                
                <div class="form-group">
                    <label>Referencia</label>
                    <input type="text" 
                            id="referencia" 
                            value="${datos.referencia}"
                            placeholder="Ej: Casa azul, cerca al parque">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Departamento *</label>
                        <select id="departamento" onchange="cargarProvincias()" required>
                            <option value="">Selecciona</option>
                            <option value="Lima" ${datos.departamento === 'Lima' ? 'selected' : ''}>Lima</option>
                            <option value="Arequipa">Arequipa</option>
                            <option value="Cusco">Cusco</option>
                            <option value="Piura">Piura</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Provincia *</label>
                        <select id="provincia" onchange="cargarDistritos()" required>
                            <option value="">Selecciona</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Distrito *</label>
                        <select id="distrito" required>
                            <option value="">Selecciona</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- Facturación -->
            <div class="formulario-seccion">
                <div class="checkbox-group">
                    <input type="checkbox" 
                            id="requiere_factura" 
                            ${datosCheckout.requiere_factura ? 'checked' : ''}
                            onchange="toggleFacturacion()">
                    <label for="requiere_factura">Requiero factura electrónica</label>
                </div>
                
                <div id="datos-facturacion" style="display: ${datosCheckout.requiere_factura ? 'block' : 'none'};">
                    <div class="form-group">
                        <label>RUC *</label>
                        <input type="text" 
                                id="ruc" 
                                value="${datosCheckout.datos_facturacion.ruc}"
                                placeholder="20123456789"
                                maxlength="11">
                    </div>
                    
                    <div class="form-group">
                        <label>Razón Social *</label>
                        <input type="text" 
                                id="razon_social" 
                                value="${datosCheckout.datos_facturacion.razon_social}"
                                placeholder="Nombre de la empresa">
                    </div>
                    
                    <div class="form-group">
                        <label>Dirección Fiscal *</label>
                        <input type="text" 
                                id="direccion_fiscal" 
                                value="${datosCheckout.datos_facturacion.direccion_fiscal}"
                                placeholder="Dirección registrada en SUNAT">
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Botones de navegación -->
        <div class="paso-navegacion">
            <button class="btn-secondary" onclick="window.location.href='/carrito.html'">
                <i class="fas fa-arrow-left"></i>
                Volver al carrito
            </button>
            
            <button class="btn-primary" onclick="siguientePaso()">
                Continuar
                <i class="fas fa-arrow-right"></i>
            </button>
        </div>
        
        <!-- Resumen lateral -->
        ${renderizarResumenLateral()}
    `;
}

/**
 * Toggle sección de facturación
 */
function toggleFacturacion() {
    const checkbox = document.getElementById('requiere_factura');
    const datosFacturacion = document.getElementById('datos-facturacion');
    
    if (checkbox && datosFacturacion) {
        datosCheckout.requiere_factura = checkbox.checked;
        datosFacturacion.style.display = checkbox.checked ? 'block' : 'none';
    }
}

// ===========================
// 6. PASO 2: MÉTODO DE PAGO
// ===========================

/**
 * Renderizar paso 2
 */
function renderizarPaso2() {
    const container = document.getElementById('paso-2');
    if (!container) return;
    
    container.innerHTML = `
        <div class="paso-header">
            <h2>Método de Pago</h2>
            <p>Selecciona cómo deseas pagar tu pedido</p>
        </div>
        
        <div class="metodos-pago">
            <!-- Tarjeta de crédito/débito -->
            <div class="metodo-pago-card ${datosCheckout.metodo_pago === 'tarjeta' ? 'selected' : ''}" 
                  onclick="seleccionarMetodoPago('tarjeta')">
                <input type="radio" 
                        name="metodo_pago" 
                        value="tarjeta" 
                        ${datosCheckout.metodo_pago === 'tarjeta' ? 'checked' : ''}>
                <div class="metodo-pago-info">
                    <i class="fas fa-credit-card"></i>
                    <div>
                        <h4>Tarjeta de Crédito/Débito</h4>
                        <p>Visa, Mastercard, American Express</p>
                    </div>
                </div>
            </div>
            
            <div id="form-tarjeta" class="metodo-pago-form" style="display: ${datosCheckout.metodo_pago === 'tarjeta' ? 'block' : 'none'};">
                <div class="form-group">
                    <label>Número de Tarjeta *</label>
                    <input type="text" 
                            id="numero_tarjeta" 
                            placeholder="1234 5678 9012 3456"
                            maxlength="19">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Vencimiento *</label>
                        <input type="text" 
                                id="vencimiento" 
                                placeholder="MM/AA"
                                maxlength="5">
                    </div>
                    
                    <div class="form-group">
                        <label>CVV *</label>
                        <input type="text" 
                                id="cvv" 
                                placeholder="123"
                                maxlength="4">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Nombre en la Tarjeta *</label>
                    <input type="text" 
                            id="nombre_tarjeta" 
                            placeholder="Como aparece en la tarjeta">
                </div>
            </div>
            
            <!-- Transferencia bancaria -->
            <div class="metodo-pago-card ${datosCheckout.metodo_pago === 'transferencia' ? 'selected' : ''}" 
                  onclick="seleccionarMetodoPago('transferencia')">
                <input type="radio" 
                        name="metodo_pago" 
                        value="transferencia" 
                        ${datosCheckout.metodo_pago === 'transferencia' ? 'checked' : ''}>
                <div class="metodo-pago-info">
                    <i class="fas fa-university"></i>
                    <div>
                        <h4>Transferencia Bancaria</h4>
                        <p>BCP, Interbank, BBVA, Scotiabank</p>
                    </div>
                </div>
            </div>
            
            <div id="form-transferencia" class="metodo-pago-form" style="display: ${datosCheckout.metodo_pago === 'transferencia' ? 'block' : 'none'};">
                <div class="info-transferencia">
                    <p><strong>Datos para transferencia:</strong></p>
                    <ul>
                        <li>Banco: BCP</li>
                        <li>Cuenta Corriente: 194-1234567890-0-12</li>
                        <li>CCI: 002-194-001234567890-12</li>
                        <li>Titular: SPORTIVA E-COMMERCE S.A.C.</li>
                        <li>RUC: 20123456789</li>
                    </ul>
                    <p class="nota">Envía tu comprobante de pago al correo: pagos@sportiva.pe</p>
                </div>
            </div>
            
            <!-- Pago contra entrega -->
            <div class="metodo-pago-card ${datosCheckout.metodo_pago === 'contra_entrega' ? 'selected' : ''}" 
                  onclick="seleccionarMetodoPago('contra_entrega')">
                <input type="radio" 
                        name="metodo_pago" 
                        value="contra_entrega" 
                        ${datosCheckout.metodo_pago === 'contra_entrega' ? 'checked' : ''}>
                <div class="metodo-pago-info">
                    <i class="fas fa-money-bill-wave"></i>
                    <div>
                        <h4>Pago Contra Entrega</h4>
                        <p>Paga en efectivo al recibir tu pedido</p>
                    </div>
                </div>
            </div>
            
            <div id="form-contra-entrega" class="metodo-pago-form" style="display: ${datosCheckout.metodo_pago === 'contra_entrega' ? 'block' : 'none'};">
                <div class="info-contra-entrega">
                    <p><i class="fas fa-info-circle"></i> Ten el monto exacto listo al momento de la entrega</p>
                </div>
            </div>
        </div>
        
        <!-- Botones de navegación -->
        <div class="paso-navegacion">
            <button class="btn-secondary" onclick="pasoAnterior()">
                <i class="fas fa-arrow-left"></i>
                Anterior
            </button>
            
            <button class="btn-primary" onclick="siguientePaso()">
                Continuar
                <i class="fas fa-arrow-right"></i>
            </button>
        </div>
        
        <!-- Resumen lateral -->
        ${renderizarResumenLateral()}
    `;
}

/**
 * Seleccionar método de pago
 */
function seleccionarMetodoPago(metodo) {
    datosCheckout.metodo_pago = metodo;
    
    // Actualizar UI
    document.querySelectorAll('.metodo-pago-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    event.currentTarget.classList.add('selected');
    
    // Mostrar/ocultar formularios
    document.querySelectorAll('.metodo-pago-form').forEach(form => {
        form.style.display = 'none';
    });
    
    const form = document.getElementById(`form-${metodo}`);
    if (form) {
        form.style.display = 'block';
    }
}

// ===========================
// 7. PASO 3: CONFIRMACIÓN
// ===========================

/**
 * Renderizar paso 3
 */
function renderizarPaso3() {
    const container = document.getElementById('paso-3');
    if (!container) return;
    
    container.innerHTML = `
        <div class="paso-header">
            <h2>Confirmar Pedido</h2>
            <p>Revisa tu pedido antes de finalizar la compra</p>
        </div>
        
        <div class="confirmacion-contenido">
            <!-- Resumen de dirección -->
            <div class="confirmacion-seccion">
                <h3>
                    <i class="fas fa-shipping-fast"></i>
                    Dirección de Envío
                </h3>
                <div class="datos-resumen">
                    <p><strong>${datosCheckout.direccion_envio.nombres} ${datosCheckout.direccion_envio.apellidos}</strong></p>
                    <p>${datosCheckout.direccion_envio.documento_tipo}: ${datosCheckout.direccion_envio.documento_numero}</p>
                    <p>${datosCheckout.direccion_envio.direccion}</p>
                    <p>${datosCheckout.direccion_envio.distrito}, ${datosCheckout.direccion_envio.provincia}, ${datosCheckout.direccion_envio.departamento}</p>
                    <p>Teléfono: ${datosCheckout.direccion_envio.telefono}</p>
                    <p>Email: ${datosCheckout.direccion_envio.email}</p>
                </div>
                <button class="btn-link" onclick="mostrarPaso(1)">Editar</button>
            </div>
            
            <!-- Resumen de método de pago -->
            <div class="confirmacion-seccion">
                <h3>
                    <i class="fas fa-credit-card"></i>
                    Método de Pago
                </h3>
                <div class="datos-resumen">
                    <p><strong>${obtenerNombreMetodoPago(datosCheckout.metodo_pago)}</strong></p>
                </div>
                <button class="btn-link" onclick="mostrarPaso(2)">Editar</button>
            </div>
            
            <!-- Resumen de productos -->
            <div class="confirmacion-seccion">
                <h3>
                    <i class="fas fa-shopping-bag"></i>
                    Productos (${datosCheckout.carrito.items.length})
                </h3>
                <div class="productos-resumen">
                    ${datosCheckout.carrito.items.map(item => `
                        <div class="producto-resumen-item">
                            <img src="${item.imagen || item.imagen_url}" alt="${item.nombre}">
                            <div class="producto-resumen-info">
                                <h4>${item.nombre}</h4>
                                <p>Talla: ${item.talla || 'N/A'} | Cantidad: ${item.cantidad}</p>
                            </div>
                            <div class="producto-resumen-precio">
                                S/ ${(parseFloat(item.precio) * parseInt(item.cantidad)).toFixed(2)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Resumen de totales -->
            <div class="confirmacion-seccion totales">
                <h3>Resumen de Compra</h3>
                <div class="totales-lineas">
                    <div class="total-linea">
                        <span>Subtotal:</span>
                        <span>S/ ${datosCheckout.carrito.subtotal.toFixed(2)}</span>
                    </div>
                    ${datosCheckout.carrito.descuento > 0 ? `
                        <div class="total-linea descuento">
                            <span>Descuento:</span>
                            <span>-S/ ${datosCheckout.carrito.descuento.toFixed(2)}</span>
                        </div>
                    ` : ''}
                    <div class="total-linea">
                        <span>Envío:</span>
                        <span>${datosCheckout.carrito.envio === 0 ? 'GRATIS' : 'S/ ' + datosCheckout.carrito.envio.toFixed(2)}</span>
                    </div>
                    <div class="total-linea">
                        <span>IGV (18%):</span>
                        <span>S/ ${datosCheckout.carrito.igv.toFixed(2)}</span>
                    </div>
                    <div class="total-linea total-final">
                        <span>Total:</span>
                        <span>S/ ${datosCheckout.carrito.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <!-- Términos y condiciones -->
            <div class="terminos-condiciones">
                <div class="checkbox-group">
                    <input type="checkbox" id="acepto_terminos" required>
                    <label for="acepto_terminos">
                        Acepto los <a href="/terminos.html" target="_blank">términos y condiciones</a> 
                        y las <a href="/politicas.html" target="_blank">políticas de privacidad</a>
                    </label>
                </div>
            </div>
        </div>
        
        <!-- Botones de navegación -->
        <div class="paso-navegacion">
            <button class="btn-secondary" onclick="pasoAnterior()">
                <i class="fas fa-arrow-left"></i>
                Anterior
            </button>
            
            <button class="btn-primary btn-lg" onclick="finalizarCompra()">
                <i class="fas fa-lock"></i>
                Finalizar Compra
            </button>
        </div>
    `;
}

/**
 * Obtener nombre del método de pago
 */
function obtenerNombreMetodoPago(metodo) {
    const nombres = {
        'tarjeta': 'Tarjeta de Crédito/Débito',
        'transferencia': 'Transferencia Bancaria',
        'contra_entrega': 'Pago Contra Entrega'
    };
    
    return nombres[metodo] || metodo;
}

// ===========================
// 8. VALIDACIONES
// ===========================

/**
 * Validar paso actual
 */
async function validarPaso(paso) {
    switch (paso) {
        case 1:
            return validarPaso1();
        case 2:
            return validarPaso2();
        case 3:
            return validarPaso3();
        default:
            return true;
    }
}

/**
 * Validar paso 1 (Dirección)
 */
function validarPaso1() {
    // Capturar datos del formulario
    datosCheckout.direccion_envio.nombres = document.getElementById('nombres')?.value || '';
    datosCheckout.direccion_envio.apellidos = document.getElementById('apellidos')?.value || '';
    datosCheckout.direccion_envio.documento_tipo = document.getElementById('documento_tipo')?.value || 'DNI';
    datosCheckout.direccion_envio.documento_numero = document.getElementById('documento_numero')?.value || '';
    datosCheckout.direccion_envio.telefono = document.getElementById('telefono')?.value || '';
    datosCheckout.direccion_envio.email = document.getElementById('email')?.value || '';
    datosCheckout.direccion_envio.direccion = document.getElementById('direccion')?.value || '';
    datosCheckout.direccion_envio.referencia = document.getElementById('referencia')?.value || '';
    datosCheckout.direccion_envio.departamento = document.getElementById('departamento')?.value || '';
    datosCheckout.direccion_envio.provincia = document.getElementById('provincia')?.value || '';
    datosCheckout.direccion_envio.distrito = document.getElementById('distrito')?.value || '';
    
    // Validar campos requeridos
    const camposRequeridos = [
        'nombres', 'apellidos', 'documento_numero', 'telefono', 'email', 
        'direccion', 'departamento', 'provincia', 'distrito'
    ];
    
    for (const campo of camposRequeridos) {
        if (!datosCheckout.direccion_envio[campo]) {
            mostrarNotificacion(`El campo ${campo} es requerido`, 'warning');
            return false;
        }
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(datosCheckout.direccion_envio.email)) {
        mostrarNotificacion('Email inválido', 'warning');
        return false;
    }
    
    // Validar DNI (8 dígitos)
    if (datosCheckout.direccion_envio.documento_tipo === 'DNI') {
        const dniRegex = /^\d{8}$/;
        if (!dniRegex.test(datosCheckout.direccion_envio.documento_numero)) {
            mostrarNotificacion('DNI debe tener 8 dígitos', 'warning');
            return false;
        }
    }
    
    // Validar teléfono (9 dígitos)
    const telefonoRegex = /^\d{9}$/;
    if (!telefonoRegex.test(datosCheckout.direccion_envio.telefono)) {
        mostrarNotificacion('Teléfono debe tener 9 dígitos', 'warning');
        return false;
    }
    
    // Validar facturación si está marcado
    if (datosCheckout.requiere_factura) {
        datosCheckout.datos_facturacion.ruc = document.getElementById('ruc')?.value || '';
        datosCheckout.datos_facturacion.razon_social = document.getElementById('razon_social')?.value || '';
        datosCheckout.datos_facturacion.direccion_fiscal = document.getElementById('direccion_fiscal')?.value || '';
        
        if (!datosCheckout.datos_facturacion.ruc || !datosCheckout.datos_facturacion.razon_social) {
            mostrarNotificacion('Completa los datos de facturación', 'warning');
            return false;
        }
        
        // Validar RUC (11 dígitos)
        const rucRegex = /^\d{11}$/;
        if (!rucRegex.test(datosCheckout.datos_facturacion.ruc)) {
            mostrarNotificacion('RUC debe tener 11 dígitos', 'warning');
            return false;
        }
    }
    
    return true;
}

/**
 * Validar paso 2 (Método de pago)
 */
function validarPaso2() {
    if (!datosCheckout.metodo_pago) {
        mostrarNotificacion('Selecciona un método de pago', 'warning');
        return false;
    }
    
    // Validar datos de tarjeta si es necesario
    if (datosCheckout.metodo_pago === 'tarjeta') {
        const numeroTarjeta = document.getElementById('numero_tarjeta')?.value || '';
        const vencimiento = document.getElementById('vencimiento')?.value || '';
        const cvv = document.getElementById('cvv')?.value || '';
        const nombreTarjeta = document.getElementById('nombre_tarjeta')?.value || '';
        
        if (!numeroTarjeta || !vencimiento || !cvv || !nombreTarjeta) {
            mostrarNotificacion('Completa los datos de la tarjeta', 'warning');
            return false;
        }
        
        datosCheckout.datos_pago = {
            numero_tarjeta: numeroTarjeta,
            vencimiento: vencimiento,
            cvv: cvv,
            nombre_tarjeta: nombreTarjeta
        };
    }
    
    return true;
}

/**
 * Validar paso 3 (Confirmación)
 */
function validarPaso3() {
    const aceptoTerminos = document.getElementById('acepto_terminos')?.checked;
    
    if (!aceptoTerminos) {
        mostrarNotificacion('Debes aceptar los términos y condiciones', 'warning');
        return false;
    }
    
    return true;
}

// ===========================
// 9. FINALIZAR COMPRA
// ===========================

/**
 * Finalizar compra y crear pedido
 */
async function finalizarCompra() {
    // Validar paso 3
    if (!validarPaso3()) {
        return;
    }
    
    // Deshabilitar botón
    const btnFinalizar = event.target;
    btnFinalizar.disabled = true;
    btnFinalizar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    
    mostrarLoader(true);
    
    try {
        if (typeof apiConfig !== 'undefined') {
            // Crear pedido en la API
            const datosPedido = {
                direccion_envio: datosCheckout.direccion_envio,
                requiere_factura: datosCheckout.requiere_factura,
                datos_facturacion: datosCheckout.requiere_factura ? datosCheckout.datos_facturacion : null,
                metodo_pago: datosCheckout.metodo_pago,
                datos_pago: datosCheckout.datos_pago
            };
            
            const response = await apiConfig.apiPost('/pedidos', datosPedido);
            
            if (response.success && response.data) {
                datosCheckout.pedido_id = response.data.pedido_id;
                datosCheckout.numero_pedido = response.data.numero_pedido;
                
                // Redirigir a página de confirmación
                window.location.href = `/confirmacion.html?pedido=${datosCheckout.numero_pedido}`;
            } else {
                throw new Error(response.message || 'Error al crear el pedido');
            }
        } else {
            // Simular creación de pedido
            datosCheckout.numero_pedido = 'SPV-' + Date.now();
            
            setTimeout(() => {
                window.location.href = `/confirmacion.html?pedido=${datosCheckout.numero_pedido}`;
            }, 1000);
        }
        
    } catch (error) {
        console.error('❌ Error al finalizar compra:', error);
        mostrarNotificacion(error.message || 'Error al procesar el pedido', 'error');
        
        // Rehabilitar botón
        btnFinalizar.disabled = false;
        btnFinalizar.innerHTML = '<i class="fas fa-lock"></i> Finalizar Compra';
    } finally {
        mostrarLoader(false);
    }
}

// ===========================
// 10. HELPERS
// ===========================

/**
 * Renderizar resumen lateral
 */
function renderizarResumenLateral() {
    if (!datosCheckout.carrito) return '';
    
    return `
        <div class="resumen-lateral">
            <h3>Resumen del Pedido</h3>
            <div class="resumen-items">
                <div class="resumen-linea">
                    <span>Productos (${datosCheckout.carrito.items.length}):</span>
                    <span>S/ ${datosCheckout.carrito.subtotal.toFixed(2)}</span>
                </div>
                <div class="resumen-linea">
                    <span>Envío:</span>
                    <span>${datosCheckout.carrito.envio === 0 ? 'GRATIS' : 'S/ ' + datosCheckout.carrito.envio.toFixed(2)}</span>
                </div>
                <div class="resumen-divider"></div>
                <div class="resumen-linea total">
                    <span>Total:</span>
                    <span>S/ ${datosCheckout.carrito.total.toFixed(2)}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Cargar provincias según departamento
 */
function cargarProvincias() {
    // Implementación básica - se puede expandir con datos reales
    const provinciaSelect = document.getElementById('provincia');
    if (provinciaSelect) {
        provinciaSelect.innerHTML = '<option value="">Selecciona</option>';
        provinciaSelect.innerHTML += '<option value="Lima">Lima</option>';
    }
}

/**
 * Cargar distritos según provincia
 */
function cargarDistritos() {
    // Implementación básica - se puede expandir con datos reales
    const distritoSelect = document.getElementById('distrito');
    if (distritoSelect) {
        distritoSelect.innerHTML = '<option value="">Selecciona</option>';
        distritoSelect.innerHTML += '<option value="Miraflores">Miraflores</option>';
        distritoSelect.innerHTML += '<option value="San Isidro">San Isidro</option>';
        distritoSelect.innerHTML += '<option value="Surco">Surco</option>';
    }
}

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
// 11. EVENT LISTENERS
// ===========================

function inicializarEventListeners() {
    // Formatear número de tarjeta
    const numeroTarjetaInput = document.getElementById('numero_tarjeta');
    if (numeroTarjetaInput) {
        numeroTarjetaInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\s/g, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
    }
    
    // Formatear vencimiento
    const vencimientoInput = document.getElementById('vencimiento');
    if (vencimientoInput) {
        vencimientoInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }
}

// ===========================
// 12. EXPORTAR FUNCIONES
// ===========================

window.mostrarPaso = mostrarPaso;
window.siguientePaso = siguientePaso;
window.pasoAnterior = pasoAnterior;
window.toggleFacturacion = toggleFacturacion;
window.seleccionarMetodoPago = seleccionarMetodoPago;
window.finalizarCompra = finalizarCompra;
window.cargarProvincias = cargarProvincias;
window.cargarDistritos = cargarDistritos;

console.log('✅ checkout.js cargado correctamente');
