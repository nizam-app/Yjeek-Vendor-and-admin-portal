import { useEffect, useState } from 'react'
import { cn } from '../cn'

export function AdminChatPanel({ chat, onClose }) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState(() => (
    chat.role === 'Customer'
      ? [
          { id: 1, text: 'My order is very late', time: '12:34', own: false },
          { id: 2, text: 'Where is the champ now?', time: '12:34', own: false },
          { id: 3, text: 'Champ is 5 min away, apologies', time: '12:35', own: true },
          { id: 4, text: 'Can I get a partial refund?', time: '12:36', own: false },
        ]
      : [
          { id: 1, text: 'Hi, I picked up the order', time: '12:26', own: false },
          { id: 2, text: 'Great, the customer is waiting', time: '12:27', own: true },
          { id: 3, text: 'Heavy traffic on the highway', time: '12:31', own: false },
          { id: 4, text: 'I will be 5 min late', time: '12:31', own: false },
          { id: 5, text: 'Okay, keep them updated', time: '12:32', own: true },
        ]
  ))

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const sendMessage = (event) => {
    event.preventDefault()
    const text = message.trim()
    if (!text) return
    setMessages((current) => [...current, { id: Date.now(), text, time: 'now', own: true }])
    setMessage('')
  }

  return (
    <aside
      className="fixed right-[50px] top-[70px] z-50 flex h-[520px] w-[440px] flex-col items-start overflow-hidden rounded-[16px] border border-[#dce3de] bg-white p-0 shadow-[0_12px_34px_rgba(0,0,0,.28)] max-[700px]:right-4 max-[520px]:left-3 max-[520px]:right-3 max-[520px]:w-auto"
      aria-label={`Chat with ${chat.name}`}
    >
      <header className={cn(
        'flex h-[60px] w-full shrink-0 items-center border-b border-[#e7e3e9] px-4',
        chat.role === 'Customer' ? 'bg-[#f4edff]' : 'bg-[#eaf2ff]',
      )}>
        <span className={cn(
          'grid h-10 w-10 place-items-center rounded-md text-[12px] font-bold',
          chat.initials === 'AM' ? 'bg-[#f0e8ff] text-[#7552b5]' : 'bg-white text-[#3974ad]',
        )}>{chat.initials}</span>
        <div className="ml-2 min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <strong className="truncate text-[13px]">{chat.name}</strong>
            <span className="h-1.5 w-1.5 rounded-full bg-[#28a85b]" />
            <span className="text-[9px] font-medium text-[#22a155]">online</span>
          </div>
          <p className={cn('truncate text-[10px]', chat.role === 'Customer' ? 'text-[#7c4dbe]' : 'text-[#6680a0]')}>{chat.role} · Order {chat.orderId || '#YJK-…2YKZ9VF'}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Minimize chat" className="grid h-7 w-7 place-items-center text-[20px] font-light text-[#68716c] hover:text-[#26332b]">−</button>
        <button type="button" onClick={onClose} aria-label="Close chat" className="grid h-7 w-7 place-items-center text-[20px] font-light text-[#68716c] hover:text-[#26332b]">×</button>
      </header>

      <div className="w-full flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((item) => (
          <div key={item.id} className={cn('flex', item.own ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              'max-w-[78%] rounded-lg px-3 py-2.5 shadow-[0_1px_2px_rgba(20,35,25,.05)]',
              item.own ? 'bg-[#e0f4e8]' : 'border border-[#dfe4e0] bg-white',
            )}>
              <p className="text-[12px] leading-[16px] text-[#354039]">{item.text}</p>
              <p className="mt-0.5 text-[8px] text-[#929b95]">{item.time}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="flex w-full shrink-0 gap-2 border-t border-[#e1e6e2] bg-white p-3.5">
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="h-[34px] min-w-0 flex-1 rounded-full border border-[#dfe4e0] px-3 text-[11px] outline-none focus:border-[#25a65b]"
          placeholder="Type a message..."
        />
        <button type="submit" className="h-[34px] rounded-full bg-[#25a65b] px-4 text-[11px] font-medium text-white hover:bg-[#188949]">Send</button>
      </form>
    </aside>
  )
}
