const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');

// Backup directory
const backupDir = path.join(__dirname, '..', 'data', 'enhanced-database-backup');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

console.log('🔄 Creating comprehensive database backup...');
console.log(`📁 Backup directory: ${backupDir}`);
console.log(`⏰ Timestamp: ${timestamp}`);

// Create backup directory if it doesn't exist
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(dbPath);

// Backup all tables with enhanced data
const backupDatabase = () => {
  return new Promise((resolve, reject) => {
    console.log('\n📊 Starting database backup...');

    // Get all table names
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
      if (err) {
        console.error('❌ Error getting table names:', err.message);
        reject(err);
        return;
      }

      console.log(`📋 Found ${tables.length} tables to backup`);
      
      const backupPromises = tables.map(table => backupTable(table.name));
      
      Promise.all(backupPromises)
        .then(() => {
          console.log('\n✅ All tables backed up successfully!');
          resolve();
        })
        .catch(reject);
    });
  });
};

// Backup individual table
const backupTable = (tableName) => {
  return new Promise((resolve, reject) => {
    console.log(`  📥 Backing up table: ${tableName}`);
    
    db.all(`SELECT * FROM "${tableName}"`, (err, rows) => {
      if (err) {
        console.error(`❌ Error backing up table ${tableName}:`, err.message);
        reject(err);
        return;
      }

      // Create backup file
      const backupFile = path.join(backupDir, `${tableName}-${timestamp}.json`);
      
      try {
        fs.writeFileSync(backupFile, JSON.stringify(rows, null, 2));
        console.log(`    ✅ ${tableName}: ${rows.length} records saved to ${path.basename(backupFile)}`);
        resolve();
      } catch (writeErr) {
        console.error(`❌ Error writing backup file for ${tableName}:`, writeErr.message);
        reject(writeErr);
      }
    });
  });
};

// Create comprehensive backup summary
const createBackupSummary = () => {
  return new Promise((resolve, reject) => {
    console.log('\n📝 Creating backup summary...');
    
    const summary = {
      backupInfo: {
        timestamp: timestamp,
        databasePath: dbPath,
        backupDirectory: backupDir,
        description: "Enhanced database backup with all Step 3 fields and comprehensive quote data"
      },
      tables: [],
      dataSummary: {}
    };

    // Get table information and record counts
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
      if (err) {
        console.error('❌ Error getting table info for summary:', err.message);
        reject(err);
        return;
      }

      const tablePromises = tables.map(table => {
        return new Promise((resolve) => {
          db.get(`SELECT COUNT(*) as count FROM "${table.name}"`, (err, result) => {
            if (err) {
              summary.tables.push({ name: table.name, recordCount: 'Error' });
              resolve();
            } else {
              summary.tables.push({ name: table.name, recordCount: result.count });
              resolve();
            }
          });
        });
      });

      Promise.all(tablePromises).then(() => {
        // Add data summary
        summary.dataSummary = {
          totalTables: summary.tables.length,
          totalRecords: summary.tables.reduce((sum, table) => {
            return sum + (typeof table.recordCount === 'number' ? table.recordCount : 0);
          }, 0),
          enhancedFeatures: [
            "Complete Step 3 product specifications",
            "Enhanced quote data with all fields",
            "Realistic amount calculations",
            "Proper product configurations",
            "Complete color specifications",
            "Size dimensions for all products",
            "Printing method selections",
            "Side configurations (1-side vs 2-side)",
            "Paper and finishing specifications",
            "Operational and production details"
          ]
        };

        // Write summary file
        const summaryFile = path.join(backupDir, `backup-summary-${timestamp}.json`);
        try {
          fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
          console.log(`    ✅ Backup summary saved to ${path.basename(summaryFile)}`);
          resolve(summary);
        } catch (writeErr) {
          console.error('❌ Error writing backup summary:', writeErr.message);
          reject(writeErr);
        }
      });
    });
  });
};

