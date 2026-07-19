// app/lib/packageStatus.ts
export type PackageStatus = 'pending' | 'in_transit' | 'arrived';

/**
 * Derives a shipment status from the dates already on a package — no extra
 * column needed. "Arrived" once the arrival date has passed, "In transit"
 * once it has departed but not (yet) arrived, otherwise "Pending".
 */
export function getPackageStatus(pkg: { departure_date: string | null; arrival_date: string | null }): PackageStatus {
  const today = new Date().toISOString().slice(0, 10);

  if (pkg.arrival_date && pkg.arrival_date <= today) {
    return 'arrived';
  }
  if (pkg.departure_date) {
    return 'in_transit';
  }
  return 'pending';
}
