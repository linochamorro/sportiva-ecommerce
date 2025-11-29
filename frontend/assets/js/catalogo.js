// ========================================
// SPORTIVA E-COMMERCE - CATÁLOGO
// Integración con API REST Backend
// ========================================

// ===========================
// 1. VARIABLES GLOBALES
// ===========================

let productosActuales = [];
let productosFiltrados = [];
let paginaActual = 1;
const productosPorPagina = 100;
let ordenActual = 'destacados';

let filtrosActivos = {
    categoria: '',
    precioMin: 0,
    precioMax: 1000,
    tallas: [],
    genero: '',
    busqueda: '',
    solo_con_stock: false
};

// Cache de productos

let catalogoProductosCache = {
    data: null,
    timestamp: null,
    ttl: 5 * 60 * 1000 // 5 minutos
};

const CATEGORIAS_MAP = {
    1: 'Ropa Deportiva',
    2: 'Calzado Deportivo',
    3: 'Deportes de Equipo',
    4: 'Implementos de Entrenamiento',
    5: 'Accesorios'
};

function safeGetCategoriaNombre(producto) {
    // Caso 1: Nueva estructura (Objeto anidado)
    if (producto.categoria && typeof producto.categoria === 'object') {
        return producto.categoria.nombre_categoria || 'Sin categoría';
    }
    // Caso 2: Estructura plana
    if (producto.categoria_nombre) return producto.categoria_nombre;
    if (typeof producto.categoria === 'string') return producto.categoria;
    
    // Caso 3: Fallback usando ID
    const id = producto.id_categoria || (producto.categoria ? producto.categoria.id_categoria : null);
    if (id) return obtenerNombreCategoria(id);
    
    return 'Sin categoría';
}

function obtenerNombreCategoria(idCategoria) {
    return CATEGORIAS_MAP[idCategoria] || 'Sin categoría';
}

// ===========================
// 2. INICIALIZACIÓN
// ===========================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando catálogo...');
    
    // Verificar si apiConfig y authService están disponibles
    if (typeof apiConfig === 'undefined') {
        console.warn('⚠️ apiConfig no disponible - usando modo fallback');
    }
    
    if (typeof authService === 'undefined') {
        console.warn('⚠️ authService no disponible - funcionalidades de usuario limitadas');
    }
    
    // Inicializar componentes
    inicializarEventListeners();
    
    await cargarProductos();
    inicializarFiltros();
    
    console.log('✅ Catálogo inicializado correctamente');
});

// ===========================
// 3. CARGA DE PRODUCTOS
// ===========================

/**
 * Cargar productos desde la API REST
 */
async function cargarProductos() {

    mostrarLoader(true);
    
    try {
        // Verificar si hay cache válido
        if (esCacheValido()) {
            console.log('📦 Usando productos desde cache');
            productosActuales = catalogoProductosCache.data;
            await cargarCategorias();
            aplicarFiltrosYOrden();
            mostrarLoader(false);
            return;
        }
        
        // Intentar cargar desde API
        if (typeof apiConfig !== 'undefined') {
            const params = new URLSearchParams({
                limit: 100, // Cargar más productos para el catálogo
                page: 1
            });
            
            const response = await apiConfig.apiGet(`/productos?${params}`);
            
            if (response.success && response.data) {
                productosActuales = response.data.productos || response.data;
                
                // Guardar en cache
                catalogoProductosCache = {
                    data: productosActuales,
                    timestamp: Date.now(),
                    ttl: 5 * 60 * 1000
                };
                
                console.log(`✅ ${productosActuales.length} productos cargados desde API`);
                console.log('🔍 DEBUG - Primer producto:', productosActuales[0]);
                console.log('🔍 DEBUG - Categoría primer producto:', productosActuales[0]?.categoria);
                
                // Cargar categorías inmediatamente después de tener productos
                await cargarCategorias();
            } else {
                throw new Error('Respuesta inválida de la API');
            }
        } else {
            // Fallback: cargar desde JSON local
            console.log('⚠️ API no disponible, usando datos locales');
            await cargarProductosLocal();
        }
        
        aplicarFiltrosYOrden();
        
    } catch (error) {
        console.error('❌ Error al cargar productos:', error);
        mostrarError('Error al cargar productos. Intentando con datos locales...');
        
        // Fallback automático a datos locales
        await cargarProductosLocal();
        aplicarFiltrosYOrden();
    } finally {
        mostrarLoader(false);
    }
}

