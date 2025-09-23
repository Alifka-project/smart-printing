// Currency and approval workflow utilities

// AED Currency formatter
export const formatAED = (amount: number): string => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// AED Currency formatter without symbol (for calculations)
export const formatAEDNumber = (amount: number): string => {
  return new Intl.NumberFormat('en-AE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Approval workflow constants
export const APPROVAL_CRITERIA = {
  DISCOUNT_THRESHOLD: 20, // 20% discount triggers approval
  MARGIN_THRESHOLD: 10,   // Less than 10% margin triggers approval
  AMOUNT_THRESHOLD: 5000, // AED 5,000+ triggers approval
} as const;

// Check if quote requires approval
export const requiresApproval = (
  discountPercentage: number,
  marginPercentage: number,
  totalAmount: number
): boolean => {
  return (
    discountPercentage >= APPROVAL_CRITERIA.DISCOUNT_THRESHOLD ||
    marginPercentage < APPROVAL_CRITERIA.MARGIN_THRESHOLD ||
    totalAmount >= APPROVAL_CRITERIA.AMOUNT_THRESHOLD
  );
};

// Get approval reason
export const getApprovalReason = (
  discountPercentage: number,
  marginPercentage: number,
  totalAmount: number
): string => {
  const reasons: string[] = [];
  
  if (discountPercentage >= APPROVAL_CRITERIA.DISCOUNT_THRESHOLD) {
    reasons.push(`Discount applied (${discountPercentage}%) is ${discountPercentage >= APPROVAL_CRITERIA.DISCOUNT_THRESHOLD ? '≥' : '<'} ${APPROVAL_CRITERIA.DISCOUNT_THRESHOLD}%`);
  }
  
  if (marginPercentage < APPROVAL_CRITERIA.MARGIN_THRESHOLD) {
    reasons.push(`Margin (${marginPercentage}%) is < ${APPROVAL_CRITERIA.MARGIN_THRESHOLD}%`);
  }
  
  if (totalAmount >= APPROVAL_CRITERIA.AMOUNT_THRESHOLD) {
    reasons.push(`Quote value (${formatAED(totalAmount)}) is ≥ ${formatAED(APPROVAL_CRITERIA.AMOUNT_THRESHOLD)}`);
  }
  
  return reasons.join('; ');
};

// Calculate margin percentage
export const calculateMarginPercentage = (
  basePrice: number,
  totalPrice: number
): number => {
  if (basePrice === 0) return 0;
  return ((totalPrice - basePrice) / basePrice) * 100;
};

// Calculate margin amount
export const calculateMarginAmount = (
  basePrice: number,
  marginPercentage: number
): number => {
  return (basePrice * marginPercentage) / 100;
};

// Calculate discount amount
export const calculateDiscountAmount = (
  subtotal: number,
  discountPercentage: number
): number => {
  return (subtotal * discountPercentage) / 100;
};

// Calculate final price after discount
export const calculateFinalPrice = (
  subtotal: number,
  discountAmount: number,
  vatPercentage: number = 5
): { finalSubtotal: number; vatAmount: number; totalPrice: number } => {
  const finalSubtotal = subtotal - discountAmount;
  const vatAmount = (finalSubtotal * vatPercentage) / 100;
  const totalPrice = finalSubtotal + vatAmount;
  
  return {
    finalSubtotal,
    vatAmount,
    totalPrice
  };
};

// Format approval status for display
export const formatApprovalStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'Draft': 'Draft',
    'Pending Approval': 'Pending Approval',
    'Approved': 'Approved',
    'Rejected': 'Rejected',
    'Completed': 'Completed'
  };
  
  return statusMap[status] || status;
};

// Get approval status color for UI
export const getApprovalStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'Draft': 'bg-gray-100 text-gray-700',
    'Pending Approval': 'bg-yellow-100 text-yellow-700',
    'Approved': 'bg-green-100 text-green-700',
    'Rejected': 'bg-red-100 text-red-700',
    'Completed': 'bg-blue-100 text-blue-700'
  };
  
  return colorMap[status] || 'bg-gray-100 text-gray-700';
};

// Check if user can approve quotes
export const canApproveQuotes = (userRole: string): boolean => {
  return ['admin', 'manager'].includes(userRole);
};

// Check if user can send quotes to customers
export const canSendToCustomer = (
  approvalStatus: string,
  requiresApproval: boolean,
  customerPdfEnabled: boolean,
  sendToCustomerEnabled: boolean
): boolean => {
  if (!customerPdfEnabled || !sendToCustomerEnabled) {
    return false;
  }
  
  if (requiresApproval && approvalStatus !== 'Approved') {
    return false;
  }
  
  return true;
};
