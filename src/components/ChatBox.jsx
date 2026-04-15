import React, { useState, useEffect, useRef, useCallback } from 'react'
import { chatAPI } from '../services/api'
import { useSocket } from '../context/SocketContext'
import useAuth from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function ChatBox({ conversationId, otherUser, onClose }) {
  const { user }         = useAuth()
  const { socket }       = useSocket()
  const [messages, setMessages] = useState([])
  const [text, setText]   = useState('')
  const [loading, setLoading] = useState(true)
  const [typing, setTyping]   = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const typingTimeout = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await chatAPI.getMessages(conversationId)
      setMessages(data.messages)
    } catch { toast.error('Failed to load messages') }
    finally { setLoading(false) }
  }, [conversationId])

  useEffect(() => { load() }, [load])

  // Socket listeners
  useEffect(() => {
    if (!socket) return
    const handleNew = ({ conversationId: cId, message }) => {
      if (cId === conversationId) {
        setMessages(prev => {
          const exists = prev.some(m => m._id === message._id)
          return exists ? prev : [...prev, message]
        })
      }
    }
    const handleTyping = ({ conversationId: cId }) => {
      if (cId === conversationId) setTyping(true)
    }
    const handleStop = ({ conversationId: cId }) => {
      setTyping(false)
    }
    socket.on('new_message',     handleNew)
    socket.on('user_typing',     handleTyping)
    socket.on('user_stop_typing', handleStop)
    return () => {
      socket.off('new_message',      handleNew)
      socket.off('user_typing',      handleTyping)
      socket.off('user_stop_typing', handleStop)
    }
  }, [socket, conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleType = (e) => {
    setText(e.target.value)
    if (socket && otherUser) {
      socket.emit('typing', { conversationId, recipientId: otherUser._id })
      clearTimeout(typingTimeout.current)
      typingTimeout.current = setTimeout(() => {
        socket.emit('stop_typing', { recipientId: otherUser._id })
      }, 1500)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    const content = text.trim()
    setText('')
    try {
      if (socket) {
        socket.emit('send_message', { conversationId, content })
      } else {
        const { data } = await chatAPI.sendMessage(conversationId, { content })
        setMessages(prev => [...prev, data.message])
      }
    } catch { toast.error('Failed to send') }
    finally { setSending(false) }
  }

  const grouped = messages.reduce((acc, m) => {
    const date = new Date(m.createdAt).toLocaleDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(m)
    return acc
  }, {})

  return (
    <div style={S.box}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.av}>{otherUser?.name?.[0]?.toUpperCase()}</div>
          <div>
            <p style={S.name}>{otherUser?.name}</p>
            <p style={S.role}>{otherUser?.role}</p>
          </div>
        </div>
        <button onClick={onClose} style={S.closeBtn}>✕</button>
      </div>

      {/* Messages */}
      <div style={S.messages}>
        {loading ? (
          <div style={{ textAlign:'center', padding:24, color:'var(--ink-3)' }}>
            <div className="spinner" style={{ width:24,height:24,margin:'0 auto' }} />
          </div>
        ) : messages.length === 0 ? (
          <div style={S.empty}>
            <span style={{ fontSize:32 }}>💬</span>
            <p>Say hello to {otherUser?.name?.split(' ')[0]}!</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, msgs]) => (
            <div key={date}>
              <div style={S.dateDivider}><span>{date}</span></div>
              {msgs.map(m => {
                const isMine = m.sender?._id === user?._id || m.sender === user?._id
                return (
                  <div key={m._id} style={{ display:'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom:6 }}>
                    {!isMine && (
                      <div style={S.msgAv}>{m.sender?.name?.[0]?.toUpperCase()}</div>
                    )}
                    <div style={{ maxWidth:'72%' }}>
                      <div style={{
                        ...S.bubble,
                        background: isMine ? 'var(--teal)' : 'var(--bg-3)',
                        color:      isMine ? 'var(--bg)' : 'var(--ink)',
                        borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        alignSelf: isMine ? 'flex-end' : 'flex-start',
                      }}>
                        {m.content}
                      </div>
                      <p style={{ fontSize:10, color:'var(--ink-3)', textAlign: isMine?'right':'left', marginTop:2 }}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                        {isMine && m.read && ' ✓✓'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        {typing && (
          <div style={{ display:'flex', gap:6, alignItems:'center', padding:'4px 0' }}>
            <div style={S.msgAv}>{otherUser?.name?.[0]?.toUpperCase()}</div>
            <div style={{ ...S.bubble, background:'var(--bg-3)', padding:'8px 14px' }}>
              <span style={{ letterSpacing:2, color:'var(--ink-2)' }}>···</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={S.inputRow}>
        <input
          value={text} onChange={handleType}
          placeholder="Type a message…"
          style={S.input}
          disabled={sending}
          autoFocus
        />
        <button type="submit" disabled={!text.trim() || sending} style={S.sendBtn}>
          ➤
        </button>
      </form>
    </div>
  )
}

const S = {
  box: { display:'flex', flexDirection:'column', height:'100%', background:'var(--bg-2)', borderRadius:'inherit' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', borderBottom:'1px solid var(--border)', flexShrink:0 },
  headerLeft: { display:'flex', alignItems:'center', gap:10 },
  av: { width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,var(--teal),var(--violet))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'var(--bg)',flexShrink:0 },
  name: { fontSize:14,fontWeight:700,color:'var(--ink)',fontFamily:'var(--font-head)',margin:0 },
  role: { fontSize:11,color:'var(--ink-3)',textTransform:'capitalize',margin:0 },
  closeBtn: { background:'none',border:'none',color:'var(--ink-2)',fontSize:18,cursor:'pointer',padding:'4px 8px',lineHeight:1 },
  messages: { flex:1,overflowY:'auto',padding:'14px 16px',display:'flex',flexDirection:'column',gap:2 },
  empty: { textAlign:'center',color:'var(--ink-3)',padding:'40px 0',display:'flex',flexDirection:'column',gap:8,alignItems:'center',fontSize:14 },
  dateDivider: { textAlign:'center',margin:'10px 0',fontSize:11,color:'var(--ink-3)',fontWeight:600 },
  msgAv: { width:26,height:26,borderRadius:8,background:'linear-gradient(135deg,var(--coral),var(--violet))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',flexShrink:0,marginRight:6,alignSelf:'flex-end' },
  bubble: { padding:'9px 13px',fontSize:14,lineHeight:1.5,wordBreak:'break-word' },
  inputRow: { display:'flex',gap:8,padding:'12px 14px',borderTop:'1px solid var(--border)',flexShrink:0 },
  input: { flex:1,background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 14px',color:'var(--ink)',fontSize:14,outline:'none',fontFamily:'var(--font-body)' },
  sendBtn: { width:42,height:42,borderRadius:10,background:'var(--teal)',border:'none',color:'var(--bg)',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 },
}