/**
 * Cargar productos desde JSON local (fallback)
 */
async function cargarProductosLocal() {

    try {
        const response = await fetch('../assets/data/productos.json');
        if (!response.ok) throw new Error('Error al cargar productos locales');
        
        const data = await response.json();
        productosActuales = data.productos || [];
        
        console.log(`✅ ${productosActuales.length} productos cargados desde JSON local`);
        
        // Cargar categorías después de productos locales
        await cargarCategorias();
    } catch (error) {
        console.error('❌ Error al cargar productos locales:', error);
        productosActuales = [];
        mostrarError('No se pudieron cargar los productos. Por favor, recarga la página.');
    }
}

/**
 * Verificar si el cache es válido
 */

function esCacheValido() {
    if (!catalogoProductosCache.data || !catalogoProductosCache.timestamp) return false;
    
    const ahora = Date.now();
    const diferencia = ahora - catalogoProductosCache.timestamp;
    
    return diferencia < catalogoProductosCache.ttl;
}

// ===========================
// 3.5. CATEGORÍAS
// ===========================

/**
 * Cargar categorías disponibles desde productos
 */

async function cargarCategorias() {
    try {
        console.log(`🔍 Intentando cargar categorías. Productos disponibles: ${productosActuales.length}`);
        
        if (productosActuales.length === 0) {
            console.warn('⚠️ No hay productos para extraer categorías');
            const contenedor = document.getElementById('filtrosCategorias');
            if (contenedor) {
                contenedor.innerHTML = '<p class="text-small text-secondary">No hay categorías</p>';
            }
            return;
        }
        
        console.log('📦 Producto de muestra:', productosActuales[0]);
        console.log('🔑 Propiedades disponibles:', Object.keys(productosActuales[0]));
        console.log('📌 categoria_nombre:', productosActuales[0].categoria_nombre);
        console.log('📌 categoria_id:', productosActuales[0].categoria_id);
        console.log('📌 id_categoria:', productosActuales[0].id_categoria);
        const categoriasUnicas = [...new Set(
            productosActuales.map(p => safeGetCategoriaNombre(p))
        )].filter(cat => cat && cat !== 'Sin categoría');

        console.log(`🏷️ Categorías extraídas:`, categoriasUnicas);

        renderizarFiltrosCategorias(categoriasUnicas);
        
        console.log(`📁 ${categoriasUnicas.length} categorías disponibles`);
    } catch (error) {
        console.error('❌ Error al cargar categorías:', error);
    }
}

/**
 * Renderizar filtros de categorías en el sidebar
 */

function renderizarFiltrosCategorias(categorias) {
    const contenedor = document.getElementById('filtrosCategorias');
    
    if (!contenedor) {
        console.warn('⚠️ Contenedor filtrosCategorias no encontrado');
        return;
    }
    
    if (!categorias || categorias.length === 0) {
        contenedor.innerHTML = '<p class="text-small text-secondary">No hay categorías</p>';
        return;
    }
    
    // Ordenar alfabéticamente
    categorias.sort();
    
    // Generar radio buttons
    let html = `
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 8px;">
            <input type="radio" name="categoria" value="" ${!filtrosActivos.categoria ? 'checked' : ''} onchange="cambiarCategoria('')">
            <span class="text-small">Todas las categorías</span>
        </label>
    `;
    
    categorias.forEach(categoria => {
        const isSelected = filtrosActivos.categoria === categoria;
        html += `
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 8px;">
                <input type="radio" name="categoria" value="${categoria}" ${isSelected ? 'checked' : ''} onchange="cambiarCategoria('${categoria}')">
                <span class="text-small">${categoria}</span>
            </label>
        `;
    });
    
    contenedor.innerHTML = html;
    console.log('✅ Filtros de categorías renderizados');
}

/**
 * Cambiar categoría activa
 */

