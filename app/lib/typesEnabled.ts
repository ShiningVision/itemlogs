// app/lib/typesEnabled.ts
//
// Whether the "type" tag pool is in use for this tenant. The stored flag is
// settings.spare_toggle_7, which means "types HIDDEN" (inverted — spare
// toggles default to false, and existing tenants must keep types visible
// without a migration; see Settings.spare_toggle_7 in definitions.ts). Read
// it through this helper so nobody has to remember the inversion.
export function typesEnabled(settings: { spare_toggle_7: boolean }): boolean {
  return !settings.spare_toggle_7;
}
