// ============================================
// SPORTIVA - FUNCIONES GLOBALES
// Sistema de E-commerce con integración API
// ============================================

// ============================================
// CONFIGURACIÓN GLOBAL
// ============================================

const CONFIG = {
    IGV: 0.18,
    COSTO_ENVIO_LIMA: 15.00,
    COSTO_ENVIO_PROVINCIAS: 25.00,
    MONEDA: 'S/',
    CUPONES_ACTIVOS: {
        'BIENVENIDA10': { descuento: 10, tipo: 'porcentaje' },
        'PRIMERACOMPRA': { descuento: 15, tipo: 'monto_fijo' }
    },
    TIEMPO_TOAST: 3000,
    PRODUCTOS_JSON: '../assets/data/productos.json',
    USE_API: true
};

// ============================================
// GESTIÓN DE PRODUCTOS CON API
// ============================================

let productosCache = null;

async function cargarProductos() {
    if (productosCache) {
        return productosCache;
    }
    
    if (CONFIG.USE_API) {
        try {
            console.log('🔄 Cargando productos desde API...');
            const response = await apiGet(ENDPOINTS.PRODUCTOS.LISTAR);
            
            if (response && response.data && response.data.productos) {
                productosCache = response.data.productos;
                console.log(`✅ ${productosCache.length} productos cargados desde API`);
                return productosCache;
            }
        } catch (error) {
            console.warn('⚠️ API no disponible, usando JSON local...', error);
        }
    }
    
    return await cargarProductosLocal();
}

async function cargarProductosLocal() {
    try {
        const response = await fetch(CONFIG.PRODUCTOS_JSON);
        if (!response.ok) throw new Error('Error al cargar productos');
        const data = await response.json();
        productosCache = data.productos;
        console.log(`✅ ${productosCache.length} productos desde JSON local`);
        return productosCache;
    } catch (error) {
        console.error('Error cargando productos:', error);
        mostrarToast('Error al cargar productos', 'error');
        return [];
    }
}

async function obtenerProductoPorId(id) {
    if (productosCache) {
        const producto = productosCache.find(p => p.id_producto === parseInt(id));
        if (producto) return producto;
    }
    
    if (CONFIG.USE_API) {
        try {
            const response = await apiGet(ENDPOINTS.PRODUCTOS.DETALLE(id));
            if (response && response.data && response.data.producto) {
                return response.data.producto;
            }
        } catch (error) {
            console.warn('Error obteniendo producto desde API:', error);
        }
    }
    
    await cargarProductos();
    
    if (productosCache) {
        return productosCache.find(p => p.id_producto === parseInt(id));
    }
    
    return null;
}

function obtenerProductosPorCategoria(categoria) {
    if (!productosCache) return [];
    if (!categoria || categoria === 'todos') return productosCache;
    return productosCache.filter(p => p.categoria_nombre === categoria);
}

async function verificarStockDisponible(idProducto, idTalla, cantidadSolicitada) {
    if (CONFIG.USE_API) {
        try {
            const response = await apiGet(ENDPOINTS.PRODUCTOS.STOCK(idProducto));
            if (response && response.tallas) {
                const talla = response.tallas.find(t => t.id_talla === parseInt(idTalla));
                if (talla) {
                    return talla.stock_talla >= cantidadSolicitada;
                }
            }
        } catch (error) {
            console.warn('Error verificando stock desde API:', error.message || error);
            return true;
        }
    }
    
    const producto = await obtenerProductoPorId(idProducto);
    if (!producto) return false;
    
    const talla = producto.tallas.find(t => t.id_talla === parseInt(idTalla));
    if (!talla) return false;
    
    return talla.stock_talla >= cantidadSolicitada;
}

// ============================================
// GESTIÓN DE CARRITO (localStorage)
// ============================================

function obtenerCarrito() {
    const carrito = localStorage.getItem('sportiva_carrito');
    return carrito ? JSON.parse(carrito) : [];
}

