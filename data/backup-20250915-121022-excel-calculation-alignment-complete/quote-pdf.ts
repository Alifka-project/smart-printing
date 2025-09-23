// lib/quote-pdf.ts
import type { QuoteFormData } from "@/types";

export interface OtherQty {
  productName: string;
  quantity: number | "";
  price: number | "";
}

const currency = (n: number) =>
  new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

type JsPDFModule = typeof import("jspdf");
type AutoTableModule = typeof import("jspdf-autotable");
type JsPDFInstance = InstanceType<JsPDFModule["jsPDF"]>;
type JsPdfWithAutoTable = JsPDFInstance & {
  lastAutoTable?: { finalY: number };
};

const getFinalY = (doc: JsPdfWithAutoTable, fallback: number): number =>
  typeof doc.lastAutoTable?.finalY === "number" ? doc.lastAutoTable.finalY : fallback;

// Helper function to calculate price for other quantities
const calculateOtherQtyPrice = (formData: QuoteFormData, otherQty: OtherQty) => {
  const baseProduct = formData.products.find(p => p.productName === otherQty.productName);
  if (!baseProduct || !baseProduct.quantity || !otherQty.quantity) return { base: 0, vat: 0, total: 0 };

  // Use the calculation from formData if available, otherwise calculate
  if (formData.calculation && formData.calculation.totalPrice > 0) {
    const quantityRatio = (otherQty.quantity as number) / (baseProduct.quantity || 1);
    const basePrice = formData.calculation.subtotal * quantityRatio;
    const vat = basePrice * 0.05;
    const total = basePrice + vat;
    return { base: basePrice, vat, total };
  }

  // Fallback calculation if formData.calculation is not available
  const quantityRatio = (otherQty.quantity as number) / baseProduct.quantity;
  
  // 1. Paper Costs (price per sheet × entered sheets)
  const paperCost = formData.operational.papers.reduce((total, p) => {
    const pricePerSheet = (p.pricePerPacket || 0) / (p.sheetsPerPacket || 1);
    const actualSheetsNeeded = p.enteredSheets || 0;
    return total + (pricePerSheet * actualSheetsNeeded);
  }, 0) * quantityRatio;

  // 2. Plates Cost (per plate, using Excel standard)
  const PLATE_COST_PER_PLATE = 120; // Excel standard plate cost
  const platesCost = (formData.operational.plates || 0) * PLATE_COST_PER_PLATE * quantityRatio;

  // 3. Finishing Costs (cost per unit × actual units needed)
  const actualUnitsNeeded = (formData.operational.units || baseProduct.quantity || 0) * quantityRatio;
  const finishingCost = formData.operational.finishing.reduce((total, f) => {
    if (baseProduct.finishing.includes(f.name)) {
      return total + ((f.cost || 0) * actualUnitsNeeded);
    }
    return total;
  }, 0);

  // 4. Calculate base price and add margin (15% aligned with Step 5)
  const MARGIN_PERCENTAGE = 0.15;
  const basePrice = paperCost + platesCost + finishingCost;
  const marginAmount = basePrice * MARGIN_PERCENTAGE;
  const subtotal = basePrice + marginAmount;
  
  // 5. Calculate VAT on subtotal (5% like in UI)
  const vat = subtotal * 0.05;
  const total = subtotal + vat;
  
  return { base: subtotal, vat, total };
};

// Helper function to calculate main product price
const calculateMainProductPrice = (formData: QuoteFormData, product: QuoteFormData["products"][0]) => {
  if (!product || !product.quantity) {
    return { base: 0, vat: 0, total: 0 };
  }

  // Use the calculation from formData if available, otherwise calculate
  if (formData.calculation && formData.calculation.totalPrice > 0) {
    // Distribute the total calculation proportionally among products
    const totalProducts = formData.products.length;
    const basePrice = formData.calculation.subtotal / totalProducts;
    const vat = basePrice * 0.05;
    const total = basePrice + vat;
    return { base: basePrice, vat, total };
  }

  // Fallback calculation if formData.calculation is not available
  // 1. Paper Costs (price per sheet × entered sheets)
  const paperCost = formData.operational.papers.reduce((total, p) => {
    const pricePerSheet = (p.pricePerPacket || 0) / (p.sheetsPerPacket || 1);
    const actualSheetsNeeded = p.enteredSheets || 0;
    return total + (pricePerSheet * actualSheetsNeeded);
  }, 0);

  // 2. Plates Cost (per plate, using Excel standard)
  const PLATE_COST_PER_PLATE = 120; // Excel standard plate cost
  const platesCost = (formData.operational.plates || 0) * PLATE_COST_PER_PLATE;

  // 3. Finishing Costs (cost per unit × actual units needed)
  const actualUnitsNeeded = formData.operational.units || product.quantity || 0;
  const finishingCost = formData.operational.finishing.reduce((total, f) => {
    if (product.finishing.includes(f.name)) {
      return total + ((f.cost || 0) * actualUnitsNeeded);
    }
    return total;
  }, 0);

  // 4. Calculate base price and add margin (15% aligned with Step 5)
  const MARGIN_PERCENTAGE = 0.15;
  const basePrice = paperCost + platesCost + finishingCost;
  const marginAmount = basePrice * MARGIN_PERCENTAGE;
  const subtotal = basePrice + marginAmount;
  
  // 5. Calculate VAT on subtotal (5% like in UI)
  const vat = subtotal * 0.05;
  const total = subtotal + vat;
  
  return { base: subtotal, vat, total };
};

