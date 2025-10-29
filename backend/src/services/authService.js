// ============================================
// AUTH SERVICE - SOLID Principles
// ============================================
const jwt = require('jsonwebtoken');
const Cliente = require('../models/Cliente');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/constants');

/**
 * AuthService - Responsabilidad única: Autenticación y autorización
 * Aplica Single Responsibility Principle (SRP)
 */
class AuthService {
    constructor() {
        // Crear instancia del modelo Cliente
        this.clienteModel = new Cliente();
    }

    // ============================================
    // REGISTRO DE USUARIO
    // ============================================

    /**
     * Registrar nuevo cliente
     */
    async register(userData) {
        try {
            // Validar que el email no exista
            const emailExists = await this.clienteModel.emailExists(userData.email);
            if (emailExists) {
                return {
                    success: false,
                    message: 'El email ya está registrado'
                };
            }

            // Validar datos requeridos
            const validation = this.validateRegistrationData(userData);
            if (!validation.valid) {
                return {
                    success: false,
                    message: validation.message
                };
            }

            // Crear cliente con password hasheado
            const result = await this.clienteModel.createWithHashedPassword({
                nombre: userData.nombre,
                apellido: userData.apellido,
                email: userData.email.toLowerCase(),
                password_hash: userData.password,
                telefono: userData.telefono || null
            });

            if (!result.success) {
                return {
                    success: false,
                    message: 'Error al crear el usuario'
                };
            }

            // Obtener datos del cliente recién creado
            const cliente = await this.clienteModel.findById(result.id);

            // Generar token JWT
            const token = this.generateToken({
                id_cliente: cliente.id_cliente,
                email: cliente.email,
                nombre: cliente.nombre
            });

            return {
                success: true,
                message: 'Usuario registrado exitosamente',
                data: {
                    token,
                    cliente: this.sanitizeClienteData(cliente)
                }
            };
        } catch (error) {
            throw new Error(`Error en registro: ${error.message}`);
        }
    }

    // ============================================
    // LOGIN
    // ============================================

    /**
     * Iniciar sesión
     */
    async login(email, password) {
        try {
            // Buscar cliente por email
            const cliente = await this.clienteModel.findByEmail(email.toLowerCase());

            if (!cliente) {
                return {
                    success: false,
                    message: 'Credenciales inválidas'
                };
            }

            // Verificar password
            const isPasswordValid = await this.clienteModel.verifyPassword(
                password,
                cliente.password_hash
            );

            if (!isPasswordValid) {
                return {
                    success: false,
                    message: 'Credenciales inválidas'
                };
            }

            // Actualizar último acceso
            await this.clienteModel.updateLastAccess(cliente.id_cliente);

            // Generar token JWT
            const token = this.generateToken({
                id_cliente: cliente.id_cliente,
                email: cliente.email,
                nombre: cliente.nombre
            });

            return {
                success: true,
                message: 'Login exitoso',
                data: {
                    token,
                    cliente: this.sanitizeClienteData(cliente)
                }
            };
        } catch (error) {
            throw new Error(`Error en login: ${error.message}`);
        }
    }

    // ============================================
    // JWT - TOKEN MANAGEMENT
    // ============================================

    /**
     * Generar token JWT
     */
    generateToken(payload) {
        try {
            return jwt.sign(payload, JWT_SECRET, {
                expiresIn: JWT_EXPIRES_IN
            });
        } catch (error) {
            throw new Error(`Error generando token: ${error.message}`);
        }
    }

    /**
     * Verificar token JWT
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Token expirado');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new Error('Token inválido');
            }
            throw new Error(`Error verificando token: ${error.message}`);
        }
    }

    /**
     * Decodificar token sin verificar (para debugging)
     */
    decodeToken(token) {
        try {
            return jwt.decode(token);
        } catch (error) {
            throw new Error(`Error decodificando token: ${error.message}`);
        }
    }

