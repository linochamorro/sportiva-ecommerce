// ========================================
// SPORTIVA E-COMMERCE - DETALLE PRODUCTO
// Lógica para mostrar detalles del producto y manejar interacciones.
// ========================================

// ===========================
// 1. VARIABLES GLOBALES
// ===========================

let productoActual = null;
let tallaSeleccionada = null; // Inicia sin talla seleccionada
let cantidadSeleccionada = 1;
let imagenActual = 0;
let productosRelacionados = [];
let resenas = [];

// ===========================
// 2. INICIALIZACIÓN
// ===========================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando detalle de producto...');

    // Obtener ID del producto de la URL
    const productoId = obtenerProductoIdDeURL();

    if (!productoId) {
        mostrarError('Producto no encontrado');
        setTimeout(() => window.location.href = '/catalogo.html', 2000);
        return;
    }

    // Cargar datos del producto
    await cargarProducto(productoId);

    // Inicializar componentes
    inicializarEventListeners();

    // Deshabilitar botón de agregar si es trabajador
    if (typeof authService !== 'undefined' && authService.isTrabajador()) {
        const btnAgregar = document.querySelector('.btn-agregar-carrito');
        if (btnAgregar) {
            btnAgregar.disabled = true;
            btnAgregar.innerHTML = '<i class="fas fa-lock"></i> NO DISPONIBLE PARA TRABAJADORES';
            btnAgregar.style.backgroundColor = '#999';
            btnAgregar.style.cursor = 'not-allowed';
        }
    }

    console.log('✅ Detalle de producto inicializado correctamente');
});

// ===========================
// 3. CARGA DE PRODUCTO Y NORMALIZACIÓN
// ===========================

/**
 * Obtener ID del producto de la URL
 */
function obtenerProductoIdDeURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

/**
 * Cargar producto desde API con fallback a JSON
 */
async function cargarProducto(productoId) {
    mostrarLoader(true);

    try {
        if (typeof apiConfig !== 'undefined') {
            const response = await apiConfig.apiGet(`/productos/${productoId}`);

            if (response.success && response.data) {
                productoActual = normalizarProducto(response.data.producto || response.data);
            } else {
                throw new Error('Producto no encontrado en API');
            }
        } else {
            await cargarProductoLocal(productoId);
        }
        // Auto-seleccionar talla 'UNICA' si el producto no tiene tallas
        if (productoActual && !productoActual.tiene_tallas) {
            const tallaUnica = (productoActual.variantes || []).find(v => v.talla === 'UNICA');
            if (tallaUnica) {
                tallaSeleccionada = tallaUnica.talla;
                console.log('Talla ÚNICA auto-seleccionada:', tallaSeleccionada);
            } else {
                console.warn('Producto sin tallas no tiene Talla "UNICA" definida', productoActual);
            }
        }
        renderizarProducto();
        // Cargar datos adicionales
        Promise.all([
            cargarProductosRelacionados(productoId).catch(e => console.warn('⚠️ Productos relacionados no disponibles', e)),
            cargarResenas(productoId).catch(e => console.warn('⚠️ Reseñas no disponibles', e))
        ]);
    } catch (error) {
        console.error('❌ Error al cargar producto:', error);
        try {
            await cargarProductoLocal(productoId);
            renderizarProducto();
        } catch (fallbackError) {
            mostrarError('No se pudo cargar el producto');
        }
    } finally {
        mostrarLoader(false);
    }
}

/**
 * Cargar producto desde JSON local (fallback)
 */
async function cargarProductoLocal(productoId) {
    try {
        if (typeof cargarProductos === 'function') {
            const productos = await cargarProductos();
            const productoLocal = productos.find(p =>
                (p.id_producto || p.producto_id || p.id) == productoId
            );
            productoActual = normalizarProducto(productoLocal);

            if (!productoActual) {
                throw new Error('Producto no encontrado en datos locales');
            }
            console.log('✅ Producto cargado desde JSON local');
        } else {
            throw new Error('Dependencia main.js/cargarProductos no encontrada');
        }
    } catch (error) {
        throw new Error('No se pudo cargar el producto');
    }
}

/**
 * Normalizar datos y RUTAS DE IMAGEN
 */
function normalizarProducto(producto) {
    if (!producto) return null;

    let imagenPath = producto.imagen_principal || producto.imagen || producto.imagen_url || producto.url_imagen || 'assets/images/placeholder.jpg';

    if (imagenPath.includes('assets/images/productos/') && !imagenPath.startsWith('../') && !imagenPath.startsWith('/')) {
        imagenPath = '../' + imagenPath.replace('frontend/', '');
    }

// Normalizar la estructura de datos
    return {
        ...producto,
        id: producto.id_producto || producto.producto_id || producto.id,
        nombre: producto.nombre_producto || producto.nombre || 'Producto sin nombre',
        categoria: producto.nombre_categoria || producto.categoria || producto.categoria_nombre || 'Sin categoría',
        imagen: imagenPath,
        imagen_url: imagenPath,
        precio_venta: producto.precio || producto.precio_venta,
        
        // Asegurarse de que 'tiene_tallas' se incluya en el objeto normalizado
        // Esta propiedad es crucial para ocultar la guía y el selector de tallas.
        tiene_tallas: producto.tiene_tallas, 
        // Usar tallas como variantes para compatibilidad con lógica de renderizado
        variantes: producto.tallas ? producto.tallas.map(t => ({ talla: t.talla, stock: t.stock_talla, id_talla: t.id_talla })) : producto.variantes || [],
        rating: producto.calificacion_promedio || 4.5,
        num_reviews: producto.total_resenas || 0,
        stock_total: producto.stock_total || producto.stock || 0
    };
}

