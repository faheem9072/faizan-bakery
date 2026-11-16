import { Invoice, BusinessSetting } from './types';

export function padLine(left: string, right: string, width: number): string {
  const space = width - left.length - right.length;
  if (space <= 0) {
    return left.slice(0, width - right.length - 1) + ' ' + right;
  }
  return left + ' '.repeat(space) + right;
}

export function centerText(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width);
  const leftPad = Math.floor((width - text.length) / 2);
  const rightPad = width - text.length - leftPad;
  return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
}

export function generateReceiptText(
  invoice: Invoice,
  settings: BusinessSetting,
  widthMode: '58mm' | '80mm' = '58mm'
): string {
  const width = widthMode === '58mm' ? 32 : 48;
  const divider = '-'.repeat(width);
  const doubleDivider = '='.repeat(width);

  const lines: string[] = [];

  // 1. Header
  lines.push(centerText(settings.businessName, width));
  if (settings.tagline) {
    lines.push(centerText(settings.tagline, width));
  }
  lines.push(centerText(settings.address, width));
  lines.push(centerText(`Ph: ${settings.mobileNumber}`, width));
  if (settings.gstNumber) {
    lines.push(centerText(`GSTIN: ${settings.gstNumber}`, width));
  }
  lines.push(doubleDivider);

  // 2. Invoice Meta
  lines.push(centerText('DIGITAL SALES INVOICE', width));
  lines.push(padLine(`Inv: ${invoice.invoiceNumber}`, new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), width));
  lines.push(padLine(`Time: ${new Date(invoice.invoiceDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, `Status: ${invoice.status}`, width));
  lines.push(divider);

  // 3. Customer Info
  const custName = invoice.customer?.shopName || 'Retail Customer';
  const owner = invoice.customer?.ownerName ? ` (${invoice.customer.ownerName})` : '';
  lines.push(`Customer: ${custName}${owner}`);
  if (invoice.customer?.mobileNumber) {
    lines.push(`Mobile  : ${invoice.customer.mobileNumber}`);
  }
  if (invoice.customer?.address) {
    lines.push(`Address : ${invoice.customer.address}`);
  }
  lines.push(divider);

  // 4. Items Table Header
  if (widthMode === '58mm') {
    lines.push(padLine('Item (Qty x Rate)', 'Total', width));
  } else {
    // 80mm table header
    const colItem = 'Item'.padEnd(20);
    const colQty = 'Qty'.padStart(8);
    const colRate = 'Rate'.padStart(8);
    const colTot = 'Total'.padStart(12);
    lines.push(colItem + colQty + colRate + colTot);
  }
  lines.push(divider);

  // 5. Items Rows
  const items = invoice.items || [];
  for (const item of items) {
    const formattedQty = `${item.quantity} ${item.unit}`;
    const rate = `₹${item.unitPrice.toFixed(0)}`;
    const total = `₹${item.totalPrice.toFixed(0)}`;

    if (widthMode === '58mm') {
      lines.push(item.productName);
      lines.push(padLine(`  ${formattedQty} x ${rate}`, total, width));
    } else {
      const itemTrunc = item.productName.length > 19 ? item.productName.slice(0, 18) + '.' : item.productName;
      const colItem = itemTrunc.padEnd(20);
      const colQty = formattedQty.padStart(8);
      const colRate = rate.padStart(8);
      const colTot = total.padStart(12);
      lines.push(colItem + colQty + colRate + colTot);
    }
  }
  lines.push(divider);

  // 6. Totals
  lines.push(padLine('Subtotal:', `₹${invoice.subtotal.toFixed(2)}`, width));
  if (invoice.discount > 0) {
    lines.push(padLine('Discount:', `-₹${invoice.discount.toFixed(2)}`, width));
  }
  lines.push(doubleDivider);
  lines.push(padLine('GRAND TOTAL:', `₹${invoice.grandTotal.toFixed(2)}`, width));
  lines.push(doubleDivider);

  // 7. Balance Breakdown (Essential for bakery wholesale)
  lines.push(padLine('Previous Balance:', `₹${invoice.previousBalance.toFixed(2)}`, width));
  lines.push(padLine('Current Bill:', `₹${invoice.grandTotal.toFixed(2)}`, width));
  lines.push(padLine('Amount Paid:', `₹${invoice.paidAmount.toFixed(2)}`, width));
  lines.push(padLine('Current Bill Due:', `₹${invoice.remainingAmount.toFixed(2)}`, width));
  lines.push(divider);
  lines.push(padLine('NET OUTSTANDING DUE:', `₹${invoice.totalOutstandingAfter.toFixed(2)}`, width));
  lines.push(doubleDivider);

  // 8. Payment Instructions & UPI
  if (settings.upiId) {
    lines.push(centerText(`Pay via UPI: ${settings.upiId}`, width));
  }
  if (invoice.paymentMethod) {
    lines.push(centerText(`Paid via: ${invoice.paymentMethod}`, width));
  }
  lines.push(divider);

  // 9. Footer
  lines.push(centerText(settings.invoiceFooterNote || 'Thank you for your business!', width));
  lines.push(centerText('Powered by Faizan Bakery System', width));
  lines.push('');
  lines.push('');

  return lines.join('\n');
}

/**
 * Generates raw ESC/POS binary data for Bluetooth / USB thermal receipt printers
 */
export function generateEscPosBytes(
  invoice: Invoice,
  settings: BusinessSetting,
  widthMode: '58mm' | '80mm' = '58mm'
): Uint8Array {
  const encoder = new TextEncoder();
  const text = generateReceiptText(invoice, settings, widthMode);

  const INIT = [0x1B, 0x40]; // ESC @ Initialize
  const ALIGN_CENTER = [0x1B, 0x61, 0x01]; // ESC a 1
  const ALIGN_LEFT = [0x1B, 0x61, 0x00]; // ESC a 0
  const BOLD_ON = [0x1B, 0x45, 0x01];
  const BOLD_OFF = [0x1B, 0x45, 0x00];
  const FEED_AND_CUT = [0x1D, 0x56, 0x41, 0x03]; // GS V A 3 (feed & full cut)

  const textBytes = encoder.encode(text);
  const totalLength = INIT.length + ALIGN_LEFT.length + textBytes.length + FEED_AND_CUT.length;

  const buffer = new Uint8Array(totalLength);
  let offset = 0;

  buffer.set(INIT, offset);
  offset += INIT.length;

  buffer.set(ALIGN_LEFT, offset);
  offset += ALIGN_LEFT.length;

  buffer.set(textBytes, offset);
  offset += textBytes.length;

  buffer.set(FEED_AND_CUT, offset);

  return buffer;
}

/**
 * Web Bluetooth Print Helper
 * Discovers and prints directly to BLE Thermal Printers
 */
export async function printViaWebBluetooth(
  invoice: Invoice,
  settings: BusinessSetting,
  widthMode: '58mm' | '80mm' = '58mm',
  onStatus?: (status: string) => void
): Promise<{ success: boolean; message: string }> {
  if (typeof window === 'undefined' || !(navigator as any).bluetooth) {
    return {
      success: false,
      message: 'Web Bluetooth is not supported on this browser. Please use Chrome on Android or Desktop, or use Browser Print / Android RawBT.',
    };
  }

  try {
    onStatus?.('Requesting Bluetooth Printer...');

    // Standard Bluetooth Serial Port / Thermal Printer UUIDs
    const PRINTER_SERVICES = [
      '000018f0-0000-1000-8000-00805f9b34fb',
      'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
      '49535343-fe7d-4ae5-8fa9-9fafd205e455',
      '0000ffe0-0000-1000-8000-00805f9b34fb',
    ];

    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: PRINTER_SERVICES,
    });

    onStatus?.(`Connecting to ${device.name || 'Printer'}...`);
    const server = await device.gatt.connect();

    onStatus?.('Discovering printer services...');
    let targetCharacteristic: any = null;

    // Find write characteristic in services
    for (const serviceUuid of PRINTER_SERVICES) {
      try {
        const service = await server.getPrimaryService(serviceUuid);
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            targetCharacteristic = char;
            break;
          }
        }
        if (targetCharacteristic) break;
      } catch (err) {
        // service not on this device, check next
      }
    }

    if (!targetCharacteristic) {
      // Fallback: search all available services
      try {
        const services = await server.getPrimaryServices();
        for (const service of services) {
          const chars = await service.getCharacteristics();
          for (const char of chars) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              targetCharacteristic = char;
              break;
            }
          }
          if (targetCharacteristic) break;
        }
      } catch (err) {
        // fallback failed
      }
    }

    if (!targetCharacteristic) {
      throw new Error('Could not find a writable Bluetooth printer channel on this device.');
    }

    onStatus?.('Sending receipt data...');
    const bytes = generateEscPosBytes(invoice, settings, widthMode);

    // Send in chunks of 100 bytes to avoid BLE buffer overflow
    const CHUNK_SIZE = 100;
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.slice(i, i + CHUNK_SIZE);
      if (targetCharacteristic.properties.writeWithoutResponse) {
        await targetCharacteristic.writeValueWithoutResponse(chunk);
      } else {
        await targetCharacteristic.writeValue(chunk);
      }
      // Small delay between packets
      await new Promise((resolve) => setTimeout(resolve, 30));
    }

    onStatus?.('Print completed successfully!');
    return { success: true, message: 'Receipt printed successfully via Bluetooth!' };
  } catch (error: any) {
    console.error('Bluetooth Print Error:', error);
    return {
      success: false,
      message: error?.message || 'Bluetooth printing failed. Please check connection.',
    };
  }
}

/**
 * Android RawBT Intent URL generator
 * Allows one-tap printing with Android apps like RawBT or Quick Printer
 */
export function getAndroidRawBtUrl(invoice: Invoice, settings: BusinessSetting, widthMode: '58mm' | '80mm' = '58mm'): string {
  const text = generateReceiptText(invoice, settings, widthMode);
  // RawBT accepts base64 or raw text via intent
  const base64Data = typeof window !== 'undefined' ? btoa(unescape(encodeURIComponent(text))) : '';
  return `intent:${base64Data}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;S.browser_fallback_url=https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter;end;`;
}

/**
 * Formats a clean, readable WhatsApp Invoice message for customer wholesale records
 */
export function generateWhatsAppInvoiceMessage(invoice: Invoice, settings: BusinessSetting): string {
  const custName = invoice.customer?.shopName || 'Customer';
  const dateStr = new Date(invoice.invoiceDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  let msg = `*🍞 ${settings.businessName.toUpperCase()}*\n`;
  msg += `_Digital Sales Invoice_\n\n`;
  msg += `*Invoice No:* ${invoice.invoiceNumber}\n`;
  msg += `*Date:* ${dateStr}\n`;
  msg += `*Customer:* ${custName}\n`;
  msg += `--------------------------------\n`;
  msg += `*ITEMS SUPPLIED:*\n`;

  (invoice.items || []).forEach((item, idx) => {
    msg += `${idx + 1}. *${item.productName}* - ${item.quantity} ${item.unit} @ ₹${item.unitPrice} = *₹${item.totalPrice.toFixed(0)}*\n`;
  });

  msg += `--------------------------------\n`;
  msg += `*Subtotal:* ₹${invoice.subtotal.toFixed(2)}\n`;
  if (invoice.discount > 0) {
    msg += `*Discount:* -₹${invoice.discount.toFixed(2)}\n`;
  }
  msg += `*Grand Total:* *₹${invoice.grandTotal.toFixed(2)}*\n\n`;

  msg += `*📊 BALANCE STATEMENT:*\n`;
  msg += `• Previous Balance: ₹${invoice.previousBalance.toFixed(2)}\n`;
  msg += `• Current Bill: ₹${invoice.grandTotal.toFixed(2)}\n`;
  msg += `• Amount Paid: ₹${invoice.paidAmount.toFixed(2)}\n`;
  msg += `• Current Bill Due: ₹${invoice.remainingAmount.toFixed(2)}\n`;
  msg += `• *TOTAL OUTSTANDING DUE: ₹${invoice.totalOutstandingAfter.toFixed(2)}*\n\n`;

  if (settings.upiId) {
    msg += `💳 *Pay via UPI:* ${settings.upiId}\n`;
  }
  msg += `\n_${settings.invoiceFooterNote}_\n`;
  msg += `📞 Contact: ${settings.mobileNumber}`;

  return msg;
}

export function openWhatsAppShare(invoice: Invoice, settings: BusinessSetting) {
  const message = generateWhatsAppInvoiceMessage(invoice, settings);
  const phone = (invoice.customer?.mobileNumber || '').replace(/[^0-9]/g, '');
  const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

