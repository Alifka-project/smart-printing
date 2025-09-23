"use client";

import React from "react";
import { UserRound, KeyRound, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getUser, clearUser, updatePassword } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface UserMenuProps {
  className?: string;
}

export default function UserMenu({ className = "" }: UserMenuProps) {
  const router = useRouter();
  const [user, setUser] = React.useState(getUser());
  const [openChangePass, setOpenChangePass] = React.useState(false);
  const [newPass, setNewPass] = React.useState("");
  const [confirmPass, setConfirmPass] = React.useState("");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    setUser(getUser());
  }, []);

  const handleLogout = () => {
    clearUser();
    router.replace("/login");
  };

  const handleChangePassword = async () => {
    setError("");
    setIsLoading(true);

    try {
      if (!newPass || newPass.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
      if (newPass !== confirmPass) {
        setError("Passwords do not match.");
        return;
      }

      const success = await updatePassword(newPass);
      if (success) {
        // Show small notification and close form
        console.log('Password updated successfully');
        setOpenChangePass(false);
        // Reset form fields
        setNewPass("");
        setConfirmPass("");
        setError("");
      } else {
        setError("Failed to update password. Please try again.");
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setError("Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfile = () => {
    // TODO: Implement profile navigation
    console.log("Navigate to profile");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "flex items-center space-x-3 p-2 rounded-2xl hover:bg-muted/50 transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary/20",
              className
            )}
            aria-label="User menu"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="text-left hidden sm:block">
              <div className="font-semibold text-foreground">{user?.name || "User"}</div>
              <div className="text-xs text-muted-foreground capitalize">{user?.role || "user"}</div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-64 p-2"
          sideOffset={8}
        >
          <DropdownMenuLabel className="p-3">
            <div className="flex flex-col space-y-1">
              <span className="font-semibold text-foreground">{user?.name || "User"}</span>
              <span className="text-sm text-muted-foreground">{user?.email || "-"}</span>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground">Role: <b className="capitalize">{user?.role}</b></span>
                <span className="text-xs text-muted-foreground">ID: <b>{user?.id}</b></span>
              </div>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleProfile}
            className="p-3 cursor-pointer hover:bg-muted/50 rounded-xl transition-colors duration-200"
          >
            <UserRound className="w-4 h-4 mr-3 text-muted-foreground" />
            <span>Profile</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => setOpenChangePass(true)}
            className="p-3 cursor-pointer hover:bg-muted/50 rounded-xl transition-colors duration-200"
          >
            <KeyRound className="w-4 h-4 mr-3 text-muted-foreground" />
            <span>Change Password</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleLogout}
            className="p-3 cursor-pointer hover:bg-destructive/10 text-destructive rounded-xl transition-colors duration-200"
          >
            <LogOut className="w-4 h-4 mr-3" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Change Password Dialog */}
      <Dialog open={openChangePass} onOpenChange={setOpenChangePass}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-primary" />
              <span>Change Password</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
                {error}
              </div>
            )}
            
            <div className="space-y-3">
              <div>
                <label htmlFor="new-password" className="text-sm font-medium text-foreground mb-2 block">
                  New Password
                </label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              
              <div>
                <label htmlFor="confirm-password" className="text-sm font-medium text-foreground mb-2 block">
                  Confirm Password
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setOpenChangePass(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleChangePassword}
              disabled={isLoading}
              className="rounded-xl"
            >
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
