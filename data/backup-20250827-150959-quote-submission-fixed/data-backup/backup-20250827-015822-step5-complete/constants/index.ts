import { Building2Icon, FileTextIcon, LayoutDashboardIcon, LucideIcon, PackageIcon, SquarePenIcon, UsersIcon } from "lucide-react";

export type SidebarItem = {
  label: string;
  route: string;
  icons: LucideIcon;
};

export const getSidebarItems = (role: "admin" | "estimator"): SidebarItem[] => {
  const common: SidebarItem[] = [
    { label: "Dashboard",          route: "/",                 icons: LayoutDashboardIcon },
    { label: "Create Quote",       route: "/create-quote",     icons: SquarePenIcon },
    { label: "Quote Management",   route: "/quote-management", icons: FileTextIcon },
    { label: "Client Management",  route: "/client-management",icons: Building2Icon },
    { label: "Supplier Management",route: "/supplier-management", icons: PackageIcon },
    { label: "User Management",   route: "/user-management",  icons: UsersIcon }, // Temporarily visible to all
  ];

  // Temporarily return common for all users
  return common;
  
  // Original logic (commented out for now)
  // if (role === "admin") {
  //   return [
  //     ...common,
  //     { label: "User Management", route: "/user-management", icons: UsersIcon },
  //   ];
  // }
  // return common;
};

export const dataRecentQuote = [
  {
    quoteId: "QT-2024-0718-001",
    clientName: "Eagen Inc",
    date: "25 JULY 2025",
    amount: "$2,450.00",
    status: "Approved",
  },
  {
    quoteId: "QT-2024-0718-002",
    clientName: "Maxtion Development",
    date: "19 JULY 2025",
    amount: "$2,750.00",
    status: "Pending",
  },
];

export const stepCreateQuote = [
    {
        numberStep: "1",
        label: "Create A Quote"
    },
    {
        numberStep: "2",
        label: "Customer Detail"
    },
    {
        numberStep: "3",
        label: "Product Spec"
    },
    {
        numberStep: "4",
        label: "Operational"
    },
    {
        numberStep: "5",
        label: "Quotation"
    },
]

// constants/quotes.ts
export type QuoteStatus = "Approved" | "Pending" | "Rejected";

export interface QuoteRow {
  id: string;
  clientName: string;
  contactPerson: string;
  date: string;       // YYYY-MM-DD
  amount: number;
  status: QuoteStatus;
  userId: string;
  productName: string;
  quantity: number;
}

export const users = [
  { id: "u1", name: "Admin" },
  { id: "u2", name: "Estimator" },
] as const;

export const quotes: QuoteRow[] = [
  {
    id: "QT-2025-0718-001",
    clientName: "Eagan Inc.",
    contactPerson: "John Eagan",
    date: "2025-07-18",
    amount: 204.75,
    status: "Approved",
    userId: "u1",
    productName: "Business Card",
    quantity: 1000,
  },
  {
    id: "QT-2025-0718-002",
    clientName: "Horizon Press",
    contactPerson: "Emma White",
    date: "2025-07-18",
    amount: 1520.0,
    status: "Pending",
    userId: "u2",
    productName: "Art Book",
    quantity: 250,
  },
  {
    id: "QT-2025-0719-003",
    clientName: "Nova Prints",
    contactPerson: "Liam Carter",
    date: "2025-07-19",
    amount: 880.5,
    status: "Rejected",
    userId: "u1",
    productName: "Poster A2",
    quantity: 300,
  },
  {
    id: "QT-2025-0720-004",
    clientName: "Galaxy Media",
    contactPerson: "Sophia Adams",
    date: "2025-07-20",
    amount: 310.0,
    status: "Approved",
    userId: "u3",
    productName: "Flyer A5",
    quantity: 2000,
  },
  {
    id: "QT-2025-0720-005",
    clientName: "PrintX Solutions",
    contactPerson: "David Thompson",
    date: "2025-07-20",
    amount: 4500.75,
    status: "Approved",
    userId: "u2",
    productName: "Magazine",
    quantity: 500,
  },
  {
    id: "QT-2025-0721-006",
    clientName: "Creative Hub",
    contactPerson: "Olivia Martinez",
    date: "2025-07-21",
    amount: 120.0,
    status: "Pending",
    userId: "u1",
    productName: "Sticker Pack",
    quantity: 500,
  },
  {
    id: "QT-2025-0721-007",
    clientName: "Urban Prints",
    contactPerson: "Noah Wilson",
    date: "2025-07-21",
    amount: 1999.99,
    status: "Approved",
    userId: "u3",
    productName: "Banner 3x2m",
    quantity: 50,
  },
  {
    id: "QT-2025-0722-008",
    clientName: "Pixel Studio",
    contactPerson: "Isabella Taylor",
    date: "2025-07-22",
    amount: 750.0,
    status: "Rejected",
    userId: "u1",
    productName: "Brochure",
    quantity: 1000,
  },
  {
    id: "QT-2025-0722-009",
    clientName: "Bright Ideas Co.",
    contactPerson: "James Anderson",
    date: "2025-07-22",
    amount: 640.5,
    status: "Approved",
    userId: "u2",
    productName: "Menu Card",
    quantity: 700,
  },
  {
    id: "QT-2025-0723-010",
    clientName: "Visionary Prints",
    contactPerson: "Mia Harris",
    date: "2025-07-23",
    amount: 980.75,
    status: "Pending",
    userId: "u3",
    productName: "Catalogue",
    quantity: 150,
  },
];


