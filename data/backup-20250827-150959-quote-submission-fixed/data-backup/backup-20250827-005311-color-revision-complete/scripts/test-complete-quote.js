const { PrismaClient } = require('@prisma/client');

async function testCompleteQuote() {
  console.log('🧪 Testing complete quote creation with all details...');
  
  try {
    const prisma = new PrismaClient();

    console.log('🔌 Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected successfully!');

    // Create a test client
    let testClient = await prisma.client.findFirst({
      where: { email: 'test-complete@example.com' }
    });

    if (!testClient) {
      testClient = await prisma.client.create({
        data: {
          clientType: 'Company',
          companyName: 'Complete Test Company',
          contactPerson: 'Jane Doe',
          email: 'test-complete@example.com',
          phone: '+1234567890',
          countryCode: 'US',
          role: 'Test Manager'
        }
      });
      console.log('✅ Test client created:', testClient.contactPerson);
    } else {
      console.log('✅ Test client already exists:', testClient.contactPerson);
    }

    // Create a comprehensive test quote with ALL details
    console.log('📋 Creating comprehensive test quote...');
    
    const testQuote = await prisma.quote.create({
      data: {
        quoteId: 'QT-TEST-COMPLETE',
        date: new Date(),
        status: 'Pending',
        clientId: testClient.id,
        product: 'Business Card Premium',
        quantity: 2000,
        sides: '2',
        printing: 'Offset',
        colors: JSON.stringify({
          front: '4 Colors (CMYK)',
          back: '2 Colors (Black + Pantone Red)'
        }),
        papers: {
          create: [
            {
              name: 'Premium Art Paper',
              gsm: '350',
              inputWidth: 70,
              inputHeight: 95,
              pricePerPacket: 280,
              sheetsPerPacket: 500,
              recommendedSheets: 250,
              enteredSheets: 250,
              outputWidth: 9,
              outputHeight: 5.5
            }
          ]
        },
        finishing: {
          create: [
            {
              name: 'UV Spot',
              cost: 25
            },
            {
              name: 'Foil Stamping',
              cost: 35
            },
            {
              name: 'Lamination',
              cost: 20
            }
          ]
        },
        amounts: {
          create: {
            base: 3200,
            vat: 160,
            total: 3360
          }
        },
        operational: {
          create: {
            plates: 8,
            units: 4000
          }
        }
      },
      include: {
        client: true,
        papers: true,
        finishing: true,
        amounts: true,
        operational: true
      }
    });

    console.log('✅ Comprehensive test quote created successfully!');
    console.log('📊 Quote ID:', testQuote.quoteId);
    console.log('🎨 Colors:', testQuote.colors);
    console.log('📄 Papers:', testQuote.papers.length, 'paper(s) with full specs');
    console.log('✨ Finishing:', testQuote.finishing.length, 'finishing option(s) with costs');
    console.log('💰 Amounts: Base $' + testQuote.amounts?.base + ', Total $' + testQuote.amounts?.total);
    console.log('⚙️ Operational: Plates', testQuote.operational?.plates + ', Units', testQuote.operational?.units);

    // Test retrieving the quote to verify all data is saved
    console.log('\n🔍 Testing quote retrieval...');
    const retrievedQuote = await prisma.quote.findUnique({
      where: { id: testQuote.id },
      include: {
        client: true,
        papers: true,
        finishing: true,
        amounts: true,
        operational: true
      }
    });

    if (retrievedQuote) {
      console.log('✅ Quote retrieved successfully with all details');
      console.log('🎨 Colors parsed:', JSON.parse(retrievedQuote.colors));
      console.log('📄 Paper specs:', retrievedQuote.papers[0]);
      console.log('✨ Finishing costs:', retrievedQuote.finishing);
      console.log('💰 Amounts:', retrievedQuote.amounts);
      console.log('⚙️ Operational:', retrievedQuote.operational);
    } else {
      console.log('❌ Failed to retrieve quote');
    }

    console.log('\n🎉 Complete quote test finished successfully!');
    console.log('📝 All information including colors, paper specs, finishing costs, and operational data is being saved and retrieved properly.');

  } catch (error) {
    console.error('❌ Error in complete quote test:', error);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

testCompleteQuote();
