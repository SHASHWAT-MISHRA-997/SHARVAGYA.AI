/**
 * Demo mode: sample data served in-browser when no backend is configured.
 *
 * Active only on hosted deployments where NEXT_PUBLIC_API_URL is not set.
 * As soon as NEXT_PUBLIC_API_URL is configured, every request goes to the
 * real backend and none of this code runs.
 *
 * All data here is fictional sample data and resets on page reload.
 */
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

export const DEMO_TOKEN = 'demo-mode-token';

export function isDemoMode(): boolean {
  if (process.env.NEXT_PUBLIC_API_URL) return false;
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host !== 'localhost' && host !== '127.0.0.1';
}

const ORG_ID = '00000000-0000-4000-8000-000000000001';
const USER_ID = '00000000-0000-4000-8000-000000000002';
const now = () => new Date();
const iso = (d: Date) => d.toISOString();
const hoursAgo = (h: number) => iso(new Date(Date.now() - h * 3600_000));
const uid = (prefix: string, n: number) =>
  `${prefix}-0000-4000-8000-${String(n).padStart(12, '0')}`;

export const demoUser = {
  access_token: DEMO_TOKEN,
  token_type: 'bearer',
  user: {
    id: USER_ID,
    email: 'demo@orvanta.example',
    username: 'demo',
    full_name: 'Demo Operator',
    is_active: true,
    created_at: hoursAgo(24 * 30),
  },
  organization: {
    id: ORG_ID,
    name: 'ORVANTA Demo Workspace',
    slug: 'demo',
    api_key: 'demo-key',
    is_active: true,
    risk_threshold_low: '25',
    risk_threshold_medium: '50',
    risk_threshold_high: '70',
    risk_threshold_critical: '85',
    webhook_url: null,
    webhook_enabled: false,
    created_at: hoursAgo(24 * 30),
  },
};

type Seed = {
  title: string; type: string; country: string; region: string; city: string;
  lat: number; lon: number; severity: number; source: string; domain: string;
  tags: string[]; actors: string[]; hours: number;
};

