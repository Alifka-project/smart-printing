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
  email?: QuoteEmail;
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
  approval?: QuoteApproval;
  email?: QuoteEmail;
}

// === Untuk modal view di Step 1 ===
export type QuoteStatus = 'Approved' | 'Pending' | 'Rejected';

export interface QuoteDetail {
  id: string;
  date: string; // ISO

  // ringkasan client (untuk tabel / badge)
  clientName: string;  // redundan utk kemudahan list

  // data client lengkap untuk autofill Step 2
  client: {
    clientType: "Individual" | "Company";
    companyName: string;     // kalau Individual, boleh kosong
    contactPerson: string;
    email: string;
    phone: string;
    countryCode: string;     // contoh: "+971"
    role: string;            // jabatan / role di perusahaan
  };

  // ringkasan produk (Step 3)
  product: string;
  quantity: number;
  sides: "1" | "2";
  printing: PrintingSelection | string;
  papers: Paper[];
  finishing: string[];
  finishingComments?: string;  // Comments for finishing details (e.g., "gold foil", "silver foil")
  colors?: {
    front?: string;
    back?: string;
  };

  // ringkasan harga/status (untuk modal Step 1)
  amounts: {
    base: number;
    vat: number;
    total: number;
    status: QuoteStatus;
  };
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
}

// === Snapshot penuh untuk autofill dari Step 1 ===
export interface PreviousQuoteSnapshot {
  id: string;
  date: string; // ISO
  form: QuoteFormData;
}

// === Factory helper (opsional, memudahkan inisialisasi) ===
export const createEmptyProduct = (): Product => ({
  productName: 'Business Card',
  paperName: '',
  quantity: null,
  sides: '1',
  printingSelection: 'Digital',
  flatSize: { width: null, height: null, spine: null },
  closeSize: { width: null, height: null, spine: null },
  useSameAsFlat: false,
  papers: [{ name: '', gsm: '' }],
  finishing: [],
  finishingComments: '',
});

export const createEmptyForm = (): QuoteFormData => ({
  client: {
    clientType: 'Company',
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    countryCode: '+971',
    role: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    additionalInfo: '',
  },
  products: [createEmptyProduct()],
  operational: {
    papers: [],
    finishing: [],
    plates: null,
    units: null,
  },
  calculation: {
    basePrice: 0,
    marginAmount: 0,
    marginPercentage: 15, // Default 15% margin
    subtotal: 0,
    discount: {
      isApplied: false,
      percentage: 0,
      amount: 0,
    },
    finalSubtotal: 0,
    vatAmount: 0,
    totalPrice: 0,
  },
  approval: {
    status: 'Draft'
  },
  email: {
    to: '',
    cc: [],
    subject: 'Printing Quote - {Company Name}',
    body: 'Please find attached our quote for your printing requirements.',
    attachments: {
      customerCopy: true,
      operationsCopy: false
    }
  }
});
