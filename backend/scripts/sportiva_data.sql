-- =====================================================
-- SPORTIVA E-COMMERCE - SCRIPT DE DATOS DEFINITIVO
-- Análisis completo - Sin errores anticipados
-- Compatible con MariaDB 10.4 (XAMPP)
-- =====================================================

USE sportiva_db;

SET FOREIGN_KEY_CHECKS = 0;
SET AUTOCOMMIT = 0;
START TRANSACTION;

-- =====================================================
-- PASO 1: ELIMINAR TRIGGER PROBLEMÁTICO
-- =====================================================

DROP TRIGGER IF EXISTS AsegurarTallaUnica;

-- =====================================================  
-- PASO 2: LIMPIAR DATOS EXISTENTES (ORDEN CORRECTO)
-- =====================================================

-- Orden inverso a las foreign keys
DELETE FROM imagen_producto;
DELETE FROM auditoria_stock;
DELETE FROM talla_producto;
DELETE FROM resena;
DELETE FROM detalle_pedido;
DELETE FROM detalle_carrito;
DELETE FROM pago;
DELETE FROM pedido;
DELETE FROM carrito;
DELETE FROM direccion_envio;
DELETE FROM sesion;
DELETE FROM cliente;
DELETE FROM producto;
DELETE FROM categoria;

-- Resetear AUTO_INCREMENT
ALTER TABLE categoria AUTO_INCREMENT = 1;
ALTER TABLE producto AUTO_INCREMENT = 1;
ALTER TABLE talla_producto AUTO_INCREMENT = 1;
ALTER TABLE imagen_producto AUTO_INCREMENT = 1;

-- =====================================================
-- PASO 3: INSERTAR CATEGORIAS (SIN IDs)
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

INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Camiseta Nike Dri-FIT Hombre', 'Camiseta deportiva de alto rendimiento con tecnologia Dri-FIT', 89.9, 1, 'Nike', 'NIKE-CAM-H-001', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Camiseta Adidas Training Mujer', 'Camiseta deportiva para mujer con tecnologia Climalite', 71.91, 1, 'Adidas', 'ADID-CAM-M-002', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Polo Under Armour Tech Hombre', 'Polo deportivo de manga corta con tejido ultra ligero', 95.0, 1, 'Under Armour', 'UA-POL-H-003', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Camiseta Puma Training Hombre', 'Camiseta deportiva con tecnologia dryCELL', 59.42, 1, 'Puma', 'PUMA-CAM-H-004', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Top Deportivo Nike Pro Mujer', 'Top deportivo de soporte medio ideal para yoga', 119.0, 1, 'Nike', 'NIKE-TOP-M-005', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Camiseta Reebok CrossFit Hombre', 'Camiseta tecnica disenada para CrossFit', 68.0, 1, 'Reebok', 'REEB-CAM-H-006', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Polera Adidas Essentials Mujer', 'Polera deportiva de algodon con logo de Adidas', 65.0, 1, 'Adidas', 'ADID-POL-M-007', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Camiseta Nike Running Dri-FIT', 'Camiseta de running con diseno reflectante', 99.9, 1, 'Nike', 'NIKE-RUN-H-008', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Tank Top Puma Studio Mujer', 'Camiseta sin mangas ideal para yoga y pilates', 41.25, 1, 'Puma', 'PUMA-TAN-M-009', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Short Adidas Training Hombre', 'Short deportivo con tecnologia Climalite', 75.0, 1, 'Adidas', 'ADID-SHO-H-010', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Leggins Nike Swoosh Mujer', 'Mallas deportivas de longitud completa', 139.0, 1, 'Nike', 'NIKE-LEG-M-011', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Short Puma Active Mujer', 'Short deportivo de cintura elastica', 53.91, 1, 'Puma', 'PUMA-SHO-M-012', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Pantalon Under Armour Jogger', 'Pantalon deportivo tipo jogger', 189.0, 1, 'Under Armour', 'UA-PAN-H-013', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Sudadera Nike Sportswear', 'Sudadera con capucha y cierre completo', 143.65, 1, 'Nike', 'NIKE-SUD-H-014', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Chamarra Adidas Own The Run', 'Chamarra cortavientos con capucha plegable', 199.0, 1, 'Adidas', 'ADID-CHA-M-015', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Camiseta Seleccion Peru 2025', 'Camiseta oficial de la seleccion peruana', 149.0, 1, 'Marathon', 'MARA-SEL-PER-052', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Zapatillas Nike Air Zoom Pegasus', 'Zapatillas de running con amortiguacion Air Zoom', 449.0, 2, 'Nike', 'NIKE-ZAP-H-016', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Zapatillas Adidas Ultraboost', 'Zapatillas premium con tecnologia Boost', 539.1, 2, 'Adidas', 'ADID-ULT-H-017', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Zapatillas Nike Revolution Mujer', 'Zapatillas versatiles para entrenamiento', 229.0, 2, 'Nike', 'NIKE-REV-M-018', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Zapatillas Puma Velocity Nitro', 'Zapatillas de running con espuma Nitro', 339.15, 2, 'Puma', 'PUMA-VEL-H-019', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Zapatillas Reebok Nano X2', 'Zapatillas disenadas para CrossFit', 469.0, 2, 'Reebok', 'REEB-NAN-H-020', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Zapatillas Adidas Dropset Trainer', 'Zapatillas de entrenamiento con plataforma estable', 379.0, 2, 'Adidas', 'ADID-DRO-M-021', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Zapatillas New Balance Fresh Foam', 'Zapatillas con espuma Fresh Foam X', 335.2, 2, 'New Balance', 'NB-FRE-H-022', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Zapatillas Under Armour HOVR', 'Zapatillas de running con tecnologia HOVR', 449.0, 2, 'Under Armour', 'UA-HOV-M-023', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Zapatillas Asics Gel-Kayano', 'Zapatillas premium para corredores', 599.0, 2, 'Asics', 'ASIC-KAY-H-024', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Zapatillas Nike Metcon 8', 'Zapatillas de entrenamiento funcional', 519.0, 2, 'Nike', 'NIKE-MET-H-025', 1, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Balon Futbol Adidas Tango', 'Balon de futbol profesional certificado FIFA', 89.0, 3, 'Adidas', 'ADID-BAL-FUT-026', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Balon Voley Mikasa MVA200', 'Balon oficial de voleibol FIVB', 129.0, 3, 'Mikasa', 'MIKA-BAL-VOL-027', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Balon Basquet Spalding NBA', 'Balon oficial de basquetbol NBA', 134.1, 3, 'Spalding', 'SPAL-BAL-BAS-028', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Red de Voley Profesional', 'Red de voleibol profesional con cables de acero', 249.0, 3, 'Wilson', 'WILS-RED-VOL-030', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Balon Nike Strike', 'Balon de entrenamiento con graficos de alto contraste', 75.0, 3, 'Nike', 'NIKE-BAL-STR-051', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Conos de Entrenamiento x12', 'Set de 12 conos de entrenamiento de colores', 39.0, 4, 'Generico', 'GEN-CON-ENT-029', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Mancuernas Hexagonales 5kg Par', 'Par de mancuernas hexagonales con recubrimiento', 89.0, 4, 'York', 'YORK-MAN-5KG-031', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Mancuernas Hexagonales 10kg Par', 'Par de mancuernas hexagonales de 10kg', 149.0, 4, 'York', 'YORK-MAN-10KG-032', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Banda Elastica de Resistencia', 'Set de 5 bandas elasticas con diferentes niveles', 67.15, 4, 'TheraBand', 'THER-BAN-SET-033', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Cuerda para Saltar Profesional', 'Cuerda de saltar ajustable con rodamientos', 45.0, 4, 'RDX', 'RDX-CUE-SAL-034', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Colchoneta Yoga 6mm', 'Colchoneta de yoga antideslizante de 6mm', 99.0, 4, 'Manduka', 'MAND-COL-YOG-035', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Kettlebell 8kg', 'Pesa rusa de hierro fundido de 8kg', 119.0, 4, 'Rogue', 'ROGU-KET-8KG-036', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Kettlebell 12kg', 'Pesa rusa de hierro fundido de 12kg', 159.0, 4, 'Rogue', 'ROGU-KET-12KG-037', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Pelota Medicinal 5kg', 'Balon medicinal con superficie texturizada', 76.0, 4, 'Reebok', 'REEB-MED-5KG-038', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Barra Olimpica 20kg', 'Barra olimpica de acero cromado de 2.2m', 449.0, 4, 'Rogue', 'ROGU-BAR-OLI-039', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Discos Olimpicos 10kg Par', 'Par de discos olimpicos de goma de 10kg', 229.0, 4, 'York', 'YORK-DIS-10KG-040', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Pelota Pilates 65cm', 'Pelota suiza para pilates y ejercicios', 89.0, 4, 'TRX', 'TRX-PIL-65CM-053', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Foam Roller 90cm', 'Rodillo de espuma para masaje muscular', 79.2, 4, 'TriggerPoint', 'TRIG-FOA-90CM-054', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Step Aerobico Ajustable', 'Plataforma de step con 3 niveles de altura', 169.0, 4, 'Reebok', 'REEB-STE-ADJ-055', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Botella de Agua 500ml', 'Botella deportiva con tapa anti-goteo libre de BPA', 35.0, 5, 'CamelBak', 'CAME-BOT-500-041', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Botella de Agua 750ml', 'Botella deportiva con aislamiento termico', 79.0, 5, 'Hydro Flask', 'HYDR-BOT-750-042', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Guantes de Gimnasio', 'Guantes deportivos con soporte de muneca', 53.1, 5, 'Harbinger', 'HARB-GUA-GYM-043', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Cinturon Levantamiento', 'Cinturon de levantamiento de cuero con hebilla doble', 129.0, 5, 'Generico', 'GEN-CIN-LEV-044', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Mochila Deportiva Nike Brasilia', 'Mochila deportiva con capacidad de 30L', 119.0, 5, 'Nike', 'NIKE-MOCH-BRA-045', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Toalla Deportiva Microfibra', 'Toalla deportiva de secado rapido', 39.0, 5, 'Generico', 'GEN-TOA-MIC-046', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Rodilleras Nike Pro Elite', 'Par de rodilleras con compresion graduada', 75.65, 5, 'Nike', 'NIKE-ROD-PRO-047', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Coderas Deportivas Compression', 'Par de coderas con compresion', 69.0, 5, 'McDavid', 'MCDA-COD-COM-048', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Cronometro Digital Deportivo', 'Cronometro digital con memoria de 10 vueltas', 55.0, 5, 'Casio', 'CASI-CRO-DIG-049', 0, 'Activo');
INSERT INTO producto (nombre_producto, descripcion, precio, id_categoria, marca, sku, tiene_tallas, estado_producto) VALUES ('Pulsera Deportiva Ajustable', 'Set de 2 pulseras absorbentes de sudor', 29.0, 5, 'Nike', 'NIKE-PUL-DEP-050', 0, 'Activo');

