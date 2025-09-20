import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for test OTPs (in production, use a proper database)
const testOtpStore = new Map<string, { code: string; expiresAt: number }>();

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test OTP Send API called');
    
    const { phoneNumber } = await request.json();
    console.log('📱 Phone number received:', phoneNumber);

    if (!phoneNumber) {
      console.error('❌ Phone number is missing');
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Generate a fake 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes expiry
    
    // Store the OTP (in production, use Redis or database)
    testOtpStore.set(phoneNumber, { code: otpCode, expiresAt });
    
    console.log(`✅ Test OTP generated for ${phoneNumber}: ${otpCode}`);
    
    // In development, log the OTP to console for easy testing
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 TEST OTP for ${phoneNumber}: ${otpCode}`);
      console.log(`⏰ OTP expires at: ${new Date(expiresAt).toLocaleString()}`);
    }
    
    return NextResponse.json({
      success: true,
      sessionId: `test-session-${Date.now()}`,
      message: 'Test verification code sent successfully',
      // Only include OTP in development
      ...(process.env.NODE_ENV === 'development' && { testOtp: otpCode })
    });
    
  } catch (error) {
    console.error('💥 Unexpected error in test OTP send API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test OTP Send API - Use POST method with phoneNumber',
    usage: {
      method: 'POST',
      body: { phoneNumber: '+1234567890' },
      note: 'This is a test endpoint that generates fake OTPs for development'
    }
  });
}
