// components/dashboard/StorefrontLiveStatus.tsx
import type { Settings } from '@/app/lib/definitions';
import { StorefrontLiveToggle } from '@/components/dashboard/StorefrontLiveToggle';

export function StorefrontLiveStatus({ settings }: { settings: Settings }) {
  return (
    <div className="dashboard-card dashboard-live-status">
      <StorefrontLiveToggle defaultChecked={Boolean(settings.show)} />
    </div>
  );
}
