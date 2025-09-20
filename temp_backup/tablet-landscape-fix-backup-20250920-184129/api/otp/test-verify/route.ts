import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for test OTPs (in production, use a proper database)
const testOtpStore = new Map<string, { code: string; expiresAt: number }>();

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test OTP Verify API called');
    
    const { phoneNumber, otp } = await request.json();
    console.log('📱 Verification request:', { phoneNumber, otp });

    if (!phoneNumber || !otp) {
      console.error('❌ Phone number or OTP is missing');
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    // Get stored OTP
    const storedOtp = testOtpStore.get(phoneNumber);
    
    if (!storedOtp) {
      console.error('❌ No OTP found for phone number:', phoneNumber);
      return NextResponse.json(
        { error: 'No verification code found. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    if (Date.now() > storedOtp.expiresAt) {
      console.error('❌ OTP expired for phone number:', phoneNumber);
      testOtpStore.delete(phoneNumber); // Clean up expired OTP
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (storedOtp.code !== otp) {
      console.error('❌ Invalid OTP for phone number:', phoneNumber);
      return NextResponse.json(
        { error: 'Invalid verification code. Please try again.' },
        { status: 400 }
      );
    }

    // OTP is valid - remove it from store
    testOtpStore.delete(phoneNumber);
    
    console.log(`✅ OTP verified successfully for ${phoneNumber}`);
    
    return NextResponse.json({
      success: true,
      message: 'Verification successful',
      verified: true
    });
    
  } catch (error) {
    console.error('💥 Unexpected error in test OTP verify API:', error);
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
    message: 'Test OTP Verify API - Use POST method with phoneNumber and otp',
    usage: {
      method: 'POST',
      body: { phoneNumber: '+1234567890', otp: '123456' },
      note: 'This is a test endpoint that validates fake OTPs for development'
    }
  });
}
