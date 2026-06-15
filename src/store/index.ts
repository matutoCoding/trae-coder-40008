import { create } from 'zustand'

export interface Order {
  id: string
  customerName: string
  phone: string
  company: string
  modelFile: string
  material: string
  process: string
  status: 'pending' | 'inspecting' | 'preparing' | 'printing' | 'removing' | 'processing' | 'shipping' | 'completed'
  quotePrice: number
  createdAt: string
  quantity: number
  surfaceFinish: string
  deliveryDate: string
  shippedAt?: string
}

export interface ModelInspection {
  id: string
  orderId: string
  isPassed: boolean
  defectCount: number
  defects: DefectItem[]
  inspectedAt: string
  inspector: string
}

export interface DefectItem {
  type: 'non-manifold' | 'normal-flip' | 'thin-wall' | 'overlap'
  severity: 'critical' | 'warning' | 'info'
  description: string
  count: number
}

export interface MaterialStock {
  id: string
  powderType: string
  quantity: number
  unit: string
  batchNo: string
  supplier: string
  threshold: number
}

export interface MaterialTask {
  id: string
  orderId: string
  materialId: string
  powderType: string
  requiredQty: number
  status: 'pending' | 'allocated' | 'picked'
  operator: string
}

export interface PrintJob {
  id: string
  orderId: string
  laserPower: number
  scanSpeed: number
  layerThickness: number
  scanStrategy: string
  status: 'queued' | 'printing' | 'paused' | 'completed'
  currentLayer: number
  totalLayers: number
  startedAt: string
  chamberTemp: number
  oxygenLevel: number
}

export interface PrintMonitorRecord {
  id: string
  printJobId: string
  layerNo: number
  actualPower: number
  actualThickness: number
  chamberTemp: number
  oxygenLevel: number
  recordedAt: string
}

export interface SupportRemoval {
  id: string
  orderId: string
  removalMethod: 'wire-cut' | 'acid' | 'manual'
  status: 'pending' | 'in-progress' | 'completed'
  operator: string
  startedAt: string
  completedAt: string
}

export interface PostProcess {
  id: string
  orderId: string
  sandblastPressure: number
  sandblastMedia: string
  sandblastDuration: number
  polishingMethod: string
  targetRoughness: number
  actualRoughness: number
  qualityResult: 'pass' | 'rework' | 'scrap' | ''
  operator: string
  dimensions: DimensionCheck[]
}

export interface DimensionCheck {
  name: string
  targetValue: number
  actualValue: number
  tolerance: number
  result: 'pass' | 'fail'
}

export interface Shipment {
  id: string
  orderId: string
  photos: string[]
  courierCompany: string
  trackingNo: string
  shippedAt: string
  status: 'pending' | 'shipped' | 'delivered'
}

const generateId = () => `MF${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`

const mockOrders: Order[] = [
  { id: 'MF20240001', customerName: '张明', phone: '138****5678', company: '航天精密制造有限公司', modelFile: 'turbine_blade.stl', material: 'Ti6Al4V', process: 'SLM', status: 'printing', quotePrice: 12800, createdAt: '2024-12-01', quantity: 5, surfaceFinish: 'Ra1.6', deliveryDate: '2024-12-15' },
  { id: 'MF20240002', customerName: '李伟', phone: '139****1234', company: '鼎盛医疗科技', modelFile: 'implant_hip.stl', material: '316L', process: 'DMLS', status: 'inspecting', quotePrice: 8500, createdAt: '2024-12-03', quantity: 2, surfaceFinish: 'Ra0.8', deliveryDate: '2024-12-18' },
  { id: 'MF20240003', customerName: '王芳', phone: '137****9876', company: '中航动力集团', modelFile: 'combustor.stl', material: 'In718', process: 'SLM', status: 'preparing', quotePrice: 35000, createdAt: '2024-12-05', quantity: 1, surfaceFinish: 'Ra3.2', deliveryDate: '2024-12-25' },
  { id: 'MF20240004', customerName: '赵刚', phone: '136****5432', company: '博远汽车零部件', modelFile: 'bracket.stl', material: 'AlSi10Mg', process: 'SLM', status: 'removing', quotePrice: 3200, createdAt: '2024-12-02', quantity: 20, surfaceFinish: 'Ra6.3', deliveryDate: '2024-12-12' },
  { id: 'MF20240005', customerName: '陈丽', phone: '135****8765', company: '精铸模具厂', modelFile: 'mold_core.stl', material: 'H13', process: 'DMLS', status: 'processing', quotePrice: 22000, createdAt: '2024-11-28', quantity: 3, surfaceFinish: 'Ra0.4', deliveryDate: '2024-12-10' },
  { id: 'MF20240006', customerName: '刘强', phone: '133****3210', company: '华创电子科技', modelFile: 'heat_sink.stl', material: 'AlSi10Mg', process: 'SLM', status: 'shipping', quotePrice: 5600, createdAt: '2024-11-25', quantity: 10, surfaceFinish: 'Ra3.2', deliveryDate: '2024-12-08' },
]

