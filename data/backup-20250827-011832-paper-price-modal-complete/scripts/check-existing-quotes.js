const { PrismaClient } = require('@prisma/client');

async function checkExistingQuotes() {
  console.log('🔍 Checking existing quotes in database...');
  
  try {
    const prisma = new PrismaClient();

    console.log('🔌 Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected successfully!');

    // Get all quotes with their related data
    const quotes = await prisma.quote.findMany({
      include: {
        client: true,
        papers: true,
        finishing: true,
        amounts: true,
        operational: true
      }
    });

    console.log(`\n📊 Found ${quotes.length} quotes in database:`);
    
    quotes.forEach((quote, index) => {
      console.log(`\n--- Quote ${index + 1} ---`);
      console.log(`ID: ${quote.id}`);
      console.log(`Quote ID: ${quote.quoteId}`);
      console.log(`Product: ${quote.product}`);
      console.log(`Quantity: ${quote.quantity}`);
      console.log(`Sides: ${quote.sides}`);
      console.log(`Printing: ${quote.printing}`);
      
      // Check colors
      if (quote.colors) {
        try {
          const parsedColors = JSON.parse(quote.colors);
          console.log(`🎨 Colors: Front: "${parsedColors.front}", Back: "${parsedColors.back}"`);
        } catch (e) {
          console.log(`🎨 Colors (raw): ${quote.colors}`);
        }
      } else {
        console.log(`🎨 Colors: None`);
      }
      
      // Check papers and their colors
      if (quote.papers && quote.papers.length > 0) {
        console.log(`📄 Papers: ${quote.papers.length} paper(s)`);
        quote.papers.forEach((paper, pIndex) => {
          console.log(`  Paper ${pIndex + 1}: ${paper.name} (${paper.gsm}gsm)`);
          if (paper.selectedColors) {
            try {
              const parsedColors = JSON.parse(paper.selectedColors);
              console.log(`    🎨 Selected Colors: [${parsedColors.join(', ')}]`);
            } catch (e) {
              console.log(`    🎨 Selected Colors (raw): ${paper.selectedColors}`);
            }
          } else {
            console.log(`    🎨 Selected Colors: None`);
          }
        });
      } else {
        console.log(`📄 Papers: None`);
      }
      
      // Check operational data
      if (quote.operational) {
        console.log(`⚙️ Operational: Plates: ${quote.operational.plates}, Units: ${quote.operational.units}`);
      } else {
        console.log(`⚙️ Operational: None`);
      }
    });

    console.log('\n🎉 Quote check completed!');

  } catch (error) {
    console.error('❌ Error checking quotes:', error);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

checkExistingQuotes();
