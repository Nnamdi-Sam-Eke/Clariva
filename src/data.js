export const ICONS = {
  home: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  msg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  cal: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  book: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  home2: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  user: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
  check: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>',
  layers: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/></svg>',
  tag: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.6 12.6 12 21.2 2.8 12 4 4l8-1.2z"/><circle cx="8.5" cy="8.5" r="1.2"/></svg>',
  dollar: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  chart: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18M7 15l4-4 3 3 5-6"/></svg>',
  zap: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 3 14h8l-1 8 10-12h-8z"/></svg>',
  gear: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  link: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.5-1.5"/></svg>'
};

export const CAL_START = new Date('2026-08-20T00:00:00');
export const CAL_DAYS = 28;
export const PHOTO_TINTS = ['var(--teal-soft)', 'var(--clay-soft)', 'var(--blue-soft)', 'var(--success-soft)', 'var(--warning-soft)'];
export const CHANNEL_COLOR = { 'Booking.com': '#2C5F58', Airbnb: '#B9793F', Direct: '#3D6EA6' };

export const LISTINGS = [
  { id: 'L1', name: 'Villa Lagos', type: 'Villa · 4bd', occ: '81%', ownerId: 'O1', agentId: 'A1', rate: 220, photos: [{ type: 'placeholder', label: 'Exterior' }, { type: 'placeholder', label: 'Living room' }, { type: 'placeholder', label: 'Master bedroom' }] },
  { id: 'L2', name: 'Apartment 4', type: 'Apartment · 1bd', occ: '64%', ownerId: 'O2', agentId: 'A2', rate: 95, photos: [{ type: 'placeholder', label: 'Living room' }, { type: 'placeholder', label: 'Kitchen' }] },
  { id: 'L3', name: 'Beach House', type: 'House · 3bd', occ: '70%', ownerId: 'O3', agentId: 'A1', rate: 180, photos: [{ type: 'placeholder', label: 'Exterior' }, { type: 'placeholder', label: 'Beachfront view' }, { type: 'placeholder', label: 'Bedroom' }, { type: 'placeholder', label: 'Patio' }] },
  { id: 'L4', name: 'Downtown Loft', type: 'Loft · 2bd', occ: '75%', ownerId: 'O1', agentId: 'A2', rate: 130, photos: [{ type: 'placeholder', label: 'Living room' }, { type: 'placeholder', label: 'City view' }] },
  { id: 'L5', name: 'Garden Cottage', type: 'Cottage · 2bd', occ: '58%', ownerId: 'O3', agentId: 'A1', rate: 110, photos: [{ type: 'placeholder', label: 'Garden' }, { type: 'placeholder', label: 'Bedroom' }] },
];

export const OWNERS = [
  { id: 'O1', name: 'Adaeze Nwosu' },
  { id: 'O2', name: 'Chuka Eze' },
  { id: 'O3', name: 'Ngozi Bello' }
];

export const AGENTS = [
  { id: 'A1', name: 'Sam Adeyemi', role: 'Lead Agent' },
  { id: 'A2', name: 'Tolu Bankole', role: 'Field Agent' }
];

export const GUESTS = [
  { id: 'G1', name: 'Sarah Johnson', vip: true, stays: 8, notes: 'Prefers late check-in. Allergic to feather pillows.', contact: 'sarah.j@mail.com · +1 202 555 0148' },
  { id: 'G2', name: 'Michael Chen', vip: false, stays: 2, notes: 'First-time guest, asked good local coffee spots.', contact: 'm.chen@mail.com · +1 415 555 0110' },
  { id: 'G3', name: 'Amara Obi', vip: false, stays: 1, notes: '—', contact: 'amara.obi@mail.com · +234 803 555 0199' },
  { id: 'G4', name: 'Tom Becker', vip: false, stays: 4, notes: 'Regular business traveller, quiet room requested.', contact: 'tbecker@mail.com · +44 7700 900123' },
  { id: 'G5', name: 'Elena Petrova', vip: false, stays: 0, notes: 'New guest — first booking with us.', contact: 'elena.p@mail.com · +49 176 5550199' },
  { id: 'G6', name: 'James Okafor', vip: false, stays: 3, notes: 'Books Beach House every summer.', contact: 'j.okafor@mail.com · +234 701 555 0177' },
];

export const NOTICES = [
  { id: 'N1', ownerId: 'O1', agentId: 'A1', date: '2026-09-14', text: 'Please confirm the AC at Villa Lagos was serviced before the next guest arrives.' },
  { id: 'N2', ownerId: 'O1', agentId: 'A2', date: '2026-09-10', text: 'Payout schedule is moving from monthly to bi-weekly starting next month.' },
  { id: 'N3', ownerId: 'O3', agentId: 'A1', date: '2026-09-08', text: 'Great work on the last two Beach House reviews — thank you!' },
];

