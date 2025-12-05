// ============================================
// BASE MODEL - Patrón DAO Base
// ============================================
const db = require('../config/database');

class BaseModel {
    constructor(tableName) {
        this.tableName = tableName.toLowerCase();
        this.db = db;
    }

    // ============================================
    // CRUD - CREATE
    // ============================================
    async create(data) {
        try {
            const keys = Object.keys(data);
            const values = Object.values(data);
            const placeholders = keys.map(() => '?').join(', ');
            const columns = keys.join(', ');

            const query = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
            const [result] = await this.db.execute(query, values);

            return {
                success: true,
                id: result.insertId,
                affectedRows: result.affectedRows
            };
        } catch (error) {
            throw new Error(`Error creating record in ${this.tableName}: ${error.message}`);
        }
    }

    // ============================================
    // CRUD - READ ALL
    // ============================================
    async findAll(conditions = {}, limit = null, offset = 0) {
        try {
            let query = `SELECT * FROM ${this.tableName}`;
            const params = [];

            if (Object.keys(conditions).length > 0) {
                const whereClause = Object.keys(conditions)
                    .map(key => `${key} = ?`)
                    .join(' AND ');
                query += ` WHERE ${whereClause}`;
                params.push(...Object.values(conditions));
            }

            if (limit) {
                query += ` LIMIT ? OFFSET ?`;
                params.push(limit, offset);
            }

            const [rows] = await this.db.execute(query, params);
            return rows;
        } catch (error) {
            throw new Error(`Error finding records in ${this.tableName}: ${error.message}`);
        }
    }

    // ============================================
    // CRUD - READ ONE
    // ============================================
    async findById(id) {
        try {
            const query = `SELECT * FROM ${this.tableName} WHERE id_${this.tableName.toLowerCase()} = ?`;
            const [rows] = await this.db.execute(query, [id]);
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Error finding record by ID in ${this.tableName}: ${error.message}`);
        }
    }

    // ============================================
    // CRUD - READ ONE (Custom field)
    // ============================================
    async findOne(conditions) {
        try {
            const keys = Object.keys(conditions);
            const values = Object.values(conditions);
            const whereClause = keys.map(key => `${key} = ?`).join(' AND ');

            const query = `SELECT * FROM ${this.tableName} WHERE ${whereClause} LIMIT 1`;
            const [rows] = await this.db.execute(query, values);
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Error finding one record in ${this.tableName}: ${error.message}`);
        }
    }

    // ============================================
    // CRUD - UPDATE
    // ============================================
    async update(id, data) {
        try {
            const keys = Object.keys(data);
            const values = Object.values(data);
            const setClause = keys.map(key => `${key} = ?`).join(', ');

            const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id_${this.tableName.toLowerCase()} = ?`;
            const [result] = await this.db.execute(query, [...values, id]);

            return {
                success: result.affectedRows > 0,
                affectedRows: result.affectedRows
            };
        } catch (error) {
            throw new Error(`Error updating record in ${this.tableName}: ${error.message}`);
        }
    }

    // ============================================
    // CRUD - DELETE (Soft delete preferido)
    // ============================================
    async delete(id) {
        try {
            const query = `DELETE FROM ${this.tableName} WHERE id_${this.tableName.toLowerCase()} = ?`;
            const [result] = await this.db.execute(query, [id]);

            return {
                success: result.affectedRows > 0,
                affectedRows: result.affectedRows
            };
        } catch (error) {
            throw new Error(`Error deleting record in ${this.tableName}: ${error.message}`);
        }
    }

    // ============================================
    // UTILITIES
    // ============================================
    async count(conditions = {}) {
        try {
            let query = `SELECT COUNT(*) as total FROM ${this.tableName}`;
            const params = [];

            if (Object.keys(conditions).length > 0) {
                const whereClause = Object.keys(conditions)
                    .map(key => `${key} = ?`)
                    .join(' AND ');
                query += ` WHERE ${whereClause}`;
                params.push(...Object.values(conditions));
            }

            const [rows] = await this.db.execute(query, params);
            return rows[0].total;
        } catch (error) {
            throw new Error(`Error counting records in ${this.tableName}: ${error.message}`);
        }
    }

    async exists(conditions) {
        try {
            const count = await this.count(conditions);
            return count > 0;
        } catch (error) {
            throw new Error(`Error checking existence in ${this.tableName}: ${error.message}`);
        }
    }

    // ============================================
    // TRANSACTIONS
    // ============================================
    async executeInTransaction(callback) {
        const connection = await this.db.getConnection();
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = BaseModel;
