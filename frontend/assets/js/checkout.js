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
            console.log("🔄 Solicitando resumen al backend...");
            const response = await apiConfig.apiGet('/carrito/resumen');
            
            if (!response.success || !response.data) {
                throw new Error("La API no devolvió datos válidos");
            }

            const data = response.data;
            const itemsBackend = data.items || data.productos || [];

            if (itemsBackend.length === 0) {
                redirigirACarrito('Tu carrito está vacío');
                return;
            }

            // --- NORMALIZACIÓN DE DATOS ---
            datosCheckout.carrito = {
                items: itemsBackend.map(item => {
                    let rawImg = item.imagen || item.imagen_url || item.url_imagen || '';

                    if (rawImg && !rawImg.startsWith('http')) {
                        rawImg = rawImg.replace(/^frontend\//, '').replace(/^public\//, '');
                        
                        if (rawImg.startsWith('/')) rawImg = rawImg.substring(1);

                        if (rawImg.startsWith('assets/')) {
                            rawImg = '../' + rawImg;
                        }
                    }
                    
                    // Si no hay imagen, usar placeholder
                    if (!rawImg) rawImg = '../assets/images/placeholder.jpg';

                    return {
                        ...item,
                        nombre: item.nombre_producto || item.nombre || item.producto || 'Producto sin nombre',
                        precio: parseFloat(item.precio_unitario || item.precio || item.precio_venta || 0),
                        imagen: rawImg,
                        cantidad: parseInt(item.cantidad || 1)
                    };
                }),
                subtotal: parseFloat(data.subtotal || data.monto_subtotal || 0),
                igv: parseFloat(data.igv || data.impuestos || data.monto_igv || 0),
                costoEnvio: parseFloat(data.costo_envio || data.envio || data.costoEnvio || 0),
                total: parseFloat(data.total || data.monto_total || data.total_pedido || 0),
                descuento: 0
            };

            // --- LÓGICA DE CUPÓN ---
            const cuponGuardado = localStorage.getItem('sportiva_cupon_checkout');
            if (cuponGuardado) {
                try {
                    const cuponData = JSON.parse(cuponGuardado);
                    datosCheckout.carrito.descuento = parseFloat(cuponData.descuento || 0);
                    datosCheckout.codigo_cupon = cuponData.codigo;
                    const totalBase = datosCheckout.carrito.subtotal + datosCheckout.carrito.igv + datosCheckout.carrito.costoEnvio;
                    datosCheckout.carrito.total = Math.max(0, totalBase - datosCheckout.carrito.descuento);
                } catch (e) { console.error(e); }
            }

            console.log('✅ Datos normalizados (imágenes corregidas):', datosCheckout.carrito);

        } else {
            throw new Error("API Config no disponible");
        }
        
        if(pasoActual === 3) renderizarPaso3();
        renderizarResumenLateral();
        
    } catch (error) {
        console.error('❌ Error en verificarCarrito:', error);
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
    
    // 1. Ocultar TODAS las secciones
    document.querySelectorAll('.checkout-section').forEach(paso => {
        paso.style.display = 'none';
        paso.classList.remove('active');
    });
    
    // 2. Renderizar el contenido dinámico del paso destino
    switch (numeroPaso) {
        case 1:
            break;
        case 2:
            renderizarPaso2();
            break;
        case 3:
            renderizarPaso3();
            break;
    }

    // 3. Mostrar la sección actual
    const pasoElement = document.getElementById(`paso${numeroPaso}`);
    if (pasoElement) {
        pasoElement.style.display = 'block';
        pasoElement.classList.add('active');
    } else {
        console.error(`❌ No se encontró el contenedor con id: paso${numeroPaso}`);
    }
    
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
    const container = document.getElementById('paso2');
    if (!container) return;
    
    const metodoActual = datosCheckout.metodo_pago;

    container.innerHTML = `
        <div class="paso-header" style="margin-bottom: 24px; text-align: center;">
            <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">Método de Pago</h2>
            <p style="color: #666;">Selecciona cómo deseas pagar tu pedido</p>
        </div>
        
        <div class="metodos-pago-container" style="display: flex; flex-direction: column; gap: 12px;">
            
            <div class="metodo-item-wrapper" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <div id="card-Tarjeta_Credito" 
                    class="metodo-header ${metodoActual === 'Tarjeta_Credito' ? 'selected' : ''}"
                    onclick="seleccionarMetodoPago('Tarjeta_Credito')"
                    style="padding: 16px; cursor: pointer; display: flex; align-items: center; gap: 16px; background: ${metodoActual === 'Tarjeta_Credito' ? '#F9FAFB' : '#fff'}; transition: background 0.2s;">
                    <input type="radio" name="metodo_pago" value="Tarjeta_Credito" ${metodoActual === 'Tarjeta_Credito' ? 'checked' : ''}>
                    <div style="font-size: 24px;">💳</div>
                    <div>
                        <strong style="display: block; color: #111827;">Tarjeta de Crédito/Débito</strong>
                        <span style="font-size: 13px; color: #6b7280;">Visa, Mastercard, American Express</span>
                    </div>
                </div>
                <div id="detalle-Tarjeta_Credito" style="display: ${metodoActual === 'Tarjeta_Credito' ? 'block' : 'none'}; border-top: 1px solid #e5e7eb;">
                    ${metodoActual === 'Tarjeta_Credito' ? generarHTMLDetallePago('Tarjeta_Credito') : ''}
                </div>
            </div>

            <div class="metodo-item-wrapper" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <div id="card-Transferencia" 
                    class="metodo-header ${metodoActual === 'Transferencia' ? 'selected' : ''}"
                    onclick="seleccionarMetodoPago('Transferencia')"
                    style="padding: 16px; cursor: pointer; display: flex; align-items: center; gap: 16px; background: ${metodoActual === 'Transferencia' ? '#F9FAFB' : '#fff'}; transition: background 0.2s;">
                    <input type="radio" name="metodo_pago" value="Transferencia" ${metodoActual === 'Transferencia' ? 'checked' : ''}>
                    <div style="font-size: 24px;">🏦</div>
                    <div>
                        <strong style="display: block; color: #111827;">Transferencia Bancaria</strong>
                        <span style="font-size: 13px; color: #6b7280;">BCP, Interbank, BBVA</span>
                    </div>
                </div>
                <div id="detalle-Transferencia" style="display: ${metodoActual === 'Transferencia' ? 'block' : 'none'}; border-top: 1px solid #e5e7eb;">
                    ${metodoActual === 'Transferencia' ? generarHTMLDetallePago('Transferencia') : ''}
                </div>
            </div>

            <div class="metodo-item-wrapper" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <div id="card-Yape" 
                    class="metodo-header ${metodoActual === 'Yape' ? 'selected' : ''}"
                    onclick="seleccionarMetodoPago('Yape')"
                    style="padding: 16px; cursor: pointer; display: flex; align-items: center; gap: 16px; background: ${metodoActual === 'Yape' ? '#F9FAFB' : '#fff'}; transition: background 0.2s;">
                    <input type="radio" name="metodo_pago" value="Yape" ${metodoActual === 'Yape' ? 'checked' : ''}>
                    <div style="font-size: 24px;">📱</div>
                    <div>
                        <strong style="display: block; color: #111827;">Yape / Plin</strong>
                        <span style="font-size: 13px; color: #6b7280;">Pago rápido con QR</span>
                    </div>
                </div>
                <div id="detalle-Yape" style="display: ${metodoActual === 'Yape' ? 'block' : 'none'}; border-top: 1px solid #e5e7eb;">
                    ${metodoActual === 'Yape' ? generarHTMLDetallePago('Yape') : ''}
                </div>
            </div>

            <div class="metodo-item-wrapper" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <div id="card-Contra_Entrega" 
                    class="metodo-header ${metodoActual === 'Contra_Entrega' ? 'selected' : ''}"
                    onclick="seleccionarMetodoPago('Contra_Entrega')"
                    style="padding: 16px; cursor: pointer; display: flex; align-items: center; gap: 16px; background: ${metodoActual === 'Contra_Entrega' ? '#F9FAFB' : '#fff'}; transition: background 0.2s;">
                    <input type="radio" name="metodo_pago" value="Contra_Entrega" ${metodoActual === 'Contra_Entrega' ? 'checked' : ''}>
                    <div style="font-size: 24px;">💵</div>
                    <div>
                        <strong style="display: block; color: #111827;">Pago Contra Entrega</strong>
                        <span style="font-size: 13px; color: #6b7280;">Paga en efectivo al recibir</span>
                    </div>
                </div>
                <div id="detalle-Contra_Entrega" style="display: ${metodoActual === 'Contra_Entrega' ? 'block' : 'none'}; border-top: 1px solid #e5e7eb;">
                    ${metodoActual === 'Contra_Entrega' ? generarHTMLDetallePago('Contra_Entrega') : ''}
                </div>
            </div>
        </div>

        <div class="paso-navegacion" style="display: flex; gap: 16px; margin-top: 32px;">
            <button class="btn btn-outline" onclick="irPaso1()" style="flex: 1; padding: 12px; border: 1px solid #000; background: white; cursor: pointer; font-weight: 600;">
                ← Volver
            </button>
            <button class="btn btn-primary" onclick="irPaso3()" style="flex: 2; padding: 12px; background: #FF6B35; color: white; border: none; cursor: pointer; font-weight: 600;">
                Revisar Pedido →
            </button>
        </div>
    `;

    // Si es tarjeta y ya tenemos datos guardados, restaurar datos
    if (metodoActual === 'Tarjeta_Credito') {
        setTimeout(() => {
            restaurarDatosFormulario(); 
            inicializarListenersTarjeta();
        }, 50);
    }
}

