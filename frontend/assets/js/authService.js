// ============================================
// SPORTIVA - AUTHENTICATION SERVICE
// Servicio de autenticación con JWT
// ============================================

// ============================================
// FUNCIONES DE AUTENTICACIÓN - CLIENTES
// ============================================

/**
 * Iniciar sesión con email y contraseña (CLIENTES)
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<Object>} Usuario autenticado
 */
async function login(email, password) {
    try {
        const response = await apiPost(ENDPOINTS.AUTH.LOGIN, {
            email,
            password
        });

        // 🔍 DEBUG: Ver respuesta completa del backend
        console.log('📦 Respuesta del backend en login:', response);
        console.log('   - ¿Tiene token?', !!response.token);
        console.log('   - ¿Tiene usuario?', !!response.usuario);
        console.log('   - Usuario completo:', response.usuario);

        // Guardar token y usuario en localStorage
        if (response.token) {
            setToken(response.token);

            // Guardar refresh token si existe
            if (response.refreshToken) {
                localStorage.setItem(API_CONFIG.REFRESH_TOKEN_KEY, response.refreshToken);
            }

            // Guardar datos del usuario
            if (response.usuario) {
                localStorage.setItem(API_CONFIG.USER_KEY, JSON.stringify(response.usuario));
            }

            // Actualizar contador del carrito
            if (typeof actualizarContadorCarrito === 'function') {
                await actualizarContadorCarrito();
            }

            console.log('✅ Login cliente exitoso:', response.usuario.email);
            return response.usuario;
        }

        throw new Error('Respuesta de login inválida');

    } catch (error) {
        console.error('Error en login:', error);
        throw error;
    }
}

/**
 * Iniciar sesión de TRABAJADOR con email @sportiva.com
 * @param {string} email - Email del trabajador (@sportiva.com)
 * @param {string} password - Contraseña del trabajador
 * @returns {Promise<Object>} Trabajador autenticado
 */
async function loginTrabajador(email, password) {
    try {
        // Validar que el email sea @sportiva.com
        if (!email.toLowerCase().endsWith('@sportiva.com')) {
            throw new Error('Email de trabajador debe ser @sportiva.com');
        }

        console.log('🔐 Intentando login de trabajador:', email);

        const response = await apiPost(ENDPOINTS.TRABAJADORES.LOGIN, {
            email,
            password
        });

        console.log('📦 Respuesta recibida del backend:', response);

        // Guardar token si existe
        if (response.token) {
            setToken(response.token);

            if (response.refreshToken) {
                localStorage.setItem(API_CONFIG.REFRESH_TOKEN_KEY, response.refreshToken);
            }

            // Buscar datos del trabajador en diferentes posibles estructuras
            let trabajadorData = null;
            
            if (response.trabajador) {
                trabajadorData = response.trabajador;
            } else if (response.data && response.data.trabajador) {
                trabajadorData = response.data.trabajador;
            } else if (response.usuario) {
                // El backend devuelve "usuario" en lugar de "trabajador"
                trabajadorData = response.usuario;
            } else if (response.data && response.data.usuario) {
                trabajadorData = response.data.usuario;
            }

            if (trabajadorData) {
                // Marcar que es trabajador
                trabajadorData.esTrabajador = true;
                
                // Asegurar que tiene el campo rol
                if (!trabajadorData.rol && trabajadorData.role) {
                    trabajadorData.rol = trabajadorData.role;
                }
                
                localStorage.setItem(API_CONFIG.USER_KEY, JSON.stringify(trabajadorData));
                
                console.log('✅ Login trabajador exitoso:', trabajadorData.email, '- Rol:', trabajadorData.rol);
                return trabajadorData;
            }

            throw new Error('No se encontraron datos del trabajador en la respuesta');
        }

        throw new Error('Token no encontrado en la respuesta');

    } catch (error) {
        console.error('❌ Error en login trabajador:', error);
        console.error('📋 Detalles del error:', error.message);
        throw error;
    }
}

/**
 * Login inteligente - determina automáticamente si es cliente o trabajador
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<Object>}
 */
async function loginAuto(email, password) {
    // Verificar si es email de trabajador (@sportiva.com)
    if (email.toLowerCase().endsWith('@sportiva.com')) {
        console.log('🔧 Detectado email de trabajador, usando loginTrabajador()');
        return await loginTrabajador(email, password);
    } else {
        console.log('👤 Detectado email de cliente, usando login()');
        return await login(email, password);
    }
}

