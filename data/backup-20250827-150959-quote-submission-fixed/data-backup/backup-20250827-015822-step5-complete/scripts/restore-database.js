const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Data from constants file
const usersToRestore = [
  {
    email: 'admin@example.com',
    name: 'John Admin',
    role: 'admin',
    password: 'admin123',
    status: 'Active'
  },
  {
    email: 'estimator@example.com',
    name: 'Jane Estimator',
    role: 'estimator',
    password: 'estimator123',
    status: 'Active'
  },
  {
    email: 'user@example.com',
    name: 'Bob User',
    role: 'user',
    password: 'user123',
    status: 'Active'
  }
];

const clientsToRestore = [
  { clientType: "Company", companyName: "Eagan Inc.", contactPerson: "John Eagan", email: "john.e@eagan.com", phone: "50 123 4567", countryCode: "+971", role: "CEO", status: "Active" },
  { clientType: "Company", companyName: "Maxtion Dev", contactPerson: "Liam Park", email: "liam@maxtion.dev", phone: "50 222 3344", countryCode: "+971", role: "CTO", status: "Active" },
  { clientType: "Company", companyName: "Candor Ltd", contactPerson: "Alice Tan", email: "alice@candor.co", phone: "50 333 7788", countryCode: "+971", role: "Manager", status: "Active" },
  { clientType: "Company", companyName: "Delta Co.", contactPerson: "Jin Woo", email: "jin@delta.co", phone: "50 994 1100", countryCode: "+971", role: "Director", status: "Active" },
  { clientType: "Company", companyName: "Echo GmbH", contactPerson: "Lena Meyer", email: "lena@echo.de", phone: "160 111 2223", countryCode: "+49", role: "Manager", status: "Active" },
  { clientType: "Company", companyName: "Foxtrot BV", contactPerson: "Tariq Aziz", email: "tariq@foxtrot.nl", phone: "6 1234 5678", countryCode: "+31", role: "CEO", status: "Active" },
  { clientType: "Company", companyName: "Gamma LLC", contactPerson: "Sara Gomez", email: "sara@gammallc.com", phone: "415 555 1212", countryCode: "+1", role: "Manager", status: "Active" },
  { clientType: "Company", companyName: "Helios Pte", contactPerson: "Mei Lin", email: "mei@helios.sg", phone: "8123 4567", countryCode: "+65", role: "Director", status: "Active" },
  { clientType: "Company", companyName: "Iris Studio", contactPerson: "Rani Putri", email: "rani@iris.studio", phone: "812 3456 7890", countryCode: "+62", role: "Owner", status: "Active" },
  { clientType: "Company", companyName: "Juno Sdn Bhd", contactPerson: "Farid Shah", email: "farid@juno.my", phone: "12 345 6789", countryCode: "+60", role: "Manager", status: "Active" },
  { clientType: "Company", companyName: "Kappa Inc", contactPerson: "Becky Lee", email: "becky@kappa.com", phone: "6123 4567", countryCode: "+852", role: "CEO", status: "Active" },
  { clientType: "Company", companyName: "Lumen Labs", contactPerson: "Jorge Ruiz", email: "jorge@lumenlabs.io", phone: "655 111 222", countryCode: "+34", role: "CTO", status: "Active" },
  { clientType: "Company", companyName: "Mango Corp", contactPerson: "Dani So", email: "dani@mango.com", phone: "10 2345 6789", countryCode: "+82", role: "Manager", status: "Active" },
  { clientType: "Company", companyName: "Nexus Ltd", contactPerson: "Ken Wong", email: "ken@nexus.hk", phone: "5123 9876", countryCode: "+852", role: "Director", status: "Active" },
  { clientType: "Company", companyName: "Orion SA", contactPerson: "Pierre Lac", email: "pierre@orion.fr", phone: "6 12 34 56 78", countryCode: "+33", role: "Manager", status: "Active" },
  { clientType: "Company", companyName: "Pluto LLP", contactPerson: "Wira Adi", email: "wira@pluto.com", phone: "813 7777 1212", countryCode: "+62", role: "Owner", status: "Active" },
  { clientType: "Company", companyName: "Quark AB", contactPerson: "Anders B", email: "anders@quark.se", phone: "70 123 4567", countryCode: "+46", role: "CEO", status: "Active" },
  { clientType: "Company", companyName: "Radian BV", contactPerson: "Ivo K", email: "ivo@radian.eu", phone: "6 8765 4321", countryCode: "+31", role: "Manager", status: "Active" },
  { clientType: "Company", companyName: "Sigma Oy", contactPerson: "Tiina K", email: "tiina@sigma.fi", phone: "40 123 4567", countryCode: "+358", role: "Director", status: "Active" },
  { clientType: "Company", companyName: "Titan Pty", contactPerson: "Noah Reed", email: "noah@titan.au", phone: "412 345 678", countryCode: "+61", role: "Owner", status: "Active" },
  { clientType: "Company", companyName: "Umbra SAS", contactPerson: "Luc Martin", email: "luc@umbra.fr", phone: "6 99 88 77 66", countryCode: "+33", role: "Manager", status: "Active" },
  { clientType: "Company", companyName: "Vega NV", contactPerson: "Eva Jans", email: "eva@vega.be", phone: "470 12 34 56", countryCode: "+32", role: "CEO", status: "Active" },
  { clientType: "Company", companyName: "Wave GmbH", contactPerson: "Jonas K", email: "jonas@wave.de", phone: "171 234 5678", countryCode: "+49", role: "CTO", status: "Active" },
  { clientType: "Company", companyName: "Xenon KK", contactPerson: "Akira Mori", email: "akira@xenon.co.jp", phone: "90 1234 5678", countryCode: "+81", role: "Manager", status: "Active" },
  { clientType: "Individual", companyName: "", contactPerson: "Holly Brown", email: "holly@yonder.uk", phone: "7700 900123", countryCode: "+44", role: "", status: "Active" },
  { clientType: "Individual", companyName: "", contactPerson: "Owen Hale", email: "owen@zephyr.co", phone: "85 123 4567", countryCode: "+353", role: "", status: "Active" },
  { clientType: "Company", companyName: "Artemis LLC", contactPerson: "Mia Chen", email: "mia@artemis.com", phone: "650 555 9988", countryCode: "+1", role: "Manager", status: "Active" },
  { clientType: "Company", companyName: "Basil AG", contactPerson: "Felix H", email: "felix@basil.ch", phone: "79 123 45 67", countryCode: "+41", role: "CEO", status: "Active" },
  { clientType: "Company", companyName: "Corex Inc.", contactPerson: "Ravi Patel", email: "ravi@corex.com", phone: "408 555 4321", countryCode: "+1", role: "Director", status: "Active" },
  { clientType: "Company", companyName: "Dorian SpA", contactPerson: "Marco Rossi", email: "marco@dorian.it", phone: "347 123 4567", countryCode: "+39", role: "Manager", status: "Active" }
];

