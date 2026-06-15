import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Order from '@/pages/Order'
import Inspection from '@/pages/Inspection'
import Material from '@/pages/Material'
import Printing from '@/pages/Printing'
import SupportRemoval from '@/pages/SupportRemoval'
import PostProcessing from '@/pages/PostProcessing'
import Shipping from '@/pages/Shipping'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/order" element={<Order />} />
          <Route path="/inspection" element={<Inspection />} />
          <Route path="/material" element={<Material />} />
          <Route path="/printing" element={<Printing />} />
          <Route path="/support-removal" element={<SupportRemoval />} />
          <Route path="/post-processing" element={<PostProcessing />} />
          <Route path="/shipping" element={<Shipping />} />
        </Route>
      </Routes>
    </Router>
  )
}
