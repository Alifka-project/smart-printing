"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { twilioService, OtpRequest, OtpVerification } from "@/lib/twilio-otp";
import { dummyUsers } from "@/constants/dummyusers";
import { Smartphone, CheckCircle, XCircle, AlertCircle, RefreshCw, User, Lock } from "lucide-react";

export default function TestOtpPage() {
  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [otp, setOtp] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [step, setStep] = useState<"credentials" | "otp" | "verification">("credentials");

  const testCredentials = () => {
    const found = dummyUsers.find((u) => u.email === email && u.password === password);
    if (found) {
      setResult({
        success: true,
        message: "Credentials valid",
        user: found
      });
      setStep("otp");
    } else {
      setResult({
        success: false,
        message: "Invalid credentials",
        error: "User not found in dummy users"
      });
    }
  };

  const requestOtp = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      console.log("🧪 Testing OTP request...");
      
      const otpRequest: OtpRequest = {
        phoneNumber: "+971588712409",
        userId: email,
        purpose: 'login'
      };
      
      console.log("📤 OTP Request:", otpRequest);
      const response = await twilioService.sendOtp(otpRequest);
      
      console.log("📥 OTP Response:", response);
      
      if (response.success && response.sessionId) {
        setSessionId(response.sessionId);
        setResult({
          success: true,
          message: "OTP sent successfully",
          sessionId: response.sessionId
        });
        setStep("verification");
      } else {
        setResult({
          success: false,
          message: "OTP sending failed",
          error: response.message
        });
      }
    } catch (error) {
      console.error("💥 OTP request error:", error);
      setResult({
        success: false,
        message: "OTP request failed",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || !sessionId) {
      setResult({
        success: false,
        message: "Missing OTP or session",
        error: "Please enter OTP and ensure session exists"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("🔍 Testing OTP verification...");
      
      const verification: OtpVerification = {
        phoneNumber: "+971588712409",
        otp: otp,
        userId: email
      };
      
      console.log("📤 Verification Request:", verification);
      const response = await twilioService.verifyOtp(verification, sessionId);
      
      console.log("📥 Verification Response:", response);
      
      if (response.success) {
        setResult({
          success: true,
          message: "OTP verified successfully!",
          details: response
        });
      } else {
        setResult({
          success: false,
          message: "OTP verification failed",
          error: response.message
        });
      }
    } catch (error) {
      console.error("💥 Verification error:", error);
      setResult({
        success: false,
        message: "Verification failed",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!sessionId) {
      setResult({
        success: false,
        message: "No session to resend",
        error: "Please request OTP first"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("🔄 Testing OTP resend...");
      
      const response = await twilioService.resendOtp(sessionId);
      
      console.log("📥 Resend Response:", response);
      
      if (response.success) {
        setOtp("");
        setResult({
          success: true,
          message: "OTP resent successfully",
          newSessionId: response.sessionId
        });
        
        if (response.sessionId) {
          setSessionId(response.sessionId);
        }
      } else {
        setResult({
          success: false,
          message: "OTP resend failed",
          error: response.message
        });
      }
    } catch (error) {
      console.error("💥 Resend error:", error);
      setResult({
        success: false,
        message: "Resend failed",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetTest = () => {
    setEmail("admin");
    setPassword("admin");
    setOtp("");
    setSessionId("");
    setResult(null);
    setStep("credentials");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">OTP System Test</h1>
          <p className="text-gray-600">Test the OTP verification system step by step</p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${step === "credentials" ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                step === "credentials" ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300"
              }`}>
                1
              </div>
              <span className="ml-2">Credentials</span>
            </div>
            <div className="w-8 h-1 bg-gray-300"></div>
            <div className={`flex items-center ${step === "otp" ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                step === "otp" ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300"
              }`}>
                2
              </div>
              <span className="ml-2">Request OTP</span>
            </div>
            <div className="w-8 h-1 bg-gray-300"></div>
            <div className={`flex items-center ${step === "verification" ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                step === "verification" ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300"
              }`}>
                3
              </div>
              <span className="ml-2">Verify OTP</span>
            </div>
          </div>
        </div>

        {/* Step 1: Credentials */}
        {step === "credentials" && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Test Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email/ID</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin"
                    className="pl-11"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="admin"
                    className="pl-11"
                  />
                </div>
              </div>
              <Button onClick={testCredentials} className="w-full">
                Test Credentials
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Request OTP */}
        {step === "otp" && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Request OTP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Credentials verified. Now testing OTP delivery to +971588712409
              </p>
              <Button 
                onClick={requestOtp}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Requesting OTP...
                  </div>
                ) : (
                  "Request OTP"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Verify OTP */}
        {step === "verification" && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Verify OTP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                OTP sent. Check console for the code and enter it below.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                <Input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl font-mono tracking-widest"
                  maxLength={6}
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={verifyOtp}
                  disabled={!otp || otp.length !== 6 || isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Verifying...
                    </div>
                  ) : (
                    "Verify OTP"
                  )}
                </Button>
                <Button 
                  onClick={resendOtp}
                  disabled={isLoading}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-3 rounded-lg ${
                result.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.message}
                  </span>
                </div>
                {result.error && (
                  <p className={`text-sm mt-1 ${
                    result.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    Error: {result.error}
                  </p>
                )}
                {result.details && (
                  <div className="mt-2 text-xs">
                    <pre className="bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="mt-6 text-center">
          <Button onClick={resetTest} variant="outline">
            Reset Test
          </Button>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>1. <strong>Test Credentials:</strong> Use "admin" / "admin" to verify user lookup</p>
              <p>2. <strong>Request OTP:</strong> Test OTP delivery to +971588712409</p>
              <p>3. <strong>Check Console:</strong> Look for OTP codes in browser console</p>
              <p>4. <strong>Verify OTP:</strong> Enter the code to test verification</p>
              <p>5. <strong>Test Resend:</strong> Try resending OTP to test that functionality</p>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mt-4">
                <p className="text-blue-800 text-xs">
                  <strong>Note:</strong> This page helps debug OTP issues step by step. 
                  Check the browser console for detailed logs and OTP codes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
