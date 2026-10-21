import { EVENTS } from '../config.js';
import { formatClock, formatDate, formatElapsed } from './format.js';

// Genera el informe de la RCP en PDF dentro del teléfono (no necesita internet).
// La librería se carga recién cuando se pide el PDF, para que la app abra rápido.

const PINK = [224, 64, 127];
const DARK = [28, 17, 23];
const MUTED = [134, 96, 111];

const count = (events, name) => events.filter((e) => e.name === name).length;

/** Nombre del archivo: RCP_2026-10-21_14-05.pdf */
function fileName(startedAt) {
  const d = new Date(startedAt);
  const p = (n) => String(n).padStart(2, '0');
  return `RCP_${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}.pdf`;
}

export async function downloadReport(session) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const { startedAt, endedAt, events, adrenalineMinutes } = session;
  const end = endedAt ?? Date.now();
  const left = 18;
  let y = 22;

  // Encabezado
  doc.setFillColor(...PINK);
  doc.rect(0, 0, 210, 6, 'F');
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Informe de RCP', left, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(`Generado el ${formatDate(Date.now())} a las ${formatClock(Date.now())}`, left, (y += 7));

  // Datos generales
  y += 12;
  const rows = [
    ['Fecha', formatDate(startedAt)],
    ['Inicio', formatClock(startedAt)],
    ['Fin', endedAt ? formatClock(endedAt) : 'Sin finalizar (informe parcial)'],
    ['Duración total', formatElapsed(end - startedAt)],
    ['Resultado', endedAt ? 'RCE · pulso recuperado' : 'Sin RCE registrado'],
    ['Intervalo de adrenalina', `${adrenalineMinutes} min`],
  ];
  doc.setFontSize(11);
  rows.forEach(([k, v]) => {
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'normal');
    doc.text(k, left, y);
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.text(v, left + 55, y);
    y += 7;
  });

  // Totales
  y += 6;
  const totals = [
    ['Cambios', count(events, EVENTS.change)],
    ['Adrenalina', count(events, EVENTS.adrenaline)],
    ['Desfibrilaciones', count(events, EVENTS.shock)],
    ['Amiodarona', count(events, EVENTS.amiodarone)],
  ];
  const boxW = (210 - left * 2 - 9) / 4;
  totals.forEach(([label, n], i) => {
    const x = left + i * (boxW + 3);
    doc.setDrawColor(...PINK);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, boxW, 22, 2, 2, 'S');
    doc.setFillColor(...PINK);
    doc.rect(x, y, boxW, 1.6, 'F');
    doc.setTextColor(...PINK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(String(n), x + boxW / 2, y + 12, { align: 'center' });
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(label, x + boxW / 2, y + 18.5, { align: 'center' });
  });
  y += 34;

  // Registro de eventos
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Registro de eventos', left, y);
  y += 8;

  const header = () => {
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'bold');
    doc.text('MIN. DEL PARO', left, y);
    doc.text('HORA', left + 32, y);
    doc.text('EVENTO', left + 56, y);
    doc.setDrawColor(230, 200, 212);
    doc.line(left, y + 2, 210 - left, y + 2);
    y += 8;
  };
  header();

  doc.setFontSize(11);
  events.forEach((e, i) => {
    if (y > 280) {
      doc.addPage();
      y = 20;
      header();
      doc.setFontSize(11);
    }
    if (i % 2 === 0) {
      doc.setFillColor(255, 246, 249);
      doc.rect(left, y - 5, 210 - left * 2, 7, 'F');
    }
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.text(formatElapsed(e.at - startedAt), left, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text(formatClock(e.at), left + 32, y);
    doc.setTextColor(...DARK);
    doc.text(e.name, left + 56, y);
    y += 7;
  });

  // Aviso al pie de cada página
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Registro generado con Cronómetro RCP, herramienta de apoyo para cronometrar. No sustituye los protocolos del servicio ni el criterio clínico.',
      left,
      290,
      { maxWidth: 210 - left * 2 }
    );
    doc.text(`${p} / ${pages}`, 210 - left, 290, { align: 'right' });
  }

  doc.save(fileName(startedAt));
}
