import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 OTP Test API called');
    
    // Check environment variables
    const accountSid = process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID;
    const authToken = process.env.NEXT_PUBLIC_TWILIO_AUTH_TOKEN;
    const serviceSid = process.env.NEXT_PUBLIC_TWILIO_VERIFY_SERVICE_ID;
    
    const envCheck = {
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
      hasServiceSid: !!serviceSid,
      accountSidLength: accountSid?.length || 0,
      authTokenLength: authToken?.length || 0,
      serviceSidLength: serviceSid?.length || 0,
      accountSidPrefix: accountSid?.substring(0, 3) || 'N/A',
      serviceSidPrefix: serviceSid?.substring(0, 3) || 'N/A'
    };
    
    console.log('🔧 Environment check result:', envCheck);
    
    // Check if all required variables are present
    const allPresent = accountSid && authToken && serviceSid;
    
    return NextResponse.json({
      success: true,
      message: allPresent ? 'All Twilio credentials are configured' : 'Some Twilio credentials are missing',
      environment: {
        ...envCheck,
        allCredentialsPresent: allPresent
      },
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV
    });
    
  } catch (error) {
    console.error('💥 Error in OTP test API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
