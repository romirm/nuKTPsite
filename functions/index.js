const path = require("path");
const functions = require("firebase-functions");
const { logger } = require("firebase-functions");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const os = require("os");
const { Storage } = require("@google-cloud/storage");
const gcs = new Storage();

// const ACC_SID = functions.config().twilio.acc_sid;
// const AUTH_TOKEN = functions.config().twilio.auth_token;
// const twilio_client = require("twilio")(ACC_SID, AUTH_TOKEN);
const phoneUtil =
  require("google-libphonenumber").PhoneNumberUtil.getInstance();

const sharp = require("sharp");
const fs = require("fs-extra");
const uuid = require("uuid");

admin.initializeApp({
  databaseURL: "https://ktp-site-default-rtdb.firebaseio.com/",
});
let usersRef = admin.database().ref("users");
let allowedRef = admin.database().ref("allowed_users");
let publicRef = admin.database().ref("public_users");
let announcementsRef = admin.database().ref("announcements");

const LEETCODE_API_BASE_URL = "https://leetcode-stats-api.herokuapp.com/";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchLeetCodeStats(username) {
  let retries = 3;
  let lastError = null;

  while (retries > 0) {
    try {
      const response = await fetch(LEETCODE_API_BASE_URL + username, {
        timeout: 10000,
      });

      if (response && response.ok) {
        const data = await response.json();
        if (data.easySolved === undefined || data.easySolved === null) {
          lastError = "Invalid payload";
        } else {
          return { ok: true, data };
        }
      } else {
        lastError = "HTTP " + (response ? response.status : "unknown error");
      }
    } catch (error) {
      lastError = error.message;
    }

    retries--;
    if (retries > 0) {
      await delay(2000);
    }
  }

  return { ok: false, error: lastError };
}

async function runLeetCodeUpdate(options = {}) {
  const { clearOffsets = false } = options;
  const pubusersSnapshot = await publicRef.once("value");
  const pubusers = pubusersSnapshot.val();

  if (!pubusers) {
    return { updated: 0, failed: [], skipped: 0 };
  }

  const failedUsers = [];
  let skipped = 0;

  const updatePromises = Object.keys(pubusers).map(async (user_uid) => {
    const user = pubusers[user_uid];

    if (user.leetcode && user.leetcode.username) {
      const username = user.leetcode.username;
      logger.log("Updating leetcode stats for " + username);

      const result = await fetchLeetCodeStats(username);
      if (!result.ok) {
        logger.error(
          "Failed to fetch leetcode stats for " + username + ": " + result.error
        );
        failedUsers.push(username);
        return false;
      }

      const res = result.data;
      const easySolved = Number(res.easySolved) || 0;
      const mediumSolved = Number(res.mediumSolved) || 0;
      const hardSolved = Number(res.hardSolved) || 0;
      const weightedScore = easySolved * 2 + mediumSolved * 5 + hardSolved * 8;

      await publicRef.child(user_uid + "/leetcode/answers").set({
        easySolved,
        mediumSolved,
        hardSolved,
        totalSolved: easySolved + mediumSolved + hardSolved,
        weightedScore,
        acceptanceRate: Number(res.acceptanceRate) || 0,
        lastUpdated: admin.database.ServerValue.TIMESTAMP,
      });

      if (clearOffsets) {
        await publicRef.child(user_uid + "/leetcode/offsets").set({
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
        });
      }

      logger.log(
        "Updated " +
          username +
          ": easy=" +
          easySolved +
          ", medium=" +
          mediumSolved +
          ", hard=" +
          hardSolved
      );
      return true;
    }

    if (user.leetcode && !user.leetcode.username) {
      logger.log("Removing " + user_uid + "'s leetcode data (no username)");
      await usersRef.child(user_uid + "/leetcode").remove();
      await publicRef.child(user_uid + "/leetcode").remove();
      return false;
    }

    skipped++;
    return false;
  });

  const results = await Promise.all(updatePromises);
  const updated = results.filter((result) => result === true).length;
  return {
    updated,
    failed: failedUsers,
    skipped,
  };
}

