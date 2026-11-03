import { useEffect, useMemo, useState } from 'react'
import { call, store } from './api'
import { estimate, GENRES, KIND_LABEL, LISTINGS, listingsBrief, releasePlan, ROLES, VIBES } from './data'

export const Brand = () => (
  <a href="#/scene" className="brand" aria-label="Brasswick home">
    <img src="/mark.svg" alt="" width={28} height={28} /><span className="serif">Brass<em>wick</em></span>
  </a>
)
export const Badge = () => <span className="badge" title="Address and business checked against a public listing on Nov 3, 2026. Not yet claimed by the owner.">◆ Verified local</span>

function Head({ kicker, title, sub }: { kicker: string; title: React.ReactNode; sub?: string }) {
  return <header className="head"><Brand /><span className="kicker">{kicker}</span><h1 className="display">{title}</h1>{sub && <p className="muted">{sub}</p>}</header>
}
const toggle = (arr: string[], v: string, max = 4) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v].slice(-max))

/* ───────── Place profile ───────── */
export function Place({ id }: { id: string }) {
  const l = LISTINGS.find((x) => x.id === id)
  if (!l) return <div className="pad"><Head kicker="Scene" title="Not found" /><a href="#/scene">Back to the map</a></div>
  const host = l.website ? new URL(l.website).hostname.replace('www.', '') : null
  return (
    <div className="pad">
      <a href="#/scene" className="back">← Scene</a>
      <span className="kicker">{KIND_LABEL[l.kind]} · {l.address.split(',').slice(-2).join(',').trim()}</span>
      <h1 className="display">{l.name}</h1>
      <Badge />
      <div className="card glass">
        <dl className="facts">
          <dt>Address</dt><dd>{l.address}</dd>
          <dt>Offers</dt><dd>{l.services.join(' · ')}</dd>
          {host && <><dt>Website</dt><dd><a href={l.website!} target="_blank" rel="noopener noreferrer">{host} ↗</a></dd></>}
          <dt>Source</dt><dd><a href={l.source} target="_blank" rel="noopener noreferrer">Public listing ↗</a></dd>
        </dl>
        <p className="muted small">Listed from public info. Hours, prices and services can change, so confirm with them. Own this spot? Use the feedback button to claim it.</p>
      </div>
      <a className="cta" href={`#/book/${l.id}`}>Request a session</a>
      <a className="ghost" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(l.address)}`} target="_blank" rel="noopener noreferrer">Directions ↗</a>
    </div>
  )
}

/* ───────── Booking request (dark live-music flow) ───────── */
export function Booking({ id }: { id: string }) {
  const l = LISTINGS.find((x) => x.id === id)
  const me = store.get<any>('profile', {})
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => { const d = new Date(Date.now() + (i + 1) * 864e5); return d }), [])
  const [service, setService] = useState(l?.services[0] || '')
  const [date, setDate] = useState(days[2].toISOString().slice(0, 10))
  const [hours, setHours] = useState(l?.kind === 'studio' ? 3 : 2)
  const [name, setName] = useState(me.name || '')
  const [contact, setContact] = useState('')
  const [notes, setNotes] = useState('')
  const [done, setDone] = useState<null | { id: string; deposit: number }>(null)
  const [err, setErr] = useState('')
  if (!l) return <div className="pad">Not found</div>
  const quote = l.kind === 'studio' ? estimate(l) * hours : estimate(l) * Math.max(1, Math.round(hours / 2))
  const deposit = Math.round(quote * 0.25)
  const send = async () => {
    setErr('')
    try { const r = await call('/api/booking', { listing: l.id, service, date, hours, name, contact, notes, quote }); setDone(r) } catch (e: any) { setErr(e.message) }
  }
  if (done) return (
    <div className="pad stage">
      <span className="kicker">Request saved · #{done.id}</span>
      <h1 className="display">You're <em>on the list</em></h1>
      <div className="ticket">
        <div><span className="muted small">Where</span><strong className="serif">{l.name}</strong></div>
        <div><span className="muted small">When</span><strong>{new Date(date + 'T12:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · {hours}h</strong></div>
        <div><span className="muted small">Deposit to hold</span><strong>${deposit}</strong><span className="muted small">not charged</span></div>
      </div>
      <p className="muted">Brasswick doesn't message {l.name} for you yet, and no money moves. Reach out to lock the time:</p>
      {l.website && <a className="cta" href={l.website} target="_blank" rel="noopener noreferrer">Contact {l.name} ↗</a>}
      <a className="ghost" href="#/scene">Back to the scene</a>
    </div>
  )
  return (
    <div className="pad stage">
      <a href={`#/place/${l.id}`} className="back">← {l.name}</a>
      <span className="kicker">Session request</span>
      <h1 className="display">Book the <em>night</em></h1>
      <h2 className="step">01 · What</h2>
      <div className="chips">{l.services.map((s) => <button key={s} className={service === s ? 'chip on' : 'chip'} onClick={() => setService(s)}>{s}</button>)}</div>
      <h2 className="step">02 · When</h2>
      <div className="dates">{days.map((d) => { const v = d.toISOString().slice(0, 10); return <button key={v} className={date === v ? 'date on' : 'date'} onClick={() => setDate(v)}><span>{d.toLocaleDateString(undefined, { weekday: 'short' })}</span><strong>{d.getDate()}</strong></button> })}</div>
      <div className="stepper"><span>Hours</span><button onClick={() => setHours(Math.max(1, hours - 1))} aria-label="Fewer hours">−</button><strong>{hours}</strong><button onClick={() => setHours(Math.min(12, hours + 1))} aria-label="More hours">+</button></div>
      <h2 className="step">03 · You</h2>
      <input placeholder="Artist name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      <input placeholder="Phone or email" value={contact} onChange={(e) => setContact(e.target.value)} maxLength={120} />
      <textarea placeholder="What are you making? (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={600} rows={3} />
      <div className="sum">
        <div><span>Estimated session</span><span>${quote}</span></div>
        <div className="bronze"><span>Deposit to hold (25%)</span><span>${deposit}</span></div>
        <p className="muted small">Estimate only, not their price. Deposits aren't charged in this version. The studio confirms first.</p>
      </div>
      {err && <p className="err">{err}</p>}
      <button className="cta" disabled={!name || !contact} onClick={send}>Send request</button>
    </div>
  )
}

