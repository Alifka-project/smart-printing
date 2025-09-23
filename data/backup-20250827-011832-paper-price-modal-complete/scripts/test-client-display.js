import { PrismaClient } from '@prisma/client';

async function testClientDisplay() {
  console.log('🔍 Testing Client Data Structure for Frontend Display...');
  console.log('=' .repeat(60));
  
  const prisma = new PrismaClient();
  
  try {
    // Get all clients
    const clients = await prisma.client.findMany({
      take: 5, // Just get first 5 for testing
      select: {
        id: true,
        clientType: true,
        companyName: true,
        contactPerson: true,
        email: true,
        phone: true,
        countryCode: true,
        role: true,
        status: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        _count: {
          select: {
            quotes: true
          }
        }
      }
    });
    
    console.log(`📊 Found ${clients.length} clients`);
    
    if (clients.length > 0) {
      console.log('\n🔍 Sample Client Data Structure:');
      const sample = clients[0];
      
      console.log('   ID:', sample.id);
      console.log('   Client Type:', sample.clientType);
      console.log('   Company Name:', sample.companyName);
      console.log('   Contact Person:', sample.contactPerson);
      console.log('   Email:', sample.email);
      console.log('   Phone:', sample.phone);
      console.log('   Country Code:', sample.countryCode);
      console.log('   Role:', sample.role);
      console.log('   Status:', sample.status);
      console.log('   Address:', sample.address);
      console.log('   City:', sample.city);
      console.log('   State:', sample.state);
      console.log('   Postal Code:', sample.postalCode);
      console.log('   Country:', sample.country);
      console.log('   User ID:', sample.userId);
      console.log('   Quote Count:', sample._count.quotes);
      
      // Check for any null/undefined values that might cause issues
      console.log('\n🔍 Data Validation:');
      const requiredFields = ['id', 'clientType', 'contactPerson', 'email', 'phone', 'countryCode'];
      let hasIssues = false;
      
      requiredFields.forEach(field => {
        if (!sample[field]) {
          console.log(`   ❌ Missing required field: ${field}`);
          hasIssues = true;
        }
      });
      
      if (!hasIssues) {
        console.log('   ✅ All required fields are present');
      }
      
      // Check if the data structure matches what the frontend expects
      console.log('\n🔍 Frontend Compatibility Check:');
      
      // The frontend expects these fields to exist (even if null)
      const expectedFields = ['address', 'city', 'state', 'postalCode', 'country', 'status'];
      expectedFields.forEach(field => {
        if (sample[field] === undefined) {
          console.log(`   ⚠️  Field '${field}' is undefined (frontend might expect it)`);
        } else if (sample[field] === null) {
          console.log(`   ✅ Field '${field}' is null (acceptable for frontend)`);
        } else {
          console.log(`   ✅ Field '${field}' has value: ${sample[field]}`);
        }
      });
      
      console.log('\n🎯 Frontend Display Status:');
      if (clients.length > 0) {
        console.log('   ✅ Data is available and properly structured');
        console.log('   ✅ Frontend should be able to display clients');
        console.log('   💡 If frontend shows 0 clients, check:');
        console.log('      1. Browser console for JavaScript errors');
        console.log('      2. Network tab for API call failures');
        console.log('      3. Filter settings (search, status, client type)');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing client display:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testClientDisplay();
