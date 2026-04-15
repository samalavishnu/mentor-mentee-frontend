import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { mentorAPI, followAPI, feedbackAPI, sessionAPI, certAPI, getFileUrl } from '../services/api'
import useAuth from '../hooks/useAuth'
import ChatButton from '../components/ChatButton'

/* ── tiny helpers ── */
function Stars({ n, interactive, onRate }) {
  return (
    <div style={{ display:'flex', gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} onClick={() => interactive && onRate?.(i)}
          style={{ fontSize: interactive?28:14, color: i<=Math.round(n) ? '#f9ca24' : 'rgba(255,255,255,0.2)', cursor: interactive?'pointer':'default', transition:'color .15s' }}>★</span>
      ))}
    </div>
  )
}

const AVAIL = {
  available:   { label:'Open to mentor', color:'#22c55e', dot:'#22c55e' },
  busy:        { label:'Limited availability', color:'#f9ca24', dot:'#f9ca24' },
  unavailable: { label:'Not available',  color:'#ff4d6d', dot:'#ff4d6d' },
}

/* ── Payment modal ── */
function PaymentModal({ mentor, onConfirm, onCancel }) {
  const [utr, setUtr] = useState('')
  const amount = mentor?.hourlyRate || 0
  const upiId  = mentor?.upiId || ''
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth:460 }} onClick={e=>e.stopPropagation()}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ width:64, height:64, borderRadius:20, background:'linear-gradient(135deg,#22c55e,#00e5cc)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, margin:'0 auto 14px' }}>💳</div>
          <h2 style={{ fontFamily:'var(--font-head)', fontSize:22, fontWeight:700, marginBottom:6 }}>Complete Payment</h2>
          <p style={{ color:'var(--ink-2)', fontSize:14 }}>Pay mentor before booking your slot</p>
        </div>
        <div style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:14, padding:'18px 20px', marginBottom:20, textAlign:'center' }}>
          <p style={{ fontSize:13, color:'var(--ink-2)', marginBottom:4 }}>Session Fee</p>
          <p style={{ fontFamily:'var(--font-head)', fontSize:40, fontWeight:800, color:'#22c55e', margin:0 }}>₹{amount}<span style={{ fontSize:16, color:'var(--ink-3)' }}>/hr</span></p>
        </div>
        <div style={{ background:'var(--bg-1)', border:'1px solid var(--border)', borderRadius:14, padding:20, marginBottom:20 }}>
          <p style={{ fontSize:11, fontWeight:700, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:12 }}>Pay via UPI</p>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <p style={{ fontSize:12, color:'var(--ink-2)', marginBottom:4 }}>UPI ID</p>
              <p style={{ fontFamily:'var(--font-mono)', fontSize:17, fontWeight:700, color:'var(--teal)' }}>{upiId}</p>
            </div>
            <button onClick={() => { navigator.clipboard?.writeText(upiId); toast.success('Copied!') }}
              style={{ padding:'7px 14px', background:'var(--teal-dim)', border:'1px solid rgba(0,229,204,0.3)', borderRadius:8, color:'var(--teal)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' }}>Copy</button>
          </div>
          <div style={{ width:120, height:120, margin:'0 auto', background:'var(--bg-2)', border:'2px dashed var(--border-2)', borderRadius:12, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6 }}>
            <span style={{ fontSize:32 }}>📱</span>
            <span style={{ fontSize:11, color:'var(--ink-3)' }}>Scan QR</span>
          </div>
        </div>
        <div style={{ fontSize:13, color:'var(--ink-2)', lineHeight:1.7, marginBottom:20 }}>
          {['Open GPay / PhonePe / Paytm', `Pay ₹${amount} to ${upiId}`, 'Copy UTR / Transaction ID', 'Paste below and confirm'].map((s,i) => (
            <div key={i} style={{ display:'flex', gap:10, marginBottom:6 }}>
              <span style={{ color:'var(--teal)', fontWeight:700 }}>{i+1}.</span><span>{s}</span>
            </div>
          ))}
        </div>
        <div className="field" style={{ marginBottom:20 }}>
          <label>UTR / Transaction ID <span style={{ color:'var(--coral)' }}>*</span></label>
          <input className="input" value={utr} onChange={e=>setUtr(e.target.value)} placeholder="12-digit UTR or transaction reference" />
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel} className="btn btn-ghost" style={{ flex:1, justifyContent:'center' }}>Cancel</button>
          <button onClick={() => { if(!utr.trim()){toast.error('Enter UTR first');return} onConfirm({utrNumber:utr.trim(),paymentAmount:amount}) }}
            className="btn btn-primary" style={{ flex:2, justifyContent:'center', fontSize:15 }}>✓ Done — Book Session</button>
        </div>
      </div>
    </div>
  )
}

