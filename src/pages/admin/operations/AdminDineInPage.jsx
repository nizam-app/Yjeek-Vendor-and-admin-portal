import { useAdminDineInBoard } from '../../../hooks/admin/useAdminDineInBoard'
import { AdminIncidentBoard } from '../../../components/admin/operations/AdminIncidentBoard'

export default function AdminDineInPage() {
  const { data, error, isLoading, refetch } = useAdminDineInBoard({ limit: 50 })

  return (
    <AdminIncidentBoard
      key="dine-in"
      data={data}
      error={error}
      isLoading={isLoading}
      onRetry={refetch}
    />
  )
}