const SEEDS: Seed[] = [
  { title: 'Port congestion delays container traffic at Rotterdam', type: 'disruption', country: 'Netherlands', region: 'South Holland', city: 'Rotterdam', lat: 51.92, lon: 4.48, severity: 6, source: 'rss', domain: 'portofrotterdam.com', tags: ['logistics', 'shipping'], actors: ['Port Authority'], hours: 2 },
  { title: 'Ransomware campaign targets regional energy utilities', type: 'cyber', country: 'United States', region: 'Texas', city: 'Austin', lat: 30.27, lon: -97.74, severity: 8, source: 'rss', domain: 'cisa.gov', tags: ['ransomware', 'energy'], actors: ['Unknown threat actor'], hours: 4 },
  { title: 'Monsoon flooding disrupts rail freight corridors', type: 'natural_disaster', country: 'India', region: 'Assam', city: 'Guwahati', lat: 26.14, lon: 91.74, severity: 7, source: 'gdelt', domain: 'ndma.gov.in', tags: ['flood', 'rail'], actors: ['NDMA'], hours: 6 },
  { title: 'Labour strike halts automotive assembly plants', type: 'protest', country: 'Germany', region: 'Bavaria', city: 'Munich', lat: 48.14, lon: 11.58, severity: 5, source: 'rss', domain: 'reuters.com', tags: ['labour', 'automotive'], actors: ['IG Metall'], hours: 9 },
  { title: 'Armed clashes reported near key border crossing', type: 'conflict', country: 'Sudan', region: 'Darfur', city: 'El Fasher', lat: 13.63, lon: 25.35, severity: 9, source: 'acled', domain: 'acleddata.com', tags: ['armed conflict'], actors: ['RSF', 'SAF'], hours: 11 },
  { title: 'Central bank announces surprise rate increase', type: 'economic', country: 'Turkey', region: 'Ankara', city: 'Ankara', lat: 39.93, lon: 32.86, severity: 4, source: 'rss', domain: 'tcmb.gov.tr', tags: ['monetary policy'], actors: ['Central Bank'], hours: 14 },
  { title: 'Snap election called after coalition collapse', type: 'political', country: 'Japan', region: 'Kanto', city: 'Tokyo', lat: 35.68, lon: 139.69, severity: 3, source: 'gdelt', domain: 'nhk.or.jp', tags: ['election'], actors: ['Diet'], hours: 20 },
  { title: 'Typhoon forces closure of major semiconductor fabs', type: 'natural_disaster', country: 'Taiwan', region: 'Hsinchu', city: 'Hsinchu', lat: 24.80, lon: 120.97, severity: 8, source: 'rss', domain: 'cwa.gov.tw', tags: ['typhoon', 'semiconductors'], actors: ['CWA'], hours: 26 },
  { title: 'Shipping attacks prompt rerouting around Red Sea', type: 'conflict', country: 'Yemen', region: 'Red Sea', city: 'Hodeidah', lat: 14.80, lon: 42.95, severity: 9, source: 'acled', domain: 'ukmto.org', tags: ['maritime', 'shipping'], actors: ['Houthi forces'], hours: 30 },
  { title: 'Nationwide fuel protests block highways', type: 'protest', country: 'Kenya', region: 'Nairobi', city: 'Nairobi', lat: -1.29, lon: 36.82, severity: 6, source: 'gdelt', domain: 'nation.africa', tags: ['fuel prices'], actors: ['Civil groups'], hours: 38 },
  { title: 'Data breach exposes logistics customer records', type: 'cyber', country: 'United Kingdom', region: 'England', city: 'London', lat: 51.51, lon: -0.13, severity: 5, source: 'rss', domain: 'ncsc.gov.uk', tags: ['data breach'], actors: ['Unknown'], hours: 47 },
  { title: 'Wildfires threaten agricultural export region', type: 'natural_disaster', country: 'Brazil', region: 'Mato Grosso', city: 'Cuiabá', lat: -15.60, lon: -56.10, severity: 6, source: 'gdelt', domain: 'inpe.br', tags: ['wildfire', 'agriculture'], actors: ['INPE'], hours: 60 },
  { title: 'Power grid outage affects industrial zone', type: 'disruption', country: 'South Africa', region: 'Gauteng', city: 'Johannesburg', lat: -26.20, lon: 28.05, severity: 5, source: 'rss', domain: 'eskom.co.za', tags: ['power', 'load shedding'], actors: ['Eskom'], hours: 75 },
  { title: 'Bombing near transit hub raises security alert', type: 'terrorism', country: 'Pakistan', region: 'Balochistan', city: 'Quetta', lat: 30.18, lon: 66.98, severity: 8, source: 'acled', domain: 'acleddata.com', tags: ['security'], actors: ['Unknown'], hours: 96 },
  { title: 'New export controls announced on critical minerals', type: 'economic', country: 'China', region: 'Beijing', city: 'Beijing', lat: 39.90, lon: 116.40, severity: 6, source: 'rss', domain: 'mofcom.gov.cn', tags: ['trade', 'minerals'], actors: ['MOFCOM'], hours: 120 },
  { title: 'Canal water levels restrict vessel transits', type: 'disruption', country: 'Panama', region: 'Panamá', city: 'Colón', lat: 9.36, lon: -79.90, severity: 5, source: 'rss', domain: 'pancanal.com', tags: ['shipping', 'drought'], actors: ['Canal Authority'], hours: 150 },
  { title: 'Earthquake damages highway and port facilities', type: 'natural_disaster', country: 'Chile', region: 'Biobío', city: 'Concepción', lat: -36.83, lon: -73.05, severity: 7, source: 'gdelt', domain: 'usgs.gov', tags: ['earthquake'], actors: ['USGS'], hours: 200 },
  { title: 'Parliament passes contested security legislation', type: 'political', country: 'Georgia', region: 'Tbilisi', city: 'Tbilisi', lat: 41.72, lon: 44.79, severity: 4, source: 'gdelt', domain: 'civil.ge', tags: ['legislation'], actors: ['Parliament'], hours: 260 },
];