function guardarCarrito(carrito) {
    localStorage.setItem('sportiva_carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
}

async function agregarAlCarrito(producto, idTalla, tallaNombre, cantidad = 1) {
    const stockDisponible = await verificarStockDisponible(producto.id_producto, idTalla, cantidad);
    
    if (!stockDisponible) {
        mostrarToast('Stock insuficiente', 'error');
        return false;
    }
    
    const carrito = obtenerCarrito();
    
    const itemExistente = carrito.find(item => 
        item.id_producto === producto.id_producto && 
        item.id_talla === parseInt(idTalla)
    );
    
    if (itemExistente) {
        const nuevaCantidad = itemExistente.cantidad + cantidad;
        
        const stockDisponibleNuevo = await verificarStockDisponible(producto.id_producto, idTalla, nuevaCantidad);
        
        if (!stockDisponibleNuevo) {
            mostrarToast(`Solo hay ${itemExistente.talla_stock} unidades disponibles`, 'warning');
            return false;
        }
        
        itemExistente.cantidad = nuevaCantidad;
    } else {
        const tallaInfo = producto.tallas.find(t => t.id_talla === parseInt(idTalla));
        
        const imagenProducto = producto.imagen_principal || producto.imagen || '';
        
        carrito.push({
            id_producto: producto.id_producto,
            id_talla: parseInt(idTalla),
            nombre_producto: producto.nombre_producto,
            talla_nombre: tallaNombre,
            talla_stock: tallaInfo.stock_talla,
            precio: producto.precio,
            cantidad: cantidad,
            imagen: imagenProducto
        });
    }
    
    guardarCarrito(carrito);
    mostrarToast('Producto agregado al carrito', 'success');
    return true;
}

function eliminarDelCarrito(idProducto, idTalla) {
    let carrito = obtenerCarrito();
    carrito = carrito.filter(item => 
        !(item.id_producto === parseInt(idProducto) && item.id_talla === parseInt(idTalla))
    );
    guardarCarrito(carrito);
    mostrarToast('Producto eliminado', 'success');
}

async function actualizarCantidadCarrito(idProducto, idTalla, nuevaCantidad) {
    if (nuevaCantidad <= 0) {
        eliminarDelCarrito(idProducto, idTalla);
        return true;
    }
    
    const stockDisponible = await verificarStockDisponible(idProducto, idTalla, nuevaCantidad);
    
    if (!stockDisponible) {
        mostrarToast('Stock insuficiente', 'error');
        return false;
    }
    
    const carrito = obtenerCarrito();
    const item = carrito.find(i => 
        i.id_producto === parseInt(idProducto) && 
        i.id_talla === parseInt(idTalla)
    );
    
    if (item) {
        item.cantidad = nuevaCantidad;
        guardarCarrito(carrito);
        return true;
    }
    
    return false;
}

function vaciarCarrito() {
    localStorage.removeItem('sportiva_carrito');
    actualizarContadorCarrito();
}

function obtenerCantidadTotalCarrito() {
    const carrito = obtenerCarrito();
    return carrito.reduce((total, item) => total + item.cantidad, 0);
}

// ============================================
// ACTUALIZAR CONTADOR DEL CARRITO
// ============================================

async function actualizarContadorCarrito() {
    const contadores = document.querySelectorAll('.cart-count');
    let cantidad = 0;
    
    // Si el usuario está logueado Y hay API disponible, obtener del servidor
    if (typeof authService !== 'undefined' && typeof apiConfig !== 'undefined') {
        const usuario = obtenerUsuarioActual();
        
        if (usuario) {
            try {
                // Intentar obtener del servidor
                const response = await apiConfig.apiGet('/carrito/resumen');
                if (response.success && response.data) {
                    cantidad = response.data.total_items || 0;
                }
            } catch (error) {
                // Si falla, usar localStorage como fallback
                console.warn('Error obteniendo carrito del servidor, usando local:', error);
                cantidad = obtenerCantidadTotalCarrito();
            }
        } else {
            // Usuario no logueado, usar localStorage
            cantidad = obtenerCantidadTotalCarrito();
        }
    } else {
        // Sin API, usar localStorage
        cantidad = obtenerCantidadTotalCarrito();
    }
    
    // Actualizar todos los contadores en la página
    contadores.forEach(contador => {
        contador.textContent = cantidad;
        
        if (cantidad > 0) {
            contador.style.display = 'flex';
        } else {
            contador.style.display = 'none';
        }
    });
    
    return cantidad;
}

// ============================================
// CÁLCULOS FINANCIEROS
// ============================================

function calcularSubtotalCarrito() {
    const carrito = obtenerCarrito();
    return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
}

function calcularIGV(subtotal) {
    return subtotal * CONFIG.IGV;
}

function calcularCostoEnvio(provincia) {
    return provincia.toLowerCase() === 'lima' 
        ? CONFIG.COSTO_ENVIO_LIMA 
        : CONFIG.COSTO_ENVIO_PROVINCIAS;
}

function aplicarCupon(codigo, subtotal) {
    const cupon = CONFIG.CUPONES_ACTIVOS[codigo.toUpperCase()];
    
    if (!cupon) {
        return {
            valido: false,
            mensaje: 'Cupón no válido',
            descuento: 0
        };
    }
    
    let descuento = 0;
    
    if (cupon.tipo === 'porcentaje') {
        descuento = subtotal * (cupon.descuento / 100);
    } else if (cupon.tipo === 'monto_fijo') {
        descuento = cupon.descuento;
    }
    
    return {
        valido: true,
        mensaje: `Cupón aplicado: -${formatearPrecio(descuento)}`,
        descuento: descuento
    };
}

function calcularTotalPedido(subtotal, costoEnvio, descuento = 0) {
    const igv = calcularIGV(subtotal);
    const total = subtotal + igv + costoEnvio - descuento;
    
    return {
        subtotal: subtotal,
        igv: igv,
        costoEnvio: costoEnvio,
        descuento: descuento,
        total: Math.max(0, total)
    };
}

// ============================================
// FORMATEO Y UTILIDADES
// ============================================

function formatearPrecio(precio) {
    const precioNum = typeof precio === 'string' ? parseFloat(precio) : precio;
    return `${CONFIG.MONEDA} ${precioNum.toFixed(2)}`;
}

function formatearFecha(fecha) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return new Date(fecha).toLocaleDateString('es-PE', options);
}