export interface ClientRow {
  id: string;
  displayId?: string;  // Optional display ID for formatted display
  clientType: 'Individual' | 'Company';
  companyName: string;
  contactPerson: string;
  firstName?: string;
  lastName?: string;
  designation?: string;  // New field for designation
  email: string;
  emails?: string;       // New field for multiple emails (JSON array)
  phone: string;
  countryCode?: string;
  role?: string;
  trn?: string;          // New field for Tax Registration Number
  hasNoTrn?: number;     // New field for "No TRN" option (0 = false, 1 = true)
  address?: string;
  city?: string;
  area?: string;         // New field for Area (replaces city for delivery)
  state?: string;
  postalCode?: string;
  country?: string;
  additionalInfo?: string;
  status: "Active" | "Inactive";
  createdAt?: string;  // ISO date string for database operations
  updatedAt?: string;  // ISO date string for database operations
  // Database-related properties
  _count?: { quotes: number };
  quotes?: any[];
}

export const clients: ClientRow[] = [
  { id: "C-001", displayId: "C-001", clientType: "Company", companyName: "Eagan Inc.",      contactPerson: "John Eagan",  firstName: "John", lastName: "Eagan", email: "john.e@eagan.com",     phone: "50 123 4567", countryCode: "+971", role: "CEO", address: "Sheikh Zayed Road, Business Bay", city: "Dubai", state: "Dubai", postalCode: "12345", country: "UAE", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-002", displayId: "C-002", clientType: "Company", companyName: "Maxtion Dev",     contactPerson: "Liam Park",   firstName: "Liam", lastName: "Park", email: "liam@maxtion.dev",     phone: "50 222 3344", countryCode: "+971", role: "CTO", address: "Sheikh Zayed Road, Business Bay", city: "Dubai", state: "Dubai", postalCode: "12346", country: "UAE", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-003", displayId: "C-003", clientType: "Company", companyName: "Candor Ltd",      contactPerson: "Alice Tan",   firstName: "Alice", lastName: "Tan", email: "alice@candor.co",      phone: "50 333 7788", countryCode: "+971", role: "Manager", address: "Sheikh Zayed Road, Business Bay", city: "Dubai", state: "Dubai", postalCode: "12347", country: "UAE", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-004", displayId: "C-004", clientType: "Company", companyName: "Delta Co.",       contactPerson: "Jin Woo",     firstName: "Jin", lastName: "Woo", email: "jin@delta.co",         phone: "50 994 1100", countryCode: "+971", role: "Director", address: "Sheikh Zayed Road, Business Bay", city: "Dubai", state: "Dubai", postalCode: "12348", country: "UAE", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-005", displayId: "C-005", clientType: "Company", companyName: "Echo GmbH",       contactPerson: "Lena Meyer",  firstName: "Lena", lastName: "Meyer", email: "lena@echo.de",         phone: "160 111 2223", countryCode: "+49", role: "Manager", address: "123 Main Street", city: "Mumbai", state: "Maharashtra", postalCode: "400001", country: "India", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-006", displayId: "C-006", clientType: "Company", companyName: "Foxtrot BV",      contactPerson: "Tariq Aziz",  firstName: "Tariq", lastName: "Aziz", email: "tariq@foxtrot.nl",     phone: "6 1234 5678", countryCode: "+31", role: "CEO", address: "123 Main Street", city: "Delhi", state: "Delhi", postalCode: "110001", country: "India", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-007", displayId: "C-007", clientType: "Company", companyName: "Gamma LLC",       contactPerson: "Sara Gomez",  firstName: "Sara", lastName: "Gomez", email: "sara@gammallc.com",    phone: "415 555 1212", countryCode: "+1", role: "Manager", address: "123 Main Street", city: "Bangalore", state: "Karnataka", postalCode: "560001", country: "India", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-008", displayId: "C-008", clientType: "Company", companyName: "Helios Pte",      contactPerson: "Mei Lin",     firstName: "Mei", lastName: "Lin", email: "mei@helios.sg",        phone: "8123 4567", countryCode: "+65", role: "Director", address: "123 Main Street", city: "Chennai", state: "Tamil Nadu", postalCode: "600001", country: "India", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-009", displayId: "C-009", clientType: "Company", companyName: "Iris Studio",     contactPerson: "Rani Putri",  firstName: "Rani", lastName: "Putri", email: "rani@iris.studio",     phone: "812 3456 7890", countryCode: "+62", role: "Owner", address: "Jl. Sudirman No. 123", city: "Jakarta", state: "Jakarta", postalCode: "12190", country: "Indonesia", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-010", displayId: "C-010", clientType: "Company", companyName: "Juno Sdn Bhd",    contactPerson: "Farid Shah",  firstName: "Farid", lastName: "Shah", email: "farid@juno.my",        phone: "12 345 6789", countryCode: "+60", role: "Manager", address: "Jl. Sudirman No. 123", city: "Surabaya", state: "East Java", postalCode: "60111", country: "Indonesia", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },

  { id: "C-011", displayId: "C-011", clientType: "Company", companyName: "Kappa Inc",       contactPerson: "Becky Lee",   firstName: "Becky", lastName: "Lee", email: "becky@kappa.com",      phone: "6123 4567", countryCode: "+852", role: "CEO", address: "Jl. Sudirman No. 123", city: "Bandung", state: "West Java", postalCode: "40111", country: "Indonesia", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-012", displayId: "C-012", clientType: "Company", companyName: "Lumen Labs",      contactPerson: "Jorge Ruiz",  firstName: "Jorge", lastName: "Ruiz", email: "jorge@lumenlabs.io",   phone: "655 111 222", countryCode: "+34", role: "CTO", address: "Jl. Sudirman No. 123", city: "Medan", state: "North Sumatra", postalCode: "20111", country: "Indonesia", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-013", displayId: "C-013", clientType: "Company", companyName: "Mango Corp",      contactPerson: "Dani So",     firstName: "Dani", lastName: "So", email: "dani@mango.com",       phone: "10 2345 6789", countryCode: "+82", role: "Manager", address: "Jl. Sudirman No. 123", city: "Semarang", state: "Central Java", postalCode: "50111", country: "Indonesia", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-014", displayId: "C-014", clientType: "Company", companyName: "Nexus Ltd",       contactPerson: "Ken Wong",    firstName: "Ken", lastName: "Wong", email: "ken@nexus.hk",         phone: "5123 9876", countryCode: "+852", role: "Director", address: "Jl. Sudirman No. 123", city: "Palembang", state: "South Sumatra", postalCode: "30111", country: "Indonesia", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-015", displayId: "C-015", clientType: "Company", companyName: "Orion SA",        contactPerson: "Pierre Lac",  firstName: "Pierre", lastName: "Lac", email: "pierre@orion.fr",      phone: "6 12 34 56 78", countryCode: "+33", role: "Manager", address: "Jl. Sudirman No. 123", city: "Makassar", state: "South Sulawesi", postalCode: "90111", country: "Indonesia", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-016", displayId: "C-016", clientType: "Company", companyName: "Pluto LLP",       contactPerson: "Wira Adi",    firstName: "Wira", lastName: "Adi", email: "wira@pluto.com",      phone: "813 7777 1212", countryCode: "+62", role: "Owner", address: "Jl. Sudirman No. 123", city: "Yogyakarta", state: "Special Region of Yogyakarta", postalCode: "55111", country: "Indonesia", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-017", displayId: "C-017", clientType: "Company", companyName: "Quark AB",        contactPerson: "Anders B",    firstName: "Anders", lastName: "B", email: "anders@quark.se",      phone: "70 123 4567", countryCode: "+46", role: "CEO", address: "123 Main Street", city: "Kolkata", state: "West Bengal", postalCode: "700001", country: "India", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-018", displayId: "C-018", clientType: "Company", companyName: "Radian BV",       contactPerson: "Ivo K",       firstName: "Ivo", lastName: "K", email: "ivo@radian.eu",        phone: "6 8765 4321", countryCode: "+31", role: "Manager", address: "123 Main Street", city: "Hyderabad", state: "Telangana", postalCode: "500001", country: "India", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-019", displayId: "C-019", clientType: "Company", companyName: "Sigma Oy",        contactPerson: "Tiina K",     firstName: "Tiina", lastName: "K", email: "tiina@sigma.fi",       phone: "40 123 4567", countryCode: "+358", role: "Director", address: "123 Main Street", city: "Pune", state: "Maharashtra", postalCode: "411001", country: "India", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-020", displayId: "C-020", clientType: "Company", companyName: "Titan Pty",       contactPerson: "Noah Reed",   firstName: "Noah", lastName: "Reed", email: "noah@titan.au",        phone: "412 345 678", countryCode: "+61", role: "Owner", address: "123 Main Street", city: "Ahmedabad", state: "Gujarat", postalCode: "380001", country: "India", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },

  { id: "C-021", displayId: "C-021", clientType: "Company", companyName: "Umbra SAS",       contactPerson: "Luc Martin",  firstName: "Luc", lastName: "Martin", email: "luc@umbra.fr",         phone: "6 99 88 77 66", countryCode: "+33", role: "Manager", address: "Jl. Sudirman No. 123", city: "Malang", state: "East Java", postalCode: "65111", country: "Indonesia", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-022", displayId: "C-022", clientType: "Company", companyName: "Vega NV",         contactPerson: "Eva Jans",    firstName: "Eva", lastName: "Jans", email: "eva@vega.be",          phone: "470 12 34 56", countryCode: "+32", role: "CEO", address: "Jl. Sudirman No. 123", city: "Tangerang", state: "Banten", postalCode: "15111", country: "Indonesia", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-023", displayId: "C-023", clientType: "Company", companyName: "Wave GmbH",       contactPerson: "Jonas K",     firstName: "Jonas", lastName: "K", email: "jonas@wave.de",        phone: "171 234 5678", countryCode: "+49", role: "CTO", address: "Jl. Sudirman No. 123", city: "Depok", state: "West Java", postalCode: "16411", country: "Indonesia", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-024", displayId: "C-024", clientType: "Company", companyName: "Xenon KK",        contactPerson: "Akira Mori",  firstName: "Akira", lastName: "Mori", email: "akira@xenon.co.jp",    phone: "90 1234 5678", countryCode: "+81", role: "Manager", address: "Jl. Sudirman No. 123", city: "Bekasi", state: "West Java", postalCode: "17111", country: "Indonesia", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-025", displayId: "C-025", clientType: "Individual", companyName: "",             contactPerson: "Holly Brown", firstName: "Holly", lastName: "Brown", email: "holly@yonder.uk",      phone: "7700 900123", countryCode: "+44", role: "", address: "Jl. Sudirman No. 123", city: "Bogor", state: "West Java", postalCode: "16111", country: "Indonesia", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-026", displayId: "C-026", clientType: "Individual", companyName: "",             contactPerson: "Owen Hale",   firstName: "Owen", lastName: "Hale", email: "owen@zephyr.co",       phone: "85 123 4567", countryCode: "+353", role: "", address: "Jl. Sudirman No. 123", city: "Cimahi", state: "West Java", postalCode: "40511", country: "Indonesia", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-027", displayId: "C-027", clientType: "Company", companyName: "Artemis LLC",     contactPerson: "Mia Chen",    firstName: "Mia", lastName: "Chen", email: "mia@artemis.com",      phone: "650 555 9988", countryCode: "+1", role: "Manager", address: "123 Main Street", city: "Jaipur", state: "Rajasthan", postalCode: "302001", country: "India", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-028", displayId: "C-028", clientType: "Company", companyName: "Basil AG",        contactPerson: "Felix H",     firstName: "Felix", lastName: "H", email: "felix@basil.ch",       phone: "79 123 45 67", countryCode: "+41", role: "CEO", address: "123 Main Street", city: "Lucknow", state: "Uttar Pradesh", postalCode: "226001", country: "India", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-029", displayId: "C-029", clientType: "Company", companyName: "Corex Inc.",      contactPerson: "Ravi Patel",  firstName: "Ravi", lastName: "Patel", email: "ravi@corex.com",       phone: "408 555 4321", countryCode: "+1", role: "Manager", address: "123 Main Street", city: "Kanpur", state: "Uttar Pradesh", postalCode: "208001", country: "India", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
  { id: "C-030", displayId: "C-030", clientType: "Company", companyName: "Dorian SpA",      contactPerson: "Marco Rossi", firstName: "Marco", lastName: "Rossi", email: "marco@dorian.it",      phone: "347 123 4567", countryCode: "+39", role: "Manager", address: "123 Main Street", city: "Nagpur", state: "Maharashtra", postalCode: "440001", country: "India", status: "Active", createdAt: "2025-06-25", updatedAt: "2025-06-25" },
];

export type CostUnit = "per_sheet" | "per_packet" | "per_kg";

export interface MaterialRow {
  id: string;
  material: string;   // e.g. "Art Paper 300gsm"
  gsm?: string;       // GSM value (e.g., "300", "150", "80")
  supplier: string;   // e.g. "Paper Source LLC"
  cost: number;       // numeric value, e.g. 0.5
  unit: CostUnit;     // "per_sheet" | "per_packet" | "per_kg"
  lastUpdated: string; // ISO date: "2025-07-22"
  status: "Active" | "Inactive"; // Active by default
}

export const materials: MaterialRow[] = [
  { id: "M-001", material: "Art Paper", gsm: "300", supplier: "Paper Source LLC", cost: 0.5, unit: "per_sheet", lastUpdated: "2025-07-22", status: "Active" },
  { id: "M-002", material: "Art Paper", gsm: "150", supplier: "Paper Source LLC", cost: 0.18, unit: "per_sheet", lastUpdated: "2025-07-20", status: "Active" },
  { id: "M-003", material: "Ivory", gsm: "230", supplier: "Apex Papers", cost: 0.27, unit: "per_sheet", lastUpdated: "2025-07-18", status: "Active" },
  { id: "M-004", material: "HVS", gsm: "100", supplier: "Apex Papers", cost: 3.2, unit: "per_kg", lastUpdated: "2025-07-18", status: "Active" },
  { id: "M-005", material: "Matte Lamination", supplier: "Coat & Lam", cost: 0.09, unit: "per_sheet", lastUpdated: "2025-07-15", status: "Active" },
  { id: "M-006", material: "Gloss Lamination", supplier: "Coat & Lam", cost: 0.08, unit: "per_sheet", lastUpdated: "2025-07-15", status: "Active" },
  { id: "M-007", material: "Foil Gold Roll", supplier: "FoilCraft", cost: 18, unit: "per_kg", lastUpdated: "2025-07-14", status: "Active" },
  { id: "M-008", material: "UV Spot Chemical", supplier: "PrintChem", cost: 12.5, unit: "per_kg", lastUpdated: "2025-07-14", status: "Active" },
  { id: "M-009", material: "Die-Cut Blades", supplier: "CutPro Tools", cost: 45, unit: "per_packet", lastUpdated: "2025-07-10", status: "Active" },
  { id: "M-010", material: "CTP Plate", supplier: "PlateWorks", cost: 3.9, unit: "per_sheet", lastUpdated: "2025-07-09", status: "Active" },
  { id: "M-011", material: "Ink CMYK Set", supplier: "Inkwell", cost: 22, unit: "per_kg", lastUpdated: "2025-07-08", status: "Active" },
  { id: "M-012", material: "Binding Glue", supplier: "BindCo", cost: 7.5, unit: "per_kg", lastUpdated: "2025-07-06", status: "Active" },
];

export const unitLabel = (u: CostUnit) =>
  u === "per_sheet" ? "/ sheet" : u === "per_packet" ? "/ packet" : "/ kg";