function riskLevel(score: number) {
  if (score >= 85) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

function buildEvent(s: Seed, i: number) {
  const created = hoursAgo(s.hours);
  const url = `https://${s.domain}/`;
  const official = { title: `${s.domain} (sample)`, url, source: s.domain, host: s.domain, kind: 'official', category: 'official', verified: true, reason: 'Sample data', published_at: created };
  return {
    id: uid('00000000', 100 + i),
    organization_id: ORG_ID,
    title: `[Sample] ${s.title}`,
    description: `Demo sample event: ${s.title}. This record is fictional and shown because the backend API is not connected.`,
    event_type: s.type,
    source: s.source,
    source_url: url,
    source_id: `demo-${i}`,
    source_domain: s.domain,
    source_status: 'official',
    source_status_reason: 'Sample data',
    country: s.country,
    region: s.region,
    city: s.city,
    latitude: s.lat,
    longitude: s.lon,
    severity: s.severity,
    confidence: 0.6 + ((i * 7) % 4) / 10,
    credibility_score: 0.7 + ((i * 3) % 3) / 10,
    is_verified: 1,
    is_duplicate: 0,
    tags: s.tags,
    actors: s.actors,
    raw_data: null,
    event_date: created,
    ingested_at: created,
    created_at: created,
    updated_at: created,
    official_source: official,
    supporting_sources: [],
    video_links: [],
    search_links: [],
    detail_available: true,
    detail_reason: null,
    detail_missing_fields: [],
    has_exact_coordinates: true,
    location_precision: 'city',
  };
}

function createState() {
  const events = SEEDS.map(buildEvent);
  const risks = events.map((e, i) => {
    const score = Math.min(98, e.severity * 9 + ((i * 5) % 12));
    return {
      id: uid('00000000', 300 + i),
      event_id: e.id,
      organization_id: ORG_ID,
      overall_score: score,
      severity_component: e.severity * 10,
      confidence_component: Math.round(e.confidence * 100),
      proximity_component: 40 + ((i * 11) % 50),
      supply_chain_weight: 1,
      time_decay_factor: 0.9,
      region_weight: 1,
      risk_level: riskLevel(score),
      scoring_breakdown: { severity: e.severity, confidence: e.confidence, note: 'Sample data' },
      recommendations: 'Sample recommendation: monitor the situation and review exposed suppliers.',
      computed_at: e.created_at,
    };
  });
  const alerts = events
    .map((e, i) => ({ e, r: risks[i] }))
    .filter(({ r }) => r.overall_score >= 60)
    .map(({ e, r }, i) => ({
      id: uid('00000000', 500 + i),
      organization_id: ORG_ID,
      event_id: e.id,
      title: e.title,
      message: `Risk score ${r.overall_score} (${r.risk_level}) in ${e.city}, ${e.country}.`,
      priority: r.risk_level === 'medium' ? 'medium' : r.risk_level,
      status: i < 5 ? 'active' : 'acknowledged',
      alert_type: 'risk_threshold',
      meta_data: { sample: true },
      email_sent: false,
      webhook_sent: false,
      websocket_sent: true,
      acknowledged_by: i < 5 ? null : USER_ID,
      acknowledged_at: i < 5 ? null : e.created_at,
      source_url: e.source_url,
      created_at: e.created_at,
    }));
  const watchlists: any[] = [];
  return { events, risks, alerts, watchlists };
}

let state = createState();

function stats() {
  const { events, risks, alerts } = state;
  const today = Date.now() - 24 * 3600_000;
  const byType: Record<string, number> = {};
  events.forEach((e) => { byType[e.event_type] = (byType[e.event_type] || 0) + 1; });
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  return {
    total_events: events.length,
    events_today: events.filter((e) => new Date(e.created_at).getTime() >= today).length,
    total_risk_scores: risks.length,
    average_risk_score: Math.round(avg(risks.map((r) => r.overall_score)) * 100) / 100,
    critical_risks: risks.filter((r) => r.risk_level === 'critical').length,
    high_risks: risks.filter((r) => r.risk_level === 'high').length,
    active_alerts: alerts.filter((a) => a.status === 'active').length,
    total_alerts: alerts.length,
    duplicate_events: 0,
    source_linked_events: events.length,
    official_events: events.length,
    events_with_coordinates: events.length,
    detail_ready_events: events.length,
    events_with_videos: 0,
    average_event_confidence: Math.round(avg(events.map((e) => e.confidence)) * 100) / 100,
    events_by_type: Object.entries(byType).map(([event_type, count]) => ({ event_type, count })),
    recent_countries: Array.from(new Set(events.map((e) => e.country))).slice(0, 8),
    generated_at: iso(now()),
  };
}

function trends(days: number) {
  const points = [];
  for (let d = days - 1; d >= 0; d--) {
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - d);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    const idx = state.events
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => { const t = new Date(e.created_at).getTime(); return t >= start.getTime() && t < end.getTime(); })
      .map(({ i }) => i);
    const scores = idx.map((i) => state.risks[i].overall_score);
    points.push({
      date: start.toISOString().slice(0, 10),
      average_score: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : null,
      event_count: idx.length,
      critical_count: idx.filter((i) => state.risks[i].risk_level === 'critical').length,
    });
  }
  return { trends: points, period_days: days, basis: 'event_timeline' };
}

