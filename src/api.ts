export const store = {
  get<T>(k: string, d: T): T { try { const v = localStorage.getItem('bw.' + k); return v ? JSON.parse(v) : d } catch { return d } },
  set(k: string, v: unknown) { localStorage.setItem('bw.' + k, JSON.stringify(v)) },
}
export async function call<T = any>(path: string, body?: unknown, method = body ? 'POST' : 'GET'): Promise<T> {
  const me = store.get<{ handle?: string; key?: string }>('me', {})
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (me.handle && me.key) { headers['x-handle'] = me.handle; headers['x-edit-key'] = me.key }
  const r = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(d.error || 'Network trouble')
  return d
}
