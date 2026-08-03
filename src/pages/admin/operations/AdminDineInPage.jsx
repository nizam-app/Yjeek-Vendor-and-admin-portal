import { useCallback } from 'react'
import { AdminIncidentBoard } from '../../../components/admin/operations/AdminIncidentBoard'
import { adminDashboardService } from '../../../services/admin/dashboardService'
import { ADMIN_BOARD_PREVIEW_LIMIT } from '../../../lib/adminBoardLimits'

export default function AdminDineInPage() {
  const fetchBoard = useCallback(
    (options) => adminDashboardService.getDineInBoard(options),
    [],
  )

  return (
    <AdminIncidentBoard
      boardTitle="Dine-in"
      fetchBoard={fetchBoard}
      previewLimit={ADMIN_BOARD_PREVIEW_LIMIT}
    />
  )
}
