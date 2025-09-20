import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Vercel Environment Check API called');
    
    // Check all critical environment variables
    const envCheck = {
      // Twilio Configuration
      hasTwilioAccountSid: !!process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID,
      hasTwilioAuthToken: !!process.env.NEXT_PUBLIC_TWILIO_AUTH_TOKEN,
      hasTwilioServiceId: !!process.env.NEXT_PUBLIC_TWILIO_VERIFY_SERVICE_ID,
      hasTwilioFromNumber: !!process.env.NEXT_PUBLIC_TWILIO_FROM_NUMBER,
      
      // Database Configuration
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      
      // App Configuration
      nodeEnv: process.env.NODE_ENV,
      vercelUrl: process.env.VERCEL_URL,
      
      // Values (masked for security)
      accountSidPrefix: process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID?.substring(0, 3) || 'N/A',
      serviceIdPrefix: process.env.NEXT_PUBLIC_TWILIO_VERIFY_SERVICE_ID?.substring(0, 3) || 'N/A',
      authTokenLength: process.env.NEXT_PUBLIC_TWILIO_AUTH_TOKEN?.length || 0,
      
      // Timestamp
      timestamp: new Date().toISOString(),
      deployment: process.env.VERCEL_ENV || 'unknown'
    };
    
    console.log('🔧 Environment check result:', envCheck);
    
    // Check if all required Twilio variables are present
    const allTwilioPresent = envCheck.hasTwilioAccountSid && 
                            envCheck.hasTwilioAuthToken && 
                            envCheck.hasTwilioServiceId;
    
    return NextResponse.json({
      success: true,
      message: allTwilioPresent ? 'All Twilio credentials are configured' : 'Some Twilio credentials are missing',
      environment: envCheck,
      twilioStatus: {
        configured: allTwilioPresent,
        missing: {
          accountSid: !envCheck.hasTwilioAccountSid,
          authToken: !envCheck.hasTwilioAuthToken,
          serviceId: !envCheck.hasTwilioServiceId,
          fromNumber: !envCheck.hasTwilioFromNumber
        }
      },
      recommendations: allTwilioPresent ? [
        'All environment variables are set correctly',
        'If OTP still fails, check Twilio account status and IP restrictions'
      ] : [
        'Set missing environment variables in Vercel dashboard',
        'Go to Settings → Environment Variables',
        'Redeploy after adding variables'
      ]
    });
    
  } catch (error) {
    console.error('💥 Error in Vercel check API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
