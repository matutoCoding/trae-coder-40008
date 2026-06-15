import { useState, useEffect, useMemo } from 'react'
import { useStore } from '@/store'
import { Package, ClipboardList, AlertTriangle, User, ArrowRight, ChevronDown, Plus, X } from 'lucide-react'

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待分配', className: 'status-badge pending' },
  allocated: { label: '已分配', className: 'status-badge allocated' },
  picked: { label: '已领用', className: 'status-badge picked' },
}

export default function Material() {
  const [tab, setTab] = useState<'stock' | 'tasks'>('stock')
  const {
    materialStock,
    materialTasks,
    updateMaterialTaskStatus,
    updateMaterialStock,
    orders,
    selectedOrderId,
    clearSelectedOrderId,
    addMaterialTask,
  } = useStore()

  const [selectedOrder, setSelectedOrder] = useState<string>('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({
    powderType: '',
    materialId: '',
    requiredQty: 0,
  })

  useEffect(() => {
    const storeSelectedId = useStore.getState().selectedOrderId
    if (storeSelectedId) {
      setSelectedOrder(storeSelectedId)
      setTab('tasks')
      const existingTask = materialTasks.find(t => t.orderId === storeSelectedId)
      if (!existingTask) {
        const order = orders.find(o => o.id === storeSelectedId)
        if (order) {
          const stockItem = materialStock.find(m => m.powderType.includes(order.material))
          setCreateForm({
            powderType: stockItem?.powderType ?? order.material,
            materialId: stockItem?.id ?? '',
            requiredQty: order.quantity * 2,
          })
          setShowCreateForm(true)
        }
      }
      clearSelectedOrderId()
    }
  }, [selectedOrderId])

  useEffect(() => {
    if (selectedOrder) {
      const existingTask = materialTasks.find(t => t.orderId === selectedOrder)
      if (!existingTask && tab === 'tasks') {
        const order = orders.find(o => o.id === selectedOrder)
        if (order) {
          const stockItem = materialStock.find(m => m.powderType.includes(order.material))
          setCreateForm({
            powderType: stockItem?.powderType ?? order.material,
            materialId: stockItem?.id ?? '',
            requiredQty: order.quantity * 2,
          })
        }
      }
    }
  }, [selectedOrder, tab])

  const existingTask = useMemo(
    () => materialTasks.find(t => t.orderId === selectedOrder),
    [materialTasks, selectedOrder]
  )

  const handleOrderChange = (orderId: string) => {
    setSelectedOrder(orderId)
    const task = materialTasks.find(t => t.orderId === orderId)
    if (!task && orderId) {
      const order = orders.find(o => o.id === orderId)
      if (order) {
        const stockItem = materialStock.find(m => m.powderType.includes(order.material))
        setCreateForm({
          powderType: stockItem?.powderType ?? order.material,
          materialId: stockItem?.id ?? '',
          requiredQty: order.quantity * 2,
        })
        setShowCreateForm(true)
      }
    } else {
      setShowCreateForm(false)
    }
  }

  const handleCreateTask = () => {
    if (!selectedOrder || !createForm.powderType) return
    addMaterialTask({
      orderId: selectedOrder,
      materialId: createForm.materialId,
      powderType: createForm.powderType,
      requiredQty: createForm.requiredQty,
      status: 'pending',
      operator: '',
    })
    setShowCreateForm(false)
  }

  return (
    <div className="page">
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

      {tab === 'tasks' && (
        <div className="card" style={{ padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>订单筛选：</span>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedOrder}
                onChange={e => handleOrderChange(e.target.value)}
                style={{ appearance: 'none', paddingRight: 28, color: '#e5e7eb', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '6px 28px 6px 10px', fontSize: 13, minWidth: 240 }}
              >
                <option value="">全部订单</option>
                {orders.map(o => <option key={o.id} value={o.id}>{o.id} - {o.customerName} ({o.material})</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            </div>
          </div>
          {selectedOrder && !existingTask && (
            <button className="btn-primary" onClick={() => setShowCreateForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: 13 }}>
              <Plus size={14} /> 创建备料任务
            </button>
          )}
        </div>
      )}

      {tab === 'tasks' && showCreateForm && (
        <div className="card" style={{ marginBottom: 16, padding: 16, border: '1px solid rgba(255,107,53,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: '#FF6B35' }}>
              <Plus size={16} /> 创建备料任务
              {selectedOrder && <span style={{ fontSize: 12, color: '#4A90D9', marginLeft: 8 }}>订单 {selectedOrder}</span>}
            </h3>
            <button onClick={() => setShowCreateForm(false)} style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', padding: 4 }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1"><Package size={12} /> 粉末类型</label>
              <select
                className="select-field"
                value={createForm.powderType}
                onChange={e => {
                  const powder = e.target.value
                  const stock = materialStock.find(m => m.powderType === powder)
                  setCreateForm(f => ({ ...f, powderType: powder, materialId: stock?.id ?? '' }))
                }}
              >
                <option value="">请选择粉末类型</option>
                {materialStock.map(m => <option key={m.id} value={m.powderType}>{m.powderType} (库存: {m.quantity}{m.unit})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1">需求数量 (kg)</label>
              <input
                type="number"
                className="input-field"
                min={0}
                step={0.5}
                value={createForm.requiredQty}
                onChange={e => setCreateForm(f => ({ ...f, requiredQty: Math.max(0, +e.target.value) }))}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn-primary w-full" onClick={handleCreateTask} disabled={!createForm.powderType || createForm.requiredQty <= 0}>
                <Plus size={14} /> 确认创建
              </button>
            </div>
          </div>
        </div>
      )}

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
          {materialTasks
            .filter(t => !selectedOrder || t.orderId === selectedOrder)
            .map((task) => {
              const st = statusMap[task.status]
              const isHighlighted = selectedOrder && task.orderId === selectedOrder
              return (
                <div
                  className="card"
                  key={task.id}
                  style={{
                    border: isHighlighted ? '2px solid #FF6B35' : undefined,
                    boxShadow: isHighlighted ? '0 0 12px rgba(255,107,53,0.25)' : undefined,
                  }}
                >
                  <div className="card-top">
                    <span className="order-id">
                      工单 {task.orderId}
                      {isHighlighted && <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 8, background: 'rgba(255,107,53,0.2)', color: '#FF6B35', fontWeight: 600, marginLeft: 8 }}>当前选中</span>}
                    </span>
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
          {materialTasks.filter(t => !selectedOrder || t.orderId === selectedOrder).length === 0 && !showCreateForm && (
            <div className="card" style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
              <ClipboardList size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: 13, marginBottom: 16 }}>暂无备料任务</p>
              {selectedOrder && (
                <button className="btn-primary" onClick={() => setShowCreateForm(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={14} /> 立即创建备料任务
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
