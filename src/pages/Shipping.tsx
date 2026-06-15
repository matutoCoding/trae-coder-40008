import { useState } from 'react'
import { useStore } from '@/store'
import { Camera, Package, Truck, Check, X, ChevronDown, ChevronUp, ScanLine } from 'lucide-react'

const COURIERS = ['顺丰速运', '中通快递', '圆通速递', '京东物流', '德邦物流']
const SAMPLE_PHOTOS = ['/photos/sample1.jpg', '/photos/sample2.jpg', '/photos/sample3.jpg']

export default function Shipping() {
  const { shipments, orders, addShipment, updateShipment } = useStore()
  const [photos, setPhotos] = useState<string[]>([])
  const [orderId, setOrderId] = useState('')
  const [inspected, setInspected] = useState(false)
  const [courier, setCourier] = useState('')
  const [trackingNo, setTrackingNo] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleSubmit = () => {
    if (!orderId || !inspected || !courier || !trackingNo) return
    addShipment({ orderId, photos, courierCompany: courier, trackingNo, shippedAt: new Date().toISOString(), status: 'shipped' })
    setPhotos([]); setOrderId(''); setInspected(false); setCourier(''); setTrackingNo('')
  }

  const statusLabel = (s: string) => s === 'shipped' ? '已发货' : s === 'delivered' ? '已签收' : '待发货'
  const statusColor = (s: string) => s === 'shipped' ? '#3B82F6' : s === 'delivered' ? '#10B981' : '#F59E0B'

  return (
    <div className="page">
      <div className="page-header"><Package size={22} /> 成品发货</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 20 }}>
        {/* 左侧：产品拍照 */}
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>产品拍照</h3>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1', background: '#111', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* 取景器角标 */}
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

        {/* 中间：发货表单 */}
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>发货信息</h3>
          <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, cursor:'pointer' }}>
            <input type="checkbox" checked={inspected} onChange={e => setInspected(e.target.checked)} style={{ accentColor:'#FF6B35' }} />
            <span>终检确认合格</span>
          </label>
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
          <button className="btn-primary" style={{ width:'100%' }} onClick={handleSubmit} disabled={!inspected||!orderId||!courier||!trackingNo}>
            <Truck size={14} /> 提交发货
          </button>
        </div>

        {/* 右侧：发货记录 */}
        <div className="card" style={{ maxHeight:'calc(100vh - 120px)', overflowY:'auto' }}>
          <h3 style={{ marginBottom: 12 }}>发货记录</h3>
          {shipments.map(s => (
            <div key={s.id} style={{ background:'#1a1a1a', borderRadius:8, padding:12, marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontWeight:600 }}>{s.orderId}</span>
                <span style={{ fontSize:12, padding:'2px 8px', borderRadius:10, background:statusColor(s.status)+'22', color:statusColor(s.status) }}>{statusLabel(s.status)}</span>
              </div>
              <div style={{ fontSize:13, color:'#aaa', marginTop:6 }}><Truck size={12} /> {s.courierCompany} · {s.trackingNo}</div>
              <div style={{ fontSize:12, color:'#666', marginTop:4 }}>{new Date(s.shippedAt).toLocaleDateString('zh-CN')}</div>
              <button onClick={() => setExpandedId(expandedId===s.id ? null : s.id)} style={{ background:'none', border:'none', color:'#FF6B35', cursor:'pointer', fontSize:12, marginTop:6, padding:0, display:'flex', alignItems:'center', gap:4 }}>
                物流跟踪 {expandedId===s.id ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
              </button>
              {expandedId===s.id && (
                <div style={{ marginTop:8, paddingLeft:12, borderLeft:'2px solid #FF6B35' }}>
                  <div style={{ fontSize:12, color:'#999', marginBottom:4 }}><Check size={10} style={{color:'#10B981'}} /> 已揽收 - {new Date(s.shippedAt).toLocaleDateString('zh-CN')}</div>
                  <div style={{ fontSize:12, color:'#999', marginBottom:4 }}><Check size={10} style={{color:'#3B82F6'}} /> 运输中 - {new Date(s.shippedAt).toLocaleDateString('zh-CN')}</div>
                  {s.status==='delivered' && <div style={{ fontSize:12, color:'#999' }}><Check size={10} style={{color:'#10B981'}} /> 已签收 - {new Date(s.shippedAt).toLocaleDateString('zh-CN')}</div>}
                </div>
              )}
            </div>
          ))}
          {shipments.length===0 && <div style={{ textAlign:'center', color:'#555', padding:20 }}>暂无发货记录</div>}
        </div>
      </div>
    </div>
  )
}
