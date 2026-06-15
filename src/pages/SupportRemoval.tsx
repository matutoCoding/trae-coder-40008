import { useState } from 'react'
import { useStore } from '@/store'
import { Scissors, Droplets, Wrench, ChevronDown } from 'lucide-react'

const methodConfig = {
  'wire-cut': { icon: <Scissors size={22} />, label: '线切割', desc: '高精度电火花线切割，适合复杂支撑结构' },
  'acid': { icon: <Droplets size={22} />, label: '酸溶', desc: '化学溶解支撑，适合内腔复杂区域' },
  'manual': { icon: <Wrench size={22} />, label: '手工', desc: '钳工手工去除，适合简单外露支撑' },
}
const statusSteps = ['pending', 'in-progress', 'completed'] as const
const statusLabel: Record<string, string> = { pending: '待处理', 'in-progress': '进行中', completed: '已完成' }

export default function SupportRemoval() {
  const { supportRemovals, orders, updateSupportRemoval } = useStore()
  const [selectedId, setSelectedId] = useState(supportRemovals[0]?.id ?? '')
  const [method, setMethod] = useState<string>(supportRemovals[0]?.removalMethod ?? 'wire-cut')
  const [operator, setOperator] = useState(supportRemovals[0]?.operator ?? '')

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

  return (
    <div className="page">
      <div className="page-header">
        <h1>支撑去除</h1>
      </div>

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
            <div style={{ fontSize: 13, color: '#94a3b8' }}>订单编号: <b style={{ color: '#e5e7eb' }}>{order?.id ?? '-'}</b></div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>材料: <b style={{ color: '#e5e7eb' }}>{order?.material ?? '-'}</b></div>
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
    </div>
  )
}
