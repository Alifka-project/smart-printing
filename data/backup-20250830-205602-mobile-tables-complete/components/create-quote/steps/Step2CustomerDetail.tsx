"use client";

import type { FC, Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle, Building, User, Plus, X, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import type { QuoteFormData } from "@/types";

interface Step2Props {
  formData: QuoteFormData;
  setFormData: Dispatch<SetStateAction<QuoteFormData>>;
}

// UAE Areas data - this would come from the database in production
const UAE_AREAS = [
  { name: 'Al Barsha', state: 'Dubai' },
  { name: 'Al Garhoud', state: 'Dubai' },
  { name: 'Al Jaddaf', state: 'Dubai' },
  { name: 'Al Jafiliya', state: 'Dubai' },
  { name: 'Al Karama', state: 'Dubai' },
  { name: 'Al Mamzar', state: 'Dubai' },
  { name: 'Al Mankhool', state: 'Dubai' },
  { name: 'Al Mizhar', state: 'Dubai' },
  { name: 'Al Nahda', state: 'Dubai' },
  { name: 'Al Qusais', state: 'Dubai' },
  { name: 'Al Raffa', state: 'Dubai' },
  { name: 'Al Ras', state: 'Dubai' },
  { name: 'Al Rigga', state: 'Dubai' },
  { name: 'Al Sabkha', state: 'Dubai' },
  { name: 'Al Safa', state: 'Dubai' },
  { name: 'Al Satwa', state: 'Dubai' },
  { name: 'Al Wasl', state: 'Dubai' },
  { name: 'Arabian Ranches', state: 'Dubai' },
  { name: 'Business Bay', state: 'Dubai' },
  { name: 'Deira', state: 'Dubai' },
  { name: 'Discovery Gardens', state: 'Dubai' },
  { name: 'Downtown Dubai', state: 'Dubai' },
  { name: 'Dubai Marina', state: 'Dubai' },
  { name: 'Dubai Silicon Oasis', state: 'Dubai' },
  { name: 'Dubai Sports City', state: 'Dubai' },
  { name: 'Emirates Hills', state: 'Dubai' },
  { name: 'International City', state: 'Dubai' },
  { name: 'Jebel Ali', state: 'Dubai' },
  { name: 'Jumeirah', state: 'Dubai' },
  { name: 'Jumeirah Beach Residence', state: 'Dubai' },
  { name: 'Jumeirah Golf Estates', state: 'Dubai' },
  { name: 'Jumeirah Islands', state: 'Dubai' },
  { name: 'Jumeirah Lakes Towers', state: 'Dubai' },
  { name: 'Jumeirah Park', state: 'Dubai' },
  { name: 'Knowledge Village', state: 'Dubai' },
  { name: 'Lakes', state: 'Dubai' },
  { name: 'Meadows', state: 'Dubai' },
  { name: 'Media City', state: 'Dubai' },
  { name: 'Mirdif', state: 'Dubai' },
  { name: 'Motor City', state: 'Dubai' },
  { name: 'Palm Jumeirah', state: 'Dubai' },
  { name: 'Palm Jebel Ali', state: 'Dubai' },
  { name: 'Palm Deira', state: 'Dubai' },
  { name: 'Palm Springs', state: 'Dubai' },
  { name: 'Springs', state: 'Dubai' },
  { name: 'Tecom', state: 'Dubai' },
  { name: 'Umm Al Sheif', state: 'Dubai' },
  { name: 'Umm Hurair', state: 'Dubai' },
  { name: 'Umm Ramool', state: 'Dubai' },
  { name: 'Umm Suqeim', state: 'Dubai' },
  { name: 'Victory Heights', state: 'Dubai' },
  { name: 'Warsan', state: 'Dubai' },
  // Abu Dhabi Areas
  { name: 'Al Ain', state: 'Abu Dhabi' },
  { name: 'Al Bateen', state: 'Abu Dhabi' },
  { name: 'Al Danah', state: 'Abu Dhabi' },
  { name: 'Al Falah', state: 'Abu Dhabi' },
  { name: 'Al Karamah', state: 'Abu Dhabi' },
  { name: 'Al Khalidiyah', state: 'Abu Dhabi' },
  { name: 'Al Maqtaa', state: 'Abu Dhabi' },
  { name: 'Al Maryah Island', state: 'Abu Dhabi' },
  { name: 'Al Mina', state: 'Abu Dhabi' },
  { name: 'Al Mushrif', state: 'Abu Dhabi' },
  { name: 'Al Nahyan', state: 'Abu Dhabi' },
  { name: 'Al Raha', state: 'Abu Dhabi' },
  { name: 'Al Raha Beach', state: 'Abu Dhabi' },
  { name: 'Al Ras Al Akhdar', state: 'Abu Dhabi' },
  { name: 'Al Reem Island', state: 'Abu Dhabi' },
  { name: 'Al Saadiyat Island', state: 'Abu Dhabi' },
  { name: 'Al Wahda', state: 'Abu Dhabi' },
  { name: 'Baniyas', state: 'Abu Dhabi' },
  { name: 'Corniche', state: 'Abu Dhabi' },
  { name: 'Khalifa City', state: 'Abu Dhabi' },
  { name: 'Masdar City', state: 'Abu Dhabi' },
  { name: 'Mohammed Bin Zayed City', state: 'Abu Dhabi' },
  { name: 'Shakhbout City', state: 'Abu Dhabi' },
  { name: 'Yas Island', state: 'Abu Dhabi' },
  // Sharjah Areas
  { name: 'Al Majaz', state: 'Sharjah' },
  { name: 'Al Nahda', state: 'Sharjah' },
  { name: 'Al Qasba', state: 'Sharjah' },
  { name: 'Al Taawun', state: 'Sharjah' },
  { name: 'Al Zahra', state: 'Sharjah' },
  { name: 'Muwailih', state: 'Sharjah' },
  { name: 'Sharjah Industrial Area', state: 'Sharjah' },
  // Ajman Areas
  { name: 'Ajman City', state: 'Ajman' },
  { name: 'Ajman Industrial Area', state: 'Ajman' },
  { name: 'Al Nuaimiya', state: 'Ajman' },
  { name: 'Al Rashidiya', state: 'Ajman' },
  // Umm Al Quwain Areas
  { name: 'Umm Al Quwain City', state: 'Umm Al Quwain' },
  { name: 'Umm Al Quwain Industrial Area', state: 'Umm Al Quwain' },
  // Ras Al Khaimah Areas
  { name: 'Al Hamra', state: 'Ras Al Khaimah' },
  { name: 'Al Jazeera Al Hamra', state: 'Ras Al Khaimah' },
  { name: 'Al Marjan Island', state: 'Ras Al Khaimah' },
  { name: 'Al Nakheel', state: 'Ras Al Khaimah' },
  { name: 'Al Qusaidat', state: 'Ras Al Khaimah' },
  { name: 'Al Rams', state: 'Ras Al Khaimah' },
  { name: 'Al Sall', state: 'Ras Al Khaimah' },
  { name: 'Al Uraibi', state: 'Ras Al Khaimah' },
  { name: 'Digdaga', state: 'Ras Al Khaimah' },
  // Fujairah Areas
  { name: 'Fujairah City', state: 'Fujairah' },
  { name: 'Fujairah Industrial Area', state: 'Fujairah' }
];

const Step2CustomerDetail: FC<Step2Props> = ({ formData, setFormData }) => {
  const client = formData.client;
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [emails, setEmails] = useState<string[]>([""]); // Multiple emails array
  const [hasNoTrn, setHasNoTrn] = useState(false); // TRN option

  const setClient = (patch: Partial<typeof client>) => {
    console.log('Step2CustomerDetail: Updating client with patch:', patch);
    console.log('Step2CustomerDetail: Current client before update:', client);
    
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
      
      const updatedFormData = { 
        ...prev, 
        client: updatedClient
      };
      
      console.log('Step2CustomerDetail: Updated form data sent to parent:', updatedFormData);
      console.log('Step2CustomerDetail: Updated client data:', updatedClient);
      return updatedFormData;
    });
  };

  // Handle multiple emails
  const addEmail = () => {
    setEmails([...emails, ""]);
  };

  const removeEmail = (index: number) => {
    if (emails.length > 1) {
      const newEmails = emails.filter((_, i) => i !== index);
      setEmails(newEmails);
      // Update both emails array and primary email field
      const filteredEmails = newEmails.filter(email => email.trim());
      setClient({ 
        emails: JSON.stringify(filteredEmails),
        email: filteredEmails[0] || "" // Set primary email to first email
      });
    }
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
    // Update both emails array and primary email field
    const filteredEmails = newEmails.filter(email => email.trim());
    setClient({ 
      emails: JSON.stringify(filteredEmails),
      email: filteredEmails[0] || "" // Set primary email to first email
    });
  };

  // Auto-fill functionality
  const handleCompanyNameChange = (value: string) => {
    setClient({ companyName: value });
    setSearchTerm(value);
    
    if (value.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handlePersonNameChange = (field: "firstName" | "lastName", value: string) => {
    setClient({ [field]: value });
    
    const currentFirstName = field === "firstName" ? value : (client.firstName || "");
    const currentLastName = field === "lastName" ? value : (client.lastName || "");
    
    if (currentFirstName && currentLastName) {
      // Auto-update contact person
      setClient({ contactPerson: `${currentFirstName} ${currentLastName}`.trim() });
    }
  };

  // Initialize form with default values
  useEffect(() => {
    console.log('Step2CustomerDetail: Initializing form with defaults');
    console.log('Step2CustomerDetail: Current client state:', client);
    
    if (!client.countryCode) {
      setClient({ countryCode: "+971" });
    }
    if (!client.state) {
      setClient({ state: "Dubai" });
    }
    if (!client.country) {
      setClient({ country: "UAE" });
    }
    
    // Initialize emails array
    if (client.emails) {
      try {
        const parsedEmails = JSON.parse(client.emails);
        if (Array.isArray(parsedEmails) && parsedEmails.length > 0) {
          setEmails(parsedEmails);
        }
      } catch (e) {
        // If parsing fails, use the email field as first email
        if (client.email) {
          setEmails([client.email]);
        }
      }
    } else if (client.email) {
      setEmails([client.email]);
    }
    
    // Sync hasNoTrn with client data
    if (client.hasNoTrn !== undefined) {
      setHasNoTrn(client.hasNoTrn);
    } else if (client.trn === null || client.trn === undefined || client.trn === "") {
      setHasNoTrn(true);
    }
    
    console.log('Step2CustomerDetail: Form initialized with defaults');
  }, []); // Only run once on mount

  // Sync hasNoTrn state with client data
  useEffect(() => {
    if (hasNoTrn) {
      setClient({ hasNoTrn: true, trn: "" });
    } else {
      setClient({ hasNoTrn: false });
    }
  }, [hasNoTrn]);

  const validateForm = () => {
    // Essential required fields for all client types
    const essentialRequired = [
      client.firstName,
      client.phone
    ];

    // Email validation - at least one email is required
    const emailValid = emails.length > 0 && emails[0]?.trim() !== "";

    // Additional required fields for company clients
    const companyRequired = client.clientType === "Company" ? [
      client.companyName
    ] : [];

    // TRN validation - required unless "No TRN" is selected
    const trnRequired = !hasNoTrn && !client.trn?.trim();

    // Area validation - required for delivery
    const areaValid = client.area && client.area.trim() !== "";

    const allRequired = [...essentialRequired, ...companyRequired];
    const basicValidation = allRequired.every(field => field && field.trim() !== "");
    
    return basicValidation && emailValid && !trnRequired && areaValid;
  };

  const isFormValid = validateForm();

  // Get filtered areas based on selected state
  const getFilteredAreas = () => {
    if (client.state) {
      return UAE_AREAS.filter(area => area.state === client.state);
    }
    // Default to Dubai areas if no state selected
    return UAE_AREAS.filter(area => area.state === 'Dubai');
  };

  return (
    <div className="space-y-6 sm:space-y-8 px-4 sm:px-0">
      <h3 className="font-bold text-xl sm:text-2xl">Customer Detail</h3>

      {/* Customer Status Indicator */}
      {!isNewCustomer && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
            <p className="text-green-700 font-medium text-sm sm:text-base">
              Existing customer data loaded automatically
            </p>
          </div>
        </div>
      )}

      {/* Client Type - Mobile-Responsive Button Style */}
      <div className="space-y-3 sm:space-y-4">
        <Label className="text-base font-semibold text-gray-700">Client Type</Label>
        <RadioGroup
          value={client.clientType}
          onValueChange={(value) => {
            if (value === "Individual") {
              setClient({ 
                clientType: value as "Individual", 
                companyName: "", 
                role: "" 
              });
            } else {
              setClient({ clientType: value as "Company" });
            }
          }}
          className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4"
        >
          <div className="relative flex-1 sm:flex-initial">
            <RadioGroupItem value="Individual" id="r-individual" className="sr-only" />
            <Label 
              htmlFor="r-individual" 
              className={`flex items-center justify-center px-4 sm:px-6 py-3 rounded-xl font-medium cursor-pointer transition-all duration-200 hover:shadow-md w-full ${
                client.clientType === "Individual"
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl"
                  : "bg-white border-2 border-gray-200 text-gray-600 hover:border-[#ea078b]/50 hover:bg-[#27aae1]/10"
              }`}
            >
              <User className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="text-sm sm:text-base">Individual</span>
              {client.clientType === "Individual" && (
                <CheckCircle className="w-4 h-4 ml-2 flex-shrink-0" />
              )}
            </Label>
          </div>
          
          <div className="relative flex-1 sm:flex-initial">
            <RadioGroupItem value="Company" id="r-company" className="sr-only" />
            <Label 
              htmlFor="r-company" 
              className={`flex items-center justify-center px-4 sm:px-6 py-3 rounded-xl font-medium cursor-pointer transition-all duration-200 hover:shadow-md w-full ${
                client.clientType === "Company"
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl"
                  : "bg-white border-2 border-gray-200 text-gray-600 hover:border-[#ea078b]/50 hover:bg-[#27aae1]/10"
              }`}
            >
              <Building className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="text-sm sm:text-base">Company</span>
              {client.clientType === "Company" && (
                <CheckCircle className="w-4 h-4 ml-2 flex-shrink-0" />
              )}
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Company and Designation (Company only) */}
        {client.clientType === "Company" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-x-8 sm:gap-y-6">
            <div className="relative">
              <Label htmlFor="companyName" className="mb-2 block text-sm sm:text-base">
                Company: <span className="text-red-500">*</span>
              </Label>
              <Input
                id="companyName"
                value={client.companyName || ""}
                onChange={(e) => handleCompanyNameChange(e.target.value)}
                placeholder="Company"
                className={`inputForm w-full ${
                  !client.companyName?.trim()
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
              />
              
              {/* Auto-complete suggestions */}
              {showSuggestions && searchTerm && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {/* Add existing customer suggestions here */}
                </div>
              )}
              
              {!client.companyName?.trim() && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">Company name is required</p>
              )}
            </div>

            <div>
              <Label htmlFor="designation" className="mb-2 block text-sm sm:text-base">
                Designation:
              </Label>
              <Input
                id="designation"
                value={client.role || ""}
                onChange={(e) => setClient({ role: e.target.value })}
                placeholder="Designation (optional)"
                className="inputForm w-full"
              />
            </div>
          </div>
        )}

        {/* First Name and Last Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-x-8 sm:gap-y-6">
          <div>
            <Label htmlFor="firstName" className="mb-2 block text-sm sm:text-base">
              First Name: <span className="text-red-500">*</span>
            </Label>
            <Input
              id="firstName"
              value={client.firstName || ""}
              onChange={(e) => handlePersonNameChange("firstName", e.target.value)}
              placeholder="First Name"
              className={`inputForm w-full ${
                !client.firstName?.trim()
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
            />
            {!client.firstName?.trim() && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">First name is required</p>
            )}
          </div>

          <div>
            <Label htmlFor="lastName" className="mb-2 block text-sm sm:text-base">
              Last Name:
            </Label>
            <Input
              id="lastName"
              value={client.lastName || ""}
              onChange={(e) => handlePersonNameChange("lastName", e.target.value)}
              placeholder="Last Name (optional)"
              className="inputForm w-full"
            />
          </div>
        </div>

        {/* Contact Person (Auto-generated) */}
        <div className="grid grid-cols-1 gap-y-4 sm:gap-y-6">
          <div>
            <Label htmlFor="contactPerson" className="mb-2 block text-sm sm:text-base">
              Contact Person:
            </Label>
            <Input
              id="contactPerson"
              value={client.contactPerson || ""}
              onChange={(e) => setClient({ contactPerson: e.target.value })}
              placeholder="Contact Person (auto-generated from first and last name)"
              className="inputForm bg-gray-50 w-full"
              readOnly
            />
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Auto-generated from first and last name
            </p>
          </div>
        </div>

        {/* Multiple Emails */}
        <div className="space-y-3 sm:space-y-4">
          <Label className="text-sm sm:text-base font-semibold text-gray-700 flex items-center">
            <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>Emails (for CC when sending emails): <span className="text-red-500">*</span></span>
          </Label>
          
          {emails.map((email, index) => (
            <div key={index} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => updateEmail(index, e.target.value)}
                placeholder={`Email ${index + 1}`}
                className={`inputForm flex-1 w-full ${
                  index === 0 && !email.trim()
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
              />
              {emails.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEmail(index)}
                  className="px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors flex items-center justify-center sm:flex-shrink-0 w-full sm:w-auto"
                >
                  <X className="w-4 h-4 mr-1 sm:mr-0" />
                  <span className="sm:hidden">Remove</span>
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            onClick={addEmail}
            className="inline-flex items-center justify-center px-4 py-2 bg-[#27aae1]/20 text-[#27aae1] rounded-md hover:bg-[#27aae1]/30 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Email
          </button>
          
          {!emails[0]?.trim() && (
            <p className="text-red-500 text-xs sm:text-sm">At least one email is required</p>
          )}
        </div>

        {/* Phone */}
        <div className="grid grid-cols-1 gap-y-4 sm:gap-y-6">
          <div>
            <Label htmlFor="phoneWithCountry" className="mb-2 block text-sm sm:text-base">
              Phone (with Country): <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Select
                value={client.countryCode || "+971"}
                onValueChange={(value) => setClient({ countryCode: value })}
              >
                <SelectTrigger className="w-full sm:w-32 py-5 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#ea078b] focus:border-transparent transition-colors">
                  <SelectValue placeholder="Code" />
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
                value={client.phone || ""}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d]/g, "");
                  setClient({ phone: v });
                }}
                placeholder="Phone Number"
                className={`inputForm flex-1 w-full ${
                  !client.phone?.trim()
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
              />
            </div>
            {!client.phone?.trim() && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">Phone number is required</p>
            )}
          </div>
        </div>

        {/* TRN Field */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Label className="text-sm sm:text-base font-semibold text-gray-700">
              TRN (Tax Registration Number):
            </Label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasNoTrn"
                checked={hasNoTrn}
                onChange={(e) => setHasNoTrn(e.target.checked)}
                className="w-4 h-4 text-[#ea078b] border-gray-300 rounded focus:ring-[#ea078b]"
              />
              <Label htmlFor="hasNoTrn" className="text-xs sm:text-sm text-gray-600">
                No TRN
              </Label>
            </div>
          </div>
          
          {!hasNoTrn && (
            <div>
              <Input
                id="trn"
                value={client.trn || ""}
                onChange={(e) => setClient({ trn: e.target.value })}
                placeholder="Enter TRN"
                className={`inputForm w-full ${
                  !client.trn?.trim()
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
              />
              {!client.trn?.trim() && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">TRN is required unless 'No TRN' is selected</p>
              )}
            </div>
          )}
        </div>

        {/* Address Information */}
        <div className="grid grid-cols-1 gap-y-4 sm:gap-y-6">
          <div>
            <Label htmlFor="address" className="mb-2 block text-sm sm:text-base">
              Address:
            </Label>
            <Input
              id="address"
              value={client.address || ""}
              onChange={(e) => setClient({ address: e.target.value })}
              placeholder="Street Address, Building, Suite, etc. (optional)"
              className="inputForm w-full"
            />
          </div>
        </div>

        {/* Area and State */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-x-8 sm:gap-y-6">
          <div>
            <Label htmlFor="area" className="mb-2 block text-sm sm:text-base">
              Area: <span className="text-red-500">*</span>
            </Label>
            <Select
              value={client.area || ""}
              onValueChange={(value) => setClient({ area: value })}
            >
              <SelectTrigger className={`py-5 border rounded-sm focus:outline-none focus:ring-2 focus:ring-[#ea078b] focus:border-transparent transition-colors w-full ${
                !client.area?.trim()
                  ? "border-red-300"
                  : "border-gray-200"
              }`}>
                <SelectValue placeholder="Select Area" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                {getFilteredAreas().map((area) => (
                  <SelectItem 
                    key={area.name} 
                    value={area.name}
                    className="hover:bg-gray-100 cursor-pointer px-3 py-2 text-gray-900"
                  >
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!client.area?.trim() && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">Area is required</p>
            )}
          </div>

          <div>
            <Label htmlFor="state" className="mb-2 block text-sm sm:text-base">
              State/Province: <span className="text-red-500">*</span>
            </Label>
            <Select
              value={client.state || "Dubai"}
              onValueChange={(value) => {
                setClient({ state: value, area: "" }); // Reset area when state changes
              }}
            >
              <SelectTrigger className="py-5 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#ea078b] focus:border-transparent transition-colors w-full">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <SelectItem value="Dubai" className="hover:bg-gray-100 cursor-pointer px-3 py-2 text-gray-900">Dubai</SelectItem>
                <SelectItem value="Abu Dhabi" className="hover:bg-gray-100 cursor-pointer px-3 py-2 text-gray-900">Abu Dhabi</SelectItem>
                <SelectItem value="Sharjah" className="hover:bg-gray-100 cursor-pointer px-3 py-2 text-gray-900">Sharjah</SelectItem>
                <SelectItem value="Ajman" className="hover:bg-gray-100 cursor-pointer px-3 py-2 text-gray-900">Ajman</SelectItem>
                <SelectItem value="Umm Al Quwain" className="hover:bg-gray-100 cursor-pointer px-3 py-2 text-gray-900">Umm Al Quwain</SelectItem>
                <SelectItem value="Ras Al Khaimah" className="hover:bg-gray-100 cursor-pointer px-3 py-2 text-gray-900">Ras Al Khaimah</SelectItem>
                <SelectItem value="Fujairah" className="hover:bg-gray-100 cursor-pointer px-3 py-2 text-gray-900">Fujairah</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Country */}
        <div className="grid grid-cols-1 gap-y-4 sm:gap-y-6">
          <div>
            <Label htmlFor="country" className="mb-2 block text-sm sm:text-base">
              Country: <span className="text-red-500">*</span>
            </Label>
            <Select
              value={client.country || "UAE"}
              onValueChange={(value) => setClient({ country: value })}
            >
              <SelectTrigger className="py-5 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#ea078b] focus:border-transparent transition-colors w-full">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <SelectItem value="UAE" className="hover:bg-gray-100 cursor-pointer px-3 py-2 text-gray-900">UAE</SelectItem>
                <SelectItem value="India" className="hover:bg-gray-100 cursor-pointer px-3 py-2 text-gray-900">India</SelectItem>
                <SelectItem value="Indonesia" className="hover:bg-gray-100 cursor-pointer px-3 py-2 text-gray-900">Indonesia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 gap-y-4 sm:gap-y-6">
          <div>
            <Label htmlFor="additionalInfo" className="mb-2 block text-sm sm:text-base">
              Additional Information:
            </Label>
            <textarea
              id="additionalInfo"
              value={client.additionalInfo || ""}
              onChange={(e) => setClient({ additionalInfo: e.target.value })}
              placeholder="Any additional notes, special requirements, or comments..."
              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#ea078b] focus:border-transparent transition-colors min-h-[80px] resize-y text-sm sm:text-base"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Validation Summary */}
      {!isFormValid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div className="text-red-700">
              <p className="font-medium mb-2 text-sm sm:text-base">Please fill in the essential fields to proceed:</p>
              <ul className="text-xs sm:text-sm space-y-1">
                {!client.firstName?.trim() && <li>• First Name</li>}
                {!emails[0]?.trim() && <li>• At least one Email</li>}
                {!client.phone?.trim() && <li>• Phone Number</li>}
                {client.clientType === "Company" && !client.companyName?.trim() && <li>• Company Name</li>}
                {!hasNoTrn && !client.trn?.trim() && <li>• TRN (or select 'No TRN')</li>}
                {!client.area?.trim() && <li>• Area</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Form Complete Indicator */}
      {isFormValid && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <p className="text-green-700 font-medium text-sm sm:text-base">
              Essential customer information is complete. You can now proceed to the next step.
            </p>
          </div>
        </div>
      )}

      {/* New Customer Indicator */}
      {isNewCustomer && client.firstName && (
        <div className="bg-[#27aae1]/10 border border-[#27aae1]/30 rounded-lg p-3 sm:p-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-[#27aae1]/100 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">+</span>
            </div>
            <p className="text-[#27aae1] font-medium text-sm sm:text-base">
              New customer will be added to database
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2CustomerDetail;