/* ── Book modal ── */
function BookModal({ mentorId, paymentInfo, onBook, onCancel }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    selectedDate: '',
    selectedTime: '',
    duration: 60,
  })

  const [manual, setManual] = useState({
    day: '',
    month: '',
    year: '',
    hour: '',
    minute: '',
    ampm: 'AM',
  })

  const [saving, setSaving] = useState(false)
  const dateInputRef = useRef(null)
  const dayRef = useRef(null)
  const monthRef = useRef(null)
  const yearRef = useRef(null)
  const hourRef = useRef(null)
  const minuteRef = useRef(null)
  const ampmRef = useRef(null)

  const openDatePicker = () => {
    if (dateInputRef.current?.showPicker) {
      dateInputRef.current.showPicker()
    } else {
      dateInputRef.current?.focus()
    }
  }

  const handleManualChange = (field, value, maxLength, nextRef) => {
    const digitsOnlyFields = ['day', 'month', 'year', 'hour', 'minute']
    const cleaned = digitsOnlyFields.includes(field)
      ? value.replace(/\D/g, '').slice(0, maxLength)
      : value

    setManual(prev => ({
      ...prev,
      [field]: cleaned,
    }))

    setForm(prev => ({
      ...prev,
      selectedDate: '',
      selectedTime: '',
    }))

    if (cleaned.length === maxLength && nextRef?.current) {
      nextRef.current.focus()
    }
  }

  const convertManualToISO = () => {
    const { day, month, year, hour, minute, ampm } = manual

    if (!day || !month || !year || !hour || !minute || !ampm) return ''

    const dd = Number(day)
    const mm = Number(month)
    const yyyy = Number(year)
    let hh = Number(hour)
    const min = Number(minute)

    if (dd < 1 || dd > 31) return ''
    if (mm < 1 || mm > 12) return ''
    if (yyyy < 1000 || yyyy > 9999) return ''
    if (hh < 1 || hh > 12) return ''
    if (min < 0 || min > 59) return ''

    if (ampm === 'PM' && hh !== 12) hh += 12
    if (ampm === 'AM' && hh === 12) hh = 0

    const pad = n => String(n).padStart(2, '0')
    return `${yyyy}-${pad(mm)}-${pad(dd)}T${pad(hh)}:${pad(min)}`
  }

  const hasManualValue =
    manual.day || manual.month || manual.year || manual.hour || manual.minute

  const handle = async e => {
    e.preventDefault()
    setSaving(true)

    let finalDate = ''

    if (hasManualValue) {
      finalDate = convertManualToISO()
      if (!finalDate) {
        toast.error('Enter a valid manual date and time')
        setSaving(false)
        return
      }
    } else if (form.selectedDate && form.selectedTime) {
      finalDate = `${form.selectedDate}T${form.selectedTime}`
    }

    if (!finalDate) {
      toast.error('Please select date/time or enter manually')
      setSaving(false)
      return
    }

    try {
      await onBook({
        mentor: mentorId,
        title: form.title,
        description: form.description,
        duration: form.duration,
        scheduledAt: finalDate,
        ...paymentInfo,
      })
      toast.success('Session booked! 📅')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
          📅 Book a Session
        </h2>

        {paymentInfo?.utrNumber && (
          <div
            style={{
              padding: '8px 14px',
              background: 'var(--green-dim)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 8,
              marginBottom: 18,
              fontSize: 13,
              color: 'var(--green)',
              fontWeight: 600,
            }}
          >
            ✓ Payment confirmed · UTR: {paymentInfo.utrNumber}
          </div>
        )}

        <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label>Session Title</label>
            <input
              className="input"
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="What do you want to discuss?"
              required
            />
          </div>

          <div className="field">
            <label>Description</label>
            <textarea
              className="input"
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              style={{ height: 80 }}
              placeholder="Add context…"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.8fr', gap: 12 }}>
            <div className="field">
              <label>Select Date</label>
              <div style={{ position: 'relative' }}>
                <input
                  ref={dateInputRef}
                  className="input"
                  type="date"
                  value={form.selectedDate}
                  onChange={e => {
                    setForm(prev => ({ ...prev, selectedDate: e.target.value }))
                    setManual({
                      day: '',
                      month: '',
                      year: '',
                      hour: '',
                      minute: '',
                      ampm: 'AM',
                    })
                  }}
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={openDatePicker}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 16,
                  }}
                >
                  📅
                </button>
              </div>
            </div>

            <div className="field">
              <label>Select Time</label>
              <input
                className="input"
                type="time"
                value={form.selectedTime}
                onChange={e => {
                  setForm(prev => ({ ...prev, selectedTime: e.target.value }))
                  setManual({
                    day: '',
                    month: '',
                    year: '',
                    hour: '',
                    minute: '',
                    ampm: 'AM',
                  })
                }}
              />
            </div>

            <div className="field">
              <label>Duration</label>
              <select
                className="input"
                value={form.duration}
                onChange={e => setForm(prev => ({ ...prev, duration: Number(e.target.value) }))}
              >
                {[30, 45, 60, 90, 120].map(d => (
                  <option key={d} value={d}>
                    {d} min
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Or Enter Date & Time Manually</label>

            <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 0.7fr 1fr 0.7fr 0.7fr 0.9fr', gap: 8 }}>
              <input
                ref={dayRef}
                className="input"
                placeholder="DD"
                value={manual.day}
                onChange={e => handleManualChange('day', e.target.value, 2, monthRef)}
              />
              <input
                ref={monthRef}
                className="input"
                placeholder="MM"
                value={manual.month}
                onChange={e => handleManualChange('month', e.target.value, 2, yearRef)}
              />
              <input
                ref={yearRef}
                className="input"
                placeholder="YYYY"
                value={manual.year}
                onChange={e => handleManualChange('year', e.target.value, 4, hourRef)}
              />
              <input
                ref={hourRef}
                className="input"
                placeholder="HH"
                value={manual.hour}
                onChange={e => handleManualChange('hour', e.target.value, 2, minuteRef)}
              />
              <input
                ref={minuteRef}
                className="input"
                placeholder="MM"
                value={manual.minute}
                onChange={e => handleManualChange('minute', e.target.value, 2, ampmRef)}
              />
              <select
                ref={ampmRef}
                className="input"
                value={manual.ampm}
                onChange={e => setManual(prev => ({ ...prev, ampm: e.target.value }))}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onCancel} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Booking…' : 'Confirm Booking →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */
/*  MAIN PROFILE PAGE — LinkedIn-inspired                    */
/* ══════════════════════════════════════════════════════════ */
export default function Profile() {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [mentor,       setMentor]       = useState(null)
  const [feedback,     setFeedback]     = useState([])
  const [certs,        setCerts]        = useState([])
  const [followState,  setFollowState]  = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [followLoading,setFollowLoading]= useState(false)
  const [tab,          setTab]          = useState('about')
  const [showPayment,  setShowPayment]  = useState(false)
  const [showBook,     setShowBook]     = useState(false)
  const [paymentInfo,  setPaymentInfo]  = useState(null)
  const [showReview,   setShowReview]   = useState(false)
  const [revForm,      setRevForm]      = useState({ rating:5, review:'' })
  const [submitting,   setSubmitting]   = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const [mRes, fRes, cRes] = await Promise.all([
          mentorAPI.getOne(id),
          feedbackAPI.getMentorFeedback(id),
          certAPI.getMentorCerts(id),
        ])
        setMentor(mRes.data.mentor)
        setFeedback(fRes.data.feedback)
        setCerts(cRes.data.certifications || [])
        if (isAuthenticated) {
          const { data } = await followAPI.checkFollow(id)
          setFollowState(data.follow)
        }
      } catch { toast.error('Failed to load profile') }
      finally { setLoading(false) }
    })()
  }, [id, isAuthenticated])

  const handleFollow = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    setFollowLoading(true)
    try {
      if (followState && followState.status !== 'rejected') {
        await followAPI.unfollow(id); setFollowState(null); toast('Unfollowed')
      } else {
        const { data } = await followAPI.follow(id); setFollowState(data.follow)
        toast.success('Follow request sent!')
      }
    } catch (e) { toast.error(e.response?.data?.message || 'Error') }
    finally { setFollowLoading(false) }
  }

  const handleBookStart = () => {
    if (!isAuthenticated) { navigate('/login'); return }
    if (mentor?.paymentRequired && mentor?.hourlyRate > 0 && mentor?.upiId) setShowPayment(true)
    else { setPaymentInfo({ utrNumber:'', paymentAmount:0 }); setShowBook(true) }
  }

  const handleBook = async (data) => { await sessionAPI.book(data); setShowBook(false); setPaymentInfo(null) }

  const handleReview = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      const { data } = await feedbackAPI.submit({ mentor:id, ...revForm })
      setFeedback(f => [data.feedback, ...f]); toast.success('Review submitted!'); setShowReview(false)
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="page-loader"><div className="spinner" /></div>
  if (!mentor)  return <div style={{ textAlign:'center', padding:80, color:'var(--ink-2)' }}>Mentor not found.</div>

  const { user:mu, skills=[], experience, rating, totalReviews, availability, title, company,
          linkedin, github, website, totalSessions, followers, hourlyRate, upiId, paymentRequired } = mentor
  const av      = AVAIL[availability] || AVAIL.unavailable
  const isOwn   = user?._id === mu?._id
  const canBook  = isAuthenticated && !isOwn && user?.role === 'mentee'
  const canReview = isAuthenticated && user?.role==='mentee' && !isOwn
  const chatEnabled = followState?.status === 'accepted'
  const verifiedCerts = certs.filter(c => c.verified)

  const followBtnLabel = () => {
    if (followLoading) return '…'
    if (!followState)                        return '+ Connect'
    if (followState.status === 'pending')    return '⏳ Pending'
    if (followState.status === 'accepted')   return '✓ Connected'
    return '+ Connect'
  }
  const followBtnColor = () => {
    if (followState?.status === 'pending')  return { bg:'rgba(255,194,62,0.1)', border:'rgba(255,194,62,0.4)', color:'#f9ca24' }
    if (followState?.status === 'accepted') return { bg:'var(--teal-dim)', border:'rgba(0,229,204,0.4)', color:'var(--teal)' }
    return { bg:'var(--teal)', border:'var(--teal)', color:'var(--bg)' }
  }
  const fbc = followBtnColor()

  /* ── RENDER ── */
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>

      {/* ── COVER PHOTO ── */}
      <div style={{ height:200, background:'linear-gradient(135deg,#0d0d20 0%,#13132a 40%,#1a0a2e 100%)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse 80% 80% at 30% 50%,rgba(0,229,204,0.12),transparent),radial-gradient(ellipse 60% 60% at 80% 20%,rgba(124,92,252,0.1),transparent)' }} />
        {/* Geometric accent */}
        <svg style={{ position:'absolute', bottom:0, right:0, opacity:.08 }} width="500" height="200" viewBox="0 0 500 200">
          <polygon points="500,0 500,200 200,200" fill="#7c5cfc" />
          <polygon points="500,0 350,200 500,200" fill="#00e5cc" opacity=".5" />
        </svg>
      </div>

      {/* ── PROFILE CARD ── */}
      <div style={{ maxWidth:900, margin:'0 auto', padding:'0 24px' }}>

        {/* Avatar + actions row */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:16, marginTop:-60, marginBottom:0, position:'relative' }}>

          {/* BIG Avatar */}
          <div style={{ position:'relative', flexShrink:0 }}>
            <div style={{
              width:130, height:130, borderRadius:24,
              background: mu.avatar ? 'transparent' : 'linear-gradient(135deg,var(--teal),var(--violet))',
              border:'4px solid var(--bg)', boxShadow:'0 8px 32px rgba(0,0,0,0.6)',
              display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden',
              fontSize:52, fontWeight:800, color:'var(--bg)', fontFamily:'var(--font-head)',
            }}>
              {mu.avatar
                ? <img src={getFileUrl(mu.avatar)} alt={mu.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : mu.name?.[0]?.toUpperCase()
              }
            </div>
            {/* Availability dot */}
            <div style={{ position:'absolute', bottom:6, right:6, display:'flex', alignItems:'center', gap:5, background:'var(--bg-2)', border:'2px solid var(--bg)', borderRadius:100, padding:'3px 8px' }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:av.dot, display:'inline-block', flexShrink:0 }} />
              <span style={{ fontSize:11, fontWeight:700, color:av.color, whiteSpace:'nowrap' }}>{av.label}</span>
            </div>
          </div>

          {/* Action buttons */}
          {!isOwn && (
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', paddingBottom:4 }}>
              <button onClick={handleFollow} disabled={followLoading || followState?.status==='pending'}
                style={{ padding:'10px 22px', borderRadius:10, border:`1.5px solid ${fbc.border}`, background:fbc.bg, color:fbc.color, fontSize:14, fontWeight:700, cursor: followState?.status==='pending'?'default':'pointer', fontFamily:'var(--font-body)', opacity:followLoading?.6:1 }}>
                {followBtnLabel()}
              </button>
              {chatEnabled && <ChatButton otherUser={mu} />}
              {canBook && (
                <button onClick={handleBookStart} className="btn btn-primary">
                  {paymentRequired && hourlyRate > 0 ? '💳 Pay & Book' : '📅 Book Session'}
                </button>
              )}
              {canReview && (
                <button onClick={() => setShowReview(true)} style={{ padding:'10px 18px', borderRadius:10, background:'var(--gold-dim)', border:'1px solid rgba(255,194,62,0.3)', color:'var(--gold)', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' }}>⭐ Review</button>
              )}
            </div>
          )}
        </div>

        {/* ── Identity block ── */}
        <div style={{ padding:'20px 0 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom:6 }}>
            <h1 style={{ fontFamily:'var(--font-head)', fontSize:26, fontWeight:800, color:'var(--ink)', margin:0 }}>{mu.name}</h1>
            {mu.isVerified && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', background:'rgba(0,229,204,0.1)', border:'1px solid rgba(0,229,204,0.3)', borderRadius:100, fontSize:12, fontWeight:700, color:'var(--teal)' }}>
                <span>✓</span> Verified
              </span>
            )}
            {paymentRequired && hourlyRate > 0 && (
              <span style={{ padding:'3px 12px', background:'var(--gold-dim)', border:'1px solid rgba(255,194,62,0.3)', borderRadius:100, fontSize:12, fontWeight:700, color:'var(--gold)' }}>₹{hourlyRate}/hr</span>
            )}
          </div>

          {(title || company) && (
            <p style={{ fontSize:16, color:'var(--ink-2)', marginBottom:8, fontWeight:500 }}>
              {title}{title && company && ' · '}{company}
            </p>
          )}

          {mu.bio && <p style={{ fontSize:15, color:'var(--ink-2)', lineHeight:1.7, maxWidth:680, marginBottom:16 }}>{mu.bio}</p>}

          {/* Stats row — LinkedIn style */}
          <div style={{ display:'flex', gap:0, flexWrap:'wrap', marginBottom:16 }}>
            {[
              { v:`⭐ ${rating>0?rating.toFixed(1):'New'}`, l:'rating', split:true },
              { v:totalReviews,    l:'reviews',   split:true },
              { v:`${experience||0} yr`, l:'experience', split:true },
              { v:followers||0,    l:'followers', split:true },
              { v:totalSessions||0,l:'sessions',  split:false },
            ].map((s,i) => (
              <React.Fragment key={i}>
                <div style={{ paddingRight:16 }}>
                  <span style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:800, color:'var(--ink)' }}>{s.v} </span>
                  <span style={{ fontSize:13, color:'var(--ink-3)', fontWeight:500 }}>{s.l}</span>
                </div>
                {s.split && <span style={{ width:1, height:24, background:'var(--border)', margin:'0 16px 0 0', alignSelf:'center', display:'inline-block' }} />}
              </React.Fragment>
            ))}
          </div>

          {/* Social links */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {[[linkedin,'🔗','LinkedIn'],[github,'🐙','GitHub'],[website,'🌐','Website']].filter(([u])=>u).map(([url,icon,label])=>(
              <a key={label} href={url} target="_blank" rel="noreferrer" style={{
                display:'inline-flex', alignItems:'center', gap:7, padding:'7px 16px',
                background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:100,
                fontSize:13, fontWeight:600, color:'var(--ink-2)', textDecoration:'none',
                transition:'border-color .2s, color .2s',
              }}>{icon} {label}</a>
            ))}
          </div>
        </div>

        {/* ── Connection info banners ── */}
        {followState?.status === 'pending' && (
          <div style={{ marginTop:16, padding:'12px 18px', background:'rgba(255,194,62,0.07)', border:'1px solid rgba(255,194,62,0.2)', borderRadius:12, fontSize:14, color:'#f9ca24', display:'flex', gap:10 }}>
            <span>⏳</span><span>Connection request pending — chat unlocks once the mentor accepts.</span>
          </div>
        )}
        {followState?.status === 'accepted' && (
          <div style={{ marginTop:16, padding:'12px 18px', background:'var(--teal-dim)', border:'1px solid rgba(0,229,204,0.2)', borderRadius:12, fontSize:14, color:'var(--teal)', display:'flex', gap:10 }}>
            <span>✓</span><span>You're connected with {mu.name?.split(' ')[0]}! Chat is now unlocked.</span>
          </div>
        )}

        {/* ── Tabs ── */}
        <div style={{ borderBottom:'1px solid var(--border)', marginTop:28, display:'flex', gap:0 }}>
          {[['about','About'],['skills','Skills'],['certifications',`Certifications ${certs.length>0?`(${certs.length})`:''}`.trim()],['reviews',`Reviews ${totalReviews>0?`(${totalReviews})`:''}`.trim()]].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              padding:'13px 20px', background:'none', border:'none',
              borderBottom:`2.5px solid ${tab===t?'var(--teal)':'transparent'}`,
              color: tab===t?'var(--teal)':'var(--ink-2)',
              fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-head)',
              transition:'all .2s', whiteSpace:'nowrap',
            }}>{l}</button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div style={{ padding:'28px 0 80px' }}>

          {/* ABOUT */}
          {tab==='about' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:24, alignItems:'start' }}>
              <div>
                <h2 style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:700, marginBottom:14 }}>About</h2>
                <p style={{ fontSize:15, color:'var(--ink-2)', lineHeight:1.8, marginBottom:24 }}>{mu.bio || 'No bio provided yet.'}</p>
                {(title||company||experience>0) && (
                  <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:14, padding:20, marginBottom:20 }}>
                    <h3 style={{ fontFamily:'var(--font-head)', fontSize:16, fontWeight:700, marginBottom:14 }}>Experience</h3>
                    <div style={{ display:'flex', gap:14 }}>
                      <div style={{ width:44, height:44, borderRadius:12, background:'var(--teal-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🏢</div>
                      <div>
                        <p style={{ fontSize:15, fontWeight:700, color:'var(--ink)', marginBottom:2 }}>{title || 'Professional'}</p>
                        <p style={{ fontSize:14, color:'var(--ink-2)', marginBottom:2 }}>{company || 'Independent'}</p>
                        <p style={{ fontSize:13, color:'var(--ink-3)' }}>{experience} year{experience!==1?'s':''} of experience</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar card */}
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:14, padding:20 }}>
                  <h3 style={{ fontFamily:'var(--font-head)', fontSize:14, fontWeight:700, color:'var(--ink-2)', marginBottom:14, textTransform:'uppercase', letterSpacing:'.5px' }}>Quick Info</h3>
                  {[
                    { icon:'📍', label:'Location', value:'Available Online' },
                    { icon:'⏱️', label:'Session', value:`Up to ${experience>5?120:60}min` },
                    { icon:'🗓️', label:'Joined', value:new Date(mu.createdAt||Date.now()).toLocaleDateString('en-US',{month:'long',year:'numeric'}) },
                    ...(paymentRequired && hourlyRate>0 ? [{ icon:'💳', label:'Rate', value:`₹${hourlyRate}/hr` }] : []),
                    ...(paymentRequired && upiId ? [{ icon:'📱', label:'UPI', value:upiId }] : []),
                  ].map(r => (
                    <div key={r.label} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ fontSize:16, flexShrink:0 }}>{r.icon}</span>
                      <span style={{ fontSize:12, color:'var(--ink-3)', minWidth:60 }}>{r.label}</span>
                      <span style={{ fontSize:13, fontWeight:600, color:'var(--ink)', marginLeft:'auto', textAlign:'right', fontFamily: r.label==='UPI'?'var(--font-mono)':undefined }}>{r.value}</span>
                    </div>
                  ))}
                </div>
                {verifiedCerts.length > 0 && (
                  <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:14, padding:20 }}>
                    <h3 style={{ fontFamily:'var(--font-head)', fontSize:13, fontWeight:700, color:'var(--teal)', marginBottom:12, textTransform:'uppercase', letterSpacing:'.5px' }}>✓ Verified Certs</h3>
                    {verifiedCerts.slice(0,3).map(c => (
                      <div key={c._id} style={{ fontSize:13, color:'var(--ink-2)', padding:'5px 0', borderBottom:'1px solid var(--border)', display:'flex', gap:8 }}>
                        <span style={{ color:'var(--teal)', flexShrink:0 }}>✓</span>
                        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SKILLS */}
          {tab==='skills' && (
            <div>
              <h2 style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:700, marginBottom:20 }}>Skills & Expertise</h2>
              {skills.length===0 ? <p style={{ color:'var(--ink-3)' }}>No skills listed.</p> : (
                <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                  {skills.map(s => (
                    <div key={s} style={{ padding:'10px 22px', background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:100, fontSize:14, fontWeight:600, color:'var(--ink)', display:'flex', alignItems:'center', gap:8, transition:'border-color .2s' }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--teal)', flexShrink:0 }} />
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CERTIFICATIONS */}
          {tab==='certifications' && (
            <div>
              <h2 style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:700, marginBottom:20 }}>Licenses & Certifications</h2>
              {certs.length===0 ? (
                <div style={{ textAlign:'center', padding:'48px 24px', color:'var(--ink-3)' }}>
                  <div style={{ fontSize:44, marginBottom:12 }}>🎓</div>
                  <p>No certifications uploaded yet.</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  {certs.map(cert => (
                    <div key={cert._id} style={{ background:'var(--bg-2)', border:`1px solid ${cert.verified?'rgba(0,229,204,0.25)':'var(--border)'}`, borderRadius:16, padding:22, display:'flex', gap:18, alignItems:'flex-start', transition:'border-color .2s' }}>
                      {/* Icon */}
                      <div style={{ width:54, height:54, borderRadius:14, background: cert.verified?'var(--teal-dim)':'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>
                        {cert.fileType==='pdf' ? '📄' : cert.fileType==='image' ? '🖼️' : '🎓'}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:4 }}>
                          <h3 style={{ fontFamily:'var(--font-head)', fontSize:16, fontWeight:700, color:'var(--ink)', margin:0 }}>{cert.title}</h3>
                          {cert.verified && (
                            <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 9px', background:'var(--teal-dim)', border:'1px solid rgba(0,229,204,0.3)', borderRadius:100, fontSize:11, fontWeight:700, color:'var(--teal)' }}>
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize:14, color:'var(--ink-2)', marginBottom:4, fontWeight:500 }}>{cert.issuer}</p>
                        {cert.issueDate && <p style={{ fontSize:13, color:'var(--ink-3)' }}>Issued {cert.issueDate}</p>}
                        {cert.credentialId && <p style={{ fontSize:12, color:'var(--ink-3)', fontFamily:'var(--font-mono)', marginTop:4 }}>ID: {cert.credentialId}</p>}
                      </div>
                      {cert.fileUrl && (
                        <a href={getFileUrl(cert.fileUrl)} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'8px 16px', background:'var(--bg-1)', border:'1px solid var(--border)', borderRadius:8, fontSize:13, fontWeight:600, color:'var(--ink-2)', textDecoration:'none', flexShrink:0 }}>
                          🔗 View
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REVIEWS */}
          {tab==='reviews' && (
            <div style={{ maxWidth:700 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <h2 style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:700, margin:0 }}>Reviews ({feedback.length})</h2>
                {canReview && <button onClick={()=>setShowReview(true)} style={{ padding:'9px 18px', background:'var(--gold-dim)', border:'1px solid rgba(255,194,62,0.3)', borderRadius:10, color:'var(--gold)', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' }}>+ Write Review</button>}
              </div>

              {rating > 0 && (
                <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:14, padding:20, marginBottom:20, display:'flex', gap:24, alignItems:'center' }}>
                  <div style={{ textAlign:'center' }}>
                    <p style={{ fontFamily:'var(--font-head)', fontSize:52, fontWeight:800, color:'var(--gold)', lineHeight:1, margin:0 }}>{rating.toFixed(1)}</p>
                    <Stars n={rating} />
                    <p style={{ fontSize:13, color:'var(--ink-3)', marginTop:6 }}>{totalReviews} review{totalReviews!==1?'s':''}</p>
                  </div>
                  <div style={{ flex:1 }}>
                    {[5,4,3,2,1].map(star => {
                      const count = feedback.filter(f=>Math.round(f.rating)===star).length
                      const pct   = feedback.length ? Math.round((count/feedback.length)*100) : 0
                      return (
                        <div key={star} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                          <span style={{ fontSize:13, color:'var(--ink-3)', width:8 }}>{star}</span>
                          <span style={{ fontSize:12, color:'var(--gold)' }}>★</span>
                          <div style={{ flex:1, height:6, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${pct}%`, background:'var(--gold)', borderRadius:3, transition:'width .6s ease' }} />
                          </div>
                          <span style={{ fontSize:12, color:'var(--ink-3)', width:28, textAlign:'right' }}>{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {feedback.length===0 ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:'var(--ink-3)' }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>⭐</div>
                  <p>No reviews yet. Be the first!</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  {feedback.map((f,i) => (
                    <div key={f._id} style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:14, padding:20, animation:`fadeUp .3s ease ${i*0.04}s both` }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                        <div style={{ width:42, height:42, borderRadius:12, background:'linear-gradient(135deg,var(--coral),var(--violet))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, fontWeight:700, color:'#fff' }}>
                          {f.mentee?.name?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex:1 }}>
                          <p style={{ fontSize:14, fontWeight:700, marginBottom:3 }}>{f.mentee?.name}</p>
                          <Stars n={f.rating} />
                        </div>
                        <span style={{ fontSize:12, color:'var(--ink-3)' }}>{new Date(f.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p style={{ fontSize:14, color:'var(--ink-2)', lineHeight:1.7 }}>{f.review}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showPayment && <PaymentModal mentor={mentor} onConfirm={info=>{setPaymentInfo(info);setShowPayment(false);setShowBook(true)}} onCancel={()=>setShowPayment(false)} />}
      {showBook    && <BookModal mentorId={id} paymentInfo={paymentInfo} onBook={handleBook} onCancel={()=>{setShowBook(false);setPaymentInfo(null)}} />}
      {showReview  && (
        <div className="overlay" onClick={()=>setShowReview(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h2 style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:700, marginBottom:22 }}>⭐ Review {mu.name}</h2>
            <form onSubmit={handleReview} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="field"><label>Rating</label><Stars n={revForm.rating} interactive onRate={r=>setRevForm({...revForm,rating:r})} /></div>
              <div className="field"><label>Review</label><textarea className="input" value={revForm.review} onChange={e=>setRevForm({...revForm,review:e.target.value})} style={{ height:120 }} required /></div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" onClick={()=>setShowReview(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding:'10px 22px', background:'var(--gold)', border:'none', borderRadius:8, color:'var(--bg)', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)' }}>{submitting?'Submitting…':'Submit'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
