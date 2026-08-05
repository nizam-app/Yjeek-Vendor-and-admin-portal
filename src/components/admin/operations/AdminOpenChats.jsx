import { cn } from '../cn'

export function AdminOpenChats({ chats = [], activeCount, onChatClick }) {
  const list = Array.isArray(chats) ? chats : []
  const count = activeCount == null ? list.length : Number(activeCount) || 0

  return (
    <section className="mt-auto rounded-t-xl border border-b-0 border-[#dfe4e0] bg-white px-[14px] pb-3 pt-2.5">
      <div className="mb-2 flex items-center justify-between text-[11px]">
        <b>chats</b>
        <span className="text-[#657169]">{count} active</span>
      </div>
      {list.length === 0 ? (
        <div className="py-4 text-center text-[11px] text-[#78837c]">No open chats</div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 max-[700px]:grid-cols-1">
          {list.map((chat) => {
            const { id, initials, name, role, message, unreadCount } = chat
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChatClick?.(chat)}
                className="flex h-[54px] items-center rounded-[8px] border border-[#dfe4e0] px-2.5 text-left transition hover:border-[#9ecdb0] hover:bg-[#fbfdfb]"
              >
                <span className={cn(
                  'grid h-[30px] w-[30px] place-items-center rounded-md text-[10px] font-bold',
                  role === 'Customer' ? 'bg-[#f0e8ff] text-[#7552b5]' : 'bg-[#e6f1ff] text-[#3974ad]',
                )}>{initials}</span>
                <span className="ml-2 min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold">
                    {name}
                    <i className={cn(
                      'rounded px-1 text-[8px] not-italic',
                      role === 'Champ' ? 'bg-[#e5efff] text-[#3470ae]' : 'bg-[#eee8ff] text-[#7454ad]',
                    )}>{role}</i>
                  </span>
                  <span className="block truncate text-[9px] text-[#828b85]">{message}</span>
                </span>
                {unreadCount ? <span className="grid h-4 w-4 place-items-center rounded-full bg-[#c91f2b] text-[9px] text-white">{unreadCount}</span> : null}
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
