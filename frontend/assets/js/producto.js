// ============================================
// PRODUCTO.JS - Lógica de ficha de producto
// Adaptado para trabajar con API REST Backend
// ============================================

let productoActual = null;
let tallaSeleccionada = null;
let cantidadSeleccionada = 1;

// ============================================
// INICIALIZACIÓN
// ============================================

async function inicializarProducto() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const idProducto = urlParams.get('id');
        
        if (!idProducto) {
            mostrarToast('Producto no encontrado', 'error');
            setTimeout(() => window.location.href = 'catalogo.html', 2000);
            return;
        }
        
        // ✅ CAMBIO: Cargar desde API en lugar de JSON
        await cargarProductoDesdeAPI(idProducto);
        
        if (!productoActual) {
            mostrarToast('Producto no encontrado', 'error');
            setTimeout(() => window.location.href = 'catalogo.html', 2000);
            return;
        }
        
        renderizarProducto();
        actualizarBreadcrumb();
        cargarProductosRelacionados();
        
    } catch (error) {
        console.error('Error inicializando producto:', error);
        mostrarToast('Error al cargar el producto', 'error');
    }
}

// ✅ NUEVA FUNCIÓN: Cargar producto desde API
async function cargarProductoDesdeAPI(idProducto) {
    try {
        // Verificar si apiConfig está disponible
        if (typeof apiConfig === 'undefined') {
            console.warn('⚠️ apiConfig no disponible - intentando cargar desde JSON local');
            await cargarProductos();
            productoActual = obtenerProductoPorId(idProducto);
            return;
        }
        
        // Cargar desde API
        const response = await apiConfig.apiGet(`/productos/${idProducto}`);
        
        if (response.success && response.data) {
            // ✅ Normalizar datos del backend al formato del frontend
            const producto = response.data.producto || response.data;
            
            productoActual = {
                ...producto,
                // Asegurar que tenga los campos que espera el renderizado
                imagen: producto.imagen_principal || producto.imagen || '/assets/images/placeholder.jpg',
                nombre_producto: producto.nombre_producto || producto.nombre,
                categoria_nombre: producto.categoria_nombre || producto.categoria || producto.nombre_categoria,
                precio: producto.precio || producto.precio_venta,
                tallas: producto.tallas || []
            };
            
            console.log('✅ Producto cargado desde API:', productoActual);
        } else {
            throw new Error('Producto no encontrado en API');
        }
    } catch (error) {
        console.error('❌ Error al cargar producto desde API:', error);
        // Fallback: intentar cargar desde JSON local
        console.log('🔄 Intentando cargar desde JSON local...');
        await cargarProductos();
        productoActual = obtenerProductoPorId(idProducto);
    }
}

// ============================================
// RENDERIZADO
// ============================================

