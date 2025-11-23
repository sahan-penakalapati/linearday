import { ActivityEntry } from '../types';

const DB_NAME = 'LinearDayDB';
const DB_VERSION = 1;
const STORE_NAME = 'entries';

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
  
  // Helper to check overlap if needed, but keeping it simple for now
}

export const dbService = new DBService();