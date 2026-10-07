import Icon from '../components/Icon';
import { ReservationsView } from './AgentViews';

export function OwnerDashboardView({ context }) {
  const { AGENTS, CAL_START, GUESTS, INBOX_THREADS, RESERVATIONS, activeThreadGuest, agentById, agentListings, agentOwners, currentAgent, currentGuestClient, currentOwner, currentRole, dayIndex, fmtDate, go, guestById, listingById, listings, notices, openGuest, openGuestThread, openListing, openListingEditor, openReservation, ownerAgents, ownerById, ownerLabel, ownerListings, ownerReservations, pendingOwnerRequests = [], receivedNoticesForAgent, sendOwnerNotice, setActiveThreadGuest } = context;
  

    const owner = ownerById(currentOwner);
    const props = ownerListings;
    const avgOcc = Math.round(props.reduce((sum, l) => sum + parseInt(l.occ, 10), 0) / props.length);
    const paidTotal = ownerReservations.filter((r) => r.paidStatus === 'Paid').reduce((sum, r) => sum + r.paid, 0);
    const pending = ownerReservations.filter((r) => r.paidStatus !== 'Paid').reduce((sum, r) => sum + r.paid, 0);

    return (
      <div className="view active">
        <div className="greeting">
          <h1>Good morning, {owner?.name.split(' ')[0]}</h1>
          <div className="date">Here's how your portfolio is performing — statements are pulled straight from your agent's ledger.</div>
          <div className="quick-actions">
            <button className="btn btn-ghost" type="button" aria-describedby={pendingOwnerRequests.length ? 'owner-pending-reservations' : undefined} onClick={() => go('owner-reservations')}>
              View reservations{pendingOwnerRequests.length > 0 && <>
                <span className="nav-badge" aria-hidden="true">{pendingOwnerRequests.length}</span>
                <span className="sr-only" id="owner-pending-reservations">{pendingOwnerRequests.length} pending booking requests</span>
              </>}
            </button>
          </div>
        </div>
        <div className="kpi-row">
          <div className="card kpi"><div className="kpi-label">Your properties</div><div className="kpi-value mono-num">{props.length}</div></div>
          <div className="card kpi"><div className="kpi-label">Avg. occupancy</div><div className="kpi-value">{avgOcc}%</div></div>
          <div className="card kpi"><div className="kpi-label">Revenue collected</div><div className="kpi-value mono-num">${paidTotal.toLocaleString()}</div></div>
          <div className="card kpi"><div className="kpi-label">Pending payout</div><div className="kpi-value mono-num">${pending.toLocaleString()}</div></div>
        </div>
        <div className="attention">
          {pendingOwnerRequests.length > 0 && <button className="attn-item card owner-reservation-alert" type="button" onClick={() => go('owner-reservations')}>
            <span className="dot red" />
            <span className="attn-text"><b>{pendingOwnerRequests.length} guest request{pendingOwnerRequests.length === 1 ? '' : 's'} pending</b> — your agent has been notified and will review them.</span>
            <span className="attn-arrow">→</span>
          </button>}
        </div>
        <div className="attention">
          <div className="attention-head"><h2>Your properties</h2></div>
          <div className="card">
            {props.map((l) => (
              <div className="property-readonly" key={l.id}>
                <div><div style={{ fontWeight: 600, fontSize: '13.5px' }}>{l.name}</div><div className="readonly-note">{l.type}</div></div>
                <div style={{ textAlign: 'right' }}><div className="mono" style={{ fontWeight: 600 }}>{l.occ}</div><div className="readonly-note">occupancy</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  
}

export function OwnerListingsView({ context }) {
  const { AGENTS, CAL_START, GUESTS, INBOX_THREADS, RESERVATIONS, activeThreadGuest, agentById, agentListings, agentOwners, currentAgent, currentGuestClient, currentOwner, currentRole, dayIndex, fmtDate, go, guestById, listingById, listings, notices, openGuest, openGuestThread, openListing, openListingEditor, openReservation, ownerAgents, ownerById, ownerLabel, ownerListings, ownerReservations, receivedNoticesForAgent, sendOwnerNotice, setActiveThreadGuest } = context;
  

    return <div className="view active">
      <div className="page-head">
        <div><h1 className="page-title">Listings</h1><div className="page-sub">Post your buildings and apartments, and set the nightly price. Your agents see this catalogue as read-only.</div></div>
        <button className="btn btn-primary" type="button" onClick={() => openListingEditor()}>+ Add listing</button>
      </div>
      <div className="listing-grid">
        {ownerListings.map((l) => (
          <div className="card listing-card" key={l.id}>
            <button className="listing-photo" type="button" aria-label={`View listing ${l.name}`} onClick={() => openListing(l.id)} style={{ cursor: 'pointer' }}><Icon name="home2" /></button>
            <div className="listing-body">
              <button className="chip-link" type="button" onClick={() => openListing(l.id)} style={{ fontSize: '14.5px', fontWeight: 600, marginBottom: '2px' }}>{l.name}</button>
              <div className="listing-meta">{l.type} · managed by {agentById(l.agentId)?.name || '—'}</div>
              <div className="listing-stats">
                <span className="price-tag">${l.rate}/night</span>
                <button className="chip-link" type="button" onClick={() => openListingEditor(l.id)}><Icon name="link" />Edit listing</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>;
  
}

export function OwnerFinancialsView({ context }) {
  const { AGENTS, CAL_START, GUESTS, INBOX_THREADS, RESERVATIONS, activeThreadGuest, agentById, agentListings, agentOwners, currentAgent, currentGuestClient, currentOwner, currentRole, dayIndex, fmtDate, go, guestById, listingById, listings, notices, openGuest, openGuestThread, openListing, openListingEditor, openReservation, ownerAgents, ownerById, ownerLabel, ownerListings, ownerReservations, receivedNoticesForAgent, sendOwnerNotice, setActiveThreadGuest } = context;
  

    return <div className="view active">
      <div className="page-head"><div><h1 className="page-title">Financials</h1><div className="page-sub">Statements for your properties — the same reservation ledger your agent works from, filtered to you and locked to view-only.</div></div></div>
      <div className="card">
        <table>
          <thead><tr><th>Reservation</th><th>Property</th><th>Dates</th><th>Gross</th><th>Management fee (15%)</th><th>Net payout</th><th>Status</th></tr></thead>
          <tbody>
            {ownerReservations.slice().sort((a, b) => a.in.localeCompare(b.in)).map((r) => {
              const l = listingById(r.listing);
              const fee = Math.round(r.paid * 0.15);
              const net = r.paid - fee;
              return (
                <tr key={r.id}>
                  <td className="mono">{r.id}</td>
                  <td>{l.name}</td>
                  <td>{fmtDate(r.in)} → {fmtDate(r.out)}</td>
                  <td className="mono">${r.paid.toLocaleString()}</td>
                  <td className="mono">${fee.toLocaleString()}</td>
                  <td className="mono" style={{ fontWeight: 600 }}>${net.toLocaleString()}</td>
                  <td><span className={`pill ${r.paidStatus === 'Paid' ? 'pill-confirmed' : 'pill-pending'}`}>{r.paidStatus}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>;
  
}

export function OwnerReportsView({ context }) {
  const { AGENTS, CAL_START, GUESTS, INBOX_THREADS, RESERVATIONS, activeThreadGuest, agentById, agentListings, agentOwners, currentAgent, currentGuestClient, currentOwner, currentRole, dayIndex, fmtDate, go, guestById, listingById, listings, notices, openGuest, openGuestThread, openListing, openListingEditor, openReservation, ownerAgents, ownerById, ownerLabel, ownerListings, ownerReservations, receivedNoticesForAgent, sendOwnerNotice, setActiveThreadGuest } = context;
  

    return <div className="view active">
      <div className="page-head"><div><h1 className="page-title">Reports</h1><div className="page-sub">Occupancy performance across your properties.</div></div></div>
      <div className="card" style={{ padding: '20px' }}>
        {ownerListings.map((l) => (
          <div key={l.id} style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}><span style={{ fontWeight: 600 }}>{l.name}</span><span className="mono">{l.occ}</span></div>
            <div style={{ background: 'var(--line-soft)', borderRadius: '6px', height: '8px' }}><div style={{ width: l.occ, background: 'var(--blue)', height: '8px', borderRadius: '6px' }} /></div>
          </div>
        ))}
      </div>
    </div>;
  
}

export function OwnerNoticesView({ context }) {
  const { AGENTS, CAL_START, GUESTS, INBOX_THREADS, RESERVATIONS, activeThreadGuest, agentById, agentListings, agentOwners, currentAgent, currentGuestClient, currentOwner, currentRole, dayIndex, fmtDate, go, guestById, listingById, listings, notices, openGuest, openGuestThread, openListing, openListingEditor, openReservation, ownerAgents, ownerById, ownerLabel, ownerListings, ownerReservations, receivedNoticesForAgent, sendOwnerNotice, setActiveThreadGuest, noticeTarget, setNoticeTarget } = context;
  

    const sent = [...notices].filter((n) => n.ownerId === currentOwner).sort((a, b) => b.date.localeCompare(a.date));
    return (
      <div className="view active">
        <div className="page-head"><div><h1 className="page-title">Notices</h1><div className="page-sub">Send a note straight to the agents managing your properties.</div></div></div>
        <form className="card" style={{ padding: '16px 18px', marginBottom: '16px' }} onSubmit={sendOwnerNotice}>
          <div className="drawer-label" style={{ marginBottom: '8px' }}>New notice</div>
          <label className="sr-only" htmlFor="notice-target">Send notice to</label>
          <select className="role-select" id="notice-target" name="notice-target" value={noticeTarget} onChange={(event) => setNoticeTarget(event.target.value)} style={{ width: '100%', marginBottom: '8px' }}>
            <option value="all">All agents</option>
            {ownerAgents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <label className="sr-only" htmlFor="notice-text">Notice message</label>
          <textarea id="notice-text" name="notice-text" maxLength="2000" placeholder="Write your notice…" style={{ width: '100%', minHeight: '70px', border: '1px solid var(--line)', borderRadius: '8px', padding: '10px', fontFamily: 'inherit', fontSize: '13px', marginBottom: '8px', resize: 'vertical' }} />
          <button className="btn btn-primary" type="submit">Send notice</button>
        </form>
        <div className="card">
          {sent.length ? sent.map((n) => (
            <div className="property-readonly" key={n.id} style={{ alignItems: 'flex-start' }}>
              <div><div style={{ fontWeight: 600, fontSize: '13px' }}>To {n.agentId === 'all' ? 'All agents' : agentById(n.agentId)?.name}</div><div style={{ fontSize: '13px', marginTop: '3px' }}>{n.text}</div></div>
              <div className="readonly-note">{fmtDate(n.date)}</div>
            </div>
          )) : <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink-faint)' }}>No notices sent yet.</div>}
        </div>
      </div>
    );
  
}

export function OwnerAgentHubView({ context }) {
  const { AGENTS, CAL_START, GUESTS, INBOX_THREADS, RESERVATIONS, activeThreadGuest, agentById, agentListings, agentOwners, currentAgent, currentGuestClient, currentOwner, currentRole, dayIndex, fmtDate, go, guestById, listingById, listings, notices, openGuest, openGuestThread, openListing, openListingEditor, openReservation, ownerAgents, ownerById, ownerLabel, ownerListings, ownerReservations, receivedNoticesForAgent, sendOwnerNotice, setActiveThreadGuest, setNoticeTarget } = context;
  

    return (
      <div className="view active">
        <div className="page-head"><div><h1 className="page-title">Agent Hub</h1><div className="page-sub">The agents managing your properties — reach out if you need to pass along a message.</div></div></div>
        <div className="card">
          {ownerAgents.map((a) => {
            const managed = ownerListings.filter((l) => l.agentId === a.id).map((l) => l.name).join(', ');
            return (
              <div className="property-readonly" key={a.id}>
                <div><div style={{ fontWeight: 600, fontSize: '13.5px' }}>{a.name}</div><div className="readonly-note">{a.role} · manages {managed}</div></div>
                <button className="btn btn-ghost" type="button" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => {
                  setNoticeTarget(a.id);
                  go('owner-notices');
                }}>Message</button>
              </div>
            );
          })}
        </div>
      </div>
    );
  
}

export default function OwnerViews({ view, context }) {
  switch (view) {
    case 'owner-dashboard': return <OwnerDashboardView context={context} />;
    case 'owner-reservations': return <ReservationsView context={context} canDecide={false} />;
    case 'owner-listings': return <OwnerListingsView context={context} />;
    case 'owner-financials': return <OwnerFinancialsView context={context} />;
    case 'owner-reports': return <OwnerReportsView context={context} />;
    case 'owner-notices': return <OwnerNoticesView context={context} />;
    case 'owner-agent-hub': return <OwnerAgentHubView context={context} />;
    default: return null;
  }
}
