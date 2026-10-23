import { useState } from 'react'
import { Sidebar, Topbar, ToastContainer, useToast } from './components/Shared'
import DashboardPage from './components/DashboardPage'
import PoliciesPage from './components/PoliciesPage'
import VerifyPage from './components/VerifyPage'
import PackagesPage from './components/PackagesPage'
import './index.css'

const PAGE_TITLES = {
  dashboard: 'Dashboard ภาพรวม',
  policies:  'รายการกรมธรรม์ทั้งหมด',
  verify:    'ตรวจสอบสิทธิ์ประกัน (IMEI Verify)',
  packages:  'จัดการแพ็กเกจประกันภัย',
};

function App() {
  const [page, setPage] = useState('dashboard');
  const { toasts, addToast } = useToast();

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage />;
      case 'policies':  return <PoliciesPage />;
      case 'verify':    return <VerifyPage addToast={addToast} />;
      case 'packages':  return <PackagesPage addToast={addToast} />;
      default:          return <DashboardPage />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={page} onNavigate={setPage} />
      <div className="main-content">
        <Topbar title={PAGE_TITLES[page]} />
        {renderPage()}
      </div>
      <ToastContainer toasts={toasts} />
    </div>
  );
}

export default App