/**
 * Registrar nuevo usuario (SOLO CLIENTES - bloquea @sportiva.com)
 * @param {Object} userData - Datos del usuario (nombre, apellido, email, password, etc.)
 * @returns {Promise<Object>} Usuario registrado
 */
async function register(userData) {
    try {
        // BLOQUEAR registro con email @sportiva.com
        if (userData.email && userData.email.toLowerCase().endsWith('@sportiva.com')) {
            throw new Error('No puedes registrarte como cliente con un email @sportiva.com');
        }

        const response = await apiPost(ENDPOINTS.AUTH.REGISTER, userData);

        // Guardar token y usuario automáticamente tras registro
        if (response.token) {
            setToken(response.token);

            if (response.refreshToken) {
                localStorage.setItem(API_CONFIG.REFRESH_TOKEN_KEY, response.refreshToken);
            }

            if (response.usuario) {
                localStorage.setItem(API_CONFIG.USER_KEY, JSON.stringify(response.usuario));
            }

            console.log('✅ Registro exitoso:', response.usuario.email);
            return response.usuario;
        }

        throw new Error('Respuesta de registro inválida');

    } catch (error) {
        console.error('Error en registro:', error);
        throw error;
    }
}

/**
 * Cerrar sesión del usuario (cliente o trabajador)
 * @returns {Promise<void>}
 */
async function logout() {
    try {
        // Intentar hacer logout en el backend
        const token = getToken();
        if (token) {
            try {
                await apiPost(ENDPOINTS.AUTH.LOGOUT);
            } catch (error) {
                // Si falla el logout en backend, igual limpiamos local
                console.warn('Error en logout backend:', error);
            }
        }

        // Limpiar localStorage
        removeToken();
        localStorage.removeItem(API_CONFIG.USER_KEY);
        localStorage.removeItem(API_CONFIG.REFRESH_TOKEN_KEY);

        console.log('✅ Logout exitoso');

        if (typeof mostrarToast === 'function') mostrarToast('Sesión cerrada correctamente', 'success');

        // Redirigir a Home
        setTimeout(() => {
            window.location.href = '/frontend/public/index.html';
        }, 1000);

    } catch (error) {
        console.error('Error en logout:', error);
        // Limpiar de todos modos
        removeToken();
        localStorage.removeItem(API_CONFIG.USER_KEY);
        // Redirigir a home
        window.location.href = '/frontend/public/index.html';
    }
}

/**
 * Verificar si el token actual es válido
 * @returns {Promise<boolean>} True si el token es válido
 */
async function verifyToken() {
    try {
        const token = getToken();
        if (!token) return false;

        const response = await apiGet(ENDPOINTS.AUTH.VERIFY);

        // Si la verificación es exitosa, el token es válido
        return response.valido === true || response.valid === true;

    } catch (error) {
        console.error('Error verificando token:', error);
        return false;
    }
}

/**
 * Refrescar el token de acceso
 * @returns {Promise<string|null>} Nuevo token o null si falla
 */
async function refreshToken() {
    try {
        const refreshToken = localStorage.getItem(API_CONFIG.REFRESH_TOKEN_KEY);

        if (!refreshToken) {
            throw new Error('No hay refresh token disponible');
        }

        const response = await apiPost(ENDPOINTS.AUTH.REFRESH, {
            refreshToken
        });

        if (response.token) {
            setToken(response.token);
            console.log('✅ Token refrescado exitosamente');
            return response.token;
        }

        return null;

    } catch (error) {
        console.error('Error refrescando token:', error);
        // Si falla el refresh, cerrar sesión
        await logout();
        return null;
    }
}

/**
 * Obtener perfil del usuario actual
 * @returns {Promise<Object>} Datos del perfil
 */
async function getProfile() {
    try {
        const response = await apiGet(ENDPOINTS.AUTH.PROFILE);

        // Actualizar usuario en localStorage
        if (response.usuario) {
            localStorage.setItem(API_CONFIG.USER_KEY, JSON.stringify(response.usuario));
        }

        return response.usuario || response;

    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        throw error;
    }
}

/**
 * Actualizar perfil del usuario
 * @param {Object} userData - Datos a actualizar
 * @returns {Promise<Object>} Usuario actualizado
 */
