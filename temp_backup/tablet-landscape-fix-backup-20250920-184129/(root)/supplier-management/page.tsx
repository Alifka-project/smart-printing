"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  gsm?: string;
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
      name: "Art Paper",
      gsm: "300",
      supplier: suppliers[0],
      cost: 0.5,
      unit: "per_sheet",
      lastUpdated: "2025-08-20",
      status: "Active"
    },
    {
      id: "fallback-m-2",
      materialId: "M-002", 
      name: "Art Paper",
      gsm: "150",
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

const currency = new Intl.NumberFormat("en-AE", { 
  style: "currency", 
  currency: "AED",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
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

// Component that uses useSearchParams - must be wrapped in Suspense
function SupplierManagementContent() {
  const searchParams = useSearchParams();
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
  
  // Handle search params for material highlighting
  const [highlightedMaterialId, setHighlightedMaterialId] = useState<string | null>(null);
  const highlightedMaterialRef = useRef<HTMLTableRowElement>(null);

  // modal
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("add");
  const [draft, setDraft] = useState<Partial<MaterialRow>>({
    materialId: "",
    name: "",
    gsm: "",
    supplier: { id: "", name: "" },
    cost: 0,
    unit: "per_sheet",
    lastUpdated: new Date().toISOString().slice(0, 10),
    status: "Active",
  });

  // Handle URL parameters for material highlighting
  useEffect(() => {
    const materialId = searchParams.get('materialId');
    if (materialId) {
      setHighlightedMaterialId(materialId);
      // Clear the highlight after 5 seconds
      setTimeout(() => setHighlightedMaterialId(null), 5000);
      
      // Scroll to the highlighted material after a short delay to ensure it's rendered
      setTimeout(() => {
        if (highlightedMaterialRef.current) {
          highlightedMaterialRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
    }
  }, [searchParams]);

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



  const onSubmit = async () => {
    if (!draft.name || !draft.supplier?.id || draft.cost === undefined) {
      alert("Please complete all required fields.");
      return;
    }

    try {
      const materialData = {
        materialId: draft.materialId!,
        name: draft.name!,
        gsm: draft.gsm || undefined,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#27aae1] to-[#ea078b] bg-clip-text text-transparent">
            Supplier Management
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">
            Manage your suppliers and materials. Track costs, monitor inventory, and optimize your supply chain.
          </p>
        </div>

        {/* Search and Add Supplier */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search suppliers or materials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl h-12 text-base"
            />
          </div>
          <Button
            onClick={() => setOpen(true)}
            className="bg-[#27aae1] hover:bg-[#1e8bc3] text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 h-12 w-full sm:w-auto"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Material
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Updated From</label>
            <Input 
              type="date" 
              value={from} 
              onChange={(e) => setFrom(e.target.value)}
              className="w-full border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl h-10 text-base"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Updated To</label>
            <Input 
              type="date" 
              value={to} 
              onChange={(e) => setTo(e.target.value)}
              className="w-full border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl h-10 text-base"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <Select value={statusFilter} onValueChange={(v: "all" | "Active" | "Inactive") => setStatusFilter(v)}>
              <SelectTrigger className="w-full border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl h-10">
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
              <SelectTrigger className="w-full border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl h-10">
                <SelectValue placeholder="All Units" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Units</SelectItem>
                <SelectItem value="per_sheet">Per Sheet</SelectItem>
                <SelectItem value="per_packet">Per Packet</SelectItem>
                <SelectItem value="per_kg">Per KG</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-slate-600">
          <span>Showing {current.length} of {filtered.length} materials</span>
          {filtered.length > PAGE_SIZE && (
            <Button
              variant="ghost"
              onClick={() => setShowAll(!showAll)}
              className="text-[#f89d1d] hover:text-[#e88a0a] hover:bg-[#f89d1d]/10 rounded-xl px-4 py-2 transition-all duration-200"
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

        {/* Search Result Highlight Banner */}
        {highlightedMaterialId && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-800">🔍</span>
              <span className="text-yellow-800 font-medium">
                Material found from search! The highlighted row will automatically scroll into view.
              </span>
              <button
                onClick={() => setHighlightedMaterialId(null)}
                className="ml-auto text-yellow-600 hover:text-yellow-800 text-sm underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Desktop Table - Completely Fixed Width */}
        <div className="hidden lg:block tablet-landscape-show border border-slate-200 rounded-2xl overflow-x-auto">
          <Table className="w-full table-fixed lg:min-w-[900px]" style={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-200">
                <TableHead className="text-slate-700 font-semibold p-4 w-24">Material ID</TableHead>
                <TableHead className="text-slate-700 font-semibold p-4 w-40">Material</TableHead>
                <TableHead className="text-slate-700 font-semibold p-4 w-20">GSM</TableHead>
                <TableHead className="text-slate-700 font-semibold p-4 w-36">Supplier</TableHead>
                <TableHead className="text-slate-700 font-semibold p-4 w-24">Cost</TableHead>
                <TableHead className="text-slate-700 font-semibold p-4 w-20">Unit</TableHead>
                <TableHead className="text-slate-700 font-semibold p-4 w-28">Last Updated</TableHead>
                <TableHead className="text-slate-700 font-semibold p-4 w-24">Status</TableHead>
                <TableHead className="text-slate-700 font-semibold p-4 w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-16 text-slate-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span>Loading materials...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : current.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-16 text-slate-500">
                    No materials found with current filters.
                  </TableCell>
                </TableRow>
              ) : (
                current.map((r) => (
                  <TableRow 
                    key={r.id} 
                    ref={(highlightedMaterialId === r.id || highlightedMaterialId === r.materialId) ? highlightedMaterialRef : null}
                    className={`hover:bg-slate-50 transition-colors duration-200 border-slate-100 ${
                      highlightedMaterialId === r.id || highlightedMaterialId === r.materialId 
                        ? 'bg-yellow-50 border-yellow-200 shadow-md' 
                        : ''
                    }`}
                  >
                    <TableCell className="font-medium text-slate-900 p-4 w-24">
                      <div className="truncate">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            {r.materialId}
                          </span>
                          {(highlightedMaterialId === r.id || highlightedMaterialId === r.materialId) && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 animate-pulse">
                              🔍 Found
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-700 p-4 w-40 wrap-text">
                      <div>{r.name}</div>
                    </TableCell>
                    <TableCell className="text-slate-700 p-4 w-20">
                      <div>
                        {r.gsm ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#27aae1]/20 text-[#27aae1] whitespace-nowrap">
                            {r.gsm} gsm
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-700 p-4 w-36 wrap-text">
                      <div>{r.supplier.name}</div>
                    </TableCell>
                    <TableCell className="text-slate-700 p-4 w-24">
                      <div>{currency.format(r.cost)}</div>
                    </TableCell>
                    <TableCell className="text-slate-700 p-4 w-20">
                      <div>{unitLabel(r.unit)}</div>
                    </TableCell>
                    <TableCell className="text-slate-700 p-4 w-28">
                      <div>{fmtDate(r.lastUpdated)}</div>
                    </TableCell>
                    <TableCell className="p-4 w-24">
                      <div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          r.status === "Active" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {r.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="p-4 w-28">
                      <div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit Material"
                            onClick={() => onEdit(r)}
                            className="w-8 h-8 hover:bg-[#f89d1d]/10 hover:text-[#f89d1d] transition-colors duration-200"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
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

        {/* Mobile Cards */}
        <div className="lg:hidden tablet-landscape-hide space-y-4 p-4">
          {loading ? (
            <div className="text-center py-16 text-slate-500">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span>Loading materials...</span>
              </div>
            </div>
          ) : current.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              No materials found with current filters.
            </div>
          ) : (
            current.map((r) => (
              <Card key={r.id} className="p-4 border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  {/* Header with Material ID and Status */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-medium text-slate-900 bg-green-100 text-green-800 px-3 py-1.5 rounded-lg">
                      {r.materialId}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      r.status === "Active" 
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-red-100 text-red-700 border border-red-200"
                    }`}>
                      {r.status}
                    </span>
                  </div>
                  
                  {/* Material Info */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Material</div>
                    <div className="font-semibold text-slate-900 text-base">{r.name}</div>
                    {r.gsm && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {r.gsm} gsm
                      </span>
                    )}
                  </div>
                  
                  {/* Supplier and Cost */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Supplier</div>
                      <div className="font-medium text-slate-900">{r.supplier.name}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cost</div>
                      <div className="font-semibold text-slate-900 text-lg">{currency.format(r.cost)}</div>
                    </div>
                  </div>
                  
                  {/* Unit and Last Updated */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Unit</div>
                      <div className="font-medium text-slate-900">{unitLabel(r.unit)}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Last Updated</div>
                      <div className="font-medium text-slate-900">{fmtDate(r.lastUpdated)}</div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center justify-center pt-4 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(r)}
                      className="w-full sm:w-auto text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Material
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* ===== Modal Add/Edit Material ===== */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px] md:max-w-[600px] rounded-2xl">
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
                  className="border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl"
                  disabled={mode === "edit"}
                />
              </div>
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-slate-700">Material Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Art Paper"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="gsm" className="text-sm font-medium text-slate-700">GSM (Paper Weight)</Label>
                <Input
                  id="gsm"
                  placeholder="e.g. 300, 150, 80"
                  value={draft.gsm || ""}
                  onChange={(e) => setDraft({ ...draft, gsm: e.target.value })}
                  className="border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl"
                />
                <p className="text-xs text-slate-500 mt-1">Leave empty for non-paper materials</p>
              </div>
              <div>
                <Label htmlFor="supplier" className="text-sm font-medium text-slate-700">Supplier</Label>
                                 <Select value={draft.supplier?.id} onValueChange={(v: string) => {
                   const selectedSupplier = suppliers.find(s => s.id === v);
                   setDraft({ ...draft, supplier: { id: v, name: selectedSupplier?.name || '' } });
                 }}>
                  <SelectTrigger className="border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl">
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
                  className="border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="unit" className="text-sm font-medium text-slate-700">Unit</Label>
                <Select value={draft.unit} onValueChange={(v: string) => setDraft({ ...draft, unit: v })}>
                  <SelectTrigger className="border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl">
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
                  className="border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="status" className="text-sm font-medium text-slate-700">Status</Label>
                <Select value={draft.status} onValueChange={(v: "Active" | "Inactive") => setDraft({ ...draft, status: v })}>
                  <SelectTrigger className="border-slate-300 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl">
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
              className="bg-[#27aae1] hover:bg-[#1e8bc3] text-white px-6 py-2 rounded-xl"
            >
              {mode === "add" ? "Add Material" : "Update Material"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Main wrapper component with Suspense boundary
export default function SupplierManagementPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f89d1d] mx-auto"></div>
          <p className="text-slate-600">Loading supplier management...</p>
        </div>
      </div>
    }>
      <SupplierManagementContent />
    </Suspense>
  );
}
