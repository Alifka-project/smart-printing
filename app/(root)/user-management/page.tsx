"use client";

import * as React from "react";
// Define types for user management
export type AppUserRole = "admin" | "user" | "estimator";
export type AppUserStatus = "Active" | "Inactive";

export interface AppUser {
  id: string;           
  displayId?: string;   // Optional display ID for formatted display
  name: string;
  email: string;
  joined: string;      
  role: AppUserRole;
  password?: string
  status: AppUserStatus;
  profilePicture?: string | null; // Profile picture URL or base64 data
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Edit3, Crown, User, Calculator, ChevronDown, ChevronUp } from "lucide-react";
import RoleBadge from "@/components/shared/RoleBadge";
import StatusChip from "@/components/shared/StatusChip";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getDisplayId } from "@/lib/auth";
import { useState } from "react";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export default function UserManagementPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<AppUserRole>("user");
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");
  const [profilePictureData, setProfilePictureData] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AppUserRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive">("all");
  const [showAll, setShowAll] = useState(false);

  const PAGE_SIZE = 10;

  // Load users from database on page load
  React.useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        if (response.ok) {
          const usersData = await response.json();
          // Transform database users to match AppUser format
          const transformedUsers = usersData.map((user: any, index: number) => ({
            id: user.id, // Keep the database ID for operations
            displayId: getDisplayId(user.id), // Display ID for UI
            name: user.name,
            email: user.email,
            joined: user.createdAt ? user.createdAt.split('T')[0] : new Date().toISOString().slice(0, 10),
            role: user.role as AppUserRole,
            status: "Active" as const, // Default to Active
            password: "", // Don't load passwords from database for security
            profilePicture: user.profilePicture || null, // Include profile picture
          }));
          setUsers(transformedUsers);
        } else {
          console.error('Failed to load users from database');
          setUsers([]); // Show empty state if database fails
        }
      } catch (error) {
        console.error('Error loading users:', error);
        setUsers([]); // Show empty state if there's an error
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Filter users based on search and filters
  const filtered = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.displayId || u.id).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Paginate results
  const current = showAll ? filtered : filtered.slice(0, PAGE_SIZE);

  // Helper function to get role icon
  const getRoleIcon = (role: AppUserRole) => {
    switch (role) {
      case "admin":
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case "estimator":
        return <Calculator className="h-4 w-4 text-[#f89d1d]" />;
      default:
        return <User className="h-4 w-4 text-[#27aae1]" />;
    }
  };

  // Reset form
  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setRole("user");
    setActive(true);
    setError("");
    setProfilePictureData(null);
    setEditingUserId(null);
  };

  // Add new user
  const addUser = async () => {
    if (!name || !email || (!editingUserId && !password)) {
      setError("Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const userData = {
        name,
        email,
        password: password || undefined,
        role,
        status: active ? "Active" : "Inactive",
        profilePicture: profilePictureData
      };

      if (editingUserId) {
        // Update existing user
        const response = await fetch(`/api/users/${editingUserId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });

        if (response.ok) {
          const updatedUser = await response.json();
          setUsers(users.map(u => u.id === editingUserId ? {
            ...u,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            status: updatedUser.status,
            profilePicture: updatedUser.profilePicture
          } : u));
          setOpen(false);
          resetForm();
        } else {
          setError("Failed to update user");
        }
      } else {
        // Create new user
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });

        if (response.ok) {
          const newUser = await response.json();
          const userWithDisplayId = {
            ...newUser,
            displayId: getDisplayId(newUser.id),
            joined: new Date().toISOString().slice(0, 10),
            password: "",
            status: newUser.status
          };
          setUsers([userWithDisplayId, ...users]);
          setOpen(false);
          resetForm();
        } else {
          setError("Failed to create user");
        }
      }
    } catch (error) {
      console.error('Error saving user:', error);
      setError("An error occurred while saving the user");
    }
  };

  // Edit user
  const editUser = (user: AppUser) => {
    setEditingUserId(user.id);
    setName(user.name);
    setEmail(user.email);
    setPassword("");
    setConfirmPassword("");
    setRole(user.role);
    setActive(user.status === "Active");
    setError("");
    setProfilePictureData(user.profilePicture || null);
    setOpen(true);
  };

  // Toggle user status
  const toggleStatus = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const newStatus = user.status === "Active" ? "Inactive" : "Active";
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, status: newStatus } : u
        ));
      } else {
        console.error('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Tablet Orientation-based Responsive Design */
          @media (min-width: 768px) and (max-width: 1024px) {
            /* Portrait mode - use EXACT mobile layout */
            @media (orientation: portrait) {
              .tablet-landscape\\:lg\\:hidden {
                display: block !important;
              }
              .tablet-landscape\\:lg\\:block {
                display: none !important;
              }
            }
            
            /* iPad Mini Portrait (768px × 1024px) - fix header overlap */
            @media (orientation: portrait) and (min-width: 768px) and (max-width: 768px) {
              .min-h-screen {
                padding-top: 3rem !important;
              }
            }
            
            /* iPad Air Portrait (820px × 1180px) - fix header overlap */
            @media (orientation: portrait) and (min-width: 820px) and (max-width: 820px) {
              .min-h-screen {
                padding-top: 3rem !important;
              }
            }
            
            /* iPad Mini Landscape (1024px × 768px) - use mobile layout */
            @media (orientation: landscape) and (min-width: 1024px) and (max-width: 1024px) {
              .tablet-landscape\\:lg\\:hidden {
                display: block !important;
              }
              .tablet-landscape\\:lg\\:block {
                display: none !important;
              }
            }
            
            /* iPad Air and larger tablets landscape - use desktop layout */
            @media (orientation: landscape) and (min-width: 1025px) {
              .tablet-landscape\\:lg\\:hidden {
                display: none !important;
              }
              .tablet-landscape\\:lg\\:block {
                display: block !important;
              }
            }
            
            /* General Tablet Landscape - horizontal scrollable table layout */
            @media (orientation: landscape) and (min-width: 1024px) and (max-width: 1366px) {
              /* Compact but readable table column widths */
              .w-\\[15\\%\\] { width: 12% !important; min-width: 80px !important; }
              .w-\\[30\\%\\] { width: 25% !important; min-width: 150px !important; }
              .w-\\[25\\%\\] { width: 20% !important; min-width: 120px !important; }
              .w-\\[20\\%\\] { width: 15% !important; min-width: 100px !important; }
              .w-\\[10\\%\\] { width: 8% !important; min-width: 60px !important; }
              
              /* Compact table padding */
              .p-6 { padding: 0.5rem !important; }
              .px-6 { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
              .py-6 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
              
              /* Readable text sizes */
              .text-sm { font-size: 0.75rem !important; }
              .text-base { font-size: 0.75rem !important; }
              .text-xs { font-size: 0.65rem !important; }
              
              /* Force horizontal scroll for table container */
              .overflow-x-auto { 
                overflow-x: auto !important; 
                overflow-y: visible !important;
                -webkit-overflow-scrolling: touch !important;
              }
              
              /* Table width and scroll behavior */
              table { 
                width: 100% !important; 
                min-width: 800px !important; 
                table-layout: fixed !important; 
              }
              
              /* Enhanced scroll indicators */
              .overflow-x-auto::-webkit-scrollbar {
                height: 8px !important;
              }
              .overflow-x-auto::-webkit-scrollbar-track {
                background: #f1f5f9 !important;
                border-radius: 4px !important;
              }
              .overflow-x-auto::-webkit-scrollbar-thumb {
                background: #cbd5e1 !important;
                border-radius: 4px !important;
                border: 1px solid #e2e8f0 !important;
              }
              .overflow-x-auto::-webkit-scrollbar-thumb:hover {
                background: #94a3b8 !important;
              }
              
              /* Ensure sticky action column works with scroll */
              .sticky.right-0 {
                position: sticky !important;
                right: 0 !important;
                z-index: 10 !important;
                background: white !important;
                box-shadow: -2px 0 4px rgba(0,0,0,0.1) !important;
              }
            }
            
            /* iPad Air Landscape (1180px × 820px) - horizontal scrollable table layout */
            @media (orientation: landscape) and (min-width: 1180px) and (max-width: 1180px) {
              /* Compact but readable table column widths */
              .w-\\[15\\%\\] { width: 12% !important; min-width: 80px !important; }
              .w-\\[30\\%\\] { width: 25% !important; min-width: 150px !important; }
              .w-\\[25\\%\\] { width: 20% !important; min-width: 120px !important; }
              .w-\\[20\\%\\] { width: 15% !important; min-width: 100px !important; }
              .w-\\[10\\%\\] { width: 8% !important; min-width: 60px !important; }
              
              /* Compact table padding */
              .p-6 { padding: 0.5rem !important; }
              .px-6 { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
              .py-6 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
              
              /* Readable text sizes */
              .text-sm { font-size: 0.75rem !important; }
              .text-base { font-size: 0.75rem !important; }
              .text-xs { font-size: 0.65rem !important; }
              
              /* Force horizontal scroll for table container */
              .overflow-x-auto { 
                overflow-x: auto !important; 
                overflow-y: visible !important;
                -webkit-overflow-scrolling: touch !important;
              }
              
              /* Table width and scroll behavior */
              table { 
                width: 100% !important; 
                min-width: 800px !important; 
                table-layout: fixed !important; 
              }
              
              /* Enhanced scroll indicators */
              .overflow-x-auto::-webkit-scrollbar {
                height: 8px !important;
              }
              .overflow-x-auto::-webkit-scrollbar-track {
                background: #f1f5f9 !important;
                border-radius: 4px !important;
              }
              .overflow-x-auto::-webkit-scrollbar-thumb {
                background: #cbd5e1 !important;
                border-radius: 4px !important;
                border: 1px solid #e2e8f0 !important;
              }
              .overflow-x-auto::-webkit-scrollbar-thumb:hover {
                background: #94a3b8 !important;
              }
              
              /* Ensure sticky action column works with scroll */
              .sticky.right-0 {
                position: sticky !important;
                right: 0 !important;
                z-index: 10 !important;
                background: white !important;
                box-shadow: -2px 0 4px rgba(0,0,0,0.1) !important;
              }
            }
          }
        `
      }} />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#27aae1] to-[#ea078b] bg-clip-text text-transparent leading-tight py-2">
            User Management
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Manage your team members, their roles, and access permissions. 
            Add new users, modify existing ones, and control system access.
          </p>
        </div>



        {/* Main Content */}
        <Card className="shadow-xl border-0 bg-white">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            {/* Search and Add User */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search users by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl h-12 text-base"
                />
              </div>
              <Button
                onClick={() => setOpen(true)}
                className="bg-[#27aae1] hover:bg-[#1e8bc3] text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 h-12"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New User
              </Button>
            </div>

            {/* Filters */}
            <div className="user-management-filters grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Role</label>
                <Select value={roleFilter} onValueChange={(v: "all" | "admin" | "user" | "estimator") => setRoleFilter(v)}>
                  <SelectTrigger className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl h-12">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="estimator">Estimator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <Select value={statusFilter} onValueChange={(v: "all" | "Active" | "Inactive") => setStatusFilter(v)}>
                  <SelectTrigger className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl h-12">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-slate-600 mb-4">
              <span>Showing {current.length} of {filtered.length} users</span>
              {filtered.length > PAGE_SIZE && (
                <Button
                  variant="ghost"
                  onClick={() => setShowAll(!showAll)}
                  className="text-[#27aae1] hover:text-[#1e8bc3] hover:bg-[#27aae1]/10 rounded-xl px-4 py-2 transition-all duration-200"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Show All ({filtered.length})
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Table - Mobile Responsive */}
            <div className="overflow-hidden border border-slate-200 rounded-2xl">
              {/* Desktop Table */}
              <div className="hidden lg:block tablet-landscape:lg:block overflow-x-auto" style={{overflowX: 'auto'}}>
                <Table className="min-w-full lg:min-w-[800px]">
                  <TableHeader className="bg-slate-50">
                    <TableRow className="border-slate-200">
                      <TableHead className="w-[15%] text-slate-700 font-semibold p-6">ID</TableHead>
                      <TableHead className="w-[30%] text-slate-700 font-semibold p-6">User</TableHead>
                      <TableHead className="text-slate-700 font-semibold p-6">Joined</TableHead>
                      <TableHead className="text-slate-700 font-semibold p-6">Role</TableHead>
                      <TableHead className="text-slate-700 font-semibold p-6">Status</TableHead>
                      <TableHead className="text-center text-slate-700 font-semibold p-6">Edit</TableHead>
                      <TableHead className="text-center text-slate-700 font-semibold p-6">Status Toggle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-16 text-slate-500">
                          Loading users...
                        </TableCell>
                      </TableRow>
                    ) : current.map((u) => (
                      <TableRow key={u.id} className="hover:bg-slate-50 transition-colors duration-200 border-slate-100">
                        {/* ID */}
                        <TableCell className="p-6">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#ea078b]/20 text-[#ea078b]">
                            {u.displayId || u.id}
                          </span>
                        </TableCell>
                        
                        {/* User (nama + email) */}
                        <TableCell className="p-6">
                          <div className="flex items-start gap-3">
                            <div className="mt-1 h-8 w-8 rounded-full bg-gradient-to-br from-[#27aae1] to-[#ea078b] flex items-center justify-center overflow-hidden">
                              {u.profilePicture ? (
                                <>
                                  <img 
                                    src={u.profilePicture} 
                                    alt={`${u.name}'s profile`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      // Fallback to initial if image fails to load
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const fallback = target.nextElementSibling as HTMLElement;
                                      if (fallback) fallback.style.display = 'flex';
                                    }}
                                  />
                                  <span 
                                    className="text-white text-xs font-medium absolute"
                                    style={{ display: 'none' }}
                                  >
                                    {u.name.charAt(0).toUpperCase()}
                                  </span>
                                </>
                              ) : (
                                <span className="text-white text-xs font-medium">
                                  {u.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{u.name}</div>
                              <div className="text-xs text-slate-500">
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Joined */}
                        <TableCell className="text-sm text-slate-700 p-6">{fmt(u.joined)}</TableCell>

                        {/* Role badge with icon */}
                        <TableCell className="p-6">
                          <div className="flex items-center gap-2">
                            {getRoleIcon(u.role)}
                            <RoleBadge role={u.role} />
                          </div>
                        </TableCell>

                        {/* Status text */}
                        <TableCell className="p-6">
                          <StatusChip value={u.status} />
                        </TableCell>

                        {/* Edit button */}
                        <TableCell className="text-center p-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => editUser(u)}
                            className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600 rounded-xl px-4 py-2 transition-all duration-200"
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </TableCell>

                        {/* Action switch */}
                        <TableCell className="text-center p-6">
                          <div className="flex flex-col items-center space-y-2">
                            <Switch
                              checked={u.status === "Active"}
                              onCheckedChange={() => toggleStatus(u.id)}
                              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-purple-600"
                            />
                            <span className="text-xs text-slate-500 font-medium">
                              {u.status === "Active" ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {current.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-16 text-slate-500"
                        >
                          {filtered.length === 0 ? "No users found matching your filters." : "No users to display."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden tablet-landscape:lg:hidden space-y-4 p-4">
                {loading ? (
                  <div className="text-center py-16 text-slate-500">
                    Loading users...
                  </div>
                ) : current.map((u) => (
                  <Card key={u.id} className="p-4 border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="space-y-4">
                      {/* Header with ID and Status */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-medium text-slate-900 bg-purple-100 text-purple-800 px-3 py-1.5 rounded-lg">
                          {u.displayId || u.id}
                        </span>
                        <StatusChip value={u.status} />
                      </div>
                      
                      {/* User Info */}
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {u.profilePicture ? (
                              <>
                                <img 
                                  src={u.profilePicture} 
                                  alt={`${u.name}'s profile`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const fallback = target.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                                <span 
                                  className="text-white text-sm font-medium absolute"
                                  style={{ display: 'none' }}
                                >
                                  {u.name.charAt(0).toUpperCase()}
                                </span>
                              </>
                            ) : (
                              <span className="text-white text-sm font-medium">
                                {u.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">User</div>
                            <div className="font-semibold text-slate-900 text-base">{u.name}</div>
                            <div className="text-sm text-slate-600 truncate">{u.email}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Role and Join Date */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Role</div>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(u.role)}
                            <RoleBadge role={u.role} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Joined</div>
                          <div className="font-medium text-slate-900">{fmt(u.joined || new Date().toISOString().slice(0, 10))}</div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-slate-100">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editUser(u)}
                          className="flex-1 border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit User
                        </Button>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 font-medium">Status:</span>
                          <Switch
                            checked={u.status === "Active"}
                            onCheckedChange={() => toggleStatus(u.id)}
                            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-purple-600"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {current.length === 0 && (
                  <div className="text-center py-16 text-slate-500">
                    {filtered.length === 0 ? "No users found matching your filters." : "No users to display."}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===== Modal Add New User ===== */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[520px] md:max-w-[600px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">
                {editingUserId ? "Edit User" : "Add New User"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Full Name</label>
                  <Input
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Email</label>
                  <Input
                    type="email"
                    placeholder="user@mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl"
                  />
                </div>
                
                {/* Profile Picture Upload */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Profile Picture</label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center overflow-hidden">
                      {editingUserId && users.find(u => u.id === editingUserId)?.profilePicture ? (
                        <img 
                          src={users.find(u => u.id === editingUserId)?.profilePicture || ''} 
                          alt="Current profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // File size validation (max 2MB)
                            if (file.size > 2 * 1024 * 1024) {
                              alert('Profile picture must be less than 2MB. Please choose a smaller image.');
                              return;
                            }
                            
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              const result = e.target?.result as string;
                              // Store the profile picture data for later upload
                              setProfilePictureData(result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-sm"
                      />
                      <p className="text-xs text-slate-500 mt-1">Max 2MB, will be automatically compressed</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Password {editingUserId && <span className="text-slate-400 font-normal">(leave blank to keep current)</span>}
                  </label>
                  <Input
                    type="password"
                    placeholder={editingUserId ? "Leave blank to keep current" : "********"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Confirm Password {editingUserId && <span className="text-slate-400 font-normal">(leave blank to keep current)</span>}
                  </label>
                  <Input
                    type="password"
                    placeholder={editingUserId ? "Leave blank to keep current" : "********"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Role</label>
                  <Select
                    value={role}
                    onValueChange={(v) => setRole(v as AppUserRole)}
                  >
                    <SelectTrigger className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-yellow-600" />
                          Admin
                        </div>
                      </SelectItem>
                      <SelectItem value="user">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-[#27aae1]" />
                          User
                        </div>
                      </SelectItem>
                      <SelectItem value="estimator">
                        <div className="flex items-center gap-2">
                          <Calculator className="h-4 w-4 text-[#f89d1d]" />
                          Estimator
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 bg-slate-50">
                  <div>
                    <div className="text-sm text-slate-600">Status</div>
                    <div className="text-sm font-medium text-slate-900">
                      {active ? "Active" : "Inactive"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {editingUserId ? "Toggle user status" : "New users are Active by default"}
                    </div>
                  </div>
                  <Switch 
                    checked={active} 
                    onCheckedChange={setActive}
                    className="data-[state=checked]:bg-[#ea078b]"
                  />
                </div>
                {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                className="border-slate-300 hover:border-slate-400 hover:bg-slate-50 px-6 py-2 rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                onClick={addUser}
                className="bg-[#27aae1] hover:bg-[#1e8bc3] text-white px-6 py-2 rounded-xl"
              >
                {editingUserId ? "Update User" : "Add User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
