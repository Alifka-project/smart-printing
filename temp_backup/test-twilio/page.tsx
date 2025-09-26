"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { twilioService, OtpRequest, OtpVerification } from "@/lib/twilio-otp";
import { config } from "@/config/environment";
import { Smartphone, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";

export default function TestTwilioPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("+971588712409");
  const [userId, setUserId] = useState("test@example.com");
  const [otp, setOtp] = useState("");
  const [sessionId, setSessionId] = useState("");

  const testTwilioConnection = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      console.log("🧪 Testing Twilio connection...");
      console.log("Config:", config);
      
      // Test OTP sending
      const otpRequest: OtpRequest = {
        phoneNumber: phoneNumber,
        userId: userId,
        purpose: 'login'
      };
      
      console.log("📤 Sending test OTP request:", otpRequest);
      const response = await twilioService.sendOtp(otpRequest);
      
      console.log("📥 Test OTP response:", response);
      
      if (response.success && response.sessionId) {
        setSessionId(response.sessionId);
        setTestResult({
          success: true,
          message: "Twilio connection successful!",
          details: response,
          sessionId: response.sessionId
        });
      } else {
        setTestResult({
          success: false,
          message: "Twilio connection failed",
          details: response,
          error: response.message
        });
      }
    } catch (error) {
      console.error("💥 Twilio test error:", error);
      setTestResult({
        success: false,
        message: "Twilio test failed",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testOtpVerification = async () => {
    if (!otp || !sessionId) {
      setTestResult({
        success: false,
        message: "Please enter OTP and ensure session exists",
        error: "Missing OTP or session ID"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("🔍 Testing OTP verification...");
      
      const verification: OtpVerification = {
        phoneNumber: phoneNumber,
        otp: otp,
        userId: userId
      };
      
      console.log("📤 Sending verification request:", verification);
      const response = await twilioService.verifyOtp(verification, sessionId);
      
      console.log("📥 Verification response:", response);
      
      setTestResult({
        success: response.success,
        message: response.message,
        details: response,
        verification: verification
      });
    } catch (error) {
      console.error("💥 Verification test error:", error);
      setTestResult({
        success: false,
        message: "Verification test failed",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResult(null);
    setSessionId("");
    setOtp("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Twilio Integration Test</h1>
          <p className="text-gray-600">Test the Twilio OTP functionality and connection</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Configuration Info */}
          <Card>
            <CardHeader>
              <CardTitle>Twilio Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p><strong>Account SID:</strong> {config.twilio.accountSid ? '✅ Configured' : '❌ Not configured'}</p>
                <p><strong>Auth Token:</strong> {config.twilio.authToken ? '✅ Configured' : '❌ Not configured'}</p>
                <p><strong>From Number:</strong> {config.twilio.fromNumber}</p>
                <p><strong>Verify Service:</strong> {config.twilio.verifyServiceId || 'Not configured'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Test Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+971588712409"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
                <Input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
              <Button 
                onClick={testTwilioConnection}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Testing...
                  </div>
                ) : (
                  "Test Twilio Connection"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* OTP Verification Test */}
        {sessionId && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>OTP Verification Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP (check console for code)</label>
                <Input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  className="text-center text-2xl font-mono tracking-widest"
                  maxLength={6}
                />
              </div>
              <Button 
                onClick={testOtpVerification}
                disabled={!otp || otp.length !== 6}
                className="w-full"
              >
                Verify OTP
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Test Results */}
        {testResult && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Status */}
                <div className={`p-3 rounded-lg ${
                  testResult.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`font-medium ${
                      testResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {testResult.message}
                    </span>
                  </div>
                  {testResult.error && (
                    <p className={`text-sm mt-1 ${
                      testResult.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      Error: {testResult.error}
                    </p>
                  )}
                </div>

                {/* Details */}
                {testResult.details && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Response Details</h4>
                    <pre className="text-xs text-gray-700 overflow-auto">
                      {JSON.stringify(testResult.details, null, 2)}
                    </pre>
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
                    onClick={testTwilioConnection}
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

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                1. <strong>Test Connection:</strong> Click "Test Twilio Connection" to verify your Twilio setup
              </p>
              <p>
                2. <strong>Check Console:</strong> Open browser console to see detailed logs and OTP codes
              </p>
              <p>
                3. <strong>Verify OTP:</strong> Enter the OTP code from console to test verification
              </p>
              <p>
                4. <strong>Monitor Results:</strong> Check the test results for any errors or issues
              </p>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-blue-800 text-xs">
                  <strong>Note:</strong> This page helps debug Twilio integration issues. 
                  Check the browser console for detailed logs and OTP codes during testing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