function renderizarProducto() {
    const contenedor = document.getElementById('productoContenido');
    if (!contenedor) return;
    
    const stockTotal = productoActual.tallas.reduce((sum, t) => sum + t.stock_talla, 0);
    const agotado = stockTotal === 0;
    
    contenedor.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 64px; margin-bottom: 64px;">
            
            <!-- IMAGEN -->
            <div>
                <div style="background-color: var(--color-gray-light); aspect-ratio: 1; display: flex; align-items: center; justify-content: center; position: relative;">
                    <img src="${productoActual.imagen}" 
                        alt="${productoActual.nombre_producto}"
                        style="width: 100%; height: 100%; object-fit: cover;"
                        onerror="this.style.display='none'; this.parentElement.innerHTML='<span style=color:#CCC;font-size:24px;>Imagen no disponible</span>'">
                    
                    ${productoActual.nuevo ? '<span class="product-badge">Nuevo</span>' : ''}
                    ${agotado ? '<span class="product-badge" style="background-color: var(--color-error); top: 48px;">Agotado</span>' : ''}
                </div>
            </div>

            <!-- INFORMACIÓN -->
            <div>
                <p class="text-small text-secondary text-uppercase" style="margin-bottom: 8px;">${productoActual.categoria_nombre}</p>
                
                <h1 style="font-size: 32px; margin-bottom: 16px;">${productoActual.nombre_producto}</h1>
                
                <div style="margin-bottom: 24px;">
                    <p style="font-size: 28px; font-weight: 700; color: var(--color-black);">${formatearPrecio(productoActual.precio)}</p>
                </div>

                ${productoActual.marca ? `<p class="text-secondary" style="margin-bottom: 16px;">Marca: <strong>${productoActual.marca}</strong></p>` : ''}

                <p class="text-secondary" style="margin-bottom: 32px; line-height: 1.8;">${productoActual.descripcion}</p>

                ${!agotado ? renderizarSelectorTallas() : '<div style="padding: 16px; background-color: var(--color-gray-light); text-align: center; margin-bottom: 24px;"><p class="text-secondary">Producto agotado</p></div>'}

                ${!agotado ? renderizarSelectorCantidad() : ''}

                <div style="display: flex; gap: 16px; margin-bottom: 24px;">
                    ${!agotado ? `
                        <button class="btn btn-cta btn-full" onclick="agregarProductoAlCarrito()" ${agotado ? 'disabled' : ''}>
                            Agregar al Carrito
                        </button>
                    ` : `
                        <button class="btn btn-outline btn-full" onclick="window.location.href='catalogo.html'">
                            Ver Otros Productos
                        </button>
                    `}
                </div>

                ${productoActual.tiene_tallas && !agotado ? `
                    <button class="btn btn-outline btn-full" onclick="abrirModalTallas()" style="margin-bottom: 24px;">
                        Ver Guía de Tallas
                    </button>
                ` : ''}

                <div style="border-top: 1px solid var(--color-gray-border); padding-top: 24px;">
                    <details style="margin-bottom: 16px;">
                        <summary style="cursor: pointer; font-weight: 600; margin-bottom: 8px;">Información de Envío</summary>
                        <p class="text-secondary" style="margin-left: 16px; line-height: 1.8;">
                            • Envío gratis en compras mayores a S/ 150<br>
                            • Lima: Entrega en 24-48 horas (S/ 15)<br>
                            • Provincias: Entrega en 3-5 días (S/ 25)
                        </p>
                    </details>

                    <details style="margin-bottom: 16px;">
                        <summary style="cursor: pointer; font-weight: 600; margin-bottom: 8px;">Devoluciones y Cambios</summary>
                        <p class="text-secondary" style="margin-left: 16px; line-height: 1.8;">
                            • 30 días para cambios y devoluciones<br>
                            • Producto sin usar con etiquetas<br>
                            • Devolución del 100% del monto
                        </p>
                    </details>

                    <details>
                        <summary style="cursor: pointer; font-weight: 600; margin-bottom: 8px;">Garantía</summary>
                        <p class="text-secondary" style="margin-left: 16px; line-height: 1.8;">
                            • Productos 100% originales<br>
                            • Garantía contra defectos de fabricación<br>
                            • Soporte postventa
                        </p>
                    </details>
                </div>
            </div>
        </div>

        <!-- DESCRIPCIÓN ADICIONAL -->
        <div style="border-top: 1px solid var(--color-gray-border); padding-top: 48px;">
            <h2 style="margin-bottom: 24px;">CARACTERÍSTICAS DEL PRODUCTO</h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px;">
                <div>
                    <h3 class="text-uppercase" style="margin-bottom: 12px;">Descripción</h3>
                    <p class="text-secondary" style="line-height: 1.8;">${productoActual.descripcion}</p>
                </div>
                <div>
                    <h3 class="text-uppercase" style="margin-bottom: 12px;">Especificaciones</h3>
                    <ul style="list-style: none; line-height: 2;">
                        <li class="text-secondary">• SKU: ${productoActual.sku}</li>
                        <li class="text-secondary">• Categoría: ${productoActual.categoria_nombre}</li>
                        ${productoActual.marca ? `<li class="text-secondary">• Marca: ${productoActual.marca}</li>` : ''}
                        <li class="text-secondary">• Stock disponible: ${stockTotal} unidades</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}

