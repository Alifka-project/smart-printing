// components/shared/Header.tsx
"use client";

import React from "react";
import { getUser, clearUser, updatePassword, logoutUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Search, User } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function Header() {
  const router = useRouter();
  const [user, setUserState] = React.useState(getUser());
  const [openChangePass, setOpenChangePass] = React.useState(false);
  const [newPass, setNewPass] = React.useState("");
  const [confirmPass, setConfirmPass] = React.useState("");
  const [err, setErr] = React.useState("");
  const [currentTime, setCurrentTime] = React.useState<Date | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setUserState(getUser());
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    alert('Logout clicked! Starting logout process...');
    
    // Clear all data immediately
    if (typeof window !== 'undefined') {
      // Clear localStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear specific keys
      localStorage.removeItem('smartPrintingUser');
      localStorage.removeItem('smartPrintingProfilePicture');
      
      alert('Data cleared! Redirecting to login...');
      
      // Force redirect
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    }
  };

  const handleChangePassword = async () => {
    setErr("");
    if (!newPass || newPass.length < 6) {
      setErr("Password min 6 karakter.");
      return;
    }
    if (newPass !== confirmPass) {
      setErr("Konfirmasi password tidak sama.");
      return;
    }
    
    try {
      const success = await updatePassword(newPass);
      if (success) {
        // Show small notification and close form
        console.log('Password updated successfully');
        setOpenChangePass(false);
        // Reset form fields
        setNewPass("");
        setConfirmPass("");
      } else {
        setErr("Failed to update password. Please try again.");
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setErr("Failed to update password. Please try again.");
    }
  };

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
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <>
      <header className="w-full bg-white border-b border-gray-200 shadow-sm">
        {/* Mobile Layout */}
        <div className="lg:hidden">
          {/* Top Row - Logo and Title */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <img 
                  src="/logo-smart-printing.svg" 
                  alt="SmartPrint Logo" 
                  className="w-5 h-5"
                />
              </div>
              <h1 className="text-base font-bold text-gray-900 truncate">
                SmartPrint
              </h1>
            </div>
            
            {/* User Profile - Compact */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">{user?.name?.[0] ?? "J"}</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-semibold">{user?.name ?? "User"}</span>
                    <span className="text-xs text-muted-foreground">{user?.email ?? "-"}</span>
                    <span className="text-xs mt-1">Role: <b>{user?.role}</b></span>
                    <span className="text-xs">ID: <b>{user?.id}</b></span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setOpenChangePass(true)}>
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-rose-600">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Search Bar Row */}
          <div className="px-4 pb-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="Search quotes, clients, suppliers..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-gray-200 text-gray-900 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 text-sm"
              />
            </div>
          </div>

          {/* Bottom Row - User Info and Time */}
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>ID: {user?.id ?? "EMP001"}</span>
              </div>
              {mounted && currentTime && (
                <div className="text-right">
                  <div className="font-medium">{formatDate(currentTime)}</div>
                  <div className="text-gray-500">{formatTime(currentTime)}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="flex items-center justify-between px-6 lg:px-8 py-4">
            {/* Left Section - Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 rounded-lg flex items-center justify-center">
                <img 
                  src="/logo-smart-printing.svg" 
                  alt="SmartPrint Logo" 
                  className="w-6 h-6"
                />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                SmartPrint Print Management System
              </h1>
            </div>

            {/* Center Section - Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input 
                  placeholder="Search quotes, clients, suppliers..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-gray-200 text-gray-900 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                />
              </div>
            </div>

            {/* Right Section - User Info, Timestamp, and Account */}
            <div className="flex items-center space-x-6">
              {/* User ID and Timestamp */}
              <div className="text-right">
                <div className="flex items-center space-x-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span className="font-medium text-sm">ID: {user?.id ?? "EMP001"}</span>
                </div>
                {mounted && currentTime && (
                  <div className="text-xs text-gray-500">
                    {formatDate(currentTime)} | {formatTime(currentTime)}
                  </div>
                )}
              </div>

              {/* Account Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">{user?.name ?? "J"}</span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 text-sm">{user?.name ?? "John Admin"}</div>
                      <div className="text-xs text-gray-500">{user?.role ?? "admin"}</div>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-semibold">{user?.name ?? "User"}</span>
                      <span className="text-xs text-muted-foreground">{user?.email ?? "-"}</span>
                      <span className="text-xs mt-1">Role: <b>{user?.role}</b></span>
                      <span className="text-xs">ID: <b>{user?.id}</b></span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setOpenChangePass(true)}>
                    Change Password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-rose-600">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Test Logout Button - Direct Access */}
              <button 
                onClick={() => {
                  alert('Direct logout button clicked!');
                  localStorage.clear();
                  sessionStorage.clear();
                  alert('All data cleared! Going to login...');
                  window.location.href = '/login';
                }}
                className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-lg"
              >
                🚪 FORCE LOGOUT
              </button>
            </div>
          </div>
        </div>
        
        {/* Last Updated Bar */}
        {currentTime && (
          <div className="px-4 lg:px-6 lg:px-8 py-2 bg-gray-50 border-t border-gray-100">
            <div className="text-xs text-gray-500 text-center lg:text-left">
              Last Updated {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        )}
      </header>

      <Dialog open={openChangePass} onOpenChange={setOpenChangePass}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {err && <div className="text-sm text-rose-600 bg-rose-50 p-2 rounded">{err}</div>}
            <Input
              type="password"
              placeholder="New password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenChangePass(false)}>Cancel</Button>
            <Button onClick={handleChangePassword}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