// Función para mostrar detalles según el método
function generarHTMLDetallePago(metodo) {
    if (!metodo) return '';
    
    if (metodo === 'Tarjeta_Credito') {
        return `
            <h4 style="margin-bottom: 16px; font-size: 14px;">Datos de la Tarjeta</h4>
            <div style="display: grid; gap: 16px;">
                <input type="text" class="form-input" placeholder="Número de Tarjeta" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <input type="text" class="form-input" placeholder="MM/AA">
                    <input type="text" class="form-input" placeholder="CVC">
                </div>
                <input type="text" class="form-input" placeholder="Nombre del Titular" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
        `;
    } else if (metodo === 'Transferencia') {
        return `
            <div style="font-size: 14px; color: #374151;">
                <p style="margin-bottom: 8px;"><strong>Realiza la transferencia a:</strong></p>
                <ul style="list-style: disc; padding-left: 20px; line-height: 1.6;">
                    <li>BCP Soles: 193-12345678-0-99</li>
                    <li>Interbank: 200-3001234567</li>
                    <li><strong>Titular:</strong> Sportiva SAC</li>
                </ul>
                <p style="margin-top: 12px; font-size: 13px; color: #666;">Deberás enviar la constancia al finalizar.</p>
            </div>
        `;
    } else if (metodo === 'Yape') {
        return `
            <div style="text-align: center;">
                <p style="margin-bottom: 12px;">Escanea el código QR para pagar:</p>
                <div style="width: 150px; height: 150px; background: #eee; margin: 0 auto; display: flex; align-items: center; justify-content: center; border: 2px dashed #ccc;">
                    [QR YAPE AQUI]
                </div>
                <p style="margin-top: 8px; font-weight: bold;">+51 987 654 321</p>
            </div>
        `;
    } else {
        return `<p style="font-size: 14px; color: #374151;">Pago en efectivo al momento de la entrega. Por favor tener el monto exacto.</p>`;
    }
}

