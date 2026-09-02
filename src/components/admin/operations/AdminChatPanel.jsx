import { useEffect, useRef, useState } from 'react'
import { isAdminRealApiFeature } from '../../../api/config'
import { adminChatService } from '../../../services/admin/chatService'
import { conversationPeerFromChat } from '../../../mappers/admin/mapAdminConversation'
import { cn } from '../cn'

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

/**
 * Admin floating chat panel — draggable, minimizable, status/resolve workflow.
 */
export function AdminChatPanel({ chat, onClose, onMarkedRead, dockOffset = 0 }) {
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
  const [minimized, setMinimized] = useState(false)
  const [statusDraft, setStatusDraft] = useState('OPEN')
  const [resolutionNote, setResolutionNote] = useState('')
  const [closeReason, setCloseReason] = useState('')
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState(null)
  const [position, setPosition] = useState({ x: 50 + dockOffset * 460, y: 70 })
  const dragRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 })

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    if (!useReal || !conversationId) {
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
        setStatusDraft(response.data?.status || response.data?.lifecycle?.status || 'OPEN')

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
  const channelLabel =
    conversation?.channelLabel ||
    chat?.channelLabel ||
    (chat?.channel === 'driver' ? 'Driver' : 'Customer')
  const readOnly = Boolean(conversation?.readOnly)
  const currentStatus = conversation?.status || conversation?.lifecycle?.status || statusDraft

  function onDragStart(event) {
    if (event.button !== 0) return
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    }
  }

  useEffect(() => {
    function onMove(event) {
      if (!dragRef.current.active) return
      setPosition({
        x: Math.max(8, dragRef.current.originX + (event.clientX - dragRef.current.startX)),
        y: Math.max(8, dragRef.current.originY + (event.clientY - dragRef.current.startY)),
      })
    }
    function onUp() {
      dragRef.current.active = false
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [position.x, position.y])

  async function sendMessage(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || sending || readOnly) return

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

  async function saveStatus(event) {
    event.preventDefault()
    if (!useReal || !conversationId || statusSaving) return
    setStatusSaving(true)
    setStatusError(null)
    try {
      const payload = {
        status: statusDraft,
        ...(resolutionNote.trim() ? { resolutionNote: resolutionNote.trim() } : {}),
        ...(closeReason.trim() ? { closeReason: closeReason.trim() } : {}),
      }
      const response = await adminChatService.updateStatus(conversationId, payload)
      setConversation((prev) => ({
        ...(prev || {}),
        status: response.data?.status || statusDraft,
        lifecycle: response.data,
      }))
    } catch (err) {
      setStatusError(err?.message || 'Failed to update status.')
    } finally {
      setStatusSaving(false)
    }
  }

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="fixed z-50 rounded-full border border-[#dce3de] bg-white px-4 py-2 text-[11px] font-medium shadow-lg"
        style={{ right: `${24 + dockOffset * 12}px`, bottom: '24px' }}
      >
        {channelLabel} chat · {orderLabel}
      </button>
    )
  }

  return (
    <aside
      className="fixed z-50 flex w-[440px] flex-col items-start overflow-hidden rounded-[16px] border border-[#dce3de] bg-white p-0 shadow-[0_12px_34px_rgba(0,0,0,.28)] max-[700px]:w-[calc(100vw-24px)]"
      style={{ left: position.x, top: position.y, height: minimized ? 48 : 560 }}
      aria-label={`Chat with ${peer.name}`}
    >
      <header
        className={cn(
          'flex h-[60px] w-full shrink-0 cursor-move items-center border-b border-[#e7e3e9] px-4 select-none',
          isCustomer ? 'bg-[#f4edff]' : 'bg-[#eaf2ff]',
        )}
        onMouseDown={onDragStart}
      >
        <span className={cn(
          'grid h-10 w-10 place-items-center rounded-md text-[12px] font-bold',
          isCustomer ? 'bg-[#f0e8ff] text-[#7552b5]' : 'bg-white text-[#3974ad]',
        )}>{peer.initials}</span>
        <div className="ml-2 min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <strong className="truncate text-[13px]">{peer.name}</strong>
            <span className="rounded bg-white/70 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#5a6d62]">
              {channelLabel}
            </span>
          </div>
          <p className={cn('truncate text-[10px]', isCustomer ? 'text-[#7c4dbe]' : 'text-[#6680a0]')}>
            {peer.role} · Order {orderLabel} · {currentStatus}
          </p>
        </div>
        <button type="button" onClick={() => setMinimized(true)} aria-label="Minimize chat" className="grid h-7 w-7 place-items-center text-[20px] font-light text-[#68716c] hover:text-[#26332b]">−</button>
        <button type="button" onClick={onClose} aria-label="Close chat" className="grid h-7 w-7 place-items-center text-[20px] font-light text-[#68716c] hover:text-[#26332b]">×</button>
      </header>

      {!readOnly ? (
        <form onSubmit={saveStatus} className="flex w-full shrink-0 flex-wrap items-center gap-2 border-b border-[#edf0ee] bg-[#fafbfa] px-3 py-2">
          <select
            value={statusDraft}
            onChange={(event) => setStatusDraft(event.target.value)}
            className="h-7 rounded border border-[#dfe4e0] px-2 text-[10px]"
          >
            {STATUS_OPTIONS.map((value) => (
              <option key={value} value={value}>{value.replace('_', ' ')}</option>
            ))}
          </select>
          <input
            value={closeReason}
            onChange={(event) => setCloseReason(event.target.value)}
            placeholder="Close reason (optional)"
            className="h-7 min-w-0 flex-1 rounded border border-[#dfe4e0] px-2 text-[10px]"
          />
          <button
            type="submit"
            disabled={statusSaving}
            className="h-7 rounded bg-[#1a9b53] px-2 text-[10px] font-medium text-white disabled:opacity-60"
          >
            {statusSaving ? 'Saving…' : 'Update'}
          </button>
          {statusError ? <p className="w-full text-[10px] text-[#d64044]">{statusError}</p> : null}
        </form>
      ) : null}

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
        {readOnly ? (
          <p className="text-[10px] text-[#78837c]">Legacy conversation — read only.</p>
        ) : null}
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={sending || !useReal || readOnly}
            className="h-[34px] min-w-0 flex-1 rounded-full border border-[#dfe4e0] px-3 text-[11px] outline-none focus:border-[#25a65b] disabled:opacity-60"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            disabled={sending || !useReal || !draft.trim() || readOnly}
            className="h-[34px] rounded-full bg-[#25a65b] px-4 text-[11px] font-medium text-white hover:bg-[#188949] disabled:opacity-60"
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </form>
    </aside>
  )
}