function renderizarSelectorTallas() {
    if (!productoActual.tallas || productoActual.tallas.length === 0) {
        return '';
    }
    
    return `
        <div style="margin-bottom: 24px;">
            <p style="font-weight: 600; margin-bottom: 12px;">Selecciona tu talla:</p>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                ${productoActual.tallas.map(talla => `
                    <button 
                        class="talla-btn ${talla.stock_talla === 0 ? 'agotado' : ''} ${tallaSeleccionada === talla.id_talla ? 'seleccionado' : ''}"
                        onclick="seleccionarTalla(${talla.id_talla}, '${talla.talla}', ${talla.stock_talla})"
                        ${talla.stock_talla === 0 ? 'disabled' : ''}
                        style="padding: 12px 24px; border: 2px solid var(--color-gray-border); background: white; cursor: pointer; font-weight: 600; position: relative;">
                        ${talla.talla}
                        ${talla.stock_talla === 0 ? '<span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); width: 100%; height: 2px; background: red;"></span>' : ''}
                    </button>
                `).join('')}
            </div>
            ${tallaSeleccionada ? `<p class="text-secondary" style="margin-top: 8px; font-size: 14px;">Talla seleccionada: <strong>${productoActual.tallas.find(t => t.id_talla === tallaSeleccionada)?.talla}</strong></p>` : ''}
        </div>
    `;
}

function renderizarSelectorCantidad() {
    return `
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
            <p style="font-weight: 600;">Cantidad:</p>
            <div style="display: flex; align-items: center; border: 1px solid var(--color-gray-border);">
                <button onclick="cambiarCantidad(-1)" style="padding: 8px 16px; background: white; border: none; cursor: pointer; font-size: 18px;">−</button>
                <input type="number" id="cantidadInput" value="${cantidadSeleccionada}" min="1" readonly
                    style="width: 60px; text-align: center; border: none; border-left: 1px solid var(--color-gray-border); border-right: 1px solid var(--color-gray-border); padding: 8px;">
                <button onclick="cambiarCantidad(1)" style="padding: 8px 16px; background: white; border: none; cursor: pointer; font-size: 18px;">+</button>
            </div>
        </div>
    `;
}

function seleccionarTalla(idTalla, nombreTalla, stock) {
    if (stock === 0) {
        mostrarToast('Esta talla está agotada', 'warning');
        return;
    }
    
    tallaSeleccionada = idTalla;
    
    // Actualizar cantidad máxima según stock
    cantidadSeleccionada = Math.min(cantidadSeleccionada, stock);
    
    // Re-renderizar selector de tallas
    const contenedor = document.getElementById('productoContenido');
    if (contenedor) {
        renderizarProducto();
    }
    
    mostrarToast(`Talla ${nombreTalla} seleccionada`, 'success');
}

function cambiarCantidad(delta) {
    const nuevaCantidad = cantidadSeleccionada + delta;
    
    if (nuevaCantidad < 1) {
        mostrarToast('La cantidad mínima es 1', 'warning');
        return;
    }
    
    // Validar stock si hay talla seleccionada
    if (tallaSeleccionada) {
        const talla = productoActual.tallas.find(t => t.id_talla === tallaSeleccionada);
        if (talla && nuevaCantidad > talla.stock_talla) {
            mostrarToast(`Stock máximo: ${talla.stock_talla}`, 'warning');
            return;
        }
    }
    
    cantidadSeleccionada = nuevaCantidad;
    validarCantidad();
}

function validarCantidad() {
    const input = document.getElementById('cantidadInput');
    if (input) {
        input.value = cantidadSeleccionada;
    }
}

function agregarProductoAlCarrito() {
    // Validar talla si el producto tiene tallas
    if (productoActual.tiene_tallas && !tallaSeleccionada) {
        mostrarToast('Por favor selecciona una talla', 'warning');
        return;
    }
    
    // Obtener talla seleccionada
    const talla = tallaSeleccionada ? 
        productoActual.tallas.find(t => t.id_talla === tallaSeleccionada) : null;
    
    // Crear item para el carrito
    const item = {
        id_producto: productoActual.id_producto,
        nombre_producto: productoActual.nombre_producto,
        precio: productoActual.precio,
        cantidad: cantidadSeleccionada,
        imagen: productoActual.imagen,
        talla: talla ? {
            id_talla: talla.id_talla,
            nombre_talla: talla.talla
        } : null
    };
    
    // Agregar al carrito (función de main.js)
    if (typeof agregarAlCarrito === 'function') {
        agregarAlCarrito(item);
        mostrarToast('Producto agregado al carrito', 'success');
        
        // Resetear selección
        tallaSeleccionada = null;
        cantidadSeleccionada = 1;
        renderizarProducto();
    } else {
        console.error('Función agregarAlCarrito no encontrada');
        mostrarToast('Error al agregar al carrito', 'error');
    }
}

