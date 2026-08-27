import type { FinishEvent, PantryExport, PantryItem } from './domain';

const DB_NAME = 'finish-one-pantry';
const DB_VERSION = 1;

export interface PantryStore {
  persistent: boolean;
  load(): Promise<{ items: PantryItem[]; events: FinishEvent[] }>;
  saveItem(item: PantryItem): Promise<void>;
  deleteItem(id: string): Promise<void>;
  addEvent(event: FinishEvent): Promise<void>;
  deleteEvent(id: string): Promise<void>;
  replace(data: PantryExport): Promise<void>;
  clear(): Promise<void>;
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Local storage request failed.'));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Local storage transaction failed.'));
    tx.onabort = () => reject(tx.error ?? new Error('Local storage transaction was cancelled.'));
  });
}

async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('items')) db.createObjectStore('items', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('events')) db.createObjectStore('events', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Could not open local storage.'));
    req.onblocked = () => reject(new Error('Local storage is blocked by another tab.'));
  });
}

class IndexedDbStore implements PantryStore {
  persistent = true;
  constructor(private db: IDBDatabase) {}

  async load() {
    const tx = this.db.transaction(['items', 'events'], 'readonly');
    const done = transactionDone(tx);
    const itemsRequest = request(tx.objectStore('items').getAll()) as Promise<PantryItem[]>;
    const eventsRequest = request(tx.objectStore('events').getAll()) as Promise<FinishEvent[]>;
    const [items, events] = await Promise.all([itemsRequest, eventsRequest]);
    await done;
    return { items, events };
  }

  async saveItem(item: PantryItem) {
    const tx = this.db.transaction('items', 'readwrite');
    tx.objectStore('items').put(item);
    await transactionDone(tx);
  }

  async deleteItem(id: string) {
    const tx = this.db.transaction(['items', 'events'], 'readwrite');
    tx.objectStore('items').delete(id);
    const cursor = tx.objectStore('events').openCursor();
    cursor.onsuccess = () => {
      const result = cursor.result;
      if (!result) return;
      if ((result.value as FinishEvent).itemId === id) result.delete();
      result.continue();
    };
    await transactionDone(tx);
  }

  async addEvent(event: FinishEvent) {
    const tx = this.db.transaction('events', 'readwrite');
    tx.objectStore('events').put(event);
    await transactionDone(tx);
  }

  async deleteEvent(id: string) {
    const tx = this.db.transaction('events', 'readwrite');
    tx.objectStore('events').delete(id);
    await transactionDone(tx);
  }

  async replace(data: PantryExport) {
    const tx = this.db.transaction(['items', 'events'], 'readwrite');
    tx.objectStore('items').clear();
    tx.objectStore('events').clear();
    data.items.forEach((item) => tx.objectStore('items').put(item));
    data.events.forEach((event) => tx.objectStore('events').put(event));
    await transactionDone(tx);
  }

  async clear() {
    const tx = this.db.transaction(['items', 'events'], 'readwrite');
    tx.objectStore('items').clear();
    tx.objectStore('events').clear();
    await transactionDone(tx);
  }
}

class MemoryStore implements PantryStore {
  persistent = false;
  private items: PantryItem[] = [];
  private events: FinishEvent[] = [];
  async load() { return { items: structuredClone(this.items), events: structuredClone(this.events) }; }
  async saveItem(item: PantryItem) { this.items = [...this.items.filter((value) => value.id !== item.id), structuredClone(item)]; }
  async deleteItem(id: string) { this.items = this.items.filter((item) => item.id !== id); this.events = this.events.filter((event) => event.itemId !== id); }
  async addEvent(event: FinishEvent) { this.events.push(structuredClone(event)); }
  async deleteEvent(id: string) { this.events = this.events.filter((event) => event.id !== id); }
  async replace(data: PantryExport) { this.items = structuredClone(data.items); this.events = structuredClone(data.events); }
  async clear() { this.items = []; this.events = []; }
}

export async function createStore(): Promise<PantryStore> {
  try {
    if (!('indexedDB' in globalThis)) throw new Error('IndexedDB unavailable');
    return new IndexedDbStore(await openDatabase());
  } catch {
    return new MemoryStore();
  }
}