function formatearFechaCorta(fecha) {
    const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit'
    };
    
    return new Date(fecha).toLocaleDateString('es-PE', options);
}

function truncarTexto(texto, longitudMaxima) {
    if (texto.length <= longitudMaxima) return texto;
    return texto.substring(0, longitudMaxima) + '...';
}

function generarID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ============================================
// COMPONENTES DE UI
// ============================================

function mostrarToast(mensaje, tipo = 'success') {
    const existente = document.querySelector('.toast');
    if (existente) {
        existente.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.textContent = mensaje;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 300ms ease-out';
        setTimeout(() => toast.remove(), 300);
    }, CONFIG.TIEMPO_TOAST);
}

function crearCardProducto(producto) {
    const tieneTallas = producto.tiene_tallas;
    const stockTotal = producto.tallas ? producto.tallas.reduce((sum, t) => sum + t.stock_talla, 0) : 0;
    const agotado = stockTotal === 0;
    
    let imagenUrl = producto.imagen_principal || producto.imagen || '';
    
    // Agregar prefijo ../ si la ruta no lo tiene (para funcionar desde /public/)
    if (imagenUrl && !imagenUrl.startsWith('../') && !imagenUrl.startsWith('http')) {
        imagenUrl = '../' + imagenUrl;
    }
    
    return `
        <div class="product-card" onclick="irAProducto(${producto.id_producto})">
            <div class="product-image-container">
                <img src="${imagenUrl}" 
                      alt="${producto.nombre_producto}"
                      onerror="this.onerror=null; this.style.display='none'; this.parentElement.style.display='flex'; this.parentElement.style.alignItems='center'; this.parentElement.style.justifyContent='center'; this.parentElement.innerHTML='<span style=color:#CCC;font-size:14px;>Sin imagen</span>';">
                ${producto.nuevo ? '<span class="product-badge">Nuevo</span>' : ''}
                ${agotado ? '<span class="product-badge" style="background-color: var(--color-error)">Agotado</span>' : ''}
            </div>
            <h3 class="product-title">${producto.nombre_producto}</h3>
            <p class="product-category">${producto.categoria_nombre}</p>
            <p class="product-price">${formatearPrecio(producto.precio)}</p>
        </div>
    `;
}