/**
 * Seleccionar método de pago
 */
function seleccionarMetodoPago(metodo) {
    datosCheckout.metodo_pago = metodo;
    
    const metodos = ['Tarjeta_Credito', 'Transferencia', 'Yape', 'Contra_Entrega'];
    
    metodos.forEach(m => { 
        const header = document.getElementById(`card-${m}`);
        const radio = document.querySelector(`input[value="${m}"]`);
        const detalleDiv = document.getElementById(`detalle-${m}`);
        
        if (header && detalleDiv) {
            if (m === metodo) {
                // Activo
                header.style.backgroundColor = '#F9FAFB';
                header.style.borderColor = '#000';
                if(radio) radio.checked = true;
                
                // Mostrar detalle e inyectar HTML
                detalleDiv.style.display = 'block';
                detalleDiv.innerHTML = generarHTMLDetallePago(metodo);
                
                // Animación simple de entrada
                detalleDiv.style.opacity = '0';
                setTimeout(() => { 
                    detalleDiv.style.transition = 'opacity 0.3s'; 
                    detalleDiv.style.opacity = '1'; 
                }, 10);

            } else {
                // Inactivo
                header.style.backgroundColor = '#fff';
                header.style.borderColor = 'transparent';
                if(radio) radio.checked = false;
                
                // Ocultar y limpiar detalle
                detalleDiv.style.display = 'none';
                detalleDiv.innerHTML = '';
            }
        }
    });

    // Si seleccionó tarjeta, restaurar datos
    if (metodo === 'Tarjeta_Credito') {
        setTimeout(() => {
            restaurarDatosFormulario();
            inicializarListenersTarjeta();
        }, 50);
    }
}

