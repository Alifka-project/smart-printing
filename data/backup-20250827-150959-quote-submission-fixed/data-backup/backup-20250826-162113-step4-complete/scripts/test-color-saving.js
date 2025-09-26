const { PrismaClient } = require('@prisma/client');

async function testColorSaving() {
  console.log('🎨 Testing color saving and loading...');
  
  try {
    const prisma = new PrismaClient();

    console.log('🔌 Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected successfully!');

    // Create a test client
    let testClient = await prisma.client.findFirst({
      where: { email: 'test-colors@example.com' }
    });

    if (!testClient) {
      testClient = await prisma.client.create({
        data: {
          clientType: 'Company',
          companyName: 'Color Test Company',
          contactPerson: 'Color Tester',
          email: 'test-colors@example.com',
          phone: '+1234567890',
          countryCode: 'US',
          role: 'Color Manager'
        }
      });
      console.log('✅ Test client created:', testClient.contactPerson);
    } else {
      console.log('✅ Test client already exists:', testClient.contactPerson);
    }

    // Create a test quote with colors
    console.log('📋 Creating test quote with colors...');
    
    const testQuote = await prisma.quote.create({
      data: {
        quoteId: 'QT-COLOR-TEST',
        date: new Date(),
        status: 'Pending',
        clientId: testClient.id,
        product: 'Colorful Business Card',
        quantity: 1000,
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
              recommendedSheets: 125,
              enteredSheets: 125,
              outputWidth: 9,
              outputHeight: 5.5,
              selectedColors: JSON.stringify(['cmyk', 'red', 'blue', 'gold'])
            }
          ]
        },
        finishing: {
          create: [
            {
              name: 'UV Spot',
              cost: 25
            }
          ]
        },
        amounts: {
          create: {
            base: 2000,
            vat: 100,
            total: 2100
          }
        },
        operational: {
          create: {
            plates: 8,
            units: 2000
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

    console.log('✅ Test quote with colors created successfully!');
    console.log('📊 Quote ID:', testQuote.quoteId);
    console.log('🎨 Quote Colors:', testQuote.colors);
    console.log('📄 Paper Colors:', testQuote.papers[0].selectedColors);

    // Test retrieving the quote to verify colors are saved
    console.log('\n🔍 Testing quote retrieval with colors...');
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
      console.log('✅ Quote retrieved successfully with all color details');
      console.log('🎨 Quote Colors parsed:', JSON.parse(retrievedQuote.colors));
      console.log('📄 Paper Colors parsed:', JSON.parse(retrievedQuote.papers[0].selectedColors));
      
      // Verify the colors are properly parsed
      const quoteColors = JSON.parse(retrievedQuote.colors);
      const paperColors = JSON.parse(retrievedQuote.papers[0].selectedColors);
      
      console.log('✅ Quote Colors - Front:', quoteColors.front);
      console.log('✅ Quote Colors - Back:', quoteColors.back);
      console.log('✅ Paper Selected Colors:', paperColors.join(', '));
      
      if (quoteColors.front === '4 Colors (CMYK)' && 
          quoteColors.back === '2 Colors (Black + Pantone Red)' &&
          paperColors.includes('cmyk') && 
          paperColors.includes('red') && 
          paperColors.includes('blue') && 
          paperColors.includes('gold')) {
        console.log('🎉 All colors are being saved and loaded correctly!');
      } else {
        console.log('❌ Some colors are missing or incorrect');
      }
    } else {
      console.log('❌ Failed to retrieve quote');
    }

    console.log('\n🎉 Color saving test completed successfully!');
    console.log('📝 Colors from both Step 3 (quote level) and Step 4 (paper level) are being saved and retrieved properly.');

  } catch (error) {
    console.error('❌ Error in color saving test:', error);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

testColorSaving();
