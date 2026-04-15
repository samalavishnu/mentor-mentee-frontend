import React from 'react'
import { Link } from 'react-router-dom'

function Stars({ n }) {
  return (
    <div className="stars">
      {[1,2,3,4,5].map(i => <span key={i} className={`star ${i<=Math.round(n)?'on':''}`}>★</span>)}
    </div>
  )
}

const AVAIL_COLORS = {
  available:   ['#22c55e','rgba(34,197,94,0.15)'],
  busy:        ['#ffc23e','rgba(255,194,62,0.15)'],
  unavailable: ['#ff4d6d','rgba(255,77,109,0.15)'],
}

export default function MentorCard({ mentor }) {
  const { user, skills=[], experience, rating, totalReviews, availability, title, company, followers, hourlyRate } = mentor
  if (!user) return null

  const [dotColor] = AVAIL_COLORS[availability] || AVAIL_COLORS.unavailable

  return (
    <Link to={`/mentors/${user._id}`} style={{ textDecoration:'none', display:'block', height:'100%' }}>
      <div className="card" style={{
        padding:'22px', height:'100%', display:'flex', flexDirection:'column', gap:16,
        cursor:'pointer', position:'relative', overflow:'hidden',
      }}>
        {/* Subtle glow top-right */}
        <div style={{
          position:'absolute', top:-40, right:-40,
          width:120, height:120, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(0,229,204,0.06), transparent 70%)',
          pointerEvents:'none',
        }} />

        {/* Header */}
        <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <div style={{
              width:54, height:54, borderRadius:14,
              background:'linear-gradient(135deg,var(--teal),var(--violet))',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:22, fontWeight:700, color:'var(--bg)',
              fontFamily:'var(--font-head)',
              overflow:'hidden',
            }}>
              {user.avatar
                ? <img src={user.avatar} alt={user.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                : user.name?.[0]?.toUpperCase()
              }
            </div>
            <span style={{
              position:'absolute', bottom:-2, right:-2,
              width:13, height:13, borderRadius:'50%',
              background: dotColor,
              border:'2.5px solid var(--bg-2)',
            }} title={availability} />
          </div>

          <div style={{ flex:1, minWidth:0 }}>
            <h3 style={{ fontFamily:'var(--font-head)', fontSize:16, fontWeight:700, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user.name}
            </h3>
            {(title||company) && (
              <p style={{ fontSize:12, color:'var(--ink-2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 }}>
                {[title,company].filter(Boolean).join(' · ')}
              </p>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <Stars n={rating||0} />
              <span style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>{rating>0?rating.toFixed(1):'New'}</span>
              {totalReviews>0 && <span style={{ fontSize:12, color:'var(--ink-3)' }}>({totalReviews})</span>}
            </div>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <p style={{ fontSize:13, color:'var(--ink-2)', lineHeight:1.55, flex:1 }}>
            {user.bio.length>110 ? user.bio.slice(0,110)+'…' : user.bio}
          </p>
        )}

        {/* Skills */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {skills.slice(0,4).map(s => (
            <span key={s} className="badge badge-teal" style={{ fontSize:11 }}>{s}</span>
          ))}
          {skills.length>4 && (
            <span className="badge badge-gray" style={{ fontSize:11 }}>+{skills.length-4}</span>
          )}
        </div>

        {/* Stats footer */}
        <div style={{
          display:'flex', borderTop:'1px solid var(--border)', paddingTop:14, marginTop:'auto',
        }}>
          {[
            { n: `${experience||0}yr`, l:'Exp' },
            { n: followers||0,         l:'Followers' },
            { n: hourlyRate>0?`$${hourlyRate}`:'Free', l:'/ hr' },
          ].map((s,i) => (
            <React.Fragment key={i}>
              {i>0 && <div style={{ width:1, background:'var(--border)', margin:'0 4px' }} />}
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}>
                <span style={{ fontSize:15, fontWeight:700, fontFamily:'var(--font-head)' }}>{s.n}</span>
                <span style={{ fontSize:10, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'.5px' }}>{s.l}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </Link>
  )
}
