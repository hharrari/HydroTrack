
export interface UserProfile {
  id: string;
  email: string;
  dailyGoal: number;
  units: "ml" | "oz";
  remindersEnabled: boolean;
  reminderHours: number;
  todayIntake: number;
  lastLogDate: string; // YYYY-MM-DD
}

export interface WaterLog {
  id: string;
  userId: string;
  amount: number;
  timestamp: Date;
}