/**
 * Restaura los datos del formulario de pago desde memoria
 */
function restaurarDatosFormulario() {
    const datos = datosCheckout.datos_pago;
    
    // Solo si hay datos guardados previamente
    if (datos && Object.keys(datos).length > 0) {
        const numInput = document.getElementById('numero_tarjeta');
        const vencInput = document.getElementById('vencimiento');
        const cvvInput = document.getElementById('cvv');
        const nomInput = document.getElementById('nombre_tarjeta');

        if (numInput) numInput.value = datos.numero_tarjeta || '';
        if (vencInput) vencInput.value = datos.vencimiento || '';
        if (cvvInput) cvvInput.value = datos.cvv || '';
        if (nomInput) nomInput.value = datos.nombre_tarjeta || '';
    }
}

function inicializarListenersTarjeta() {
    const numInput = document.getElementById('numero_tarjeta');
    const dateInput = document.getElementById('vencimiento');
    
    if (numInput) {
        numInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '').substring(0, 16);
            val = val.replace(/(.{4})/g, '$1 ').trim();
            e.target.value = val;
        });
    }
    if (dateInput) {
        dateInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '').substring(0, 4);
            if (val.length >= 2) {
                val = val.substring(0, 2) + '/' + val.substring(2, 4);
            }
            e.target.value = val;
        });
    }
}

// ===========================
// 7. PASO 3: CONFIRMACIÓN
// ===========================

/**
 * Renderizar paso 3
 */

function renderizarPaso3() {
    const container = document.getElementById('paso3');
    if (!container) return;
    
    const datos = datosCheckout.direccion_envio;
    const metodo = datosCheckout.metodo_pago.replace('_', ' ');

    container.innerHTML = `
        <div class="paso-header" style="margin-bottom: 24px; text-align: center;">
            <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">Confirmar Pedido</h2>
            <p style="color: #666;">Verifica que todo esté correcto antes de pagar</p>
        </div>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h3 style="font-weight: 700; font-size: 16px; color: #111827;">📍 Dirección de Envío</h3>
                <button onclick="irPaso1()" style="color: #FF6B35; font-weight: 600; font-size: 13px; border: none; background: none; cursor: pointer;">Editar</button>
            </div>
            <div style="font-size: 14px; color: #374151; line-height: 1.6;">
                <p><strong>${datos.nombres} ${datos.apellidos}</strong></p>
                <p>${datos.direccion}</p>
                <p>${datos.distrito}, ${datos.provincia}, ${datos.departamento}</p>
                <p>Tel: ${datos.telefono} | Email: ${datos.email}</p>
            </div>
        </div>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h3 style="font-weight: 700; font-size: 16px; color: #111827;">💳 Método de Pago</h3>
                <button onclick="irPaso2()" style="color: #FF6B35; font-weight: 600; font-size: 13px; border: none; background: none; cursor: pointer;">Editar</button>
            </div>
            <div style="font-size: 14px; color: #374151;">
                <p style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 600;">${metodo}</span>
                </p>
                ${generarResumenPagoExtra(datosCheckout.metodo_pago)}
            </div>
        </div>

        <div style="margin-bottom: 24px; padding: 12px; background: #fff; border: 1px dashed #ccc; border-radius: 4px;">
            <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; font-size: 13px;">
                <input type="checkbox" id="acepto_terminos" style="margin-top: 3px;">
                <span>
                    He leído y acepto los <a href="#" style="color: #FF6B35; text-decoration: underline;">Términos y Condiciones</a> y la <a href="#" style="color: #FF6B35; text-decoration: underline;">Política de Privacidad</a> de Sportiva.
                </span>
            </label>
        </div>

        <div class="paso-navegacion" style="display: flex; gap: 16px;">
            <button class="btn btn-outline" onclick="irPaso2()" style="flex: 1; padding: 14px; border: 1px solid #000; background: white; cursor: pointer; font-weight: 600; border-radius: 4px;">
                ← Atrás
            </button>
            
            <button class="btn btn-primary" onclick="procesarPedido()" style="flex: 2; padding: 14px; background: #000; color: white; border: none; cursor: pointer; font-weight: 700; border-radius: 4px; font-size: 16px;">
                REALIZAR PAGO
            </button>
        </div>
    `;
}

