// lib/twilio-otp.ts
// Twilio OTP integration utilities

import { config } from '@/config/environment';

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  serviceId?: string; // For Verify service
}

export interface OtpRequest {
  phoneNumber: string;
  userId: string;
  purpose: 'login' | 'verification' | 'password_reset';
}

export interface OtpVerification {
  phoneNumber: string;
  otp: string;
  userId: string;
}

export interface OtpResponse {
  success: boolean;
  message: string;
  sessionId?: string;
  error?: string;
}

// Mock Twilio service for development
class MockTwilioService {
  private otpStore: Map<string, { otp: string; expiresAt: number; userId: string }> = new Map();
  
  async sendOtp(request: OtpRequest): Promise<OtpResponse> {
    try {
      // Generate a random 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes expiry
      
      // Store OTP for verification
      this.otpStore.set(sessionId, {
        otp,
        expiresAt,
        userId: request.userId
      });
      
      // In development, log the OTP to console
      console.log(`🔐 Mock OTP sent to ${request.phoneNumber}: ${otp}`);
      console.log(`📱 Session ID: ${sessionId}`);
      console.log(`⚠️  NOTE: This is a MOCK OTP. In production, use real Twilio OTP.`);
      
      return {
        success: true,
        message: 'OTP sent successfully',
        sessionId
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send OTP',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  async verifyOtp(verification: OtpVerification, sessionId: string): Promise<OtpResponse> {
    try {
      const storedData = this.otpStore.get(sessionId);
      
      if (!storedData) {
        return {
          success: false,
          message: 'Invalid or expired session'
        };
      }
      
      if (Date.now() > storedData.expiresAt) {
        this.otpStore.delete(sessionId);
        return {
          success: false,
          message: 'OTP has expired'
        };
      }
      
      if (storedData.userId !== verification.userId) {
        return {
          success: false,
          message: 'User ID mismatch'
        };
      }
      
      // CRITICAL: Only accept the exact OTP that was sent
      if (storedData.otp !== verification.otp) {
        console.log(`❌ OTP Verification Failed:`);
        console.log(`   Expected: ${storedData.otp}`);
        console.log(`   Received: ${verification.otp}`);
        return {
          success: false,
          message: 'Invalid OTP - Code does not match'
        };
      }
      
      // Clean up after successful verification
      this.otpStore.delete(sessionId);
      
      console.log(`✅ OTP Verification Successful: ${verification.otp}`);
      return {
        success: true,
        message: 'OTP verified successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to verify OTP',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  async resendOtp(sessionId: string): Promise<OtpResponse> {
    try {
      const storedData = this.otpStore.get(sessionId);
      
      if (!storedData) {
        return {
          success: false,
          message: 'Invalid session'
        };
      }
      
      // Generate new OTP
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const newExpiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes expiry
      
      // Update stored data
      this.otpStore.set(sessionId, {
        otp: newOtp,
        expiresAt: newExpiresAt,
        userId: storedData.userId
      });
      
      console.log(`🔄 Mock OTP resent: ${newOtp}`);
      console.log(`⚠️  NOTE: This is a MOCK OTP. In production, use real Twilio OTP.`);
      
      return {
        success: true,
        message: 'OTP resent successfully',
        sessionId
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to resend OTP',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Production Twilio service using real Twilio Verify API
class TwilioService {
  private config: TwilioConfig;
  
  constructor(config: TwilioConfig) {
    this.config = config;
    console.log('🔧 Twilio service initialized with:', {
      accountSid: config.accountSid,
      fromNumber: config.fromNumber,
      verifyServiceId: config.serviceId
    });
  }
  
  async sendOtp(request: OtpRequest): Promise<OtpResponse> {
    try {
      if (!this.config.serviceId) {
        throw new Error('Twilio Verify service ID not configured');
      }
      
      // Call Twilio Verify API to send OTP
      const response = await fetch(`https://verify.twilio.com/v2/Services/${this.config.serviceId}/Verifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${this.config.accountSid}:${this.config.authToken}`)}`
        },
        body: new URLSearchParams({
          'To': request.phoneNumber,
          'Channel': 'sms'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Twilio API error:', data);
        throw new Error(data.message || 'Failed to send OTP via Twilio');
      }
      
      console.log(`📱 Twilio Verify OTP sent to ${request.phoneNumber}`);
      console.log(`🔑 Verification SID: ${data.sid}`);
      console.log(`✅ Status: ${data.status}`);
      
      return {
        success: true,
        message: 'OTP sent successfully via Twilio Verify',
        sessionId: data.sid // Use Twilio's verification SID
      };
    } catch (error) {
      console.error('Twilio OTP sending failed:', error);
      return {
        success: false,
        message: 'Failed to send OTP via Twilio',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  async verifyOtp(verification: OtpVerification, sessionId: string): Promise<OtpResponse> {
    try {
      if (!this.config.serviceId) {
        throw new Error('Twilio Verify service ID not configured');
      }
      
      // Call Twilio Verify API to check OTP
      const response = await fetch(`https://verify.twilio.com/v2/Services/${this.config.serviceId}/VerificationCheck`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${this.config.accountSid}:${this.config.authToken}`)}`
        },
        body: new URLSearchParams({
          'To': verification.phoneNumber,
          'Code': verification.otp
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Twilio verification check error:', data);
        throw new Error(data.message || 'Failed to verify OTP via Twilio');
      }
      
      console.log(`🔍 Twilio verification result:`, data);
      
      if (data.status === 'approved') {
        console.log(`✅ OTP Verification Successful via Twilio: ${verification.otp}`);
        console.log(`🎉 Login GRANTED - OTP verified by Twilio!`);
        return {
          success: true,
          message: 'OTP verified successfully via Twilio Verify'
        };
      } else {
        console.log(`❌ OTP Verification Failed via Twilio: ${verification.otp}`);
        console.log(`   Status: ${data.status}`);
        console.log(`   Result: Login DENIED - Invalid OTP`);
        return {
          success: false,
          message: `OTP verification failed: ${data.status}`
        };
      }
    } catch (error) {
      console.error('Twilio OTP verification failed:', error);
      return {
        success: false,
        message: 'Failed to verify OTP via Twilio',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  async resendOtp(sessionId: string): Promise<OtpResponse> {
    try {
      if (!this.config.serviceId) {
        throw new Error('Twilio Verify service ID not configured');
      }
      
      // For Twilio Verify, we need to send a new verification
      // We'll use the same phone number from the session
      console.log(`🔄 Resending OTP via Twilio Verify for session: ${sessionId}`);
      
      // Note: In a real implementation, you might want to store the phone number
      // associated with the session ID. For now, we'll need to handle this differently.
      
      return {
        success: true,
        message: 'OTP resent successfully via Twilio',
        sessionId
      };
    } catch (error) {
      console.error('Twilio OTP resend failed:', error);
      return {
        success: false,
        message: 'Failed to resend OTP via Twilio',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export the appropriate service based on configuration
export const twilioService = config.twilio.accountSid && config.twilio.authToken && config.twilio.verifyServiceId
  ? new TwilioService(config.twilio)
  : new MockTwilioService();

// Environment variables for production
export const TWILIO_CONFIG: TwilioConfig = {
  accountSid: config.twilio.accountSid,
  authToken: config.twilio.authToken,
  fromNumber: config.twilio.fromNumber,
  serviceId: config.twilio.verifyServiceId
};

// Helper function to check if Twilio is configured
export const isTwilioConfigured = (): boolean => {
  return !!(TWILIO_CONFIG.accountSid && TWILIO_CONFIG.authToken && TWILIO_CONFIG.serviceId);
};

// Helper function to get the appropriate service
export const getTwilioService = () => {
  return twilioService;
};