const mockMaterialStock: MaterialStock[] = [
  { id: 'MAT001', powderType: 'Ti6Al4V 钛合金', quantity: 85, unit: 'kg', batchNo: 'Ti-2024-089', supplier: 'Sandvik', threshold: 20 },
  { id: 'MAT002', powderType: '316L 不锈钢', quantity: 120, unit: 'kg', batchNo: 'SS-2024-156', supplier: 'Höganäs', threshold: 30 },
  { id: 'MAT003', powderType: 'AlSi10Mg 铝合金', quantity: 45, unit: 'kg', batchNo: 'AL-2024-078', supplier: 'EOS', threshold: 25 },
  { id: 'MAT004', powderType: 'In718 高温合金', quantity: 15, unit: 'kg', batchNo: 'IN-2024-034', supplier: 'AP&C', threshold: 20 },
  { id: 'MAT005', powderType: 'H13 模具钢', quantity: 60, unit: 'kg', batchNo: 'H13-2024-045', supplier: 'Carpenter', threshold: 15 },
  { id: 'MAT006', powderType: 'CoCr 钴铬合金', quantity: 30, unit: 'kg', batchNo: 'CC-2024-023', supplier: 'Sandvik', threshold: 10 },
]

const mockPrintJobs: PrintJob[] = [
  { id: 'PJ001', orderId: 'MF20240001', laserPower: 285, scanSpeed: 1200, layerThickness: 30, scanStrategy: '条纹扫描', status: 'printing', currentLayer: 1847, totalLayers: 3200, startedAt: '2024-12-06 08:30', chamberTemp: 82, oxygenLevel: 0.012 },
  { id: 'PJ002', orderId: 'MF20240003', laserPower: 250, scanSpeed: 900, layerThickness: 40, scanStrategy: '棋盘扫描', status: 'queued', currentLayer: 0, totalLayers: 4500, startedAt: '', chamberTemp: 25, oxygenLevel: 0.0 },
]

const mockMaterialTasks: MaterialTask[] = [
  { id: 'MT001', orderId: 'MF20240001', materialId: 'MAT001', powderType: 'Ti6Al4V 钛合金', requiredQty: 5, status: 'picked', operator: '陈工' },
  { id: 'MT002', orderId: 'MF20240003', materialId: 'MAT004', powderType: 'In718 高温合金', requiredQty: 8, status: 'allocated', operator: '王工' },
  { id: 'MT003', orderId: 'MF20240002', materialId: 'MAT002', powderType: '316L 不锈钢', requiredQty: 2, status: 'pending', operator: '' },
]

const mockInspections: ModelInspection[] = [
  { id: 'INS001', orderId: 'MF20240001', isPassed: true, defectCount: 2, defects: [{ type: 'thin-wall', severity: 'warning', description: '叶片前缘壁厚0.3mm，建议加厚至0.5mm', count: 1 }, { type: 'normal-flip', severity: 'info', description: '底部平面法线方向不一致，已自动修正', count: 3 }], inspectedAt: '2024-12-04 14:20', inspector: '刘工' },
  { id: 'INS002', orderId: 'MF20240002', isPassed: false, defectCount: 3, defects: [{ type: 'non-manifold', severity: 'critical', description: '髋臼杯内壁存在非流形边，需要修复', count: 2 }, { type: 'thin-wall', severity: 'warning', description: '多孔结构部分区域壁厚不足0.2mm', count: 5 }, { type: 'normal-flip', severity: 'info', description: '外表面3处法线翻转', count: 3 }], inspectedAt: '2024-12-05 09:15', inspector: '刘工' },
]

