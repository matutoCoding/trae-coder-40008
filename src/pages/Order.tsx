import { useState } from 'react'
import { Upload, FileText, Package, Calendar, Hash, Layers, Sparkles, X } from 'lucide-react'
import { useStore } from '@/store'

const MATERIALS = ['Ti6Al4V', '316L', 'AlSi10Mg', 'In718', 'H13', 'CoCr']
const PROCESSES = ['SLM', 'DMLS', 'EBM']
const FINISHES = ['Ra0.4', 'Ra0.8', 'Ra1.6', 'Ra3.2', 'Ra6.3']
const PRICE_MAP: Record<string, number> = { Ti6Al4V: 800, '316L': 350, AlSi10Mg: 280, In718: 1200, H13: 650, CoCr: 950 }
const PROCESS_MAP: Record<string, number> = { SLM: 1.0, DMLS: 1.2, EBM: 1.5 }
const FINISH_MAP: Record<string, number> = { 'Ra0.4': 2.0, 'Ra0.8': 1.5, 'Ra1.6': 1.0, 'Ra3.2': 0.8, 'Ra6.3': 0.5 }

export default function Order() {
  const addOrder = useStore((s) => s.addOrder)
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
      <div className="flex items-center justify-center h-full">
        <div className="card p-12 text-center animate-fade-in">
          <Sparkles className="w-16 h-16 mx-auto mb-4" style={{ color: '#FF6B35' }} />
          <h2 className="text-2xl font-bold mb-2">订单提交成功</h2>
          <p className="text-[var(--text-secondary)] mb-6">我们将尽快安排模型检测与报价确认</p>
          <button className="btn-primary" onClick={() => { setSubmitted(false); setForm({ customerName: '', phone: '', company: '', modelFile: '', material: 'Ti6Al4V', process: 'SLM', surfaceFinish: 'Ra1.6', quantity: 1, deliveryDate: '' }) }}>
            继续下单
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6 font-display tracking-wide">在线下单</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
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
    </div>
  )
}
