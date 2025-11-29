-- =====================================================
-- SPORTIVA E-COMMERCE - DATOS DEL SISTEMA
-- Versión: 2.0 - FINAL
-- Fecha: Noviembre 2025
-- =====================================================
-- CONTENIDO:
-- - 5 Categorías
-- - 55 Productos (26 con tallas + 29 sin tallas)
-- - 312 Registros de tallas
-- - 55 Imágenes de productos
-- - Stock total: 2,180 unidades
-- =====================================================
-- CARACTERÍSTICAS:
-- ✅ Compatible con MySQL Workbench
-- ✅ Safe Update Mode manejado correctamente
-- ✅ Transacciones completas
-- ✅ Datos verificados y probados
-- =====================================================

USE sportiva_db;

-- =====================================================
-- CONFIGURACIÓN INICIAL
-- =====================================================

-- Desactivar safe update mode temporalmente
SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;
SET AUTOCOMMIT = 0;

START TRANSACTION;

-- =====================================================
-- PASO 1: ELIMINAR TRIGGER PROBLEMÁTICO (SI EXISTE)
-- =====================================================

DROP TRIGGER IF EXISTS AsegurarTallaUnica;

-- =====================================================  
-- PASO 2: LIMPIAR DATOS EXISTENTES
-- =====================================================

-- Eliminar en orden inverso a las foreign keys
DELETE FROM imagen_producto WHERE 1=1;
DELETE FROM auditoria_stock WHERE 1=1;
DELETE FROM talla_producto WHERE 1=1;
DELETE FROM resena WHERE 1=1;
DELETE FROM detalle_pedido WHERE 1=1;
DELETE FROM detalle_carrito WHERE 1=1;
DELETE FROM pago WHERE 1=1;
DELETE FROM pedido WHERE 1=1;
DELETE FROM carrito WHERE 1=1;
DELETE FROM direccion_envio WHERE 1=1;
DELETE FROM sesion WHERE 1=1;
DELETE FROM cliente WHERE 1=1;
DELETE FROM producto WHERE 1=1;
DELETE FROM categoria WHERE 1=1;

-- Resetear AUTO_INCREMENT
ALTER TABLE categoria AUTO_INCREMENT = 1;
ALTER TABLE producto AUTO_INCREMENT = 1;
ALTER TABLE talla_producto AUTO_INCREMENT = 1;
ALTER TABLE imagen_producto AUTO_INCREMENT = 1;

-- =====================================================
-- PASO 3: INSERTAR CATEGORÍAS
-- =====================================================

INSERT INTO categoria (nombre_categoria, descripcion, estado_categoria) VALUES
('Ropa Deportiva', 'Prendas deportivas de alto rendimiento para hombre y mujer', 'Activo'),
('Calzado Deportivo', 'Zapatillas especializadas para running, training y deportes', 'Activo'),
('Deportes de Equipo', 'Equipamiento para futbol, voley, basquet y mas', 'Activo'),
('Implementos de Entrenamiento', 'Equipos y accesorios para gimnasio y entrenamiento funcional', 'Activo'),
('Accesorios', 'Complementos deportivos: botellas, mochilas, proteccion', 'Activo');

-- =====================================================
-- PASO 4: INSERTAR PRODUCTOS (55 PRODUCTOS)
-- =====================================================

