import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
  collection,
  writeBatch
} from "firebase/firestore";
import { db } from "./firebase";
import { getTodayDateString } from "./utils";
import type { UserProfile, DailySummary } from "@/types";

const DEFAULT_GOAL = 2000; // 2000 ml
const DEFAULT_UNITS = "ml";

/**
 * Gets or creates a user profile in Firestore.
 * If the user is new, it creates a profile with default values.
 * @param uid - The user's unique ID from Firebase Auth.
 * @returns The user's profile.
 */
export async function getProfile(uid: string): Promise<UserProfile> {
  const userDocRef = doc(db, "users", uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    return userDocSnap.data() as UserProfile;
  } else {
    const newProfile: UserProfile = {
      dailyGoal: DEFAULT_GOAL,
      units: DEFAULT_UNITS,
    };
    await setDoc(userDocRef, newProfile);
    return newProfile;
  }
}

/**
 * Updates a user's profile in Firestore.
 * @param uid - The user's unique ID.
 * @param data - The profile data to update.
 */
export async function updateProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const userDocRef = doc(db, "users", uid);
  await updateDoc(userDocRef, data);
}

/**
 * Gets the daily summary for the current day.
 * If no summary exists for today, it creates one based on the user's goal.
 * @param uid - The user's unique ID.
 * @returns The daily summary for today.
 */
export async function getDailySummary(uid: string): Promise<DailySummary> {
  const todayStr = getTodayDateString();
  const summaryDocRef = doc(db, `users/${uid}/dailySummaries`, todayStr);
  const summaryDocSnap = await getDoc(summaryDocRef);

  if (summaryDocSnap.exists()) {
    return summaryDocSnap.data() as DailySummary;
  } else {
    // No summary for today, let's create one.
    // First, get the user's current goal.
    const userProfile = await getProfile(uid);
    const newSummary: DailySummary = {
      totalIntake: 0,
      goal: userProfile.dailyGoal,
      date: todayStr,
    };
    await setDoc(summaryDocRef, newSummary);
    return newSummary;
  }
}

/**
 * Logs a new water intake entry and updates the daily summary within a transaction.
 * @param uid - The user's unique ID.
 * @param amount - The amount of water consumed in ml.
 * @returns The updated daily summary.
 */
export async function logWater(uid: string, amount: number): Promise<DailySummary> {
  const todayStr = getTodayDateString();
  const summaryDocRef = doc(db, `users/${uid}/dailySummaries`, todayStr);
  const logsCollectionRef = collection(db, `users/${uid}/waterLogs`);
  const newLogRef = doc(logsCollectionRef); // Create a new log doc with a random ID

  try {
    const newSummary = await runTransaction(db, async (transaction) => {
      const summaryDoc = await transaction.get(summaryDocRef);
      
      let currentIntake = 0;
      let currentGoal = DEFAULT_GOAL;

      if (summaryDoc.exists()) {
        currentIntake = summaryDoc.data().totalIntake || 0;
        currentGoal = summaryDoc.data().goal || DEFAULT_GOAL;
      } else {
         const userProfile = await getProfile(uid);
         currentGoal = userProfile.dailyGoal;
      }

      const newTotalIntake = currentIntake + amount;
      
      const updatedSummaryData = { 
        totalIntake: newTotalIntake, 
        goal: currentGoal,
        date: todayStr
      };

      // Set/update summary and add new log entry
      transaction.set(summaryDocRef, updatedSummaryData, { merge: true });
      transaction.set(newLogRef, {
        amount,
        timestamp: serverTimestamp(),
      });
      
      return updatedSummaryData;
    });

    return newSummary;

  } catch (e) {
    console.error("Transaction failed: ", e);
    throw e;
  }
}
