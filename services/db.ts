import { ActivityEntry, DailyGoal, WeeklyGoal } from '../types';

const DB_NAME = 'LinearDayDB';
const DB_VERSION = 2;
const STORE_NAME = 'entries';
const DAILY_GOAL_STORE = 'dailyGoals';
const WEEKLY_GOAL_STORE = 'weeklyGoals';

class DBService {
  private db: IDBDatabase | null = null;

  async connect(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject('Error opening database');

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('date', 'date', { unique: false });
        }
        if (!db.objectStoreNames.contains(DAILY_GOAL_STORE)) {
          const store = db.createObjectStore(DAILY_GOAL_STORE, { keyPath: 'date', autoIncrement: false });
        }
        if (!db.objectStoreNames.contains(WEEKLY_GOAL_STORE)) {
          const store = db.createObjectStore(WEEKLY_GOAL_STORE, { keyPath: 'weekStart', autoIncrement: false });
        }
      };
    });
  }

  async addEntry(entry: Omit<ActivityEntry, 'id'>): Promise<number> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(entry);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject('Error adding entry');
    });
  }

  async getEntriesByDate(date: string): Promise<ActivityEntry[]> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('date');
      const request = index.getAll(date);

      request.onsuccess = () => {
        // Sort by start time locally as it's easier than compound indexes for this simple app
        const results = (request.result as ActivityEntry[]).sort((a, b) => 
          a.startTime.localeCompare(b.startTime)
        );
        resolve(results);
      };
      request.onerror = () => reject('Error fetching entries');
    });
  }

  async updateEntry(id: number, entry: Partial<ActivityEntry>): Promise<void> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (!existing) {
          reject('Entry not found');
          return;
        }
        const updated = { ...existing, ...entry };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject('Error updating entry');
      };
      getRequest.onerror = () => reject('Error fetching entry');
    });
  }

  async deleteEntry(id: number): Promise<void> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Error deleting entry');
    });
  }

  // Daily Goal methods
  async setDailyGoal(goal: DailyGoal): Promise<void> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DAILY_GOAL_STORE], 'readwrite');
      const store = transaction.objectStore(DAILY_GOAL_STORE);
      const request = store.put(goal);

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Error saving daily goal');
    });
  }

  async getDailyGoal(date: string): Promise<DailyGoal | null> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DAILY_GOAL_STORE], 'readonly');
      const store = transaction.objectStore(DAILY_GOAL_STORE);
      const request = store.get(date);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject('Error fetching daily goal');
    });
  }

  // Weekly Goal methods
  async setWeeklyGoal(goal: WeeklyGoal): Promise<void> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([WEEKLY_GOAL_STORE], 'readwrite');
      const store = transaction.objectStore(WEEKLY_GOAL_STORE);
      const request = store.put(goal);

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Error saving weekly goal');
    });
  }

  async getWeeklyGoal(weekStart: string): Promise<WeeklyGoal | null> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([WEEKLY_GOAL_STORE], 'readonly');
      const store = transaction.objectStore(WEEKLY_GOAL_STORE);
      const request = store.get(weekStart);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject('Error fetching weekly goal');
    });
  }
  
  // Helper to check overlap if needed, but keeping it simple for now
}

export const dbService = new DBService();