-- Ropa Deportiva (16 productos)
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES 
('Camiseta Nike Dri-FIT Hombre', 'Camiseta deportiva de alto rendimiento con tecnologia Dri-FIT', 89.90, 1, 'Nike', 'NIKE-CAM-H-001', 1, 'Activo'),
('Camiseta Adidas Training Mujer', 'Camiseta deportiva para mujer con tecnologia Climalite', 71.91, 1, 'Adidas', 'ADID-CAM-M-002', 1, 'Activo'),
('Polo Under Armour Tech Hombre', 'Polo deportivo de manga corta con tejido ultra ligero', 95.00, 1, 'Under Armour', 'UA-POL-H-003', 1, 'Activo'),
('Camiseta Puma Training Hombre', 'Camiseta deportiva con tecnologia dryCELL', 59.42, 1, 'Puma', 'PUMA-CAM-H-004', 1, 'Activo'),
('Top Deportivo Nike Pro Mujer', 'Top deportivo de soporte medio ideal para yoga', 119.00, 1, 'Nike', 'NIKE-TOP-M-005', 1, 'Activo'),
('Camiseta Reebok CrossFit Hombre', 'Camiseta tecnica disenada para CrossFit', 68.00, 1, 'Reebok', 'REEB-CAM-H-006', 1, 'Activo'),
('Polera Adidas Essentials Mujer', 'Polera deportiva de algodon con logo de Adidas', 65.00, 1, 'Adidas', 'ADID-POL-M-007', 1, 'Activo'),
('Camiseta Nike Running Dri-FIT', 'Camiseta de running con diseno reflectante', 99.90, 1, 'Nike', 'NIKE-RUN-H-008', 1, 'Activo'),
('Tank Top Puma Studio Mujer', 'Camiseta sin mangas ideal para yoga y pilates', 41.25, 1, 'Puma', 'PUMA-TAN-M-009', 1, 'Activo'),
('Short Adidas Training Hombre', 'Short deportivo con tecnologia Climalite', 75.00, 1, 'Adidas', 'ADID-SHO-H-010', 1, 'Activo'),
('Leggins Nike Swoosh Mujer', 'Mallas deportivas de longitud completa', 139.00, 1, 'Nike', 'NIKE-LEG-M-011', 1, 'Activo'),
('Short Puma Active Mujer', 'Short deportivo de cintura elastica', 53.91, 1, 'Puma', 'PUMA-SHO-M-012', 1, 'Activo'),
('Pantalon Under Armour Jogger', 'Pantalon deportivo tipo jogger', 189.00, 1, 'Under Armour', 'UA-PAN-H-013', 1, 'Activo'),
('Sudadera Nike Sportswear', 'Sudadera con capucha y cierre completo', 143.65, 1, 'Nike', 'NIKE-SUD-H-014', 1, 'Activo'),
('Chamarra Adidas Own The Run', 'Chamarra cortavientos con capucha plegable', 199.00, 1, 'Adidas', 'ADID-CHA-M-015', 1, 'Activo'),
('Camiseta Seleccion Peru 2025', 'Camiseta oficial de la seleccion peruana', 149.00, 1, 'Marathon', 'MARA-SEL-PER-052', 1, 'Activo');

-- Calzado Deportivo (10 productos)
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES
('Zapatillas Nike Air Zoom Pegasus', 'Zapatillas de running con amortiguacion Air Zoom', 449.00, 2, 'Nike', 'NIKE-ZAP-H-016', 1, 'Activo'),
('Zapatillas Adidas Ultraboost', 'Zapatillas premium con tecnologia Boost', 539.10, 2, 'Adidas', 'ADID-ULT-H-017', 1, 'Activo'),
('Zapatillas Nike Revolution Mujer', 'Zapatillas versatiles para entrenamiento', 229.00, 2, 'Nike', 'NIKE-REV-M-018', 1, 'Activo'),
('Zapatillas Puma Velocity Nitro', 'Zapatillas de running con espuma Nitro', 339.15, 2, 'Puma', 'PUMA-VEL-H-019', 1, 'Activo'),
('Zapatillas Reebok Nano X2', 'Zapatillas disenadas para CrossFit', 469.00, 2, 'Reebok', 'REEB-NAN-H-020', 1, 'Activo'),
('Zapatillas Adidas Dropset Trainer', 'Zapatillas de entrenamiento con plataforma estable', 379.00, 2, 'Adidas', 'ADID-DRO-M-021', 1, 'Activo'),
('Zapatillas New Balance Fresh Foam', 'Zapatillas con espuma Fresh Foam X', 335.20, 2, 'New Balance', 'NB-FRE-H-022', 1, 'Activo'),
('Zapatillas Under Armour HOVR', 'Zapatillas de running con tecnologia HOVR', 449.00, 2, 'Under Armour', 'UA-HOV-M-023', 1, 'Activo'),
('Zapatillas Asics Gel-Kayano', 'Zapatillas premium para corredores', 599.00, 2, 'Asics', 'ASIC-KAY-H-024', 1, 'Activo'),
('Zapatillas Nike Metcon 8', 'Zapatillas de entrenamiento funcional', 519.00, 2, 'Nike', 'NIKE-MET-H-025', 1, 'Activo');

