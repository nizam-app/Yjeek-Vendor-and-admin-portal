import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

export default function AdminCreateSegmentPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const goBack = () => navigate('/admin/customers')

  return (
    <div className="px-5 pb-10 pt-4 max-[700px]:px-3">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex h-[34px] shrink-0 items-center gap-1 rounded-full border border-[#e4e8e4] bg-white px-3 text-[13px] font-medium text-[#455249] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6]"
        >
          <ChevronLeft size={15} strokeWidth={2.2} />
          Customers
        </button>
        <div className="min-w-0">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">Create segment</h2>
          <p className="mt-1 text-[12.5px] text-[#7c8780]">
            Define a customer segment for marketing, targeting &amp; support.
          </p>
        </div>
      </div>

      <section className="max-w-[640px] rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <label className="mb-4 block">
          <span className={labelClass}>Segment name</span>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. VIP Bahrain"
          />
        </label>
        <label className="mb-5 block">
          <span className={labelClass}>Description</span>
          <textarea
            className="box-border min-h-[96px] w-full resize-y rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 py-2.5 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Who belongs in this segment?"
          />
        </label>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex h-[36px] items-center rounded-full border border-[#dfe4e0] bg-white px-4 text-[13px] font-medium text-[#455249] hover:bg-[#f6f8f6]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={goBack}
            className="inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-4 text-[13px] font-bold text-white hover:bg-[#158a47]"
          >
            Save segment
          </button>
        </div>
      </section>
    </div>
  )
}
