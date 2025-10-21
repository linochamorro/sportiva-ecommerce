  // ============================================
  // GENERADOR DE REPORTES EXCEL
  // usando ExcelJS (equivalente a Apache POI). 
  // Genera reportes de productos, ventas, clientes y estadísticas.
  // ============================================

const ExcelJS = require('exceljs');
const logger = require('./logger');

class ExcelGenerator {
  
  // ============================================
  // REPORTE: PRODUCTOS
  // ============================================
  
  static async generarReporteProductos(productos, filtros = {}) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Productos');

      // Metadata
      workbook.creator = 'Sportiva E-commerce';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Estilos
      const headerStyle = {
        font: { name: 'Inter', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } },
        alignment: { vertical: 'middle', horizontal: 'center' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      };

      // Columnas
      worksheet.columns = [
        { header: 'ID', key: 'id_producto', width: 10 },
        { header: 'Nombre', key: 'nombre', width: 30 },
        { header: 'Categoría', key: 'categoria', width: 20 },
        { header: 'Marca', key: 'marca', width: 15 },
        { header: 'Precio', key: 'precio', width: 12 },
        { header: 'Stock Total', key: 'stock', width: 12 },
        { header: 'Estado', key: 'estado', width: 12 },
        { header: 'Rating', key: 'rating', width: 10 }
      ];