// Función auxiliar para mostrar detalles extra en el resumen
function generarResumenPagoExtra(metodo) {
    if (metodo === 'Tarjeta_Credito') {
        // Mostrar solo los últimos 4 dígitos
        return `<p style="color: #666; font-size: 13px; margin-top: 4px;">Terminada en **** 1234</p>`;
    }
    if (metodo === 'Yape' || metodo === 'Plin') {
        return `<p style="color: #666; font-size: 13px; margin-top: 4px;">Recuerda escanear el QR al finalizar.</p>`;
    }
    return '';
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
    document.querySelectorAll('.input-error-msg').forEach(el => el.remove());
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));

    if (!datosCheckout.metodo_pago) {
        mostrarNotificacion('Selecciona un método de pago', 'warning');
        return false;
    }
    
    // Validar datos de tarjeta
    if (datosCheckout.metodo_pago === 'Tarjeta_Credito') {
        const numeroInput = document.getElementById('numero_tarjeta');
        const vencimientoInput = document.getElementById('vencimiento');
        const cvvInput = document.getElementById('cvv');
        const nombreInput = document.getElementById('nombre_tarjeta');
        
        let esValido = true;

        const mostrarErrorCampo = (input, mensaje) => {
            input.classList.add('input-error');
            const msg = document.createElement('div');
            msg.className = 'input-error-msg';
            msg.style.color = '#DC2626';
            msg.style.fontSize = '12px';
            msg.style.marginTop = '4px';
            msg.innerText = mensaje;
            input.parentNode.appendChild(msg);
            esValido = false;
        };
        
        const numeroTarjeta = numeroInput?.value.replace(/\s/g, '') || '';
        const vencimiento = vencimientoInput?.value || '';
        const cvv = cvvInput?.value || '';
        const nombre = nombreInput?.value.trim() || '';
        
        // Validar campos vacíos
        if (!numeroTarjeta) mostrarErrorCampo(numeroInput, 'El número es obligatorio');
        if (!vencimiento) mostrarErrorCampo(vencimientoInput, 'La fecha es obligatoria');
        if (!cvv) mostrarErrorCampo(cvvInput, 'El CVV es obligatorio');
        if (!nombre) mostrarErrorCampo(nombreInput, 'El nombre es obligatorio');

        if (!esValido) return false;

        // Validar Número de Tarjeta
        if (!/^\d{16}$/.test(numeroTarjeta)) {
            mostrarErrorCampo(numeroInput, 'Debe tener 16 dígitos numéricos');
        }

        // Validar Fecha (MM/AA)
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(vencimiento)) {
            mostrarErrorCampo(vencimientoInput, 'Formato inválido (MM/AA)');
        } else {
            const [mesStr, anioStr] = vencimiento.split('/');
            const mes = parseInt(mesStr, 10);
            const anio = parseInt('20' + anioStr, 10);
            const fechaActual = new Date();
            const anioActual = fechaActual.getFullYear();
            const mesActual = fechaActual.getMonth() + 1;

            if (anio < anioActual || (anio === anioActual && mes < mesActual)) {
                mostrarErrorCampo(vencimientoInput, 'Tarjeta vencida');
            }
        }

        // Validar CVV
        if (!/^\d{3,4}$/.test(cvv)) {
            mostrarErrorCampo(cvvInput, 'Debe ser 3 o 4 dígitos');
        }
        
        if (!esValido) {
            mostrarNotificacion('Por favor corrige los errores en el formulario', 'error');
            return false;
        }

        // Guardar datos si todo está OK
        datosCheckout.datos_pago = {
            numero_tarjeta: numeroTarjeta,
            vencimiento: vencimiento,
            cvv: cvv,
            nombre_tarjeta: nombre
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
    // Validar paso 3 (Términos y condiciones)
    const aceptoTerminos = document.getElementById('acepto_terminos');
    if (!aceptoTerminos || !aceptoTerminos.checked) {
        mostrarNotificacion('Debes aceptar los términos y condiciones', 'warning');
        return;
    }
    
    // Deshabilitar botón para evitar doble click
    const btnFinalizar = document.querySelector('button[onclick="procesarPedido()"]') || document.querySelector('button[onclick="finalizarCompra()"]');
    if (btnFinalizar) {
        btnFinalizar.disabled = true;
        btnFinalizar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    }
    
    mostrarLoader(true);
    
    try {
        if (typeof apiConfig !== 'undefined') {
            
            let metodoBackend = 'tarjeta';
            
            switch (datosCheckout.metodo_pago) {
                case 'Tarjeta_Credito':
                    metodoBackend = 'tarjeta';
                    break;
                case 'Transferencia':
                    metodoBackend = 'transferencia';
                    break;
                case 'Yape':
                    metodoBackend = 'yape';
                    break;
                case 'Contra_Entrega':
                    metodoBackend = 'efectivo';
                    break;
            }

            const datosPedido = {
                direccion_envio: {
                    direccion: datosCheckout.direccion_envio.direccion,
                    distrito: datosCheckout.direccion_envio.distrito,
                    departamento: datosCheckout.direccion_envio.departamento || 'Lima',
                    provincia: datosCheckout.direccion_envio.provincia || 'Lima',
                    codigo_postal: datosCheckout.direccion_envio.codigo_postal || '15000',
                    referencia: datosCheckout.direccion_envio.referencia || ''
                },
                telefono_contacto: datosCheckout.direccion_envio.telefono,
                metodo_pago: metodoBackend,
                datos_pago: datosCheckout.datos_pago || {},
                requiere_factura: datosCheckout.requiere_factura || false,
                datos_facturacion: datosCheckout.requiere_factura ? {
                    ruc: datosCheckout.datos_facturacion.ruc,
                    razon_social: datosCheckout.datos_facturacion.razon_social,
                    direccion_fiscal: datosCheckout.datos_facturacion.direccion_fiscal
                } : null,
                codigo_cupon: datosCheckout.codigo_cupon || null,
                descuento: datosCheckout.carrito ? datosCheckout.carrito.descuento : 0,
                monto_total: datosCheckout.carrito ? datosCheckout.carrito.total : 0,
                notas: datosCheckout.notas || ''
            };
            
            console.log('📦 Enviando pedido al backend:', datosPedido);
            
            const response = await apiConfig.apiPost('/pedidos', datosPedido);
            
            console.log('✅ Respuesta del backend:', response);
            
            if (response.success && response.data) {
                // Éxito
                datosCheckout.pedido_id = response.data.pedido_id;
                datosCheckout.numero_pedido = response.data.numero_pedido;
                const numeroTracking = response.data.numero_tracking || `TRK-${response.data.numero_pedido}`;
                
                // Limpiar carrito local
                localStorage.removeItem('carrito');
                localStorage.removeItem('sportiva_cupon_checkout');
                
                // Redirigir
                window.location.href = `/confirmacion.html?pedido=${datosCheckout.numero_pedido}&tracking=${numeroTracking}`;
            } else {
                throw new Error(response.message || 'Error desconocido al crear el pedido');
            }
        } else {
            // Fallback local
            console.warn("API no disponible, simulando compra...");
            setTimeout(() => {
                window.location.href = `confirmacion.html?pedido=SIM-${Date.now()}`;
            }, 1000);
        }
        
    } catch (error) {
        console.error('❌ Error al finalizar compra:', error);
        
        let mensajeError = 'No se pudo procesar el pedido. Intenta nuevamente.';
        
        if (error.message) {
            // Si el error es de validación
            if (error.message.includes('Validation error') || error.message.includes(',')) {
                mensajeError = 'Revisa los datos ingresados (dirección o método de pago).';
            } else {
                mensajeError = error.message;
            }
        }
        
        mostrarNotificacion(mensajeError, 'error');
        
        // Rehabilitar botón
        if (btnFinalizar) {
            btnFinalizar.disabled = false;
            btnFinalizar.innerHTML = 'FINALIZAR COMPRA';
        }
    } finally {
        mostrarLoader(false);
    }
}

