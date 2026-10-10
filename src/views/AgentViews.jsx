import { useRef, useState } from 'react';
import Icon from '../components/Icon';

export function ReservationsView({ context, canDecide = true }) {
  const {
    roleReservations = context.RESERVATIONS,
    fmtDate,
    guestById,
    listingById,
    openGuest,
    openReservation,
    pendingAgentRequests = [],
    handleReservationDecision,
    handleClientActionDecision,
  } = context;
  const [busyId, setBusyId] = useState('');
  const reservations = roleReservations;
  const pendingCount = pendingAgentRequests.length;

  const decide = async (reservationId, decision) => {
    setBusyId(reservationId);
    try {
      await handleReservationDecision(reservationId, decision);
    } finally {
      setBusyId('');
    }
  };

  const reviewClientAction = async (reservationId, decision) => {
    setBusyId(reservationId);
    try {
      handleClientActionDecision(reservationId, decision);
    } finally {
      setBusyId('');
    }
  };

    return (
      <div className="view active">
        <div className="page-head">
          <div><h1 className="page-title">Reservations</h1><div className="page-sub">{canDecide ? 'Upcoming and in-flight stays across your listings.' : 'Reservation activity for your properties; your agent manages decisions.'}{pendingCount > 0 && canDecide ? ` ${pendingCount} booking request${pendingCount === 1 ? '' : 's'} need${pendingCount === 1 ? 's' : ''} your decision.` : ''}</div></div>
        </div>
        <div className="card table-card">
          <table>
            <thead>
              <tr>
                <th>Reservation</th>
                <th>Guest</th>
                <th>Property</th>
                <th>Dates</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Paid</th>
                {canDecide && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => {
                const g = guestById(r.guest);
                const l = listingById(r.listing);
                const isBookingRequest = canDecide && r.dateReserved && r.status === 'pending';
                const isClientAction = canDecide && r.clientAction?.status === 'pending';
                return (
                  <tr key={r.id}>
                    <td className="mono">{r.id}</td>
                    <td>{r.offlineBooking ? <span>{r.offlineGuestName || 'Offline guest'} <span className="readonly-note">· Offline</span></span> : g ? <button className="chip-link" type="button" onClick={() => openGuest(g.id)}>{g.name}</button> : 'Guest'}</td>
                    <td>{l?.name || 'Listing'}</td>
                    <td>{fmtDate(r.in)} → {fmtDate(r.out)}</td>
                    <td>{r.channel}</td>
                    <td><span className={`pill pill-${r.status}`}>{r.status === 'confirmed' ? '✓ Confirmed' : r.status === 'pending' ? 'Pending' : r.status === 'rejected' ? 'Rejected' : 'Cancelled'}</span></td>
                    <td><button className="chip-link" type="button" onClick={() => openReservation(r.id)}>$ {r.paid.toLocaleString()}</button></td>
                    {canDecide && <td>
                      {isBookingRequest
                        ? <div className="reservation-actions">
                          <button className="btn btn-primary" type="button" disabled={busyId === r.id} onClick={() => decide(r.id, 'confirmed')}>{busyId === r.id ? 'Saving…' : 'Accept'}</button>
                          <button className="btn btn-ghost" type="button" disabled={busyId === r.id} onClick={() => decide(r.id, 'rejected')}>Reject</button>
                        </div>
                        : isClientAction
                          ? <div className="reservation-action-review">
                            <span>{r.clientAction.type === 'cancellation'
                              ? 'Cancellation requested'
                              : `Change to ${fmtDate(r.clientAction.in)} → ${fmtDate(r.clientAction.out)}`}</span>
                            <div className="reservation-actions">
                              <button className="btn btn-primary" type="button" disabled={busyId === r.id} onClick={() => reviewClientAction(r.id, 'approved')}>
                                {busyId === r.id ? 'Saving…' : r.clientAction.type === 'cancellation' ? 'Approve cancellation' : 'Approve date change'}
                              </button>
                              <button className="btn btn-ghost" type="button" disabled={busyId === r.id} onClick={() => reviewClientAction(r.id, 'rejected')}>Reject request</button>
                            </div>
                          </div>
                          : <span className="readonly-note">—</span>}
                    </td>}
                  </tr>
                );
              })}
              {reservations.length === 0 && <tr><td colSpan={canDecide ? 8 : 7} className="readonly-note">No reservations for these properties yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  
}

export function ListingsView({ context }) {
  const { AGENTS, CAL_START, GUESTS, INBOX_THREADS, RESERVATIONS, activeThreadGuest, agentById, agentListings, agentOwners, currentAgent, currentGuestClient, currentOwner, currentRole, dayIndex, fmtDate, go, guestById, listingById, listings, notices, openGuest, openGuestThread, openListing, openListingEditor, openReservation, ownerAgents, ownerById, ownerLabel, ownerListings, ownerReservations, receivedNoticesForAgent, sendOwnerNotice, setActiveThreadGuest } = context;
  

    return (
      <div className="view active">
        <div className="page-head">
          <div><h1 className="page-title">Listings</h1><div className="page-sub">The catalogue of homes and apartments your team manages.</div></div>
        </div>
        <div className="listing-grid">
          {listings.map((l) => {
            const count = RESERVATIONS.filter((r) => r.listing === l.id).length;
            return (
              <div key={l.id} className="card listing-card">
                <button className="listing-photo" type="button" aria-label={`View listing ${l.name}`} onClick={() => openListing(l.id)} style={{ cursor: 'pointer' }}><Icon name="home2" /></button>
                <div className="listing-body">
                  <button className="chip-link" type="button" onClick={() => openListing(l.id)} style={{ fontSize: '14.5px', fontWeight: 600, marginBottom: '2px' }}>{l.name}</button>
                  <div className="listing-meta">{l.type} · posted by {ownerLabel(l)} · ${l.rate}/night</div>
                  <div className="listing-stats">
                    <span>Occupancy <b>{l.occ}</b></span>
                    {(!l.ownerId && l.agentId === currentAgent) ? (
                      <button className="chip-link" type="button" onClick={() => openListingEditor(l.id)}><Icon name="link" />Edit listing</button>
                    ) : (
                      <button className="chip-link" type="button" onClick={() => go('calendar')}>{count} bookings →</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  
}

export function GuestsView({ context }) {
  const { AGENTS, CAL_START, GUESTS, INBOX_THREADS, RESERVATIONS, activeThreadGuest, agentById, agentListings, agentOwners, currentAgent, currentGuestClient, currentOwner, currentRole, dayIndex, fmtDate, go, guestById, listingById, listings, notices, openGuest, openGuestThread, openListing, openListingEditor, openReservation, ownerAgents, ownerById, ownerLabel, ownerListings, ownerReservations, receivedNoticesForAgent, sendOwnerNotice, setActiveThreadGuest } = context;
  

    return (
      <div className="view active">
        <div className="page-head"><div><h1 className="page-title">Guests</h1><div className="page-sub">Familiar names, travel patterns and record of stays.</div></div></div>
        <div className="card table-card">
          <table>
            <thead><tr><th>Guest</th><th>Status</th><th>Stays</th><th>Current booking</th><th>Contact</th></tr></thead>
            <tbody>
              {GUESTS.map((g) => {
                const current = RESERVATIONS.find((r) => r.guest === g.id && new Date(`${r.out}T00:00:00`) >= CAL_START);
                return (
                  <tr key={g.id}>
                    <td>
                      <div className="guest-cell">
                        <div className="guest-dot">{g.name.split(' ').map((w) => w[0]).join('')}</div>
                        <button className="chip-link" type="button" onClick={() => openGuest(g.id)}>{g.name}</button>
                      </div>
                    </td>
                    <td>{g.vip ? <span className="pill pill-vip">VIP</span> : <span className="pill pill-cancelled">Standard</span>}</td>
                    <td>{g.stays}</td>
                    <td>{current ? <button className="chip-link" type="button" onClick={() => openReservation(current.id)}>{listingById(current.listing).name}</button> : '—'}</td>
                    <td className="mono" style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>{g.contact}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  
}

export function TasksView({ context }) {
  const {
    RESERVATIONS, guestById, listingById, toggleTask, assignTask, FIELD_STAFF = [],
    dispatchFieldMessage, agentListings, listings, requestBrowserNotifyPermission, openWhatsAppLast,
  } = context;
  const [filter, setFilter] = useState('all');
  const [sendOpen, setSendOpen] = useState(true);
  const [staffId, setStaffId] = useState('F1');
  const [listingId, setListingId] = useState('');
  const [text, setText] = useState('');
  const [lastSent, setLastSent] = useState('');
  const [error, setError] = useState('');

  const staffName = (id) => FIELD_STAFF.find((f) => f.id === id)?.name || id;
  const homes = (agentListings?.length ? agentListings : listings) || [];

  const rows = [];
  (RESERVATIONS || []).forEach((r) => {
    (r.tasks || []).forEach((task, taskIndex) => {
      rows.push({
        ...task,
        resId: r.id,
        taskIndex,
        listing: listingById(r.listing)?.name,
        guest: guestById(r.guest)?.name,
      });
    });
  });

  const filtered = rows.filter((t) => {
    if (filter === 'open') return !t.done;
    if (filter === 'done') return t.done;
    if (filter === 'field') return Boolean(t.assignee);
    if (filter === 'overdue') return t.overdue && !t.done;
    return true;
  });

  const handleSendClick = () => {
    setError('');
    const body = text.trim();
    if (!body) {
      setError('Type a message first.');
      return;
    }
    if (typeof dispatchFieldMessage !== 'function') {
      setError('Send is not connected. Re-copy App.jsx from the update zip.');
      return;
    }
    const ok = dispatchFieldMessage({
      toStaffId: staffId,
      listingId: listingId || null,
      text: body,
    });
    if (ok === false) {
      setError('Could not send. Try again.');
      return;
    }
    const who = staffId === 'all' ? 'everyone on-site' : staffName(staffId);
    setLastSent(`Sent to ${who}: “${body}” — open On-site → Inbox to read it.`);
    setText('');
  };

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1 className="page-title">Tasks</h1>
          <div className="page-sub">Jobs for bookings. Message the on-site team from here.</div>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => setSendOpen((v) => !v)}>
          {sendOpen ? 'Hide message box' : 'Message on-site team'}
        </button>
      </div>

      {sendOpen && (
        <div className="card" style={{ padding: 16, marginBottom: 16, border: '1px solid var(--teal)' }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Message the on-site team</div>
          <div className="readonly-note" style={{ marginBottom: 10 }}>
            This goes to their Inbox. Switch role to <b>On-site</b> to see it.
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            <select className="role-select" value={staffId} onChange={(e) => setStaffId(e.target.value)} style={{ width: '100%' }}>
              <option value="F1">Bisi Okonkwo · Cleaner</option>
              <option value="F2">Ibrahim Musa · Repairs</option>
              <option value="F3">Chioma Eze · Cleaner</option>
              <option value="all">Everyone on-site</option>
            </select>
            <select className="role-select" value={listingId} onChange={(e) => setListingId(e.target.value)} style={{ width: '100%' }}>
              <option value="">No home selected</option>
              {homes.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
              placeholder="e.g. Please turn over Villa Lagos before 3pm"
              style={{ width: '100%', minHeight: 70, border: '1px solid var(--line)', borderRadius: 8, padding: 10, fontFamily: 'inherit', fontSize: 13, resize: 'vertical' }}
            />
            {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
            {lastSent && (
              <div style={{ background: 'var(--success-soft)', border: '1px solid var(--success)', borderRadius: 8, padding: 10, fontSize: 13, color: 'var(--ink)' }}>
                {lastSent}
              </div>
            )}
            <button type="button" className="btn btn-primary" onClick={handleSendClick}>
              Send to on-site team
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {[
          { id: 'all', label: 'All' },
          { id: 'open', label: 'Open' },
          { id: 'overdue', label: 'Overdue' },
          { id: 'field', label: 'On-site' },
          { id: 'done', label: 'Done' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            style={{
              border: '1px solid var(--line)',
              borderRadius: 999,
              padding: '6px 12px',
              background: filter === f.id ? 'var(--teal)' : 'var(--surface)',
              color: filter === f.id ? '#fff' : 'var(--ink-soft)',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="card task-list">
        {filtered.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink-faint)' }}>No tasks here.</div>
        )}
        {filtered.map((t, idx) => (
          <div className="task-row" key={`${t.resId}-${t.taskIndex}-${idx}`}>
            <button
              className={`task-check ${t.done ? 'done' : ''}`}
              type="button"
              onClick={() => toggleTask(t.resId, t.taskIndex)}
              aria-label={t.done ? 'Mark incomplete' : 'Mark complete'}
            />
            <div className="task-body">
              <div className="task-title">
                {t.t}
                {t.overdue && !t.done && <span style={{ color: 'var(--danger)', marginLeft: 6, fontSize: 11 }}>Overdue</span>}
                {t.kind === 'maintenance' && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--danger)' }}>Repair</span>}
              </div>
              <div className="task-meta">
                {t.listing} · {t.guest} · {t.resId}
                {t.completionNote ? ` · Note: ${t.completionNote}` : ''}
              </div>
              {!t.done && (
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <label className="readonly-note" style={{ margin: 0 }}>Assign to</label>
                  <select
                    className="role-select"
                    value={t.assignee || ''}
                    onChange={(e) => assignTask?.(t.resId, t.taskIndex, e.target.value)}
                    style={{ minWidth: 160, fontSize: 12, padding: '4px 8px' }}
                  >
                    <option value="">Unassigned</option>
                    {(FIELD_STAFF || []).map((f) => (
                      <option key={f.id} value={f.id}>{f.name} · {f.role}</option>
                    ))}
                  </select>
                </div>
              )}
              {t.done && t.assignee && (
                <div className="readonly-note" style={{ marginTop: 4 }}>Done by {staffName(t.assignee)}</div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button type="button" className="btn btn-ghost" onClick={() => requestBrowserNotifyPermission?.()}>
          Enable desktop alerts
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => openWhatsAppLast?.()}>
          Open last WhatsApp alert
        </button>
      </div>
    </div>
  );
}

export function AgentNoticesView({ context }) {
  const { AGENTS, CAL_START, GUESTS, INBOX_THREADS, RESERVATIONS, activeThreadGuest, agentById, agentListings, agentOwners, currentAgent, currentGuestClient, currentOwner, currentRole, dayIndex, fmtDate, go, guestById, listingById, listings, notices, openGuest, openGuestThread, openListing, openListingEditor, openReservation, ownerAgents, ownerById, ownerLabel, ownerListings, ownerReservations, receivedNoticesForAgent, sendOwnerNotice, setActiveThreadGuest } = context;
  

    const received = [...receivedNoticesForAgent].sort((a, b) => b.date.localeCompare(a.date));
    return (
      <div className="view active">
        <div className="page-head"><div><h1 className="page-title">Notices</h1><div className="page-sub">Notes from owners of homes you manage.</div></div></div>
        <div className="card">
          {received.length ? received.map((n) => (
            <div className="property-readonly" key={n.id} style={{ alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>
                  {ownerById(n.ownerId)?.name}
                  {n.agentId === 'all' ? ' · to all agents' : ''}
                  {n.requestType && n.requestType !== 'general' ? ` · ${n.requestType.replace('_', ' ')}` : ''}
                  {n.routedToField ? ' · also sent on-site' : ''}
                </div>
                <div style={{ fontSize: '13px', marginTop: '3px' }}>{n.text}</div>
              </div>
              <div className="readonly-note">{fmtDate(n.date)}</div>
            </div>
          )) : <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink-faint)' }}>No notices yet.</div>}
        </div>
      </div>
    );
  
}

export function AgentOwnerHubView({ context }) {
  const { agentListings, agentOwners, go } = context;
  return (
      <div className="view active">
        <div className="page-head"><div><h1 className="page-title">Owner Hub</h1><div className="page-sub">Owners of homes you manage.</div></div></div>
        <div className="card">
          {agentOwners.map((o) => {
            const managed = agentListings.filter((l) => l.ownerId === o.id).map((l) => l.name).join(', ');
            return (
              <div className="property-readonly" key={o.id}>
                <div><div style={{ fontWeight: 600, fontSize: '13.5px' }}>{o.name}</div><div className="readonly-note">You manage {managed}</div></div>
                <button className="btn btn-ghost" type="button" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => go('agent-notices')}>View notices</button>
              </div>
            );
          })}
        </div>
        <FieldDispatchCard context={context} />
      </div>
    );
}

function FieldDispatchCard({ context }) {
  const { dispatchFieldMessage, agentListings, listings } = context;
  const [staffId, setStaffId] = useState('F1');
  const [listingId, setListingId] = useState(agentListings[0]?.id || '');
  const [text, setText] = useState('');
  const [justSent, setJustSent] = useState(false);
  const onDispatch = (e) => {
    e.preventDefault();
    if (!text.trim() || typeof dispatchFieldMessage !== 'function') return;
    const ok = dispatchFieldMessage({ toStaffId: staffId, listingId: listingId || null, text: text.trim() });
    if (ok !== false) {
      setText('');
      setJustSent(true);
      window.setTimeout(() => setJustSent(false), 1500);
    }
  };
  return (
    <div className="card" style={{ marginTop: 16, padding: 16 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Message on-site team</div>
      <div className="readonly-note" style={{ marginBottom: 10 }}>They will see this in their Inbox right away.</div>
      <form onSubmit={onDispatch} style={{ display: 'grid', gap: 8 }}>
        <select className="role-select" value={staffId} onChange={(e) => setStaffId(e.target.value)} style={{ width: '100%' }}>
          <option value="F1">Bisi Okonkwo · Lead Cleaner</option>
          <option value="F2">Ibrahim Musa · Maintenance</option>
          <option value="F3">Chioma Eze · Cleaner</option>
          <option value="all">Everyone on-site</option>
        </select>
        <select className="role-select" value={listingId} onChange={(e) => setListingId(e.target.value)} style={{ width: '100%' }}>
          <option value="">No property</option>
          {(agentListings.length ? agentListings : listings || []).map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={1000}
          placeholder="e.g. Priority turnover at Villa Lagos before 3pm arrival"
          style={{ width: '100%', minHeight: 70, border: '1px solid var(--line)', borderRadius: 8, padding: 10, fontFamily: 'inherit', fontSize: 13, resize: 'vertical' }} />
        <button className="btn btn-primary" type="submit" disabled={!text.trim()}>
          {justSent ? 'Sent!' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export function InboxView({ context }) {
  const { AGENTS, CAL_START, GUESTS, INBOX_THREADS, RESERVATIONS, activeThreadGuest, agentById, agentListings, agentOwners, currentAgent, currentGuestClient, currentOwner, currentRole, dayIndex, fmtDate, go, guestById, listingById, listings, notices, openGuest, openGuestThread, openListing, openListingEditor, openReservation, ownerAgents, ownerById, ownerLabel, ownerListings, ownerReservations, receivedNoticesForAgent, sendOwnerNotice, setActiveThreadGuest, conversations, sendMessage, openThread } = context;
  const guestId = context.activeThreadGuest;
  const replyInput = useRef(null);

    const selectedGuest = guestById(guestId) || guestById('G1');
    const messages = conversations.find((conversation) => conversation.guest === guestId)?.messages || [];
    const handleSubmit = (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const message = new FormData(form).get('message');
      if (sendMessage(guestId, String(message || ''))) form.reset();
    };

    return (
      <div className="view active">
        <div className="page-head"><div><h1 className="page-title">Inbox</h1><div className="page-sub">Guest messages and reply history.</div></div></div>
        <div className="inbox-layout">
          <div className="thread-list" id="thread-list">
            {INBOX_THREADS.map((t) => {
              const g = guestById(t.guest);
              return (
                <button key={t.guest} className={`thread-item ${t.guest === guestId ? 'active' : ''}`} type="button" aria-current={t.guest === guestId ? 'true' : undefined} onClick={() => openThread(t.guest)}>
                  <div className="thread-top"><span>{g.name}{g.vip ? ' · VIP' : ''}</span><span className="time">{t.time}</span></div>
                  <div className="thread-preview">{t.last}</div>
                  {t.unread > 0 && <span className="unread-badge">{t.unread}</span>}
                </button>
              );
            })}
          </div>
          <div className="thread-view" id="thread-view">
            <div className="thread-header">
              <button className="chip-link" type="button" style={{ fontSize: '14px' }} onClick={() => openGuest(selectedGuest.id)}><Icon name="link" />{selectedGuest.name}</button>
              {selectedGuest.vip && <span className="pill pill-vip">VIP</span>}
              <span style={{ marginLeft: 'auto' }} className="sync-pill"><span className="sync-dot" />Synced 2m ago</span>
            </div>
            <div className="thread-messages" aria-live="polite">
              {messages.map((message) => (
                <div className={`msg ${message.sender === 'agent' ? 'host' : 'guest'}`} key={message.id}>{message.text}</div>
              ))}
            </div>
            <form className="composer" onSubmit={handleSubmit}>
              <input ref={replyInput} type="text" name="message" aria-label="Write a reply" placeholder="Write a reply…" maxLength="2000" />
              <button
                className="suggest-btn"
                type="button"
                onClick={() => {
                  const input = replyInput.current;
                  if (input) {
                    input.value = `Hi ${selectedGuest.name.split(' ')[0]}, check-in is from 3pm. Let me know if you need anything else.`;
                    input.focus();
                  }
                }}
              >✨ Suggest reply</button>
              <button className="btn btn-primary" type="submit">Send</button>
            </form>
          </div>
        </div>
      </div>
    );
  
}


export function AgentFieldRepliesView({ context }) {
  const {
    fieldMessagesAll = [],
    FIELD_STAFF = [],
    listingById,
    go,
    requestBrowserNotifyPermission,
    openWhatsAppLast,
  } = context;

  const staffName = (id) => FIELD_STAFF.find((f) => f.id === id)?.name || id;

  const withReplies = [...fieldMessagesAll]
    .filter((m) => (m.replies || []).length > 0)
    .sort((a, b) => {
      const aAt = a.replies[a.replies.length - 1]?.at || a.at;
      const bAt = b.replies[b.replies.length - 1]?.at || b.at;
      return bAt.localeCompare(aAt);
    });

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1 className="page-title">On-site replies</h1>
          <div className="page-sub">
            When cleaners or repairs reply to your messages, they show up here in one place.
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-ghost" onClick={() => requestBrowserNotifyPermission?.()}>Enable desktop alerts</button>
        <button type="button" className="btn btn-ghost" onClick={() => openWhatsAppLast?.()}>Open last WhatsApp alert</button>
        <button type="button" className="btn btn-ghost" onClick={() => go('tasks')}>Assign jobs</button>
      </div>
      <div className="card">
        {withReplies.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-faint)' }}>
            No replies yet. Message someone under Tasks, then have them reply from On-site → Inbox.
          </div>
        )}
        {withReplies.map((m) => {
          const listing = m.listingId ? listingById(m.listingId) : null;
          const toName = m.toStaffId === 'all' ? 'Everyone on-site' : staffName(m.toStaffId);
          return (
            <div key={m.id} className="property-readonly" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 8 }}>
              <div style={{ width: '100%' }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  You → {toName}
                  {listing ? ` · ${listing.name}` : ''}
                </div>
                <div style={{ fontSize: 13, marginTop: 4 }}>{m.text}</div>
                <div className="readonly-note">{new Date(m.at).toLocaleString()}</div>
              </div>
              <div style={{ width: '100%', background: 'var(--paper)', borderRadius: 8, padding: 10 }}>
                {(m.replies || []).map((r) => (
                  <div key={r.id} style={{ marginBottom: 8 }}>
                    <b>{r.fromName || 'On-site'}</b>
                    <span className="readonly-note"> · {new Date(r.at).toLocaleString()}</span>
                    <div style={{ fontSize: 13, marginTop: 2 }}>{r.text}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AgentViews({ view, context }) {
  switch (view) {
    case 'reservations': return <ReservationsView context={context} />;
    case 'listings': return <ListingsView context={context} />;
    case 'guests': return <GuestsView context={context} />;
    case 'tasks': return <TasksView context={context} />;
    case 'agent-notices': return <AgentNoticesView context={context} />;
    case 'agent-field-replies': return <AgentFieldRepliesView context={context} />;
    case 'agent-owner-hub': return <AgentOwnerHubView context={context} />;
    case 'inbox': return <InboxView context={context} />;
    default: return null;
  }
}