const mockSupportRemovals: SupportRemoval[] = [
  { id: 'SR001', orderId: 'MF20240004', removalMethod: 'wire-cut', status: 'in-progress', operator: '赵师傅', startedAt: '2024-12-07 10:00', completedAt: '' },
]

const mockPostProcesses: PostProcess[] = [
  { id: 'PP001', orderId: 'MF20240005', sandblastPressure: 0.6, sandblastMedia: 'Al2O3 120#', sandblastDuration: 25, polishingMethod: '电解抛光', targetRoughness: 0.4, actualRoughness: 0.35, qualityResult: '', operator: '李师傅', dimensions: [{ name: '型腔长度', targetValue: 150.00, actualValue: 150.02, tolerance: 0.05, result: 'pass' }, { name: '型腔宽度', targetValue: 80.00, actualValue: 79.97, tolerance: 0.05, result: 'pass' }, { name: '定位孔直径', targetValue: 12.00, actualValue: 12.04, tolerance: 0.03, result: 'fail' }] },
]

const mockShipments: Shipment[] = [
  { id: 'SH001', orderId: 'MF20240006', photos: ['photo_front.jpg', 'photo_side.jpg', 'photo_detail.jpg'], courierCompany: '顺丰速运', trackingNo: 'SF1234567890', shippedAt: '2024-12-08T16:30:00.000Z', status: 'shipped' },
]

const STORAGE_KEY = 'metalforge-pro-data-v1'

type StoredState = {
  orders: Order[]
  inspections: ModelInspection[]
  materialStock: MaterialStock[]
  materialTasks: MaterialTask[]
  printJobs: PrintJob[]
  printMonitor: PrintMonitorRecord[]
  supportRemovals: SupportRemoval[]
  postProcesses: PostProcess[]
  shipments: Shipment[]
}

const initialMock: StoredState = {
  orders: mockOrders,
  inspections: mockInspections,
  materialStock: mockMaterialStock,
  materialTasks: mockMaterialTasks,
  printJobs: mockPrintJobs,
  printMonitor: [],
  supportRemovals: mockSupportRemovals,
  postProcesses: mockPostProcesses,
  shipments: mockShipments,
}

const loadFromStorage = (): StoredState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredState
  } catch {
    return null
  }
}

