const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://ktp-site-default-rtdb.firebaseio.com/",
});

const db = admin.database();

// Simulate the lcupdateNow function logic
async function triggerLcUpdate() {
  try {
    console.log("Starting LeetCode update...");
    
    const pubusersSnapshot = await db.ref("public_users").once("value");
    const pubusers = pubusersSnapshot.val();
    
    if (!pubusers) {
      console.log("No public users found");
      return { status: "No users found", updated: 0 };
    }
    
    let updatedCount = 0;
    const updatePromises = [];
    
    for (const user_uid in pubusers) {
      const user = pubusers[user_uid];
      
      if (user.leetcode && user.leetcode.username) {
        console.log("Updating leetcode stats for " + user.leetcode.username);
        
        const updatePromise = (async () => {
          try {
            const response = await fetch(
              "https://leetcode-stats-api.herokuapp.com/" + user.leetcode.username
            );
            
            if (!response.ok) {
              console.error("Error fetching leetcode stats for " + user_uid + ": " + response.status);
              return false;
            }
            
            const res = await response.json();
            
            if (res.easySolved === undefined || res.easySolved === null) {
              console.error("Error: Invalid leetcode data for user " + user.leetcode.username);
              return false;
            }
            
            console.log("Fetched stats for " + user.leetcode.username + ":", res);
            
            // Set offsets on first run if they don't exist
            if (!user.leetcode.offsets) {
              await db.ref(user_uid + "/leetcode/offsets").set({
                easySolved: res.easySolved,
                mediumSolved: res.mediumSolved,
                hardSolved: res.hardSolved,
              });
              console.log("Set initial offsets for " + user.leetcode.username);
            }
            
            // Update the current answers
            await db.ref("public_users/" + user_uid + "/leetcode/answers").set({
              easySolved: res.easySolved,
              mediumSolved: res.mediumSolved,
              hardSolved: res.hardSolved,
              acceptanceRate: res.acceptanceRate,
            });
            console.log("Successfully updated leetcode stats for " + user.leetcode.username);
            return true;
          } catch (error) {
            console.error("Error processing leetcode data for " + user_uid + ":", error);
            return false;
          }
        })();
        
        updatePromises.push(updatePromise);
      }
    }
    
    const results = await Promise.all(updatePromises);
    updatedCount = results.filter(r => r === true).length;
    
    console.log("Update completed. Updated " + updatedCount + " users");
    return { 
      status: "success", 
      message: "Updated " + updatedCount + " LeetCode profiles",
      updated: updatedCount 
    };
  } catch (error) {
    console.error("LeetCode update error:", error);
    throw error;
  }
}

triggerLcUpdate().then(() => {
  console.log("✅ LeetCode update completed!");
  process.exit(0);
}).catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
