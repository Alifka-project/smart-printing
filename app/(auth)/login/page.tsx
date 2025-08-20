"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Shield, AlertCircle, RefreshCw, CheckCircle, Lock, User, X, Smartphone, Globe } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { checkUserLocation, LocationData, LocationCheckResult } from "@/lib/location-utils";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocationChecking, setIsLocationChecking] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');
  const [phoneNumber] = useState<string>('+971588712409');
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Check user location on component mount
  useEffect(() => {
    checkUserLocationOnMount();
  }, []);

  const showMessage = (message: string, type: "error" | "success") => {
    if (type === "error") {
      setError(message);
      setSuccess("");
    } else {
      setSuccess(message);
      setError("");
    }
    
    setTimeout(() => {
      setError("");
      setSuccess("");
    }, 5000);
  };

  const checkUserLocationOnMount = async () => {
    setIsLocationChecking(true);
    setLocationError(null);
    
    try {
      const result: LocationCheckResult = await checkUserLocation();
      
      if (result.location) {
        setLocationData(result.location);
      }
      
      if (!result.isAllowed) {
        setLocationError(result.message);
      }
    } catch (error) {
      console.error('Error checking location:', error);
      setLocationError("Unable to verify your location. Access is restricted to Dubai (UAE), India, and Indonesia.");
    } finally {
      setIsLocationChecking(false);
    }
  };

  // Direct Twilio API integration
  const sendOtpDirect = async (phoneNumber: string) => {
    const accountSid = process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID;
    const authToken = process.env.NEXT_PUBLIC_TWILIO_AUTH_TOKEN;
    const serviceSid = process.env.NEXT_PUBLIC_TWILIO_VERIFY_SERVICE_ID;
    
    if (!accountSid || !authToken || !serviceSid) {
      throw new Error('Twilio credentials not configured. Please check your environment variables.');
    }
    
    try {
      const credentials = btoa(`${accountSid}:${authToken}`);
      
      const response = await fetch(`https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`, {
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

      const data = await response.json();
      
      if (response.ok) {
        return { success: true, sid: data.sid };
      } else {
        throw new Error(data.message || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Twilio API error:', error);
      throw error;
    }
  };

  const verifyOtpDirect = async (phoneNumber: string, code: string) => {
    const accountSid = process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID;
    const authToken = process.env.NEXT_PUBLIC_TWILIO_AUTH_TOKEN;
    const serviceSid = process.env.NEXT_PUBLIC_TWILIO_VERIFY_SERVICE_ID;
    
    if (!accountSid || !authToken || !serviceSid) {
      throw new Error('Twilio credentials not configured. Please check your environment variables.');
    }
    
    try {
      const credentials = btoa(`${accountSid}:${authToken}`);
      
      const response = await fetch(`https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'To': phoneNumber,
          'Code': code
        })
      });

      const data = await response.json();
      
      if (response.ok && data.status === 'approved') {
        return { success: true };
      } else {
        throw new Error(data.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Verification error:', error);
      throw error;
    }
  };

  const handleGetOtp = async () => {
    setError("");
    setSuccess("");

    if (!employeeId || !password) {
      showMessage("Please enter both Employee ID and Password", "error");
      return;
    }

    if (locationError) {
      // Only block if it's a strict access denied error
      if (locationError.includes("Access denied") || locationError.includes("Access is restricted")) {
        showMessage("Access denied. Please ensure you&apos;re accessing from an allowed location.", "error");
        return;
      }
      // For other location errors, just show a warning but allow login
      console.warn("Location warning:", locationError);
    }

    setIsLoading(true);
    
    try {
      // Validate credentials against database
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users from database');
      }
      
      const users = await response.json();
      const user = users.find((u: any) => 
        (u.id === employeeId || u.email === employeeId) && u.password === password
      );
      
      if (!user) {
        showMessage("Invalid Employee ID or Password", "error");
        return;
      }

      // Store the validated user for OTP verification
      setCurrentUser(user);
      
      // Send OTP via Twilio
      const result = await sendOtpDirect(phoneNumber);
      
      if (result.success) {
        setSessionId(result.sid || 'session-' + Date.now());
        setShowOtpModal(true);
        showMessage("Verification code sent to your phone", "success");
      }
    } catch (error) {
      console.error('Login error:', error);
      showMessage("Failed to send verification code. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerification = async () => {
    setError("");
    setSuccess("");

    if (!otp || otp.length !== 6) {
      showMessage("Please enter a valid 6-digit verification code", "error");
      return;
    }

    if (!currentUser) {
      showMessage("User session expired. Please login again.", "error");
      return;
    }

    setIsLoading(true);
    
    try {
      // Verify with Twilio
      const result = await verifyOtpDirect(phoneNumber, otp);
      
      if (result.success) {
        loginUser(currentUser);
        showMessage("Login successful! Redirecting...", "success");
        
        setTimeout(() => {
          setShowOtpModal(false);
          router.push("/");
        }, 1000);
      }
    } catch (error) {
      showMessage("Invalid verification code", "error");
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);
    
    try {
      const result = await sendOtpDirect(phoneNumber);
      
      if (result.success) {
        showMessage("Verification code resent successfully", "success");
        setOtp('');
        setSessionId(result.sid || 'session-' + Date.now());
      }
    } catch (error) {
      showMessage("Failed to resend verification code", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
    setOtp('');
    setSessionId('');
    setCurrentUser(null);
    setError("");
    setSuccess("");
  };

  const isFormValid = employeeId && password; // Allow login even with location warnings

  return (
    <div className="h-screen w-screen flex fixed inset-0">
      {/* Left Panel - Login Form */}
      <div className="w-1/2 h-full flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                SmartPrint
              </span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Welcome Back</h1>
            <p className="text-gray-600">Please sign in to your account</p>
          </div>

          {/* Location Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            {isLocationChecking ? (
              <div className="flex items-center gap-3 text-blue-600">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-sm font-medium">Verifying location...</span>
              </div>
            ) : locationError ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-red-600">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Access Restricted</p>
                    <p className="text-xs text-red-500 mt-1">{locationError}</p>
                  </div>
                </div>
                <button
                  onClick={checkUserLocationOnMount}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Verification
                </button>
              </div>
            ) : locationData ? (
              <div className="flex items-center gap-3 text-green-600">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Location Verified</p>
                  <p className="text-xs text-green-500">{locationData.city}, {locationData.country}</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Employee ID or Email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="Enter your Employee ID or Email"
                    className="pl-11 h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-colors"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-11 pr-11 h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-colors"
                    disabled={isLoading}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && isFormValid && !isLoading) {
                        handleGetOtp();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleGetOtp}
              disabled={!isFormValid || isLoading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Sending Code...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Get Verification Code
                </div>
              )}
            </Button>

            {/* Demo Credentials */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Demo Credentials:</h3>
              <div className="space-y-1 text-xs text-blue-700">
                <p><strong>Admin:</strong> admin@example.com / admin123</p>
                <p><strong>Estimator:</strong> estimator@example.com / estimator123</p>
                <p><strong>User:</strong> user@example.com / user123</p>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="text-center">
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <Globe className="w-3 h-3" />
              Available in Dubai (UAE), India, and Indonesia
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Branding */}
      <div className="w-1/2 h-full bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-80 h-80 bg-gradient-to-r from-white/5 to-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-l from-white/5 to-white/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-br from-white/5 to-white/8 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
          
          {/* Geometric Shapes */}
          <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-white/20 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-white/30 rounded-full animate-bounce" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute top-2/3 right-1/3 w-5 h-5 bg-white/15 rounded-full animate-bounce" style={{animationDelay: '2.5s'}}></div>
        </div>
        
        <div className="relative z-10 text-center text-white px-8 max-w-xl">
          {/* Main Logo and Branding */}
          <div className="mb-16">
            {/* Logo */}
            <div className="relative mb-10">
              <div className="w-40 h-40 mx-auto bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center shadow-2xl border border-white/20 relative">
                <div className="absolute inset-2 bg-gradient-to-br from-white/10 to-transparent rounded-full"></div>
                <Shield className="w-20 h-20 relative z-10 drop-shadow-lg" />
              </div>
              {/* Logo glow effect */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>
            </div>
            
            {/* Title */}
            <div className="space-y-4">
              <h1 className="text-5xl font-bold leading-tight tracking-tight">
                <span className="block text-white drop-shadow-lg">SmartPrint</span>
                <span className="block text-3xl text-blue-100 font-medium mt-2">Print Management System</span>
              </h1>
              
              <div className="w-24 h-1 bg-gradient-to-r from-white/60 to-white/20 mx-auto rounded-full"></div>
              
              <p className="text-xl text-blue-50 leading-relaxed font-light max-w-md mx-auto">
                Secure printing solutions with location-based access control and mobile verification
              </p>
            </div>
          </div>
          
          {/* Visual Design Elements */}
          <div className="relative">
            {/* Flowing Lines */}
            <div className="absolute inset-0 -top-20">
              <svg className="w-full h-96 opacity-20" viewBox="0 0 400 200" fill="none">
                <path 
                  d="M0,100 Q100,50 200,100 T400,100" 
                  stroke="white" 
                  strokeWidth="2" 
                  fill="none"
                  className="animate-pulse"
                />
                <path 
                  d="M0,120 Q150,80 300,120 T400,120" 
                  stroke="white" 
                  strokeWidth="1.5" 
                  fill="none"
                  className="animate-pulse"
                  style={{animationDelay: '1s'}}
                />
                <path 
                  d="M0,80 Q200,40 400,80" 
                  stroke="white" 
                  strokeWidth="1" 
                  fill="none"
                  className="animate-pulse"
                  style={{animationDelay: '2s'}}
                />
              </svg>
            </div>
            
            {/* Floating Bubbles */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-10 left-10 w-20 h-20 bg-white/5 rounded-full animate-bounce"></div>
              <div className="absolute top-32 right-16 w-32 h-32 bg-white/3 rounded-full animate-pulse" style={{animationDelay: '1s', animationDuration: '4s'}}></div>
              <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-white/7 rounded-full animate-bounce" style={{animationDelay: '2s'}}></div>
              <div className="absolute bottom-32 right-8 w-24 h-24 bg-white/4 rounded-full animate-pulse" style={{animationDelay: '3s', animationDuration: '5s'}}></div>
              <div className="absolute top-1/2 left-8 w-12 h-12 bg-white/6 rounded-full animate-bounce" style={{animationDelay: '4s'}}></div>
            </div>
            
            {/* Geometric Patterns */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-16 right-20 w-1 h-32 bg-white transform rotate-45 animate-pulse"></div>
              <div className="absolute bottom-24 left-12 w-1 h-24 bg-white transform -rotate-12 animate-pulse" style={{animationDelay: '1s'}}></div>
              <div className="absolute top-1/3 right-1/3 w-1 h-20 bg-white transform rotate-12 animate-pulse" style={{animationDelay: '2s'}}></div>
            </div>
            
            {/* Particle Effect */}
            <div className="absolute inset-0">
              <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-ping"></div>
              <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-white rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
              <div className="absolute top-2/3 left-1/3 w-1 h-1 bg-white rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
              <div className="absolute top-1/2 right-1/2 w-1 h-1 bg-white rounded-full animate-ping" style={{animationDelay: '1.5s'}}></div>
              <div className="absolute bottom-1/4 left-2/3 w-1 h-1 bg-white rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
            </div>
          </div>
          
          {/* Simple Brand Accent */}
          <div className="mt-16">
            <div className="flex justify-center items-center space-x-3 opacity-40">
              <div className="w-12 h-1 bg-gradient-to-r from-transparent via-white to-transparent rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <div className="w-12 h-1 bg-gradient-to-r from-transparent via-white to-transparent rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      <Dialog open={showOtpModal} onOpenChange={(open) => {
        if (!open) {
          closeOtpModal();
        }
      }}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader className="relative">
            <button 
              onClick={closeOtpModal}
              className="absolute right-0 top-0 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <DialogTitle className="flex items-center gap-3 text-xl pr-8">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>
              Enter Verification Code
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            {/* Error/Success Messages in Modal */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-6">
                We&apos;ll send a verification code to your phone.
              </p>
              
              <div className="mb-6">
                <Input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-3xl font-mono tracking-[0.5em] py-4 h-14 bg-gray-50 border-2 focus:border-blue-500 rounded-xl"
                  maxLength={6}
                  disabled={isLoading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && otp.length === 6 && !isLoading) {
                      handleOtpVerification();
                    }
                  }}
                />
              </div>
              
              <p className="text-sm text-gray-500 mb-6">
                Didn&apos;t receive the code? 
                <button 
                  onClick={resendOtp}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-700 ml-1 font-semibold transition-colors disabled:opacity-50"
                >
                  Resend Code
                </button>
              </p>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={closeOtpModal}
                className="flex-1 h-12 border-gray-300 hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleOtpVerification}
                disabled={!otp || otp.length !== 6 || isLoading}
                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg disabled:from-gray-400 disabled:to-gray-400"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Verifying...
                  </div>
                ) : (
                  "Verify & Sign In"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}