const DEMO_CHAT_REPLY =
  'Demo mode: the AI assistant needs the ORVANTA backend. Set NEXT_PUBLIC_API_URL to your hosted API to enable real answers. ' +
  'Meanwhile you can explore the sample events, alerts and analytics in this workspace.';

function route(method: string, path: string, params: any, body: any): [number, any] {
  const m = (re: RegExp) => path.match(re);
  let match: RegExpMatchArray | null;

  // Auth — every sign-in path lands in the demo workspace.
  if (path.startsWith('/auth/')) {
    if (path === '/auth/me') return [200, demoUser.user];
    if (path === '/auth/forgot-password' || path === '/auth/reset-password') {
      return [200, { message: 'Demo mode: password emails are disabled until the backend is connected.' }];
    }
    return [200, demoUser];
  }

  if (path === '/dashboard') return [200, stats()];

  if (path === '/events/live-sync') {
    return [200, { message: 'Demo mode: showing sample events (live sync needs the backend).', synced_at: iso(now()) }];
  }
  if (method === 'get' && path === '/events') {
    let list = [...state.events];
    if (params?.event_type) list = list.filter((e) => e.event_type === params.event_type);
    if (params?.country) list = list.filter((e) => e.country === params.country);
    if (params?.min_severity) list = list.filter((e) => e.severity >= Number(params.min_severity));
    const page = Number(params?.page || 1);
    const size = Number(params?.page_size || 50);
    return [200, { events: list.slice((page - 1) * size, page * size), total: list.length, page, page_size: size }];
  }
  if (method === 'post' && path === '/events') {
    const e = buildEvent({
      title: body?.title || 'Manual event', type: body?.event_type || 'other', country: body?.country || 'Unknown',
      region: body?.region || '', city: body?.city || '', lat: body?.latitude ?? 0, lon: body?.longitude ?? 0,
      severity: body?.severity || 1, source: 'manual', domain: 'manual.entry', tags: body?.tags || [], actors: body?.actors || [], hours: 0,
    }, state.events.length);
    state.events.unshift(e);
    return [201, e];
  }
  if ((match = m(/^\/events\/([^/]+)$/))) {
    const e = state.events.find((x) => x.id === match![1]);
    return e ? [200, e] : [404, { detail: 'Event not found' }];
  }

  if (path === '/risk-score/trends') return [200, trends(Number(params?.days || 30))];
  if (path === '/risk-score/compute') return [200, { message: `Demo mode: ${state.risks.length} sample risk scores recomputed.` }];
  if (path === '/risk-score') {
    const scores = state.risks.slice(0, Number(params?.limit || 200));
    return [200, {
      scores,
      total: scores.length,
      average_score: scores.reduce((a, r) => a + r.overall_score, 0) / (scores.length || 1),
      critical_count: scores.filter((r) => r.risk_level === 'critical').length,
      high_count: scores.filter((r) => r.risk_level === 'high').length,
    }];
  }

  if (method === 'get' && path === '/alerts') {
    let list = [...state.alerts];
    if (params?.status) list = list.filter((a) => a.status === params.status);
    if (params?.priority) list = list.filter((a) => a.priority === params.priority);
    return [200, {
      alerts: list.slice(0, Number(params?.limit || 50)),
      total: list.length,
      active_count: state.alerts.filter((a) => a.status === 'active').length,
    }];
  }
  if (path === '/alerts/clear') { state.alerts = []; return [200, { message: 'Alerts cleared (demo).' }]; }
  if ((match = m(/^\/alerts\/([^/]+)\/(ack|resolve|dismiss)$/))) {
    const a: any = state.alerts.find((x) => x.id === match![1]);
    if (!a) return [404, { detail: 'Alert not found' }];
    a.status = { ack: 'acknowledged', resolve: 'resolved', dismiss: 'dismissed' }[match[2]];
    if (match[2] === 'ack') { a.acknowledged_by = USER_ID; a.acknowledged_at = iso(now()); }
    return [200, a];
  }

  if (method === 'get' && path === '/watchlists') return [200, state.watchlists];
  if (method === 'post' && path === '/watchlists') {
    const kw = String(body?.keyword || '').toLowerCase();
    const matched = state.events.filter((e) =>
      (!kw || e.title.toLowerCase().includes(kw)) &&
      (!body?.country || e.country === body.country) &&
      (!body?.event_type || e.event_type === body.event_type)
    ).length;
    const w = {
      id: uid('00000000', 700 + state.watchlists.length), organization_id: ORG_ID,
      name: body?.name || 'Watchlist', keyword: body?.keyword || null, country: body?.country || null,
      source: body?.source || null, event_type: body?.event_type || null, is_active: body?.is_active ?? true,
      matched_event_count: matched, alerts_created: 0, last_matched_at: matched ? iso(now()) : null,
      created_at: iso(now()), updated_at: null,
    };
    state.watchlists.push(w);
    return [201, w];
  }
  if ((match = m(/^\/watchlists\/([^/]+)$/)) && method === 'delete') {
    state.watchlists = state.watchlists.filter((w) => w.id !== match![1]);
    return [204, null];
  }

  if (path === '/organizations/clear-all-data') {
    const deleted = { events: state.events.length, alerts: state.alerts.length, risk_scores: state.risks.length };
    state = { events: [], risks: [], alerts: [], watchlists: [] };
    return [200, { message: 'Demo data cleared. Reload the page to restore the sample data.', deleted }];
  }
  if (path.startsWith('/organizations/')) return [200, { message: 'Demo mode: thresholds updated locally.' }];

  if (path === '/developer/users') return [200, []];
  if (path.startsWith('/developer/')) return [200, { message: 'Demo mode: no users to manage.' }];

  if (path === '/chat') return [200, { response: DEMO_CHAT_REPLY }];

  return [404, { detail: `Demo mode: ${method.toUpperCase()} ${path} is not available without the backend.` }];
}

export const demoAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  const method = (config.method || 'get').toLowerCase();
  const url = (config.url || '').split('?')[0];
  const path = '/' + url.replace(/^https?:\/\/[^/]+/, '').replace(/^\/?(api\/v1\/?)?/, '').replace(/\/+$/, '');
  let body: any = config.data;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { /* keep raw */ } }

  await new Promise((r) => setTimeout(r, 150));
  const [status, data] = route(method, path, config.params, body);
  const response: AxiosResponse = { data, status, statusText: String(status), headers: {}, config, request: {} };

  if (status >= 400) {
    const err: any = new Error(`Request failed with status code ${status}`);
    err.response = response;
    err.config = config;
    err.isAxiosError = true;
    throw err;
  }
  return response;
};
