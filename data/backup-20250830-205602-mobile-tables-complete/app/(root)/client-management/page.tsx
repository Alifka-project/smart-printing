"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Eye, Pencil, Calendar, DollarSign, Copy, ChevronDown, ChevronUp, Search, User, Building, CheckCircle } from "lucide-react";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ClientRow } from "@/constants";

// Function to convert client ID to readable format (e.g., "CL001")
const getClientDisplayId = (id: string): string => {
  if (!id) return 'CL000';
  
  // If ID is already in CL format, return as is
  if (id.startsWith('CL')) return id;
  
  // For CUID format IDs, create a consistent display ID
  if (id.length > 20) { // CUID format
    // Create a simple hash from the CUID to generate a consistent number
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Use absolute value and modulo to get a number between 1-999
    const numericPart = Math.abs(hash) % 999 + 1;
    return `CL${String(numericPart).padStart(3, '0')}`;
  }
  
  // For other numeric IDs, convert to CL format
  const numericPart = id.replace(/\D/g, '');
  if (numericPart) {
    const paddedNumber = numericPart.padStart(3, '0');
    return `CL${paddedNumber}`;
  }
  
  // Fallback
  return 'CL000';
};

// UAE Areas data for Area dropdown
const UAE_AREAS = [
  // Dubai Areas
  { name: 'Al Barsha', state: 'Dubai', country: 'UAE' },
  { name: 'Al Garhoud', state: 'Dubai', country: 'UAE' },
  { name: 'Al Jaddaf', state: 'Dubai', country: 'UAE' },
  { name: 'Al Karama', state: 'Dubai', country: 'UAE' },
  { name: 'Al Maktoum', state: 'Dubai', country: 'UAE' },
  { name: 'Al Qusais', state: 'Dubai', country: 'UAE' },
  { name: 'Al Rashidiya', state: 'Dubai', country: 'UAE' },
  { name: 'Al Satwa', state: 'Dubai', country: 'UAE' },
  { name: 'Al Sufouh', state: 'Dubai', country: 'UAE' },
  { name: 'Al Twar', state: 'Dubai', country: 'UAE' },
  { name: 'Al Warqa', state: 'Dubai', country: 'UAE' },
  { name: 'Arabian Ranches', state: 'Dubai', country: 'UAE' },
  { name: 'Business Bay', state: 'Dubai', country: 'UAE' },
  { name: 'Deira', state: 'Dubai', country: 'UAE' },
  { name: 'Discovery Gardens', state: 'Dubai', country: 'UAE' },
  { name: 'Downtown Dubai', state: 'Dubai', country: 'UAE' },
  { name: 'Dubai Marina', state: 'Dubai', country: 'UAE' },
  { name: 'Dubai Silicon Oasis', state: 'Dubai', country: 'UAE' },
  { name: 'Emirates Hills', state: 'Dubai', country: 'UAE' },
  { name: 'Green Community', state: 'Dubai', country: 'UAE' },
  { name: 'International City', state: 'Dubai', country: 'UAE' },
  { name: 'Jebel Ali', state: 'Dubai', country: 'UAE' },
  { name: 'Jumeirah', state: 'Dubai', country: 'UAE' },
  { name: 'Jumeirah Beach Residence', state: 'Dubai', country: 'UAE' },
  { name: 'Jumeirah Golf Estates', state: 'Dubai', country: 'UAE' },
  { name: 'Jumeirah Islands', state: 'Dubai', country: 'UAE' },
  { name: 'Jumeirah Lakes Towers', state: 'Dubai', country: 'UAE' },
  { name: 'Jumeirah Park', state: 'Dubai', country: 'UAE' },
  { name: 'Meadows', state: 'Dubai', country: 'UAE' },
  { name: 'Mirdif', state: 'Dubai', country: 'UAE' },
  { name: 'Motor City', state: 'Dubai', country: 'UAE' },
  { name: 'Mudon', state: 'Dubai', country: 'UAE' },
  { name: 'Palm Jumeirah', state: 'Dubai', country: 'UAE' },
  { name: 'Palm Jebel Ali', state: 'Dubai', country: 'UAE' },
  { name: 'Palm Deira', state: 'Dubai', country: 'UAE' },
  { name: 'Remraam', state: 'Dubai', country: 'UAE' },
  { name: 'Sheikh Zayed Road', state: 'Dubai', country: 'UAE' },
  { name: 'Sports City', state: 'Dubai', country: 'UAE' },
  { name: 'Springs', state: 'Dubai', country: 'UAE' },
  { name: 'Tecom', state: 'Dubai', country: 'UAE' },
  { name: 'The Greens', state: 'Dubai', country: 'UAE' },
  { name: 'The Lakes', state: 'Dubai', country: 'UAE' },
  { name: 'The Meadows', state: 'Dubai', country: 'UAE' },
  { name: 'The Springs', state: 'Dubai', country: 'UAE' },
  { name: 'The Villa', state: 'Dubai', country: 'UAE' },
  { name: 'Umm Al Sheif', state: 'Dubai', country: 'UAE' },
  { name: 'Umm Suqeim', state: 'Dubai', country: 'UAE' },
  { name: 'Warsan', state: 'Dubai', country: 'UAE' },
  // Abu Dhabi Areas
  { name: 'Al Ain', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Bateen', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Danah', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Dhafra', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Falah', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Karamah', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Khalidiyah', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Maqtaa', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Maryah Island', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Mina', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Mushrif', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Nahyan', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Raha', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Raha Beach', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Reef', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Reem Island', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Saadiyat Island', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Al Wahda', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Baniyas', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Corniche', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Khalifa City', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Masdar City', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Mohammed Bin Zayed City', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Saadiyat Island', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Shakhbout City', state: 'Abu Dhabi', country: 'UAE' },
  { name: 'Yas Island', state: 'Abu Dhabi', country: 'UAE' },
  // Sharjah Areas
  { name: 'Al Majaz', state: 'Sharjah', country: 'UAE' },
  { name: 'Al Nahda', state: 'Sharjah', country: 'UAE' },
  { name: 'Al Qasba', state: 'Sharjah', country: 'UAE' },
  { name: 'Al Taawun', state: 'Sharjah', country: 'UAE' },
  { name: 'Al Zahia', state: 'Sharjah', country: 'UAE' },
  { name: 'Muwailih', state: 'Sharjah', country: 'UAE' },
  { name: 'Sharjah Industrial Area', state: 'Sharjah', country: 'UAE' },
  // Ajman Areas
  { name: 'Ajman City', state: 'Ajman', country: 'UAE' },
  { name: 'Ajman Industrial Area', state: 'Ajman', country: 'UAE' },
  { name: 'Al Nuaimiya', state: 'Ajman', country: 'UAE' },
  { name: 'Al Rashidiya', state: 'Ajman', country: 'UAE' },
  { name: 'Al Zahra', state: 'Ajman', country: 'UAE' },
  // Umm Al Quwain Areas
  { name: 'Umm Al Quwain City', state: 'Umm Al Quwain', country: 'UAE' },
  { name: 'Umm Al Quwain Industrial Area', state: 'Umm Al Quwain', country: 'UAE' },
  // Ras Al Khaimah Areas
  { name: 'Al Dhait', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Al Hamra', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Al Jazeera Al Hamra', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Al Marjan Island', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Al Nakheel', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Al Qusaidat', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Al Rams', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Al Sall', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Al Uraibi', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Dafan Al Khor', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Digdaga', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Gulf Medical University', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Julphar', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Khatt', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Mina Al Arab', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Ras Al Khaimah City', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Ras Al Khaimah Industrial Area', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Shamal', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Shamal Haql', state: 'Ras Al Khaimah', country: 'UAE' },
  { name: 'Wadi Ammar', state: 'Ras Al Khaimah', country: 'UAE' },
  // Fujairah Areas
  { name: 'Al Aqah', state: 'Fujairah', country: 'UAE' },
  { name: 'Al Badiyah', state: 'Fujairah', country: 'UAE' },
  { name: 'Al Bithnah', state: 'Fujairah', country: 'UAE' },
  { name: 'Al Faseel', state: 'Fujairah', country: 'UAE' },
  { name: 'Al Gurfa', state: 'Fujairah', country: 'UAE' },
  { name: 'Al Hail', state: 'Fujairah', country: 'UAE' },
  { name: 'Al Hefaiyah', state: 'Fujairah', country: 'UAE' },
  { name: 'Al Madhab', state: 'Fujairah', country: 'UAE' },
  { name: 'Al Oud', state: 'Fujairah', country: 'UAE' },
  { name: 'Al Qurayyah', state: 'Fujairah', country: 'UAE' },
  { name: 'Al Siji', state: 'Fujairah', country: 'UAE' },
  { name: 'Al Suwayfah', state: 'Fujairah', country: 'UAE' },
  { name: 'Al Taween', state: 'Fujairah', country: 'UAE' },
  { name: 'Al Wurayah', state: 'Fujairah', country: 'UAE' },
  { name: 'Dibba Al Fujairah', state: 'Fujairah', country: 'UAE' },
  { name: 'Fujairah City', state: 'Fujairah', country: 'UAE' },
  { name: 'Fujairah Industrial Area', state: 'Fujairah', country: 'UAE' }
];

