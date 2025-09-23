// lib/transform-quote-data.ts
// Utility functions to transform database quote data to form format

export interface DatabaseQuote {
  id: string;
  quoteId: string;
  date: Date;
  status: string;
  clientId: string;
  userId?: string;
  product: string;
  quantity: number;
  sides: string;
  printing: string;
  colors?: string | null;
  productName?: string | null;
  printingSelection?: string | null;
  flatSizeWidth?: number | null;
  flatSizeHeight?: number | null;
  flatSizeSpine?: number | null;
  closeSizeWidth?: number | null;
  closeSizeHeight?: number | null;
  closeSizeSpine?: number | null;
  useSameAsFlat?: boolean | null;
  finishingComments?: string | null;
  approvalStatus?: string | null;
  requiresApproval?: boolean | null;
  approvalReason?: string | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  approvalNotes?: string | null;
  discountPercentage?: number | null;
  discountAmount?: number | null;
  marginPercentage?: number | null;
  marginAmount?: number | null;
  customerPdfEnabled?: boolean | null;
  sendToCustomerEnabled?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  // Relationships
  client?: any;
  user?: any;
  amounts?: any[];
  finishing?: Array<{ id: string; name: string; quoteId: string; cost?: number | null }>;
  papers?: Array<{ id: string; name: string; gsm: string; quoteId: string; [key: string]: any }>;
  QuoteOperational?: any;
}

export interface FormattedQuote {
  id: string;
  quoteId: string;
  date: Date;
  status: string;
  clientId: string;
  userId?: string;
  product: string;
  quantity: number;
  sides: string;
  printing: string;
  colors?: string | null;
  productName?: string | null;
  printingSelection?: string | null;
  flatSizeWidth?: number | null;
  flatSizeHeight?: number | null;
  flatSizeSpine?: number | null;
  closeSizeWidth?: number | null;
  closeSizeHeight?: number | null;
  closeSizeSpine?: number | null;
  useSameAsFlat?: boolean | null;
  finishingComments?: string | null;
  approvalStatus?: string | null;
  requiresApproval?: boolean | null;
  approvalReason?: string | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  approvalNotes?: string | null;
  discountPercentage?: number | null;
  discountAmount?: number | null;
  marginPercentage?: number | null;
  marginAmount?: number | null;
  customerPdfEnabled?: boolean | null;
  sendToCustomerEnabled?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  // Transformed relationships
  client?: any;
  user?: any;
  amounts?: any[];
  // Transform finishing from objects to string array for form compatibility
  finishing: string[];
  // Transform papers to simplified format for form compatibility
  papers: Array<{ name: string; gsm: string }>;
  QuoteOperational?: any;
}

/**
 * Transform database quote data to form-compatible format
 * This ensures finishing options are properly converted from objects to strings
 */
export function transformQuoteData(quote: DatabaseQuote): FormattedQuote {
  return {
    ...quote,
    // Transform finishing from array of objects to array of strings
    finishing: quote.finishing?.map(f => f.name) || [],
    // Transform papers to simplified format
    papers: quote.papers?.map(p => ({
      name: p.name,
      gsm: p.gsm
    })) || []
  };
}

/**
 * Transform an array of database quotes to form-compatible format
 */
export function transformQuotesData(quotes: DatabaseQuote[]): FormattedQuote[] {
  return quotes.map(transformQuoteData);
}