// ===========================
// 4. RENDERIZADO (UI Polished)
// ===========================

/**
 * Renderizar producto completo
 */
function renderizarProducto() {
    if (!productoActual) return;

    document.title = `${productoActual.nombre} - Sportiva`;

    // Actualizar el breadcrumb externo en producto.html
    actualizarBreadcrumbExterno();

    // Crear estructura HTML base (contenedor principal y secciones)
    crearEstructuraHTML();

    // Renderizar secciones detalladas
    renderizarGaleria();
    renderizarInformacion();
    renderizarDetalles();
    renderizarSelectorTallas();

    // Inicializar cantidad en 1 y actualizar input
    cantidadSeleccionada = 1;
    actualizarCantidadInput();
}

/**
 * Actualiza el breadcrumb principal en el DOM de producto.html
 */
function actualizarBreadcrumbExterno() {
    const breadcrumbCategoria = document.getElementById('breadcrumbCategoria');
    const breadcrumbProducto = document.getElementById('breadcrumbProducto');

    if (breadcrumbCategoria) {
        breadcrumbCategoria.textContent = productoActual.categoria;
        breadcrumbCategoria.href = `catalogo.html?categoria=${encodeURIComponent(productoActual.categoria)}`;
    }

    if (breadcrumbProducto) {
        breadcrumbProducto.textContent = productoActual.nombre;
    }
}

/**
 * Crear estructura HTML base del producto
 */
function crearEstructuraHTML() {
    const contenedor = document.getElementById('productoContenido');
    if (!contenedor) {
        console.error('❌ Contenedor #productoContenido no encontrado');
        return;
    }

    contenedor.innerHTML = `
        <div class="producto-layout" style="display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-bottom: 48px;">
            <div class="producto-galeria">
                <div id="galeria-producto"></div>
            </div>

            <div class="producto-contenido">
                <div id="producto-info"></div>

                <div id="selector-tallas-container" style="margin: 24px 0;"></div>

                <div class="cantidad-selector" style="display: flex; align-items: center; gap: 16px; margin: 24px 0;">
                    <label style="font-weight: 600;">CANTIDAD</label>
                    <button onclick="cambiarCantidad(-1)" class="btn-cantidad" style="width: 40px; height: 40px; border: 1px solid #ddd; background: white; cursor: pointer;">-</button>
                    <input type="number" id="cantidad-input" value="1" min="1" onchange="actualizarCantidadDesdeInput(this.value)" style="width: 60px; text-align: center; border: 1px solid #ddd; padding: 8px;">
                    <button onclick="cambiarCantidad(1)" class="btn-cantidad" style="width: 40px; height: 40px; border: 1px solid #ddd; background: white; cursor: pointer;">+</button>
                </div>

                <button onclick="agregarAlCarritoClick()" class="btn btn-cta btn-agregar-carrito" style="width: 100%; padding: 16px; border: none; font-weight: 700; cursor: pointer; text-transform: uppercase; letter-spacing: 1px;">
                    AGREGAR AL CARRITO
                </button>

                ${productoActual.tiene_tallas ? `
                    <button onmouseover="this.style.backgroundColor='var(--color-black)'; this.style.color='var(--color-white)'; this.style.borderColor='var(--color-black)';"
                            onmouseout="this.style.backgroundColor='var(--color-white)'; this.style.color='var(--color-black)'; this.style.borderColor='var(--color-black)';"
                            onclick="abrirGuiaTallas()" class="btn btn-outline"
                            style="width: 100%; margin-top: 16px; padding: 16px; border: 2px solid var(--color-black); background: var(--color-white); color: var(--color-black); font-weight: 700; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; transition: all 0.3s;">
                        VER GUÍA DE TALLAS
                    </button>
                ` : ''}

                <div id="acordeones-info" style="margin-top: 24px;"></div>
            </div>
        </div>

        <div id="producto-detalles" class="producto-detalles-section" style="margin-top: 48px;"></div>
    `;

    // Renderizar acordeones de información justo después
    renderizarAcordeonesInfo();
}

/**
 * Renderizar galería de imágenes
 */
