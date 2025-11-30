// ============================================
// SPORTIVA - API CONFIGURATION & JWT MANAGER
// Sistema de integración Frontend-Backend
// ============================================

// ============================================
// CONFIGURACIÓN GLOBAL API
// ============================================

const API_CONFIG = {
    BASE_URL: window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
        ? 'http://127.0.0.1:3000/api'
        : 'https://sportiva-ecommerce-production.up.railway.app',
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 1,
    TOKEN_KEY: 'sportiva_token',
    USER_KEY: 'sportiva_usuario',
    REFRESH_TOKEN_KEY: 'sportiva_refresh_token'
};

// ============================================
// ENDPOINTS ORGANIZADOS POR MÓDULO
// ============================================

const ENDPOINTS = {
    AUTH: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        VERIFY: '/auth/verify',
        REFRESH: '/auth/refresh',
        PROFILE: '/auth/profile',
        UPDATE_PROFILE: '/auth/profile',
        CHANGE_PASSWORD: '/auth/change-password',
        STATS_ADMIN: '/auth/stats/admin'
    },
    
    PRODUCTOS: {
        LISTAR: '/productos',
        BUSCAR: '/productos/buscar',
        DESTACADOS: '/productos/destacados',
        OFERTAS: '/productos/ofertas',
        NUEVOS: '/productos/nuevos',
        CREAR: '/productos',
        CATEGORIA: (id) => `/productos/categoria/${id}`,
        DETALLE: (id) => `/productos/${id}`,
        STOCK: (id) => `/productos/${id}/stock`,
        RELACIONADOS: (id) => `/productos/${id}/relacionados`,
        RESENAS: (id) => `/productos/${id}/resenas`,

        ACTUALIZAR: (id) => `/productos/${id}`,
        CAMBIAR_ESTADO: (id) => `/productos/${id}/estado`,
        STATS_CATEGORIAS: '/productos/stats/categorias',
        STATS_PRECIOS: '/productos/stats/precios',
        STATS_GENERAL: '/productos/stats/general'
    },
    CARRITO: {
        OBTENER: '/carrito',
        AGREGAR_ITEM: '/carrito/items',
        ACTUALIZAR_ITEM: (id) => `/carrito/items/${id}`,
        ELIMINAR_ITEM: (id) => `/carrito/items/${id}`,
        VACIAR: '/carrito',
        RESUMEN: '/carrito/resumen',
        VALIDAR: '/carrito/validar',
        APLICAR_CUPON: '/carrito/aplicar-cupon',
        REMOVER_CUPON: '/carrito/cupon',
        COUNT: '/carrito/count'
    },
    
    PEDIDOS: {
        LISTAR: '/pedidos',
        CREAR: '/pedidos',
        DETALLE: (id) => `/pedidos/${id}`,
        CANCELAR: (id) => `/pedidos/${id}/cancelar`,
        PROCESAR_PAGO: (id) => `/pedidos/${id}/pago`,
        ESTADO: (id) => `/pedidos/${id}/estado`,
        CREAR_RESENA: (id) => `/pedidos/${id}/resena`,
        FACTURA: (id) => `/pedidos/${id}/factura`,
        ESTADISTICAS: '/pedidos/resumen/estadisticas',
        STATS_ADMIN: '/pedidos/stats/admin',
        // Endpoints Admin
        LISTAR_ADMIN: '/pedidos/admin/list',
        DETALLE_ADMIN: (id) => `/pedidos/admin/${id}`,
        CAMBIAR_ESTADO_ADMIN: (id) => `/pedidos/admin/${id}/estado`,
        ANULAR_ADMIN: (id) => `/pedidos/admin/${id}/anular`,
        ACTUALIZAR_DIRECCION_ADMIN: (id) => `/pedidos/admin/${id}/direccion`,
        EXPORTAR_CSV: '/pedidos/admin/export/csv'
    },
    
    CLIENTES: {
        LISTAR: '/clientes',
        DETALLE: (id) => `/clientes/${id}`,
        ACTUALIZAR: (id) => `/clientes/${id}`,
        CAMBIAR_ESTADO: (id) => `/clientes/${id}/estado`
    },

    TRABAJADORES: {
        LOGIN: '/trabajadores/login',
        REGISTER: '/trabajadores/register',
        LISTAR: '/trabajadores',
        DETALLE: (id) => `/trabajadores/${id}`,
        ACTUALIZAR: (id) => `/trabajadores/${id}`,
        CAMBIAR_ESTADO: (id) => `/trabajadores/${id}/estado`,
        CAMBIAR_ROL: (id) => `/trabajadores/${id}/rol`,
        PROFILE: '/trabajadores/profile',
        CHANGE_PASSWORD: '/trabajadores/change-password'
    }
};

// ============================================
// GESTIÓN DE JWT TOKENS
// ============================================

function getToken() {
    return localStorage.getItem(API_CONFIG.TOKEN_KEY);
}

function setToken(token) {
    if (token) {
        localStorage.setItem(API_CONFIG.TOKEN_KEY, token);
    }
}

function removeToken() {
    localStorage.removeItem(API_CONFIG.TOKEN_KEY);
    localStorage.removeItem(API_CONFIG.REFRESH_TOKEN_KEY);
}

function getRefreshToken() {
    return localStorage.getItem(API_CONFIG.REFRESH_TOKEN_KEY);
}

function setRefreshToken(refreshToken) {
    if (refreshToken) {
        localStorage.setItem(API_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
    }
}

function isTokenValid() {
    const token = getToken();
    if (!token) return false;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiration = payload.exp * 1000;
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        return (expiration - now) > fiveMinutes;
    } catch (error) {
        console.error('Error validando token:', error);
        return false;
    }
}

