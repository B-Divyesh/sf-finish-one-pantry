import { createItem, makeEvent, type FinishEvent, type PantryItem } from './domain';

/** Opinionated sample records used only by the isolated demo database. */
export function createSamplePantry() {
  const now = new Date('2026-09-05T09:30:00.000Z');
  const oatMilk = createItem('Oat milk', 2, 1, now);
  const rice = createItem('Basmati rice', 4, 2, now);
  const detergent = createItem('Laundry detergent', 1, 1, now);
  const coffee = createItem('Coffee beans', 3, 1, now);
  const items: PantryItem[] = [oatMilk, rice, { ...detergent, onList: true }, coffee];
  const events: FinishEvent[] = [
    { ...makeEvent(detergent, 'finished', -1, new Date('2026-09-04T18:20:00.000Z')), itemName: 'Laundry detergent' },
    { ...makeEvent(coffee, 'corrected', 1, new Date('2026-09-03T08:10:00.000Z')), itemName: 'Coffee beans' }
  ];
  return { items, events };
}
