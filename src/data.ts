import raw from './listings.json'

export type Kind = 'studio' | 'photo' | 'video'
export interface Listing { id: string; name: string; kind: Kind; lat: number; lon: number; address: string; website?: string | null; source: string; services: string[]; rate?: number }

const SERVICES: Record<Kind, string[]> = {
  studio: ['Recording', 'Mix & master', 'Engineer'],
  photo: ['Press photos', 'Cover art shoot'],
  video: ['Music video', 'Live session film'],
}
// "Typical" session estimates used only to pre-fill the request form. Not quotes from the business.
const EST: Record<Kind, number> = { studio: 60, photo: 150, video: 400 }
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const LISTINGS: Listing[] = (raw as Omit<Listing, 'id' | 'services'>[]).map((l) => ({
  ...l, id: slug(l.name), services: SERVICES[l.kind], rate: l.name === 'Music Resource Center' ? 60 : undefined,
}))
export const estimate = (l: Listing) => l.rate ?? EST[l.kind]
export const KIND_LABEL: Record<Kind, string> = { studio: 'Studio', photo: 'Photographer', video: 'Videographer' }
export const listingsBrief = () => LISTINGS.filter((l) => l.kind === 'studio').map((l) => `${l.name} (${l.address})`).join('; ')

export const GENRES = ['Hip-hop', 'R&B', 'Pop', 'Rock', 'Indie', 'Country', 'Gospel', 'Electronic', 'Drill', 'Alt']
export const VIBES = ['Late-night', 'Raw', 'Polished', 'Moody', 'Upbeat', 'Lo-fi', 'Cinematic', 'Soulful']
export const ROLES = ['Artist', 'Producer', 'Engineer', 'Feature', 'Photographer', 'Videographer']

/** Deterministic, free release plan: weeks out -> chapter + tasks. */
const CHAPTERS: { label: string; tasks: string[] }[] = [
  { label: 'The quiet build', tasks: ['Lock the final mix and master', 'Book a cover-art shoot or finalize artwork', 'Pick the release title and write a one-line hook'] },
  { label: 'Paperwork & pipes', tasks: ['Upload to your distributor (aim for 4+ weeks early)', 'Register the song with your PRO and get ISRC from the distributor', 'Write a 3-line bio + press blurb'] },
  { label: 'First whispers', tasks: ['Pitch to editorial playlists from your distributor dashboard', 'Post a 10-second snippet with no context', 'Make a pre-save link and put it in your link page'] },
  { label: 'Faces and places', tasks: ['Shoot 6 short vertical videos in one session', 'Email 5 local blogs, radio (WAIF, WVXU) and curators', 'Line up a release-night spot or listening party'] },
  { label: 'The tease', tasks: ['Reveal the cover art', 'Post a behind-the-scenes studio clip', 'DM 20 supporters personally with the pre-save'] },
  { label: 'Countdown', tasks: ['Daily story countdown', 'Send the press kit one last time', 'Plan release-day posts and who you will tag'] },
  { label: 'Release week', tasks: ['Release-day post + update your link page', 'Go live or host the listening night', 'Thank every person who shared it, by name'] },
  { label: 'The afterglow', tasks: ['Post the best fan reactions', 'Drop an alternate version or live take', 'Write down what worked for the next drop'] },
]
export function releasePlan(drop: string, title: string) {
  const d = new Date(drop + 'T12:00:00')
  const now = new Date()
  let weeksOut = Math.ceil((d.getTime() - now.getTime()) / (7 * 864e5))
  weeksOut = Math.max(1, Math.min(10, weeksOut))
  const pick = CHAPTERS.slice(0, 7)
  // Compress or stretch to weeksOut + 1 chapters (last = afterglow)
  const out: { week: number; date: string; label: string; tasks: string[] }[] = []
  for (let i = weeksOut; i >= 0; i--) {
    const idx = Math.round(((weeksOut - i) / Math.max(1, weeksOut)) * 6)
    const c = i === 0 ? pick[6] : pick[Math.min(5, idx)]
    const wd = new Date(d.getTime() - i * 7 * 864e5)
    out.push({ week: -i, date: wd.toISOString().slice(0, 10), label: i === 0 ? `${title || 'Your drop'} is out` : c.label, tasks: i === 0 ? c.tasks : c.tasks })
  }
  const after = new Date(d.getTime() + 7 * 864e5)
  out.push({ week: 1, date: after.toISOString().slice(0, 10), label: CHAPTERS[7].label, tasks: CHAPTERS[7].tasks })
  // Dedupe repeated chapters when stretched: keep tasks unique per row by suffixing focus.
  const seen = new Map<string, number>()
  return out.map((w) => { const n = (seen.get(w.label) || 0) + 1; seen.set(w.label, n); return n > 1 ? { ...w, label: `${w.label}, part ${n}` } : w })
}

/** Time-of-day phase drives a subtle tint. */
export function phase(h = new Date().getHours()) {
  if (h >= 5 && h < 10) return 'dawn'
  if (h >= 10 && h < 17) return 'day'
  if (h >= 17 && h < 21) return 'dusk'
  return 'night'
}
