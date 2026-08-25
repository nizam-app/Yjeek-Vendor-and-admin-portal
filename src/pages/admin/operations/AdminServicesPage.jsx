import { useCallback } from 'react'
import { AdminIncidentBoard } from '../../../components/admin/operations/AdminIncidentBoard'
import { adminDashboardService } from '../../../services/admin/dashboardService'

export default function AdminServicesPage() {
  const fetchBoard = useCallback(
    (options) => adminDashboardService.getServicesBoard(options),
    [],
  )

  return <AdminIncidentBoard boardTitle="Services" fetchBoard={fetchBoard} />
}
