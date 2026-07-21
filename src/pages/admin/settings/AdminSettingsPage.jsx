import { Button } from '../../../components/admin/Button'
import { cn } from '../../../components/admin/cn'

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-[920px] p-7 max-[700px]:p-4">
      <h2 className="text-[20px] font-bold">Platform settings</h2>
      <p className="mt-1 text-[11px] text-[#7c8780]">Manage global operational and account preferences</p>
      <div className="mt-5 grid grid-cols-[210px_1fr] gap-4 max-[750px]:grid-cols-1">
        <nav className="rounded-lg border border-[#e2e6e3] bg-white p-2">
          {['General', 'Regions & zones', 'Order settings', 'Payments', 'Notifications', 'Integrations', 'Security'].map((item, index) => <button key={item} className={cn('block h-9 w-full rounded-md px-3 text-left text-xs', index === 0 ? 'bg-[#e8f7ed] font-medium text-[#118446]' : 'text-[#657169] hover:bg-[#f5f7f5]')}>{item}</button>)}
        </nav>
        <section className="rounded-lg border border-[#e2e6e3] bg-white">
          <div className="border-b border-[#e8ebe9] p-5"><h3 className="text-sm font-bold">General settings</h3><p className="mt-1 text-[10px] text-[#7c8780]">Default platform configuration</p></div>
          <div className="space-y-5 p-5">
            {[['Platform name', 'Yjeek'], ['Support email', 'support@yjeek.com'], ['Default country', 'Bahrain'], ['Default currency', 'BHD']].map(([label, value]) => <label key={label} className="block text-[13px] font-medium">{label}<input defaultValue={value} className="mt-2 h-10 w-full rounded-md border border-[#dfe4e0] px-3 text-xs outline-none focus:border-[#118446]" /></label>)}
            <div className="flex justify-end"><Button primary>Save changes</Button></div>
          </div>
        </section>
      </div>
    </div>
  )
}
