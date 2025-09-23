// types/quote.ts

// === Step 1: List ringkas previous quote untuk tabel ===
export type PreviousQuote = {
  id: string;          // contoh: "QT-2025-0718"
  clientName: string;  // contoh: "Eagan Inc."
  date: string;        // ISO "YYYY-MM-DD"
};

// === Util tipe umum ===
export interface Size {
  width: number | null;
  height: number | null;
  spine: number | null;
}

export interface Paper {
  name: string;
  gsm: string;
}

export interface FinishingCost {
  name: string;
  cost: number | null;
}

export interface OperationalPaper {
  inputWidth: number | null;
  inputHeight: number | null;
  pricePerPacket: number | null;
  pricePerSheet?: number | null;  // Price per sheet
  sheetsPerPacket: number | null;
  recommendedSheets: number;
  enteredSheets: number | null;
  outputWidth: number | null;
  outputHeight: number | null;
  selectedColors?: string[];  // Array of selected colors for this paper
}

// Calculation result interface for operational calculations
export interface OperationalCalculation {
  layout: {
    usableW: number;
    usableH: number;
    itemsPerSheet: number;
    efficiency: number;
    orientation: "normal" | "rotated";
    itemsPerRow: number;
    itemsPerCol: number;
  };
  recommendedSheets: number;
  pricePerSheet: number | null;
}

// === Product (kanonik untuk Step 3) ===
export type PrintingSelection = 'Digital' | 'Offset' | 'Either' | 'Both';

export interface Product {
  productName: string;
  paperName: string;
  quantity: number | null;
  sides: '1' | '2';
  printingSelection: PrintingSelection;
  flatSize: Size;
  closeSize: Size;
  useSameAsFlat: boolean;
  papers: Paper[];
  finishing: string[];
  finishingComments?: string;  // Comments for finishing details (e.g., "gold foil", "silver foil")
  colors?: { front?: string; back?: string };  // Color specifications
}

// === Sales Person Types ===
export interface SalesPerson {
  id: string;
  salesPersonId: string; // EMP001, EMP002, etc.
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  designation: string;
  department: string;
  hireDate: string;
  status: "Active" | "Inactive";
  profilePicture?: string;
  address?: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// === Discount and Approval Types ===
export interface DiscountApproval {
  approvedBy: string;
  reason: string;
  approvedAt: Date;
}

export interface QuoteDiscount {
  isApplied: boolean;
  percentage: number;
  amount: number;
  approval?: DiscountApproval;
}

// === Quote Approval and Email Types ===
export interface QuoteApproval {
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedAt?: Date;
  approvalNotes?: string;
  requiresApproval: boolean;
  approvalReason?: string;
}

export interface QuoteEmail {
  to: string;
  cc: string[];
  subject: string;
  body: string;
  attachments?: {
    customerCopy: boolean;
    operationsCopy: boolean;
  };
}

export interface QuoteSubmission {
  action: 'Save Draft' | 'Send for Approval' | 'Send to Customer';
  approval?: QuoteApproval;
}

// === State utama form (dipakai Step 2–5) ===
export interface QuoteFormData {
  client: {
    clientType: 'Individual' | 'Company';
    companyName: string;
    contactPerson: string;
    firstName?: string;      // For individual clients
    lastName?: string;       // For individual clients
    email: string;
    emails?: string;         // JSON array of emails for CC functionality
    phone: string;
    countryCode: string;
    role: string;
    trn?: string;            // Tax Registration Number
    hasNoTrn?: boolean;      // Option to mark as "No TRN"
    address?: string;        // Address field (matches database schema)
    city?: string;
    area?: string;           // District/Area instead of city
    state?: string;
    postalCode?: string;
    country?: string;
    additionalInfo?: string;
  };
  products: Product[];
  operational: {
    papers: OperationalPaper[];
    finishing: FinishingCost[];
    plates: number | null;
    units: number | null;
    impressions?: number | null; // Temporary field for testing - will be removed after validation
  };
  calculation: {
    basePrice: number;
    marginAmount: number;
    marginPercentage: number; // Default 15%
    subtotal: number;
    discount?: QuoteDiscount;
    finalSubtotal: number;
    vatAmount: number;
    totalPrice: number;
  };
  // New approval workflow fields
  approval?: QuoteApproval;
  salesPersonId?: string; // Sales person ID who created the quote
}

// === Untuk halaman Quote Management ===
export interface QuoteRow {
  id: string;
  clientName: string;
  contactPerson: string;
  date: string;        // ISO "YYYY-MM-DD"
  amount: number;
  status: QuoteStatus;
  userId: string;
  // New fields for approval workflow
  approvalStatus: string;
  requiresApproval: boolean;
  salesPersonId?: string;
  customerPdfEnabled: boolean;
  sendToCustomerEnabled: boolean;
}

// === Snapshot penuh untuk autofill dari Step 1 ===
export interface PreviousQuoteSnapshot {
  id: string;
  client: QuoteFormData["client"];
  products: Product[];
  operational: QuoteFormData["operational"];
  calculation: QuoteFormData["calculation"];
  approval?: QuoteApproval;
  salesPersonId?: string;
}

// === Quote Status Types ===
export type QuoteStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Completed';

// === User Management Types ===
export type AppUserRole = 'admin' | 'manager' | 'user' | 'estimator';

export interface AppUser {
  id: string;
  displayId: string; // EMP001, EMP002, etc.
  name: string;
  email: string;
  joined: string;
  role: AppUserRole;
  status: 'Active' | 'Inactive';
  password: string;
  profilePicture: string | null;
  // New sales person fields
  salesPersonId?: string;
  isSalesPerson: boolean;
}

// === Supplier and Material Types ===
export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  countryCode: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  status: 'Active' | 'Inactive';
  materials: Material[];
}

export interface Material {
  id: string;
  materialId: string;
  name: string;
  gsm: string;
  supplierId: string;
  cost: number;
  unit: string;
  status: 'Active' | 'Inactive';
  lastUpdated: string;
}

// === Search Types ===
export interface SearchHistory {
  id: string;
  query: string;
  timestamp: string;
  userId?: string;
}

export interface SearchAnalytics {
  id: string;
  query: string;
  timestamp: string;
  userId?: string;
}

// === UAE Area Types ===
export interface UAEArea {
  id: string;
  name: string;
  state: string;
  country: string;
}

// === Currency and Pricing Types ===
export interface CurrencyConfig {
  code: 'AED';
  symbol: 'د.إ';
  name: 'UAE Dirham';
  decimalPlaces: 2;
}

// === Approval Workflow Types ===
export interface ApprovalCriteria {
  discountThreshold: number; // 20%
  marginThreshold: number;   // 10%
  amountThreshold: number;   // AED 5,000
}

export interface ApprovalDecision {
  approved: boolean;
  approvedBy: string;
  approvedAt: Date;
  notes?: string;
  reason?: string;
}
