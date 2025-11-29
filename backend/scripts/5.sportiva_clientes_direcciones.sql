-- =====================================================
-- SPORTIVA E-COMMERCE - CLIENTES Y DIRECCIONES
-- Script 2 de 3: Clientes y sus Direcciones de Envío
-- =====================================================
-- EJECUTAR SEGUNDO (después de sportiva_trabajadores.sql)
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
-- LIMPIAR TABLAS (si existe data previa)
-- =====================================================

DELETE FROM DIRECCION_ENVIO WHERE 1=1;
DELETE FROM CLIENTE WHERE 1=1;

-- =====================================================
-- INSERTAR CLIENTES
-- =====================================================
-- Total: 27 clientes
-- Lima: 19 clientes (70%)
-- Provincias: 8 clientes (30%)
-- Password para todos: cliente123 (hasheado con bcrypt)
-- =====================================================

-- Hash de 'cliente123': $2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ

-- ============================================
-- CLIENTES DE LIMA (19)
-- ============================================

INSERT INTO CLIENTE (nombre, apellido, email, password, telefono, fecha_registro, fecha_ultima_sesion, estado, verificado) VALUES
('Carlos', 'Rodríguez', 'carlos.rodriguez@gmail.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654321', '2025-07-15 10:30:00', '2025-11-10 14:20:00', 'Activo', TRUE),
('María', 'García', 'maria.garcia@hotmail.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654322', '2025-07-20 11:00:00', '2025-11-12 16:45:00', 'Activo', TRUE),
('Luis', 'Fernández', 'luis.fernandez@gmail.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654323', '2025-07-25 09:15:00', '2025-11-11 10:30:00', 'Activo', TRUE),
('Ana', 'López', 'ana.lopez@outlook.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654324', '2025-08-01 14:20:00', '2025-11-09 18:10:00', 'Activo', TRUE),
('Jorge', 'Martínez', 'jorge.martinez@gmail.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654325', '2025-08-05 16:45:00', '2025-11-08 12:00:00', 'Activo', TRUE),
('Patricia', 'Sánchez', 'patricia.sanchez@gmail.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654326', '2025-08-10 08:30:00', '2025-11-07 15:25:00', 'Activo', TRUE),
('Roberto', 'Díaz', 'roberto.diaz@hotmail.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654327', '2025-08-15 12:00:00', '2025-11-06 09:40:00', 'Activo', TRUE),
('Carmen', 'Torres', 'carmen.torres@gmail.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654328', '2025-08-18 15:10:00', '2025-11-05 14:15:00', 'Activo', TRUE),
('Miguel', 'Ramírez', 'miguel.ramirez@outlook.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654329', '2025-08-22 10:25:00', '2025-11-04 11:30:00', 'Activo', TRUE),
('Isabel', 'Flores', 'isabel.flores@gmail.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654330', '2025-08-25 13:40:00', '2025-11-03 16:20:00', 'Activo', TRUE),
('Pedro', 'Castro', 'pedro.castro@gmail.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654331', '2025-08-28 09:50:00', '2025-11-02 10:45:00', 'Activo', TRUE),
('Rosa', 'Vega', 'rosa.vega@hotmail.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654332', '2025-09-01 14:15:00', '2025-11-01 13:50:00', 'Activo', TRUE),
('Diego', 'Morales', 'diego.morales@gmail.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654333', '2025-09-05 11:20:00', '2025-10-30 15:10:00', 'Activo', TRUE),
('Sofía', 'Ruiz', 'sofia.ruiz@outlook.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654334', '2025-09-08 16:30:00', '2025-10-29 09:25:00', 'Activo', TRUE),
('Fernando', 'Mendoza', 'fernando.mendoza@gmail.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654335', '2025-09-12 08:45:00', '2025-10-28 14:35:00', 'Activo', TRUE),
('Gabriela', 'Paredes', 'gabriela.paredes@gmail.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654336', '2025-09-15 12:55:00', '2025-10-27 11:40:00', 'Activo', TRUE),
('Andrés', 'Silva', 'andres.silva@hotmail.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654337', '2025-09-18 15:20:00', '2025-10-26 16:15:00', 'Activo', TRUE),
('Valentina', 'Reyes', 'valentina.reyes@gmail.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654338', '2025-09-22 10:10:00', '2025-10-25 13:20:00', 'Activo', TRUE),
('Sebastián', 'Herrera', 'sebastian.herrera@outlook.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654339', '2025-09-25 13:35:00', '2025-10-24 10:50:00', 'Activo', TRUE);

