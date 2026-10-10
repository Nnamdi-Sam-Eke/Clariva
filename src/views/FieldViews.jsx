import { useState } from 'react';
import Icon from '../components/Icon';
import { CAL_DAYS } from '../data';

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatRange(start, days) {
  const end = addDays(start, days - 1);
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return `${start.toLocaleDateString('en-US', options)} – ${end.toLocaleDateString('en-US', options)}`;
}

/** Home: today's jobs + unread alerts in one place */
function FieldTodayView({ context }) {
  const {
    currentStaffMember,
    fieldTasks = [],
    fieldMessages = [],
    completeFieldTask,
    markFieldMessageRead,
    listingById,
    guestById,
    fmtDate,
    go,
  } = context;
  const [filter, setFilter] = useState('open');
  const [busyKey, setBusyKey] = useState('');
  const [noteDraft, setNoteDraft] = useState({});

  const staff = currentStaffMember;
  const filtered = fieldTasks.filter((t) => {
    if (filter === 'open') return !t.done;
    if (filter === 'done') return t.done;
    if (filter === 'overdue') return t.overdue && !t.done;
    return true;
  });

  const openCount = fieldTasks.filter((t) => !t.done).length;
  const overdueCount = fieldTasks.filter((t) => t.overdue && !t.done).length;
  const unread = [...fieldMessages].filter((m) => !m.read).sort((a, b) => b.at.localeCompare(a.at));

  const onComplete = async (task) => {
    const key = `${task.resId}-${task.taskIndex}`;
    setBusyKey(key);
    try {
      await completeFieldTask(task.resId, task.taskIndex, noteDraft[key] || '');
      setNoteDraft((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } finally {
      setBusyKey('');
    }
  };

  return (
    <div className="view active field-view">
      <div className="field-hero">
        <div className="field-greeting">
          <h1>Hi, {staff?.name?.split(' ')[0] || 'there'}</h1>
          <div className="field-role-line">
            {openCount === 0
              ? 'No open jobs — you are clear.'
              : `${openCount} open job${openCount === 1 ? '' : 's'}${overdueCount ? ` · ${overdueCount} overdue` : ''}`}
          </div>
        </div>
      </div>

      {/* Unread alerts on home so they are not buried */}
      {unread.length > 0 && (
        <section className="field-home-alerts" style={{ marginBottom: 18 }}>
          <div className="field-section-label">New for you</div>
          <div className="field-msg-list">
            {unread.slice(0, 3).map((msg) => {
              const listing = msg.listingId ? listingById(msg.listingId) : null;
              const isMaint = msg.type === 'maintenance-alert';
              return (
                <article
                  key={msg.id}
                  className={`field-msg-card is-unread ${isMaint ? 'from-maintenance' : msg.fromRole === 'owner' ? 'from-owner' : 'from-agent'}`}
                  onClick={() => markFieldMessageRead(msg.id)}
                >
                  <div className="field-msg-top">
                    <span className="field-msg-from">
                      {isMaint ? 'Blocked dates' : msg.fromName}
                      <span className="field-msg-role">
                        {' '}· {isMaint ? 'schedule update' : msg.fromRole === 'owner' ? 'owner' : 'office'}
                      </span>
                    </span>
                    <span className="field-msg-time">
                      {new Date(msg.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {listing && <div className="field-msg-listing"><Icon name="home2" /> {listing.name}</div>}
                  <p className="field-msg-text">{msg.text}</p>
                  <div className="readonly-note">Tap to mark as read</div>
                </article>
              );
            })}
          </div>
          {unread.length > 3 && (
            <button type="button" className="btn btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => go('field-messages')}>
              See all {unread.length} in Inbox
            </button>
          )}
        </section>
      )}

      <div className="field-section-label" style={{ marginBottom: 10 }}>Your jobs</div>
      <div className="field-filter-pills" style={{ marginBottom: 12 }}>
        {[
          { id: 'open', label: 'Open' },
          { id: 'overdue', label: 'Overdue' },
          { id: 'done', label: 'Done' },
          { id: 'all', label: 'All' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            className={`field-pill ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="field-task-list">
        {filtered.length === 0 && (
          <div className="field-empty">Nothing in this list.</div>
        )}
        {filtered.map((task) => {
          const key = `${task.resId}-${task.taskIndex}`;
          const listing = listingById(task.listingId);
          const guest = guestById(task.guestId);
          return (
            <article
              className={`field-task-card ${task.overdue && !task.done ? 'is-overdue' : ''} ${task.done ? 'is-done' : ''}`}
              key={key}
            >
              <div className="field-task-top">
                <span className={`field-kind ${task.kind || 'cleaning'}`}>
                  {task.kind === 'maintenance' ? 'Repair' : 'Clean'}
                </span>
                {task.overdue && !task.done && <span className="field-overdue-tag">Overdue</span>}
                {task.done && <span className="field-done-tag">Done</span>}
              </div>
              <h2 className="field-task-title">{task.t}</h2>
              <div className="field-task-meta">
                <div><Icon name="home2" /> {listing?.name || 'Home'}</div>
                {guest && <div><Icon name="user" /> Guest: {guest.name}</div>}
                {task.dueDate && <div><Icon name="cal" /> Due {fmtDate(task.dueDate)}</div>}
              </div>
              {task.accessCode && !task.done && (
                <div className="field-access">
                  <span className="field-access-label">Door code</span>
                  <span className="field-access-code mono">{task.accessCode}</span>
                </div>
              )}
              {task.notes && <div className="field-notes">{task.notes}</div>}
              {!task.done && (
                <div className="field-complete-block">
                  <input
                    className="field-note-input"
                    type="text"
                    placeholder="Optional note (e.g. towels restocked)"
                    value={noteDraft[key] || ''}
                    onChange={(e) => setNoteDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                    maxLength={300}
                  />
                  <button
                    type="button"
                    className="btn btn-primary field-complete-btn"
                    disabled={busyKey === key}
                    onClick={() => onComplete(task)}
                  >
                    {busyKey === key ? 'Saving…' : 'Mark done'}
                  </button>
                </div>
              )}
              {task.done && task.completionNote && (
                <div className="field-notes">Note: {task.completionNote}</div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function FieldMessagesView({ context }) {
  const {
    fieldMessages = [],
    markFieldMessageRead,
    replyFieldMessage,
    listingById,
    currentStaffMember,
  } = context;
  const [replyDraft, setReplyDraft] = useState({});
  const [busyId, setBusyId] = useState('');

  const sorted = [...fieldMessages].sort((a, b) => b.at.localeCompare(a.at));
  const unread = sorted.filter((m) => !m.read).length;

  const onReply = async (msgId) => {
    const text = (replyDraft[msgId] || '').trim();
    if (!text) return;
    setBusyId(msgId);
    try {
      replyFieldMessage(msgId, text);
      setReplyDraft((prev) => {
        const next = { ...prev };
        delete next[msgId];
        return next;
      });
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="view active field-view">
      <div className="page-head">
        <div>
          <h1 className="page-title">Inbox</h1>
          <div className="page-sub">
            Messages from the office and owners.
            {unread > 0 ? ` ${unread} unread.` : ''}
          </div>
        </div>
      </div>
      <div className="field-msg-list">
        {sorted.length === 0 && <div className="field-empty">No messages yet.</div>}
        {sorted.map((msg) => {
          const listing = msg.listingId ? listingById(msg.listingId) : null;
          const isMaint = msg.type === 'maintenance-alert';
          return (
            <article
              key={msg.id}
              className={`field-msg-card ${msg.read ? '' : 'is-unread'} ${isMaint ? 'from-maintenance' : msg.fromRole === 'owner' ? 'from-owner' : 'from-agent'}`}
              onClick={() => { if (!msg.read) markFieldMessageRead(msg.id); }}
            >
              <div className="field-msg-top">
                <span className="field-msg-from">
                  {isMaint ? 'Blocked dates' : msg.fromName}
                  <span className="field-msg-role">
                    {' '}· {isMaint ? 'schedule update' : msg.fromRole === 'owner' ? 'owner' : msg.type === 'broadcast' ? 'everyone' : 'office'}
                  </span>
                </span>
                <span className="field-msg-time">
                  {new Date(msg.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {listing && <div className="field-msg-listing"><Icon name="home2" /> {listing.name}</div>}
              <p className="field-msg-text">{msg.text}</p>
              {msg.replies?.length > 0 && (
                <div className="field-msg-replies">
                  {msg.replies.map((r) => (
                    <div key={r.id} className="field-msg-reply">
                      <b>{r.fromName || currentStaffMember?.name}</b>: {r.text}
                    </div>
                  ))}
                </div>
              )}
              {!isMaint && (
                <div className="field-msg-reply-row" onClick={(e) => e.stopPropagation()}>
                  <input
                    className="field-note-input"
                    type="text"
                    placeholder="Reply…"
                    value={replyDraft[msg.id] || ''}
                    onChange={(e) => setReplyDraft((prev) => ({ ...prev, [msg.id]: e.target.value }))}
                    maxLength={500}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: '8px 12px', fontSize: 13 }}
                    disabled={busyId === msg.id || !(replyDraft[msg.id] || '').trim()}
                    onClick={() => onReply(msg.id)}
                  >
                    {busyId === msg.id ? '…' : 'Send'}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

/** Month calendar — same idea as booking / offline reserve screen */
function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function FieldCalendarView({ context }) {
  const {
    maintenanceBlocks = [],
    listings = [],
    listingById,
    fmtDate,
    RESERVATIONS = [],
  } = context;

  const [listingId, setListingId] = useState(listings[0]?.id || '');
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(null);

  const homes = listings.length ? listings : [];
  const activeListingId = listingId || homes[0]?.id || '';
  const listing = listingById(activeListingId) || homes.find((h) => h.id === activeListingId);

  const stays = (RESERVATIONS || []).filter(
    (r) => r.listing === activeListingId && ['pending', 'confirmed'].includes(r.status) && !r.maintenanceBlock,
  );
  const workBlocks = (maintenanceBlocks || []).filter((b) => b.listing === activeListingId);

  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });

  const dayStatus = (date) => {
    const iso = toISODate(date);
    const work = workBlocks.find((b) => iso >= b.in && iso < b.out);
    if (work) return { kind: 'work', label: work.reason || 'Work', detail: work };
    const stay = stays.find((r) => iso >= r.in && iso < r.out);
    if (stay) {
      return {
        kind: stay.offlineBooking ? 'offline' : stay.status === 'pending' ? 'pending' : 'guest',
        label: stay.offlineBooking ? 'Offline hold' : stay.status === 'pending' ? 'Pending' : 'Guest',
        detail: stay,
      };
    }
    return { kind: 'free', label: 'Free', detail: null };
  };

  const monthLabel = visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const selected = selectedDay ? dayStatus(fromISO(selectedDay)) : null;

  function fromISO(value) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  const upcoming = [
    ...workBlocks.map((b) => ({
      key: b.id,
      kind: 'work',
      title: b.reason || 'Repairs / work',
      range: `${fmtDate(b.in)} → ${fmtDate(b.out)}`,
    })),
    ...stays.map((r) => ({
      key: r.id,
      kind: r.offlineBooking ? 'offline' : 'guest',
      title: r.offlineBooking ? 'Offline hold' : (r.status === 'pending' ? 'Pending booking' : 'Stay'),
      range: `${fmtDate(r.in)} → ${fmtDate(r.out)}`,
    })),
  ].sort((a, b) => a.range.localeCompare(b.range));

  return (
    <div className="view active field-view field-cal-view">
      <div className="page-head">
        <div>
          <h1 className="page-title">Calendar</h1>
          <div className="page-sub">
            Pick a home. Same month view as when the office books or holds dates — see free days, guests, and work.
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <label className="drawer-label" htmlFor="field-cal-home" style={{ display: 'block', marginBottom: 6 }}>Home</label>
        <select
          id="field-cal-home"
          className="role-select"
          value={activeListingId}
          onChange={(e) => {
            setListingId(e.target.value);
            setSelectedDay(null);
          }}
          style={{ width: '100%', marginBottom: 14 }}
        >
          {homes.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>

        <div className="booking-calendar-head">
          <button
            type="button"
            className="btn btn-ghost"
            aria-label="Previous month"
            onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
          >
            ‹
          </button>
          <h3>{monthLabel}</h3>
          <button
            type="button"
            className="btn btn-ghost"
            aria-label="Next month"
            onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
          >
            ›
          </button>
        </div>

        <div className="booking-calendar-grid field-month-grid" role="grid" aria-label={`Calendar for ${listing?.name || 'home'}`}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="booking-dow">{d}</div>
          ))}
          {days.map((date) => {
            const iso = toISODate(date);
            const inMonth = date.getMonth() === visibleMonth.getMonth();
            const status = dayStatus(date);
            const classes = [
              'booking-day',
              'field-cal-day',
              !inMonth ? 'outside-month' : '',
              status.kind === 'work' ? 'field-day-work' : '',
              status.kind === 'guest' ? 'field-day-guest' : '',
              status.kind === 'pending' ? 'field-day-pending' : '',
              status.kind === 'offline' ? 'field-day-offline' : '',
              status.kind === 'free' && inMonth ? 'field-day-free' : '',
              selectedDay === iso ? 'selected' : '',
            ].filter(Boolean).join(' ');

            return (
              <button
                key={iso + String(inMonth)}
                type="button"
                className={classes}
                disabled={!inMonth}
                onClick={() => inMonth && setSelectedDay(iso)}
                title={inMonth ? `${iso}: ${status.label}` : undefined}
              >
                {date.getDate()}
                {inMonth && status.kind !== 'free' && (
                  <small>{status.kind === 'work' ? 'Work' : status.kind === 'offline' ? 'Hold' : status.kind === 'pending' ? 'Pend' : 'Guest'}</small>
                )}
              </button>
            );
          })}
        </div>

        <div className="field-cal-legend" aria-hidden="true">
          <span><i className="field-leg free" /> Free</span>
          <span><i className="field-leg guest" /> Guest</span>
          <span><i className="field-leg pending" /> Pending</span>
          <span><i className="field-leg offline" /> Offline hold</span>
          <span><i className="field-leg work" /> Work / blocked</span>
        </div>

        {selectedDay && (
          <div className="field-cal-detail" style={{ marginTop: 14 }}>
            <div className="drawer-label">{fmtDate(selectedDay)}</div>
            <div className="drawer-card" style={{ marginTop: 6 }}>
              {selected?.kind === 'free' && 'This day is free — no guest and no work block.'}
              {selected?.kind === 'work' && (
                <>
                  <b>Work / blocked</b>
                  <div className="readonly-note">{selected.detail?.reason}</div>
                  <div className="readonly-note">
                    {fmtDate(selected.detail?.in)} → {fmtDate(selected.detail?.out)}
                  </div>
                </>
              )}
              {selected?.kind === 'guest' && (
                <>
                  <b>Guest in the home</b>
                  <div className="readonly-note">
                    {fmtDate(selected.detail?.in)} → {fmtDate(selected.detail?.out)} · {selected.detail?.id}
                  </div>
                </>
              )}
              {selected?.kind === 'pending' && (
                <>
                  <b>Pending booking</b>
                  <div className="readonly-note">
                    {fmtDate(selected.detail?.in)} → {fmtDate(selected.detail?.out)} · waiting on office
                  </div>
                </>
              )}
              {selected?.kind === 'offline' && (
                <>
                  <b>Offline hold</b>
                  <div className="readonly-note">
                    Office reserved dates outside the apps · {fmtDate(selected.detail?.in)} → {fmtDate(selected.detail?.out)}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <details className="field-upcoming-dropdown" open={false}>
        <summary className="field-upcoming-summary">
          <span>Coming up at this home</span>
          <span className="field-upcoming-count">{upcoming.length}</span>
        </summary>
        <div className="field-maint-alerts" style={{ marginTop: 10 }}>
          {upcoming.length === 0 && (
            <div className="field-empty">Nothing scheduled on this home yet.</div>
          )}
          {upcoming.map((u) => (
            <div className="field-maint-alert-card" key={u.key}>
              <div className="field-maint-alert-title">
                <span className={`field-kind ${u.kind === 'work' ? 'maintenance' : 'cleaning'}`}>
                  {u.kind === 'work' ? 'Work' : u.kind === 'offline' ? 'Hold' : 'Guest'}
                </span>
                <strong>{u.title}</strong>
              </div>
              <div className="field-task-meta">{u.range}</div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

function FieldPropertiesView({ context }) {
  const { fieldTasks = [], listingById, maintenanceBlocks = [] } = context;
  const byListing = {};
  fieldTasks.forEach((t) => {
    if (!byListing[t.listingId]) byListing[t.listingId] = { open: 0, done: 0, accessCode: t.accessCode, maint: 0 };
    if (t.done) byListing[t.listingId].done += 1;
    else byListing[t.listingId].open += 1;
    if (t.accessCode) byListing[t.listingId].accessCode = t.accessCode;
  });
  maintenanceBlocks.forEach((b) => {
    if (!byListing[b.listing]) byListing[b.listing] = { open: 0, done: 0, maint: 0 };
    byListing[b.listing].maint = (byListing[b.listing].maint || 0) + 1;
  });

  const ids = Object.keys(byListing);

  return (
    <div className="view active field-view">
      <div className="page-head">
        <div>
          <h1 className="page-title">Homes</h1>
          <div className="page-sub">Places with your jobs or blocked dates.</div>
        </div>
      </div>
      <div className="field-prop-list">
        {ids.length === 0 && <div className="field-empty">No homes yet.</div>}
        {ids.map((id) => {
          const listing = listingById(id);
          const info = byListing[id];
          return (
            <div className="field-prop-card" key={id}>
              <div className="field-prop-name">{listing?.name || id}</div>
              <div className="field-prop-meta">
                {listing?.type} · {info.open} open · {info.done} done
                {info.maint ? ` · ${info.maint} blocked` : ''}
              </div>
              {info.accessCode && (
                <div className="field-access">
                  <span className="field-access-label">Door code</span>
                  <span className="field-access-code mono">{info.accessCode}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function FieldViews({ view, context }) {
  switch (view) {
    case 'field-today':
      return <FieldTodayView context={context} />;
    case 'field-messages':
      return <FieldMessagesView context={context} />;
    case 'field-calendar':
      return <FieldCalendarView context={context} />;
    case 'field-properties':
      return <FieldPropertiesView context={context} />;
    default:
      return <FieldTodayView context={context} />;
  }
}