// ===========================
// 10. HELPERS
// ===========================

/**
 * Renderizar resumen lateral con productos y descuento
 */
function renderizarResumenLateral() {
    const contenedor = document.querySelector('.resumen-pedido');
    if (!contenedor || !datosCheckout.carrito) return;
    
    const c = datosCheckout.carrito;
    
    // Renderizar TODOS los productos
    const productosHtml = c.items.map(item => `
        <div class="producto-resumen" style="display: flex; gap: 12px; margin-bottom: 16px; padding-right: 8px;">
            <div style="width: 60px; height: 60px; background: #f3f4f6; border-radius: 4px; overflow: hidden; flex-shrink: 0;">
                <img src="${item.imagen}" 
                      alt="${item.nombre}"
                      style="width: 100%; height: 100%; object-fit: cover;"
                     /* SOLUCIÓN LOOP: this.onerror=null evita que se repita si el fallback también falla */
                      onerror="this.onerror=null; this.src='https://placehold.co/100x100?text=Sin+Imagen';">
            </div>
            <div style="flex: 1; min-width: 0;">
                <p class="text-small" style="margin-bottom: 4px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.nombre}</p>
                <p class="text-tiny text-secondary">Cant: ${item.cantidad}</p>
            </div>
            <div class="text-small font-bold" style="white-space: nowrap;">S/ ${(item.precio * item.cantidad).toFixed(2)}</div>
        </div>
    `).join('');

    // Lógica visual del Descuento
    const descuentoHtml = c.descuento > 0 
        ?  `<div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #27AE60; font-weight: bold;">
              <span>Descuento Cupón</span>
              <span>- S/ ${c.descuento.toFixed(2)}</span>
            </div>` 
        : '';

    contenedor.innerHTML = `
        <h3 class="text-uppercase" style="margin-bottom: 24px; font-size: 16px; font-weight: 700; border-bottom: 1px solid #E5E5E5; padding-bottom: 12px;">
            Resumen del Pedido
        </h3>
        
        <div id="productosResumen" style="max-height: 240px; overflow-y: auto; margin-bottom: 24px; border-bottom: 1px solid #E5E5E5; padding-bottom: 0;">
            ${productosHtml}
        </div>

        <div style="padding-top: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                <span class="text-secondary">Subtotal</span>
                <span>S/ ${c.subtotal.toFixed(2)}</span>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                <span class="text-secondary">IGV (18%)</span>
                <span>S/ ${c.igv.toFixed(2)}</span>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                <span class="text-secondary">Envío</span>
                <span>${(c.costoEnvio === 0 || c.envio === 0) ? '<span style="color:#27AE60">GRATIS</span>' : 'S/ ' + (c.costoEnvio || c.envio).toFixed(2)}</span>
            </div>

            ${descuentoHtml}

            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 700; padding-top: 16px; border-top: 2px solid var(--color-black); margin-top: 16px;">
                <span>Total</span>
                <span>S/ ${c.total.toFixed(2)}</span>
            </div>
        </div>
    `;
}

