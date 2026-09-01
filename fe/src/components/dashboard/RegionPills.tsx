import type { RegionKey } from '../../types/dashboard';

const REGION_OPTIONS: { key: RegionKey; label: string }[] = [
  { key: 'hq', label: 'สำนักงานใหญ่' },
  { key: 'north', label: 'ภาคเหนือ' },
  { key: 'northeast', label: 'ภาคตะวันออกเฉียงเหนือ' },
  { key: 'central', label: 'ภาคกลาง' },
  { key: 'south', label: 'ภาคใต้' },
];

interface RegionPillsProps {
  selected: RegionKey[];
  onChange: (regions: RegionKey[]) => void;
}

export function RegionPills({ selected, onChange }: RegionPillsProps) {
  function toggle(key: RegionKey) {
    if (selected.includes(key)) {
      onChange(selected.filter((r) => r !== key));
    } else {
      onChange([...selected, key]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {REGION_OPTIONS.map((region) => {
        const isActive = selected.includes(region.key);
        return (
          <button
            key={region.key}
            type="button"
            aria-label={region.label}
            aria-pressed={isActive}
            onClick={() => toggle(region.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-pillActive text-white shadow-sm'
                : 'border border-peaBorder bg-white text-textBody hover:border-pillActive'
            }`}
          >
            {region.label}
          </button>
        );
      })}
    </div>
  );
}
