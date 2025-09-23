// config/environment.ts
// Environment configuration for SmartPrint System

export const config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'SmartPrint Print Management System',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@smartprint.com',
  },
  twilio: {
    accountSid: process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID || '',
    authToken: process.env.NEXT_PUBLIC_TWILIO_AUTH_TOKEN || '',
    fromNumber: process.env.NEXT_PUBLIC_TWILIO_FROM_NUMBER || '+971588712409',
    verifyServiceId: process.env.NEXT_PUBLIC_TWILIO_VERIFY_SERVICE_ID || '',
  },
  location: {
    allowedCountries: ['AE', 'IN', 'ID'],
    services: {
      ipapi: {
        url: 'https://ipapi.co',
        key: process.env.IPAPI_KEY || '',
      },
      ipinfo: {
        url: 'https://ipinfo.io',
        token: process.env.IPINFO_TOKEN || '',
      },
      ipgeolocation: {
        url: 'https://api.ipgeolocation.io',
        key: process.env.IPGEOLOCATION_KEY || '',
      },
    },
  },
  auth: {
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    otpExpiry: 5 * 60 * 1000, // 5 minutes
  },
};

// Helper functions
export const isTwilioConfigured = (): boolean => {
  return !!(config.twilio.accountSid && config.twilio.authToken);
};

export const isLocationServiceConfigured = (): boolean => {
  return !!(config.location.services.ipapi.key || config.location.services.ipinfo.token || config.location.services.ipgeolocation.key);
};

export const getConfig = () => config;
