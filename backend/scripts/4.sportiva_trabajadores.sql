-- =====================================================
-- SPORTIVA E-COMMERCE - DATOS DE TRABAJADORES
-- Script 1 de 3: Trabajadores del Sistema
-- =====================================================
-- EJECUTAR PRIMERO
-- =====================================================

USE sportiva_db;

-- =====================================================
-- CONFIGURACIÓN
-- =====================================================

SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;
SET AUTOCOMMIT = 0;

START TRANSACTION;

-- =====================================================
-- LIMPIAR TABLA (si existe data previa)
-- =====================================================

DELETE FROM TRABAJADOR WHERE 1=1;

-- =====================================================
-- INSERTAR TRABAJADORES
-- =====================================================

-- IMPORTANTE: Los passwords están hasheados con bcrypt (10 rounds)
-- Hash generado con: bcrypt.hash(password, 10)

-- TRABAJADOR 1: Administrador Principal
INSERT INTO TRABAJADOR (
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
) VALUES (
    1,
    'Admin',
    'Sistema',
    'admin@sportiva.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- admin123
    '999888777',
    'Administrador',
    'Activo',
    '2025-07-01 08:00:00',
    '2025-11-14 10:30:00',
    NULL
);

-- TRABAJADOR 2: Vendedor
INSERT INTO TRABAJADOR (
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
) VALUES (
    2,
    'Lino',
    'Chamorro',
    'lino@sportiva.com',
    '$2a$10$5Q0QjHYq7zKz3h.bXJZz0.Y6mN7vZGZGKxN4xYH9L0N2L8sP3qGwW', -- Sport123@
    '987654321',
    'Vendedor',
    'Activo',
    '2025-07-02 09:00:00',
    '2025-11-14 09:15:00',
    1
);

-- =====================================================
-- COMMIT Y RESTAURAR CONFIGURACIÓN
-- =====================================================

COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
SET AUTOCOMMIT = 1;
SET SQL_SAFE_UPDATES = 1;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

SELECT 
    id_trabajador,
    nombre,
    apellido,
    email,
    rol,
    estado,
    fecha_registro,
    CONCAT(nombre, ' ', apellido, ' creado por: ', 
           IFNULL((SELECT CONCAT(nombre, ' ', apellido) 
                   FROM TRABAJADOR t2 
                   WHERE t2.id_trabajador = TRABAJADOR.creado_por), 'Sistema')) as info_creacion
FROM TRABAJADOR
ORDER BY id_trabajador;

SELECT '✅ SCRIPT 1/3 COMPLETADO: 2 trabajadores insertados' as mensaje;
SELECT '📧 Credenciales de acceso:' as info;
SELECT 'Admin: admin@sportiva.com / admin123' as trabajador_1;
SELECT 'Lino: lino@sportiva.com / Sport123@' as trabajador_2;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 
-- CREDENCIALES DE ACCESO:
-- 
-- 1. ADMINISTRADOR:
--    Email:    admin@sportiva.com
--    Password: admin123
--    Rol:      Administrador
-- 
-- 2. VENDEDOR:
--    Email:    lino@sportiva.com
--    Password: Sport123@
--    Rol:      Vendedor
-- 
-- Los passwords están hasheados con bcrypt (10 rounds)
-- Compatible con el modelo Trabajador.js del backend
-- 
-- =====================================================
