import { Outlet } from 'react-router-dom'
import { AutomationTabNav } from '../components/admin/automation/AutomationTabNav'

/** Shared Automation shell: tabs + content outlet. Page titles live in each screen. */
export default function AdminAutomationLayout() {
  return (
    <div className="px-5 pb-8 pt-5 max-[700px]:px-3">
      <AutomationTabNav />
      <div className="mt-4 min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
