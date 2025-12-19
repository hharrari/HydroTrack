
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
  collection,
  writeBatch,
  Firestore,
} from "firebase/firestore";
import { getTodayDateString } from "./utils";
import type { UserProfile, DailySummary } from "@/types";
import { setDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { FirestorePermissionError } from "@/firebase/errors";
import { errorEmitter } from "@/firebase/error-emitter";

const DEFAULT_GOAL = 2000; // 2000 ml
const DEFAULT_UNITS = "ml";

/**
 * Gets or creates a user profile in Firestore.
 * If the user is new, it creates a profile with default values.
 * @param firestore - The Firestore instance.
 * @param uid - The user's unique ID from Firebase Auth.
 * @returns The user's profile.
 */
export async function getProfile(firestore: Firestore, uid: string): Promise<UserProfile> {
  const userDocRef = doc(firestore, "users", uid);
  const userDocSnap = await getDoc(userDocRef).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'get',
      })
    );
    throw error;
  });

  if (userDocSnap.exists()) {
    return userDocSnap.data() as UserProfile;
  } else {
    const newProfile: UserProfile = {
      id: uid,
      email: '', // email will be set on creation
      dailyGoal: DEFAULT_GOAL,
      units: DEFAULT_UNITS,
      remindersEnabled: false,
      reminderHours: 2,
    };
    setDocumentNonBlocking(userDocRef, newProfile, { merge: false });
    return newProfile;
  }
}

/**
 * Updates a user's profile in Firestore.
 * @param firestore - The Firestore instance.
 * @param uid - The user's unique ID.
 * @param data - The profile data to update.
 */
export async function updateProfile(firestore: Firestore, uid: string, data: Partial<UserProfile>): Promise<void> {
  const userDocRef = doc(firestore, "users", uid);
  updateDocumentNonBlocking(userDocRef, data);
}

/**
 * Gets the daily summary for the current day.
 * If no summary exists for today, it creates one based on the user's goal.
 * @param firestore - The Firestore instance.
 * @param uid - The user's unique ID.
 * @returns The daily summary for today.
 */
export async function getDailySummary(firestore: Firestore, uid: string): Promise<DailySummary> {
  const todayStr = getTodayDateString();
  const summaryDocRef = doc(firestore, `users/${uid}/dailySummaries`, todayStr);
  const summaryDocSnap = await getDoc(summaryDocRef).catch(error => {
     errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: summaryDocRef.path,
        operation: 'get',
      })
    );
    throw error;
  });

  if (summaryDocSnap.exists()) {
    return summaryDocSnap.data() as DailySummary;
  } else {
    // No summary for today, let's create one.
    // First, get the user's current goal.
    const userProfile = await getProfile(firestore, uid);
    const newSummary: DailySummary = {
      id: todayStr,
      userId: uid,
      totalIntake: 0,
      goal: userProfile.dailyGoal,
      date: todayStr,
    };
    setDocumentNonBlocking(summaryDocRef, newSummary, { merge: false });
    return newSummary;
  }
}

/**
 * Logs a new water intake entry and updates the daily summary within a transaction.
 * @param firestore - The Firestore instance.
 * @param uid - The user's unique ID.
 * @param amount - The amount of water consumed in ml.
 * @returns The updated daily summary.
 */
export async function logWater(firestore: Firestore, uid: string, amount: number): Promise<DailySummary | undefined> {
  const todayStr = getTodayDateString();
  const summaryDocRef = doc(firestore, `users/${uid}/dailySummaries`, todayStr);
  const logsCollectionRef = collection(firestore, `users/${uid}/waterLogs`);
  const newLogRef = doc(logsCollectionRef); // Create a new log doc with a random ID

  try {
    const newSummary = await runTransaction(firestore, async (transaction) => {
      const summaryDoc = await transaction.get(summaryDocRef);
      
      let currentIntake = 0;
      let currentGoal = DEFAULT_GOAL;

      if (summaryDoc.exists()) {
        currentIntake = summaryDoc.data().totalIntake || 0;
        currentGoal = summaryDoc.data().goal || DEFAULT_GOAL;
      } else {
         const userProfile = await getProfile(firestore, uid);
         currentGoal = userProfile.dailyGoal;
      }

      const newTotalIntake = currentIntake + amount;
      
      const updatedSummaryData: DailySummary = { 
        id: todayStr,
        userId: uid,
        totalIntake: newTotalIntake, 
        goal: currentGoal,
        date: todayStr
      };

      // Set/update summary and add new log entry
      transaction.set(summaryDocRef, updatedSummaryData, { merge: true });
      transaction.set(newLogRef, {
        userId: uid,
        amount,
        timestamp: serverTimestamp(),
      });
      
      return updatedSummaryData;
    });

    return newSummary;

  } catch (e: any) {
    console.error("Transaction failed: ", e);
    // This will be caught by the global error handler
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: summaryDocRef.path,
        operation: 'write',
        requestResourceData: { amount },
      })
    );
  }
}