      // Aplicar estilo a header
      worksheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });

      // Agregar datos
      productos.forEach((producto) => {
        const row = worksheet.addRow({
          id_producto: producto.id_producto,
          nombre: producto.nombre,
          categoria: producto.categoria,
          marca: producto.marca,
          precio: producto.precio,
          stock: producto.stock_total || 0,
          estado: producto.estado,
          rating: producto.rating_promedio || 0
        });

        // Formato condicional para stock bajo
        if (producto.stock_total < 10) {
          row.getCell('stock').font = { color: { argb: 'FFFF0000' }, bold: true };
        }

        // Formato para precios
        row.getCell('precio').numFmt = 'S/ #,##0.00';
        row.getCell('rating').numFmt = '0.0';
      });

      // Totales
      const totalRow = worksheet.addRow({
        id_producto: '',
        nombre: 'TOTALES',
        categoria: '',
        marca: '',
        precio: { formula: `AVERAGE(E2:E${productos.length + 1})` },
        stock: { formula: `SUM(F2:F${productos.length + 1})` },
        estado: '',
        rating: { formula: `AVERAGE(H2:H${productos.length + 1})` }
      });

      totalRow.font = { bold: true };
      totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF5F5F5' }
      };

      // Filtros automáticos
      worksheet.autoFilter = {
        from: 'A1',
        to: `H${productos.length + 1}`
      };

      logger.info(`Reporte Excel generado: ${productos.length} productos`);
      return workbook;
      
    } catch (error) {
      logger.error('Error generando reporte Excel productos:', error);
      throw error;
    }
  }

  // ============================================
  // REPORTE: VENTAS POR PERÍODO
  // ============================================
  
  static async generarReporteVentas(pedidos, fechaInicio, fechaFin) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Ventas');

      workbook.creator = 'Sportiva E-commerce';
      workbook.created = new Date();

      // Título del reporte
      worksheet.mergeCells('A1:H1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `REPORTE DE VENTAS - ${fechaInicio} a ${fechaFin}`;
      titleCell.font = { size: 14, bold: true, color: { argb: 'FFFF6B35' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(1).height = 30;

      // Headers
      const headerStyle = {
        font: { size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } },
        alignment: { vertical: 'middle', horizontal: 'center' }
      };

      worksheet.columns = [
        { header: 'N° Pedido', key: 'id_pedido', width: 12 },
        { header: 'Fecha', key: 'fecha', width: 15 },
        { header: 'Cliente', key: 'cliente', width: 25 },
        { header: 'Productos', key: 'productos', width: 10 },
        { header: 'Subtotal', key: 'subtotal', width: 12 },
        { header: 'IGV', key: 'igv', width: 12 },
        { header: 'Envío', key: 'envio', width: 12 },
        { header: 'Total', key: 'total', width: 12 }
      ];

      worksheet.getRow(2).eachCell((cell) => {
        cell.style = headerStyle;
      });

      // Datos
      let totalVentas = 0;
      let totalIGV = 0;
      let totalEnvio = 0;

      pedidos.forEach((pedido) => {
        const subtotal = pedido.monto_subtotal || 0;
        const igv = pedido.monto_igv || 0;
        const envio = pedido.monto_envio || 0;
        const total = pedido.monto_total || 0;

        worksheet.addRow({
          id_pedido: pedido.id_pedido,
          fecha: new Date(pedido.fecha_pedido).toLocaleDateString('es-PE'),
          cliente: `${pedido.cliente_nombre} ${pedido.cliente_apellido}`,
          productos: pedido.cantidad_items || 0,
          subtotal: subtotal,
          igv: igv,
          envio: envio,
          total: total
        });

        totalVentas += subtotal;
        totalIGV += igv;
        totalEnvio += envio;
      });

      // Formatear monedas
      worksheet.getColumn('subtotal').numFmt = 'S/ #,##0.00';
      worksheet.getColumn('igv').numFmt = 'S/ #,##0.00';
      worksheet.getColumn('envio').numFmt = 'S/ #,##0.00';
      worksheet.getColumn('total').numFmt = 'S/ #,##0.00';

      // Fila de totales
      const lastRow = pedidos.length + 3;
      const totalRow = worksheet.addRow({
        id_pedido: '',
        fecha: '',
        cliente: 'TOTALES',
        productos: { formula: `SUM(D3:D${lastRow - 1})` },
        subtotal: { formula: `SUM(E3:E${lastRow - 1})` },
        igv: { formula: `SUM(F3:F${lastRow - 1})` },
        envio: { formula: `SUM(G3:G${lastRow - 1})` },
        total: { formula: `SUM(H3:H${lastRow - 1})` }
      });

      totalRow.font = { bold: true, size: 12 };
      totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF6B35' }
      };
      totalRow.font.color = { argb: 'FFFFFFFF' };

      // Estadísticas adicionales
      worksheet.addRow([]);
      worksheet.addRow(['ESTADÍSTICAS', '', '', '', '', '', '', '']);
      worksheet.addRow(['Total Pedidos:', pedidos.length]);
      worksheet.addRow(['Ticket Promedio:', { formula: `H${lastRow}/A${lastRow + 2}` }]);
      worksheet.getCell(`B${lastRow + 4}`).numFmt = 'S/ #,##0.00';

      logger.info(`Reporte ventas generado: ${pedidos.length} pedidos`);
      return workbook;
      
    } catch (error) {
      logger.error('Error generando reporte ventas:', error);
      throw error;
    }
  }

  // ============================================
  // REPORTE: INVENTARIO
  // ============================================
  
  static async generarReporteInventario(productos) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Inventario');

      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Producto', key: 'nombre', width: 30 },
        { header: 'Talla', key: 'talla', width: 10 },
        { header: 'Stock', key: 'stock', width: 10 },
        { header: 'Estado', key: 'estado', width: 15 },
        { header: 'Precio Unitario', key: 'precio', width: 15 },
        { header: 'Valor Total', key: 'valor_total', width: 15 }
      ];

      // Datos con tallas
      productos.forEach((producto) => {
        if (producto.tallas && producto.tallas.length > 0) {
          producto.tallas.forEach((talla) => {
            const valorTotal = talla.stock_talla * producto.precio;
            const estado = talla.stock_talla === 0 ? 'SIN STOCK' :
                          talla.stock_talla < 5 ? 'STOCK BAJO' : 'OK';

            const row = worksheet.addRow({
              id: producto.id_producto,
              nombre: producto.nombre,
              talla: talla.talla,
              stock: talla.stock_talla,
              estado: estado,
              precio: producto.precio,
              valor_total: valorTotal
            });

            // Formato condicional
            if (estado === 'SIN STOCK') {
              row.getCell('estado').fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFF0000' }
              };
              row.getCell('estado').font = { color: { argb: 'FFFFFFFF' }, bold: true };
            } else if (estado === 'STOCK BAJO') {
              row.getCell('estado').fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFFF00' }
              };
            }

            row.getCell('precio').numFmt = 'S/ #,##0.00';
            row.getCell('valor_total').numFmt = 'S/ #,##0.00';
          });
        }
      });

      logger.info('Reporte inventario generado');
      return workbook;
      
    } catch (error) {
      logger.error('Error generando reporte inventario:', error);
      throw error;
    }
  }

  // ============================================
  // REPORTE: CLIENTES
  // ============================================
  
  static async generarReporteClientes(clientes) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Clientes');

      worksheet.columns = [
        { header: 'ID', key: 'id_cliente', width: 10 },
        { header: 'Nombre Completo', key: 'nombre', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Teléfono', key: 'telefono', width: 15 },
        { header: 'Total Pedidos', key: 'total_pedidos', width: 15 },
        { header: 'Total Gastado', key: 'total_gastado', width: 15 },
        { header: 'Fecha Registro', key: 'fecha_registro', width: 15 }
      ];

      clientes.forEach((cliente) => {
        worksheet.addRow({
          id_cliente: cliente.id_cliente,
          nombre: `${cliente.nombre} ${cliente.apellido}`,
          email: cliente.email,
          telefono: cliente.telefono || 'N/A',
          total_pedidos: cliente.total_pedidos || 0,
          total_gastado: cliente.total_gastado || 0,
          fecha_registro: new Date(cliente.fecha_registro).toLocaleDateString('es-PE')
        });
      });

      worksheet.getColumn('total_gastado').numFmt = 'S/ #,##0.00';

      logger.info(`Reporte clientes generado: ${clientes.length} clientes`);
      return workbook;
      
    } catch (error) {
      logger.error('Error generando reporte clientes:', error);
      throw error;
    }
  }

  // ============================================
  // UTILIDAD: ESCRIBIR ARCHIVO
  // ============================================
  
  static async escribirArchivo(workbook, nombreArchivo) {
    try {
      const buffer = await workbook.xlsx.writeBuffer();
      logger.info(`Archivo Excel generado: ${nombreArchivo}`);
      return buffer;
    } catch (error) {
      logger.error('Error escribiendo archivo Excel:', error);
      throw error;
    }
  }
}

module.exports = ExcelGenerator;