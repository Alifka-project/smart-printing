import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function migrateAllUsersToProduction() {
  try {
    console.log('🚀 Starting comprehensive user migration to production...');
    
    // Check if we can connect to the production database
    await prisma.$connect();
    console.log('✅ Connected to production database');
    
    // Read the local backup file
    const backupPath = path.join(process.cwd(), 'data', 'local-backup-working', 'User-2025-08-25T14-45-09-079Z.json');
    console.log('📖 Reading local backup file:', backupPath);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error('Local backup file not found!');
    }
    
    const backupData = fs.readFileSync(backupPath, 'utf8');
    const localUsers = JSON.parse(backupData);
    
    console.log(`📊 Found ${localUsers.length} users in local backup`);
    
    // Check existing users in production
    const existingUsers = await prisma.user.findMany({
      select: { id: true, email: true }
    });
    
    console.log(`📊 Found ${existingUsers.length} existing users in production`);
    
    if (existingUsers.length > 0) {
      console.log('⚠️  Users already exist in production. Clearing existing users...');
      await prisma.user.deleteMany({});
      console.log('✅ Cleared existing users');
    }
    
    // Migrate all users from backup
    console.log('\n🔄 Migrating all users from local backup to production...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const userData of localUsers) {
      try {
        // Clean up the user data for production
        const cleanUserData = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: userData.role,
          status: userData.status || "Active",
          profilePicture: userData.profilePicture,
          createdAt: new Date(userData.createdAt),
          updatedAt: new Date(userData.updatedAt)
        };
        
        const user = await prisma.user.create({
          data: cleanUserData
        });
        
        console.log(`✅ Created user: ${user.name} (${user.email})`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Failed to create user ${userData.name}:`, error.message);
        errorCount++;
      }
    }
    
    // Verify migration
    const finalUsers = await prisma.user.findMany();
    console.log(`\n🎉 Migration complete! Production database now has ${finalUsers.length} users`);
    console.log(`📊 Success: ${successCount}, Errors: ${errorCount}`);
    
    console.log('\n📋 Production users:');
    finalUsers.forEach(user => {
      console.log(`   👤 ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    console.log('\n🔐 Login credentials for testing:');
    console.log('   Admin: admin@example.com / admin123');
    console.log('   Admin: admin@smartprint.com / admin123');
    console.log('   Estimator: estimator@smartprint.com / password123');
    console.log('   Manager: manager@smartprint.com / manager123');
    console.log('   User: user@smartprint.com / password123');
    console.log('   Zee: zee@admin.com / admin123');
    console.log('   Zee: Zee@example.com / admin123');
    
    console.log('\n✅ All users migrated! Login should now work in production!');
    
  } catch (error) {
    console.error('❌ Error during user migration:', error);
    console.error('💡 Make sure your DATABASE_URL is set to production');
  } finally {
    await prisma.$disconnect();
  }
}

migrateAllUsersToProduction();
