import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, SearchCheck, Package, Printer, Scissors, Sparkles, Truck } from 'lucide-react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '生产总览' },
  { path: '/order', icon: ShoppingCart, label: '在线下单' },
  { path: '/inspection', icon: SearchCheck, label: '模型检查' },
  { path: '/material', icon: Package, label: '材料备料' },
  { path: '/printing', icon: Printer, label: '打印作业' },
  { path: '/support-removal', icon: Scissors, label: '支撑去除' },
  { path: '/post-processing', icon: Sparkles, label: '表面后处理' },
  { path: '/shipping', icon: Truck, label: '成品发货' },
]

export default function Layout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <aside className="w-[220px] flex-shrink-0 flex flex-col" style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-color)' }}>
        <div className="px-5 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6B35, #FF8F35)' }}>
            <Printer size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold leading-tight" style={{ color: 'var(--accent-orange)' }}>MetalForge</h1>
            <p className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>金属3D打印管理</p>
          </div>
        </div>

        <div className="px-3 mb-2">
          <div className="h-px w-full" style={{ background: 'var(--border-color)' }}></div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                  isActive
                    ? 'text-white'
                    : 'hover:bg-white/5'
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? 'linear-gradient(135deg, #FF6B3522, #FF8F3511)' : 'transparent',
                borderLeft: isActive ? '3px solid #FF6B35' : '3px solid transparent',
                color: isActive ? '#FF6B35' : 'var(--text-secondary)',
              })}
            >
              <item.icon size={18} className="flex-shrink-0" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4">
          <div className="card px-3 py-3 relative overflow-hidden laser-sweep">
            <p className="text-xs font-medium" style={{ color: 'var(--accent-gold)' }}>系统运行中</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>3台设备在线 · 2个任务执行中</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
        <Outlet />
      </main>
    </div>
  )
}
