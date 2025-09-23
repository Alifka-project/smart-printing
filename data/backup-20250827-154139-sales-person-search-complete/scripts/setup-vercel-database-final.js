const { PrismaClient } = require('@prisma/client');

// This script will be run on Vercel to set up the database
const prisma = new PrismaClient();

async function setupVercelDatabase() {
  try {
    console.log('🚀 Setting up Vercel database with local data...');
    
    // Test connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    
    // Create admin user (same as your local database)
    console.log('\n👤 Creating admin user...');
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {
        name: 'John Admin',
        role: 'admin',
        password: 'admin123', // Same password as local
        status: 'Active'
      },
      create: {
        email: 'admin@example.com',
        name: 'John Admin',
        role: 'admin',
        password: 'admin123',
        status: 'Active'
      }
    });
    console.log(`✅ Admin user created: ${adminUser.email}`);
    
    // Create additional users (same as your local setup)
    console.log('\n👥 Creating additional users...');
    const users = [
      {
        email: 'estimator@example.com',
        name: 'Jane Estimator',
        role: 'estimator',
        password: 'estimator123'
      },
      {
        email: 'user@example.com',
        name: 'Bob User',
        role: 'user',
        password: 'user123'
      }
    ];
    
    for (const userData of users) {
      await prisma.user.upsert({
        where: { email: userData.email },
        update: userData,
        create: userData
      });
      console.log(`✅ User created: ${userData.email}`);
    }
    
    // Create sample clients (same as your local setup)
    console.log('\n🏢 Creating sample clients...');
    const clients = [
      {
        clientType: 'Company',
        companyName: 'Eagan Inc.',
        contactPerson: 'John Smith',
        email: 'john.smith@eagan.com',
        phone: '501234567',
        countryCode: '+971',
        role: 'Marketing Manager'
      },
      {
        clientType: 'Company',
        companyName: 'Tech Solutions Ltd.',
        contactPerson: 'Sarah Johnson',
        email: 'sarah.j@techsolutions.com',
        phone: '559876543',
        countryCode: '+971',
        role: 'Operations Director'
      },
      {
        clientType: 'Company',
        companyName: 'Global Print Corp.',
        contactPerson: 'Michael Brown',
        email: 'michael.b@globalprint.com',
        phone: '524567890',
        countryCode: '+971',
        role: 'Procurement Manager'
      },
      {
        clientType: 'Company',
        companyName: 'Creative Agency',
        contactPerson: 'Lisa Wilson',
        email: 'lisa.w@creativeagency.com',
        phone: '543210987',
        countryCode: '+971',
        role: 'Creative Director'
      },
      {
        clientType: 'Individual',
        companyName: null,
        contactPerson: 'David Lee',
        email: 'david.lee@gmail.com',
        phone: '567890123',
        countryCode: '+971',
        role: null
      }
    ];
    
    for (const clientData of clients) {
      // Check if client exists by email, if not create
      const existingClient = await prisma.client.findFirst({
        where: { email: clientData.email }
      });
      
      if (existingClient) {
        await prisma.client.update({
          where: { id: existingClient.id },
          data: clientData
        });
        console.log(`✅ Client updated: ${clientData.contactPerson}`);
      } else {
        await prisma.client.create({
          data: clientData
        });
        console.log(`✅ Client created: ${clientData.contactPerson}`);
      }
    }
    
    // Create sample suppliers
    console.log('\n🏭 Creating sample suppliers...');
    const suppliers = [
      {
        name: 'Paper Source LLC',
        contact: 'Ahmed Hassan',
        email: 'ahmed@papersource.ae',
        phone: '501234567',
        countryCode: '+971',
        address: 'Sheikh Zayed Road',
        city: 'Dubai',
        state: 'Dubai',
        postalCode: '12345',
        country: 'UAE',
        status: 'Active'
      },
      {
        name: 'Print Materials Co.',
        contact: 'Fatima Al-Rashid',
        email: 'fatima@printmaterials.ae',
        phone: '559876543',
        countryCode: '+971',
        address: 'Al Wasl Road',
        city: 'Dubai',
        state: 'Dubai',
        postalCode: '54321',
        country: 'UAE',
        status: 'Active'
      }
    ];
    
    for (const supplierData of suppliers) {
      // Check if supplier exists by email, if not create
      const existingSupplier = await prisma.supplier.findFirst({
        where: { email: supplierData.email }
      });
      
      if (existingSupplier) {
        await prisma.supplier.update({
          where: { id: existingSupplier.id },
          data: supplierData
        });
        console.log(`✅ Supplier updated: ${supplierData.name}`);
      } else {
        await prisma.supplier.create({
          data: supplierData
        });
        console.log(`✅ Supplier created: ${supplierData.name}`);
      }
    }
    
    // Create sample materials
    console.log('\n📦 Creating sample materials...');
    const materials = [
      {
        materialId: 'M-001',
        name: 'Art Paper 300gsm',
        gsm: '300',
        supplierId: (await prisma.supplier.findFirst({ where: { email: 'ahmed@papersource.ae' } })).id,
        cost: 2.50,
        unit: 'per_sheet',
        status: 'Active'
      },
      {
        materialId: 'M-002',
        name: 'Glossy Paper 250gsm',
        gsm: '250',
        supplierId: (await prisma.supplier.findFirst({ where: { email: 'ahmed@papersource.ae' } })).id,
        cost: 3.20,
        unit: 'per_sheet',
        status: 'Active'
      },
      {
        materialId: 'M-003',
        name: 'Matte Paper 200gsm',
        gsm: '200',
        supplierId: (await prisma.supplier.findFirst({ where: { email: 'fatima@printmaterials.ae' } })).id,
        cost: 1.80,
        unit: 'per_sheet',
        status: 'Active'
      }
    ];
    
    for (const materialData of materials) {
      await prisma.material.upsert({
        where: { materialId: materialData.materialId },
        update: materialData,
        create: materialData
      });
      console.log(`✅ Material created: ${materialData.name}`);
    }
    
    console.log('\n🎉 Vercel database setup completed successfully!');
    console.log('\n📊 Setup Summary:');
    console.log('   - Users: 3 (admin, estimator, user)');
    console.log('   - Clients: 5 (companies and individuals)');
    console.log('   - Suppliers: 2 (paper and print materials)');
    console.log('   - Materials: 3 (different paper types)');
    
    console.log('\n🔑 Login Credentials:');
    console.log('   - Admin: admin@example.com / admin123');
    console.log('   - Estimator: estimator@example.com / estimator123');
    console.log('   - User: user@example.com / user123');
    
    console.log('\n✅ You can now login to your Vercel deployment!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupVercelDatabase();
