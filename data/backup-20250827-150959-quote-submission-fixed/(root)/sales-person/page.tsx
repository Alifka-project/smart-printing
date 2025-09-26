"use client";

import * as React from "react";
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
import { Plus, Edit3, UserCheck, ChevronDown, ChevronUp, Search, Filter } from "lucide-react";
import StatusChip from "@/components/shared/StatusChip";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

// Sales Person type definition
interface SalesPerson {
  id: string;
  salesPersonId: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  designation: string;
  department: string;
  hireDate: string;
  status: "Active" | "Inactive";
  profilePicture?: string;
  address?: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SalesPersonManagementPage() {
  const [salesPersons, setSalesPersons] = React.useState<SalesPerson[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "Active" | "Inactive">("all");
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [editingPerson, setEditingPerson] = React.useState<SalesPerson | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  // Load sales persons from database on page load
  React.useEffect(() => {
    const loadSalesPersons = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/sales-persons');
        if (response.ok) {
          const data = await response.json();
          setSalesPersons(data);
        } else {
          console.error('Failed to load sales persons');
          // Fallback to sample data if API fails
          setSalesPersons([]);
        }
      } catch (error) {
        console.error('Error loading sales persons:', error);
        setSalesPersons([]);
      } finally {
        setLoading(false);
      }
    };

    loadSalesPersons();
  }, []);

