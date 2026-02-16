// Bulk update user roles in Firebase
// Usage: node scripts/bulk-update-roles.js

const admin = require('firebase-admin');
const serviceAccount = require('../path-to-your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ktp-site-default-rtdb.firebaseio.com/"
});

const db = admin.database();

// Define your users and their roles here
// Format: { uid_or_email: "Role Name" }
const rolesToUpdate = {
  // Example entries - replace with your actual data:
  "user123": "Member",
  "user456": "Pledge",
  "user789": "VP of Technology",
  "abc123": "Alumni",
  // Add more users here...
};

async function updateRoles() {
  console.log(`Updating ${Object.keys(rolesToUpdate).length} user roles...`);
  
  const updates = {};
  for (const [uid, role] of Object.entries(rolesToUpdate)) {
    updates[`allowed_users/${uid}/role`] = role;
    console.log(`  - ${uid}: ${role}`);
  }
  
  try {
    await db.ref().update(updates);
    console.log('\n✅ Successfully updated all roles!');
  } catch (error) {
    console.error('❌ Error updating roles:', error);
  }
  
  process.exit();
}

updateRoles();
