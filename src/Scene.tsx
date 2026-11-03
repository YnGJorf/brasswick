import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// @ts-ignore vite worker url import
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
maplibregl.setWorkerUrl(workerUrl)
import { useEffect, useRef, useState } from 'react'
import { KIND_LABEL, LISTINGS, type Kind } from './data'
import { Brand, Badge } from './screens'

export default function Scene() {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markers = useRef<maplibregl.Marker[]>([])
  const [kind, setKind] = useState<Kind | 'all'>('all')
  const [sel, setSel] = useState<string | null>(null)
  const list = LISTINGS.filter((l) => kind === 'all' || l.kind === kind)

  useEffect(() => {
    if (!el.current) return
    const m = new maplibregl.Map({ container: el.current, style: 'https://tiles.openfreemap.org/styles/dark', center: [-84.47, 39.15], zoom: 9.6, attributionControl: { compact: true } })
    map.current = m
    m.on('load', () => {
      // Calm layer: mute labels and roads, warm the water.
      for (const l of m.getStyle().layers || []) {
        if (l.type === 'symbol' && !/place_city|place_town|place_suburb/.test(l.id)) m.setLayoutProperty(l.id, 'visibility', 'none')
        if (l.type === 'background') m.setPaintProperty(l.id, 'background-color', '#1d1b18')
        if (l.type === 'fill' && /water/.test(l.id)) m.setPaintProperty(l.id, 'fill-color', '#232a2c')
        if (l.type === 'line' && /road|highway|transportation/.test(l.id)) { try { m.setPaintProperty(l.id, 'line-color', '#463f36') } catch { /* skip */ } }
      }
      const b = new maplibregl.LngLatBounds()
      LISTINGS.forEach((l) => b.extend([l.lon, l.lat]))
      const head = document.querySelector('.scene-head')?.getBoundingClientRect().bottom ?? 280
      const sheet = document.querySelector('.sheet')?.getBoundingClientRect().top ?? window.innerHeight * 0.6
      m.fitBounds(b, { padding: { top: Math.round(head) + 24, bottom: Math.round(window.innerHeight - sheet) + 48, left: 44, right: 44 }, duration: 0, maxZoom: 12 })
    })
    return () => m.remove()
  }, [])

  useEffect(() => {
    const m = map.current
    if (!m) return
    markers.current.forEach((x) => x.remove())
    markers.current = list.map((l) => {
      const dot = document.createElement('button')
      dot.className = `pin pin-${l.kind}${sel === l.id ? ' on' : ''}`
      dot.setAttribute('aria-label', l.name)
      dot.onclick = () => { setSel(l.id); m.easeTo({ center: [l.lon, l.lat], zoom: Math.max(m.getZoom(), 12), duration: 900 }) }
      return new maplibregl.Marker({ element: dot }).setLngLat([l.lon, l.lat]).addTo(m)
    })
  }, [kind, sel, list.length])

  const s = LISTINGS.find((l) => l.id === sel)
  return (
    <div className="scene">
      <div ref={el} className="map" />
      <header className="scene-head">
        <Brand />
        <h1 className="display">The <em>local</em> scene</h1>
        <p className="muted small">{LISTINGS.length} real Cincinnati-area spots · from public listings</p>
        <div className="chips" role="tablist">
          {(['all', 'studio', 'photo', 'video'] as const).map((k) => <button key={k} className={kind === k ? 'chip on' : 'chip'} onClick={() => setKind(k)}>{k === 'all' ? 'Everything' : KIND_LABEL[k] + 's'}</button>)}
        </div>
      </header>
      <section className="sheet">
        <div className="grab" />
        {s ? (
          <a className="spot big" href={`#/place/${s.id}`}>
            <span className="kicker">{KIND_LABEL[s.kind]}</span>
            <strong className="serif">{s.name}</strong>
            <span className="muted small">{s.address}</span>
            <Badge />
            <span className="go">Open profile →</span>
          </a>
        ) : <p className="muted small">Tap a light on the map, or pick below.</p>}
        <ul className="spots">
          {list.filter((l) => l.id !== sel).map((l) => (
            <li key={l.id}><a href={`#/place/${l.id}`} className="spot"><span className="kicker">{KIND_LABEL[l.kind]}</span><strong className="serif">{l.name}</strong><span className="muted small">{l.address}</span></a></li>
          ))}
        </ul>
      </section>
    </div>
  )
}
