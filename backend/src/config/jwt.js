// ============================================
// SPORTIVA - Configuración JWT
// ============================================

const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'sportiva_secret_key_2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Generar token
const generarToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
};

// Verificar token
const verificarToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// Decodificar token sin verificar
const decodificarToken = (token) => {
    return jwt.decode(token);
};

module.exports = {
    generarToken,
    verificarToken,
    decodificarToken,
    JWT_SECRET,
    JWT_EXPIRES_IN
};
