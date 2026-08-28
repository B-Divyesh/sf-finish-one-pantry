import { beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { correctReserve, createItem, finishOne, makeEvent, markBought, validateExport } from '../../src/domain';

describe('pantry signal', () => {
  const now = new Date('2026-08-27T10:00:00.000Z');

  it('adds an item to the list at its chosen threshold', () => {
    const item = createItem('Oat milk', 2, 1, now);
    expect(item.onList).toBe(false);
    const finished = finishOne(item, now);
    expect(finished.reserve).toBe(1);
    expect(finished.onList).toBe(true);
  });

  it('never claims a negative reserve', () => {
    const item = createItem('Rice', 0, 0, now);
    expect(finishOne(item, now).reserve).toBe(0);
    expect(correctReserve(item, -1, now).reserve).toBe(0);
  });

  it('keeps an item listed until the purchase is explicitly recorded', () => {
    const listed = finishOne(createItem('Detergent', 1, 0, now), now);
    const corrected = correctReserve(listed, 2, now);
    expect(corrected.onList).toBe(true);
    const bought = markBought(corrected, 3, now);
    expect(bought.reserve).toBe(5);
    expect(bought.onList).toBe(false);
  });

  it('rejects unrelated or malformed imports', () => {
    expect(() => validateExport({ version: 1, items: [] })).toThrow(/not a supported/i);
    expect(() => validateExport({ product: 'finish-one-pantry', version: 1, exportedAt: now.toISOString(), items: [{ id: 'bad' }], events: [] })).toThrow(/invalid/i);
    const valid = createItem('Flour', 2, 1, now);
    expect(() => validateExport({ product: 'finish-one-pantry', version: 1, exportedAt: now.toISOString(), items: [{ ...valid, id: '\" onmouseover=\"alert(1)' }], events: [] })).toThrow(/invalid/i);
  });
});

describe('IndexedDB store', () => {
  beforeEach(async () => {
    Object.defineProperty(globalThis, 'indexedDB', { value: new IDBFactory(), configurable: true });
  });

  it('persists items and events and deletes their history together', async () => {
    const { createStore } = await import('../../src/storage');
    const store = await createStore();
    const item = createItem('Coffee', 3, 1);
    const event = makeEvent(item, 'finished', -1);
    await store.saveItem(item);
    await store.addEvent(event);
    expect((await store.load()).items).toHaveLength(1);
    await store.deleteItem(item.id);
    const empty = await store.load();
    expect(empty.items).toEqual([]);
    expect(empty.events).toEqual([]);
  });
});
