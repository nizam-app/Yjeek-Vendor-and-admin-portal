import { adminService } from '../../../services/adminService'
import { AdminIncidentBoard } from '../../../components/admin/operations/AdminIncidentBoard'

export default function AdminServicesPage() {
  return <AdminIncidentBoard key="services" fetchData={() => adminService.getServices()} />
}
