import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { mentorAPI, authAPI, certAPI } from '../services/api'
import useAuth from '../hooks/useAuth'

const PRESET_SKILLS = ['React','Node.js','Python','JavaScript','TypeScript','Java','C++','Ruby','Go','Rust','AWS','Azure','GCP','DevOps','Docker','Kubernetes','Machine Learning','Data Science','UI/UX','Product Management','MongoDB','PostgreSQL','GraphQL','REST APIs','System Design','Microservices','Blockchain','iOS','Android','Flutter','Redis','Kafka','TensorFlow','PyTorch']

const isCloudinaryUrl = (url) => url && url.startsWith('https://res.cloudinary.com/')

export default function MentorProfileEdit() {
  const { user, updateUser } = useAuth()
  const [tab,     setTab]     = useState('basic')
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  const [userForm, setUserForm] = useState({ name: user?.name || '', bio: user?.bio || '', avatar: user?.avatar || '' })
  const [profile,  setProfile]  = useState({ skills:[], experience:0, title:'', company:'', linkedin:'', github:'', website:'', availability:'available', hourlyRate:0, upiId:'', paymentRequired:false, profilePhoto:'' })
  const [certs,    setCerts]    = useState([])
  const [certForm, setCertForm] = useState({ title:'', issuer:'', issueDate:'', credentialId:'', imageUrl:'' })
  const [addingCert,    setAddingCert]    = useState(false)
  const [showCertForm,  setShowCertForm]  = useState(false)
  const [customSkill,   setCustomSkill]   = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const [pRes, cRes] = await Promise.all([ mentorAPI.getMyProfile(), certAPI.getMyCerts() ])
        const p = pRes.data.profile
        setProfile({
          skills:          p.skills        || [],
          experience:      p.experience    || 0,
          title:           p.title         || '',
          company:         p.company       || '',
          linkedin:        p.linkedin      || '',
          github:          p.github        || '',
          website:         p.website       || '',
          availability:    p.availability  || 'available',
          hourlyRate:      p.hourlyRate    || 0,
          upiId:           p.upiId         || '',
          paymentRequired: p.paymentRequired || false,
          profilePhoto:    p.profilePhoto  || '',
        })
        setCerts(cRes.data.certifications || [])
      } catch {}
      finally { setLoading(false) }
    })()
  }, [])

  const toggleSkill = (sk) => setProfile(p => ({ ...p, skills: p.skills.includes(sk) ? p.skills.filter(s=>s!==sk) : [...p.skills,sk] }))
  const addCustomSkill = () => {
    const sk = customSkill.trim()
    if (!sk) return
    if (profile.skills.includes(sk)) { toast('Already added'); return }
    setProfile(p => ({ ...p, skills:[...p.skills,sk] }))
    setCustomSkill('')
    toast.success(`"${sk}" added!`)
  }

  const saveBasic = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const { data } = await authAPI.updateProfile(userForm)
      updateUser(data.user)
      toast.success('Basic info saved!')
    } catch { toast.error('Failed to save basic info') }
    finally { setSaving(false) }
  }

  const saveProfile = async (e) => {
    e?.preventDefault(); setSaving(true)
    try { await mentorAPI.updateProfile(profile); toast.success('Profile saved!') }
    catch { toast.error('Failed to save profile') }
    finally { setSaving(false) }
  }

  const handleAddCert = async (e) => {
    e.preventDefault()
    if (!certForm.title || !certForm.issuer) { toast.error('Title and Issuer required'); return }
    if (certForm.imageUrl && !certForm.imageUrl.startsWith('https://')) {
      toast.error('Image URL must start with https://'); return
    }
    setAddingCert(true)
    try {
      const { data } = await certAPI.add({
        title:        certForm.title,
        issuer:       certForm.issuer,
        issueDate:    certForm.issueDate,
        credentialId: certForm.credentialId,
        imageUrl:     certForm.imageUrl,
      })
      setCerts(c => [...c, data.certification])
      setCertForm({ title:'', issuer:'', issueDate:'', credentialId:'', imageUrl:'' })
      setShowCertForm(false)
      toast.success('Certification added!')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add certification') }
    finally { setAddingCert(false) }
  }

  const handleDeleteCert = async (certId) => {
    if (!confirm('Delete this certification?')) return
    try { await certAPI.delete(certId); setCerts(c => c.filter(x => x._id!==certId)); toast.success('Deleted') }
    catch { toast.error('Failed to delete') }
  }

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  const TABS = [
    { id:'basic',    icon:'👤', label:'Basic Info'     },
    { id:'details',  icon:'🧑‍🏫', label:'Details'        },
    { id:'payment',  icon:'💳', label:'Payment & UPI'  },
    { id:'skills',   icon:'⚡', label:'Skills'         },
    { id:'certs',    icon:'🎓', label:`Certifications ${certs.length>0?`(${certs.length})`:''}`.trim() },
  ]

  const inp = { background:'var(--bg-1)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px', color:'var(--ink)', fontSize:14, outline:'none', fontFamily:'var(--font-body)', width:'100%', transition:'border-color .2s' }
  const box = { background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:20, padding:28, display:'flex', flexDirection:'column', gap:20 }

  return (
    <div style={{ minHeight:'100vh' }}>
      <div style={{ position:'fixed',inset:0,background:'radial-gradient(ellipse 40% 30% at 70% 80%,rgba(255,77,109,0.05),transparent)',pointerEvents:'none' }} />
      <div style={{ maxWidth:860, margin:'0 auto', padding:'44px 28px 80px', position:'relative' }}>
        <h1 style={{ fontFamily:'var(--font-head)',fontSize:30,fontWeight:700,marginBottom:6 }}>Edit Profile</h1>
        <p style={{ color:'var(--ink-2)',marginBottom:28,fontSize:15 }}>Keep your profile updated to attract the right mentees.</p>

        <div style={{ display:'flex', gap:8, marginBottom:28, flexWrap:'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:'10px 18px', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)',
              background: tab===t.id?'var(--teal-dim)':'var(--bg-2)',
              border:`1px solid ${tab===t.id?'rgba(0,229,204,0.4)':'var(--border)'}`,
              color: tab===t.id?'var(--teal)':'var(--ink-2)',
              display:'flex', alignItems:'center', gap:7,
            }}>{t.icon} {t.label}</button>
          ))}
        </div>

        {/* ── BASIC ── */}
        {tab==='basic' && (
          <form onSubmit={saveBasic} style={box}>
            {/* Profile Photo URL */}
            <div>
              <p style={{ fontSize:12, fontWeight:700, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:14 }}>Profile Photo</p>
              <div style={{ display:'flex', alignItems:'flex-start', gap:20, flexWrap:'wrap' }}>
                {/* Live Preview */}
                <div style={{ width:100, height:100, borderRadius:20, background: profile.profilePhoto?'transparent':'linear-gradient(135deg,var(--teal),var(--violet))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, fontWeight:700, color:'var(--bg)', fontFamily:'var(--font-head)', overflow:'hidden', border:'3px solid var(--border-2)', flexShrink:0 }}>
                  {profile.profilePhoto
                    ? <img src={profile.profilePhoto} alt="profile" style={{ width:'100%',height:'100%',objectFit:'cover' }} onError={e=>{e.target.style.display='none'}} />
                    : user?.name?.[0]?.toUpperCase()
                  }
                </div>
                <div style={{ flex:1, minWidth:220 }}>
                  <div className="field">
                    <label>Profile Photo URL (Cloudinary)</label>
                    <input
                      style={inp}
                      value={profile.profilePhoto}
                      onChange={e => setProfile({...profile, profilePhoto: e.target.value})}
                      placeholder="https://res.cloudinary.com/your-cloud/image/upload/..."
                    />
                    {profile.profilePhoto && !isCloudinaryUrl(profile.profilePhoto) && (
                      <p style={{ fontSize:11, color:'#f9ca24', marginTop:4 }}>⚠ Tip: Use a Cloudinary URL for best results</p>
                    )}
                    {profile.profilePhoto && isCloudinaryUrl(profile.profilePhoto) && (
                      <p style={{ fontSize:11, color:'var(--teal)', marginTop:4 }}>✓ Valid Cloudinary URL</p>
                    )}
                  </div>
                  <p style={{ fontSize:12, color:'var(--ink-3)', marginTop:6 }}>Paste your Cloudinary image URL. Upload to <a href="https://cloudinary.com" target="_blank" rel="noreferrer" style={{ color:'var(--teal)' }}>cloudinary.com</a> first.</p>
                </div>
              </div>
            </div>

            {/* Also keep avatar URL on User model (used as fallback) */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div className="field"><label>Full Name</label><input style={inp} value={userForm.name} onChange={e=>setUserForm({...userForm,name:e.target.value})} required /></div>
              <div className="field">
                <label>Avatar URL (fallback)</label>
                <input style={inp} value={userForm.avatar} onChange={e=>setUserForm({...userForm,avatar:e.target.value})} placeholder="https://res.cloudinary.com/…" />
                {userForm.avatar && (
                  <img src={userForm.avatar} alt="avatar preview" style={{ marginTop:8, width:40, height:40, borderRadius:10, objectFit:'cover', border:'2px solid var(--border)' }} onError={e=>e.target.style.display='none'} />
                )}
              </div>
            </div>
            <div className="field">
              <label>Bio</label>
              <textarea style={{ ...inp, height:130, resize:'vertical' }} value={userForm.bio} onChange={e=>setUserForm({...userForm,bio:e.target.value})} placeholder="Tell mentees about yourself, your journey, and what you love helping with…" maxLength={500} />
              <span style={{ fontSize:11,color:'var(--ink-3)',textAlign:'right',display:'block' }}>{userForm.bio.length}/500</span>
            </div>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ alignSelf:'flex-start',padding:'12px 28px' }}
              onClick={async (e) => {
                // Also save profilePhoto to mentorProfile on basic save
                if (!saving) {
                  try { await mentorAPI.updateProfile({ profilePhoto: profile.profilePhoto }) } catch {}
                }
              }}
            >{saving?'Saving…':'💾 Save'}</button>
          </form>
        )}

        {/* ── DETAILS ── */}
        {tab==='details' && (
          <form onSubmit={saveProfile} style={box}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div className="field"><label>Job Title</label><input style={inp} value={profile.title} onChange={e=>setProfile({...profile,title:e.target.value})} placeholder="Senior Engineer" /></div>
              <div className="field"><label>Company</label><input style={inp} value={profile.company} onChange={e=>setProfile({...profile,company:e.target.value})} placeholder="Google, Stripe…" /></div>
              <div className="field"><label>Years of Experience</label><input style={inp} type="number" min="0" max="50" value={profile.experience} onChange={e=>setProfile({...profile,experience:Number(e.target.value)})} /></div>
              <div className="field"><label>Hourly Rate (₹, 0 = Free)</label><input style={inp} type="number" min="0" value={profile.hourlyRate} onChange={e=>setProfile({...profile,hourlyRate:Number(e.target.value)})} /></div>
            </div>
            <div className="field"><label>Availability</label>
              <div style={{ display:'flex', gap:10 }}>
                {[{v:'available',icon:'🟢',l:'Available'},{v:'busy',icon:'🟡',l:'Busy'},{v:'unavailable',icon:'🔴',l:'Unavailable'}].map(a=>(
                  <button key={a.v} type="button" onClick={()=>setProfile({...profile,availability:a.v})} style={{ flex:1,padding:'13px',borderRadius:10,cursor:'pointer',fontFamily:'var(--font-body)',background:profile.availability===a.v?'var(--teal-dim)':'var(--bg-1)',border:`1.5px solid ${profile.availability===a.v?'rgba(0,229,204,0.4)':'var(--border)'}`,display:'flex',flexDirection:'column',alignItems:'center',gap:5 }}>
                    <span style={{ fontSize:22 }}>{a.icon}</span>
                    <span style={{ fontSize:13,fontWeight:700,color:profile.availability===a.v?'var(--teal)':'var(--ink-2)' }}>{a.l}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
              {[['LinkedIn','linkedin','https://linkedin.com/in/…'],['GitHub','github','https://github.com/…'],['Website','website','https://…']].map(([l,k,p])=>(
                <div key={k} className="field"><label>{l}</label><input style={inp} value={profile[k]} onChange={e=>setProfile({...profile,[k]:e.target.value})} placeholder={p} /></div>
              ))}
            </div>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ alignSelf:'flex-start',padding:'12px 28px' }}>{saving?'Saving…':'💾 Save Details'}</button>
          </form>
        )}

        {/* ── PAYMENT ── */}
        {tab==='payment' && (
          <form onSubmit={saveProfile} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:20,padding:28 }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 20px',background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:14,marginBottom:20 }}>
                <div>
                  <p style={{ fontWeight:700,color:'var(--ink)',marginBottom:3 }}>Require Payment to Book</p>
                  <p style={{ fontSize:13,color:'var(--ink-2)' }}>Mentees pay via UPI before booking</p>
                </div>
                <button type="button" onClick={()=>setProfile({...profile,paymentRequired:!profile.paymentRequired})} style={{ width:52,height:28,borderRadius:100,border:'none',cursor:'pointer',background:profile.paymentRequired?'var(--teal)':'var(--bg-3)',position:'relative',transition:'all .2s',flexShrink:0 }}>
                  <span style={{ position:'absolute',top:3,left:profile.paymentRequired?26:3,width:22,height:22,borderRadius:'50%',background:'#fff',transition:'left .2s' }} />
                </button>
              </div>
              {profile.paymentRequired && (
                <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
                    <div className="field"><label>UPI ID *</label><input style={{ ...inp,fontFamily:'var(--font-mono)' }} value={profile.upiId} onChange={e=>setProfile({...profile,upiId:e.target.value})} placeholder="yourname@upi" required={profile.paymentRequired} /><span style={{ fontSize:11,color:'var(--ink-3)',marginTop:4,display:'block' }}>Shown to mentees at booking</span></div>
                    <div className="field"><label>Rate (₹/hr)</label><input style={inp} type="number" min="0" value={profile.hourlyRate} onChange={e=>setProfile({...profile,hourlyRate:Number(e.target.value)})} /></div>
                  </div>
                  {profile.upiId && (
                    <div style={{ padding:16,background:'var(--bg-1)',border:'1px solid rgba(0,229,204,0.2)',borderRadius:12 }}>
                      <p style={{ fontSize:11,fontWeight:700,color:'var(--teal)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:10 }}>Preview</p>
                      <div style={{ display:'flex',gap:14,flexWrap:'wrap' }}>
                        <div style={{ padding:'12px 18px',background:'var(--green-dim)',border:'1px solid rgba(34,197,94,0.25)',borderRadius:12,textAlign:'center' }}>
                          <p style={{ fontSize:11,color:'var(--ink-2)',marginBottom:4 }}>Session Fee</p>
                          <p style={{ fontFamily:'var(--font-head)',fontSize:24,fontWeight:800,color:'#22c55e',margin:0 }}>₹{profile.hourlyRate}/hr</p>
                        </div>
                        <div style={{ padding:'12px 18px',background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:12 }}>
                          <p style={{ fontSize:11,color:'var(--ink-2)',marginBottom:4 }}>UPI ID</p>
                          <p style={{ fontFamily:'var(--font-mono)',fontSize:15,fontWeight:700,color:'var(--teal)',margin:0 }}>{profile.upiId}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {!profile.paymentRequired && <div style={{ padding:'14px 18px',background:'var(--teal-dim)',border:'1px solid rgba(0,229,204,0.2)',borderRadius:12,fontSize:14,color:'var(--teal)',fontWeight:600 }}>✓ Free sessions — mentees can book without payment</div>}
            </div>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ alignSelf:'flex-start',padding:'12px 28px' }}>{saving?'Saving…':'💾 Save Payment Settings'}</button>
          </form>
        )}

        {/* ── SKILLS ── */}
        {tab==='skills' && (
          <div style={{ background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:20,padding:28 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
              <div><h2 style={{ fontFamily:'var(--font-head)',fontSize:17,fontWeight:700,marginBottom:4 }}>Skills</h2><p style={{ fontSize:13,color:'var(--ink-2)' }}><span style={{ color:'var(--teal)',fontWeight:700 }}>{profile.skills.length}</span> selected</p></div>
              {profile.skills.length>0 && <button onClick={()=>setProfile({...profile,skills:[]})} style={{ fontSize:12,color:'var(--coral)',background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font-body)',fontWeight:700 }}>Clear all</button>}
            </div>
            {profile.skills.length>0 && (
              <div style={{ display:'flex',flexWrap:'wrap',gap:8,marginBottom:20,padding:14,background:'var(--bg-1)',borderRadius:12,border:'1px solid var(--border)' }}>
                <p style={{ width:'100%',fontSize:11,fontWeight:700,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'.8px',marginBottom:6 }}>Selected</p>
                {profile.skills.map(sk => (
                  <span key={sk} style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'6px 12px',background:'var(--teal-dim)',border:'1px solid rgba(0,229,204,0.35)',borderRadius:100,fontSize:13,fontWeight:600,color:'var(--teal)' }}>
                    {sk}<button onClick={()=>setProfile(p=>({...p,skills:p.skills.filter(s=>s!==sk)}))} style={{ background:'none',border:'none',color:'var(--teal)',cursor:'pointer',padding:0,lineHeight:1,fontSize:15,opacity:.7 }}>×</button>
                  </span>
                ))}
              </div>
            )}
            <div style={{ display:'flex',flexWrap:'wrap',gap:9,marginBottom:24 }}>
              {PRESET_SKILLS.map(sk => {
                const sel = profile.skills.includes(sk)
                return <button key={sk} type="button" onClick={()=>toggleSkill(sk)} style={{ padding:'8px 16px',borderRadius:100,cursor:'pointer',fontFamily:'var(--font-body)',fontSize:13,fontWeight:700,background:sel?'var(--teal-dim)':'var(--bg-1)',border:`1.5px solid ${sel?'rgba(0,229,204,0.4)':'var(--border)'}`,color:sel?'var(--teal)':'var(--ink-2)',transition:'all .15s' }}>{sel&&'✓ '}{sk}</button>
              })}
            </div>
            <div style={{ padding:'18px 20px',background:'var(--bg-1)',border:'1px dashed var(--border-2)',borderRadius:14,marginBottom:24 }}>
              <p style={{ fontSize:13,fontWeight:700,color:'var(--ink-2)',marginBottom:10 }}>➕ Add a custom skill</p>
              <div style={{ display:'flex',gap:10 }}>
                <input value={customSkill} onChange={e=>setCustomSkill(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addCustomSkill())} placeholder="e.g. Solidity, LangChain, Figma…" style={{ ...inp,flex:1 }} />
                <button type="button" onClick={addCustomSkill} className="btn btn-outline" style={{ flexShrink:0 }}>Add</button>
              </div>
            </div>
            <button onClick={saveProfile} disabled={saving} className="btn btn-primary" style={{ padding:'12px 28px' }}>{saving?'Saving…':'💾 Save Skills'}</button>
          </div>
        )}

        {/* ── CERTIFICATIONS ── */}
        {tab==='certs' && (
          <div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
              <div>
                <h2 style={{ fontFamily:'var(--font-head)',fontSize:20,fontWeight:700,marginBottom:4 }}>Certifications & Licenses</h2>
                <p style={{ fontSize:14,color:'var(--ink-2)' }}>Add certificates via Cloudinary URL — verified ones display a ✓ badge on your profile.</p>
              </div>
              <button onClick={()=>setShowCertForm(!showCertForm)} className="btn btn-primary">+ Add Certificate</button>
            </div>

            {/* Add cert form */}
            {showCertForm && (
              <form onSubmit={handleAddCert} style={{ background:'var(--bg-2)',border:'1px solid rgba(0,229,204,0.25)',borderRadius:18,padding:24,marginBottom:24 }}>
                <h3 style={{ fontFamily:'var(--font-head)',fontSize:17,fontWeight:700,marginBottom:20 }}>New Certification</h3>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16 }}>
                  <div className="field"><label>Certification Title *</label><input style={inp} value={certForm.title} onChange={e=>setCertForm({...certForm,title:e.target.value})} placeholder="AWS Solutions Architect" required /></div>
                  <div className="field"><label>Issuing Organization *</label><input style={inp} value={certForm.issuer} onChange={e=>setCertForm({...certForm,issuer:e.target.value})} placeholder="Amazon Web Services" required /></div>
                  <div className="field"><label>Issue Date</label><input style={inp} value={certForm.issueDate} onChange={e=>setCertForm({...certForm,issueDate:e.target.value})} placeholder="March 2023" /></div>
                  <div className="field"><label>Credential / Certificate ID</label><input style={inp} value={certForm.credentialId} onChange={e=>setCertForm({...certForm,credentialId:e.target.value})} placeholder="ABC-123-XYZ" /></div>
                </div>

                {/* Certificate Image URL (replaces file upload) */}
                <div className="field" style={{ marginBottom:20 }}>
                  <label>Certificate Image URL (Cloudinary)</label>
                  <input
                    style={inp}
                    value={certForm.imageUrl}
                    onChange={e=>setCertForm({...certForm,imageUrl:e.target.value})}
                    placeholder="https://res.cloudinary.com/your-cloud/image/upload/..."
                  />
                  {certForm.imageUrl && !certForm.imageUrl.startsWith('https://') && (
                    <p style={{ fontSize:11,color:'var(--coral)',marginTop:4 }}>⚠ URL must start with https://</p>
                  )}
                  {certForm.imageUrl && isCloudinaryUrl(certForm.imageUrl) && (
                    <p style={{ fontSize:11,color:'var(--teal)',marginTop:4 }}>✓ Valid Cloudinary URL</p>
                  )}
                  {/* Live preview */}
                  {certForm.imageUrl && certForm.imageUrl.startsWith('https://') && (
                    <div style={{ marginTop:12 }}>
                      <p style={{ fontSize:11,color:'var(--ink-3)',marginBottom:6 }}>Preview:</p>
                      <img
                        src={certForm.imageUrl}
                        alt="cert preview"
                        style={{ maxHeight:160, maxWidth:'100%', borderRadius:10, border:'1px solid var(--border)', objectFit:'contain', background:'var(--bg-1)' }}
                        onError={e=>{ e.target.style.display='none' }}
                      />
                    </div>
                  )}
                  <p style={{ fontSize:12,color:'var(--ink-3)',marginTop:6 }}>
                    Upload your certificate image to <a href="https://cloudinary.com" target="_blank" rel="noreferrer" style={{ color:'var(--teal)' }}>Cloudinary</a> and paste the URL here.
                  </p>
                </div>

                <div style={{ display:'flex',gap:10 }}>
                  <button type="button" onClick={()=>setShowCertForm(false)} className="btn btn-ghost">Cancel</button>
                  <button type="submit" disabled={addingCert} className="btn btn-primary">{addingCert?'Saving…':'Save Certificate'}</button>
                </div>
              </form>
            )}

            {/* Cert list */}
            {certs.length===0 ? (
              <div style={{ textAlign:'center',padding:'60px 24px',color:'var(--ink-3)',background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:18 }}>
                <div style={{ fontSize:48,marginBottom:14 }}>🎓</div>
                <h3 style={{ fontFamily:'var(--font-head)',fontSize:18,marginBottom:8,color:'var(--ink)' }}>No Certifications Yet</h3>
                <p>Add a Cloudinary URL to display your certificates.</p>
              </div>
            ) : (
              <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                {certs.map(cert => (
                  <div key={cert._id} style={{ background:'var(--bg-2)',border:`1px solid ${cert.verified?'rgba(0,229,204,0.3)':'var(--border)'}`,borderRadius:16,padding:20,display:'flex',gap:16,alignItems:'flex-start' }}>
                    {/* Thumbnail or emoji icon */}
                    <div style={{ width:60,height:60,borderRadius:12,overflow:'hidden',background:cert.verified?'var(--teal-dim)':'rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0,border:'1px solid var(--border)' }}>
                      {cert.imageUrl
                        ? <img src={cert.imageUrl} alt="cert" style={{ width:'100%',height:'100%',objectFit:'cover' }} onError={e=>{ e.target.style.display='none'; e.target.parentNode.innerText='🎓' }} />
                        : '🎓'
                      }
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:4 }}>
                        <h3 style={{ fontFamily:'var(--font-head)',fontSize:15,fontWeight:700,color:'var(--ink)',margin:0 }}>{cert.title}</h3>
                        {cert.verified
                          ? <span style={{ padding:'2px 9px',background:'var(--teal-dim)',border:'1px solid rgba(0,229,204,0.3)',borderRadius:100,fontSize:11,fontWeight:700,color:'var(--teal)' }}>✓ Verified</span>
                          : <span style={{ padding:'2px 9px',background:'rgba(255,255,255,0.04)',border:'1px solid var(--border)',borderRadius:100,fontSize:11,fontWeight:700,color:'var(--ink-3)' }}>Pending review</span>
                        }
                      </div>
                      <p style={{ fontSize:13,color:'var(--ink-2)',margin:0,marginBottom:2,fontWeight:500 }}>{cert.issuer}</p>
                      {cert.issueDate && <p style={{ fontSize:12,color:'var(--ink-3)',margin:0 }}>Issued {cert.issueDate}</p>}
                      {cert.credentialId && <p style={{ fontSize:11,color:'var(--ink-3)',margin:0,fontFamily:'var(--font-mono)',marginTop:3 }}>ID: {cert.credentialId}</p>}
                    </div>
                    <div style={{ display:'flex',gap:8,flexShrink:0 }}>
                      {cert.imageUrl && (
                        <a href={cert.imageUrl} target="_blank" rel="noreferrer" style={{ padding:'6px 14px',background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:8,fontSize:12,fontWeight:600,color:'var(--ink-2)',textDecoration:'none' }}>🔗 View</a>
                      )}
                      <button onClick={()=>handleDeleteCert(cert._id)} style={{ padding:'6px 14px',background:'var(--coral-dim)',border:'1px solid rgba(255,77,109,0.3)',borderRadius:8,fontSize:12,fontWeight:700,color:'var(--coral)',cursor:'pointer',fontFamily:'var(--font-body)' }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