function irAProducto(idProducto) {
    // Detectar la ubicación actual para construir la ruta correcta
    const currentPath = window.location.pathname;
    
    // Si ya estamos en /frontend/public/, usar ruta relativa
    if (currentPath.includes('/frontend/public/')) {
        window.location.href = `producto.html?id=${idProducto}`;
    } else {
        // Si estamos en otra ubicación, usar ruta absoluta
        window.location.href = `/frontend/public/producto.html?id=${idProducto}`;
    }
}

function irACatalogo(categoria = '') {
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('/frontend/public/')) {
        // Ya estamos en la carpeta correcta
        if (categoria) {
            window.location.href = `catalogo.html?categoria=${encodeURIComponent(categoria)}`;
        } else {
            window.location.href = 'catalogo.html';
        }
    } else {
        // Estamos en otra ubicación
        if (categoria) {
            window.location.href = `/frontend/public/catalogo.html?categoria=${encodeURIComponent(categoria)}`;
        } else {
            window.location.href = '/frontend/public/catalogo.html';
        }
    }
}

// ============================================
// FILTROS Y ORDENAMIENTO
// ============================================

function filtrarProductos(productos, filtros) {
    let resultado = [...productos];
    
    if (filtros.categoria && filtros.categoria !== 'todos') {
        resultado = resultado.filter(p => p.categoria_nombre === filtros.categoria);
    }
    
    if (filtros.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase();
        resultado = resultado.filter(p => 
            p.nombre_producto.toLowerCase().includes(busqueda) ||
            p.descripcion.toLowerCase().includes(busqueda) ||
            p.marca?.toLowerCase().includes(busqueda)
        );
    }
    
    if (filtros.precioMin) {
        resultado = resultado.filter(p => p.precio >= parseFloat(filtros.precioMin));
    }
    
    if (filtros.precioMax) {
        resultado = resultado.filter(p => p.precio <= parseFloat(filtros.precioMax));
    }
    
    if (filtros.soloDisponibles) {
        resultado = resultado.filter(p => {
            const stockTotal = p.tallas.reduce((sum, t) => sum + t.stock_talla, 0);
            return stockTotal > 0;
        });
    }
    
    return resultado;
}

function ordenarProductos(productos, criterio) {
    const copia = [...productos];
    
    switch(criterio) {
        case 'precio_asc':
            return copia.sort((a, b) => a.precio - b.precio);
        case 'precio_desc':
            return copia.sort((a, b) => b.precio - a.precio);
        case 'nombre_asc':
            return copia.sort((a, b) => a.nombre_producto.localeCompare(b.nombre_producto));
        case 'nombre_desc':
            return copia.sort((a, b) => b.nombre_producto.localeCompare(a.nombre_producto));
        case 'nuevo':
            return copia.sort((a, b) => (b.nuevo ? 1 : 0) - (a.nuevo ? 1 : 0));
        default:
            return copia;
    }
}

// ============================================
// VALIDACIONES
// ============================================

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validarTelefono(telefono) {
    const regex = /^9\d{8}$/;
    return regex.test(telefono);
}