const saveToStorage = (state: StoredState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

const seedState = loadFromStorage() ?? initialMock

interface AppState extends StoredState {
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => string
  updateOrderStatus: (id: string, status: Order['status']) => void
  updateOrder: (id: string, updates: Partial<Order>) => void
  addInspection: (inspection: Omit<ModelInspection, 'id'>) => string
  createInspectionForOrder: (orderId: string) => string
  updateMaterialStock: (id: string, quantity: number) => void
  addMaterialTask: (task: Omit<MaterialTask, 'id'>) => void
  updateMaterialTaskStatus: (id: string, status: MaterialTask['status'], operator?: string) => void
  addPrintJob: (job: Omit<PrintJob, 'id' | 'currentLayer' | 'startedAt'>) => void
  updatePrintJob: (id: string, updates: Partial<PrintJob>) => void
  addPrintMonitorRecord: (record: Omit<PrintMonitorRecord, 'id'>) => void
  addSupportRemoval: (removal: Omit<SupportRemoval, 'id'>) => void
  updateSupportRemoval: (id: string, updates: Partial<SupportRemoval>) => void
  addPostProcess: (process: Omit<PostProcess, 'id'>) => string
  updatePostProcess: (id: string, updates: Partial<PostProcess>) => void
  addShipment: (shipment: Omit<Shipment, 'id'>) => void
  updateShipment: (id: string, updates: Partial<Shipment>) => void
}

const printStatusToOrderStatus = (printStatus: PrintJob['status']): Order['status'] | null => {
  switch (printStatus) {
    case 'printing':
    case 'paused':
      return 'printing'
    case 'completed':
      return 'removing'
    default:
      return null
  }
}

export const useStore = create<AppState>((set, get) => ({
  ...seedState,

  addOrder: (order) => {
    const id = generateId()
    set((state) => {
      const next = {
        ...state,
        orders: [...state.orders, { ...order, id, createdAt: new Date().toISOString().split('T')[0], status: 'pending' as const }]
      }
      saveToStorage(next)
      return next
    })
    return id
  },

  updateOrderStatus: (id, status) => {
    set((state) => {
      const next = {
        ...state,
        orders: state.orders.map(o => o.id === id ? { ...o, status } : o)
      }
      saveToStorage(next)
      return next
    })
  },

  updateOrder: (id, updates) => {
    set((state) => {
      const next = {
        ...state,
        orders: state.orders.map(o => o.id === id ? { ...o, ...updates } : o)
      }
      saveToStorage(next)
      return next
    })
  },

  addInspection: (inspection) => {
    const id = generateId()
    set((state) => {
      const next = {
        ...state,
        inspections: [...state.inspections, { ...inspection, id }]
      }
      saveToStorage(next)
      return next
    })
    return id
  },

  createInspectionForOrder: (orderId) => {
    const id = generateId()
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const inspectors = ['刘工', '陈工', '王工', '张工', '李工']
    const inspector = inspectors[Math.floor(Math.random() * inspectors.length)]
    const defectTemplates = [
      { type: 'non-manifold' as const, severity: 'critical' as const, description: '模型存在非流形边，需要修复', count: 1 + Math.floor(Math.random() * 3) },
      { type: 'normal-flip' as const, severity: 'info' as const, description: '部分面法线方向不一致，已自动修正', count: 2 + Math.floor(Math.random() * 5) },
      { type: 'thin-wall' as const, severity: 'warning' as const, description: '局部区域壁厚偏薄，建议加厚', count: 1 + Math.floor(Math.random() * 2) },
      { type: 'overlap' as const, severity: 'info' as const, description: '存在重叠面，已自动合并', count: 1 + Math.floor(Math.random() * 4) },
    ]
    const defectCount = 1 + Math.floor(Math.random() * 3)
    const shuffled = [...defectTemplates].sort(() => Math.random() - 0.5)
    const defects = shuffled.slice(0, defectCount)
    const totalDefectCount = defects.reduce((sum, d) => sum + d.count, 0)
    const isPassed = !defects.some(d => d.severity === 'critical') && totalDefectCount <= 8
    set((state) => {
      const next = {
        ...state,
        inspections: [...state.inspections, {
          id,
          orderId,
          isPassed,
          defectCount: totalDefectCount,
          defects,
          inspectedAt: dateStr,
          inspector,
        }],
        orders: state.orders.map(o =>
          o.id === orderId
            ? { ...o, status: isPassed ? 'preparing' as const : 'inspecting' as const }
            : o
        ),
      }
      saveToStorage(next)
      return next
    })
    return id
  },

  updateMaterialStock: (id, quantity) => {
    set((state) => {
      const next = {
        ...state,
        materialStock: state.materialStock.map(m => m.id === id ? { ...m, quantity } : m)
      }
      saveToStorage(next)
      return next
    })
  },

  addMaterialTask: (task) => {
    set((state) => {
      const next = {
        ...state,
        materialTasks: [...state.materialTasks, { ...task, id: generateId() }]
      }
      saveToStorage(next)
      return next
    })
  },

  updateMaterialTaskStatus: (id, status, operator) => {
    set((state) => {
      const next = {
        ...state,
        materialTasks: state.materialTasks.map(t => t.id === id ? { ...t, status, ...(operator ? { operator } : {}) } : t)
      }
      saveToStorage(next)
      return next
    })
  },

  addPrintJob: (job) => {
    set((state) => {
      const newJob = { ...job, id: generateId(), currentLayer: 0, startedAt: job.status === 'printing' ? new Date().toISOString() : '' }
      const orderStatus = printStatusToOrderStatus(job.status)
      const next = {
        ...state,
        printJobs: [...state.printJobs, newJob],
        orders: orderStatus
          ? state.orders.map(o => o.id === job.orderId ? { ...o, status: orderStatus } : o)
          : state.orders
      }
      saveToStorage(next)
      return next
    })
  },

  updatePrintJob: (id, updates) => {
    set((state) => {
      const job = state.printJobs.find(j => j.id === id)
      if (!job) return state
      const newStatus = updates.status ?? job.status
      const orderStatus = printStatusToOrderStatus(newStatus)
      const orders = orderStatus
        ? state.orders.map(o => o.id === job.orderId ? { ...o, status: orderStatus } : o)
        : state.orders
      const next = {
        ...state,
        printJobs: state.printJobs.map(j => j.id === id ? { ...j, ...updates } : j),
        orders,
      }
      saveToStorage(next)
      return next
    })
  },

  addPrintMonitorRecord: (record) => {
    set((state) => {
      const next = {
        ...state,
        printMonitor: [...state.printMonitor, { ...record, id: generateId() }]
      }
      saveToStorage(next)
      return next
    })
  },

  addSupportRemoval: (removal) => {
    set((state) => {
      const next = {
        ...state,
        supportRemovals: [...state.supportRemovals, { ...removal, id: generateId() }]
      }
      saveToStorage(next)
      return next
    })
  },

  updateSupportRemoval: (id, updates) => {
    set((state) => {
      const removal = state.supportRemovals.find(s => s.id === id)
      if (!removal) return state
      const newStatus = updates.status ?? removal.status
      const orderStatus = newStatus === 'completed' ? 'processing' as const : null
      const orders = orderStatus
        ? state.orders.map(o => o.id === removal.orderId ? { ...o, status: orderStatus } : o)
        : state.orders
      const next = {
        ...state,
        supportRemovals: state.supportRemovals.map(s => s.id === id ? { ...s, ...updates } : s),
        orders,
      }
      saveToStorage(next)
      return next
    })
  },

  addPostProcess: (process) => {
    const id = generateId()
    set((state) => {
      const next = {
        ...state,
        postProcesses: [...state.postProcesses, { ...process, id }]
      }
      saveToStorage(next)
      return next
    })
    return id
  },

  updatePostProcess: (id, updates) => {
    set((state) => {
      const pp = state.postProcesses.find(p => p.id === id)
      if (!pp) return state
      const newResult = updates.qualityResult ?? pp.qualityResult
      let orderStatus: Order['status'] | null = null
      if (newResult === 'pass') orderStatus = 'shipping'
      else if (newResult === 'rework') orderStatus = 'processing'
      else if (newResult === 'scrap') orderStatus = 'pending'
      const orders = orderStatus
        ? state.orders.map(o => o.id === pp.orderId ? { ...o, status: orderStatus } : o)
        : state.orders
      const next = {
        ...state,
        postProcesses: state.postProcesses.map(p => p.id === id ? { ...p, ...updates } : p),
        orders,
      }
      saveToStorage(next)
      return next
    })
  },

  addShipment: (shipment) => {
    set((state) => {
      const shippedAt = shipment.shippedAt
      const next = {
        ...state,
        shipments: [...state.shipments, { ...shipment, id: generateId() }],
        orders: state.orders.map(o =>
          o.id === shipment.orderId
            ? { ...o, status: 'completed' as const, shippedAt }
            : o
        ),
      }
      saveToStorage(next)
      return next
    })
  },

  updateShipment: (id, updates) => {
    set((state) => {
      const next = {
        ...state,
        shipments: state.shipments.map(s => s.id === id ? { ...s, ...updates } : s)
      }
      saveToStorage(next)
      return next
    })
  },
}))

export const statusLabels: Record<Order['status'], string> = {
  pending: '待处理',
  inspecting: '模型检查',
  preparing: '材料备料',
  printing: '打印作业',
  removing: '支撑去除',
  processing: '后处理',
  shipping: '待发货',
  completed: '已完成',
}

export const statusColors: Record<Order['status'], string> = {
  pending: 'bg-gray-500/20 text-gray-400',
  inspecting: 'bg-blue-500/20 text-blue-400',
  preparing: 'bg-yellow-500/20 text-yellow-400',
  printing: 'bg-orange-500/20 text-orange-400',
  removing: 'bg-purple-500/20 text-purple-400',
  processing: 'bg-cyan-500/20 text-cyan-400',
  shipping: 'bg-indigo-500/20 text-indigo-400',
  completed: 'bg-green-500/20 text-green-400',
}