-- =====================================================
-- PASO 5: INSERTAR TALLAS Y STOCK
-- =====================================================

INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (1, 'S', 25);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (1, 'M', 35);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (1, 'L', 30);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (1, 'XL', 20);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (1, 'XXL', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (2, 'S', 20);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (2, 'M', 30);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (2, 'L', 25);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (2, 'XL', 18);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (2, 'XXL', 12);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (3, 'S', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (3, 'M', 25);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (3, 'L', 30);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (3, 'XL', 20);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (3, 'XXL', 10);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (4, 'S', 20);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (4, 'M', 28);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (4, 'L', 25);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (4, 'XL', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (5, 'S', 18);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (5, 'M', 25);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (5, 'L', 22);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (5, 'XL', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (6, 'S', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (6, 'M', 25);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (6, 'L', 20);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (6, 'XL', 12);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (7, 'S', 22);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (7, 'M', 30);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (7, 'L', 25);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (7, 'XL', 18);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (8, 'S', 20);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (8, 'M', 30);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (8, 'L', 28);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (8, 'XL', 22);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (8, 'XXL', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (9, 'S', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (9, 'M', 22);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (9, 'L', 20);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (9, 'XL', 12);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (10, 'S', 18);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (10, 'M', 25);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (10, 'L', 30);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (10, 'XL', 20);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (10, 'XXL', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (11, 'S', 20);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (11, 'M', 28);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (11, 'L', 25);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (11, 'XL', 20);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (11, 'XXL', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (12, 'S', 16);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (12, 'M', 24);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (12, 'L', 20);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (12, 'XL', 14);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (13, 'S', 12);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (13, 'M', 20);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (13, 'L', 25);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (13, 'XL', 18);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (13, 'XXL', 10);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (14, 'S', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (14, 'M', 22);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (14, 'L', 20);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (14, 'XL', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (14, 'XXL', 10);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (15, 'S', 10);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (15, 'M', 18);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (15, 'L', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (15, 'XL', 12);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (16, 'S', 30);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (16, 'M', 40);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (16, 'L', 35);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (16, 'XL', 25);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (16, 'XXL', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (17, '36', 8);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (17, '37', 10);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (17, '38', 12);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (17, '39', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (17, '40', 18);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (17, '41', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (17, '42', 12);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (17, '43', 10);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (17, '44', 8);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (18, '36', 6);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (18, '37', 8);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (18, '38', 10);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (18, '39', 12);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (18, '40', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (18, '41', 12);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (18, '42', 10);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (18, '43', 8);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (18, '44', 6);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (19, '36', 10);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (19, '37', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (19, '38', 18);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (19, '39', 20);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (19, '40', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (19, '41', 10);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (19, '42', 8);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (20, '36', 8);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (20, '37', 12);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (20, '38', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (20, '39', 18);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (20, '40', 20);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (20, '41', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (20, '42', 10);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (20, '43', 8);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (21, '36', 6);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (21, '37', 10);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (21, '38', 12);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (21, '39', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (21, '40', 12);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (21, '41', 10);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (21, '42', 8);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (21, '43', 6);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (22, '36', 10);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (22, '37', 12);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (22, '38', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (22, '39', 18);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (22, '40', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (22, '41', 10);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (23, '36', 8);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (23, '37', 10);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (23, '38', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (23, '39', 18);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (23, '40', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (23, '41', 12);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (23, '42', 10);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (23, '43', 8);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (24, '36', 8);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (24, '37', 12);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (24, '38', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (24, '39', 18);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (24, '40', 12);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (24, '41', 10);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (25, '36', 6);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (25, '37', 8);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (25, '38', 10);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (25, '39', 12);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (25, '40', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (25, '41', 12);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (25, '42', 10);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (25, '43', 8);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (25, '44', 6);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (26, '36', 8);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (26, '37', 12);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (26, '38', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (26, '39', 18);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (26, '40', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (26, '41', 12);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (26, '42', 10);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (27, 'UNICA', 35);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (28, 'UNICA', 25);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (29, 'UNICA', 30);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (30, 'UNICA', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (31, 'UNICA', 40);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (32, 'UNICA', 50);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (33, 'UNICA', 40);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (34, 'UNICA', 35);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (35, 'UNICA', 60);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (36, 'UNICA', 70);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (37, 'UNICA', 45);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (38, 'UNICA', 30);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (39, 'UNICA', 25);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (40, 'UNICA', 35);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (41, 'UNICA', 15);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (42, 'UNICA', 20);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (43, 'UNICA', 100);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (44, 'UNICA', 60);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (45, 'UNICA', 80);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (46, 'UNICA', 40);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (47, 'UNICA', 50);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (48, 'UNICA', 90);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (49, 'UNICA', 45);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (50, 'UNICA', 55);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (51, 'UNICA', 40);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (52, 'UNICA', 35);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (53, 'UNICA', 45);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (54, 'UNICA', 20);
INSERT INTO talla_producto (id_producto, talla, stock_talla) VALUES (55, 'UNICA', 120);


-- =====================================================
-- PASO 6: INSERTAR IMAGENES (RUTAS Y NOMBRES CORREGIDOS)
-- =====================================================

INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (1, 'frontend/assets/images/productos/camiseta-nike-dri-fit-negra.jpg', 'camiseta-nike-dri-fit-negra.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (1, 'frontend/assets/images/productos/camiseta-nike-dri-fit-negra-2.jpg', 'camiseta-nike-dri-fit-negra-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (2, 'frontend/assets/images/productos/camiseta-adidas-mujer-azul.jpg', 'camiseta-adidas-mujer-azul.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (2, 'frontend/assets/images/productos/camiseta-adidas-mujer-azul-2.jpg', 'camiseta-adidas-mujer-azul-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (3, 'frontend/assets/images/productos/polo-under-armour-gris.jpg', 'polo-under-armour-gris.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (3, 'frontend/assets/images/productos/polo-under-armour-gris-2.jpg', 'polo-under-armour-gris-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (4, 'frontend/assets/images/productos/camiseta-puma-verde.jpg', 'camiseta-puma-verde.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (4, 'frontend/assets/images/productos/camiseta-puma-verde-2.jpg', 'camiseta-puma-verde-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (5, 'frontend/assets/images/productos/top-nike-negro.jpg', 'top-nike-negro.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (5, 'frontend/assets/images/productos/top-nike-negro-2.jpg', 'top-nike-negro-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (6, 'frontend/assets/images/productos/camiseta-reebok-crossfit.jpg', 'camiseta-reebok-crossfit.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (6, 'frontend/assets/images/productos/camiseta-reebok-crossfit-2.jpg', 'camiseta-reebok-crossfit-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (7, 'frontend/assets/images/productos/polera-adidas-rosa.jpg', 'polera-adidas-rosa.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (7, 'frontend/assets/images/productos/polera-adidas-rosa-2.jpg', 'polera-adidas-rosa-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (8, 'frontend/assets/images/productos/camiseta-nike-running.jpg', 'camiseta-nike-running.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (8, 'frontend/assets/images/productos/camiseta-nike-running-2.jpg', 'camiseta-nike-running-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (9, 'frontend/assets/images/productos/tank-top-puma-celeste.jpg', 'tank-top-puma-celeste.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (9, 'frontend/assets/images/productos/tank-top-puma-celeste-2.jpg', 'tank-top-puma-celeste-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (10, 'frontend/assets/images/productos/short-adidas-negro.jpg', 'short-adidas-negro.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (10, 'frontend/assets/images/productos/short-adidas-negro-2.jpg', 'short-adidas-negro-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (11, 'frontend/assets/images/productos/leggins-nike-negro.jpg', 'leggins-nike-negro.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (11, 'frontend/assets/images/productos/leggins-nike-negro-2.jpg', 'leggins-nike-negro-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (12, 'frontend/assets/images/productos/short-puma-rosa.jpg', 'short-puma-rosa.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (12, 'frontend/assets/images/productos/short-puma-rosa-2.jpg', 'short-puma-rosa-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (13, 'frontend/assets/images/productos/pantalon-ua-negro.jpg', 'pantalon-ua-negro.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (13, 'frontend/assets/images/productos/pantalon-ua-negro-2.jpg', 'pantalon-ua-negro-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (14, 'frontend/assets/images/productos/sudadera-nike-gris.jpg', 'sudadera-nike-gris.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (14, 'frontend/assets/images/productos/sudadera-nike-gris-2.jpg', 'sudadera-nike-gris-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (15, 'frontend/assets/images/productos/chamarra-adidas-verde.jpg', 'chamarra-adidas-verde.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (15, 'frontend/assets/images/productos/chamarra-adidas-verde-2.jpg', 'chamarra-adidas-verde-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (16, 'frontend/assets/images/productos/zapatillas-nike-pegasus.jpg', 'zapatillas-nike-pegasus.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (16, 'frontend/assets/images/productos/zapatillas-nike-pegasus-2.jpg', 'zapatillas-nike-pegasus-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (17, 'frontend/assets/images/productos/zapatillas-adidas-ultraboost.jpg', 'zapatillas-adidas-ultraboost.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (17, 'frontend/assets/images/productos/zapatillas-adidas-ultraboost-2.jpg', 'zapatillas-adidas-ultraboost-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (18, 'frontend/assets/images/productos/zapatillas-nike-revolution-mujer.jpg', 'zapatillas-nike-revolution-mujer.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (18, 'frontend/assets/images/productos/zapatillas-nike-revolution-mujer-2.jpg', 'zapatillas-nike-revolution-mujer-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (19, 'frontend/assets/images/productos/zapatillas-puma-velocity.jpg', 'zapatillas-puma-velocity.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (19, 'frontend/assets/images/productos/zapatillas-puma-velocity-2.jpg', 'zapatillas-puma-velocity-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (20, 'frontend/assets/images/productos/zapatillas-reebok-nano.jpg', 'zapatillas-reebok-nano.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (20, 'frontend/assets/images/productos/zapatillas-reebok-nano-2.jpg', 'zapatillas-reebok-nano-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (21, 'frontend/assets/images/productos/zapatillas-adidas-dropset.jpg', 'zapatillas-adidas-dropset.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (21, 'frontend/assets/images/productos/zapatillas-adidas-dropset-2.jpg', 'zapatillas-adidas-dropset-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (22, 'frontend/assets/images/productos/zapatillas-nb-fresh-foam.jpg', 'zapatillas-nb-fresh-foam.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (22, 'frontend/assets/images/productos/zapatillas-nb-fresh-foam-2.jpg', 'zapatillas-nb-fresh-foam-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (23, 'frontend/assets/images/productos/zapatillas-ua-hovr-mujer.jpg', 'zapatillas-ua-hovr-mujer.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (23, 'frontend/assets/images/productos/zapatillas-ua-hovr-mujer-2.jpg', 'zapatillas-ua-hovr-mujer-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (24, 'frontend/assets/images/productos/zapatillas-asics-kayano.jpg', 'zapatillas-asics-kayano.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (24, 'frontend/assets/images/productos/zapatillas-asics-kayano-2.jpg', 'zapatillas-asics-kayano-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (25, 'frontend/assets/images/productos/zapatillas-nike-metcon.jpg', 'zapatillas-nike-metcon.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (25, 'frontend/assets/images/productos/zapatillas-nike-metcon-2.jpg', 'zapatillas-nike-metcon-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (26, 'frontend/assets/images/productos/balon-futbol-adidas.jpg', 'balon-futbol-adidas.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (26, 'frontend/assets/images/productos/balon-futbol-adidas-2.jpg', 'balon-futbol-adidas-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (27, 'frontend/assets/images/productos/balon-voley-mikasa.jpg', 'balon-voley-mikasa.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (27, 'frontend/assets/images/productos/balon-voley-mikasa-2.jpg', 'balon-voley-mikasa-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (28, 'frontend/assets/images/productos/balon-basquet-spalding.jpg', 'balon-basquet-spalding.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (28, 'frontend/assets/images/productos/balon-basquet-spalding-2.jpg', 'balon-basquet-spalding-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (29, 'frontend/assets/images/productos/conos-entrenamiento.jpg', 'conos-entrenamiento.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (29, 'frontend/assets/images/productos/conos-entrenamiento-2.jpg', 'conos-entrenamiento-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (30, 'frontend/assets/images/productos/red-voley-profesional.jpg', 'red-voley-profesional.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (30, 'frontend/assets/images/productos/red-voley-profesional-2.jpg', 'red-voley-profesional-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (31, 'frontend/assets/images/productos/mancuernas-5kg.jpg', 'mancuernas-5kg.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (31, 'frontend/assets/images/productos/mancuernas-5kg-2.jpg', 'mancuernas-5kg-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (32, 'frontend/assets/images/productos/mancuernas-10kg.jpg', 'mancuernas-10kg.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (32, 'frontend/assets/images/productos/mancuernas-10kg-2.jpg', 'mancuernas-10kg-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (33, 'frontend/assets/images/productos/banda-resistencia.jpg', 'banda-resistencia.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (33, 'frontend/assets/images/productos/banda-resistencia-2.jpg', 'banda-resistencia-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (34, 'frontend/assets/images/productos/cuerda-saltar.jpg', 'cuerda-saltar.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (34, 'frontend/assets/images/productos/cuerda-saltar-2.jpg', 'cuerda-saltar-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (35, 'frontend/assets/images/productos/colchoneta-yoga.jpg', 'colchoneta-yoga.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (35, 'frontend/assets/images/productos/colchoneta-yoga-2.jpg', 'colchoneta-yoga-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (36, 'frontend/assets/images/productos/kettlebell-8kg.jpg', 'kettlebell-8kg.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (36, 'frontend/assets/images/productos/kettlebell-8kg-2.jpg', 'kettlebell-8kg-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (37, 'frontend/assets/images/productos/kettlebell-12kg.jpg', 'kettlebell-12kg.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (37, 'frontend/assets/images/productos/kettlebell-12kg-2.jpg', 'kettlebell-12kg-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (38, 'frontend/assets/images/productos/pelota-medicinal-5kg.jpg', 'pelota-medicinal-5kg.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (38, 'frontend/assets/images/productos/pelota-medicinal-5kg-2.jpg', 'pelota-medicinal-5kg-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (39, 'frontend/assets/images/productos/barra-olimpica.jpg', 'barra-olimpica.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (39, 'frontend/assets/images/productos/barra-olimpica-2.jpg', 'barra-olimpica-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (40, 'frontend/assets/images/productos/discos-olimpicos-10kg.jpg', 'discos-olimpicos-10kg.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (40, 'frontend/assets/images/productos/discos-olimpicos-10kg-2.jpg', 'discos-olimpicos-10kg-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (41, 'frontend/assets/images/productos/botella-agua-500ml.jpg', 'botella-agua-500ml.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (41, 'frontend/assets/images/productos/botella-agua-500ml-2.jpg', 'botella-agua-500ml-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (42, 'frontend/assets/images/productos/botella-agua-750ml.jpg', 'botella-agua-750ml.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (42, 'frontend/assets/images/productos/botella-agua-750ml-2.jpg', 'botella-agua-750ml-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (43, 'frontend/assets/images/productos/guantes-gym.jpg', 'guantes-gym.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (43, 'frontend/assets/images/productos/guantes-gym-2.jpg', 'guantes-gym-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (44, 'frontend/assets/images/productos/cinturon-levantamiento.jpg', 'cinturon-levantamiento.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (44, 'frontend/assets/images/productos/cinturon-levantamiento-2.jpg', 'cinturon-levantamiento-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (45, 'frontend/assets/images/productos/mochila-nike-brasilia.jpg', 'mochila-nike-brasilia.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (45, 'frontend/assets/images/productos/mochila-nike-brasilia-2.jpg', 'mochila-nike-brasilia-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (46, 'frontend/assets/images/productos/toalla-microfibra.jpg', 'toalla-microfibra.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (46, 'frontend/assets/images/productos/toalla-microfibra-2.jpg', 'toalla-microfibra-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (47, 'frontend/assets/images/productos/rodilleras-nike.jpg', 'rodilleras-nike.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (47, 'frontend/assets/images/productos/rodilleras-nike-2.jpg', 'rodilleras-nike-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (48, 'frontend/assets/images/productos/coderas-compression.jpg', 'coderas-compression.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (48, 'frontend/assets/images/productos/coderas-compression-2.jpg', 'coderas-compression-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (49, 'frontend/assets/images/productos/cronometro-digital.jpg', 'cronometro-digital.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (49, 'frontend/assets/images/productos/cronometro-digital-2.jpg', 'cronometro-digital-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (50, 'frontend/assets/images/productos/pulsera-deportiva.jpg', 'pulsera-deportiva.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (50, 'frontend/assets/images/productos/pulsera-deportiva-2.jpg', 'pulsera-deportiva-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (51, 'frontend/assets/images/productos/balon-nike-strike.jpg', 'balon-nike-strike.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (51, 'frontend/assets/images/productos/balon-nike-strike-2.jpg', 'balon-nike-strike-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (52, 'frontend/assets/images/productos/camiseta-seleccion-peru.jpg', 'camiseta-seleccion-peru.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (52, 'frontend/assets/images/productos/camiseta-seleccion-peru-2.jpg', 'camiseta-seleccion-peru-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (53, 'frontend/assets/images/productos/pelota-pilates-65cm.jpg', 'pelota-pilates-65cm.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (53, 'frontend/assets/images/productos/pelota-pilates-65cm-2.jpg', 'pelota-pilates-65cm-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (54, 'frontend/assets/images/productos/foam-roller-90cm.jpg', 'foam-roller-90cm.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (54, 'frontend/assets/images/productos/foam-roller-90cm-2.jpg', 'foam-roller-90cm-2.jpg', 2, 0);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (55, 'frontend/assets/images/productos/step-aerobico.jpg', 'step-aerobico.jpg', 1, 1);
INSERT INTO imagen_producto (id_producto, url_imagen, nombre_archivo, orden_imagen, es_principal) VALUES (55, 'frontend/assets/images/productos/step-aerobico-2.jpg', 'step-aerobico-2.jpg', 2, 0);

-- PASO 7: RECREAR TRIGGER
-- =====================================================

DELIMITER $$

CREATE TRIGGER AsegurarTallaUnica 
AFTER INSERT ON PRODUCTO 
FOR EACH ROW
BEGIN
    IF NEW.tiene_tallas = FALSE THEN
        INSERT INTO TALLA_PRODUCTO (id_producto, talla, stock_talla) 
        VALUES (NEW.id_producto, 'UNICA', 0);
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- PASO 8: COMMIT Y VERIFICACION
-- =====================================================

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
SET AUTOCOMMIT = 1;

-- Verificacion de datos
SELECT 'CATEGORIAS' AS tabla, COUNT(*) AS total FROM categoria
UNION ALL SELECT 'PRODUCTOS', COUNT(*) FROM producto
UNION ALL SELECT 'TALLAS', COUNT(*) FROM talla_producto
UNION ALL SELECT 'IMAGENES', COUNT(*) FROM imagen_producto;

-- Stock total
SELECT SUM(stock_talla) AS stock_total FROM talla_producto;

-- Productos por categoria
SELECT c.nombre_categoria, COUNT(p.id_producto) AS total_productos
FROM categoria c
LEFT JOIN producto p ON c.id_categoria = p.id_categoria
GROUP BY c.id_categoria;

SELECT '=== BASE DE DATOS SPORTIVA COMPLETADA EXITOSAMENTE ===' AS mensaje;
