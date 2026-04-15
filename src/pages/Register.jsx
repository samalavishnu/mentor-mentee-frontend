import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import useAuth from '../hooks/useAuth'

export default function Register() {
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'mentee' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handle = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const { data } = await authAPI.register(form)
      login(data)
      toast.success('Account created! Welcome to MentorHub 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  const roles = [
    { id:'mentee', icon:'🎓', title:'I want to learn', desc:'Find expert mentors & book sessions' },
    { id:'mentor', icon:'🧑‍🏫', title:'I want to mentor', desc:'Share your expertise & earn' },
  ]

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 24px', position:'relative' }}>
      {/* BG art */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', top:'-10%', right:'10%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,77,109,0.07), transparent 70%)' }} />
        <div style={{ position:'absolute', bottom:0, left:'5%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,229,204,0.06), transparent 70%)' }} />
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.04 }}>
          <defs><pattern id="g2" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth=".5"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#g2)" />
        </svg>
      </div>

      <div style={{ width:'100%', maxWidth:480, position:'relative', zIndex:1 }}>
        <div className="card" style={{ padding:'40px 36px' }}>
          <div style={{ textAlign:'center', marginBottom:28 }}>
            <div style={{
              width:52, height:52, borderRadius:16, margin:'0 auto 16px',
              background:'linear-gradient(135deg,var(--coral),var(--violet))',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:26, fontWeight:900, color:'#fff', fontFamily:'var(--font-head)',
            }}>M</div>
            <h1 style={{ fontFamily:'var(--font-head)', fontSize:26, fontWeight:700, marginBottom:6 }}>Join MentorHub</h1>
            <p style={{ color:'var(--ink-2)', fontSize:15 }}>Connect · Learn · Grow together</p>
          </div>

          {/* Role selector */}
          <div style={{ display:'flex', gap:12, marginBottom:26 }}>
            {roles.map(r => (
              <button key={r.id} type="button" onClick={() => setForm({...form, role:r.id})} style={{
                flex:1, padding:'16px 10px',
                background: form.role===r.id ? 'rgba(0,229,204,0.08)' : 'var(--bg-1)',
                border: `1.5px solid ${form.role===r.id ? 'rgba(0,229,204,0.4)' : 'var(--border)'}`,
                borderRadius:14, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                transition:'all .2s',
              }}>
                <span style={{ fontSize:26 }}>{r.icon}</span>
                <span style={{ fontSize:13, fontWeight:700, color: form.role===r.id ? 'var(--teal)' : 'var(--ink)', fontFamily:'var(--font-head)' }}>{r.title}</span>
                <span style={{ fontSize:11, color:'var(--ink-3)', textAlign:'center', lineHeight:1.4 }}>{r.desc}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="field">
              <label>Full Name</label>
              <input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="John Doe" required />
            </div>
            <div className="field">
              <label>Email Address</label>
              <input className="input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com" required />
            </div>
            <div className="field">
              <label>Password</label>
              <input className="input" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Min. 6 characters" required />
            </div>
            <button type="submit" disabled={loading} style={{
              marginTop:6, padding:'14px', width:'100%',
              background:`linear-gradient(135deg, var(--teal), var(--violet))`,
              border:'none', borderRadius:12, color:'var(--bg)',
              fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-head)',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              opacity: loading ? .7 : 1,
            }}>
              {loading ? <span className="spinner" style={{ width:18,height:18,borderWidth:2,borderTopColor:'var(--bg)' }} /> : null}
              {loading ? 'Creating account…' : `Create ${form.role==='mentor'?'Mentor':'Mentee'} Account →`}
            </button>
          </form>

          <p style={{ textAlign:'center', marginTop:20, fontSize:14, color:'var(--ink-2)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'var(--teal)', fontWeight:700 }}>Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
