import { useEffect, useRef, useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import type { FilterOption } from '../../types/dashboard';

interface MultiSelectDropdownProps {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
}

export function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggleValue(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  const summary =
    selected.length === 0
      ? label
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? label)
        : `${label} (${selected.length})`;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-[38px] min-w-[150px] items-center justify-between gap-2 rounded-md border border-peaBorder bg-white px-3 text-sm text-textBody shadow-sm hover:border-headerBg"
      >
        <span className="truncate">{summary}</span>
        <FiChevronDown className="shrink-0 text-textBody/60" />
      </button>
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full min-w-[180px] overflow-y-auto rounded-md border border-peaBorder bg-white p-1 shadow-lg"
        >
          {options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-pageBg"
            >
              <input
                type="checkbox"
                aria-label={option.label}
                checked={selected.includes(option.value)}
                onChange={() => toggleValue(option.value)}
                className="accent-headerBg"
              />
              {option.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
