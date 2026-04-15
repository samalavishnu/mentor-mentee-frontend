import React, { useState, useEffect } from 'react'
import { chatAPI } from '../services/api'
import ChatBox from './ChatBox'
import useAuth from '../hooks/useAuth'

export default function ChatButton({ otherUser }) {
  const { isAuthenticated } = useAuth()
  const [convo,  setConvo]  = useState(null)
  const [open,   setOpen]   = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !otherUser) return
    chatAPI.getConversationWith(otherUser._id)
      .then(({ data }) => setConvo(data.conversation))
      .catch(() => {})
  }, [otherUser, isAuthenticated])

  if (!convo || !isAuthenticated) return null

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        padding:'10px 18px', borderRadius:10,
        background:'rgba(0,229,204,0.1)', border:'1px solid rgba(0,229,204,0.35)',
        color:'var(--teal)', fontSize:14, fontWeight:700, cursor:'pointer',
        fontFamily:'var(--font-body)', display:'flex', alignItems:'center', gap:7,
      }}>
        💬 Message
      </button>

      {open && (
        <div style={{
          position:'fixed', bottom:24, right:24, zIndex:300,
          width:370, height:520,
          background:'var(--bg-2)', border:'1px solid var(--border-2)',
          borderRadius:18, boxShadow:'0 12px 60px rgba(0,0,0,0.7)',
          display:'flex', flexDirection:'column', overflow:'hidden',
          animation:'fadeUp .25s ease',
        }}>
          <ChatBox
            conversationId={convo._id}
            otherUser={otherUser}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </>
  )
}
