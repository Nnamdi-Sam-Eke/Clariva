import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import BookingDatePicker from './BookingDatePicker';

function AuditTimeline({ entries, ownerById, agentById }) {
  if (!entries.length) return null;
  return (
    <section className="drawer-section audit-section" aria-label="Availability and reservation history">
      <div className="drawer-label">Activity history</div>
      <ol className="audit-timeline">
        {entries.slice().sort((first, second) => second.createdAt.localeCompare(first.createdAt)).map((entry) => {
          const actor = entry.actorRole === 'owner'
            ? ownerById(entry.actorId)?.name || 'Owner'
            : entry.actorRole === 'agent'
              ? agentById(entry.actorId)?.name || 'Agent'
              : entry.actorRole === 'client'
                ? 'Client'
                : 'System';
          return <li key={entry.id}>
            <span className="audit-action">{entry.action.replaceAll('-', ' ')}</span>
            <span>{entry.details}</span>
            <small>{actor} · {new Date(entry.createdAt).toLocaleString()}</small>
          </li>;
        })}
      </ol>
    </section>
  );
}

export default function Drawer({
  drawerStack,
  closeDrawer,
  drawerBack,
  openGuest,
  openReservation,
  openGuestThread,
  go,
  currentRole,
  currentOwner,
  currentAgent,
  renderGallery,
  editDraft,
  listings,
  saveListingEditor,
  ownerLabel,
  ownerById,
  agentById,
  guestById,
  listingById,
  resById,
  fmtDate,
  dayIndex,
  INBOX_THREADS,
  CAL_START,
  renderEditGallery,
  RESERVATIONS,
  maintenanceBlocks = [],
  auditHistory = [],
  reviews = [],
  reviewResponses = [],
  onStartBooking,
  onStartOfflineReservation,
  onStartMaintenanceBlock,
  onOpenMaintenanceBlock,
  onRequestBooking,
  onReserveOfflineDates,
  onCreateMaintenanceBlock,
  onRemoveMaintenanceBlock,
  onRespondToReview,
  bookingError,
  isBookingSubmitting = false,
  toggleTask,
}) {
  const drawerRef = useRef(null);
  const previousFocus = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(460);
  const isOpen = drawerStack.length > 0;
  const top = drawerStack[drawerStack.length - 1];
  const focusKey = top ? `${top.type}:${top.id}` : '';
  useEffect(() => {
    setIsExpanded(false);
    setDrawerWidth(460);
  }, [focusKey]);
  const drawerTitle = top ? (() => {
    if (top.type === 'reservation') return `Reservation ${top.id}`;
    if (top.type === 'guest') return guestById(top.id)?.name || 'Guest';
    if (top.type === 'listing') return listingById(top.id)?.name || 'Listing';
    if (top.type === 'listing-edit') return editDraft ? (listings.some((l) => l.id === editDraft.id) ? `Edit ${editDraft.name || 'listing'}` : 'Add listing') : 'Add listing';
    if (top.type === 'booking-form') return `Request to book ${listingById(top.id)?.name || 'listing'}`;
    if (top.type === 'offline-reservation') return `Reserve dates for ${listingById(top.id)?.name || 'listing'}`;
    if (top.type === 'maintenance-block') return `Block maintenance dates`;
    if (top.type === 'maintenance-detail') return 'Maintenance block';
    return 'Drawer';
  })() : '';

  useEffect(() => {
    const drawer = drawerRef.current;
    if (drawer) drawer.inert = !isOpen;
    if (!isOpen) {
      previousFocus.current?.focus();
      previousFocus.current = null;
      return undefined;
    }

    if (!previousFocus.current) previousFocus.current = document.activeElement;
    const getFocusable = () => [...(drawer?.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])') || [])]
      .filter((element) => element.getClientRects().length > 0 && element.getAttribute('aria-hidden') !== 'true');
    getFocusable()[0]?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDrawer();
        return;
      }
      if (event.key !== 'Tab' || !drawer) return;

      const focusable = getFocusable();
      if (!focusable.length) {
        event.preventDefault();
        drawer.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !drawer.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !drawer.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusKey, closeDrawer]);

  const drawerBody = (() => {
    if (!top) return null;

    if (top.type === 'reservation') {
      const r = resById(top.id);
      const g = r.offlineBooking ? null : guestById(r.guest);
      const l = listingById(r.listing);
      return (
        <>
          <div className="drawer-section">
            <span className={`pill pill-${r.status}`}>{r.status === 'confirmed' ? '✓ Confirmed' : r.status === 'pending' ? 'Pending' : 'Cancelled'}</span>
            <div style={{ marginTop: '8px', fontSize: '15px', fontWeight: 600 }}>{fmtDate(r.in)} → {fmtDate(r.out)} · {dayIndex(r.out) - dayIndex(r.in)} nights</div>
            {r.guestCount && <div className="readonly-note" style={{ marginTop: '4px' }}>{r.guestCount} guests</div>}
          </div>
          <div className="drawer-section"><div className="drawer-label">Guest</div><div className="drawer-card">{g ? <><button className="chip-link" type="button" onClick={() => openGuest(g.id)}><Icon name="link" />{g.name}</button><div style={{ color: 'var(--ink-soft)', fontSize: '12.5px', marginTop: '3px' }}>{g.vip ? 'VIP · ' : ''}{g.stays} previous stays</div></> : <><b>{r.offlineGuestName || 'Offline guest'}</b><div className="readonly-note">Reserved offline by {r.bookedByRole === 'owner' ? ownerById(r.bookedById)?.name || 'the owner' : agentById(r.bookedById)?.name || 'the agent'}</div></>}</div></div>
          <div className="drawer-section"><div className="drawer-label">Property</div><div className="drawer-card"><button className="chip-link" type="button" onClick={() => go('listings')}><Icon name="link" />{l.name}</button></div></div>
          <div className="drawer-section"><div className="drawer-label">Payment</div><div className="drawer-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span className="mono" style={{ fontSize: '15px', fontWeight: 600 }}>${r.paid.toLocaleString()}</span><span className={`pill ${r.paidStatus === 'Paid' ? 'pill-confirmed' : 'pill-pending'}`}>{r.paidStatus}</span></div></div>
          <div className="drawer-section"><div className="drawer-label">Channel</div><div className="drawer-card sync-pill" style={{ display: 'inline-flex' }}><span className="sync-dot" />{r.channel} · Synced 2m ago</div></div>
          <div className="drawer-section"><div className="drawer-label">Special requests</div><div className="drawer-card" style={{ fontSize: '13px' }}>{r.request}</div></div>
          <div className="drawer-section"><div className="drawer-label">Tasks</div><div className="drawer-card">{r.tasks.length ? r.tasks.map((task, idx) => (
            <div key={`${task.t}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '13px' }}>
              {currentRole === 'agent' ? (
                <button
                  className={`task-check ${task.done ? 'done' : ''}`}
                  type="button"
                  aria-label={`${task.done ? 'Mark incomplete' : 'Mark complete'}: ${task.t}`}
                  aria-pressed={task.done}
                  onClick={() => toggleTask(top.id, idx)}
                >{task.done ? '✓' : ''}</button>
              ) : <span aria-hidden="true" style={{ color: task.done ? 'var(--success)' : 'var(--ink-faint)' }}>{task.done ? '✓' : '○'}</span>}
              <span style={task.done ? { textDecoration: 'line-through', color: 'var(--ink-faint)' } : {}}>{task.t}</span>
              {task.overdue && <span style={{ color: 'var(--danger)', fontSize: '11px', fontWeight: 600 }}>overdue</span>}
            </div>
          )) : <span style={{ color: 'var(--ink-faint)', fontSize: '13px' }}>No tasks yet</span>}</div></div>
          <AuditTimeline entries={auditHistory.filter((entry) => entry.entityType === 'reservation' && entry.entityId === r.id)} ownerById={ownerById} agentById={agentById} />
          {g && <div className="drawer-section"><div className="drawer-label">Conversation</div><button className="drawer-card chip-link" type="button" style={{ display: 'block', textAlign: 'left', width: '100%', fontWeight: 400 }} onClick={() => openGuestThread(g.id)}>&ldquo;{INBOX_THREADS.find((t) => t.guest === g.id)?.last || 'No messages yet'}&rdquo; <Icon name="link" /></button></div>}
        </>
      );
    }

    if (top.type === 'guest') {
      const g = guestById(top.id);
      if (!g) return null;
      const stays = RESERVATIONS.filter((r) => r.guest === top.id);
      const current = stays.find((r) => new Date(`${r.out}T00:00:00`) >= CAL_START);
      return (
        <>
          <div className="drawer-section">{g.vip ? <span className="pill pill-vip">VIP</span> : ''} <span style={{ color: 'var(--ink-soft)', fontSize: '13px' }}>{g.stays} previous stays</span></div>
          <div className="drawer-section"><div className="drawer-label">Contact</div><div className="drawer-card mono" style={{ fontSize: '12.5px' }}>{g.contact}</div></div>
          <div className="drawer-section"><div className="drawer-label">Current reservation</div>{current ? <button className="drawer-card chip-link" type="button" style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => openReservation(current.id)}><Icon name="link" />{listingById(current.listing).name} · {fmtDate(current.in)} → {fmtDate(current.out)}</button> : <div className="drawer-card" style={{ color: 'var(--ink-faint)', fontSize: '13px' }}>No upcoming stay</div>}</div>
          <div className="drawer-section"><div className="drawer-label">Previous stays</div><div className="drawer-card">{stays.length} reservation{stays.length !== 1 ? 's' : ''} on file</div></div>
          <div className="drawer-section"><div className="drawer-label">Notes</div><div className="drawer-card" style={{ fontSize: '13px' }}>{g.notes}</div></div>
          <div className="drawer-section"><button className="btn btn-ghost" type="button" style={{ width: '100%', justifyContent: 'center' }} onClick={() => openGuestThread(g.id)}>Open conversation</button></div>
        </>
      );
    }

    if (top.type === 'listing') {
      const l = listingById(top.id);
      if (!l) return null;
      const agent = agentById(l.agentId);
      const listingReviews = reviews.filter((review) => review.listing === l.id);
      const listingMaintenance = maintenanceBlocks.filter((block) => block.listing === l.id);
      const listingAudit = auditHistory.filter((entry) => entry.listingId === l.id);
      const canManageListing = (currentRole === 'owner' && l.ownerId === currentOwner)
        || (currentRole === 'agent' && l.agentId === currentAgent);
      const averageRating = listingReviews.length
        ? (listingReviews.reduce((total, review) => total + review.rating, 0) / listingReviews.length).toFixed(1)
        : null;
      return (
        <>
          <div className="drawer-section" id="listing-gallery">{renderGallery(l)}</div>
          <div className="drawer-section"><div className="drawer-label">Type</div><div className="drawer-card">{l.type}</div></div>
          <div className="drawer-section"><div className="drawer-label">Nightly rate</div><div className="drawer-card mono" style={{ fontSize: '16px', fontWeight: 600 }}>${l.rate}/night</div></div>
          <div className="drawer-section"><div className="drawer-label">Posted by</div><div className="drawer-card">{ownerLabel(l)}{agent ? ` · managed by ${agent.name}` : ''}</div></div>
          <div className="drawer-section">
            <div className="drawer-label">Features & perks</div>
            {l.amenities?.length
              ? <ul className="listing-amenities">{l.amenities.map((amenity) => <li key={amenity}>{amenity}</li>)}</ul>
              : <div className="drawer-card readonly-note">No features have been added yet.</div>}
          </div>
          <div className="drawer-section">
            <div className="drawer-label">Guest reviews</div>
            {averageRating
              ? <div className="drawer-card"><div className="review-summary"><span aria-label={`${averageRating} out of 5 stars`}>★ {averageRating}/5</span><span>{listingReviews.length} review{listingReviews.length === 1 ? '' : 's'}</span></div>
                {listingReviews.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((review) => (
                  <article className="listing-review" key={review.id}>
                    <div aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                    <p>{review.comment}</p>
                    <span>{guestById(review.guest)?.name || 'Guest'} · {new Date(review.createdAt).toLocaleDateString()}</span>
                    {reviewResponses.find((response) => response.reviewId === review.id)
                      ? <div className="review-response"><b>Host response</b><p>{reviewResponses.find((response) => response.reviewId === review.id).text}</p></div>
                      : null}
                    {canManageListing && <form className="review-response-form" onSubmit={(event) => onRespondToReview(event, review)}>
                      <label htmlFor={`review-response-${review.id}`}>{reviewResponses.some((response) => response.reviewId === review.id) ? 'Edit response' : 'Reply to review'}</label>
                      <textarea id={`review-response-${review.id}`} name="response" maxLength="1000" rows="2" defaultValue={reviewResponses.find((response) => response.reviewId === review.id)?.text || ''} required />
                      <button className="btn btn-ghost" type="submit">Save response</button>
                    </form>}
                  </article>
                ))}</div>
              : <div className="drawer-card readonly-note">No guest reviews yet.</div>}
          </div>
          {canManageListing && <>
            <div className="drawer-section">
              <div className="drawer-label">Maintenance blocks</div>
              {listingMaintenance.length
                ? <div className="drawer-card">{listingMaintenance.map((block) => <button className="maintenance-item" type="button" key={block.id} onClick={() => onOpenMaintenanceBlock(block.id)}>{fmtDate(block.in)} → {fmtDate(block.out)} · {block.reason}</button>)}</div>
                : <div className="drawer-card readonly-note">No maintenance dates blocked.</div>}
            </div>
            <div className="drawer-section drawer-listing-actions">
              <button className="btn btn-ghost" type="button" onClick={() => onStartMaintenanceBlock(l.id)}>Block maintenance dates</button>
              <button className="btn btn-ghost" type="button" onClick={() => onStartOfflineReservation(l.id)}>Reserve dates for offline client</button>
            </div>
          </>}
          {currentRole === 'client' && <div className="drawer-section"><button className="btn btn-primary" type="button" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onStartBooking(l.id)}>Book now</button></div>}
          {currentRole !== 'client' && <AuditTimeline entries={listingAudit} ownerById={ownerById} agentById={agentById} />}
        </>
      );
    }

    if (top.type === 'offline-reservation') {
      const listing = listingById(top.id);
      if (!listing) return <div className="drawer-section" role="alert">This listing is no longer available.</div>;
      return (
        <form onSubmit={(event) => onReserveOfflineDates(event, listing.id)} noValidate>
          <div className="drawer-section"><div className="drawer-label">Reserve dates</div><div className="drawer-card">{listing.name} · {currentRole === 'owner' ? 'Owner booking' : 'Agent booking'}</div></div>
          <div className="drawer-section"><BookingDatePicker listingId={listing.id} reservations={RESERVATIONS} bookingError={bookingError} /></div>
          <div className="drawer-section"><label className="drawer-label" htmlFor="offline-guest-name">Offline guest name <span className="readonly-note">(optional)</span></label><input className="drawer-input" id="offline-guest-name" name="offline-guest" maxLength="100" placeholder="Offline guest" /></div>
          <div className="drawer-section"><label className="drawer-label" htmlFor="offline-booking-note">Internal note <span className="readonly-note">(optional)</span></label><textarea className="drawer-input" id="offline-booking-note" name="request" rows="3" maxLength="500" /></div>
          <div className="drawer-section"><button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>Book now / reserve dates</button><div className="readonly-note" style={{ marginTop: '8px' }}>This immediately blocks the dates. Clients will see them as reserved without the guest’s name or who added the reservation.</div></div>
        </form>
      );
    }

    if (top.type === 'maintenance-block') {
      const listing = listingById(top.id);
      const isAllListings = top.id === 'all';
      const manageableListings = listings.filter((item) => (
        (currentRole === 'owner' && item.ownerId === currentOwner)
        || (currentRole === 'agent' && item.agentId === currentAgent)
      ));
      if (!isAllListings && !listing) return <div className="drawer-section" role="alert">This listing is no longer available.</div>;
      return (
        <form onSubmit={(event) => onCreateMaintenanceBlock(event, isAllListings ? '' : listing.id)} noValidate>
          {isAllListings
            ? <div className="drawer-section"><label className="drawer-label" htmlFor="maintenance-listing-id">Property</label><select className="drawer-input" id="maintenance-listing-id" name="maintenance-listing-id" required defaultValue=""><option value="" disabled>Select a property</option>{manageableListings.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
            : <div className="drawer-section"><div className="drawer-label">Property</div><div className="drawer-card">{listing.name}</div></div>}
          <div className="drawer-section"><BookingDatePicker key={listing?.id || 'maintenance-property-select'} listingId={listing?.id || manageableListings[0]?.id || ''} reservations={RESERVATIONS} bookingError={bookingError} /></div>
          <div className="drawer-section"><label className="drawer-label" htmlFor="maintenance-reason">Reason <span className="readonly-note">(optional)</span></label><input className="drawer-input" id="maintenance-reason" name="maintenance-reason" maxLength="200" placeholder="Repairs, renovation, owner use" /></div>
          <div className="drawer-section"><button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>Block selected dates</button><div className="readonly-note" style={{ marginTop: '8px' }}>Maintenance blocks are unavailable to guests and appear distinctly on all calendars.</div></div>
        </form>
      );
    }

    if (top.type === 'maintenance-detail') {
      const block = maintenanceBlocks.find((item) => item.id === top.id);
      if (!block) return <div className="drawer-section">This maintenance block is no longer active.</div>;
      const listing = listingById(block.listing);
      return <>
        <div className="drawer-section"><div className="drawer-label">Property</div><div className="drawer-card">{listing?.name || 'Listing'}</div></div>
        <div className="drawer-section"><div className="drawer-label">Unavailable dates</div><div className="drawer-card">{fmtDate(block.in)} → {fmtDate(block.out)}</div></div>
        <div className="drawer-section"><div className="drawer-label">Reason</div><div className="drawer-card">{block.reason}</div></div>
        <div className="drawer-section"><button className="btn btn-ghost" type="button" onClick={() => onRemoveMaintenanceBlock(block.id)}>Remove maintenance block</button></div>
        <AuditTimeline entries={auditHistory.filter((entry) => entry.entityType === 'maintenance' && entry.entityId === block.id)} ownerById={ownerById} agentById={agentById} />
      </>;
    }

    if (top.type === 'booking-form') {
      const listing = listingById(top.id);
      if (!listing) return <div className="drawer-section" role="alert">This listing is no longer available.</div>;
      return (
        <form onSubmit={(event) => onRequestBooking(event, listing.id)} noValidate>
          <div className="drawer-section">
            <div className="drawer-label">Request for</div>
            <div className="drawer-card">{listing.name} · ${listing.rate}/night</div>
          </div>
          <div className="drawer-section">
            <BookingDatePicker listingId={listing.id} reservations={RESERVATIONS} bookingError={bookingError} />
          </div>
          <div className="drawer-section">
            <label className="drawer-label" htmlFor="booking-guest-count">Guests</label>
            <input className="drawer-input" type="number" id="booking-guest-count" name="guest-count" min="1" max="20" step="1" defaultValue="1" aria-describedby={bookingError ? 'booking-error' : undefined} required />
          </div>
          <div className="drawer-section">
            <label className="drawer-label" htmlFor="booking-request">Special requests <span className="readonly-note">(optional)</span></label>
            <textarea className="drawer-input" id="booking-request" name="request" maxLength="500" rows="3" />
          </div>
          <div className="drawer-section">
            <button className="btn btn-primary" type="submit" disabled={isBookingSubmitting} style={{ width: '100%', justifyContent: 'center' }}>{isBookingSubmitting ? 'Sending request…' : 'Reserve these dates & send request'}</button>
            <div className="readonly-note" style={{ marginTop: '8px' }}>Submitting blocks the selected nights on this listing’s calendars while your request is pending confirmation.</div>
          </div>
        </form>
      );
    }

    if (top.type === 'listing-edit' && editDraft) {
      const showOwnerField = currentRole === 'agent';
      return (
        <>
          <div className="drawer-section">{renderEditGallery()}</div>
          <div className="drawer-section"><label className="drawer-label" htmlFor="edit-name">Building / apartment name</label><input type="text" id="edit-name" className="drawer-input" placeholder="e.g. Villa Lagos" defaultValue={editDraft.name || ''} /></div>
          <div className="drawer-section"><label className="drawer-label" htmlFor="edit-type">Type</label><input type="text" id="edit-type" className="drawer-input" placeholder="e.g. Apartment · 2bd" defaultValue={editDraft.type || ''} /></div>
          <div className="drawer-section"><label className="drawer-label" htmlFor="edit-rate">Nightly rate ($)</label><input type="number" id="edit-rate" className="drawer-input" min="1" defaultValue={editDraft.rate || 100} /></div>
          {showOwnerField && <div className="drawer-section"><label className="drawer-label" htmlFor="edit-owner">Owner</label><input type="text" id="edit-owner" className="drawer-input" placeholder="Owner's name — leave blank if they don't use Clariva" defaultValue={editDraft.ownerId ? (ownerById(editDraft.ownerId)?.name || '') : (editDraft.ownerName || '')} /><div className="readonly-note" style={{ marginTop: '4px' }}>Matches an existing owner's name → links to their account. Otherwise it's saved as unlisted, and you manage it directly.</div></div>}
          <div className="drawer-section"><label className="drawer-label" htmlFor="edit-amenities">Features & perks <span className="readonly-note">(one per line)</span></label><textarea id="edit-amenities" className="drawer-input" rows="5" maxLength="2000" placeholder={'Wi-Fi\nSwimming pool\nTable tennis'} defaultValue={(editDraft.amenities || []).join('\n')} /></div>
          <div className="drawer-section">
            <div className="drawer-label">Guest guide <span className="readonly-note">(shown to confirmed guests near their stay)</span></div>
            <label className="drawer-label" htmlFor="edit-guide-checkin">Check-in instructions</label><textarea id="edit-guide-checkin" className="drawer-input" rows="2" maxLength="1000" defaultValue={editDraft.guestGuide?.checkIn || ''} />
            <label className="drawer-label" htmlFor="edit-guide-checkout">Check-out instructions</label><textarea id="edit-guide-checkout" className="drawer-input" rows="2" maxLength="1000" defaultValue={editDraft.guestGuide?.checkOut || ''} />
            <label className="drawer-label" htmlFor="edit-guide-wifi-name">Wi-Fi network</label><input id="edit-guide-wifi-name" className="drawer-input" maxLength="100" defaultValue={editDraft.guestGuide?.wifiName || ''} />
            <label className="drawer-label" htmlFor="edit-guide-wifi-password">Wi-Fi password</label><input id="edit-guide-wifi-password" className="drawer-input" maxLength="100" defaultValue={editDraft.guestGuide?.wifiPassword || ''} />
            <label className="drawer-label" htmlFor="edit-guide-instructions">Arrival and access details</label><textarea id="edit-guide-instructions" className="drawer-input" rows="3" maxLength="2000" defaultValue={editDraft.guestGuide?.instructions || ''} />
            <label className="drawer-label" htmlFor="edit-guide-rules">House rules</label><textarea id="edit-guide-rules" className="drawer-input" rows="3" maxLength="2000" defaultValue={editDraft.guestGuide?.houseRules || ''} />
            <label className="drawer-label" htmlFor="edit-guide-tips">Local tips</label><textarea id="edit-guide-tips" className="drawer-input" rows="3" maxLength="2000" defaultValue={editDraft.guestGuide?.localTips || ''} />
          </div>
          <div className="drawer-section"><button className="btn btn-primary" type="button" style={{ width: '100%', justifyContent: 'center' }} onClick={saveListingEditor}>{listings.some((l) => l.id === editDraft.id) ? 'Save changes' : 'Add listing'}</button></div>
        </>
      );
    }

    return null;
  })();

  return (
    <>
      <button className={`backdrop ${isOpen ? 'show' : ''}`} type="button" aria-label="Close details panel" tabIndex={isOpen ? 0 : -1} onClick={closeDrawer} />
      <div ref={drawerRef} className={`drawer ${isOpen ? 'show' : ''}${isExpanded ? ' expanded' : ''}`} style={top?.type === 'listing' && !isExpanded ? { '--drawer-width': `${drawerWidth}px` } : undefined} role="dialog" aria-modal={isOpen ? 'true' : undefined} aria-labelledby="drawer-title" aria-hidden={!isOpen} tabIndex="-1">
        <div className="drawer-head">
          <button className="drawer-back" type="button" aria-label="Go back" onClick={drawerBack} style={{ display: drawerStack.length > 1 ? 'flex' : 'none' }}>←</button>
          {top?.type === 'listing' && <button className="drawer-expand" type="button" aria-label={isExpanded ? 'Restore listing details panel' : 'Expand listing details'} onClick={() => setIsExpanded((expanded) => !expanded)}>{isExpanded ? '↙' : '⛶'}</button>}
          <div id="drawer-title" style={{ fontWeight: 600, fontSize: '14.5px', flex: 1 }}>{drawerTitle}</div>
          <button className="drawer-close" type="button" aria-label="Close details panel" onClick={closeDrawer}>✕</button>
        </div>
        {top?.type === 'listing' && !isExpanded && <button
          className="drawer-resize-handle"
          type="button"
          aria-label="Resize listing details panel"
          aria-valuemin={400}
          aria-valuemax={typeof window === 'undefined' ? 1440 : window.innerWidth}
          aria-valuenow={drawerWidth}
          onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
          onPointerMove={(event) => {
            if (event.buttons !== 1) return;
            setDrawerWidth(Math.max(400, Math.min(window.innerWidth, window.innerWidth - event.clientX)));
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') setDrawerWidth((width) => Math.min(window.innerWidth, width + 40));
            if (event.key === 'ArrowRight') setDrawerWidth((width) => Math.max(400, width - 40));
          }}
        />}
        <div className="drawer-body">{drawerBody}</div>
      </div>
    </>
  );
}