function renderizarGaleria() {
    const imagenes = obtenerImagenesProducto();
    const galeriaContainer = document.getElementById('galeria-producto');

    if (!galeriaContainer) return;

    galeriaContainer.innerHTML = `
        <div class="imagen-principal" style="position: relative; aspect-ratio: 1;">
            <img id="imagen-principal"
                  src="${imagenes[0]}"
                  alt="${productoActual.nombre}"
                  style="width: 100%; height: 100%; object-fit: cover;">

            ${productoActual.nuevo ? '<span class="product-badge" style="position: absolute; top: 10px; left: 10px;">NUEVO</span>' : ''}
        </div>
    `;
}

/**
 * Obtener imágenes del producto
 */
function obtenerImagenesProducto() {
    const imagenes = [];

    if (productoActual.imagen_url || productoActual.imagen) {
        imagenes.push(productoActual.imagen_url || productoActual.imagen);
    }

    if (productoActual.imagenes && Array.isArray(productoActual.imagenes)) {
        productoActual.imagenes.forEach(img => {
            let path = img.url_imagen || '';
            if (path.includes('assets/images/productos/') && !path.startsWith('../') && !path.startsWith('/')) {
                path = '../' + path.replace('frontend/', '');
            }
            imagenes.push(path);
        });
    }

    if (imagenes.length === 0) {
        imagenes.push('../assets/images/placeholder.jpg');
    }

    return [...new Set(imagenes)];
}

/**
 * Renderizar información del producto
 */
function renderizarInformacion() {
    const infoContainer = document.getElementById('producto-info');
    if (!infoContainer) return;

    const precio = parseFloat(productoActual.precio_venta || productoActual.precio);

    infoContainer.innerHTML = `
        <p class="text-small text-secondary text-uppercase" style="margin-bottom: 8px;">${productoActual.categoria}</p>

        <h1 style="font-size: 32px; margin-bottom: 8px;">${productoActual.nombre}</h1>

        ${productoActual.marca ? `
            <div class="producto-marca" style="margin-bottom: 8px;">
                <strong>Marca:</strong> ${productoActual.marca}
            </div>
        ` : ''}

        <div class="producto-precios" style="margin-bottom: 24px;">
            <div class="precio-actual" style="font-size: 28px; font-weight: 700;">S/ ${precio.toFixed(2)}</div>
        </div>

        <div class="producto-descripcion-corta">
            <p class="text-secondary" style="margin-bottom: 32px; line-height: 1.8;">${productoActual.descripcion || 'Sin descripción disponible'}</p>
        </div>
    `;
}

/**
 * Renderizar detalles y acordeones
 */
function renderizarDetalles() {
    const detallesContainer = document.getElementById('producto-detalles');
    if (!detallesContainer) return;

    const stockTotal = productoActual.stock_total || productoActual.stock || 0;

    detallesContainer.innerHTML = `
        <div style="border-top: 1px solid var(--color-gray-border); padding-top: 48px;">
            <h2 style="margin-bottom: 24px; font-weight: 900;">CARACTERÍSTICAS DEL PRODUCTO</h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px;">
                <div>
                    <h3 class="text-uppercase" style="margin-bottom: 12px; font-size: 16px; font-weight: 700;">DESCRIPCIÓN</h3>
                    <p class="text-secondary" style="line-height: 1.8;">${productoActual.descripcion || 'Sin descripción disponible'}</p>
                </div>
                <div>
                    <h3 class="text-uppercase" style="margin-bottom: 12px; font-size: 16px; font-weight: 700;">ESPECIFICACIONES</h3>
                    <ul style="list-style: none; line-height: 2;">
                        <li class="text-secondary">• SKU: ${productoActual.sku || 'N/A'}</li>
                        <li class="text-secondary">• Categoría: ${productoActual.categoria || 'N/A'}</li>
                        <li class="text-secondary">• Marca: ${productoActual.marca || 'N/A'}</li>
                        <li class="text-secondary">• Stock disponible: ${stockTotal} unidades</li>
                    </ul>
                </div>
            </div>
        </div>

        <div id="productosRelacionados" style="margin-top: 48px;">
          <h2 class="mb-lg" style="font-weight: 900;">PRODUCTOS RELACIONADOS</h2>
          <div id="productosRelacionadosGrid" class="grid grid-products">
          </div>
        </div>
    `;
}

/**
 * Renderizar selector de tallas
 */
