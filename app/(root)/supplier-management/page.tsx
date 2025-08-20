"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { materials as EXISTING_MATERIALS } from "@/constants";

// Remove the static import and define the interface
interface MaterialRow {
  id: string;
  materialId: string;
  name: string;
  supplier: {
    id: string;
    name: string;
    contact?: string;
    email?: string;
    phone?: string;
  };
  cost: number;
  unit: string;
  lastUpdated: string;
  status: string;
}

interface SupplierRow {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  status: string;
  materials: MaterialRow[];
}

// Fallback data structure for when API fails
const createFallbackData = () => {
  const suppliers: SupplierRow[] = [
    {
      id: "fallback-1",
      name: "Paper Source LLC",
      contact: "Contact Person",
      email: "papersourcellc@example.com",
      phone: "123456789",
      countryCode: "+971",
      country: "UAE",
      status: "Active",
      materials: []
    },
    {
      id: "fallback-2", 
      name: "Apex Papers",
      contact: "Contact Person",
      email: "apexpapers@example.com",
      phone: "123456789",
      countryCode: "+971",
      country: "UAE",
      status: "Active",
      materials: []
    }
  ];

  const materials: MaterialRow[] = [
    {
      id: "fallback-m-1",
      materialId: "M-001",
      name: "Art Paper 300gsm",
      supplier: suppliers[0],
      cost: 0.5,
      unit: "per_sheet",
      lastUpdated: "2025-08-20",
      status: "Active"
    },
    {
      id: "fallback-m-2",
      materialId: "M-002", 
      name: "Art Paper 150gsm",
      supplier: suppliers[0],
      cost: 0.18,
      unit: "per_sheet",
      lastUpdated: "2025-08-20",
      status: "Active"
    }
  ];

  // Link materials to suppliers
  suppliers[0].materials = materials;
  suppliers[1].materials = [];

  return { suppliers, materials };
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const fmtDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "2-digit",
      })
    : "—";

const unitLabel = (unit: string) => {
  switch (unit) {
    case "per_sheet": return "Per Sheet";
    case "per_packet": return "Per Packet";
    case "per_kg": return "Per KG";
    default: return unit;
  }
};

const PAGE_SIZE = 20;
type Mode = "add" | "edit";

