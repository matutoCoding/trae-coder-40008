import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import { Wind, Sparkles, Gauge, Plus, CheckCircle, AlertTriangle, XCircle, ChevronDown, RotateCcw, Printer, ArrowRight } from 'lucide-react'
import type { DimensionCheck, PostProcess } from '@/store'

const mediaOptions = ['Al2O3 80#', 'Al2O3 120#', 'Al2O3 220#', 'SiC', '玻璃微珠']
const polishMethods = ['电解抛光', '机械抛光', '化学抛光']
const polishIcons = [Wind, Sparkles, Gauge]

const EMPTY_FORM: Omit<PostProcess, 'id'> = {
  orderId: '',
  sandblastPressure: 0,
  sandblastMedia: 'Al2O3 120#',
  sandblastDuration: 0,
  polishingMethod: '',
  targetRoughness: 0,
  actualRoughness: 0,
  qualityResult: '',
  operator: '',
  dimensions: [],
}

function RoughnessGauge({ value }: { value: number }) {
  const r = 60, cx = 80, cy = 80
  const startAngle = -225, endAngle = 45
  const range = endAngle - startAngle
  const maxRa = 6.4
  const valAngle = startAngle + (Math.min(value, maxRa) / maxRa) * range
  const rad = (a: number) => (a * Math.PI) / 180
  const pt = (a: number) => ({ x: cx + r * Math.cos(rad(a)), y: cy + r * Math.sin(rad(a)) })
  const arc = (a1: number, a2: number) => {
    const s = pt(a1), e = pt(a2), large = a2 - a1 > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
  }
  const needle = pt(valAngle)
  const color = value < 0.8 ? '#22c55e' : value <= 3.2 ? '#eab308' : '#ef4444'
  return (
    <svg width={160} height={100} viewBox="0 0 160 100">
      <path d={arc(startAngle, startAngle + range * (0.8 / maxRa))} fill="none" stroke="#22c55e" strokeWidth={10} strokeLinecap="round" opacity={0.5} />
      <path d={arc(startAngle + range * (0.8 / maxRa), startAngle + range * (3.2 / maxRa))} fill="none" stroke="#eab308" strokeWidth={10} strokeLinecap="round" opacity={0.5} />
      <path d={arc(startAngle + range * (3.2 / maxRa), endAngle)} fill="none" stroke="#ef4444" strokeWidth={10} strokeLinecap="round" opacity={0.5} />
      <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={4} fill={color} />
      <text x={cx} y={cy + 22} textAnchor="middle" fill={color} fontSize={18} fontWeight={700}>Ra {value || 0}</text>
      <text x={pt(startAngle).x} y={pt(startAngle).y + 14} fill="#64748b" fontSize={9} textAnchor="middle">0</text>
      <text x={pt(endAngle).x} y={pt(endAngle).y + 14} fill="#64748b" fontSize={9} textAnchor="middle">6.4</text>
    </svg>
  )
}

const inputStyle: React.CSSProperties = { background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '6px 10px', color: '#e5e7eb', fontSize: 13, width: '100%', outline: 'none' }
const labelStyle: React.CSSProperties = { fontSize: 12, color: '#94a3b8', marginBottom: 4 }

