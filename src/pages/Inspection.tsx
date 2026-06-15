import { useState } from 'react'
import { useStore } from '@/store'
import { RotateCw, ZoomIn, Scissors, Box, AlertTriangle, Info, ShieldAlert, ChevronDown, FileCheck } from 'lucide-react'

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

export default function Inspection() {
  const { inspections, orders } = useStore()
  const [selectedOrderId, setSelectedOrderId] = useState(orders[1]?.id ?? '')
  const inspection = inspections.find(i => i.orderId === selectedOrderId)
  const order = orders.find(o => o.id === selectedOrderId)

  return (
    <div className="page">
      <div className="page-header">
        <h1>模型检查</h1>
        <div style={{ position: 'relative' }}>
          <select
            value={selectedOrderId}
            onChange={e => setSelectedOrderId(e.target.value)}
            className="btn-secondary"
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
            <div style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: 40 }}>暂无检查数据</div>
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
        <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#94a3b8' }}>
          <span>检查员: <b style={{ color: '#e5e7eb' }}>{inspection?.inspector ?? '-'}</b></span>
          <span>检查时间: <b style={{ color: '#e5e7eb' }}>{inspection?.inspectedAt ?? '-'}</b></span>
          <span>订单: <b style={{ color: '#e5e7eb' }}>{order?.modelFile ?? '-'}</b></span>
        </div>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', fontSize: 13, background: '#4A90D9', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
          <FileCheck size={15} /> 生成检查报告
        </button>
      </div>
    </div>
  )
}
