export default function AdminAutomationPlaceholderPage({ screenName, phaseNote }) {
  const note = phaseNote || `${screenName} content will be implemented in a later phase.`

  return (
    <div className="rounded-[14px] border border-[#e5e8e5] bg-white p-6 shadow-[0_1px_2px_rgba(26,28,26,0.04)]">
      <h2 className="text-[17px] font-bold text-[#17231c]">{screenName}</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-[#6b736e]">{note}</p>
    </div>
  )
}