export default function PostProcessing() {
  const navigate = useNavigate()
  const {
    postProcesses, orders, printJobs, reworkTasks,
    addPostProcess, updatePostProcess, createReworkTask,
    selectedOrderId, setSelectedOrderId, clearSelectedOrderId
  } = useStore()

  const [selId, setSelId] = useState(postProcesses[0]?.id ?? '')
  const [selOrderId, setSelOrderId] = useState('')
  const pp = postProcesses.find(p => p.id === selId)
  const order = orders.find(o => o.id === (pp?.orderId || selOrderId))

  const [form, setForm] = useState<Omit<PostProcess, 'id'>>(() => (pp ? { ...pp, dimensions: [] } : { ...EMPTY_FORM }))
  const [dims, setDims] = useState<DimensionCheck[]>(() => pp?.dimensions ?? [])
  const [isNew, setIsNew] = useState(false)

  const [reworkType, setReworkType] = useState<'reprint' | 'reprocess'>('reprocess')
  const [reworkNote, setReworkNote] = useState('')

  useEffect(() => {
    if (selectedOrderId) {
      const existingPP = postProcesses.find(p => p.orderId === selectedOrderId)
      if (existingPP) {
        setIsNew(false)
        setSelId(existingPP.id)
      } else {
        setIsNew(true)
        setSelId('')
        setSelOrderId(selectedOrderId)
        setForm({ ...EMPTY_FORM, orderId: selectedOrderId })
        setDims([])
      }
      clearSelectedOrderId()
    }
  }, [])

  useEffect(() => {
    if (!isNew && pp) {
      setForm({ ...pp, dimensions: [] })
      setDims(pp.dimensions ?? [])
    }
  }, [selId, pp, isNew])

  const data = form

  const setFormField = (k: keyof Omit<PostProcess, 'id' | 'dimensions'>, v: any) => {
    setForm(f => ({ ...f, [k]: v }))
    if (!isNew && pp) {
      updatePostProcess(pp.id, { [k]: v })
    }
  }

  const updateDim = (i: number, k: keyof DimensionCheck, v: any) => {
    const next = [...dims]
    next[i] = { ...next[i], [k]: v }
    if (k === 'actualValue' || k === 'targetValue' || k === 'tolerance') {
      const d = next[i]
      d.result = Math.abs(Number(d.actualValue) - Number(d.targetValue)) <= Number(d.tolerance) ? 'pass' : 'fail'
    }
    setDims(next)
    if (!isNew && pp) updatePostProcess(pp.id, { dimensions: next })
  }

  const addDim = () => {
    const d: DimensionCheck = { name: '', targetValue: 0, actualValue: 0, tolerance: 0.05, result: 'pass' }
    setDims([...dims, d])
    if (!isNew && pp) updatePostProcess(pp.id, { dimensions: [...dims, d] })
  }

  const removeDim = (i: number) => {
    const next = dims.filter((_, idx) => idx !== i)
    setDims(next)
    if (!isNew && pp) updatePostProcess(pp.id, { dimensions: next })
  }

  const passCount = dims.filter(d => d.result === 'pass').length
  const failCount = dims.filter(d => d.result === 'fail').length

  const createNew = () => {
    setIsNew(true)
    setSelId('')
    setSelOrderId('')
    setForm({ ...EMPTY_FORM })
    setDims([])
  }

  const saveNew = () => {
    if (!form.orderId) {
      alert('请先选择关联订单')
      return
    }
    const newId = addPostProcess({ ...form, dimensions: dims })
    setIsNew(false)
    setSelId(newId)
  }

  const selectExisting = (id: string) => {
    setIsNew(false)
    setSelId(id)
  }

  const handleCreateRework = () => {
    if (!pp) return
    createReworkTask(pp.id, reworkType, reworkNote || undefined)
    setReworkNote('')
  }

  const jumpToPrinting = () => {
    if (order) {
      setSelectedOrderId(order.id)
      navigate('/printing')
    }
  }

  const sourcePP = pp?.reworkSourcePostProcessId
    ? postProcesses.find(p => p.id === pp.reworkSourcePostProcessId)
    : null

  const relatedReworkTask = pp
    ? reworkTasks.find(r => r.sourcePostProcessId === pp.id || (pp.isRework && r.relatedJobId && printJobs.find(pj => pj.id === r.relatedJobId)?.reworkSourcePostProcessId === pp.reworkSourcePostProcessId))
    : null

  const relatedPrintJob = pp
    ? printJobs.find(pj => pj.reworkSourcePostProcessId === pp.id || (pp.isRework && pj.reworkSourcePostProcessId === pp.reworkSourcePostProcessId))
    : null

  const isReworkActive = pp?.isRework || (pp?.qualityResult === 'rework' && !pp.reworkAction)

  const qcConfig = [
    { key: 'pass' as const, label: '合格', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', icon: <CheckCircle size={28} /> },
    { key: 'rework' as const, label: '返工', color: '#eab308', bg: 'rgba(234,179,8,0.15)', icon: <AlertTriangle size={28} /> },
    { key: 'scrap' as const, label: '报废', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: <XCircle size={28} /> },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <h1>表面后处理</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <select
              value={isNew ? '' : selId}
              onChange={e => {
                if (e.target.value === '') {
                  createNew()
                } else {
                  selectExisting(e.target.value)
                }
              }}
              style={{ ...inputStyle, appearance: 'none', paddingRight: 28, width: 320 }}
            >
              <option value="">— 新建检测单 —</option>
              {postProcesses.map(p => (
                <option key={p.id} value={p.id}>
                  {p.id} {p.isRework ? '[返工]' : ''} {p.qualityResult === 'rework' ? '[待处理]' : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {!isNew && <button onClick={createNew} className="btn-primary" style={{ background: '#334155', color: '#e5e7eb', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 13 }}>新建</button>}
            {isNew && <button onClick={saveNew} className="btn-primary" style={{ background: '#FF6B35', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>保存检测单</button>}
          </div>
        </div>
      </div>

      {isNew && (
        <div className="card" style={{ padding: '10px 14px', background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} style={{ color: '#FF6B35', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#e5e7eb' }}>正在创建<span style={{ color: '#FF6B35', fontWeight: 600 }}>新检测单</span>，所有字段均已清空。请先选择关联订单，填写完成后点击右上角「保存检测单」按钮。</span>
        </div>
      )}

      {(pp?.isRework || sourcePP) && (
        <div className="card" style={{ padding: '12px 16px', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RotateCcw size={16} style={{ color: '#eab308', flexShrink: 0 }} />
            <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 10, fontWeight: 600, background: 'rgba(234,179,8,0.15)', color: '#eab308' }}>
              {isReworkActive && pp?.qualityResult === 'rework' ? '返工中' : '返工'}
            </span>
          </div>
          {sourcePP && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#e5e7eb' }}>
              <span style={{ color: '#94a3b8' }}>返工来源：</span>
              <span style={{ fontWeight: 600, color: '#eab308' }}>#{sourcePP.id}</span>
              <ArrowRight size={12} style={{ color: '#64748b' }} />
              <span style={{ color: '#94a3b8' }}>处理人</span>
              <span style={{ fontWeight: 600 }}>{sourcePP.operator || '—'}</span>
            </div>
          )}
          {pp?.isRework && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#e5e7eb' }}>
              <span style={{ color: '#94a3b8' }}>当前处理人：</span>
              <span style={{ fontWeight: 600 }}>{pp.operator || '—'}</span>
            </div>
          )}
          {relatedReworkTask?.note && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#e5e7eb' }}>
              <span style={{ color: '#94a3b8' }}>返工说明：</span>
              <span>{relatedReworkTask.note}</span>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0, marginTop: 12 }}>
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><div style={labelStyle}>关联订单</div>
              <select value={data.orderId} onChange={e => setFormField('orderId', e.target.value)} style={inputStyle}>
                <option value="">请选择订单</option>
                {orders.map(o => <option key={o.id} value={o.id}>{o.id} - {o.modelFile}</option>)}
              </select>
            </div>
            <div><div style={labelStyle}>操作员</div><input value={data.operator} onChange={e => setFormField('operator', e.target.value)} style={inputStyle} placeholder="请输入操作员姓名" /></div>
          </div>

          {order && (
            <div style={{ padding: '8px 12px', background: 'rgba(74,144,217,0.08)', border: '1px solid rgba(74,144,217,0.2)', borderRadius: 6, fontSize: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ color: '#94a3b8' }}>客户：<b style={{ color: '#e5e7eb' }}>{order.customerName}</b></span>
              <span style={{ color: '#94a3b8' }}>材料：<b style={{ color: '#e5e7eb' }}>{order.material}</b></span>
              <span style={{ color: '#94a3b8' }}>数量：<b style={{ color: '#e5e7eb' }}>{order.quantity}</b></span>
              <span style={{ color: '#94a3b8' }}>目标表面：<b style={{ color: '#e5e7eb' }}>{order.surfaceFinish}</b></span>
            </div>
          )}

          <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb', borderBottom: '1px solid #334155', paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Wind size={16} /> 喷砂参数</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div><div style={labelStyle}>压力 (MPa)</div><input type="number" step="0.1" value={data.sandblastPressure} onChange={e => setFormField('sandblastPressure', +e.target.value)} style={inputStyle} /></div>
            <div><div style={labelStyle}>磨料类型</div>
              <select value={data.sandblastMedia} onChange={e => setFormField('sandblastMedia', e.target.value)} style={inputStyle}>
                {mediaOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div><div style={labelStyle}>时长 (min)</div><input type="number" value={data.sandblastDuration} onChange={e => setFormField('sandblastDuration', +e.target.value)} style={inputStyle} /></div>
          </div>

          <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb', borderBottom: '1px solid #334155', paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Sparkles size={16} /> 抛光方式</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {polishMethods.map((m, i) => {
              const Icon = polishIcons[i]
              const active = data.polishingMethod === m
              return <button key={m} onClick={() => setFormField('polishingMethod', m)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 12, background: active ? 'rgba(74,144,217,0.15)' : '#0f172a', border: `1px solid ${active ? '#4A90D9' : '#334155'}`, borderRadius: 8, cursor: 'pointer', color: active ? '#4A90D9' : '#94a3b8', transition: 'all 0.15s' }}>
                <Icon size={22} /><span style={{ fontSize: 13, fontWeight: 600 }}>{m}</span>
              </button>
            })}
          </div>

          <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb', borderBottom: '1px solid #334155', paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Gauge size={16} /> 表面粗糙度</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              <div><div style={labelStyle}>目标值 Ra</div><input type="number" step="0.1" value={data.targetRoughness} onChange={e => setFormField('targetRoughness', +e.target.value)} style={inputStyle} /></div>
              <div><div style={labelStyle}>实测值 Ra</div><input type="number" step="0.1" value={data.actualRoughness} onChange={e => setFormField('actualRoughness', +e.target.value)} style={inputStyle} /></div>
            </div>
            <RoughnessGauge value={data.actualRoughness} />
          </div>

          <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb', borderBottom: '1px solid #334155', paddingBottom: 8 }}>质量判定</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {qcConfig.map(q => (
              <button key={q.key} onClick={() => setFormField('qualityResult', q.key)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 14, background: data.qualityResult === q.key ? q.bg : '#0f172a', border: `1px solid ${data.qualityResult === q.key ? q.color : '#334155'}`, borderRadius: 8, cursor: 'pointer', color: data.qualityResult === q.key ? q.color : '#64748b', transition: 'all 0.15s' }}>
                {q.icon}<span style={{ fontSize: 15, fontWeight: 700 }}>{q.label}</span>
              </button>
            ))}
          </div>

          {pp && pp.qualityResult === 'rework' && !pp.reworkAction && (
            <div style={{ padding: 16, background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RotateCcw size={18} style={{ color: '#eab308', flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#eab308' }}>返工闭环处理</span>
              </div>
              <div>
                <div style={{ ...labelStyle, marginBottom: 6 }}>选择返工方式</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setReworkType('reprocess')}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14,
                      background: reworkType === 'reprocess' ? 'rgba(74,144,217,0.15)' : '#0f172a',
                      border: `1px solid ${reworkType === 'reprocess' ? '#4A90D9' : '#334155'}`,
                      borderRadius: 8, cursor: 'pointer', color: reworkType === 'reprocess' ? '#4A90D9' : '#94a3b8',
                      transition: 'all 0.15s', fontWeight: 600
                    }}
                  >
                    <Sparkles size={18} /> 重做后处理
                  </button>
                  <button
                    onClick={() => setReworkType('reprint')}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14,
                      background: reworkType === 'reprint' ? 'rgba(255,107,53,0.15)' : '#0f172a',
                      border: `1px solid ${reworkType === 'reprint' ? '#FF6B35' : '#334155'}`,
                      borderRadius: 8, cursor: 'pointer', color: reworkType === 'reprint' ? '#FF6B35' : '#94a3b8',
                      transition: 'all 0.15s', fontWeight: 600
                    }}
                  >
                    <Printer size={18} /> 重新打印
                  </button>
                </div>
              </div>
              <div>
                <div style={labelStyle}>返工说明（可选）</div>
                <textarea
                  value={reworkNote}
                  onChange={e => setReworkNote(e.target.value)}
                  placeholder="请填写返工原因、注意事项等说明..."
                  style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
                />
              </div>
              <button
                onClick={handleCreateRework}
                style={{
                  padding: '10px 16px', background: '#FF6B35', color: '#fff', border: 'none',
                  borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                <CheckCircle size={18} /> 确认创建返工任务
              </button>
            </div>
          )}

          {pp && pp.qualityResult === 'rework' && pp.reworkAction && (
            <div style={{ padding: 14, background: pp.reworkAction === 'reprint' ? 'rgba(255,107,53,0.08)' : 'rgba(74,144,217,0.08)', border: `1px solid ${pp.reworkAction === 'reprint' ? 'rgba(255,107,53,0.3)' : 'rgba(74,144,217,0.3)'}`, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {pp.reworkAction === 'reprint'
                    ? <Printer size={18} style={{ color: '#FF6B35' }} />
                    : <Sparkles size={18} style={{ color: '#4A90D9' }} />
                  }
                  <span style={{ fontSize: 13, fontWeight: 600, color: pp.reworkAction === 'reprint' ? '#FF6B35' : '#4A90D9' }}>
                    已创建{pp.reworkAction === 'reprint' ? '返工打印' : '返工后处理'}任务
                  </span>
                </div>
                {pp.reworkAction === 'reprint' && (
                  <button
                    onClick={jumpToPrinting}
                    style={{
                      padding: '6px 14px', background: '#FF6B35', color: '#fff', border: 'none',
                      borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 6
                    }}
                  >
                    跳转到打印作业 <ArrowRight size={14} />
                  </button>
                )}
              </div>
              {pp.reworkNote && (
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  说明：<span style={{ color: '#e5e7eb' }}>{pp.reworkNote}</span>
                </div>
              )}
              <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span>当前处理人：<b style={{ color: '#e5e7eb' }}>{pp.operator || '—'}</b></span>
                {relatedPrintJob && (
                  <span>打印任务：<b style={{ color: '#FF6B35' }}>#{relatedPrintJob.id}</b>（{relatedPrintJob.status === 'printing' ? '打印中' : relatedPrintJob.status === 'queued' ? '排队中' : relatedPrintJob.status === 'paused' ? '已暂停' : '已完成'}）</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb' }}>尺寸检测</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {dims.length > 0 && <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 10, fontWeight: 600, background: failCount === 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: failCount === 0 ? '#22c55e' : '#ef4444' }}>{failCount === 0 ? '全部合格' : `${failCount}项超差`}</span>}
              <button onClick={addDim} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, cursor: 'pointer', color: '#94a3b8', fontSize: 12 }}><Plus size={14} /> 添加</button>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  {['尺寸名称', '目标值', '实测值', '公差', '结果', '操作'].map(h => <th key={h} style={{ padding: '8px 6px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: 12 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {dims.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '6px' }}><input value={d.name} onChange={e => updateDim(i, 'name', e.target.value)} style={{ ...inputStyle, width: 100 }} placeholder="名称" /></td>
                    <td style={{ padding: '6px' }}><input type="number" step="0.01" value={d.targetValue} onChange={e => updateDim(i, 'targetValue', +e.target.value)} style={{ ...inputStyle, width: 80 }} /></td>
                    <td style={{ padding: '6px' }}><input type="number" step="0.01" value={d.actualValue} onChange={e => updateDim(i, 'actualValue', +e.target.value)} style={{ ...inputStyle, width: 80 }} /></td>
                    <td style={{ padding: '6px' }}><input type="number" step="0.01" value={d.tolerance} onChange={e => updateDim(i, 'tolerance', +e.target.value)} style={{ ...inputStyle, width: 60 }} /></td>
                    <td style={{ padding: '6px' }}><span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 8, fontWeight: 600, background: d.result === 'pass' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: d.result === 'pass' ? '#22c55e' : '#ef4444' }}>{d.result === 'pass' ? '合格' : '超差'}</span></td>
                    <td style={{ padding: '6px' }}>
                      <button onClick={() => removeDim(i)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>删除</button>
                    </td>
                  </tr>
                ))}
                {dims.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: '#475569', fontSize: 13 }}>暂无尺寸检测数据，点击右上角「添加」按钮开始录入</td></tr>}
              </tbody>
            </table>
          </div>
          {dims.length > 0 && (
            <div style={{ marginTop: 'auto', padding: '10px 12px', background: '#0f172a', borderRadius: 6, fontSize: 12, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
              <span>共 <b style={{ color: '#e5e7eb' }}>{dims.length}</b> 项检测</span>
              <span>合格 <b style={{ color: '#22c55e' }}>{passCount}</b> / 超差 <b style={{ color: '#EF4444' }}>{failCount}</b> / 通过率 <b style={{ color: '#C0A062' }}>{dims.length ? Math.round(passCount / dims.length * 100) : 0}%</b></span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
