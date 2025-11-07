const jwt = require('jsonwebtoken');
const Trabajador = require('../models/Trabajador');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/constants');

class TrabajadorAuthService {
    constructor() {
        this.trabajadorModel = new Trabajador();
    }

    async login(email, password) {
        try {
            console.log('🔍 LOGIN - Email recibido:', email);
            const trabajador = await this.trabajadorModel.findByEmail(email.toLowerCase());

            console.log('🔍 LOGIN - Trabajador encontrado:', trabajador ? 'SÍ' : 'NO');
            if (trabajador) {
                console.log('🔍 LOGIN - Email DB:', trabajador.email);
                console.log('🔍 LOGIN - Hash en DB:', trabajador.password.substring(0, 20) + '...');
            }

            if (!trabajador) {
                console.log('❌ LOGIN - Trabajador no encontrado');
                return {
                    success: false,
                    message: 'Credenciales inválidas'
                };
            }

            console.log('🔍 LOGIN - Verificando password...');
            console.log('🔍 LOGIN - Password ingresado:', password);
            
            const isPasswordValid = await this.trabajadorModel.verifyPassword(
                password,
                trabajador.password
            );

            console.log('🔍 LOGIN - Password válido:', isPasswordValid);

            if (!isPasswordValid) {
                console.log('❌ LOGIN - Password incorrecto');
                return {
                    success: false,
                    message: 'Credenciales inválidas'
                };
            }

            await this.trabajadorModel.updateLastAccess(trabajador.id_trabajador);

            const token = this.generateToken({
                id_trabajador: trabajador.id_trabajador,
                email: trabajador.email,
                nombre: trabajador.nombre,
                rol: trabajador.rol,
                tipo_usuario: 'trabajador'
            });

            return {
                success: true,
                message: 'Login exitoso',
                data: {
                    token,
                    trabajador: this.sanitizeTrabajadorData(trabajador)
                }
            };
        } catch (error) {
            throw new Error(`Error en login: ${error.message}`);
        }
    }

    async register(userData, adminId) {
        try {
            const emailExists = await this.trabajadorModel.emailExists(userData.email);
            if (emailExists) {
                return {
                    success: false,
                    message: 'El email ya está registrado'
                };
            }

            const validation = this.validateRegistrationData(userData);
            if (!validation.valid) {
                return {
                    success: false,
                    message: validation.message
                };
            }

            const result = await this.trabajadorModel.createWithHashedPassword({
                nombre: userData.nombre,
                apellido: userData.apellido,
                email: userData.email.toLowerCase(),
                password: userData.password,
                telefono: userData.telefono || null,
                rol: userData.rol,
                creado_por: adminId
            });

            if (!result.success) {
                return {
                    success: false,
                    message: 'Error al crear el trabajador'
                };
            }

            const trabajador = await this.trabajadorModel.findById(result.id);

            return {
                success: true,
                message: 'Trabajador registrado exitosamente',
                data: {
                    trabajador: this.sanitizeTrabajadorData(trabajador)
                }
            };
        } catch (error) {
            throw new Error(`Error en registro: ${error.message}`);
        }
    }

    async changePassword(id_trabajador, currentPassword, newPassword) {
        try {
            const trabajador = await this.trabajadorModel.findById(id_trabajador);

            if (!trabajador) {
                return {
                    success: false,
                    message: 'Trabajador no encontrado'
                };
            }

            const isPasswordValid = await this.trabajadorModel.verifyPassword(
                currentPassword,
                trabajador.password
            );

            if (!isPasswordValid) {
                return {
                    success: false,
                    message: 'Password actual incorrecto'
                };
            }

            const validation = this.validatePassword(newPassword);
            if (!validation.valid) {
                return {
                    success: false,
                    message: validation.message
                };
            }

            await this.trabajadorModel.changePassword(id_trabajador, newPassword);

            return {
                success: true,
                message: 'Password actualizado exitosamente'
            };
        } catch (error) {
            throw new Error(`Error cambiando password: ${error.message}`);
        }
    }

    generateToken(payload) {
        try {
            return jwt.sign(payload, JWT_SECRET, {
                expiresIn: JWT_EXPIRES_IN
            });
        } catch (error) {
            throw new Error(`Error generando token: ${error.message}`);
        }
    }

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

        if (!data.rol || !['Administrador', 'Vendedor'].includes(data.rol)) {
            return { valid: false, message: 'Rol inválido' };
        }

        const passwordValidation = this.validatePassword(data.password);
        if (!passwordValidation.valid) {
            return passwordValidation;
        }

        return { valid: true };
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

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

    sanitizeTrabajadorData(trabajador) {
        const { password, ...safeData } = trabajador;
        return safeData;
    }
}

module.exports = new TrabajadorAuthService();
