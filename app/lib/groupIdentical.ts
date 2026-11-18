// app/lib/groupIdentical.ts
//
// "Group identical items" (visitor page setting) — on the storefront, items
// with the same name, description and sell price show up as ONE card, so
// visitors can't tell how many of something the owner has in stock. On by
// default.
//
// Stored as settings.spare_toggle_10, INVERTED on purpose (same trick as
// spare_toggle_7 / typesEnabled): spare toggles default to false and existing
// tenants must get the new default (grouping on) with zero migration, so
// true = "show every copy separately" and false (the default) = grouped. The
// settings UI presents it as a normal "Group identical items" switch. Read it
// through groupIdenticalItems() rather than testing the raw flag. Kept named
// spare_toggle_10 — do not rename.

export function groupIdenticalItems(settings: { spare_toggle_10: boolean }): boolean {
  return !settings.spare_toggle_10;
}

type Groupable = {
  name?: string | null;
  description?: string | null;
  sell_price?: number | string | null;
  status?: number;
};

function groupKey(row: Groupable): string {
  const price = row.sell_price === null || row.sell_price === undefined ? null : Number(row.sell_price);
  return JSON.stringify([(row.name ?? '').trim(), (row.description ?? '').trim(), price]);
}

// Collapses identical rows into one, keeping each group at the position of
// its first row. The row that stands for the group is the first Available
// one (status 1) if any — so a group with stock never shows up as "Sold" —
// otherwise simply the first.
export function groupIdenticalRows<T extends Groupable>(rows: T[]): T[] {
  const slots = new Map<string, number>();
  const out: T[] = [];
  for (const row of rows) {
    const key = groupKey(row);
    const slot = slots.get(key);
    if (slot === undefined) {
      slots.set(key, out.length);
      out.push(row);
    } else if (out[slot].status !== 1 && row.status === 1) {
      out[slot] = row;
    }
  }
  return out;
}
