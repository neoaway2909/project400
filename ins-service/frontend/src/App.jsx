import { useState } from 'react'
import { Sidebar, Topbar, ToastContainer, useToast, InsLangProvider, useInsLang } from './components/Shared'
import DashboardPage from './components/DashboardPage'
import PoliciesPage from './components/PoliciesPage'
import RepairsPage from './components/RepairsPage'
import VerifyPage from './components/VerifyPage'
import PackagesPage from './components/PackagesPage'
import './index.css'

const PAGE_TITLES = {
  dashboard: { th: 'สรุปภาพรวมระบบประกันภัย',        en: 'Insurance Overview Dashboard' },
  policies:  { th: 'รายการกรมธรรม์ทั้งหมด',          en: 'All Insurance Policies' },
  repairs:   { th: 'จัดการงานเคลมและสถานะการซ่อม',    en: 'Claim & Repair Status Management' },
  verify:    { th: 'ตรวจสอบสิทธิ์ความคุ้มครองประกันภัย', en: 'IMEI Coverage Verification' },
  packages:  { th: 'จัดการแพ็กเกจประกันภัย',         en: 'Insurance Packages Management' },
};

function AppShell() {
  const { lang } = useInsLang();
  const [page, setPage] = useState('dashboard');
  const { toasts, addToast } = useToast();

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage />;
      case 'policies':  return <PoliciesPage addToast={addToast} />;
      case 'repairs':   return <RepairsPage addToast={addToast} />;
      case 'verify':    return <VerifyPage addToast={addToast} />;
      case 'packages':  return <PackagesPage addToast={addToast} />;
      default:          return <DashboardPage />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={page} onNavigate={setPage} />
      <div className="main-content">
        <Topbar title={lang === 'th' ? PAGE_TITLES[page]?.th : PAGE_TITLES[page]?.en} />
        {renderPage()}
      </div>
      <ToastContainer toasts={toasts} />
    </div>
  );
}

function App() {
  return (
    <InsLangProvider>
      <AppShell />
    </InsLangProvider>
  );
}

export default App
