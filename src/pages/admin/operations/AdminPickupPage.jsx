import { adminService } from '../../../services/adminService'
import { AdminIncidentBoard } from '../../../components/admin/operations/AdminIncidentBoard'

export default function AdminPickupPage() {
  return <AdminIncidentBoard key="pickup" fetchData={() => adminService.getPickup()} />
}
