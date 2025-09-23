"use client";

import React, { useState, useEffect } from "react";
import { Printer, Settings, Shield, UserCheck, LogOut, User, X, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import GlobalSearch from "./GlobalSearch";
import { getCurrentUser, updateUserProfile, updateProfilePicture, updatePassword, convertToEmpFormat } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface AppHeaderProps {
  className?: string;
}

export default function AppHeader({ className = "" }: AppHeaderProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Modal states
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showSystemStatus, setShowSystemStatus] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    role: ""
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [profilePicture, setProfilePicture] = useState<string>("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    
    // Load user data
    const loadUser = async () => {
      try {
        const u = getCurrentUser();
        if (u) {
          setUser(u);
          setProfileForm({
            name: u.name || "",
            email: u.email || "",
            role: u.role || ""
          });
          setProfilePicture(u.profilePicture || "");
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    
    loadUser();
  }, []);

  // Separate useEffect for the timer to prevent infinite loops
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showAccountDropdown && !target.closest('.account-dropdown')) {
        setShowAccountDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAccountDropdown]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: false 
    });
  };

  const handleLogout = () => {
    // Clear all data
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      // Force redirect
      window.location.href = '/login';
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      setIsLoadingSystemStatus(true);
      const response = await fetch('/api/system-metrics');
      if (response.ok) {
        const data = await response.json();
        
        // Transform the API data to match our UI structure
        const transformedStatus = {
          status: data.status === 'healthy' ? 'Operational' : 'Issues Detected',
          uptime: data.database.responseTime,
          lastIncident: data.errorSummary?.lastError || 'None',
          services: [
            { 
              name: "Database", 
              status: data.database.status, 
              uptime: data.database.responseTime 
            },
            { 
              name: "API Services", 
              status: data.performance.averageQueryTime, 
              uptime: data.performance.averageQueryTime 
            },
            { 
              name: "File Storage", 
              status: data.storage.projectSize, 
              uptime: data.storage.projectSize 
            },
            { 
              name: "Print Queue", 
              status: data.metrics.quotes.pending > 0 ? 'Active' : 'Idle', 
              uptime: `${data.metrics.quotes.pending} pending` 
            }
          ]
        };
        
        setSystemStatus(transformedStatus);
      } else {
        console.error('Failed to fetch system metrics');
      }
    } catch (error) {
      console.error('Error fetching system metrics:', error);
    } finally {
      setIsLoadingSystemStatus(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (profileForm.name.trim()) {
      try {
        // Update profile information
        const updatedUser = await updateUserProfile({
          name: profileForm.name,
          email: profileForm.email
        });
        
        // If profile picture was changed, also update it
        if (profilePicture && profilePicture !== user?.profilePicture) {
          await updateProfilePicture(profilePicture);
        }
        
        if (updatedUser) {
          setUser(updatedUser);
          // Show small notification and close form
          console.log('Profile updated successfully');
          setShowAccountSettings(false);
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 3000);
        } else {
          console.error('Failed to update profile');
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        console.error('Failed to update profile');
      }
    } else {
      console.error('Please enter a valid name');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword === passwordForm.confirmPassword && 
        passwordForm.newPassword.length >= 6) {
      try {
        const success = await updatePassword(passwordForm.newPassword);
        if (success) {
          // Show small notification
          console.log('Password updated successfully');
          // Show success message
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 3000);
          // Close form after successful update
          setShowChangePassword(false);
          // Reset form fields
          setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
          });
        } else {
          console.error('Failed to update password');
        }
      } catch (error) {
        console.error('Error updating password:', error);
        console.error('Failed to update password');
      }
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      console.error('New passwords do not match');
    } else if (passwordForm.newPassword.length < 6) {
      console.error('Password must be at least 6 characters long');
    }
  };

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // File size validation (max 2MB to prevent database issues)
      if (file.size > 2 * 1024 * 1024) {
        // No popup - just log error and return
        console.error('Profile picture must be less than 2MB. Please choose a smaller image.');
        return;
      }
      
      // File type validation
      if (!file.type.startsWith('image/')) {
        // No popup - just log error and return
        console.error('Please select an image file.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        
        // Compress the image if it's too large
        let processedImage = result;
        if (result.length > 500000) { // If base64 string is longer than ~500KB
          try {
            // Create a canvas to compress the image
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              // Calculate new dimensions (max 200x200 pixels)
              const maxSize = 200;
              let { width, height } = img;
              
              if (width > height) {
                if (width > maxSize) {
                  height = (height * maxSize) / width;
                  width = maxSize;
                }
              } else {
                if (height > maxSize) {
                  width = (width * maxSize) / height;
                  height = maxSize;
                }
              }
              
              canvas.width = width;
              canvas.height = height;
              
              // Draw and compress
              ctx?.drawImage(img, 0, 0, width, height);
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
              
              console.log('📏 Original image size:', result.length, 'characters');
              console.log('📏 Compressed image size:', compressedDataUrl.length, 'characters');
              console.log('📐 New dimensions:', width, 'x', height);
              
              // Store the compressed image for later save - don't update immediately
              setProfilePicture(compressedDataUrl);
            };
            img.src = result;
          } catch (error) {
            console.error('Error compressing image:', error);
            // Fallback to original image
            setProfilePicture(result);
          }
        } else {
          // Image is small enough, store for later save - don't update immediately
          setProfilePicture(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const updateProfilePictureWithCompression = async (imageData: string) => {
    try {
      const updatedUser = await updateProfilePicture(imageData);
      if (updatedUser) {
        // Show small notification
        console.log('Profile picture updated successfully');
        // Show success message
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        // Close form after successful update
        setShowAccountSettings(false);
      } else {
        console.error('Failed to update profile picture');
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      console.error('Failed to update profile picture');
    }
  };

  const [systemStatus, setSystemStatus] = useState({
    status: "Loading...",
    uptime: "Loading...",
    lastIncident: "Loading...",
    services: [
      { name: "Database", status: "Loading...", uptime: "Loading..." },
      { name: "API Services", status: "Loading...", uptime: "Loading..." },
      { name: "File Storage", status: "Loading...", uptime: "Loading..." },
      { name: "Print Queue", status: "Loading...", uptime: "Loading..." }
    ]
  });
  const [isLoadingSystemStatus, setIsLoadingSystemStatus] = useState(false);

  return (
    <>
      <header className={cn(
        "flex items-center justify-between p-4 bg-white border-b border-gray-200",
        className
      )}>
        {/* Left Section - Search Bar */}
        <div className="flex items-center space-x-4">
          <div className="w-96">
            <GlobalSearch />
          </div>
        </div>

        {/* Right Section - Timestamp and Account */}
        <div className="flex items-center space-x-6 ml-auto">
          {/* Timestamp with Vertical Separator */}
          {mounted && currentTime && (
            <div className="flex items-center space-x-3 text-gray-600">
              {/* Date on the left */}
              <div className="text-sm font-medium">
                {formatDate(currentTime)}
              </div>
              
              {/* Vertical separator line */}
              <div className="w-px h-6 bg-gray-300"></div>
              
              {/* Time and Local Time label on the right */}
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-800">
                    {formatTime(currentTime)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Local Time
                  </div>
                </div>
                {/* Status indicator removed */}
              </div>
            </div>
          )}

          {/* Account Section */}
          <div className="flex items-center space-x-3">
            {/* User Info */}
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{user?.name || "John Admin"}</div>
              <div className="text-xs text-gray-500">ID: {convertToEmpFormat(user?.id || "1")}</div>
            </div>

            {/* Account Dropdown */}
            <div className="relative account-dropdown">
              <button 
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  {profilePicture ? (
                    <img 
                      src={profilePicture} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-semibold text-sm">
                      {user?.name?.charAt(0)?.toUpperCase() || "J"}
                    </span>
                  )}
                </div>
              </button>

              {/* Dropdown Menu */}
              {showAccountDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => {
                      setShowAccountDropdown(false);
                      setShowSystemStatus(true);
                      fetchSystemMetrics();
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-left"
                  >
                    <Shield className="w-4 h-4 mr-3 text-blue-600 flex-shrink-0" />
                    <span className="whitespace-nowrap">System Health Check</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAccountDropdown(false);
                      setShowChangePassword(true);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors text-left"
                  >
                    <UserCheck className="w-4 h-4 mr-3 text-green-600 flex-shrink-0" />
                    <span className="whitespace-nowrap">Change Password</span>
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={() => {
                      setShowAccountDropdown(false);
                      setShowAccountSettings(true);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-600 transition-colors text-left"
                  >
                    <Settings className="w-4 h-4 mr-3 text-gray-600 flex-shrink-0" />
                    <span className="whitespace-nowrap">Account Settings</span>
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={() => {
                      setShowAccountDropdown(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 mr-3 text-red-600 flex-shrink-0" />
                    <span className="whitespace-nowrap">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          ✅ Changes saved successfully!
        </div>
      )}

      {/* Account Settings Modal */}
      {showAccountSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowAccountSettings(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900 flex items-center">
                <Settings className="w-4 h-4 mr-2 text-blue-600" />
                Account Settings
              </h2>
              <button
                onClick={() => setShowAccountSettings(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Profile Picture */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Profile Picture</Label>
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center overflow-hidden">
                    {profilePicture ? (
                      <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="w-full text-xs"
                    />
                  </div>
                </div>
              </div>
              
              {/* User Information */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name" className="text-xs font-medium text-gray-700">Full Name</Label>
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    placeholder="Enter your full name"
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-xs font-medium text-gray-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    placeholder="Enter your email"
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                
                <div>
                  <Label htmlFor="role" className="text-xs font-medium text-gray-700">Role</Label>
                  <Input
                    id="role"
                    value={profileForm.role}
                    disabled
                    className="mt-1 h-8 text-xs bg-gray-100"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-2 p-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowAccountSettings(false)}
                className="px-3 py-1.5 h-7 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleProfileUpdate}
                className="px-3 py-1.5 h-7 text-xs bg-blue-600 hover:bg-blue-700"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* System Health Check Modal */}
      {showSystemStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowSystemStatus(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900 flex items-center">
                <Activity className="w-4 h-4 mr-2 text-blue-600" />
                Database Health Check
              </h2>
              <button
                onClick={() => setShowSystemStatus(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {isLoadingSystemStatus ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading database metrics...</span>
                </div>
              ) : (
                <>
                  {/* Overall Status */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      <div className="flex-1">
                        <h3 className="font-medium text-blue-800 text-sm leading-tight">
                          {systemStatus.status === 'Operational' ? 'Database Operational' : 'Database Issues Detected'}
                        </h3>
                        <p className="text-xs text-blue-600 leading-tight">Response Time: {systemStatus.uptime}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Service Status */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 text-sm">Database Services</h4>
                    <div className="space-y-2">
                      {systemStatus.services.map((service, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center space-x-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              service.status === 'Excellent' || service.status === 'Good' ? 'bg-green-500' : 
                              service.status === 'Fair' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                            <span className="font-medium text-gray-700 text-sm">{service.name}</span>
                          </div>
                          <div className="text-right">
                            <Badge className={`text-xs ${
                              service.status === 'Excellent' || service.status === 'Good' ? 'bg-green-100 text-green-700 border-green-200' :
                              service.status === 'Fair' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                              'bg-red-100 text-red-700 border-red-200'
                            }`}>
                              {service.status}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">{service.uptime}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center justify-end p-4 border-t border-gray-200 space-x-2">
              {!isLoadingSystemStatus && (
                <Button
                  onClick={fetchSystemMetrics}
                  disabled={isLoadingSystemStatus}
                  variant="outline"
                  className="px-3 py-1.5 h-7 text-xs"
                >
                  Refresh
                </Button>
              )}
              <Button
                onClick={() => setShowSystemStatus(false)}
                className="px-3 py-1.5 h-7 text-xs bg-blue-600 hover:bg-blue-700"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowChangePassword(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900 flex items-center">
                <UserCheck className="w-4 h-4 mr-2 text-green-600" />
                Change Password
              </h2>
              <button
                onClick={() => setShowChangePassword(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              <div>
                <Label htmlFor="currentPassword" className="text-xs font-medium text-gray-700">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  placeholder="Enter current password"
                  className="mt-1 h-8 text-xs"
                />
              </div>
              
              <div>
                <Label htmlFor="newPassword" className="text-xs font-medium text-gray-700">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  placeholder="Enter new password"
                  className="mt-1 h-8 text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">Min 6 characters</p>
              </div>
              
              <div>
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-gray-700">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-2 p-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowChangePassword(false)}
                className="px-3 py-1.5 h-7 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasswordChange}
                className="px-3 py-1.5 h-7 text-xs bg-green-600 hover:bg-green-700"
              >
                Update Password
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
