// ============================================
// SPORTIVA - Configuración Base de Datos
// ============================================

const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexiones
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sportiva_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Verificar conexión
const verificarConexion = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a base de datos exitosa');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error al conectar con la base de datos:', error.message);
        return false;
    }
};

// Exportar directamente el pool para this.db.execute()
module.exports = pool;

// Mantener función de verificación disponible
module.exports.verificarConexion = verificarConexion;
