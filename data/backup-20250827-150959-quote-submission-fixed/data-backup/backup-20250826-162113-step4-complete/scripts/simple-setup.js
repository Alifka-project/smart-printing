const { PrismaClient } = require('@prisma/client');

async function simpleSetup() {
  console.log('🚀 Starting simple database setup...');
  
  try {
    // Create Prisma client with your new Vercel Prisma Accelerate connection
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: 'prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza18xc0dkeFdBOTFuNW1jNWZTNkpUczAiLCJhcGlfa2V5IjoiMDFLMzRRTVFYTVhDR0VaMkFBS1lTMFo3RUMiLCJ0ZW5hbnRfaWQiOiJjOTFjODU2MWZlOGI2YjM0YTU5ODVmMTdhYzU2NGNhMzY3OTY5ZmU5Mjg1NTdjNGM0ZjZiNWJjNzgwNzMzMjgxIiwiaW50ZXJuYWxfc2VjcmV0IjoiNGY4OWUzMTItMDE4OC00ZjE4LWFhMGQtYTc1OWVhN2EzNGE5In0.lPVxsK7w4PqWlM7f5ErZ-LE7ixz4nL1rVMJIRttzRqs'
        }
      }
    });

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
        password: 'admin123', // Simple password for testing
        profilePicture: null,
        status: 'Active'
      }
    });

    console.log('✅ Admin user created:', adminUser.email);
    console.log('🔑 Login credentials: admin@example.com / admin123');

    // Create a sample client
    console.log('👥 Creating sample client...');
    
    // Check if client already exists
    let sampleClient = await prisma.client.findFirst({
      where: { email: 'client@example.com' }
    });

    if (!sampleClient) {
      sampleClient = await prisma.client.create({
        data: {
          clientType: 'Company',
          companyName: 'Sample Company',
          contactPerson: 'John Doe',
          email: 'client@example.com',
          phone: '+1234567890',
          countryCode: 'US',
          role: 'Manager'
        }
      });
      console.log('✅ Sample client created:', sampleClient.contactPerson);
    } else {
      console.log('✅ Sample client already exists:', sampleClient.contactPerson);
    }

    // Create a sample quote
    console.log('📋 Creating sample quote...');
    
    // Check if quote already exists
    let sampleQuote = await prisma.quote.findFirst({
      where: { quoteId: 'QT-2024-001' }
    });

    if (!sampleQuote) {
      sampleQuote = await prisma.quote.create({
        data: {
          quoteId: 'QT-2024-001',
          date: new Date(),
          status: 'Pending',
          clientId: sampleClient.id,
          userId: adminUser.id,
          product: 'Business Cards',
          quantity: 1000,
          sides: 'Double-sided',
          printing: 'Full Color'
        }
      });
      console.log('✅ Sample quote created:', sampleQuote.quoteId);
    } else {
      console.log('✅ Sample quote already exists:', sampleQuote.quoteId);
    }

    // Create sample paper
    console.log('📄 Creating sample paper...');
    
    let samplePaper = await prisma.paper.findFirst({
      where: { id: 'paper-001' }
    });

    if (!samplePaper) {
      samplePaper = await prisma.paper.create({
        data: {
          id: 'paper-001',
          name: 'Premium Card Stock',
          gsm: '300',
          quoteId: sampleQuote.id
        }
      });
      console.log('✅ Sample paper created:', samplePaper.name);
    } else {
      console.log('✅ Sample paper already exists:', samplePaper.name);
    }

    // Create sample finishing
    console.log('✨ Creating sample finishing...');
    
    let sampleFinishing = await prisma.finishing.findFirst({
      where: { id: 'finish-001' }
    });

    if (!sampleFinishing) {
      sampleFinishing = await prisma.finishing.create({
        data: {
          id: 'finish-001',
          name: 'UV Coating',
          quoteId: sampleQuote.id
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
          base: 150.00,
          vat: 15.00,
          total: 165.00,
          quoteId: sampleQuote.id
        }
      });
      console.log('✅ Sample amount created:', `$${sampleAmount.total}`);
    } else {
      console.log('✅ Sample amount already exists:', `$${sampleAmount.total}`);
    }

    console.log('\n🎉 Setup complete! You can now:');
    console.log('1. Login with: admin@example.com / admin123');
    console.log('2. Your app should work on Vercel!');
    console.log('3. You have sample data to test with:');
    console.log('   - Admin user (admin@example.com)');
    console.log('   - Sample client (client@example.com)');
    console.log('   - Sample quote (QT-2024-001)');
    console.log('   - Sample paper, finishing, and pricing');
    console.log('4. Add more data later as needed');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    
    if (error.message.includes('Can\'t reach database server')) {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check if your Vercel app is redeployed');
      console.log('2. Verify the connection string is correct');
      console.log('3. Wait a few minutes for database to be ready');
    }
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

simpleSetup();
