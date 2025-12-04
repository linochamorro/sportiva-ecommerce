// ============================================
// SPORTIVA - Configuración Base de Datos
// ============================================

const mysql = require('mysql2/promise');
require('dotenv').config();

// Logging de configuración (para debug)
console.log('=== DATABASE CONFIG ===');
console.log('DB_HOST:', process.env.DB_HOST || process.env.MYSQLHOST || 'NOT SET');
console.log('DB_PORT:', process.env.DB_PORT || process.env.MYSQLPORT || 'NOT SET');
console.log('DB_USER:', process.env.DB_USER || process.env.MYSQLUSER || 'NOT SET');
console.log('DB_NAME:', process.env.DB_NAME || process.env.MYSQLDATABASE || 'NOT SET');
console.log('=======================');

// Pool de conexiones - acepta tanto DB_* como MYSQL*
const pool = mysql.createPool({
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306'),
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'sportiva_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Verificar conexión al iniciar
const verificarConexion = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a base de datos exitosa');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error al conectar con la base de datos:', error.message);
        console.error('Error code:', error.code);
        console.error('Error errno:', error.errno);
        return false;
    }
};

// Verificar conexión inmediatamente
verificarConexion();

// Exportar
module.exports = pool;
module.exports.verificarConexion = verificarConexion;
