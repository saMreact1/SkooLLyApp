export type FeeCategory =
  | 'TUITION' | 'TRANSPORT' | 'UNIFORM'
  | 'BOOKS' | 'EXAM' | 'ACTIVITY' | 'OTHER';

export type InvoiceStatus =
  | 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type PaymentMode =
  | 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'ONLINE' | 'OTHER';

export interface FeeTypeRequest {
  name: string;
  category: FeeCategory;
  description?: string;
}

export interface FeeTypeResponse {
  id: number;
  name: string;
  category: FeeCategory;
  description: string | null;
  active: boolean;
  createdAt: string;
}

export interface FeePlanRequest {
  feeTypeId: number;
  classroomId: number;
  sessionId: number;
  termId: number;
  amount: number;
  dueDate: string;
  isOptional: boolean;
  description?: string;
}

export interface FeePlanResponse {
  id: number;
  feeTypeId: number;
  feeTypeName: string;
  feeType: FeeTypeResponse;
  classroomId: number;
  classroomName: string;
  classroomSection: string;
  sessionId: number;
  sessionName: string;
  termId: number;
  termName: string;
  amount: number;
  dueDate: string;
  isOptional: boolean;
  description: string | null;
  active: boolean;
  createdAt: string;
}

export interface GenerateInvoiceRequest {
  classroomId: number;
  sessionId: number;
  termId: number;
  feePlanIds: number[];
}

export interface InvoiceItemResponse {
  id: number;
  feePlanId: number;
  feeTypeName: string;
  amount: number;
}

export interface InvoiceResponse {
  id: number;
  studentId: number;
  studentName: string;
  admissionNumber: string;
  currentClass: string;
  sessionId: number;
  sessionName: string;
  termId: number;
  termName: string;
  invoiceNo: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: InvoiceStatus;
  items: InvoiceItemResponse[];
  createdAt: string;
}

export interface PaymentRequest {
  invoiceId: number;
  amount: number;
  paymentMode: PaymentMode;
  reference?: string;
  paymentDate: string;
  remark?: string;
}

export interface PaymentResponse {
  id: number;
  invoiceId: number;
  invoiceNo: string;
  studentName: string;
  admissionNumber: string;
  amount: number;
  paymentMode: PaymentMode;
  reference: string | null;
  paymentDate: string;
  collectedByName: string;
  remark: string | null;
  receiptNo: string | null;
  createdAt: string;
}

export interface StudentBalanceResponse {
  studentId: number;
  studentName: string;
  admissionNumber: string;
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
  invoices: InvoiceResponse[];
}

export const FEE_CATEGORY_OPTIONS: { value: FeeCategory; label: string }[] = [
  { value: 'TUITION', label: 'Tuition' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'UNIFORM', label: 'Uniform' },
  { value: 'BOOKS', label: 'Books' },
  { value: 'EXAM', label: 'Exam' },
  { value: 'ACTIVITY', label: 'Activity' },
  { value: 'OTHER', label: 'Other' },
];

export const INVOICE_STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PARTIAL', label: 'Partially Paid' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const PAYMENT_MODE_OPTIONS: { value: PaymentMode; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'OTHER', label: 'Other' },
];
