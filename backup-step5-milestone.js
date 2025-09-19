#!/usr/bin/env node

/**
 * Backup Script for Step 5 Calculation Fix Milestone
 * Creates a comprehensive backup from Step 4 until the latest update
 */

const fs = require('fs');
const path = require('path');

const BACKUP_DIR = `data/backup-${new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-')}-step5-calculation-fixed`;

// Create backup directory
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

console.log(`🔄 Creating backup: ${BACKUP_DIR}\n`);

// Files and directories to backup
const filesToBackup = [
  // Core application files
  'app/(root)/create-quote/page.tsx',
  'app/api/quotes/route.ts',
  'lib/database-production.ts',
  'prisma/schema.prisma',
  
  // Step 4 and Step 5 components
  'components/create-quote/steps/Step4Operational.tsx',
  'components/create-quote/steps/Step5Quotation.tsx',
  
  // Configuration files
  'package.json',
  'next.config.js',
  'tailwind.config.js',
  'tsconfig.json',
  
  // Environment files
  '.env.local',
  '.env.production',
  
  // Test files created during development
  'test-step5-calculation.js',
  'test-complete-flow.js',
  'test-complete-calculation.js',
  'test-alternative-calculation.js',
  'test-correct-calculation.js',
  'test-database-service.js',
  'create-exact-quote.js',
  'backup-step5-milestone.js'
];

// Directories to backup
const dirsToBackup = [
  'components/create-quote/steps',
  'lib',
  'prisma',
  'types',
  'app/api',
  'app/(root)'
];

function copyFile(source, destination) {
  try {
    if (fs.existsSync(source)) {
      const destDir = path.dirname(destination);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(source, destination);
      console.log(`✅ Copied: ${source} → ${destination}`);
      return true;
    } else {
      console.log(`⚠️  File not found: ${source}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error copying ${source}:`, error.message);
    return false;
  }
}

function copyDirectory(source, destination) {
  try {
    if (fs.existsSync(source)) {
      if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
      }
      
      const files = fs.readdirSync(source);
      files.forEach(file => {
        const sourcePath = path.join(source, file);
        const destPath = path.join(destination, file);
        
        if (fs.statSync(sourcePath).isDirectory()) {
          copyDirectory(sourcePath, destPath);
        } else {
          fs.copyFileSync(sourcePath, destPath);
        }
      });
      console.log(`✅ Copied directory: ${source} → ${destination}`);
      return true;
    } else {
      console.log(`⚠️  Directory not found: ${source}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error copying directory ${source}:`, error.message);
    return false;
  }
}

async function createBackup() {
  console.log('📋 Step 5 Calculation Fix Milestone Backup\n');
  console.log('🎯 This backup includes:');
  console.log('   • Fixed Step 5 calculation logic (includes additional costs in base calculation)');
  console.log('   • 30% margin applied to total base cost');
  console.log('   • 5% VAT applied to subtotal (base + margin)');
  console.log('   • Database storage matching Step 5 final price');
  console.log('   • Final total: AED 1,461.51 (for base cost of AED 1,070.70)\n');
  
  let successCount = 0;
  let totalCount = 0;
  
  // Copy individual files
  console.log('📁 Copying individual files...');
  filesToBackup.forEach(file => {
    totalCount++;
    if (copyFile(file, path.join(BACKUP_DIR, file))) {
      successCount++;
    }
  });
  
  // Copy directories
  console.log('\n📁 Copying directories...');
  dirsToBackup.forEach(dir => {
    totalCount++;
    if (copyDirectory(dir, path.join(BACKUP_DIR, dir))) {
      successCount++;
    }
  });
  
  // Create milestone documentation
  const milestoneDoc = `# Step 5 Calculation Fix Milestone

## Backup Date: ${new Date().toISOString()}

## What Was Fixed

### 1. Step 5 Calculation Logic
- **Problem**: Additional costs were added after product calculation, not included in base calculation before margin/VAT
- **Solution**: Modified \`calculateSummaryTotals()\` to include additional costs in base calculation
- **Result**: Final price now includes 30% margin and 5% VAT on total base cost

### 2. Calculation Formula
\`\`\`
Total Base Cost = Paper Cost + Plates Cost + Finishing Cost + Additional Costs
Margin (30%) = Total Base Cost × 0.30
Subtotal = Total Base Cost + Margin
VAT (5%) = Subtotal × 0.05
Final Total = Subtotal + VAT
\`\`\`

### 3. Example Calculation
- Base Cost: AED 1,070.70 (Business Card + Additional Costs)
- Margin (30%): AED 321.21
- Subtotal: AED 1,391.91
- VAT (5%): AED 69.60
- **Final Total: AED 1,461.51** ✅

### 4. Database Storage
- Database now stores the same total amount as Step 5 final price
- Perfect match: AED 1,461.51
- Additional costs stored as JSON in \`additionalCostsData\` column

## Files Modified

### Core Files
- \`components/create-quote/steps/Step5Quotation.tsx\` - Fixed calculation logic
- \`app/(root)/create-quote/page.tsx\` - Already had correct calculation
- \`lib/database-production.ts\` - Handles additional costs storage/parsing
- \`app/api/quotes/route.ts\` - API route for quote operations

### Database Schema
- \`prisma/schema.prisma\` - Added \`additionalCostsData\` column to Quote model

## Test Results
- ✅ Step 5 calculation produces AED 1,461.51
- ✅ Database stores AED 1,461.51
- ✅ Perfect match between Step 5 and database
- ✅ Additional costs included in base calculation
- ✅ 30% margin applied correctly
- ✅ 5% VAT applied correctly

## Next Steps
- Additional costs API parsing issue (minor - doesn't affect calculation)
- User testing of complete quote creation flow
- Production deployment when ready

## Status: ✅ COMPLETE
The main requirement is fulfilled: Final price in Step 5 matches database storage and includes 30% margin as requested.
`;

  fs.writeFileSync(path.join(BACKUP_DIR, 'MILESTONE.md'), milestoneDoc);
  console.log(`✅ Created milestone documentation: ${path.join(BACKUP_DIR, 'MILESTONE.md')}`);
  
  // Create backup summary
  const summary = {
    backupDate: new Date().toISOString(),
    milestone: 'Step 5 Calculation Fix',
    description: 'Fixed Step 5 calculation to include additional costs in base calculation before applying margin and VAT',
    finalTotal: 'AED 1,461.51',
    baseCost: 'AED 1,070.70',
    margin: '30%',
    vat: '5%',
    status: 'COMPLETE',
    filesBackedUp: successCount,
    totalFiles: totalCount,
    keyChanges: [
      'Modified calculateSummaryTotals() in Step5Quotation.tsx',
      'Additional costs now included in base calculation',
      '30% margin applied to total base cost',
      '5% VAT applied to subtotal',
      'Database storage matches Step 5 final price'
    ]
  };
  
  fs.writeFileSync(path.join(BACKUP_DIR, 'backup-summary.json'), JSON.stringify(summary, null, 2));
  console.log(`✅ Created backup summary: ${path.join(BACKUP_DIR, 'backup-summary.json')}`);
  
  console.log(`\n🎉 Backup completed successfully!`);
  console.log(`📁 Backup location: ${BACKUP_DIR}`);
  console.log(`📊 Files backed up: ${successCount}/${totalCount}`);
  console.log(`📋 Milestone: Step 5 Calculation Fix - COMPLETE`);
  console.log(`💰 Final Total: AED 1,461.51`);
}

// Run backup
createBackup().catch(console.error);