async function updateProfile(userData) {
    try {
        const response = await apiPut(ENDPOINTS.AUTH.UPDATE_PROFILE, userData);

        // Actualizar usuario en localStorage
        if (response.usuario) {
            localStorage.setItem(API_CONFIG.USER_KEY, JSON.stringify(response.usuario));
        }

        if (typeof mostrarToast === 'function') mostrarToast('Perfil actualizado correctamente', 'success');

        return response.usuario || response;

    } catch (error) {
        console.error('Error actualizando perfil:', error);
        throw error;
    }
}

/**
 * Cambiar contraseña del usuario
 * @param {string} oldPassword - Contraseña actual
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<Object>} Respuesta del servidor
 */
async function changePassword(oldPassword, newPassword) {
    try {
        const response = await apiPut(ENDPOINTS.AUTH.CHANGE_PASSWORD, {
            oldPassword,
            newPassword
        });

        if (typeof mostrarToast === 'function') mostrarToast('Contraseña actualizada correctamente', 'success');

        return response;

    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        throw error;
    }
}

// ============================================
// HELPERS - GESTIÓN DE USUARIO
// ============================================

/**
 * Obtener usuario actual desde localStorage
 * @returns {Object|null} Usuario actual o null
 */
function getCurrentUser() {
    try {
        const userJson = localStorage.getItem(API_CONFIG.USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        return null;
    }
}

/**
 * Verificar si hay un usuario autenticado
 * @returns {boolean} True si hay sesión activa
 */
function isLoggedIn() {
    const token = getToken();
    const user = getCurrentUser();
    return token !== null && user !== null && typeof isTokenValid === 'function' && isTokenValid();
}

/**
 * Verificar si el usuario actual es un trabajador
 * @returns {boolean} True si es trabajador
 */
function isTrabajador() {
    const user = getCurrentUser();
    if (!user) return false;
    
    // Método 1: Verificar por email
    if (user.email && user.email.toLowerCase().endsWith('@sportiva.com')) {
        return true;
    }
    
    // Método 2: Verificar por flag o rol (fallback)
    return user.esTrabajador === true || user.rol === 'Administrador' || user.rol === 'Vendedor';
}

/**
 * Verificar si el usuario actual es un cliente
 * @returns {boolean} True si es cliente
 */
function isCliente() {
    return isLoggedIn() && !isTrabajador();
}

/**
 * Obtener rol del trabajador (si es trabajador)
 * @returns {string|null} 'Administrador', 'Vendedor' o null
 */
function getTrabajadorRol() {
    if (!isTrabajador()) return null;
    const user = getCurrentUser();
    return user ? user.rol : null;
}

/**
 * Obtener ID del cliente actual
 * @returns {number|null} ID del cliente o null
 */
function getCurrentClientId() {
    const user = getCurrentUser();
    return user ? (user.id_cliente || user.id_trabajador) : null;
}

/**
 * Obtener nombre completo del usuario actual
 * @returns {string} Nombre completo o 'Usuario'
 */
function getCurrentUserName() {
    const user = getCurrentUser();
    if (!user) return 'Usuario';
    return `${user.nombre || ''} ${user.apellido || ''}`.trim() || 'Usuario';
}

/**
 * Obtener email del usuario actual
 * @returns {string|null} Email o null
 */
function getCurrentUserEmail() {
    const user = getCurrentUser();
    return user ? user.email : null;
}

/**
 * Verificar si el usuario es administrador
 * @returns {boolean} True si es admin
 */
function isAdmin() {
    const user = getCurrentUser();
    return user ? user.rol === 'Administrador' || user.is_admin === true : false;
}

/**
 * Verificar si el usuario es vendedor
 * @returns {boolean} True si es vendedor
 */
function isVendedor() {
    const user = getCurrentUser();
    return user ? user.rol === 'Vendedor' : false;
}

// ============================================
// GUARDS - PROTECCIÓN DE RUTAS
// ============================================

/**
 * Requiere autenticación para acceder a una página
 * Redirige a login si no está autenticado
 * @returns {boolean} True si está autenticado
 */
function requireAuthentication() {
    if (!isLoggedIn()) {
        if (typeof mostrarToast === 'function') mostrarToast('Debes iniciar sesión para continuar', 'warning');
        // Guardar URL actual para redirigir después del login
        localStorage.setItem('sportiva_redirect_after_login', window.location.pathname + window.location.search);

        setTimeout(() => {
            window.location.href = '/frontend/public/login.html';
        }, 1500);
        return false;
    }
    return true;
}

/**
 * Requiere rol de administrador
 * Redirige si no es admin
 * @returns {boolean} True si es admin
 */
function requireAdmin() {
    if (!requireAuthentication()) return false;

    if (!isAdmin()) {
        if (typeof mostrarToast === 'function') mostrarToast('No tienes permisos de administrador', 'error');
        setTimeout(() => {
            window.location.href = '/frontend/public/index.html';
        }, 1500);
        return false;
    }

    return true;
}

/**
 * Requiere rol de trabajador (Administrador o Vendedor)
 * @returns {boolean} True si es trabajador
 */
function requireTrabajador() {
    if (!requireAuthentication()) return false;

    if (!isTrabajador()) {
        if (typeof mostrarToast === 'function') mostrarToast('Acceso solo para personal de Sportiva', 'error');
        setTimeout(() => {
            window.location.href = '/frontend/public/index.html';
        }, 1500);
        return false;
    }

    return true;
}

/**
 * Redirigir a home si ya está autenticado
 * Útil para páginas de login/registro
 */
function redirectIfAuthenticated() {
    if (isLoggedIn()) {
        // Verificar si hay URL de redirección guardada
        const redirectUrl = localStorage.getItem('sportiva_redirect_after_login');
        if (redirectUrl) {
            localStorage.removeItem('sportiva_redirect_after_login');
            window.location.href = redirectUrl;
        } else {
            window.location.href = '/frontend/public/index.html';
        }
        return true;
    }
    return false;
}

// ============================================
// INICIALIZACIÓN
// ============================================

/**
 * Verificar sesión al cargar la página
 * Actualiza el navbar con info del usuario
 */
function initAuthState() {
    const user = getCurrentUser();

    if (user && isLoggedIn()) {
        // Actualizar UI con datos del usuario
        updateNavbarUserInfo(user);

        console.log('👤 Usuario autenticado:', user.email);
        
        // Mostrar información adicional si es trabajador
        if (isTrabajador()) {
            console.log('👔 Trabajador - Rol:', getTrabajadorRol());
        }
    } else {
        // Limpiar cualquier dato de sesión inválida
        if (user || getToken()) {
            console.warn('⚠️ Sesión inválida detectada, limpiando...');
            removeToken();
            localStorage.removeItem(API_CONFIG.USER_KEY);
        }
    }
}

/**
 * Actualizar navbar con información del usuario
 * @param {Object} user - Datos del usuario
 */
function updateNavbarUserInfo(user) {
    // Buscar elementos del navbar
    const userNameElements = document.querySelectorAll('.user-name');
    const loginButtons = document.querySelectorAll('.login-button');
    const logoutButtons = document.querySelectorAll('.logout-button');
    const userMenus = document.querySelectorAll('.user-menu');

    if (userNameElements.length > 0) {
        const userName = `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.email;
        userNameElements.forEach(el => {
            el.textContent = userName;
        });
    }

    // Mostrar/ocultar botones según estado
    loginButtons.forEach(btn => btn.style.display = 'none');
    logoutButtons.forEach(btn => btn.style.display = 'inline-block');
    userMenus.forEach(menu => menu.style.display = 'block');
}

// ============================================
// EXPORTAR PARA USO GLOBAL
// ============================================

window.authService = {
    // Autenticación
    login,
    loginTrabajador,
    loginAuto,
    register,
    logout,
    verifyToken,
    refreshToken,
    getProfile,
    updateProfile,
    changePassword,
    
    // Helpers
    getCurrentUser,
    isLoggedIn,
    isCliente,
    isTrabajador,
    getTrabajadorRol,
    getCurrentClientId,
    getCurrentUserName,
    getCurrentUserEmail,
    isAdmin,
    isVendedor,
    
    // Guards
    requireAuthentication,
    requireAdmin,
    requireTrabajador,
    redirectIfAuthenticated,
    
    // Inicialización
    initAuthState
};

// Inicializar estado de autenticación al cargar
document.addEventListener('DOMContentLoaded', () => {
    initAuthState();
});

console.log('%c✅ Auth Service cargado correctamente', 'color: #2196F3; font-weight: bold;');