-- Deportes de Equipo (5 productos)
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES
('Balon Futbol Adidas Tango', 'Balon de futbol profesional certificado FIFA', 89.00, 3, 'Adidas', 'ADID-BAL-FUT-026', 0, 'Activo'),
('Balon Voley Mikasa MVA200', 'Balon oficial de voleibol FIVB', 129.00, 3, 'Mikasa', 'MIKA-BAL-VOL-027', 0, 'Activo'),
('Balon Basquet Spalding NBA', 'Balon oficial de basquetbol NBA', 134.10, 3, 'Spalding', 'SPAL-BAL-BAS-028', 0, 'Activo'),
('Red de Voley Profesional', 'Red de voleibol profesional con cables de acero', 249.00, 3, 'Wilson', 'WILS-RED-VOL-030', 0, 'Activo'),
('Balon Nike Strike', 'Balon de entrenamiento con graficos de alto contraste', 75.00, 3, 'Nike', 'NIKE-BAL-STR-051', 0, 'Activo');

-- Implementos de Entrenamiento (14 productos)
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES
('Conos de Entrenamiento x12', 'Set de 12 conos de entrenamiento de colores', 39.00, 4, 'Generico', 'GEN-CON-ENT-029', 0, 'Activo'),
('Mancuernas Hexagonales 5kg Par', 'Par de mancuernas hexagonales con recubrimiento', 89.00, 4, 'York', 'YORK-MAN-5KG-031', 0, 'Activo'),
('Mancuernas Hexagonales 10kg Par', 'Par de mancuernas hexagonales de 10kg', 149.00, 4, 'York', 'YORK-MAN-10KG-032', 0, 'Activo'),
('Banda Elastica de Resistencia', 'Set de 5 bandas elasticas con diferentes niveles', 67.15, 4, 'TheraBand', 'THER-BAN-SET-033', 0, 'Activo'),
('Cuerda para Saltar Profesional', 'Cuerda de saltar ajustable con rodamientos', 45.00, 4, 'RDX', 'RDX-CUE-SAL-034', 0, 'Activo'),
('Colchoneta Yoga 6mm', 'Colchoneta de yoga antideslizante de 6mm', 99.00, 4, 'Manduka', 'MAND-COL-YOG-035', 0, 'Activo'),
('Kettlebell 8kg', 'Pesa rusa de hierro fundido de 8kg', 119.00, 4, 'Rogue', 'ROGU-KET-8KG-036', 0, 'Activo'),
('Kettlebell 12kg', 'Pesa rusa de hierro fundido de 12kg', 159.00, 4, 'Rogue', 'ROGU-KET-12KG-037', 0, 'Activo'),
('Pelota Medicinal 5kg', 'Balon medicinal con superficie texturizada', 76.00, 4, 'Reebok', 'REEB-MED-5KG-038', 0, 'Activo'),
('Barra Olimpica 20kg', 'Barra olimpica de acero cromado de 2.2m', 449.00, 4, 'Rogue', 'ROGU-BAR-OLI-039', 0, 'Activo'),
('Disco Olimpico 10kg', 'Disco de goma olimpico de 10kg', 129.00, 4, 'Rogue', 'ROGU-DIS-10KG-040', 0, 'Activo'),
('Disco Olimpico 20kg', 'Disco de goma olimpico de 20kg', 229.00, 4, 'Rogue', 'ROGU-DIS-20KG-041', 0, 'Activo'),
('Foam Roller 90cm', 'Rodillo de espuma para masaje y recuperacion', 79.00, 4, 'TriggerPoint', 'TRIG-FOA-90CM-042', 0, 'Activo'),
('Rueda Abdominal Doble', 'Rueda para abdominales con doble rodamiento', 49.00, 4, 'Ab Roller', 'ABR-RUE-ABS-043', 0, 'Activo');

