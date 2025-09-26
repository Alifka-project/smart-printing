const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function fixMaterials() {
  try {
    console.log('🔧 Fixing materials restoration...');
    
    const backupDir = path.join(__dirname, '..', 'data', 'production-backup');
    const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
    
    // Restore Materials with correct supplier IDs
    console.log('\n📦 Restoring materials from backup with correct supplier IDs...');
    const materialsData = JSON.parse(fs.readFileSync(path.join(backupDir, 'materials.json'), 'utf8'));
    let materialsRestored = 0;
    
    for (const material of materialsData) {
      try {
        // Check if material already exists
        const existingMaterial = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM Material WHERE materialId='${material.materialId}';"`, { encoding: 'utf8' }).trim();
        
        if (existingMaterial === '0') {
          // Extract GSM from material name if available
          let gsmValue = 'NULL';
          if (material.name && material.name.includes('gsm')) {
            const gsmMatch = material.name.match(/(\d+)\s*gsm/i);
            if (gsmMatch) {
              gsmValue = `'${gsmMatch[1]}'`;
              console.log(`   📏 Extracted GSM: ${gsmMatch[1]} from "${material.name}"`);
            }
          }
          
          // Use the exact supplier ID from the backup
          const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO Material (id, materialId, name, gsm, supplierId, cost, unit, status, lastUpdated, createdAt, updatedAt) VALUES ('${material.id}', '${material.materialId}', '${material.name.replace(/'/g, "''")}', ${gsmValue}, '${material.supplierId}', ${material.cost}, '${material.unit}', '${material.status}', '${material.lastUpdated}', '${material.createdAt}', '${material.updatedAt}');"`;
          execSync(insertCmd);
          materialsRestored++;
          console.log(`   ✅ Added material: ${material.name} (GSM: ${gsmValue === 'NULL' ? 'Not specified' : gsmValue.replace(/'/g, '')})`);
        } else {
          console.log(`   ⏭️  Material already exists: ${material.name}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not restore material ${material.name}: ${error.message}`);
      }
    }
    
    console.log(`✅ Materials restored: ${materialsRestored} new materials added`);
    
    // Show final materials count
    const finalMaterials = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM Material;"`, { encoding: 'utf8' }).trim();
    console.log(`📊 Total Materials in database: ${finalMaterials}`);
    
    // Show materials with GSM values
    console.log('\n📋 Materials with GSM values:');
    const materialsWithGsm = execSync(`sqlite3 "${dbPath}" "SELECT name, gsm FROM Material WHERE gsm IS NOT NULL;"`, { encoding: 'utf8' }).trim();
    if (materialsWithGsm) {
      materialsWithGsm.split('\n').forEach(line => {
        const [name, gsm] = line.split('|');
        console.log(`   - ${name}: ${gsm} GSM`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error fixing materials:', error);
  }
}

fixMaterials();
