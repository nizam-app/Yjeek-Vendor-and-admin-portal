import { adminService } from '../../../services/adminService'
import { AdminIncidentBoard } from '../../../components/admin/operations/AdminIncidentBoard'

export default function AdminDineInPage() {
  return <AdminIncidentBoard key="dine-in" fetchData={() => adminService.getDineIn()} />
}
