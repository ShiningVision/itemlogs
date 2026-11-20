// app/lib/datetime.ts
//
// The optional per-item DATE ("vacation item" feature). Named "datetime" in
// settings/columns for historical reasons — it is date-only: no time of day
// is stored or shown.
//
//  - settings.use_datetime — items can carry a date at
//    all (dashboard item form field). Off by default.
//  - settings.show_datetime — also show it on the visitor
//    item page. Off by default, and only meaningful while use_datetime is
//    on.
//
// items.item_datetime is a DATE column (migration 0008 converted the
// TIMESTAMP it was first created as — any time part was dropped). It's a
// calendar date with no time zone, so everyone sees the same day. In the
// dashboard form it travels as a `date` input string ("2026-11-14"), the
// same shape the database returns — no conversion between input and column.

export function datetimeEnabled(settings: { use_datetime: boolean }): boolean {
  return settings.use_datetime;
}

export function datetimeShown(settings: { use_datetime: boolean; show_datetime: boolean }): boolean {
  return settings.use_datetime && settings.show_datetime;
}

// Today as "YYYY-MM-DD" in the browser's own local time, to default a new
// item's date to the day it's created. Client-only (uses the local time
// zone); never call it during server rendering.
export function todayAsLocalDateInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Database value -> date input value. Tolerant of a leftover time part
// ("2026-11-14T00:00:00", from before the column was converted to DATE):
// only the date is kept. Empty for null.
export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return '';
  return String(value).slice(0, 10);
}

// Formats a stored date for display, in the visitor's language. Built as a
// UTC date and formatted in UTC so the calendar day comes out exactly as
// entered, whatever the server's or visitor's time zone is.
export function formatDate(value: string | null | undefined, locale: string): string {
  const m = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(y, mo - 1, d)));
}
