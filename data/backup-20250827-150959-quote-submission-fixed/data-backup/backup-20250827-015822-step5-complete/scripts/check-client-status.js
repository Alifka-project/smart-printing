const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkClientStatus() {
  try {
    console.log('🔍 Checking client status field...\n');

    // Check current status of clients
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        contactPerson: true,
        companyName: true,
        status: true,
      },
      take: 10
    });

    console.log('📋 Current client status:');
    clients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.contactPerson} - Status: ${client.status || 'NULL'}`);
    });

    // Count clients with null status
    const nullStatusCount = clients.filter(c => !c.status).length;
    console.log(`\n📊 Clients with NULL status: ${nullStatusCount}`);

    if (nullStatusCount > 0) {
      console.log('\n🔧 Fixing null status values...');
      
      // Update all clients with null status to "Active"
      const result = await prisma.client.updateMany({
        where: {
          OR: [
            { status: null },
            { status: undefined }
          ]
        },
        data: {
          status: "Active"
        }
      });

      console.log(`✅ Updated ${result.count} clients with "Active" status`);
      
      // Verify the fix
      const updatedClients = await prisma.client.findMany({
        select: {
          id: true,
          contactPerson: true,
          companyName: true,
          status: true,
        },
        take: 5
      });

      console.log('\n📋 Updated client status:');
      updatedClients.forEach((client, index) => {
        console.log(`${index + 1}. ${client.contactPerson} - Status: ${client.status}`);
      });
    }

    console.log('\n✅ Client status check completed!');

  } catch (error) {
    console.error('❌ Error checking client status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClientStatus();
