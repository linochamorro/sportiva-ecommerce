// ========================================
// SPORTIVA E-COMMERCE - DETALLE PRODUCTO
// Integración con API REST Backend
// Fecha actualización: 16 Octubre 2025
// ========================================

// ===========================
// 1. VARIABLES GLOBALES
// ===========================

let productoActual = null;
let tallaSeleccionada = null;
let cantidadSeleccionada = 1;
let imagenActual = 0;
let productosRelacionados = [];
let resenas = [];

// ===========================
// 2. INICIALIZACIÓN
// ===========================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando detalle de producto...');
    
    // Verificar si apiConfig está disponible
    if (typeof apiConfig === 'undefined') {
        console.warn('⚠️ apiConfig no disponible - usando modo fallback');
    }
    
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
    
    console.log('✅ Detalle de producto inicializado correctamente');
});

// ===========================
// 3. CARGA DE PRODUCTO
// ===========================

/**
 * Obtener ID del producto de la URL
 */
function obtenerProductoIdDeURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

/**
 * Cargar producto desde API
 */
async function cargarProducto(productoId) {
    mostrarLoader(true);
    
    try {
        if (typeof apiConfig !== 'undefined') {
            // Cargar desde API
            const response = await apiConfig.apiGet(`/productos/${productoId}`);
            
            if (response.success && response.data) {
                // ✅ CORREGIDO: Acceder a response.data.producto (estructura del backend)
                productoActual = normalizarProducto(response.data.producto || response.data);
                console.log('✅ Producto cargado desde API:', productoActual);
                
                // Extraer productos relacionados si vienen en la misma respuesta
                if (response.data.productos_relacionados) {
                    productosRelacionados = response.data.productos_relacionados;
                    renderizarProductosRelacionados();
                }
            } else {
                throw new Error('Producto no encontrado en API');
            }
        } else {
            // Fallback: cargar desde JSON local
            await cargarProductoLocal(productoId);
        }
        
        // Renderizar producto
        renderizarProducto();
        
        // Cargar datos adicionales sin bloquear (no usar await)
        Promise.all([
            cargarProductosRelacionados(productoId).catch(e => console.warn('⚠️ Productos relacionados no disponibles')),
            cargarResenas(productoId).catch(e => console.warn('⚠️ Reseñas no disponibles'))
        ]);
        
    } catch (error) {
        console.error('❌ Error al cargar producto:', error);
        mostrarError('Error al cargar el producto');
        
        // Intentar fallback
        try {
            await cargarProductoLocal(productoId);
            renderizarProducto();
        } catch (fallbackError) {
            console.error('❌ Error en fallback:', fallbackError);
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
        const response = await fetch('../assets/data/productos.json');
        if (!response.ok) throw new Error('Error al cargar datos locales');
        
        const data = await response.json();
        productoActual = data.productos.find(p => 
            (p.id_producto || p.producto_id || p.id) == productoId
        );
        productoActual = normalizarProducto(productoActual);
        
        if (!productoActual) {
            throw new Error('Producto no encontrado en datos locales');
        }
        
        console.log('✅ Producto cargado desde JSON local');
    } catch (error) {
        throw new Error('No se pudo cargar el producto');
    }
}

/**
 * Normalizar datos del backend al formato del frontend
 */
function normalizarProducto(producto) {
    if (!producto) return null;
    if (producto.nombre_producto && producto.categoria_nombre) return producto;
    return {
        ...producto,
        nombre_producto: producto.nombre_producto || producto.nombre || 'Producto sin nombre',
        categoria_nombre: producto.categoria_nombre || producto.categoria || producto.nombre_categoria || 'Sin categoría',
        imagen: producto.imagen || producto.imagen_url || producto.url_imagen || '/assets/images/placeholder.jpg',
        imagen_url: producto.imagen_url || producto.imagen || producto.url_imagen || '/assets/images/placeholder.jpg'
    };
}

// ===========================
// 4. RENDERIZADO
// ===========================

/**
 * Renderizar producto completo
 */

// **************************************************************************

function renderizarProducto() {
    if (!productoActual) return;
    
    console.log('🎨 Iniciando renderizado del producto...');
    
    // Actualizar título de página
    document.title = `${productoActual.nombre} - Sportiva`;
    
    // ✅ CREAR ESTRUCTURA HTML PRIMERO
    crearEstructuraHTML();
    
    // Renderizar secciones
    renderizarGaleria();
    renderizarInformacion();
    renderizarDetalles();
    renderizarSelectorTallas();
    
    // Inicializar cantidad en 1
    cantidadSeleccionada = 1;
    actualizarCantidadInput();
    
    console.log('✅ Renderizado completado exitosamente');
}

// ***************************************************************************

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
            <!-- Columna izquierda: Galería -->
            <div class="producto-galeria">
                <div id="galeria-producto"></div>
            </div>
            
            <!-- Columna derecha: Información -->
            <div class="producto-contenido">
                <div id="producto-info"></div>
                
                <!-- Selector de tallas -->
                <div id="selector-tallas-container" style="margin: 24px 0;"></div>
                
                <!-- Selector de cantidad -->
                <div class="cantidad-selector" style="display: flex; align-items: center; gap: 16px; margin: 24px 0;">
                    <label style="font-weight: 600;">Cantidad:</label>
                    <button onclick="cambiarCantidad(-1)" class="btn-cantidad" style="width: 40px; height: 40px; border: 1px solid #ddd; background: white; cursor: pointer;">-</button>
                    <input type="number" id="cantidad-input" value="1" min="1" readonly style="width: 60px; text-align: center; border: 1px solid #ddd; padding: 8px;">
                    <button onclick="cambiarCantidad(1)" class="btn-cantidad" style="width: 40px; height: 40px; border: 1px solid #ddd; background: white; cursor: pointer;">+</button>
                </div>
                
                <!-- Botón agregar al carrito -->
                <button onclick="agregarAlCarrito()" class="btn btn-primary btn-agregar-carrito" style="width: 100%; padding: 16px; background: #FF6B35; color: white; border: none; font-weight: 700; cursor: pointer; text-transform: uppercase; letter-spacing: 1px;">
                    AGREGAR AL CARRITO
                </button>
            </div>
        </div>
        
        <!-- Detalles y tabs -->
        <div id="producto-detalles" class="producto-detalles-section" style="margin-top: 48px;"></div>
    `;
    
    console.log('✅ Estructura HTML creada');
}

/**
 * Renderizar galería de imágenes
 */
function renderizarGaleria() {
    const imagenes = obtenerImagenesProducto();
    const galeriaContainer = document.getElementById('galeria-producto');
    
    if (!galeriaContainer) return;
    
    galeriaContainer.innerHTML = `
        <!-- Imagen principal -->
        <div class="imagen-principal">
            <img id="imagen-principal" 
                  src="${imagenes[0]}" 
                  alt="${productoActual.nombre}">
            
            ${imagenes.length > 1 ? `
                <button class="btn-galeria btn-prev" onclick="cambiarImagen(-1)">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="btn-galeria btn-next" onclick="cambiarImagen(1)">
                    <i class="fas fa-chevron-right"></i>
                </button>
            ` : ''}
            
            <button class="btn-zoom" onclick="abrirZoom()">
                <i class="fas fa-search-plus"></i>
            </button>
        </div>
        
        <!-- Miniaturas -->
        ${imagenes.length > 1 ? `
            <div class="galeria-miniaturas">
                ${imagenes.map((img, index) => `
                    <img src="${img}" 
                          alt="Vista ${index + 1}" 
                          class="miniatura ${index === 0 ? 'active' : ''}"
                          onclick="seleccionarImagen(${index})">
                `).join('')}
            </div>
        ` : ''}
    `;
}

/**
 * Obtener imágenes del producto
 */
function obtenerImagenesProducto() {
    const imagenes = [];
    
    // Imagen principal
    if (productoActual.imagen_url || productoActual.imagen) {
        imagenes.push(productoActual.imagen_url || productoActual.imagen);
    }
    
    // Imágenes adicionales
    if (productoActual.imagenes && Array.isArray(productoActual.imagenes)) {
        imagenes.push(...productoActual.imagenes);
    }
    
    // Imagen por defecto si no hay ninguna
    if (imagenes.length === 0) {
        imagenes.push('/assets/images/balon-futbol-adidas.jpg');
    }
    
    return imagenes;
}

/**
 * Renderizar información del producto
 */
function renderizarInformacion() {
    const infoContainer = document.getElementById('producto-info');
    if (!infoContainer) return;
    
    const precio = parseFloat(productoActual.precio_venta || productoActual.precio);
    const precioOriginal = productoActual.precio_original ? 
        parseFloat(productoActual.precio_original) : null;
    const descuento = precioOriginal ? 
        Math.round(((precioOriginal - precio) / precioOriginal) * 100) : 0;
    const stock = productoActual.stock_total || productoActual.stock || 0;
    
    infoContainer.innerHTML = `
        <!-- Breadcrumb -->
        <div class="breadcrumb">
            <a href="/">Inicio</a>
            <span>/</span>
            <a href="/catalogo.html">Catálogo</a>
            <span>/</span>
            <a href="/catalogo.html?categoria=${productoActual.categoria || ''}">${productoActual.categoria || 'Productos'}</a>
            <span>/</span>
            <span>${productoActual.nombre}</span>
        </div>
        
        <!-- Información principal -->
        <div class="producto-header">
            <h1>${productoActual.nombre}</h1>
            
            ${productoActual.marca ? `
                <div class="producto-marca">
                    <strong>Marca:</strong> ${productoActual.marca}
                </div>
            ` : ''}
            
            <div class="producto-rating">
                ${renderizarEstrellas(productoActual.rating || 4.5)}
                <span class="rating-numero">${productoActual.rating || 4.5}</span>
                <span class="rating-reviews">(${productoActual.num_reviews || 0} reseñas)</span>
            </div>
        </div>
        
        <!-- Precios -->
        <div class="producto-precios">
            <div class="precio-actual">S/ ${precio.toFixed(2)}</div>
            ${precioOriginal ? `
                <div class="precio-original">S/ ${precioOriginal.toFixed(2)}</div>
                <div class="badge-descuento">-${descuento}%</div>
            ` : ''}
        </div>
        
        <!-- Stock -->
        <div class="producto-stock">
            ${stock > 0 ? `
                <span class="stock-disponible">
                    <i class="fas fa-check-circle"></i>
                    ${stock < 10 ? `¡Solo ${stock} disponibles!` : 'Disponible'}
                </span>
            ` : `
                <span class="stock-agotado">
                    <i class="fas fa-times-circle"></i>
                    Agotado
                </span>
            `}
        </div>
        
        <!-- Descripción corta -->
        ${productoActual.descripcion_corta ? `
            <div class="producto-descripcion-corta">
                <p>${productoActual.descripcion_corta}</p>
            </div>
        ` : ''}
    `;
}

/**
 * Renderizar detalles del producto
 */
function renderizarDetalles() {
    const detallesContainer = document.getElementById('producto-detalles');
    if (!detallesContainer) return;
    
    detallesContainer.innerHTML = `
        <div class="tabs">
            <button class="tab active" onclick="cambiarTab('descripcion')">Descripción</button>
            <button class="tab" onclick="cambiarTab('especificaciones')">Especificaciones</button>
            <button class="tab" onclick="cambiarTab('resenas')">Reseñas</button>
        </div>
        
        <div class="tab-content">
            <!-- Descripción -->
            <div id="tab-descripcion" class="tab-panel active">
                <h3>Descripción del Producto</h3>
                <p>${productoActual.descripcion || productoActual.descripcion_corta || 'Sin descripción disponible'}</p>
                
                ${productoActual.caracteristicas ? `
                    <h4>Características principales:</h4>
                    <ul>
                        ${Array.isArray(productoActual.caracteristicas) ?
                            productoActual.caracteristicas.map(c => `<li>${c}</li>`).join('') :
                            `<li>${productoActual.caracteristicas}</li>`
                        }
                    </ul>
                ` : ''}
            </div>
            
            <!-- Especificaciones -->
            <div id="tab-especificaciones" class="tab-panel">
                <h3>Especificaciones Técnicas</h3>
                <table class="tabla-especificaciones">
                    <tr>
                        <td><strong>SKU:</strong></td>
                        <td>${productoActual.sku || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>Categoría:</strong></td>
                        <td>${productoActual.categoria || 'N/A'}</td>
                    </tr>
                    ${productoActual.marca ? `
                        <tr>
                            <td><strong>Marca:</strong></td>
                            <td>${productoActual.marca}</td>
                        </tr>
                    ` : ''}
                    ${productoActual.material ? `
                        <tr>
                            <td><strong>Material:</strong></td>
                            <td>${productoActual.material}</td>
                        </tr>
                    ` : ''}
                    ${productoActual.color ? `
                        <tr>
                            <td><strong>Color:</strong></td>
                            <td>${productoActual.color}</td>
                        </tr>
                    ` : ''}
                    ${productoActual.genero ? `
                        <tr>
                            <td><strong>Género:</strong></td>
                            <td>${productoActual.genero === 'M' ? 'Hombre' : productoActual.genero === 'F' ? 'Mujer' : 'Unisex'}</td>
                        </tr>
                    ` : ''}
                    ${productoActual.peso ? `
                        <tr>
                            <td><strong>Peso:</strong></td>
                            <td>${productoActual.peso}</td>
                        </tr>
                    ` : ''}
                </table>
            </div>
            
            <!-- Reseñas -->
            <div id="tab-resenas" class="tab-panel">
                <h3>Reseñas de Clientes</h3>
                <div id="resenas-container">
                    ${renderizarResenas()}
                </div>
            </div>
        </div>
    `;
}

/**
 * Renderizar selector de tallas
 */
function renderizarSelectorTallas() {
    const selectorContainer = document.getElementById('selector-tallas');
    if (!selectorContainer) return;
    
    const tallas = obtenerTallasDisponibles();
    const stock = productoActual.stock_total || productoActual.stock || 0;
    
    selectorContainer.innerHTML = `
        <!-- Selector de tallas -->
        <div class="tallas-selector">
            <label>Selecciona tu talla:</label>
            <div class="tallas-grid">
                ${tallas.map(talla => `
                    <button class="btn-talla ${talla.stock === 0 ? 'disabled' : ''}" 
                            data-talla="${talla.nombre}"
                            data-stock="${talla.stock}"
                            onclick="seleccionarTalla('${talla.nombre}', ${talla.stock})"
                            ${talla.stock === 0 ? 'disabled' : ''}>
                        ${talla.nombre}
                        ${talla.stock === 0 ? '<span class="agotado-label">Agotado</span>' : ''}
                    </button>
                `).join('')}
            </div>
            <a href="#" class="guia-tallas" onclick="abrirGuiaTallas(); return false;">
                <i class="fas fa-ruler"></i> Guía de tallas
            </a>
        </div>
        
        <!-- Selector de cantidad -->
        <div class="cantidad-selector">
            <label>Cantidad:</label>
            <div class="cantidad-controls">
                <button class="btn-cantidad" onclick="cambiarCantidad(-1)">
                    <i class="fas fa-minus"></i>
                </button>
                <input type="number" 
                        id="cantidad-input" 
                        value="1" 
                        min="1" 
                        max="${stock}"
                        readonly>
                <button class="btn-cantidad" onclick="cambiarCantidad(1)">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            <span class="stock-disponible-label" id="stock-label"></span>
        </div>
        
        <!-- Botones de acción -->
        <div class="acciones-producto">
            <button class="btn-primary btn-lg btn-agregar-carrito" 
                    onclick="agregarAlCarrito()"
                    ${stock === 0 ? 'disabled' : ''}>
                <i class="fas fa-shopping-cart"></i>
                ${stock === 0 ? 'Agotado' : 'Agregar al carrito'}
            </button>
            
            <button class="btn-secondary btn-lg btn-comprar-ahora" 
                    onclick="comprarAhora()"
                    ${stock === 0 ? 'disabled' : ''}>
                <i class="fas fa-bolt"></i>
                Comprar ahora
            </button>
            
            <button class="btn-icon-lg btn-favorito" 
                    onclick="toggleFavorito()"
                    title="Agregar a favoritos">
                <i class="far fa-heart"></i>
            </button>
        </div>
        
        <!-- Información adicional -->
        <div class="info-adicional">
            <div class="info-item">
                <i class="fas fa-truck"></i>
                <div>
                    <strong>Envío gratis</strong>
                    <p>En compras mayores a S/ 150</p>
                </div>
            </div>
            <div class="info-item">
                <i class="fas fa-undo"></i>
                <div>
                    <strong>Devoluciones fáciles</strong>
                    <p>30 días para cambios o devoluciones</p>
                </div>
            </div>
            <div class="info-item">
                <i class="fas fa-shield-alt"></i>
                <div>
                    <strong>Compra segura</strong>
                    <p>Transacciones 100% protegidas</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Obtener tallas disponibles del producto
 */
function obtenerTallasDisponibles() {
    const tallas = [];
    
    // Si hay variantes con tallas
    if (productoActual.variantes && Array.isArray(productoActual.variantes)) {
        productoActual.variantes.forEach(variante => {
            tallas.push({
                nombre: variante.talla,
                stock: variante.stock || 0
            });
        });
    } else if (productoActual.tallas && Array.isArray(productoActual.tallas)) {
        // Tallas sin stock específico
        productoActual.tallas.forEach(talla => {
            tallas.push({
                nombre: talla,
                stock: productoActual.stock_total || productoActual.stock || 0
            });
        });
    } else {
        // Tallas por defecto
        const tallasDefault = ['XS', 'S', 'M', 'L', 'XL'];
        tallasDefault.forEach(talla => {
            tallas.push({
                nombre: talla,
                stock: productoActual.stock_total || productoActual.stock || 0
            });
        });
    }
    
    return tallas;
}

// ===========================
// 5. PRODUCTOS RELACIONADOS
// ===========================

/**
 * Cargar productos relacionados
 */
async function cargarProductosRelacionados(productoId) {
    try {
        if (typeof apiConfig !== 'undefined') {
            const response = await apiConfig.apiGet(`/productos/${productoId}/relacionados?limit=4`);
            
            if (response.success && response.data) {
                // ✅ CORREGIDO: Manejar diferentes estructuras de respuesta
                productosRelacionados = Array.isArray(response.data) 
                    ? response.data 
                    : (response.data.productos || response.data);
                renderizarProductosRelacionados();
            }
        } else {
            // Fallback: productos aleatorios
            cargarProductosRelacionadosLocal();
        }
    } catch (error) {
        console.error('❌ Error al cargar productos relacionados:', error);
        cargarProductosRelacionadosLocal();
    }
}

/**
 * Cargar productos relacionados desde JSON local
 */
async function cargarProductosRelacionadosLocal() {
    try {
        const response = await fetch('../assets/data/productos.json');
        const data = await response.json();
        
        // Productos de la misma categoría (excluir el actual)
        productosRelacionados = data.productos
            .filter(p => 
                p.categoria_nombre === productoActual.categoria_nombre && 
                (p.id_producto || p.producto_id || p.id) !== (productoActual.id_producto || productoActual.producto_id || productoActual.id)
            )
            .slice(0, 4);
        
        renderizarProductosRelacionados();
    } catch (error) {
        console.error('❌ Error al cargar productos relacionados locales:', error);
    }
}

/**
 * Renderizar productos relacionados
 */
function renderizarProductosRelacionados() {
    const container = document.getElementById('productos-relacionados');
    if (!container || productosRelacionados.length === 0) return;
    
    container.innerHTML = `
        <h2>Productos Relacionados</h2>
        <div class="productos-grid">
            ${productosRelacionados.map(producto => crearCardProductoRelacionado(producto)).join('')}
        </div>
    `;
}

/**
 * Crear card de producto relacionado
 */
function crearCardProductoRelacionado(producto) {
    const precio = parseFloat(producto.precio_venta || producto.precio);
    const imagen = producto.imagen_url || producto.imagen || '/assets/images/placeholder.jpg';
    
    return `
        <div class="producto-card-mini">
            <a href="/producto.html?id=${producto.id_producto || producto.producto_id || producto.id}">
                <img src="${imagen}" alt="${producto.nombre}">
                <h4>${producto.nombre}</h4>
                <div class="precio">S/ ${precio.toFixed(2)}</div>
            </a>
        </div>
    `;
}

// ===========================
// 6. RESEÑAS
// ===========================

/**
 * Cargar reseñas del producto
 */
async function cargarResenas(productoId) {
    try {
        if (typeof apiConfig !== 'undefined') {
            const response = await apiConfig.apiGet(`/productos/${productoId}/resenas`);
            
            if (response.success && response.data) {
                // ✅ CORREGIDO: Manejar diferentes estructuras de respuesta
                resenas = Array.isArray(response.data) 
                    ? response.data 
                    : (response.data.resenas || response.data);
                actualizarResenasTab();
            }
        }
    } catch (error) {
        console.error('❌ Error al cargar reseñas:', error);
    }
}

/**
 * Renderizar reseñas
 */
function renderizarResenas() {
    if (resenas.length === 0) {
        return `
            <div class="sin-resenas">
                <i class="fas fa-comment-slash"></i>
                <p>Aún no hay reseñas para este producto.</p>
                <p>¡Sé el primero en dejar tu opinión!</p>
            </div>
        `;
    }
    
    return resenas.map(resena => `
        <div class="resena-card">
            <div class="resena-header">
                <div class="resena-usuario">
                    <strong>${resena.nombre_cliente || 'Cliente'}</strong>
                    <span class="resena-fecha">${formatearFecha(resena.fecha_resena)}</span>
                </div>
                <div class="resena-rating">
                    ${renderizarEstrellas(resena.calificacion)}
                </div>
            </div>
            <div class="resena-comentario">
                <p>${resena.comentario}</p>
            </div>
        </div>
    `).join('');
}

/**
 * Actualizar tab de reseñas
 */
function actualizarResenasTab() {
    const container = document.getElementById('resenas-container');
    if (container) {
        container.innerHTML = renderizarResenas();
    }
}

// ===========================
// 7. ACCIONES
// ===========================

/**
 * Seleccionar talla
 */
async function seleccionarTalla(talla, stock) {
    tallaSeleccionada = talla;
    
    // Actualizar UI
    document.querySelectorAll('.btn-talla').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    event.target.classList.add('selected');
    
    // Verificar stock real desde API
    if (typeof apiConfig !== 'undefined') {
        try {
            const productoId = productoActual.id_producto || productoActual.producto_id || productoActual.id;
            const response = await apiConfig.apiGet(`/productos/${productoId}/stock?talla=${talla}`);
            
            if (response.success && response.data) {
                stock = response.data.stock_disponible;
            }
        } catch (error) {
            console.error('❌ Error al verificar stock:', error);
        }
    }
    
    // Actualizar límite de cantidad
    const cantidadInput = document.getElementById('cantidad-input');
    if (cantidadInput) {
        cantidadInput.max = stock;
        if (cantidadSeleccionada > stock) {
            cantidadSeleccionada = stock;
            cantidadInput.value = stock;
        }
    }
    
    // Actualizar label de stock
    const stockLabel = document.getElementById('stock-label');
    if (stockLabel) {
        stockLabel.textContent = `${stock} disponibles`;
    }
}

/**
 * Cambiar cantidad
 */
function cambiarCantidad(delta) {
    const input = document.getElementById('cantidad-input');
    if (!input) return;
    
    const min = parseInt(input.min) || 1;
    const max = parseInt(input.max) || 999;
    
    cantidadSeleccionada = Math.max(min, Math.min(max, cantidadSeleccionada + delta));
    input.value = cantidadSeleccionada;
}

/**
 * Actualizar input de cantidad
 */
function actualizarCantidadInput() {
    const input = document.getElementById('cantidad-input');
    if (input) {
        input.value = cantidadSeleccionada;
    }
}

/**
 * Agregar al carrito
 */
async function agregarAlCarrito() {
    try {
        // Validar talla seleccionada
        if (!tallaSeleccionada) {
            mostrarNotificacion('Por favor selecciona una talla', 'warning');
            return;
        }
        
        // Verificar autenticación
        const isAuthenticated = typeof authService !== 'undefined' && authService.isLoggedIn();
        
        if (!isAuthenticated) {
            mostrarNotificacion('Por favor inicia sesión para agregar productos', 'warning');
            setTimeout(() => {
                window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
            }, 1500);
            return;
        }
        
        // Deshabilitar botón
        const btnAgregar = document.querySelector('.btn-agregar-carrito');
        if (btnAgregar) {
            btnAgregar.disabled = true;
            btnAgregar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Agregando...';
        }
        
        // Agregar al carrito con API
        if (typeof apiConfig !== 'undefined') {
            const response = await apiConfig.apiPost('/carrito/items', {
                producto_id: productoActual.id_producto || productoActual.producto_id || productoActual.id,
                cantidad: cantidadSeleccionada,
                talla: tallaSeleccionada
            });
            
            if (response.success) {
                mostrarNotificacion('Producto agregado al carrito', 'success');
                
                // Actualizar contador del carrito
                if (typeof actualizarCantidadCarrito === 'function') {
                    actualizarCantidadCarrito();
                }
                
                // Resetear selección
                cantidadSeleccionada = 1;
                actualizarCantidadInput();
            } else {
                throw new Error(response.message || 'Error al agregar al carrito');
            }
        } else {
            // Fallback: carrito local
            agregarAlCarritoLocal();
        }
        
    } catch (error) {
        console.error('❌ Error al agregar al carrito:', error);
        mostrarNotificacion('Error al agregar producto al carrito', 'error');
    } finally {
        // Rehabilitar botón
        const btnAgregar = document.querySelector('.btn-agregar-carrito');
        if (btnAgregar) {
            btnAgregar.disabled = false;
            btnAgregar.innerHTML = '<i class="fas fa-shopping-cart"></i> Agregar al carrito';
        }
    }
}

/**
 * Agregar al carrito local (fallback)
 */
function agregarAlCarritoLocal() {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    const index = carrito.findIndex(item => 
        item.producto_id === (productoActual.id_producto || productoActual.producto_id || productoActual.id) &&
        item.talla === tallaSeleccionada
    );
    
    if (index > -1) {
        carrito[index].cantidad += cantidadSeleccionada;
    } else {
        carrito.push({
            producto_id: productoActual.id_producto || productoActual.producto_id || productoActual.id,
            nombre: productoActual.nombre,
            precio: parseFloat(productoActual.precio_venta || productoActual.precio),
            imagen: productoActual.imagen_url || productoActual.imagen,
            cantidad: cantidadSeleccionada,
            talla: tallaSeleccionada
        });
    }
    
    localStorage.setItem('carrito', JSON.stringify(carrito));
    mostrarNotificacion('Producto agregado al carrito', 'success');
    
    if (typeof actualizarCantidadCarrito === 'function') {
        actualizarCantidadCarrito();
    }
}

/**
 * Comprar ahora
 */
async function comprarAhora() {
    await agregarAlCarrito();
    
    // Redirigir al carrito
    setTimeout(() => {
        window.location.href = '/carrito.html';
    }, 500);
}

/**
 * Toggle favorito
 */
function toggleFavorito() {
    const btn = document.querySelector('.btn-favorito i');
    
    if (btn.classList.contains('far')) {
        btn.classList.remove('far');
        btn.classList.add('fas');
        mostrarNotificacion('Agregado a favoritos', 'success');
    } else {
        btn.classList.remove('fas');
        btn.classList.add('far');
        mostrarNotificacion('Eliminado de favoritos', 'info');
    }
}

// ===========================
// 8. GALERÍA
// ===========================

/**
 * Cambiar imagen de la galería
 */
function cambiarImagen(delta) {
    const imagenes = obtenerImagenesProducto();
    imagenActual = (imagenActual + delta + imagenes.length) % imagenes.length;
    
    actualizarImagenPrincipal();
}

/**
 * Seleccionar imagen específica
 */
function seleccionarImagen(index) {
    imagenActual = index;
    actualizarImagenPrincipal();
}

/**
 * Actualizar imagen principal
 */
function actualizarImagenPrincipal() {
    const imagenes = obtenerImagenesProducto();
    const imgPrincipal = document.getElementById('imagen-principal');
    
    if (imgPrincipal) {
        imgPrincipal.src = imagenes[imagenActual];
    }
    
    // Actualizar miniaturas
    document.querySelectorAll('.miniatura').forEach((thumb, index) => {
        thumb.classList.toggle('active', index === imagenActual);
    });
}

/**
 * Abrir zoom de imagen
 */
function abrirZoom() {
    const imagenes = obtenerImagenesProducto();
    const modal = document.createElement('div');
    modal.className = 'modal-zoom';
    modal.innerHTML = `
        <div class="modal-zoom-content">
            <button class="btn-cerrar-zoom" onclick="cerrarZoom()">
                <i class="fas fa-times"></i>
            </button>
            <img src="${imagenes[imagenActual]}" alt="${productoActual.nombre}">
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
}

/**
 * Cerrar zoom
 */
function cerrarZoom() {
    const modal = document.querySelector('.modal-zoom');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// ===========================
// 9. TABS
// ===========================

/**
 * Cambiar tab activo
 */
function cambiarTab(tabId) {
    // Actualizar botones
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Actualizar paneles
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    const panel = document.getElementById(`tab-${tabId}`);
    if (panel) {
        panel.classList.add('active');
    }
}

/**
 * Abrir guía de tallas
 */
function abrirGuiaTallas() {
    const modal = document.createElement('div');
    modal.className = 'modal-guia-tallas';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Guía de Tallas</h3>
                <button class="btn-cerrar" onclick="cerrarGuiaTallas()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <table class="tabla-tallas">
                    <thead>
                        <tr>
                            <th>Talla</th>
                            <th>Pecho (cm)</th>
                            <th>Cintura (cm)</th>
                            <th>Cadera (cm)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>XS</td><td>81-86</td><td>66-71</td><td>86-91</td></tr>
                        <tr><td>S</td><td>86-91</td><td>71-76</td><td>91-96</td></tr>
                        <tr><td>M</td><td>91-96</td><td>76-81</td><td>96-101</td></tr>
                        <tr><td>L</td><td>96-102</td><td>81-86</td><td>101-106</td></tr>
                        <tr><td>XL</td><td>102-107</td><td>86-91</td><td>106-112</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
}

/**
 * Cerrar guía de tallas
 */
function cerrarGuiaTallas() {
    const modal = document.querySelector('.modal-guia-tallas');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// ===========================
// 10. HELPERS
// ===========================

/**
 * Renderizar estrellas de rating
 */
function renderizarEstrellas(rating) {
    const estrellas = [];
    const ratingRedondeado = Math.round(rating * 2) / 2;
    
    for (let i = 1; i <= 5; i++) {
        if (i <= ratingRedondeado) {
            estrellas.push('<i class="fas fa-star"></i>');
        } else if (i - 0.5 === ratingRedondeado) {
            estrellas.push('<i class="fas fa-star-half-alt"></i>');
        } else {
            estrellas.push('<i class="far fa-star"></i>');
        }
    }
    
    return `<div class="estrellas">${estrellas.join('')}</div>`;
}

/**
 * Formatear fecha
 */
function formatearFecha(fecha) {
    if (!fecha) return 'Fecha desconocida';
    
    const date = new Date(fecha);
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    
    return date.toLocaleDateString('es-PE', opciones);
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

/**
 * Mostrar error
 */
function mostrarError(mensaje) {
    const main = document.querySelector('main') || document.body;
    main.innerHTML = `
        <div class="error-pagina">
            <i class="fas fa-exclamation-triangle"></i>
            <h2>Error</h2>
            <p>${mensaje}</p>
            <button class="btn-primary" onclick="window.location.href='/catalogo.html'">
                Volver al catálogo
            </button>
        </div>
    `;
}

// ===========================
// 11. EVENT LISTENERS
// ===========================

function inicializarEventListeners() {
    // Teclado para galería
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') cambiarImagen(-1);
        if (e.key === 'ArrowRight') cambiarImagen(1);
        if (e.key === 'Escape') {
            cerrarZoom();
            cerrarGuiaTallas();
        }
    });
}

// ===========================
// 12. EXPORTAR FUNCIONES
// ===========================

window.seleccionarTalla = seleccionarTalla;
window.cambiarCantidad = cambiarCantidad;
window.agregarAlCarrito = agregarAlCarrito;
window.comprarAhora = comprarAhora;
window.toggleFavorito = toggleFavorito;
window.cambiarImagen = cambiarImagen;
window.seleccionarImagen = seleccionarImagen;
window.abrirZoom = abrirZoom;
window.cerrarZoom = cerrarZoom;
window.cambiarTab = cambiarTab;
window.abrirGuiaTallas = abrirGuiaTallas;
window.cerrarGuiaTallas = cerrarGuiaTallas;

console.log('✅ producto.js cargado correctamente');