function cambiarCategoria(categoria) {
    filtrosActivos.categoria = categoria;
    
    // Actualizar título del catálogo
    const titulo = document.getElementById('tituloCatalogo');
    if (titulo) {
        titulo.textContent = categoria ? categoria.toUpperCase() : 'TODOS LOS PRODUCTOS';
    }
    
    // Actualizar URL sin recargar
    const url = new URL(window.location);
    if (categoria) {
        url.searchParams.set('categoria', categoria);
    } else {
        url.searchParams.delete('categoria');
    }
    window.history.pushState({}, '', url);
    
    aplicarFiltrosYOrden();
}

// ===========================
// 4. BÚSQUEDA
// ===========================

/**
 * Buscar productos usando la API
 */

async function buscarProductos(query) {
    if (!query || query.trim().length < 2) {
        filtrosActivos.busqueda = '';
        await cargarProductos();
        return;
    }
    
    mostrarLoader(true);
    
    try {
        if (typeof apiConfig !== 'undefined') {
            const params = new URLSearchParams({
                q: query.trim(),
                limit: 100
            });
            
            const response = await apiConfig.apiGet(`/productos/buscar?${params}`);
            
            if (response.success && response.data) {
                productosActuales = response.data.productos || response.data;
                
                // Asegurar que sea un array
                if (!Array.isArray(productosActuales)) {
                    console.warn('⚠️ response.data no es un array, convirtiendo...');
                    productosActuales = Array.isArray(response.data) ? response.data : [];
                }
                
                filtrosActivos.busqueda = query;
                
                console.log(`🔍 ${productosActuales.length} productos encontrados para: "${query}"`);
                
                aplicarFiltrosYOrden();
            } else {
                throw new Error('Error en búsqueda');
            }
        } else {
            // Búsqueda local
            buscarProductosLocal(query);
        }
    } catch (error) {
        console.error('❌ Error en búsqueda:', error);
        buscarProductosLocal(query);
    } finally {
        mostrarLoader(false);
    }
}

/**
 * Búsqueda local (fallback)
 */

function buscarProductosLocal(query) {
    const queryLower = query.toLowerCase().trim();
    
    productosActuales = productosActuales.filter(producto => 
        producto.nombre.toLowerCase().includes(queryLower) ||
        (producto.descripcion && producto.descripcion.toLowerCase().includes(queryLower)) ||
        (producto.marca && producto.marca.toLowerCase().includes(queryLower)) ||
        (producto.categoria && producto.categoria.toLowerCase().includes(queryLower))
    );
    
    filtrosActivos.busqueda = query;
    aplicarFiltrosYOrden();
}

// ===========================
// 5. FILTROS
// ===========================

/**
 * Aplicar filtros y orden a los productos
 */
function aplicarFiltrosYOrden() {
    // Validar que productosActuales sea un array
    if (!Array.isArray(productosActuales)) {
        console.warn('⚠️ productosActuales no es un array:', productosActuales);
        productosActuales = [];
    }
    
    // Empezar con todos los productos
    productosFiltrados = [...productosActuales];
    
    // Aplicar filtro de categoría
    if (filtrosActivos.categoria) {
        productosFiltrados = productosFiltrados.filter(p => {
            const catNombre = safeGetCategoriaNombre(p);
            return catNombre === filtrosActivos.categoria;
        });
    }
    
    // Aplicar filtro de precio
    productosFiltrados = productosFiltrados.filter(p => {
        const precio = parseFloat(p.precio_venta || p.precio);
        return precio >= filtrosActivos.precioMin && precio <= filtrosActivos.precioMax;
    });
    
    // Aplicar filtro de tallas
    if (filtrosActivos.tallas.length > 0) {
        productosFiltrados = productosFiltrados.filter(p => {
            const tallasProducto = obtenerTallasProducto(p);
            return filtrosActivos.tallas.some(talla => tallasProducto.includes(talla));
        });
    }
    
    // Aplicar filtro de género
    if (filtrosActivos.genero) {
        productosFiltrados = productosFiltrados.filter(p => 
            p.genero === filtrosActivos.genero || 
            p.genero === 'unisex'
        );
    }
    
    // Aplicar filtro de disponibilidad (stock)
    const checkboxDisponibilidad = document.getElementById('soloDisponibles');
    if (checkboxDisponibilidad && checkboxDisponibilidad.checked) {
        productosFiltrados = productosFiltrados.filter(p => {
            // Usar stock_total del backend si está disponible
            if (p.stock_total !== undefined) {
                return p.stock_total > 0;
            }
            // Calcular stock desde tallas como fallback
            const stock = p.tallas && Array.isArray(p.tallas)
                ? p.tallas.reduce((sum, t) => sum + (parseInt(t.stock) || parseInt(t.stock_talla) || 0), 0)
                : (parseInt(p.stock) || 0);
            return stock > 0;
        });
    }
    
    // Aplicar orden
    aplicarOrden();
    
    // Actualizar UI
    actualizarContadores();
    mostrarProductos();
    actualizarPaginacion();
}

