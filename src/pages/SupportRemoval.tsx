import { useState, useEffect } from 'react'
import { useStore } from '@/store'
import { Scissors, Droplets, Wrench, ChevronDown, Plus, X, AlertTriangle } from 'lucide-react'

const methodConfig = {
  'wire-cut': { icon: <Scissors size={22} />, label: '线切割', desc: '高精度电火花线切割，适合复杂支撑结构' },
  'acid': { icon: <Droplets size={22} />, label: '酸溶', desc: '化学溶解支撑，适合内腔复杂区域' },
  'manual': { icon: <Wrench size={22} />, label: '手工', desc: '钳工手工去除，适合简单外露支撑' },
}
const statusSteps = ['pending', 'in-progress', 'completed'] as const
const statusLabel: Record<string, string> = { pending: '待处理', 'in-progress': '进行中', completed: '已完成' }

const nowDateTimeLocal = () => {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}

const formatDateTime = (iso: string) => {
  if (!iso) return '-'
  try {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return iso
  }
}

export default function SupportRemoval() {
  const {
    supportRemovals,
    orders,
    selectedOrderId,
    updateSupportRemoval,
    addSupportRemoval,
    clearSelectedOrderId,
    postProcesses,
  } = useStore()

  const [selectedId, setSelectedId] = useState<string>('')
  const [method, setMethod] = useState<string>('wire-cut')
  const [operator, setOperator] = useState('')

  const [showCreatePanel, setShowCreatePanel] = useState(false)
  const [showManualCreate, setShowManualCreate] = useState(false)

  const [newMethod, setNewMethod] = useState<'wire-cut' | 'acid' | 'manual'>('wire-cut')
  const [newOperator, setNewOperator] = useState('')
  const [newStartedAt, setNewStartedAt] = useState(nowDateTimeLocal())
  const [newOrderId, setNewOrderId] = useState('')

  useEffect(() => {
    if (selectedOrderId) {
      const existing = supportRemovals.find(r => r.orderId === selectedOrderId)
      if (existing) {
        setSelectedId(existing.id)
        setMethod(existing.removalMethod)
        setOperator(existing.operator)
      } else {
        setNewOrderId(selectedOrderId)
        setShowCreatePanel(true)
      }
    } else if (supportRemovals.length > 0 && !selectedId) {
      setSelectedId(supportRemovals[0].id)
      setMethod(supportRemovals[0].removalMethod)
      setOperator(supportRemovals[0].operator)
    }
  }, [selectedOrderId, supportRemovals])

  useEffect(() => {
    if (selectedId) {
      const removal = supportRemovals.find(r => r.id === selectedId)
      if (removal) {
        setMethod(removal.removalMethod)
        setOperator(removal.operator)
      }
    }
  }, [selectedId, supportRemovals])

  const removal = supportRemovals.find(r => r.id === selectedId)
  const order = orders.find(o => o.id === removal?.orderId)
  const stepIdx = statusSteps.indexOf(removal?.status ?? 'pending')

  const handleStart = () => {
    if (!removal) return
    updateSupportRemoval(removal.id, { status: 'in-progress', removalMethod: method as any, operator, startedAt: new Date().toLocaleString('zh-CN') })
  }
  const handleComplete = () => {
    if (!removal) return
    updateSupportRemoval(removal.id, { status: 'completed', completedAt: new Date().toLocaleString('zh-CN') })
  }

  const handleCreateTask = () => {
    if (!newOrderId || !newOperator) return
    addSupportRemoval({
      orderId: newOrderId,
      removalMethod: newMethod,
      status: 'pending',
      operator: newOperator,
      startedAt: formatDateTime(newStartedAt.replace('T', ' ')),
      completedAt: '',
    })
    resetCreateForm()
    if (selectedOrderId) {
      clearSelectedOrderId()
    }
  }

  const handleManualCreate = () => {
    if (!newOrderId || !newOperator) return
    addSupportRemoval({
      orderId: newOrderId,
      removalMethod: newMethod,
      status: 'pending',
      operator: newOperator,
      startedAt: formatDateTime(newStartedAt.replace('T', ' ')),
      completedAt: '',
    })
    resetCreateForm()
    setShowManualCreate(false)
  }

  const resetCreateForm = () => {
    setNewMethod('wire-cut')
    setNewOperator('')
    setNewStartedAt(nowDateTimeLocal())
    setNewOrderId('')
    setShowCreatePanel(false)
  }

  const openManualCreate = () => {
    setNewMethod('wire-cut')
    setNewOperator('')
    setNewStartedAt(nowDateTimeLocal())
    setNewOrderId('')
    setShowManualCreate(true)
  }

  const getReworkSource = (postProcessId?: string) => {
    if (!postProcessId) return null
    return postProcesses.find(p => p.id === postProcessId)
  }

  const ordersWithoutTask = orders.filter(o => !supportRemovals.some(s => s.orderId === o.id))

  const renderCreateForm = (onSubmit: () => void, showOrderSelect: boolean) => (
    <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FF6B3520', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={20} color="#FF6B35" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#e5e7eb' }}>创建支撑去除任务</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              {newOrderId ? `关联订单: ${orders.find(o => o.id === newOrderId)?.id ?? newOrderId}` : '请选择关联订单'}
            </div>
          </div>
        </div>
        {(showCreatePanel || showManualCreate) && (
          <button onClick={resetCreateForm} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6 }}>
            <X size={18} color="#6b7280" />
          </button>
        )}
      </div>

      {showOrderSelect && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb', marginBottom: 8 }}>选择订单</div>
          <div style={{ position: 'relative' }}>
            <select
              className="input-field"
              value={newOrderId}
              onChange={e => setNewOrderId(e.target.value)}
              style={{ fontSize: 13, padding: '10px 12px', appearance: 'none', paddingRight: 40 }}
            >
              <option value="">-- 请选择订单 --</option>
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.id} · {o.customerName} · {o.material}
                </option>
              ))}
            </select>
            <ChevronDown size={16} color="#6b7280" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        </div>
      )}

      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb', marginBottom: 8 }}>去除方式</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {Object.entries(methodConfig).map(([key, cfg]) => (
            <div
              key={key}
              onClick={() => setNewMethod(key as any)}
              style={{
                background: newMethod === key ? '#FF6B3515' : '#16181D',
                border: `1px solid ${newMethod === key ? '#FF6B35' : '#2D3139'}`,
                borderRadius: 8,
                padding: '12px 8px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              <span style={{ color: newMethod === key ? '#FF6B35' : '#6b7280' }}>{cfg.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: newMethod === key ? '#FF6B35' : '#e5e7eb' }}>{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb', marginBottom: 6 }}>操作人</div>
          <input
            className="input-field"
            value={newOperator}
            onChange={e => setNewOperator(e.target.value)}
            placeholder="输入操作人姓名"
            style={{ fontSize: 13, padding: '10px 12px' }}
          />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb', marginBottom: 6 }}>开始时间</div>
          <input
            type="datetime-local"
            className="input-field"
            value={newStartedAt}
            onChange={e => setNewStartedAt(e.target.value)}
            style={{ fontSize: 13, padding: '8px 12px', colorScheme: 'dark' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          className="btn-primary"
          onClick={onSubmit}
          disabled={!newOrderId || !newOperator}
          style={{
            flex: 1,
            padding: '10px 0',
            fontSize: 13,
            opacity: !newOrderId || !newOperator ? 0.5 : 1,
            cursor: !newOrderId || !newOperator ? 'not-allowed' : 'pointer',
          }}
        >
          创建任务
        </button>
        {(showCreatePanel || showManualCreate) && (
          <button
            onClick={showManualCreate ? () => setShowManualCreate(false) : resetCreateForm}
            style={{
              padding: '10px 20px',
              fontSize: 13,
              borderRadius: 8,
              border: '1px solid #2D3139',
              background: '#16181D',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            取消
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1>支撑去除</h1>
        <button
          className="btn-primary"
          onClick={openManualCreate}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13 }}
        >
          <Plus size={16} />
          手动创建任务
        </button>
      </div>

      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
        <div className="card" style={{ width: 280, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #2D3139', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>任务列表</div>
            <span style={{ fontSize: 11, color: '#6b7280', background: '#16181D', padding: '2px 8px', borderRadius: 10 }}>
              {supportRemovals.length} 项
            </span>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {supportRemovals.map(r => {
              const o = orders.find(x => x.id === r.orderId)
              const isHighlight = selectedOrderId === r.orderId
              const reworkSource = getReworkSource(r.reworkSourcePostProcessId)
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: selectedId === r.id ? '#FF6B3510' : '#16181D',
                    border: `2px solid ${isHighlight ? '#FF6B35' : selectedId === r.id ? '#FF6B3560' : 'transparent'}`,
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>{r.id}</span>
                    {r.isRework && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: '#ef444420',
                          color: '#ef4444',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <AlertTriangle size={10} />
                        返工
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>
                    订单: <span style={{ color: '#94a3b8' }}>{r.orderId}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>
                    客户: <span style={{ color: '#94a3b8' }}>{o?.customerName ?? '-'}</span>
                  </div>
                  {r.isRework && reworkSource && (
                    <div style={{ fontSize: 10, color: '#ef4444', marginTop: 2 }}>
                      来源: 后处理 {reworkSource.id}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>{methodConfig[r.removalMethod]?.label}</span>
                    <span
                      className="status-badge"
                      style={{
                        background: r.status === 'completed' ? 'rgba(34,197,94,0.15)' : r.status === 'in-progress' ? 'rgba(255,107,53,0.15)' : 'rgba(107,114,128,0.15)',
                        color: r.status === 'completed' ? '#22c55e' : r.status === 'in-progress' ? '#FF6B35' : '#6b7280',
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontWeight: 600,
                      }}
                    >
                      {statusLabel[r.status]}
                    </span>
                  </div>
                </div>
              )
            })}
            {supportRemovals.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: '#6b7280', fontSize: 12 }}>
                暂无任务
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {showCreatePanel && !selectedId && renderCreateForm(handleCreateTask, false)}

          {showManualCreate && renderCreateForm(handleManualCreate, true)}

          {removal && (
            <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
              <div className="card" style={{ flex: 2, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                <div style={{ flex: 1, background: '#0f172a', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'linear-gradient(rgba(51,65,85,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(51,65,85,0.3) 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
                  <svg width="180" height="180" viewBox="0 0 180 180">
                    <rect x="30" y="60" width="100" height="80" fill="none" stroke="#4A90D9" strokeWidth="1" opacity="0.3" />
                    <line x1="30" y1="60" x2="60" y2="30" stroke="#4A90D9" strokeWidth="1" opacity="0.3" />
                    <line x1="130" y1="60" x2="60" y2="30" stroke="#4A90D9" strokeWidth="1" opacity="0.3" />
                    <line x1="130" y1="60" x2="160" y2="30" stroke="#4A90D9" strokeWidth="1" opacity="0.3" />
                    <line x1="130" y1="140" x2="160" y2="110" stroke="#4A90D9" strokeWidth="1" opacity="0.3" />
                    <line x1="60" y1="30" x2="160" y2="30" stroke="#4A90D9" strokeWidth="1" opacity="0.3" />
                    <line x1="160" y1="30" x2="160" y2="110" stroke="#4A90D9" strokeWidth="1" opacity="0.3" />
                    <rect x="30" y="100" width="100" height="40" fill="#FF6B3544" stroke="#FF6B35" strokeWidth="1" strokeDasharray="4" />
                    <line x1="55" y1="100" x2="55" y2="60" stroke="#FF6B3544" strokeWidth="3" />
                    <line x1="105" y1="100" x2="105" y2="60" stroke="#FF6B3544" strokeWidth="3" />
                    <line x1="80" y1="100" x2="80" y2="40" stroke="#FF6B3544" strokeWidth="3" />
                  </svg>
                  <span style={{ position: 'absolute', color: '#64748b', fontSize: 13, bottom: 20 }}>3D模型 · 橙色区域为支撑结构</span>
                </div>
              </div>

              <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto', padding: 16 }}>
                <div style={{ background: '#16181D', borderRadius: 8, padding: 12, borderLeft: '3px solid #FF6B35' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>订单编号: <b style={{ color: '#e5e7eb' }}>{order?.id ?? '-'}</b></div>
                    {removal.isRework && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: '#ef444420',
                          color: '#ef4444',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <AlertTriangle size={12} />
                        返工任务
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>材料: <b style={{ color: '#e5e7eb' }}>{order?.material ?? '-'}</b></div>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>客户: <b style={{ color: '#e5e7eb' }}>{order?.customerName ?? '-'}</b></div>
                  {removal.isRework && removal.reworkSourcePostProcessId && (
                    <div style={{ fontSize: 12, color: '#ef4444', marginTop: 6, padding: '6px 10px', background: '#ef444410', borderRadius: 6 }}>
                      来源关联: 后处理任务 {removal.reworkSourcePostProcessId}
                    </div>
                  )}
                  <div style={{ marginTop: 6 }}>
                    <span className="status-badge" style={{ background: removal?.status === 'completed' ? 'rgba(34,197,94,0.15)' : removal?.status === 'in-progress' ? 'rgba(255,107,53,0.15)' : 'rgba(107,114,128,0.15)', color: removal?.status === 'completed' ? '#22c55e' : removal?.status === 'in-progress' ? '#FF6B35' : '#6b7280', fontSize: 12, padding: '2px 10px', borderRadius: 10, fontWeight: 600 }}>
                      {removal ? statusLabel[removal.status] : '-'}
                    </span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb', marginBottom: 8 }}>去除方式</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {Object.entries(methodConfig).map(([key, cfg]) => (
                      <div key={key} onClick={() => setMethod(key)} style={{ background: method === key ? '#FF6B3515' : '#16181D', border: `1px solid ${method === key ? '#FF6B35' : '#2D3139'}`, borderRadius: 8, padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s' }}>
                        <span style={{ color: method === key ? '#FF6B35' : '#6b7280' }}>{cfg.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: method === key ? '#FF6B35' : '#e5e7eb' }}>{cfg.label}</div>
                          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{cfg.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb', marginBottom: 8 }}>进度追踪</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                    {statusSteps.map((s, i) => (
                      <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: i <= stepIdx ? '#FF6B35' : '#2D3139', border: `2px solid ${i <= stepIdx ? '#FF6B35' : '#4b5563'}` }} />
                          <span style={{ fontSize: 11, color: i <= stepIdx ? '#FF6B35' : '#6b7280', marginTop: 4 }}>{statusLabel[s]}</span>
                        </div>
                        {i < 2 && <div style={{ flex: 1, height: 2, background: i < stepIdx ? '#FF6B35' : '#2D3139', margin: '0 4px', marginBottom: 18 }} />}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb', marginBottom: 6 }}>操作人员</div>
                  <input className="input-field" value={operator} onChange={e => setOperator(e.target.value)} placeholder="输入操作人员姓名" style={{ fontSize: 13, padding: '8px 12px' }} />
                </div>

                {removal.startedAt && (
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    开始时间: <span style={{ color: '#94a3b8' }}>{removal.startedAt}</span>
                  </div>
                )}
                {removal.completedAt && (
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    完成时间: <span style={{ color: '#22c55e' }}>{removal.completedAt}</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  {removal?.status !== 'completed' && (
                    removal?.status === 'pending' ? (
                      <button className="btn-primary" onClick={handleStart} style={{ flex: 1, padding: '8px 0', fontSize: 13 }}>开始去除</button>
                    ) : (
                      <button className="btn-primary" onClick={handleComplete} style={{ flex: 1, padding: '8px 0', fontSize: 13 }}>完成去除</button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {!removal && !showCreatePanel && !showManualCreate && supportRemovals.length === 0 && (
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#FF6B3510', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Scissors size={36} color="#FF6B35" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#e5e7eb' }}>暂无支撑去除任务</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>点击右上角「手动创建任务」或从 Dashboard 跳转创建</div>
              </div>
              <button
                className="btn-primary"
                onClick={openManualCreate}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', fontSize: 13 }}
              >
                <Plus size={16} />
                创建第一个任务
              </button>
            </div>
          )}

          {!removal && !showCreatePanel && !showManualCreate && supportRemovals.length > 0 && (
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ fontSize: 14, color: '#6b7280' }}>请从左侧选择一个任务查看详情</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