// ============================================
// INTERCEPTOR HTTP - FUNCIÓN PRINCIPAL
// ============================================

let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(newToken) {
    refreshSubscribers.forEach(callback => callback(newToken));
    refreshSubscribers = [];
}

function addRefreshSubscriber(callback) {
    refreshSubscribers.push(callback);
}

async function apiRequest(endpoint, options = {}) {
    const url = API_CONFIG.BASE_URL + endpoint;
    
    const defaultHeaders = {
        'Content-Type': 'application/json'
    };
    
    const token = getToken();
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    const headers = {
        ...defaultHeaders,
        ...options.headers
    };
    
    const config = {
        ...options,
        headers,
        timeout: API_CONFIG.TIMEOUT
    };
    
    try {
        const response = await fetch(url, config);
        
        if (response.status === 401) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    addRefreshSubscriber((newToken) => {
                        config.headers['Authorization'] = `Bearer ${newToken}`;
                        fetch(url, config)
                            .then(res => res.json())
                            .then(resolve)
                            .catch(reject);
                    });
                });
            }
            
            isRefreshing = true;
            
            try {
                const refreshToken = getRefreshToken();
                if (refreshToken) {
                    const refreshResponse = await fetch(API_CONFIG.BASE_URL + ENDPOINTS.AUTH.REFRESH, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refreshToken })
                    });
                    
                    if (refreshResponse.ok) {
                        const { token: newToken } = await refreshResponse.json();
                        setToken(newToken);
                        isRefreshing = false;
                        onRefreshed(newToken);
                        
                        config.headers['Authorization'] = `Bearer ${newToken}`;
                        const retryResponse = await fetch(url, config);
                        return handleResponse(retryResponse);
                    }
                }
                
                isRefreshing = false;
                removeToken();
                
                if (!window.location.pathname.includes('login.html')) {
                    if (typeof mostrarToast === 'function') {
                        mostrarToast('Sesión expirada. Por favor inicia sesión nuevamente.', 'warning');
                    }
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1500);
                }
                
                throw new Error('Sesión expirada');
                
            } catch (refreshError) {
                isRefreshing = false;
                throw refreshError;
            }
        }
        
        return await handleResponse(response);
        
    } catch (error) {
        console.error('API Request Error:', error);
        
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            if (typeof mostrarToast === 'function') {
                mostrarToast('Error de conexión. Verifica tu internet.', 'error');
            }
        }
        
        throw error;
    }
}

// ============================================
// MANEJO DE RESPUESTAS
// ============================================

async function handleResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        if (!response.ok) {
            const errorMessage = data.message || data.error || 'Error en la petición';
            
            if (response.status === 400) {
                if (data.errors && Array.isArray(data.errors)) {
                    const errorsText = data.errors.map(e => e.message || e.msg).join(', ');
                    throw new Error(errorsText);
                }
                throw new Error(errorMessage);
            }
            
            if (response.status === 403) {
                throw new Error('No tienes permisos para realizar esta acción');
            }
            
            if (response.status === 404) {
                throw new Error('Recurso no encontrado');
            }
            
            if (response.status === 422) {
                throw new Error(errorMessage);
            }
            
            if (response.status >= 500) {
                throw new Error('Error del Servidor. Intenta más tarde.');
            }
            
            throw new Error(errorMessage);
        }
        
        return data;
    }
    
    if (contentType && (contentType.includes('text/plain') || contentType.includes('text/html'))) {
        const text = await response.text();
        if (!response.ok) {
            throw new Error(text || 'Error en la petición');
        }
        return text;
    }
    
    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return response.blob();
}

// ============================================
// FUNCIONES HELPER PARA MÉTODOS HTTP
// ============================================

async function apiGet(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return await apiRequest(fullEndpoint, {
        method: 'GET'
    });
}

async function apiPost(endpoint, data = {}) {
    return await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

async function apiPut(endpoint, data = {}) {
    return await apiRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

async function apiPatch(endpoint, data = {}) {
    return await apiRequest(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function apiDelete(endpoint) {
    return await apiRequest(endpoint, {
        method: 'DELETE'
    });
}

// ============================================
// UTILIDADES
// ============================================

function isAuthenticated() {
    const token = getToken();
    return token !== null && isTokenValid();
}

function requireAuth() {
    if (!isAuthenticated()) {
        if (typeof mostrarToast === 'function') {
            mostrarToast('Debes iniciar sesión para continuar', 'warning');
        }
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return false;
    }
    return true;
}

// ============================================
// EXPORTAR OBJETO APICONFIG COMPLETO
// ============================================

window.apiConfig = {
    API_CONFIG,
    ENDPOINTS,
    getToken,
    setToken,
    removeToken,
    getRefreshToken,
    setRefreshToken,
    isTokenValid,
    apiRequest,
    apiGet,
    apiPost,
    apiPut,
    apiPatch,
    apiDelete,
    isAuthenticated,
    requireAuth
};

// Exportaciones individuales adicionales para compatibilidad
window.API_CONFIG = API_CONFIG;
window.ENDPOINTS = ENDPOINTS;
window.apiRequest = apiRequest;
window.apiGet = apiGet;
window.apiPost = apiPost;
window.apiPut = apiPut;
window.apiDelete = apiDelete;
window.apiPatch = apiPatch;
window.getToken = getToken;
window.setToken = setToken;
window.removeToken = removeToken;
window.isAuthenticated = isAuthenticated;
window.requireAuth = requireAuth;
window.isTokenValid = isTokenValid;

console.log('API Config cargado correctamente', 'color: #4CAF50; font-weight: bold;');
console.log('Base URL:', API_CONFIG.BASE_URL);
console.log('Endpoints disponibles:', Object.keys(ENDPOINTS).length * 10, 'aprox.');