export async function downloadCustomerPdf(
  formData: QuoteFormData,
  otherQuantities: OtherQty[]
) {
  try {
    const { jsPDF } = (await import("jspdf")) as JsPDFModule;
    const autoTable = (await import("jspdf-autotable")).default as AutoTableModule["default"];

    const doc: JsPdfWithAutoTable = new jsPDF();

    // Validate form data
    if (!formData.products || formData.products.length === 0) {
      throw new Error("No products found in form data");
    }

    // Format date to match the image format (M/D/YYYY)
    const today = new Date();
    const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

    // Set document properties
    doc.setProperties({
      title: "Quotation - Customer Copy",
      subject: "Printing Services Quotation",
      author: "Smart Printing Solutions",
      creator: "Smart Printing Quotation System"
    });

    // ============================================================================
    // PROFESSIONAL HEADER SECTION - CLEAN DESIGN
    // ============================================================================
    // Clean header background
    doc.setFillColor(248, 250, 252); // Light gray background
    doc.rect(0, 0, 210, 50, 'F');
    
    // Professional accent line
    doc.setFillColor(30, 64, 175); // Professional blue
    doc.rect(0, 0, 210, 3, 'F');
    
    // Company branding
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text("SMART PRINTING SOLUTIONS", 20, 20);
    
    // Professional tagline
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text("Professional Printing & Design Services", 20, 28);
    
    // Quote information box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.roundedRect(140, 10, 55, 30, 3, 3, 'FD');
    
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("QUOTATION", 167.5, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Quote #: Q-001`, 167.5, 28, { align: 'center' });
    doc.text(`Date: ${formattedDate}`, 167.5, 35, { align: 'center' });

    // Clean separator line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, 50, 190, 50);

    // ============================================================================
    // CLIENT INFORMATION SECTION - CLEAN CARD DESIGN
    // ============================================================================
    let currentY = 65;
    
    // Clean card background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(20, currentY, 170, 50, 5, 5, 'FD');
    
    // Section title
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("CLIENT INFORMATION", 25, currentY + 12);
    
    // Client details with clean layout
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const clientDetailsY = currentY + 22;
    
    // Left column - labels
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('Company:', 25, clientDetailsY);
    doc.text('Contact Person:', 25, clientDetailsY + 7);
    doc.text('Email:', 25, clientDetailsY + 14);
    doc.text('Phone:', 25, clientDetailsY + 21);
    
    // Right column - values
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(formData.client.companyName || '—', 70, clientDetailsY);
    doc.text(formData.client.contactPerson || '—', 70, clientDetailsY + 7);
    
    // Handle multiple emails
    let emailText = formData.client.email || '—';
    if (formData.client.emails) {
      try {
        const emails = JSON.parse(formData.client.emails);
        if (Array.isArray(emails) && emails.length > 1) {
          emailText = `${formData.client.email} +${emails.length - 1} more`;
        }
      } catch (error) {
        // If parsing fails, use the primary email
        emailText = formData.client.email || '—';
      }
    }
    doc.text(emailText, 70, clientDetailsY + 14);
    
    doc.text(`${formData.client.countryCode || ''} ${formData.client.phone || '—'}`, 70, clientDetailsY + 21);
    
    // TRN information
    if (formData.client.trn && !formData.client.hasNoTrn) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('TRN:', 70, clientDetailsY + 28);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(formData.client.trn, 85, clientDetailsY + 28);
    }
    
    // Address in right column
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('Address:', 110, clientDetailsY);
    doc.text('Area, State:', 110, clientDetailsY + 7);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const address = formData.client.address || '—';
    if (address.length > 25) {
      doc.text(address.substring(0, 25) + '...', 140, clientDetailsY);
    } else {
      doc.text(address, 140, clientDetailsY);
    }
    
    const location = `${formData.client.area || formData.client.city || '—'}, ${formData.client.state || '—'}`;
    doc.text(location, 140, clientDetailsY + 7);

    // ============================================================================
    // PRODUCT SPECIFICATIONS SECTION
    // ============================================================================
    currentY += 60;
    
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(20, currentY, 170, 45, 5, 5, 'FD');
    
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("PRODUCT SPECIFICATIONS", 25, currentY + 12);
    
    // Clean product specs table
    const productSpecsBody = formData.products.flatMap((product, index) => [
      [`Product ${index + 1}`, product.productName || "—"],
      [`Quantity`, String(product.quantity || 0)],
      [`Printing Method`, product.printingSelection || "—"],
      [`Sides`, product.sides || "—"],
      [
        `Flat Size (Open)`,
        `${product.flatSize?.width ?? "—"} × ${product.flatSize?.height ?? "—"} cm`,
      ],
      [
        `Close Size (Closed)`,
        product.useSameAsFlat ? "Same as Flat Size" : `${product.closeSize?.width ?? "—"} × ${product.closeSize?.height ?? "—"} cm`,
      ],
      [`Front Colors`, product.colors?.front || "—"],
      [`Back Colors`, product.colors?.back || "—"],
      [`Paper Type`, product.paperName || "—"],
      [`Finishing`, product.finishing?.length ? product.finishing.join(", ") : "—"],
      [`Finishing Comments`, product.finishingComments || "—"],
    ]);

    autoTable(doc, {
      startY: currentY + 20,
      head: [["Specification", "Details"]],
      body: productSpecsBody,
      styles: { 
        fontSize: 9,
        cellPadding: 4,
        lineColor: [226, 232, 240],
        lineWidth: 0.3,
        textColor: [71, 85, 105],
        halign: 'left'
      },
      headStyles: { 
        fillColor: [248, 250, 252],
        textColor: [30, 64, 175],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'left'
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: 25, right: 25 },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold', textColor: [100, 116, 139] },
        1: { cellWidth: 100, textColor: [15, 23, 42] }
      },
      tableWidth: 'wrap'
    });

    // ============================================================================
    // PRICING TABLE - CLEAN AND PROFESSIONAL
    // ============================================================================
    const pricingY = getFinalY(doc, currentY + 20) + 15;
    
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(20, pricingY, 170, 35, 5, 5, 'FD');
    
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("PRICING BREAKDOWN", 25, pricingY + 12);

    const mainProductsBody = formData.products.map(product => {
      try {
        const prices = calculateMainProductPrice(formData, product);
        return [
          product.productName || "—",
          String(product.quantity || 0),
          currency(prices.base),
          currency(prices.vat),
          currency(prices.total),
        ];
      } catch (error) {
        console.error("Error calculating price for product:", product, error);
        return [
          product.productName || "—",
          String(product.quantity || 0),
          "Error",
          "Error",
          "Error",
        ];
      }
    });

    autoTable(doc, {
      startY: pricingY + 20,
      head: [["Product", "Qty", "Base Price", "VAT (5%)", "Total"]],
      body: mainProductsBody,
      styles: { 
        fontSize: 10,
        cellPadding: 5,
        lineColor: [226, 232, 240],
        lineWidth: 0.3,
        textColor: [71, 85, 105]
      },
      headStyles: { 
        fillColor: [248, 250, 252],
        textColor: [30, 64, 175],
        fontStyle: 'bold',
        fontSize: 11,
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: 25, right: 25 },
      columnStyles: {
        0: { cellWidth: 50, halign: 'left', fontStyle: 'bold' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 30, halign: 'right', textColor: [16, 185, 129] },
        3: { cellWidth: 25, halign: 'right', textColor: [239, 68, 68] },
        4: { cellWidth: 30, halign: 'right', fontStyle: 'bold', textColor: [30, 64, 175] }
      }
    });

    // ============================================================================
    // PAPER SPECIFICATIONS TABLE - IF AVAILABLE
    // ============================================================================
    if (formData.operational.papers?.length) {
      const paperY = getFinalY(doc, pricingY + 20) + 15;
      
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(20, paperY, 170, 35, 5, 5, 'FD');
      
      doc.setTextColor(30, 64, 175);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("PAPER SPECIFICATIONS", 25, paperY + 12);

      autoTable(doc, {
        startY: paperY + 20,
        head: [["Paper", "Type", "Dimensions", "Sheets/Pack", "Price/Pack", "Required", "Output"]],
        body: formData.operational.papers.map((pp, i) => [
          String(i + 1),
          formData.products[0]?.papers?.[i]?.name || "Standard",
          `${pp.inputWidth ?? "—"} × ${pp.inputHeight ?? "—"} cm`,
          String(pp.sheetsPerPacket ?? "—"),
          typeof pp.pricePerPacket === "number" ? currency(pp.pricePerPacket) : "—",
          String(pp.enteredSheets ?? "—"),
          `${pp.outputWidth ?? "—"} × ${pp.outputHeight ?? "—"} cm`,
        ]),
        styles: { 
          fontSize: 8,
          cellPadding: 3,
          lineColor: [226, 232, 240],
          lineWidth: 0.3,
          textColor: [71, 85, 105]
        },
        headStyles: { 
          fillColor: [248, 250, 252],
          textColor: [30, 64, 175],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        margin: { left: 25, right: 25 },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 25, halign: 'left' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 22, halign: 'right', textColor: [16, 185, 129] },
          5: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
          6: { cellWidth: 25, halign: 'center' }
        }
      });
    }

    // ============================================================================
    // FINISHING SPECIFICATIONS TABLE - IF AVAILABLE
    // ============================================================================
    if (formData.operational.finishing?.length) {
      const finishingY = getFinalY(doc, pricingY + 20) + 15;
      const selectedFin = formData.operational.finishing.filter((f) => 
        formData.products.some(product => product.finishing.includes(f.name))
      );
      
      if (selectedFin.length) {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(20, finishingY, 170, 35, 5, 5, 'FD');
        
        doc.setTextColor(30, 64, 175);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("FINISHING SPECIFICATIONS", 25, finishingY + 12);

        autoTable(doc, {
          startY: finishingY + 20,
          head: [["Process", "Cost/Unit", "Units", "Total Cost", "Notes"]],
          body: selectedFin.map((f) => [
            f.name,
            typeof f.cost === "number" ? currency(f.cost) : "—",
            formData.operational.units ? String(formData.operational.units) : "—",
            typeof f.cost === "number" && formData.operational.units
              ? currency(f.cost * formData.operational.units)
              : "—",
            getFinishingInstructions(f.name)
          ]),
          styles: { 
            fontSize: 8,
            cellPadding: 3,
            lineColor: [226, 232, 240],
            lineWidth: 0.3,
            textColor: [71, 85, 105]
          },
          headStyles: { 
            fillColor: [248, 250, 252],
            textColor: [30, 64, 175],
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'center'
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251]
          },
          margin: { left: 25, right: 25 },
          columnStyles: {
            0: { cellWidth: 35, halign: 'left', fontStyle: 'bold' },
            1: { cellWidth: 25, halign: 'right', textColor: [16, 185, 129] },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 25, halign: 'right', fontStyle: 'bold', textColor: [30, 64, 175] },
            4: { cellWidth: 50, halign: 'left', fontSize: 7 }
          }
        });
      }
    }

    // ============================================================================
    // FINISHING COMMENTS SECTION - IF AVAILABLE
    // ============================================================================
    const finishingComments = formData.products
      .filter(product => product.finishingComments && product.finishingComments.trim())
      .map(product => `${product.productName || 'Product'}: ${product.finishingComments}`);
    
    if (finishingComments.length > 0) {
      const commentsY = getFinalY(doc, pricingY + 20) + 15;
      
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(20, commentsY, 170, 35, 5, 5, 'FD');
      
      doc.setTextColor(30, 64, 175);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("FINISHING COMMENTS", 25, commentsY + 12);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      
      finishingComments.forEach((comment, index) => {
        doc.text(comment, 25, commentsY + 22 + (index * 8));
      });
    }

    // ============================================================================
    // OTHER QUANTITIES TABLE - IF AVAILABLE
    // ============================================================================
    if (otherQuantities.length > 0) {
      const otherQtyY = getFinalY(doc, pricingY + 20) + 15;
      
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(20, otherQtyY, 170, 35, 5, 5, 'FD');
      
      doc.setTextColor(30, 64, 175);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("ADDITIONAL QUANTITIES", 25, otherQtyY + 12);
      
      autoTable(doc, {
        startY: otherQtyY + 20,
        head: [["Product", "Quantity", "Base Price", "VAT (5%)", "Total"]],
        body: otherQuantities.map((o) => {
          try {
            const prices = calculateOtherQtyPrice(formData, o);
            return [
              o.productName || "—",
              String(o.quantity || 0),
              currency(prices.base),
              currency(prices.vat),
              currency(prices.total),
            ];
          } catch (error) {
            console.error("Error calculating price for other quantity:", o, error);
            return [
              o.productName || "—",
              String(o.quantity || 0),
              "Error",
              "Error",
              "Error",
            ];
          }
        }),
        styles: { 
          fontSize: 10,
          cellPadding: 5,
          lineColor: [226, 232, 240],
          lineWidth: 0.3,
          textColor: [71, 85, 105]
        },
        headStyles: { 
          fillColor: [248, 250, 252],
          textColor: [30, 64, 175],
          fontStyle: 'bold',
          fontSize: 11,
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        margin: { left: 25, right: 25 },
        columnStyles: {
          0: { cellWidth: 50, halign: 'left', fontStyle: 'bold' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 30, halign: 'right', textColor: [16, 185, 129] },
          3: { cellWidth: 25, halign: 'right', textColor: [239, 68, 68] },
          4: { cellWidth: 30, halign: 'right', fontStyle: 'bold', textColor: [30, 64, 175] }
        }
      });
    }

    // ============================================================================
    // PRICING SUMMARY SECTION - PROFESSIONAL
    // ============================================================================
    let mainProductsTotal = 0;
    let otherQuantitiesTotal = 0;
    let grandTotal = 0;

    // Use formData.calculation if available, otherwise calculate from individual products
    if (formData.calculation && formData.calculation.totalPrice > 0) {
      mainProductsTotal = formData.calculation.totalPrice;
      
      // Calculate other quantities based on the main calculation
      otherQuantitiesTotal = otherQuantities.reduce((total, o) => {
        try {
          const prices = calculateOtherQtyPrice(formData, o);
          return total + prices.total;
        } catch (error) {
          console.error("Error calculating total for other quantity:", o, error);
          return total;
        }
      }, 0);
      
      grandTotal = mainProductsTotal + otherQuantitiesTotal;
    } else {
      // Fallback to individual product calculations
      mainProductsTotal = formData.products.reduce((total, product) => {
        try {
          const prices = calculateMainProductPrice(formData, product);
          return total + prices.total;
        } catch (error) {
          console.error("Error calculating total for product:", product, error);
          return total;
        }
      }, 0);

      otherQuantitiesTotal = otherQuantities.reduce((total, o) => {
        try {
          const prices = calculateOtherQtyPrice(formData, o);
          return total + prices.total;
        } catch (error) {
          console.error("Error calculating total for other quantity:", o, error);
          return total;
        }
      }, 0);

      grandTotal = mainProductsTotal + otherQuantitiesTotal;
    }

    // Professional pricing summary
    const summaryStartY = getFinalY(doc, pricingY + 20) + 15;
    
    // Summary box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(1);
    doc.roundedRect(20, summaryStartY, 170, 50, 5, 5, 'FD');
    
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("PRICING SUMMARY", 105, summaryStartY + 15, { align: 'center' });
    
    autoTable(doc, {
      startY: summaryStartY + 25,
      head: [["Description", "Amount"]],
      body: [
        ["Subtotal", currency(mainProductsTotal * 0.952)], // Remove VAT from total to show subtotal
        ["VAT (5%)", currency(mainProductsTotal * 0.048)], // 5% VAT
        ["Main Products Total", currency(mainProductsTotal)],
        ...(otherQuantities.length > 0 ? [
          ["Additional Quantities", currency(otherQuantitiesTotal)],
          ["Grand Total", currency(grandTotal)]
        ] : [])
      ],
      styles: { 
        fontSize: 11,
        cellPadding: 6,
        lineColor: [226, 232, 240],
        lineWidth: 0.3,
        textColor: [71, 85, 105]
      },
      headStyles: { 
        fillColor: [30, 64, 175],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 12,
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255]
      },
      margin: { left: 25, right: 25 },
      columnStyles: {
        0: { cellWidth: 100, halign: 'left', fontStyle: 'bold', textColor: [71, 85, 105] },
        1: { cellWidth: 65, halign: 'right', fontStyle: 'bold', fontSize: 12, textColor: [30, 64, 175] }
      }
    });

    // ============================================================================
    // TERMS & CONDITIONS SECTION - PROFESSIONAL
    // ============================================================================
    const termsY = getFinalY(doc, summaryStartY + 25) + 15;
    
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(20, termsY, 170, 45, 5, 5, 'FD');
    
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("TERMS & CONDITIONS", 25, termsY + 12);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    
    // Professional terms in organized layout
    doc.text("• Quote valid for 30 days from date of issue", 25, termsY + 22);
    doc.text("• Production time: 5-7 business days", 25, termsY + 28);
    doc.text("• Rush orders: 2-3 business days (+25% cost)", 25, termsY + 34);
    doc.text("• Payment terms: 50% upfront, 50% before delivery", 25, termsY + 40);
    
    doc.text("• Quality guarantee: 100% satisfaction or reprint", 110, termsY + 22);
    doc.text("• Free delivery within Dubai city limits", 110, termsY + 28);
    doc.text("• Final approval required before delivery", 110, termsY + 34);
    doc.text("• Changes to specifications may affect pricing", 110, termsY + 40);

    // ============================================================================
    // PROFESSIONAL FOOTER
    // ============================================================================
    const footerY = termsY + 55;
    
    doc.setFillColor(248, 250, 252);
    doc.rect(20, footerY, 170, 25, 'F');
    
    // Professional accent line
    doc.setFillColor(30, 64, 175);
    doc.rect(20, footerY, 170, 2, 'F');
    
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Smart Printing Solutions", 25, footerY + 12);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text("Email: info@smartprinting.ae  |  Phone: +971 123 456 789", 25, footerY + 20);

    // Save the PDF
    doc.save(`customer-quote-Q-001.pdf`);
    console.log("Customer PDF generated successfully");
  } catch (error) {
    console.error("Error generating customer PDF:", error);
    alert("Error generating PDF. Please check the console for details.");
  }
}

