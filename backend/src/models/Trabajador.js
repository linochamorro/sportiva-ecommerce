const BaseModel = require('./BaseModel');
const bcrypt = require('bcryptjs');

class Trabajador extends BaseModel {
    constructor() {
        super('TRABAJADOR');
    }

    async createWithHashedPassword(data) {
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(data.password, salt);

            const trabajadorData = {
                nombre: data.nombre,
                apellido: data.apellido,
                email: data.email.toLowerCase(),
                password: hashedPassword,
                telefono: data.telefono || null,
                rol: data.rol,
                estado: 'Activo',
                creado_por: data.creado_por || null
            };

            return await this.create(trabajadorData);
        } catch (error) {
            throw new Error(`Error creando trabajador: ${error.message}`);
        }
    }

    async findByEmail(email) {
        try {
            const query = `
                SELECT 
                    id_trabajador,
                    nombre,
                    apellido,
                    email,
                    password,
                    telefono,
                    rol,
                    estado,
                    fecha_registro,
                    fecha_ultima_sesion,
                    creado_por
                FROM trabajador
                WHERE email = ? AND estado = 'Activo'
            `;

            const [rows] = await this.db.execute(query, [email]);
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Error buscando trabajador por email: ${error.message}`);
        }
    }

    async verifyPassword(plainPassword, hashedPassword) {
        try {
            return await bcrypt.compare(plainPassword, hashedPassword);
        } catch (error) {
            throw new Error(`Error verificando password: ${error.message}`);
        }
    }

    async updateLastAccess(id_trabajador) {
        try {
            const query = `
                UPDATE trabajador
                SET fecha_ultima_sesion = NOW()
                WHERE id_trabajador = ?
            `;

            await this.db.execute(query, [id_trabajador]);
            return true;
        } catch (error) {
            throw new Error(`Error actualizando último acceso: ${error.message}`);
        }
    }

    async changePassword(id_trabajador, newPassword) {
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            const query = `
                UPDATE trabajador
                SET password = ?
                WHERE id_trabajador = ?
            `;

            const [result] = await this.db.execute(query, [hashedPassword, id_trabajador]);
            
            return {
                success: result.affectedRows > 0,
                affectedRows: result.affectedRows
            };
        } catch (error) {
            throw new Error(`Error cambiando password: ${error.message}`);
        }
    }

    async emailExists(email, excludeTrabajadorId = null) {
        try {
            let query = `SELECT id_trabajador FROM trabajador WHERE email = ?`;
            const params = [email];

            if (excludeTrabajadorId) {
                query += ` AND id_trabajador != ?`;
                params.push(excludeTrabajadorId);
            }

            const [rows] = await this.db.execute(query, params);
            return rows.length > 0;
        } catch (error) {
            throw new Error(`Error verificando email: ${error.message}`);
        }
    }

    async getAll(filters = {}) {
        try {
            let query = `
                SELECT 
                    t.id_trabajador,
                    t.nombre,
                    t.apellido,
                    t.email,
                    t.telefono,
                    t.rol,
                    t.estado,
                    t.fecha_registro,
                    t.fecha_ultima_sesion,
                    CONCAT(c.nombre, ' ', c.apellido) as creado_por_nombre
                FROM trabajador t
                LEFT JOIN trabajador c ON t.creado_por = c.id_trabajador
                WHERE 1=1
            `;

            const params = [];

            if (filters.rol) {
                query += ` AND t.rol = ?`;
                params.push(filters.rol);
            }

            if (filters.estado) {
                query += ` AND t.estado = ?`;
                params.push(filters.estado);
            }

            if (filters.search) {
                query += ` AND (t.nombre LIKE ? OR t.apellido LIKE ? OR t.email LIKE ?)`;
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            query += ` ORDER BY t.fecha_registro DESC`;

            const [rows] = await this.db.execute(query, params);
            return rows;
        } catch (error) {
            throw new Error(`Error obteniendo trabajadores: ${error.message}`);
        }
    }

    async updateEstado(id_trabajador, estado) {
        try {
            const query = `
                UPDATE trabajador
                SET estado = ?
                WHERE id_trabajador = ?
            `;

            const [result] = await this.db.execute(query, [estado, id_trabajador]);
            
            return {
                success: result.affectedRows > 0
            };
        } catch (error) {
            throw new Error(`Error actualizando estado: ${error.message}`);
        }
    }

    async updateRol(id_trabajador, rol) {
        try {
            const query = `
                UPDATE trabajador
                SET rol = ?
                WHERE id_trabajador = ?
            `;

            const [result] = await this.db.execute(query, [rol, id_trabajador]);
            
            return {
                success: result.affectedRows > 0
            };
        } catch (error) {
            throw new Error(`Error actualizando rol: ${error.message}`);
        }
    }
}

module.exports = Trabajador;
