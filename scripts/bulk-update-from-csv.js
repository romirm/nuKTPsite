// Bulk update user roles from CSV file
// Usage: node scripts/bulk-update-from-csv.js roles.csv

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('../path-to-your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ktp-site-default-rtdb.firebaseio.com/"
});

const db = admin.database();

// Read CSV file
const csvFile = process.argv[2] || 'roles.csv';
const csvPath = path.join(__dirname, csvFile);

if (!fs.existsSync(csvPath)) {
  console.error(`❌ File not found: ${csvPath}`);
  console.log('\nCreate a CSV file with format:');
  console.log('uid,role');
  console.log('user123,Member');
  console.log('user456,Pledge');
  process.exit(1);
}

async function updateRolesFromCSV() {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.trim().split('\n');
  
  // Skip header row
  const dataLines = lines.slice(1);
  
  console.log(`Found ${dataLines.length} users to update...\n`);
  
  const updates = {};
  dataLines.forEach(line => {
    const [uid, role] = line.split(',').map(s => s.trim());
    if (uid && role) {
      updates[`allowed_users/${uid}/role`] = role;
      console.log(`  - ${uid}: ${role}`);
    }
  });
  
  try {
    await db.ref().update(updates);
    console.log('\n✅ Successfully updated all roles!');
  } catch (error) {
    console.error('❌ Error updating roles:', error);
  }
  
  process.exit();
}

updateRolesFromCSV();