// Create SQL dump for complete database restoration
const createSqlDump = () => {
  return new Promise((resolve, reject) => {
    console.log('\n💾 Creating SQL dump for complete restoration...');
    
    const dumpFile = path.join(backupDir, `database-dump-${timestamp}.sql`);
    
    try {
      // Get all table schemas and data
      db.all("SELECT sql FROM sqlite_master WHERE type='table'", (err, schemas) => {
        if (err) {
          console.error('❌ Error getting table schemas:', err.message);
          reject(err);
          return;
        }

        let sqlDump = `-- Enhanced Database Backup - ${timestamp}\n`;
        sqlDump += `-- Smart Printing Solutions - Complete Database Restoration\n\n`;
        
        // Add table creation statements
        schemas.forEach(schema => {
          if (schema.sql) {
            sqlDump += `${schema.sql};\n\n`;
          }
        });

        // Add data insertion statements
        const tableNames = schemas.map(s => s.sql.match(/CREATE TABLE "?(\w+)"?/)?.[1]).filter(Boolean);
        
        let completedTables = 0;
        const addTableData = (tableName) => {
          return new Promise((resolve) => {
            db.all(`SELECT * FROM "${tableName}"`, (err, rows) => {
              if (err || !rows.length) {
                completedTables++;
                resolve();
                return;
              }

              // Get column names
              const columns = Object.keys(rows[0]);
              sqlDump += `-- Data for table: ${tableName}\n`;
              
              rows.forEach(row => {
                const values = columns.map(col => {
                  const value = row[col];
                  if (value === null) return 'NULL';
                  if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
                  return value;
                });
                
                sqlDump += `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
              });
              
              sqlDump += '\n';
              completedTables++;
              resolve();
            });
          });
        };

        const dataPromises = tableNames.map(addTableData);
        Promise.all(dataPromises).then(() => {
          try {
            fs.writeFileSync(dumpFile, sqlDump);
            console.log(`    ✅ SQL dump saved to ${path.basename(dumpFile)}`);
            resolve();
          } catch (writeErr) {
            console.error('❌ Error writing SQL dump:', writeErr.message);
            reject(writeErr);
          }
        });
      });
    } catch (error) {
      console.error('❌ Error creating SQL dump:', error.message);
      reject(error);
    }
  });
};

// Main execution
const main = async () => {
  try {
    console.log('🚀 Starting enhanced database backup process...\n');
    
    // Step 1: Backup all tables
    await backupDatabase();
    
    // Step 2: Create backup summary
    const summary = await createBackupSummary();
    
    // Step 3: Create SQL dump
    await createSqlDump();
    
    // Display backup summary
    console.log('\n🎉 BACKUP COMPLETED SUCCESSFULLY!');
    console.log('=' .repeat(50));
    console.log(`📁 Backup Location: ${backupDir}`);
    console.log(`⏰ Backup Time: ${timestamp}`);
    console.log(`📊 Total Tables: ${summary.dataSummary.totalTables}`);
    console.log(`📝 Total Records: ${summary.dataSummary.totalRecords}`);
    console.log('\n📋 Enhanced Features Included:');
    summary.dataSummary.enhancedFeatures.forEach(feature => {
      console.log(`   ✅ ${feature}`);
    });
    
    console.log('\n💾 Backup Files Created:');
    fs.readdirSync(backupDir).forEach(file => {
      if (file.includes(timestamp)) {
        console.log(`   📄 ${file}`);
      }
    });
    
    console.log('\n🔄 To restore this backup:');
    console.log('   1. Use the SQL dump file for complete restoration');
    console.log('   2. Or use individual JSON files for specific tables');
    console.log('   3. All Step 3 fields and enhanced data will be preserved');
    
  } catch (error) {
    console.error('\n❌ Backup failed:', error.message);
    process.exit(1);
  } finally {
    db.close();
    console.log('\n🔒 Database connection closed');
  }
};

// Run backup
main();
