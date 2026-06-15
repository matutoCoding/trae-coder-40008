import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import { RotateCw, ZoomIn, Scissors, Box, AlertTriangle, Info, ShieldAlert, ChevronDown, FileCheck, X, Download, Printer, CheckCircle, XCircle, RefreshCw, Undo2, Clock, MessageSquare } from 'lucide-react'
import type { ModelInspection, DefectItem } from '@/store'

const severityColor: Record<string, string> = { critical: '#EF4444', warning: '#EAB308', info: '#4A90D9' }
const severityLabel: Record<string, string> = { critical: '严重', warning: '警告', info: '提示' }
const defectIcon: Record<string, React.ReactNode> = {
  'non-manifold': <ShieldAlert size={16} />,
  'normal-flip': <AlertTriangle size={16} />,
  'thin-wall': <AlertTriangle size={16} />,
  'overlap': <Info size={16} />,
}
const defectLabel: Record<string, string> = {
  'non-manifold': '非流形边', 'normal-flip': '法线翻转', 'thin-wall': '薄壁', 'overlap': '重叠面',
}

function generateDraftInspection(orderId: string): Omit<ModelInspection, 'id'> {
  const now = new Date()
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const inspectors = ['刘工', '陈工', '王工', '张工', '李工']
  const inspector = inspectors[Math.floor(Math.random() * inspectors.length)]
  const defectTemplates: DefectItem[] = [
    { type: 'non-manifold', severity: 'critical', description: '模型存在非流形边，需要修复', count: 1 + Math.floor(Math.random() * 3) },
    { type: 'normal-flip', severity: 'info', description: '部分面法线方向不一致，已自动修正', count: 2 + Math.floor(Math.random() * 5) },
    { type: 'thin-wall', severity: 'warning', description: '局部区域壁厚偏薄，建议加厚', count: 1 + Math.floor(Math.random() * 2) },
    { type: 'overlap', severity: 'info', description: '存在重叠面，已自动合并', count: 1 + Math.floor(Math.random() * 4) },
  ]
  const defectCount = 1 + Math.floor(Math.random() * 3)
  const shuffled = [...defectTemplates].sort(() => Math.random() - 0.5)
  const defects = shuffled.slice(0, defectCount)
  const totalDefectCount = defects.reduce((sum, d) => sum + d.count, 0)
  const isPassed = !defects.some(d => d.severity === 'critical') && totalDefectCount <= 8
  return {
    orderId,
    isPassed,
    defectCount: totalDefectCount,
    defects,
    inspectedAt: dateStr,
    inspector,
    status: 'draft',
  }
}