/**
 * Aplicar orden a los productos
 */

function aplicarOrden() {
    switch (ordenActual) {
        case 'precio_asc': 
            productosFiltrados.sort((a, b) => 
                parseFloat(a.precio_venta || a.precio) - parseFloat(b.precio_venta || b.precio)
            );
            break;
        case 'precio_desc':
            productosFiltrados.sort((a, b) => 
                parseFloat(b.precio_venta || b.precio) - parseFloat(a.precio_venta || a.precio)
            );
            break;
        case 'nombre_asc':
            productosFiltrados.sort((a, b) => 
                (a.nombre_producto || a.nombre || '').localeCompare(b.nombre_producto || b.nombre || '')
            );
            break;
        case 'nombre_desc':
            productosFiltrados.sort((a, b) => 
                (b.nombre_producto || b.nombre || '').localeCompare(a.nombre_producto || a.nombre || '')
            );
            break;
        case 'nuevo': 
            productosFiltrados.sort((a, b) => 
                new Date(b.fecha_creacion || b.created_at || 0) - new Date(a.fecha_creacion || a.created_at || 0)
            );
            break;
        case 'destacados':
        default:
            productosFiltrados.sort((a, b) => 
                (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0)
            );
            break;
    }
}

/**
 * Obtener tallas disponibles de un producto
 */

function obtenerTallasProducto(producto) {
    if (producto.tallas && Array.isArray(producto.tallas)) {
        return producto.tallas;
    }
    
    // Buscar en variantes si existen
    if (producto.variantes && Array.isArray(producto.variantes)) {
        return producto.variantes
            .filter(v => v.stock > 0)
            .map(v => v.talla);
    }
    
    return [];
}

// ===========================
// 6. VISUALIZACIÓN
// ===========================

/**
 * Mostrar productos en el grid
 */

function mostrarProductos() {
    const grid = document.getElementById('gridProductos');
    if (!grid) {
        console.error('❌ Grid de productos no encontrado');
        return;
    }
    
    // Calcular productos de la página actual
    const inicio = (paginaActual - 1) * productosPorPagina;
    const fin = inicio + productosPorPagina;
    const productosPagina = productosFiltrados.slice(inicio, fin);
    
    if (productosPagina.length === 0) {
        grid.innerHTML = `
            <div class="sin-resultados">
                <i class="fas fa-search"></i>
                <h3>No se encontraron productos</h3>
                <p>Intenta ajustar los filtros o buscar con otros términos</p>
                <button class="btn-primary" onclick="limpiarFiltros()">Limpiar filtros</button>
            </div>
        `;
        return;
    }
    
    // Generar HTML de productos
    grid.innerHTML = productosPagina.map(producto => crearCardProducto(producto)).join('');
    
    // Agregar event listeners a los botones
    agregarEventListenersProductos();
}

/**
 * Crear HTML de card de producto
 */
