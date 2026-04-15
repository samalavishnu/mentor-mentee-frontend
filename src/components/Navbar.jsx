import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  const isActive = (p) => pathname === p || pathname.startsWith(p + '/')

  const links = [
    { to: '/mentors',   label: 'Discover' },
    ...(isAuthenticated ? [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/sessions',  label: 'Sessions'  },
      { to: '/chat',      label: '💬 Chat'   },
    ] : []),
    ...(user?.role === 'mentor' ? [{ to: '/mentor/edit', label: 'My Profile' }] : []),
    ...(user?.role === 'admin'  ? [{ to: '/admin',       label: 'Admin'      }] : []),
  ]

  return (
    <header style={{
      position:'sticky', top:0, zIndex:100,
      background: scrolled ? 'rgba(5,5,8,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      transition:'all .3s ease',
    }}>
      <nav style={{ maxWidth:1300, margin:'0 auto', padding:'0 28px', height:64, display:'flex', alignItems:'center', gap:24 }}>
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{
            width:34, height:34, borderRadius:10,
            background:'linear-gradient(135deg,var(--teal),var(--violet))',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:16, fontWeight:900, color:'var(--bg)', fontFamily:'var(--font-head)',
          }}>M</div>
          <span style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:20, letterSpacing:'-0.5px' }}>
            Mentor<span style={{ color:'var(--teal)' }}>Hub</span>
          </span>
        </Link>

        <div style={{ display:'flex', gap:2, flex:1 }}>
          {links.map(l => (
            <Link key={l.to} to={l.to} style={{
              padding:'7px 14px', borderRadius:8, fontSize:14, fontWeight:600,
              color: isActive(l.to) ? 'var(--ink)' : 'var(--ink-2)',
              background: isActive(l.to) ? 'rgba(255,255,255,0.07)' : 'transparent',
              transition:'all .2s',
            }}>{l.label}</Link>
          ))}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10, marginLeft:'auto', flexShrink:0 }}>
          {isAuthenticated ? (
            <>
              <div style={{
                display:'flex', alignItems:'center', gap:9, padding:'5px 14px 5px 5px',
                background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:100,
              }}>
                <div style={{
                  width:30, height:30, borderRadius:'50%', flexShrink:0,
                  background:'linear-gradient(135deg,var(--teal),var(--coral))',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:13, fontWeight:700, color:'var(--bg)',
                }}>{user?.name?.[0]?.toUpperCase()}</div>
                <span style={{ fontSize:14, fontWeight:600 }}>{user?.name?.split(' ')[0]}</span>
                <span style={{
                  fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:100,
                  background:'var(--teal-dim)', color:'var(--teal)', textTransform:'uppercase', letterSpacing:'.5px',
                }}>{user?.role}</span>
              </div>
              <button onClick={() => { logout(); navigate('/login') }} style={{
                background:'transparent', border:'1px solid var(--border)', color:'var(--ink-2)',
                padding:'8px 14px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)',
              }}>Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login"    style={{ padding:'8px 16px', borderRadius:8, fontSize:14, fontWeight:600, color:'var(--ink-2)' }}>Sign in</Link>
              <Link to="/register" style={{ padding:'8px 18px', borderRadius:8, fontSize:14, fontWeight:700, background:'var(--teal)', color:'var(--bg)' }}>Get Started</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
