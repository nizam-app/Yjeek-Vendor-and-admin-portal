import { useEffect, useState } from 'react'
import { AdminChatPanel } from './AdminChatPanel'
import { cn } from '../cn'

const NARROW_BREAKPOINT = 900

function channelLabel(chat) {
  if (chat?.channelLabel) return chat.channelLabel
  if (chat?.channel === 'driver') return 'Driver'
  return 'Customer'
}

/**
 * Renders up to two AdminChatPanel instances with desktop side-by-side offsets.
 * On narrow viewports, shows a Customer/Driver switcher when both are open.
 */
export function AdminActiveChatPanels({ chats = [], onClose, onMarkedRead }) {
  const [focusedId, setFocusedId] = useState(null)
  const [isNarrow, setIsNarrow] = useState(
    typeof window !== 'undefined' ? window.innerWidth < NARROW_BREAKPOINT : false,
  )

  useEffect(() => {
    function onResize() {
      setIsNarrow(window.innerWidth < NARROW_BREAKPOINT)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!chats.length) {
      setFocusedId(null)
      return
    }
    if (!focusedId || !chats.some((chat) => chat.conversationId === focusedId)) {
      setFocusedId(chats[chats.length - 1]?.conversationId ?? null)
    }
  }, [chats, focusedId])

  if (!chats.length) return null

  const showSwitcher = isNarrow && chats.length > 1

  return (
    <>
      {showSwitcher ? (
        <div
          className="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 gap-1 rounded-full border border-[#dce3de] bg-white p-1 shadow-lg"
          role="tablist"
          aria-label="Active chats"
        >
          {chats.map((chat) => {
            const id = chat.conversationId
            const active = id === focusedId
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFocusedId(id)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-[10px] font-semibold transition',
                  active
                    ? 'bg-[#16854a] text-white'
                    : 'text-[#536158] hover:bg-[#f3f6f4]',
                )}
              >
                {channelLabel(chat)}
              </button>
            )
          })}
        </div>
      ) : null}

      {chats.map((chat, index) => {
        const id = chat.conversationId
        if (showSwitcher && id !== focusedId) return null
        const stackOffset = showSwitcher ? 0 : index
        return (
          <AdminChatPanel
            key={`${id}-${chat.orderId || ''}`}
            chat={chat}
            dockOffset={stackOffset}
            onClose={() => onClose?.(id)}
            onMarkedRead={onMarkedRead}
          />
        )
      })}
    </>
  )
}