function crearCardProducto(producto) {
    // 1. Normalizar Precios
    const precio = parseFloat(producto.precio || producto.precio_venta || 0);
    const precioOriginal = producto.precio_original ? parseFloat(producto.precio_original) : null;
    const descuento = precioOriginal ? Math.round(((precioOriginal - precio) / precioOriginal) * 100) : 0;
    
    // 2. Normalizar ID
    const idProducto = producto.id_producto || producto.producto_id || producto.id;
    
    // 3. Normalizar Nombre
    const nombreProducto = producto.nombre_producto || producto.nombre || 'Producto sin nombre';

    // 4. Normalizar Categoría
    let nombreCategoria = 'Sin categoría';
    if (producto.categoria && typeof producto.categoria === 'object') {
        nombreCategoria = producto.categoria.nombre_categoria || 'Sin categoría';
    } else if (producto.categoria_nombre) {
        nombreCategoria = producto.categoria_nombre;
    } else if (typeof producto.categoria === 'string') {
        nombreCategoria = producto.categoria;
    }

    // 5. Normalizar Imagen
    let imagen = producto.imagen_principal || producto.imagen_url || producto.imagen || '';
    if (imagen && !imagen.startsWith('http')) {
        imagen = imagen.replace('frontend/', '').replace('public/', '');
        if (imagen.startsWith('assets/')) {
            imagen = '../' + imagen;
        } else if (!imagen.startsWith('../')) {
            imagen = '../assets/images/productos/' + imagen;
        }
    }
    const imagenFallback = 'https://placehold.co/300x300?text=Sin+Imagen';
    if (!imagen) imagen = imagenFallback;
    
    // 6. Calcular stock
    let stock = 0;
    if (producto.tallas && Array.isArray(producto.tallas)) {
        stock = producto.tallas.reduce((sum, t) => sum + (parseInt(t.stock) || parseInt(t.stock_talla) || 0), 0);
    } else {
        stock = parseInt(producto.stock_total || producto.stock || 0);
    }
    const enStock = stock > 0;

    // 7. Lógica de Badges
    const esDestacado = producto.destacado == 1 || producto.destacado === true;
    const esNuevo = producto.nuevo == 1 || producto.nuevo === true;
    
    let badgeHtml = '';
    
    if (!enStock) {
        badgeHtml = '<span class="product-badge badge-agotado">Agotado</span>';
    } 
    else if (esDestacado) {
        badgeHtml = '<span class="product-badge badge-destacado">MÁS VENDIDO</span>';
    } 
    else if (esNuevo) {
        badgeHtml = '<span class="product-badge badge-nuevo">NUEVO</span>';
    } else if (descuento > 0) {
        badgeHtml = `<span class="product-badge badge-descuento">-${descuento}%</span>`;
    }
    
    // 8. Retornar HTML
    return `
        <div class="producto-card" data-producto-id="${idProducto}" onclick="window.location.href='producto.html?id=${idProducto}'" style="cursor: pointer;">
            <div class="product-image-container">
                <img src="${imagen}" 
                      alt="${nombreProducto}" 
                      loading="lazy"
                      onerror="this.onerror=null; this.src='${imagenFallback}';">
                ${badgeHtml}
            </div>
            <div class="producto-info" style="padding: 12px;">
                <div class="product-category" style="font-size: 11px; color: #666; text-transform: uppercase;">${nombreCategoria}</div>
                <h3 class="product-title" style="font-size: 14px; font-weight: 700; margin: 4px 0;">${nombreProducto}</h3>
                <div class="product-price" style="font-weight: 700; color: #000;">${formatearPrecio(precio)}</div>
            </div>
        </div>
    `;
}

/**
 * Agregar event listeners a productos
 */

function agregarEventListenersProductos() {
    const cards = document.querySelectorAll('.producto-card');
    
    cards.forEach(card => {
        const img = card.querySelector('img');
        if (img && img.loading === 'lazy') {
            observarImagen(img);
        }
    });
}

/**
 * Observer para lazy loading de imágenes
 */

function observarImagen(img) {
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const imagen = entry.target;
                imagen.src = imagen.dataset.src || imagen.src;
                observer.unobserve(imagen);
            }
        });
    });
    
    observer.observe(img);
}

// ===========================
// 7. PAGINACIÓN
// ===========================

/**
 * Actualizar paginación
 */

