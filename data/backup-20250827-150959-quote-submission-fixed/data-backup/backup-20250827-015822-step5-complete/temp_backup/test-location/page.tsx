"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { checkUserLocation, getMockLocation, LocationData, LocationCheckResult } from "@/lib/location-utils";
import { MapPin, Globe, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";

export default function TestLocationPage() {
  const [locationResult, setLocationResult] = useState<LocationCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mockLocation, setMockLocation] = useState<LocationData | null>(null);

  const testRealLocation = async () => {
    setIsLoading(true);
    try {
      const result = await checkUserLocation();
      setLocationResult(result);
    } catch (error) {
      console.error('Location test failed:', error);
      setLocationResult({
        isAllowed: false,
        location: null,
        error: 'Test failed',
        message: 'Unable to test location detection'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testMockLocation = (countryCode: 'AE' | 'IN' | 'ID') => {
    const mock = getMockLocation(countryCode);
    setMockLocation(mock);
    
    // Simulate location check result
    const result: LocationCheckResult = {
      isAllowed: true,
      location: mock,
      message: `Mock location verified: ${mock.city}, ${mock.country}`
    };
    setLocationResult(result);
  };

  const clearResults = () => {
    setLocationResult(null);
    setMockLocation(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Location Testing Page</h1>
          <p className="text-gray-600">Test the location detection and validation system</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Real Location Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Real Location Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Test your actual IP-based location detection
              </p>
              <Button 
                onClick={testRealLocation}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Testing...
                  </div>
                ) : (
                  "Test My Location"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Mock Location Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Mock Location Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Test with predefined locations for development
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => testMockLocation('AE')}
                  className="text-xs"
                >
                  UAE (Dubai)
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => testMockLocation('IN')}
                  className="text-xs"
                >
                  India
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => testMockLocation('ID')}
                  className="text-xs"
                >
                  Indonesia
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Display */}
        {locationResult && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {locationResult.isAllowed ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                Location Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Status */}
                <div className={`p-3 rounded-lg ${
                  locationResult.isAllowed 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {locationResult.isAllowed ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`font-medium ${
                      locationResult.isAllowed ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {locationResult.isAllowed ? 'Access Granted' : 'Access Denied'}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${
                    locationResult.isAllowed ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {locationResult.message}
                  </p>
                </div>

                {/* Location Details */}
                {locationResult.location && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Location Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Country:</span>
                        <span className="ml-2 font-medium">{locationResult.location.country}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Country Code:</span>
                        <span className="ml-2 font-medium">{locationResult.location.countryCode}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Region:</span>
                        <span className="ml-2 font-medium">{locationResult.location.region}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">City:</span>
                        <span className="ml-2 font-medium">{locationResult.location.city}</span>
                      </div>
                      {locationResult.location.latitude && (
                        <div>
                          <span className="text-gray-600">Coordinates:</span>
                          <span className="ml-2 font-medium">
                            {locationResult.location.latitude.toFixed(4)}, {locationResult.location.longitude?.toFixed(4)}
                          </span>
                        </div>
                      )}
                      {locationResult.location.timezone && (
                        <div>
                          <span className="text-gray-600">Timezone:</span>
                          <span className="ml-2 font-medium">{locationResult.location.timezone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Error Details */}
                {locationResult.error && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Error Details</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">{locationResult.error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={clearResults}
                    className="flex-1"
                  >
                    Clear Results
                  </Button>
                  <Button 
                    onClick={testRealLocation}
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Test Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Information Panel */}
        <Card>
          <CardHeader>
            <CardTitle>About Location Testing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                This page allows you to test the location detection system used by the SmartPrint login system.
              </p>
              <p>
                <strong>Real Location Test:</strong> Uses your actual IP address to determine your location.
              </p>
              <p>
                <strong>Mock Location Test:</strong> Simulates locations for development and testing purposes.
              </p>
              <p>
                <strong>Access Control:</strong> Only users from UAE (Dubai), India, and Indonesia can access the system.
              </p>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-blue-800 text-xs">
                  <strong>Note:</strong> Location detection uses multiple services for reliability. 
                  In production, this ensures accurate access control for your geographic restrictions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
