import type { DigitalPricing, OffsetPricing } from '../types';

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

// === Default Pricing Constants ===
export const DEFAULT_DIGITAL_PRICING: DigitalPricing = {
  perClick: 0.05,
  parentSheetCost: 2.50,
  wasteParents: 0
};

export const DEFAULT_OFFSET_PRICING: OffsetPricing = {
  parentCost: 2.50,
  plateCost: 25.00,
  makeReadySetup: 50.00,
  makeReadySheets: 10,
  runPer1000: 15.00,
  cutOpRate: 2.00
};
