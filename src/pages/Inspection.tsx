import { useState } from 'react'
import { useStore } from '@/store'
import { RotateCw, ZoomIn, Scissors, Box, AlertTriangle, Info, ShieldAlert, ChevronDown, FileCheck, X, Download, Printer, CheckCircle, XCircle, RefreshCw, Undo2 } from 'lucide-react'
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
  }
}

export default function Inspection() {
  const { inspections, orders, addInspection, confirmInspection, rejectInspection, createInspectionForOrder } = useStore()
  const [selectedOrderId, setSelectedOrderId] = useState(orders[1]?.id ?? '')
  const [showReport, setShowReport] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [draftInspection, setDraftInspection] = useState<Omit<ModelInspection, 'id'> | null>(null)
  const [reportMode, setReportMode] = useState<'view' | 'draft'>('view')

  const inspection = inspections.find(i => i.orderId === selectedOrderId)
  const order = orders.find(o => o.id === selectedOrderId)
  const displayInspection = reportMode === 'draft' ? draftInspection : inspection

  const handleGenerateDraft = () => {
    if (!selectedOrderId || inspection) return
    setIsGenerating(true)
    setTimeout(() => {
      const draft = generateDraftInspection(selectedOrderId)
      setDraftInspection(draft)
      setReportMode('draft')
      setIsGenerating(false)
      setShowReport(true)
    }, 800)
  }

  const handleConfirmReport = () => {
    if (!draftInspection) return
    const id = addInspection(draftInspection)
    confirmInspection(id)
    setDraftInspection(null)
    setReportMode('view')
    setShowReport(false)
  }

  const handleRegenerate = () => {
    if (!selectedOrderId) return
    if (inspection) {
      rejectInspection(inspection.id)
    }
    setIsGenerating(true)
    setTimeout(() => {
      const draft = generateDraftInspection(selectedOrderId)
      setDraftInspection(draft)
      setReportMode('draft')
      setIsGenerating(false)
      setShowReport(true)
    }, 600)
  }

  const handleReject = () => {
    if (!inspection) return
    if (confirm('确定要退回该订单修改吗？退回后检查记录将清除，订单回到待处理状态。')) {
      rejectInspection(inspection.id)
      setShowReport(false)
    }
  }

  const handleRejectDraft = () => {
    setDraftInspection(null)
    setReportMode('view')
    setShowReport(false)
  }

  const handlePrintReport = () => {
    window.print()
  }

  const handleDownloadReport = () => {
    if (!displayInspection || !order) return
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
      `检查人员: ${displayInspection.inspector}`,
      `检查时间: ${displayInspection.inspectedAt}`,
      `缺陷总数: ${displayInspection.defectCount}`,
      `检查结论: ${displayInspection.isPassed ? '通过' : '未通过'}`,
      reportMode === 'draft' ? '报告状态: 草稿（待确认）' : '',
      '',
      '---------- 缺陷明细 ----------',
    ]
    displayInspection.defects.forEach((d, i) => {
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

  return (
    <div className="page">
      <div className="page-header">
        <h1>模型检查</h1>
        <div style={{ position: 'relative' }}>
          <select
            value={selectedOrderId}
            onChange={e => { setSelectedOrderId(e.target.value); setDraftInspection(null); setReportMode('view') }}
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
            {inspection && (
              <span className="status-badge" style={{ background: inspection.isPassed ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: inspection.isPassed ? '#22c55e' : '#EF4444', fontSize: 12, padding: '2px 10px', borderRadius: 10, fontWeight: 600 }}>
                {inspection.isPassed ? '通过' : '未通过'}
              </span>
            )}
          </div>
          {!inspection ? (
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
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {inspection.defects.map((d, i) => (
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
          <span>检查员: <b style={{ color: '#e5e7eb' }}>{inspection?.inspector ?? '-'}</b></span>
          <span>检查时间: <b style={{ color: '#e5e7eb' }}>{inspection?.inspectedAt ?? '-'}</b></span>
          <span>订单: <b style={{ color: '#e5e7eb' }}>{order?.modelFile ?? '-'}</b></span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {inspection ? (
            <>
              <button
                className="btn-secondary"
                onClick={() => { setReportMode('view'); setShowReport(true) }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: 13 }}
              >
                <FileCheck size={15} /> 查看报告
              </button>
              {!inspection.isPassed && (
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

      {/* 报告模态框 */}
      {showReport && displayInspection && order && (
        <div
          onClick={() => { setShowReport(false); if (reportMode === 'draft') setDraftInspection(null) }}
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
              </div>
              <button onClick={() => { setShowReport(false); if (reportMode === 'draft') setDraftInspection(null) }} style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 20, overflowY: 'auto', flex: 1, fontSize: 13, lineHeight: 1.8 }}>
              {/* 报告头部 */}
              <div style={{ textAlign: 'center', paddingBottom: 16, borderBottom: '2px solid #FF6B35', marginBottom: 20 }}>
                <h3 className="font-display" style={{ fontSize: 22, color: '#FF6B35', margin: 0 }}>MetalForge Pro</h3>
                <p style={{ color: '#999', margin: '4px 0 0', fontSize: 11 }}>金属3D打印模型检查报告</p>
              </div>

              {/* 订单信息 */}
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

              {/* 检查信息 */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ color: '#FF6B35', fontSize: 14, fontWeight: 600, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 3, height: 14, background: '#FF6B35', borderRadius: 2 }}></span>
                  检查信息
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, background: '#16181D', padding: 14, borderRadius: 8 }}>
                  <div><span style={{ color: '#666', display: 'block', fontSize: 11 }}>检查人员</span><b style={{ color: '#e5e7eb', fontSize: 15 }}>{displayInspection.inspector}</b></div>
                  <div><span style={{ color: '#666', display: 'block', fontSize: 11 }}>检查时间</span><b style={{ color: '#e5e7eb', fontSize: 15 }}>{displayInspection.inspectedAt}</b></div>
                  <div><span style={{ color: '#666', display: 'block', fontSize: 11 }}>缺陷总数</span><b style={{ color: displayInspection.defectCount > 0 ? '#EF4444' : '#22C55E', fontSize: 15 }}>{displayInspection.defectCount}</b></div>
                </div>
              </div>

              {/* 缺陷列表 */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ color: '#FF6B35', fontSize: 14, fontWeight: 600, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 3, height: 14, background: '#FF6B35', borderRadius: 2 }}></span>
                  缺陷明细 ({displayInspection.defects.length} 项)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {displayInspection.defects.map((d, i) => (
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

              {/* 检查结论 */}
              <div style={{ background: displayInspection.isPassed ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', borderRadius: 8, padding: 16, border: `1px solid ${displayInspection.isPassed ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>综合判定结论</div>
                <div className="font-display" style={{ fontSize: 28, fontWeight: 700, color: displayInspection.isPassed ? '#22C55E' : '#EF4444', letterSpacing: 2 }}>
                  {displayInspection.isPassed ? '✓ 检查通过' : '✗ 检查未通过'}
                </div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 8 }}>
                  {displayInspection.isPassed
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
                      <X size={14} /> 取消
                    </button>
                    <button className="btn-primary" onClick={handleConfirmReport} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={14} /> 确认保存
                    </button>
                  </>
                ) : (
                  <button className="btn-primary" onClick={() => setShowReport(false)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    确认关闭
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
