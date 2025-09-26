const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProfilePicture() {
  try {
    console.log('Testing profile picture functionality...');
    
    // Test 1: Check current user data
    console.log('\n1. Current user data:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true
      }
    });
    
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}): profilePicture = ${user.profilePicture ? `Length: ${user.profilePicture.length} chars` : 'null'}`);
    });
    
    // Test 2: Try to update a user with a small profile picture
    console.log('\n2. Testing profile picture update...');
    
    // Create a small test image data (just a simple SVG)
    const testImageData = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iIzVCNUI2RCIvPjx0ZXh0IHg9IjUwIiB5PSI2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VGVzdDwvdGV4dD48L3N2Zz4=';
    
    console.log(`Test image data length: ${testImageData.length} characters`);
    
    // Try to update the first user
    if (users.length > 0) {
      const firstUser = users[0];
      console.log(`\nUpdating user: ${firstUser.name}`);
      
      const updatedUser = await prisma.user.update({
        where: { id: firstUser.id },
        data: { profilePicture: testImageData }
      });
      
      console.log(`✅ Successfully updated user ${updatedUser.name}`);
      console.log(`New profilePicture length: ${updatedUser.profilePicture ? updatedUser.profilePicture.length : 'null'}`);
      
      // Test 3: Verify the update
      console.log('\n3. Verifying the update...');
      const verifyUser = await prisma.user.findUnique({
        where: { id: firstUser.id },
        select: { name: true, profilePicture: true }
      });
      
      console.log(`Verification - ${verifyUser.name}: profilePicture = ${verifyUser.profilePicture ? `Length: ${verifyUser.profilePicture.length} chars` : 'null'}`);
      
      if (verifyUser.profilePicture && verifyUser.profilePicture.length > 0) {
        console.log('✅ Profile picture was successfully saved and retrieved!');
      } else {
        console.log('❌ Profile picture was not saved or retrieved properly');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing profile picture:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProfilePicture()
  .then(() => {
    console.log('\nTest completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