/* ───────── Release plan (story timeline) ───────── */
export function Plan() {
  const saved = store.get<any>('plan', null)
  const [title, setTitle] = useState(saved?.title || '')
  const [drop, setDrop] = useState(saved?.drop || new Date(Date.now() + 42 * 864e5).toISOString().slice(0, 10))
  const [weeks, setWeeks] = useState<any[]>(saved?.weeks || [])
  const [done, setDone] = useState<Record<string, boolean>>(store.get('planDone', {}))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  useEffect(() => store.set('planDone', done), [done])
  const make = () => { const w = releasePlan(drop, title); setWeeks(w); store.set('plan', { title, drop, weeks: w }) }
  const tailor = async () => {
    setBusy(true); setErr('')
    try {
      const base = releasePlan(drop, title)
      const r = await call('/api/plan-tailor', { title, genre: store.get<any>('profile', {}).genres?.[0], weeks: base.length })
      const w = base.map((b, i) => (r.weeks[i]?.tasks?.length ? { ...b, label: r.weeks[i].label || b.label, tasks: r.weeks[i].tasks } : b))
      setWeeks(w); store.set('plan', { title, drop, weeks: w })
    } catch (e: any) { setErr(e.message) } finally { setBusy(false) }
  }
  const total = weeks.reduce((n, w) => n + w.tasks.length, 0)
  const ticked = Object.values(done).filter(Boolean).length
  return (
    <div className="pad">
      <Head kicker="Release plan" title={<>Your drop, <em>told week by week</em></>} />
      <div className="card glass form">
        <input placeholder="Song or project title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
        <label className="row"><span>Drop date</span><input type="date" value={drop} onChange={(e) => setDrop(e.target.value)} /></label>
        <div className="row2"><button className="cta" onClick={make}>Build my plan</button><button className="ghost" disabled={busy} onClick={tailor}>{busy ? 'Tailoring…' : 'Tailor with AI'}</button></div>
        {err && <p className="err">{err}</p>}
      </div>
      {weeks.length > 0 && <p className="muted small progress">{ticked} of {total} done</p>}
      <ol className="story">
        {weeks.map((w) => (
          <li key={w.week} className={w.week === 0 ? 'drop' : ''}>
            <span className="when">{w.week === 0 ? 'Release week' : w.week > 0 ? 'Week after' : `${-w.week} week${w.week === -1 ? '' : 's'} out`} · {new Date(w.date + 'T12:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            <h3 className="serif">{w.label}</h3>
            {w.tasks.map((t: string, i: number) => { const k = `${w.week}:${i}:${t}`; return <label key={k} className="task"><input type="checkbox" checked={!!done[k]} onChange={() => setDone({ ...done, [k]: !done[k] })} /><span>{t}</span></label> })}
          </li>
        ))}
      </ol>
    </div>
  )
}

/* ───────── Manager ───────── */
const Scribble = () => <svg className="scribble" viewBox="0 0 200 14" aria-hidden><path d="M2 9c18-6 30 3 48-1s30-6 48-2 32 5 50 0 30-4 50-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
const NOTES = ['Finish one thing today. Unfinished songs don\'t get streams.', 'Send the email you\'ve been avoiding. Then rest.', 'Record the rough take. Polish is for Thursday.', 'Ten real fans beat a thousand scrolls. Talk to one.', 'Your next drop needs a date more than it needs perfection.', 'Go to one local show this week. Shake two hands.', 'Back up your sessions. Twice.']
export function Manager() {
  const [msgs, setMsgs] = useState<{ role: string; content: string }[]>(store.get('chat', []))
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [check, setCheck] = useState<any>(store.get('checkin', null))
  const [goal, setGoal] = useState('')
  const note = check?.note && check.day === new Date().toDateString() ? check.note : NOTES[new Date().getDay()]
  useEffect(() => store.set('chat', msgs.slice(-30)), [msgs])
  const ask = async (text = q) => {
    if (!text.trim()) return
    const next = [...msgs, { role: 'user', content: text.trim() }]
    setMsgs(next); setQ(''); setBusy(true); setErr('')
    try { const r = await call('/api/chat', { messages: next.slice(-10), listings: listingsBrief() }); setMsgs([...next, { role: 'assistant', content: r.reply }]) } catch (e: any) { setErr(e.message) } finally { setBusy(false) }
  }
  const checkin = async () => {
    setBusy(true); setErr('')
    const p = store.get<any>('profile', {}), plan = store.get<any>('plan', null)
    try { const r = await call('/api/checkin', { name: p.name, genre: p.genres?.join(', '), goal, release: plan ? `${plan.title || 'untitled'} on ${plan.drop}` : '' }); const c = { ...r, day: new Date().toDateString(), week: new Date().toDateString() }; setCheck(c); store.set('checkin', c) } catch (e: any) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <div className="pad">
      <Head kicker="Your manager" title={<>Always <em>in your corner</em></>} />
      <figure className="note"><blockquote>{note}</blockquote><Scribble /><figcaption>— today's note</figcaption></figure>
      <section className="card glass">
        <span className="kicker">Weekly check-in</span>
        {check?.plan ? (
          <>
            <p className="serif lead">{check.motivation}</p>
            <ul className="plain">{check.plan.map((t: string) => <li key={t}>{t}</li>)}</ul>
            <span className="kicker">Tips</span>
            <ul className="plain muted">{check.tips.map((t: string) => <li key={t}>{t}</li>)}</ul>
          </>
        ) : <p className="muted small">Tell me this week's goal and I'll lay out the days.</p>}
        <input placeholder="This week I want to…" value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={300} />
        <button className="ghost" disabled={busy} onClick={checkin}>{busy ? 'Thinking…' : check ? 'Redo this week' : 'Run my check-in'}</button>
      </section>
      <section className="chat" aria-live="polite">
        {msgs.length === 0 && <div className="starters">{['How do I get my first 1,000 listeners?', 'Which local studio fits a first session?', 'Plan my next 30 days'].map((s) => <button key={s} className="chip" onClick={() => ask(s)}>{s}</button>)}</div>}
        {msgs.map((m, i) => <p key={i} className={m.role === 'user' ? 'bubble you' : 'bubble mgr'}>{m.content}</p>)}
        {busy && <p className="bubble mgr muted">…</p>}
        {err && <p className="err">{err}</p>}
      </section>
      <form className="ask" onSubmit={(e) => { e.preventDefault(); ask() }}><input placeholder="Ask your manager" value={q} onChange={(e) => setQ(e.target.value)} maxLength={1200} /><button className="cta" disabled={busy}>Ask</button></form>
    </div>
  )
}

/* ───────── Collab matching ───────── */
export function Collab() {
  const me = store.get<any>('profile', {})
  const [genres, setGenres] = useState<string[]>(me.genres || [])
  const [vibes, setVibes] = useState<string[]>(me.vibes || [])
  const [role, setRole] = useState('Producer')
  const [people, setPeople] = useState<any[] | null>(null)
  const myHandle = store.get<any>('me', {}).handle
  useEffect(() => { call('/api/collab').then((r) => setPeople(r.people)).catch(() => setPeople([])) }, [])
  const scored = (people || []).filter((p) => p.handle !== myHandle && (p.role === role || role === 'Any'))
    .map((p) => ({ p, score: (p.genres || []).filter((g: string) => genres.includes(g)).length * 2 + (p.vibes || []).filter((v: string) => vibes.includes(v)).length + (p.pro ? 1 : 0) }))
    .sort((a, b) => b.score - a.score)
  const engineers = LISTINGS.filter((l) => l.kind === 'studio')
  return (
    <div className="pad">
      <Head kicker="Collab" title={<>Find your <em>people</em></>} sub="Matched by genre and vibe. Only people who opted in are shown." />
      <div className="chips">{['Producer', 'Engineer', 'Feature', 'Artist', 'Any'].map((r) => <button key={r} className={role === r ? 'chip on' : 'chip'} onClick={() => setRole(r)}>{r}s</button>)}</div>
      <span className="kicker">Genre</span>
      <div className="chips">{GENRES.map((g) => <button key={g} className={genres.includes(g) ? 'chip on' : 'chip'} onClick={() => setGenres(toggle(genres, g))}>{g}</button>)}</div>
      <span className="kicker">Vibe</span>
      <div className="chips">{VIBES.map((v) => <button key={v} className={vibes.includes(v) ? 'chip on' : 'chip'} onClick={() => setVibes(toggle(vibes, v))}>{v}</button>)}</div>
      <ul className="matches">
        {people === null && <li className="muted">Loading…</li>}
        {people && scored.length === 0 && <li className="card glass"><p className="serif lead">No {role.toLowerCase()}s have joined yet.</p><p className="muted small">Brasswick is brand new, so the board starts empty. Be first: turn on "Show me in Collab" in Me.</p><a className="ghost" href="#/me">Set up my profile</a></li>}
        {scored.map(({ p, score }) => (
          <li key={p.handle} className="card match">
            <div><strong className="serif">{p.name}</strong>{p.pro && <span className="boost">Boosted</span>}<span className="muted small"> · {p.role} · {p.city}</span></div>
            <p className="small">{[...(p.genres || []), ...(p.vibes || [])].join(' · ')}</p>
            <div className="row2"><span className="fit">{score >= 4 ? 'Strong fit' : score >= 2 ? 'Good fit' : 'Maybe'}</span><a className="ghost sm" href={`/@${p.handle}`}>See their page</a></div>
          </li>
        ))}
      </ul>
      {(role === 'Engineer' || role === 'Any') && <>
        <span className="kicker">Studios with in-house engineers</span>
        <ul className="spots">{engineers.map((l) => <li key={l.id}><a className="spot" href={`#/place/${l.id}`}><strong className="serif">{l.name}</strong><span className="muted small">{l.address}</span></a></li>)}</ul>
      </>}
    </div>
  )
}

/* ───────── Me: profile, link page, Pro ───────── */
export function Me() {
  const [p, setP] = useState<any>(store.get('profile', { name: '', bio: '', city: 'Cincinnati', role: 'Artist', genres: [], vibes: [], links: [{ label: '', url: '' }], release: '', releaseDate: '' }))
  const [me, setMe] = useState<any>(store.get('me', {}))
  const [handle, setHandle] = useState(me.handle || '')
  const [collab, setCollab] = useState<boolean>(store.get('collab', true))
  const [msg, setMsg] = useState('')
  const [bill, setBill] = useState<any>(null)
  useEffect(() => { call('/api/billing').then(setBill).catch(() => {}) }, [me.key])
  const up = (k: string, v: unknown) => { const n = { ...p, [k]: v }; setP(n); store.set('profile', n) }
  const save = async () => {
    setMsg('')
    try {
      const r = await call('/api/profile', { handle: handle.toLowerCase(), key: me.key, profile: p, collab })
      const m = { handle: r.handle, key: r.key || me.key }
      setMe(m); store.set('me', m); store.set('collab', collab); setMsg('Saved. Your page is live.')
    } catch (e: any) { setMsg(e.message) }
  }
  const upgrade = async () => { try { const r = await call('/api/checkout', {}); location.href = r.url } catch (e: any) { setMsg(e.message) } }
  return (
    <div className="pad">
      <Head kicker="Me" title={<>Your <em>page</em></>} sub="One link for your bio. Everything you are, nothing extra." />
      <div className="card glass form">
        <label className="row"><span>brasswick.pages.dev/@</span><input value={handle} onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_.]/g, ''))} maxLength={24} disabled={!!me.handle} placeholder="yourname" /></label>
        <input placeholder="Artist name" value={p.name} onChange={(e) => up('name', e.target.value)} maxLength={60} />
        <textarea placeholder="Short bio" value={p.bio} onChange={(e) => up('bio', e.target.value)} maxLength={280} rows={2} />
        <div className="row2"><input placeholder="City" value={p.city} onChange={(e) => up('city', e.target.value)} maxLength={40} />
          <select value={p.role} onChange={(e) => up('role', e.target.value)}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></div>
        <div className="chips">{GENRES.map((g) => <button key={g} className={p.genres.includes(g) ? 'chip on' : 'chip'} onClick={() => up('genres', toggle(p.genres, g))}>{g}</button>)}</div>
        <div className="chips">{VIBES.map((g) => <button key={g} className={p.vibes.includes(g) ? 'chip on' : 'chip'} onClick={() => up('vibes', toggle(p.vibes, g))}>{g}</button>)}</div>
        <div className="row2"><input placeholder="Next release" value={p.release} onChange={(e) => up('release', e.target.value)} maxLength={80} /><input type="date" value={p.releaseDate} onChange={(e) => up('releaseDate', e.target.value)} /></div>
        <span className="kicker">Links</span>
        {p.links.map((l: any, i: number) => (
          <div className="row2" key={i}><input placeholder="Label" value={l.label} onChange={(e) => up('links', p.links.map((x: any, j: number) => (j === i ? { ...x, label: e.target.value } : x)))} maxLength={40} />
            <input placeholder="https://…" value={l.url} onChange={(e) => up('links', p.links.map((x: any, j: number) => (j === i ? { ...x, url: e.target.value } : x)))} maxLength={300} /></div>
        ))}
        {p.links.length < 8 && <button className="ghost sm" onClick={() => up('links', [...p.links, { label: '', url: '' }])}>+ Add link</button>}
        <label className="task"><input type="checkbox" checked={collab} onChange={(e) => setCollab(e.target.checked)} /><span>Show me in Collab</span></label>
        <button className="cta" onClick={save}>{me.handle ? 'Update my page' : 'Claim my page'}</button>
        {msg && <p className="small">{msg} {me.handle && <a href={`/@${me.handle}`}>Open /@{me.handle} ↗</a>}</p>}
        {me.key && <p className="muted small">Your edit key stays on this device. Clearing your browser loses edit access.</p>}
      </div>
      <section className="card pro">
        <span className="kicker bronze">Brasswick Pro · {bill?.price || '$7.99/mo'}</span>
        <h2 className="serif">More manager, more <em>reach</em></h2>
        <ul className="plain"><li>80 manager messages a day (free: 8)</li><li>30 AI-tailored release plans a day (free: 2)</li><li>Boosted profile: listed first in Collab with a Boosted mark</li></ul>
        {bill?.pro && bill?.enabled ? <p className="bronze">You're Pro. Thank you.</p>
          : bill?.enabled ? <button className="cta" onClick={upgrade}>Go Pro</button>
          : <p className="muted small">Preview: payments aren't on yet, so every Pro feature is unlocked for now.</p>}
      </section>
    </div>
  )
}

