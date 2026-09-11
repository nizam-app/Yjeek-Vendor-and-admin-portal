import { useEffect, useRef, useState } from 'react'
import { formatApiErrorMessage } from '../../api/errors'
import { adminService } from '../../services/adminService'
import { cn } from './cn'

function relativeTime(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const mins = Math.floor((Date.now() - date.getTime()) / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function campaignTargetsChamp(row, champId) {
  const id = String(champId || '').trim()
  if (!id) return false
  const meta = row?.raw?.audienceMeta || row?.audienceMeta || {}
  const ids = [
    ...(Array.isArray(meta.resolvedDriverIds) ? meta.resolvedDriverIds : []),
    ...(Array.isArray(meta.champIds) ? meta.champIds : []),
  ].map((item) => String(item))
  return Boolean(meta.direct) && ids.includes(id)
}

function titleFromDraft(text) {
  const line = String(text || '').trim().split('\n')[0].trim()
  return line.slice(0, 80) || 'Fleet message'
}

/**
 * Message champ — floating chat panel (matches admin ops chat).
 * Sends via POST /admin/fleet/champs/:champId/messages
 */
export default function AdminMessageChampModal({
  open,
  onClose,
  champId = null,
  champName = '',
  champInitials = '',
  champStatus = '',
  champCode = '',
  onSuccess,
}) {
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)
  const [minimized, setMinimized] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return undefined

    let cancelled = false
    setDraft('')
    setSendError(null)
    setMinimized(false)
    setMessages([])

    async function loadHistory() {
      const id = String(champId || '').trim()
      if (!id) return
      setIsLoading(true)
      try {
        const response = await adminService.listAdminFleetNotifyHistory()
        if (cancelled) return
        const rows = Array.isArray(response?.data?.rows) ? response.data.rows : []
        const thread = rows
          .filter((row) => campaignTargetsChamp(row, id))
          .reverse()
          .map((row) => {
            const raw = row.raw || {}
            const createdAt = raw.sentAt || raw.completedAt || raw.createdAt
            const body = String(raw.body || '').trim()
            const title = String(raw.title || row.notification || '').trim()
            const text = body || title
            return {
              id: row.id,
              text,
              time: relativeTime(createdAt),
              own: true,
              senderRole: 'ADMIN',
            }
          })
          .filter((item) => item.text)
        setMessages(thread)
      } catch {
        if (!cancelled) setMessages([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadHistory()
    return () => {
      cancelled = true
    }
  }, [open, champId])

  useEffect(() => {
    if (!open || minimized) return
    const node = listRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [open, minimized, messages, isLoading])

  if (!open) return null

  const name = champName || 'Champ'
  const initials = String(champInitials || name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const avatar =
    initials.length >= 2
      ? `${initials[0][0]}${initials[initials.length - 1][0]}`.toUpperCase()
      : String(name).slice(0, 2).toUpperCase()
  const metaParts = ['Champ', champCode || null, champStatus || null].filter(Boolean)

  async function sendMessage(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || sending) return
    const id = String(champId || '').trim()
    if (!id) {
      setSendError('Champ id is missing.')
      return
    }

    setSending(true)
    setSendError(null)
    try {
      const result = await adminService.messageAdminFleetChamp(id, {
        title: titleFromDraft(text),
        body: text,
        push: true,
        sms: false,
      })
      setMessages((current) => [
        ...current,
        {
          id: result?.data?.campaignId || `local-${Date.now()}`,
          text,
          time: 'now',
          own: true,
          senderRole: 'ADMIN',
        },
      ])
      setDraft('')
      onSuccess?.(result)
    } catch (err) {
      setSendError(formatApiErrorMessage(err, 'Failed to send message.'))
    } finally {
      setSending(false)
    }
  }

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="fixed bottom-6 right-6 z-[100] rounded-full border border-[#dce3de] bg-white px-4 py-2 text-[11px] font-medium shadow-lg"
      >
        Champ chat · {name}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close champ chat"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        disabled={sending}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Chat with ${name}`}
        className="relative flex h-[560px] w-[440px] max-h-[calc(100vh-32px)] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-[16px] border border-[#dce3de] bg-white shadow-[0_12px_34px_rgba(0,0,0,.28)]"
      >
        <header className="flex h-[60px] w-full shrink-0 items-center border-b border-[#e7e3e9] bg-[#eaf2ff] px-4">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-[12px] font-bold text-[#3974ad]">
            {avatar}
          </span>
          <div className="ml-2 min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <strong className="truncate text-[13px] text-[#17231c]">{name}</strong>
              <span className="rounded bg-white/70 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#5a6d62]">
                Champ
              </span>
            </div>
            <p className="truncate text-[10px] text-[#6680a0]">{metaParts.join(' · ')}</p>
          </div>
          <button
            type="button"
            onClick={() => setMinimized(true)}
            aria-label="Minimize chat"
            className="grid h-7 w-7 place-items-center text-[20px] font-light text-[#68716c] hover:text-[#26332b]"
          >
            −
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="grid h-7 w-7 place-items-center text-[20px] font-light text-[#68716c] hover:text-[#26332b]"
          >
            ×
          </button>
        </header>

        <div ref={listRef} className="w-full flex-1 space-y-2 overflow-y-auto p-3">
          {isLoading ? (
            <p className="py-6 text-center text-[11px] text-[#78837c]">Loading conversation…</p>
          ) : null}
          {!isLoading && messages.length === 0 ? (
            <p className="py-6 text-center text-[11px] text-[#78837c]">No messages</p>
          ) : null}
          {messages.map((item) => (
            <div key={item.id} className={cn('flex', item.own ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[78%] rounded-lg px-3 py-2.5 shadow-[0_1px_2px_rgba(20,35,25,.05)]',
                  item.own
                    ? 'bg-[#e0f4e8]'
                    : 'border border-[#dfe4e0] bg-white',
                )}
              >
                {item.text ? (
                  <p className="text-[12px] leading-[16px] text-[#354039]">{item.text}</p>
                ) : null}
                <p className="mt-0.5 text-[8px] text-[#929b95]">{item.time}</p>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={sendMessage}
          className="flex w-full shrink-0 flex-col gap-1.5 border-t border-[#e1e6e2] bg-white p-3.5"
        >
          {sendError ? <p className="text-[10px] text-[#d64044]">{sendError}</p> : null}
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={sending}
              className="h-[34px] min-w-0 flex-1 rounded-full border border-[#dfe4e0] px-3 text-[11px] outline-none focus:border-[#25a65b] disabled:opacity-60"
              placeholder="Type a message..."
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="h-[34px] rounded-full bg-[#25a65b] px-4 text-[11px] font-medium text-white hover:bg-[#188949] disabled:opacity-60"
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      </aside>
    </div>
  )
}
