// lib/detail-to-form.ts
import type { QuoteDetail, QuoteFormData, Product } from "@/types";

export function detailToForm(detail: QuoteDetail, prev: QuoteFormData): QuoteFormData {
  const product: Product = {
    productName: detail.product,
    paperName: detail.papers[0]?.name ?? "",
    quantity: detail.quantity,
    sides: detail.sides,
    printingSelection: detail.printing as Product["printingSelection"],
    // kalau punya default size dari prev, pertahankan
    flatSize: prev.products[0]?.flatSize ?? { width: null, height: null, spine: null },
    closeSize: prev.products[0]?.closeSize ?? { width: null, height: null, spine: null },
    useSameAsFlat: prev.products[0]?.useSameAsFlat ?? false,
    papers: detail.papers,
    finishing: detail.finishing,
  };

  return {
    ...prev,
    client: {
      clientType: detail.client.clientType,
      companyName: detail.client.companyName,
      firstName: detail.client.firstName,
      lastName: detail.client.lastName,
      designation: detail.client.designation,
      contactPerson: detail.client.contactPerson,
      email: detail.client.email,
      emails: detail.client.emails,
      phone: detail.client.phone,
      countryCode: detail.client.countryCode,
      role: detail.client.role,
      trn: detail.client.trn,
      hasNoTrn: detail.client.hasNoTrn,
      address: detail.client.address,
      city: detail.client.city,
      area: detail.client.area,
      state: detail.client.state,
      postalCode: detail.client.postalCode,
      country: detail.client.country,
    },
    products: [product],
    // biarkan kalkulasi dihitung ulang oleh useEffect kamu
  };
}
