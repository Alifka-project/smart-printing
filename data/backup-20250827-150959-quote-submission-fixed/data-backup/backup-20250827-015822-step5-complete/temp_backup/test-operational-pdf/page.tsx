"use client";

import { useState } from 'react';
import { generateOperationalPDF, generateComprehensiveOperationalPDF } from '@/lib/quote-pdf';
import { createEmptyForm } from '@/types';

export default function TestOperationalPDF() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');

  // Create sample data for testing
  const createSampleData = () => {
    const formData = createEmptyForm();
    
    // Enhance with sample operational data
    formData.operational = {
      papers: [
        {
          inputWidth: 21.0,
          inputHeight: 29.7,
          pricePerPacket: 25.50,
          pricePerSheet: 0.85,
          sheetsPerPacket: 30,
          recommendedSheets: 100,
          enteredSheets: 120,
          outputWidth: 5.5,
          outputHeight: 9.0,
          selectedColors: ['CMYK', 'Spot Color']
        },
        {
          inputWidth: 21.0,
          inputHeight: 29.7,
          pricePerPacket: 30.00,
          pricePerSheet: 1.00,
          sheetsPerPacket: 30,
          recommendedSheets: 80,
          enteredSheets: 100,
          outputWidth: 5.5,
          outputHeight: 9.0,
          selectedColors: ['CMYK']
        }
      ],
      finishing: [
        { name: 'UV Spot', cost: 0.15 },
        { name: 'Foil Stamping', cost: 0.25 },
        { name: 'Embossing', cost: 0.20 }
      ],
      plates: 2,
      units: 1000
    };

    // Enhance products with sample data
    formData.products[0] = {
      ...formData.products[0],
      productName: 'Premium Business Cards',
      quantity: 1000,
      printingSelection: 'Offset',
      sides: '2',
      flatSize: { width: 5.5, height: 9.0, spine: 0.0 },
      closeSize: { width: 5.5, height: 9.0, spine: 0.0 },
      useSameAsFlat: true,
      colors: { front: '4 Colors (CMYK) + Spot', back: '2 Colors (CMYK)' },
      paperName: 'Premium Card Stock 350 GSM',
      finishing: ['UV Spot', 'Foil Stamping'],
      papers: [
        { name: 'Premium Card Stock', gsm: '350' },
        { name: 'Premium Card Stock', gsm: '350' }
      ]
    };

    // Enhance client data
    formData.client = {
      ...formData.client,
      clientType: 'Company',
      companyName: 'Eagan Inc.',
      contactPerson: 'John Eagan',
      email: 'john.e@eagan.com',
      phone: '50 123 4567',
      countryCode: '+971',
      role: 'CEO',
      address: 'Sheikh Zayed Road, Business Bay',
      city: 'Dubai',
      state: 'Dubai',
      postalCode: '12345',
      country: 'UAE'
    };

    return formData;
  };

  const generateBasicOperationalPDF = async () => {
    setIsGenerating(true);
    setMessage('Generating basic operational PDF...');
    
    try {
      const sampleData = createSampleData();
      const pdfBytes = await generateOperationalPDF('QT-2025-001', sampleData);
      
      // Create and download PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'operational-job-order-basic.pdf';
      link.click();
      URL.revokeObjectURL(url);
      
      setMessage('Basic operational PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      setMessage('Error generating PDF. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateComprehensiveOperationalPDF = async () => {
    setIsGenerating(true);
    setMessage('Generating comprehensive operational PDF...');
    
    try {
      const sampleData = createSampleData();
      const pdfBytes = await generateComprehensiveOperationalPDF('QT-2025-001', sampleData);
      
      // Create and download PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'operational-job-order-comprehensive.pdf';
      link.click();
      URL.revokeObjectURL(url);
      
      setMessage('Comprehensive operational PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      setMessage('Error generating PDF. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Operational PDF Generation Test
          </h1>
          
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">
                What This Demonstrates
              </h2>
              <ul className="space-y-2 text-blue-800">
                <li>• <strong>Basic Operational PDF:</strong> Standard operational job order with essential details</li>
                <li>• <strong>Comprehensive Operational PDF:</strong> Complete operational details including:</li>
                <li className="ml-4">- Complete client information and delivery details</li>
                <li className="ml-4">- Detailed product specifications from Step 3</li>
                <li className="ml-4">- Comprehensive operational specifications from Step 4</li>
                <li className="ml-4">- Paper specifications with cost calculations</li>
                <li className="ml-4">- Finishing specifications with instructions</li>
                <li className="ml-4">- Production cost breakdowns</li>
                <li className="ml-4">- Detailed production workflow instructions</li>
                <li className="ml-4">- Quality control checklist</li>
                <li className="ml-4">- Operations team signature sections</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={generateBasicOperationalPDF}
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {isGenerating ? 'Generating...' : 'Generate Basic Operational PDF'}
              </button>

              <button
                onClick={generateComprehensiveOperationalPDF}
                disabled={isGenerating}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {isGenerating ? 'Generating...' : 'Generate Comprehensive Operational PDF'}
              </button>
            </div>

            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes('Error') 
                  ? 'bg-red-50 border border-red-200 text-red-800' 
                  : 'bg-green-50 border border-green-200 text-green-800'
              }`}>
                {message}
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Sample Data Used
              </h3>
              <div className="text-sm text-gray-700 space-y-2">
                <p><strong>Client:</strong> Eagan Inc. - Premium business cards</p>
                <p><strong>Product:</strong> 1000 business cards, 5.5 × 9.0 cm, Offset printing</p>
                <p><strong>Paper:</strong> Premium Card Stock 350 GSM, 2 paper specifications</p>
                <p><strong>Finishing:</strong> UV Spot, Foil Stamping, Embossing</p>
                <p><strong>Operational:</strong> 2 plates, 1000 units, detailed cost calculations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


