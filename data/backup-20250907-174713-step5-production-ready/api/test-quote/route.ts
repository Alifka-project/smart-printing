import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('🧪 Testing quote creation with minimal data...');
    
    // Test with minimal quote data
    const testQuoteData = {
      date: new Date(),
      status: "Pending",
      clientId: "test-client-id",
      userId: "test-user-id",
      product: "Test Product",
      quantity: 100,
      sides: "1",
      printing: "Digital",
      quoteId: "QT-2025-0830-001",
      colors: "{\"front\":\"\",\"back\":\"\"}",
      operational: {
        plates: 2,
        units: 100
      }
    };
    
    console.log('Test quote data:', testQuoteData);
    
    // Try to create the quote
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testQuoteData),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Test quote created successfully:', result);
      return NextResponse.json({
        status: 'success',
        message: 'Test quote created successfully',
        quote: result
      });
    } else {
      const errorText = await response.text();
      console.error('❌ Test quote creation failed:', response.status, errorText);
      return NextResponse.json({
        status: 'error',
        error: `Failed to create test quote: ${response.status} - ${errorText}`,
        statusCode: response.status
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('💥 Test quote creation error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
