import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 OTP Verify API called');
    
    const { phoneNumber, otp } = await request.json();
    console.log('📱 Verification request:', { phoneNumber, otpLength: otp?.length || 0 });

    if (!phoneNumber || !otp) {
      console.error('❌ Missing required fields:', { hasPhone: !!phoneNumber, hasOtp: !!otp });
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    const accountSid = process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID;
    const authToken = process.env.NEXT_PUBLIC_TWILIO_AUTH_TOKEN;
    const serviceSid = process.env.NEXT_PUBLIC_TWILIO_VERIFY_SERVICE_ID;
    const isDevelopment = process.env.NODE_ENV === 'development';

    console.log('🔧 Environment check for verify:', {
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
      hasServiceSid: !!serviceSid,
      isDevelopment
    });

    // Development bypass: Accept any 6-digit OTP if Twilio is not configured
    if (isDevelopment && (!accountSid || !authToken || !serviceSid)) {
      console.log('🔄 Development mode: Twilio not configured, accepting mock OTP verification');
      
      // In development mode, accept any 6-digit OTP
      if (otp && otp.length === 6 && /^\d{6}$/.test(otp)) {
        console.log(`✅ Development mode: Mock OTP verification successful for ${phoneNumber}`);
        return NextResponse.json({
          success: true,
          message: 'Mock OTP verified successfully (development mode)',
          isDevelopment: true
        });
      } else {
        console.log(`❌ Development mode: Invalid OTP format for ${phoneNumber}`);
        return NextResponse.json(
          { error: 'Invalid OTP format. Please enter a 6-digit number.' },
          { status: 400 }
        );
      }
    }

    if (!accountSid || !authToken || !serviceSid) {
      console.error('❌ Twilio credentials missing for verification');
      return NextResponse.json(
        { error: 'Twilio service not configured' },
        { status: 500 }
      );
    }

    console.log('✅ Twilio credentials found, proceeding with verification');

    const credentials = btoa(`${accountSid}:${authToken}`);
    const twilioUrl = `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`;
    
    console.log('🌐 Calling Twilio verification URL:', twilioUrl);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'To': phoneNumber,
        'Code': otp
      })
    });

    console.log('📡 Twilio verification response status:', response.status);

    const data = await response.json();
    console.log('📡 Twilio verification response data:', data);

    if (response.ok) {
      console.log(`🔍 OTP verification result for ${phoneNumber}:`, data);
      
      if (data.status === 'approved') {
        console.log('✅ OTP verification successful');
        return NextResponse.json({
          success: true,
          message: 'OTP verified successfully'
        });
      } else {
        console.log('❌ OTP verification failed:', data.status);
        return NextResponse.json(
          { error: `OTP verification failed: ${data.status}` },
          { status: 400 }
        );
      }
    } else {
      console.error('❌ Twilio verification error:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      return NextResponse.json(
        { 
          error: data.message || `Failed to verify OTP: ${response.status}`,
          details: {
            status: response.status,
            statusText: response.statusText,
            twilioError: data
          }
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('💥 Unexpected error in OTP verify API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
