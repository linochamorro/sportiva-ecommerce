// ============================================
// SPORTIVA - Configuración Base de Datos
// ============================================

const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexiones
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Validar configuración en producción
if (process.env.NODE_ENV === 'production') {
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
        console.error('❌ ERROR: Variables de BD requeridas: DB_HOST, DB_USER, DB_NAME');
    }
}

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
