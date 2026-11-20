// app/lib/locationsEnabled.ts
//
// Whether the tenant uses locations at all ("Use locations" in General
// Settings). The stored flag is settings.hide_locations, INVERTED like
// hide_types (see typesEnabled.ts): the column default (false) means
// "locations shown". Read it through this helper rather than testing the raw
// flag. Turning locations off hides them everywhere (item form, filters,
// visitor page, Excel import/export) but never deletes stored assignments.
export function locationsEnabled(settings: { hide_locations: boolean }): boolean {
  return !settings.hide_locations;
}
