import { ShieldOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { firstAllowedAdminPath } from '../../config/adminNavManifest'

export default function AdminForbiddenPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const home = firstAllowedAdminPath(user)

  return (
    <div className="flex min-h-[min(70vh,520px)] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#fde8e8] text-[#c91a24]">
        <ShieldOff size={28} strokeWidth={1.8} />
      </div>
      <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">Access not allowed</h2>
      <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[#5c6760]">
        Your account does not have permission to view this section. If you believe this is a mistake,
        contact a Super Admin to update your role or permissions.
      </p>
      <button
        type="button"
        onClick={() => navigate(home, { replace: true })}
        className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-[#118446] px-5 text-[13px] font-semibold text-white hover:bg-[#0d6d38]"
      >
        Go to your home
      </button>
    </div>
  )
}
