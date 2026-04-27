// functions/src/updateMemory.ts

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { GoogleGenAI } from "@google/genai";

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

export const updateMemory = onSchedule(
  {
    schedule: "0 * * * *", // Every hour
    timeZone: "Asia/Kolkata",
    secrets: ["GEMINI_API_KEY"],
  },
  async (event) => {
    void event;
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("GEMINI_API_KEY is not set.");
        return;
      }

      // Initialize AI using @google/genai
      const ai = new GoogleGenAI({ apiKey });

      // Fetch all unprocessed user messages
      // Note: This requires a composite index: messages (Collection Group) where role == 'user' and isProcessed == false
      const unprocessedMessagesSnapshot = await db
        .collectionGroup("messages")
        .where("role", "==", "user")
        .where("isProcessed", "==", false)
        .get();

      if (unprocessedMessagesSnapshot.empty) {
        console.log("No new user messages to process.");
        return;
      }

      console.log(
        `Found ${unprocessedMessagesSnapshot.size} messages to process.`,
      );

      // Group messages by user ID
      // path: users/{uid}/chats/{chatId}/messages/{messageId}
      const messagesByUser: {
        [uid: string]: {
          docRef: FirebaseFirestore.DocumentReference;
          text: string;
        }[];
      } = {};

      unprocessedMessagesSnapshot.docs.forEach((doc) => {
        const pathParts = doc.ref.path.split("/");
        // users -> [0], {uid} -> [1], chats -> [2], {chatId} -> [3], messages -> [4], {messageId} -> [5]
        const uid = pathParts[1];
        if (!messagesByUser[uid]) {
          messagesByUser[uid] = [];
        }
        messagesByUser[uid].push({
          docRef: doc.ref,
          text: doc.data().text || "",
        });
      });

      const uids = Object.keys(messagesByUser);
      console.log(`Processing memory for ${uids.length} users.`);

      for (const uid of uids) {
        try {
          const userRef = db.collection("users").doc(uid);
          const userDoc = await userRef.get();
          const currentMemoryProfile = userDoc.exists
            ? userDoc.data()?.memoryProfile || ""
            : "";

          const newMessages = messagesByUser[uid]
            .map((m) => m.text)
            .join("\n---\n");

          const prompt = `
# Task: Evolving User Memory
You are an observant partner. Your goal is to update the user's "Memory Profile" based on your most recent interactions.

**Existing User Memory:**
"""
${currentMemoryProfile || "No current memory profile exists."}
"""

**New Interactions:**
"""
${newMessages}
"""

**Guidance:**
Reflect on the new messages. What have you learned about the user that is worth remembering long-term? Focus on the "essence" of who they are: their life situation, their mindset, their long-term goals, and the things that truly matter to them. 

Ignore the "noise"—temporary technical fixes, one-off questions, or transient logistics.

Integrate any new insights into the existing profile naturally. Update older points if the user's situation has changed, and keep the profile clean, concise, and deeply relevant to who they are as a person.

**Output:**
Return the complete, updated memory profile.
`;

          const result = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: prompt,
          });

          const updatedMemoryProfile =
            result.text?.trim() || currentMemoryProfile;

          // Prepare batch update
          const batch = db.batch();

          // Update user's memory profile
          batch.set(
            userRef,
            { memoryProfile: updatedMemoryProfile },
            { merge: true },
          );

          // Mark messages as processed
          messagesByUser[uid].forEach((m) => {
            batch.update(m.docRef, { isProcessed: true });
          });

          await batch.commit();
          console.log(
            `Updated memory profile and marked ${messagesByUser[uid].length} messages as processed for user: ${uid}`,
          );
        } catch (error) {
          console.error(`Error processing memory for user ${uid}:`, error);
          // Continue with next user
        }
      }

      console.log("Memory update job completed successfully.");
    } catch (error) {
      console.error("Unhandled error in updateMemory function:", error);
    }
  },
);