const PAGE_SIZE = 20;

type Mode = "add" | "edit";

export default function ClientManagementPage() {
  // data lokal (mulai dari dummy)
  const [rows, setRows] = React.useState<any[]>([]);
  const [quotes, setQuotes] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Load clients from database on page load
  React.useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);
        // Fetch clients from database
        const response = await fetch('/api/clients');
        if (response.ok) {
          const clientsData = await response.json();
          console.log('Loaded clients from database:', clientsData.length);
          console.log('Sample client data:', clientsData[0]);
          console.log('Sample client address fields:', {
            address: clientsData[0]?.address,
            city: clientsData[0]?.city,
            state: clientsData[0]?.state,
            postalCode: clientsData[0]?.postalCode,
            country: clientsData[0]?.country
          });
          
          // Check if address fields are present
          const hasAddressFields = clientsData[0] && (
            clientsData[0].address !== undefined || 
            clientsData[0].city !== undefined || 
            clientsData[0].state !== undefined || 
            clientsData[0].postalCode !== undefined || 
            clientsData[0].country !== undefined
          );
          console.log('Address fields present:', hasAddressFields);
          
          setRows(clientsData);
        } else {
          console.error('Failed to load clients from database');
          setRows([]);
        }
        
        // Load quotes for these clients
        try {
          const quotesResponse = await fetch('/api/quotes');
          if (quotesResponse.ok) {
            const quotesData = await quotesResponse.json();
            setQuotes(quotesData);
            console.log('Loaded quotes:', quotesData.length);
          }
        } catch (error) {
          console.error('Error loading quotes:', error);
        }
        
        setLoading(false);
              } catch (error) {
          console.error('Error loading clients:', error);
          setRows([]);
          setLoading(false);
        }
    };

    loadClients();
  }, []);
  
  // ===== filter & paging =====
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "Active" | "Inactive">("all");
  const [clientTypeFilter, setClientTypeFilter] = React.useState<"all" | "Individual" | "Company">("all");
  const [areaFilter, setAreaFilter] = React.useState("all");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [showAll, setShowAll] = React.useState(false);

  // modal state
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>("add");
  const [emails, setEmails] = React.useState<string[]>([""]);
  const [hasNoTrn, setHasNoTrn] = React.useState(0);
  const [draft, setDraft] = React.useState<any>({
    id: "",
    clientType: "Company",
    companyName: "",
    contactPerson: "",
    firstName: "",
    lastName: "",
    designation: "",
    email: "",
    emails: JSON.stringify([""]),
    phone: "",
    countryCode: "+971",
    role: "",
    trn: "",
          hasNoTrn: 0,
    address: "",
    city: "",
    area: "",
    state: "Dubai",
    postalCode: "",
    country: "UAE",
    additionalInfo: "",
    status: "Active",
  });

  // filtering
  const filtered = React.useMemo(() => {
    const s = search.trim().toLowerCase();
    console.log('🔍 Client Search:', { search: s, totalRows: rows.length });
    
    return rows.filter((r) => {
      const hitSearch =
        s === "" || 
        (r.companyName && r.companyName.toLowerCase().includes(s)) ||
        (r.contactPerson && r.contactPerson.toLowerCase().includes(s)) ||
        (r.email && r.email.toLowerCase().includes(s)) ||
        (r.id && r.id.toLowerCase().includes(s)) ||
        (r.firstName && r.firstName.toLowerCase().includes(s)) ||
        (r.lastName && r.lastName.toLowerCase().includes(s));

      const hitStatus = statusFilter === "all" || r.status === statusFilter;
      const hitClientType = clientTypeFilter === "all" || r.clientType === clientTypeFilter;

      const matches = hitSearch && hitStatus && hitClientType;
      
      if (s !== "" && !hitSearch) {
        console.log('❌ Client did not match search:', {
          name: r.companyName || `${r.firstName} ${r.lastName}`,
          search: s,
          companyName: r.companyName,
          contactPerson: r.contactPerson,
          email: r.email,
          id: r.id
        });
      }

      return matches;
    });
  }, [rows, search, statusFilter, clientTypeFilter]);

  // pagination
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const current = showAll ? filtered : filtered.slice(start, start + PAGE_SIZE);
  
  React.useEffect(() => setPage(1), [search, statusFilter, clientTypeFilter]); // reset page saat search berubah



  // helpers
  const newId = React.useCallback(() => {
    const n = rows.length + 1;
    return `C-${String(n).padStart(3, "0")}`;
  }, [rows.length]);

  // Get filtered areas based on selected state
  const getFilteredAreas = React.useCallback(() => {
    if (draft.state) {
      return UAE_AREAS.filter(area => area.state === draft.state);
    }
    // Default to Dubai areas if no state selected
    return UAE_AREAS.filter(area => area.state === 'Dubai');
  }, [draft.state]);

  // Email management functions
  const addEmail = () => {
    setEmails([...emails, ""]);
  };

  const removeEmail = (index: number) => {
    if (emails.length > 1) {
      setEmails(emails.filter((_, i) => i !== index));
    }
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  // open Add
  const onAdd = () => {
    setMode("add");
    setEmails([""]);
    setHasNoTrn(0);
    setDraft({
      id: newId(),
      clientType: "Company",
      companyName: "",
      contactPerson: "",
      firstName: "",
      lastName: "",
      designation: "",
      email: "",
      emails: JSON.stringify([""]),
      phone: "",
      countryCode: "+971",
      role: "",
      trn: "",
      hasNoTrn: 0,
      address: "",
      city: "",
      area: "",
      state: "Dubai",
      postalCode: "",
      country: "UAE",
      additionalInfo: "",
      status: "Active",
    });
    setOpen(true);
  };

  // open Edit
  const onEdit = (r: any) => {
    console.log('Editing client:', r); // Debug log
    console.log('Client address fields:', {
      address: r.address,
      city: r.city,
      area: r.area,
      state: r.state,
      postalCode: r.postalCode,
      country: r.country
    });
    console.log('Client data type check:', {
      addressType: typeof r.address,
      cityType: typeof r.city,
      areaType: typeof r.area,
      stateType: typeof r.state,
      postalCodeType: typeof r.postalCode,
      countryType: typeof r.country
    });
    setMode("edit");
    
    // Initialize emails and hasNoTrn from the client data
    if (r.emails) {
      try {
        const parsedEmails = JSON.parse(r.emails);
        setEmails(Array.isArray(parsedEmails) ? parsedEmails : [r.email || ""]);
      } catch (error) {
        setEmails([r.email || ""]);
      }
    } else {
      setEmails([r.email || ""]);
    }
    
    setHasNoTrn(r.hasNoTrn || 0);
    
    // Use the actual saved data from the database, don't auto-fill
    const draftData = {
      ...r,
      clientType: r.clientType || "Company",
      firstName: r.firstName || "",
      lastName: r.lastName || "",
      designation: r.designation || "",
      countryCode: r.countryCode || "+971",
      role: r.role || "",
      trn: r.trn || "",
      hasNoTrn: r.hasNoTrn || 0,
      address: r.address || "",
      city: r.city || "",
      area: r.area || "",
      state: r.state || "Dubai",
      postalCode: r.postalCode || "",
      country: r.country || "UAE",
      additionalInfo: r.additionalInfo || "",
    };
    console.log('Setting draft to:', draftData); // Debug log
    setDraft(draftData);
    setOpen(true);
  };

  // open View
  const onView = (r: any) => {
    console.log('Viewing client:', r);
    // For now, just open the edit modal in view mode
    // You can create a separate view modal later if needed
    setMode("edit");
    setDraft(r);
    setOpen(true);
  };

  // submit modal
  const onSubmit = async () => {
    // Validation based on client type
    if (draft.clientType === "Company") {
      if (!draft.companyName || !draft.contactPerson || !draft.email || !draft.role) {
        return alert("Please fill Company Name, Contact Person, Email, and Role for Company clients.");
      }
    } else {
      if (!draft.firstName || !draft.lastName || !draft.email) {
        return alert("Please fill First Name, Last Name, and Email for Individual clients.");
      }
    }

    // TRN validation - required unless "No TRN" is selected
    if (hasNoTrn !== 1 && !draft.trn?.trim()) {
      return alert("Please enter TRN or select 'No TRN' option.");
    }

    // Area validation - required for delivery
    if (!draft.area?.trim()) {
      return alert("Please select an Area for delivery purposes.");
    }

    // Email validation - at least one email is required
    const validEmails = emails.filter(email => email.trim() !== "");
    if (validEmails.length === 0) {
      return alert("Please enter at least one email address.");
    }

    try {
      if (mode === "add") {
        // Prepare client data for API
        const clientData = {
          clientType: draft.clientType,
          companyName: draft.clientType === "Company" ? draft.companyName : "",
          firstName: draft.firstName || "",
          lastName: draft.lastName || "",
          designation: draft.designation || "",
          contactPerson: draft.contactPerson,
          email: draft.email,
          emails: JSON.stringify(emails.filter(email => email.trim() !== "")),
          phone: draft.phone,
          countryCode: draft.countryCode,
          role: draft.role || "",
          trn: hasNoTrn === 1 ? "" : draft.trn || "",
          hasNoTrn: hasNoTrn,
          address: draft.address || "",
          city: draft.city || "",
          area: draft.area || "",
          state: draft.state || "Dubai",
          postalCode: draft.postalCode || "",
          country: draft.country || "UAE",
        };

        // Save to database
        const response = await fetch('/api/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(clientData),
        });

        if (!response.ok) {
          throw new Error('Failed to create client');
        }

        const newClient = await response.json();
        
        // Add to local state for immediate UI update
        const newClientRow: ClientRow = {
          ...draft,
          id: newClient.id,
          displayId: newId(), // Use the formatted display ID
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setRows((prev) => [newClientRow, ...prev]);
      } else {
        // Update existing client - use the database ID, not the display ID
        const databaseId = draft.id; // This should be the database ID
        
        const response = await fetch(`/api/clients/${databaseId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientType: draft.clientType,
            companyName: draft.companyName,
            firstName: draft.firstName || "",
            lastName: draft.lastName || "",
            designation: draft.designation || "",
            contactPerson: draft.contactPerson,
            email: draft.email,
            emails: JSON.stringify(emails.filter(email => email.trim() !== "")),
            phone: draft.phone,
            countryCode: draft.countryCode,
            role: draft.role,
            trn: hasNoTrn === 1 ? "" : draft.trn || "",
            hasNoTrn: hasNoTrn,
            address: draft.address || "",
            city: draft.city || "",
            area: draft.area || "",
            state: draft.state || "Dubai",
            postalCode: draft.postalCode || "",
            country: draft.country || "UAE",
            // Don't send displayId, createdAt, updatedAt to the API
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Update client failed:', errorData);
          throw new Error(errorData.details || errorData.error || 'Failed to update client');
        }

        // Update local state
        setRows((prev) =>
          prev.map((r) => (r.id === databaseId ? { ...draft } : r))
        );
      }
      
      setOpen(false);
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Error saving client. Please try again.');
    }
  };

  // Update contact person when firstName/lastName or companyName changes
  const updateContactPerson = (field: keyof ClientRow, value: string) => {
    const newDraft = { ...draft, [field]: value };
    
    if (field === 'firstName' || field === 'lastName') {
      newDraft.contactPerson = `${newDraft.firstName || ''} ${newDraft.lastName || ''}`.trim();
    } else if (field === 'companyName') {
      newDraft.contactPerson = value;
    }
    
    setDraft(newDraft);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#27aae1] to-[#ea078b] bg-clip-text text-transparent">
            Client Management
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">
            Manage your client database. Add new clients, update information, and track client relationships.
          </p>
        </div>

        {/* Search and Add Client */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Search by company name, contact person, email, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl h-12 text-base"
              />
            </div>
          </div>
          <Button
            onClick={() => setOpen(true)}
            className="bg-[#27aae1] hover:bg-[#1e8bc3] text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 h-12 w-full sm:w-auto"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Client
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Client Type</label>
            <Select value={clientTypeFilter} onValueChange={setClientTypeFilter}>
              <SelectTrigger className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl h-10">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Individual">Individual</SelectItem>
                <SelectItem value="Company">Company</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl h-10">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Area</label>
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl h-10">
                <SelectValue placeholder="All Areas" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Areas</SelectItem>
                {UAE_AREAS.map((area) => (
                  <SelectItem key={`${area.state}-${area.name}`} value={area.name}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Role</label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl h-10">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Customer">Customer</SelectItem>
                <SelectItem value="Supplier">Supplier</SelectItem>
                <SelectItem value="Partner">Partner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-slate-600">
          <span>Showing {current.length} of {filtered.length} clients</span>
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

        {/* Client Summary */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-3 h-3 bg-[#27aae1] rounded-full mx-auto mb-2"></div>
              <div className="text-sm text-slate-600">Total Clients</div>
              <div className="text-lg font-bold text-slate-900">{filtered.length}</div>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <div className="text-sm text-slate-600">Active</div>
              <div className="text-lg font-bold text-slate-900">{filtered.filter(c => c.status === "Active").length}</div>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-[#ea078b] rounded-full mx-auto mb-2"></div>
              <div className="text-sm text-slate-600">Companies</div>
              <div className="text-lg font-bold text-slate-900">{filtered.filter(c => c.clientType === "Company").length}</div>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mx-auto mb-2"></div>
              <div className="text-sm text-slate-600">Individuals</div>
              <div className="text-lg font-bold text-slate-900">{filtered.filter(c => c.clientType === "Individual").length}</div>
            </div>
          </div>
        </div>

        {/* Clients Table - Mobile Responsive */}
        <Card className="shadow-xl border-0 bg-white">
          <CardContent className="p-0">
            {/* Desktop Table */}
                          <div className="block overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-slate-200">
                    <TableHead className="text-slate-700 font-semibold p-4 w-28">Client ID</TableHead>
                    <TableHead className="text-slate-700 font-semibold p-4 w-24">Type</TableHead>
                    <TableHead className="text-slate-700 font-semibold p-4 w-40">Company Name</TableHead>
                    <TableHead className="text-slate-700 font-semibold p-4 w-36">Contact Person</TableHead>
                    <TableHead className="text-slate-700 font-semibold p-4 w-40">Email</TableHead>
                    <TableHead className="text-slate-700 font-semibold p-4 w-32">Phone</TableHead>
                    <TableHead className="text-slate-700 font-semibold p-4 w-28">Quotes</TableHead>
                    <TableHead className="text-slate-700 font-semibold p-4 w-24">Status</TableHead>
                    <TableHead className="text-slate-700 font-semibold p-4 w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-16 text-slate-500">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span>Loading clients...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : current.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-16 text-slate-500">
                        {filtered.length === 0 ? "No clients found matching your filters." : "No clients to display."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    current.map((client) => {
                      // Calculate quote count for this client
                      const clientQuotes = quotes.filter(q => q.clientId === client.id);
                      const quoteCount = clientQuotes.length;
                      
                      return (
                        <TableRow key={client.id} className="hover:bg-slate-50 transition-colors duration-200 border-slate-100">
                          <TableCell className="p-4">
                            <span className="font-mono text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">
                              {getClientDisplayId(client.id)}
                            </span>
                          </TableCell>
                          <TableCell className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              client.clientType === "Company" 
                                ? "bg-[#27aae1]/20 text-[#27aae1] border-[#27aae1]/30"
                                : "bg-[#ea078b]/20 text-[#ea078b] border-[#ea078b]/30"
                            }`}>
                              {client.clientType}
                            </span>
                          </TableCell>
                          <TableCell className="p-4">
                            <div className="font-medium text-slate-900">
                              {client.clientType === "Company" ? client.companyName : `${client.firstName} ${client.lastName}`}
                            </div>
                          </TableCell>
                          <TableCell className="p-4">
                            <div className="text-sm text-slate-900">{client.contactPerson || client.role || 'N/A'}</div>
                          </TableCell>
                          <TableCell className="p-4">
                            <div className="text-sm text-slate-900">{client.email}</div>
                          </TableCell>
                          <TableCell className="p-4">
                            <div className="text-sm text-slate-900">{client.phone}</div>
                          </TableCell>
                          <TableCell className="p-4">
                            <div className="text-center">
                              {quoteCount > 0 ? (
                                <Link 
                                  href={`/quote-management?clientId=${client.id}`}
                                  className="group cursor-pointer"
                                >
                                  <div className="text-lg font-bold text-[#27aae1] group-hover:text-[#1e8bc3] transition-colors duration-200 flex items-center justify-center">
                                    {quoteCount}
                                    <Eye className="h-3 w-3 ml-1 text-[#27aae1]" />
                                  </div>
                                  <div className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors duration-200">
                                    quotes
                                  </div>
                                  <div className="text-xs text-[#27aae1] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    Click to view
                                  </div>
                                </Link>
                              ) : (
                                <div className="text-center">
                                  <div className="text-lg font-bold text-slate-400">{quoteCount}</div>
                                  <div className="text-xs text-slate-400">quotes</div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              client.status === "Active" 
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-red-100 text-red-700 border-red-200"
                            }`}>
                              {client.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-center p-4">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onView(client)}
                              className="text-[#27aae1] hover:bg-[#27aae1]/10 rounded-lg p-2"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(client)}
                              className="text-green-600 hover:bg-green-50 rounded-lg p-2"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4 p-4">
              {loading ? (
                <div className="text-center py-16 text-slate-500">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#27aae1]"></div>
                    <span>Loading clients...</span>
                  </div>
                </div>
              ) : current.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  {filtered.length === 0 ? "No clients found matching your filters." : "No clients to display."}
                </div>
              ) : (
                current.map((client) => (
                  <Card key={client.id} className="p-4 border-slate-200 bg-white shadow-sm">
                    <div className="space-y-4">
                      {/* Header with Client ID and Status */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-medium text-slate-900 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg">
                          {getClientDisplayId(client.id)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          client.status === "Active" 
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-red-100 text-red-700 border-red-200"
                        }`}>
                          {client.status}
                        </span>
                      </div>
                      
                      {/* Client Info */}
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                          {client.clientType === "Company" ? "Company" : "Individual"}
                        </div>
                        <div className="font-semibold text-slate-900">
                          {client.clientType === "Company" ? client.companyName : `${client.firstName} ${client.lastName}`}
                        </div>
                        <div className="text-sm text-slate-600">
                          {client.clientType === "Company" ? client.contactPerson : client.role}
                        </div>
                      </div>
                      
                      {/* Contact Details */}
                      <div className="grid grid-cols-1 gap-3">
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Email</div>
                          <div className="font-medium text-slate-900">{client.email}</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Phone</div>
                          <div className="font-medium text-slate-900">{client.phone}</div>
                        </div>
                      </div>
                      
                      {/* Location */}
                      <div className="grid grid-cols-1 gap-3">
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Location</div>
                          <div className="font-medium text-slate-900">{client.city}, {client.state}</div>
                        </div>
                      </div>
                      
                      {/* Quotes Count */}
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Quotes</div>
                        <div className="font-semibold text-slate-900">
                          {(() => {
                            const clientQuotes = quotes.filter(q => q.clientId === client.id);
                            const quoteCount = clientQuotes.length;
                            return quoteCount > 0 ? (
                              <Link 
                                href={`/quote-management?clientId=${client.id}`}
                                className="group cursor-pointer"
                              >
                                <span className="text-lg font-bold text-blue-600 group-hover:text-blue-700 transition-colors duration-200 flex items-center">
                                  {quoteCount}
                                  <Eye className="h-3 w-3 ml-1 text-blue-500" />
                                </span>
                                <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-1">
                                  (Click to view)
                                </span>
                              </Link>
                            ) : (
                              <span className="text-lg font-bold text-slate-400">{quoteCount}</span>
                            );
                          })()}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onView(client)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(client)}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <Pencil className="w-4 h-4 mr-1" />
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

      {/* ===== Modal Add/Edit Client ===== */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent 
          className="sm:max-w-[600px] rounded-2xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl border-0 dialog-content"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {mode === "add" ? "Add New Client" : "Edit Client"}
            </DialogTitle>

          </DialogHeader>

          <div className="space-y-6 bg-white">
            {/* Client Type Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold text-gray-700">Client Type</Label>
              <RadioGroup
                value={draft.clientType}
                onValueChange={(value) => {
                  if (value === "Individual") {
                    setDraft({ 
                      ...draft, 
                      clientType: value as "Individual", 
                      companyName: "", 
                      role: "" 
                    });
                  } else {
                    setDraft({ ...draft, clientType: value as "Company" });
                  }
                }}
                className="flex space-x-4"
              >
                <div className="relative">
                  <RadioGroupItem value="Individual" id="r-individual" className="sr-only" />
                  <Label 
                    htmlFor="r-individual" 
                    className={`inline-flex items-center px-6 py-3 rounded-xl font-medium cursor-pointer transition-all duration-200 hover:shadow-md ${
                      draft.clientType === "Individual"
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl"
                        : "bg-white border-2 border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                    }`}
                  >
                    <User className="w-4 h-4 mr-2" />
                    <span>Individual</span>
                    {draft.clientType === "Individual" && (
                      <CheckCircle className="w-4 h-4 ml-2" />
                    )}
                  </Label>
                </div>
                
                <div className="relative">
                  <RadioGroupItem value="Company" id="r-company" className="sr-only" />
                  <Label 
                    htmlFor="r-company" 
                    className={`inline-flex items-center px-6 py-3 rounded-xl font-medium cursor-pointer transition-all duration-200 hover:shadow-md ${
                      draft.clientType === "Company"
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl"
                        : "bg-white border-2 border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                    }`}
                  >
                    <Building className="w-4 h-4 mr-2" />
                    <span>Company</span>
                    {draft.clientType === "Company" && (
                      <CheckCircle className="w-4 h-4 ml-2" />
                    )}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Company Name and Role (Company only) */}
              {draft.clientType === "Company" && (
                <>
                  <div>
                    <Label htmlFor="companyName" className="text-sm font-medium text-slate-700">Company Name *</Label>
                    <Input
                      id="companyName"
                      placeholder="Enter company name"
                      value={draft.companyName}
                      onChange={(e) => updateContactPerson("companyName", e.target.value)}
                      className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role" className="text-sm font-medium text-slate-700">Role/Designation *</Label>
                    <Input
                      id="role"
                      placeholder="Enter role or designation"
                      value={draft.role}
                      onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                      className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl"
                    />
                  </div>
                </>
              )}

              {/* First Name and Last Name (Individual only) */}
              {draft.clientType === "Individual" && (
                <>
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">First Name *</Label>
                    <Input
                      id="firstName"
                      placeholder="Enter first name"
                      value={draft.firstName}
                      onChange={(e) => updateContactPerson("firstName", e.target.value)}
                      className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">Last Name *</Label>
                    <Input
                      id="lastName"
                      placeholder="Enter last name"
                      value={draft.lastName}
                      onChange={(e) => updateContactPerson("lastName", e.target.value)}
                      className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl"
                    />
                  </div>
                </>
              )}

              {/* Contact Person (auto-generated) */}
              <div>
                <Label htmlFor="contactPerson" className="text-sm font-medium text-slate-700">Contact Person *</Label>
                <Input
                  id="contactPerson"
                  placeholder="Contact person name"
                  value={draft.contactPerson}
                  onChange={(e) => setDraft({ ...draft, contactPerson: e.target.value })}
                  className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl"
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Primary Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter primary email address"
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl"
                />
              </div>

              {/* Additional Emails for CC */}
              <div>
                <Label className="text-sm font-medium text-slate-700">Additional Emails (CC)</Label>
                <div className="space-y-2">
                  {emails.map((email, index) => (
                    <div key={index} className="flex space-x-2">
                      <Input
                        type="email"
                        placeholder={`Email ${index + 1}`}
                        value={email}
                        onChange={(e) => updateEmail(index, e.target.value)}
                        className="flex-1 border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl"
                      />
                      {emails.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeEmail(index)}
                          className="px-3 border-slate-300"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEmail}
                    className="w-full border-slate-300"
                  >
                    + Add Another Email
                  </Button>
                </div>
              </div>

              {/* TRN Field */}
              <div>
                <Label className="text-sm font-medium text-slate-700">TRN (Tax Registration Number)</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasNoTrn"
                      checked={hasNoTrn === 1}
                      onChange={(e) => setHasNoTrn(e.target.checked ? 1 : 0)}
                      className="rounded border-slate-300"
                    />
                    <Label htmlFor="hasNoTrn" className="text-sm text-slate-600">No TRN</Label>
                  </div>
                  {hasNoTrn !== 1 && (
                    <Input
                      id="trn"
                      placeholder="Enter TRN number"
                      value={draft.trn || ""}
                      onChange={(e) => setDraft({ ...draft, trn: e.target.value })}
                      className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl"
                    />
                  )}
                </div>
              </div>

              {/* Phone with Country Code */}
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone *</Label>
                <div className="flex space-x-2">
                  <Select
                    value={draft.countryCode}
                    onValueChange={(value) => {
                      setDraft({ ...draft, countryCode: value });
                      // Auto-update country based on country code
                      let country = "";
                      if (value === "+971") country = "Dubai";
                      else if (value === "+91") country = "India";
                      else if (value === "+62") country = "Indonesia";
                      
                      if (country) {
                        setDraft(prev => ({ ...prev, country }));
                      }
                    }}
                  >
                    <SelectTrigger className="w-32 border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl">
                      <SelectValue placeholder="Code" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+971">+971 (UAE)</SelectItem>
                      <SelectItem value="+91">+91 (India)</SelectItem>
                      <SelectItem value="+62">+62 (Indonesia)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    placeholder="Enter phone number"
                    value={draft.phone}
                    onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                    className="flex-1 border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl"
                  />
                </div>
              </div>

              {/* Address Fields */}
              <div className="space-y-4">
                <Label className="text-base font-semibold text-gray-700">Address Information</Label>
                
                <div>
                  <Label htmlFor="country" className="text-sm font-medium text-slate-700">Country *</Label>
                  <Select 
                    value={draft.country || "UAE"} 
                    onValueChange={(value) => {
                      console.log('Country changed to:', value); // Debug log
                      // Only update the country field, don't auto-fill address
                      setDraft({ ...draft, country: value });
                    }}
                  >
                    <SelectTrigger className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UAE">🇦🇪 UAE</SelectItem>
                      <SelectItem value="India">🇮🇳 India</SelectItem>
                      <SelectItem value="Indonesia">🇮🇩 Indonesia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="address" className="text-sm font-medium text-slate-700">Address</Label>
                  <Input
                    id="address"
                    placeholder="Enter street address"
                    value={draft.address || ""}
                    onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                    className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="area" className="text-sm font-medium text-slate-700">Area *</Label>
                    <Select
                      value={draft.area || ""}
                      onValueChange={(value) => setDraft({ ...draft, area: value })}
                    >
                      <SelectTrigger className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl">
                        <SelectValue placeholder="Select area" />
                      </SelectTrigger>
                      <SelectContent>
                        {getFilteredAreas().map((area) => (
                          <SelectItem key={`${area.state}-${area.name}`} value={area.name}>
                            {area.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-sm font-medium text-slate-700">State/Province *</Label>
                    <Select
                      value={draft.state || "Dubai"}
                      onValueChange={(value) => setDraft({ ...draft, state: value })}
                    >
                      <SelectTrigger className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dubai">Dubai</SelectItem>
                        <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
                        <SelectItem value="Sharjah">Sharjah</SelectItem>
                        <SelectItem value="Ajman">Ajman</SelectItem>
                        <SelectItem value="Umm Al Quwain">Umm Al Quwain</SelectItem>
                        <SelectItem value="Ras Al Khaimah">Ras Al Khaimah</SelectItem>
                        <SelectItem value="Fujairah">Fujairah</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="city" className="text-sm font-medium text-slate-700">City (Optional)</Label>
                  <Input
                    id="city"
                    placeholder="Enter city (optional)"
                    value={draft.city || ""}
                    onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                    className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl"
                  />
                </div>


              </div>

              {/* Status */}
              <div>
                <Label htmlFor="status" className="text-sm font-medium text-slate-700">Status</Label>
                <Select value={draft.status} onValueChange={(v: "Active" | "Inactive") => setDraft({ ...draft, status: v })}>
                  <SelectTrigger className="border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl">
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
              {mode === "add" ? "Add Client" : "Update Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
