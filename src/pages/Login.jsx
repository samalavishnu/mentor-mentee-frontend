import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import useAuth from '../hooks/useAuth'

const DEMOS = [
  { role:'Admin',       email:'admin@demo.com',       pass:'123456', icon:'🛡️', color:'#f9ca24' },
  { role:'Mentor',      email:'mentor@demo.com',      pass:'123456', icon:'🧑‍🏫', color:'#00e5cc' },
  { role:'Mentee',      email:'mentee@demo.com',      pass:'123456', icon:'🎓', color:'#7c5cfc' },
]

export default function Login() {
  const [form,    setForm]    = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authAPI.login(form)
      login(data)
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}! 👋`)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 24px', position:'relative' }}>
      {/* Background art */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', top:'5%', left:'8%', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle,rgba(0,229,204,0.07),transparent 70%)' }} />
        <div style={{ position:'absolute', bottom:'10%', right:'5%', width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,92,252,0.07),transparent 70%)' }} />
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.04 }}>
          <defs><pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth=".5"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div style={{ width:'100%', maxWidth:460, position:'relative', zIndex:1 }}>
        <div className="card" style={{ padding:'40px 36px' }}>
          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ width:54, height:54, borderRadius:16, margin:'0 auto 16px', background:'linear-gradient(135deg,var(--teal),var(--violet))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:900, color:'var(--bg)', fontFamily:'var(--font-head)' }}>M</div>
            <h1 style={{ fontFamily:'var(--font-head)', fontSize:28, fontWeight:700, marginBottom:6 }}>Welcome back</h1>
            <p style={{ color:'var(--ink-2)', fontSize:15 }}>Sign in to your MentorHub account</p>
          </div>

          <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div className="field">
              <label>Email address</label>
              <input className="input" type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com" required autoComplete="email" />
            </div>
            <div className="field">
              <label>Password</label>
              <input className="input" type="password" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••" required autoComplete="current-password" />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg"
              style={{ width:'100%', justifyContent:'center', marginTop:4 }}>
              {loading
                ? <><span className="spinner" style={{ width:18, height:18, borderWidth:2 }} /> Signing in…</>
                : 'Sign In →'}
            </button>
          </form>

          <p style={{ textAlign:'center', marginTop:20, fontSize:14, color:'var(--ink-2)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:'var(--teal)', fontWeight:700 }}>Create one free</Link>
          </p>

          {/* Demo accounts */}
          <div style={{ marginTop:24, padding:18, background:'var(--bg-1)', borderRadius:14, border:'1px solid var(--border)' }}>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'1px', textAlign:'center', marginBottom:12 }}>
              Quick Demo Access
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {DEMOS.map(d => (
                <button key={d.role} type="button"
                  onClick={() => setForm({ email: d.email, password: d.pass })}
                  style={{
                    background: 'var(--bg-2)', border: `1px solid ${d.color}33`,
                    borderRadius: 10, padding: '10px 10px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'border-color .2s, background .2s', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = d.color + '77'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = d.color + '33'}
                >
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{d.icon}</span>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: d.color, margin: 0, fontFamily: 'var(--font-head)' }}>{d.role}</p>
                    <p style={{ fontSize: 10, color: 'var(--ink-3)', margin: 0 }}>{d.email}</p>
                  </div>
                </button>
              ))}
            </div>
            <p style={{ fontSize:11, color:'var(--ink-3)', textAlign:'center', marginTop:10 }}>
              Click a role above, then hit Sign In
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
