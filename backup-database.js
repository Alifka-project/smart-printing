#!/usr/bin/env node

/**
 * Database Backup Script for SmartPrint System
 * This script creates a backup of your production database before making schema changes
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Load production environment
require('dotenv').config({ path: '.env.production' });

const prisma = new PrismaClient();

async function backupDatabase() {
  try {
    console.log('🔄 Starting database backup...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, 'database-backups');
    
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Backup all tables
    const tables = [
      'User',
      'Client', 
      'Quote',
      'QuoteAmount',
      'QuoteOperational',
      'Paper',
      'Finishing',
      'Material',
      'Supplier',
      'SalesPerson',
      'UAEArea',
      'SearchHistory',
      'SearchAnalytics'
    ];
    
    const backupData = {
      timestamp: new Date().toISOString(),
      tables: {}
    };
    
    for (const table of tables) {
      try {
        console.log(`📊 Backing up ${table}...`);
        const data = await prisma[table.toLowerCase()].findMany();
        backupData.tables[table] = data;
        console.log(`✅ ${table}: ${data.length} records backed up`);
      } catch (error) {
        console.log(`⚠️  ${table}: ${error.message}`);
        backupData.tables[table] = [];
      }
    }
    
    // Save backup to file
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log(`\n✅ Database backup completed successfully!`);
    console.log(`📁 Backup saved to: ${backupFile}`);
    console.log(`📊 Total tables backed up: ${Object.keys(backupData.tables).length}`);
    
    // Create a symlink to the latest backup
    const latestBackup = path.join(backupDir, 'latest-backup.json');
    if (fs.existsSync(latestBackup)) {
      fs.unlinkSync(latestBackup);
    }
    fs.symlinkSync(`backup-${timestamp}.json`, latestBackup);
    
    console.log(`🔗 Latest backup symlink created: ${latestBackup}`);
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run backup
backupDatabase();