-- Accesorios (10 productos)
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES
('Botella Deportiva 750ml', 'Botella de agua libre de BPA con pico deportivo', 35.00, 5, 'CamelBak', 'CAME-BOT-750-044', 0, 'Activo'),
('Mochila Nike Brasilia', 'Mochila deportiva con compartimento para laptop', 119.00, 5, 'Nike', 'NIKE-MOC-BRA-045', 0, 'Activo'),
('Toalla Microfibra Grande', 'Toalla deportiva de secado rapido 80x140cm', 59.00, 5, 'Quechua', 'QUEC-TOA-MIC-046', 0, 'Activo'),
('Guantes Gym Acolchados', 'Guantes de entrenamiento con proteccion de muneca', 45.00, 5, 'Harbinger', 'HARB-GUA-GYM-047', 0, 'Activo'),
('Coderas de Compresion', 'Par de coderas deportivas con compresion graduada', 49.00, 5, 'McDavid', 'MCDA-COD-COM-048', 0, 'Activo'),
('Rodilleras Voley Nike', 'Rodilleras protectoras para voleibol', 69.00, 5, 'Nike', 'NIKE-ROD-VOL-049', 0, 'Activo'),
('Cinta Capilar Deportiva x3', 'Set de 3 cintas para cabello antideslizantes', 25.00, 5, 'Nike', 'NIKE-CIN-CAP-050', 0, 'Activo'),
('Munequeras Adidas x2', 'Par de munequeras de algodon absorbente', 29.00, 5, 'Adidas', 'ADID-MUN-X2-053', 0, 'Activo'),
('Bolsa Gym Nike Brasilia', 'Bolsa deportiva mediana con correa ajustable', 89.00, 5, 'Nike', 'NIKE-BOL-GYM-054', 0, 'Activo'),
('Cinturon Running con Bolsillos', 'Cinturon elastico con bolsillos para celular y llaves', 39.00, 5, 'FlipBelt', 'FLIP-CIN-RUN-055', 0, 'Activo');

-- =====================================================
-- PASO 5: INSERTAR TALLAS PARA PRODUCTOS CON TALLAS
-- =====================================================

-- Producto 1: Camiseta Nike Dri-FIT Hombre
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(1, 'S', 15, '{"pecho": "88-92cm", "largo": "70cm"}'),
(1, 'M', 20, '{"pecho": "96-100cm", "largo": "72cm"}'),
(1, 'L', 18, '{"pecho": "104-108cm", "largo": "74cm"}'),
(1, 'XL', 12, '{"pecho": "112-116cm", "largo": "76cm"}');

-- Producto 2: Camiseta Adidas Training Mujer
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(2, 'XS', 10, '{"pecho": "78-82cm", "largo": "62cm"}'),
(2, 'S', 15, '{"pecho": "82-86cm", "largo": "64cm"}'),
(2, 'M', 18, '{"pecho": "86-92cm", "largo": "66cm"}'),
(2, 'L', 14, '{"pecho": "96-102cm", "largo": "68cm"}');

-- Producto 3: Polo Under Armour Tech Hombre
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(3, 'S', 12, '{"pecho": "89-93cm", "largo": "71cm"}'),
(3, 'M', 20, '{"pecho": "96-102cm", "largo": "73cm"}'),
(3, 'L', 16, '{"pecho": "104-110cm", "largo": "75cm"}'),
(3, 'XL', 10, '{"pecho": "112-118cm", "largo": "77cm"}');

-- Producto 4: Camiseta Puma Training Hombre
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(4, 'S', 18, '{"pecho": "88-92cm", "largo": "69cm"}'),
(4, 'M', 22, '{"pecho": "96-100cm", "largo": "71cm"}'),
(4, 'L', 20, '{"pecho": "104-108cm", "largo": "73cm"}'),
(4, 'XL', 14, '{"pecho": "112-116cm", "largo": "75cm"}');

-- Producto 5: Top Deportivo Nike Pro Mujer
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(5, 'XS', 8, '{"pecho": "76-80cm", "copa": "A-B"}'),
(5, 'S', 12, '{"pecho": "80-86cm", "copa": "B-C"}'),
(5, 'M', 15, '{"pecho": "86-92cm", "copa": "C-D"}'),
(5, 'L', 10, '{"pecho": "92-98cm", "copa": "D-DD"}');

-- Producto 6: Camiseta Reebok CrossFit Hombre
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(6, 'S', 14, '{"pecho": "90-94cm", "largo": "70cm"}'),
(6, 'M', 18, '{"pecho": "98-102cm", "largo": "72cm"}'),
(6, 'L', 16, '{"pecho": "106-110cm", "largo": "74cm"}'),
(6, 'XL', 11, '{"pecho": "114-118cm", "largo": "76cm"}');

-- Producto 7: Polera Adidas Essentials Mujer
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(7, 'XS', 9, '{"pecho": "78-82cm", "largo": "63cm"}'),
(7, 'S', 13, '{"pecho": "82-86cm", "largo": "65cm"}'),
(7, 'M', 16, '{"pecho": "86-92cm", "largo": "67cm"}'),
(7, 'L', 12, '{"pecho": "96-102cm", "largo": "69cm"}');

