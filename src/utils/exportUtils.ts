import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

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