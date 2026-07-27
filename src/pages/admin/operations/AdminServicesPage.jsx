import { useAdminServicesBoard } from '../../../hooks/admin/useAdminServicesBoard'
import { AdminIncidentBoard } from '../../../components/admin/operations/AdminIncidentBoard'

export default function AdminServicesPage() {
  const { data, error, isLoading, refetch } = useAdminServicesBoard({ limit: 50 })

  return (
    <AdminIncidentBoard
      key="services"
      data={data}
      error={error}
      isLoading={isLoading}
      onRetry={refetch}
    />
  )
}