/**
 * Cargar provincias según departamento
 */
function cargarProvincias() {
    // Implementación básica
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
    // Implementación básica
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
    notificacion.style.cssText = `
        position: fixed; 
        bottom: 20px; 
        right: 20px; 
        padding: 16px 24px; 
        background: ${tipo === 'error' || tipo === 'warning' ? '#DC2626' : '#10B981'}; 
        color: white; 
        border-radius: 8px; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
        z-index: 9999; 
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
    `;
    
    notificacion.innerHTML = `<i class="fas fa-${tipo === 'error' ? 'exclamation-circle' : 'check-circle'}"></i> ${mensaje}`;
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.remove();
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

// ============================================
// 12. FUNCIONES DE NAVEGACIÓN Y EXPORTACIÓN
// ============================================

window.irPaso1 = function() {
    console.log("Navegando al Paso 1...");
    mostrarPaso(1);
};

window.irPaso2 = async function() {
    console.log("Intentando ir al Paso 2...");
    
    // Si estamos en el paso 1, validamos antes de avanzar
    if (pasoActual === 1) {
        // Aseguramos que la validación exista
        if (typeof validarPaso1 === 'function') {
            const esValido = validarPaso1();
            if (esValido) {
                console.log("Paso 1 válido. Avanzando...");
                mostrarPaso(2);
            } else {
                console.warn("Validación de Paso 1 falló");
            }
        } else {
            console.error("Error: validarPaso1 no está definida");
        }
    } else {
        // Si venimos del paso 3 (volver), mostramos directamente
        mostrarPaso(2);
    }
};

// INYECTAR ESTILOS DE ERROR
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    .input-error {
        border-color: #DC2626 !important;
        background-color: #FEF2F2 !important;
    }
    .input-error:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
    }
