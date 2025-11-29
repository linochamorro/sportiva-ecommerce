// ============================================
// GENERADOR DE PDFs usando PDFKit para facturas, boletas y reportes.
// ============================================

const PDFDocument = require('pdfkit');
const logger = require('./logger');

class PDFGenerator {
  
  // ============================================
  // FACTURA / BOLETA
  // ============================================
  
  static generarFactura(pedido, cliente, detalles, tipo = 'boleta') {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4', 
          margin: 50,
          info: {
            Title: `${tipo === 'factura' ? 'Factura' : 'Boleta'} Electrónica`,
            Author: 'Sportiva E-commerce',
            Subject: `Comprobante de Pago N° ${pedido.id_pedido}`
          }
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // ============================================
        // HEADER - LOGO Y DATOS EMPRESA
        // ============================================
        
        doc.fontSize(24)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text('SPORTIVA', 50, 50);

        doc.fontSize(10)
            .fillColor('#767676')
            .font('Helvetica')
            .text('E-commerce de Implementos Deportivos', 50, 80)
            .text('RUC: 20123456789', 50, 95)
            .text('Av. Los Deportes 123, Lima - Perú', 50, 110)
            .text('Teléfono: (01) 234-5678', 50, 125)
            .text('Email: ventas@sportiva.pe', 50, 140);

        // ============================================
        // BOX FACTURA/BOLETA
        // ============================================
        
        const boxX = 400;
        const boxY = 50;
        const boxWidth = 145;
        const boxHeight = 90;

        doc.rect(boxX, boxY, boxWidth, boxHeight)
            .fillAndStroke('#FF6B35', '#000000');

        doc.fontSize(16)
            .fillColor('#FFFFFF')
            .font('Helvetica-Bold')
            .text(tipo.toUpperCase(), boxX + 10, boxY + 15, { 
              width: boxWidth - 20, 
              align: 'center' 
            })
            .text('ELECTRÓNICA', boxX + 10, boxY + 35, { 
              width: boxWidth - 20, 
              align: 'center' 
            });

        doc.fontSize(10)
            .text(`N° ${String(pedido.id_pedido).padStart(8, '0')}`, boxX + 10, boxY + 60, {
              width: boxWidth - 20,
              align: 'center'
            });

        // ============================================
        // DATOS DEL CLIENTE
        // ============================================
        
        doc.fontSize(12)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text('DATOS DEL CLIENTE', 50, 170);

        doc.fontSize(10)
            .font('Helvetica')
            .text(`Cliente: ${cliente.nombre} ${cliente.apellido}`, 50, 190)
            .text(`${tipo === 'factura' ? 'RUC' : 'DNI'}: ${tipo === 'factura' ? pedido.ruc_empresa : cliente.dni}`, 50, 205);

        if (tipo === 'factura') {
          doc.text(`Razón Social: ${pedido.razon_social}`, 50, 220);
          doc.text(`Dirección Fiscal: ${pedido.direccion_fiscal}`, 50, 235);
        } else {
          doc.text(`Email: ${cliente.email}`, 50, 220);
          doc.text(`Teléfono: ${cliente.telefono || 'N/A'}`, 50, 235);
        }

        doc.text(`Dirección Envío: ${pedido.direccion_envio}`, 50, 250);
        doc.text(`Fecha Emisión: ${new Date(pedido.fecha_pedido).toLocaleDateString('es-PE')}`, 50, 265);

        // ============================================
        // TABLA DE PRODUCTOS
        // ============================================
        
        const tableTop = 300;
        const tableLeft = 50;

        // Headers de tabla
        doc.rect(tableLeft, tableTop, 495, 25)
            .fillAndStroke('#000000', '#000000');

        doc.fontSize(10)
            .fillColor('#FFFFFF')
            .font('Helvetica-Bold')
            .text('Cant.', tableLeft + 10, tableTop + 8, { width: 40 })
            .text('Descripción', tableLeft + 60, tableTop + 8, { width: 200 })
            .text('Talla', tableLeft + 270, tableTop + 8, { width: 50 })
            .text('P. Unit.', tableLeft + 330, tableTop + 8, { width: 70 })
            .text('Subtotal', tableLeft + 410, tableTop + 8, { width: 75 });

        // Productos
        let currentY = tableTop + 35;
        doc.fillColor('#000000').font('Helvetica');

        detalles.forEach((item, index) => {
          const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F5F5F5';
          doc.rect(tableLeft, currentY - 5, 495, 20)
              .fill(rowBg);

          doc.fillColor('#000000')
              .text(item.cantidad, tableLeft + 10, currentY, { width: 40 })
              .text(item.producto_nombre, tableLeft + 60, currentY, { width: 200 })
              .text(item.talla || '-', tableLeft + 270, currentY, { width: 50 })
              .text(`S/ ${item.precio_unitario.toFixed(2)}`, tableLeft + 330, currentY, { width: 70 })
              .text(`S/ ${item.subtotal.toFixed(2)}`, tableLeft + 410, currentY, { width: 75 });

          currentY += 20;
        });

        // Línea separadora
        doc.moveTo(tableLeft, currentY + 5)
            .lineTo(tableLeft + 495, currentY + 5)
            .stroke('#000000');

        // ============================================
        // TOTALES
        // ============================================
        
        const totalesX = 370;
        currentY += 20;

        doc.fontSize(10)
            .font('Helvetica')
            .text('Subtotal:', totalesX, currentY)
            .text(`S/ ${pedido.monto_subtotal.toFixed(2)}`, totalesX + 90, currentY, { width: 85, align: 'right' });

        currentY += 20;
        doc.text('IGV (18%):', totalesX, currentY)
            .text(`S/ ${pedido.monto_igv.toFixed(2)}`, totalesX + 90, currentY, { width: 85, align: 'right' });

        currentY += 20;
        doc.text('Envío:', totalesX, currentY)
            .text(`S/ ${pedido.monto_envio.toFixed(2)}`, totalesX + 90, currentY, { width: 85, align: 'right' });

        currentY += 20;
        doc.fontSize(12)
            .font('Helvetica-Bold')
            .text('TOTAL:', totalesX, currentY)
            .text(`S/ ${pedido.monto_total.toFixed(2)}`, totalesX + 90, currentY, { width: 85, align: 'right' });

        // Box para total
        doc.rect(totalesX - 5, currentY - 5, 180, 25)
            .stroke('#FF6B35');

        // ============================================
        // INFORMACIÓN ADICIONAL
        // ============================================
        
        currentY += 50;
        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#767676')
            .text('Método de Pago:', 50, currentY)
            .text(this._formatearMetodoPago(pedido.metodo_pago), 150, currentY);

        currentY += 20;
        doc.text('Estado:', 50, currentY)
            .text(pedido.estado_pedido, 150, currentY);

        // ============================================
        // FOOTER
        // ============================================
        
        const footerY = doc.page.height - 100;

        doc.fontSize(8)
            .fillColor('#999999')
            .text('Representación impresa de la factura electrónica', 50, footerY, {
              width: 495,
              align: 'center'
            })
            .text('Este documento tiene validez legal según Ley N° 27269', 50, footerY + 15, {
              width: 495,
              align: 'center'
            })
            .text('Gracias por su compra - www.sportiva.pe', 50, footerY + 30, {
              width: 495,
              align: 'center'
            });

        // QR simulado (placeholder)
        doc.fontSize(6)
            .text('[ QR CODE ]', 260, footerY - 30, {
              width: 75,
              align: 'center'
            });

        doc.rect(250, footerY - 50, 95, 95)
            .stroke('#E5E5E5');

        doc.end();

        logger.info(`PDF ${tipo} generado: Pedido ${pedido.id_pedido}`);
        
      } catch (error) {
        logger.error(`Error generando PDF ${tipo}:`, error);
        reject(error);
      }
    });
  }

  // ============================================
  // REPORTE DE VENTAS
  // ============================================

  static generarReporteVentas(pedidos, fechaInicio, fechaFin) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4', 
          margin: 50
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const X_PEDIDO = 50;
        const X_FECHA = 160; 
        const X_CLIENTE = 240;
        const X_ITEMS = 440;
        const X_TOTAL = 490;
        const drawHeader = (y) => {
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
            
            doc.text('N° Pedido', X_PEDIDO, y);
            doc.text('Fecha', X_FECHA, y);
            doc.text('Cliente', X_CLIENTE, y);
            doc.text('Items', X_ITEMS, y); 
            doc.text('Total', X_TOTAL, y);
            
            doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke();
        };

        // --- PÁGINA 1: TÍTULO Y RESUMEN ---
        
        doc.fontSize(18).font('Helvetica-Bold').text('REPORTE DE VENTAS', 50, 50, { align: 'center' });
        doc.fontSize(12).font('Helvetica').fillColor('#767676').text(`Período: ${fechaInicio} - ${fechaFin}`, 50, 80, { align: 'center' });

        // Estadísticas generales
        const totalVentas = pedidos.reduce((sum, p) => sum + parseFloat(p.total_pedido || 0), 0);
        const ticketPromedio = pedidos.length > 0 ? totalVentas / pedidos.length : 0;

        doc.fontSize(10).fillColor('#000000')
            .text(`Total Pedidos: ${pedidos.length}`, 50, 120)
            .text(`Total Ventas: S/ ${totalVentas.toFixed(2)}`, 200, 120)
            .text(`Ticket Promedio: S/ ${ticketPromedio.toFixed(2)}`, 400, 120);

        // --- TABLA DE DATOS ---
        
        let y = 160;
        drawHeader(y);
        y += 25; 
        
        doc.font('Helvetica').fontSize(9);

        pedidos.forEach((pedido) => {
          if (y > 700) { 
              doc.addPage();
              y = 50; 
              drawHeader(y); 
              y += 25;
              doc.font('Helvetica').fontSize(9); 
          }

          const montoTotal = parseFloat(pedido.total_pedido || 0);
          const fecha = new Date(pedido.fecha_pedido).toLocaleDateString('es-PE');
          const items = pedido.cantidad_items || 0; 

          // Usamos las nuevas coordenadas ajustadas
          doc.text(pedido.numero_pedido || pedido.id_pedido, X_PEDIDO, y)
              .text(fecha, X_FECHA, y)
              .text(`${pedido.cliente_nombre || ''}`.substring(0, 30), X_CLIENTE, y) 
              .text(items.toString(), X_ITEMS, y)
              .text(`S/ ${montoTotal.toFixed(2)}`, X_TOTAL, y);
              
          y += 20; 
        });

        doc.end();

      } catch (error) {
        logger.error('Error generando PDF reporte ventas:', error);
        reject(error);
      }
    });
  }

  // ============================================
  // UTILIDADES PRIVADAS
  // ============================================
  
  static _formatearMetodoPago(metodo) {
    const metodos = {
      'yape': 'Yape',
      'plin': 'Plin',
      'tarjeta': 'Tarjeta de Crédito/Débito',
      'transferencia': 'Transferencia Bancaria',
      'contraentrega': 'Pago Contra Entrega'
    };
    return metodos[metodo] || metodo;
  }
}

module.exports = PDFGenerator;
