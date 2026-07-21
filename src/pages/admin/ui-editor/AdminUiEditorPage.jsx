import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '../../../components/admin/Button'

export default function AdminUiEditorPage() {
  const [accent, setAccent] = useState('#118446')
  return (
    <div className="grid min-h-[calc(100vh-64px)] grid-cols-[320px_1fr] max-[900px]:grid-cols-1">
      <section className="border-r border-[#e2e6e3] bg-white p-5">
        <h2 className="text-lg font-bold">UI Editor</h2>
        <p className="mt-1 text-[11px] text-[#7b867f]">Customize customer-facing app surfaces</p>
        <div className="mt-6 space-y-5">
          <label className="block text-[13px] font-medium">Brand color<input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="mt-2 block h-10 w-full rounded border border-[#dfe4e0]" /></label>
          <label className="block text-[13px] font-medium">Home layout<select className="mt-2 h-10 w-full rounded-md border border-[#dfe4e0] px-3 text-xs"><option>Campaign hero + categories</option><option>Categories first</option></select></label>
          <label className="block text-[13px] font-medium">Homepage announcement<textarea className="mt-2 h-20 w-full resize-none rounded-md border border-[#dfe4e0] p-3 text-xs" defaultValue="Free delivery on your first order" /></label>
          <Button primary className="w-full"><Check size={14} /> Publish changes</Button>
        </div>
      </section>
      <section className="grid place-items-center bg-[#eef1ef] p-8">
        <div className="h-[560px] w-[285px] overflow-hidden rounded-[32px] border-[7px] border-[#202722] bg-white shadow-xl">
          <div className="h-8 bg-[#17231c]" />
          <div className="p-4 text-white" style={{ background: accent }}>
            <p className="text-[10px] opacity-80">Delivering to</p><b className="text-xs">Seef, Bahrain</b>
            <div className="mt-4 rounded-lg bg-white/95 p-3 text-[10px] text-[#7b867f]">What are you looking for?</div>
          </div>
          <div className="p-4"><h3 className="text-sm font-bold">Good evening 👋</h3><div className="mt-3 h-28 rounded-lg" style={{ background: `${accent}20` }} /><div className="mt-5 grid grid-cols-3 gap-2">{[1,2,3,4,5,6].map((item) => <div key={item} className="aspect-square rounded-lg bg-[#edf0ee]" />)}</div></div>
        </div>
      </section>
    </div>
  )
}
