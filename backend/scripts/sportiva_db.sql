-- =====================================================
-- SPORTIVA E-COMMERCE - BASE DE DATOS
-- Version compatible con MariaDB 10.4 (XAMPP)
-- Sin COMMENT ni CHECK que causan conflictos
-- =====================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

DROP DATABASE IF EXISTS sportiva_db;
CREATE DATABASE sportiva_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sportiva_db;

-- =====================================================
-- TABLA: CATEGORIA
-- =====================================================

DROP TABLE IF EXISTS CATEGORIA;
CREATE TABLE CATEGORIA (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre_categoria VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    slug VARCHAR(100) UNIQUE,
    estado_categoria ENUM('Activo', 'Inactivo') DEFAULT 'Activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_estado (estado_categoria),
    INDEX idx_slug (slug)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: CLIENTE
-- =====================================================

DROP TABLE IF EXISTS CLIENTE;
CREATE TABLE CLIENTE (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(15),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_sesion DATETIME,
    estado ENUM('Activo', 'Inactivo', 'Bloqueado') DEFAULT 'Activo',
    token_recuperacion VARCHAR(100),
    fecha_token DATETIME,
    verificado BOOLEAN DEFAULT FALSE,
    INDEX idx_email (email),
    INDEX idx_estado (estado),
    INDEX idx_fecha_registro (fecha_registro)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: PRODUCTO
-- =====================================================

DROP TABLE IF EXISTS PRODUCTO;
CREATE TABLE PRODUCTO (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre_producto VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    stock_minimo INT NOT NULL DEFAULT 5,
    id_categoria INT NOT NULL,
    marca VARCHAR(50),
    sku VARCHAR(50) UNIQUE,
    peso DECIMAL(8,2),
    dimensiones VARCHAR(50),
    tiene_tallas BOOLEAN DEFAULT FALSE,
    estado_producto ENUM('Activo', 'Inactivo', 'Descontinuado') DEFAULT 'Activo',
    destacado BOOLEAN DEFAULT FALSE,
    nuevo BOOLEAN DEFAULT FALSE,
    descuento_porcentaje DECIMAL(5,2) DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categoria) REFERENCES CATEGORIA(id_categoria) ON DELETE RESTRICT,
    INDEX idx_categoria (id_categoria),
    INDEX idx_estado (estado_producto),
    INDEX idx_precio (precio),
    INDEX idx_marca (marca),
    INDEX idx_sku (sku),
    INDEX idx_destacado (destacado),
    INDEX idx_nuevo (nuevo),
    INDEX idx_categoria_estado (id_categoria, estado_producto)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: TALLA_PRODUCTO
-- =====================================================

DROP TABLE IF EXISTS TALLA_PRODUCTO;
CREATE TABLE TALLA_PRODUCTO (
    id_talla INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    talla VARCHAR(10) NOT NULL,
    stock_talla INT NOT NULL DEFAULT 0,
    medidas JSON,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_producto) REFERENCES PRODUCTO(id_producto) ON DELETE CASCADE,
    UNIQUE KEY idx_producto_talla (id_producto, talla),
    INDEX idx_stock (id_producto, stock_talla)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: IMAGEN_PRODUCTO
-- =====================================================

DROP TABLE IF EXISTS IMAGEN_PRODUCTO;
CREATE TABLE IMAGEN_PRODUCTO (
    id_imagen INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    url_imagen VARCHAR(255) NOT NULL,
    nombre_archivo VARCHAR(100),
    orden_imagen TINYINT DEFAULT 1,
    es_principal BOOLEAN DEFAULT FALSE,
    descripcion_imagen VARCHAR(200),
    tamanio_archivo INT,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_producto) REFERENCES PRODUCTO(id_producto) ON DELETE CASCADE,
    INDEX idx_producto (id_producto),
    INDEX idx_orden (id_producto, orden_imagen),
    INDEX idx_principal (id_producto, es_principal)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: CARRITO
-- =====================================================

DROP TABLE IF EXISTS CARRITO;
CREATE TABLE CARRITO (
    id_carrito INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    estado_carrito ENUM('Activo', 'Vacio', 'Abandonado', 'Convertido') DEFAULT 'Activo',
    FOREIGN KEY (id_cliente) REFERENCES CLIENTE(id_cliente) ON DELETE CASCADE,
    INDEX idx_cliente (id_cliente),
    INDEX idx_estado (estado_carrito),
    INDEX idx_fecha_mod (fecha_modificacion)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: DETALLE_CARRITO
-- =====================================================

DROP TABLE IF EXISTS DETALLE_CARRITO;
CREATE TABLE DETALLE_CARRITO (
    id_detalle_carrito INT AUTO_INCREMENT PRIMARY KEY,
    id_carrito INT NOT NULL,
    id_talla INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_carrito) REFERENCES CARRITO(id_carrito) ON DELETE CASCADE,
    FOREIGN KEY (id_talla) REFERENCES TALLA_PRODUCTO(id_talla) ON DELETE CASCADE,
    UNIQUE KEY idx_carrito_talla (id_carrito, id_talla),
    INDEX idx_talla (id_talla)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: DIRECCION_ENVIO
-- =====================================================

DROP TABLE IF EXISTS DIRECCION_ENVIO;
CREATE TABLE DIRECCION_ENVIO (
    id_direccion INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    alias_direccion VARCHAR(50) DEFAULT 'Principal',
    direccion_linea1 VARCHAR(100) NOT NULL,
    direccion_linea2 VARCHAR(100),
    distrito VARCHAR(50) NOT NULL,
    provincia VARCHAR(50) NOT NULL DEFAULT 'Lima',
    codigo_postal VARCHAR(10),
    referencia TEXT,
    nombre_contacto VARCHAR(100),
    telefono_contacto VARCHAR(15),
    es_principal BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES CLIENTE(id_cliente) ON DELETE CASCADE,
    INDEX idx_cliente (id_cliente),
    INDEX idx_principal (id_cliente, es_principal)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: PEDIDO
-- =====================================================

DROP TABLE IF EXISTS PEDIDO;
CREATE TABLE PEDIDO (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_direccion INT NOT NULL,
    numero_pedido VARCHAR(20) NOT NULL UNIQUE,
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_pedido ENUM('Pendiente', 'Procesando', 'Enviado', 'Entregado', 'Cancelado') DEFAULT 'Pendiente',
    subtotal DECIMAL(10,2) NOT NULL,
    impuestos DECIMAL(10,2) DEFAULT 0.00,
    costo_envio DECIMAL(10,2) DEFAULT 0.00,
    descuento DECIMAL(10,2) DEFAULT 0.00,
    codigo_cupon VARCHAR(50),
    total_pedido DECIMAL(10,2) NOT NULL,
    numero_tracking VARCHAR(50) UNIQUE,
    fecha_envio DATETIME,
    fecha_entrega_estimada DATE,
    fecha_entrega_real DATETIME,
    observaciones TEXT,
    FOREIGN KEY (id_cliente) REFERENCES CLIENTE(id_cliente),
    FOREIGN KEY (id_direccion) REFERENCES DIRECCION_ENVIO(id_direccion),
    INDEX idx_cliente (id_cliente),
    INDEX idx_estado (estado_pedido),
    INDEX idx_fecha (fecha_pedido),
    INDEX idx_numero (numero_pedido),
    INDEX idx_tracking (numero_tracking)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: DETALLE_PEDIDO
-- =====================================================

DROP TABLE IF EXISTS DETALLE_PEDIDO;
CREATE TABLE DETALLE_PEDIDO (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_producto INT NOT NULL,
    id_talla INT,
    nombre_producto VARCHAR(100) NOT NULL,
    talla_nombre VARCHAR(10) NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_pedido) REFERENCES PEDIDO(id_pedido) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES PRODUCTO(id_producto),
    FOREIGN KEY (id_talla) REFERENCES TALLA_PRODUCTO(id_talla) ON DELETE SET NULL,
    INDEX idx_pedido (id_pedido),
    INDEX idx_producto (id_producto)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: PAGO
-- =====================================================

DROP TABLE IF EXISTS PAGO;
CREATE TABLE PAGO (
    id_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL UNIQUE,
    metodo_pago ENUM('Tarjeta_Credito', 'Tarjeta_Debito', 'Yape', 'Plin', 'Transferencia', 'Contraentrega') NOT NULL,
    monto_pago DECIMAL(10,2) NOT NULL,
    estado_pago ENUM('Pendiente', 'Procesando', 'Completado', 'Rechazado', 'Reembolsado') DEFAULT 'Pendiente',
    referencia_externa VARCHAR(100),
    datos_pago JSON,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_confirmacion DATETIME,
    mensaje_respuesta TEXT,
    FOREIGN KEY (id_pedido) REFERENCES PEDIDO(id_pedido) ON DELETE CASCADE,
    INDEX idx_pedido (id_pedido),
    INDEX idx_estado (estado_pago),
    INDEX idx_metodo (metodo_pago)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: RESENA
-- =====================================================

DROP TABLE IF EXISTS RESENA;
CREATE TABLE RESENA (
    id_resena INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_producto INT NOT NULL,
    calificacion TINYINT NOT NULL,
    titulo VARCHAR(100),
    comentario TEXT,
    fecha_resena TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_resena ENUM('Activa', 'Oculta', 'Reportada') DEFAULT 'Activa',
    util_count INT DEFAULT 0,
    FOREIGN KEY (id_cliente) REFERENCES CLIENTE(id_cliente) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES PRODUCTO(id_producto) ON DELETE CASCADE,
    UNIQUE KEY idx_cliente_producto (id_cliente, id_producto),
    INDEX idx_producto (id_producto),
    INDEX idx_calificacion (calificacion),
    INDEX idx_estado (estado_resena)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: SESION
-- =====================================================

DROP TABLE IF EXISTS SESION;
CREATE TABLE SESION (
    id_sesion INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion DATETIME,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    esta_activa BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_cliente) REFERENCES CLIENTE(id_cliente) ON DELETE CASCADE,
    INDEX idx_cliente (id_cliente, esta_activa),
    INDEX idx_token (token),
    INDEX idx_expiracion (fecha_expiracion)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: AUDITORIA_STOCK
-- =====================================================

DROP TABLE IF EXISTS AUDITORIA_STOCK;
CREATE TABLE AUDITORIA_STOCK (
    id_auditoria INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    id_talla INT,
    tipo_movimiento ENUM('Entrada', 'Salida', 'Ajuste', 'Reserva', 'Liberacion') NOT NULL,
    cantidad_anterior INT NOT NULL,
    cantidad_movimiento INT NOT NULL,
    cantidad_nueva INT NOT NULL,
    motivo VARCHAR(100),
    referencia_documento VARCHAR(50),
    usuario_responsable VARCHAR(50),
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_producto) REFERENCES PRODUCTO(id_producto),
    FOREIGN KEY (id_talla) REFERENCES TALLA_PRODUCTO(id_talla) ON DELETE SET NULL,
    INDEX idx_producto (id_producto),
    INDEX idx_talla (id_talla),
    INDEX idx_tipo (tipo_movimiento),
    INDEX idx_fecha (fecha_movimiento),
    INDEX idx_referencia (referencia_documento)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: CONFIGURACION_SISTEMA
-- =====================================================

DROP TABLE IF EXISTS CONFIGURACION_SISTEMA;
CREATE TABLE CONFIGURACION_SISTEMA (
    id_config INT AUTO_INCREMENT PRIMARY KEY,
    clave_config VARCHAR(50) NOT NULL UNIQUE,
    valor_config TEXT NOT NULL,
    descripcion TEXT,
    tipo_dato ENUM('STRING', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'JSON') DEFAULT 'STRING',
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    modificado_por VARCHAR(50),
    INDEX idx_clave (clave_config)
) ENGINE=InnoDB;

-- =====================================================
-- TRIGGERS
-- =====================================================

DELIMITER $$

DROP TRIGGER IF EXISTS ValidarEmailUnicoCliente$$
CREATE TRIGGER ValidarEmailUnicoCliente 
BEFORE INSERT ON CLIENTE 
FOR EACH ROW
BEGIN
    IF NEW.email NOT REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email invalido';
    END IF;
    SET NEW.email = LOWER(NEW.email);
END$$

DROP TRIGGER IF EXISTS ActualizarFechaUltimaSesion$$
CREATE TRIGGER ActualizarFechaUltimaSesion 
AFTER INSERT ON SESION 
FOR EACH ROW
BEGIN
    UPDATE CLIENTE SET fecha_ultima_sesion = NOW() WHERE id_cliente = NEW.id_cliente;
END$$

DROP TRIGGER IF EXISTS AsegurarTallaUnica$$
CREATE TRIGGER AsegurarTallaUnica 
AFTER INSERT ON PRODUCTO 
FOR EACH ROW
BEGIN
    IF NEW.tiene_tallas = FALSE THEN
        INSERT INTO TALLA_PRODUCTO (id_producto, talla, stock_talla) 
        VALUES (NEW.id_producto, 'UNICA', 0);
    END IF;
END$$

DROP TRIGGER IF EXISTS GenerarNumeroTracking$$
CREATE TRIGGER GenerarNumeroTracking 
BEFORE INSERT ON PEDIDO 
FOR EACH ROW
BEGIN
    IF NEW.numero_tracking IS NULL OR NEW.numero_tracking = '' THEN
        SET NEW.numero_tracking = CONCAT('SPT-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', 
            LPAD(CONNECTION_ID(), 6, '0'), '-', LPAD(FLOOR(RAND() * 1000), 3, '0'));
    END IF;
    IF NEW.numero_pedido IS NULL OR NEW.numero_pedido = '' THEN
        SET NEW.numero_pedido = CONCAT('SPT-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', 
            LPAD(NEW.id_cliente, 4, '0'), '-', LPAD(FLOOR(RAND() * 10000), 4, '0'));
    END IF;
END$$

DROP TRIGGER IF EXISTS CalcularSubtotalDetallePedido$$
CREATE TRIGGER CalcularSubtotalDetallePedido 
BEFORE INSERT ON DETALLE_PEDIDO 
FOR EACH ROW
BEGIN
    SET NEW.subtotal = NEW.cantidad * NEW.precio_unitario;
END$$

DROP TRIGGER IF EXISTS ActualizarEstadoCarrito_Insert$$
CREATE TRIGGER ActualizarEstadoCarrito_Insert 
AFTER INSERT ON DETALLE_CARRITO 
FOR EACH ROW
BEGIN
    UPDATE CARRITO 
    SET fecha_modificacion = CURRENT_TIMESTAMP, estado_carrito = 'Activo' 
    WHERE id_carrito = NEW.id_carrito;
END$$

DROP TRIGGER IF EXISTS ActualizarEstadoCarrito_Delete$$
CREATE TRIGGER ActualizarEstadoCarrito_Delete 
AFTER DELETE ON DETALLE_CARRITO 
FOR EACH ROW
BEGIN
    DECLARE v_count INT;
    SELECT COUNT(*) INTO v_count FROM DETALLE_CARRITO WHERE id_carrito = OLD.id_carrito;
    IF v_count = 0 THEN
        UPDATE CARRITO SET estado_carrito = 'Vacio', fecha_modificacion = CURRENT_TIMESTAMP 
        WHERE id_carrito = OLD.id_carrito;
    END IF;
END$$

DROP TRIGGER IF EXISTS ValidarCalificacionResena$$
CREATE TRIGGER ValidarCalificacionResena 
BEFORE INSERT ON RESENA 
FOR EACH ROW
BEGIN
    IF NEW.calificacion < 1 OR NEW.calificacion > 5 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Calificacion debe estar entre 1 y 5';
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- PROCEDIMIENTOS ALMACENADOS
-- =====================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS VerificarStockMinimo$$
CREATE PROCEDURE VerificarStockMinimo()
BEGIN
    SELECT 
        p.id_producto, 
        p.nombre_producto, 
        p.stock_minimo, 
        tp.id_talla, 
        tp.talla, 
        tp.stock_talla, 
        (p.stock_minimo - tp.stock_talla) AS deficit, 
        c.nombre_categoria, 
        p.marca
    FROM PRODUCTO p 
    JOIN TALLA_PRODUCTO tp ON p.id_producto = tp.id_producto 
    JOIN CATEGORIA c ON p.id_categoria = c.id_categoria
    WHERE tp.stock_talla <= p.stock_minimo 
    AND p.estado_producto = 'Activo' 
    ORDER BY deficit DESC;
END$$

DROP PROCEDURE IF EXISTS ActualizarStockProducto$$
CREATE PROCEDURE ActualizarStockProducto(
    IN p_id_talla INT,
    IN p_cantidad_movimiento INT,
    IN p_tipo_movimiento ENUM('Entrada','Salida','Ajuste'),
    IN p_motivo VARCHAR(100),
    IN p_usuario_responsable VARCHAR(50),
    OUT p_success BOOLEAN,
    OUT p_mensaje VARCHAR(255)
)
proc_label:BEGIN
    DECLARE v_stock_anterior, v_stock_nuevo, v_id_producto, v_stock_minimo INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN 
        ROLLBACK; 
        SET p_success = FALSE; 
        SET p_mensaje = 'Error actualizando stock'; 
    END;
    
    START TRANSACTION;
    
    IF NOT EXISTS (SELECT 1 FROM TALLA_PRODUCTO WHERE id_talla = p_id_talla) THEN
        ROLLBACK; 
        SET p_success = FALSE; 
        SET p_mensaje = 'Talla no encontrada'; 
        LEAVE proc_label;
    END IF;
    
    SELECT stock_talla, id_producto INTO v_stock_anterior, v_id_producto 
    FROM TALLA_PRODUCTO WHERE id_talla = p_id_talla FOR UPDATE;
    
    SET v_stock_nuevo = v_stock_anterior + p_cantidad_movimiento;
    
    IF v_stock_nuevo < 0 THEN 
        ROLLBACK; 
        SET p_success = FALSE; 
        SET p_mensaje = 'Stock insuficiente'; 
        LEAVE proc_label; 
    END IF;
    
    UPDATE TALLA_PRODUCTO SET stock_talla = v_stock_nuevo WHERE id_talla = p_id_talla;
    
    INSERT INTO AUDITORIA_STOCK (id_producto, id_talla, tipo_movimiento, cantidad_anterior, cantidad_movimiento, cantidad_nueva, motivo, usuario_responsable)
    VALUES (v_id_producto, p_id_talla, p_tipo_movimiento, v_stock_anterior, p_cantidad_movimiento, v_stock_nuevo, p_motivo, p_usuario_responsable);
    
    SELECT stock_minimo INTO v_stock_minimo FROM PRODUCTO WHERE id_producto = v_id_producto;
    
    IF v_stock_nuevo <= v_stock_minimo THEN 
        SET p_mensaje = CONCAT('Stock actualizado. ALERTA: Bajo minimo (', v_stock_minimo, ')');
    ELSE 
        SET p_mensaje = 'Stock actualizado correctamente'; 
    END IF;
    
    COMMIT; 
    SET p_success = TRUE;
END$$

DROP PROCEDURE IF EXISTS LimpiarCarritosAbandonados$$
CREATE PROCEDURE LimpiarCarritosAbandonados(
    IN p_dias_inactividad INT,
    OUT p_carritos_limpiados INT
)
BEGIN
    UPDATE CARRITO 
    SET estado_carrito = 'Abandonado' 
    WHERE estado_carrito IN ('Activo', 'Vacio') 
    AND fecha_modificacion < DATE_SUB(NOW(), INTERVAL p_dias_inactividad DAY);
    
    SET p_carritos_limpiados = ROW_COUNT();
END$$

DELIMITER ;

-- =====================================================
-- CONFIGURACIONES INICIALES
-- =====================================================

INSERT INTO CONFIGURACION_SISTEMA (clave_config, valor_config, descripcion, tipo_dato) VALUES
('STOCK_MINIMO_ALERTA', '5', 'Stock minimo para alertas', 'INTEGER'),
('COSTO_ENVIO_LIMA', '15.00', 'Costo de envio en Lima', 'DECIMAL'),
('COSTO_ENVIO_PROVINCIAS', '25.00', 'Costo de envio en provincias', 'DECIMAL'),
('IGV_PORCENTAJE', '18.00', 'Porcentaje de IGV', 'DECIMAL'),
('CUPONES_ACTIVOS', '{"BIENVENIDA10":{"descuento":10,"tipo":"porcentaje"},"PRIMERACOMPRA":{"descuento":15,"tipo":"monto_fijo"}}', 'Cupones activos del sistema', 'JSON'),
('DIAS_CARRITO_ABANDONADO', '7', 'Dias para marcar carrito como abandonado', 'INTEGER'),
('MAXIMO_ITEMS_CARRITO', '50', 'Maximo items por carrito', 'INTEGER'),
('JWT_EXPIRATION_HOURS', '24', 'Horas de expiracion del JWT', 'INTEGER');

-- =====================================================
-- INDICES ADICIONALES
-- =====================================================

CREATE INDEX idx_producto_activo_destacado ON PRODUCTO(estado_producto, destacado, fecha_creacion);
CREATE INDEX idx_producto_activo_nuevo ON PRODUCTO(estado_producto, nuevo, fecha_creacion);
CREATE INDEX idx_pedido_cliente_estado ON PEDIDO(id_cliente, estado_pedido, fecha_pedido);

-- =====================================================
-- VISTAS
-- =====================================================

CREATE OR REPLACE VIEW v_productos_stock AS
SELECT 
    p.id_producto,
    p.nombre_producto,
    p.marca,
    p.precio,
    c.nombre_categoria,
    SUM(tp.stock_talla) AS stock_total,
    p.stock_minimo,
    CASE 
        WHEN SUM(tp.stock_talla) = 0 THEN 'Sin Stock'
        WHEN SUM(tp.stock_talla) <= p.stock_minimo THEN 'Stock Bajo'
        ELSE 'Disponible'
    END AS estado_stock,
    p.estado_producto
FROM PRODUCTO p
LEFT JOIN TALLA_PRODUCTO tp ON p.id_producto = tp.id_producto
LEFT JOIN CATEGORIA c ON p.id_categoria = c.id_categoria
GROUP BY p.id_producto;

CREATE OR REPLACE VIEW v_productos_destacados AS
SELECT 
    p.id_producto,
    p.nombre_producto,
    p.descripcion,
    p.precio,
    p.marca,
    c.nombre_categoria,
    i.url_imagen AS imagen_principal,
    SUM(tp.stock_talla) AS stock_disponible
FROM PRODUCTO p
JOIN CATEGORIA c ON p.id_categoria = c.id_categoria
LEFT JOIN IMAGEN_PRODUCTO i ON p.id_producto = i.id_producto AND i.es_principal = TRUE
LEFT JOIN TALLA_PRODUCTO tp ON p.id_producto = tp.id_producto
WHERE p.destacado = TRUE 
AND p.estado_producto = 'Activo'
GROUP BY p.id_producto
HAVING stock_disponible > 0;

SET FOREIGN_KEY_CHECKS=1;

SELECT 'Base de datos SPORTIVA creada exitosamente' AS mensaje;
SELECT 'Compatible con MariaDB 10.4 (XAMPP)' AS version;
SELECT 'Listo para insertar los 55 productos' AS siguiente_paso;
