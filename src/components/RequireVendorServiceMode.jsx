import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getVendorServiceModes } from '../mappers/vendor/authMapper'

/**
 * Redirects to /live-orders when the vendor lacks the given serviceModes flag.
 * @param {{ mode: 'scheduledDelivery' | 'services' | 'dineIn' | 'hotFoodOnDemand' | 'pickup' }} props
 */
export default function RequireVendorServiceMode({ mode }) {
  const { user } = useAuth()
  const modes = getVendorServiceModes(user)

  if (!modes[mode]) {
    return <Navigate to="/live-orders" replace />
  }

  return <Outlet />
}