function abrirModalTallas() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';
    
    modal.innerHTML = `
        <div class="modal-content" style="background: white; padding: 32px; border-radius: 8px; max-width: 600px; position: relative;">
            <button onclick="cerrarModalTallas()" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
            
            <h2 style="margin-bottom: 24px;">Guía de Tallas</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                    <tr style="background: var(--color-gray-light);">
                        <th style="padding: 12px; border: 1px solid var(--color-gray-border); text-align: left;">Talla</th>
                        <th style="padding: 12px; border: 1px solid var(--color-gray-border); text-align: left;">Pecho (cm)</th>
                        <th style="padding: 12px; border: 1px solid var(--color-gray-border); text-align: left;">Cintura (cm)</th>
                        <th style="padding: 12px; border: 1px solid var(--color-gray-border); text-align: left;">Cadera (cm)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style="padding: 12px; border: 1px solid var(--color-gray-border);">S</td><td style="padding: 12px; border: 1px solid var(--color-gray-border);">86-91</td><td style="padding: 12px; border: 1px solid var(--color-gray-border);">71-76</td><td style="padding: 12px; border: 1px solid var(--color-gray-border);">91-96</td></tr>
                    <tr><td style="padding: 12px; border: 1px solid var(--color-gray-border);">M</td><td style="padding: 12px; border: 1px solid var(--color-gray-border);">96-101</td><td style="padding: 12px; border: 1px solid var(--color-gray-border);">81-86</td><td style="padding: 12px; border: 1px solid var(--color-gray-border);">101-106</td></tr>
                    <tr><td style="padding: 12px; border: 1px solid var(--color-gray-border);">L</td><td style="padding: 12px; border: 1px solid var(--color-gray-border);">106-111</td><td style="padding: 12px; border: 1px solid var(--color-gray-border);">91-96</td><td style="padding: 12px; border: 1px solid var(--color-gray-border);">111-116</td></tr>
                    <tr><td style="padding: 12px; border: 1px solid var(--color-gray-border);">XL</td><td style="padding: 12px; border: 1px solid var(--color-gray-border);">116-121</td><td style="padding: 12px; border: 1px solid var(--color-gray-border);">101-106</td><td style="padding: 12px; border: 1px solid var(--color-gray-border);">121-126</td></tr>
                    <tr><td style="padding: 12px; border: 1px solid var(--color-gray-border);">XXL</td><td style="padding: 12px; border: 1px solid var(--color-gray-border);">126-131</td><td style="padding: 12px; border: 1px solid var(--color-gray-border);">111-116</td><td style="padding: 12px; border: 1px solid var(--color-gray-border);">131-136</td></tr>
                </tbody>
            </table>
            
            <p class="text-secondary" style="font-size: 14px;">
                <strong>Nota:</strong> Las medidas son aproximadas. Te recomendamos medir tu cuerpo y comparar con esta tabla para elegir la talla correcta.
            </p>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModalTallas();
    });
}

function cerrarModalTallas() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}

function actualizarBreadcrumb() {
    const breadcrumb = document.querySelector('.breadcrumb');
    if (!breadcrumb || !productoActual) return;
    
    breadcrumb.innerHTML = `
        <a href="index.html">Inicio</a>
        <span>/</span>
        <a href="catalogo.html">Catálogo</a>
        <span>/</span>
        <a href="catalogo.html?categoria=${productoActual.id_categoria}">${productoActual.categoria_nombre}</a>
        <span>/</span>
        <span>${productoActual.nombre_producto}</span>
    `;
}

async function cargarProductosRelacionados() {
    try {
        const productos = await cargarProductos();
        const relacionados = productos
            .filter(p => p.id_categoria === productoActual.id_categoria && p.id_producto !== productoActual.id_producto)
            .slice(0, 4);
        
        const contenedor = document.querySelector('.productos-relacionados-grid');
        if (contenedor && relacionados.length > 0) {
            contenedor.innerHTML = relacionados.map(p => crearCardProducto(p)).join('');
        }
    } catch (error) {
        console.error('Error cargando productos relacionados:', error);
    }
}

// ============================================
// INICIALIZAR AL CARGAR LA PÁGINA
// ============================================

document.addEventListener('DOMContentLoaded', inicializarProducto);
