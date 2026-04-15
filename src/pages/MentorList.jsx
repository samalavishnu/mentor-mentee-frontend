import React, { useState, useEffect, useCallback } from 'react'
import { mentorAPI } from '../services/api'
import MentorCard from '../components/MentorCard'
import SearchBar from '../components/SearchBar'
import toast from 'react-hot-toast'

export default function MentorList() {
  const [mentors, setMentors]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal]         = useState(0)
  const [filters, setFilters]     = useState({})

  const fetchMentors = useCallback(async (f={}, p=1) => {
    setLoading(true)
    try {
      const { data } = await mentorAPI.getAll({ ...f, page:p, limit:12 })
      setMentors(data.mentors)
      setTotalPages(data.pages || 1)
      setTotal(data.total)
    } catch { toast.error('Failed to load mentors') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchMentors(filters, page) }, [page])

  const handleSearch = (f) => { setFilters(f); setPage(1); fetchMentors(f, 1) }

  return (
    <div style={{ minHeight:'100vh' }}>
      {/* Hero */}
      <section style={{ position:'relative', overflow:'hidden', padding:'80px 24px 60px', textAlign:'center' }}>
        {/* Animated gradient orbs */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
          <div style={{ position:'absolute', top:'0%', left:'50%', transform:'translateX(-50%)', width:600, height:300, borderRadius:'0 0 50% 50%', background:'radial-gradient(ellipse, rgba(0,229,204,0.12) 0%, transparent 70%)', animation:'floatY 6s ease-in-out infinite' }} />
          <div style={{ position:'absolute', top:'20%', left:'15%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,92,252,0.08), transparent 70%)', animation:'floatY 8s ease-in-out infinite reverse' }} />
          <div style={{ position:'absolute', top:'10%', right:'10%', width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,77,109,0.07), transparent 70%)', animation:'floatY 7s ease-in-out infinite 1s' }} />
        </div>

        <div style={{ position:'relative', maxWidth:680, margin:'0 auto' }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:8,
            padding:'6px 18px', borderRadius:100, marginBottom:24,
            background:'rgba(0,229,204,0.08)', border:'1px solid rgba(0,229,204,0.2)',
            fontSize:13, fontWeight:600, color:'var(--teal)',
          }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--teal)', animation:'pulse 2s infinite', display:'inline-block' }} />
            {total > 0 ? `${total} mentors available` : 'Find your perfect mentor'}
          </div>

          <h1 style={{
            fontFamily:'var(--font-head)', fontSize:'clamp(38px,6vw,64px)',
            fontWeight:700, lineHeight:1.08, marginBottom:18, letterSpacing:'-1px',
          }}>
            Learn from the{' '}
            <span style={{
              background:'linear-gradient(90deg, var(--teal), var(--violet), var(--coral))',
              backgroundSize:'200%', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              animation:'gradShift 4s ease infinite',
            }}>best in tech</span>
          </h1>

          <p style={{ fontSize:18, color:'var(--ink-2)', lineHeight:1.6, marginBottom:0 }}>
            1-on-1 mentorship sessions with engineers, designers, and leaders who've built what you want to build.
          </p>
        </div>
      </section>

      {/* Main content */}
      <div style={{ maxWidth:1300, margin:'0 auto', padding:'0 24px 80px' }}>
        <div style={{ marginBottom:24 }}>
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Results bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <span style={{ fontSize:14, color:'var(--ink-3)', fontFamily:'var(--font-mono)' }}>
            {loading ? '…' : `${total} result${total!==1?'s':''}`}
          </span>
          {Object.values(filters).some(Boolean) && (
            <button onClick={() => handleSearch({})} style={{
              background:'none', border:'none', color:'var(--coral)', fontSize:13,
              fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)',
            }}>✕ Clear all filters</button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:20 }}>
            {[...Array(8)].map((_,i) => (
              <div key={i} className="skeleton" style={{ height:280 }} />
            ))}
          </div>
        ) : mentors.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 24px', color:'var(--ink-2)' }}>
            <div style={{ fontSize:56, marginBottom:16 }}>🔍</div>
            <h3 style={{ fontFamily:'var(--font-head)', fontSize:22, marginBottom:8, color:'var(--ink)' }}>No mentors found</h3>
            <p>Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:20 }}>
            {mentors.map((m, i) => (
              <div key={m._id} style={{ animation:`fadeUp .4s ease ${i*0.05}s both` }}>
                <MentorCard mentor={m} />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:44 }}>
            <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="btn btn-ghost btn-sm">← Prev</button>
            {[...Array(totalPages)].map((_,i) => (
              <button key={i+1} onClick={() => setPage(i+1)} style={{
                width:36, height:36, borderRadius:8, border:'1px solid',
                borderColor: page===i+1 ? 'var(--teal)' : 'var(--border)',
                background: page===i+1 ? 'var(--teal)' : 'transparent',
                color: page===i+1 ? 'var(--bg)' : 'var(--ink-2)',
                fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)',
              }}>{i+1}</button>
            ))}
            <button disabled={page===totalPages} onClick={() => setPage(p=>p+1)} className="btn btn-ghost btn-sm">Next →</button>
          </div>
        )}
      </div>
    </div>
  )
}
