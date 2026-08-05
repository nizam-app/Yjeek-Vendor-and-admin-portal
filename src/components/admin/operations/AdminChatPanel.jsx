import { useEffect, useRef, useState } from 'react'
import { isAdminRealApiFeature } from '../../../api/config'
import { adminChatService } from '../../../services/admin/chatService'
import { conversationPeerFromChat } from '../../../mappers/admin/mapAdminConversation'
import { cn } from '../cn'

/**
 * Admin floating chat panel.
 * Loads GET /admin/chats/:id, marks read, sends via POST .../messages.
 */
export function AdminChatPanel({ chat, onClose, onMarkedRead }) {
  const conversationId = chat?.conversationId || chat?.id || null
  const useReal = isAdminRealApiFeature('dashboard') && Boolean(conversationId)
  const onMarkedReadRef = useRef(onMarkedRead)
  onMarkedReadRef.current = onMarkedRead

  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([])
  const [conversation, setConversation] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(useReal))
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    if (!useReal || !conversationId) {
      // Real strip only: show lastMessage snippet until conversation loads; never invent threads.
      setMessages(
        chat?.message
          ? [{ id: 'preview', text: chat.message, time: '', own: false }]
          : [],
      )
      setIsLoading(false)
      return undefined
    }

    let cancelled = false

    async function loadConversation() {
      setIsLoading(true)
      setError(null)
      setSendError(null)

      try {
        const response = await adminChatService.getConversation(conversationId)
        if (cancelled) return
        setConversation(response.data)
        setMessages(response.data?.messages || [])

        try {
          await adminChatService.markRead(conversationId)
          if (!cancelled) onMarkedReadRef.current?.(conversationId)
        } catch {
          // Opening the thread still succeeds if mark-read fails.
        }
      } catch (err) {
        if (cancelled) return
        setError(err)
        setMessages(
          chat?.message
            ? [{ id: 'preview', text: chat.message, time: '', own: false }]
            : [],
        )
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadConversation()
    return () => {
      cancelled = true
    }
  }, [useReal, conversationId, chat?.message])

  const peer = conversationPeerFromChat(chat, conversation)
  const orderLabel =
    conversation?.orderNumber || chat?.orderNumber || chat?.orderId || '—'
  const isCustomer = peer.role === 'Customer'

  async function sendMessage(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || sending) return

    if (!useReal || !conversationId) {
      setDraft('')
      return
    }

    setSending(true)
    setSendError(null)
    try {
      const response = await adminChatService.sendMessage(conversationId, { body: text })
      setMessages((current) => [...current, response.data])
      setDraft('')
    } catch (err) {
      setSendError(err?.message || 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  return (
    <aside
      className="fixed right-[50px] top-[70px] z-50 flex h-[520px] w-[440px] flex-col items-start overflow-hidden rounded-[16px] border border-[#dce3de] bg-white p-0 shadow-[0_12px_34px_rgba(0,0,0,.28)] max-[700px]:right-4 max-[520px]:left-3 max-[520px]:right-3 max-[520px]:w-auto"
      aria-label={`Chat with ${peer.name}`}
    >
      <header className={cn(
        'flex h-[60px] w-full shrink-0 items-center border-b border-[#e7e3e9] px-4',
        isCustomer ? 'bg-[#f4edff]' : 'bg-[#eaf2ff]',
      )}>
        <span className={cn(
          'grid h-10 w-10 place-items-center rounded-md text-[12px] font-bold',
          isCustomer ? 'bg-[#f0e8ff] text-[#7552b5]' : 'bg-white text-[#3974ad]',
        )}>{peer.initials}</span>
        <div className="ml-2 min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <strong className="truncate text-[13px]">{peer.name}</strong>
            <span className="h-1.5 w-1.5 rounded-full bg-[#28a85b]" />
            <span className="text-[9px] font-medium text-[#22a155]">online</span>
          </div>
          <p className={cn('truncate text-[10px]', isCustomer ? 'text-[#7c4dbe]' : 'text-[#6680a0]')}>
            {peer.role} · Order {orderLabel}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Minimize chat" className="grid h-7 w-7 place-items-center text-[20px] font-light text-[#68716c] hover:text-[#26332b]">−</button>
        <button type="button" onClick={onClose} aria-label="Close chat" className="grid h-7 w-7 place-items-center text-[20px] font-light text-[#68716c] hover:text-[#26332b]">×</button>
      </header>

      <div className="w-full flex-1 space-y-2 overflow-y-auto p-3">
        {isLoading ? (
          <p className="py-6 text-center text-[11px] text-[#78837c]">Loading conversation…</p>
        ) : null}
        {error && !isLoading ? (
          <p className="py-2 text-center text-[10px] text-[#d64044]">
            {error.message || 'Unable to load conversation.'}
          </p>
        ) : null}
        {!isLoading && !error && messages.length === 0 ? (
          <p className="py-6 text-center text-[11px] text-[#78837c]">No messages</p>
        ) : null}
        {messages.map((item) => (
          <div key={item.id} className={cn('flex', item.own ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              'max-w-[78%] rounded-lg px-3 py-2.5 shadow-[0_1px_2px_rgba(20,35,25,.05)]',
              item.own
                ? 'bg-[#e0f4e8]'
                : item.senderRole === 'SYSTEM'
                  ? 'border border-[#e8ebe9] bg-[#f6f7f6]'
                  : 'border border-[#dfe4e0] bg-white',
            )}>
              {item.senderRole && item.senderRole !== 'ADMIN' && item.senderRole !== 'CUSTOMER' ? (
                <p className="mb-0.5 text-[8px] font-medium uppercase tracking-wide text-[#929b95]">
                  {item.senderRole === 'DRIVER' ? 'Champ' : item.senderRole}
                </p>
              ) : null}
              <p className="text-[12px] leading-[16px] text-[#354039]">{item.text}</p>
              <p className="mt-0.5 text-[8px] text-[#929b95]">{item.time}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="flex w-full shrink-0 flex-col gap-1.5 border-t border-[#e1e6e2] bg-white p-3.5">
        {sendError ? <p className="text-[10px] text-[#d64044]">{sendError}</p> : null}
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={sending || !useReal}
            className="h-[34px] min-w-0 flex-1 rounded-full border border-[#dfe4e0] px-3 text-[11px] outline-none focus:border-[#25a65b] disabled:opacity-60"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            disabled={sending || !useReal || !draft.trim()}
            className="h-[34px] rounded-full bg-[#25a65b] px-4 text-[11px] font-medium text-white hover:bg-[#188949] disabled:opacity-60"
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </form>
    </aside>
  )
}