const suppliersToRestore = [
  {
    name: "Paper Source LLC",
    contact: "Contact Person",
    email: "papersourcellc@example.com",
    phone: "123456789",
    countryCode: "+971",
    country: "UAE",
    status: "Active"
  },
  {
    name: "Apex Papers",
    contact: "Contact Person",
    email: "apexpapers@example.com",
    phone: "123456789",
    countryCode: "+971",
    country: "UAE",
    status: "Active"
  },
  {
    name: "Premium Print Supplies",
    contact: "Contact Person",
    email: "premiumprint@example.com",
    phone: "123456789",
    countryCode: "+971",
    country: "UAE",
    status: "Active"
  }
];

const materialsToRestore = [
  { materialId: "M-001", name: "Art Paper", gsm: "300", cost: 0.5, unit: "per_sheet", status: "Active" },
  { materialId: "M-002", name: "Art Paper", gsm: "150", cost: 0.18, unit: "per_sheet", status: "Active" },
  { materialId: "M-003", name: "Ivory", gsm: "230", cost: 0.27, unit: "per_sheet", status: "Active" },
  { materialId: "M-004", name: "HVS", gsm: "100", cost: 3.2, unit: "per_kg", status: "Active" },
  { materialId: "M-005", name: "Matte Lamination", cost: 0.09, unit: "per_sheet", status: "Active" },
  { materialId: "M-006", name: "Gloss Lamination", cost: 0.08, unit: "per_sheet", status: "Active" },
  { materialId: "M-007", name: "Foil Gold Roll", cost: 18, unit: "per_kg", status: "Active" },
  { materialId: "M-008", name: "UV Spot Chemical", cost: 12.5, unit: "per_kg", status: "Active" },
  { materialId: "M-009", name: "Die-Cut Blades", cost: 45, unit: "per_packet", status: "Active" },
  { materialId: "M-010", name: "CTP Plate", cost: 3.9, unit: "per_sheet", status: "Active" },
  { materialId: "M-011", name: "Ink CMYK Set", cost: 22, unit: "per_kg", status: "Active" },
  { materialId: "M-012", name: "Binding Glue", cost: 7.5, unit: "per_kg", status: "Active" }
];

