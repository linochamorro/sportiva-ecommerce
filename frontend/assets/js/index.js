// ============================================
// SPORTIVA - INDEX
// Lógica de página principal
// ============================================

async function inicializarHome() {
    try {
        const productos = await cargarProductos();
        
        const destacados = productos
            .filter(p => p.destacado === 1 || p.destacado === true)
            .slice(0, 8);
        
        renderizarProductosDestacados(destacados);
        
    } catch (error) {
        console.error('Error inicializando home:', error);
        mostrarToast('Error al cargar productos destacados', 'error');
    }
}

function renderizarProductosDestacados(productos) {
    const contenedor = document.getElementById('productosDestacados');
    
    if (!contenedor) return;
    
    if (productos.length === 0) {
        contenedor.innerHTML = '<p class="text-center text-secondary">No hay productos destacados disponibles</p>';
        return;
    }
    
    contenedor.innerHTML = productos.map(producto => crearCardProducto(producto)).join('');
}

document.addEventListener('DOMContentLoaded', inicializarHome);
