import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Printer, Truck, TrendingUp, AlertTriangle, Clock, Link2, RefreshCw, ChevronRight, AlertCircle } from 'lucide-react'
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

const STAGE_DAYS_THRESHOLD = 3

interface AlertItem {
  id: string
  type: 'stuck' | 'missing' | 'rework' | 'pending'
  orderId: string
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  action: string
  path: string
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { orders, printJobs, inspections, materialTasks, supportRemovals, postProcesses, shipments } = useStore()

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

  const alerts = useMemo((): AlertItem[] => {
    const list: AlertItem[] = []
    const now = new Date()

    // 1. 卡单预警 - 订单在某个工序停留太久
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt)
      const daysDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
      let stageDays = daysDiff
      if (order.status !== 'pending' && order.status !== 'completed') {
        stageDays = Math.max(1, daysDiff - STAGE_DAYS_THRESHOLD * pipelineStages.indexOf(order.status))
      }
      if (order.status !== 'completed' && stageDays > STAGE_DAYS_THRESHOLD) {
        list.push({
          id: `stuck-${order.id}`,
          type: 'stuck',
          orderId: order.id,
          title: `${statusLabels[order.status]}工序卡单`,
          description: `订单 ${order.id} 在「${statusLabels[order.status]}」已停留约 ${stageDays} 天`,
          severity: stageDays > 7 ? 'high' : 'medium',
          action: '前往处理',
          path: `/order`,
        })
      }
    })

    // 2. 断档提醒 - 缺少下一工序任务
    orders.forEach(order => {
      const hasInspection = inspections.some(i => i.orderId === order.id)
      const hasMaterialTask = materialTasks.some(t => t.orderId === order.id)
      const hasPrintJob = printJobs.some(j => j.orderId === order.id)
      const hasSupportRemoval = supportRemovals.some(s => s.orderId === order.id)
      const hasPostProcess = postProcesses.some(p => p.orderId === order.id)
      const hasShipment = shipments.some(s => s.orderId === order.id)

      if (order.status === 'preparing' && !hasMaterialTask) {
        list.push({
          id: `missing-mat-${order.id}`,
          type: 'missing',
          orderId: order.id,
          title: '缺少备料任务',
          description: `订单 ${order.id} 已进入材料备料阶段，但暂无备料任务`,
          severity: 'high',
          action: '创建任务',
          path: `/material`,
        })
      }
      if (order.status === 'printing' && !hasPrintJob) {
        list.push({
          id: `missing-print-${order.id}`,
          type: 'missing',
          orderId: order.id,
          title: '缺少打印任务',
          description: `订单 ${order.id} 已进入打印阶段，但暂无打印作业`,
          severity: 'high',
          action: '安排打印',
          path: `/printing`,
        })
      }
      if (order.status === 'removing' && !hasSupportRemoval) {
        list.push({
          id: `missing-support-${order.id}`,
          type: 'missing',
          orderId: order.id,
          title: '缺少支撑去除任务',
          description: `订单 ${order.id} 已进入支撑去除阶段，但暂无任务`,
          severity: 'medium',
          action: '创建任务',
          path: `/support-removal`,
        })
      }
      if (order.status === 'processing' && !hasPostProcess) {
        list.push({
          id: `missing-pp-${order.id}`,
          type: 'missing',
          orderId: order.id,
          title: '缺少后处理任务',
          description: `订单 ${order.id} 已进入后处理阶段，但暂无检测单`,
          severity: 'medium',
          action: '创建检测单',
          path: `/post-processing`,
        })
      }
      if (order.status === 'shipping' && !hasShipment) {
        list.push({
          id: `missing-ship-${order.id}`,
          type: 'missing',
          orderId: order.id,
          title: '待发货订单',
          description: `订单 ${order.id} 已完成生产，等待发货`,
          severity: 'low',
          action: '安排发货',
          path: `/shipping`,
        })
      }
    })

    // 3. 返工订单
    postProcesses.forEach(pp => {
      if (pp.qualityResult === 'rework') {
        list.push({
          id: `rework-${pp.id}`,
          type: 'rework',
          orderId: pp.orderId,
          title: '返工订单',
          description: `订单 ${pp.orderId} 后处理判定为返工，需要重新处理`,
          severity: 'high',
          action: '查看详情',
          path: `/post-processing`,
        })
      }
    })

    // 4. 待处理任务统计
    const pendingInspect = orders.filter(o => o.status === 'pending').length
    if (pendingInspect > 0) {
      list.push({
        id: 'pending-inspect',
        type: 'pending',
        orderId: '',
        title: '待模型检查',
        description: `有 ${pendingInspect} 个订单等待模型检查`,
        severity: 'medium',
        action: '立即处理',
        path: `/inspection`,
      })
    }

    // 按严重程度排序
    const severityOrder = { high: 0, medium: 1, low: 2 }
    return list.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
  }, [orders, inspections, materialTasks, printJobs, supportRemovals, postProcesses, shipments])

  const alertStats = useMemo(() => ({
    total: alerts.length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length,
  }), [alerts])

  const severityColor = {
    high: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', text: '#EF4444' },
    medium: { bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.3)', text: '#EAB308' },
    low: { bg: 'rgba(74,144,217,0.15)', border: 'rgba(74,144,217,0.3)', text: '#4A90D9' },
  }

  const alertIcon: Record<string, React.ReactNode> = {
    stuck: <Clock size={16} />,
    missing: <Link2 size={16} />,
    rework: <RefreshCw size={16} />,
    pending: <AlertCircle size={16} />,
  }

  const alertTypeLabel: Record<string, string> = {
    stuck: '卡单',
    missing: '断档',
    rework: '返工',
    pending: '待处理',
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>生产总览</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>实时监控金属3D打印生产全流程</p>
      </div>

      {/* 统计卡片 */}
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

      {/* 异常提醒 */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
              <AlertTriangle size={18} style={{ color: '#EF4444' }} />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>异常提醒</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>共 {alertStats.total} 项异常 · 高危 {alertStats.high} · 中危 {alertStats.medium} · 低危 {alertStats.low}</p>
            </div>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
            <AlertCircle size={36} className="mx-auto mb-3" style={{ opacity: 0.3 }} />
            <p>暂无异常，生产运转正常</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
            {alerts.map(alert => {
              const colors = severityColor[alert.severity]
              return (
                <div
                  key={alert.id}
                  className="rounded-lg p-3 cursor-pointer transition-all hover:scale-[1.02]"
                  style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
                  onClick={() => navigate(alert.path)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span style={{ color: colors.text }}>{alertIcon[alert.type]}</span>
                      <span className="text-xs font-semibold" style={{ color: colors.text }}>
                        {alertTypeLabel[alert.type]}
                      </span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: colors.text + '22', color: colors.text }}>
                      {alert.severity === 'high' ? '高危' : alert.severity === 'medium' ? '中危' : '低危'}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{alert.title}</h3>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{alert.description}</p>
                  <div className="flex items-center justify-end">
                    <span className="text-xs font-medium flex items-center gap-1" style={{ color: colors.text }}>
                      {alert.action} <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
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
              <tr key={order.id} className="border-t cursor-pointer hover:bg-[#16181D]" style={{ borderColor: 'var(--border-color)' }} onClick={() => navigate('/order')}>
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