async function restoreDatabase() {
  try {
    console.log('🚀 Starting database restoration...');
    
    // Step 1: Restore Users
    console.log('👥 Step 1: Restoring users...');
    const createdUsers = [];
    for (const userData of usersToRestore) {
      try {
        const user = await prisma.user.create({
          data: userData
        });
        createdUsers.push(user);
        console.log(`✅ Created user: ${user.name} (${user.email})`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️ User already exists: ${userData.email}`);
        } else {
          console.error(`❌ Error creating user ${userData.email}:`, error);
        }
      }
    }
    
    // Step 2: Restore Suppliers
    console.log('🏢 Step 2: Restoring suppliers...');
    const createdSuppliers = [];
    for (const supplierData of suppliersToRestore) {
      try {
        const supplier = await prisma.supplier.create({
          data: supplierData
        });
        createdSuppliers.push(supplier);
        console.log(`✅ Created supplier: ${supplier.name}`);
      } catch (error) {
        console.error(`❌ Error creating supplier ${supplierData.name}:`, error);
      }
    }
    
    // Step 3: Restore Clients
    console.log('👤 Step 3: Restoring clients...');
    const createdClients = [];
    for (const clientData of clientsToRestore) {
      try {
        const client = await prisma.client.create({
          data: clientData
        });
        createdClients.push(client);
        console.log(`✅ Created client: ${client.contactPerson} (${client.companyName || 'Individual'})`);
      } catch (error) {
        console.error(`❌ Error creating client ${clientData.contactPerson}:`, error);
      }
    }
    
    // Step 4: Restore Materials (with GSM field)
    console.log('📦 Step 4: Restoring materials with GSM field...');
    const createdMaterials = [];
    for (const materialData of materialsToRestore) {
      try {
        // Link to first supplier for now
        const supplierId = createdSuppliers[0]?.id;
        if (supplierId) {
          const material = await prisma.material.create({
            data: {
              ...materialData,
              supplierId,
              lastUpdated: new Date(),
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          createdMaterials.push(material);
          console.log(`✅ Created material: ${material.name}${material.gsm ? ` (${material.gsm} gsm)` : ''}`);
        }
      } catch (error) {
        console.error(`❌ Error creating material ${materialData.name}:`, error);
      }
    }
    
    console.log('\n🎉 Database restoration completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Suppliers: ${createdSuppliers.length}`);
    console.log(`   - Clients: ${createdClients.length}`);
    console.log(`   - Materials: ${createdMaterials.length}`);
    
    // Show admin user details
    const adminUser = createdUsers.find(u => u.email === 'admin@example.com');
    if (adminUser) {
      console.log(`\n👤 Admin User Restored:`);
      console.log(`   - Email: ${adminUser.email}`);
      console.log(`   - Name: ${adminUser.name}`);
      console.log(`   - Role: ${adminUser.role}`);
      console.log(`   - Password: ${adminUser.password ? 'Set' : 'Not set'}`);
    }
    
  } catch (error) {
    console.error('❌ Database restoration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreDatabase();
