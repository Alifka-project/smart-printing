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
import type { QuoteFormData, SalesPerson } from "@/types";

interface Step2Props {
  formData: QuoteFormData;
  setFormData: Dispatch<SetStateAction<QuoteFormData>>;
}


// Comprehensive country codes list (deduplicated)
const COUNTRY_CODES = [
  { code: "+971", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+1", name: "United States of America", flag: "🇺🇸" },
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+33", name: "France", flag: "🇫🇷" },
  { code: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "+39", name: "Italy", flag: "🇮🇹" },
  { code: "+34", name: "Spain", flag: "🇪🇸" },
  { code: "+31", name: "Netherlands", flag: "🇳🇱" },
  { code: "+32", name: "Belgium", flag: "🇧🇪" },
  { code: "+41", name: "Switzerland", flag: "🇨🇭" },
  { code: "+43", name: "Austria", flag: "🇦🇹" },
  { code: "+45", name: "Denmark", flag: "🇩🇰" },
  { code: "+46", name: "Sweden", flag: "🇸🇪" },
  { code: "+47", name: "Norway", flag: "🇳🇴" },
  { code: "+358", name: "Finland", flag: "🇫🇮" },
  { code: "+48", name: "Poland", flag: "🇵🇱" },
  { code: "+420", name: "Czech Republic", flag: "🇨🇿" },
  { code: "+421", name: "Slovakia", flag: "🇸🇰" },
  { code: "+36", name: "Hungary", flag: "🇭🇺" },
  { code: "+40", name: "Romania", flag: "🇷🇴" },
  { code: "+359", name: "Bulgaria", flag: "🇧🇬" },
  { code: "+385", name: "Croatia", flag: "🇭🇷" },
  { code: "+386", name: "Slovenia", flag: "🇸🇮" },
  { code: "+372", name: "Estonia", flag: "🇪🇪" },
  { code: "+371", name: "Latvia", flag: "🇱🇻" },
  { code: "+370", name: "Lithuania", flag: "🇱🇹" },
  { code: "+7", name: "Russia", flag: "🇷🇺" },
  { code: "+380", name: "Ukraine", flag: "🇺🇦" },
  { code: "+375", name: "Belarus", flag: "🇧🇾" },
  { code: "+90", name: "Turkey", flag: "🇹🇷" },
  { code: "+30", name: "Greece", flag: "🇬🇷" },
  { code: "+351", name: "Portugal", flag: "🇵🇹" },
  { code: "+353", name: "Ireland", flag: "🇮🇪" },
  { code: "+354", name: "Iceland", flag: "🇮🇸" },
  { code: "+356", name: "Malta", flag: "🇲🇹" },
  { code: "+357", name: "Cyprus", flag: "🇨🇾" },
  { code: "+352", name: "Luxembourg", flag: "🇱🇺" },
  { code: "+377", name: "Monaco", flag: "🇲🇨" },
  { code: "+378", name: "San Marino", flag: "🇸🇲" },
  { code: "+376", name: "Andorra", flag: "🇦🇩" },
  { code: "+423", name: "Liechtenstein", flag: "🇱🇮" },
  { code: "+93", name: "Afghanistan", flag: "🇦🇫" },
  { code: "+355", name: "Albania", flag: "🇦🇱" },
  { code: "+213", name: "Algeria", flag: "🇩🇿" },
  { code: "+244", name: "Angola", flag: "🇦🇴" },
  { code: "+1264", name: "Anguilla", flag: "🇦🇮" },
  { code: "+1268", name: "Antigua and Barbuda", flag: "🇦🇬" },
  { code: "+54", name: "Argentina", flag: "🇦🇷" },
  { code: "+374", name: "Armenia", flag: "🇦🇲" },
  { code: "+297", name: "Aruba", flag: "🇦🇼" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "+994", name: "Azerbaijan", flag: "🇦🇿" },
  { code: "+1242", name: "Bahamas", flag: "🇧🇸" },
  { code: "+973", name: "Bahrain", flag: "🇧🇭" },
  { code: "+880", name: "Bangladesh", flag: "🇧🇩" },
  { code: "+1246", name: "Barbados", flag: "🇧🇧" },
  { code: "+501", name: "Belize", flag: "🇧🇿" },
  { code: "+229", name: "Benin", flag: "🇧🇯" },
  { code: "+1441", name: "Bermuda", flag: "🇧🇲" },
  { code: "+975", name: "Bhutan", flag: "🇧🇹" },
  { code: "+591", name: "Bolivia", flag: "🇧🇴" },
  { code: "+387", name: "Bosnia and Herzegovina", flag: "🇧🇦" },
  { code: "+267", name: "Botswana", flag: "🇧🇼" },
  { code: "+55", name: "Brazil", flag: "🇧🇷" },
  { code: "+673", name: "Brunei", flag: "🇧🇳" },
  { code: "+226", name: "Burkina Faso", flag: "🇧🇫" },
  { code: "+257", name: "Burundi", flag: "🇧🇮" },
  { code: "+855", name: "Cambodia", flag: "🇰🇭" },
  { code: "+237", name: "Cameroon", flag: "🇨🇲" },
  { code: "+238", name: "Cape Verde", flag: "🇨🇻" },
  { code: "+1345", name: "Cayman Islands", flag: "🇰🇾" },
  { code: "+236", name: "Central African Republic", flag: "🇨🇫" },
  { code: "+235", name: "Chad", flag: "🇹🇩" },
  { code: "+56", name: "Chile", flag: "🇨🇱" },
  { code: "+86", name: "China", flag: "🇨🇳" },
  { code: "+57", name: "Colombia", flag: "🇨🇴" },
  { code: "+269", name: "Comoros", flag: "🇰🇲" },
  { code: "+242", name: "Congo", flag: "🇨🇬" },
  { code: "+243", name: "Democratic Republic of Congo", flag: "🇨🇩" },
  { code: "+682", name: "Cook Islands", flag: "🇨🇰" },
  { code: "+506", name: "Costa Rica", flag: "🇨🇷" },
  { code: "+225", name: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "+53", name: "Cuba", flag: "🇨🇺" },
  { code: "+253", name: "Djibouti", flag: "🇩🇯" },
  { code: "+1767", name: "Dominica", flag: "🇩🇲" },
  { code: "+1809", name: "Dominican Republic", flag: "🇩🇴" },
  { code: "+593", name: "Ecuador", flag: "🇪🇨" },
  { code: "+20", name: "Egypt", flag: "🇪🇬" },
  { code: "+503", name: "El Salvador", flag: "🇸🇻" },
  { code: "+240", name: "Equatorial Guinea", flag: "🇬🇶" },
  { code: "+291", name: "Eritrea", flag: "🇪🇷" },
  { code: "+251", name: "Ethiopia", flag: "🇪🇹" },
  { code: "+298", name: "Faroe Islands", flag: "🇫🇴" },
  { code: "+679", name: "Fiji", flag: "🇫🇯" },
  { code: "+594", name: "French Guiana", flag: "🇬🇫" },
  { code: "+689", name: "French Polynesia", flag: "🇵🇫" },
  { code: "+241", name: "Gabon", flag: "🇬🇦" },
  { code: "+220", name: "Gambia", flag: "🇬🇲" },
  { code: "+995", name: "Georgia", flag: "🇬🇪" },
  { code: "+233", name: "Ghana", flag: "🇬🇭" },
  { code: "+350", name: "Gibraltar", flag: "🇬🇮" },
  { code: "+299", name: "Greenland", flag: "🇬🇱" },
  { code: "+1473", name: "Grenada", flag: "🇬🇩" },
  { code: "+590", name: "Guadeloupe", flag: "🇬🇵" },
  { code: "+1671", name: "Guam", flag: "🇬🇺" },
  { code: "+502", name: "Guatemala", flag: "🇬🇹" },
  { code: "+224", name: "Guinea", flag: "🇬🇳" },
  { code: "+245", name: "Guinea-Bissau", flag: "🇬🇼" },
  { code: "+592", name: "Guyana", flag: "🇬🇾" },
  { code: "+509", name: "Haiti", flag: "🇭🇹" },
  { code: "+504", name: "Honduras", flag: "🇭🇳" },
  { code: "+852", name: "Hong Kong", flag: "🇭🇰" },
  { code: "+62", name: "Indonesia", flag: "🇮🇩" },
  { code: "+98", name: "Iran", flag: "🇮🇷" },
  { code: "+964", name: "Iraq", flag: "🇮🇶" },
  { code: "+972", name: "Israel", flag: "🇮🇱" },
  { code: "+1876", name: "Jamaica", flag: "🇯🇲" },
  { code: "+81", name: "Japan", flag: "🇯🇵" },
  { code: "+962", name: "Jordan", flag: "🇯🇴" },
  { code: "+254", name: "Kenya", flag: "🇰🇪" },
  { code: "+686", name: "Kiribati", flag: "🇰🇮" },
  { code: "+850", name: "North Korea", flag: "🇰🇵" },
  { code: "+82", name: "South Korea", flag: "🇰🇷" },
  { code: "+965", name: "Kuwait", flag: "🇰🇼" },
  { code: "+996", name: "Kyrgyzstan", flag: "🇰🇬" },
  { code: "+856", name: "Laos", flag: "🇱🇦" },
  { code: "+961", name: "Lebanon", flag: "🇱🇧" },
  { code: "+266", name: "Lesotho", flag: "🇱🇸" },
  { code: "+231", name: "Liberia", flag: "🇱🇷" },
  { code: "+218", name: "Libya", flag: "🇱🇾" },
  { code: "+853", name: "Macau", flag: "🇲🇴" },
  { code: "+389", name: "Macedonia", flag: "🇲🇰" },
  { code: "+261", name: "Madagascar", flag: "🇲🇬" },
  { code: "+265", name: "Malawi", flag: "🇲🇼" },
  { code: "+60", name: "Malaysia", flag: "🇲🇾" },
  { code: "+960", name: "Maldives", flag: "🇲🇻" },
  { code: "+223", name: "Mali", flag: "🇲🇱" },
  { code: "+692", name: "Marshall Islands", flag: "🇲🇭" },
  { code: "+596", name: "Martinique", flag: "🇲🇶" },
  { code: "+222", name: "Mauritania", flag: "🇲🇷" },
  { code: "+230", name: "Mauritius", flag: "🇲🇺" },
  { code: "+262", name: "Mayotte", flag: "🇾🇹" },
  { code: "+52", name: "Mexico", flag: "🇲🇽" },
  { code: "+691", name: "Micronesia", flag: "🇫🇲" },
  { code: "+373", name: "Moldova", flag: "🇲🇩" },
  { code: "+976", name: "Mongolia", flag: "🇲🇳" },
  { code: "+1664", name: "Montserrat", flag: "🇲🇸" },
  { code: "+212", name: "Morocco", flag: "🇲🇦" },
  { code: "+258", name: "Mozambique", flag: "🇲🇿" },
  { code: "+95", name: "Myanmar", flag: "🇲🇲" },
  { code: "+264", name: "Namibia", flag: "🇳🇦" },
  { code: "+674", name: "Nauru", flag: "🇳🇷" },
  { code: "+977", name: "Nepal", flag: "🇳🇵" },
  { code: "+599", name: "Netherlands Antilles", flag: "🇦🇳" },
  { code: "+687", name: "New Caledonia", flag: "🇳🇨" },
  { code: "+64", name: "New Zealand", flag: "🇳🇿" },
  { code: "+505", name: "Nicaragua", flag: "🇳🇮" },
  { code: "+227", name: "Niger", flag: "🇳🇪" },
  { code: "+234", name: "Nigeria", flag: "🇳🇬" },
  { code: "+683", name: "Niue", flag: "🇳🇺" },
  { code: "+672", name: "Norfolk Island", flag: "🇳🇫" },
  { code: "+1670", name: "Northern Mariana Islands", flag: "🇲🇵" },
  { code: "+968", name: "Oman", flag: "🇴🇲" },
  { code: "+92", name: "Pakistan", flag: "🇵🇰" },
  { code: "+680", name: "Palau", flag: "🇵🇼" },
  { code: "+970", name: "Palestine", flag: "🇵🇸" },
  { code: "+507", name: "Panama", flag: "🇵🇦" },
  { code: "+675", name: "Papua New Guinea", flag: "🇵🇬" },
  { code: "+595", name: "Paraguay", flag: "🇵🇾" },
  { code: "+51", name: "Peru", flag: "🇵🇪" },
  { code: "+63", name: "Philippines", flag: "🇵🇭" },
  { code: "+1787", name: "Puerto Rico", flag: "🇵🇷" },
  { code: "+974", name: "Qatar", flag: "🇶🇦" },
  { code: "+250", name: "Rwanda", flag: "🇷🇼" },
  { code: "+290", name: "Saint Helena", flag: "🇸🇭" },
  { code: "+1869", name: "Saint Kitts and Nevis", flag: "🇰🇳" },
  { code: "+1758", name: "Saint Lucia", flag: "🇱🇨" },
  { code: "+508", name: "Saint Pierre and Miquelon", flag: "🇵🇲" },
  { code: "+1784", name: "Saint Vincent and the Grenadines", flag: "🇻🇨" },
  { code: "+685", name: "Samoa", flag: "🇼🇸" },
  { code: "+239", name: "São Tomé and Príncipe", flag: "🇸🇹" },
  { code: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+221", name: "Senegal", flag: "🇸🇳" },
  { code: "+381", name: "Serbia", flag: "🇷🇸" },
  { code: "+248", name: "Seychelles", flag: "🇸🇨" },
  { code: "+232", name: "Sierra Leone", flag: "🇸🇱" },
  { code: "+65", name: "Singapore", flag: "🇸🇬" },
  { code: "+677", name: "Solomon Islands", flag: "🇸🇧" },
  { code: "+252", name: "Somalia", flag: "🇸🇴" },
  { code: "+27", name: "South Africa", flag: "🇿🇦" },
  { code: "+94", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "+249", name: "Sudan", flag: "🇸🇩" },
  { code: "+597", name: "Suriname", flag: "🇸🇷" },
  { code: "+268", name: "Swaziland", flag: "🇸🇿" },
  { code: "+963", name: "Syria", flag: "🇸🇾" },
  { code: "+886", name: "Taiwan", flag: "🇹🇼" },
  { code: "+992", name: "Tajikistan", flag: "🇹🇯" },
  { code: "+255", name: "Tanzania", flag: "🇹🇿" },
  { code: "+66", name: "Thailand", flag: "🇹🇭" },
  { code: "+228", name: "Togo", flag: "🇹🇬" },
  { code: "+676", name: "Tonga", flag: "🇹🇴" },
  { code: "+1868", name: "Trinidad and Tobago", flag: "🇹🇹" },
  { code: "+216", name: "Tunisia", flag: "🇹🇳" },
  { code: "+993", name: "Turkmenistan", flag: "🇹🇲" },
  { code: "+1649", name: "Turks and Caicos Islands", flag: "🇹🇨" },
  { code: "+688", name: "Tuvalu", flag: "🇹🇻" },
  { code: "+256", name: "Uganda", flag: "🇺🇬" },
  { code: "+598", name: "Uruguay", flag: "🇺🇾" },
  { code: "+998", name: "Uzbekistan", flag: "🇺🇿" },
  { code: "+678", name: "Vanuatu", flag: "🇻🇺" },
  { code: "+58", name: "Venezuela", flag: "🇻🇪" },
  { code: "+84", name: "Vietnam", flag: "🇻🇳" },
  { code: "+1284", name: "British Virgin Islands", flag: "🇻🇬" },
  { code: "+1340", name: "U.S. Virgin Islands", flag: "🇻🇮" },
  { code: "+681", name: "Wallis and Futuna", flag: "🇼🇫" },
  { code: "+967", name: "Yemen", flag: "🇾🇪" },
  { code: "+260", name: "Zambia", flag: "🇿🇲" },
  { code: "+263", name: "Zimbabwe", flag: "🇿🇼" }
];

// Comprehensive countries and states data
const COUNTRIES_AND_STATES: Record<string, string[]> = {
  "UAE": [
    "Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"
  ],
  "Saudi Arabia": [
    "Riyadh", "Makkah", "Madinah", "Eastern Province", "Asir", "Jazan", "Najran", 
    "Tabuk", "Hail", "Northern Borders", "Al Qassim", "Al Bahah", "Al Jouf"
  ],
  "Qatar": [
    "Doha", "Al Rayyan", "Al Wakrah", "Al Khor", "Ash Shamal", "Az Za'ayin", "Umm Salal"
  ],
  "Kuwait": [
    "Al Ahmadi", "Al Farwaniyah", "Al Jahra", "Capital", "Hawalli", "Mubarak Al-Kabeer"
  ],
  "Bahrain": [
    "Capital", "Muharraq", "Northern", "Southern"
  ],
  "Oman": [
    "Muscat", "Dhofar", "Musandam", "Al Buraimi", "Al Dakhiliyah", "Al Dhahirah", 
    "Al Sharqiyah North", "Al Sharqiyah South", "Al Wusta", "Dhofar"
  ],
  "India": [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
    "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh"
  ],
  "Pakistan": [
    "Balochistan", "Khyber Pakhtunkhwa", "Punjab", "Sindh", "Islamabad Capital Territory", 
    "Azad Kashmir", "Gilgit-Baltistan"
  ],
  "Bangladesh": [
    "Dhaka", "Chittagong", "Rajshahi", "Khulna", "Barisal", "Sylhet", "Rangpur", "Mymensingh"
  ],
  "Sri Lanka": [
    "Central", "Eastern", "North Central", "Northern", "North Western", "Sabaragamuwa", 
    "Southern", "Uva", "Western"
  ],
  "Nepal": [
    "Province 1", "Province 2", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim"
  ],
  "Indonesia": [
    "Aceh", "Bali", "Banten", "Bengkulu", "Central Java", "Central Kalimantan", 
    "Central Sulawesi", "East Java", "East Kalimantan", "East Nusa Tenggara", 
    "Gorontalo", "Jakarta", "Jambi", "Lampung", "Maluku", "North Kalimantan", 
    "North Maluku", "North Sulawesi", "North Sumatra", "Papua", "Riau", 
    "Riau Islands", "South Kalimantan", "South Sulawesi", "South Sumatra", 
    "Southeast Sulawesi", "West Java", "West Kalimantan", "West Nusa Tenggara", 
    "West Papua", "West Sulawesi", "West Sumatra", "Yogyakarta"
  ],
  "Malaysia": [
    "Johor", "Kedah", "Kelantan", "Kuala Lumpur", "Labuan", "Malacca", "Negeri Sembilan", 
    "Pahang", "Penang", "Perak", "Perlis", "Putrajaya", "Sabah", "Sarawak", "Selangor", "Terengganu"
  ],
  "Singapore": [
    "Central Region", "East Region", "North Region", "North-East Region", "West Region"
  ],
  "Thailand": [
    "Bangkok", "Central", "East", "North", "Northeast", "South", "West"
  ],
  "Philippines": [
    "National Capital Region", "Cordillera Administrative Region", "Ilocos Region", 
    "Cagayan Valley", "Central Luzon", "Calabarzon", "Mimaropa", "Bicol Region", 
    "Western Visayas", "Central Visayas", "Eastern Visayas", "Zamboanga Peninsula", 
    "Northern Mindanao", "Davao Region", "Soccsksargen", "Caraga", "Bangsamoro"
  ],
  "Vietnam": [
    "Hanoi", "Ho Chi Minh City", "Da Nang", "Hai Phong", "Can Tho", "An Giang", 
    "Ba Ria-Vung Tau", "Bac Lieu", "Bac Giang", "Bac Kan", "Bac Ninh", "Ben Tre", 
    "Binh Dinh", "Binh Duong", "Binh Phuoc", "Binh Thuan", "Ca Mau", "Cao Bang", 
    "Dak Lak", "Dak Nong", "Dien Bien", "Dong Nai", "Dong Thap", "Gia Lai", 
    "Ha Giang", "Ha Nam", "Ha Tinh", "Hai Duong", "Hau Giang", "Hoa Binh", 
    "Hung Yen", "Khanh Hoa", "Kien Giang", "Kon Tum", "Lai Chau", "Lam Dong", 
    "Lang Son", "Lao Cai", "Long An", "Nam Dinh", "Nghe An", "Ninh Binh", 
    "Ninh Thuan", "Phu Tho", "Phu Yen", "Quang Binh", "Quang Nam", "Quang Ngai", 
    "Quang Ninh", "Quang Tri", "Soc Trang", "Son La", "Tay Ninh", "Thai Binh", 
    "Thai Nguyen", "Thanh Hoa", "Thua Thien Hue", "Tien Giang", "Tra Vinh", 
    "Tuyen Quang", "Vinh Long", "Vinh Phuc", "Yen Bai"
  ],
  "United States": [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
    "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", 
    "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", 
    "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", 
    "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", 
    "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", 
    "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", 
    "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ],
  "United Kingdom": [
    "England", "Scotland", "Wales", "Northern Ireland"
  ],
  "Canada": [
    "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", 
    "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island", 
    "Quebec", "Saskatchewan", "Yukon"
  ],
  "Australia": [
    "New South Wales", "Victoria", "Queensland", "Western Australia", "South Australia", 
    "Tasmania", "Australian Capital Territory", "Northern Territory"
  ],
  "New Zealand": [
    "Auckland", "Bay of Plenty", "Canterbury", "Gisborne", "Hawke's Bay", "Manawatu-Wanganui", 
    "Marlborough", "Nelson", "Northland", "Otago", "Southland", "Taranaki", "Tasman", 
    "Waikato", "Wellington", "West Coast"
  ],
  "Germany": [
    "Baden-Württemberg", "Bavaria", "Berlin", "Brandenburg", "Bremen", "Hamburg", 
    "Hesse", "Lower Saxony", "Mecklenburg-Vorpommern", "North Rhine-Westphalia", 
    "Rhineland-Palatinate", "Saarland", "Saxony", "Saxony-Anhalt", "Schleswig-Holstein", "Thuringia"
  ],
  "France": [
    "Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Brittany", "Centre-Val de Loire", 
    "Corsica", "Grand Est", "Hauts-de-France", "Île-de-France", "Normandy", 
    "Nouvelle-Aquitaine", "Occitanie", "Pays de la Loire", "Provence-Alpes-Côte d'Azur"
  ],
  "Italy": [
    "Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", "Friuli-Venezia Giulia", 
    "Lazio", "Liguria", "Lombardy", "Marche", "Molise", "Piedmont", "Apulia", "Sardinia", 
    "Sicily", "Tuscany", "Trentino-Alto Adige", "Umbria", "Aosta Valley", "Veneto"
  ],
  "Spain": [
    "Andalusia", "Aragon", "Asturias", "Balearic Islands", "Basque Country", "Canary Islands", 
    "Cantabria", "Castile and León", "Castilla-La Mancha", "Catalonia", "Extremadura", 
    "Galicia", "La Rioja", "Madrid", "Murcia", "Navarre", "Valencia"
  ],
  "Netherlands": [
    "Drenthe", "Flevoland", "Friesland", "Gelderland", "Groningen", "Limburg", 
    "North Brabant", "North Holland", "Overijssel", "South Holland", "Utrecht", "Zeeland"
  ],
  "Belgium": [
    "Antwerp", "East Flanders", "Flemish Brabant", "Hainaut", "Liège", "Limburg", 
    "Luxembourg", "Namur", "Walloon Brabant", "West Flanders", "Brussels-Capital"
  ],
  "Switzerland": [
    "Aargau", "Appenzell Ausserrhoden", "Appenzell Innerrhoden", "Basel-Landschaft", 
    "Basel-Stadt", "Bern", "Fribourg", "Geneva", "Glarus", "Graubünden", "Jura", 
    "Lucerne", "Neuchâtel", "Nidwalden", "Obwalden", "Schaffhausen", "Schwyz", 
    "Solothurn", "St. Gallen", "Thurgau", "Ticino", "Uri", "Valais", "Vaud", 
    "Zug", "Zurich"
  ],
  "Austria": [
    "Burgenland", "Carinthia", "Lower Austria", "Salzburg", "Styria", "Tyrol", 
    "Upper Austria", "Vienna", "Vorarlberg"
  ],
  "Japan": [
    "Hokkaido", "Tohoku", "Kanto", "Chubu", "Kansai", "Chugoku", "Shikoku", "Kyushu"
  ],
  "South Korea": [
    "Seoul", "Busan", "Daegu", "Incheon", "Gwangju", "Daejeon", "Ulsan", "Sejong", 
    "Gyeonggi", "Gangwon", "North Chungcheong", "South Chungcheong", "North Jeolla", 
    "South Jeolla", "North Gyeongsang", "South Gyeongsang", "Jeju"
  ],
  "China": [
    "Beijing", "Shanghai", "Tianjin", "Chongqing", "Guangdong", "Jiangsu", "Shandong", 
    "Henan", "Sichuan", "Hubei", "Fujian", "Hunan", "Anhui", "Hebei", "Zhejiang", 
    "Jiangxi", "Liaoning", "Shanxi", "Shaanxi", "Heilongjiang", "Yunnan", "Guizhou", 
    "Gansu", "Hainan", "Qinghai", "Tibet", "Xinjiang", "Inner Mongolia", "Guangxi", 
    "Ningxia", "Hong Kong", "Macau", "Taiwan"
  ],
  "Russia": [
    "Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Nizhny Novgorod", 
    "Kazan", "Chelyabinsk", "Omsk", "Samara", "Rostov-on-Don", "Ufa", "Krasnoyarsk", 
    "Perm", "Voronezh", "Volgograd", "Krasnodar", "Saratov", "Tyumen", "Tolyatti", 
    "Izhevsk", "Barnaul", "Ulyanovsk", "Vladivostok", "Yaroslavl", "Makhachkala", 
    "Tomsk", "Orenburg", "Kemerovo", "Ryazan", "Naberezhnye Chelny", "Astrakhan", 
    "Penza", "Lipetsk", "Tula", "Kirov", "Cheboksary", "Kaliningrad", "Bryansk", 
    "Ivanovo", "Magnitogorsk", "Tver", "Stavropol", "Nizhny Tagil", "Belgorod", 
    "Arkhangelsk", "Vladimir", "Sochi", "Kurgan", "Smolensk", "Volzhsky", "Murmansk", 
    "Sterlitamak", "Kaluga", "Chita", "Orsk", "Grozny", "Kostroma", "Petrozavodsk", 
    "Taganrog", "Nizhnevartovsk", "Yoshkar-Ola", "Komsomolsk-on-Amur", "Syktyvkar", 
    "Nalchik", "Shakhty", "Blagoveshchensk", "Rybinsk", "Balakovo", "Armavir", 
    "Severodvinsk", "Orsk", "Kamensk-Uralsky", "Engels", "Novocherkassk", "Pskov", 
    "Biysk", "Prokopyevsk", "Balashov", "Khanty-Mansiysk", "Yakutsk", "Sevastopol", 
    "Miass", "Korolyov", "Lyubertsy", "Podolsk", "Tolyatti", "Zhukovsky", "Krasnogorsk", 
    "Kolomna", "Elektrostal", "Odintsovo", "Ramenskoye", "Orekhovo-Zuyevo", "Noginsk", 
    "Serpukhov", "Shchelkovo", "Pushkino", "Mytishchi", "Khimki", "Korolyov", "Balashikha", 
    "Krasnogorsk", "Odintsovo", "Lyubertsy", "Podolsk", "Zhukovsky", "Kolomna", 
    "Elektrostal", "Ramenskoye", "Orekhovo-Zuyevo", "Noginsk", "Serpukhov", "Shchelkovo", 
    "Pushkino", "Mytishchi", "Khimki"
  ],
  "Brazil": [
    "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal", 
    "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul", 
    "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí", "Rio de Janeiro", 
    "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia", "Roraima", "Santa Catarina", 
    "São Paulo", "Sergipe", "Tocantins"
  ],
  "Argentina": [
    "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos", 
    "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", 
    "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", 
    "Tierra del Fuego", "Tucumán"
  ],
  "Mexico": [
    "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", 
    "Chihuahua", "Coahuila", "Colima", "Durango", "Guanajuato", "Guerrero", "Hidalgo", 
    "Jalisco", "México", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", 
    "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", 
    "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas", "Mexico City"
  ],
  "South Africa": [
    "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", 
    "Northern Cape", "North West", "Western Cape"
  ],
  "Egypt": [
    "Alexandria", "Aswan", "Asyut", "Beheira", "Beni Suef", "Cairo", "Dakahlia", 
    "Damietta", "Faiyum", "Gharbia", "Giza", "Ismailia", "Kafr el-Sheikh", "Luxor", 
    "Matrouh", "Minya", "Monufia", "New Valley", "North Sinai", "Port Said", "Qalyubia", 
    "Qena", "Red Sea", "Sharqia", "Sohag", "South Sinai", "Suez"
  ],
  "Nigeria": [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa", 
    "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", 
    "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"
  ],
  "Kenya": [
    "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa", 
    "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi", 
    "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos", 
    "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi", 
    "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya", 
    "Taita-Taveta", "Tana River", "Tharaka-Nithi", "Trans Nzoia", "Turkana", "Uasin Gishu", 
    "Vihiga", "Wajir", "West Pokot"
  ],
  "Morocco": [
    "Tanger-Tétouan-Al Hoceïma", "L'Oriental", "Fès-Meknès", "Rabat-Salé-Kénitra", 
    "Béni Mellal-Khénifra", "Casablanca-Settat", "Marrakech-Safi", "Drâa-Tafilalet", 
    "Souss-Massa", "Guelmim-Oued Noun", "Laâyoune-Sakia El Hamra", "Dakhla-Oued Ed-Dahab"
  ],
  "Turkey": [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", 
    "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", 
    "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan", 
    "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkâri", "Hatay", "Isparta", 
    "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir", 
    "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", 
    "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", 
    "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", 
    "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak", "Bartın", 
    "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
  ],
  "Israel": [
    "Central", "Haifa", "Jerusalem", "Northern", "Southern", "Tel Aviv"
  ],
  "Jordan": [
    "Ajloun", "Amman", "Aqaba", "Balqa", "Irbid", "Jerash", "Karak", "Ma'an", "Madaba", 
    "Mafraq", "Tafilah", "Zarqa"
  ],
  "Lebanon": [
    "Akkar", "Baalbek-Hermel", "Beirut", "Beqaa", "Mount Lebanon", "Nabatieh", "North", "South"
  ],
  "Syria": [
    "Aleppo", "As-Suwayda", "Damascus", "Daraa", "Deir ez-Zor", "Hama", "Al-Hasakah", 
    "Homs", "Idlib", "Latakia", "Quneitra", "Ar-Raqqah", "Rif Dimashq", "Tartus"
  ],
  "Iraq": [
    "Al Anbar", "Babil", "Baghdad", "Basra", "Dhi Qar", "Al-Qadisiyyah", "Diyala", 
    "Dohuk", "Erbil", "Karbala", "Kirkuk", "Maysan", "Muthanna", "Najaf", "Nineveh", 
    "Saladin", "Sulaymaniyah", "Wasit"
  ],
  "Iran": [
    "Alborz", "Ardabil", "Azerbaijan, East", "Azerbaijan, West", "Bushehr", "Chaharmahal and Bakhtiari", 
    "Fars", "Gilan", "Golestan", "Hamadan", "Hormozgan", "Ilam", "Isfahan", "Kerman", 
    "Kermanshah", "Khorasan, North", "Khorasan, Razavi", "Khorasan, South", "Khuzestan", 
    "Kohgiluyeh and Boyer-Ahmad", "Kurdistan", "Lorestan", "Markazi", "Mazandaran", 
    "Qazvin", "Qom", "Semnan", "Sistan and Baluchestan", "Tehran", "Yazd", "Zanjan"
  ],
  "Afghanistan": [
    "Badakhshan", "Badghis", "Baghlan", "Balkh", "Bamyan", "Daykundi", "Farah", "Faryab", 
    "Ghazni", "Ghor", "Helmand", "Herat", "Jowzjan", "Kabul", "Kandahar", "Kapisa", 
    "Khost", "Kunar", "Kunduz", "Laghman", "Logar", "Nangarhar", "Nimruz", "Nuristan", 
    "Paktia", "Paktika", "Panjshir", "Parwan", "Samangan", "Sar-e Pol", "Takhar", "Urozgan", "Wardak", "Zabul"
  ]
};

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
  const { client } = formData;
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [emails, setEmails] = useState<string[]>([""]); // Multiple emails array
  const [hasNoTrn, setHasNoTrn] = useState(false); // TRN option
  const [showValidation, setShowValidation] = useState(false); // Only show validation errors when user tries to proceed
  const [hasInteracted, setHasInteracted] = useState(false); // Track if user has started interacting with the form

  // Sales person state
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [selectedSalesPersonId, setSelectedSalesPersonId] = useState<string>(formData.salesPersonId || '');

  // Load sales persons on component mount
  useEffect(() => {
    const loadSalesPersons = async () => {
      try {
        const response = await fetch('/api/sales-persons');
        if (response.ok) {
          const salesPersonsData = await response.json();
          setSalesPersons(salesPersonsData);
          
          // Filter for active sales persons only
          const activeSalesPersons = salesPersonsData.filter((person: SalesPerson) => person.status === 'Active');
          setSalesPersons(activeSalesPersons);
          
          // Auto-select first active sales person if none selected
          if (activeSalesPersons.length > 0 && !formData.salesPersonId) {
            setSelectedSalesPersonId(activeSalesPersons[0].salesPersonId);
            setFormData(prev => ({
              ...prev,
              salesPersonId: activeSalesPersons[0].salesPersonId
            }));
          }
        }
      } catch (error) {
        console.error('Error loading sales persons:', error);
      }
    };

    loadSalesPersons();
  }, []);

  // Update form data when sales person changes
  useEffect(() => {
    if (selectedSalesPersonId) {
      setFormData(prev => ({
        ...prev,
        salesPersonId: selectedSalesPersonId
      }));
    }
  }, [selectedSalesPersonId, setFormData]);


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

  // State for storing fetched customers
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  // State for country code search
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // Fetch customers from database
  const fetchCustomers = async () => {
    try {
      setIsLoadingCustomers(true);
      const response = await fetch('/api/clients');
      console.log('Response status:', response.status, 'Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched customers:', data.length);
        setCustomers(data);
      } else {
        console.error('Failed to fetch customers - Status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  // Filter customers based on search term
  const getFilteredCustomers = () => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    return customers.filter(customer => 
      customer.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Filter country codes based on search term
  const getFilteredCountryCodes = () => {
    if (!countrySearchTerm) return COUNTRY_CODES;
    
    return COUNTRY_CODES.filter(country => 
      country.name.toLowerCase().includes(countrySearchTerm.toLowerCase()) ||
      country.code.includes(countrySearchTerm)
    );
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

  // Handle customer selection for auto-population
  const handleCustomerSelect = (customer: any) => {
    setClient({
      companyName: customer.companyName || '',
      contactPerson: customer.contactPerson || '',
      firstName: customer.contactPerson?.split(' ')[0] || '',
      lastName: customer.contactPerson?.split(' ').slice(1).join(' ') || '',
      email: customer.email || '',
      phone: customer.phone || '',
      countryCode: customer.countryCode || '+971',
      role: customer.role || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      postalCode: customer.postalCode || '',
      country: customer.country || 'Dubai',
      additionalInfo: customer.additionalInfo || '',
      clientType: customer.clientType || 'Company'
    });
    
    // Update emails array with the customer's email
    if (customer.email) {
      setEmails([customer.email]);
    }
    
    setShowSuggestions(false);
    setSearchTerm(customer.companyName || '');
  };

  // Fetch customers when component mounts
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Close country dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.country-dropdown-container')) {
        setShowCountryDropdown(false);
        setCountrySearchTerm("");
      }
    };

    if (showCountryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCountryDropdown]);

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

  // Get filtered areas based on selected country and state
  const getFilteredAreas = () => {
    const areas = [];
    
    // Add UAE areas if country is UAE and state is selected
    if (client.country === "UAE" && client.state) {
      const uaeAreas = UAE_AREAS.filter(area => area.state === client.state);
      areas.push(...uaeAreas);
    }
    
    // Always add "Other" option
    areas.push({ name: "Other", state: client.state || "" });
    
    return areas;
  };

  // Get available states based on selected country
  const getAvailableStates = () => {
    if (client.country && COUNTRIES_AND_STATES[client.country]) {
      return COUNTRIES_AND_STATES[client.country];
    }
    return [];
  };

  // Get available countries
  const getAvailableCountries = () => {
    return Object.keys(COUNTRIES_AND_STATES);
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
                  ? "bg-[#27aae1] text-white shadow-lg hover:shadow-xl"
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
                  ? "bg-[#27aae1] text-white shadow-lg hover:shadow-xl"
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
                onChange={(e) => {
                  setHasInteracted(true);
                  handleCompanyNameChange(e.target.value);
                }}
                placeholder="Company"
                className={`inputForm w-full ${
                  hasInteracted && !client.companyName?.trim()
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
              />
              
              {/* Auto-complete suggestions */}
              {showSuggestions && searchTerm && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {isLoadingCustomers ? (
                    <div className="px-4 py-3 text-center text-gray-500">
                      Loading customers...
                    </div>
                  ) : getFilteredCustomers().length > 0 ? (
                    getFilteredCustomers().map((customer) => (
                      <div
                        key={customer.id}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{customer.companyName || 'No Company Name'}</div>
                            <div className="text-sm text-gray-600">{customer.contactPerson || 'No Contact Person'}</div>
                            <div className="text-xs text-gray-500">{customer.email || 'No Email'}</div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {customer.role || 'No Role'}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center text-gray-500">
                      No customers found matching "{searchTerm}"
                    </div>
                  )}
                </div>
              )}
              
              {hasInteracted && !client.companyName?.trim() && (
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
              onChange={(e) => {
                setHasInteracted(true);
                handlePersonNameChange("firstName", e.target.value);
              }}
              placeholder="First Name"
              className={`inputForm w-full ${
                hasInteracted && !client.firstName?.trim()
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
            />
            {hasInteracted && !client.firstName?.trim() && (
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


        {/* Multiple Emails */}
        <div className="space-y-3 sm:space-y-4">
          <Label className="text-sm sm:text-base font-semibold text-gray-700 flex items-center">
            <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>Emails: <span className="text-red-500">*</span></span>
          </Label>
          
          {emails.map((email, index) => (
            <div key={index} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setHasInteracted(true);
                  updateEmail(index, e.target.value);
                }}
                placeholder={`Email ${index + 1}`}
                className={`inputForm flex-1 w-full ${
                  hasInteracted && index === 0 && !email.trim()
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
          
          {hasInteracted && !emails[0]?.trim() && (
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
              {/* Country Code Dropdown */}
              <div className="relative w-full sm:w-36 country-dropdown-container">
                <div
                  className="flex items-center justify-between w-full h-12 px-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#ea078b] focus:border-transparent transition-colors cursor-pointer bg-white hover:border-gray-300"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-base">
                      {COUNTRY_CODES.find(c => c.code === (client.countryCode || "+971"))?.flag || "🇦🇪"}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {client.countryCode || "+971"}
                    </span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {/* Searchable Country Dropdown */}
                {showCountryDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-3 border-b border-gray-100">
                      <Input
                        placeholder="Search countries..."
                        value={countrySearchTerm}
                        onChange={(e) => setCountrySearchTerm(e.target.value)}
                        className="w-full text-sm"
                        autoFocus
                      />
                    </div>
                    
                    {/* Country List */}
                    <div className="max-h-48 overflow-y-auto">
                      {getFilteredCountryCodes().map((country) => (
                        <div
                          key={country.code}
                          className={`flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                            client.countryCode === country.code ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => {
                            setClient({ countryCode: country.code });
                            setShowCountryDropdown(false);
                            setCountrySearchTerm("");
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{country.flag}</span>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{country.name}</div>
                              <div className="text-xs text-gray-500">{country.code}</div>
                            </div>
                          </div>
                          {client.countryCode === country.code && (
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      ))}
                      
                      {getFilteredCountryCodes().length === 0 && (
                        <div className="px-3 py-4 text-center text-gray-500 text-sm">
                          No countries found matching "{countrySearchTerm}"
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Phone Number Input */}
              <Input
                id="phone"
                inputMode="tel"
                value={client.phone || ""}
                onChange={(e) => {
                  setHasInteracted(true);
                  const v = e.target.value.replace(/[^\d]/g, "");
                  setClient({ phone: v });
                }}
                placeholder="Phone Number"
                className={`flex-1 w-full h-12 px-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#ea078b] focus:border-transparent transition-colors ${
                  hasInteracted && !client.phone?.trim()
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "hover:border-gray-300"
                }`}
              />
            </div>
            {hasInteracted && !client.phone?.trim() && (
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
                onChange={(e) => {
                  setHasInteracted(true);
                  setClient({ trn: e.target.value });
                }}
                placeholder="Enter TRN"
                className={`inputForm w-full ${
                  hasInteracted && !client.trn?.trim()
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
              />
              {hasInteracted && !client.trn?.trim() && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">TRN is required unless 'No TRN' is selected</p>
              )}
            </div>
          )}
        </div>

        {/* Address Information - Reordered: Address → Country → State → Area */}
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

        {/* Country */}
        <div className="grid grid-cols-1 gap-y-4 sm:gap-y-6">
          <div>
            <Label htmlFor="country" className="mb-2 block text-sm sm:text-base">
              Country: <span className="text-red-500">*</span>
            </Label>
            <Select
              value={client.country || "UAE"}
              onValueChange={(value) => {
                setClient({ 
                  country: value, 
                  state: "", 
                  area: "" 
                }); // Reset state and area when country changes
              }}
            >
              <SelectTrigger className="py-5 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#ea078b] focus:border-transparent transition-colors w-full">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                {getAvailableCountries().map((country) => (
                  <SelectItem 
                    key={country} 
                    value={country}
                    className="hover:bg-gray-100 cursor-pointer px-3 py-2 text-gray-900"
                  >
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          </div>

        {/* State/Province */}
        <div className="grid grid-cols-1 gap-y-4 sm:gap-y-6">
          <div>
            <Label htmlFor="state" className="mb-2 block text-sm sm:text-base">
              State/Province: <span className="text-red-500">*</span>
            </Label>
            <Select
              value={client.state || ""}
              onValueChange={(value) => {
                setClient({ 
                  state: value, 
                  area: "" 
                }); // Reset area when state changes
              }}
            >
              <SelectTrigger className="py-5 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#ea078b] focus:border-transparent transition-colors w-full">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                {getAvailableStates().map((state: string) => (
                  <SelectItem 
                    key={state} 
                    value={state}
                    className="hover:bg-gray-100 cursor-pointer px-3 py-2 text-gray-900"
                  >
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Area */}
        <div className="grid grid-cols-1 gap-y-4 sm:gap-y-6">
          <div>
            <Label htmlFor="area" className="mb-2 block text-sm sm:text-base">
              Area: <span className="text-red-500">*</span>
            </Label>
            <Select
              value={client.area || ""}
              onValueChange={(value) => {
                setHasInteracted(true);
                setClient({ area: value });
              }}
            >
              <SelectTrigger className={`py-5 border rounded-sm focus:outline-none focus:ring-2 focus:ring-[#ea078b] focus:border-transparent transition-colors w-full ${
                hasInteracted && !client.area?.trim()
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
            {hasInteracted && !client.area?.trim() && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">Area is required</p>
            )}
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

        {/* Sales Person */}
        <div className="space-y-3 sm:space-y-4">
          <Label className="text-sm sm:text-base font-semibold text-gray-700">
            Sales Person:
          </Label>
          <Select
            value={selectedSalesPersonId}
            onValueChange={setSelectedSalesPersonId}
          >
            <SelectTrigger className="py-5 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#ea078b] focus:border-transparent transition-colors w-full">
              <SelectValue placeholder="Select Sales Person" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg z-50">
              {salesPersons.map((person) => (
                <SelectItem 
                  key={person.salesPersonId} 
                  value={person.salesPersonId}
                  className="hover:bg-gray-100 cursor-pointer px-3 py-2 text-gray-900"
                >
                  {person.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Validation Summary */}
      {hasInteracted && !isFormValid && (
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

    </div>
  );
};

export default Step2CustomerDetail;