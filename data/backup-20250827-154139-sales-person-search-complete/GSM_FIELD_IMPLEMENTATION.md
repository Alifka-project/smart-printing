# GSM Field Implementation for Supplier Database

## Overview
This document outlines the implementation of a GSM (Grams per Square Meter) field in the supplier database to better categorize paper materials by weight.

## What is GSM?
GSM stands for "Grams per Square Meter" and is the standard unit for measuring paper weight. It helps users identify the specific weight/thickness of paper materials.

## Changes Made

### 1. Database Schema Updates
- Added `gsm` field to the `Material` model in `prisma/schema.prisma`
- Field is optional (`String?`) to accommodate non-paper materials
- Added comment explaining the field's purpose

### 2. Database Service Updates
- Updated `createMaterial` method in `lib/database.ts` to accept GSM parameter
- Modified `seedMaterials` method to include GSM values for paper materials

### 3. Interface Updates
- Added `gsm?: string` to `MaterialRow` interface in `constants/index.ts`
- Updated materials array with separate name and GSM fields
- Modified supplier management page interface to include GSM field

### 4. UI Updates
- Added GSM column to materials table in supplier management page
- GSM values are displayed as blue badges (e.g., "300 gsm")
- Non-paper materials show "—" for GSM
- Added GSM input field to material creation/editing form
- Updated form validation and submission to handle GSM field

### 5. Migration Script
- Created `scripts/add-gsm-field.js` to migrate existing materials
- Extracts GSM values from material names containing "gsm" text
- Updates database records with extracted GSM values

## Benefits

### For Users
- **Better Categorization**: Users can easily identify paper weights
- **Improved Search**: Filter materials by GSM values
- **Clearer Material Names**: Material names are cleaner without weight information
- **Professional Presentation**: GSM values displayed as organized badges

### For Business
- **Inventory Management**: Better tracking of paper stock by weight
- **Pricing Accuracy**: More precise material identification for quotes
- **Supplier Relations**: Clearer communication about material specifications

## Example Usage

### Before (Old Format)
```
Material Name: "Art Paper 300gsm"
```

### After (New Format)
```
Material Name: "Art Paper"
GSM: "300 gsm"
```

## Database Migration

To apply the GSM field to existing materials:

1. **Run Prisma Migration**:
   ```bash
   npx prisma migrate dev --name add_gsm_field
   ```

2. **Run GSM Migration Script**:
   ```bash
   node scripts/add-gsm-field.js
   ```

3. **Verify Changes**:
   - Check supplier management page
   - Verify GSM column displays correctly
   - Test material creation/editing with GSM field

## Future Enhancements

### Potential Features
- **GSM Filtering**: Add filter dropdown for GSM values
- **GSM Validation**: Ensure GSM values are numeric and within reasonable ranges
- **GSM Sorting**: Sort materials by GSM values
- **GSM Categories**: Group materials by GSM ranges (e.g., Light: 60-120, Medium: 130-200, Heavy: 250+)

### Integration Points
- **Quote Creation**: Use GSM for paper selection in quotes
- **Cost Calculation**: Factor GSM into pricing calculations
- **Inventory Tracking**: Track paper stock by GSM values
- **Reporting**: Generate reports by GSM categories

## Technical Notes

### Field Type
- **Type**: `String?` (optional string)
- **Reason**: Some materials (like inks, chemicals) don't have GSM values
- **Format**: Numeric values as strings (e.g., "300", "150", "80")

### Validation
- GSM field is optional during material creation
- No strict validation on GSM format (allows flexibility)
- Helpful text explains when to use GSM field

### Performance
- GSM field is indexed as part of the material table
- No impact on existing queries
- Minimal storage overhead

## Testing

### Test Cases
1. **Create Material with GSM**: Verify GSM field saves correctly
2. **Create Material without GSM**: Ensure optional field works
3. **Edit Material GSM**: Test GSM field updates
4. **Display GSM**: Verify GSM column shows correctly
5. **Migration**: Test GSM extraction from existing names

### Test Data
- Paper materials with various GSM values
- Non-paper materials (inks, chemicals, tools)
- Edge cases (very high/low GSM values)

## Conclusion

The GSM field implementation provides a more professional and organized way to categorize paper materials in the supplier database. It separates material type from weight specifications, making the system more user-friendly and business-ready.
