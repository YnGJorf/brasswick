// Local harness: runs dist-worker/_worker.js on Node with a node:sqlite-backed D1 shim (no AI binding).
import http from 'node:http'
import { DatabaseSync } from 'node:sqlite'
const db = new DatabaseSync(':memory:')
const norm = (v) => v.map((x) => (x === undefined ? null : typeof x === 'boolean' ? Number(x) : x))
function prep(sql, args = []) {
  return {
    bind: (...v) => prep(sql, v),
    first: async () => db.prepare(sql).get(...norm(args)) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...norm(args)), success: true }),
    run: async () => { const r = db.prepare(sql).run(...norm(args)); return { results: [], success: true, meta: { changes: Number(r.changes) } } },
    _sql: sql, _args: args,
  }
}
const DB = { prepare: (s) => prep(s), batch: async (ps) => Promise.all(ps.map((p) => p.run())), exec: async (s) => db.exec(s) }
// OVERPASS_FIXTURE=path.json: answer the Worker's Overpass calls from a saved extract (the box can't reach the mirrors).
