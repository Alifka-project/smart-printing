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
import { Plus, Edit3, ChevronDown, ChevronUp, Filter } from "lucide-react";
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
          console.log('Loaded sales persons:', data);
          setSalesPersons(data);
        } else {
          console.error('Failed to load sales persons');
          // Fallback to sample data if API fails
          const sampleData: SalesPerson[] = [
            {
              id: '1',
              salesPersonId: 'SL-001',
              name: 'John Doe',
              email: 'john.doe@example.com',
              phone: '123456789',
              countryCode: '+971',
              designation: 'Sales Representative',
              department: 'Sales',
              hireDate: '2024-01-01',
              status: 'Active' as const,
              city: 'Dubai',
              state: 'Dubai',
              country: 'UAE',
              createdAt: '2024-01-01',
              updatedAt: '2024-01-01'
            }
          ];
          console.log('Using sample data:', sampleData);
          setSalesPersons(sampleData);
        }
      } catch (error) {
        console.error('Error loading sales persons:', error);
        // Fallback to sample data if API fails
        const sampleData: SalesPerson[] = [
          {
            id: '1',
            salesPersonId: 'SL-001',
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '123456789',
            countryCode: '+971',
            designation: 'Sales Representative',
            department: 'Sales',
            hireDate: '2024-01-01',
            status: 'Active' as const,
            city: 'Dubai',
            state: 'Dubai',
            country: 'UAE',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01'
          }
        ];
        console.log('Using sample data due to error:', sampleData);
        setSalesPersons(sampleData);
      } finally {
        setLoading(false);
      }
    };

    loadSalesPersons();
  }, []);

  // Filter sales persons based on search and status
  const filteredSalesPersons = React.useMemo(() => {
    console.log('Search term:', search);
    console.log('Sales persons data:', salesPersons);
    
    return salesPersons.filter((person) => {
      const searchTerm = search.toLowerCase().trim();
      
      const matchesSearch = search === "" || 
        (person.name && person.name.toLowerCase().includes(searchTerm)) ||
        (person.email && person.email.toLowerCase().includes(searchTerm)) ||
        (person.salesPersonId && person.salesPersonId.toLowerCase().includes(searchTerm)) ||
        (person.phone && person.phone.toLowerCase().includes(searchTerm)) ||
        (person.designation && person.designation.toLowerCase().includes(searchTerm)) ||
        (person.department && person.department.toLowerCase().includes(searchTerm)) ||
        (person.city && person.city.toLowerCase().includes(searchTerm)) ||
        (person.state && person.state.toLowerCase().includes(searchTerm)) ||
        (person.country && person.country.toLowerCase().includes(searchTerm));
      
      const matchesStatus = statusFilter === "all" || person.status === statusFilter;
      
      if (search !== "" && !matchesSearch) {
        console.log('Person did not match search:', person.name, 'Search term:', searchTerm);
      }
      
      return matchesSearch && matchesStatus;
    });
  }, [salesPersons, search, statusFilter]);

  // Add new sales person
  const handleAddSalesPerson = async (formData: Omit<SalesPerson, 'id' | 'salesPersonId' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Generate automatic SL ID
      const nextId = salesPersons.length + 1;
      const salesPersonId = `SL-${nextId.toString().padStart(3, '0')}`;
      
      const salesPersonData = {
        ...formData,
        salesPersonId
      };

      const response = await fetch('/api/sales-persons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salesPersonData),
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

  const handleEditPerson = (person: SalesPerson) => {
    setEditingPerson(person);
    setIsEditModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
            Sales Person Management
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">
            Manage your sales team. Add new sales persons, track performance, and maintain contact information.
          </p>
        </div>

        {/* Search, Status Filter, and Add Sales Person */}
        <div className="flex flex-col lg:flex-row gap-6 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-slate-700">Search</label>
            <Input
              placeholder="Search by name, email, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12 text-base"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <Select value={statusFilter} onValueChange={(value: "all" | "Active" | "Inactive") => setStatusFilter(value)}>
              <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 h-12 w-auto"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Sales Person
          </Button>
        </div>

        {/* Results Summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-slate-600">
          <span>Showing {salesPersons.length} sales persons</span>
        </div>

        {/* Sales Person Summary */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-2"></div>
              <div className="text-sm text-slate-600">Total Sales Persons</div>
              <div className="text-lg font-bold text-slate-900">{salesPersons.length}</div>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <div className="text-sm text-slate-600">Active</div>
              <div className="text-lg font-bold text-slate-900">{salesPersons.filter(sp => sp.status === "Active").length}</div>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mx-auto mb-2"></div>
              <div className="text-sm text-slate-600">Managers</div>
              <div className="text-lg font-bold text-slate-900">{salesPersons.filter(sp => sp.designation.includes("Manager")).length}</div>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mx-auto mb-2"></div>
              <div className="text-sm text-slate-600">Representatives</div>
              <div className="text-lg font-bold text-slate-900">{salesPersons.filter(sp => sp.designation.includes("Representative")).length}</div>
            </div>
          </div>
        </div>

        {/* Sales Persons Table - Mobile Responsive */}
        <Card className="shadow-xl border-0 bg-white">
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-slate-200">
                    <TableHead className="text-slate-700 font-semibold p-4">ID</TableHead>
                    <TableHead className="text-slate-700 font-semibold p-4">Sales Person</TableHead>
                    <TableHead className="text-slate-700 font-semibold p-4">Email</TableHead>
                    <TableHead className="text-slate-700 font-semibold p-4">Phone Number</TableHead>
                    <TableHead className="text-slate-700 font-semibold p-4">Department & Role</TableHead>
                    <TableHead className="text-slate-700 font-semibold p-4">Status</TableHead>
                    <TableHead className="text-center text-slate-700 font-semibold p-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16 text-slate-500">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span>Loading sales persons...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : salesPersons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16 text-slate-500">
                        No sales persons found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    salesPersons.map((person) => (
                      <TableRow key={person.id} className="hover:bg-slate-50/80 transition-colors duration-200 border-slate-100">
                        <TableCell className="p-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                            {person.salesPersonId}
                          </span>
                        </TableCell>
                        <TableCell className="p-4">
                          <div className="flex items-center space-x-3">
                            {person.profilePicture ? (
                              <div className="w-10 h-10 rounded-full overflow-hidden">
                                <img 
                                  src={person.profilePicture} 
                                  alt={`${person.name}'s profile`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : null}
                            <div>
                              <div className="font-medium text-slate-900">{person.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-4">
                          <div className="text-sm text-slate-900">{person.email}</div>
                        </TableCell>
                        <TableCell className="p-4">
                          <div className="text-sm text-slate-900">{person.phone}</div>
                        </TableCell>
                        <TableCell className="p-4">
                          <div className="space-y-1">
                            <div className="text-sm text-slate-900">{person.department}</div>
                            <div className="text-sm text-slate-500">{person.designation}</div>
                          </div>
                        </TableCell>
                        <TableCell className="p-4">
                          <StatusChip value={person.status} />
                        </TableCell>
                        <TableCell className="text-center p-4">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPerson(person)}
                              className="text-blue-600 hover:bg-blue-50 rounded-lg p-2"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4 p-4">
              {loading ? (
                <div className="text-center py-16 text-slate-500">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span>Loading sales persons...</span>
                  </div>
                </div>
              ) : salesPersons.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  No sales persons found.
                </div>
              ) : (
                salesPersons.map((person) => (
                  <Card key={person.id} className="p-4 border-slate-200">
                    <div className="space-y-3">
                      {/* Header with Sales Person ID and Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-slate-600">{person.salesPersonId}</span>
                        </div>
                        <StatusChip value={person.status} />
                      </div>
                      
                      {/* Sales Person Info */}
                      <div className="flex items-center space-x-3">
                        {person.profilePicture ? (
                          <div className="w-12 h-12 rounded-full overflow-hidden">
                            <img 
                              src={person.profilePicture} 
                              alt={`${person.name}'s profile`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : null}
                        <div>
                          <div className="font-medium text-slate-900 text-lg">{person.name}</div>
                          <div className="text-sm text-slate-500">{person.designation}</div>
                        </div>
                      </div>
                      
                      {/* Contact Details */}
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-slate-500">Email:</span>
                          <span className="text-sm text-slate-700">{person.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-slate-500">Phone:</span>
                          <span className="text-sm text-slate-700">{person.phone}</span>
                        </div>
                      </div>
                      
                      {/* Department and Hire Date */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-slate-500">Department:</span>
                          <div className="text-sm text-slate-700">{person.department}</div>
                        </div>
                        <div>
                          <span className="text-sm text-slate-500">Hire Date:</span>
                          <div className="text-sm text-slate-700">{person.hireDate}</div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPerson(person)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Edit3 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
  onSubmit: (data: Omit<SalesPerson, 'id' | 'salesPersonId' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+971',
    designation: 'Sales Representative',
    department: 'Sales',
    hireDate: new Date().toISOString().split('T')[0],
    status: 'Active' as "Active" | "Inactive",
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
          <Select value={formData.status} onValueChange={(value: "Active" | "Inactive") => setFormData(prev => ({ ...prev, status: value }))}>
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
          <Select value={formData.status} onValueChange={(value: "Active" | "Inactive") => setFormData(prev => ({ ...prev, status: value }))}>
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
