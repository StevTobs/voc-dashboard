import { useEffect, useState } from 'react';
import { FiMenu } from 'react-icons/fi';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import type { DashboardPageKey } from './components/layout/Sidebar';
import { OverallPage } from './pages/OverallPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { fetchCurrentUser } from './services/api';
import type { CurrentUser } from './types/dashboard';

const PAGE_TITLES: Record<DashboardPageKey, string> = {
  overall: 'PEA Complaint 2568 Overall',
  quality: 'PEA Complaint 2568 Quality',
  service: 'PEA Complaint 2568 Service',
  corruption: 'PEA Complaint 2568 Corruption',
};

function App() {
  const [activePage, setActivePage] = useState<DashboardPageKey>('overall');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    fetchCurrentUser().then(setCurrentUser);
  }, []);

  function handleLogout() {
    // TODO: BACKEND INTEGRATION POINT
    // POST /api/auth/logout
    // No real session to clear yet — mock user state only.
    setCurrentUser(null);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1200px] flex-col bg-pageBg">
      <Header currentUser={currentUser} />
      <div className="flex flex-1 items-start">
        <Sidebar
          activePage={activePage}
          onSelectPage={(page) => {
            setActivePage(page);
            setIsMobileSidebarOpen(false);
          }}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onLogout={handleLogout}
        />
        <main className="min-w-0 flex-1">
          <div className="p-3 md:hidden">
            <button
              type="button"
              aria-label="เปิดเมนู"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex items-center gap-2 rounded-md border border-peaBorder bg-white px-3 py-2 text-sm text-textBody shadow-sm"
            >
              <FiMenu size={18} />
              เมนู
            </button>
          </div>
          {activePage === 'overall' ? (
            <OverallPage />
          ) : (
            <PlaceholderPage title={PAGE_TITLES[activePage]} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
