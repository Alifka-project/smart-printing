"use client";

import * as React from "react";
import {
  seedUsers,
  type AppUser,
  type AppUserRole,
} from "@/constants/dummyusers";

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

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export default function UserManagementPage() {
  const [users, setUsers] = React.useState<AppUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Load users from database on page load
  React.useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        if (response.ok) {
          const usersData = await response.json();
          if (usersData.length > 0) {
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
            // If no users in database, use seed users
            console.log('No users in database, using seed users');
            const seedUsersWithDisplayIds = seedUsers.map(user => ({
              ...user,
              displayId: getDisplayId(user.id)
            }));
            setUsers(seedUsersWithDisplayIds);
          }
        } else {
          console.error('Failed to load users');
          // Fallback to seed users if API fails
          const seedUsersWithDisplayIds = seedUsers.map(user => ({
            ...user,
            displayId: getDisplayId(user.id)
          }));
          setUsers(seedUsersWithDisplayIds);
        }
      } catch (error) {
        console.error('Error loading users:', error);
        // Fallback to seed users if API fails
        const seedUsersWithDisplayIds = seedUsers.map(user => ({
          ...user,
          displayId: getDisplayId(user.id)
        }));
        setUsers(seedUsersWithDisplayIds);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // ===== filter & paging =====
  const [search, setSearch] = React.useState("");
  const [from, setFrom] = React.useState<string>("");
  const [to, setTo] = React.useState<string>("");
  const [roleFilter, setRoleFilter] = React.useState<"all" | AppUserRole>("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "Active" | "Inactive">("all");
  const [page, setPage] = React.useState(1);
  const [showAll, setShowAll] = React.useState(false);

  const PAGE_SIZE = 20;

  React.useEffect(() => setPage(1), [search, from, to, roleFilter, statusFilter]);

  const filtered = React.useMemo(() => {
    return users.filter((u) => {
      const s = search.trim().toLowerCase();
      const hitSearch =
        s === "" || 
        u.name.toLowerCase().includes(s) || 
        u.email.toLowerCase().includes(s) ||
        u.id.toLowerCase().includes(s);

      const hitRole = roleFilter === "all" || u.role === roleFilter;
      const hitStatus = statusFilter === "all" || u.status === statusFilter;

      const hitFrom = from === "" || u.joined >= from;
      const hitTo = to === "" || u.joined <= to;

      return hitSearch && hitRole && hitStatus && hitFrom && hitTo;
    });
  }, [users, search, from, to, roleFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const current = showAll ? filtered : filtered.slice(start, start + PAGE_SIZE);

  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<AppUserRole>("user");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [active, setActive] = React.useState(true);
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null);
  const [profilePictureData, setProfilePictureData] = React.useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setEmail("");
    setRole("user");
    setActive(true);
    setPassword("");
    setConfirmPassword("");
    setEditingUserId(null);
    setError("");
    setProfilePictureData(null);
  };

  const addUser = async () => {
    if (!name.trim() || !email.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    
    // Password is required for new users, optional for editing
    if (!editingUserId && !password.trim()) {
      setError("Password is required for new users.");
      return;
    }
    
    if (password.trim() && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      if (editingUserId) {
        // Editing existing user
        const response = await fetch(`/api/users/${editingUserId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            role,
            // Only update password if a new one is provided
            password: password.trim() || undefined,
            // Include profile picture if provided
            profilePicture: profilePictureData || undefined,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update user');
        }

        // Update local state
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUserId
              ? {
                  ...u,
                  name: name.trim(),
                  email: email.trim(),
                  role,
                  status: active ? "Active" : "Inactive",
                  // Only update password if a new one is provided
                  password: password.trim() || u.password,
                  // Update profile picture if provided
                  profilePicture: profilePictureData || u.profilePicture,
                }
              : u
          )
        );
      } else {
        // Adding new user
        const newId = `EMP${String(users.length + 1).padStart(3, "0")}`;
        const joined = new Date().toISOString().slice(0, 10);
        
        const userData = {
          name: name.trim(),
          email: email.trim(),
          role,
          password: password.trim(),
          profilePicture: profilePictureData || undefined,
        };

        // Save to database
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          throw new Error('Failed to create user');
        }

        const newUser = await response.json();
        
        // Add to local state for immediate UI update
        const user: AppUser = {
          id: newUser.id || newId,
          displayId: getDisplayId(newUser.id || newId),
          name: name.trim(),
          email: email.trim(),
          joined,
          role,
          status: "Active", // Default to Active as per feedback
          password: password.trim(),
          profilePicture: profilePictureData || null,
        };
        setUsers((prev) => [user, ...prev]);
      }
      
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving user:', error);
      setError('Error saving user. Please try again.');
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      const user = users.find(u => u.id === id);
      if (!user) return;

      const newStatus = user.status === "Active" ? "Inactive" : "Active";
      
      // Update in database
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" }
            : u
        )
      );
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status. Please try again.');
    }
  };

  const editUser = (user: AppUser) => {
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setActive(user.status === "Active");
    setPassword(""); // Clear password for security
    setConfirmPassword("");
    setError("");
    setOpen(true);
    // Store the user being edited
    setEditingUserId(user.id);
    setProfilePictureData(user.profilePicture || null);
  };

  const getRoleIcon = (role: AppUserRole) => {
    switch (role) {
      case "admin":
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case "estimator":
        return <Calculator className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-12">
      {/* Welcome Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          User Management
        </h1>
        <p className="text-lg text-slate-600">Manage system users, roles, and permissions. Add new users, modify roles, and control access to the Smart Printing System.</p>
      </div>
      
      {/* Main Content Card */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-10 space-y-8">
          {/* Search and Create Button */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-2 flex-1">
              <Label htmlFor="search-input" className="text-sm font-medium text-slate-700">Search</Label>
              <Input
                id="search-input"
                placeholder="Search by user name, email, or ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-10 w-full"
              />
            </div>

            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 h-10" 
              onClick={() => setOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New User
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-8 border border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Joined From</label>
              <Input 
                type="date" 
                value={from} 
                onChange={(e) => setFrom(e.target.value)}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Joined To</label>
              <Input 
                type="date" 
                value={to} 
                onChange={(e) => setTo(e.target.value)}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Role</label>
              <Select value={roleFilter} onValueChange={(v: "all" | AppUserRole) => setRoleFilter(v)}>
                <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
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
                <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Showing {current.length} of {filtered.length} users</span>
            {filtered.length > PAGE_SIZE && (
              <Button
                variant="ghost"
                onClick={() => setShowAll(!showAll)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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

          {/* Table */}
          <div className="overflow-hidden border border-slate-200 rounded-2xl">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-slate-200">
                  <TableHead className="w-[15%] text-slate-700 font-semibold p-6">ID</TableHead>
                  <TableHead className="w-[30%] text-slate-700 font-semibold p-6">User</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Joined</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Role</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Status</TableHead>
                  <TableHead className="text-center text-slate-700 font-semibold p-6">Edit</TableHead>
                  <TableHead className="text-right pr-8 text-slate-700 font-semibold p-6">Action</TableHead>
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
                  <TableRow key={u.id} className="hover:bg-slate-50/80 transition-colors duration-200 border-slate-100">
                    {/* ID */}
                    <TableCell className="p-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        {u.displayId}
                      </span>
                    </TableCell>
                    
                    {/* User (nama + email) */}
                    <TableCell className="p-6">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden">
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
                    <TableCell className="text-right pr-8 p-6">
                      <Switch
                        checked={u.status === "Active"}
                        onCheckedChange={() => toggleStatus(u.id)}
                        className="data-[state=checked]:bg-purple-600"
                      />
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
        </CardContent>
      </Card>

      {/* ===== Modal Add New User ===== */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-2xl">
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
                  placeholder="e.g. EMP004"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Email</label>
                <Input
                  type="email"
                  placeholder="user@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
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
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
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
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Role</label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v as AppUserRole)}
                >
                  <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
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
                        <User className="h-4 w-4 text-blue-600" />
                        User
                      </div>
                    </SelectItem>
                    <SelectItem value="estimator">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-blue-600" />
                        Estimator
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 bg-slate-50/50">
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
                  className="data-[state=checked]:bg-purple-600"
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl"
            >
              {editingUserId ? "Update User" : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