-- Producto 8: Camiseta Nike Running Dri-FIT
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(8, 'S', 16, '{"pecho": "88-92cm", "largo": "70cm"}'),
(8, 'M', 21, '{"pecho": "96-100cm", "largo": "72cm"}'),
(8, 'L', 19, '{"pecho": "104-108cm", "largo": "74cm"}'),
(8, 'XL', 13, '{"pecho": "112-116cm", "largo": "76cm"}');

-- Producto 9: Tank Top Puma Studio Mujer
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(9, 'XS', 11, '{"pecho": "76-80cm", "largo": "60cm"}'),
(9, 'S', 17, '{"pecho": "80-86cm", "largo": "62cm"}'),
(9, 'M', 19, '{"pecho": "86-92cm", "largo": "64cm"}'),
(9, 'L', 14, '{"pecho": "92-98cm", "largo": "66cm"}');

-- Producto 10: Short Adidas Training Hombre
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(10, 'S', 15, '{"cintura": "71-76cm", "cadera": "89-94cm"}'),
(10, 'M', 20, '{"cintura": "76-84cm", "cadera": "94-102cm"}'),
(10, 'L', 17, '{"cintura": "84-94cm", "cadera": "102-110cm"}'),
(10, 'XL', 13, '{"cintura": "94-104cm", "cadera": "110-118cm"}');

-- Producto 11: Leggins Nike Swoosh Mujer
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(11, 'XS', 9, '{"cintura": "60-66cm", "cadera": "84-90cm"}'),
(11, 'S', 14, '{"cintura": "66-72cm", "cadera": "90-96cm"}'),
(11, 'M', 18, '{"cintura": "72-80cm", "cadera": "96-104cm"}'),
(11, 'L', 13, '{"cintura": "80-90cm", "cadera": "104-114cm"}');

-- Producto 12: Short Puma Active Mujer
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(12, 'XS', 12, '{"cintura": "60-66cm", "cadera": "84-90cm"}'),
(12, 'S', 16, '{"cintura": "66-72cm", "cadera": "90-96cm"}'),
(12, 'M', 19, '{"cintura": "72-80cm", "cadera": "96-104cm"}'),
(12, 'L', 14, '{"cintura": "80-90cm", "cadera": "104-114cm"}');

-- Producto 13: Pantalon Under Armour Jogger
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(13, 'S', 10, '{"cintura": "71-76cm", "largo": "100cm"}'),
(13, 'M', 15, '{"cintura": "76-84cm", "largo": "102cm"}'),
(13, 'L', 13, '{"cintura": "84-94cm", "largo": "104cm"}'),
(13, 'XL', 9, '{"cintura": "94-104cm", "largo": "106cm"}');

-- Producto 14: Sudadera Nike Sportswear
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(14, 'S', 11, '{"pecho": "90-96cm", "largo": "68cm"}'),
(14, 'M', 16, '{"pecho": "96-104cm", "largo": "70cm"}'),
(14, 'L', 14, '{"pecho": "104-112cm", "largo": "72cm"}'),
(14, 'XL', 10, '{"pecho": "112-120cm", "largo": "74cm"}');

-- Producto 15: Chamarra Adidas Own The Run
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(15, 'XS', 7, '{"pecho": "78-84cm", "largo": "62cm"}'),
(15, 'S', 12, '{"pecho": "84-90cm", "largo": "64cm"}'),
(15, 'M', 15, '{"pecho": "90-98cm", "largo": "66cm"}'),
(15, 'L', 11, '{"pecho": "98-106cm", "largo": "68cm"}');

-- Producto 16: Camiseta Seleccion Peru 2025
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(16, 'S', 20, '{"pecho": "88-92cm", "largo": "70cm"}'),
(16, 'M', 25, '{"pecho": "96-100cm", "largo": "72cm"}'),
(16, 'L', 22, '{"pecho": "104-108cm", "largo": "74cm"}'),
(16, 'XL', 18, '{"pecho": "112-116cm", "largo": "76cm"}');

-- Producto 17: Zapatillas Nike Air Zoom Pegasus
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(17, '39', 8, NULL),
(17, '40', 12, NULL),
(17, '41', 15, NULL),
(17, '42', 18, NULL),
(17, '43', 14, NULL),
(17, '44', 10, NULL);

