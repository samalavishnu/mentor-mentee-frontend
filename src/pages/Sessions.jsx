import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { sessionAPI } from '../services/api'
import useAuth from '../hooks/useAuth'

const STATUS_CONFIG = {
  pending:   { color:'var(--gold)',  bg:'var(--gold-dim)',  label:'Pending'   },
  accepted:  { color:'var(--green)', bg:'var(--green-dim)', label:'Accepted'  },
  rejected:  { color:'var(--coral)', bg:'var(--coral-dim)', label:'Rejected'  },
  completed: { color:'var(--teal)',  bg:'var(--teal-dim)',  label:'Completed' },
  cancelled: { color:'var(--ink-3)', bg:'rgba(255,255,255,.05)', label:'Cancelled' },
}

function Badge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.cancelled
  return <span style={{ padding:'4px 12px', borderRadius:100, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.4px', background:s.bg, color:s.color }}>{s.label}</span>
}

export default function Sessions() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('')
  const [expanded, setExpanded] = useState(null)
  const [meetLink, setMeetLink] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await sessionAPI.getMy(filter ? { status:filter } : {})
      setSessions(data.sessions)
    } catch { toast.error('Failed to load sessions') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  const doAction = async (id, status, extra={}) => {
    setActionLoading(id+status)
    try {
      await sessionAPI.updateStatus(id, { status, ...extra })
      setSessions(ss => ss.map(s => s._id===id ? {...s, status, ...extra} : s))
      toast.success(`Session ${status}`)
      setExpanded(null)
      setMeetLink('')
    } catch (e) { toast.error(e.response?.data?.message || 'Error') }
    finally { setActionLoading(null) }
  }

  const doCancel = async (id) => {
    if (!confirm('Cancel this session?')) return
    setActionLoading(id+'cancel')
    try {
      await sessionAPI.cancel(id)
      setSessions(ss => ss.map(s => s._id===id ? {...s,status:'cancelled'} : s))
      toast('Session cancelled')
    } catch { toast.error('Failed to cancel') }
    finally { setActionLoading(null) }
  }

  const TABS = [
    { v:'',          l:'All'       },
    { v:'pending',   l:'Pending'   },
    { v:'accepted',  l:'Accepted'  },
    { v:'completed', l:'Completed' },
    { v:'rejected',  l:'Rejected'  },
    { v:'cancelled', l:'Cancelled' },
  ]

  return (
    <div style={{ minHeight:'100vh' }}>
      <div style={{ position:'fixed', inset:0, background:'radial-gradient(ellipse 40% 30% at 85% 15%, rgba(34,197,94,0.05), transparent)', pointerEvents:'none' }} />
      <div style={{ maxWidth:900, margin:'0 auto', padding:'44px 28px 80px', position:'relative' }}>

        <h1 style={{ fontFamily:'var(--font-head)', fontSize:32, fontWeight:700, marginBottom:6 }}>My Sessions</h1>
        <p style={{ color:'var(--ink-2)', fontSize:15, marginBottom:28 }}>Manage all your mentoring sessions</p>

        {/* Filter tabs */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:24 }}>
          {TABS.map(t => {
            const count = t.v ? sessions.filter(s=>s.status===t.v).length : sessions.length
            const cfg   = STATUS_CONFIG[t.v]
            const isAct = filter===t.v
            return (
              <button key={t.v} onClick={()=>setFilter(t.v)} style={{
                padding:'8px 16px', borderRadius:100, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)',
                background: isAct ? (cfg?.bg||'rgba(255,255,255,.07)') : 'var(--bg-2)',
                border:`1px solid ${isAct ? (cfg?.color+'50'||'var(--border-2)') : 'var(--border)'}`,
                color: isAct ? (cfg?.color||'var(--ink)') : 'var(--ink-2)',
                display:'flex', alignItems:'center', gap:7,
              }}>
                {t.l}
                {!loading && count>0 && (
                  <span style={{ fontSize:11, fontWeight:700, background:'rgba(255,255,255,.1)', borderRadius:100, padding:'1px 7px' }}>{count}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[...Array(4)].map((_,i) => <div key={i} className="skeleton" style={{ height:82 }} />)}
          </div>
        ) : sessions.length===0 ? (
          <div style={{ textAlign:'center', padding:'70px 24px', color:'var(--ink-2)' }}>
            <div style={{ fontSize:52, marginBottom:16 }}>📭</div>
            <h3 style={{ fontFamily:'var(--font-head)', fontSize:20, marginBottom:8, color:'var(--ink)' }}>No sessions found</h3>
            <p>Sessions will appear here once booked.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {sessions.map(s => {
              const other  = user.role==='mentee' ? s.mentor : s.mentee
              const isOpen = expanded===s._id
              const sConf  = STATUS_CONFIG[s.status]

              return (
                <div key={s._id} style={{
                  background:'var(--bg-2)', border:`1px solid ${isOpen?'var(--border-2)':'var(--border)'}`,
                  borderRadius:16, overflow:'hidden', transition:'border-color .2s',
                }}>
                  {/* Main row */}
                  <div
                    style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:14, padding:'16px 20px', cursor:'pointer', flexWrap:'wrap' }}
                    onClick={() => setExpanded(isOpen ? null : s._id)}
                  >
                    <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                      <div style={{
                        width:46, height:46, borderRadius:12, flexShrink:0,
                        background:`linear-gradient(135deg,${sConf?.color||'var(--teal)'},var(--violet))`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:19, fontWeight:700, color:'var(--bg)', fontFamily:'var(--font-head)',
                      }}>{other?.name?.[0]?.toUpperCase()}</div>
                      <div>
                        <p style={{ fontSize:15, fontWeight:700, marginBottom:3 }}>{s.title}</p>
                        <p style={{ fontSize:12, color:'var(--ink-3)', fontFamily:'var(--font-mono)' }}>
                          {user.role==='mentee' ? `Mentor: ${s.mentor?.name}` : `Mentee: ${s.mentee?.name}`}
                          {' · '}{new Date(s.scheduledAt).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}
                          {' · '}{s.duration}min
                        </p>
                      </div>
                    </div>

                    <div style={{ display:'flex', alignItems:'center', gap:10 }} onClick={e=>e.stopPropagation()}>
                      <Badge status={s.status} />
                      {/* Quick actions */}
                      {s.status==='pending' && user.role==='mentee' && (
                        <button onClick={()=>doCancel(s._id)} disabled={!!actionLoading} className="btn btn-danger btn-sm">Cancel</button>
                      )}
                      {s.status==='accepted' && (
                        <button onClick={()=>doAction(s._id,'completed')} disabled={!!actionLoading} style={{
                          padding:'6px 14px', background:'var(--teal-dim)', border:'1px solid rgba(0,229,204,0.3)',
                          borderRadius:8, color:'var(--teal)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)',
                        }}>Mark Done</button>
                      )}
                      <span style={{ color:'var(--ink-3)', fontSize:16, userSelect:'none', transform: isOpen?'rotate(180deg)':'none', transition:'transform .2s', display:'inline-block' }}>⌄</span>
                    </div>
                  </div>

                  {/* Expanded */}
                  {isOpen && (
                    <div style={{ padding:'0 20px 20px', borderTop:'1px solid var(--border)', paddingTop:16, animation:'fadeIn .2s ease' }}>
                      {s.description && (
                        <p style={{ fontSize:14, color:'var(--ink-2)', lineHeight:1.65, marginBottom:14 }}>{s.description}</p>
                      )}

                      {s.meetingLink && (
                        <a href={s.meetingLink} target="_blank" rel="noreferrer" style={{
                          display:'inline-flex', alignItems:'center', gap:8, marginBottom:14,
                          padding:'9px 18px', background:'var(--green-dim)', border:'1px solid rgba(34,197,94,0.25)',
                          borderRadius:9, color:'var(--green)', fontSize:13, fontWeight:700,
                        }}>🔗 Join Meeting</a>
                      )}

                      {/* Mentor accept/reject panel */}
                      {user.role==='mentor' && s.status==='pending' && (
                        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center', marginTop:6 }}>
                          <input
                            value={meetLink} onChange={e=>setMeetLink(e.target.value)}
                            placeholder="Meeting link (optional)"
                            className="input" style={{ flex:1, minWidth:200, padding:'10px 14px', fontSize:13 }}
                          />
                          <button onClick={()=>doAction(s._id,'accepted',meetLink?{meetingLink:meetLink}:{})} disabled={!!actionLoading} style={{
                            padding:'10px 18px', background:'var(--green-dim)', border:'1px solid rgba(34,197,94,0.3)',
                            borderRadius:9, color:'var(--green)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)',
                          }}>✓ Accept</button>
                          <button onClick={()=>doAction(s._id,'rejected')} disabled={!!actionLoading} style={{
                            padding:'10px 18px', background:'var(--coral-dim)', border:'1px solid rgba(255,77,109,0.3)',
                            borderRadius:9, color:'var(--coral)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)',
                          }}>✕ Reject</button>
                        </div>
                      )}

                      {s.notes && <p style={{ fontSize:13, color:'var(--ink-3)', marginTop:10, fontStyle:'italic' }}>Note: {s.notes}</p>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
