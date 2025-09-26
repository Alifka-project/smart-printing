const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function addUsers() {
  console.log('👥 Adding users...');
  
  const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
  
  try {
    const users = [
      {
        id: 'user_admin_001',
        email: 'admin@smartprint.com',
        name: 'Admin',
        role: 'admin',
        password: 'admin123',
        status: 'Active'
      },
      {
        id: 'user_manager_001',
        email: 'manager@smartprint.com',
        name: 'Manager',
        role: 'manager',
        password: 'manager123',
        status: 'Active'
      },
      {
        id: 'user_estimator_001',
        email: 'estimator@smartprint.com',
        name: 'Estimator',
        role: 'estimator',
        password: 'estimator123',
        status: 'Active'
      },
      {
        id: 'user_sales_001',
        email: 'sales@smartprint.com',
        name: 'Sales Representative',
        role: 'user',
        password: 'sales123',
        status: 'Active'
      }
    ];

    for (const user of users) {
      const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO User (id, email, name, role, password, status, createdAt, updatedAt) VALUES ('${user.id}', '${user.email}', '${user.name}', '${user.role}', '${user.password}', '${user.status}', datetime('now'), datetime('now'));"`;
      execSync(insertCmd);
    }

    console.log('✅ Users added successfully!');
    
    // Verify users
    const userCount = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM User;"`, { encoding: 'utf8' });
    console.log('Total users:', userCount.trim());
    
    const sampleUsers = execSync(`sqlite3 "${dbPath}" "SELECT name, email, role FROM User;"`, { encoding: 'utf8' });
    console.log('All users:');
    console.log(sampleUsers);
    
  } catch (error) {
    console.error('❌ Error adding users:', error);
  }
}

addUsers();
