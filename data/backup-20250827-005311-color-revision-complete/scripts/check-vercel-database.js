const { PrismaClient } = require('@prisma/client');

async function checkVercelDatabase() {
  try {
    console.log('🔍 Checking Vercel database connection...');
    
    // Create Prisma client (will use DATABASE_URL from environment)
    const prisma = new PrismaClient();
    
    // Test connection
    console.log('🔌 Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful!');
    
    // Check what tables exist
    console.log('\n📋 Checking database tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('📊 Tables found:', tables.length);
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    // Check if User table exists and has data
    if (tables.some(t => t.table_name === 'User')) {
      console.log('\n👥 Checking User table...');
      const userCount = await prisma.user.count();
      console.log(`   - Total users: ${userCount}`);
      
      if (userCount > 0) {
        const users = await prisma.user.findMany({
          select: { email: true, name: true, role: true }
        });
        console.log('   - Users found:');
        users.forEach(user => {
          console.log(`     * ${user.email} (${user.name}) - ${user.role}`);
        });
      } else {
        console.log('   - No users found in database');
      }
    }
    
    // Check if Client table exists and has data
    if (tables.some(t => t.table_name === 'Client')) {
      console.log('\n🏢 Checking Client table...');
      const clientCount = await prisma.client.count();
      console.log(`   - Total clients: ${clientCount}`);
    }
    
    // Check if Quote table exists and has data
    if (tables.some(t => t.table_name === 'Quote')) {
      console.log('\n📄 Checking Quote table...');
      const quoteCount = await prisma.quote.count();
      console.log(`   - Total quotes: ${quoteCount}`);
    }
    
    console.log('\n🎯 Database Status Summary:');
    console.log(`   - Connection: ✅ Working`);
    console.log(`   - Tables: ${tables.length} found`);
    console.log(`   - Users: ${tables.some(t => t.table_name === 'User') ? '✅ Exists' : '❌ Missing'}`);
    console.log(`   - Clients: ${tables.some(t => t.table_name === 'Client') ? '✅ Exists' : '❌ Missing'}`);
    console.log(`   - Quotes: ${tables.some(t => t.table_name === 'Quote') ? '✅ Exists' : '❌ Missing'}`);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    
    if (error.message.includes('Invalid value undefined for datasource "db"')) {
      console.log('\n🔍 This error suggests DATABASE_URL is not properly set');
      console.log('   - Check your Vercel environment variables');
      console.log('   - Make sure DATABASE_URL is not a placeholder');
    }
    
    if (error.message.includes('Connection refused')) {
      console.log('\n🔍 This error suggests database connection is refused');
      console.log('   - Check if your database is running');
      console.log('   - Verify host, port, and credentials');
    }
  }
}

checkVercelDatabase();




