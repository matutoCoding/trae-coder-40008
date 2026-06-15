import { useState, useMemo, useEffect } from 'react'
import { Upload, FileText, Package, Calendar, Hash, Layers, Sparkles, X, ShoppingCart, Clock, Truck, Eye, ArrowLeft, CheckCircle, Printer, Scissors, SearchCheck, Box, AlertTriangle, RotateCcw, FileImage } from 'lucide-react'
import { useStore, statusLabels, statusColors, shipmentTypeLabels, shipmentTypeColors } from '@/store'
import type { Order, ProcessLog, ModelInspection, Shipment } from '@/store'

const MATERIALS = ['Ti6Al4V', '316L', 'AlSi10Mg', 'In718', 'H13', 'CoCr']
const PROCESSES = ['SLM', 'DMLS', 'EBM']
const FINISHES = ['Ra0.4', 'Ra0.8', 'Ra1.6', 'Ra3.2', 'Ra6.3']
const PRICE_MAP: Record<string, number> = { Ti6Al4V: 800, '316L': 350, AlSi10Mg: 280, In718: 1200, H13: 650, CoCr: 950 }
const PROCESS_MAP: Record<string, number> = { SLM: 1.0, DMLS: 1.2, EBM: 1.5 }
const FINISH_MAP: Record<string, number> = { 'Ra0.4': 2.0, 'Ra0.8': 1.5, 'Ra1.6': 1.0, 'Ra3.2': 0.8, 'Ra6.3': 0.5 }

const TABS = ['我要下单', '订单管理'] as const

const STAGE_ORDER: Order['status'][] = ['pending', 'inspecting', 'preparing', 'printing', 'removing', 'processing', 'shipping', 'completed']

const stageMeta: Record<Order['status'], { label: string; icon: React.ReactNode }> = {
  pending: { label: '订单提交', icon: <ShoppingCart size={16} /> },
  inspecting: { label: '模型检查', icon: <SearchCheck size={16} /> },
  preparing: { label: '材料备料', icon: <Package size={16} /> },
  printing: { label: '打印作业', icon: <Printer size={16} /> },
  removing: { label: '支撑去除', icon: <Scissors size={16} /> },
  processing: { label: '表面后处理', icon: <Sparkles size={16} /> },
  shipping: { label: '待发货', icon: <Box size={16} /> },
  completed: { label: '已发货', icon: <Truck size={16} /> },
}

const calcStuckDays = (logs: ProcessLog[]): number => {
  if (logs.length === 0) return 0
  const sorted = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  const lastLog = sorted[0]
  const lastTime = new Date(lastLog.timestamp).getTime()
  const now = Date.now()
  return Math.floor((now - lastTime) / (24 * 3600 * 1000))
}

