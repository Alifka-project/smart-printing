import type { QuoteFormData } from "@/types";

type PreviousQuoteFull = {
  id: string;
  date: string;         
  label?: string;        
  form: QuoteFormData;   
};


const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

export const previousQuotesFull: PreviousQuoteFull[] = [
  {
    id: "QT-2025-0718",
    date: "2025-07-18",
    label: "Eagan Inc. — Business Card",
    form: {
      client: {
        clientType: "Company",
        companyName: "Eagan Inc.",
        contactPerson: "John Eagan",
        email: "john.e@eagan.com",
        phone: "+971501234567",
        countryCode: "+971",
        role: "Procurement",
      },
      products: [
        {
          productName: "Business Card",
          paperName: "Art Book",
          quantity: 1000,
          sides: "1",
          printingSelection: "Digital",
          flatSize: { width: 9, height: 5.5, spine: null },
          closeSize: { width: 9, height: 5.5, spine: null },
          useSameAsFlat: true,
          papers: [{ name: "Art Paper", gsm: "300" }],
          finishing: ["UV Spot", "Lamination"],
        },
      ],
      operational: {
        papers: [
          {
            inputWidth: 65,
            inputHeight: 90,
            pricePerPacket: 240,
            sheetsPerPacket: 500,
            recommendedSheets: 125,
            enteredSheets: 125,
            outputWidth: null,
            outputHeight: null,
          },
        ],
        finishing: [
          { name: "UV Spot", cost: 20 },
          { name: "Lamination", cost: 15 },
        ],
        plates: 4,
        units: 5000,
      },
      calculation: {
        basePrice: 0,
        marginAmount: 0,
        subtotal: 0,
        vatAmount: 0,
        totalPrice: 0,
      },
    },
  },
  {
    id: "QT-2025-0717",
    date: "2025-07-17",
    label: "Maxtion Dev — Flyer A5",
    form: {
      client: {
        clientType: "Company",
        companyName: "Maxtion Dev",
        contactPerson: "Liam Park",
        email: "liam@maxtion.dev",
        phone: "+971509876543",
        countryCode: "+971",
        role: "Buyer",
      },
      products: [
        {
          productName: "Flyer",
          paperName: "Art Book",
          quantity: 5000,
          sides: "2",
          printingSelection: "Offset",
          flatSize: { width: 21, height: 14.8, spine: null }, // A5 cm
          closeSize: { width: 21, height: 14.8, spine: null },
          useSameAsFlat: true,
          papers: [
            { name: "Art Paper", gsm: "150" },
          ],
          finishing: ["UV Spot"],
        },
      ],
      operational: {
        papers: [
          {
            inputWidth: 65,
            inputHeight: 90,
            pricePerPacket: 180,
            sheetsPerPacket: 500,
            recommendedSheets: 600,
            enteredSheets: 610,
            outputWidth: null,
            outputHeight: null,
          },
        ],
        finishing: [{ name: "UV Spot", cost: 35 }],
        plates: 4,
        units: 10000,
      },
      calculation: {
        basePrice: 0,
        marginAmount: 0,
        subtotal: 0,
        vatAmount: 0,
        totalPrice: 0,
      },
    },
  },
];

export const getPreviousQuoteFormById = (id: string): QuoteFormData | undefined => {
  const found = previousQuotesFull.find((q) => q.id === id);
  return found ? deepClone(found.form) : undefined;
};