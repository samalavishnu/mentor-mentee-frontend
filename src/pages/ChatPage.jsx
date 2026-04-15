import React, { useState, useEffect } from 'react'
import { chatAPI } from '../services/api'
import ChatBox from '../components/ChatBox'
import useAuth from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function ChatPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [active, setActive] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    chatAPI.getConversations()
      .then(({ data }) => setConversations(data.conversations))
      .catch(() => toast.error('Failed to load conversations'))
      .finally(() => setLoading(false))
  }, [])

  const getOther = (convo) => convo.participants?.find(p => p._id !== user?._id)

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 28px 60px', width:'100%', flex:1 }}>
        <h1 style={{ fontFamily:'var(--font-head)', fontSize:28, fontWeight:700, marginBottom:6 }}>💬 Messages</h1>
        <p style={{ color:'var(--ink-2)', fontSize:14, marginBottom:28 }}>
          Chat is unlocked when a mentor accepts your follow request.
        </p>

        <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:20, height:'calc(100vh - 240px)', minHeight:500 }}>

          {/* Sidebar */}
          <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:18, overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'16px 18px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              <p style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:15 }}>Conversations</p>
            </div>
            <div style={{ flex:1, overflowY:'auto' }}>
              {loading ? (
                <div style={{ display:'flex', flexDirection:'column', gap:8, padding:14 }}>
                  {[...Array(4)].map((_,i) => <div key={i} className="skeleton" style={{ height:64, borderRadius:12 }} />)}
                </div>
              ) : conversations.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--ink-3)' }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>💬</div>
                  <p style={{ fontSize:14, fontWeight:600, marginBottom:6, color:'var(--ink-2)' }}>No conversations yet</p>
                  <p style={{ fontSize:13 }}>Follow a mentor and wait for them to accept — then chat unlocks!</p>
                </div>
              ) : (
                conversations.map(convo => {
                  const other = getOther(convo)
                  const isActive = active?._id === convo._id
                  return (
                    <button key={convo._id} onClick={() => setActive(convo)} style={{
                      width:'100%', padding:'14px 18px', display:'flex', gap:12, alignItems:'center',
                      background: isActive ? 'rgba(0,229,204,0.08)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--teal)' : '3px solid transparent',
                      border:'none', cursor:'pointer', textAlign:'left', transition:'all .15s',
                    }}>
                      <div style={{ width:42,height:42,borderRadius:12,background:'linear-gradient(135deg,var(--teal),var(--violet))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,fontWeight:700,color:'var(--bg)',flexShrink:0 }}>
                        {other?.name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:14,fontWeight:700,color:isActive?'var(--teal)':'var(--ink)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'var(--font-head)' }}>
                          {other?.name}
                        </p>
                        <p style={{ fontSize:11,color:'var(--ink-3)',margin:0,marginTop:2,textTransform:'capitalize' }}>{other?.role}</p>
                      </div>
                      <span style={{ fontSize:11,color:'var(--ink-3)',flexShrink:0 }}>
                        {convo.lastMessageAt ? new Date(convo.lastMessageAt).toLocaleDateString() : ''}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Chat area */}
          <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:18, overflow:'hidden' }}>
            {active ? (
              <ChatBox
                conversationId={active._id}
                otherUser={getOther(active)}
                onClose={() => setActive(null)}
              />
            ) : (
              <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--ink-3)', gap:14, padding:40 }}>
                <div style={{ fontSize:56 }}>💬</div>
                <p style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:700, color:'var(--ink-2)' }}>Select a conversation</p>
                <p style={{ fontSize:14, textAlign:'center', maxWidth:300 }}>
                  Choose someone from the left to start chatting.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
