import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { adminAPI } from '../services/api'

function StatBox({ icon, label, value, color='var(--teal)', trend }) {
  return (
    <div style={{
      background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:16,
      padding:'20px 22px', position:'relative', overflow:'hidden',
    }}>
      <div style={{ position:'absolute', top:-20, right:-20, width:90, height:90, borderRadius:'50%', background:`radial-gradient(circle, ${color}18, transparent 70%)`, pointerEvents:'none' }} />
      <div style={{ fontSize:26, marginBottom:10 }}>{icon}</div>
      <p style={{ fontFamily:'var(--font-head)', fontSize:30, fontWeight:700, color:'var(--ink)', marginBottom:3, lineHeight:1 }}>{value}</p>
      <p style={{ fontSize:12, fontWeight:700, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'.8px' }}>{label}</p>
      {trend && <p style={{ fontSize:12, color, marginTop:6, fontWeight:600 }}>{trend}</p>}
    </div>
  )
}

function ProgressBar({ label, val, total, color }) {
  const pct = total>0 ? Math.round((val/total)*100) : 0
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
        <span style={{ fontSize:13, fontWeight:600, color:'var(--ink-2)' }}>{label}</span>
        <span style={{ fontSize:13, fontWeight:700, color:'var(--ink)', fontFamily:'var(--font-mono)' }}>{val} / {total} ({pct}%)</span>
      </div>
      <div style={{ height:6, background:'rgba(255,255,255,.06)', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:3, transition:'width 1s ease' }} />
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [users,     setUsers]     = useState([])
  const [total,     setTotal]     = useState(0)
  const [loading,   setLoading]   = useState(true)
  const [usersLoading, setUsersLoading] = useState(false)
  const [tab,       setTab]       = useState('analytics')
  const [search,    setSearch]    = useState('')
  const [roleFilter,setRoleFilter] = useState('')
  const [page,      setPage]      = useState(1)

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await adminAPI.getAnalytics()
        setAnalytics(data.analytics)
      } catch { toast.error('Failed to load analytics') }
      finally { setLoading(false) }
    })()
  }, [])

  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      const { data } = await adminAPI.getUsers({ search, role:roleFilter, page, limit:15 })
      setUsers(data.users)
      setTotal(data.total)
    } catch { toast.error('Failed to load users') }
    finally { setUsersLoading(false) }
  }

  useEffect(() => { if (tab==='users') loadUsers() }, [tab, search, roleFilter, page])

  const handleToggle = async (id, isActive) => {
    try {
      await adminAPI.toggleUser(id)
      setUsers(us => us.map(u => u._id===id ? {...u,isActive:!u.isActive} : u))
      toast.success(`User ${isActive?'deactivated':'activated'}`)
    } catch { toast.error('Failed') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this user? This cannot be undone.')) return
    try {
      await adminAPI.deleteUser(id)
      setUsers(us => us.filter(u=>u._id!==id))
      toast.success('User deleted')
    } catch { toast.error('Failed to delete') }
  }

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  const a = analytics || {}

  const ROLE_STYLES = {
    mentor: { bg:'var(--violet-dim)', color:'var(--violet)' },
    mentee: { bg:'var(--teal-dim)',   color:'var(--teal)'   },
    admin:  { bg:'var(--gold-dim)',   color:'var(--gold)'   },
  }

  return (
    <div style={{ minHeight:'100vh' }}>
      <div style={{ position:'fixed', inset:0, background:'radial-gradient(ellipse 40% 30% at 50% -5%, rgba(255,194,62,0.05), transparent)', pointerEvents:'none' }} />
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'44px 28px 80px', position:'relative' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16, marginBottom:32 }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'4px 14px', background:'var(--gold-dim)', border:'1px solid rgba(255,194,62,0.25)', borderRadius:100, fontSize:12, fontWeight:700, color:'var(--gold)', marginBottom:10, textTransform:'uppercase', letterSpacing:'.5px' }}>
              🔒 Admin Access
            </div>
            <h1 style={{ fontFamily:'var(--font-head)', fontSize:30, fontWeight:700, marginBottom:4 }}>Admin Dashboard</h1>
            <p style={{ color:'var(--ink-2)', fontSize:15 }}>Platform health, analytics & user management</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:28 }}>
          {[['analytics','📊 Analytics'],['users','👥 Users']].map(([t,l]) => (
            <button key={t} onClick={()=>setTab(t)} style={{
              padding:'10px 22px', borderRadius:10, fontSize:14, fontWeight:700,
              cursor:'pointer', fontFamily:'var(--font-body)',
              background: tab===t ? 'var(--teal-dim)' : 'var(--bg-2)',
              border:`1px solid ${tab===t?'rgba(0,229,204,0.4)':'var(--border)'}`,
              color: tab===t ? 'var(--teal)' : 'var(--ink-2)',
            }}>{l}</button>
          ))}
        </div>

        {/* Analytics tab */}
        {tab==='analytics' && (
          <div style={{ animation:'fadeUp .3s ease' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14, marginBottom:28 }}>
              <StatBox icon="👥" label="Total Users"    value={a.totalUsers||0}    color="var(--teal)"   trend={a.recentUsers?`+${a.recentUsers} this week`:null} />
              <StatBox icon="🧑‍🏫" label="Mentors"        value={a.totalMentors||0}  color="var(--violet)" />
              <StatBox icon="🎓" label="Mentees"        value={a.totalMentees||0}  color="var(--coral)"  />
              <StatBox icon="📅" label="Total Sessions" value={a.totalSessions||0} color="var(--gold)"   />
              <StatBox icon="⏳" label="Pending"        value={a.pendingSessions||0} color="var(--gold)" />
              <StatBox icon="✅" label="Completed"      value={a.completedSessions||0} color="var(--green)" />
              <StatBox icon="⭐" label="Reviews"        value={a.totalFeedback||0} color="var(--gold)"   />
              <StatBox icon="🔗" label="Connections"    value={a.totalFollows||0}  color="var(--violet)" />
            </div>

            {/* Chart-like progress bars */}
            <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:18, padding:28 }}>
              <h2 style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:700, marginBottom:24 }}>Platform Composition</h2>
              <ProgressBar label="Mentors"            val={a.totalMentors||0}      total={a.totalUsers||1}      color="var(--violet)" />
              <ProgressBar label="Mentees"            val={a.totalMentees||0}      total={a.totalUsers||1}      color="var(--teal)"   />
              <ProgressBar label="Completed Sessions" val={a.completedSessions||0} total={a.totalSessions||1}   color="var(--green)"  />
              <ProgressBar label="Pending Sessions"   val={a.pendingSessions||0}   total={a.totalSessions||1}   color="var(--gold)"   />

              <div style={{ height:1, background:'var(--border)', margin:'24px 0' }} />
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, textAlign:'center' }}>
                {[
                  { label:'New users (7d)', value:a.recentUsers||0, color:'var(--teal)' },
                  { label:'Conversion rate', value:a.totalSessions>0 ? `${Math.round((a.completedSessions/a.totalSessions)*100)}%` : '0%', color:'var(--green)' },
                  { label:'Reviews / mentor', value:a.totalMentors>0 ? (a.totalFeedback/a.totalMentors).toFixed(1) : '0', color:'var(--gold)' },
                ].map(m => (
                  <div key={m.label} style={{ padding:'16px', background:'var(--bg-1)', borderRadius:12 }}>
                    <p style={{ fontFamily:'var(--font-head)', fontSize:28, fontWeight:700, color:m.color, marginBottom:4 }}>{m.value}</p>
                    <p style={{ fontSize:12, color:'var(--ink-3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.5px' }}>{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users tab */}
        {tab==='users' && (
          <div style={{ animation:'fadeUp .3s ease' }}>
            <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
              <input
                value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}
                placeholder="🔍 Search by name…"
                className="input" style={{ flex:1, minWidth:220, padding:'11px 16px' }}
              />
              <select value={roleFilter} onChange={e=>{setRoleFilter(e.target.value);setPage(1)}} className="input" style={{ minWidth:150 }}>
                <option value="">All Roles</option>
                <option value="mentor">Mentor</option>
                <option value="mentee">Mentee</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <p style={{ fontSize:13, color:'var(--ink-3)', marginBottom:14, fontFamily:'var(--font-mono)' }}>{total} users found</p>

            {usersLoading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[...Array(6)].map((_,i) => <div key={i} className="skeleton" style={{ height:62 }} />)}
              </div>
            ) : (
              <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'rgba(255,255,255,.02)' }}>
                      {['User','Role','Status','Joined','Actions'].map(h => (
                        <th key={h} style={{ padding:'13px 18px', fontSize:11, fontWeight:700, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'1px', textAlign:'left', borderBottom:'1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u,i) => {
                      const rs = ROLE_STYLES[u.role] || {}
                      return (
                        <tr key={u._id} style={{ borderBottom:'1px solid var(--border)', animation:`fadeIn .3s ease ${i*0.03}s both` }}>
                          <td style={{ padding:'13px 18px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <div style={{
                                width:36, height:36, borderRadius:10, flexShrink:0,
                                background:'linear-gradient(135deg,var(--teal),var(--violet))',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                fontSize:15, fontWeight:700, color:'var(--bg)',
                              }}>{u.name?.[0]?.toUpperCase()}</div>
                              <div>
                                <p style={{ fontSize:14, fontWeight:700, color:'var(--ink)', margin:0 }}>{u.name}</p>
                                <p style={{ fontSize:12, color:'var(--ink-3)', margin:0, fontFamily:'var(--font-mono)' }}>{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding:'13px 18px' }}>
                            <span style={{ padding:'3px 11px', borderRadius:100, fontSize:11, fontWeight:700, textTransform:'capitalize', background:rs.bg, color:rs.color }}>{u.role}</span>
                          </td>
                          <td style={{ padding:'13px 18px' }}>
                            <span style={{
                              padding:'3px 11px', borderRadius:100, fontSize:11, fontWeight:700,
                              background: u.isActive ? 'var(--green-dim)' : 'var(--coral-dim)',
                              color: u.isActive ? 'var(--green)' : 'var(--coral)',
                            }}>{u.isActive?'Active':'Inactive'}</span>
                          </td>
                          <td style={{ padding:'13px 18px', fontSize:12, color:'var(--ink-3)', fontFamily:'var(--font-mono)' }}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding:'13px 18px' }}>
                            <div style={{ display:'flex', gap:8 }}>
                              <button onClick={()=>handleToggle(u._id, u.isActive)} style={{
                                padding:'5px 12px', background:'transparent', border:'1px solid',
                                borderColor: u.isActive ? 'rgba(255,77,109,0.3)' : 'rgba(34,197,94,0.3)',
                                borderRadius:7, color: u.isActive ? 'var(--coral)' : 'var(--green)',
                                fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)',
                              }}>{u.isActive?'Deactivate':'Activate'}</button>
                              <button onClick={()=>handleDelete(u._id)} style={{
                                padding:'5px 12px', background:'transparent', border:'1px solid rgba(255,77,109,0.25)',
                                borderRadius:7, color:'var(--coral)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)',
                              }}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {total > 15 && (
              <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:10, marginTop:20 }}>
                <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="btn btn-ghost btn-sm">← Prev</button>
                <span style={{ fontSize:14, color:'var(--ink-2)', fontFamily:'var(--font-mono)' }}>Page {page} of {Math.ceil(total/15)}</span>
                <button disabled={users.length<15} onClick={()=>setPage(p=>p+1)} className="btn btn-ghost btn-sm">Next →</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
