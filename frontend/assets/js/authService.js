// ============================================
// SPORTIVA - AUTHENTICATION SERVICE
// Servicio de autenticación con JWT
// ============================================

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

/**
 * Iniciar sesión con email y contraseña
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

            console.log('✅ Login exitoso:', response.usuario.email);
            return response.usuario;
        }

        throw new Error('Respuesta de login inválida');

    } catch (error) {
        console.error('Error en login:', error);
        throw error;
    }
}

/**
 * Registrar nuevo usuario
 * @param {Object} userData - Datos del usuario (nombre, apellido, email, password, etc.)
 * @returns {Promise<Object>} Usuario registrado
 */
async function register(userData) {
    try {
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
 * Cerrar sesión del usuario
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

        // Redirigir a home (ruta absoluta)
        setTimeout(() => {
            window.location.href = '/frontend/public/index.html'; // CORREGIDO
        }, 1000);

    } catch (error) {
        console.error('Error en logout:', error);
        // Limpiar de todos modos
        removeToken();
        localStorage.removeItem(API_CONFIG.USER_KEY);
        // Redirigir a home (ruta absoluta)
        window.location.href = '/frontend/public/index.html'; // CORREGIDO
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
    // Verifica si hay token y usuario, Y si el token no ha expirado (usando la función de apiConfig.js)
    return token !== null && user !== null && typeof isTokenValid === 'function' && isTokenValid();
}


/**
 * Obtener ID del cliente actual
 * @returns {number|null} ID del cliente o null
 */
function getCurrentClientId() {
    const user = getCurrentUser();
    return user ? user.id_cliente : null;
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
    return user ? user.rol === 'admin' || user.is_admin === true : false;
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
        localStorage.setItem('sportiva_redirect_after_login', window.location.pathname + window.location.search); // Guardar query params también

        setTimeout(() => {
            // CORREGIDO: Usar ruta absoluta desde la raíz del servidor
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
            // CORREGIDO: Usar ruta absoluta desde la raíz del servidor
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
            // Nota: redirectUrl ya debería ser relativo o absoluto correcto
            window.location.href = redirectUrl;
        } else {
            // CORREGIDO: Usar ruta absoluta desde la raíz del servidor
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
    login,
    register,
    logout,
    verifyToken,
    refreshToken,
    getProfile,
    updateProfile,
    changePassword,
    getCurrentUser,
    isLoggedIn,
    getCurrentClientId,
    getCurrentUserName,
    getCurrentUserEmail,
    isAdmin,
    requireAuthentication,
    requireAdmin,
    redirectIfAuthenticated,
    initAuthState
};

// Inicializar estado de autenticación al cargar
document.addEventListener('DOMContentLoaded', () => {
    initAuthState();
});

console.log('%c✅ Auth Service cargado correctamente', 'color: #2196F3; font-weight: bold;');
