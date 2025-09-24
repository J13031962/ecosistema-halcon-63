import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';

export const exportToPDF = (data: any[], title: string, columns: string[]) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text(title, 20, 20);
  
  // Date
  doc.setFontSize(12);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 35);
  
  // Headers
  let yPosition = 50;
  doc.setFontSize(10);
  
  columns.forEach((column, index) => {
    doc.text(column, 20 + (index * 30), yPosition);
  });
  
  // Data
  yPosition += 10;
  data.forEach((row, rowIndex) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    columns.forEach((column, colIndex) => {
      const value = row[column.toLowerCase().replace(/\s+/g, '_')] || '';
      doc.text(String(value), 20 + (colIndex * 30), yPosition);
    });
    
    yPosition += 10;
  });
  
  doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
};

export const exportToExcel = (data: any[], title: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title);
  XLSX.writeFile(wb, `${title.toLowerCase().replace(/\s+/g, '_')}.xlsx`);
};

export const exportDashboardToPDF = (stats: any, title: string = 'Dashboard Report') => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text(title, 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 35);
  doc.text(`Hora: ${new Date().toLocaleTimeString()}`, 20, 45);
  
  // Stats
  let yPosition = 60;
  doc.setFontSize(14);
  doc.text('Estadísticas Generales', 20, yPosition);
  
  yPosition += 15;
  doc.setFontSize(10);
  
  const statsToShow = [
    { label: 'Total Alarmas', value: stats.totalAlarmas },
    { label: 'Alarmas Activas', value: stats.alarmasActivas },
    { label: 'Patrullas Activas', value: stats.patrullasActivas },
    { label: 'Personal Activo', value: stats.personalActivo },
    { label: 'Clientes Inscritos', value: stats.clientesInscritos },
    { label: 'Tiempo Respuesta Promedio', value: `${stats.tiempoRespuestaPromedio} min` },
    { label: 'Efectividad', value: `${stats.efectividadPorcentaje}%` },
    { label: 'Revistas Completadas', value: stats.revistasCompletadas },
    { label: 'Acompañamientos Completados', value: stats.acompanamientosCompletados },
  ];
  
  statsToShow.forEach((stat) => {
    doc.text(`${stat.label}: ${stat.value}`, 20, yPosition);
    yPosition += 10;
  });
  
  // Clientes con más alarmas
  if (stats.clientesConMasAlarmas?.length > 0) {
    yPosition += 10;
    doc.setFontSize(14);
    doc.text('Clientes con Más Alarmas', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    stats.clientesConMasAlarmas.forEach((cliente: any) => {
      doc.text(`${cliente.nombre}: ${cliente.alarmas} alarmas`, 20, yPosition);
      yPosition += 8;
    });
  }
  
  doc.save('dashboard_report.pdf');
};

export const exportQRToPDF = async (clientes: any[], qrsPerPage: number = 4) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const availableWidth = pageWidth - (margin * 2);
  const availableHeight = pageHeight - (margin * 2);

  // Calculate QR layout based on qrsPerPage
  let cols, rows, qrSize, spacing;
  
  switch(qrsPerPage) {
    case 1:
      cols = 1; rows = 1; qrSize = 120; spacing = 20;
      break;
    case 2:
      cols = 1; rows = 2; qrSize = 80; spacing = 15;
      break;
    case 4:
      cols = 2; rows = 2; qrSize = 60; spacing = 15;
      break;
    case 6:
      cols = 2; rows = 3; qrSize = 50; spacing = 12;
      break;
    case 9:
      cols = 3; rows = 3; qrSize = 40; spacing = 10;
      break;
    case 12:
      cols = 3; rows = 4; qrSize = 35; spacing = 8;
      break;
    default:
      cols = 2; rows = 2; qrSize = 60; spacing = 15;
  }

  const cellWidth = availableWidth / cols;
  const cellHeight = availableHeight / rows;

  let currentPage = 0;
  let currentQR = 0;

  for (let i = 0; i < clientes.length; i++) {
    const cliente = clientes[i];
    const positionInPage = currentQR % qrsPerPage;
    
    // Add new page if needed
    if (positionInPage === 0 && i > 0) {
      doc.addPage();
      currentPage++;
    }

    const row = Math.floor(positionInPage / cols);
    const col = positionInPage % cols;
    
    const x = margin + (col * cellWidth) + (cellWidth - qrSize) / 2;
    const y = margin + (row * cellHeight) + (cellHeight - qrSize - 30) / 2;

    try {
      // Create QR data with backward compatibility
      const qrData = JSON.stringify({
        // New format (preferred)
        id: cliente.numero_cuenta || cliente.id,
        numero_cuenta: cliente.numero_cuenta,
        
        // Old format (backward compatibility)
        id_cliente: cliente.id,
        
        // Client info
        nombre: cliente.nombre,
        direccion: cliente.direccion,
        
        // New coordinate format (preferred)
        lat: cliente.latitud?.toString() || '0',
        lng: cliente.longitud?.toString() || '0',
        
        // Old coordinate format (backward compatibility)
        coordenadas: {
          latitud: cliente.latitud?.toString() || '0',
          longitud: cliente.longitud?.toString() || '0'
        }
      });

      // Generate QR code as data URL
      const qrDataURL = await QRCode.toDataURL(qrData, {
        width: qrSize * 4, // Higher resolution for better print quality
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Add QR code to PDF
      doc.addImage(qrDataURL, 'PNG', x, y, qrSize, qrSize);

      // Add only client ID below QR
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(cliente.numero_cuenta || cliente.id, x + qrSize/2, y + qrSize + 8, { align: 'center' });

    } catch (error) {
      console.error('Error generating QR for client:', cliente.nombre, error);
      // Add placeholder text if QR generation fails
      doc.setFontSize(10);
      doc.text('Error QR', x + qrSize/2, y + qrSize/2, { align: 'center' });
    }

    currentQR++;
  }

  // Add header to first page
  doc.setPage(1);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Códigos QR de Clientes', pageWidth/2, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${new Date().toLocaleDateString()} - Total: ${clientes.length} clientes`, pageWidth/2, 25, { align: 'center' });

  // Save the PDF
  const fileName = `codigos_qr_clientes_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};