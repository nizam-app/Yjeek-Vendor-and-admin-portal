import { useCallback } from 'react'
import { AdminIncidentBoard } from '../../../components/admin/operations/AdminIncidentBoard'
import { adminDashboardService } from '../../../services/admin/dashboardService'
import { ADMIN_BOARD_PREVIEW_LIMIT } from '../../../lib/adminBoardLimits'

export default function AdminServicesPage() {
  const fetchBoard = useCallback(
    (options) => adminDashboardService.getServicesBoard(options),
    [],
  )

  return (
    <AdminIncidentBoard
      boardTitle="Services"
      fetchBoard={fetchBoard}
      previewLimit={ADMIN_BOARD_PREVIEW_LIMIT}
    />
  )
}
