import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/create-will', label: 'Create Will' },
  { to: '/logout', label: 'Logout' },
];

export default function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const { user } = useAuth(true);

  async function handleLogout() {
    localStorage.removeItem('digital_will_token');
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-[#FFF6EC] text-[#111111]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full border-b border-[#f2dfc8] bg-white/90 p-6 shadow-sm lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF6B00] text-lg font-semibold text-white">DW</div>
            <div>
              <p className="text-sm font-semibold text-[#111111]">Digital Will AI</p>
              <p className="text-xs text-slate-500">Protected workspace</p>
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {navItems.map((item) => (
              <div key={item.to}>
                {item.to === '/logout' ? (
                  <button onClick={handleLogout} className="flex w-full items-center rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-[#FFF6EC]">
                    {item.label}
                  </button>
                ) : (
                  <NavLink to={item.to} className={({ isActive }) => `flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-[#FF6B00] text-white shadow-sm' : 'text-slate-700 hover:bg-[#FFF6EC]'}`}>
                    {item.label}
                  </NavLink>
                )}
              </div>
            ))}
          </nav>

          <div className="mt-8 rounded-3xl border border-[#f2dfc8] bg-[#FFF6EC] p-4">
            <p className="text-sm font-semibold">Welcome back</p>
            <p className="mt-1 text-sm text-slate-600">{user?.fullName || 'Secure member'}</p>
          </div>
        </aside>

        <main className="flex-1 bg-[#FFF6EC] p-4 sm:p-6 lg:p-8">
          <header className="mb-6 flex items-center justify-between rounded-[24px] border border-[#f2dfc8] bg-white p-4 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-[#FF6B00]">Secure inheritance workspace</p>
              <h1 className="text-xl font-semibold text-[#111111]">Professional control center</h1>
            </div>
            <Link to="/" className="rounded-2xl border border-[#f2dfc8] px-4 py-2 text-sm font-medium text-slate-700">Home</Link>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