  // Filter sales persons based on search and status
  const filteredSalesPersons = React.useMemo(() => {
    return salesPersons.filter((person) => {
      const matchesSearch = search === "" || 
        person.name.toLowerCase().includes(search.toLowerCase()) ||
        person.email.toLowerCase().includes(search.toLowerCase()) ||
        person.salesPersonId.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || person.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [salesPersons, search, statusFilter]);

  // Add new sales person
  const handleAddSalesPerson = async (formData: Omit<SalesPerson, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/sales-persons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newPerson = await response.json();
        setSalesPersons(prev => [...prev, newPerson]);
        setShowAddModal(false);
      } else {
        console.error('Failed to add sales person');
      }
    } catch (error) {
      console.error('Error adding sales person:', error);
    }
  };

  // Update existing sales person
  const handleUpdateSalesPerson = async (id: string, formData: Partial<SalesPerson>) => {
    try {
      const response = await fetch(`/api/sales-persons/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedPerson = await response.json();
        setSalesPersons(prev => prev.map(p => p.id === id ? updatedPerson : p));
        setIsEditModalOpen(false);
        setEditingPerson(null);
      } else {
        console.error('Failed to update sales person');
      }
    } catch (error) {
      console.error('Error updating sales person:', error);
    }
  };

  // Delete sales person
  const handleDeleteSalesPerson = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sales person?')) return;

    try {
      const response = await fetch(`/api/sales-persons/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSalesPersons(prev => prev.filter(p => p.id !== id));
      } else {
        console.error('Failed to delete sales person');
      }
    } catch (error) {
      console.error('Error deleting sales person:', error);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Person Management</h1>
          <p className="text-gray-600 mt-2">Manage your sales team and their information</p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Sales Person
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700 mb-2 block">
                Status
              </Label>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
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
        </CardContent>
      </Card>

      {/* Sales Persons Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-gray-700 font-semibold p-6">Sales Person ID</TableHead>
                  <TableHead className="text-gray-700 font-semibold p-6">Name</TableHead>
                  <TableHead className="text-gray-700 font-semibold p-6">Email</TableHead>
                  <TableHead className="text-gray-700 font-semibold p-6">Phone</TableHead>
                  <TableHead className="text-gray-700 font-semibold p-6">Designation</TableHead>
                  <TableHead className="text-gray-700 font-semibold p-6">Department</TableHead>
                  <TableHead className="text-gray-700 font-semibold p-6">Hire Date</TableHead>
                  <TableHead className="text-gray-700 font-semibold p-6">Status</TableHead>
                  <TableHead className="text-gray-700 font-semibold p-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="p-8 text-center text-gray-500">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span>Loading sales persons...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredSalesPersons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="p-8 text-center text-gray-500">
                      No sales persons found. {statusFilter !== "all" && `No sales persons with status "${statusFilter}".`}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSalesPersons.map((person) => (
                    <TableRow key={person.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                      <TableCell className="p-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <UserCheck className="w-4 h-4 text-white" />
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                            {person.salesPersonId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="p-6">
                        <div className="truncate">
                          <span className="font-medium text-gray-900">{person.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-6">
                        <div className="truncate">
                          <span className="text-gray-700">{person.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-6">
                        <div className="truncate">
                          <span className="text-gray-700">{person.countryCode} {person.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-6">
                        <div className="truncate">
                          <span className="text-gray-700">{person.designation}</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-6">
                        <div className="truncate">
                          <span className="text-gray-700">{person.department}</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-6">
                        <div className="truncate">
                          <span className="text-gray-700">{formatDate(person.hireDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-6">
                        <StatusChip status={person.status} />
                      </TableCell>
                      <TableCell className="p-6">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingPerson(person);
                              setIsEditModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit3 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Sales Person Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl font-bold text-gray-800">
              <Plus className="w-8 h-8 mr-3 text-blue-600" />
              Add New Sales Person
            </DialogTitle>
          </DialogHeader>
          
          <AddSalesPersonForm 
            onSubmit={handleAddSalesPerson}
            onCancel={() => setShowAddModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Sales Person Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl font-bold text-gray-800">
              <Edit3 className="w-8 h-8 mr-3 text-blue-600" />
              Edit Sales Person
            </DialogTitle>
          </DialogHeader>
          
          {editingPerson && (
            <EditSalesPersonForm 
              salesPerson={editingPerson}
              onSubmit={(formData) => handleUpdateSalesPerson(editingPerson.id, formData)}
              onCancel={() => {
                setIsEditModalOpen(false);
                setEditingPerson(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add Sales Person Form Component
function AddSalesPersonForm({ onSubmit, onCancel }: { 
  onSubmit: (data: Omit<SalesPerson, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = React.useState({
    salesPersonId: 'SL-',
    name: '',
    email: '',
    phone: '',
    countryCode: '+971',
    designation: 'Sales Representative',
    department: 'Sales',
    hireDate: new Date().toISOString().split('T')[0],
    status: 'Active' as const,
    address: '',
    city: 'Dubai',
    state: 'Dubai',
    postalCode: '',
    country: 'UAE',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
                      <Label htmlFor="salesPersonId" className="text-sm font-medium text-gray-700 mb-2 block">
              Sales Person ID *
            </Label>
            <Input
              id="salesPersonId"
              value={formData.salesPersonId}
              onChange={(e) => setFormData(prev => ({ ...prev, salesPersonId: e.target.value }))}
              placeholder="e.g., SL-001"
              required
            />
        </div>
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
            Full Name *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter full name"
            required
          />
        </div>
        <div>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
            Email *
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter email address"
            required
          />
        </div>
        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block">
            Phone *
          </Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="Enter phone number"
            required
          />
        </div>
        <div>
          <Label htmlFor="countryCode" className="text-sm font-medium text-gray-700 mb-2 block">
            Country Code
          </Label>
          <Input
            id="countryCode"
            value={formData.countryCode}
            onChange={(e) => setFormData(prev => ({ ...prev, countryCode: e.target.value }))}
            placeholder="+971"
          />
        </div>
        <div>
          <Label htmlFor="designation" className="text-sm font-medium text-gray-700 mb-2 block">
            Designation
          </Label>
          <Input
            id="designation"
            value={formData.designation}
            onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
            placeholder="e.g., Sales Representative"
          />
        </div>
        <div>
          <Label htmlFor="department" className="text-sm font-medium text-gray-700 mb-2 block">
            Department
          </Label>
          <Input
            id="department"
            value={formData.department}
            onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
            placeholder="e.g., Sales"
          />
        </div>
        <div>
          <Label htmlFor="hireDate" className="text-sm font-medium text-gray-700 mb-2 block">
            Hire Date
          </Label>
          <Input
            id="hireDate"
            type="date"
            value={formData.hireDate}
            onChange={(e) => setFormData(prev => ({ ...prev, hireDate: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="status" className="text-sm font-medium text-gray-700 mb-2 block">
            Status
          </Label>
          <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city" className="text-sm font-medium text-gray-700 mb-2 block">
            City
          </Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            placeholder="Enter city"
          />
        </div>
        <div>
          <Label htmlFor="state" className="text-sm font-medium text-gray-700 mb-2 block">
            State
          </Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
            placeholder="Enter state"
          />
        </div>
        <div>
          <Label htmlFor="country" className="text-sm font-medium text-gray-700 mb-2 block">
            Country
          </Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
            placeholder="Enter country"
          />
        </div>
        <div>
          <Label htmlFor="postalCode" className="text-sm font-medium text-gray-700 mb-2 block">
            Postal Code
          </Label>
          <Input
            id="postalCode"
            value={formData.postalCode}
            onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
            placeholder="Enter postal code"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address" className="text-sm font-medium text-gray-700 mb-2 block">
          Address
        </Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          placeholder="Enter full address"
        />
      </div>

      <div>
        <Label htmlFor="notes" className="text-sm font-medium text-gray-700 mb-2 block">
          Notes
        </Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Enter any additional notes"
        />
      </div>

      <DialogFooter className="pt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Add Sales Person
        </Button>
      </DialogFooter>
    </form>
  );
}

// Edit Sales Person Form Component
function EditSalesPersonForm({ 
  salesPerson, 
  onSubmit, 
  onCancel 
}: { 
  salesPerson: SalesPerson;
  onSubmit: (data: Partial<SalesPerson>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = React.useState({
    salesPersonId: salesPerson.salesPersonId,
    name: salesPerson.name,
    email: salesPerson.email,
    phone: salesPerson.phone,
    countryCode: salesPerson.countryCode,
    designation: salesPerson.designation,
    department: salesPerson.department,
    hireDate: salesPerson.hireDate.split('T')[0],
    status: salesPerson.status,
    address: salesPerson.address || '',
    city: salesPerson.city,
    state: salesPerson.state,
    postalCode: salesPerson.postalCode || '',
    country: salesPerson.country,
    notes: salesPerson.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
                      <Label htmlFor="edit-salesPersonId" className="text-sm font-medium text-gray-700 mb-2 block">
              Sales Person ID *
            </Label>
            <Input
              id="edit-salesPersonId"
              value={formData.salesPersonId}
              onChange={(e) => setFormData(prev => ({ ...prev, salesPersonId: e.target.value }))}
              placeholder="e.g., SL-001"
              required
            />
        </div>
        <div>
          <Label htmlFor="edit-name" className="text-sm font-medium text-gray-700 mb-2 block">
            Full Name *
          </Label>
          <Input
            id="edit-name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter full name"
            required
          />
        </div>
        <div>
          <Label htmlFor="edit-email" className="text-sm font-medium text-gray-700 mb-2 block">
            Email *
          </Label>
          <Input
            id="edit-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter email address"
            required
          />
        </div>
        <div>
          <Label htmlFor="edit-phone" className="text-sm font-medium text-gray-700 mb-2 block">
            Phone *
          </Label>
          <Input
            id="edit-phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="Enter phone number"
            required
          />
        </div>
        <div>
          <Label htmlFor="edit-countryCode" className="text-sm font-medium text-gray-700 mb-2 block">
            Country Code
          </Label>
          <Input
            id="edit-countryCode"
            value={formData.countryCode}
            onChange={(e) => setFormData(prev => ({ ...prev, countryCode: e.target.value }))}
            placeholder="+971"
          />
        </div>
        <div>
          <Label htmlFor="edit-designation" className="text-sm font-medium text-gray-700 mb-2 block">
            Designation
          </Label>
          <Input
            id="edit-designation"
            value={formData.designation}
            onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
            placeholder="e.g., Sales Representative"
          />
        </div>
        <div>
          <Label htmlFor="edit-department" className="text-sm font-medium text-gray-700 mb-2 block">
            Department
          </Label>
          <Input
            id="edit-department"
            value={formData.department}
            onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
            placeholder="e.g., Sales"
          />
        </div>
        <div>
          <Label htmlFor="edit-hireDate" className="text-sm font-medium text-gray-700 mb-2 block">
            Hire Date
          </Label>
          <Input
            id="edit-hireDate"
            type="date"
            value={formData.hireDate}
            onChange={(e) => setFormData(prev => ({ ...prev, hireDate: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="edit-status" className="text-sm font-medium text-gray-700 mb-2 block">
            Status
          </Label>
          <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-city" className="text-sm font-medium text-gray-700 mb-2 block">
            City
          </Label>
          <Input
            id="edit-city"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            placeholder="Enter city"
          />
        </div>
        <div>
          <Label htmlFor="edit-state" className="text-sm font-medium text-gray-700 mb-2 block">
            State
          </Label>
          <Input
            id="edit-state"
            value={formData.state}
            onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
            placeholder="Enter state"
          />
        </div>
        <div>
          <Label htmlFor="edit-country" className="text-sm font-medium text-gray-700 mb-2 block">
            Country
          </Label>
          <Input
            id="edit-country"
            value={formData.country}
            onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
            placeholder="Enter country"
          />
        </div>
        <div>
          <Label htmlFor="edit-postalCode" className="text-sm font-medium text-gray-700 mb-2 block">
            Postal Code
          </Label>
          <Input
            id="edit-postalCode"
            value={formData.postalCode}
            onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
            placeholder="Enter postal code"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="edit-address" className="text-sm font-medium text-gray-700 mb-2 block">
          Address
        </Label>
        <Input
          id="edit-address"
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          placeholder="Enter full address"
        />
      </div>

      <div>
        <Label htmlFor="edit-notes" className="text-sm font-medium text-gray-700 mb-2 block">
          Notes
        </Label>
        <Input
          id="edit-notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Enter any additional notes"
        />
      </div>

      <DialogFooter className="pt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Update Sales Person
        </Button>
      </DialogFooter>
    </form>
  );
}