function actualizarPaginacion() {
    const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);
    const paginacionContainer = document.getElementById('paginacion');
    
    if (!paginacionContainer || totalPaginas <= 1) {
        if (paginacionContainer) paginacionContainer.innerHTML = '';
        return;
    }
    
    let html = '<div class="paginacion">';
    
    // Botón anterior
    html += `
        <button class="btn-paginacion ${paginaActual === 1 ? 'disabled' : ''}" 
                onclick="cambiarPagina(${paginaActual - 1})"
                ${paginaActual === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Números de página
    const maxBotones = 5;
    let inicio = Math.max(1, paginaActual - Math.floor(maxBotones / 2));
    let fin = Math.min(totalPaginas, inicio + maxBotones - 1);
    
    if (fin - inicio < maxBotones - 1) {
        inicio = Math.max(1, fin - maxBotones + 1);
    }
    
    if (inicio > 1) {
        html += `<button class="btn-paginacion" onclick="cambiarPagina(1)">1</button>`;
        if (inicio > 2) html += `<span class="paginacion-dots">...</span>`;
    }
    
    for (let i = inicio; i <= fin; i++) {
        html += `
            <button class="btn-paginacion ${i === paginaActual ? 'active' : ''}" 
                    onclick="cambiarPagina(${i})">
                ${i}
            </button>
        `;
    }
    
    if (fin < totalPaginas) {
        if (fin < totalPaginas - 1) html += `<span class="paginacion-dots">...</span>`;
        html += `<button class="btn-paginacion" onclick="cambiarPagina(${totalPaginas})">${totalPaginas}</button>`;
    }
    
    // Botón siguiente
    html += `
        <button class="btn-paginacion ${paginaActual === totalPaginas ? 'disabled' : ''}" 
                onclick="cambiarPagina(${paginaActual + 1})"
                ${paginaActual === totalPaginas ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    html += '</div>';
    paginacionContainer.innerHTML = html;
}

/**
 * Cambiar página
 */

function cambiarPagina(nuevaPagina) {
    const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);
    
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    
    paginaActual = nuevaPagina;
    mostrarProductos();
    actualizarPaginacion();
    
    // Scroll al inicio de productos
    document.getElementById('gridProductos')?.scrollIntoView({ behavior: 'smooth' });
}

// ===========================
// 8. CATEGORÍAS
// ===========================

/**
 * Cambiar categoría activa
 */
async function cambiarCategoria(categoria) {
    mostrarLoader(true);
    filtrosActivos.categoria = categoria;
    paginaActual = 1;
    
    try {
        if (typeof apiConfig !== 'undefined' && categoria) {
            // Buscar ID de categoría si es necesario
            const response = await apiConfig.apiGet(`/productos?categoria=${encodeURIComponent(categoria)}&limit=100`);
            
            if (response.success && response.data) {
                productosActuales = response.data.productos || response.data;
                
                // Asegurar que sea un array
                if (!Array.isArray(productosActuales)) {
                    console.warn('⚠️ response.data no es un array en cambiarCategoria');
                    productosActuales = Array.isArray(response.data) ? response.data : [];
                }
                
                aplicarFiltrosYOrden();
            }
        } else {
            aplicarFiltrosYOrden();
        }
    } catch (error) {
        console.error('❌ Error al filtrar por categoría:', error);
        aplicarFiltrosYOrden();
    } finally {
        mostrarLoader(false);
    }
}

// ===========================
// 9. ACCIONES DE PRODUCTO
// ===========================

/**
 * Ver detalle de producto
 */
function verDetalle(productoId) {
    window.location.href = `/producto.html?id=${productoId}`;
}

/**
 * Agregar producto al carrito rápido
 */
async function agregarAlCarritoRapido(productoId) {
    try {
        // Verificar si el usuario está autenticado
        const isAuthenticated = typeof authService !== 'undefined' && authService.isLoggedIn();
        
        if (!isAuthenticated) {
            mostrarNotificacion('Por favor inicia sesión para agregar productos', 'warning');
            setTimeout(() => {
                window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
            }, 1500);
            return;
        }
        
        // Buscar producto
        const producto = productosActuales.find(p => 
            (p.producto_id || p.id) == productoId
        );
        
        if (!producto) {
            mostrarNotificacion('Producto no encontrado', 'error');
            return;
        }
        
        // Verificar stock
        const stockDisponible = await verificarStockDisponible(productoId, 1);
        
        if (!stockDisponible) {
            mostrarNotificacion('Producto sin stock disponible', 'warning');
            return;
        }
        
        // Agregar al carrito con API
        if (typeof apiConfig !== 'undefined') {
            const response = await apiConfig.apiPost('/carrito/items', {
                producto_id: productoId,
                cantidad: 1,
                talla: 'M' // Talla por defecto
            });
            
            if (response.success) {
                mostrarNotificacion('Producto agregado al carrito', 'success');
                
                if (typeof actualizarCantidadCarrito === 'function') {
                    actualizarCantidadCarrito();
                }
            } else {
                throw new Error(response.message || 'Error al agregar al carrito');
            }
        } else {
            // Fallback: agregar al carrito local
            agregarAlCarritoLocal(producto);
        }
        
    } catch (error) {
        console.error('❌ Error al agregar al carrito:', error);
        mostrarNotificacion('Error al agregar producto al carrito', 'error');
    }
}

