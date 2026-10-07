import { useState } from 'react';
import { AGENTS, CAL_DAYS, OWNERS } from '../data';

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

export default function CalendarView({
  mode,
  listings,
  renderCalendarGrid,
  startDate,
  onChangeStartDate,
  onOpenMaintenance,
}) {
  const [propertyId, setPropertyId] = useState('all');
  const [ownerId, setOwnerId] = useState('all');
  const [agentId, setAgentId] = useState('all');
  const [status, setStatus] = useState('all');
  const owners = OWNERS.filter((owner) => listings.some((listing) => listing.ownerId === owner.id));
  const agents = AGENTS.filter((agent) => listings.some((listing) => listing.agentId === agent.id));
  const subset = listings.filter((listing) => (
    (propertyId === 'all' || listing.id === propertyId)
    && (ownerId === 'all' || listing.ownerId === ownerId)
    && (agentId === 'all' || listing.agentId === agentId)
  ));

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1 className="page-title">Calendar</h1>
          <div className="page-sub">{mode === 'client' ? 'Availability across stays — reserved nights are unavailable to book.' : 'Every reservation and held booking request is shown for each property.'}</div>
        </div>
      </div>
      <div className="cal-toolbar">
        <div className="nav-arrows" aria-label="Calendar date range">
          <button
            type="button"
            aria-label="Previous 28 days"
            onClick={() => onChangeStartDate((date) => addDays(date, -CAL_DAYS))}
          >‹</button>
          <button
            type="button"
            aria-label="Next 28 days"
            onClick={() => onChangeStartDate((date) => addDays(date, CAL_DAYS))}
          >›</button>
        </div>
        <span className="range" aria-live="polite">{formatRange(startDate, CAL_DAYS)}</span>
      </div>
      <div className="cal-filters" aria-label="Calendar filters">
        <label>Property
          <select aria-label="Filter calendar by property" value={propertyId} onChange={(event) => setPropertyId(event.target.value)}>
            <option value="all">All properties</option>
            {listings.map((listing) => <option value={listing.id} key={listing.id}>{listing.name}</option>)}
          </select>
        </label>
        {mode !== 'client' && <>
          <label>Owner
            <select aria-label="Filter calendar by owner" value={ownerId} onChange={(event) => setOwnerId(event.target.value)}>
              <option value="all">All owners</option>
              {owners.map((owner) => <option value={owner.id} key={owner.id}>{owner.name}</option>)}
            </select>
          </label>
          <label>Agent
            <select aria-label="Filter calendar by agent" value={agentId} onChange={(event) => setAgentId(event.target.value)}>
              <option value="all">All agents</option>
              {agents.map((agent) => <option value={agent.id} key={agent.id}>{agent.name}</option>)}
            </select>
          </label>
        </>}
        <label>Reservation status
          <select aria-label="Filter calendar by reservation status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="offline">Offline reservations</option>
            <option value="maintenance">Maintenance blocks</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
      </div>
      <div className="cal-wrap">{subset.length
        ? renderCalendarGrid('cal-grid', subset, { mode, startDate, status, onOpenMaintenance })
        : <div className="cal-empty">No listings match these filters.</div>}</div>
      {mode !== 'client' && <div className="cal-legend">
        <span><span className="legend-dot" style={{ background: 'var(--warning)' }} />Offline reservation</span>
        <span><span className="legend-dot" style={{ background: 'var(--danger)' }} />Maintenance block</span>
        <button type="button" className="chip-link" onClick={onOpenMaintenance}>+ Block maintenance dates</button>
      </div>}
      {mode === 'client' && (
        <div className="cal-legend">
          <span><span className="legend-dot" style={{ background: 'var(--clay)' }} />Your stay or pending request</span>
          <span><span className="legend-dot" style={{ background: 'var(--ink-faint)' }} />Reserved by another guest</span>
        </div>
      )}
    </div>
  );
}
