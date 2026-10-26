import { EVENTS, RHYTHMS } from '../config.js';
import { formatClock, formatDate, formatElapsed } from './format.js';

// Genera el informe de la RCP en PDF dentro del teléfono (no necesita internet).
// La librería se carga recién cuando se pide el PDF, para que la app abra rápido.

const PINK = [224, 64, 127];
const DARK = [28, 17, 23];
const MUTED = [134, 96, 111];
const RED = [200, 0, 90];

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

  // Recuadros de totales (4 por fila).
  const boxW = (210 - left * 2 - 9) / 4;
  const boxes = (items, color) => {
    // El ancho de cada recuadro depende de cuántos hay en la fila.
    const w = (210 - left * 2 - 3 * (items.length - 1)) / items.length;
    items.forEach(([label, n], i) => {
      const x = left + i * (w + 3);
      doc.setDrawColor(...color);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, y, w, 22, 2, 2, 'S');
      doc.setFillColor(...color);
      doc.rect(x, y, w, 1.6, 'F');
      doc.setTextColor(...color);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(String(n), x + w / 2, y + 12, { align: 'center' });
      doc.setTextColor(...MUTED);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(label, x + w / 2, y + 18.5, { align: 'center' });
    });
    y += 30;
  };
  const sectionTitle = (title) => {
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(title, left, y);
    y += 5;
  };

  // Totales
  const rhythmCount = (r) => count(events, r.event);
  const shocks = RHYTHMS.filter((r) => r.shockable).reduce((n, r) => n + rhythmCount(r), 0);
  y += 6;
  sectionTitle('Totales');
  boxes(
    [
      ['Cambios', count(events, EVENTS.change)],
      ['Adrenalina', count(events, EVENTS.adrenaline)],
      ['Amiodarona', count(events, EVENTS.amiodarone)],
      ['Lidocaína', count(events, EVENTS.lidocaine)],
      ['Desfibrilaciones', shocks],
    ],
    PINK
  );

  // Ritmos: cuántos de cada tipo
  sectionTitle('Ritmos');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...RED);
  doc.text('DESFIBRILABLES', left + boxW + 1.5, y, { align: 'center' });
  doc.setTextColor(...MUTED);
  doc.text('NO DESFIBRILABLES', left + 3 * boxW + 4.5, y, { align: 'center' });
  y += 3;
  // Un recuadro por ritmo, con el color de su grupo.
  RHYTHMS.forEach((r, i) => {
    const color = r.shockable ? RED : MUTED;
    const x = left + i * (boxW + 3);
    doc.setDrawColor(...color);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, boxW, 22, 2, 2, 'S');
    doc.setFillColor(...color);
    doc.rect(x, y, boxW, 1.6, 'F');
    doc.setTextColor(...color);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(String(rhythmCount(r)), x + boxW / 2, y + 12, { align: 'center' });
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(r.label, x + boxW / 2, y + 18.5, { align: 'center' });
  });
  y += 27;
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(
    `Desfibrilaciones: ${shocks} (FV ${rhythmCount(RHYTHMS[0])} + TVSP ${rhythmCount(RHYTHMS[1])}).`,
    left,
    y
  );
  y += 12;

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
