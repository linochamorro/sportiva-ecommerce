// ============================================
// CLIENTE MODEL - DAO Pattern
// ============================================
const BaseModel = require('./BaseModel');
const bcrypt = require('bcryptjs');

class Cliente extends BaseModel {
    constructor() {
        super('CLIENTE');
    }

    // ============================================
    // AUTENTICACIÓN
    // ============================================

    /**
     * Crear nuevo cliente con password hasheado
     */
    async createWithHashedPassword(data) {
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(data.password_hash, salt);

            const clienteData = {
                nombre: data.nombre,
                apellido: data.apellido,
                email: data.email.toLowerCase(),
                password: hashedPassword,
                telefono: data.telefono || null,
                estado: 'Activo',
                verificado: 0
            };

            return await this.create(clienteData);
        } catch (error) {
            throw new Error(`Error creando cliente: ${error.message}`);
        }
    }

    /**
     * Buscar cliente por email
     */
    async findByEmail(email) {
        try {
            const query = `
                SELECT 
                    id_cliente,
                    nombre,
                    apellido,
                    email,
                    password,
                    telefono,
                    fecha_registro,
                    fecha_ultima_sesion,
                    estado,
                    token_recuperacion,
                    fecha_token,
                    verificado
                FROM CLIENTE
                WHERE email = ? AND estado = 'Activo'
            `;

            const [rows] = await this.db.execute(query, [email]);
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Error buscando cliente por email: ${error.message}`);
        }
    }

    /**
     * Verificar password
     */
    async verifyPassword(plainPassword, hashedPassword) {
        try {
            if (!hashedPassword) {
                throw new Error('Hash de password no proporcionado');
            }
            return await bcrypt.compare(plainPassword, hashedPassword);
        } catch (error) {
            throw new Error(`Error verificando password: ${error.message}`);
        }
    }

    /**
     * Actualizar último acceso
     */
    async updateLastAccess(id_cliente) {
        try {
            const query = `
                UPDATE CLIENTE
                SET fecha_ultima_sesion = NOW()
                WHERE id_cliente = ?
            `;

            await this.db.execute(query, [id_cliente]);
            return true;
        } catch (error) {
            throw new Error(`Error actualizando último acceso: ${error.message}`);
        }
    }

    /**
     * Cambiar password
     */
    async changePassword(id_cliente, newPassword) {
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            const query = `
                UPDATE CLIENTE
                SET password = ?
                WHERE id_cliente = ?
            `;

            const [result] = await this.db.execute(query, [hashedPassword, id_cliente]);
            
            return {
                success: result.affectedRows > 0,
                affectedRows: result.affectedRows
            };
        } catch (error) {
            throw new Error(`Error cambiando password: ${error.message}`);
        }
    }

    // ============================================
    // PERFIL DE CLIENTE
    // ============================================

    /**
     * Obtener perfil completo del cliente
     */
    async getProfile(id_cliente) {
        try {
            const query = `
                SELECT 
                    id_cliente,
                    nombre,
                    apellido,
                    email,
                    telefono,
                    fecha_registro,
                    fecha_ultima_sesion,
                    estado,
                    (SELECT COUNT(*) FROM PEDIDO WHERE id_cliente = c.id_cliente) as total_pedidos,
                    (SELECT COUNT(*) FROM DIRECCION_ENVIO WHERE id_cliente = c.id_cliente) as total_direcciones
                FROM CLIENTE c
                WHERE id_cliente = ? AND estado = 'Activo'
            `;

            const [rows] = await this.db.execute(query, [id_cliente]);
            
            if (rows.length === 0) {
                return null;
            }

            const cliente = rows[0];

            // Obtener direcciones
            cliente.direcciones = await this.getDirecciones(id_cliente);

            return cliente;
        } catch (error) {
            throw new Error(`Error obteniendo perfil del cliente: ${error.message}`);
        }
    }

    /**
     * Actualizar perfil del cliente
     */
    async updateProfile(id_cliente, data) {
        try {
            const allowedFields = ['nombre', 'apellido', 'telefono'];
            const updateData = {};

            // Filtrar solo campos permitidos
            allowedFields.forEach(field => {
                if (data[field] !== undefined) {
                    updateData[field] = data[field];
                }
            });

            if (Object.keys(updateData).length === 0) {
                return { success: false, message: 'No hay datos para actualizar' };
            }

            return await this.update(id_cliente, updateData);
        } catch (error) {
            throw new Error(`Error actualizando perfil: ${error.message}`);
        }
    }

    // ============================================
    // DIRECCIONES DE ENVÍO
    // ============================================

    /**
     * Obtener direcciones del cliente
     */
    async getDirecciones(id_cliente) {
        try {
            const query = `
                SELECT 
                    id_direccion,
                    direccion_linea1 as direccion,
                    distrito as ciudad,
                    provincia,
                    codigo_postal,
                    es_principal,
                    referencia
                FROM DIRECCION_ENVIO
                WHERE id_cliente = ?
                ORDER BY es_principal DESC, id_direccion DESC
            `;

            const [rows] = await this.db.execute(query, [id_cliente]);
            return rows;
        } catch (error) {
            console.warn("Advertencia al obtener direcciones:", error.message);
            return []; 
        }
    }

    /**
     * Agregar dirección de envío
     */
    async addDireccion(id_cliente, direccionData) {
        try {
            const data = {
                id_cliente,
                direccion_linea1: direccionData.direccion || direccionData.direccion_linea1,
                distrito: direccionData.distrito || direccionData.ciudad,
                provincia: direccionData.provincia || 'Lima', 
                codigo_postal: direccionData.codigo_postal || '',
                referencia: direccionData.referencia || null,
                es_principal: direccionData.es_principal || 0
            };

            if (data.es_principal) {
                await this.unsetPrincipalDireccion(id_cliente);
            }

            const query = `
                INSERT INTO DIRECCION_ENVIO 
                (id_cliente, direccion_linea1, distrito, provincia, codigo_postal, referencia, es_principal, fecha_creacion)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            `;

            const [result] = await this.db.execute(query, [
                data.id_cliente,
                data.direccion_linea1,
                data.distrito,
                data.provincia,
                data.codigo_postal,
                data.referencia,
                data.es_principal
            ]);

            return {
                success: true,
                id: result.insertId
            };
        } catch (error) {
            console.error("SQL Error en addDireccion:", error.sqlMessage);
            throw new Error(`Error agregando dirección: ${error.message}`);
        }
    }

    /**
     * Desmarcar dirección principal
     */
    async unsetPrincipalDireccion(id_cliente) {
        try {
            const query = `
                UPDATE DIRECCION_ENVIO
                SET es_principal = 0
                WHERE id_cliente = ?
            `;

            await this.db.execute(query, [id_cliente]);
            return true;
        } catch (error) {
            throw new Error(`Error desmarcando dirección principal: ${error.message}`);
        }
    }

    /**
     * Establecer dirección como principal
     */
    async setPrincipalDireccion(id_cliente, id_direccion) {
        try {
            await this.unsetPrincipalDireccion(id_cliente);
            const query = `
                UPDATE DIRECCION_ENVIO
                SET es_principal = 1
                WHERE id_cliente = ? AND id_direccion = ?
            `;

            const [result] = await this.db.execute(query, [id_cliente, id_direccion]);
            
            return {
                success: result.affectedRows > 0
            };
        } catch (error) {
            throw new Error(`Error estableciendo dirección principal: ${error.message}`);
        }
    }

    /**
     * Eliminar dirección
     */
    async deleteDireccion(id_cliente, id_direccion) {
        try {
            const query = `
                DELETE FROM DIRECCION_ENVIO
                WHERE id_cliente = ? AND id_direccion = ?
            `;

            const [result] = await this.db.execute(query, [id_cliente, id_direccion]);
            
            return {
                success: result.affectedRows > 0
            };
        } catch (error) {
            throw new Error(`Error eliminando dirección: ${error.message}`);
        }
    }

    // ============================================
    // HISTORIAL Y ESTADÍSTICAS
    // ============================================

    /**
     * Obtener historial de pedidos
     */
    async getPedidos(id_cliente, limit = 10, offset = 0) {
        try {
            const query = `
                SELECT 
                    p.id_pedido,
                    p.numero_pedido,
                    p.fecha_pedido,
                    p.estado,
                    p.total,
                    p.metodo_pago,
                    COUNT(dp.id_detalle) as total_items
                FROM PEDIDO p
                LEFT JOIN DETALLE_PEDIDO dp ON p.id_pedido = dp.id_pedido
                WHERE p.id_cliente = ?
                GROUP BY p.id_pedido
                ORDER BY p.fecha_pedido DESC
                LIMIT ? OFFSET ?
            `;

            const [rows] = await this.db.execute(query, [id_cliente, limit, offset]);
            return rows;
        } catch (error) {
            throw new Error(`Error obteniendo pedidos del cliente: ${error.message}`);
        }
    }

    /**
     * Obtener estadísticas del cliente
     */
    async getStats(id_cliente) {
        try {
            const query = `
                SELECT 
                    COUNT(DISTINCT p.id_pedido) as total_pedidos,
                    COALESCE(SUM(p.total), 0) as total_gastado,
                    COALESCE(AVG(p.total), 0) as promedio_pedido,
                    COUNT(DISTINCT dp.id_producto) as productos_comprados,
                    MAX(p.fecha_pedido) as ultima_compra
                FROM PEDIDO p
                LEFT JOIN DETALLE_PEDIDO dp ON p.id_pedido = dp.id_pedido
                WHERE p.id_cliente = ?
            `;

            const [rows] = await this.db.execute(query, [id_cliente]);
            return rows[0];
        } catch (error) {
            throw new Error(`Error obteniendo estadísticas del cliente: ${error.message}`);
        }
    }

    /**
     * Verificar si el email ya existe
     */
    async emailExists(email, excludeClienteId = null) {
        try {
            let query = `SELECT id_cliente FROM CLIENTE WHERE email = ?`;
            const params = [email];

            if (excludeClienteId) {
                query += ` AND id_cliente != ?`;
                params.push(excludeClienteId);
            }

            const [rows] = await this.db.execute(query, params);
            return rows.length > 0;
        } catch (error) {
            throw new Error(`Error verificando email: ${error.message}`);
        }
    }

    /**
     * Desactivar cliente (soft delete)
     */
    async deactivate(id_cliente) {
        try {
            const query = `
                UPDATE CLIENTE
                SET activo = 0
                WHERE id_cliente = ?
            `;

            const [result] = await this.db.execute(query, [id_cliente]);
            
            return {
                success: result.affectedRows > 0
            };
        } catch (error) {
            throw new Error(`Error desactivando cliente: ${error.message}`);
        }
    }

    /**
     * Activa o desactiva un cliente (Admin)
     */
    async updateEstado(id_cliente, estado) {
        try {
            let nuevoEstado;
            if (estado === 1 || estado === 'Activo' || estado === true) {
                nuevoEstado = 'Activo';
            } else if (estado === 'Bloqueado') {
                nuevoEstado = 'Bloqueado';
            } else {
                nuevoEstado = 'Inactivo';
            }

            const query = `
                UPDATE CLIENTE
                SET estado = ?
                WHERE id_cliente = ?
            `;

            const [result] = await this.db.execute(query, [nuevoEstado, id_cliente]);

            return {
                success: result.affectedRows > 0
            };
        } catch (error) {
            throw new Error(`Error actualizando estado del cliente: ${error.message}`);
        }
    }
}

module.exports = Cliente;
