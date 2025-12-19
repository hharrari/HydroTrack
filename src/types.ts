
export interface UserProfile {
  id: string;
  email: string;
  dailyGoal: number;
  units: "ml" | "oz";
}

export interface DailySummary {
  id: string;
  userId: string;
  totalIntake: number;
  goal: number;
  date: string; // YYYY-MM-DD
}

export interface WaterLog {
  id: string;
  userId: string;
  amount: number;
  timestamp: Date;
}