exports.lcupdate = onSchedule("*/10 * * * *", async (event) => {
  logger.log("LeetCode update function starting...");
  
  try {
    const summary = await runLeetCodeUpdate({ clearOffsets: false });
    logger.log(
      "LeetCode update completed. updated=" +
        summary.updated +
        ", failed=" +
        summary.failed.length +
        ", skipped=" +
        summary.skipped
    );
  } catch (error) {
    logger.error("LeetCode update function error:", error);
    throw error;
  }
});

// Manual function to trigger LC update (for testing)
exports.lcupdateNow = functions.https.onCall(async (data, context) => {
  logger.log("Manual LeetCode update triggered");
  
  try {
    // Check if user is admin
    if (!context.auth) {
      throw new Error("User not authenticated");
    }
    
    const userSnapshot = await usersRef.child(context.auth.uid).once("value");
    if (!userSnapshot.val() || !userSnapshot.val().admin) {
      throw new Error("User is not an admin");
    }
    
    const initialScrape = !!(data && data.initialScrape);
    const summary = await runLeetCodeUpdate({ clearOffsets: initialScrape });
    logger.log("Manual update completed. Updated " + summary.updated + " users");

    return { 
      status: "success", 
      message: initialScrape
        ? "Initial scrape completed for " + summary.updated + " LeetCode profiles"
        : "Updated " + summary.updated + " LeetCode profiles",
      initialScrape,
      updated: summary.updated,
      failed: summary.failed.length > 0 ? summary.failed : null,
      skipped: summary.skipped
    };
  } catch (error) {
    logger.error("Manual LeetCode update error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Admin function to reset a specific user's LeetCode offsets
// This is useful if offsets were set incorrectly and you want the user's actual total count
// Usage: Call with data.username = "leetcode_username" to reset that user's offsets
exports.resetLcOffsets = functions.https.onCall(async (data, context) => {
  try {
    // Check if user is admin
    if (!context.auth) {
      throw new Error("User not authenticated");
    }
    
    const userSnapshot = await usersRef.child(context.auth.uid).once("value");
    if (!userSnapshot.val() || !userSnapshot.val().admin) {
      throw new Error("User is not an admin");
    }
    
    const targetUsername = data.username;
    if (!targetUsername) {
      throw new Error("Target username not provided");
    }
    
    logger.log("Admin attempting to reset offsets for: " + targetUsername);
    
    // Find the user with this username
    const pubusersSnapshot = await publicRef.once("value");
    const pubusers = pubusersSnapshot.val();
    
    let targetUid = null;
    for (const uid in pubusers) {
      if (pubusers[uid].leetcode && pubusers[uid].leetcode.username === targetUsername) {
        targetUid = uid;
        break;
      }
    }
    
    if (!targetUid) {
      throw new Error("User with username " + targetUsername + " not found");
    }
    
    const targetUser = pubusers[targetUid];
    
    if (!targetUser.leetcode || !targetUser.leetcode.answers) {
      throw new Error("Target user has no leetcode answers to reset");
    }
    
    // Reset offsets to match current answers
    const newOffsets = {
      easySolved: targetUser.leetcode.answers.easySolved,
      mediumSolved: targetUser.leetcode.answers.mediumSolved,
      hardSolved: targetUser.leetcode.answers.hardSolved,
    };
    
    await publicRef.child(targetUid + "/leetcode/offsets").set(newOffsets);
    
    logger.log("Successfully reset offsets for " + targetUsername + ". New offsets: " + JSON.stringify(newOffsets));
    
    return {
      status: "success",
      message: "Offsets reset for " + targetUsername,
      username: targetUsername,
      oldScore: "Recalculated to 0",
      explanation: "User's current answers are now treated as their starting point"
    };
  } catch (error) {
    logger.error("Reset offsets error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// exports.sendText = functions.https.onCall(async (data, context) => {
//   const prom = new Promise((resolve, reject) => {
//     usersRef.child(context.auth.uid).once("value", (user_snapshot) => {
//       if (user_snapshot.val()["admin"] === true) {
//         usersRef.once("value", (all_users) => {
//           const message = data["message"];
//           const whoTo = data["whoTo"];
//           const type = data["type"];
//           var success = 0;
//           var newAnnouncement = {
//             text: message,
//             whoTo: whoTo,
//             timestamp: admin.database.ServerValue.TIMESTAMP, // use firebase server timestamp
//             messageType: type,
//           };
//           announcementsRef.push(newAnnouncement);
//           for (let currUser in all_users.val()) {
//             try {
//               const actualUser = all_users.val()[currUser];
//               if (
//                 !actualUser["role"] ||
//                 !actualUser["phone"] ||
//                 !actualUser["announcement_level"]
//               ) {
//                 console.log(
//                   "Skipping " +
//                     actualUser["name"] +
//                     " due to them having an incomplete profile"
//                 );
//                 continue;
//               }
//               if (whoTo != "Everyone") {
//                 if (
//                   actualUser["role"].substring(0, 2) != "VP" &&
//                   whoTo === "Pledges" &&
//                   actualUser["role"] != "Pledge"
//                 ) {
//                   console.log("Skipping " + actualUser["name"]);
//                   continue;
//                 } else if (
//                   actualUser["role"].substring(0, 2) != "VP" &&
//                   whoTo === "Brothers" &&
//                   actualUser["role"] != "Member" &&
//                   actualUser["role"] != "Brother"
//                 ) {
//                   console.log("Skipping " + actualUser["name"]);
//                   continue;
//                 }
//               }

//               if (
//                 actualUser["role"].substring(0, 2) != "VP" &&
//                 actualUser["announcement_level"] === 1
//               ) {
//                 console.log("Skipping " + actualUser["name"]);
//                 continue;
//               }

//               if (
//                 actualUser["role"].substring(0, 2) != "VP" &&
//                 actualUser["announcement_level"] === 2 &&
//                 type === "Event"
//               ) {
//                 console.log("Skipping " + actualUser["name"]);
//                 continue;
//               }
//               try {
//                 console.log("Texting " + actualUser["name"]);
//                 twilio_client.messages.create({
//                   body: message,
//                   from: "+17579193238",
//                   to:
//                     "+1" +
//                     phoneUtil
//                       .parse(actualUser["phone"], "US")
//                       .getNationalNumber(),
//                 });
//                 success++;
//               } catch (error) {}
//             } catch (error2) {}
//           }
//           resolve({ status: "Success", amount: success });
//         });
//       }
//     });
//   });
//   const val = await prom;
//   return val;
// });

exports.resizeCover = functions.storage.object().onFinalize(async (object) => {
  try {
    // generate a unique name we'll use for the temp directories
    const uniqueName = uuid.v1();

    // Get the bucket original image was uploaded to
    const bucket = gcs.bucket(object.bucket);

    // Set up bucket directory
    var filePath = object.name;
    if (filePath.includes("resume")) {
      return false;
    }
    const uid = filePath.split("/").pop().split(".")[0];
    const fileName = uid + ".jpg";
    const bucketDir = path.dirname(filePath);

    // create some temp working directories to process images
    const workingDir = path.join(os.tmpdir(), `images_${uniqueName}`);
    const tmpFilePath = path.join(workingDir, `source_${uniqueName}.png`);
    const metadata = object.metadata;

    if (metadata.isThumb) {
      console.log("Exiting image resizer!");
      return false;
    }

    // Ensure directory exists
    await fs.ensureDir(workingDir);

    // Download source file
    await bucket.file(filePath).download({
      destination: tmpFilePath,
    });
    // Resize images
    var sizes;
    if (filePath.includes("pfp")) {
      sizes = [128, 256];
    } else {
      sizes = [1400];
    }
    const uploadPromises = sizes.map(async (size) => {
      const thumbName = `${size}_${fileName}`;
      const thumbPath = path.join(workingDir, thumbName);

      if (size < 300) {
        // Square aspect ratio
        // Good for profile images
        await sharp(tmpFilePath)
          .resize(size, size)
          .withMetadata()
          .toFile(thumbPath);
      } else {
        // 16:9 aspect ratio
        let height = Math.floor(size * 0.5625);

        await sharp(tmpFilePath)
          .resize(size, height)
          .withMetadata()
          .toFile(thumbPath);
      }
      metadata.isThumb = true;

      // upload to original bucket
      return await bucket
        .upload(thumbPath, {
          destination: path.join(bucketDir, thumbName),
          metadata: { metadata: metadata },
          predefinedAcl: "publicRead",
          public: true,
        })
        .then((result) => {
          const file = result[0];
          return file.getMetadata();
        })
        .then(async (data) => {
          const metadata = data[0];
          //todo: delete original image
          if (size === 128) {
            await usersRef.child(uid).update({
              pfp_thumb_link: metadata.mediaLink,
            });
            await publicRef.child(uid).update({
              pfp_thumb_link: metadata.mediaLink,
            });
          } else if (size === 256) {
            await usersRef.child(uid).update({
              pfp_large_link: metadata.mediaLink,
            });
            await publicRef.child(uid).update({
              pfp_large_link: metadata.mediaLink,
            });
          } else if (size === 1400) {
            await usersRef.child(uid).update({
              cover_resized_link: metadata.mediaLink,
            });
            await publicRef.child(uid).update({
              cover_resized_link: metadata.mediaLink,
            });
          }
        });
    });

    // Process promises outside of the loop for performance purposes
    await Promise.all(uploadPromises);

    // Remove the temp directories
    await fs.remove(workingDir);
    await fs.remove(bucketDir);

    return Promise.resolve();
  } catch (error) {
    // If we have an error, return it
    // This will allow us to view it in the firebase function logs
    return Promise.reject(error);
  }
});

exports.beforeSignIn = functions.auth.user().beforeSignIn(async (user) => {
  if (user.email.includes("northwestern.edu")) {
    allowedRef
      .child(user.email.substring(0, user.email.indexOf("@")))
      .once("value", (snapshot) => {
        if (snapshot.exists()) {
          usersRef.child(user.uid).update({ allowed: true });
          admin.auth().setCustomUserClaims(user.uid, {
            member: true,
          });
        }
      });
  }
});

exports.beforeAcc = functions.auth.user().beforeCreate(async (user) => {
  if (!user.email.includes("northwestern.edu")) {
    await usersRef.child(user.uid).set({
      allowed: false,
      signed_up: false,
    });
  }
  const prom = new Promise((resolve, reject) => {
    allowedRef
      .child(user.email.substring(0, user.email.indexOf("@")))
      .once("value", async (allowed_snapshot) => {
        if (allowed_snapshot.exists()) {
          usersRef.child(user.uid).once("value", async (user_snapshot) => {
            if (!user_snapshot.exists()) {
              functions.logger.log("Adding user " + user.email);
              var newuser_role = "Member";
              if (allowed_snapshot.val() != "") {
                newuser_role = allowed_snapshot.val();
              }
              await usersRef.child(user.uid).set({
                allowed: true,
                signed_up: false,
                role: newuser_role,
                profile_pic_link: user.photoURL,
                cover_page_link:
                  "https://images.ctfassets.net/7thvzrs93dvf/wpImage18643/2f45c72db7876d2f40623a8b09a88b17/linkedin-default-background-cover-photo-1.png?w=790&h=196&q=90&fm=png",
                email: user.email,
              });
              await publicRef.child(user.uid).set({
                profile_pic_link: user.photoURL,
                role: newuser_role,
                cover_page_link:
                  "https://images.ctfassets.net/7thvzrs93dvf/wpImage18643/2f45c72db7876d2f40623a8b09a88b17/linkedin-default-background-cover-photo-1.png?w=790&h=196&q=90&fm=png",
              });
              resolve(1); //allowed but needs to sign up, correct
            } else if (user_snapshot.val()["signed_up"]) {
              functions.logger.log("Already signed up:" + user.email);
              resolve(2);
              //already has uid record and signed up
            } else if (!user_snapshot.val()["signed_up"]) {
              functions.logger.log("Needs to sign up:" + user.email);
              //needs to sign up
              resolve(1);
            } else {
              functions.logger.log("Shouldn't be possible:" + user.email);
              //already has uid record but not signed up - shouldnt be possible
              resolve(3);
            }
            admin.auth().setCustomUserClaims(user.uid, {
              member: true,
            });
          });
        } else {
          functions.logger.log("Rejected account creation by " + user.email);
          reject(4);
        }
      });
  });
  try {
    const res = await prom;
    console.log("Promise result: " + res);
    return true;
  } catch (err) {
    throw new functions.auth.HttpsError("permission-denied");
  }
});
