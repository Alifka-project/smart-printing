const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addAddressFieldsToClients() {
  try {
    console.log('Starting to add address fields to clients table...');
    
    // First, let's check if the fields already exist
    const existingClients = await prisma.client.findMany({
      take: 1,
      select: {
        id: true,
        clientType: true,
        companyName: true,
        contactPerson: true,
        email: true,
        phone: true,
        countryCode: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    console.log('Sample client structure:', existingClients[0]);
    
    // Since we can't directly alter SQLite tables with Prisma in this way,
    // we'll need to recreate the table or use raw SQL
    // For now, let's try to update existing clients with address data
    
    // Get all existing clients
    const allClients = await prisma.client.findMany();
    console.log(`Found ${allClients.length} existing clients`);
    
    // Update each client with sample address data
    for (const client of allClients) {
      const addressData = generateSampleAddress(client.countryCode);
      
      try {
        await prisma.client.update({
          where: { id: client.id },
          data: {
            address: addressData.address,
            city: addressData.city,
            state: addressData.state,
            postalCode: addressData.postalCode,
            country: addressData.country,
          }
        });
        console.log(`Updated client ${client.contactPerson} with address data`);
      } catch (updateError) {
        console.log(`Could not update client ${client.contactPerson}:`, updateError.message);
      }
    }
    
    console.log('Address fields update process completed');
    
  } catch (error) {
    console.error('Error adding address fields:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function generateSampleAddress(countryCode) {
  const addressTemplates = {
    '+971': { // UAE
      address: 'Sheikh Zayed Road, Business Bay',
      city: 'Dubai',
      state: 'Dubai',
      postalCode: '12345',
      country: 'UAE'
    },
    '+91': { // India
      address: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India'
    },
    '+62': { // Indonesia
      address: 'Jl. Sudirman No. 123',
      city: 'Jakarta',
      state: 'Jakarta',
      postalCode: '12190',
      country: 'Indonesia'
    }
  };
  
  // Map other country codes to the three allowed countries
  const countryCodeMapping = {
    '+49': '+91', // Germany -> India
    '+31': '+91', // Netherlands -> India
    '+1': '+91',  // USA -> India
    '+65': '+91', // Singapore -> India
    '+60': '+91', // Malaysia -> India
    '+852': '+91', // Hong Kong -> India
    '+34': '+91', // Spain -> India
    '+82': '+91', // South Korea -> India
    '+33': '+91', // France -> India
    '+41': '+91', // Switzerland -> India
    '+39': '+91', // Italy -> India
    '+46': '+91', // Sweden -> India
    '+358': '+91', // Finland -> India
    '+61': '+91', // Australia -> India
    '+32': '+91', // Belgium -> India
    '+44': '+91', // UK -> India
    '+353': '+91', // Ireland -> India
    '+81': '+91'  // Japan -> India
  };
  
  const mappedCountryCode = countryCodeMapping[countryCode] || countryCode;
  return addressTemplates[mappedCountryCode] || addressTemplates['+91']; // Default to India
}

// Run the script
addAddressFieldsToClients()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
