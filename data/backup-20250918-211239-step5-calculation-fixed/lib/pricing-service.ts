import type { DigitalPricing, OffsetPricing } from '../types';
import { validatePricingConstants, validateExcelFormulas } from './excel-calculation';

// === Pricing Service ===
export class PricingService {
  // Fetch digital pricing from database
  static async getDigitalPricing(): Promise<DigitalPricing> {
    try {
      const response = await fetch('/api/digital');
      if (!response.ok) {
        throw new Error('Failed to fetch digital pricing');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching digital pricing:', error);
      // Return default pricing if API fails
      return DEFAULT_DIGITAL_PRICING;
    }
  }

  // Fetch offset pricing from database
  static async getOffsetPricing(): Promise<OffsetPricing> {
    try {
      const response = await fetch('/api/offset');
      if (!response.ok) {
        throw new Error('Failed to fetch offset pricing');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching offset pricing:', error);
      // Return default pricing if API fails
      return DEFAULT_OFFSET_PRICING;
    }
  }

  // Fetch both pricing types
  static async getAllPricing(): Promise<{
    digital: DigitalPricing;
    offset: OffsetPricing;
  }> {
    const [digital, offset] = await Promise.all([
      this.getDigitalPricing(),
      this.getOffsetPricing()
    ]);

    // Validate pricing constants alignment with Excel
    const validation = validatePricingConstants(digital, offset);
    if (!validation.isValid) {
      console.warn('⚠️ Pricing constants not aligned with Excel:', validation.errors);
    } else {
      console.log('✅ Pricing constants aligned with Excel');
    }

    // Run Excel formula validation on first load
    if (typeof window !== 'undefined') {
      validateExcelFormulas();
    }

    return { digital, offset };
  }

  // Update digital pricing
  static async updateDigitalPricing(pricing: DigitalPricing): Promise<DigitalPricing> {
    try {
      const response = await fetch('/api/digital', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pricing),
      });

      if (!response.ok) {
        throw new Error('Failed to update digital pricing');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating digital pricing:', error);
      throw error;
    }
  }

  // Update offset pricing
  static async updateOffsetPricing(pricing: OffsetPricing): Promise<OffsetPricing> {
    try {
      const response = await fetch('/api/offset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pricing),
      });

      if (!response.ok) {
        throw new Error('Failed to update offset pricing');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating offset pricing:', error);
      throw error;
    }
  }
}

// === Default Pricing Constants (Aligned with Excel) ===
export const DEFAULT_DIGITAL_PRICING: DigitalPricing = {
  perClick: 0.10,        // AED per click (from Excel)
  parentSheetCost: 5.00, // AED per parent sheet (from Excel)
  wasteParents: 3        // Fixed waste sheets (from Excel)
};

export const DEFAULT_OFFSET_PRICING: OffsetPricing = {
  parentCost: 8.00,      // AED per parent sheet (from Excel)
  plateCost: 120.00,     // AED per plate (from Excel)
  makeReadySetup: 200.00, // AED setup cost (from Excel)
  makeReadySheets: 10,   // Number of make-ready sheets (from Excel)
  runPer1000: 60.00,     // AED per 1000 impressions (from Excel)
  cutOpRate: 8.00        // AED per cut operation (from Excel)
};
