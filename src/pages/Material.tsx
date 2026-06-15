import { useState } from 'react'
import { useStore } from '@/store'
import { Package, ClipboardList, AlertTriangle, User, ArrowRight } from 'lucide-react'

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待分配', className: 'status-badge pending' },
  allocated: { label: '已分配', className: 'status-badge allocated' },
  picked: { label: '已领用', className: 'status-badge picked' },
}

export default function Material() {
  const [tab, setTab] = useState<'stock' | 'tasks'>('stock')
  const { materialStock, materialTasks, updateMaterialTaskStatus, updateMaterialStock } = useStore()

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>材料备料</h1>
        <div className="tabs">
          <button className={`tab ${tab === 'stock' ? 'active' : ''}`} onClick={() => setTab('stock')}>
            <Package size={16} /> 粉末库存
          </button>
          <button className={`tab ${tab === 'tasks' ? 'active' : ''}`} onClick={() => setTab('tasks')}>
            <ClipboardList size={16} /> 备料任务
          </button>
        </div>
      </div>

      {tab === 'stock' ? (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>粉末类型</th>
                <th>库存量</th>
                <th>批次号</th>
                <th>供应商</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {materialStock.map((item) => {
                const ratio = item.quantity / (item.threshold * 3)
                const below = item.quantity < item.threshold
                return (
                  <tr key={item.id}>
                    <td className="fw-500">{item.powderType}</td>
                    <td>
                      <div className="stock-cell">
                        <span>{item.quantity}{item.unit}</span>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(ratio * 100, 100)}%`,
                              background: below ? '#EF4444' : '#FF6B35',
                            }}
                          />
                        </div>
                        {below && <AlertTriangle size={14} color="#EF4444" />}
                      </div>
                    </td>
                    <td>{item.batchNo}</td>
                    <td>{item.supplier}</td>
                    <td>
                      <button className="btn-secondary" onClick={() => updateMaterialStock(item.id, item.quantity + 50)}>
                        补库
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card-list">
          {materialTasks.map((task) => {
            const st = statusMap[task.status]
            return (
              <div className="card" key={task.id}>
                <div className="card-top">
                  <span className="order-id">工单 {task.orderId}</span>
                  <span className={st.className}>{st.label}</span>
                </div>
                <div className="card-body">
                  <div className="info-row">
                    <span className="label">粉末类型</span>
                    <span className="value">{task.powderType}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">需求数量</span>
                    <span className="value">{task.requiredQty}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">操作员</span>
                    <span className="value"><User size={14} /> {task.operator || '—'}</span>
                  </div>
                </div>
                <div className="card-actions">
                  {task.status === 'pending' && (
                    <button className="btn-primary" onClick={() => updateMaterialTaskStatus(task.id, 'allocated')}>
                      分配 <ArrowRight size={14} />
                    </button>
                  )}
                  {task.status === 'allocated' && (
                    <button className="btn-primary" onClick={() => updateMaterialTaskStatus(task.id, 'picked')}>
                      领用 <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
