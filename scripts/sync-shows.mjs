// Fienta → docs/shows.json sync
// Runs in GitHub Actions on a cron schedule.
//
// Strategy:
//   1. Fetch organizer's published upcoming events from Fienta's public API.
//   2. If Fienta returns 0 events, leave shows.json untouched (preserves any
//      manual entries during initial testing or when the feed is temporarily empty).
//   3. If Fienta returns events, rewrite the upcoming portion of shows.json from
//      Fienta and preserve existing past entries (Fienta's public endpoint only
//      returns upcoming events, so history would be lost otherwise).

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ORGANIZER_ID = process.env.FIENTA_ORGANIZER_ID;
if (!ORGANIZER_ID) {
  console.error('FIENTA_ORGANIZER_ID is not set — aborting.');
  process.exit(1);
}

const SHOWS_FILE = resolve('docs/shows.json');
const API_URL = `https://fienta.com/api/v1/public/events?organizer=${ORGANIZER_ID}`;

// ---------- helpers ----------
const splitISO = (iso) => {
  if (!iso) return { date: '', time: '' };
  const [date, rest = ''] = iso.split('T');
  const time = rest.slice(0, 5); // "HH:MM"
  return { date, time };
};

const mapFientaEvent = (e) => {
  const start = splitISO(e.starts_at);
  const end   = splitISO(e.ends_at);
  const ticketUrl = e.buy_tickets_url || e.url || '';
  return {
    date: start.date,
    time: start.time,
    ...(end.time ? { endTime: end.time } : {}),
    title: e.title || '',
    ...(e.venue ? { venue: e.venue } : {}),
    city: '',                      // Fienta public API exposes address, not a clean city
    ...(ticketUrl ? { cta: { label: 'Tickets', url: ticketUrl } } : {}),
    status: 'upcoming',
    source: 'fienta',
    fientaId: e.id
  };
};

// ---------- fetch ----------
let data;
try {
  const res = await fetch(API_URL, { headers: { 'User-Agent': 'kristinkalnapenk.com-sync' } });
  if (!res.ok) {
    console.error(`Fienta API returned ${res.status}. Not touching shows.json.`);
    process.exit(0);
  }
  data = await res.json();
} catch (err) {
  console.error('Fienta fetch failed:', err.message, '— not touching shows.json.');
  process.exit(0);
}

const fientaEvents = Array.isArray(data?.events) ? data.events : [];
console.log(`Fienta returned ${fientaEvents.length} event(s).`);

// No events → no-op (preserve whatever is there — lets manual shows.json live
// happily until Fienta has real data).
if (fientaEvents.length === 0) {
  console.log('No Fienta events, leaving shows.json unchanged.');
  process.exit(0);
}

// ---------- merge ----------
let existing = [];
try {
  existing = JSON.parse(readFileSync(SHOWS_FILE, 'utf8'));
  if (!Array.isArray(existing)) existing = [];
} catch {
  existing = [];
}

const todayISO = new Date().toISOString().slice(0, 10);
const preservedPast = existing.filter(s =>
  s.status === 'past' || (s.date && s.date < todayISO)
);

const fientaShows = fientaEvents
  .map(mapFientaEvent)
  .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

const merged = [...fientaShows, ...preservedPast];

// ---------- write if changed ----------
const currentJson = JSON.stringify(existing, null, 2);
const nextJson    = JSON.stringify(merged,   null, 2);

if (currentJson === nextJson) {
  console.log('shows.json already in sync — no write.');
  process.exit(0);
}

writeFileSync(SHOWS_FILE, nextJson + '\n');
console.log(`shows.json updated: ${fientaShows.length} upcoming + ${preservedPast.length} past.`);
