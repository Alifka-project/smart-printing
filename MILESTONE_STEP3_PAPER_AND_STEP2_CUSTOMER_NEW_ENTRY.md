## Milestone: Create Quote Improvements — Step 2 & Step 3

### Scope
- Step 2 (Customer Details): Enable adding brand new customers directly from Company, First Name, and Email fields when no match is found.
- Step 3 (Product Spec): Prevent default paper from appearing in new quotes, allow removing last paper, and keep Add Paper visible to support multiple papers.

### Changes
- Step2CustomerDetail (`components/create-quote/steps/Step2CustomerDetail.tsx`)
  - Added Add New actions for company/first-name/email search when no results.
  - Handler `handleAddNewCustomer(fieldType, searchTerm)` updates form state and closes suggestions.

- Step3ProductSpec (`components/create-quote/steps/Step3ProductSpec.tsx`)
  - `createTrulyEmptyProduct` and `createEmptyProduct` now start with `papers: []` (no default Paper 1).
  - `removePaper` now allows removing the last paper.
  - Show Add Paper button whenever the browse dialog is closed; show paper cards only when papers exist.

### Outcomes
- New quotes start clean with no paper cards.
- Users can add multiple papers and remove them all if needed.
- New customers can be created inline from Step 2 when no matches are found.

### Regression checks
- Existing quote autofill for papers/finishing unaffected.
- Validation in Step 3 continues to require at least one valid paper to proceed.

### Timestamp
- Generated on: 2025-09-23


