import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { phase } from './data'
import { Booking, Collab, Feedback, LinkPage, Manager, Me, Place, Plan } from './screens'
const Scene = lazy(() => import('./Scene'))

function useRoute() {
  const [h, setH] = useState(location.hash || '#/scene')
  useEffect(() => { const f = () => { setH(location.hash || '#/scene'); window.scrollTo(0, 0) }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  return h.slice(2).split('/')
}

const TABS = [['scene', 'Scene'], ['plan', 'Release'], ['manager', 'Manager'], ['collab', 'Collab'], ['me', 'Me']] as const

export default function App() {
  const r = useRoute()
  const [ph, setPh] = useState(phase())
  useEffect(() => { const t = setInterval(() => setPh(phase()), 60000); return () => clearInterval(t) }, [])
  useEffect(() => { document.documentElement.dataset.phase = new URLSearchParams(location.search).get('phase') || ph }, [ph])
  const publicHandle = useMemo(() => location.pathname.match(/^\/@([a-z0-9_.]{3,24})$/)?.[1], [])
  if (publicHandle) return <LinkPage handle={publicHandle} />
  const tab = r[0] || 'scene'
  let view
  switch (tab) {
    case 'place': view = <Place id={r[1]} />; break
    case 'book': view = <Booking id={r[1]} />; break
    case 'plan': view = <Plan />; break
    case 'manager': view = <Manager />; break
    case 'collab': view = <Collab />; break
    case 'me': view = <Me />; break
    default: view = <Suspense fallback={<div className="pad muted">Opening the map…</div>}><Scene /></Suspense>
  }
  const active = tab === 'place' || tab === 'book' ? 'scene' : tab
  return (
    <div className="shell">
      <div className="tint" aria-hidden />
      <main key={tab + (r[1] || '')} className="reveal">{view}</main>
      <Feedback screen={tab} />
      <nav className="chapters" aria-label="Sections">
        {TABS.map(([k, label]) => <a key={k} href={`#/${k}`} className={active === k ? 'on' : ''} aria-current={active === k ? 'page' : undefined}>{label}</a>)}
      </nav>
    </div>
  )
}