function validarDNI(dni) {
    const regex = /^\d{8}$/;
    return regex.test(dni);
}

function validarFormulario(formulario) {
    const errores = [];
    const datos = new FormData(formulario);
    
    for (let [campo, valor] of datos.entries()) {
        const input = formulario.querySelector(`[name="${campo}"]`);
        
        if (input.hasAttribute('required') && !valor.trim()) {
            errores.push(`El campo ${campo} es obligatorio`);
        }
        
        if (input.type === 'email' && valor && !validarEmail(valor)) {
            errores.push('Email inválido');
        }
        
        if (input.name === 'telefono' && valor && !validarTelefono(valor)) {
            errores.push('Teléfono inválido (debe ser 9 dígitos)');
        }
        
        if (input.name === 'dni' && valor && !validarDNI(valor)) {
            errores.push('DNI inválido (debe ser 8 dígitos)');
        }
    }
    
    return {
        valido: errores.length === 0,
        errores: errores
    };
}

// ============================================
// GESTIÓN DE SESIÓN (Compatible con authService)
// ============================================

function obtenerUsuarioActual() {
    if (typeof authService !== 'undefined' && authService.getCurrentUser) {
        return authService.getCurrentUser();
    }
    
    const usuario = localStorage.getItem('sportiva_usuario');
    return usuario ? JSON.parse(usuario) : null;
}

function iniciarSesion(email, password) {
    console.warn('⚠️ iniciarSesion() deprecado. Usar authService.login()');
    const usuario = {
        id_cliente: 1,
        nombre: 'Usuario',
        apellido: 'Demo',
        email: email,
        fecha_login: new Date().toISOString()
    };
    
    localStorage.setItem('sportiva_usuario', JSON.stringify(usuario));
    mostrarToast('Sesión iniciada correctamente', 'success');
    return usuario;
}

function cerrarSesion() {
    if (typeof authService !== 'undefined' && authService.logout) {
        authService.logout();
    } else {
        localStorage.removeItem('sportiva_usuario');
        localStorage.removeItem('sportiva_token');
        mostrarToast('Sesión cerrada', 'success');
        
        // Actualizar navbar para remover usuario
        actualizarNavbarUsuario();
        
        setTimeout(() => window.location.href = 'index.html', 1000);
    }
}

function verificarSesion() {
    if (typeof authService !== 'undefined' && authService.requireAuthentication) {
        return authService.requireAuthentication();
    }
    
    const usuario = obtenerUsuarioActual();
    if (!usuario) {
        mostrarToast('Debes iniciar sesión', 'warning');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return false;
    }
    return true;
}

// ============================================
// NAVBAR - USUARIO AUTENTICADO
// ============================================