export async function downloadOpsPdf(
  formData: QuoteFormData,
  otherQuantities: OtherQty[]
) {
  try {
    const { jsPDF } = (await import("jspdf")) as JsPDFModule;
    const autoTable = (await import("jspdf-autotable")).default as AutoTableModule["default"];

    const doc: JsPdfWithAutoTable = new jsPDF();

    const op = formData.operational;

    // Validate form data
    if (!formData.products || formData.products.length === 0) {
      throw new Error("No products found in form data");
    }

    // Format date to match the image format (M/D/YYYY)
    const today = new Date();
    const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

    // Set document properties
    doc.setProperties({
      title: "Quotation - Operations Copy",
      subject: "Printing Operations Specifications",
      author: "Smart Printing Solutions",
      creator: "Smart Printing Quotation System"
    });

    // ============================================================================
    // PROFESSIONAL HEADER - OPERATIONS THEME
    // ============================================================================
    // Clean header background
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 210, 50, 'F');
    
    // Professional accent line (different color for ops)
    doc.setFillColor(16, 185, 129); // Professional green
    doc.rect(0, 0, 210, 3, 'F');
    
    // Company Logo/Name
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text("SMART PRINTING SOLUTIONS", 105, 18, { align: 'center' });
    
    // Document type
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text("Operations & Production Specifications", 105, 26, { align: 'center' });

    // Document Title
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("OPERATIONAL JOB ORDER", 105, 36, { align: 'center' });

    // Info boxes
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.roundedRect(25, 40, 70, 8, 2, 2, 'FD');
    doc.roundedRect(115, 40, 70, 8, 2, 2, 'FD');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Date: ${formattedDate}`, 30, 45);
    
    // Generate quote number
    const quoteNumber = `QT-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    doc.text(`Quote #: ${quoteNumber}`, 120, 45);

    // Clean separator
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, 50, 190, 50);

    // ============================================================================
    // CLIENT INFORMATION SECTION - OPERATIONS LAYOUT
    // ============================================================================
    let currentY = 60;
    
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(20, currentY, 170, 40, 5, 5, 'FD');
    
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("CLIENT INFORMATION", 25, currentY + 12);
    
    const c = formData.client;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    
    // Clean layout
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(`Company:`, 25, currentY + 22);
    doc.text(`Contact:`, 25, currentY + 28);
    doc.text(`Email:`, 100, currentY + 22);
    doc.text(`Phone:`, 100, currentY + 28);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`${c.clientType === "Company" ? c.companyName : "Individual Client"}`, 55, currentY + 22);
    doc.text(`${c.contactPerson || "-"}`, 50, currentY + 28);
    doc.text(`${c.email || "-"}`, 120, currentY + 22);
    doc.text(`${c.countryCode} ${c.phone || "-"}`, 120, currentY + 28);
    
    // Address
    if (c.address || c.city || c.state) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(`Address:`, 25, currentY + 34);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      const fullAddress = [c.address, c.city, c.state, c.country].filter(Boolean).join(", ");
      if (fullAddress.length > 80) {
        doc.text(fullAddress.substring(0, 80) + '...', 55, currentY + 34);
      } else {
        doc.text(fullAddress, 55, currentY + 34);
      }
    }

    // ============================================================================
    // PRODUCT SPECIFICATIONS SECTION - OPERATIONS TABLE
    // ============================================================================
    currentY += 50;
    
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(20, currentY, 170, 40, 5, 5, 'FD');
    
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("PRODUCT SPECIFICATIONS", 25, currentY + 12);

    // Comprehensive product details table for operations
    const productDetailsBody = formData.products.flatMap((product, index) => [
      [`Product ${index + 1} Name`, product.productName || "—"],
      [`Quantity`, String(product.quantity || 0)],
      [`Printing Method`, product.printingSelection || "—"],
      [`Sides`, product.sides || "—"],
      [
        `Flat Size (Open)`,
        `${product.flatSize?.width ?? "—"} × ${product.flatSize?.height ?? "—"} cm (spine: ${product.flatSize?.spine ?? 0} cm)`,
      ],
      [
        `Close Size (Closed)`,
        product.useSameAsFlat ? "Same as Flat Size" : `${product.closeSize?.width ?? "—"} × ${product.closeSize?.height ?? "—"} cm (spine: ${product.closeSize?.spine ?? 0} cm)`,
      ],
      [`Front Colors`, product.colors?.front || "—"],
      [`Back Colors`, product.colors?.back || "—"],
      [`Paper Type`, product.paperName || "—"],
      [`Finishing`, product.finishing?.length ? product.finishing.join(", ") : "—"],
      [`Finishing Comments`, product.finishingComments || "—"],
    ]);

    autoTable(doc, {
      startY: currentY + 20,
      head: [["Specification", "Details"]],
      body: productDetailsBody,
      styles: { 
        fontSize: 8,
        cellPadding: 3,
        lineColor: [226, 232, 240],
        lineWidth: 0.3,
        textColor: [71, 85, 105]
      },
      headStyles: { 
        fillColor: [248, 250, 252],
        textColor: [16, 185, 129],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'left'
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: 25, right: 25 },
      columnStyles: {
        0: { cellWidth: 60, halign: 'left', fontStyle: 'bold', textColor: [100, 116, 139] },
        1: { cellWidth: 105, halign: 'left', textColor: [15, 23, 42] }
      }
    });

    // ============================================================================
    // OPERATIONAL SPECIFICATIONS SECTION
    // ============================================================================
    const operationalY = getFinalY(doc, currentY + 20) + 15;
    
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(20, operationalY, 170, 40, 5, 5, 'FD');
    
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("OPERATIONAL SPECIFICATIONS", 25, operationalY + 12);

    // Operational details table
    const operationalBody = [
      ["Plates Required", String(op.plates || 0)],
      ["Total Units", String(op.units || 0)],
      ["Production Time", "5-7 business days"],
      ["Rush Option Available", "2-3 business days (+25% cost)"],
      ["Express Option Available", "1 business day (+50% cost)"],
    ];

    autoTable(doc, {
      startY: operationalY + 20,
      head: [["Specification", "Value"]],
      body: operationalBody,
      styles: { 
        fontSize: 9,
        cellPadding: 4,
        lineColor: [226, 232, 240],
        lineWidth: 0.3,
        textColor: [71, 85, 105]
      },
      headStyles: { 
        fillColor: [248, 250, 252],
        textColor: [16, 185, 129],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'left'
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: 25, right: 25 },
      columnStyles: {
        0: { cellWidth: 85, halign: 'left', fontStyle: 'bold', textColor: [100, 116, 139] },
        1: { cellWidth: 80, halign: 'left', textColor: [15, 23, 42] }
      }
    });

    // ============================================================================
    // PAPER SPECIFICATIONS TABLE - OPERATIONS DETAIL
    // ============================================================================
    if (op.papers?.length) {
      const paperY = getFinalY(doc, operationalY + 20) + 15;
      
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(20, paperY, 170, 40, 5, 5, 'FD');
      
      doc.setTextColor(16, 185, 129);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("PAPER SPECIFICATIONS", 25, paperY + 12);

      autoTable(doc, {
        startY: paperY + 20,
        head: [["#", "Type", "Input Size", "Sheets/Pack", "Price/Pack", "Required", "Output Size"]],
        body: op.papers.map((pp, i) => [
          String(i + 1),
          formData.products[0]?.papers?.[i]?.name || "Standard Paper",
          `${pp.inputWidth ?? "—"} × ${pp.inputHeight ?? "—"} cm`,
          String(pp.sheetsPerPacket ?? "—"),
          typeof pp.pricePerPacket === "number" ? currency(pp.pricePerPacket) : "—",
          String(pp.enteredSheets ?? "—"),
          `${pp.outputWidth ?? "—"} × ${pp.outputHeight ?? "—"} cm`,
        ]),
        styles: { 
          fontSize: 8,
          cellPadding: 3,
          lineColor: [226, 232, 240],
          lineWidth: 0.3,
          textColor: [71, 85, 105]
        },
        headStyles: { 
          fillColor: [248, 250, 252],
          textColor: [16, 185, 129],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        margin: { left: 25, right: 25 },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 25, halign: 'left' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 22, halign: 'right', textColor: [16, 185, 129] },
          5: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
          6: { cellWidth: 25, halign: 'center' }
        }
      });
    }

    // ============================================================================
    // FINISHING SPECIFICATIONS TABLE - OPERATIONS DETAIL
    // ============================================================================
    if (op.finishing?.length) {
      const finishingY = getFinalY(doc, operationalY + 20) + 15;
      const selectedFin = op.finishing.filter((f) => 
        formData.products.some(product => product.finishing.includes(f.name))
      );
      
      if (selectedFin.length) {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(20, finishingY, 170, 40, 5, 5, 'FD');
        
        doc.setTextColor(16, 185, 129);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("FINISHING SPECIFICATIONS", 25, finishingY + 12);

        autoTable(doc, {
          startY: finishingY + 20,
          head: [["Process", "Cost/Unit", "Units", "Total", "Production Instructions"]],
          body: selectedFin.map((f) => [
            f.name,
            typeof f.cost === "number" ? currency(f.cost) : "—",
            op.units ? String(op.units) : "—",
            typeof f.cost === "number" && op.units
              ? currency(f.cost * op.units)
              : "—",
            getFinishingInstructions(f.name)
          ]),
          styles: { 
            fontSize: 8,
            cellPadding: 3,
            lineColor: [226, 232, 240],
            lineWidth: 0.3,
            textColor: [71, 85, 105]
          },
          headStyles: { 
            fillColor: [248, 250, 252],
            textColor: [16, 185, 129],
            fontStyle: 'bold',
            fontSize: 8,
            halign: 'center'
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251]
          },
          margin: { left: 25, right: 25 },
          columnStyles: {
            0: { cellWidth: 30, halign: 'left', fontStyle: 'bold' },
            1: { cellWidth: 22, halign: 'right', textColor: [16, 185, 129] },
            2: { cellWidth: 18, halign: 'center' },
            3: { cellWidth: 22, halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] },
            4: { cellWidth: 60, halign: 'left', fontSize: 7 }
          }
        });
      }
    }

    // ============================================================================
    // FINISHING COMMENTS SECTION - IF AVAILABLE
    // ============================================================================
    const finishingComments = formData.products
      .filter(product => product.finishingComments && product.finishingComments.trim())
      .map(product => `${product.productName || 'Product'}: ${product.finishingComments}`);
    
    if (finishingComments.length > 0) {
      const commentsY = getFinalY(doc, operationalY + 20) + 15;
      
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(20, commentsY, 170, 35, 5, 5, 'FD');
      
      doc.setTextColor(16, 185, 129);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("FINISHING COMMENTS", 25, commentsY + 12);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      
      finishingComments.forEach((comment, index) => {
        doc.text(comment, 25, commentsY + 22 + (index * 8));
      });
    }

    // ============================================================================
    // PRODUCTION NOTES SECTION
    // ============================================================================
    const notesY = getFinalY(doc, operationalY + 20) + 15;
    
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(20, notesY, 170, 35, 5, 5, 'FD');
    
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("PRODUCTION NOTES", 25, notesY + 12);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    
    doc.text("• Quality control checkpoints at each production stage", 25, notesY + 22);
    doc.text("• Digital proof copy available upon request", 25, notesY + 28);
    doc.text("• Client approval required before final production", 110, notesY + 22);
    doc.text("• All materials to meet specified quality standards", 110, notesY + 28);

    // ============================================================================
    // PROFESSIONAL FOOTER - OPERATIONS
    // ============================================================================
    const footerY = notesY + 45;
    
    doc.setFillColor(248, 250, 252);
    doc.rect(20, footerY, 170, 25, 'F');
    
    // Professional accent line
    doc.setFillColor(16, 185, 129);
    doc.rect(20, footerY, 170, 2, 'F');
    
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Smart Printing Solutions", 25, footerY + 12);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text("Email: info@smartprinting.ae  |  Phone: +971 123 456 789  |  OPERATIONS COPY", 25, footerY + 20);

    // Save the PDF
    doc.save("quotation-operations.pdf");
    console.log("Operations PDF generated successfully");
  } catch (error) {
    console.error("Error generating operations PDF:", error);
    alert("Error generating PDF. Please check the console for details.");
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getFinishingInstructions(finishingName: string): string {
  const instructions: { [key: string]: string } = {
    'UV Spot': 'Apply UV coating to specified areas only',
    'Foil Stamping': 'Use heat and pressure to apply metallic foil',
    'Embossing': 'Create raised design using embossing dies',
    'Die Cutting': 'Cut to specific shape using custom dies',
    'Lamination': 'Apply protective film coating',
    'Folding': 'Fold according to specified measurements',
    'Perforation': 'Create tear-off perforations',
    'Varnishing': 'Apply protective varnish coating',
    'Spot Varnish': 'Apply varnish to specific areas',
    'Window Patching': 'Create window cutouts with clear film'
  };
  
  return instructions[finishingName] || 'Follow standard finishing procedures';
}

// ============================================================================
// PROFESSIONAL OPERATIONAL PDF GENERATION
// ============================================================================

export async function generateOperationalPDF(
  quoteId: string,
  formData: QuoteFormData
): Promise<Uint8Array> {
  const [JsPDF, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  
  const autoTable = autoTableModule.default;
  const doc = new JsPDF.jsPDF() as JsPdfWithAutoTable;

  // ============================================================================
  // PROFESSIONAL HEADER SECTION - OPERATIONS
  // ============================================================================
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 210, 50, 'F');
  
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, 210, 3, 'F');
  
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text("OPERATIONAL JOB ORDER", 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Quote ID: ${quoteId}`, 105, 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 105, 40, { align: 'center' });

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(20, 50, 190, 50);

  // ============================================================================
  // CLIENT INFORMATION SECTION
  // ============================================================================
  let currentY = 60;
  
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(20, currentY, 170, 35, 5, 5, 'FD');
  
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("CLIENT INFORMATION", 25, currentY + 12);
  
  const c = formData.client;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text(`Company:`, 25, currentY + 22);
  doc.text(`Contact:`, 25, currentY + 28);
  doc.text(`Email:`, 100, currentY + 22);
  doc.text(`Phone:`, 100, currentY + 28);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${c.clientType === "Company" ? c.companyName : "Individual Client"}`, 55, currentY + 22);
  doc.text(`${c.contactPerson || "-"}`, 50, currentY + 28);
  doc.text(`${c.email || "-"}`, 120, currentY + 22);
  doc.text(`${c.countryCode} ${c.phone || "-"}`, 120, currentY + 28);

  // ============================================================================
  // PRODUCT SPECIFICATIONS SECTION
  // ============================================================================
  currentY += 45;
  
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(20, currentY, 170, 40, 5, 5, 'FD');
  
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("PRODUCT SPECIFICATIONS", 25, currentY + 12);

  const productDetailsBody = formData.products.flatMap((product, index) => [
    [`Product ${index + 1} Name`, product.productName || "—"],
    [`Quantity`, String(product.quantity || 0)],
    [`Printing Method`, product.printingSelection || "—"],
    [`Sides`, product.sides || "—"],
          [
        `Flat Size (Open)`,
        `${product.flatSize?.width ?? "—"} × ${product.flatSize?.height ?? "—"} cm (spine: ${product.flatSize?.spine ?? 0} cm)`,
      ],
    [
      `Close Size (Closed)`,
      product.useSameAsFlat ? "Same as Flat Size" : `${product.closeSize?.width ?? "—"} × ${product.closeSize?.height ?? "—"} cm (spine: ${product.closeSize?.spine ?? 0} cm)`,
    ],
    [`Front Colors`, product.colors?.front || "—"],
    [`Back Colors`, product.colors?.back || "—"],
    [`Paper Type`, product.paperName || "—"],
    [`Finishing`, product.finishing?.length ? product.finishing.join(", ") : "—"],
    [`Finishing Comments`, product.finishingComments || "—"],
  ]);

  autoTable(doc, {
    startY: currentY + 20,
    head: [["Specification", "Details"]],
    body: productDetailsBody,
    styles: { 
      fontSize: 8,
      cellPadding: 3,
      lineColor: [226, 232, 240],
      lineWidth: 0.3,
      textColor: [71, 85, 105]
    },
    headStyles: { 
      fillColor: [248, 250, 252],
      textColor: [16, 185, 129],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    margin: { left: 25, right: 25 },
    columnStyles: {
      0: { cellWidth: 60, halign: 'left', fontStyle: 'bold', textColor: [100, 116, 139] },
      1: { cellWidth: 105, halign: 'left', textColor: [15, 23, 42] }
    }
  });

  // ============================================================================
  // OPERATIONAL SPECIFICATIONS SECTION
  // ============================================================================
  const operationalY = getFinalY(doc, currentY + 20) + 15;
  
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(20, operationalY, 170, 40, 5, 5, 'FD');
  
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("OPERATIONAL SPECIFICATIONS", 25, operationalY + 12);

  const operationalBody = [
    ["Plates Required", String(formData.operational.plates || 0)],
    ["Total Units", String(formData.operational.units || 0)],
    ["Standard Production Time", "5-7 business days"],
    ["Rush Option", "2-3 business days (+25% cost)"],
    ["Express Option", "1 business day (+50% cost)"],
  ];

  autoTable(doc, {
    startY: operationalY + 20,
    head: [["Specification", "Value"]],
    body: operationalBody,
    styles: { 
      fontSize: 9,
      cellPadding: 4,
      lineColor: [226, 232, 240],
      lineWidth: 0.3,
      textColor: [71, 85, 105]
    },
    headStyles: { 
      fillColor: [248, 250, 252],
      textColor: [16, 185, 129],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    margin: { left: 25, right: 25 },
    columnStyles: {
      0: { cellWidth: 85, halign: 'left', fontStyle: 'bold', textColor: [100, 116, 139] },
      1: { cellWidth: 80, halign: 'left', textColor: [15, 23, 42] }
    }
  });

  // ============================================================================
  // PRODUCTION NOTES SECTION
  // ============================================================================
  const notesY = getFinalY(doc, operationalY + 20) + 15;
  
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(20, notesY, 170, 35, 5, 5, 'FD');
  
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("PRODUCTION NOTES", 25, notesY + 12);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  
  doc.text("• Quality control at each production stage", 25, notesY + 22);
  doc.text("• Digital proof copy available upon request", 25, notesY + 28);
  doc.text("• Client approval required before final production", 110, notesY + 22);
  doc.text("• All materials to meet specified standards", 110, notesY + 28);

  // ============================================================================
  // PROFESSIONAL FOOTER
  // ============================================================================
  const footerY = notesY + 45;
  
  doc.setFillColor(248, 250, 252);
  doc.rect(20, footerY, 170, 25, 'F');
  
  doc.setFillColor(16, 185, 129);
  doc.rect(20, footerY, 170, 2, 'F');
  
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Smart Printing Solutions", 25, footerY + 12);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text("Email: info@smartprinting.ae  |  Phone: +971 123 456 789  |  OPERATIONS COPY", 25, footerY + 20);

  return new Uint8Array(doc.output('arraybuffer'));
}