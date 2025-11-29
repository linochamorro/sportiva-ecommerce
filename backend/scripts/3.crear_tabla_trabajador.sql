-- =====================================================
-- SPORTIVA - CREAR TABLA TRABAJADOR
-- Script correctivo: Agregar tabla faltante
-- =====================================================

USE sportiva_db;

-- Crear tabla TRABAJADOR si no existe
CREATE TABLE IF NOT EXISTS TRABAJADOR (
    id_trabajador INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(15),
    rol ENUM('Administrador', 'Vendedor') NOT NULL,
    estado ENUM('Activo', 'Inactivo') DEFAULT 'Activo',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_sesion DATETIME,
    creado_por INT,
    FOREIGN KEY (creado_por) REFERENCES TRABAJADOR(id_trabajador) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_rol (rol),
    INDEX idx_estado (estado)
) ENGINE=InnoDB;

SELECT '✅ Tabla TRABAJADOR creada correctamente' as mensaje;