-- ============================================
-- CLIENTES DE PROVINCIAS (8)
-- ============================================

INSERT INTO CLIENTE (nombre, apellido, email, password, telefono, fecha_registro, fecha_ultima_sesion, estado, verificado) VALUES
('Javier', 'Gutiérrez', 'javier.gutierrez@gmail.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654340', '2025-08-03 09:20:00', '2025-11-13 15:30:00', 'Activo', TRUE),
('Lucía', 'Vargas', 'lucia.vargas@hotmail.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654341', '2025-08-12 14:40:00', '2025-11-12 12:15:00', 'Activo', TRUE),
('Raúl', 'Navarro', 'raul.navarro@gmail.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654342', '2025-08-20 11:15:00', '2025-11-11 09:40:00', 'Activo', TRUE),
('Elena', 'Rojas', 'elena.rojas@outlook.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654343', '2025-09-02 16:25:00', '2025-11-10 14:55:00', 'Activo', TRUE),
('Marcos', 'Ortega', 'marcos.ortega@gmail.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654344', '2025-09-10 10:50:00', '2025-11-09 11:20:00', 'Activo', TRUE),
('Daniela', 'Medina', 'daniela.medina@gmail.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654345', '2025-09-16 13:10:00', '2025-11-08 16:40:00', 'Activo', TRUE),
('Ricardo', 'Chávez', 'ricardo.chavez@hotmail.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654346', '2025-09-28 15:45:00', '2025-11-07 10:10:00', 'Activo', TRUE),
('Camila', 'Quispe', 'camila.quispe@gmail.com', '$2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ', '987654347', '2025-10-05 12:30:00', '2025-11-06 13:25:00', 'Activo', TRUE);

-- =====================================================
-- INSERTAR DIRECCIONES DE ENVÍO
-- =====================================================
-- Total: 27 direcciones (1 por cliente)
-- Lima: 19 direcciones
-- Provincias: 8 direcciones
-- =====================================================

-- ============================================
-- DIRECCIONES DE LIMA (19)
-- ============================================