function renderizarSelectorTallas() {
    const selectorContainer = document.getElementById('selector-tallas-container');
    if (!selectorContainer) return;
  
    let tallas = obtenerTallasDisponibles();

    // Si no tiene tallas (es Talla Única), no mostrar el selector
    if (productoActual && !productoActual.tiene_tallas) {
        selectorContainer.innerHTML = '';
        return;
    }    

    if (tallas.length === 0) {
        selectorContainer.innerHTML = '';
        return;
    }

    // Ordenar tallas
    tallas = tallas.sort((a, b) => {
        const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42', '43', '44', 'UNICA'];
        const indexA = order.indexOf(a.nombre);
        const indexB = order.indexOf(b.nombre);

        if (indexA === -1 || indexB === -1) return a.nombre.localeCompare(b.nombre);
        return indexA - indexB;
    });

    selectorContainer.innerHTML = `
        <div class="tallas-selector" style="display: flex; justify-content: space-between; align-items: center;">
            <label style="font-weight: 600; display: block;">SELECCIONA TU TALLA</label>
            <a href="#" onclick="abrirGuiaTallas(); return false;"
                style="color: var(--color-cta); font-size: 14px; font-weight: 600;">
                Guía de tallas
            </a>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;">
            ${tallas.map(talla => {
                const isSelected = talla.nombre === tallaSeleccionada;
                const isDisabled = talla.stock === 0;
                const defaultBorderColor = 'var(--color-gray-border)';
                const selectedBorderColor = 'var(--color-black)';
                const hoverBorderColor = 'var(--color-black)'; // Siempre negro en hover
                const defaultBgColor = 'white';
                const selectedBgColor = 'var(--color-black)';
                const hoverBgColor = 'var(--color-black)';
                const defaultTextColor = 'var(--color-black)';
                const selectedTextColor = 'var(--color-white)';
                const hoverTextColor = 'var(--color-white)';

                return `
                <button class="talla-option ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}"
                        data-talla="${talla.nombre}"
                        data-stock="${talla.stock}"
                        onclick="seleccionarTalla('${talla.nombre}', ${talla.stock})"
                        onmouseover="if (!this.disabled && !this.classList.contains('selected')) { this.style.borderColor='${hoverBorderColor}'; this.style.backgroundColor='${hoverBgColor}'; this.style.color='${hoverTextColor}'; }"
                        onmouseout="if (!this.disabled && !this.classList.contains('selected')) { this.style.borderColor='${defaultBorderColor}'; this.style.backgroundColor='${defaultBgColor}'; this.style.color='${defaultTextColor}'; }"
                        ${isDisabled ? 'disabled' : ''}
                        style="padding: 10px 15px;
                          border: 1px solid ${isSelected ? selectedBorderColor : defaultBorderColor};
                          background: ${isSelected ? selectedBgColor : defaultBgColor};
                          color: ${isSelected ? selectedTextColor : defaultTextColor};
                          cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
                          font-weight: 600; text-transform: uppercase;
                          transition: border-color 0.1s, background-color 0.1s, color 0.1s;
                          opacity: ${isDisabled ? 0.5 : 1};
                          text-decoration: ${isDisabled ? 'line-through' : 'none'};">
                    ${talla.nombre}
                </button>
            `}).join('')}
        </div>
    `;
    // No se selecciona ninguna talla por defecto al renderizar
}

/**
 * Renderizar los acordeones de información
 */