    /**
     * Refrescar token
     */
    async refreshToken(oldToken) {
        try {
            const decoded = this.verifyToken(oldToken);
            
            // Verificar que el cliente siga existiendo y activo
            const cliente = await this.clienteModel.findById(decoded.id_cliente);
            
            if (!cliente || !cliente.activo) {
                return {
                    success: false,
                    message: 'Usuario no encontrado o inactivo'
                };
            }

            // Generar nuevo token
            const newToken = this.generateToken({
                id_cliente: cliente.id_cliente,
                email: cliente.email,
                nombre: cliente.nombre
            });

            return {
                success: true,
                data: {
                    token: newToken
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // ============================================
    // CAMBIO DE PASSWORD
    // ============================================

    /**
     * Cambiar password del usuario
     */
    async changePassword(id_cliente, currentPassword, newPassword) {
        try {
            // Obtener cliente
            const cliente = await this.clienteModel.findById(id_cliente);

            if (!cliente) {
                return {
                    success: false,
                    message: 'Usuario no encontrado'
                };
            }

            // Verificar password actual
            const isPasswordValid = await this.clienteModel.verifyPassword(
                currentPassword,
                cliente.password_hash
            );

            if (!isPasswordValid) {
                return {
                    success: false,
                    message: 'Password actual incorrecto'
                };
            }

            // Validar nuevo password
            const validation = this.validatePassword(newPassword);
            if (!validation.valid) {
                return {
                    success: false,
                    message: validation.message
                };
            }

            // Actualizar password
            await this.clienteModel.changePassword(id_cliente, newPassword);

            return {
                success: true,
                message: 'Password actualizado exitosamente'
            };
        } catch (error) {
            throw new Error(`Error cambiando password: ${error.message}`);
        }
    }

    /**
     * Solicitar reseteo de password (simulado)
     */
    async requestPasswordReset(email) {
        try {
            const cliente = await this.clienteModel.findByEmail(email.toLowerCase());

            if (!cliente) {
                // Por seguridad, siempre retornamos éxito
                return {
                    success: true,
                    message: 'Si el email existe, recibirás instrucciones para resetear tu password'
                };
            }

            // Aquí iría la lógica para enviar email con token de reseteo
            // Por ahora solo retornamos éxito

            return {
                success: true,
                message: 'Si el email existe, recibirás instrucciones para resetear tu password'
            };
        } catch (error) {
            throw new Error(`Error solicitando reseteo: ${error.message}`);
        }
    }

    // ============================================
    // PERFIL DE USUARIO
    // ============================================

    /**
     * Obtener perfil del usuario
     */
    async getProfile(id_cliente) {
        try {
            const profile = await this.clienteModel.getProfile(id_cliente);

            if (!profile) {
                return {
                    success: false,
                    message: 'Usuario no encontrado'
                };
            }

            return {
                success: true,
                data: this.sanitizeClienteData(profile)
            };
        } catch (error) {
            throw new Error(`Error obteniendo perfil: ${error.message}`);
        }
    }

    /**
     * Actualizar perfil del usuario
     */
    async updateProfile(id_cliente, updateData) {
        try {
            const result = await this.clienteModel.updateProfile(id_cliente, updateData);

            if (!result.success) {
                return {
                    success: false,
                    message: result.message || 'Error actualizando perfil'
                };
            }

            // Obtener perfil actualizado
            const profile = await this.clienteModel.getProfile(id_cliente);

            return {
                success: true,
                message: 'Perfil actualizado exitosamente',
                data: this.sanitizeClienteData(profile)
            };
        } catch (error) {
            throw new Error(`Error actualizando perfil: ${error.message}`);
        }
    }

    // ============================================
    // VALIDACIONES
    // ============================================

    /**
     * Validar datos de registro
     */
    validateRegistrationData(data) {
        if (!data.nombre || data.nombre.trim().length < 2) {
            return { valid: false, message: 'Nombre debe tener al menos 2 caracteres' };
        }

        if (!data.apellido || data.apellido.trim().length < 2) {
            return { valid: false, message: 'Apellido debe tener al menos 2 caracteres' };
        }

        if (!data.email || !this.isValidEmail(data.email)) {
            return { valid: false, message: 'Email inválido' };
        }

        const passwordValidation = this.validatePassword(data.password);
        if (!passwordValidation.valid) {
            return passwordValidation;
        }

        return { valid: true };
    }

    /**
     * Validar formato de email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validar password
     */
    validatePassword(password) {
        if (!password || password.length < 6) {
            return { 
                valid: false, 
                message: 'Password debe tener al menos 6 caracteres' 
            };
        }

        if (password.length > 50) {
            return { 
                valid: false, 
                message: 'Password no puede exceder 50 caracteres' 
            };
        }

        return { valid: true };
    }

    // ============================================
    // UTILIDADES
    // ============================================

    /**
     * Remover información del Cliente
     */
    sanitizeClienteData(cliente) {
        const { password_hash, ...safeData } = cliente;
        return safeData;
    }

    /**
     * Verificar si el usuario está autenticado y activo
     */
    async verifyAuthentication(id_cliente) {
        try {
            const cliente = await this.clienteModel.findById(id_cliente);

            if (!cliente) {
                return {
                    authenticated: false,
                    message: 'Usuario no encontrado'
                };
            }

            if (!cliente.activo) {
                return {
                    authenticated: false,
                    message: 'Usuario inactivo'
                };
            }

            return {
                authenticated: true,
                cliente: this.sanitizeClienteData(cliente)
            };
        } catch (error) {
            throw new Error(`Error verificando autenticación: ${error.message}`);
        }
    }

    /**
     * Logout (invalidar sesión - en este caso solo retornamos éxito)
     */
    async logout(id_cliente) {
        try {
            // Aquí podrías agregar lógica para invalidar tokens en una blacklist
            // Por ahora solo retornamos éxito

            return {
                success: true,
                message: 'Logout exitoso'
            };
        } catch (error) {
            throw new Error(`Error en logout: ${error.message}`);
        }
    }
}

// Exportar instancia única (Singleton pattern)
module.exports = new AuthService();