export default function Inspection() {
  const { inspections, orders, createInspectionForOrder, confirmInspection, rejectInspection, getLatestInspectionForOrder } = useStore()
  const [selectedOrderId, setSelectedOrderId] = useState(orders[1]?.id ?? '')
  const [showReport, setShowReport] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [draftInspection, setDraftInspection] = useState<Omit<ModelInspection, 'id'> | null>(null)
  const [reportMode, setReportMode] = useState<'view' | 'draft'>('view')
  const [viewInspectionId, setViewInspectionId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const orderInspections = useMemo(() => {
    return inspections
      .filter(i => i.orderId === selectedOrderId)
      .sort((a, b) => new Date(b.inspectedAt).getTime() - new Date(a.inspectedAt).getTime())
  }, [inspections, selectedOrderId])

  const latestInspection = useMemo(() => {
    return getLatestInspectionForOrder(selectedOrderId)
  }, [getLatestInspectionForOrder, selectedOrderId])

  const hasDraft = useMemo(() => {
    return orderInspections.some(i => i.status === 'draft')
  }, [orderInspections])

  const draftInspectionFromStore = useMemo(() => {
    return orderInspections.find(i => i.status === 'draft') ?? null
  }, [orderInspections])

  const order = orders.find(o => o.id === selectedOrderId)

  const viewInspection = useMemo(() => {
    if (reportMode === 'draft') return draftInspectionFromStore ?? draftInspection
    if (viewInspectionId) {
      return orderInspections.find(i => i.id === viewInspectionId) ?? null
    }
    return latestInspection && latestInspection.status === 'confirmed' ? latestInspection : null
  }, [reportMode, draftInspectionFromStore, draftInspection, viewInspectionId, orderInspections, latestInspection])

  const handleGenerateDraft = () => {
    if (!selectedOrderId) return
    setIsGenerating(true)
    setTimeout(() => {
      createInspectionForOrder(selectedOrderId)
      setIsGenerating(false)
      setDraftInspection(null)
      setReportMode('draft')
      setViewInspectionId(null)
      setRejectNote('')
      setShowReport(true)
    }, 800)
  }

  const handleConfirmReport = () => {
    const draft = draftInspectionFromStore
    if (!draft) return
    confirmInspection(draft.id, rejectNote || undefined)
    setDraftInspection(null)
    setReportMode('view')
    setViewInspectionId(null)
    setRejectNote('')
    setShowReport(false)
  }

  const handleRegenerate = () => {
    if (!selectedOrderId) return
    setIsGenerating(true)
    setTimeout(() => {
      createInspectionForOrder(selectedOrderId)
      setIsGenerating(false)
      setDraftInspection(null)
      setReportMode('draft')
      setViewInspectionId(null)
      setRejectNote('')
      setShowReport(true)
    }, 600)
  }

  const handleReject = () => {
    const insp = latestInspection
    if (!insp) return
    if (insp.status !== 'confirmed') return
    setRejectReason('')
    setShowRejectDialog(true)
  }

  const handleConfirmReject = () => {
    const insp = latestInspection
    if (!insp) return
    rejectInspection(insp.id, rejectReason || undefined)
    setShowRejectDialog(false)
    setRejectReason('')
    setShowReport(false)
  }

  const handleRejectDraft = () => {
    setDraftInspection(null)
    setReportMode('view')
    setViewInspectionId(null)
    setRejectNote('')
    setShowReport(false)
  }

  const handleViewHistory = (inspection: ModelInspection) => {
    setViewInspectionId(inspection.id)
    setReportMode('view')
    setShowReport(true)
  }

  const handleViewLatestReport = () => {
    setViewInspectionId(null)
    setReportMode('view')
    setShowReport(true)
  }

  const handleViewDraft = () => {
    setReportMode('draft')
    setViewInspectionId(null)
    setShowReport(true)
  }

  const handlePrintReport = () => {
    window.print()
  }

  const handleDownloadReport = () => {
    if (!viewInspection || !order) return
    const lines = [
      '========== 金属3D打印模型检查报告 ==========',
      '',
      `订单编号: ${order.id}`,
      `模型文件: ${order.modelFile}`,
      `客户名称: ${order.customerName}`,
      `所属公司: ${order.company}`,
      `打印材料: ${order.material}`,
      `打印工艺: ${order.process}`,
      `表面要求: ${order.surfaceFinish}`,
      `交付日期: ${order.deliveryDate}`,
      '',
      '---------- 检查信息 ----------',
      `检查人员: ${viewInspection.inspector}`,
      `检查时间: ${viewInspection.inspectedAt}`,
      `缺陷总数: ${viewInspection.defectCount}`,
      `检查结论: ${viewInspection.isPassed ? '通过' : '未通过'}`,
      `报告状态: ${viewInspection.status === 'draft' ? '草稿（待确认）' : '已确认'}`,
      viewInspection.rejectNote ? `备注: ${viewInspection.rejectNote}` : '',
      viewInspection.rejectReason ? `退回原因: ${viewInspection.rejectReason}` : '',
      '',
      '---------- 缺陷明细 ----------',
    ]
    viewInspection.defects.forEach((d, i) => {
      lines.push(`${i + 1}. [${severityLabel[d.severity]}] ${defectLabel[d.type]} × ${d.count}`)
      lines.push(`   描述: ${d.description}`)
      lines.push('')
    })
    lines.push('===========================================')
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `模型检查报告_${order.id}_${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const confirmedInspections = orderInspections.filter(i => i.status === 'confirmed')

  return (
    <div className="page">
      <div className="page-header">
        <h1>模型检查</h1>
        <div style={{ position: 'relative' }}>
          <select
            value={selectedOrderId}
            onChange={e => { setSelectedOrderId(e.target.value); setDraftInspection(null); setReportMode('view'); setViewInspectionId(null); setRejectNote('') }}
            style={{ appearance: 'none', paddingRight: 28, color: '#e5e7eb', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '6px 28px 6px 10px', fontSize: 13 }}
          >
            {orders.map(o => <option key={o.id} value={o.id}>{o.id} - {o.modelFile}</option>)}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
        <div className="card" style={{ flex: 2, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ flex: 1, background: '#0f172a', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'linear-gradient(rgba(51,65,85,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(51,65,85,0.3) 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
            <svg width="160" height="160" viewBox="0 0 160 160" style={{ opacity: 0.25 }}>
              <rect x="30" y="50" width="100" height="80" fill="none" stroke="#4A90D9" strokeWidth="1" />
              <line x1="30" y1="50" x2="60" y2="20" stroke="#4A90D9" strokeWidth="1" />
              <line x1="130" y1="50" x2="60" y2="20" stroke="#4A90D9" strokeWidth="1" />
              <line x1="130" y1="50" x2="160" y2="20" stroke="#4A90D9" strokeWidth="1" />
              <line x1="130" y1="130" x2="160" y2="100" stroke="#4A90D9" strokeWidth="1" />
              <line x1="60" y1="20" x2="160" y2="20" stroke="#4A90D9" strokeWidth="1" />
              <line x1="160" y1="20" x2="160" y2="100" stroke="#4A90D9" strokeWidth="1" />
            </svg>
            <span style={{ position: 'absolute', color: '#475569', fontSize: 14, marginTop: 100 }}>3D模型渲染区</span>
          </div>
          <div style={{ display: 'flex', gap: 6, padding: '8px 12px', background: '#1e293b', borderTop: '1px solid #334155' }}>
            {[
              { icon: <RotateCw size={15} />, label: '旋转' },
              { icon: <ZoomIn size={15} />, label: '缩放' },
              { icon: <Scissors size={15} />, label: '剖面' },
              { icon: <Box size={15} />, label: '线框' },
            ].map(t => (
              <button key={t.label} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 12, color: '#94a3b8', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, cursor: 'pointer' }}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb' }}>缺陷检测结果</span>
            {latestInspection && latestInspection.status === 'confirmed' && (
              <span className="status-badge" style={{ background: latestInspection.isPassed ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: latestInspection.isPassed ? '#22c55e' : '#EF4444', fontSize: 12, padding: '2px 10px', borderRadius: 10, fontWeight: 600 }}>
                {latestInspection.isPassed ? '通过' : '未通过'}
              </span>
            )}
            {hasDraft && (
              <span className="status-badge" style={{ background: 'rgba(234,179,8,0.15)', color: '#EAB308', fontSize: 12, padding: '2px 10px', borderRadius: 10, fontWeight: 600 }}>
                草稿
              </span>
            )}
          </div>

          {hasDraft && (
            <div
              onClick={handleViewDraft}
              style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 6, padding: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Clock size={16} style={{ color: '#EAB308' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#EAB308' }}>当前草稿</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  {draftInspectionFromStore?.inspector} · {draftInspectionFromStore?.inspectedAt}
                </div>
              </div>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: 'rgba(234,179,8,0.2)', color: '#EAB308', fontWeight: 600 }}>
                {draftInspectionFromStore?.isPassed ? '拟通过' : '拟不通过'}
              </span>
            </div>
          )}

          {confirmedInspections.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>历史检查记录 ({confirmedInspections.length})</div>
              {confirmedInspections.map((insp, idx) => (
                <div
                  key={insp.id}
                  onClick={() => handleViewHistory(insp)}
                  style={{
                    background: idx === 0 ? 'rgba(74,144,217,0.08)' : '#1e293b',
                    border: idx === 0 ? '1px solid rgba(74,144,217,0.4)' : '1px solid #334155',
                    borderRadius: 6,
                    padding: 10,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <FileCheck size={16} style={{ color: idx === 0 ? '#4A90D9' : '#64748b' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: idx === 0 ? '#4A90D9' : '#e5e7eb' }}>
                        {idx === 0 ? '最新' : `#${confirmedInspections.length - idx}`}
                      </span>
                      <span
                        className="status-badge"
                        style={{
                          background: insp.isPassed ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                          color: insp.isPassed ? '#22c55e' : '#EF4444',
                          fontSize: 10,
                          padding: '1px 6px',
                          borderRadius: 8,
                          fontWeight: 600,
                        }}
                      >
                        {insp.isPassed ? '通过' : '未通过'}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      {insp.inspector} · {insp.inspectedAt} · 缺陷 {insp.defectCount} 项
                    </div>
                    {insp.rejectNote && (
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <MessageSquare size={10} /> {insp.rejectNote.length > 20 ? insp.rejectNote.slice(0, 20) + '...' : insp.rejectNote}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {latestInspection && latestInspection.status === 'confirmed' && !latestInspection.isPassed && confirmedInspections.length > 0 && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: 10, marginTop: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#EF4444', marginBottom: 4 }}>未通过说明</div>
              {latestInspection.rejectNote && (
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, padding: 6, background: '#16181D', borderRadius: 4 }}>
                  <span style={{ color: '#64748b' }}>备注：</span>{latestInspection.rejectNote}
                </div>
              )}
              {latestInspection.rejectReason && (
                <div style={{ fontSize: 11, color: '#94a3b8', padding: 6, background: '#16181D', borderRadius: 4 }}>
                  <span style={{ color: '#64748b' }}>退回原因：</span>{latestInspection.rejectReason}
                </div>
              )}
            </div>
          )}

          {orderInspections.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 20px' }}>
              <FileCheck size={40} style={{ color: '#475569', opacity: 0.5 }} />
              <div style={{ color: '#64748b', fontSize: 13, textAlign: 'center' }}>该订单暂无检查记录</div>
              <button
                className="btn-primary"
                onClick={handleGenerateDraft}
                disabled={isGenerating}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', fontSize: 13, marginTop: 8, opacity: isGenerating ? 0.6 : 1 }}
              >
                <RotateCw size={14} style={{ animation: isGenerating ? 'spin 1s linear infinite' : 'none' }} />
                {isGenerating ? '检查中...' : '发起模型检查'}
              </button>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {latestInspection && latestInspection.status === 'confirmed' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
              {confirmedInspections.length > 0 && confirmedInspections[0]?.defects.map((d, i) => (
                <div key={i} style={{ background: '#1e293b', borderRadius: 6, padding: 10, borderLeft: `3px solid ${severityColor[d.severity]}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ color: severityColor[d.severity] }}>{defectIcon[d.type]}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>{defectLabel[d.type]}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: severityColor[d.severity], background: `${severityColor[d.severity]}20`, padding: '1px 8px', borderRadius: 8 }}>{severityLabel[d.severity]}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>{d.description}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>数量: {d.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' }}>
        <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#94a3b8', flexWrap: 'wrap' }}>
          <span>检查员: <b style={{ color: '#e5e7eb' }}>{latestInspection?.inspector ?? (draftInspectionFromStore?.inspector) ?? '-'}</b></span>
          <span>检查时间: <b style={{ color: '#e5e7eb' }}>{latestInspection?.inspectedAt ?? (draftInspectionFromStore?.inspectedAt) ?? '-'}</b></span>
          <span>订单: <b style={{ color: '#e5e7eb' }}>{order?.modelFile ?? '-'}</b></span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {hasDraft ? (
            <>
              <button
                className="btn-secondary"
                onClick={handleRejectDraft}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: 13, color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)' }}
              >
                <X size={15} /> 取消草稿
              </button>
              <button
                className="btn-primary"
                onClick={handleViewDraft}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', fontSize: 13 }}
              >
                <CheckCircle size={15} /> 确认保存
              </button>
            </>
          ) : latestInspection && latestInspection.status === 'confirmed' ? (
            <>
              <button
                className="btn-secondary"
                onClick={handleViewLatestReport}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: 13 }}
              >
                <FileCheck size={15} /> 查看报告
              </button>
              {!latestInspection.isPassed && (
                <>
                  <button
                    className="btn-secondary"
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: 13, opacity: isGenerating ? 0.6 : 1 }}
                  >
                    <RefreshCw size={15} style={{ animation: isGenerating ? 'spin 1s linear infinite' : 'none' }} />
                    重新检查
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={handleReject}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: 13, color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)' }}
                  >
                    <Undo2 size={15} /> 退回修改
                  </button>
                </>
              )}
            </>
          ) : (
            <button
              className="btn-primary"
              onClick={handleGenerateDraft}
              disabled={isGenerating}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', fontSize: 13, opacity: isGenerating ? 0.6 : 1 }}
            >
              <RotateCw size={15} style={{ animation: isGenerating ? 'spin 1s linear infinite' : 'none' }} />
              {isGenerating ? '检查中...' : '发起模型检查'}
            </button>
          )}
        </div>
      </div>

      {showReport && viewInspection && order && (
        <div
          onClick={() => { setShowReport(false); setViewInspectionId(null); if (reportMode === 'draft') { setReportMode('view'); setRejectNote('') } }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
          className="animate-fade-in"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="card animate-slide-up"
            style={{ maxWidth: 680, width: '100%', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileCheck size={20} style={{ color: '#FF6B35' }} />
                <h2 className="font-display" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>模型检查报告</h2>
                {reportMode === 'draft' && (
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: 'rgba(234,179,8,0.2)', color: '#EAB308', fontWeight: 600 }}>草稿</span>
                )}
                {reportMode === 'view' && viewInspectionId && latestInspection && viewInspectionId !== latestInspection.id && (
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: 'rgba(100,116,139,0.2)', color: '#94a3b8', fontWeight: 600 }}>历史记录</span>
                )}
              </div>
              <button onClick={() => { setShowReport(false); setViewInspectionId(null); if (reportMode === 'draft') { setReportMode('view'); setRejectNote('') } }} style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 20, overflowY: 'auto', flex: 1, fontSize: 13, lineHeight: 1.8 }}>
              <div style={{ textAlign: 'center', paddingBottom: 16, borderBottom: '2px solid #FF6B35', marginBottom: 20 }}>
                <h3 className="font-display" style={{ fontSize: 22, color: '#FF6B35', margin: 0 }}>MetalForge Pro</h3>
                <p style={{ color: '#999', margin: '4px 0 0', fontSize: 11 }}>金属3D打印模型检查报告</p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h4 style={{ color: '#FF6B35', fontSize: 14, fontWeight: 600, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 3, height: 14, background: '#FF6B35', borderRadius: 2 }}></span>
                  订单信息
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', background: '#16181D', padding: 14, borderRadius: 8 }}>
                  <div><span style={{ color: '#666' }}>订单编号：</span><b style={{ color: '#4A90D9', fontFamily: 'Rajdhani, sans-serif' }}>{order.id}</b></div>
                  <div><span style={{ color: '#666' }}>模型文件：</span><b style={{ color: '#e5e7eb' }}>{order.modelFile}</b></div>
                  <div><span style={{ color: '#666' }}>客户名称：</span><b style={{ color: '#e5e7eb' }}>{order.customerName}</b></div>
                  <div><span style={{ color: '#666' }}>所属公司：</span><b style={{ color: '#e5e7eb' }}>{order.company}</b></div>
                  <div><span style={{ color: '#666' }}>打印材料：</span><b style={{ color: '#C0A062' }}>{order.material}</b></div>
                  <div><span style={{ color: '#666' }}>打印工艺：</span><b style={{ color: '#e5e7eb' }}>{order.process}</b></div>
                  <div><span style={{ color: '#666' }}>表面要求：</span><b style={{ color: '#e5e7eb' }}>{order.surfaceFinish}</b></div>
                  <div><span style={{ color: '#666' }}>交付日期：</span><b style={{ color: '#e5e7eb' }}>{order.deliveryDate}</b></div>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h4 style={{ color: '#FF6B35', fontSize: 14, fontWeight: 600, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 3, height: 14, background: '#FF6B35', borderRadius: 2 }}></span>
                  检查信息
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, background: '#16181D', padding: 14, borderRadius: 8 }}>
                  <div><span style={{ color: '#666', display: 'block', fontSize: 11 }}>检查人员</span><b style={{ color: '#e5e7eb', fontSize: 15 }}>{viewInspection.inspector}</b></div>
                  <div><span style={{ color: '#666', display: 'block', fontSize: 11 }}>检查时间</span><b style={{ color: '#e5e7eb', fontSize: 15 }}>{viewInspection.inspectedAt}</b></div>
                  <div><span style={{ color: '#666', display: 'block', fontSize: 11 }}>缺陷总数</span><b style={{ color: viewInspection.defectCount > 0 ? '#EF4444' : '#22C55E', fontSize: 15 }}>{viewInspection.defectCount}</b></div>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h4 style={{ color: '#FF6B35', fontSize: 14, fontWeight: 600, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 3, height: 14, background: '#FF6B35', borderRadius: 2 }}></span>
                  缺陷明细 ({viewInspection.defects.length} 项)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {viewInspection.defects.map((d, i) => (
                    <div key={i} style={{ background: '#16181D', borderRadius: 8, padding: 12, borderLeft: `4px solid ${severityColor[d.severity]}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: severityColor[d.severity] }}>{defectIcon[d.type]}</span>
                          <b style={{ color: '#e5e7eb' }}>{defectLabel[d.type]}</b>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: `${severityColor[d.severity]}22`, color: severityColor[d.severity], fontWeight: 600 }}>{severityLabel[d.severity]}</span>
                          <span style={{ fontSize: 11, color: '#666' }}>× {d.count}</span>
                        </div>
                      </div>
                      <p style={{ color: '#999', margin: 0, fontSize: 12, lineHeight: 1.6 }}>{d.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {!viewInspection.isPassed && (viewInspection.rejectNote || reportMode === 'draft') && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ color: '#FF6B35', fontSize: 14, fontWeight: 600, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 3, height: 14, background: '#FF6B35', borderRadius: 2 }}></span>
                    {reportMode === 'draft' ? '检查备注' : '未通过备注'}
                  </h4>
                  {reportMode === 'draft' ? (
                    <textarea
                      value={rejectNote}
                      onChange={e => setRejectNote(e.target.value)}
                      placeholder="请输入备注信息（可选），例如未通过的详细说明或需要客户配合的事项..."
                      style={{
                        width: '100%',
                        minHeight: 80,
                        padding: 12,
                        background: '#16181D',
                        border: '1px solid #334155',
                        borderRadius: 8,
                        color: '#e5e7eb',
                        fontSize: 13,
                        resize: 'vertical',
                        fontFamily: 'inherit',
                      }}
                    />
                  ) : (
                    <div style={{ background: '#16181D', borderRadius: 8, padding: 14, fontSize: 13, color: '#94a3b8' }}>
                      {viewInspection.rejectNote || '（无备注）'}
                    </div>
                  )}
                </div>
              )}

              {viewInspection.isPassed && reportMode === 'draft' && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ color: '#FF6B35', fontSize: 14, fontWeight: 600, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 3, height: 14, background: '#FF6B35', borderRadius: 2 }}></span>
                    检查备注
                  </h4>
                  <textarea
                    value={rejectNote}
                    onChange={e => setRejectNote(e.target.value)}
                    placeholder="请输入备注信息（可选）..."
                    style={{
                      width: '100%',
                      minHeight: 80,
                      padding: 12,
                      background: '#16181D',
                      border: '1px solid #334155',
                      borderRadius: 8,
                      color: '#e5e7eb',
                      fontSize: 13,
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              )}

              {viewInspection.rejectReason && reportMode === 'view' && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ color: '#FF6B35', fontSize: 14, fontWeight: 600, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 3, height: 14, background: '#FF6B35', borderRadius: 2 }}></span>
                    退回原因
                  </h4>
                  <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: 14, fontSize: 13, color: '#e5e7eb' }}>
                    {viewInspection.rejectReason}
                  </div>
                </div>
              )}

              <div style={{ background: viewInspection.isPassed ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', borderRadius: 8, padding: 16, border: `1px solid ${viewInspection.isPassed ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>综合判定结论</div>
                <div className="font-display" style={{ fontSize: 28, fontWeight: 700, color: viewInspection.isPassed ? '#22C55E' : '#EF4444', letterSpacing: 2 }}>
                  {viewInspection.isPassed ? '✓ 检查通过' : '✗ 检查未通过'}
                </div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 8 }}>
                  {viewInspection.isPassed
                    ? '模型符合打印要求，可进入材料备料工序'
                    : '模型存在需要修复的缺陷，请联系客户确认后重新检查'}
                </div>
                {reportMode === 'draft' && (
                  <div style={{ fontSize: 11, color: '#EAB308', marginTop: 8 }}>
                    ⚠ 此为草稿报告，确认后将正式生效并推进生产流程
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '14px 20px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-secondary" onClick={handleDownloadReport} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Download size={14} /> 下载报告
                </button>
                <button className="btn-secondary" onClick={handlePrintReport} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Printer size={14} /> 打印
                </button>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {reportMode === 'draft' ? (
                  <>
                    <button className="btn-secondary" onClick={handleRejectDraft} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <X size={14} /> 取消草稿
                    </button>
                    <button className="btn-primary" onClick={handleConfirmReport} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={14} /> 确认保存
                    </button>
                  </>
                ) : (
                  <button className="btn-primary" onClick={() => { setShowReport(false); setViewInspectionId(null) }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    确认关闭
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showRejectDialog && (
        <div
          onClick={() => setShowRejectDialog(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: 20 }}
          className="animate-fade-in"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="card animate-slide-up"
            style={{ maxWidth: 480, width: '100%' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Undo2 size={20} style={{ color: '#EF4444' }} />
                <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>退回修改</h2>
              </div>
              <button onClick={() => setShowRejectDialog(false)} style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
                确定要退回该订单修改吗？退回后订单回到待处理状态，<b style={{ color: '#EF4444' }}>检查记录将保留</b>。
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>退回原因（可选）</div>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="例如：客户要求修改模型结构、尺寸不符合要求..."
                style={{
                  width: '100%',
                  minHeight: 80,
                  padding: 12,
                  background: '#16181D',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  color: '#e5e7eb',
                  fontSize: 13,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid var(--border-color)' }}>
              <button className="btn-secondary" onClick={() => setShowRejectDialog(false)}>取消</button>
              <button
                className="btn-primary"
                onClick={handleConfirmReject}
                style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', borderColor: '#EF4444' }}
              >
                确认退回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
