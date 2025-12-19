
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
  increment,
} from "firebase/firestore";
import { getTodayDateString } from "./utils";
import type { UserProfile } from "@/types";
import { setDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { FirestorePermissionError } from "@/firebase/errors";
import { errorEmitter } from "@/firebase/error-emitter";

const DEFAULT_GOAL = 2000; // 2000 ml
const DEFAULT_UNITS = "ml";

/**
 * Gets or creates a user profile in Firestore.
 * If the user is new, it creates a profile with default values.
 * If it's a new day, it resets the daily intake.
 * @param firestore - The Firestore instance.
 * @param uid - The user's unique ID from Firebase Auth.
 * @returns The user's profile.
 */
export async function getProfile(firestore: Firestore, uid: string): Promise<UserProfile> {
  const userDocRef = doc(firestore, "users", uid);
  const todayStr = getTodayDateString();

  try {
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const profile = userDocSnap.data() as UserProfile;
      // If the last log was not today, reset the intake for the new day.
      if (profile.lastLogDate !== todayStr) {
        const updatedProfile = { ...profile, todayIntake: 0, lastLogDate: todayStr };
        updateDocumentNonBlocking(userDocRef, { todayIntake: 0, lastLogDate: todayStr });
        return updatedProfile;
      }
      return profile;
    } else {
      const newProfile: UserProfile = {
        id: uid,
        email: '', // email will be set on creation
        dailyGoal: DEFAULT_GOAL,
        units: DEFAULT_UNITS,
        remindersEnabled: false,
        reminderHours: 2,
        todayIntake: 0,
        lastLogDate: todayStr,
      };
      setDocumentNonBlocking(userDocRef, newProfile, { merge: false });
      return newProfile;
    }
  } catch (error) {
     errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'get',
      })
    );
    throw error;
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
 * Logs a new water intake entry and updates the daily summary within a transaction.
 * @param firestore - The Firestore instance.
 * @param uid - The user's unique ID.
 * @param amount - The amount of water consumed in ml.
 * @returns The updated user profile.
 */
export async function logWater(firestore: Firestore, uid: string, amount: number): Promise<UserProfile | undefined> {
  const userDocRef = doc(firestore, "users", uid);
  const logsCollectionRef = collection(firestore, `users/${uid}/waterLogs`);
  const newLogRef = doc(logsCollectionRef); // Create a new log doc with a random ID
  const todayStr = getTodayDateString();

  try {
    const updatedProfile = await runTransaction(firestore, async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists()) {
        throw "Document does not exist!";
      }

      const currentProfile = userDoc.data() as UserProfile;
      
      // If the last log was not today, reset before incrementing
      const currentIntake = currentProfile.lastLogDate === todayStr ? currentProfile.todayIntake : 0;
      const newTotalIntake = currentIntake + amount;

      // Update user profile with new total and date
      transaction.update(userDocRef, { 
        todayIntake: newTotalIntake,
        lastLogDate: todayStr
      });
      
      // Create new water log entry
      transaction.set(newLogRef, {
        userId: uid,
        amount,
        timestamp: serverTimestamp(),
      });
      
      return {
        ...currentProfile,
        todayIntake: newTotalIntake,
        lastLogDate: todayStr,
      };
    });

    return updatedProfile;

  } catch (e: any) {
    console.error("Transaction failed: ", e);
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'write',
        requestResourceData: { todayIntake: increment(amount) },
      })
    );
  }
}
