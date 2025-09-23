const { PrismaClient } = require('@prisma/client');

async function seedOperationalData() {
  console.log('🚀 Starting operational data seeding...');
  
  try {
    const prisma = new PrismaClient();

    console.log('🔌 Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected successfully!');

    // Create a sample client if it doesn't exist
    let sampleClient = await prisma.client.findFirst({
      where: { email: 'test@example.com' }
    });

    if (!sampleClient) {
      sampleClient = await prisma.client.create({
        data: {
          clientType: 'Company',
          companyName: 'Test Company',
          contactPerson: 'John Doe',
          email: 'test@example.com',
          phone: '+1234567890',
          countryCode: 'US',
          role: 'Manager'
        }
      });
      console.log('✅ Sample client created:', sampleClient.contactPerson);
    } else {
      console.log('✅ Sample client already exists:', sampleClient.contactPerson);
    }

    // Create a sample quote with operational data
    console.log('📋 Creating sample quote with operational data...');
    
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
          product: 'Business Card',
          quantity: 1000,
          sides: '2',
          printing: 'Offset',
          papers: {
            create: [
              {
                name: 'Art Paper',
                gsm: '300',
                inputWidth: 65,
                inputHeight: 90,
                pricePerPacket: 240,
                sheetsPerPacket: 500,
                recommendedSheets: 125,
                enteredSheets: 130,
                outputWidth: 9,
                outputHeight: 5.5
              }
            ]
          },
          finishing: {
            create: [
              {
                name: 'UV Spot',
                cost: 20
              },
              {
                name: 'Lamination',
                cost: 15
              }
            ]
          },
          amounts: {
            create: {
              base: 2450,
              vat: 122.5,
              total: 2572.5
            }
          },
          operational: {
            create: {
              plates: 8,
              units: 2000
            }
          }
        }
      });
      console.log('✅ Sample quote with operational data created:', sampleQuote.quoteId);
    } else {
      console.log('✅ Sample quote already exists:', sampleQuote.quoteId);
    }

    // Create another sample quote for testing
    console.log('📋 Creating second sample quote...');
    
    let sampleQuote2 = await prisma.quote.findFirst({
      where: { quoteId: 'QT-2024-002' }
    });

    if (!sampleQuote2) {
      sampleQuote2 = await prisma.quote.create({
        data: {
          quoteId: 'QT-2024-002',
          date: new Date(),
          status: 'Pending',
          clientId: sampleClient.id,
          product: 'Flyer A5',
          quantity: 5000,
          sides: '2',
          printing: 'Digital',
          papers: {
            create: [
              {
                name: 'Glossy Paper',
                gsm: '200',
                inputWidth: 35,
                inputHeight: 50,
                pricePerPacket: 180,
                sheetsPerPacket: 500,
                recommendedSheets: 2500,
                enteredSheets: 2500,
                outputWidth: 14.8,
                outputHeight: 21
              }
            ]
          },
          finishing: {
            create: [
              {
                name: 'Lamination',
                cost: 10
              }
            ]
          },
          amounts: {
            create: {
              base: 1800,
              vat: 90,
              total: 1890
            }
          },
          operational: {
            create: {
              plates: 0,
              units: 10000
            }
          }
        }
      });
      console.log('✅ Second sample quote created:', sampleQuote2.quoteId);
    } else {
      console.log('✅ Second sample quote already exists:', sampleQuote2.quoteId);
    }

    console.log('🎉 Operational data seeding completed successfully!');
    console.log('📊 You can now test the quote selection functionality with operational data.');

  } catch (error) {
    console.error('❌ Error seeding operational data:', error);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

seedOperationalData();
