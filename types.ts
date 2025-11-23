export interface ActivityEntry {
  id?: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  description: string;
  category?: string;
  timestamp: number;
}

export interface DaySummary {
  date: string;
  summaryText: string;
  productivityScore?: number; // 1-10
}

export const CATEGORIES = [
  "Work",
  "Meeting",
  "Break",
  "Study",
  "Exercise",
  "Personal",
];