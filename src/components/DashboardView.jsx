export default function DashboardView({ openListingEditor, go, openGuest, openReservation, pendingRequests = [], guestById, listingById }) {
  return (
    <div className="view active">
      <div className="greeting">
        <h1>Good morning, Sam 👋</h1>
        <div className="date">Today · Thursday, Aug 20</div>
        <div className="quick-actions">
          <button className="btn btn-primary" type="button" onClick={() => openListingEditor()}>+ Add listing</button>
          <button className="btn btn-ghost" type="button" aria-describedby={pendingRequests.length ? 'dashboard-pending-reservations' : undefined} onClick={() => go('reservations')}>
            + Reservation{pendingRequests.length > 0 && <>
              <span className="nav-badge" aria-hidden="true">{pendingRequests.length}</span>
              <span className="sr-only" id="dashboard-pending-reservations">{pendingRequests.length} pending booking requests</span>
            </>}
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => go('inbox')}>Message guest</button>
        </div>
      </div>

      <div className="kpi-row">
        <div className="card kpi"><div className="kpi-label">Occupancy</div><div className="kpi-value">72%</div></div>
        <div className="card kpi"><div className="kpi-label">Arrivals today</div><div className="kpi-value mono-num">8</div></div>
        <div className="card kpi"><div className="kpi-label">Departures today</div><div className="kpi-value mono-num">6</div></div>
        <div className="card kpi"><div className="kpi-label">Unread messages</div><div className="kpi-value mono-num">12</div></div>
      </div>

      <div className="attention">
        <div className="attention-head"><h2>Needs your attention</h2></div>
        <div className="card">
          <button className="attn-item" type="button" onClick={() => go('tasks')}>
            <span className="dot red" />
            <span className="attn-text"><b>3 overdue cleaning tasks</b> — across Villa Lagos, Downtown Loft, Apartment 4</span>
            <span className="attn-arrow">→</span>
          </button>
          {pendingRequests.length > 0 && <button className="attn-item reservation-attn-item" type="button" onClick={() => go('reservations')}>
            <span className="dot red" />
            <span className="attn-text">
              <b>{pendingRequests.length} guest request{pendingRequests.length === 1 ? '' : 's'} need{pendingRequests.length === 1 ? 's' : ''} your attention</b>
              {' — '}
              {guestById?.(pendingRequests[0].guest)?.name || 'A guest'} requested {listingById?.(pendingRequests[0].listing)?.name || 'a listing'}
              {pendingRequests.length > 1 ? ` and ${pendingRequests.length - 1} more` : ''}.
            </span>
            <span className="attn-arrow">→</span>
          </button>}
          <button className="attn-item" type="button" onClick={() => go('inbox')}>
            <span className="dot amber" />
            <span className="attn-text"><b>2 guests awaiting a response</b> — Amara Obi, Elena Petrova</span>
            <span className="attn-arrow">→</span>
          </button>
          <button className="attn-item" type="button" onClick={() => go('listings')}>
            <span className="dot red" />
            <span className="attn-text"><b>1 channel sync error</b> — Beach House · Airbnb</span>
            <span className="attn-arrow">→</span>
          </button>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="mini-head">Arriving today</div>
          <div className="mini-row"><span>RES-10488 · <button className="chip-link" type="button" onClick={() => openGuest('G2')}>Michael Chen</button></span><span className="mono">Downtown Loft</span></div>
          <div className="mini-row"><span>RES-10491 · <button className="chip-link" type="button" onClick={() => openGuest('G4')}>Tom Becker</button></span><span className="mono">Garden Cottage</span></div>
        </div>
        <div className="card">
          <div className="mini-head">Channel health</div>
          <div className="mini-row"><span>Airbnb</span><span className="pill pill-confirmed">✓ Synced</span></div>
          <div className="mini-row"><span>Booking.com</span><span className="pill pill-confirmed">✓ Synced</span></div>
          <div className="mini-row"><span>Direct</span><span className="pill pill-cancelled">— n/a</span></div>
        </div>
      </div>
    </div>
  );
}