/**
 * Verificar stock disponible
 */

async function verificarStockDisponible(productoId, cantidad) {
    try {
        if (typeof apiConfig !== 'undefined') {
            const response = await apiConfig.apiGet(`/productos/${productoId}/stock`);
            
            if (response.success && response.data) {
                return response.data.stock_disponible >= cantidad;
            }
        }
        
        // Fallback: verificar en productos actuales
        const producto = productosActuales.find(p => 
            (p.producto_id || p.id) == productoId
        );
        
        return producto && (producto.stock_total || producto.stock || 0) >= cantidad;
        
    } catch (error) {
        console.error('❌ Error al verificar stock:', error);
        return false;
    }
}

/**
 * Agregar al carrito local (fallback)
 */

function agregarAlCarritoLocal(producto) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    const index = carrito.findIndex(item => 
        item.producto_id === (producto.producto_id || producto.id)
    );
    
    if (index > -1) {
        carrito[index].cantidad += 1;
    } else {
        carrito.push({
            producto_id: producto.producto_id || producto.id,
            nombre: producto.nombre,
            precio: parseFloat(producto.precio_venta || producto.precio),
            imagen: producto.imagen_url || producto.imagen,
            cantidad: 1,
            talla: 'M'
        });
    }
    
    localStorage.setItem('carrito', JSON.stringify(carrito));
    mostrarNotificacion('Producto agregado al carrito', 'success');
    
    if (typeof actualizarCantidadCarrito === 'function') {
        actualizarCantidadCarrito();
    }
}

// ===========================
// 10. EVENT LISTENERS
// ===========================

/**
 * Inicializar event listeners
 */
function inicializarEventListeners() {
    // Búsqueda
    // Filtro de disponibilidad (solo con stock)
    const checkboxDisponibilidad = document.getElementById('soloDisponibles');
    if (checkboxDisponibilidad) {
        checkboxDisponibilidad.addEventListener('change', function() {
            aplicarFiltrosYOrden();
        });
    }
    
    const inputBusqueda = document.getElementById('inputBusqueda');
    if (inputBusqueda) {
        let timeoutBusqueda;
        inputBusqueda.addEventListener('input', (e) => {
            clearTimeout(timeoutBusqueda);
            timeoutBusqueda = setTimeout(() => {
                buscarProductos(e.target.value);
            }, 500);
        });
    }
    
    // Ordenar
    const selectOrden = document.getElementById('ordenamiento');
    if (selectOrden) {
        selectOrden.addEventListener('change', (e) => {
            ordenActual = e.target.value;
            aplicarFiltrosYOrden();
        });
    }
    
    // Filtro de precio
    const rangoMin = document.getElementById('precioMin');
    const rangoMax = document.getElementById('precioMax');
    
    if (rangoMin && rangoMax) {
        rangoMin.addEventListener('change', (e) => {
            filtrosActivos.precioMin = parseFloat(e.target.value);
            aplicarFiltrosYOrden();
        });
        
        rangoMax.addEventListener('change', (e) => {
            filtrosActivos.precioMax = parseFloat(e.target.value);
            aplicarFiltrosYOrden();
        });
    }
    
    // Filtro de tallas
    const checkboxesTallas = document.querySelectorAll('input[name="talla"]');
    checkboxesTallas.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                filtrosActivos.tallas.push(e.target.value);
            } else {
                filtrosActivos.tallas = filtrosActivos.tallas.filter(t => t !== e.target.value);
            }
            aplicarFiltrosYOrden();
        });
    });
    
    // Filtro de género
    const radioGenero = document.querySelectorAll('input[name="genero"]');
    radioGenero.forEach(radio => {
        radio.addEventListener('change', (e) => {
            filtrosActivos.genero = e.target.value;
            aplicarFiltrosYOrden();
        });
    });
}

