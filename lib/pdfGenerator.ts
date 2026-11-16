import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, BusinessSetting } from './types';

export function downloadInvoicePdf(invoice: Invoice, settings: BusinessSetting) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor: [number, number, number] = [4, 120, 87]; // Emerald 700

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.businessName, 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(settings.tagline || 'Bakery Wholesale & Daily Distribution', 14, 21);
  doc.text(`Phone: ${settings.mobileNumber}  |  ${settings.address}`, 14, 27);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', pageWidth - 14, 16, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, pageWidth - 14, 22, { align: 'right' });
  doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`, pageWidth - 14, 27, { align: 'right' });

  // 2. Bill To & Invoice Info Box
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 14, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const shopName = invoice.customer?.shopName || 'Retail Customer';
  const ownerName = invoice.customer?.ownerName ? `Attn: ${invoice.customer.ownerName}` : '';
  doc.text(shopName, 14, 48);
  if (ownerName) doc.text(ownerName, 14, 53);
  doc.text(`Mobile: ${invoice.customer?.mobileNumber || 'N/A'}`, 14, 58);
  doc.text(`Address: ${invoice.customer?.address || 'N/A'}`, 14, 63);

  // Status & Payment details right side
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT DETAILS:', pageWidth - 80, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Status: ${invoice.status}`, pageWidth - 80, 48);
  doc.text(`Payment Method: ${invoice.paymentMethod || 'CASH'}`, pageWidth - 80, 53);
  if (settings.gstNumber) doc.text(`GSTIN: ${settings.gstNumber}`, pageWidth - 80, 58);
  if (settings.upiId) doc.text(`UPI ID: ${settings.upiId}`, pageWidth - 80, 63);

  // 3. Table of Items
  const tableData = (invoice.items || []).map((item, idx) => [
    (idx + 1).toString(),
    item.productName,
    `${item.quantity} ${item.unit}`,
    `₹${item.unitPrice.toFixed(2)}`,
    `₹${item.totalPrice.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 72,
    head: [['#', 'Product Description', 'Quantity', 'Rate (₹)', 'Amount (₹)']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 32, halign: 'right' },
      3: { cellWidth: 32, halign: 'right' },
      4: { cellWidth: 36, halign: 'right' },
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // 4. Financial Summary Box (Right Aligned)
  const summaryBoxWidth = 85;
  const summaryX = pageWidth - summaryBoxWidth - 14;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryX, finalY, summaryBoxWidth, 54, 2, 2, 'FD');

  const printRow = (label: string, value: string, yPos: number, isBold: boolean = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(9);
    doc.text(label, summaryX + 4, yPos);
    doc.text(value, summaryX + summaryBoxWidth - 4, yPos, { align: 'right' });
  };

  printRow('Subtotal:', `₹${invoice.subtotal.toFixed(2)}`, finalY + 7);
  printRow('Discount:', `-₹${invoice.discount.toFixed(2)}`, finalY + 14);
  printRow('Current Bill Total:', `₹${invoice.grandTotal.toFixed(2)}`, finalY + 21, true);

  doc.setDrawColor(203, 213, 225);
  doc.line(summaryX + 4, finalY + 24, summaryX + summaryBoxWidth - 4, finalY + 24);

  printRow('Previous Balance:', `₹${invoice.previousBalance.toFixed(2)}`, finalY + 30);
  printRow('Amount Paid Today:', `₹${invoice.paidAmount.toFixed(2)}`, finalY + 37);
  printRow('Current Bill Due:', `₹${invoice.remainingAmount.toFixed(2)}`, finalY + 44);

  doc.setFillColor(236, 253, 245);
  doc.rect(summaryX + 2, finalY + 47, summaryBoxWidth - 4, 6, 'F');
  doc.setTextColor(4, 120, 87);
  doc.setFont('helvetica', 'bold');
  doc.text('NET TOTAL OUTSTANDING:', summaryX + 4, finalY + 51);
  doc.text(`₹${invoice.totalOutstandingAfter.toFixed(2)}`, summaryX + summaryBoxWidth - 4, finalY + 51, { align: 'right' });

  // 5. Notes & Signature
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Terms & Conditions / Notes:', 14, finalY + 10);
  doc.text('1. Goods once sold will not be taken back without valid batch verification.', 14, finalY + 15);
  doc.text('2. Please settle credit balances within the agreed delivery credit period.', 14, finalY + 20);
  doc.text(`3. For digital payments, scan UPI or pay to ${settings.upiId}`, 14, finalY + 25);

  doc.setFont('helvetica', 'italic');
  doc.text(settings.invoiceFooterNote, 14, finalY + 35);

  // Signature
  doc.setFont('helvetica', 'normal');
  doc.text('Authorised Signatory', pageWidth - 45, finalY + 75);
  doc.line(pageWidth - 55, finalY + 70, pageWidth - 15, finalY + 70);

  // Download
  doc.save(`${invoice.invoiceNumber}_${shopName.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Downloads standard reports as PDF
 */
export function downloadReportPdf(title: string, columns: string[], data: any[][], summaryText?: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor: [number, number, number] = [4, 120, 87];

  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FAIZAN BAKERY - ' + title.toUpperCase(), 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 18);

  if (summaryText) {
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9.5);
    doc.text(summaryText, 14, 32);
  }

  autoTable(doc, {
    startY: summaryText ? 36 : 28,
    head: [columns],
    body: data,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
    },
  });

  doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