function renderizarAcordeonesInfo() {
    const contenedor = document.getElementById('acordeones-info');
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div style="border-top: 1px solid var(--color-gray-border); padding-top: 24px;">
            <details style="margin-bottom: 16px;">
                <summary style="cursor: pointer; font-weight: 600; font-size: 14px; margin-bottom: 8px;">Información de Envío</summary>
                <p class="text-secondary" style="margin-left: 16px; line-height: 1.8;">
                    • Envío gratis en compras mayores a S/ 150<br>
                    • Lima: Entrega en 24-48 horas (S/ 15)<br>
                    • Provincias: Entrega en 3-5 días (S/ 25)
                </p>
            </details>

            <details style="margin-bottom: 16px;">
                <summary style="cursor: pointer; font-weight: 600; font-size: 14px; margin-bottom: 8px;">Devoluciones y Cambios</summary>
                <p class="text-secondary" style="margin-left: 16px; line-height: 1.8;">
                    • 30 días para cambios y devoluciones<br>
                    • Producto sin usar con etiquetas<br>
                    • Devolución del 100% del monto
                </p>
            </details>

            <details>
                <summary style="cursor: pointer; font-weight: 600; font-size: 14px; margin-bottom: 8px;">Garantía</summary>
                <p class="text-secondary" style="margin-left: 16px; line-height: 1.8;">
                    • Productos 100% originales<br>
                    • Garantía contra defectos de fabricación<br>
                    • Soporte postventa
                </p>
            </details>
        </div>
    `;
}

/**
 * Obtener tallas disponibles del producto
 */
function obtenerTallasDisponibles() {
    const tallas = [];

    if (productoActual.variantes && Array.isArray(productoActual.variantes)) {
        productoActual.variantes.forEach(variante => {
            tallas.push({
                nombre: variante.talla,
                stock: variante.stock || 0,
                id_talla: variante.id_talla
            });
        });
    } else if (productoActual.tallas && Array.isArray(productoActual.tallas)) {
        productoActual.tallas.forEach(talla => {
            tallas.push({
                nombre: talla.talla,
                stock: talla.stock_talla || 0,
                id_talla: talla.id_talla
            });
        });
    }

    return tallas;
}

// ===========================
// 5. PRODUCTOS RELACIONADOS
// ===========================

/**
 * Cargar productos relacionados desde API
 */
async function cargarProductosRelacionados(productoId) {
    try {
        if (typeof apiConfig !== 'undefined' && productoActual) {
            // Obtener id_categoria del producto actual
            const idCategoria = productoActual.id_categoria;
            const idProductoActual = productoActual.id_producto || productoActual.id;
            
            if (!idCategoria) {
                console.warn('Producto sin categoría, no se pueden cargar relacionados');
                return;
            }
            
            // Llamar API con filtro de categoría y exclusión
            const response = await apiConfig.apiGet(`/productos`, {
                categoria: idCategoria,
                excluir: idProductoActual,
                limit: 4
            });

            if (response.success && response.data) {
                productosRelacionados = response.data.productos || response.data || [];
                
                if (productosRelacionados.length > 0) {
                    renderizarProductosRelacionados();
                } else {
                    console.log('No hay productos relacionados en esta categoría');
                    const parentDiv = document.getElementById('productosRelacionados');
                    if (parentDiv) parentDiv.style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error('Error al cargar productos relacionados:', error);
    }
}

/**
 * Renderizar productos relacionados
 */
function renderizarProductosRelacionados() {
    const container = document.getElementById('productosRelacionadosGrid');
    if (!container || productosRelacionados.length === 0) {
        const parentDiv = document.getElementById('productosRelacionados');
        if (parentDiv) parentDiv.style.display = 'none';
        return;
    }

    container.innerHTML = productosRelacionados.map(producto => crearCardProductoRelacionado(producto)).join('');
}

/**
 * Crear card de producto relacionado
 */
function crearCardProductoRelacionado(producto) {
    const precio = parseFloat(producto.precio_venta || producto.precio);
    let imagen = producto.imagen_principal || producto.imagen || 'assets/images/placeholder.jpg';

    if (imagen.includes('assets/images/productos/') && !imagen.startsWith('../') && !imagen.startsWith('/')) {
        imagen = '../' + imagen.replace('frontend/', '');
    } else if (imagen.startsWith('/')) {
        imagen = '..' + imagen;
    }
    
    // Obtener la ruta correcta para navegación
    const productoIdUrl = producto.id_producto || producto.producto_id || producto.id;
    const currentPath = window.location.pathname;
    
    // Determinar si estamos en /frontend/public/ o en raíz
    let linkHref;
    if (currentPath.includes('/frontend/public/')) {
        linkHref = `producto.html?id=${productoIdUrl}`;
    } else {
        linkHref = `/frontend/public/producto.html?id=${productoIdUrl}`;
    }

    return `
        <div class="producto-card-mini" style="border: 1px solid var(--color-gray-border); padding: 16px;">
            <a href="${linkHref}" style="display: block; text-decoration: none; color: inherit;">
                <div style="background-color: var(--color-gray-light); aspect-ratio: 1; margin-bottom: 12px;">
                    <img src="${imagen}" alt="${producto.nombre_producto || producto.nombre}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 4px; color: var(--color-black);">${producto.nombre_producto || producto.nombre}</h4>
                <div class="precio" style="font-weight: 700; color: var(--color-black);">S/ ${precio.toFixed(2)}</div>
            </a>
        </div>
    `;
}

// ===========================
// 7. ACCIONES Y UTILIDADES
// ===========================

/**
 * Seleccionar talla - CORREGIDO
 */
function seleccionarTalla(tallaNombre, stock) {
    if (stock === 0) return; // No permitir seleccionar tallas sin stock

    // Actualizar la talla seleccionada
    tallaSeleccionada = tallaNombre;

    // Actualizar cantidad máxima posible en el input
    const cantidadInput = document.getElementById('cantidad-input');
    if (cantidadInput) {
        const maxStock = stock || 999;
        cantidadInput.max = maxStock;
        // Si la cantidad actual supera el stock de la nueva talla, ajustarla
        if (cantidadSeleccionada > maxStock) {
            cantidadSeleccionada = maxStock;
            cantidadInput.value = maxStock;
        }
    }

    // Volver a renderizar los botones de talla para actualizar estilos
    renderizarSelectorTallas();

}

/**
 * Cambiar cantidad
 */
function cambiarCantidad(delta) {
    const input = document.getElementById('cantidad-input');
    if (!input) return;

    const min = parseInt(input.min) || 1;
    const max = 999; // Máximo general

    // Determinar stock máximo basado en si hay talla seleccionada
    let maxStock = productoActual.stock_total || max;
    if (tallaSeleccionada) {
        const tallaInfo = productoActual.variantes.find(v => v.talla === tallaSeleccionada);
        if (tallaInfo) {
            maxStock = tallaInfo.stock || max;
        }
    }

    const nuevaCantidad = cantidadSeleccionada + delta;

    if (nuevaCantidad < min) {
        if (typeof mostrarToast === 'function') mostrarToast(`La cantidad mínima es ${min}`, 'warning');
        return;
    }

    if (nuevaCantidad > maxStock) {
        if (typeof mostrarToast === 'function') mostrarToast(`Stock máximo disponible: ${maxStock}`, 'warning');
        return;
    }

    cantidadSeleccionada = nuevaCantidad;
    actualizarCantidadInput(); // Llama a la función que actualiza el valor del input
}

/**
 * Actualizar input de cantidad
 */
function actualizarCantidadInput() {
    const input = document.getElementById('cantidad-input');
    if (input) {
        input.value = cantidadSeleccionada;
        // También actualizamos el atributo 'max' por si cambia la talla
        let maxStock = 999;
        if (tallaSeleccionada) {
            const tallaInfo = productoActual.variantes.find(v => v.talla === tallaSeleccionada);
            if (tallaInfo) maxStock = tallaInfo.stock || 999;
        } else if (productoActual.stock_total !== undefined) {
             maxStock = productoActual.stock_total || 0; // Si no hay tallas, usa stock total
        }
         input.max = maxStock > 0 ? maxStock : 1; // Asegurar que max sea al menos 1 si hay stock 0
    }
}

/**
 * Actualiza cantidadSeleccionada cuando cambia el input directamente (ej. spinners)
 */
function actualizarCantidadDesdeInput(nuevoValor) {
    const input = document.getElementById('cantidad-input');
    if (!input) return;

    let cantidad = parseInt(nuevoValor);
    const min = parseInt(input.min) || 1;

    // Determinar stock máximo
    let maxStock = 999; 
      if (tallaSeleccionada) {
        const tallaInfo = productoActual.variantes.find(v => v.talla === tallaSeleccionada);
        if (tallaInfo) maxStock = tallaInfo.stock || 999;
    } else if (productoActual.stock_total !== undefined) {
          maxStock = productoActual.stock_total || 0; 
    }
    maxStock = maxStock > 0 ? maxStock : 1; // Asegurar que max sea al menos 1

    // Validar el nuevo valor
    if (isNaN(cantidad) || cantidad < min) {
        cantidad = min;
        if (typeof mostrarToast === 'function') mostrarToast(`La cantidad mínima es ${min}`, 'warning');
    } else if (cantidad > maxStock) {
        cantidad = maxStock;
        if (typeof mostrarToast === 'function') mostrarToast(`Stock máximo disponible: ${maxStock}`, 'warning');
    }

    // Actualizar variable global y el valor del input (para corregir si se excedió)
    cantidadSeleccionada = cantidad;
    input.value = cantidadSeleccionada; 

    // actualizarCantidadInput(); 
}

/**
 * Agregar al carrito (click handler)
 */
async function agregarAlCarritoClick() {
    // 🔒 Verificar si es trabajador
    if (typeof authService !== 'undefined' && authService.isTrabajador()) {
        if (typeof mostrarToast === 'function') {
            mostrarToast('Las cuentas de trabajadores no pueden realizar compras', 'warning');
        }
        return;
    }

    // Validar talla si el producto tiene tallas
    if (productoActual.variantes && productoActual.variantes.length > 0 && !tallaSeleccionada) {
        if (typeof mostrarToast === 'function') mostrarToast('Por favor selecciona una talla', 'warning');
        return;
    }

    const btnAgregar = document.querySelector('.btn-agregar-carrito');
    if (btnAgregar) {
        btnAgregar.disabled = true;
        btnAgregar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AGREGANDO...';
    }

    try {
        const tallaInfo = productoActual.variantes.find(v => v.talla === tallaSeleccionada);
        const idTallaAPI = tallaInfo ? tallaInfo.id_talla : null;

        // Usar nombres que espera el backend
        const itemData = {
            id_producto: parseInt(productoActual.id_producto),
            id_talla: idTallaAPI ? parseInt(idTallaAPI) : null,
            cantidad: parseInt(cantidadSeleccionada)
        };

        if (typeof apiConfig !== 'undefined') {
            if (typeof authService !== 'undefined' && !authService.isLoggedIn()) {
                // Guardar la talla y cantidad para restaurar UI
                const productoParaGuardar = {
                    itemData: itemData,
                    uiData: {
                        productoId: productoActual.id_producto,
                        tallaNombre: tallaSeleccionada,
                        cantidad: cantidadSeleccionada
                    }
                };
                
                localStorage.setItem('sportiva_producto_pendiente', JSON.stringify(productoParaGuardar));
                localStorage.setItem('sportiva_redirect_after_login', window.location.pathname + window.location.search);
                
                if (typeof mostrarToast === 'function') mostrarToast('Inicia sesión para agregar productos', 'warning');
                
                setTimeout(() => {
                    window.location.href = '/frontend/public/login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
                }, 1500);
                
                if (btnAgregar) {
                    btnAgregar.disabled = false;
                    btnAgregar.innerHTML = 'AGREGAR AL CARRITO';
                }
                return;
            }

            console.log('📦 Enviando al carrito:', itemData);
            
            mostrarModalPostCompra();
            
            const response = await apiConfig.apiPost('/carrito/items', itemData);

            if (response.success) {
                if (typeof mostrarToast === 'function') mostrarToast('Producto agregado al carrito', 'success');
                
                if (typeof actualizarContadorCarrito === 'function') {
                    actualizarContadorCarrito();
                }
                
                limpiarEstadoProducto();
            } else {
                cerrarModalPostCompra();
                throw new Error(response.message || 'Error al agregar al carrito desde API');
            }
        } else {
            console.warn("apiConfig no definido, usando fallback local (si existe)");
            if (typeof agregarAlCarrito === 'function') {
                mostrarModalPostCompra();
                
                const productoParaLocal = { ...productoActual, id_talla: idTallaAPI, talla_nombre: tallaSeleccionada };
                const agregado = agregarAlCarrito(productoParaLocal, idTallaAPI, tallaSeleccionada, cantidadSeleccionada);
                if (agregado) {
                    if (typeof actualizarContadorCarrito === 'function') {
                        actualizarContadorCarrito();
                    }
                    limpiarEstadoProducto();
                } else {
                    cerrarModalPostCompra();
                }
            } else {
                throw new Error("Función 'agregarAlCarrito' local no encontrada.");
            }
        }
    } catch (error) {
        console.error('❌ Error al agregar al carrito:', error);
        cerrarModalPostCompra();
        if (typeof mostrarToast === 'function') mostrarToast(error.message || 'Error al agregar producto al carrito', 'error');
    } finally {
        if (btnAgregar) {
            btnAgregar.disabled = false;
            btnAgregar.innerHTML = 'AGREGAR AL CARRITO';
        }
    }
}


function limpiarEstadoProducto() {
    tallaSeleccionada = null;
    cantidadSeleccionada = 1;
    actualizarCantidadInput();
    
    document.querySelectorAll('.talla-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    console.log('✅ Estado del producto limpiado');
}

function mostrarModalPostCompra() {
    const modal = document.getElementById('modalPostCompra');
    if (modal) {
        modal.style.display = 'flex';
        modal.offsetHeight;
    }
}

function cerrarModalPostCompra() {
    const modal = document.getElementById('modalPostCompra');
    if (modal) {
        modal.style.display = 'none';
    }
}

function irAlCarrito() {
    window.location.href = 'carrito.html';
}


/**
 * Abrir guía de tallas
 */
function abrirGuiaTallas() {
    const modal = document.createElement('div');
    modal.className = 'modal-guia-tallas';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s;';

    modal.innerHTML = `
        <div class="modal-content" style="background: white; padding: 32px; border-radius: 8px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; position: relative; transform: scale(0.9); transition: transform 0.3s;">
            <button class="btn-cerrar" onclick="cerrarGuiaTallas()" style="position: absolute; top: 16px; right: 16px; font-size: 24px; cursor: pointer; background: none; border: none; color: #888;">&times;</button>

            <h2 style="margin-bottom: 24px; font-weight: 900;">GUÍA DE TALLAS - ${productoActual.categoria ? productoActual.categoria.toUpperCase() : 'GENERAL'}</h2>

            <table class="tabla-tallas" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
                <thead>
                    <tr style="background-color: var(--color-gray-light);">
                        <th style="padding: 12px; border: 1px solid var(--color-gray-border); font-weight: 700;">Talla</th>
                        <th style="padding: 12px; border: 1px solid var(--color-gray-border); font-weight: 700;">Pecho (cm)</th>
                        <th style="padding: 12px; border: 1px solid var(--color-gray-border); font-weight: 700;">Cintura (cm)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style="padding: 8px; border: 1px solid var(--color-gray-border);">XS</td><td style="padding: 8px; border: 1px solid var(--color-gray-border);">84-88</td><td style="padding: 8px; border: 1px solid var(--color-gray-border);">66-70</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid var(--color-gray-border);">S</td><td style="padding: 8px; border: 1px solid var(--color-gray-border);">88-92</td><td style="padding: 8px; border: 1px solid var(--color-gray-border);">70-74</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid var(--color-gray-border);">M</td><td style="padding: 8px; border: 1px solid var(--color-gray-border);">96-100</td><td style="padding: 8px; border: 1px solid var(--color-gray-border);">78-82</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid var(--color-gray-border);">L</td><td style="padding: 8px; border: 1px solid var(--color-gray-border);">104-108</td><td style="padding: 8px; border: 1px solid var(--color-gray-border);">86-90</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid var(--color-gray-border);">XL</td><td style="padding: 8px; border: 1px solid var(--color-gray-border);">112-116</td><td style="padding: 8px; border: 1px solid var(--color-gray-border);">94-98</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid var(--color-gray-border);">XXL</td><td style="padding: 8px; border: 1px solid var(--color-gray-border);">120-124</td><td style="padding: 8px; border: 1px solid var(--color-gray-border);">102-106</td></tr>
                </tbody>
            </table>
            <p class="text-small text-secondary" style="margin-top: 16px;">Cómo medir: Usa una cinta métrica flexible. Mide el contorno del pecho en la parte más ancha y la cintura en la parte más estrecha.</p>
        </div>
    `;

    document.body.appendChild(modal);

    // Forzar reflow para asegurar que la transición se aplique
    modal.getBoundingClientRect();

    // Aplicar estilos finales para la transición
    modal.style.opacity = '1';
    modal.querySelector('.modal-content').style.transform = 'scale(1)';

    // Cerrar al hacer clic fuera
    modal.onclick = (e) => {
        if (e.target === modal) cerrarGuiaTallas();
    };
}


/**
 * Cerrar guía de tallas
 */
function cerrarGuiaTallas() {
    const modal = document.querySelector('.modal-guia-tallas');
    if (modal) {
        modal.style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'scale(0.9)';
        setTimeout(() => modal.remove(), 300); // Esperar a que termine la transición
    }
}

/**
 * Mostrar/ocultar loader
 */
function mostrarLoader(mostrar) {
    const loader = document.getElementById('loader');
    if (!loader) {
        // Crear loader si no existe
        const loaderDiv = document.createElement('div');
        loaderDiv.id = 'loader';
        loaderDiv.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999; font-size: 24px; display: none;';
        loaderDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; // Asume FontAwesome
        document.body.appendChild(loaderDiv);
    }
    document.getElementById('loader').style.display = mostrar ? 'flex' : 'none';
}


/**
 * Mostrar error
 */
function mostrarError(mensaje) {
    const main = document.querySelector('main') || document.body;
    main.innerHTML = `
        <div class="error-pagina" style="text-align: center; padding: 100px 0;">
            <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: var(--color-error); margin-bottom: 16px;"></i>
            <h2>Error</h2>
            <p>${mensaje}</p>
            <button class="btn-primary" onclick="window.location.href='/catalogo.html'" style="margin-top: 24px;">
                Volver al catálogo
            </button>
        </div>
    `;
}

// ===========================
// 8. EVENT LISTENERS
// ===========================

function inicializarEventListeners() {
    window.seleccionarTalla = seleccionarTalla;
    window.cambiarCantidad = cambiarCantidad;
    window.agregarAlCarritoClick = agregarAlCarritoClick;
    window.abrirGuiaTallas = abrirGuiaTallas;
    window.cerrarGuiaTallas = cerrarGuiaTallas;
    window.cerrarModalPostCompra = cerrarModalPostCompra;
    window.irAlCarrito = irAlCarrito;

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarGuiaTallas();
            cerrarModalPostCompra();
        }
    });
}

// ===========================
// 9. FUNCIONES ADICIONALES (Placeholder para Reseñas si se implementan)
// ===========================

async function cargarResenas(productoId) {
    // Lógica para cargar reseñas (puede ser similar a cargarProductosRelacionados)
    console.log("Cargando reseñas para producto:", productoId);
    // Por ahora, no hace nada visiblemente
}


// Llamada final para asegurar la inicialización si el DOM ya está listo
if (document.readyState !== 'loading') {
    // Si se desea alguna función adicional
}

document.addEventListener('DOMContentLoaded', async () => {
    const productoPendienteStr = localStorage.getItem('sportiva_producto_pendiente');
    
    if (productoPendienteStr && typeof authService !== 'undefined' && authService.isLoggedIn()) {
        console.log('🔄 Restaurando selección anterior...');
        
        try {
            const productoPendiente = JSON.parse(productoPendienteStr);
            
            // SOLO RESTAURAR UI (talla y cantidad seleccionadas)
            if (productoPendiente.uiData) {
                const { tallaNombre, cantidad } = productoPendiente.uiData;
                
                // Esperar a que el producto se haya cargado
                await new Promise(resolve => {
                    const checkProducto = setInterval(() => {
                        if (productoActual && (productoActual.id_producto || productoActual.id)) {
                            clearInterval(checkProducto);
                            resolve();
                        }
                    }, 100);
                    
                    // Timeout de seguridad
                    setTimeout(() => {
                        clearInterval(checkProducto);
                        resolve();
                    }, 3000);
                });
                
                // Restaurar talla seleccionada
                if (tallaNombre) {
                    tallaSeleccionada = tallaNombre;
                    // Marcar visualmente la talla en la UI
                    setTimeout(() => {
                        document.querySelectorAll('.talla-btn').forEach(btn => {
                            if (btn.textContent.trim() === tallaNombre) {
                                btn.classList.add('active');
                            }
                        });
                    }, 300);
                }
                
                // Restaurar cantidad
                if (cantidad) {
                    cantidadSeleccionada = cantidad;
                    actualizarCantidadInput();
                }
                
                console.log('✅ UI restaurada - Talla:', tallaNombre, 'Cantidad:', cantidad);
                
                // Mostrar notificación al usuario
                if (typeof mostrarToast === 'function') {
                    mostrarToast('Selección restaurada. Haz clic en "AGREGAR AL CARRITO" para continuar.', 'info');
                }
            }
            
            // Limpiar localStorage DESPUÉS de restaurar UI
            // NO agregar automáticamente al carrito
            localStorage.removeItem('sportiva_producto_pendiente');
            
        } catch (error) {
            console.error('❌ Error restaurando producto pendiente:', error);
            localStorage.removeItem('sportiva_producto_pendiente');
        }
    }
});
