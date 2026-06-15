import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import { Printer, Activity, Thermometer, Wind, Play, Pause, CheckCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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
  const { printJobs, orders, updatePrintJob } = useStore()

  const orderMap = useMemo(() => Object.fromEntries(orders.map(o => [o.id, o])), [orders])
  const selected = printJobs.find(j => j.id === selectedId)

  const grouped = useMemo(() => {
    const g: Record<string, typeof printJobs> = { queued: [], printing: [], completed: [] }
    printJobs.forEach(j => { if (g[j.status]) g[j.status].push(j) })
    return g
  }, [printJobs])

  const handleAction = (id: string, action: 'printing' | 'paused' | 'completed') => {
    updatePrintJob(id, { status: action, ...(action === 'printing' ? { startedAt: new Date().toISOString() } : {}) })
  }

  const powerData = useMemo(() => generateCurve(285, 8, 20), [selectedId])
  const layerData = useMemo(() => generateCurve(0.03, 0.005, 20), [selectedId])

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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, padding: 16 }}>
          {COLUMNS.map(col => (
            <div key={col.key} className="card" style={{ borderTop: `3px solid ${col.color}`, minHeight: 300 }}>
              <h3 style={{ color: col.color, marginBottom: 12 }}>{col.label} ({grouped[col.key].length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {grouped[col.key].map(job => {
                  const order = orderMap[job.orderId]
                  return (
                    <div key={job.id} className="card" style={{ cursor: 'pointer', padding: 12 }} onClick={() => { setSelectedId(job.id); setTab('实时监控') }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600 }}>{order?.id ?? job.orderId}</span>
                        <span className="status-badge" style={{ background: statusColor[job.status] + '22', color: statusColor[job.status] }}>{statusLabel[job.status]}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.8 }}>
                        <div>材料: {order?.material ?? '-'}</div>
                        <div>激光功率: {job.laserPower}W</div>
                        <div>层厚: {job.layerThickness}mm</div>
                        <div>扫描策略: {job.scanStrategy}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        {job.status === 'queued' && <button className="btn-primary" onClick={e => { e.stopPropagation(); handleAction(job.id, 'printing') }}><Play size={12}/> 启动打印</button>}
                        {job.status === 'printing' && <button className="btn-secondary" onClick={e => { e.stopPropagation(); handleAction(job.id, 'paused') }}><Pause size={12}/> 暂停</button>}
                        {(job.status === 'printing' || job.status === 'paused') && <button className="btn-primary" onClick={e => { e.stopPropagation(); handleAction(job.id, 'completed') }}><CheckCircle size={12}/> 完成</button>}
                        {job.status === 'paused' && <button className="btn-primary" onClick={e => { e.stopPropagation(); handleAction(job.id, 'printing') }}><Play size={12}/> 继续</button>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : selected ? (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
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
        </div>
      ) : (
        <div style={{ padding: 48, textAlign: 'center', color: '#6B7280' }}>请从打印队列中选择一个作业进行监控</div>
      )}
    </div>
  )
}
