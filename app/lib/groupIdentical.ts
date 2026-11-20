// app/lib/groupIdentical.ts
//
// "Group identical items" (visitor page setting) — on the storefront, items
// with the same name, description and sell price show up as ONE card, so
// visitors can't tell how many of something the owner has in stock. On by
// default.
//
// Stored as settings.ungroup_identical_items, INVERTED like hide_types (see
// typesEnabled.ts): true = "show every copy separately", false (the column
// default) = grouped. The settings UI presents it as a normal "Group
// identical items" switch. Read it through groupIdenticalItems() rather than
// testing the raw flag.

export function groupIdenticalItems(settings: { ungroup_identical_items: boolean }): boolean {
  return !settings.ungroup_identical_items;
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
