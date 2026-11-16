export type UserRole = 'ADMIN' | 'STAFF';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

export interface Customer {
  id: string;
  shopName: string;
  ownerName: string;
  mobileNumber: string;
  address: string;
  openingBalance: number;
  currentOutstandingBalance: number;
  creditLimit?: number | null;
  notes?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  _count?: {
    invoices: number;
    payments: number;
  };
}

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  sellingPrice: number;
  costPrice: number;
  defaultQuantity: number;
  currentStock: number;
  lowStockThreshold: number;
  stockTracking: boolean;
  sourceType: 'IN_HOUSE' | 'OUTSIDE_PURCHASE'; // 'IN_HOUSE' (Own Bake) | 'OUTSIDE_PURCHASE' (From other shop)
  vendorShopName?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id?: string;
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  costPrice?: number;
  sourceType?: string;
  vendorShopName?: string | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerId: string;
  subtotal: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  previousBalance: number;
  totalOutstandingAfter: number;
  status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'CANCELLED';
  paymentMethod?: string | null;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  createdById?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  receiptNumber: string;
  paymentDate: string;
  customerId: string;
  invoiceId?: string | null;
  amount: number;
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER';
  transactionReference?: string | null;
  notes?: string | null;
  createdById?: string | null;
  createdAt: string;
  customer?: Customer;
  invoice?: Invoice;
}

export interface CustomerTransaction {
  id: string;
  customerId: string;
  date: string;
  type: 'INVOICE' | 'PAYMENT' | 'OPENING_BALANCE' | 'ADJUSTMENT' | 'INVOICE_CANCELLED';
  referenceId?: string | null;
  referenceNumber?: string | null;
  debit: number;
  credit: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
  customer?: Customer;
}

export interface StockMovement {
  id: string;
  productId: string;
  date: string;
  type: 'OPENING' | 'PURCHASE_IN' | 'SALE_OUT' | 'SALE_RETURN' | 'ADJUSTMENT';
  quantity: number;
  balanceAfter: number;
  referenceId?: string | null;
  vendorShopName?: string | null;
  unitCost?: number | null;
  notes?: string | null;
  createdAt: string;
  product?: Product;
}

export interface BusinessSetting {
  id: string;
  businessName: string;
  tagline: string;
  address: string;
  mobileNumber: string;
  gstNumber?: string | null;
  invoicePrefix: string;
  currency: string;
  thermalPrinterWidth: '58mm' | '80mm';
  upiId: string;
  upiName: string;
  allowNegativeStock: boolean;
  invoiceFooterNote: string;
  updatedAt: string;
}

export interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  todayProductsSupplied: number;
  todayPaymentsReceived: number;
  totalOutstandingCredit: number;
  totalCustomers: number;
  monthlySales: number;
  monthlyCollection: number;
  pendingPaymentsCount: number;
  salesChart: { date: string; sales: number; payments: number }[];
  recentBills: Invoice[];
  topCustomers: { id: string; shopName: string; totalSales: number; ordersCount: number; balance: number }[];
  mostSoldProducts: { id: string; name: string; quantity: number; unit: string; totalAmount: number }[];
  customerOutstandingList: { id: string; shopName: string; ownerName: string; mobileNumber: string; balance: number }[];
}

