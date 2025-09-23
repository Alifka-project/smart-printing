"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle, Building, User, Plus, X } from "lucide-react";
import type { QuoteFormData } from "@/types";

interface CreateQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: QuoteFormData) => void;
}

const EMPTY_CLIENT: QuoteFormData["client"] = {
  clientType: "Individual",
  companyName: "",
  contactPerson: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  countryCode: "+971",
  role: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Dubai",
  additionalInfo: "",
};

// Mock existing customers for autofill
const EXISTING_CUSTOMERS = [
  {
    id: "CUST001",
    clientType: "Company" as const,
    companyName: "Eagan Inc.",
    firstName: "John",
    lastName: "Smith",
    contactPerson: "John Smith",
    email: "john.smith@eagan.com",
    phone: "501234567",
    countryCode: "+971",
    role: "Marketing Manager",
    address: "Sheikh Zayed Road, Office 1205, Business Bay",
    city: "Dubai",
    state: "Dubai",
    postalCode: "00000",
    country: "Dubai",
    additionalInfo: "Regular customer, prefers digital communication"
  },
  {
    id: "CUST002",
    clientType: "Company" as const,
    companyName: "Tech Solutions Ltd.",
    firstName: "Sarah",
    lastName: "Johnson",
    contactPerson: "Sarah Johnson",
    email: "sarah.j@techsolutions.com",
    phone: "559876543",
    countryCode: "+971",
    role: "Operations Director",
    address: "Marina Walk, Tower 3, Level 15",
    city: "Dubai",
    state: "Dubai",
    postalCode: "00000",
    country: "Dubai",
    additionalInfo: "Bulk orders, requires detailed quotations"
  },
  {
    id: "CUST003",
    clientType: "Individual" as const,
    companyName: "",
    firstName: "Michael",
    lastName: "Brown",
    contactPerson: "Michael Brown",
    email: "michael.brown@gmail.com",
    phone: "524567890",
    countryCode: "+971",
    role: "",
    address: "Al Wasl Road, Villa 25",
    city: "Dubai",
    state: "Dubai",
    postalCode: "00000",
    country: "Dubai",
    additionalInfo: "Individual client, small quantity orders"
  }
];

