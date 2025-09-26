"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Settings, 
  Shield, 
  UserCheck, 
  LogOut, 
  Camera,
  Info,
  AlertCircle,
  CheckCircle,
  Bell,
  X
} from "lucide-react";
import { getUser, clearUser, updatePassword, updateUserProfile, updateProfilePicture, forceUpdateUserDisplayId, refreshUserData, debugUserState } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface NavbarProps {
  className?: string;
}

interface SystemStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: string;
  database: {
    status: string;
    responseTime: string;
    size: string;
    connections: string;
    provider: string;
  };
  performance: {
    databaseResponseTime: number;
    averageQueryTime: string;
    systemLoad: string;
  };
  metrics: {
    users: {
      total: number;
      active: number;
      newThisMonth: number;
    };
    clients: {
      total: number;
      active: number;
      newThisMonth: number;
    };
    quotes: {
      total: number;
      pending: number;
      completed: number;
      recent24h: number;
      completionRate: string;
    };
    suppliers: {
      total: number;
      active: number;
    };
    materials: {
      total: number;
      active: number;
    };
    search: {
      totalHistory: number;
      totalAnalytics: number;
      recentSearches: number;
    };
  };
  storage: {
    projectSize: string;
    databaseSize: string;
    availableSpace: string;
  };
  tableStorage: {
    totalTables: number;
    totalTableSize: string;
    tables: Array<{
      name: string;
      rowCount: number;
      estimatedSize: string;
      status: string;
    }>;
  };
  errorSummary: {
    totalErrors: number;
    slowQueries: number;
    connectionIssues: number;
    lastError: string;
    errorRate: string;
  };
  environment: {
    nodeEnv: string;
    databaseUrl: string;
    version: string;
  };
}

