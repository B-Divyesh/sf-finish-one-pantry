export interface PantryItem {
  id: string;
  name: string;
  reserve: number;
  threshold: number;
  onList: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinishEvent {
  id: string;
  itemId: string;
  itemName: string;
  kind: 'finished' | 'corrected' | 'bought';
  delta: number;
  at: string;
}

export interface PantryExport {
  product: 'finish-one-pantry';
  version: 1;
  exportedAt: string;
  items: PantryItem[];
  events: FinishEvent[];
}

const clamp = (value: number, maximum = 99) => Math.min(maximum, Math.max(0, Math.round(value)));

export function createItem(name: string, reserve: number, threshold: number, now = new Date()): PantryItem {
  const cleanName = name.trim().replace(/\s+/g, ' ');
  if (!cleanName || cleanName.length > 60) throw new Error('Name must be between 1 and 60 characters.');
  const count = clamp(reserve);
  const trigger = clamp(threshold, 20);
  return {
    id: crypto.randomUUID(), name: cleanName, reserve: count, threshold: trigger,
    onList: count <= trigger, createdAt: now.toISOString(), updatedAt: now.toISOString()
  };
}

export function finishOne(item: PantryItem, now = new Date()): PantryItem {
  const reserve = clamp(item.reserve - 1);
  return { ...item, reserve, onList: item.onList || reserve <= item.threshold, updatedAt: now.toISOString() };
}

export function correctReserve(item: PantryItem, delta: number, now = new Date()): PantryItem {
  const reserve = clamp(item.reserve + delta);
  return { ...item, reserve, onList: item.onList || reserve <= item.threshold, updatedAt: now.toISOString() };
}

export function markBought(item: PantryItem, quantity: number, now = new Date()): PantryItem {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error('Purchase quantity must be between 1 and 99.');
  return { ...item, reserve: clamp(item.reserve + quantity), onList: false, updatedAt: now.toISOString() };
}

export function makeEvent(item: PantryItem, kind: FinishEvent['kind'], delta: number, now = new Date()): FinishEvent {
  return { id: crypto.randomUUID(), itemId: item.id, itemName: item.name, kind, delta, at: now.toISOString() };
}

function isItem(value: unknown): value is PantryItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string' && typeof item.name === 'string' && item.name.length > 0 && item.name.length <= 60 &&
    Number.isInteger(item.reserve) && Number(item.reserve) >= 0 && Number(item.reserve) <= 99 &&
    Number.isInteger(item.threshold) && Number(item.threshold) >= 0 && Number(item.threshold) <= 20 &&
    typeof item.onList === 'boolean' && typeof item.createdAt === 'string' && typeof item.updatedAt === 'string';
}

function isEvent(value: unknown): value is FinishEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Record<string, unknown>;
  return typeof event.id === 'string' && typeof event.itemId === 'string' && typeof event.itemName === 'string' &&
    ['finished', 'corrected', 'bought'].includes(String(event.kind)) && Number.isInteger(event.delta) && typeof event.at === 'string';
}

export function validateExport(value: unknown): PantryExport {
  if (!value || typeof value !== 'object') throw new Error('That file is not a Finish One Pantry export.');
  const data = value as Record<string, unknown>;
  if (data.product !== 'finish-one-pantry' || data.version !== 1 || !Array.isArray(data.items) || !Array.isArray(data.events)) {
    throw new Error('That file is not a supported Finish One Pantry export.');
  }
  if (!data.items.every(isItem) || !data.events.every(isEvent)) throw new Error('The export contains invalid pantry records.');
  if (new Set(data.items.map((item) => item.id)).size !== data.items.length) throw new Error('The export contains duplicate items.');
  return data as unknown as PantryExport;
}
