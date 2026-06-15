import { useMemo } from 'react'
import { ShoppingCart, Printer, Truck, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useStore, statusLabels, statusColors } from '@/store'
import type { Order } from '@/store'

const pipelineStages: Order['status'][] = [
  'pending', 'inspecting', 'preparing', 'printing', 'removing', 'processing', 'shipping',
]

const monthlyData = [
  { month: '7月', orders: 3 }, { month: '8月', orders: 5 },
  { month: '9月', orders: 4 }, { month: '10月', orders: 7 },
  { month: '11月', orders: 6 }, { month: '12月', orders: 6 },
]

export default function Dashboard() {
  const { orders, printJobs } = useStore()

  const stats = useMemo(() => {
    const printing = orders.filter(o => o.status === 'printing').length
    const shipping = orders.filter(o => o.status === 'shipping').length
    const revenue = orders.reduce((sum, o) => sum + o.quotePrice, 0)
    return { total: orders.length, printing, shipping, revenue }
  }, [orders])

  const stageCounts = useMemo(() => {
    const map: Record<string, number> = {}
    pipelineStages.forEach(s => { map[s] = orders.filter(o => o.status === s).length })
    return map
  }, [orders])

  const recentOrders = useMemo(() => [...orders].reverse().slice(0, 5), [orders])

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>生产总览</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>实时监控金属3D打印生产全流程</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '总订单数', value: stats.total, icon: ShoppingCart, color: 'var(--accent-blue)' },
          { label: '打印中', value: stats.printing, icon: Printer, color: 'var(--accent-orange)' },
          { label: '待发货', value: stats.shipping, icon: Truck, color: 'var(--accent-gold)' },
          { label: '本月产值', value: `¥${stats.revenue.toLocaleString()}`, icon: TrendingUp, color: 'var(--success)' },
        ].map((item, i) => (
          <div key={i} className="card p-5 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                <p className="font-display text-3xl font-bold" style={{ color: item.color }}>{item.value}</p>
              </div>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${item.color}18` }}>
                <item.icon size={22} style={{ color: item.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 card p-5">
          <h2 className="font-display text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>生产流水线</h2>
          <div className="flex items-center gap-1">
            {pipelineStages.map((stage, i) => (
              <div key={stage} className="flex-1 flex items-center">
                <div className="flex-1 rounded-lg p-3 text-center relative" style={{
                  background: stageCounts[stage] > 0 ? 'var(--accent-orange-dim)' : '#16181D',
                  border: `1px solid ${stageCounts[stage] > 0 ? '#FF6B3555' : 'var(--border-color)'}`,
                }}>
                  <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>{statusLabels[stage]}</p>
                  <p className="font-display text-2xl font-bold" style={{
                    color: stageCounts[stage] > 0 ? 'var(--accent-orange)' : 'var(--text-muted)',
                  }}>{stageCounts[stage]}</p>
                </div>
                {i < pipelineStages.length - 1 && (
                  <div className="w-4 flex-shrink-0 h-px" style={{ background: 'var(--border-color)' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-display text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>月度订单趋势</h2>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#1E2128', border: '1px solid #2D3139', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#9CA3AF' }}
                itemStyle={{ color: '#FF6B35' }}
              />
              <Bar dataKey="orders" fill="#FF6B35" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-display text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>最近订单</h2>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: 'var(--text-muted)' }}>
              <th className="text-left pb-3 font-medium">订单号</th>
              <th className="text-left pb-3 font-medium">客户</th>
              <th className="text-left pb-3 font-medium">材料</th>
              <th className="text-left pb-3 font-medium">金额</th>
              <th className="text-left pb-3 font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map(order => (
              <tr key={order.id} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                <td className="py-3 font-display font-semibold" style={{ color: 'var(--accent-blue)' }}>{order.id}</td>
                <td className="py-3">{order.customerName}</td>
                <td className="py-3" style={{ color: 'var(--text-secondary)' }}>{order.material}</td>
                <td className="py-3 font-display font-semibold">¥{order.quotePrice.toLocaleString()}</td>
                <td className="py-3">
                  <span className={`status-badge ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
