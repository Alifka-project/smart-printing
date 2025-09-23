#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

async function createSalesPersonTable() {
  try {
    console.log('🚀 Creating SalesPerson table and sample data...');
    
    const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
    
    // Create SalesPerson table
    console.log('📋 Creating SalesPerson table...');
    execSync(`sqlite3 "${dbPath}" "CREATE TABLE IF NOT EXISTS SalesPerson (
      id TEXT PRIMARY KEY,
      salesPersonId TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      countryCode TEXT DEFAULT '+971',
      designation TEXT DEFAULT 'Sales Representative',
      department TEXT DEFAULT 'Sales',
      hireDate TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'Active',
      profilePicture TEXT,
      address TEXT,
      city TEXT DEFAULT 'Dubai',
      state TEXT DEFAULT 'Dubai',
      postalCode TEXT,
      country TEXT DEFAULT 'UAE',
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );"`);
    
    // Add salesPersonId column to Quote table if it doesn't exist
    console.log('🔗 Adding salesPersonId to Quote table...');
    try {
      execSync(`sqlite3 "${dbPath}" "ALTER TABLE Quote ADD COLUMN salesPersonId TEXT;"`);
      console.log('✅ salesPersonId column added to Quote table');
    } catch (error) {
      console.log('ℹ️ salesPersonId column already exists or error occurred');
    }
    
    // Insert sample sales persons
    console.log('👥 Inserting sample sales persons...');
    
    const sampleSalesPersons = [
      {
        id: 'sp_001',
        salesPersonId: 'SL-001',
        name: 'Ahmed Al Mansouri',
        email: 'ahmed.mansouri@smartprinting.ae',
        phone: '0501234567',
        countryCode: '+971',
        designation: 'Senior Sales Manager',
        department: 'Sales',
        hireDate: '2023-01-15',
        status: 'Active',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        notes: 'Experienced sales professional with 8+ years in printing industry'
      },
      {
        id: 'sp_002',
        salesPersonId: 'SL-002',
        name: 'Fatima Al Zahra',
        email: 'fatima.zahra@smartprinting.ae',
        phone: '0502345678',
        countryCode: '+971',
        designation: 'Sales Representative',
        department: 'Sales',
        hireDate: '2023-03-20',
        status: 'Active',
        city: 'Abu Dhabi',
        state: 'Abu Dhabi',
        country: 'UAE',
        notes: 'Specializes in corporate clients and large orders'
      },
      {
        id: 'sp_003',
        salesPersonId: 'SL-003',
        name: 'Omar Al Rashid',
        email: 'omar.rashid@smartprinting.ae',
        phone: '0503456789',
        countryCode: '+971',
        designation: 'Sales Executive',
        department: 'Sales',
        hireDate: '2023-06-10',
        status: 'Active',
        city: 'Sharjah',
        state: 'Sharjah',
        country: 'UAE',
        notes: 'Expert in digital printing and finishing solutions'
      },
      {
        id: 'sp_004',
        salesPersonId: 'SL-004',
        name: 'Aisha Al Qasimi',
        email: 'aisha.qasimi@smartprinting.ae',
        phone: '0504567890',
        countryCode: '+971',
        designation: 'Sales Coordinator',
        department: 'Sales',
        hireDate: '2023-09-05',
        status: 'Active',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        notes: 'Handles small business accounts and quick turnaround jobs'
      },
      {
        id: 'sp_005',
        salesPersonId: 'SL-005',
        name: 'Khalid Al Falasi',
        email: 'khalid.falasi@smartprinting.ae',
        phone: '0505678901',
        countryCode: '+971',
        designation: 'Sales Representative',
        department: 'Sales',
        hireDate: '2024-01-12',
        status: 'Active',
        city: 'Ajman',
        state: 'Ajman',
        country: 'UAE',
        notes: 'Focuses on packaging and specialty printing solutions'
      }
    ];
    
    for (const person of sampleSalesPersons) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT OR REPLACE INTO SalesPerson (
        id, salesPersonId, name, email, phone, countryCode, designation, department, 
        hireDate, status, city, state, country, notes, createdAt, updatedAt
      ) VALUES (
        '${person.id}', '${person.salesPersonId}', '${person.name}', '${person.email}', 
        '${person.phone}', '${person.countryCode}', '${person.designation}', '${person.department}',
        '${person.hireDate}', '${person.status}', '${person.city}', '${person.state}', 
        '${person.country}', '${person.notes}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      );"`;
      
      execSync(insertCmd);
      console.log(`✅ Added sales person: ${person.name} (${person.salesPersonId})`);
    }
    
    // Update existing users to link with sales persons
    console.log('🔗 Linking existing users with sales persons...');
    try {
      execSync(`sqlite3 "${dbPath}" "UPDATE User SET salesPersonId = 'SL-001', isSalesPerson = 1 WHERE name LIKE '%Admin%' OR name LIKE '%Manager%';"`);
      execSync(`sqlite3 "${dbPath}" "UPDATE User SET salesPersonId = 'SL-002', isSalesPerson = 1 WHERE name LIKE '%Estimator%';"`);
      execSync(`sqlite3 "${dbPath}" "UPDATE User SET salesPersonId = 'SL-003', isSalesPerson = 1 WHERE name LIKE '%User%' AND name NOT LIKE '%Admin%';"`);
      console.log('✅ Users linked with sales persons');
    } catch (error) {
      console.log('ℹ️ User linking completed or error occurred');
    }
    
    console.log('🎉 SalesPerson table and sample data created successfully!');
    console.log('📊 Summary:');
    console.log('   - SalesPerson table created');
    console.log('   - 5 sample sales persons added');
    console.log('   - salesPersonId column added to Quote table');
    console.log('   - Existing users linked with sales persons');
    
  } catch (error) {
    console.error('❌ Error creating SalesPerson table:', error);
    process.exit(1);
  }
}

createSalesPersonTable();
