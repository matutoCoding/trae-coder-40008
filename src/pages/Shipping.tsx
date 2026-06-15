import { useState, useEffect } from 'react'
import { useStore, statusLabels, statusColors, shipmentTypeLabels, shipmentTypeColors } from '@/store'
import { Camera, Package, Truck, Check, X, ChevronDown, ChevronUp, ScanLine, FileText, ExternalLink, Upload, User } from 'lucide-react'

const COURIERS = ['顺丰速运', '中通快递', '圆通速递', '京东物流', '德邦物流']
const SAMPLE_PHOTOS = ['/photos/sample1.jpg', '/photos/sample2.jpg', '/photos/sample3.jpg']
const SAMPLE_ATTACHMENTS = ['破损证明.jpg', '快递面单.png', '客户签收单.pdf']
const OPERATOR_LIST = ['刘工', '陈工', '王工', '张工', '李工', '赵师傅', '李师傅']

export default function Shipping() {
  const { shipments, orders, addShipment, updateShipment } = useStore()
  const [photos, setPhotos] = useState<string[]>([])
  const [orderId, setOrderId] = useState('')
  const [inspected, setInspected] = useState(false)
  const [courier, setCourier] = useState('')
  const [trackingNo, setTrackingNo] = useState('')
  const [shipmentType, setShipmentType] = useState<'normal' | 'reissue' | 'resend'>('normal')
  const [reason, setReason] = useState('')
  const [attachmentPhotos, setAttachmentPhotos] = useState<string[]>([])
  const [operator, setOperator] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showOrderDetailShipmentId, setShowOrderDetailShipmentId] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState<'latest' | 'reissue' | 'resend'>('latest')

  useEffect(() => {
    setOperator(OPERATOR_LIST[Math.floor(Math.random() * OPERATOR_LIST.length)])
  }, [])

  const selectedShipment = shipments.find(s => s.id === showOrderDetailShipmentId)
  const selectedOrder = orders.find(o => o.id === selectedShipment?.orderId)
  const allShipmentsForOrder = shipments.filter(s => s.orderId === selectedOrder?.id).sort((a, b) => new Date(b.shippedAt).getTime() - new Date(a.shippedAt).getTime())
  const isLatestShipment = selectedShipment && allShipmentsForOrder[0]?.id === selectedShipment.id

  const normalShipments = allShipmentsForOrder.filter(s => s.shipmentType === 'normal')
  const reissueShipments = allShipmentsForOrder.filter(s => s.shipmentType === 'reissue')
  const resendShipments = allShipmentsForOrder.filter(s => s.shipmentType === 'resend')
  const latestShipment = allShipmentsForOrder[0]

  const getDisplayShipments = () => {
    if (detailTab === 'latest') return normalShipments.length > 0 ? [normalShipments.sort((a, b) => new Date(b.shippedAt).getTime() - new Date(a.shippedAt).getTime())[0]] : [latestShipment]
    if (detailTab === 'reissue') return reissueShipments
    return resendShipments
  }

  const handleSubmit = () => {
    if (!orderId || !inspected || !courier || !trackingNo) return
    if ((shipmentType === 'reissue' || shipmentType === 'resend') && !reason.trim()) return
    const existingNormal = shipments.find(s => s.orderId === orderId && s.shipmentType === 'normal')
    if (shipmentType === 'normal' && existingNormal) {
      if (!confirm('该订单已存在正常发货记录，是否改为补发/重发？')) {
        return
      }
    }
    const existingShipments = shipments.filter(s => s.orderId === orderId)
    if (existingShipments.length > 0 && shipmentType !== 'normal') {
      if (!confirm(`该订单已有 ${existingShipments.length} 条发货记录，确定要添加新的${shipmentTypeLabels[shipmentType]}记录吗？`)) {
        return
      }
    }
    addShipment({
      orderId,
      photos,
      courierCompany: courier,
      trackingNo,
      shippedAt: new Date().toISOString(),
      status: 'shipped',
      shipmentType,
      reason: (shipmentType === 'reissue' || shipmentType === 'resend') ? reason : undefined,
      attachmentPhotos: (shipmentType === 'reissue' || shipmentType === 'resend') ? attachmentPhotos : undefined,
      operator,
    })
    setPhotos([])
    setOrderId('')
    setInspected(false)
    setCourier('')
    setTrackingNo('')
    setShipmentType('normal')
    setReason('')
    setAttachmentPhotos([])
    setOperator(OPERATOR_LIST[Math.floor(Math.random() * OPERATOR_LIST.length)])
  }

  const statusLabel = (s: string) => s === 'shipped' ? '已发货' : s === 'delivered' ? '已签收' : '待发货'
  const statusColor = (s: string) => s === 'shipped' ? '#3B82F6' : s === 'delivered' ? '#10B981' : '#F59E0B'

  return (
    <div className="page">
      <div className="page-header"><Package size={22} /> 成品发货</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 20 }}>
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>产品拍照</h3>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1', background: '#111', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {[[0,0,'2px 0 0 2px'],[0,1,'2px 2px 0 0'],[1,0,'0 0 2px 2px'],[1,1,'0 2px 2px 0']].map(([r,c,rad],i) => (
              <div key={i} style={{ position:'absolute', top: r?'auto':12, bottom: r?12:'auto', left: c?'auto':12, right: c?12:'auto', width:28, height:28, borderTop: r?0:'3px solid #FF6B35', borderBottom: r?'3px solid #FF6B35':0, borderLeft: c?0:'3px solid #FF6B35', borderRight: c?'3px solid #FF6B35':0, borderRadius: rad as string }} />
            ))}
            <div style={{ position:'absolute', width:'60%', height:0, borderTop:'1px dashed rgba(255,107,53,0.4)' }} />
            <div style={{ position:'absolute', height:'60%', width:0, borderLeft:'1px dashed rgba(255,107,53,0.4)' }} />
            <div style={{ width:12, height:12, borderRadius:'50%', border:'2px solid #FF6B35', position:'relative', zIndex:1 }} />
            <div style={{ position:'absolute', bottom:8, right:8, color:'#666', fontSize:11 }}><Camera size={16} /></div>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
            {photos.map((p, i) => (
              <div key={i} style={{ position:'relative', width:60, height:60, borderRadius:4, overflow:'hidden', background:'#222' }}>
                <img src={p} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                <button onClick={() => setPhotos(photos.filter((_,j)=>j!==i))} style={{ position:'absolute', top:2, right:2, background:'rgba(0,0,0,0.7)', border:'none', borderRadius:'50%', color:'#fff', cursor:'pointer', padding:1, lineHeight:1 }}><X size={12} /></button>
              </div>
            ))}
          </div>
          <button className="btn-secondary" style={{ marginTop:10, width:'100%' }} onClick={() => setPhotos([...photos, SAMPLE_PHOTOS[photos.length % 3]])}>
            <Camera size={14} /> 拍照
          </button>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12 }}>发货信息</h3>
          <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, cursor:'pointer' }}>
            <input type="checkbox" checked={inspected} onChange={e => setInspected(e.target.checked)} style={{ accentColor:'#FF6B35' }} />
            <span>终检确认合格</span>
          </label>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:13, color:'#999', marginBottom:4, display:'block' }}>发货类型</label>
            <div style={{ display:'flex', gap:8 }}>
              {(['normal', 'reissue', 'resend'] as const).map(t => (
                <label
                  key={t}
                  style={{
                    flex:1,
                    padding:'8px 10px',
                    borderRadius:6,
                    border:`2px solid ${shipmentType===t ? '#FF6B35' : 'var(--border-color)'}`,
                    background: shipmentType===t ? 'rgba(255,107,53,0.1)' : '#16181D',
                    cursor:'pointer',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    gap:6,
                    fontSize:13,
                    transition:'all 0.15s',
                  }}
                >
                  <input type="radio" name="shipmentType" checked={shipmentType===t} onChange={() => setShipmentType(t)} style={{ display:'none' }} />
                  <span className={`px-1.5 py-0.5 rounded text-xs ${shipmentTypeColors[t]}`}>{shipmentTypeLabels[t]}</span>
                </label>
              ))}
            </div>
          </div>
          {shipmentType !== 'normal' && (
            <>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:13, color:'#999', marginBottom:4, display:'block' }}>
                  {shipmentType === 'reissue' ? '补发原因' : '重发原因'} <span style={{ color:'#EF4444' }}>*</span>
                </label>
                <textarea
                  className="input-field"
                  style={{ width:'100%', minHeight:64, resize:'vertical' }}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder={shipmentType === 'reissue' ? '请输入补发原因，如：客户反映缺少配件' : '请输入重发原因，如：快递丢失/产品损坏'}
                />
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:13, color:'#999', marginBottom:4, display:'block' }}>附件照片</label>
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:8 }}>
                  {attachmentPhotos.map((f, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 10px', background:'#16181D', borderRadius:4, fontSize:12 }}>
                      <span style={{ color:'#aaa', display:'flex', alignItems:'center', gap:6 }}><FileText size={12} />{f}</span>
                      <button onClick={() => setAttachmentPhotos(attachmentPhotos.filter((_,j)=>j!==i))} style={{ background:'none', border:'none', color:'#EF4444', cursor:'pointer', padding:0 }}><X size={12} /></button>
                    </div>
                  ))}
                </div>
                <button
                  className="btn-secondary"
                  style={{ width:'100%' }}
                  onClick={() => setAttachmentPhotos([...attachmentPhotos, SAMPLE_ATTACHMENTS[attachmentPhotos.length % 3]])}
                >
                  <Upload size={14} /> 上传附件
                </button>
              </div>
            </>
          )}
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:13, color:'#999', marginBottom:4, display:'block' }}>操作人</label>
            <div style={{ position:'relative' }}>
              <input
                className="input-field"
                style={{ width:'100%', paddingLeft:34 }}
                value={operator}
                onChange={e => setOperator(e.target.value)}
                placeholder="输入操作人姓名"
              />
              <User size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#666' }} />
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:13, color:'#999', marginBottom:4, display:'block' }}>关联订单</label>
            <select className="select-field" value={orderId} onChange={e => setOrderId(e.target.value)}>
              <option value="">选择订单</option>
              {orders.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:13, color:'#999', marginBottom:4, display:'block' }}>快递公司</label>
            <select className="select-field" value={courier} onChange={e => setCourier(e.target.value)}>
              <option value="">选择快递</option>
              {COURIERS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:13, color:'#999', marginBottom:4, display:'block' }}>快递单号</label>
            <div style={{ position:'relative' }}>
              <input className="input-field" style={{ width:'100%', paddingRight:36 }} value={trackingNo} onChange={e => setTrackingNo(e.target.value)} placeholder="输入或扫码" />
              <ScanLine size={16} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', color:'#FF6B35', cursor:'pointer' }} />
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, color:'#999', marginBottom:4, display:'block' }}>发货日期</label>
            <input className="input-field" style={{ width:'100%' }} value={new Date().toLocaleDateString('zh-CN')} readOnly />
          </div>
          <button
            className="btn-primary"
            style={{ width:'100%' }}
            onClick={handleSubmit}
            disabled={!inspected||!orderId||!courier||!trackingNo||((shipmentType==='reissue'||shipmentType==='resend')&&!reason.trim())}
          >
            <Truck size={14} /> 提交{shipmentTypeLabels[shipmentType]}
          </button>
        </div>

        <div className="card" style={{ maxHeight:'calc(100vh - 120px)', overflowY:'auto' }}>
          <h3 style={{ marginBottom: 12 }}>发货记录</h3>
          {shipments.map(s => {
            const order = orders.find(o => o.id === s.orderId)
            return (
            <div key={s.id} style={{ background:'#1a1a1a', borderRadius:8, padding:12, marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <span style={{ fontWeight:600 }}>{s.orderId}</span>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <span className={`px-2 py-0.5 rounded text-xs ${shipmentTypeColors[s.shipmentType]}`}>{shipmentTypeLabels[s.shipmentType]}</span>
                  <span style={{ fontSize:12, padding:'2px 8px', borderRadius:10, background:statusColor(s.status)+'22', color:statusColor(s.status) }}>{statusLabel(s.status)}</span>
                </div>
              </div>
              {order && <div style={{ fontSize:12, color:'#666', marginTop:4 }}>{order.customerName} · {order.modelFile}</div>}
              {s.shipmentType !== 'normal' && s.reason && (
                <div style={{ fontSize:12, color:'#F59E0B', marginTop:4, padding:'4px 8px', background:'rgba(245,158,11,0.08)', borderRadius:4, borderLeft:'2px solid #F59E0B' }}>
                  原因：{s.reason.length > 30 ? s.reason.slice(0, 30) + '...' : s.reason}
                </div>
              )}
              <div style={{ fontSize:13, color:'#aaa', marginTop:6 }}><Truck size={12} /> {s.courierCompany} · {s.trackingNo}</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4 }}>
                <div style={{ fontSize:12, color:'#666' }}>{new Date(s.shippedAt).toLocaleDateString('zh-CN')}</div>
                {s.operator && <div style={{ fontSize:12, color:'#666', display:'flex', alignItems:'center', gap:4 }}><User size={10} />{s.operator}</div>}
              </div>
              <div style={{ display:'flex', gap:12, marginTop:8 }}>
                <button onClick={() => setExpandedId(expandedId===s.id ? null : s.id)} style={{ background:'none', border:'none', color:'#FF6B35', cursor:'pointer', fontSize:12, padding:0, display:'flex', alignItems:'center', gap:4 }}>
                  物流跟踪 {expandedId===s.id ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                </button>
                <button onClick={() => { setShowOrderDetailShipmentId(s.id); setDetailTab(s.shipmentType === 'normal' ? 'latest' : s.shipmentType) }} style={{ background:'none', border:'none', color:'#4A90D9', cursor:'pointer', fontSize:12, padding:0, display:'flex', alignItems:'center', gap:4 }}>
                  <FileText size={12} /> 查看订单
                </button>
              </div>
              {expandedId===s.id && (
                <div style={{ marginTop:8, paddingLeft:12, borderLeft:'2px solid #FF6B35' }}>
                  <div style={{ fontSize:12, color:'#999', marginBottom:4 }}><Check size={10} style={{color:'#10B981'}} /> 已揽收 - {new Date(s.shippedAt).toLocaleDateString('zh-CN')}</div>
                  <div style={{ fontSize:12, color:'#999', marginBottom:4 }}><Check size={10} style={{color:'#3B82F6'}} /> 运输中 - {new Date(s.shippedAt).toLocaleDateString('zh-CN')}</div>
                  {s.status==='delivered' && <div style={{ fontSize:12, color:'#999' }}><Check size={10} style={{color:'#10B981'}} /> 已签收 - {new Date(s.shippedAt).toLocaleDateString('zh-CN')}</div>}
                </div>
              )}
            </div>
          )})}
          {shipments.length===0 && <div style={{ textAlign:'center', color:'#555', padding:20 }}>暂无发货记录</div>}
        </div>
      </div>

      {selectedShipment && selectedOrder && (
        <div
          onClick={() => setShowOrderDetailShipmentId(null)}
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
                <Package size={20} style={{ color: '#FF6B35' }} />
                <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>订单详情</h2>
                {isLatestShipment ? (
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: 'rgba(34,197,94,0.2)', color: '#22c55e', fontWeight: 600 }}>最新发货</span>
                ) : (
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: 'rgba(156,163,175,0.2)', color: '#9CA3AF', fontWeight: 600 }}>历史发货</span>
                )}
              </div>
              <button onClick={() => setShowOrderDetailShipmentId(null)} style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#FF6B35', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 3, height: 14, background: '#FF6B35', borderRadius: 2 }}></span>
                    订单信息
                  </h3>
                  <span className={`status-badge ${statusColors[selectedOrder.status]}`} style={{ fontSize: 12, padding: '2px 10px', borderRadius: 10, fontWeight: 600 }}>
                    {statusLabels[selectedOrder.status]}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', background: '#16181D', padding: 14, borderRadius: 8 }}>
                  <div><span style={{ color: '#666', fontSize: 12 }}>订单编号：</span><b style={{ color: '#4A90D9', fontFamily: 'Rajdhani, sans-serif' }}>{selectedOrder.id}</b></div>
                  <div><span style={{ color: '#666', fontSize: 12 }}>模型文件：</span><b style={{ color: '#e5e7eb' }}>{selectedOrder.modelFile}</b></div>
                  <div><span style={{ color: '#666', fontSize: 12 }}>客户名称：</span><b style={{ color: '#e5e7eb' }}>{selectedOrder.customerName}</b></div>
                  <div><span style={{ color: '#666', fontSize: 12 }}>所属公司：</span><b style={{ color: '#e5e7eb' }}>{selectedOrder.company}</b></div>
                  <div><span style={{ color: '#666', fontSize: 12 }}>打印材料：</span><b style={{ color: '#C0A062' }}>{selectedOrder.material}</b></div>
                  <div><span style={{ color: '#666', fontSize: 12 }}>打印工艺：</span><b style={{ color: '#e5e7eb' }}>{selectedOrder.process}</b></div>
                  <div><span style={{ color: '#666', fontSize: 12 }}>数量：</span><b style={{ color: '#e5e7eb' }}>{selectedOrder.quantity} 件</b></div>
                  <div><span style={{ color: '#666', fontSize: 12 }}>表面要求：</span><b style={{ color: '#e5e7eb' }}>{selectedOrder.surfaceFinish}</b></div>
                  <div><span style={{ color: '#666', fontSize: 12 }}>下单时间：</span><b style={{ color: '#e5e7eb' }}>{selectedOrder.createdAt}</b></div>
                  <div><span style={{ color: '#666', fontSize: 12 }}>交付日期：</span><b style={{ color: '#e5e7eb' }}>{selectedOrder.deliveryDate}</b></div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display:'flex', gap:6, borderBottom:'1px solid var(--border-color)', marginBottom:14 }}>
                  {([
                    { key: 'latest' as const, label: '最新发货', count: normalShipments.length, color: '#22c55e' },
                    { key: 'reissue' as const, label: '补发记录', count: reissueShipments.length, color: '#F59E0B' },
                    { key: 'resend' as const, label: '重发记录', count: resendShipments.length, color: '#F97316' },
                  ]).map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setDetailTab(tab.key)}
                      style={{
                        padding:'10px 16px',
                        background:'none',
                        border:'none',
                        cursor:'pointer',
                        fontSize:13,
                        fontWeight: detailTab===tab.key ? 600 : 400,
                        color: detailTab===tab.key ? tab.color : '#666',
                        borderBottom: detailTab===tab.key ? `2px solid ${tab.color}` : '2px solid transparent',
                        marginBottom:-1,
                        transition:'all 0.15s',
                        display:'flex',
                        alignItems:'center',
                        gap:6,
                      }}
                    >
                      {tab.label}
                      <span style={{
                        padding:'1px 6px',
                        borderRadius:10,
                        fontSize:10,
                        background: tab.count > 0 ? `${tab.color}22` : 'transparent',
                        color: tab.count > 0 ? tab.color : '#555',
                      }}>{tab.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {getDisplayShipments().length === 0 ? (
                <div style={{ textAlign:'center', color:'#555', padding:30, background:'#16181D', borderRadius:8 }}>
                  暂无{detailTab === 'latest' ? '正常发货' : detailTab === 'reissue' ? '补发' : '重发'}记录
                </div>
              ) : (
                getDisplayShipments().map((sh, idx) => {
                  const isCurrent = sh.id === selectedShipment.id
                  const isLatest = allShipmentsForOrder[0]?.id === sh.id
                  return (
                    <div
                      key={sh.id}
                      onClick={() => setShowOrderDetailShipmentId(sh.id)}
                      style={{
                        marginBottom: idx < getDisplayShipments().length - 1 ? 12 : 0,
                        padding: 14,
                        borderRadius: 8,
                        background: isCurrent ? 'rgba(74,144,217,0.05)' : '#16181D',
                        border: `1px solid ${isCurrent ? 'rgba(74,144,217,0.3)' : 'var(--border-color)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span className={`px-2 py-0.5 rounded text-xs ${shipmentTypeColors[sh.shipmentType]}`}>{shipmentTypeLabels[sh.shipmentType]}</span>
                          {isLatest && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: 'rgba(34,197,94,0.2)', color: '#22c55e' }}>最新</span>}
                          {isCurrent && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: 'rgba(74,144,217,0.2)', color: '#4A90D9' }}>当前查看</span>}
                        </div>
                        {sh.operator && <span style={{ fontSize:11, color:'#666', display:'flex', alignItems:'center', gap:4 }}><User size={10} />{sh.operator}</span>}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
                        <div><span style={{ color: '#666', fontSize: 12 }}>快递公司：</span><b style={{ color: '#e5e7eb' }}>{sh.courierCompany}</b></div>
                        <div><span style={{ color: '#666', fontSize: 12 }}>快递单号：</span><b style={{ color: '#4A90D9' }}>{sh.trackingNo}</b></div>
                        <div><span style={{ color: '#666', fontSize: 12 }}>发货时间：</span><b style={{ color: isLatest ? '#22c55e' : '#e5e7eb' }}>{new Date(sh.shippedAt).toLocaleString('zh-CN')}</b></div>
                        <div><span style={{ color: '#666', fontSize: 12 }}>发货状态：</span><b style={{ color: statusColor(sh.status) }}>{statusLabel(sh.status)}</b></div>
                      </div>
                      {sh.shipmentType !== 'normal' && sh.reason && (
                        <div style={{ marginTop:10, padding:'8px 10px', background:'rgba(245,158,11,0.08)', borderRadius:4, borderLeft:'2px solid #F59E0B' }}>
                          <div style={{ fontSize:11, color:'#F59E0B', marginBottom:2 }}>{sh.shipmentType === 'reissue' ? '补发原因' : '重发原因'}</div>
                          <div style={{ fontSize:12, color:'#d1d5db' }}>{sh.reason}</div>
                        </div>
                      )}
                      {sh.attachmentPhotos && sh.attachmentPhotos.length > 0 && (
                        <div style={{ marginTop:10 }}>
                          <div style={{ fontSize:11, color:'#666', marginBottom:6 }}>附件照片 ({sh.attachmentPhotos.length})</div>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                            {sh.attachmentPhotos.map((f, i) => (
                              <div key={i} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', background:'#111', borderRadius:4, fontSize:11 }}>
                                <FileText size={10} style={{ color:'#FF6B35' }} />
                                <span style={{ color:'#aaa' }}>{f}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {sh.photos && sh.photos.length > 0 && (
                        <div style={{ marginTop:10 }}>
                          <div style={{ fontSize:11, color:'#666', marginBottom:6 }}>开箱照片 ({sh.photos.length})</div>
                          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                            {sh.photos.map((p, i) => (
                              <div key={i} style={{ width:48, height:48, borderRadius:4, overflow:'hidden', background:'#111' }}>
                                <img src={p} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}

              {allShipmentsForOrder.length > 1 && (
                <div style={{ marginTop: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#FF6B35', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 3, height: 14, background: '#FF6B35', borderRadius: 2 }}></span>
                    全部发货记录 ({allShipmentsForOrder.length} 条)
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {allShipmentsForOrder.map((sh, idx) => {
                      const isCurrent = sh.id === selectedShipment.id
                      const isLatest = idx === 0
                      return (
                        <div
                          key={sh.id}
                          onClick={() => { setShowOrderDetailShipmentId(sh.id); setDetailTab(sh.shipmentType === 'normal' ? 'latest' : sh.shipmentType) }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 6,
                            background: isCurrent ? 'rgba(74,144,217,0.1)' : '#16181D',
                            border: `1px solid ${isCurrent ? 'rgba(74,144,217,0.4)' : 'var(--border-color)'}`,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: 12,
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Truck size={12} style={{ color: isCurrent ? '#4A90D9' : '#666' }} />
                            <span className={`px-1.5 py-0.5 rounded text-xs ${shipmentTypeColors[sh.shipmentType]}`}>{shipmentTypeLabels[sh.shipmentType]}</span>
                            <span style={{ color: isCurrent ? '#4A90D9' : '#e5e7eb', fontWeight: isCurrent ? 600 : 400 }}>{sh.courierCompany} · {sh.trackingNo}</span>
                            {isLatest && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: 'rgba(34,197,94,0.2)', color: '#22c55e' }}>最新</span>}
                            {isCurrent && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: 'rgba(74,144,217,0.2)', color: '#4A90D9' }}>当前</span>}
                          </div>
                          <span style={{ color: '#666' }}>{new Date(sh.shippedAt).toLocaleDateString('zh-CN')}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 20, background: 'linear-gradient(135deg, rgba(255,107,53,0.1), rgba(255,107,53,0.05))', padding: 16, borderRadius: 8, border: '1px solid rgba(255,107,53,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#999', fontSize: 13 }}>订单金额</span>
                  <span className="font-display" style={{ fontSize: 24, fontWeight: 700, color: '#FF6B35' }}>¥{selectedOrder.quotePrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid var(--border-color)' }}>
              <button className="btn-secondary" onClick={() => setShowOrderDetailShipmentId(null)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