/**
 * Inicializar filtros con valores por defecto
 */
function inicializarFiltros() {
    // Obtener filtros de URL si existen
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('categoria')) {
        filtrosActivos.categoria = urlParams.get('categoria');
        const radioCategoria = document.querySelector(`input[value="${filtrosActivos.categoria}"]`);
        if (radioCategoria) radioCategoria.checked = true;
        
        // Aplicar el filtro
        aplicarFiltrosYOrden();
    }
    
    if (urlParams.has('busqueda')) {
        const busqueda = urlParams.get('busqueda');
        filtrosActivos.busqueda = busqueda;
        const inputBusqueda = document.getElementById('inputBusqueda');
        if (inputBusqueda) inputBusqueda.value = busqueda;
        buscarProductos(busqueda);
    }
}

// ===========================
// 11. UI HELPERS
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
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion notificacion-${tipo}`;
    notificacion.innerHTML = `
        <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'times-circle' : 'info-circle'}"></i>
        <span>${mensaje}</span>
    `;
    
    document.body.appendChild(notificacion);
    
    // Animar entrada
    setTimeout(() => notificacion.classList.add('show'), 10);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notificacion.classList.remove('show');
        setTimeout(() => notificacion.remove(), 300);
    }, 3000);
}

/**
 * Mostrar error
 */
function mostrarError(mensaje) {
    const grid = document.getElementById('gridProductos');
    if (grid) {
        grid.innerHTML = `
            <div class="error-mensaje">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error</h3>
                <p>${mensaje}</p>
                <button class="btn-primary" onclick="location.reload()">Reintentar</button>
            </div>
        `;
    }
}

/**
 * Actualizar contadores
 */
function actualizarContadores() {
    const contador = document.getElementById('resultadosFiltrados');
    if (contador) {
        contador.textContent = `Mostrando ${productosFiltrados.length} producto${productosFiltrados.length !== 1 ? 's' : ''}`;
    }
}

/**
 * Limpiar todos los filtros
 */
function limpiarFiltros() {
    filtrosActivos = {
        categoria: '',
        precioMin: 0,
        precioMax: 1000,
        tallas: [],
        genero: '',
        busqueda: '',
        solo_con_stock: false
    };
    
    ordenActual = 'destacados';
    paginaActual = 1;
    
    // Resetear inputs
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = false);
    
    // Marcar "Todas las categorías"
    const radioTodas = document.querySelector('input[name="categoria"][value=""]');
    if (radioTodas) radioTodas.checked = true;
    
    // Limpiar campos de precio
    const precioMin = document.getElementById('precioMin');
    const precioMax = document.getElementById('precioMax');
    if (precioMin) precioMin.value = '';
    if (precioMax) precioMax.value = '';
    
    const inputBusqueda = document.getElementById('inputBusqueda');
    if (inputBusqueda) inputBusqueda.value = '';
    
    const selectOrden = document.getElementById('ordenamiento');
    if (selectOrden) selectOrden.value = 'destacados';
    
    // Actualizar título del catálogo
    const titulo = document.getElementById('tituloCatalogo');
    if (titulo) titulo.textContent = 'TODOS LOS PRODUCTOS';
    
    // Recargar productos
    cargarProductos();
}

// ===========================
// 12. EXPORTAR FUNCIONES GLOBALES
// ===========================

window.verDetalle = verDetalle;
window.agregarAlCarritoRapido = agregarAlCarritoRapido;
window.cambiarPagina = cambiarPagina;
window.cambiarCategoria = cambiarCategoria;
window.limpiarFiltros = limpiarFiltros;
window.buscarProductos = buscarProductos;
window.aplicarFiltros = aplicarFiltrosYOrden; // Alias para compatibilidad con HTML
window.aplicarOrdenamiento = aplicarFiltrosYOrden; // Alias para ordenamiento

console.log('✅ catalogo.js cargado correctamente');
