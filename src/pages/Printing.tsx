import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import { Printer, Activity, Thermometer, Wind, Play, Pause, CheckCircle, Scissors, ArrowLeft, AlertCircle, Package } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { statusLabels, statusColors } from '@/store'

const TABS = ['打印队列', '实时监控'] as const
const COLUMNS = [
  { key: 'queued', label: '待打印', color: '#6B7280' },
  { key: 'printing', label: '打印中', color: '#FF6B35' },
  { key: 'completed', label: '已完成', color: '#22C55E' },
] as const

const statusLabel: Record<string, string> = { queued: '待打印', printing: '打印中', paused: '已暂停', completed: '已完成' }
const statusColor: Record<string, string> = { queued: '#6B7280', printing: '#FF6B35', paused: '#F59E0B', completed: '#22C55E' }

function generateCurve(base: number, variance: number, points: number) {
  return Array.from({ length: points }, (_, i) => ({
    t: `${i}`,
    v: +(base + (Math.sin(i * 0.5) + Math.random() * 0.6 - 0.3) * variance).toFixed(1),
  }))
}

export default function Printing() {
  const [tab, setTab] = useState<typeof TABS[number]>('打印队列')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { printJobs, orders, updatePrintJob, supportRemovals, addSupportRemoval } = useStore()

  const orderMap = useMemo(() => Object.fromEntries(orders.map(o => [o.id, o])), [orders])
  const supportMap = useMemo(() => Object.fromEntries(supportRemovals.map(s => [s.orderId, s])), [supportRemovals])
  const selected = printJobs.find(j => j.id === selectedId)

  const grouped = useMemo(() => {
    const g: Record<string, typeof printJobs> = { queued: [], printing: [], completed: [] }
    printJobs.forEach(j => {
      if (j.status === 'paused') {
        g.printing.push(j)
      } else if (g[j.status]) {
        g[j.status].push(j)
      }
    })
    return g
  }, [printJobs])

  const handleAction = (id: string, action: 'printing' | 'paused' | 'completed') => {
    const now = new Date().toISOString()
    if (action === 'printing') {
      updatePrintJob(id, { status: 'printing', startedAt: now })
    } else {
      updatePrintJob(id, { status: action })
    }
  }

  const handleCreateSupportRemoval = (job: typeof printJobs[number]) => {
    if (supportMap[job.orderId]) {
      alert('该订单已有支撑去除任务')
      return
    }
    addSupportRemoval({
      orderId: job.orderId,
      removalMethod: 'wire-cut',
      status: 'pending',
      operator: '',
      startedAt: '',
      completedAt: '',
    })
    alert('已生成支撑去除任务，请前往「支撑去除」页面查看')
  }

  const powerData = useMemo(() => generateCurve(285, 8, 20), [selectedId])
  const layerData = useMemo(() => generateCurve(0.03, 0.005, 20), [selectedId])

  if (tab === '实时监控' && selected) {
    const order = orderMap[selected.orderId]
    const hasSupport = supportMap[selected.orderId]

    return (
      <div className="page">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => { setTab('打印队列'); setSelectedId(null) }} className="btn-secondary" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowLeft size={14} /> 返回队列
            </button>
            <h1 style={{ margin: 0 }}>实时监控</h1>
            <span className="font-display" style={{ color: '#4A90D9', fontSize: 16 }}>{selected.id}</span>
            <span className="status-badge" style={{ background: statusColor[selected.status] + '22', color: statusColor[selected.status] }}>
              {statusLabel[selected.status]}
            </span>
          </div>
        </div>

        {/* 订单信息条 */}
        {order && (
          <div className="card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13 }}>
              <span>订单: <b style={{ color: '#4A90D9' }}>{order.id}</b></span>
              <span>材料: <b style={{ color: '#C0A062' }}>{order.material}</b></span>
              <span>客户: <b>{order.customerName}</b></span>
              <span>当前工序: <span className={`status-badge ${statusColors[order.status]}`}>{statusLabels[order.status]}</span></span>
            </div>
            {selected.status === 'completed' && !hasSupport && (
              <button className="btn-primary" onClick={() => handleCreateSupportRemoval(selected)} style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Scissors size={14} /> 生成支撑去除任务
              </button>
            )}
            {selected.status === 'completed' && hasSupport && (
              <span className="status-badge" style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>
                <CheckCircle size={12} style={{ marginRight: 4 }} /> 支撑任务已生成
              </span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
            {[
              { icon: <Activity size={18}/>, label: '当前层', value: `${selected.currentLayer}/${selected.totalLayers}`, sub: <div style={{ height: 4, background: '#333', borderRadius: 2, marginTop: 6 }}><div style={{ height: '100%', width: `${(selected.currentLayer / selected.totalLayers) * 100}%`, background: '#FF6B35', borderRadius: 2 }}/></div> },
              { icon: <Printer size={18}/>, label: '激光功率', value: `${selected.laserPower}W`, sub: <span style={{ fontSize: 12, color: '#9CA3AF' }}>目标 285W</span> },
              { icon: <Thermometer size={18}/>, label: '腔体温度', value: `${selected.chamberTemp ?? '--'}°C`, sub: null },
              { icon: <Wind size={18}/>, label: '氧含量', value: `${selected.oxygenLevel ?? '--'}%`, sub: null },
            ].map((m, i) => (
              <div key={i} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9CA3AF', marginBottom: 8 }}>{m.icon}{m.label}</div>
                <div className="font-display" style={{ fontSize: 28, color: '#FF6B35' }}>{m.value}</div>
                {m.sub}
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ marginBottom: 8 }}>激光功率曲线</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={powerData}><CartesianGrid strokeDasharray="3 3" stroke="#333"/><XAxis dataKey="t" stroke="#666" tick={{ fontSize: 11 }}/><YAxis domain={[270, 300]} stroke="#666" tick={{ fontSize: 11 }}/><Tooltip/><Line type="monotone" dataKey="v" stroke="#FF6B35" strokeWidth={2} dot={false}/></LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ marginBottom: 8 }}>层厚趋势</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={layerData}><CartesianGrid strokeDasharray="3 3" stroke="#333"/><XAxis dataKey="t" stroke="#666" tick={{ fontSize: 11 }}/><YAxis stroke="#666" tick={{ fontSize: 11 }}/><Tooltip/><Line type="monotone" dataKey="v" stroke="#FF6B35" strokeWidth={2} dot={false}/></LineChart>
            </ResponsiveContainer>
          </div>

          {/* 操作按钮 */}
          <div className="card" style={{ padding: 16, display: 'flex', justifyContent: 'center', gap: 12 }}>
            {selected.status === 'queued' && <button className="btn-primary" onClick={() => handleAction(selected.id, 'printing')}><Play size={14}/> 启动打印</button>}
            {selected.status === 'printing' && <button className="btn-secondary" onClick={() => handleAction(selected.id, 'paused')}><Pause size={14}/> 暂停</button>}
            {selected.status === 'paused' && <button className="btn-primary" onClick={() => handleAction(selected.id, 'printing')}><Play size={14}/> 继续打印</button>}
            {(selected.status === 'printing' || selected.status === 'paused') && (
              <button className="btn-primary" onClick={() => handleAction(selected.id, 'completed')} style={{ background: '#22C55E' }}>
                <CheckCircle size={14}/> 标记完成
              </button>
            )}
            {selected.status === 'completed' && !hasSupport && (
              <button className="btn-primary" onClick={() => handleCreateSupportRemoval(selected)}>
                <Scissors size={14}/> 生成支撑去除任务
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>打印作业</h1>
        <div className="tabs">
          {TABS.map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
      </div>

      {tab === '打印队列' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, flex: 1, overflow: 'auto' }}>
          {COLUMNS.map(col => (
            <div key={col.key} className="card" style={{ borderTop: `3px solid ${col.color}`, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ color: col.color, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {col.label}
                <span className="font-display" style={{ fontSize: 20, color: col.color }}>{grouped[col.key].length}</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
                {grouped[col.key].map(job => {
                  const order = orderMap[job.orderId]
                  const isPaused = job.status === 'paused'
                  const hasSupport = supportMap[job.orderId]
                  return (
                    <div key={job.id} className="card" style={{ cursor: 'pointer', padding: 12, border: isPaused ? '1px dashed #F59E0B' : undefined }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, color: '#4A90D9' }}>{order?.id ?? job.orderId}</span>
                        <span className="status-badge" style={{ background: statusColor[job.status] + '22', color: statusColor[job.status] }}>{statusLabel[job.status]}</span>
                      </div>
                      {order && (
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>
                          {order.customerName} · 工序: <span className={`status-badge ${statusColors[order.status]}`} style={{ padding: '1px 6px' }}>{statusLabels[order.status]}</span>
                        </div>
                      )}
                      <div style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.8 }}>
                        <div>材料: {order?.material ?? '-'}</div>
                        <div>激光功率: {job.laserPower}W</div>
                        <div>层厚: {job.layerThickness}μm</div>
                        <div>扫描策略: {job.scanStrategy}</div>
                        {job.totalLayers > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <div style={{ flex: 1, height: 4, background: '#333', borderRadius: 2 }}>
                              <div style={{ width: `${(job.currentLayer / job.totalLayers) * 100}%`, height: '100%', background: isPaused ? '#F59E0B' : '#FF6B35', borderRadius: 2 }}/>
                            </div>
                            <span style={{ fontSize: 11, color: '#666', fontFamily: 'Rajdhani, sans-serif' }}>{Math.round(job.currentLayer / job.totalLayers * 100)}%</span>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                        {job.status === 'queued' && <button className="btn-primary" onClick={e => { e.stopPropagation(); handleAction(job.id, 'printing') }}><Play size={12}/> 启动</button>}
                        {job.status === 'printing' && <button className="btn-secondary" onClick={e => { e.stopPropagation(); handleAction(job.id, 'paused') }}><Pause size={12}/> 暂停</button>}
                        {job.status === 'paused' && <button className="btn-primary" onClick={e => { e.stopPropagation(); handleAction(job.id, 'printing') }}><Play size={12}/> 继续</button>}
                        {(job.status === 'printing' || job.status === 'paused') && <button className="btn-primary" onClick={e => { e.stopPropagation(); handleAction(job.id, 'completed') }} style={{ background: '#22C55E' }}><CheckCircle size={12}/> 完成</button>}
                        {job.status === 'completed' && !hasSupport && <button className="btn-primary" onClick={e => { e.stopPropagation(); handleCreateSupportRemoval(job) }} style={{ background: '#4A90D9' }}><Scissors size={12}/> 生成支撑任务</button>}
                        {job.status === 'completed' && hasSupport && <span className="status-badge" style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55e' }}><CheckCircle size={10}/> 已生成支撑任务</span>}
                      </div>
                      <button onClick={() => { setSelectedId(job.id); setTab('实时监控') }} style={{ width: '100%', marginTop: 8, padding: '4px', fontSize: 12, color: '#FF6B35', background: 'transparent', border: '1px dashed #FF6B3544', borderRadius: 4, cursor: 'pointer' }}>
                        查看监控详情 →
                      </button>
                    </div>
                  )
                })}
                {grouped[col.key].length === 0 && (
                  <div style={{ textAlign: 'center', color: '#444', padding: 30, fontSize: 12 }}>暂无{col.label}任务</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: 48, textAlign: 'center', color: '#6B7280' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>请从打印队列中选择一个作业进行监控</p>
        </div>
      )}
    </div>
  )
}
