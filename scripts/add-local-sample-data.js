const { PrismaClient } = require('@prisma/client');

async function addLocalSampleData() {
  console.log('🚀 Starting local database setup...');
  
  try {
    // Create Prisma client for local database
    const prisma = new PrismaClient();

    console.log('🔌 Testing database connection...');
    
    // Test connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected successfully!');

    // Create admin user
    console.log('👤 Creating admin user...');
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
        password: 'admin123',
        profilePicture: null,
        status: 'Active'
      }
    });

    console.log('✅ Admin user created:', adminUser.email);

    // Create a sample client
    console.log('👥 Creating sample client...');
    
    let sampleClient = await prisma.client.findFirst({
      where: { email: 'client@example.com' }
    });

    if (!sampleClient) {
      sampleClient = await prisma.client.create({
        data: {
          clientType: 'Company',
          companyName: 'Maxtry',
          contactPerson: 'Maxtry Maxtion',
          email: 'client@example.com',
          phone: '123455',
          countryCode: '+971',
          role: 'Maxtion',
          address: 'DSO, Dubai, UAE',
          city: 'Dubai',
          state: 'Dubai',
          postalCode: '0000',
          country: 'UAE'
        }
      });
      console.log('✅ Sample client created:', sampleClient.contactPerson);
    } else {
      console.log('✅ Sample client already exists:', sampleClient.contactPerson);
    }

    // Create a sample quote
    console.log('📋 Creating sample quote...');
    
    let sampleQuote = await prisma.quote.findFirst({
      where: { quoteId: 'QT-2025-0827-966' }
    });

    if (!sampleQuote) {
      sampleQuote = await prisma.quote.create({
        data: {
          quoteId: 'QT-2025-0827-966',
          date: new Date('2025-08-27'),
          status: 'Pending',
          clientId: sampleClient.id,
          userId: adminUser.id,
          product: 'Book',
          quantity: 1000,
          sides: '2',
          printing: 'Offset'
        }
      });
      console.log('✅ Sample quote created:', sampleQuote.quoteId);
    } else {
      console.log('✅ Sample quote already exists:', sampleQuote.quoteId);
    }

    // Create sample paper
    console.log('📄 Creating sample paper...');
    
    let samplePaper = await prisma.paper.findFirst({
      where: { quoteId: sampleQuote.id }
    });

    if (!samplePaper) {
      samplePaper = await prisma.paper.create({
        data: {
          name: 'Premium Book Paper',
          gsm: 80,
          quoteId: sampleQuote.id,
          inputWidth: 21.0,
          inputHeight: 29.7,
          pricePerPacket: 25.00,
          pricePerSheet: 0.025,
          sheetsPerPacket: 500,
          recommendedSheets: 1000,
          enteredSheets: 1000,
          outputWidth: 20.0,
          outputHeight: 28.0,
          selectedColors: 'CMYK'
        }
      });
      console.log('✅ Sample paper created:', samplePaper.name);
    } else {
      console.log('✅ Sample paper already exists:', samplePaper.name);
    }

    // Create sample finishing
    console.log('✨ Creating sample finishing...');
    
    let sampleFinishing = await prisma.finishing.findFirst({
      where: { quoteId: sampleQuote.id }
    });

    if (!sampleFinishing) {
      sampleFinishing = await prisma.finishing.create({
        data: {
          name: 'Binding',
          quoteId: sampleQuote.id,
          cost: 50.00
        }
      });
      console.log('✅ Sample finishing created:', sampleFinishing.name);
    } else {
      console.log('✅ Sample finishing already exists:', sampleFinishing.name);
    }

    // Create sample amount
    console.log('💰 Creating sample amount...');
    
    let sampleAmount = await prisma.quoteAmount.findFirst({
      where: { quoteId: sampleQuote.id }
    });

    if (!sampleAmount) {
      sampleAmount = await prisma.quoteAmount.create({
        data: {
          base: 75.00, // 1000 sheets × 0.025 + 50 finishing
          vat: 3.75,   // 5% VAT
          total: 78.75,
          quoteId: sampleQuote.id
        }
      });
      console.log('✅ Sample amount created:', `AED ${sampleAmount.total}`);
    } else {
      console.log('✅ Sample amount already exists:', `AED ${sampleAmount.total}`);
    }

    // Create a few more sample quotes
    console.log('📋 Creating additional sample quotes...');
    
    const additionalQuotes = [
      {
        quoteId: 'QT-2025-0827-825',
        product: 'Business Cards',
        quantity: 500,
        sides: '2',
        printing: 'Digital'
      },
      {
        quoteId: 'QT-2025-0827-799',
        product: 'Letterheads',
        quantity: 2000,
        sides: '1',
        printing: 'Offset'
      }
    ];

    for (const quoteData of additionalQuotes) {
      let quote = await prisma.quote.findFirst({
        where: { quoteId: quoteData.quoteId }
      });

      if (!quote) {
        quote = await prisma.quote.create({
          data: {
            ...quoteData,
            date: new Date('2025-08-27'),
            status: 'Pending',
            clientId: sampleClient.id,
            userId: adminUser.id
          }
        });
        console.log('✅ Additional quote created:', quote.quoteId);
      } else {
        console.log('✅ Additional quote already exists:', quote.quoteId);
      }
    }

    console.log('\n🎉 Local setup complete! You now have:');
    console.log('1. Admin user (admin@example.com)');
    console.log('2. Sample client (Maxtry)');
    console.log('3. Sample quotes with proper amounts');
    console.log('4. Sample paper and finishing data');
    console.log('5. The amounts should no longer show as 0 AED!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('Full error:', error);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

addLocalSampleData();
