// lib/location-utils.ts
// Location checking and validation utilities

export interface LocationData {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface LocationCheckResult {
  isAllowed: boolean;
  location: LocationData | null;
  error?: string;
  message: string;
}

// Allowed locations configuration
export const ALLOWED_LOCATIONS = {
  UAE: {
    countryCode: 'AE',
    country: 'United Arab Emirates',
    cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'],
    regions: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah']
  },
  India: {
    countryCode: 'IN',
    country: 'India',
    cities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat'],
    regions: ['Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal', 'Gujarat', 'Rajasthan']
  },
  Indonesia: {
    countryCode: 'ID',
    country: 'Indonesia',
    cities: ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Palembang', 'Makassar', 'Tangerang', 'Depok', 'Bekasi'],
    regions: ['DKI Jakarta', 'East Java', 'West Java', 'North Sumatra', 'Central Java', 'South Sumatra', 'South Sulawesi', 'Banten']
  }
};

// Check if a location is allowed
export const isLocationAllowed = (location: LocationData): boolean => {
  const allowedCountryCodes = Object.values(ALLOWED_LOCATIONS).map(loc => loc.countryCode);
  return allowedCountryCodes.includes(location.countryCode);
};

// Get detailed location information
export const getLocationDetails = (location: LocationData): { isAllowed: boolean; details: string } => {
  if (!isLocationAllowed(location)) {
    return {
      isAllowed: false,
      details: `${location.city}, ${location.country}`
    };
  }

  const locationConfig = Object.values(ALLOWED_LOCATIONS).find(
    loc => loc.countryCode === location.countryCode
  );

  if (locationConfig) {
    const isCityAllowed = locationConfig.cities.some(city => 
      city.toLowerCase() === location.city.toLowerCase()
    );
    const isRegionAllowed = locationConfig.regions.some(region => 
      region.toLowerCase() === location.region.toLowerCase()
    );

    if (isCityAllowed || isRegionAllowed) {
      return {
        isAllowed: true,
        details: `${location.city}, ${location.country}`
      };
    }
  }

  return {
    isAllowed: false,
    details: `${location.city}, ${location.country}`
  };
};

// Check user location using IP geolocation
export const checkUserLocation = async (): Promise<LocationCheckResult> => {
  try {
    // Try multiple IP geolocation services for better reliability
    const services = [
      'https://ipapi.co/json/',
      'https://ipinfo.io/json',
      'https://api.ipgeolocation.io/ipgeo?apiKey=free'
    ];

    let locationData: LocationData | null = null;
    let lastError: string = '';

    for (const service of services) {
      try {
        const response = await fetch(service, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          // Reduce timeout to 3 seconds for faster response
          signal: AbortSignal.timeout(3000)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Normalize data from different services
        if (service.includes('ipapi.co')) {
          locationData = {
            country: data.country_name,
            countryCode: data.country_code,
            region: data.region,
            city: data.city,
            latitude: data.latitude,
            longitude: data.longitude,
            timezone: data.timezone
          };
        } else if (service.includes('ipinfo.io')) {
          locationData = {
            country: data.country,
            countryCode: data.country,
            region: data.region,
            city: data.city,
            latitude: data.loc ? parseFloat(data.loc.split(',')[0]) : undefined,
            longitude: data.loc ? parseFloat(data.loc.split(',')[1]) : undefined,
            timezone: data.timezone
          };
        } else if (service.includes('ipgeolocation.io')) {
          locationData = {
            country: data.country_name,
            countryCode: data.country_code2,
            region: data.state_prov,
            city: data.city,
            latitude: data.latitude,
            longitude: data.longitude,
            timezone: data.timezone?.name
          };
        }

        if (locationData) {
          break; // Successfully got location data
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`Location service ${service} failed:`, lastError);
        continue; // Try next service
      }
    }

    if (!locationData) {
      return {
        isAllowed: false,
        location: null,
        error: 'All location services failed',
        message: 'Unable to verify your location. Please ensure you\'re accessing from Dubai (UAE), India, or Indonesia.'
      };
    }

    const locationDetails = getLocationDetails(locationData);
    
    if (locationDetails.isAllowed) {
      return {
        isAllowed: true,
        location: locationData,
        message: `Location verified: ${locationDetails.details}`
      };
    } else {
      return {
        isAllowed: false,
        location: locationData,
        error: 'Location not allowed',
        message: `Access denied. This system is only available in Dubai (UAE), India, and Indonesia. Your current location: ${locationDetails.details}`
      };
    }
  } catch (error) {
    return {
      isAllowed: false,
      location: null,
      error: 'Location check failed',
      message: 'Unable to verify your location. Please ensure you\'re accessing from Dubai (UAE), India, or Indonesia.'
    };
  }
};

// Mock location for development/testing
export const getMockLocation = (countryCode: 'AE' | 'IN' | 'ID'): LocationData => {
  const mockLocations = {
    AE: {
      country: 'United Arab Emirates',
      countryCode: 'AE',
      region: 'Dubai',
      city: 'Dubai',
      latitude: 25.2048,
      longitude: 55.2708,
      timezone: 'Asia/Dubai'
    },
    IN: {
      country: 'India',
      countryCode: 'IN',
      region: 'Maharashtra',
      city: 'Mumbai',
      latitude: 19.0760,
      longitude: 72.8777,
      timezone: 'Asia/Kolkata'
    },
    ID: {
      country: 'Indonesia',
      countryCode: 'ID',
      region: 'DKI Jakarta',
      city: 'Jakarta',
      latitude: -6.2088,
      longitude: 106.8456,
      timezone: 'Asia/Jakarta'
    }
  };

  return mockLocations[countryCode];
};

// Validate phone number format for different countries
export const validatePhoneNumber = (phoneNumber: string, countryCode: string): boolean => {
  const phonePatterns = {
    AE: /^(\+971|971)?[0-9]{9}$/, // UAE: +971 50 123 4567
    IN: /^(\+91|91)?[0-9]{10}$/,  // India: +91 98765 43210
    ID: /^(\+62|62)?[0-9]{9,12}$/ // Indonesia: +62 812 3456 7890
  };

  const pattern = phonePatterns[countryCode as keyof typeof phonePatterns];
  if (!pattern) return false;

  // Remove spaces, dashes, and parentheses
  const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
  return pattern.test(cleanPhone);
};

// Format phone number for display
export const formatPhoneNumber = (phoneNumber: string, countryCode: string): string => {
  const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  switch (countryCode) {
    case 'AE':
      // UAE: +971 50 123 4567
      if (cleanPhone.startsWith('971')) {
        return `+${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 5)} ${cleanPhone.slice(5, 8)} ${cleanPhone.slice(8)}`;
      } else if (cleanPhone.startsWith('+971')) {
        return `${cleanPhone.slice(0, 4)} ${cleanPhone.slice(4, 6)} ${cleanPhone.slice(6, 9)} ${cleanPhone.slice(9)}`;
      }
      break;
      
    case 'IN':
      // India: +91 98765 43210
      if (cleanPhone.startsWith('91')) {
        return `+${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2, 7)} ${cleanPhone.slice(7)}`;
      } else if (cleanPhone.startsWith('+91')) {
        return `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 8)} ${cleanPhone.slice(8)}`;
      }
      break;
      
    case 'ID':
      // Indonesia: +62 812 3456 7890
      if (cleanPhone.startsWith('62')) {
        return `+${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2, 5)} ${cleanPhone.slice(5, 9)} ${cleanPhone.slice(9)}`;
      } else if (cleanPhone.startsWith('+62')) {
        return `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6, 10)} ${cleanPhone.slice(10)}`;
      }
      break;
  }
  
  return phoneNumber; // Return original if no formatting applied
};
