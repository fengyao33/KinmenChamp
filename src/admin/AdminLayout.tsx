import { useState } from 'react'
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import {
  BadgePercent,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  MessagesSquare,
  Route as RouteIcon,
  Store,
  X,
  type LucideIcon,
} from 'lucide-react'
import Logo from '../components/Logo'
import { auth } from './auth'
import { ToastProvider } from './ui'

const NAV: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/admin', label: '總覽', icon: LayoutDashboard, end: true },
  { to: '/admin/stores', label: '店家管理', icon: Store },
  { to: '/admin/offers', label: '活動與優惠', icon: BadgePercent },
  { to: '/admin/routes', label: '遊程編排', icon: RouteIcon },
  { to: '/admin/form', label: 'AI 表單設計', icon: MapPinned },
  { to: '/admin/insights', label: '評論與旅遊資訊', icon: MessagesSquare },
]

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="後台功能" className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition ${
              isActive ? 'bg-brick-600 text-white' : 'text-ink-600 hover:bg-paper-200'
            }`
          }
        >
          <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const [drawer, setDrawer] = useState(false)

  if (!auth.isAuthed()) return <Navigate to="/admin/login" replace />

  const logout = () => {
    auth.logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-paper-100">
        {/* 桌面側邊選單 */}
        <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-ink-900/5 bg-paper-50 p-4 lg:flex">
          <div className="flex items-center gap-2 px-2 py-2">
            <Logo className="h-8" clickable={false} />
            <span className="rounded-md bg-ink-900/5 px-2 py-0.5 text-xs font-bold text-ink-500">後台</span>
          </div>
          <div className="mt-6 flex-1">
            <NavItems />
          </div>
          <button
            onClick={logout}
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold text-ink-600 transition hover:bg-paper-200"
          >
            <LogOut className="h-5 w-5" strokeWidth={2} />
            登出
          </button>
        </aside>

        {/* 手機頂列 */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-ink-900/5 bg-paper-50/90 px-4 backdrop-blur lg:hidden">
          <button
            onClick={() => setDrawer(true)}
            aria-label="開啟選單"
            aria-expanded={drawer}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-700 transition hover:bg-paper-200"
          >
            <Menu className="h-6 w-6" strokeWidth={2} />
          </button>
          <div className="flex items-center gap-2">
            <Logo className="h-7" clickable={false} />
            <span className="rounded-md bg-ink-900/5 px-1.5 py-0.5 text-[11px] font-bold text-ink-500">後台</span>
          </div>
          <div className="w-10" />
        </header>

        {/* 手機抽屜 */}
        {drawer && (
          <div className="fixed inset-0 z-[800] lg:hidden" role="dialog" aria-label="功能選單">
            <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => setDrawer(false)} />
            <div className="dz-slide-left absolute inset-y-0 left-0 flex w-72 flex-col bg-paper-50 p-4 shadow-2xl">
              <div className="flex items-center justify-between px-2 py-2">
                <Logo className="h-8" clickable={false} />
                <button onClick={() => setDrawer(false)} aria-label="關閉選單" className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-paper-200">
                  <X className="h-5 w-5" strokeWidth={2.5} />
                </button>
              </div>
              <div className="mt-4 flex-1">
                <NavItems onNavigate={() => setDrawer(false)} />
              </div>
              <button onClick={logout} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold text-ink-600 transition hover:bg-paper-200">
                <LogOut className="h-5 w-5" strokeWidth={2} />
                登出
              </button>
            </div>
          </div>
        )}

        {/* 內容 */}
        <main className="px-4 py-6 sm:px-8 sm:py-8 lg:pl-72">
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </ToastProvider>
  )
}
