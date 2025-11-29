// ============================================
// SPORTIVA - INDEX
// Lógica de página principal
// ============================================

// Variables para el control del slider
let sliderInterval;
let currentSlide = 0;

const cardWidthWithGap = 280; 
const autoPlayDelay = 3000; // 3 segundos

async function inicializarHome() {
    try {
        console.log('🚀 Inicializando Home con endpoint de Destacados...');
        
        // Llamada al endpoint específico
        const response = await apiGet(ENDPOINTS.PRODUCTOS.DESTACADOS);
        let productos = [];
        
        if (response && response.success) {
            productos = response.data.productos || response.data || [];
        }
        
        if (!productos || productos.length === 0) {
            console.warn('⚠️ No llegaron destacados, intentando carga general...');
            // Solo si falla, usamos carga general
            const todos = await cargarProductos();
            productos = todos.filter(p => p.destacado == 1).slice(0, 8);
        }

        console.log(`🏆 Productos para mostrar: ${productos.length}`);
        
        if (productos.length > 0) {
            renderizarSliderDestacados(productos);
        } else {
            throw new Error('No se encontraron productos para mostrar');
        }
        
    } catch (error) {
        console.error('❌ Error inicializando home:', error);
        const contenedor = document.getElementById('productosDestacados');
        if (contenedor) {
            contenedor.innerHTML = '<p class="text-center text-secondary">No hay productos destacados disponibles.</p>';
        }
    }
}

/**
 * Renderiza la estructura del slider con los productos
 */
function renderizarSliderDestacados(productos) {
    const contenedor = document.getElementById('productosDestacados');
    
    if (!contenedor) {
        console.error('❌ No se encontró el contenedor #productosDestacados');
        return;
    }
    
    if (productos.length === 0) {
        contenedor.innerHTML = '<p class="text-center text-secondary">No hay productos destacados disponibles.</p>';
        return;
    }
    contenedor.className = ''; 

    // Generamos las tarjetas usando la función global
    const tarjetasHtml = productos.map(producto => {
        if (typeof crearCardProducto === 'function') {
            return crearCardProducto(producto);
        }
        return '';
    }).join('');

    // Insertamos la estructura del Slider
    contenedor.innerHTML = `
        <div class="slider-container" id="destacadosSlider">
            <button class="slider-btn prev" onclick="moverSlider(-1)">&#10094;</button>
            
            <div class="slider-track-container">
                <div class="slider-track" id="sliderTrack">
                    ${tarjetasHtml}
                </div>
            </div>
            
            <button class="slider-btn next" onclick="moverSlider(1)">&#10095;</button>
        </div>
    `;

    // Iniciamos el movimiento automático
    iniciarLogicaSlider();
}

// ============================================
// LÓGICA DEL SLIDER
// ============================================

function iniciarLogicaSlider() {
    startAutoPlay();

    // Pausar si el mouse está encima
    const container = document.getElementById('destacadosSlider');
    if (container) {
        container.addEventListener('mouseenter', stopAutoPlay);
        container.addEventListener('mouseleave', startAutoPlay);
    }
}

function moverSlider(direction) {
    const track = document.getElementById('sliderTrack');
    const container = document.querySelector('.slider-track-container');
    if (!track || !container || track.children.length === 0) return;

    const totalCards = track.children.length;
    const containerWidth = container.offsetWidth;
    const visibleCards = Math.floor(containerWidth / cardWidthWithGap);
    const maxSlide = Math.max(0, totalCards - visibleCards);

    if (totalCards <= visibleCards) {
        currentSlide = 0;
        track.style.transform = `translateX(0px)`;
        return;
    }

    // Actualizar índice
    currentSlide += direction;

    // Lógica de Loop
    if (currentSlide > maxSlide) {
        currentSlide = 0; // Volver al inicio
    } else if (currentSlide < 0) {
        currentSlide = maxSlide; // Ir al final
    }

    // Mover el track
    const translateX = -(currentSlide * cardWidthWithGap);
    track.style.transform = `translateX(${translateX}px)`;
}

function startAutoPlay() {
    stopAutoPlay();
    sliderInterval = setInterval(() => {
        moverSlider(1);
    }, autoPlayDelay);
}

function stopAutoPlay() {
    if (sliderInterval) {
        clearInterval(sliderInterval);
    }
}

// Exportar función para que el HTML la vea (onclick)
window.moverSlider = moverSlider;

document.addEventListener('DOMContentLoaded', inicializarHome);