function actualizarNavbarUsuario() {
    const usuario = obtenerUsuarioActual();
    const navbarActions = document.querySelector('.navbar-actions');
    
    if (!navbarActions) return;
    
    // Buscar si ya existe el dropdown de usuario
    let userDropdown = document.querySelector('.user-dropdown');
    
    if (usuario) {
        // Usuario logueado - Mostrar dropdown
        if (!userDropdown) {
            // Crear dropdown por primera vez
            const searchButton = navbarActions.querySelector('button[onclick*="catalogo"]');
            
            userDropdown = document.createElement('div');
            userDropdown.className = 'user-dropdown';
            userDropdown.style.cssText = 'position: relative; display: inline-block;';
            
            userDropdown.innerHTML = `
                <button class="user-button navbar-link" onclick="toggleUserMenu()" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span class="user-name">${usuario.nombre}</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 4.5L6 7.5L9 4.5"></path>
                    </svg>
                </button>
                <div class="user-menu" style="display: none; position: absolute; right: 0; top: 100%; margin-top: 8px; background: white; border: 1px solid var(--color-gray-border); border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); min-width: 180px; z-index: 1000;">
                    <div style="padding: 12px 16px; border-bottom: 1px solid var(--color-gray-border);">
                        <div style="font-weight: 600; font-size: 14px;">${usuario.nombre} ${usuario.apellido || ''}</div>
                        <div style="font-size: 12px; color: var(--color-gray-medium); margin-top: 4px;">${usuario.email}</div>
                    </div>
                    <a href="perfil.html" class="user-menu-item" style="display: block; padding: 12px 16px; text-decoration: none; color: var(--color-black); font-size: 14px; transition: background 150ms;" onmouseover="this.style.backgroundColor='var(--color-gray-light)'" onmouseout="this.style.backgroundColor='transparent'">
                        Mi Cuenta
                    </a>
                    <a href="pedidos.html" class="user-menu-item" style="display: block; padding: 12px 16px; text-decoration: none; color: var(--color-black); font-size: 14px; transition: background 150ms;" onmouseover="this.style.backgroundColor='var(--color-gray-light)'" onmouseout="this.style.backgroundColor='transparent'">
                        Mis Pedidos
                    </a>
                    <button onclick="cerrarSesion()" class="user-menu-item" style="width: 100%; text-align: left; padding: 12px 16px; background: none; border: none; border-top: 1px solid var(--color-gray-border); color: var(--color-error); font-size: 14px; cursor: pointer; transition: background 150ms;" onmouseover="this.style.backgroundColor='var(--color-gray-light)'" onmouseout="this.style.backgroundColor='transparent'">
                        Cerrar Sesión
                    </button>
                </div>
            `;
            
            // Insertar antes del botón de búsqueda
            if (searchButton) {
                navbarActions.insertBefore(userDropdown, searchButton);
            } else {
                navbarActions.insertBefore(userDropdown, navbarActions.firstChild);
            }
        } else {
            // Actualizar nombre si ya existe
            const userName = userDropdown.querySelector('.user-name');
            if (userName) {
                userName.textContent = usuario.nombre; // Solo nombre
            }
            // Actualizar info completa en el menú desplegable
            const userInfo = userDropdown.querySelector('.user-menu > div:first-child');
            if (userInfo) {
                userInfo.innerHTML = `
                    <div style="font-weight: 600; font-size: 14px;">${usuario.nombre} ${usuario.apellido || ''}</div>
                    <div style="font-size: 12px; color: var(--color-gray-medium); margin-top: 4px;">${usuario.email}</div>
                `;
            }
        }
    } else {
        // Usuario NO logueado - Remover dropdown si existe
        if (userDropdown) {
            userDropdown.remove();
        }
    }
}

function toggleUserMenu() {
    const menu = document.querySelector('.user-menu');
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

// Cerrar menú al hacer clic fuera
document.addEventListener('click', (e) => {
    const userDropdown = document.querySelector('.user-dropdown');
    if (userDropdown && !userDropdown.contains(e.target)) {
        const menu = document.querySelector('.user-menu');
        if (menu) {
            menu.style.display = 'none';
        }
    }
});

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Actualizar contador del carrito
    actualizarContadorCarrito();
    
    // Actualizar navbar con usuario
    actualizarNavbarUsuario();
    
    // Si venimos de un registro/login, forzar actualización después de un momento
    setTimeout(() => {
        actualizarContadorCarrito();
        actualizarNavbarUsuario();
    }, 500);
});

// ============================================
// ANIMACIÓN DE SLIDE OUT PARA TOAST
// ============================================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============================================
// LOGS DE DESARROLLO
// ============================================

console.log('%c🏃 Sportiva Sistema Iniciado', 'color: #FF6B35; font-size: 16px; font-weight: bold;');
console.log('Modo API:', CONFIG.USE_API ? 'Activado ✅' : 'Desactivado ❌');
console.log('Carrito actual:', obtenerCarrito());
console.log('Cantidad items:', obtenerCantidadTotalCarrito());