/* ───────── Public link-in-bio ───────── */
export function LinkPage({ handle }: { handle: string }) {
  const [d, setD] = useState<any>(null)
  const [err, setErr] = useState('')
  useEffect(() => { call(`/api/profile/${handle}`).then(setD).catch((e) => setErr(e.message)) }, [handle])
  if (err) return <div className="link-page"><p className="muted">No page at /@{handle} yet.</p><a href="/">Make yours on Brasswick</a></div>
  if (!d) return <div className="link-page muted">…</div>
  const p = d.profile
  const days = p.releaseDate ? Math.ceil((new Date(p.releaseDate + 'T12:00').getTime() - Date.now()) / 864e5) : null
  return (
    <div className="link-page reveal">
      <div className="tint" aria-hidden />
      <span className="kicker">{p.role} · {p.city}</span>
      <h1 className="display">{p.name}{d.pro && <span className="boost">◆</span>}</h1>
      {p.bio && <p className="serif lead">{p.bio}</p>}
      {p.genres?.length > 0 && <p className="muted small">{[...p.genres, ...(p.vibes || [])].join(' · ')}</p>}
      {p.release && <div className="card glass"><span className="kicker bronze">Next chapter</span><strong className="serif">{p.release}</strong>{days !== null && <span className="muted small">{days > 0 ? `${days} days to go` : 'Out now'}</span>}</div>}
      <ul className="links">{p.links.map((l: any) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer nofollow"><span className="serif">{l.label}</span><span aria-hidden>↗</span></a></li>)}</ul>
      <a className="made" href="/">Made with <span className="serif">Brass<em>wick</em></span></a>
    </div>
  )
}

/* ───────── Feedback ───────── */
export function Feedback({ screen }: { screen: string }) {
  const [open, setOpen] = useState(false)
  const [mood, setMood] = useState('')
  const [text, setText] = useState('')
  const [state, setState] = useState('')
  const send = async () => { try { await call('/api/feedback', { screen, mood, message: text }); setState('Thanks, it\'s saved.'); setText(''); setTimeout(() => setOpen(false), 1200) } catch (e: any) { setState(e.message) } }
  return (
    <>
      <button className="fb" onClick={() => { setOpen(true); setState('') }} aria-label="Send feedback">Feedback</button>
      {open && <div className="modal" role="dialog" aria-label="Feedback" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
        <div className="card glass">
          <h2 className="serif">How's it <em>feel?</em></h2>
          <div className="chips">{['Love it', 'Okay', 'Confusing', 'Broken'].map((m) => <button key={m} className={mood === m ? 'chip on' : 'chip'} onClick={() => setMood(m)}>{m}</button>)}</div>
          <textarea rows={4} placeholder="Tell us anything" value={text} onChange={(e) => setText(e.target.value)} maxLength={1500} />
          {state && <p className="small">{state}</p>}
          <div className="row2"><button className="ghost" onClick={() => setOpen(false)}>Close</button><button className="cta" disabled={!text.trim()} onClick={send}>Send</button></div>
        </div>
      </div>}
    </>
  )
}
