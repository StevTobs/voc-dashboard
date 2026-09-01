import type { ReactNode } from 'react';
import {
  FiAlertOctagon,
  FiClipboard,
  FiLogOut,
  FiShield,
  FiUsers,
  FiX,
} from 'react-icons/fi';

export type DashboardPageKey = 'overall' | 'quality' | 'service' | 'corruption';

interface SidebarItem {
  key: DashboardPageKey;
  label: string;
  icon: ReactNode;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { key: 'overall', label: 'PEA Complaint 2568 Overall', icon: <FiClipboard size={18} /> },
  { key: 'quality', label: 'PEA Complaint 2568 Quality', icon: <FiShield size={18} /> },
  { key: 'service', label: 'PEA Complaint 2568 Service', icon: <FiUsers size={18} /> },
  {
    key: 'corruption',
    label: 'PEA Complaint 2568 Corruption',
    icon: <FiAlertOctagon size={18} />,
  },
];

interface SidebarProps {
  activePage: DashboardPageKey;
  onSelectPage: (page: DashboardPageKey) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}

export function Sidebar({
  activePage,
  onSelectPage,
  isMobileOpen,
  onCloseMobile,
  onLogout,
}: SidebarProps) {
  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-sidebarBg transition-transform duration-200 md:static md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 md:hidden">
          <span className="text-sm font-semibold text-sidebarActiveText">
            เมนู
          </span>
          <button
            type="button"
            aria-label="ปิดเมนู"
            onClick={onCloseMobile}
            className="rounded p-1 text-sidebarActiveText hover:bg-white/50"
          >
            <FiX size={20} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = item.key === activePage;
            return (
              <button
                key={item.key}
                type="button"
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onSelectPage(item.key)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                  isActive
                    ? 'bg-white font-semibold text-sidebarActiveText shadow-sm'
                    : 'text-textBody hover:bg-white/60'
                }`}
              >
                {item.icon}
                <span className="leading-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="border-t border-peaBorder p-3">
          <button
            type="button"
            aria-label="ออกจากระบบ"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-sidebarActiveText hover:bg-white/60"
          >
            <FiLogOut size={18} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>
    </>
  );
}
