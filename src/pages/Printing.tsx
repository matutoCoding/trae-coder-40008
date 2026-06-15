import { useState, useMemo, useEffect } from 'react'
import { useStore } from '@/store'
import { Printer, Activity, Thermometer, Wind, Play, Pause, CheckCircle, Scissors, ArrowLeft, AlertCircle, Package, Plus, X, RotateCcw, ArrowRight } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { statusLabels, statusColors } from '@/store'
import type { PrintJob, PostProcess } from '@/store'

const TABS = ['打印队列', '实时监控'] as const
const COLUMNS = [
  { key: 'queued', label: '待打印', color: '#6B7280' },
  { key: 'printing', label: '打印中', color: '#FF6B35' },
  { key: 'completed', label: '已完成', color: '#22C55E' },
] as const

const statusLabel: Record<string, string> = { queued: '待打印', printing: '打印中', paused: '已暂停', completed: '已完成' }
const statusColor: Record<string, string> = { queued: '#6B7280', printing: '#FF6B35', paused: '#F59E0B', completed: '#22C55E' }

const SCAN_STRATEGIES = ['条纹扫描', '棋盘扫描', '分区扫描', '螺旋扫描']

const MODAL_INPUT: React.CSSProperties = { background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', color: '#e5e7eb', fontSize: 13, width: '100%', outline: 'none' }
const MODAL_LABEL: React.CSSProperties = { fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block' }

function generateCurve(base: number, variance: number, points: number) {
  return Array.from({ length: points }, (_, i) => ({
    t: `${i}`,
    v: +(base + (Math.sin(i * 0.5) + Math.random() * 0.6 - 0.3) * variance).toFixed(1),
  }))
}

interface PrintJobForm {
  orderId: string
  laserPower: number
  scanSpeed: number
  layerThickness: number
  scanStrategy: string
  totalLayers: number
  isRework: boolean
  reworkSourcePostProcessId?: string
}

const EMPTY_FORM: PrintJobForm = {
  orderId: '',
  laserPower: 285,
  scanSpeed: 1200,
  layerThickness: 30,
  scanStrategy: '条纹扫描',
  totalLayers: 1000,
  isRework: false,
}

export default function Printing() {
  const [tab, setTab] = useState<typeof TABS[number]>('打印队列')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const {
    printJobs, orders, updatePrintJob, supportRemovals, addSupportRemoval,
    addPrintJob, selectedOrderId, clearSelectedOrderId, postProcesses
  } = useStore()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [form, setForm] = useState<PrintJobForm>({ ...EMPTY_FORM })
  const [highlightOrderId, setHighlightOrderId] = useState<string | null>(null)
  const [highlightReworkSourceId, setHighlightReworkSourceId] = useState<string | null>(null)

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

  useEffect(() => {
    if (!selectedOrderId) return

    const matchingJobs = printJobs.filter(j => j.orderId === selectedOrderId)

    if (matchingJobs.length > 0) {
      const reworkJob = matchingJobs.find(j => j.isRework)
      if (reworkJob?.reworkSourcePostProcessId) {
        setHighlightReworkSourceId(reworkJob.reworkSourcePostProcessId)
      }
      setHighlightOrderId(selectedOrderId)
    } else {
      setForm({ ...EMPTY_FORM, orderId: selectedOrderId })
      setShowCreateModal(true)
    }

    clearSelectedOrderId()
  }, [selectedOrderId])

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

  const openCreateModal = () => {
    setForm({ ...EMPTY_FORM })
    setShowCreateModal(true)
  }

  const handleCreatePrintJob = () => {
    if (!form.orderId) {
      alert('请选择关联订单')
      return
    }
    if (form.totalLayers <= 0) {
      alert('总层数必须大于0')
      return
    }

    const jobData: Omit<PrintJob, 'id' | 'currentLayer' | 'startedAt'> = {
      orderId: form.orderId,
      laserPower: form.laserPower,
      scanSpeed: form.scanSpeed,
      layerThickness: form.layerThickness,
      scanStrategy: form.scanStrategy,
      status: 'queued',
      totalLayers: form.totalLayers,
      chamberTemp: 25,
      oxygenLevel: 0.0,
      ...(form.isRework ? { isRework: true, reworkSourcePostProcessId: form.reworkSourcePostProcessId } : {}),
    }

    addPrintJob(jobData)
    setShowCreateModal(false)
    setForm({ ...EMPTY_FORM })
    setHighlightOrderId(null)
    setHighlightReworkSourceId(null)
  }

  const isHighlighted = (job: typeof printJobs[number]) => {
    if (highlightOrderId && job.orderId === highlightOrderId) {
      if (!highlightReworkSourceId) return true
      if (highlightReworkSourceId && job.reworkSourcePostProcessId === highlightReworkSourceId) return true
    }
    if (highlightReworkSourceId && job.reworkSourcePostProcessId === highlightReworkSourceId) return true
    return false
  }

  const getReworkSource = (job: typeof printJobs[number]) => {
    if (!job.reworkSourcePostProcessId) return null
    return postProcesses.find((p: PostProcess) => p.id === job.reworkSourcePostProcessId)
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
            {selected.isRework && (
              <span className="status-badge" style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308', display: 'flex', alignItems: 'center', gap: 4 }}>
                <RotateCcw size={12} /> 返工
              </span>
            )}
          </div>
        </div>

        {selected.isRework && (
          <div className="card" style={{ padding: '10px 16px', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <RotateCcw size={16} style={{ color: '#eab308', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#e5e7eb' }}>
              返工来源：
              {getReworkSource(selected) ? (
                <>
                  <span style={{ fontWeight: 600, color: '#eab308' }}>后处理单 #{getReworkSource(selected)?.id}</span>
                  <ArrowRight size={12} style={{ display: 'inline-block', margin: '0 6px', color: '#64748b' }} />
                  <span style={{ color: '#94a3b8' }}>处理人：</span>
                  <b>{getReworkSource(selected)?.operator || '—'}</b>
                </>
              ) : (
                <span style={{ color: '#94a3b8' }}>未找到来源记录</span>
              )}
            </span>
          </div>
        )}

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ margin: 0 }}>打印作业</h1>
          <button
            onClick={openCreateModal}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FF6B35' }}
          >
            <Plus size={16} /> 创建打印任务
          </button>
        </div>
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
                  const highlighted = isHighlighted(job)
                  const reworkSource = getReworkSource(job)

                  const cardStyle: React.CSSProperties = {
                    cursor: 'pointer',
                    padding: 12,
                    border: isPaused ? '1px dashed #F59E0B' : highlighted ? '2px solid #FF6B35' : undefined,
                    boxShadow: highlighted ? '0 0 0 3px rgba(255,107,53,0.2), 0 0 20px rgba(255,107,53,0.15)' : undefined,
                    transition: 'all 0.2s ease',
                  }

                  return (
                    <div key={job.id} className="card" style={cardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, color: '#4A90D9' }}>{order?.id ?? job.orderId}</span>
                          {job.isRework && (
                            <span className="status-badge" style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10 }}>
                              <RotateCcw size={10} /> 返工
                            </span>
                          )}
                        </div>
                        <span className="status-badge" style={{ background: statusColor[job.status] + '22', color: statusColor[job.status] }}>{statusLabel[job.status]}</span>
                      </div>
                      {job.isRework && reworkSource && (
                        <div style={{ fontSize: 11, color: '#eab308', marginBottom: 6, padding: '3px 8px', background: 'rgba(234,179,8,0.08)', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ArrowRight size={10} /> 来源: 后处理 #{reworkSource.id} · {reworkSource.operator || '未知操作员'}
                        </div>
                      )}
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

      {showCreateModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="card"
            style={{
              width: 520, maxWidth: '90vw', maxHeight: '85vh', overflow: 'auto',
              padding: 24, position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Printer size={22} style={{ color: '#FF6B35' }} />
                <h2 style={{ margin: 0, fontSize: 18 }}>创建打印作业</h2>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setForm({ ...EMPTY_FORM }) }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#666', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {form.orderId && orderMap[form.orderId] && (
              <div style={{ padding: '10px 14px', background: 'rgba(74,144,217,0.08)', border: '1px solid rgba(74,144,217,0.2)', borderRadius: 6, marginBottom: 16, fontSize: 13, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ color: '#94a3b8' }}>订单号：<b style={{ color: '#4A90D9' }}>{form.orderId}</b></span>
                <span style={{ color: '#94a3b8' }}>客户：<b style={{ color: '#e5e7eb' }}>{orderMap[form.orderId].customerName}</b></span>
                <span style={{ color: '#94a3b8' }}>材料：<b style={{ color: '#C0A062' }}>{orderMap[form.orderId].material}</b></span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={MODAL_LABEL}>关联订单</label>
                <select
                  value={form.orderId}
                  onChange={e => setForm(f => ({ ...f, orderId: e.target.value }))}
                  style={MODAL_INPUT}
                >
                  <option value="">请选择订单</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.id} - {o.customerName} ({o.material})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={MODAL_LABEL}>激光功率 (W)</label>
                  <input
                    type="number"
                    value={form.laserPower}
                    onChange={e => setForm(f => ({ ...f, laserPower: +e.target.value }))}
                    style={MODAL_INPUT}
                  />
                </div>
                <div>
                  <label style={MODAL_LABEL}>扫描速度 (mm/s)</label>
                  <input
                    type="number"
                    value={form.scanSpeed}
                    onChange={e => setForm(f => ({ ...f, scanSpeed: +e.target.value }))}
                    style={MODAL_INPUT}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={MODAL_LABEL}>层厚 (μm)</label>
                  <input
                    type="number"
                    value={form.layerThickness}
                    onChange={e => setForm(f => ({ ...f, layerThickness: +e.target.value }))}
                    style={MODAL_INPUT}
                  />
                </div>
                <div>
                  <label style={MODAL_LABEL}>总层数</label>
                  <input
                    type="number"
                    value={form.totalLayers}
                    onChange={e => setForm(f => ({ ...f, totalLayers: +e.target.value }))}
                    style={MODAL_INPUT}
                  />
                </div>
              </div>

              <div>
                <label style={MODAL_LABEL}>扫描策略</label>
                <select
                  value={form.scanStrategy}
                  onChange={e => setForm(f => ({ ...f, scanStrategy: e.target.value }))}
                  style={MODAL_INPUT}
                >
                  {SCAN_STRATEGIES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div style={{ paddingTop: 4, borderTop: '1px solid #2D3139', display: 'flex', gap: 10, paddingBottom: 4 }}>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => { setShowCreateModal(false); setForm({ ...EMPTY_FORM }) }}
                    className="btn-secondary"
                    style={{ padding: '8px 20px' }}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleCreatePrintJob}
                    className="btn-primary"
                    style={{ padding: '8px 20px', background: '#FF6B35', fontWeight: 600 }}
                  >
                    <Plus size={14} /> 创建打印作业
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
