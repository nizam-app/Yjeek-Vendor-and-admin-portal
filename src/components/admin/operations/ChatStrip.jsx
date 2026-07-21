export function ChatStrip({ chats }) {
  return (
    <section className="mt-2 rounded-t-lg border border-b-0 border-[#dfe4e0] bg-white px-3 pb-2.5 pt-2">
      <div className="mb-1.5 flex items-center justify-between text-[9px]"><b>chats</b><span className="text-[#7a847e]">3 active</span></div>
      <div className="grid grid-cols-3 gap-2 max-[700px]:grid-cols-1">
        {chats.map(({ id, initials, name, role, message, unreadCount }) => (
          <button key={id} className="flex h-[50px] items-center rounded-md border border-[#e1e5e2] bg-white px-3 text-left">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-[#eaf2f8] text-[9px] font-medium text-[#4d7594]">{initials}</span>
            <span className="ml-2 min-w-0 flex-1"><span className="flex items-center gap-1.5 text-[9px] font-medium">{name}<i className="rounded bg-[#eef0fb] px-1 text-[9px] not-italic text-[#6967a8]">{role}</i></span><span className="block truncate text-[9px] text-[#9aa19c]">{message}</span></span>
            {unreadCount ? <span className="grid h-4 w-4 place-items-center rounded-full bg-[#d92d35] text-[9px] text-white">{unreadCount}</span> : null}
          </button>
        ))}
      </div>
    </section>
  )
}