export default function SupplierManagementPage() {
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ===== filter & paging =====
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive">("all");
  const [unitFilter, setUnitFilter] = useState<"all" | string>("all");
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);

  // modal
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("add");
  const [draft, setDraft] = useState<Partial<MaterialRow>>({
    materialId: "",
    name: "",
    supplier: { id: "", name: "" },
    cost: 0,
    unit: "per_sheet",
    lastUpdated: new Date().toISOString().slice(0, 10),
    status: "Active",
  });

  // Load data from database
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('Loading supplier and material data...');
        
        // Load suppliers
        const suppliersResponse = await fetch('/api/suppliers');
        console.log('Suppliers response status:', suppliersResponse.status);
        if (suppliersResponse.ok) {
          const suppliersData = await suppliersResponse.json();
          console.log('Suppliers data loaded:', suppliersData.length, 'suppliers');
          setSuppliers(suppliersData);
        } else {
          console.error('Failed to load suppliers:', suppliersResponse.status);
          // Fallback to static data if API fails
          const { suppliers: fallbackSuppliers, materials: fallbackMaterials } = createFallbackData();
          setSuppliers(fallbackSuppliers);
          setMaterials(fallbackMaterials);
          console.log('Using fallback suppliers and materials');
        }
        
        // Load materials
        const materialsResponse = await fetch('/api/materials');
        console.log('Materials response status:', materialsResponse.status);
        if (materialsResponse.ok) {
          const materialsData = await materialsResponse.json();
          console.log('Materials data loaded:', materialsData.length, 'materials');
          setMaterials(materialsData);
        } else {
          console.error('Failed to load materials:', materialsResponse.status);
          // Fallback to static data if API fails
          const { suppliers: fallbackSuppliers, materials: fallbackMaterials } = createFallbackData();
          setSuppliers(fallbackSuppliers);
          setMaterials(fallbackMaterials);
          console.log('Using fallback suppliers and materials');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to static data on error
        const { suppliers: fallbackSuppliers, materials: fallbackMaterials } = createFallbackData();
        setSuppliers(fallbackSuppliers);
        setMaterials(fallbackMaterials);
        console.log('Using fallback suppliers and materials due to error');
      } finally {
        setLoading(false);
        console.log('Data loading completed');
      }
    };

    loadData();
  }, []);

  // filter
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return materials.filter((r) => {
      const hitSearch =
        s === "" || 
        r.name.toLowerCase().includes(s) ||
        r.supplier.name.toLowerCase().includes(s) ||
        r.materialId.toLowerCase().includes(s);

      const hitStatus = statusFilter === "all" || r.status === statusFilter;
      const hitUnit = unitFilter === "all" || r.unit === unitFilter;

      const hitFrom = from === "" || r.lastUpdated >= from;
      const hitTo = to === "" || r.lastUpdated <= to;

      return hitSearch && hitStatus && hitUnit && hitFrom && hitTo;
    });
  }, [materials, search, from, to, statusFilter, unitFilter]);

  // pagination
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => setPage(1), [search, from, to, statusFilter, unitFilter]);
  const start = (page - 1) * PAGE_SIZE;
  const current = showAll ? filtered : filtered.slice(start, start + PAGE_SIZE);

  // helpers
  const newId = useCallback(() => {
    const n = materials.length + 1;
    return `M-${String(n).padStart(3, "0")}`;
  }, [materials.length]);

  const onAdd = () => {
    setMode("add");
    setDraft({
      materialId: newId(),
      name: "",
      supplier: { id: "", name: "" },
      cost: 0,
      unit: "per_sheet",
      lastUpdated: new Date().toISOString().slice(0, 10),
      status: "Active",
    });
    setOpen(true);
  };

  const onEdit = (material: MaterialRow) => {
    setMode("edit");
    setDraft({
      ...material,
      lastUpdated: new Date(material.lastUpdated).toISOString().slice(0, 10),
    });
    setOpen(true);
  };

  const onDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this material?")) {
      try {
        const response = await fetch(`/api/materials/${id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setMaterials(prev => prev.filter(m => m.id !== id));
        } else {
          alert('Failed to delete material');
        }
      } catch (error) {
        console.error('Error deleting material:', error);
        alert('Error deleting material');
      }
    }
  };

  const onSubmit = async () => {
    if (!draft.name || !draft.supplier?.id || draft.cost === undefined) {
      alert("Please complete all required fields.");
      return;
    }

    try {
      const materialData = {
        materialId: draft.materialId!,
        name: draft.name!,
        supplierId: draft.supplier.id,
        cost: Number(draft.cost),
        unit: draft.unit!,
        status: draft.status!,
      };

      let response;
      if (mode === "add") {
        response = await fetch('/api/materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(materialData),
        });
      } else {
        response = await fetch(`/api/materials/${draft.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(materialData),
        });
      }

      if (response.ok) {
        const newMaterial = await response.json();
        
        if (mode === "add") {
          setMaterials(prev => [...prev, newMaterial]);
        } else {
          setMaterials(prev => prev.map(m => m.id === draft.id ? newMaterial : m));
        }
        
        setOpen(false);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to save material'}`);
      }
    } catch (error) {
      console.error('Error saving material:', error);
      alert('Error saving material');
    }
  };



  return (
    <div className="space-y-12">
      {/* Welcome Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Supplier Management
        </h1>
        <p className="text-lg text-slate-600">Manage and track all your printing suppliers and materials with real-time database operations.</p>
        <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
          <span>Total Suppliers: <span className="font-semibold text-slate-700">{suppliers.length}</span></span>
          <span>Total Materials: <span className="font-semibold text-slate-700">{materials.length}</span></span>
          <span>Active Materials: <span className="font-semibold text-green-600">{materials.filter(m => m.status === "Active").length}</span></span>
        </div>
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
                placeholder="Search by material name, supplier, or ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-10 w-full"
              />
            </div>

            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 h-10" 
              onClick={onAdd}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Material
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8 border border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Updated From</label>
              <Input 
                type="date" 
                value={from} 
                onChange={(e) => setFrom(e.target.value)}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Updated To</label>
              <Input 
                type="date" 
                value={to} 
                onChange={(e) => setTo(e.target.value)}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
              />
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Unit</label>
              <Select value={unitFilter} onValueChange={(v: "all" | string) => setUnitFilter(v)}>
                <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                  <SelectValue placeholder="All Units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Units</SelectItem>
                  <SelectItem value="per_sheet">Per Sheet</SelectItem>
                  <SelectItem value="per_packet">Per Packet</SelectItem>
                  <SelectItem value="per_kg">Per KG</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Showing {current.length} of {filtered.length} materials</span>
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
                  <TableHead className="text-slate-700 font-semibold p-6">Material ID</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Material</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Supplier</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Cost</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Unit</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Last Updated</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Status</TableHead>
                  <TableHead className="text-slate-700 font-semibold p-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16 text-slate-500">
                      Loading materials...
                    </TableCell>
                  </TableRow>
                ) : current.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16 text-slate-500">
                      No materials found with current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  current.map((r) => (
                    <TableRow key={r.id} className="hover:bg-slate-50/80 transition-colors duration-200 border-slate-100">
                      <TableCell className="font-medium text-slate-900 p-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {r.materialId}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-700 p-6">{r.name}</TableCell>
                      <TableCell className="text-slate-700 p-6">{r.supplier.name}</TableCell>
                      <TableCell className="text-slate-700 p-6">{currency.format(r.cost)}</TableCell>
                      <TableCell className="text-slate-700 p-6">{unitLabel(r.unit)}</TableCell>
                      <TableCell className="text-slate-700 p-6">{fmtDate(r.lastUpdated)}</TableCell>
                      <TableCell className="p-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          r.status === "Active" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {r.status}
                        </span>
                      </TableCell>
                      <TableCell className="p-6">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onEdit(r)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onDelete(r.id)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 pb-6">
            <Button
              variant="ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-10 h-10 rounded-xl hover:bg-slate-100"
            >
              ‹
            </Button>

            {Array.from({ length: Math.min(pageCount, 5) }).map((_, i) => {
              const n = i + 1;
              if (pageCount > 5 && n === 4) {
                return (
                  <React.Fragment key="dots">
                    <span className="px-3 text-slate-500">…</span>
                    <Button
                      variant={page === pageCount ? "default" : "ghost"}
                      onClick={() => setPage(pageCount)}
                      className="w-10 h-10 rounded-xl"
                    >
                      {pageCount}
                    </Button>
                  </React.Fragment>
                );
              }
              if (pageCount > 5 && n > 3) return null;
              return (
                <Button
                  key={n}
                  variant={page === n ? "default" : "ghost"}
                  onClick={() => setPage(n)}
                  className="w-10 h-10 rounded-xl"
                >
                  {n}
                </Button>
              );
            })}

            <Button
              variant="ghost"
              disabled={page >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="w-10 h-10 rounded-xl hover:bg-slate-100"
            >
              ›
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ===== Modal Add/Edit Material ===== */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {mode === "add" ? "Add New Material" : "Edit Material"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="materialId" className="text-sm font-medium text-slate-700">Material ID</Label>
                <Input
                  id="materialId"
                  placeholder="e.g. ART-001"
                  value={draft.materialId}
                  onChange={(e) => setDraft({ ...draft, materialId: e.target.value })}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  disabled={mode === "edit"}
                />
              </div>
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-slate-700">Material Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Art Paper 300gsm"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="supplier" className="text-sm font-medium text-slate-700">Supplier</Label>
                                 <Select value={draft.supplier?.id} onValueChange={(v: string) => {
                   const selectedSupplier = suppliers.find(s => s.id === v);
                   setDraft({ ...draft, supplier: { id: v, name: selectedSupplier?.name || '' } });
                 }}>
                  <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cost" className="text-sm font-medium text-slate-700">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={draft.cost}
                  onChange={(e) => setDraft({ ...draft, cost: Number(e.target.value) })}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="unit" className="text-sm font-medium text-slate-700">Unit</Label>
                <Select value={draft.unit} onValueChange={(v: string) => setDraft({ ...draft, unit: v })}>
                  <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_sheet">Per Sheet</SelectItem>
                    <SelectItem value="per_packet">Per Packet</SelectItem>
                    <SelectItem value="per_kg">Per KG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="lastUpdated" className="text-sm font-medium text-slate-700">Last Updated</Label>
                <Input
                  id="lastUpdated"
                  type="date"
                  value={draft.lastUpdated}
                  onChange={(e) => setDraft({ ...draft, lastUpdated: e.target.value })}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="status" className="text-sm font-medium text-slate-700">Status</Label>
                <Select value={draft.status} onValueChange={(v: "Active" | "Inactive") => setDraft({ ...draft, status: v })}>
                  <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setOpen(false)}
              className="border-slate-300 hover:border-slate-400 hover:bg-slate-50 px-6 py-2 rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              onClick={onSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl"
            >
              {mode === "add" ? "Add Material" : "Update Material"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