export default function Order() {
  const { orders, printJobs, inspections, supportRemovals, postProcesses, shipments, processLogs, addOrder, getLatestInspectionForOrder } = useStore()
  const [tab, setTab] = useState<typeof TABS[number]>('我要下单')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const orderId = params.get('orderId')
    const shipmentId = params.get('shipmentId')
    if (orderId) {
      const found = orders.find(o => o.id === orderId)
      if (found) {
        setTab('订单管理')
        setSelectedOrderId(found.id)
      }
    } else if (shipmentId) {
      const ship = shipments.find(s => s.id === shipmentId)
      if (ship) {
        const found = orders.find(o => o.id === ship.orderId)
        if (found) {
          setTab('订单管理')
          setSelectedOrderId(found.id)
        }
      }
    }
  }, [orders, shipments])

  const selectedOrder = orders.find(o => o.id === selectedOrderId)

  const printJobMap = useMemo(() => Object.fromEntries(printJobs.map(j => [j.orderId, j])), [printJobs])
  const inspectionMap = useMemo(() => Object.fromEntries(inspections.map(i => [i.orderId, i])), [inspections])
  const orderInspectionsMap = useMemo(() => {
    const map: Record<string, ModelInspection[]> = {}
    inspections.forEach(i => {
      if (!map[i.orderId]) map[i.orderId] = []
      map[i.orderId].push(i)
    })
    Object.keys(map).forEach(k => {
      map[k].sort((a, b) => new Date(b.inspectedAt).getTime() - new Date(a.inspectedAt).getTime())
    })
    return map
  }, [inspections])
  const supportMap = useMemo(() => Object.fromEntries(supportRemovals.map(s => [s.orderId, s])), [supportRemovals])
  const postProcessMap = useMemo(() => Object.fromEntries(postProcesses.map(p => [p.orderId, p])), [postProcesses])
  const shipmentMap = useMemo(() => {
    const map: Record<string, typeof shipments> = {}
    shipments.forEach(s => {
      if (!map[s.orderId]) map[s.orderId] = []
      map[s.orderId].push(s)
    })
    Object.keys(map).forEach(k => {
      map[k].sort((a, b) => new Date(b.shippedAt).getTime() - new Date(a.shippedAt).getTime())
    })
    return map
  }, [shipments])
  const processLogsMap = useMemo(() => {
    const map: Record<string, ProcessLog[]> = {}
    processLogs.forEach(l => {
      if (!map[l.orderId]) map[l.orderId] = []
      map[l.orderId].push(l)
    })
    Object.keys(map).forEach(k => {
      map[k].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    })
    return map
  }, [processLogs])

  const buildTimeline = (order: Order) => {
    const logs = processLogsMap[order.id] ?? []
    const currentIdx = STAGE_ORDER.indexOf(order.status)
    const timeline: { key: Order['status']; label: string; icon: React.ReactNode; status: 'done' | 'current' | 'pending'; time: string; detail?: string; extraTags?: { text: string; color: string }[] }[] = []

    const getLogByStage = (stage: ProcessLog['stage']) => {
      const found = logs.find(l => l.stage === stage)
      return found
    }

    const reworkLog = logs.find(l => l.stage === 'rework_created')

    STAGE_ORDER.forEach((stage, idx) => {
      const meta = stageMeta[stage]
      let status: 'done' | 'current' | 'pending' = 'pending'
      let time = ''
      let detail = ''
      const extraTags: { text: string; color: string }[] = []

      if (idx < currentIdx) status = 'done'
      else if (idx === currentIdx) status = 'current'

      if (stage === 'pending') {
        const log = getLogByStage('order_created')
        time = log ? new Date(log.timestamp).toLocaleString('zh-CN') : order.createdAt
        detail = log?.note || `${order.customerName} 提交订单`
      }
      if (stage === 'inspecting') {
        const confirmedLog = getLogByStage('inspection_confirmed')
        const rejectedLog = getLogByStage('inspection_rejected')
        const usedLog = confirmedLog || rejectedLog
        if (usedLog) {
          time = new Date(usedLog.timestamp).toLocaleString('zh-CN')
          detail = usedLog.note || ''
          const insp = getLatestInspectionForOrder(order.id)
          if (insp && !insp.isPassed) {
            if (insp.rejectReason) detail = `${detail}${detail ? ' · ' : ''}退回原因：${insp.rejectReason}`
            if (insp.rejectNote) detail = `${detail}${detail ? ' · ' : ''}备注：${insp.rejectNote}`
          }
        } else if (inspectionMap[order.id]) {
          const insp = inspectionMap[order.id]
          time = insp.inspectedAt
          detail = `${insp.inspector} · ${insp.defectCount}项缺陷 · ${insp.isPassed ? '通过' : '未通过'}`
        }
      }
      if (stage === 'preparing') {
        const log = getLogByStage('material_picked')
        if (log) {
          time = new Date(log.timestamp).toLocaleString('zh-CN')
          detail = log.note || ''
        }
      }
      if (stage === 'printing') {
        const log = getLogByStage('print_completed')
        if (log) {
          time = new Date(log.timestamp).toLocaleString('zh-CN')
          detail = log.note || ''
        }
        if (printJobMap[order.id]) {
          const job = printJobMap[order.id]
          if (!time) time = job.startedAt ? new Date(job.startedAt).toLocaleDateString('zh-CN') : '未开始'
          if (!detail) detail = `功率${job.laserPower}W · 层厚${job.layerThickness}μm · ${status === 'done' ? '已完成' : (status === 'current' ? `第${job.currentLayer}/${job.totalLayers}层` : '待开始')}`
        }
      }
      if (stage === 'removing') {
        const log = getLogByStage('support_completed')
        if (log) {
          time = new Date(log.timestamp).toLocaleString('zh-CN')
          detail = log.note || ''
        }
        if (supportMap[order.id]) {
          const sr = supportMap[order.id]
          if (!time) time = sr.startedAt ? new Date(sr.startedAt).toLocaleDateString('zh-CN') : ''
          if (!detail) {
            const methodLabel = sr.removalMethod === 'wire-cut' ? '线切割' : sr.removalMethod === 'acid' ? '酸溶' : '手工去除'
            detail = `${methodLabel} · ${sr.status === 'completed' ? '已完成' : sr.status === 'in-progress' ? '进行中' : '待处理'}`
          }
        }
      }
      if (stage === 'processing') {
        const log = getLogByStage('postprocess_judged')
        if (log) {
          time = new Date(log.timestamp).toLocaleString('zh-CN')
          detail = log.note || ''
        }
        if (postProcessMap[order.id]) {
          const pp = postProcessMap[order.id]
          if (!detail) detail = `${pp.polishingMethod || '未设置'} · Ra${pp.actualRoughness || '-'} · 尺寸${pp.dimensions?.length || 0}项`
        }
        if (reworkLog) {
          extraTags.push({ text: '返工', color: 'bg-orange-500/20 text-orange-400' })
          if (reworkLog.note) detail = `${detail}${detail ? ' · ' : ''}返工说明：${reworkLog.note}`
        }
      }
      if (stage === 'shipping') {
        detail = '成品待发货'
      }
      if (stage === 'completed') {
        const log = getLogByStage('shipped')
        if (log) {
          time = new Date(log.timestamp).toLocaleString('zh-CN')
          detail = log.note || ''
        }
        if (shipmentMap[order.id]?.length) {
          const sh = shipmentMap[order.id][0]
          if (!time) time = sh.shippedAt ? new Date(sh.shippedAt).toLocaleDateString('zh-CN') : ''
          if (!detail) detail = `${sh.courierCompany} · ${sh.trackingNo}`
        }
      }

      timeline.push({ key: stage, label: meta.label, icon: meta.icon, status, time, detail, extraTags })
    })

    return timeline
  }

  if (selectedOrder) {
    const timeline = buildTimeline(selectedOrder)
    const orderShipments = shipmentMap[selectedOrder.id] ?? []
    const latestInspection = getLatestInspectionForOrder(selectedOrder.id)
    const orderInspections = orderInspectionsMap[selectedOrder.id] ?? []
    const passedCount = orderInspections.filter(i => i.isPassed).length
    const logs = processLogsMap[selectedOrder.id] ?? []
    const stuckDays = calcStuckDays(logs)

    const normalShipments = orderShipments.filter(s => s.shipmentType === 'normal')
    const reissueShipments = orderShipments.filter(s => s.shipmentType === 'reissue')
    const resendShipments = orderShipments.filter(s => s.shipmentType === 'resend')

    return (
      <div className="page">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => setSelectedOrderId(null)} className="btn-secondary" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowLeft size={14} /> 返回列表
            </button>
            <h1 style={{ margin: 0 }}>订单详情</h1>
            <span className="font-display" style={{ color: '#4A90D9', fontSize: 18 }}>{selectedOrder.id}</span>
            <span className={`status-badge ${statusColors[selectedOrder.status]}`} style={{ marginLeft: 8 }}>{statusLabels[selectedOrder.status]}</span>
            {stuckDays > 3 && (
              <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.2)', color: '#EF4444', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <AlertTriangle size={12} /> 卡单 {stuckDays} 天
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: 16, flex: 1, minHeight: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={16} style={{ color: '#FF6B35' }} /> 基本信息</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#666' }}>客户名称</span><b>{selectedOrder.customerName}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#666' }}>联系电话</span><b>{selectedOrder.phone}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#666' }}>所属公司</span><b>{selectedOrder.company || '-'}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#666' }}>模型文件</span><b style={{ color: '#4A90D9' }}>{selectedOrder.modelFile}</b></div>
              </div>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><SettingsIcon /> 工艺参数</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#666' }}>打印材料</span><b style={{ color: '#C0A062' }}>{selectedOrder.material}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#666' }}>打印工艺</span><b>{selectedOrder.process}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#666' }}>表面粗糙度</span><b>{selectedOrder.surfaceFinish}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#666' }}>数量</span><b>{selectedOrder.quantity} 件</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#666' }}>交付日期</span><b>{selectedOrder.deliveryDate}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#666' }}>报价金额</span><b style={{ color: '#FF6B35', fontSize: 16 }}>¥{selectedOrder.quotePrice.toLocaleString()}</b></div>
              </div>
            </div>

            {latestInspection && (
              <div className="card" style={{ padding: 16, border: latestInspection.isPassed ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: latestInspection.isPassed ? '#22C55E' : '#EF4444' }}>
                    <SearchCheck size={16} /> 模型检查
                  </h3>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: latestInspection.isPassed ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', color: latestInspection.isPassed ? '#22C55E' : '#EF4444', fontWeight: 600 }}>
                    {latestInspection.isPassed ? '通过' : '未通过'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#666' }}>检查员</span><b>{latestInspection.inspector}</b></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#666' }}>检查时间</span><b>{latestInspection.inspectedAt}</b></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#666' }}>缺陷项数</span><b>{latestInspection.defectCount} 项</b></div>
                  {!latestInspection.isPassed && latestInspection.rejectReason && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 10px', background: 'rgba(239,68,68,0.1)', borderRadius: 6 }}>
                      <span style={{ color: '#EF4444', fontSize: 12, fontWeight: 600 }}>退回原因</span>
                      <span style={{ fontSize: 12 }}>{latestInspection.rejectReason}</span>
                    </div>
                  )}
                  {!latestInspection.isPassed && latestInspection.rejectNote && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 10px', background: 'rgba(239,68,68,0.08)', borderRadius: 6 }}>
                      <span style={{ color: '#EF4444', fontSize: 12, fontWeight: 600 }}>备注说明</span>
                      <span style={{ fontSize: 12 }}>{latestInspection.rejectNote}</span>
                    </div>
                  )}
                  {orderInspections.length > 0 && (
                    <div style={{ borderTop: '1px solid #333', paddingTop: 10, marginTop: 4 }}>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>历史检查记录：</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
                        <span>共 <b style={{ color: '#e5e7eb' }}>{orderInspections.length}</b> 次</span>
                        <span style={{ color: '#22C55E' }}>通过 {passedCount} 次</span>
                        <span style={{ color: '#EF4444' }}>未通过 {orderInspections.length - passedCount} 次</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {orderShipments.length > 0 && (
              <div className="card" style={{ padding: 16, border: '1px solid rgba(34,197,94,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: '#22C55E' }}><Truck size={16} /> 发货信息</h3>
                  {orderShipments.length > 1 && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: 'rgba(34,197,94,0.2)', color: '#22C55E', fontWeight: 600 }}>共 {orderShipments.length} 条</span>
                  )}
                </div>

                {normalShipments.length > 0 && (
                  <div style={{ marginBottom: normalShipments.length > 0 && (reissueShipments.length > 0 || resendShipments.length > 0) ? 14 : 0 }}>
                    <div style={{ fontSize: 12, color: '#999', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`status-badge ${shipmentTypeColors.normal}`} style={{ fontSize: 10, padding: '1px 6px' }}>{shipmentTypeLabels.normal}</span>
                      <span>（{normalShipments.length} 条）</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {normalShipments.map((sh, idx) => (
                        <ShipmentItem key={sh.id} shipment={sh} showDetails={idx === 0} />
                      ))}
                    </div>
                  </div>
                )}

                {reissueShipments.length > 0 && (
                  <div style={{ marginBottom: resendShipments.length > 0 ? 14 : 0 }}>
                    <div style={{ fontSize: 12, color: '#999', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`status-badge ${shipmentTypeColors.reissue}`} style={{ fontSize: 10, padding: '1px 6px' }}>{shipmentTypeLabels.reissue}</span>
                      <span>（{reissueShipments.length} 条）</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {reissueShipments.map(sh => (
                        <ShipmentItem key={sh.id} shipment={sh} showDetails />
                      ))}
                    </div>
                  </div>
                )}

                {resendShipments.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, color: '#999', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`status-badge ${shipmentTypeColors.resend}`} style={{ fontSize: 10, padding: '1px 6px' }}>{shipmentTypeLabels.resend}</span>
                      <span>（{resendShipments.length} 条）</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {resendShipments.map(sh => (
                        <ShipmentItem key={sh.id} shipment={sh} showDetails />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 20, overflow: 'auto' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={18} style={{ color: '#FF6B35' }} /> 生产流转时间线</h3>
            <div style={{ position: 'relative', paddingLeft: 8 }}>
              {timeline.map((item, idx) => (
                <div key={item.key} style={{ position: 'relative', display: 'flex', gap: 14, paddingBottom: idx === timeline.length - 1 ? 0 : 24 }}>
                  <div style={{ position: 'relative', zIndex: 2, width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: item.status === 'done' ? '#22C55E' : item.status === 'current' ? '#FF6B35' : '#333',
                    color: item.status === 'pending' ? '#666' : '#fff',
                    boxShadow: item.status === 'current' ? '0 0 12px #FF6B3566' : 'none',
                  }}>
                    {item.status === 'done' ? <CheckCircle size={16} /> : item.icon}
                  </div>
                  {idx < timeline.length - 1 && (
                    <div style={{ position: 'absolute', left: 15, top: 32, width: 2, height: 'calc(100% - 8px)',
                      background: item.status === 'done' ? 'linear-gradient(to bottom, #22C55E, #22C55E)' : 'linear-gradient(to bottom, #333, #333)'
                    }} />
                  )}
                  <div style={{ flex: 1, paddingTop: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: item.status === 'pending' ? '#666' : '#e5e7eb' }}>{item.label}</span>
                      {item.extraTags?.map((tag, i) => (
                        <span key={i} className={`status-badge ${tag.color}`} style={{ fontSize: 10, padding: '1px 8px' }}>{tag.text}</span>
                      ))}
                      {item.status === 'current' && <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 8, background: 'rgba(255,107,53,0.2)', color: '#FF6B35', fontWeight: 600 }}>进行中</span>}
                      {item.status === 'done' && <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 8, background: 'rgba(34,197,94,0.2)', color: '#22C55E', fontWeight: 600 }}>已完成</span>}
                    </div>
                    {item.detail && <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 6px', lineHeight: 1.6 }}>{item.detail}</p>}
                    {item.time && <p style={{ fontSize: 11, color: '#64748b', margin: 0, fontFamily: 'Rajdhani, sans-serif' }}>{item.time}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (tab === '订单管理') {
    return (
      <div className="page">
        <div className="page-header">
          <h1>订单管理</h1>
          <div className="tabs">
            {TABS.map(t => (
              <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>客户</th>
                <th>材料</th>
                <th>数量</th>
                <th>工序进度</th>
                <th>打印进度</th>
                <th>发货状态</th>
                <th>金额</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const job = printJobMap[order.id]
                const orderShipments = shipmentMap[order.id] ?? []
                const latestShipment = orderShipments[0]
                const currentIdx = STAGE_ORDER.indexOf(order.status)
                const progress = Math.round(((currentIdx + 0.5) / STAGE_ORDER.length) * 100)
                const printProgress = job ? Math.round((job.currentLayer / job.totalLayers) * 100) : 0
                const logs = processLogsMap[order.id] ?? []
                const stuckDays = calcStuckDays(logs)

                return (
                  <tr key={order.id}>
                    <td><span className="font-display" style={{ color: '#4A90D9', fontWeight: 600 }}>{order.id}</span></td>
                    <td>
                      <div>
                        {order.customerName}
                        <div style={{ fontSize: 11, color: '#666' }}>{order.company}</div>
                      </div>
                    </td>
                    <td><span style={{ color: '#C0A062' }}>{order.material}</span></td>
                    <td>{order.quantity} 件</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span className={`status-badge ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                        <div style={{ width: 60, height: 4, background: '#333', borderRadius: 2 }}>
                          <div style={{ width: `${progress}%`, height: '100%', background: '#FF6B35', borderRadius: 2 }} />
                        </div>
                        {stuckDays > 3 && (
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: 'rgba(239,68,68,0.2)', color: '#EF4444', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <AlertTriangle size={10} /> 卡单{stuckDays}天
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {job ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 50, height: 4, background: '#333', borderRadius: 2 }}>
                            <div style={{ width: `${printProgress}%`, height: '100%', background: job.status === 'completed' ? '#22C55E' : '#FF6B35', borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 11, fontFamily: 'Rajdhani, sans-serif', color: '#999' }}>{printProgress}%</span>
                        </div>
                      ) : <span style={{ color: '#666', fontSize: 12 }}>未安排</span>}
                    </td>
                    <td>
                      {orderShipments.length > 0 ? (
                        <div style={{ fontSize: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>已发货</span>
                            <b style={{ color: '#22C55E' }}>{orderShipments.length}</b>
                            <span>次</span>
                            {orderShipments.length > 1 && (
                              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: orderShipments.length > 2 ? 'rgba(249,115,22,0.2)' : 'rgba(234,179,8,0.2)', color: orderShipments.length > 2 ? '#F97316' : '#EAB308', fontWeight: 600 }}>
                                多次发货
                              </span>
                            )}
                          </div>
                          <div style={{ color: '#999', fontSize: 11, marginTop: 2 }}>
                            {latestShipment ? new Date(latestShipment.shippedAt).toLocaleDateString('zh-CN') : ''}
                            {' · '}
                            {latestShipment?.courierCompany}
                          </div>
                        </div>
                      ) : <span style={{ color: '#666', fontSize: 12 }}>未发货</span>}
                    </td>
                    <td><b style={{ color: '#FF6B35' }}>¥{order.quotePrice.toLocaleString()}</b></td>
                    <td>
                      <button className="btn-secondary" onClick={() => setSelectedOrderId(order.id)} style={{ padding: '4px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Eye size={12} /> 详情
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>在线下单</h1>
        <div className="tabs">
          {TABS.map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
      </div>

      <OrderForm addOrder={addOrder} />
    </div>
  )
}

function ShipmentItem({ shipment, showDetails }: { shipment: Shipment; showDetails: boolean }) {
  return (
    <div style={{ padding: '10px 12px', background: '#16181D', borderRadius: 6, fontSize: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ color: '#e5e7eb', fontWeight: 500 }}>{shipment.courierCompany} · <span style={{ fontFamily: 'Rajdhani, sans-serif', color: '#4A90D9' }}>{shipment.trackingNo}</span></span>
        <span style={{ color: '#666', fontSize: 11 }}>{new Date(shipment.shippedAt).toLocaleDateString('zh-CN')}</span>
      </div>
      {showDetails && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>运输状态</span>
            <b style={{ color: shipment.status === 'delivered' ? '#22C55E' : '#3B82F6' }}>{shipment.status === 'shipped' ? '运输中' : shipment.status === 'delivered' ? '已签收' : '待发货'}</b>
          </div>
          {shipment.operator && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>操作人</span>
              <b>{shipment.operator}</b>
            </div>
          )}
          {(shipment.shipmentType === 'reissue' || shipment.shipmentType === 'resend') && shipment.reason && (
            <div style={{ display: 'flex', gap: 6, marginTop: 4, padding: '6px 8px', background: 'rgba(234,179,8,0.1)', borderRadius: 4 }}>
              <RotateCcw size={12} style={{ color: '#EAB308', flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 11 }}>
                <span style={{ color: '#EAB308', fontWeight: 600 }}>原因：</span>
                <span style={{ color: '#94a3b8' }}>{shipment.reason}</span>
              </div>
            </div>
          )}
          {(shipment.shipmentType === 'reissue' || shipment.shipmentType === 'resend') && shipment.attachmentPhotos && shipment.attachmentPhotos.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginTop: 2, padding: '6px 8px', background: 'rgba(59,130,246,0.08)', borderRadius: 4 }}>
              <FileImage size={12} style={{ color: '#3B82F6', flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                <span style={{ color: '#3B82F6', fontWeight: 600 }}>附件（{shipment.attachmentPhotos.length}个）：</span>
                {shipment.attachmentPhotos.join('、')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SettingsIcon() {
  return <Layers size={16} style={{ color: '#FF6B35' }} />
}

function OrderForm({ addOrder }: { addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => string }) {
  const [form, setForm] = useState({
    customerName: '', phone: '', company: '', modelFile: '',
    material: 'Ti6Al4V', process: 'SLM', surfaceFinish: 'Ra1.6',
    quantity: 1, deliveryDate: '',
  })
  const [dragOver, setDragOver] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const set = (key: string, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) set('modelFile', file.name)
  }

  const handleFileClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.stl,.obj,.step,.stp'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) set('modelFile', file.name)
    }
    input.click()
  }

  const materialCost = PRICE_MAP[form.material] * form.quantity
  const processMult = PROCESS_MAP[form.process]
  const finishMult = FINISH_MAP[form.surfaceFinish]
  const baseCost = Math.round(materialCost * processMult * finishMult)
  const supportCost = Math.round(baseCost * 0.15)
  const postCost = Math.round(baseCost * 0.12)
  const totalPrice = baseCost + supportCost + postCost

  const handleSubmit = () => {
    if (!form.customerName || !form.phone || !form.modelFile || !form.deliveryDate) return
    addOrder({
      customerName: form.customerName,
      phone: form.phone,
      company: form.company,
      modelFile: form.modelFile,
      material: form.material,
      process: form.process,
      surfaceFinish: form.surfaceFinish,
      quantity: form.quantity,
      deliveryDate: form.deliveryDate,
      quotePrice: totalPrice,
    })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center" style={{ flex: 1 }}>
        <div className="card p-12 text-center animate-fade-in" style={{ padding: 48 }}>
          <Sparkles className="w-16 h-16 mx-auto mb-4" style={{ color: '#FF6B35' }} />
          <h2 className="text-2xl font-bold mb-2">订单提交成功</h2>
          <p className="text-[var(--text-secondary)] mb-6">我们将尽快安排模型检测与报价确认</p>
          <button className="btn-primary" onClick={() => {
            setSubmitted(false)
            setForm({ customerName: '', phone: '', company: '', modelFile: '', material: 'Ti6Al4V', process: 'SLM', surfaceFinish: 'Ra1.6', quantity: 1, deliveryDate: '' })
          }}>
            继续下单
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" style={{ flex: 1, overflow: 'auto' }}>
      <div className="lg:col-span-3 space-y-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">客户信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="input-field" placeholder="客户姓名" value={form.customerName} onChange={(e) => set('customerName', e.target.value)} />
            <input className="input-field" placeholder="联系电话" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            <input className="input-field" placeholder="公司名称（选填）" value={form.company} onChange={(e) => set('company', e.target.value)} />
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">模型文件</h3>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-[#FF6B35] bg-[#FF6B3511]' : 'border-[var(--border-color)] hover:border-[var(--text-muted)]'}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={handleFileClick}
          >
            {form.modelFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8" style={{ color: '#FF6B35' }} />
                <div className="text-left">
                  <p className="font-medium">{form.modelFile}</p>
                  <p className="text-xs text-[var(--text-muted)]">点击或拖拽更换文件</p>
                </div>
                <button className="ml-2 p-1 hover:text-[var(--danger)]" onClick={(e) => { e.stopPropagation(); set('modelFile', '') }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)]" />
                <p className="text-[var(--text-secondary)]">拖拽文件到此处或点击上传</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">支持 STL / OBJ / STEP 格式</p>
              </>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">工艺参数</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1"><Layers className="w-3 h-3" />材料</label>
              <select className="select-field" value={form.material} onChange={(e) => set('material', e.target.value)}>
                {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" />工艺</label>
              <select className="select-field" value={form.process} onChange={(e) => set('process', e.target.value)}>
                {PROCESSES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1">表面粗糙度</label>
              <select className="select-field" value={form.surfaceFinish} onChange={(e) => set('surfaceFinish', e.target.value)}>
                {FINISHES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1"><Hash className="w-3 h-3" />数量</label>
              <input type="number" className="input-field" min={1} value={form.quantity} onChange={(e) => set('quantity', Math.max(1, +e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" />交付日期</label>
              <input type="date" className="input-field" value={form.deliveryDate} onChange={(e) => set('deliveryDate', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="card p-5" style={{ background: '#0D0F13' }}>
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">3D模型预览</h3>
          <div className="rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0A0C10, #141820)', border: '1px solid var(--border-color)' }}>
            <div className="aspect-square relative flex items-center justify-center">
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px)',
                backgroundSize: '30px 30px',
              }} />
              {form.modelFile ? (
                <div className="text-center z-10">
                  <Package className="w-14 h-14 mx-auto mb-3" style={{ color: '#FF6B35' }} />
                  <p className="font-medium mb-1">{form.modelFile}</p>
                  <p className="text-xs text-[var(--text-muted)]">模型加载预览中...</p>
                </div>
              ) : (
                <p className="text-[var(--text-muted)] z-10">3D模型预览</p>
              )}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 uppercase tracking-wider">报价明细</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">材料费用</span><span>¥{materialCost.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">工艺系数({form.process})</span><span>×{processMult}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">表面处理系数({form.surfaceFinish})</span><span>×{finishMult}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">基础打印费</span><span>¥{baseCost.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">支撑去除费</span><span>¥{supportCost.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">后处理费</span><span>¥{postCost.toLocaleString()}</span></div>
            <div className="border-t border-[var(--border-color)] pt-2 mt-2 flex justify-between text-lg font-bold">
              <span>合计</span>
              <span style={{ color: '#FF6B35' }}>¥{totalPrice.toLocaleString()}</span>
            </div>
          </div>
          <button className="btn-primary w-full mt-5 text-base py-3" onClick={handleSubmit}>
            提交订单
          </button>
          <p className="text-xs text-[var(--text-muted)] text-center mt-2">提交后进入模型检测环节，最终价格以检测结果为准</p>
        </div>
      </div>
    </div>
  )
}
