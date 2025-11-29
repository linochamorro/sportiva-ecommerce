const trabajadorAuthService = require('../services/trabajadorAuthService');
const Trabajador = require('../models/Trabajador');
const trabajadorModel = new Trabajador();

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y password son requeridos'
            });
        }

        const result = await trabajadorAuthService.login(email, password);

        if (!result.success) {
            return res.status(401).json(result);
        }
        const response = {
            success: true,
            message: result.message || 'Login exitoso',
            token: result.token || result.data?.token,
            trabajador: result.trabajador || result.data?.trabajador
        };

        console.log('✅ Respuesta de login enviada al frontend:', {
            success: response.success,
            hasToken: !!response.token,
            hasTrabajador: !!response.trabajador,
            trabajadorEmail: response.trabajador?.email,
            trabajadorRol: response.trabajador?.rol
        });

        res.json(response);
    } catch (error) {
        console.error('❌ Error en login de trabajador:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

exports.register = async (req, res) => {
    try {
        const { nombre, apellido, email, password, telefono, rol } = req.body;

        if (!nombre || !apellido || !email || !password || !rol) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        const result = await trabajadorAuthService.register({
            nombre,
            apellido,
            email,
            password,
            telefono,
            rol
        }, req.trabajador.id);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

exports.getAll = async (req, res) => {
    try {
        const { rol, estado, search } = req.query;

        const filters = {};
        if (rol) filters.rol = rol;
        if (estado) filters.estado = estado;
        if (search) filters.search = search;

        const trabajadores = await trabajadorModel.getAll(filters);

        res.json({
            success: true,
            data: trabajadores
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error obteniendo trabajadores',
            error: error.message
        });
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;

        const trabajador = await trabajadorModel.findById(id);

        if (!trabajador) {
            return res.status(404).json({
                success: false,
                message: 'Trabajador no encontrado'
            });
        }

        const { password, ...safeData } = trabajador;

        res.json({
            success: true,
            data: safeData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error obteniendo trabajador',
            error: error.message
        });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, telefono, email } = req.body;

        const trabajador = await trabajadorModel.findById(id);

        if (!trabajador) {
            return res.status(404).json({
                success: false,
                message: 'Trabajador no encontrado'
            });
        }

        if (email && email !== trabajador.email) {
            const emailExists = await trabajadorModel.emailExists(email, id);
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está en uso'
                });
            }
        }

        const updateData = {};
        if (nombre) updateData.nombre = nombre;
        if (apellido) updateData.apellido = apellido;
        if (telefono) updateData.telefono = telefono;
        if (email) updateData.email = email;

        const result = await trabajadorModel.update(id, updateData);

        if (!result.success) {
            return res.status(400).json(result);
        }

        const updatedTrabajador = await trabajadorModel.findById(id);
        const { password, ...safeData } = updatedTrabajador;

        res.json({
            success: true,
            message: 'Trabajador actualizado exitosamente',
            data: safeData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error actualizando trabajador',
            error: error.message
        });
    }
};

exports.updateEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!estado || !['Activo', 'Inactivo'].includes(estado)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido. Debe ser Activo o Inactivo'
            });
        }

        const trabajador = await trabajadorModel.findById(id);

        if (!trabajador) {
            return res.status(404).json({
                success: false,
                message: 'Trabajador no encontrado'
            });
        }

        if (parseInt(id) === req.trabajador.id) {
            return res.status(400).json({
                success: false,
                message: 'No puedes cambiar tu propio estado'
            });
        }

        const result = await trabajadorModel.updateEstado(id, estado);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json({
            success: true,
            message: `Estado actualizado a ${estado}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error actualizando estado',
            error: error.message
        });
    }
};

exports.updateRol = async (req, res) => {
    try {
        const { id } = req.params;
        const { rol } = req.body;

        if (!rol || !['Administrador', 'Vendedor'].includes(rol)) {
            return res.status(400).json({
                success: false,
                message: 'Rol inválido. Debe ser Administrador o Vendedor'
            });
        }

        const trabajador = await trabajadorModel.findById(id);

        if (!trabajador) {
            return res.status(404).json({
                success: false,
                message: 'Trabajador no encontrado'
            });
        }

        if (parseInt(id) === req.trabajador.id) {
            return res.status(400).json({
                success: false,
                message: 'No puedes cambiar tu propio rol'
            });
        }

        const result = await trabajadorModel.updateRol(id, rol);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json({
            success: true,
            message: `Rol actualizado a ${rol}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error actualizando rol',
            error: error.message
        });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password actual y nuevo password son requeridos'
            });
        }

        const result = await trabajadorAuthService.changePassword(
            req.trabajador.id,
            currentPassword,
            newPassword
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cambiando password',
            error: error.message
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const trabajador = await trabajadorModel.findById(req.trabajador.id);

        if (!trabajador) {
            return res.status(404).json({
                success: false,
                message: 'Trabajador no encontrado'
            });
        }

        const { password, ...safeData } = trabajador;

        res.json({
            success: true,
            data: safeData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error obteniendo perfil',
            error: error.message
        });
    }
};