const CreateQuoteModal: React.FC<CreateQuoteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<QuoteFormData>({
    client: {
      clientType: "Company",
      companyName: "",
      firstName: "",
      lastName: "",
      contactPerson: "",
      email: "",
      phone: "",
      countryCode: "+971",
      role: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "UAE",
      additionalInfo: ""
    },
    products: [],
    operational: {
      papers: [],
      finishing: [],
      plates: null,
      units: null
    },
    calculation: {
      basePrice: 0,
      marginAmount: 0,
      subtotal: 0,
      vatAmount: 0,
      totalPrice: 0
    },
    additionalCosts: []
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const setClient = (patch: Partial<typeof formData.client>) => {
    setFormData((prev) => {
      const updatedClient = { 
        ...prev.client, 
        ...patch 
      };
      
      // Auto-update contactPerson when firstName or lastName changes
      if (patch.firstName || patch.lastName) {
        const firstName = patch.firstName || prev.client.firstName || '';
        const lastName = patch.lastName || prev.client.lastName || '';
        if (firstName || lastName) {
          updatedClient.contactPerson = `${firstName} ${lastName}`.trim();
        }
      }
      
      return { 
        ...prev, 
        client: updatedClient
      };
    });
  };

  // Auto-fill functionality
  const handleCompanyNameChange = (value: string) => {
    setClient({ companyName: value });
    setSearchTerm(value);
    
    if (value.length > 0) {
      setShowSuggestions(true);
      const existingCustomer = EXISTING_CUSTOMERS.find(
        customer => customer.companyName.toLowerCase().includes(value.toLowerCase()) ||
                   customer.contactPerson.toLowerCase().includes(value.toLowerCase())
      );
      
      if (existingCustomer) {
        setSelectedCustomer(existingCustomer);
        setIsNewCustomer(false);
      } else {
        setSelectedCustomer(null);
        setIsNewCustomer(true);
      }
    } else {
      setShowSuggestions(false);
      setSelectedCustomer(null);
      setIsNewCustomer(true);
    }
  };

  const handlePersonNameChange = (field: "firstName" | "lastName", value: string) => {
    setClient({ [field]: value });
    
    const currentFirstName = field === "firstName" ? value : (formData.client.firstName || "");
    const currentLastName = field === "lastName" ? value : (formData.client.lastName || "");
    
    if (currentFirstName && currentLastName) {
      const existingCustomer = EXISTING_CUSTOMERS.find(
        customer => 
          customer.firstName.toLowerCase() === currentFirstName.toLowerCase() &&
          customer.lastName.toLowerCase() === currentLastName.toLowerCase()
      );
      
      if (existingCustomer) {
        setSelectedCustomer(existingCustomer);
        setIsNewCustomer(false);
      } else {
        setSelectedCustomer(null);
        setIsNewCustomer(true);
      }
    }
  };

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    setIsNewCustomer(false);
    setClient({
      clientType: customer.clientType,
      companyName: customer.companyName,
      firstName: customer.firstName,
      lastName: customer.lastName,
      contactPerson: customer.contactPerson,
      email: customer.email,
      phone: customer.phone,
      countryCode: customer.countryCode,
      role: customer.role,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      postalCode: customer.postalCode,
      country: customer.country,
      additionalInfo: customer.additionalInfo
    });
    setShowSuggestions(false);
    setSearchTerm(customer.companyName || customer.contactPerson);
  };

  const validateForm = () => {
    // Essential required fields for all client types
    const essentialRequired = [
      formData.client.firstName,
      formData.client.lastName,
      formData.client.email,
      formData.client.phone
    ];

    // Additional required fields for company clients
    const companyRequired = formData.client.clientType === "Company" ? [
      formData.client.companyName
    ] : [];

    const allRequired = [...essentialRequired, ...companyRequired];
    return allRequired.every(field => field && field.trim() !== "");
  };

  const isFormValid = validateForm();

  const handleSubmit = () => {
    if (!isFormValid) {
      alert("Please fill in all required fields before creating the quote.");
      return;
    }

    // Generate a unique quote number
    const quoteNumber = `QT${Date.now()}`;
    
    // Create the quote object
    const newQuote = {
      id: quoteNumber,
      quoteNumber: quoteNumber,
      customerName: formData.client.companyName || formData.client.contactPerson,
      createdDate: new Date().toISOString(),
      status: "Pending" as const,
      totalAmount: formData.calculation.totalPrice || 0,
      client: formData.client,
      products: formData.products,
      operational: formData.operational,
      calculation: formData.calculation
    };

    onSubmit(newQuote);
    onClose();
    
    // Reset form
    setFormData({
      client: {
        clientType: "Company",
        companyName: "",
        firstName: "",
        lastName: "",
        contactPerson: "",
        email: "",
        phone: "",
        countryCode: "+971",
        role: "",
        address: "",
        city: "",
        state: "",
        postalCode: "",
        country: "UAE",
        additionalInfo: ""
      },
      products: [],
      operational: {
        papers: [],
        finishing: [],
        plates: null,
        units: null
      },
      calculation: {
        basePrice: 0,
        marginAmount: 0,
        subtotal: 0,
        vatAmount: 0,
        totalPrice: 0
      },
      additionalCosts: []
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
              <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">
            Create New Quote
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Client Information Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">Client Information</h3>
            </div>

            {/* Client Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700">Client Type</Label>
              <RadioGroup
                value={formData.client.clientType}
                onValueChange={(value: "Company" | "Individual") => setClient({ clientType: value })}
                className="flex space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Company" id="company" />
                  <Label htmlFor="company" className="flex items-center space-x-2 cursor-pointer">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span>Company</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Individual" id="individual" />
                  <Label htmlFor="individual" className="flex items-center space-x-2 cursor-pointer">
                    <User className="w-4 h-4 text-green-600" />
                    <span>Individual</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Company and Designation (Company only) */}
            {formData.client.clientType === "Company" && (
              <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-medium text-slate-700">
                    Company Name *
                  </Label>
                  <Input
                    id="companyName"
                    value={formData.client.companyName}
                    onChange={(e) => handleCompanyNameChange(e.target.value)}
                    placeholder="Enter company name"
                    className={!formData.client.companyName?.trim() ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
                  />
                  
                  {/* Auto-complete suggestions */}
                  {showSuggestions && searchTerm && EXISTING_CUSTOMERS.filter(customer =>
                    customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    customer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {EXISTING_CUSTOMERS.filter(customer =>
                        customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        customer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
                      ).map((customer) => (
                        <div
                          key={customer.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => handleCustomerSelect(customer)}
                        >
                          <div className="font-medium text-gray-900">{customer.companyName || `${customer.firstName} ${customer.lastName}`}</div>
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designation" className="text-sm font-medium text-slate-700">
                    Designation *
                  </Label>
                  <Input
                    id="designation"
                    value={formData.client.role}
                    onChange={(e) => setClient({ role: e.target.value })}
                    placeholder="Enter designation"
                    className={!formData.client.role?.trim() ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
                  />
                </div>
              </div>
            )}

            {/* First Name and Last Name */}
            <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  value={formData.client.firstName}
                  onChange={(e) => handlePersonNameChange("firstName", e.target.value)}
                  placeholder="Enter first name"
                  className={!formData.client.firstName?.trim() ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">
                  Last Name *
                </Label>
                <Input
                  id="lastName"
                  value={formData.client.lastName}
                  onChange={(e) => handlePersonNameChange("lastName", e.target.value)}
                  placeholder="Enter last name"
                  className={!formData.client.lastName?.trim() ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
                />
              </div>
            </div>

            {/* Contact Person (Auto-generated) */}
            <div className="space-y-2">
              <Label htmlFor="contactPerson" className="text-sm font-medium text-slate-700">
                Contact Person
              </Label>
              <Input
                id="contactPerson"
                value={formData.client.contactPerson}
                onChange={(e) => setClient({ contactPerson: e.target.value })}
                placeholder="Contact Person (auto-generated from first and last name)"
                className="bg-gray-50"
                readOnly
              />
              <p className="text-sm text-gray-500">
                Auto-generated from first and last name
              </p>
            </div>

            {/* Email and Phone */}
            <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.client.email}
                  onChange={(e) => setClient({ email: e.target.value })}
                  placeholder="Enter email address"
                  className={!formData.client.email?.trim() ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                  Phone *
                </Label>
                <div className="flex space-x-2">
                  <Select
                    value={formData.client.countryCode}
                    onValueChange={(value) => setClient({ countryCode: value })}
                  >
                    <SelectTrigger className={`w-32 ${!formData.client.countryCode ? "border-red-300" : ""}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+971">+971</SelectItem>
                      <SelectItem value="+62">+62</SelectItem>
                      <SelectItem value="+1">+1</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    inputMode="tel"
                    value={formData.client.phone}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d]/g, "");
                      setClient({ phone: v });
                    }}
                    placeholder="Enter phone number"
                    className={`flex-1 ${!formData.client.phone?.trim() ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="grid md:grid-cols-1 gap-y-4">
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-slate-700">
                  Address *
                </Label>
                <Input
                  id="address"
                  value={formData.client.address}
                  onChange={(e) => setClient({ address: e.target.value })}
                  placeholder="Enter street address, building, suite, etc."
                  className={!formData.client.address?.trim() ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
                />
              </div>
            </div>

            {/* City, State, Postal Code, Country */}
            <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium text-slate-700">
                  City *
                </Label>
                <Input
                  id="city"
                  value={formData.client.city}
                  onChange={(e) => setClient({ city: e.target.value })}
                  placeholder="Enter city"
                  className={!formData.client.city?.trim() ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-medium text-slate-700">
                  State/Province *
                </Label>
                <Input
                  id="state"
                  value={formData.client.state}
                  onChange={(e) => setClient({ state: e.target.value })}
                  placeholder="Enter state or province"
                  className={!formData.client.state?.trim() ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode" className="text-sm font-medium text-slate-700">
                  Postal Code *
                </Label>
                <Input
                  id="postalCode"
                  value={formData.client.postalCode}
                  onChange={(e) => setClient({ postalCode: e.target.value })}
                  placeholder="Enter postal code"
                  className={!formData.client.postalCode?.trim() ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-medium text-slate-700">
                  Country *
                </Label>
                <Select value={formData.client.country} onValueChange={(value) => setClient({ country: value })}>
                  <SelectTrigger className={!formData.client.country?.trim() ? "border-red-300" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dubai">Dubai</SelectItem>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="Indonesia">Indonesia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-2">
              <Label htmlFor="additionalInfo" className="text-sm font-medium text-slate-700">
                Additional Information
              </Label>
              <Textarea
                id="additionalInfo"
                value={formData.client.additionalInfo}
                onChange={(e) => setClient({ additionalInfo: e.target.value })}
                placeholder="Any special requirements, notes, or additional information about the client"
                rows={3}
              />
            </div>
          </div>

          {/* Validation Summary */}
          {!isFormValid && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <div className="text-red-700">
                  <p className="font-medium mb-2">Please fill in the essential fields to proceed:</p>
                  <ul className="text-sm space-y-1">
                    {!formData.client.firstName?.trim() && <li>• First Name</li>}
                    {!formData.client.lastName?.trim() && <li>• Last Name</li>}
                    {!formData.client.email?.trim() && <li>• Email</li>}
                    {!formData.client.phone?.trim() && <li>• Phone Number</li>}
                    {formData.client.clientType === "Company" && !formData.client.companyName?.trim() && <li>• Company Name</li>}
                  </ul>
                  <p className="text-xs text-red-600 mt-2">
                    Address fields are optional but recommended for complete customer information.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Complete Indicator */}
          {isFormValid && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                            <p className="text-green-700 font-medium">
              Essential customer information is complete. You can now create the quote.
            </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex space-x-3 pt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 py-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            disabled={!isFormValid}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Quote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateQuoteModal;
