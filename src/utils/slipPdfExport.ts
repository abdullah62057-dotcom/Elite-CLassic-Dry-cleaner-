import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, ShopConfig } from '../types';

/**
 * Loads an image from URL and converts it to a base64 data URL for jsPDF.
 */
function loadImageBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Generates an official Customer Receipt PDF matching Receipt_ELite_Dry_CLeaners_a1c4005a.pdf
 */
export async function downloadCustomerReceiptPdf(order: Order, shopConfig: ShopConfig) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [148, 210], // A5 size portrait (standard slip pad size)
  });

  const pageWidth = 148;
  const pageHeight = 210;
  const primaryBlue = [20, 80, 163]; // #1450A3
  const darkBlue = [10, 50, 117];

  // Try loading logo
  const logoBase64 = await loadImageBase64('/assets/aistudio/final-logo_bd94f2f7.jpg');

  // Outer border
  doc.setDrawColor(20, 80, 163);
  doc.setLineWidth(0.8);
  doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

  // Upper Right Slip & Customer ID
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(10, 50, 117);
  doc.text(order.id, pageWidth - 12, 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 120);
  doc.text(`Cust ID: ${order.customerId}`, pageWidth - 12, 17.5, { align: 'right' });

  // Logo on Upper Side (Centered, Increased Size)
  const logoW = 56;
  const logoH = 28;
  const logoX = (pageWidth - logoW) / 2;
  const logoY = 8;

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'JPEG', logoX, logoY, logoW, logoH);
    } catch {
      drawTextLogo(doc, (pageWidth - 44) / 2, 14);
    }
  } else {
    drawTextLogo(doc, (pageWidth - 44) / 2, 14);
  }

  // Details Box Under Logo (Full Width with margins)
  const boxX = 10;
  const boxY = 39;
  const boxW = pageWidth - 20;
  const boxH = 28;

  doc.setDrawColor(20, 80, 163);
  doc.setLineWidth(0.6);
  doc.roundedRect(boxX, boxY, boxW, boxH, 3, 3);

  // Fields inside box
  const fields = [
    { label: 'Name:', val: order.customerName },
    { label: 'Booking Date:', val: order.bookingDate },
    { label: 'Delivery Date:', val: order.deliveryDate },
    { label: 'Phone No:', val: order.customerPhone },
  ];

  let fieldY = boxY + 6;
  fields.forEach((f) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(10, 50, 117);
    doc.text(f.label, boxX + 4, fieldY);

    // Value with underline
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    doc.text(f.val, boxX + 28, fieldY);

    doc.setDrawColor(20, 80, 163);
    doc.setLineWidth(0.3);
    doc.line(boxX + 27, fieldY + 1, boxX + boxW - 4, fieldY + 1);

    fieldY += 5.5;
  });

  // Phone Divider
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 80, 163);
  doc.text(`-------------- Phone No: ${shopConfig.phone} --------------`, pageWidth / 2, 72, {
    align: 'center',
  });

  // Table of Items (Starts directly under phone divider, no barcode)
  const tableRows: any[] = [];
  order.items.forEach((item) => {
    const desc = item.serviceType !== 'Dry Clean'
      ? `${item.description} (${item.serviceType})`
      : item.description;
    tableRows.push([item.quantity.toString(), desc, item.totalPrice.toLocaleString()]);
  });

  autoTable(doc, {
    startY: 77,
    margin: { left: 8, right: 8 },
    head: [['Qty', 'Description', 'Rs']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [20, 80, 163],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 88, halign: 'left' },
      2: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    styles: {
      lineColor: [20, 80, 163],
      lineWidth: 0.25,
      fontSize: 8.5,
      cellPadding: 1.8,
      minCellHeight: 6,
    },
    foot: [
      [
        { content: 'TOTAL', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fontSize: 10 } },
        { content: order.total.toLocaleString(), styles: { halign: 'right', fontStyle: 'bold', fontSize: 10 } },
      ],
    ],
    footStyles: {
      fillColor: [20, 80, 163],
      textColor: [255, 255, 255],
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 3;

  // Workshop Summary Bar
  const totalPcs = order.items.reduce((s, i) => s + i.quantity, 0);
  doc.setFillColor(241, 246, 255);
  doc.rect(8, finalY, pageWidth - 16, 7, 'F');
  doc.setDrawColor(20, 80, 163);
  doc.setLineWidth(0.25);
  doc.rect(8, finalY, pageWidth - 16, 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(10, 50, 117);
  doc.text(`Total Pieces: ${totalPcs} pcs (${order.items.length} items)`, 12, finalY + 4.5);
  doc.text(`Payment: ${order.paymentStatus} (Bal: Rs ${order.balanceDue})`, 82, finalY + 4.5);

  const discY = finalY + 10;

  // Disclaimer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(10, 50, 117);
  doc.text('Please check your clothes, money, and belongings', pageWidth / 2, discY, {
    align: 'center',
  });
  doc.text(
    'before leaving the counter. The shop will not be responsible afterward. Thank you.',
    pageWidth / 2,
    discY + 4,
    { align: 'center' }
  );

  // Business Hours & Delivery
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(
    `Business Hour : ${shopConfig.businessHours}   |   ${shopConfig.deliveryHours}`,
    pageWidth / 2,
    discY + 9,
    { align: 'center' }
  );

  // Shop Address
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(shopConfig.addressLine1, pageWidth / 2, discY + 15, { align: 'center' });
  doc.text(shopConfig.addressLine2, pageWidth / 2, discY + 19.5, { align: 'center' });

  // Bottom Blue Ribbon
  doc.setFillColor(20, 80, 163);
  doc.rect(pageWidth - 35, pageHeight - 10, 30, 5, 'F');

  doc.save(`${order.id}-Customer-Receipt.pdf`);
}

/**
 * Generates an official Side Slip PDF matching Side_Slip_0faab2d1.pdf
 */
export async function downloadSideSlipPdf(order: Order, shopConfig: ShopConfig) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [148, 105], // A6 landscape / side tag
  });

  const pageWidth = 148;
  const pageHeight = 105;

  // Outer border
  doc.setDrawColor(20, 80, 163);
  doc.setLineWidth(0.8);
  // Try loading logo
  const logoBase64 = await loadImageBase64('/assets/aistudio/final-logo_bd94f2f7.jpg');

  // Upper Right Slip & Customer ID
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(10, 50, 117);
  doc.text(order.id, pageWidth - 10, 11, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 110, 120);
  doc.text(`Cust ID: ${order.customerId}`, pageWidth - 10, 15, { align: 'right' });

  // Logo on Upper Side (Centered, Increased Size)
  const logoW = 48;
  const logoH = 24;
  const logoX = (pageWidth - logoW) / 2;
  const logoY = 6;

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'JPEG', logoX, logoY, logoW, logoH);
    } catch {
      drawTextLogo(doc, (pageWidth - 36) / 2, 11);
    }
  } else {
    drawTextLogo(doc, (pageWidth - 36) / 2, 11);
  }

  // Details Box Under Logo
  const boxX = 8;
  const boxY = 32;
  const boxW = pageWidth - 16;
  const boxH = 25;

  doc.setDrawColor(20, 80, 163);
  doc.setLineWidth(0.6);
  doc.roundedRect(boxX, boxY, boxW, boxH, 3, 3);

  // Info Fields
  const fields = [
    { label: 'Name:', val: order.customerName, bold: false },
    { label: 'Booking Date:', val: order.bookingDate, bold: false },
    { label: 'Delivery Date:', val: order.deliveryDate, bold: true },
    { label: 'Slip No:', val: order.id.replace(/^SLIP-?/i, '') || order.id, bold: true, isSlip: true },
  ];

  let fieldY = boxY + 5.2;
  fields.forEach((f) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(10, 50, 117);
    doc.text(f.label, boxX + 4, fieldY);

    doc.setFont('helvetica', f.bold ? 'bold' : 'normal');
    doc.setFontSize(f.isSlip ? 9.5 : 8.5);
    doc.setTextColor(f.isSlip ? 10 : 30, f.isSlip ? 50 : 30, f.isSlip ? 117 : 30);
    doc.text(f.val, boxX + 28, fieldY);

    doc.setDrawColor(20, 80, 163);
    doc.setLineWidth(f.isSlip ? 0.5 : 0.3);
    doc.line(boxX + 27, fieldY + 1, boxX + boxW - 4, fieldY + 1);

    fieldY += 5.0;
  });

  // Middle Phone Line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 80, 163);
  doc.text(`-------------- Phone No: ${shopConfig.phone} --------------`, pageWidth / 2, 61, {
    align: 'center',
  });

  // Garment Details & Workshop Processing Specs (Directly below phone divider, no barcode)
  const totalPcs = order.items.reduce((s, i) => s + i.quantity, 0);
  doc.setFillColor(241, 246, 255);
  doc.rect(8, 65, pageWidth - 16, 7.5, 'F');
  doc.setDrawColor(20, 80, 163);
  doc.setLineWidth(0.25);
  doc.rect(8, 65, pageWidth - 16, 7.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(10, 50, 117);
  doc.text(`Total Pieces: ${totalPcs} pcs (${order.items.length} items)`, 12, 70);
  doc.text(`Payment: ${order.paymentStatus} (Bal: Rs ${order.balanceDue})`, 82, 70);

  // Disclaimer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(10, 50, 117);
  doc.text('Please check your clothes, money, and belongings', pageWidth / 2, 76.5, {
    align: 'center',
  });
  doc.text(
    'before leaving the counter. The shop will not be responsible afterward. Thank you.',
    pageWidth / 2,
    79.8,
    { align: 'center' }
  );

  // Business Hours
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(
    `Business Hour : ${shopConfig.businessHours}   |   ${shopConfig.deliveryHours}`,
    pageWidth / 2,
    86,
    { align: 'center' }
  );

  // Address
  doc.setFontSize(7.5);
  doc.text(shopConfig.addressLine1, pageWidth / 2, 91, { align: 'center' });
  doc.text(shopConfig.addressLine2, pageWidth / 2, 94.8, { align: 'center' });

  doc.save(`${order.id}-Side-Slip.pdf`);
}

/**
 * Downloads Both Slips in a single multi-page PDF document
 */
export async function downloadDualSlipsPdf(order: Order, shopConfig: ShopConfig) {
  await downloadCustomerReceiptPdf(order, shopConfig);
  setTimeout(async () => {
    await downloadSideSlipPdf(order, shopConfig);
  }, 400);
}

function drawTextLogo(doc: jsPDF, x: number, y: number) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 80, 163);
  doc.text('ELITE CLASSIC', x, y);
  doc.setFontSize(8);
  doc.text('DRY CLEANER', x, y + 5);
}
