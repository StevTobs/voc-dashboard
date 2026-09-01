import { FiUser, FiZap } from 'react-icons/fi';
import type { CurrentUser } from '../../types/dashboard';

interface HeaderProps {
  currentUser: CurrentUser | null;
}

export function Header({ currentUser }: HeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-headerBg px-4 text-white shadow-sm sm:px-6">
      <div className="flex items-center gap-3">
        <span
          aria-label="PEA VOC logo"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white ring-1 ring-white/40"
        >
          <FiZap size={18} />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-extrabold tracking-wide">
            PEA VOC
          </span>
          <span className="hidden text-xs font-medium text-white/80 sm:block">
            Dashboard
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <span
          aria-label="ผู้ใช้งานปัจจุบัน"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-avatarBadge text-white"
        >
          <FiUser size={16} />
        </span>
        <span className="hidden text-sm sm:inline">
          Username : {currentUser?.username ?? '-'}
        </span>
      </div>
    </header>
  );
}
