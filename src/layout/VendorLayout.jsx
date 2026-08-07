import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import VendorIncomingOrderAlerts from '../components/VendorIncomingOrderAlerts'

export default function VendorLayout() {
  return (
    <div className="flex min-h-full bg-bg-page">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <Outlet />
      </div>
      <VendorIncomingOrderAlerts />
    </div>
  )
}