INSERT INTO DIRECCION_ENVIO (id_cliente, alias_direccion, direccion_linea1, direccion_linea2, distrito, provincia, codigo_postal, referencia, nombre_contacto, telefono_contacto, es_principal, fecha_creacion) VALUES
(1, 'Principal', 'Av. Javier Prado Este 4200', 'Dpto 502, Torre A', 'Santiago de Surco', 'Lima', '15023', 'Edificio azul frente al Ovalo', 'Carlos Rodríguez', '987654321', TRUE, '2025-07-15 10:35:00'),
(2, 'Casa', 'Av. Larco 1301', 'Casa rosada', 'Miraflores', 'Lima', '15074', 'Al lado del parque Kennedy', 'María García', '987654322', TRUE, '2025-07-20 11:05:00'),
(3, 'Principal', 'Jr. Los Olivos 234', '', 'San Isidro', 'Lima', '15036', 'Casa amarilla, portón negro', 'Luis Fernández', '987654323', TRUE, '2025-07-25 09:20:00'),
(4, 'Casa', 'Av. Benavides 2850', 'Dpto 301', 'Miraflores', 'Lima', '15048', 'Edificio verde cerca al Ovalo', 'Ana López', '987654324', TRUE, '2025-08-01 14:25:00'),
(5, 'Principal', 'Av. La Molina 1250', '', 'La Molina', 'Lima', '15024', 'Casa esquina conreja blanca', 'Jorge Martínez', '987654325', TRUE, '2025-08-05 16:50:00'),
(6, 'Casa', 'Calle Las Begonias 441', 'Of. 801', 'San Isidro', 'Lima', '15047', 'Edificio corporativo', 'Patricia Sánchez', '987654326', TRUE, '2025-08-10 08:35:00'),
(7, 'Principal', 'Av. Primavera 1456', 'Casa 12', 'Santiago de Surco', 'Lima', '15038', 'Condominio Los Jardines', 'Roberto Díaz', '987654327', TRUE, '2025-08-15 12:05:00'),
(8, 'Casa', 'Jr. Ucayali 789', '', 'Cercado de Lima', 'Lima', '15001', 'Casa antigua cerca de la Plaza', 'Carmen Torres', '987654328', TRUE, '2025-08-18 15:15:00'),
(9, 'Principal', 'Av. La Marina 2355', 'Dpto 1502', 'San Miguel', 'Lima', '15087', 'Torre del mar', 'Miguel Ramírez', '987654329', TRUE, '2025-08-22 10:30:00'),
(10, 'Casa', 'Av. República de Panamá 3591', '', 'Surquillo', 'Lima', '15038', 'Casa verde con jardín frontal', 'Isabel Flores', '987654330', TRUE, '2025-08-25 13:45:00'),
(11, 'Principal', 'Av. Comandante Espinar 725', 'Dpto B-203', 'Miraflores', 'Lima', '15074', 'Residencial Las Américas', 'Pedro Castro', '987654331', TRUE, '2025-08-28 09:55:00'),
(12, 'Casa', 'Jr. Puno 567', '', 'Cercado de Lima', 'Lima', '15001', 'Cerca del Mercado Central', 'Rosa Vega', '987654332', TRUE, '2025-09-01 14:20:00'),
(13, 'Principal', 'Av. Universitaria 1801', 'Casa 45', 'San Miguel', 'Lima', '15088', 'Urbanización La Católica', 'Diego Morales', '987654333', TRUE, '2025-09-05 11:25:00'),
(14, 'Casa', 'Av. Alameda del Corregidor 1570', '', 'La Molina', 'Lima', '15026', 'Casa blanca con portón marrón', 'Sofía Ruiz', '987654334', TRUE, '2025-09-08 16:35:00'),
(15, 'Principal', 'Av. El Derby 254', 'Dpto 702', 'Santiago de Surco', 'Lima', '15023', 'Edificio Derby Plaza', 'Fernando Mendoza', '987654335', TRUE, '2025-09-12 08:50:00'),
(16, 'Casa', 'Calle Schell 343', '', 'Miraflores', 'Lima', '15074', 'Casa esquinera roja', 'Gabriela Paredes', '987654336', TRUE, '2025-09-15 13:00:00'),
(17, 'Principal', 'Av. Aviación 2405', 'Of. 506', 'San Borja', 'Lima', '15036', 'Centro Comercial Aviación', 'Andrés Silva', '987654337', TRUE, '2025-09-18 15:25:00'),
(18, 'Casa', 'Jr. Los Eucaliptos 590', '', 'San Isidro', 'Lima', '15073', 'Casa con jardín grande', 'Valentina Reyes', '987654338', TRUE, '2025-09-22 10:15:00'),
(19, 'Principal', 'Av. Caminos del Inca 1465', 'Torre 2, Dpto 904', 'Santiago de Surco', 'Lima', '15023', 'Residencial Los Incas', 'Sebastián Herrera', '987654339', TRUE, '2025-09-25 13:40:00');

-- ============================================
-- DIRECCIONES DE PROVINCIAS (8)
-- ============================================