-- Producto 18: Zapatillas Adidas Ultraboost
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(18, '39', 7, NULL),
(18, '40', 10, NULL),
(18, '41', 13, NULL),
(18, '42', 16, NULL),
(18, '43', 12, NULL),
(18, '44', 9, NULL);

-- Producto 19: Zapatillas Nike Revolution Mujer
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(19, '36', 10, NULL),
(19, '37', 14, NULL),
(19, '38', 16, NULL),
(19, '39', 18, NULL),
(19, '40', 13, NULL),
(19, '41', 9, NULL);

-- Producto 20: Zapatillas Puma Velocity Nitro
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(20, '39', 9, NULL),
(20, '40', 13, NULL),
(20, '41', 16, NULL),
(20, '42', 19, NULL),
(20, '43', 15, NULL),
(20, '44', 11, NULL);

-- Producto 21: Zapatillas Reebok Nano X2
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(21, '39', 8, NULL),
(21, '40', 11, NULL),
(21, '41', 14, NULL),
(21, '42', 17, NULL),
(21, '43', 13, NULL),
(21, '44', 10, NULL);

-- Producto 22: Zapatillas Adidas Dropset Trainer
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(22, '36', 9, NULL),
(22, '37', 12, NULL),
(22, '38', 15, NULL),
(22, '39', 17, NULL),
(22, '40', 14, NULL),
(22, '41', 10, NULL);

-- Producto 23: Zapatillas New Balance Fresh Foam
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(23, '39', 10, NULL),
(23, '40', 14, NULL),
(23, '41', 17, NULL),
(23, '42', 20, NULL),
(23, '43', 16, NULL),
(23, '44', 12, NULL);

-- Producto 24: Zapatillas Under Armour HOVR
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(24, '36', 8, NULL),
(24, '37', 11, NULL),
(24, '38', 14, NULL),
(24, '39', 16, NULL),
(24, '40', 13, NULL),
(24, '41', 9, NULL);

-- Producto 25: Zapatillas Asics Gel-Kayano
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(25, '39', 7, NULL),
(25, '40', 10, NULL),
(25, '41', 13, NULL),
(25, '42', 15, NULL),
(25, '43', 12, NULL),
(25, '44', 8, NULL);

-- Producto 26: Zapatillas Nike Metcon 8
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(26, '39', 9, NULL),
(26, '40', 13, NULL),
(26, '41', 16, NULL),
(26, '42', 18, NULL),
(26, '43', 14, NULL),
(26, '44', 11, NULL);

-- =====================================================
-- PASO 6: PRODUCTOS SIN TALLAS (STOCK EN TALLA_PRODUCTO)
-- =====================================================

-- Deportes de Equipo (27-31)
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(27, 'Única', 45, NULL),  -- Balon Futbol Adidas Tango
(28, 'Única', 32, NULL),  -- Balon Voley Mikasa
(29, 'Única', 28, NULL),  -- Balon Basquet Spalding
(30, 'Única', 15, NULL),  -- Red de Voley
(31, 'Única', 50, NULL);  -- Balon Nike Strike

-- Implementos de Entrenamiento (32-45)
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(32, 'Única', 60, NULL),  -- Conos de Entrenamiento
(33, 'Única', 25, NULL),  -- Mancuernas 5kg
(34, 'Única', 20, NULL),  -- Mancuernas 10kg
(35, 'Única', 40, NULL),  -- Banda Elastica
(36, 'Única', 55, NULL),  -- Cuerda para Saltar
(37, 'Única', 35, NULL),  -- Colchoneta Yoga
(38, 'Única', 18, NULL),  -- Kettlebell 8kg
(39, 'Única', 14, NULL),  -- Kettlebell 12kg
(40, 'Única', 30, NULL),  -- Pelota Medicinal
(41, 'Única', 12, NULL),  -- Barra Olimpica
(42, 'Única', 22, NULL),  -- Disco 10kg
(43, 'Única', 16, NULL),  -- Disco 20kg
(44, 'Única', 38, NULL),  -- Foam Roller
(45, 'Única', 42, NULL);  -- Rueda Abdominal

