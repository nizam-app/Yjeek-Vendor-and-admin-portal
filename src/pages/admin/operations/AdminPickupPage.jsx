import { useCallback } from 'react'
import { AdminIncidentBoard } from '../../../components/admin/operations/AdminIncidentBoard'
import { adminDashboardService } from '../../../services/admin/dashboardService'
import { ADMIN_BOARD_PREVIEW_LIMIT } from '../../../lib/adminBoardLimits'

export default function AdminPickupPage() {
  const fetchBoard = useCallback(
    (options) => adminDashboardService.getPickupBoard(options),
    [],
  )

  return (
    <AdminIncidentBoard
      boardTitle="Pickup"
      fetchBoard={fetchBoard}
      previewLimit={ADMIN_BOARD_PREVIEW_LIMIT}
    />
  )
}
