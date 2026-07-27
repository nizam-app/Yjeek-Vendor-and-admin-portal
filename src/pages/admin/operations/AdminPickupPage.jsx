import { useAdminPickupBoard } from '../../../hooks/admin/useAdminPickupBoard'
import { AdminIncidentBoard } from '../../../components/admin/operations/AdminIncidentBoard'

export default function AdminPickupPage() {
  const { data, error, isLoading, refetch } = useAdminPickupBoard({ limit: 50 })

  return (
    <AdminIncidentBoard
      key="pickup"
      data={data}
      error={error}
      isLoading={isLoading}
      onRetry={refetch}
    />
  )
}
