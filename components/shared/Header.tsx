// components/shared/Header.tsx
"use client";

import React from "react";
import { getUser, clearUser, updatePassword } from "@/lib/auth";
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
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    setUserState(getUser());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    clearUser();
    router.replace("/login");
  };

  const handleChangePassword = () => {
    setErr("");
    if (!newPass || newPass.length < 6) {
      setErr("Password min 6 karakter.");
      return;
    }
    if (newPass !== confirmPass) {
      setErr("Konfirmasi password tidak sama.");
      return;
    }
    updatePassword(newPass);
    setOpenChangePass(false);
    setNewPass("");
    setConfirmPass("");
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
        <div className="flex items-center justify-between px-8 py-4">
          {/* Left Section - Logo and Title */}
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 rounded-lg flex items-center justify-center">
              <img 
                src="/logo-smart-printing.svg" 
                alt="SmartPrint Logo" 
                className="w-6 h-6"
              />
            </div>
            
            {/* Title */}
            <div>
              <h1 className="text-xl font-bold text-gray-900">SmartPrint Print Management System</h1>
            </div>
          </div>

          {/* Center Section - Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input 
                placeholder="Search quotes, clients, suppliers..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-gray-200 text-gray-900 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
              />
            </div>
          </div>

          {/* Right Section - User Info, Timestamp, and Account */}
          <div className="flex items-center space-x-6">
            {/* User ID and Timestamp */}
            <div className="text-right">
              <div className="flex items-center space-x-2 text-gray-600">
                <User className="w-4 h-4" />
                <span className="font-medium">User ID: {user?.id ?? "EMP001"}</span>
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(currentTime)} | {formatTime(currentTime)}
              </div>
            </div>

            {/* Account Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">J</span>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{user?.name ?? "John Admin"}</div>
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
          </div>
        </div>
        
        {/* Last Updated Bar */}
        <div className="px-8 py-2 bg-gray-50 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Last Updated {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
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
