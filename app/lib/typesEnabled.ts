// app/lib/typesEnabled.ts
//
// Whether the "type" tag pool is in use for this tenant. The stored flag is
// settings.hide_types, which means "types HIDDEN" — inverted so the column
// default (false) means "shown". Read it through this helper so nobody has to
// remember the inversion. Hiding never deletes stored type assignments.
export function typesEnabled(settings: { hide_types: boolean }): boolean {
  return !settings.hide_types;
}
