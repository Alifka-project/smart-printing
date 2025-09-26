const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function demonstrateRelationships() {
  try {
    console.log('🎯 Demonstrating Database Relationships\n');
    console.log('=' .repeat(50));

    // 1. Show all quotes with their complete relationships
    console.log('\n📋 ALL QUOTES WITH RELATIONSHIPS:');
    console.log('-'.repeat(50));
    
    const allQuotes = await prisma.quote.findMany({
      include: {
        client: true,
        user: true,
        amounts: true,
        papers: true,
        finishing: true,
        operational: true,
      },
      orderBy: { date: 'desc' },
    });

    allQuotes.forEach((quote, index) => {
      console.log(`\n${index + 1}. Quote: ${quote.quoteId}`);
      console.log(`   📅 Date: ${quote.date.toLocaleDateString()}`);
      console.log(`   📊 Status: ${quote.status}`);
      console.log(`   👥 Client: ${quote.client.contactPerson} (${quote.client.companyName || 'Individual'})`);
      console.log(`   👤 User: ${quote.user.name} (${quote.user.role})`);
      console.log(`   💰 Amount: $${quote.amounts?.total || 0}`);
      console.log(`   📄 Papers: ${quote.papers.length} types`);
      console.log(`   ✨ Finishing: ${quote.finishing.length} options`);
      console.log(`   ⚙️  Operational: ${quote.operational ? 'Yes' : 'No'}`);
    });

    // 2. Show clients with their quote counts and values
    console.log('\n\n👥 CLIENTS WITH QUOTE SUMMARIES:');
    console.log('-'.repeat(50));
    
    const clientsWithQuotes = await prisma.client.findMany({
      include: {
        quotes: {
          include: {
            amounts: true,
            user: true,
          }
        },
        user: true,
      },
      orderBy: {
        quotes: {
          _count: 'desc'
        }
      }
    });

    clientsWithQuotes.forEach((client, index) => {
      if (client.quotes.length > 0) {
        const totalValue = client.quotes.reduce((sum, quote) => sum + (quote.amounts?.total || 0), 0);
        const avgValue = totalValue / client.quotes.length;
        
        console.log(`\n${index + 1}. ${client.contactPerson}`);
        console.log(`   🏢 Company: ${client.companyName || 'Individual'}`);
        console.log(`   📊 Total Quotes: ${client.quotes.length}`);
        console.log(`   💰 Total Value: $${totalValue.toFixed(2)}`);
        console.log(`   📈 Average Value: $${avgValue.toFixed(2)}`);
        console.log(`   👤 Assigned User: ${client.user?.name || 'None'}`);
        console.log(`   📧 Email: ${client.email}`);
        
        // Show recent quotes
        const recentQuotes = client.quotes.slice(0, 3);
        recentQuotes.forEach((quote, qIndex) => {
          console.log(`      ${qIndex + 1}. ${quote.quoteId} - $${quote.amounts?.total || 0} (${quote.status})`);
        });
      }
    });

    // 3. Show users with their quote and client counts
    console.log('\n\n👤 USERS WITH ACTIVITY SUMMARY:');
    console.log('-'.repeat(50));
    
    const usersWithActivity = await prisma.user.findMany({
      include: {
        quotes: {
          include: {
            amounts: true,
            client: true,
          }
        },
        clients: true,
      },
      orderBy: {
        quotes: {
          _count: 'desc'
        }
      }
    });

    usersWithActivity.forEach((user, index) => {
      if (user.quotes.length > 0 || user.clients.length > 0) {
        const totalQuoteValue = user.quotes.reduce((sum, quote) => sum + (quote.amounts?.total || 0), 0);
        const avgQuoteValue = user.quotes.length > 0 ? totalQuoteValue / user.quotes.length : 0;
        
        console.log(`\n${index + 1}. ${user.name} (${user.role})`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   📊 Total Quotes: ${user.quotes.length}`);
        console.log(`   💰 Total Quote Value: $${totalQuoteValue.toFixed(2)}`);
        console.log(`   📈 Average Quote Value: $${avgQuoteValue.toFixed(2)}`);
        console.log(`   👥 Total Clients: ${user.clients.length}`);
        console.log(`   📅 Status: ${user.status}`);
        
        // Show top quotes by value
        const topQuotes = user.quotes
          .sort((a, b) => (b.amounts?.total || 0) - (a.amounts?.total || 0))
          .slice(0, 3);
        
        if (topQuotes.length > 0) {
          console.log(`   🏆 Top Quotes:`);
          topQuotes.forEach((quote, qIndex) => {
            console.log(`      ${qIndex + 1}. ${quote.quoteId} - $${quote.amounts?.total || 0} for ${quote.client.contactPerson}`);
          });
        }
      }
    });

    // 4. Show suppliers with their materials
    console.log('\n\n🏢 SUPPLIERS WITH MATERIALS:');
    console.log('-'.repeat(50));
    
    const suppliersWithMaterials = await prisma.supplier.findMany({
      include: {
        materials: true,
      },
      orderBy: {
        materials: {
          _count: 'desc'
        }
      }
    });

    suppliersWithMaterials.forEach((supplier, index) => {
      const totalMaterialCost = supplier.materials.reduce((sum, material) => sum + material.cost, 0);
      const avgMaterialCost = supplier.materials.length > 0 ? totalMaterialCost / supplier.materials.length : 0;
      
      console.log(`\n${index + 1}. ${supplier.name}`);
      console.log(`   📧 Email: ${supplier.email || 'N/A'}`);
      console.log(`   📞 Phone: ${supplier.phone || 'N/A'}`);
      console.log(`   📍 Location: ${supplier.city}, ${supplier.country}`);
      console.log(`   📊 Total Materials: ${supplier.materials.length}`);
      console.log(`   💰 Total Material Cost: $${totalMaterialCost.toFixed(2)}`);
      console.log(`   📈 Average Material Cost: $${avgMaterialCost.toFixed(2)}`);
      console.log(`   📅 Status: ${supplier.status}`);
      
      // Show sample materials
      const sampleMaterials = supplier.materials.slice(0, 3);
      if (sampleMaterials.length > 0) {
        console.log(`   📦 Sample Materials:`);
        sampleMaterials.forEach((material, mIndex) => {
          console.log(`      ${mIndex + 1}. ${material.name} (${material.gsm} GSM) - $${material.cost}/${material.unit}`);
        });
      }
    });

    // 5. Show relationship statistics
    console.log('\n\n📊 RELATIONSHIP STATISTICS:');
    console.log('-'.repeat(50));
    
    const stats = await Promise.all([
      prisma.user.count(),
      prisma.client.count(),
      prisma.quote.count(),
      prisma.supplier.count(),
      prisma.material.count(),
      prisma.quote.count({ where: { clientId: { not: '' } } }),
      prisma.quote.count({ where: { userId: { not: '' } } }),
      prisma.client.count({ where: { userId: { not: '' } } }),
      prisma.material.count({ where: { supplierId: { not: '' } } }),
    ]);

    console.log(`👥 Users: ${stats[0]}`);
    console.log(`👤 Clients: ${stats[1]}`);
    console.log(`📋 Quotes: ${stats[2]}`);
    console.log(`🏢 Suppliers: ${stats[3]}`);
    console.log(`📦 Materials: ${stats[4]}`);
    console.log(`🔗 Quotes with Clients: ${stats[5]} (${((stats[5]/stats[2])*100).toFixed(1)}%)`);
    console.log(`🔗 Quotes with Users: ${stats[6]} (${((stats[6]/stats[2])*100).toFixed(1)}%)`);
    console.log(`🔗 Clients with Users: ${stats[7]} (${((stats[7]/stats[1])*100).toFixed(1)}%)`);
    console.log(`🔗 Materials with Suppliers: ${stats[8]} (${((stats[8]/stats[4])*100).toFixed(1)}%)`);

    // 6. Show some interesting insights
    console.log('\n\n💡 INTERESTING INSIGHTS:');
    console.log('-'.repeat(50));
    
    // Most valuable quote
    const mostValuableQuote = await prisma.quote.findFirst({
      include: {
        client: true,
        user: true,
        amounts: true,
      },
      orderBy: {
        amounts: {
          total: 'desc'
        }
      }
    });

    if (mostValuableQuote) {
      console.log(`🏆 Most Valuable Quote:`);
      console.log(`   Quote ID: ${mostValuableQuote.quoteId}`);
      console.log(`   Client: ${mostValuableQuote.client.contactPerson}`);
      console.log(`   User: ${mostValuableQuote.user.name}`);
      console.log(`   Value: $${mostValuableQuote.amounts?.total || 0}`);
      console.log(`   Status: ${mostValuableQuote.status}`);
    }

    // Find the client with highest total value manually
    let clientWithHighestValue = null;
    let highestTotalValue = 0;
    
    for (const client of clientsWithQuotes) {
      if (client.quotes.length > 0) {
        const totalValue = client.quotes.reduce((sum, quote) => sum + (quote.amounts?.total || 0), 0);
        if (totalValue > highestTotalValue) {
          highestTotalValue = totalValue;
          clientWithHighestValue = client;
        }
      }
    }

    if (clientWithHighestValue && clientWithHighestValue.quotes.length > 0) {
      const totalValue = clientWithHighestValue.quotes.reduce((sum, quote) => sum + (quote.amounts?.total || 0), 0);
      console.log(`\n💰 Client with Highest Total Value:`);
      console.log(`   Name: ${clientWithHighestValue.contactPerson}`);
      console.log(`   Company: ${clientWithHighestValue.companyName || 'Individual'}`);
      console.log(`   Total Value: $${totalValue.toFixed(2)}`);
      console.log(`   Quote Count: ${clientWithHighestValue.quotes.length}`);
    }

    console.log('\n✅ All relationships are working perfectly!');
    console.log('🎯 You can now see which clients have how many quotes,');
    console.log('   which users created which quotes, and all the connections!');

  } catch (error) {
    console.error('❌ Error demonstrating relationships:', error);
  } finally {
    await prisma.$disconnect();
  }
}

demonstrateRelationships();
