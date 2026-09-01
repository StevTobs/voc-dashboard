import { FiUser, FiZap } from 'react-icons/fi';
import type { CurrentUser } from '../../types/dashboard';

interface HeaderProps {
  currentUser: CurrentUser | null;
}

export function Header({ currentUser }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex h-[90px] shrink-0 items-center justify-between bg-headerBg px-4 text-white shadow-sm sm:px-6">
      <div className="flex items-center gap-4">
        <span
          aria-label="PEA VOC logo"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/15 text-white ring-1 ring-white/40"
        >
          <FiZap size={20} />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-extrabold tracking-wide sm:text-2xl">
            PEA VOC
          </span>
          <span className="hidden text-xs font-medium text-white/80 sm:block">
            Dashboard
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          aria-label="ผู้ใช้งานปัจจุบัน"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-avatarBadge"
        >
          <FiUser size={26} />
        </span>
        <span className="hidden text-base sm:inline">
          Username : {currentUser?.username ?? '-'}
        </span>
      </div>
    </header>
  );
}