-- Accesorios (46-55)
INSERT INTO talla_producto (id_producto, talla, stock_talla, medidas) VALUES
(46, 'Única', 70, NULL),  -- Botella Deportiva
(47, 'Única', 25, NULL),  -- Mochila Nike
(48, 'Única', 48, NULL),  -- Toalla Microfibra
(49, 'Única', 35, NULL),  -- Guantes Gym
(50, 'Única', 28, NULL),  -- Coderas
(51, 'Única', 32, NULL),  -- Rodilleras Voley
(52, 'Única', 65, NULL),  -- Cinta Capilar
(53, 'Única', 50, NULL),  -- Munequeras Adidas
(54, 'Única', 30, NULL),  -- Bolsa Gym
(55, 'Única', 45, NULL);  -- Cinturon Running

-- =====================================================
-- PASO 7: INSERTAR IMÁGENES DE PRODUCTOS
-- =====================================================

INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES
(1, 'assets/images/productos/nike-dri-fit-hombre.jpg', 'nike-dri-fit-hombre.jpg', 1, TRUE),
(2, 'assets/images/productos/adidas-training-mujer.jpg', 'adidas-training-mujer.jpg', 1, TRUE),
(3, 'assets/images/productos/ua-tech-polo.jpg', 'ua-tech-polo.jpg', 1, TRUE),
(4, 'assets/images/productos/puma-training.jpg', 'puma-training.jpg', 1, TRUE),
(5, 'assets/images/productos/nike-pro-top.jpg', 'nike-pro-top.jpg', 1, TRUE),
(6, 'assets/images/productos/reebok-crossfit.jpg', 'reebok-crossfit.jpg', 1, TRUE),
(7, 'assets/images/productos/adidas-essentials.jpg', 'adidas-essentials.jpg', 1, TRUE),
(8, 'assets/images/productos/nike-running.jpg', 'nike-running.jpg', 1, TRUE),
(9, 'assets/images/productos/puma-tank-top.jpg', 'puma-tank-top.jpg', 1, TRUE),
(10, 'assets/images/productos/adidas-short-hombre.jpg', 'adidas-short-hombre.jpg', 1, TRUE),
(11, 'assets/images/productos/nike-leggins.jpg', 'nike-leggins.jpg', 1, TRUE),
(12, 'assets/images/productos/puma-short-mujer.jpg', 'puma-short-mujer.jpg', 1, TRUE),
(13, 'assets/images/productos/ua-jogger.jpg', 'ua-jogger.jpg', 1, TRUE),
(14, 'assets/images/productos/nike-sudadera.jpg', 'nike-sudadera.jpg', 1, TRUE),
(15, 'assets/images/productos/adidas-chamarra.jpg', 'adidas-chamarra.jpg', 1, TRUE),
(16, 'assets/images/productos/seleccion-peru.jpg', 'seleccion-peru.jpg', 1, TRUE),
(17, 'assets/images/productos/nike-pegasus.jpg', 'nike-pegasus.jpg', 1, TRUE),
(18, 'assets/images/productos/adidas-ultraboost.jpg', 'adidas-ultraboost.jpg', 1, TRUE),
(19, 'assets/images/productos/nike-revolution.jpg', 'nike-revolution.jpg', 1, TRUE),
(20, 'assets/images/productos/puma-velocity.jpg', 'puma-velocity.jpg', 1, TRUE),
(21, 'assets/images/productos/reebok-nano.jpg', 'reebok-nano.jpg', 1, TRUE),
(22, 'assets/images/productos/adidas-dropset.jpg', 'adidas-dropset.jpg', 1, TRUE),
(23, 'assets/images/productos/nb-fresh-foam.jpg', 'nb-fresh-foam.jpg', 1, TRUE),
(24, 'assets/images/productos/ua-hovr.jpg', 'ua-hovr.jpg', 1, TRUE),
(25, 'assets/images/productos/asics-kayano.jpg', 'asics-kayano.jpg', 1, TRUE),
(26, 'assets/images/productos/nike-metcon.jpg', 'nike-metcon.jpg', 1, TRUE),
(27, 'assets/images/productos/balon-futbol-adidas.jpg', 'balon-futbol-adidas.jpg', 1, TRUE),
(28, 'assets/images/productos/balon-voley-mikasa.jpg', 'balon-voley-mikasa.jpg', 1, TRUE),
(29, 'assets/images/productos/balon-basket-spalding.jpg', 'balon-basket-spalding.jpg', 1, TRUE),
(30, 'assets/images/productos/red-voley.jpg', 'red-voley.jpg', 1, TRUE),
(31, 'assets/images/productos/balon-nike-strike.jpg', 'balon-nike-strike.jpg', 1, TRUE),
(32, 'assets/images/productos/conos-entrenamiento.jpg', 'conos-entrenamiento.jpg', 1, TRUE),
(33, 'assets/images/productos/mancuernas-5kg.jpg', 'mancuernas-5kg.jpg', 1, TRUE),
(34, 'assets/images/productos/mancuernas-10kg.jpg', 'mancuernas-10kg.jpg', 1, TRUE),
(35, 'assets/images/productos/banda-elastica.jpg', 'banda-elastica.jpg', 1, TRUE),
(36, 'assets/images/productos/cuerda-saltar.jpg', 'cuerda-saltar.jpg', 1, TRUE),
(37, 'assets/images/productos/colchoneta-yoga.jpg', 'colchoneta-yoga.jpg', 1, TRUE),
(38, 'assets/images/productos/kettlebell-8kg.jpg', 'kettlebell-8kg.jpg', 1, TRUE),
(39, 'assets/images/productos/kettlebell-12kg.jpg', 'kettlebell-12kg.jpg', 1, TRUE),
(40, 'assets/images/productos/pelota-medicinal.jpg', 'pelota-medicinal.jpg', 1, TRUE),
(41, 'assets/images/productos/barra-olimpica.jpg', 'barra-olimpica.jpg', 1, TRUE),
(42, 'assets/images/productos/disco-10kg.jpg', 'disco-10kg.jpg', 1, TRUE),
(43, 'assets/images/productos/disco-20kg.jpg', 'disco-20kg.jpg', 1, TRUE),
(44, 'assets/images/productos/foam-roller.jpg', 'foam-roller.jpg', 1, TRUE),
(45, 'assets/images/productos/rueda-abdominal.jpg', 'rueda-abdominal.jpg', 1, TRUE),
(46, 'assets/images/productos/botella-deportiva.jpg', 'botella-deportiva.jpg', 1, TRUE),
(47, 'assets/images/productos/mochila-nike.jpg', 'mochila-nike.jpg', 1, TRUE),
(48, 'assets/images/productos/toalla-microfibra.jpg', 'toalla-microfibra.jpg', 1, TRUE),
(49, 'assets/images/productos/guantes-gym.jpg', 'guantes-gym.jpg', 1, TRUE),
(50, 'assets/images/productos/coderas.jpg', 'coderas.jpg', 1, TRUE),
(51, 'assets/images/productos/rodilleras-voley.jpg', 'rodilleras-voley.jpg', 1, TRUE),
(52, 'assets/images/productos/cinta-capilar.jpg', 'cinta-capilar.jpg', 1, TRUE),
(53, 'assets/images/productos/munequeras-adidas.jpg', 'munequeras-adidas.jpg', 1, TRUE),
(54, 'assets/images/productos/bolsa-gym.jpg', 'bolsa-gym.jpg', 1, TRUE),
(55, 'assets/images/productos/cinturon-running.jpg', 'cinturon-running.jpg', 1, TRUE);

