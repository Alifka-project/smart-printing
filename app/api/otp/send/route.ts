import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 OTP Send API called');
    
    const { phoneNumber } = await request.json();
    console.log('📱 Phone number received:', phoneNumber);

    if (!phoneNumber) {
      console.error('❌ Phone number is missing');
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Log environment variables (without exposing sensitive data)
    const accountSid = process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID;
    const authToken = process.env.NEXT_PUBLIC_TWILIO_AUTH_TOKEN;
    const serviceSid = process.env.NEXT_PUBLIC_TWILIO_VERIFY_SERVICE_ID;

    console.log('🔧 Environment check:', {
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
      hasServiceSid: !!serviceSid,
      accountSidLength: accountSid?.length || 0,
      authTokenLength: authToken?.length || 0,
      serviceSidLength: serviceSid?.length || 0
    });

    if (!accountSid || !authToken || !serviceSid) {
      console.error('❌ Twilio credentials missing:', {
        missingAccountSid: !accountSid,
        missingAuthToken: !authToken,
        missingServiceSid: !serviceSid
      });
      return NextResponse.json(
        { 
          error: 'Twilio service not configured',
          details: {
            missingAccountSid: !accountSid,
            missingAuthToken: !authToken,
            missingServiceSid: !serviceSid
          }
        },
        { status: 500 }
      );
    }

    console.log('✅ Twilio credentials found, proceeding with API call');

    const credentials = btoa(`${accountSid}:${authToken}`);
    console.log('🔑 Credentials encoded, length:', credentials.length);

    const twilioUrl = `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`;
    console.log('🌐 Calling Twilio URL:', twilioUrl);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'To': phoneNumber,
        'Channel': 'sms'
      })
    });

    console.log('📡 Twilio response status:', response.status);
    console.log('📡 Twilio response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('📡 Twilio response data:', data);

    if (response.ok) {
      console.log(`✅ OTP sent successfully to ${phoneNumber}, SID: ${data.sid}`);
      return NextResponse.json({
        success: true,
        sessionId: data.sid,
        message: 'OTP sent successfully'
      });
    } else {
      console.error('❌ Twilio API error:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      return NextResponse.json(
        { 
          error: data.message || `Twilio API error: ${response.status}`,
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
    console.error('💥 Unexpected error in OTP send API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
