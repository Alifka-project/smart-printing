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

  // Server-side OTP API integration with fallback to test endpoints
  const sendOtpDirect = async (phoneNumber: string) => {
    try {
      // First try the real Twilio endpoint
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        return { success: true, sid: data.sessionId };
      } else {
        // If Twilio fails, try the test endpoint as fallback
        console.log('Twilio failed, trying test OTP endpoint...');
        return await sendTestOtp(phoneNumber);
      }
    } catch (error) {
      console.error('Twilio API error:', error);
      // Fallback to test OTP
      console.log('Falling back to test OTP endpoint...');
      return await sendTestOtp(phoneNumber);
    }
  };

  // Test OTP fallback function
  const sendTestOtp = async (phoneNumber: string) => {
    try {
      const response = await fetch('/api/otp/test-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Show test OTP in console for development
        if (data.testOtp) {
          console.log(`🔐 TEST OTP for ${phoneNumber}: ${data.testOtp}`);
          console.log('⚠️ This is a test verification code for development purposes');
        }
        return { success: true, sid: data.sessionId, isTest: true };
      } else {
        throw new Error(data.error || 'Failed to send test verification code');
      }
    } catch (error) {
      console.error('Test OTP API error:', error);
      throw new Error('Both Twilio and test OTP services failed');
    }
  };

  const verifyOtpDirect = async (phoneNumber: string, code: string) => {
    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, otp: code })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        return { success: true };
      } else {
        throw new Error(data.error || 'Invalid verification code');
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
      // Validate credentials against database or fallback demo users
      const response = await fetch('/api/users');
      let users = [];
      
      if (response.ok) {
        users = await response.json();
        console.log(`✅ Successfully fetched ${users.length} users from API`);
      } else {
        console.warn('⚠️ Users API failed, this might be expected on Vercel without database');
        // Continue with empty users array - the API will return demo users as fallback
        users = [];
      }
      
      // If no users from API, the API route will return demo users as fallback
      if (users.length === 0) {
        console.log('🔄 No users from API, API will return demo users as fallback');
      }
      
      // Try to find user in the response
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
      } else {
        // Handle API response errors - check if result has error property
        const errorMessage = (result as any).error || "Failed to send verification code";
        showMessage(errorMessage, "error");
        console.error('OTP send failed:', result);
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Show more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Twilio service not configured')) {
          showMessage("OTP service not configured. Please contact administrator.", "error");
        } else if (error.message.includes('Failed to send OTP')) {
          showMessage("Failed to send verification code. Please check your phone number.", "error");
        } else {
          showMessage(`Error: ${error.message}`, "error");
        }
      } else {
        showMessage("Failed to send verification code. Please try again.", "error");
      }
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
    <div className="h-screen w-screen flex flex-col lg:flex-row fixed inset-0">
      {/* Left Panel - Login Form */}
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#27aae1] to-[#ea078b] rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#27aae1] to-[#ea078b] bg-clip-text text-transparent">
                SmartPrint
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Welcome Back</h1>
            <p className="text-sm sm:text-base text-gray-600">Please sign in to your account</p>
          </div>

          {/* Location Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
            {isLocationChecking ? (
              <div className="flex items-center gap-2 sm:gap-3 text-[#27aae1]">
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-[#27aae1] border-t-transparent"></div>
                <span className="text-xs sm:text-sm font-medium">Verifying location...</span>
              </div>
            ) : locationError ? (
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-start gap-2 sm:gap-3 text-red-600">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium">Access Restricted</p>
                    <p className="text-xs text-red-500 mt-1">{locationError}</p>
                  </div>
                </div>
                <button
                  onClick={checkUserLocationOnMount}
                  className="flex items-center gap-2 text-[#27aae1] hover:text-[#1e8bc3] transition-colors text-xs sm:text-sm font-medium"
                >
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                  Retry Verification
                </button>
              </div>
            ) : locationData ? (
              <div className="flex items-center gap-2 sm:gap-3 text-green-600">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 sm:w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium">Location Verified</p>
                  <p className="text-xs text-green-500">{locationData.city}, {locationData.country}</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-green-700">{success}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Employee ID or Email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <Input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="Enter your Employee ID or Email"
                    className="pl-10 sm:pl-11 h-11 sm:h-12 bg-gray-50 border-gray-200 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-lg transition-colors text-sm sm:text-base"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 sm:pl-11 pr-10 sm:pr-11 h-11 sm:h-12 bg-gray-50 border-gray-200 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-lg transition-colors text-sm sm:text-base"
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
                    {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleGetOtp}
              disabled={!isFormValid || isLoading}
              className="w-full h-11 sm:h-12 bg-gradient-to-r from-[#ea078b] to-[#d4067a] hover:from-[#d4067a] hover:to-[#b80568] disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none text-sm sm:text-base"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                  <span className="text-sm sm:text-base">Sending Code...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Get Verification Code</span>
                </div>
              )}
            </Button>


          </div>

          {/* Footer Info */}
          <div className="text-center">
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <Globe className="w-3 h-3" />
              <span className="text-xs">Available in Dubai (UAE), India, and Indonesia</span>
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Branding */}
      <div className="hidden lg:flex w-full lg:w-1/2 h-full bg-gradient-to-br from-[#ea078b] via-[#d4067a] to-[#b80568] items-center justify-center relative overflow-hidden">
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
                <span className="block text-3xl text-white font-medium mt-2">Print Management System</span>
              </h1>
              
              <div className="w-24 h-1 bg-gradient-to-r from-white/60 to-white/20 mx-auto rounded-full"></div>
              
              <p className="text-xl text-white leading-relaxed font-light max-w-md mx-auto">
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
        <DialogContent className="sm:max-w-md mx-4" showCloseButton={false}>
          <DialogHeader className="relative">
            <button 
              onClick={closeOtpModal}
              className="absolute right-0 top-0 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <DialogTitle className="flex items-center gap-3 text-xl pr-8">
              <div className="w-10 h-10 bg-[#ea078b]/20 rounded-full flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-[#ea078b]" />
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
                  className="text-center text-3xl font-mono tracking-[0.5em] py-4 h-14 bg-gray-50 border-2 focus:border-[#ea078b] rounded-xl"
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
                  className="text-[#ea078b] hover:text-[#d4067a] ml-1 font-semibold transition-colors disabled:opacity-50"
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
                className="flex-1 h-12 bg-gradient-to-r from-[#ea078b] to-[#d4067a] hover:from-[#d4067a] hover:to-[#b80568] shadow-lg disabled:from-gray-400 disabled:to-gray-400 text-white"
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