`;
document.head.appendChild(styleSheet);

/**
 * Generar HTML dinámico según el método seleccionado
 */
function generarHTMLDetallePago(metodo) {
    if (!metodo) return '';

    let html = `<div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 24px;">`;

    if (metodo === 'Tarjeta_Credito') {
        html += `
            <h4 style="margin-bottom: 16px; font-weight: 700; color: #111827;">Datos de la Tarjeta</h4>
            
            <div class="form-group" style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600;">Número de Tarjeta</label>
                <input type="text" id="numero_tarjeta" class="form-input" placeholder="0000 0000 0000 0000" maxlength="19" style="width: 100%;">
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div class="form-group">
                    <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600;">Vencimiento (MM/AA)</label>
                    <input type="text" id="vencimiento" class="form-input" placeholder="MM/AA" maxlength="5" style="width: 100%;">
                </div>
                <div class="form-group">
                    <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600;">CVC / CVV</label>
                    <input type="password" id="cvv" class="form-input" placeholder="123" maxlength="4" style="width: 100%;">
                </div>
            </div>
            
            <div class="form-group">
                <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600;">Nombre del Titular</label>
                <input type="text" id="nombre_tarjeta" class="form-input" placeholder="Como figura en la tarjeta" style="width: 100%;">
            </div>
        `;
    } 
    else if (metodo === 'Transferencia') {
        html += `
            <h4 style="margin-bottom: 12px; font-weight: 700;">Cuentas Bancarias</h4>
            <ul style="list-style: none; font-size: 14px; line-height: 1.8; color: #374151;">
                <li><strong>BCP Soles:</strong> 193-12345678-0-99</li>
                <li><strong>BBVA Soles:</strong> 0011-0123-456789</li>
                <li><strong>Titular:</strong> Sportiva SAC</li>
                <li><strong>RUC:</strong> 20123456789</li>
            </ul>
            <div style="margin-top: 16px; padding: 12px; background: #FFFBEB; border-left: 4px solid #F59E0B; font-size: 13px;">
                ⚠️ Deberás enviar la constancia de transferencia al finalizar el pedido.
            </div>
        `;
    }
    else if (metodo === 'Yape') {
        html += `
            <div style="text-align: center;">
                <h4 style="margin-bottom: 16px; font-weight: 700;">Escanea el código QR</h4>
                <div style="width: 200px; height: 200px; background: #eee; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
                    <img src="https://placehold.co/200x200/742284/ffffff?text=QR+Yape" alt="QR Yape">
                </div>
                <p style="font-weight: 700; font-size: 18px;">+51 987 654 321</p>
                <p style="font-size: 13px; color: #666;">Sportiva SAC</p>
            </div>
        `;
    }
    else {
        html += `
            <div style="display: flex; gap: 12px; align-items: flex-start;">
                <span style="font-size: 24px;">💡</span>
                <p style="font-size: 14px; color: #374151; margin-top: 4px;">
                    Pagarás en efectivo al momento de recibir tu pedido. Por favor, asegúrate de tener el monto exacto para facilitar la entrega.
                </p>
            </div>
        `;
    }

    html += `</div>`;
    return html;
}

window.irPaso3 = function() {
    console.log("Intentando ir al Paso 3...");
    if (typeof validarPaso2 === 'function') {
        const esValido = validarPaso2();
        if (esValido) {
            mostrarPaso(3);
        }
    } else {
        mostrarPaso(3);
    }
};

window.procesarPedido = function() {
    console.log("Procesando pedido...");
    if (typeof finalizarCompra === 'function') {
        finalizarCompra();
    }
};

// Exportaciones adicionales de seguridad
window.mostrarPaso = mostrarPaso;
window.siguientePaso = siguientePaso;
window.pasoAnterior = pasoAnterior;
window.toggleFacturacion = toggleFacturacion;
window.seleccionarMetodoPago = seleccionarMetodoPago;
window.finalizarCompra = finalizarCompra;
window.cargarProvincias = cargarProvincias;
window.cargarDistritos = cargarDistritos;

console.log('✅ Funciones de navegación registradas correctamente en window');
