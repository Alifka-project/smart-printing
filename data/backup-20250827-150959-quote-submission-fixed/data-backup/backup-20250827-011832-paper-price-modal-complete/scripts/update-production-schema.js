import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Updating Production Database Schema...\n');

// Create a production Prisma client with the production schema
const productionPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://c91c8561fe8b6b34a5985f17ac564ca367969fe928557c4c4f6b5bc780733281:sk_1sGdxWA91n5mc5fS6JTs0@db.prisma.io:5432/?sslmode=require"
    }
  }
});

async function updateProductionSchema() {
  try {
    console.log('🔌 Testing production database connection...');
    
    // Test connection
    const testResult = await productionPrisma.$queryRaw`SELECT COUNT(*) as count FROM "User"`;
    console.log(`✅ Production database connected successfully`);
    console.log(`   Found ${testResult[0].count} users in production database`);
    
    console.log('\n' + '='.repeat(60));
    
    // Check current production schema
    console.log('🔍 Checking current production schema...');
    
    try {
      const userColumns = await productionPrisma.$queryRaw`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        ORDER BY ordinal_position
      `;
      
      const clientColumns = await productionPrisma.$queryRaw`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'Client' 
        ORDER BY ordinal_position
      `;
      
      const quoteColumns = await productionPrisma.$queryRaw`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'Quote' 
        ORDER BY ordinal_position
      `;
      
      console.log(`📊 Current production schema:`);
      console.log(`   User table: ${userColumns.length} columns`);
      console.log(`   Client table: ${clientColumns.length} columns`);
      console.log(`   Quote table: ${quoteColumns.length} columns`);
      
      // Check for missing fields
      const hasAddressFields = clientColumns.some(col => col.column_name === 'address');
      const hasStep3Fields = quoteColumns.some(col => col.column_name === 'productName');
      
      console.log(`\n🔍 Field analysis:`);
      console.log(`   Client has address fields: ${hasAddressFields ? '✅' : '❌'}`);
      console.log(`   Quote has Step 3 fields: ${hasStep3Fields ? '✅' : '❌'}`);
      
      if (!hasAddressFields) {
        console.log('   ❌ Missing: Client address fields (address, city, state, postalCode, country)');
      }
      if (!hasStep3Fields) {
        console.log('   ❌ Missing: Quote Step 3 fields (productName, flatSizeWidth, etc.)');
      }
      
    } catch (schemaError) {
      console.log(`   Schema analysis error: ${schemaError.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Now let's add the missing fields
    console.log('🔧 Adding missing fields to production database...');
    
    try {
      // Add missing fields to Client table
      if (!hasAddressFields) {
        console.log('   Adding address fields to Client table...');
        await productionPrisma.$executeRaw`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS address TEXT`;
        await productionPrisma.$executeRaw`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS city TEXT`;
        await productionPrisma.$executeRaw`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS state TEXT`;
        await productionPrisma.$executeRaw`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS postalCode TEXT`;
        await productionPrisma.$executeRaw`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS country TEXT`;
        console.log('   ✅ Address fields added to Client table');
      }
      
      // Add missing fields to Quote table
      if (!hasStep3Fields) {
        console.log('   Adding Step 3 fields to Quote table...');
        await productionPrisma.$executeRaw`ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "productName" TEXT`;
        await productionPrisma.$executeRaw`ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "printingSelection" TEXT`;
        await productionPrisma.$executeRaw`ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "flatSizeHeight" DOUBLE PRECISION`;
        await productionPrisma.$executeRaw`ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "closeSizeSpine" DOUBLE PRECISION`;
        await productionPrisma.$executeRaw`ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "useSameAsFlat" BOOLEAN DEFAULT false`;
        await productionPrisma.$executeRaw`ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "flatSizeWidth" DOUBLE PRECISION`;
        await productionPrisma.$executeRaw`ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "flatSizeSpine" DOUBLE PRECISION`;
        await productionPrisma.$executeRaw`ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "closeSizeHeight" DOUBLE PRECISION`;
        await productionPrisma.$executeRaw`ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "closeSizeWidth" DOUBLE PRECISION`;
        console.log('   ✅ Step 3 fields added to Quote table');
      }
      
      console.log('\n✅ Production schema updated successfully!');
      
    } catch (updateError) {
      console.error(`❌ Failed to update schema: ${updateError.message}`);
      throw updateError;
    }
    
    // Verify the updates
    console.log('\n🔍 Verifying schema updates...');
    
    try {
      const updatedClientColumns = await productionPrisma.$queryRaw`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'Client' 
        ORDER BY ordinal_position
      `;
      
      const updatedQuoteColumns = await productionPrisma.$queryRaw`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'Quote' 
        ORDER BY ordinal_position
      `;
      
      console.log(`📊 Updated production schema:`);
      console.log(`   Client table: ${updatedClientColumns.length} columns`);
      console.log(`   Quote table: ${updatedQuoteColumns.length} columns`);
      
      const nowHasAddressFields = updatedClientColumns.some(col => col.column_name === 'address');
      const nowHasStep3Fields = updatedQuoteColumns.some(col => col.column_name === 'productName');
      
      console.log(`\n✅ Schema verification:`);
      console.log(`   Client has address fields: ${nowHasAddressFields ? '✅' : '❌'}`);
      console.log(`   Quote has Step 3 fields: ${nowHasStep3Fields ? '✅' : '❌'}`);
      
      if (nowHasAddressFields && nowHasStep3Fields) {
        console.log('\n🎉 Production schema is now compatible with your local database!');
        console.log('🚀 Ready for data migration.');
      } else {
        console.log('\n⚠️  Some fields may still be missing. Check the schema manually.');
      }
      
    } catch (verifyError) {
      console.log(`   Verification error: ${verifyError.message}`);
    }
    
  } catch (error) {
    console.error('\n❌ Schema update failed:', error.message);
    throw error;
  } finally {
    await productionPrisma.$disconnect();
  }
}

// Run the schema update
updateProductionSchema()
  .then(() => {
    console.log('\n✅ Schema update completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Schema update failed:', error);
    process.exit(1);
  });
