
'use client';

import { useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import type { UserProfile, WaterLog } from '@/types';

interface ReminderManagerProps {
  profile: UserProfile;
  userId: string;
}

export function ReminderManager({ profile, userId }: ReminderManagerProps) {
  const { firestore } = useFirebase();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!firestore || !profile.remindersEnabled || profile.reminderHours <= 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    const logsQuery = query(
      collection(firestore, `users/${userId}/waterLogs`),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      let lastLogTime: Date;
      if (snapshot.empty) {
        // If no logs, use a long time ago to trigger reminder sooner if desired
        lastLogTime = new Date(0); 
      } else {
        const lastLog = snapshot.docs[0].data() as WaterLog;
        // Firestore timestamp can be null if serverTimestamp is used and client is offline
        lastLogTime = (lastLog.timestamp as unknown as Timestamp)?.toDate() ?? new Date();
      }

      const now = new Date();
      const hoursSinceLastLog = (now.getTime() - lastLogTime.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastLog >= profile.reminderHours) {
        sendNotification();
      } else {
        const remainingHours = profile.reminderHours - hoursSinceLastLog;
        const timeoutMs = remainingHours * 60 * 60 * 1000;
        
        timeoutRef.current = setTimeout(() => {
          sendNotification();
        }, timeoutMs);
      }
    });

    return () => {
      unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [firestore, userId, profile.remindersEnabled, profile.reminderHours]);

  const sendNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('Stay Hydrated!', {
        body: `It's been over ${profile.reminderHours} hours. Time to log some water!`,
        icon: '/favicon.ico',
      });
    }
  };

  return null; // This component does not render anything
}
