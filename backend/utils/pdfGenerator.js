const PDFDocument = require('pdfkit');

const LUNA_NAMES = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
];

const formatRON = (amount) =>
  new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + ' RON';

const formatDate = (date) => {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
};

const generateMonthlyReport = (res, { month, year, transactions, stats, generatedBy }) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=raport_${LUNA_NAMES[month - 1].toLowerCase()}_${year}.pdf`
  );

  doc.pipe(res);

  // Header
  doc.rect(0, 0, 595, 80).fill('#0f2140');
  doc.fontSize(22).fillColor('#ffffff').font('Helvetica-Bold')
    .text('EnterpriseFlow', 50, 20);
  doc.fontSize(11).fillColor('rgba(180,200,230,0.8)').font('Helvetica')
    .text('Financial OS', 50, 46);
  doc.fontSize(11).fillColor('#ffffff')
    .text(`Raport financiar — ${LUNA_NAMES[month - 1]} ${year}`, 50, 60);

  doc.moveDown(3);

  // Meta info
  doc.fontSize(9).fillColor('#8fa3bc').font('Helvetica')
    .text(`Generat la: ${formatDate(new Date())}`, 50, 95)
    .text(`Generat de: ${generatedBy}`, 200, 95)
    .text(`Perioadă: 01.${String(month).padStart(2, '0')}.${year} – ${new Date(year, month, 0).getDate()}.${String(month).padStart(2, '0')}.${year}`, 350, 95);

  doc.moveTo(50, 115).lineTo(545, 115).strokeColor('#dce6f5').lineWidth(1).stroke();

  // KPI Summary
  const kpiY = 130;
  const kpiBoxes = [
    { label: 'SOLD CURENT', value: formatRON(stats.balance), color: '#1d4ed8' },
    { label: 'ÎNCASĂRI', value: formatRON(stats.monthlyIncome), color: '#059669' },
    { label: 'CHELTUIELI', value: formatRON(stats.monthlyExpenses), color: '#d97706' },
    { label: 'PROFIT NET', value: formatRON(stats.netProfit), color: stats.netProfit >= 0 ? '#059669' : '#dc2626' },
  ];

  kpiBoxes.forEach((kpi, i) => {
    const x = 50 + i * 125;
    doc.rect(x, kpiY, 115, 55).fillAndStroke('#f8fafd', '#dce6f5');
    doc.rect(x, kpiY, 115, 3).fill(kpi.color);
    doc.fontSize(7).fillColor('#8fa3bc').font('Helvetica-Bold')
      .text(kpi.label, x + 8, kpiY + 12);
    doc.fontSize(10).fillColor('#0f2140').font('Helvetica-Bold')
      .text(kpi.value, x + 8, kpiY + 28, { width: 99 });
  });

  // Transactions table
  const tableY = kpiY + 75;
  doc.fontSize(12).fillColor('#0f2140').font('Helvetica-Bold')
    .text('Detaliu tranzacții', 50, tableY);

  doc.moveTo(50, tableY + 18).lineTo(545, tableY + 18).strokeColor('#dce6f5').lineWidth(0.5).stroke();

  // Table headers
  const headerY = tableY + 22;
  doc.rect(50, headerY, 495, 18).fill('#eef3fb');
  doc.fontSize(8).fillColor('#4a5f7a').font('Helvetica-Bold');
  doc.text('Referință', 55, headerY + 5);
  doc.text('Furnizor/Client', 120, headerY + 5);
  doc.text('Tip', 250, headerY + 5);
  doc.text('Categorie', 295, headerY + 5);
  doc.text('Status', 390, headerY + 5);
  doc.text('Sumă', 455, headerY + 5, { align: 'right', width: 85 });

  let rowY = headerY + 20;
  transactions.forEach((txn, idx) => {
    if (rowY > 750) {
      doc.addPage();
      rowY = 50;
    }
    const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafd';
    doc.rect(50, rowY, 495, 16).fill(bg);

    const statusColor = txn.status === 'Aprobat' ? '#059669' : txn.status === 'Respins' ? '#dc2626' : '#d97706';

    doc.fontSize(8).fillColor('#0f2140').font('Helvetica');
    doc.text(txn.reference || '-', 55, rowY + 4, { width: 60 });
    doc.text(txn.supplier || '-', 120, rowY + 4, { width: 125 });
    doc.text(txn.type, 250, rowY + 4, { width: 40 });
    doc.text(txn.category || '-', 295, rowY + 4, { width: 90 });
    doc.fillColor(statusColor).text(txn.status, 390, rowY + 4, { width: 60 });
    doc.fillColor(txn.type === 'Venit' ? '#059669' : '#dc2626').font('Helvetica-Bold')
      .text(
        (txn.type === 'Venit' ? '+' : '-') + formatRON(txn.totalAmount),
        455, rowY + 4, { align: 'right', width: 85 }
      );

    doc.moveTo(50, rowY + 16).lineTo(545, rowY + 16).strokeColor('#eef3fb').lineWidth(0.3).stroke();
    rowY += 18;
  });

  // Footer
  doc.moveTo(50, 800).lineTo(545, 800).strokeColor('#dce6f5').lineWidth(0.5).stroke();
  doc.fontSize(8).fillColor('#8fa3bc').font('Helvetica')
    .text('EnterpriseFlow Financial OS • Raport generat automat', 50, 808, { align: 'center', width: 495 });

  doc.end();
};

module.exports = { generateMonthlyReport };
