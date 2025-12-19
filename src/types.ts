export interface UserProfile {
  dailyGoal: number;
  units: "ml" | "oz";
}

export interface DailySummary {
  totalIntake: number;
  goal: number;
  date: string; // YYYY-MM-DD
}

export interface WaterLog {
  amount: number;
  timestamp: Date;
}