export const RESERVATIONS = [
  { id: 'RES-10482', guest: 'G1', listing: 'L1', in: '2026-08-21', out: '2026-08-25', channel: 'Booking.com', status: 'confirmed', paid: 1240, paidStatus: 'Paid', request: 'Late check-in requested (after 9pm).', tasks: [{ t: 'Pre-arrival inspection', done: true }, { t: 'Cleaning after checkout', done: false, overdue: true }] },
  { id: 'RES-10483', guest: 'G2', listing: 'L1', in: '2026-08-27', out: '2026-08-30', channel: 'Direct', status: 'confirmed', paid: 860, paidStatus: 'Paid', request: '—', tasks: [{ t: 'Welcome message', done: true }, { t: 'Check minibar restock', done: false }] },
  { id: 'RES-10484', guest: 'G3', listing: 'L2', in: '2026-08-22', out: '2026-08-27', channel: 'Airbnb', status: 'confirmed', paid: 590, paidStatus: 'Paid', request: 'Early arrival at 2pm if possible.', tasks: [{ t: 'Arrival guide', done: true }, { t: 'Key handoff', done: true }] },
  { id: 'RES-10485', guest: 'G4', listing: 'L3', in: '2026-08-24', out: '2026-08-29', channel: 'Booking.com', status: 'pending', paid: 600, paidStatus: 'Pending', request: 'Quiet room requested.', tasks: [{ t: 'Confirm parking', done: false }, { t: 'Send lock code', done: false }] },
  { id: 'RES-10486', guest: 'G5', listing: 'L4', in: '2026-08-25', out: '2026-08-27', channel: 'Airbnb', status: 'confirmed', paid: 260, paidStatus: 'Paid', request: 'No special requests.', tasks: [{ t: 'Upload policy info', done: true }] },
  { id: 'RES-10487', guest: 'G6', listing: 'L5', in: '2026-08-28', out: '2026-09-01', channel: 'Direct', status: 'confirmed', paid: 440, paidStatus: 'Paid', request: 'Late checkout requested.', tasks: [{ t: 'Prepare breakfast kit', done: false }] },
];

export const INBOX_THREADS = [
  { guest: 'G1', last: 'We’ll be arriving late; is it okay to check in after 9pm?', time: '2m ago', unread: 2 },
  { guest: 'G2', last: 'Is there a grocery delivery option nearby?', time: '14m ago', unread: 1 },
  { guest: 'G3', last: 'Thanks for the quick confirmation.', time: '1h ago', unread: 0 },
  { guest: 'G4', last: 'Could you recommend a quiet room configuration?', time: '4h ago', unread: 0 },
  { guest: 'G5', last: 'Looking forward to it!', time: 'Today', unread: 1 },
];

export const NAV_CONFIG = {
  agent: [
    { label: 'Core', items: [
      { view: 'dashboard', icon: 'home', text: 'Dashboard' },
      { view: 'inbox', icon: 'msg', text: 'Inbox', badge: 12 },
      { view: 'calendar', icon: 'cal', text: 'Calendar' },
      { view: 'reservations', icon: 'book', text: 'Reservations' },
      { view: 'listings', icon: 'home2', text: 'Listings' },
      { view: 'guests', icon: 'user', text: 'Guests' },
      { view: 'tasks', icon: 'check', text: 'Tasks', badge: 3 },
    ] },
    { label: 'Owners', items: [
      { view: 'agent-notices', icon: 'msg', text: 'Notices' },
      { view: 'agent-owner-hub', icon: 'user', text: 'Owner Hub' },
    ] },
    { label: 'Manage', items: [
      { view: 'stub', icon: 'layers', text: 'Channels' },
      { view: 'stub', icon: 'tag', text: 'Pricing' },
      { view: 'stub', icon: 'dollar', text: 'Financials' },
    ] },
    { label: 'Insights', items: [{ view: 'stub', icon: 'chart', text: 'Reports' }] },
    { label: 'Automate', items: [{ view: 'stub', icon: 'zap', text: 'Automations' }] },
    { label: 'System', items: [{ view: 'stub', icon: 'gear', text: 'Settings' }] },
  ],
  owner: [
    { label: 'Your Portfolio', items: [
      { view: 'owner-dashboard', icon: 'home', text: 'Dashboard' },
      { view: 'owner-listings', icon: 'home2', text: 'Listings' },
      { view: 'owner-calendar', icon: 'cal', text: 'Calendar' },
      { view: 'owner-reservations', icon: 'book', text: 'Reservations' },
      { view: 'owner-financials', icon: 'dollar', text: 'Financials' },
      { view: 'owner-reports', icon: 'chart', text: 'Reports' },
    ] },
    { label: 'Team', items: [
      { view: 'owner-notices', icon: 'msg', text: 'Notices' },
      { view: 'owner-agent-hub', icon: 'user', text: 'Agent Hub' },
    ] },
  ],
  client: [
    { label: 'Your Stay', items: [
      { view: 'client-booking', icon: 'home', text: 'My Stays' },
      { view: 'client-notifications', icon: 'msg', text: 'Notifications' },
      { view: 'client-calendar', icon: 'cal', text: 'Calendar' },
      { view: 'client-messages', icon: 'msg', text: 'Messages' },
      { view: 'client-explore', icon: 'home2', text: 'Explore Stays' },
    ] },
  ],
};

export const SEARCH_LABEL = {
  agent: 'Search reservations, guests, listings…',
  owner: 'Search your properties…',
  client: 'Search your booking…',
};

export const BRAND_TAG = { agent: 'Operator', owner: 'Owner Portal', client: 'Guest' };