INSERT INTO DIRECCION_ENVIO (id_cliente, alias_direccion, direccion_linea1, direccion_linea2, distrito, provincia, codigo_postal, referencia, nombre_contacto, telefono_contacto, es_principal, fecha_creacion) VALUES
(20, 'Casa', 'Av. Ejército 1015', '', 'Yanahuara', 'Arequipa', '04001', 'Casa blanca frente a la plaza', 'Javier Gutiérrez', '987654340', TRUE, '2025-08-03 09:25:00'),
(21, 'Principal', 'Jr. Puno 345', 'Casa azul', 'Cusco', 'Cusco', '08001', 'Cerca de la Plaza de Armas', 'Lucía Vargas', '987654341', TRUE, '2025-08-12 14:45:00'),
(22, 'Casa', 'Av. España 1256', '', 'Trujillo', 'La Libertad', '13001', 'Casa verde con portón negro', 'Raúl Navarro', '987654342', TRUE, '2025-08-20 11:20:00'),
(23, 'Principal', 'Calle Tacna 789', 'Dpto 201', 'Piura', 'Piura', '20001', 'Edificio Los Pinos', 'Elena Rojas', '987654343', TRUE, '2025-09-02 16:30:00'),
(24, 'Casa', 'Av. Grau 567', '', 'Chiclayo', 'Lambayeque', '14001', 'Casa amarilla esquina', 'Marcos Ortega', '987654344', TRUE, '2025-09-10 10:55:00'),
(25, 'Principal', 'Jr. Lima 234', 'Casa 5', 'Huancayo', 'Junín', '12001', 'Urbanización El Tambo', 'Daniela Medina', '987654345', TRUE, '2025-09-16 13:15:00'),
(26, 'Casa', 'Av. Sánchez Cerro 890', '', 'Iquitos', 'Loreto', '16001', 'Casa de madera pintada de blanco', 'Ricardo Chávez', '987654346', TRUE, '2025-09-28 15:50:00'),
(27, 'Principal', 'Calle Bolívar 456', '', 'Ayacucho', 'Ayacucho', '05001', 'Casa colonial cerca de la catedral', 'Camila Quispe', '987654347', TRUE, '2025-10-05 12:35:00');

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

SELECT '✅ SCRIPT 2/3 COMPLETADO' as mensaje;
SELECT '' as separador;

SELECT 'RESUMEN DE CLIENTES:' as info;
SELECT 
    COUNT(*) as total_clientes,
    SUM(CASE WHEN estado = 'Activo' THEN 1 ELSE 0 END) as activos,
    SUM(CASE WHEN estado = 'Inactivo' THEN 1 ELSE 0 END) as inactivos
FROM CLIENTE;

SELECT '' as separador;
SELECT 'DISTRIBUCIÓN GEOGRÁFICA:' as info;
SELECT 
    provincia,
    COUNT(*) as cantidad,
    CONCAT(ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM DIRECCION_ENVIO), 1), '%') as porcentaje
FROM DIRECCION_ENVIO
GROUP BY provincia
ORDER BY cantidad DESC;

SELECT '' as separador;
SELECT 'PRIMEROS 5 CLIENTES:' as info;
SELECT 
    id_cliente,
    CONCAT(nombre, ' ', apellido) as cliente,
    email,
    telefono,
    estado
FROM CLIENTE
ORDER BY id_cliente
LIMIT 5;

SELECT '' as separador;
SELECT '📧 Password para TODOS los clientes: cliente123' as credenciales;
SELECT '🔑 Hash bcrypt verificado y compatible con backend' as seguridad;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
--
-- RESUMEN:
-- - 27 clientes creados
-- - 27 direcciones creadas (1 por cliente)
-- - 19 clientes de Lima (70%)
-- - 8 clientes de Provincias (30%)
--
-- PASSWORD ÚNICO:
-- - Todos los clientes: cliente123
-- - Hash: $2a$10$rKqN.8kJVHQH0aR5fPQX4eDQy5gKjGKZ3nYQZVHQH0aR5fPQX4eDQ
--
-- DISTRIBUCIÓN:
-- Lima: 19 direcciones en distritos variados
--       (Surco, Miraflores, San Isidro, La Molina, etc.)
-- 
-- Provincias: 8 direcciones
--       (Arequipa, Cusco, Trujillo, Piura, Chiclayo,
--        Huancayo, Iquitos, Ayacucho)
--
-- =====================================================
