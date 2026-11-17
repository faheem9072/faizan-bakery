'use client';

import React from 'react';
import { Invoice, BusinessSetting } from '@/lib/types';
import { generateReceiptText } from '@/lib/thermalPrinter';

interface ThermalReceiptProps {
  invoice: Invoice;
  settings: BusinessSetting;
  widthMode: '58mm' | '80mm';
}

export default function ThermalReceipt({
  invoice,
  settings,
  widthMode,
}: ThermalReceiptProps) {
  const receiptText = generateReceiptText(invoice, settings, widthMode);

  return (
    <div
      id="thermal-printable-area"
      className={`thermal-paper mx-auto p-4 rounded-sm transition-all select-text ${
        widthMode === '58mm' ? 'max-w-[310px] text-[12px]' : 'max-w-[420px] text-[13px]'
      }`}
      style={{
        fontFamily: "'Roboto Mono', Consolas, Menlo, Monaco, monospace",
      }}
    >
      <pre className="whitespace-pre font-mono font-medium leading-tight text-black m-0">
        {receiptText}
      </pre>
    </div>
  );
}