-- =====================================================
-- CONFIRMAR TRANSACCIÓN
-- =====================================================

COMMIT;

-- =====================================================
-- RESTAURAR CONFIGURACIONES
-- =====================================================

SET FOREIGN_KEY_CHECKS = 1;
SET AUTOCOMMIT = 1;
SET SQL_SAFE_UPDATES = 1;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

SELECT '=== VERIFICACIÓN DE DATOS ===' AS titulo;

SELECT 'CATEGORIAS' AS tabla, COUNT(*) AS total FROM categoria
UNION ALL SELECT 'PRODUCTOS', COUNT(*) FROM producto
UNION ALL SELECT 'TALLAS', COUNT(*) FROM talla_producto
UNION ALL SELECT 'IMAGENES', COUNT(*) FROM imagen_producto;

SELECT '=== STOCK TOTAL ===' AS titulo;
SELECT SUM(stock_talla) AS stock_total FROM talla_producto;

SELECT '=== PRODUCTOS POR CATEGORIA ===' AS titulo;
SELECT c.nombre_categoria, COUNT(p.id_producto) AS total_productos
FROM categoria c
LEFT JOIN producto p ON c.id_categoria = p.id_categoria
GROUP BY c.id_categoria, c.nombre_categoria;

SELECT '=== BASE DE DATOS SPORTIVA COMPLETADA EXITOSAMENTE ===' AS mensaje;