export default function Navbar({ className = "" }: NavbarProps) {
  const router = useRouter();
  const [user, setUserState] = useState(getUser());
  
  // Dialog states
  const [openAccountSettings, setOpenAccountSettings] = useState(false);
  const [openSystemStatus, setOpenSystemStatus] = useState(false);
  const [openChangePassword, setOpenChangePassword] = useState(false);
  
  // Form states
  const [editUser, setEditUser] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'estimator'
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Profile picture state
  const [profilePicture, setProfilePicture] = useState<string | null>(user?.profilePicture || null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  // Real system status data
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoadingSystemStatus, setIsLoadingSystemStatus] = useState(false);

  useEffect(() => {
    setUserState(getUser());
  }, []);

  useEffect(() => {
    if (user) {
      setEditUser({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'estimator'
      });
      setProfilePicture(user.profilePicture || null);
    }
  }, [user]);

  const handleLogout = () => {
    clearUser();
    router.replace("/login");
  };

  const handleAccountSettings = () => {
    setOpenAccountSettings(true);
  };

  const fetchSystemMetrics = async () => {
    try {
      setIsLoadingSystemStatus(true);
      const response = await fetch('/api/system-metrics');
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data);
      } else {
        console.error('Failed to fetch system metrics');
      }
    } catch (error) {
      console.error('Error fetching system metrics:', error);
    } finally {
      setIsLoadingSystemStatus(false);
    }
  };

  const handleSystemStatus = () => {
    setOpenSystemStatus(true);
    fetchSystemMetrics();
  };

  const handleChangePassword = () => {
    setOpenChangePassword(true);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    // Validation
    if (!editUser.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required.",
        type: "error"
      });
      return;
    }
    
    if (!editUser.email.trim() || !editUser.email.includes('@')) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address.",
        type: "error"
      });
      return;
    }
    
    setIsUpdating(true);
    try {
      const updatedUser = updateUserProfile({
        name: editUser.name.trim(),
        email: editUser.email.trim(),
        role: editUser.role as "admin" | "estimator"
      });
      
      if (updatedUser) {
        setUserState(updatedUser);
        // Don't auto-close - let user see changes and close manually
        console.log('Profile updated successfully');
      } else {
        console.error('Failed to update profile');
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        type: "error"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    
    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    
    // In a real app, you'd verify current password with backend
    if (currentPassword !== user?.password) {
      setPasswordError('Current password is incorrect.');
      return;
    }
    
    try {
      const success = await updatePassword(newPassword);
      if (success) {
        // Show small notification and close form
        console.log('Password updated successfully');
        setOpenChangePassword(false);
        // Reset form fields
        setNewPassword('');
        setConfirmPassword('');
        setCurrentPassword('');
        setPasswordError('');
      } else {
        console.error('Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      console.error('Failed to update password');
    }
  };

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // File size validation (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Profile picture must be less than 5MB.",
          type: "error"
        });
        return;
      }
      
      // File type validation
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file.",
          type: "error"
        });
        return;
      }
      
      setIsUploadingPicture(true);
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const pictureData = e.target?.result as string;
        setProfilePicture(pictureData);
        
        // Persist profile picture to storage
        if (user) {
          try {
            updateProfilePicture(pictureData);
            toast({
              title: "Profile Picture Updated",
              description: "Your profile picture has been updated successfully.",
              type: "success"
            });
          } catch (error) {
            toast({
              title: "Update Failed",
              description: "Failed to update profile picture. Please try again.",
              type: "error"
            });
          }
        }
        setIsUploadingPicture(false);
      };
      
      reader.onerror = () => {
        toast({
          title: "Upload Failed",
          description: "Failed to read the image file. Please try again.",
          type: "error"
        });
        setIsUploadingPicture(false);
      };
      
      reader.readAsDataURL(file);
    }
  };



  return (
    <>
      <nav className={cn("bg-white border-b border-gray-200 px-6 py-3", className)}>
        <div className="flex items-center justify-between">
          {/* Left Side - User Info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                {user?.profilePicture || profilePicture ? (
                  <img 
                    src={user?.profilePicture || profilePicture || ''} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold text-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">{user?.name ?? "User"}</div>
                <div className="text-xs text-gray-500 capitalize">{user?.role ?? "user"}</div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              User ID: {user?.displayId ?? "EMP001"}
              <button 
                onClick={() => {
                  forceUpdateUserDisplayId();
                  window.location.reload();
                }}
                className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                title="Refresh User ID"
              >
                🔄
              </button>
              <button 
                onClick={() => debugUserState()}
                className="ml-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                title="Debug User State"
              >
                🐛
              </button>
            </div>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center space-x-3">
            {/* Notification Bell */}
            <button 
              onClick={handleSystemStatus}
              className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors"
              title="System Status & Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {systemStatus && systemStatus.status !== 'healthy' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* Account Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Account</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <span className="font-semibold">{user?.name ?? "User"}</span>
                    <span className="text-sm text-muted-foreground">{user?.email ?? "-"}</span>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">Role: <b className="capitalize">{user?.role}</b></span>
                      <span className="text-xs text-muted-foreground">ID: <b>{user?.displayId}</b></span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleAccountSettings}>
                  <Settings className="w-4 h-4 mr-3 text-muted-foreground" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSystemStatus}>
                  <div className="flex items-center w-full">
                    <Shield className="w-4 h-4 mr-3 text-muted-foreground" />
                    <span>System Status</span>
                    <div className="ml-auto flex items-center space-x-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        systemStatus.status === 'operational' ? 'bg-green-500' : 
                        systemStatus.status === 'maintenance' ? 'bg-yellow-500' : 
                        systemStatus.status === 'degraded' ? 'bg-orange-500' : 'bg-red-500'
                      )} />
                      <span className="text-xs text-muted-foreground capitalize">
                        {systemStatus.status}
                      </span>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleChangePassword}>
                  <UserCheck className="w-4 h-4 mr-3 text-muted-foreground" />
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-rose-600">
                  <LogOut className="w-4 h-4 mr-3" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Account Settings Dialog */}
      <Dialog open={openAccountSettings} onOpenChange={setOpenAccountSettings}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-primary" />
              <span>Account Settings</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                  {user?.profilePicture || profilePicture ? (
                    <img 
                      src={user?.profilePicture || profilePicture || ''} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-semibold text-3xl">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  )}
                </div>
                <label htmlFor="profile-picture" className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {isUploadingPicture ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 text-white" />
                  )}
                  <input
                    id="profile-picture"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                    disabled={isUploadingPicture}
                  />
                </label>
              </div>
              <p className="text-sm text-muted-foreground">Click the camera icon to change profile picture</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={editUser.role}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value as "admin" | "estimator" })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="estimator">Estimator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAccountSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProfile} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* System Status Dialog */}
      <Dialog open={openSystemStatus} onOpenChange={setOpenSystemStatus}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-primary" />
              <span>System Health Check</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {isLoadingSystemStatus ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-muted-foreground">Loading system metrics...</span>
              </div>
            ) : systemStatus ? (
              <>
                {/* Database Health Overview */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-blue-50 border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <h3 className="font-semibold text-blue-800">Database Health Status</h3>
                      <p className="text-sm text-blue-600">Provider: {systemStatus.database.provider} | Response: {systemStatus.database.responseTime}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium border border-blue-200">
                    {systemStatus.database.status.toUpperCase()}
                  </div>
                </div>

                {/* Database Storage Summary */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Database Storage Summary</h4>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="text-sm font-medium text-gray-700 mb-1">Total Tables</div>
                      <div className="text-xl font-bold text-blue-600">{systemStatus.tableStorage.totalTables}</div>
                      <div className="text-xs text-gray-500">Active database tables</div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="text-sm font-medium text-gray-700 mb-1">Total Storage</div>
                      <div className="text-xl font-bold text-green-600">{systemStatus.tableStorage.totalTableSize}</div>
                      <div className="text-xs text-gray-500">Estimated table data</div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="text-sm font-medium text-gray-700 mb-1">Database File</div>
                      <div className="text-xl font-bold text-purple-600">{systemStatus.database.size}</div>
                      <div className="text-xs text-gray-500">Physical file size</div>
                    </div>
                  </div>
                </div>

                {/* Individual Table Details */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Table Storage Details</h4>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {systemStatus.tableStorage.tables.map((table, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${table.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <span className="text-sm font-medium text-gray-700">{table.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">{table.rowCount.toLocaleString()} rows</div>
                          <div className="text-xs text-gray-500">{table.estimatedSize}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Business Data Summary */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Business Data Summary</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-1">Users & Clients</div>
                      <div className="text-lg font-bold text-blue-600">{systemStatus.metrics.users.total} users</div>
                      <div className="text-sm text-gray-600">{systemStatus.metrics.clients.total} clients</div>
                      <div className="text-xs text-gray-500">{systemStatus.metrics.users.active} active users</div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-1">Quotes & Orders</div>
                      <div className="text-lg font-bold text-green-600">{systemStatus.metrics.quotes.total} total</div>
                      <div className="text-sm text-gray-600">{systemStatus.metrics.quotes.pending} pending</div>
                      <div className="text-xs text-gray-500">{systemStatus.metrics.quotes.completionRate}% completion</div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-1">Inventory</div>
                      <div className="text-lg font-bold text-purple-600">{systemStatus.metrics.suppliers.total} suppliers</div>
                      <div className="text-sm text-gray-600">{systemStatus.metrics.materials.total} materials</div>
                      <div className="text-xs text-gray-500">All active</div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-1">Search Activity</div>
                      <div className="text-lg font-bold text-orange-600">{systemStatus.metrics.search.totalHistory} searches</div>
                      <div className="text-sm text-gray-600">{systemStatus.metrics.search.recentSearches} today</div>
                      <div className="text-xs text-gray-500">Last 24 hours</div>
                    </div>
                  </div>
                </div>

                                {/* Error Summary & Performance */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Error Summary & Performance</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-1">Error Summary</div>
                      <div className="text-sm font-semibold text-red-600">{systemStatus.errorSummary.totalErrors} total errors</div>
                      <div className="text-xs text-gray-500">Rate: {systemStatus.errorSummary.errorRate}</div>
                      <div className="text-xs text-gray-500">Last: {systemStatus.errorSummary.lastError}</div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-1">Performance Issues</div>
                      <div className="text-sm font-semibold text-orange-600">{systemStatus.errorSummary.slowQueries} slow queries</div>
                      <div className="text-xs text-gray-500">{systemStatus.errorSummary.connectionIssues} connection issues</div>
                      <div className="text-xs text-gray-500">Database health: {systemStatus.performance.averageQueryTime}</div>
                    </div>
                  </div>
                </div>

                {/* System Performance Metrics */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">System Performance</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-1">Database Response</div>
                      <div className="text-sm font-semibold text-blue-600">{systemStatus.database.responseTime}</div>
                      <div className="text-xs text-gray-500">Performance: {systemStatus.performance.averageQueryTime}</div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-1">Memory Usage</div>
                      <div className="text-sm font-semibold text-green-600">{systemStatus.performance.memoryUsage}</div>
                      <div className="text-xs text-gray-500">Heap allocation</div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-1">Disk Status</div>
                      <div className="text-sm font-semibold text-orange-600">{systemStatus.performance.diskUsage}</div>
                      <div className="text-xs text-gray-500">Write access</div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-1">Connection Quality</div>
                      <div className="text-sm font-semibold text-purple-600">{systemStatus.performance.activeConnections}</div>
                      <div className="text-xs text-gray-500">Database responsiveness</div>
                    </div>
                  </div>
                </div>

                {/* Environment Info */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Environment Information</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-1">Environment</div>
                      <div className="text-sm font-semibold text-gray-900 capitalize">{systemStatus.environment.nodeEnv}</div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-1">Database</div>
                      <div className="text-sm font-semibold text-gray-900">{systemStatus.environment.databaseUrl}</div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-1">Version</div>
                      <div className="text-sm font-semibold text-gray-900">{systemStatus.environment.version}</div>
                    </div>
                    
                                         <div className="p-3 bg-gray-50 rounded-lg">
                       <div className="text-sm font-medium text-gray-700 mb-1">Last Updated</div>
                       <div className="text-sm font-semibold text-gray-900">
                         {new Date(systemStatus.timestamp).toLocaleString()}
                       </div>
                     </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Failed to load system metrics
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenSystemStatus(false)}>
              Close
            </Button>
            {systemStatus && (
              <Button 
                variant="outline" 
                onClick={fetchSystemMetrics}
                disabled={isLoadingSystemStatus}
              >
                {isLoadingSystemStatus ? 'Refreshing...' : 'Refresh'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={openChangePassword} onOpenChange={setOpenChangePassword}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-primary" />
              <span>Change Password</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {passwordError}
              </div>
            )}
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenChangePassword(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordChange}>
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
