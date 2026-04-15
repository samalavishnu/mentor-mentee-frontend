import React, { useState } from 'react'

const SKILLS = ['React','Node.js','Python','JavaScript','TypeScript','Java','AWS','DevOps','Machine Learning','Data Science','UI/UX','Product Management','MongoDB','GraphQL','Docker','System Design','Rust','Go','Flutter','Blockchain']

export default function SearchBar({ onSearch }) {
  const [search, setSearch]           = useState('')
  const [skill, setSkill]             = useState('')
  const [availability, setAvailability] = useState('')
  const [minRating, setMinRating]     = useState('')
  const [open, setOpen]               = useState(false)

  const submit = (e) => { e.preventDefault(); onSearch({ search, skill, availability, minRating }) }
  const clear  = ()  => { setSearch(''); setSkill(''); setAvailability(''); setMinRating(''); onSearch({}) }

  const hasFilters = skill || availability || minRating

  return (
    <form onSubmit={submit} style={{
      background:'var(--bg-2)', border:'1px solid var(--border)',
      borderRadius:18, padding:'18px 20px',
    }}>
      {/* Main row */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        <div style={{
          flex:1, minWidth:220, display:'flex', alignItems:'center', gap:10,
          background:'var(--bg-1)', border:'1px solid var(--border)',
          borderRadius:10, padding:'0 14px',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search mentors by name…"
            style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'var(--ink)', fontSize:15, padding:'13px 0', fontFamily:'var(--font-body)' }}
          />
        </div>

        <button type="button" onClick={()=>setOpen(!open)} style={{
          padding:'13px 18px', background: open||hasFilters ? 'var(--teal-dim)' : 'var(--bg-1)',
          border:`1px solid ${open||hasFilters ? 'rgba(0,229,204,0.3)' : 'var(--border)'}`,
          borderRadius:10, color: open||hasFilters ? 'var(--teal)' : 'var(--ink-2)',
          fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)',
          display:'flex', alignItems:'center', gap:7,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          Filters {hasFilters && <span style={{ background:'var(--teal)', color:'var(--bg)', borderRadius:'50%', width:16, height:16, fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>!</span>}
        </button>

        <button type="submit" className="btn btn-primary" style={{ padding:'13px 26px', fontSize:14, borderRadius:10 }}>
          Search
        </button>
      </div>

      {/* Filters panel */}
      {open && (
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:14, paddingTop:14, borderTop:'1px solid var(--border)' }}>
          <select value={skill} onChange={e=>setSkill(e.target.value)} className="input" style={{ flex:1, minWidth:155 }}>
            <option value="">All Skills</option>
            {SKILLS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select value={availability} onChange={e=>setAvailability(e.target.value)} className="input" style={{ flex:1, minWidth:155 }}>
            <option value="">Any Availability</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="unavailable">Unavailable</option>
          </select>
          <select value={minRating} onChange={e=>setMinRating(e.target.value)} className="input" style={{ flex:1, minWidth:135 }}>
            <option value="">Any Rating</option>
            <option value="3">3+ Stars</option>
            <option value="4">4+ Stars</option>
            <option value="4.5">4.5+ Stars</option>
          </select>
          {hasFilters && (
            <button type="button" onClick={clear} className="btn btn-danger btn-sm" style={{ alignSelf:'center', borderRadius:8 }}>
              ✕ Clear
            </button>
          )}
        </div>
      )}
    </form>
  )
}
