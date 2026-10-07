import { useState } from 'react';
import Icon from '../components/Icon';

function ClientNotificationList({ notifications = [], markClientNotificationRead }) {
  if (!notifications.length) return null;
  return (
    <section className="attention client-notifications" aria-labelledby="client-notifications-heading">
      <div className="attention-head"><h2 id="client-notifications-heading">Booking updates</h2></div>
      <div className="card">
        {notifications.map((notification) => (
          <div className={`client-notification${notification.read ? '' : ' unread'}`} key={notification.id}>
            <span className={`dot ${notification.read ? 'teal' : 'red'}`} aria-hidden="true" />
            <div className="client-notification-content">
              <p>{notification.message}</p>
              <time dateTime={notification.createdAt}>{new Date(notification.createdAt).toLocaleString()}</time>
            </div>
            {!notification.read && <button
              type="button"
              className="btn btn-ghost"
              onClick={() => markClientNotificationRead(notification.id)}
            >Mark as read</button>}
          </div>
        ))}
      </div>
    </section>
  );
}

function ClientStayCard({ reservation, listing, fmtDate, dayIndex, go, openListing, requestClientReservationAction, reviews, submitStayReview }) {
  const [requestType, setRequestType] = useState('');
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const isUpcoming = reservation.out >= new Date().toISOString().slice(0, 10);
  const canManage = reservation.status === 'confirmed'
    && isUpcoming
    && reservation.clientAction?.status !== 'pending';
  const isPastStay = reservation.out < new Date().toISOString().slice(0, 10);
  const nights = Math.max(0, dayIndex(reservation.out) - dayIndex(reservation.in));
  const action = reservation.clientAction;
  const review = reviews.find((item) => item.reservationId === reservation.id);
  const checkInDate = new Date(`${reservation.in}T00:00:00`);
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const guideAvailable = reservation.status === 'confirmed'
    && reservation.out >= new Date().toISOString().slice(0, 10)
    && checkInDate <= tomorrow;
  const statusLabel = {
    pending: 'Pending confirmation',
    confirmed: 'Confirmed',
    rejected: 'Request declined',
    cancelled: 'Cancelled',
  }[reservation.status] || reservation.status;

  const submitRequest = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const request = requestType === 'date-change'
      ? { type: 'date-change', in: String(formData.get('new-check-in') || ''), out: String(formData.get('new-check-out') || '') }
      : { type: 'cancellation' };
    if (requestClientReservationAction(reservation.id, request)) setRequestType('');
  };

  const sendReview = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submitted = submitStayReview(
      reservation.id,
      Number(formData.get('rating')),
      String(formData.get('comment') || ''),
    );
    if (submitted) setIsReviewFormOpen(false);
  };

  return (
    <article className="card client-stay-card">
      <div className="client-stay-head">
        <div>
          <div className="eyebrow">{reservation.status === 'pending' ? 'BOOKING REQUEST' : reservation.status === 'rejected' ? 'REQUEST DECLINED' : reservation.status === 'confirmed' && reservation.dateReserved ? 'CONFIRMED STAY' : 'STAY'}</div>
          <button className="chip-link listing-name" type="button" onClick={() => openListing(listing?.id)}>{listing?.name || 'Listing'}</button>
          <div className="client-stay-dates">{fmtDate(reservation.in)} → {fmtDate(reservation.out)} · {nights} nights · {reservation.guestCount || 1} guest{reservation.guestCount === 1 ? '' : 's'}</div>
        </div>
        <span className={`pill pill-${reservation.status}`}>{statusLabel}</span>
      </div>
      <div className="client-stay-meta">
        <span>Reservation <b className="mono">{reservation.id}</b></span>
        <span>Payment <b>${reservation.paid.toLocaleString()}</b> · {reservation.paidStatus}</span>
        {reservation.status === 'confirmed' && reservation.dateReserved && <span>Digital door code <b className="mono">{(2000 + parseInt(reservation.id.slice(-2), 10)).toString().slice(0, 4)}</b></span>}
      </div>
      {reservation.status === 'confirmed' && reservation.dateReserved && <p className="client-stay-note">Confirmed by your agent.</p>}
      {reservation.request && reservation.request !== '—' && <p className="client-stay-note">{reservation.request}</p>}
      {reservation.status === 'confirmed' && isUpcoming && (
        <details className="guest-guide">
          <summary>Guest guide</summary>
          {guideAvailable
            ? <div className="guest-guide-content">
              <p><b>Stay</b><br />{fmtDate(reservation.in)} → {fmtDate(reservation.out)} · {nights} nights</p>
              {listing?.guestGuide?.checkIn && <p><b>Check-in</b><br />{listing.guestGuide.checkIn}</p>}
              {listing?.guestGuide?.checkOut && <p><b>Check-out</b><br />{listing.guestGuide.checkOut}</p>}
              {listing?.guestGuide?.wifiName && <p><b>Wi-Fi network</b><br />{listing.guestGuide.wifiName}</p>}
              {listing?.guestGuide?.wifiPassword && <p><b>Wi-Fi password</b><br /><span className="mono">{listing.guestGuide.wifiPassword}</span></p>}
              {listing?.guestGuide?.instructions && <p><b>Arrival & access</b><br />{listing.guestGuide.instructions}</p>}
              {listing?.guestGuide?.houseRules && <p><b>House rules</b><br />{listing.guestGuide.houseRules}</p>}
              {listing?.guestGuide?.localTips && <p><b>Local tips</b><br />{listing.guestGuide.localTips}</p>}
              {!Object.values(listing?.guestGuide || {}).some(Boolean) && <p>Your host has not added guide details yet.</p>}
            </div>
            : <p className="readonly-note">Check-in and access details will be available from the day before your confirmed stay.</p>}
        </details>
      )}
      {action && (
        <div className={`client-action-status ${action.status}`} role={action.status === 'pending' ? 'status' : undefined}>
          {action.type === 'cancellation'
            ? action.status === 'pending' ? 'Cancellation request awaiting agent review.' : action.status === 'approved' ? 'Cancellation approved.' : 'Cancellation request was not approved.'
            : null}
          {action.type === 'date-change' && (
            action.status === 'pending'
              ? `Date change requested: ${fmtDate(action.in)} to ${fmtDate(action.out)}. Awaiting agent review.`
              : action.status === 'approved'
                ? `Date change approved: ${fmtDate(reservation.in)} to ${fmtDate(reservation.out)}.`
                : `Date change request for ${fmtDate(action.in)} to ${fmtDate(action.out)} was not approved.`
          )}
        </div>
      )}
      {canManage && (
        <div className="client-stay-actions">
          {!requestType && <>
            <button className="btn btn-ghost" type="button" onClick={() => setRequestType('date-change')}>Request date change</button>
            <button className="btn btn-ghost" type="button" onClick={() => setRequestType('cancellation')}>Request cancellation</button>
          </>}
          {requestType && <form className="stay-change-form" onSubmit={submitRequest}>
            {requestType === 'date-change' ? <>
              <label htmlFor={`new-check-in-${reservation.id}`}>New check-in</label>
              <input id={`new-check-in-${reservation.id}`} name="new-check-in" type="date" min={new Date().toISOString().slice(0, 10)} defaultValue={reservation.in} required />
              <label htmlFor={`new-check-out-${reservation.id}`}>New check-out</label>
              <input id={`new-check-out-${reservation.id}`} name="new-check-out" type="date" min={new Date().toISOString().slice(0, 10)} defaultValue={reservation.out} required />
              <button className="btn btn-primary" type="submit">Send date change request</button>
            </> : <>
              <p>Ask your agent to cancel this stay? The booking remains active until the request is reviewed.</p>
              <button className="btn btn-primary" type="submit">Send cancellation request</button>
            </>}
            <button className="btn btn-ghost" type="button" onClick={() => setRequestType('')}>Keep current dates</button>
          </form>}
        </div>
      )}
      {reservation.status === 'confirmed' && <div className="stay-actions">
        <button className="btn btn-ghost" type="button" onClick={() => go('client-messages')}>Message your agent</button>
      </div>}
      {isPastStay && (review
        ? <div className="stay-review"><b>Your review · {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</b><p>{review.comment}</p></div>
        : reservation.status === 'confirmed' && <div className="stay-review-actions">
          {!isReviewFormOpen
            ? <button className="btn btn-ghost" type="button" onClick={() => setIsReviewFormOpen(true)}>Leave a review</button>
            : <form className="stay-review-form" onSubmit={sendReview}>
              <label htmlFor={`stay-rating-${reservation.id}`}>Your rating</label>
              <select id={`stay-rating-${reservation.id}`} name="rating" defaultValue="5" required>
                <option value="5">5 stars — Excellent</option>
                <option value="4">4 stars — Very good</option>
                <option value="3">3 stars — Good</option>
                <option value="2">2 stars — Fair</option>
                <option value="1">1 star — Poor</option>
              </select>
              <label htmlFor={`stay-review-${reservation.id}`}>Your review</label>
              <textarea id={`stay-review-${reservation.id}`} name="comment" maxLength="1000" rows="3" required />
              <button className="btn btn-primary" type="submit">Submit review</button>
              <button className="btn btn-ghost" type="button" onClick={() => setIsReviewFormOpen(false)}>Cancel</button>
            </form>}
        </div>)}
    </article>
  );
}

export function ClientBookingView({ context }) {
  const {
    RESERVATIONS, currentGuestClient, dayIndex, fmtDate, go, listingById, openListing,
    clientNotifications, markClientNotificationRead, requestClientReservationAction,
    reviews = [], submitStayReview,
  } = context;
  const stays = RESERVATIONS
    .filter((reservation) => reservation.guest === currentGuestClient)
    .sort((first, second) => first.in.localeCompare(second.in));
  const today = new Date().toISOString().slice(0, 10);
  const upcomingStays = stays.filter((reservation) => reservation.out >= today);
  const pastStays = stays.filter((reservation) => reservation.out < today);
  return (
    <div className="view active">
      <ClientNotificationList notifications={clientNotifications} markClientNotificationRead={markClientNotificationRead} />
      <div className="page-head">
        <div>
          <h1 className="page-title">My stays</h1>
          <div className="page-sub">Review upcoming and past bookings, or ask your agent to change or cancel a confirmed stay.</div>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => go('client-explore')}>Explore stays</button>
      </div>
      <section className="client-stay-section" aria-labelledby="upcoming-stays-heading">
        <div className="attention-head"><h2 id="upcoming-stays-heading">Upcoming stays</h2></div>
        {upcomingStays.length
          ? <div className="client-stay-list">{upcomingStays.map((reservation) => (
            <ClientStayCard
              key={reservation.id}
              reservation={reservation}
              listing={listingById(reservation.listing)}
              fmtDate={fmtDate}
              dayIndex={dayIndex}
              go={go}
              openListing={openListing}
              requestClientReservationAction={requestClientReservationAction}
              reviews={reviews}
              submitStayReview={submitStayReview}
            />
          ))}</div>
          : <div className="card empty-notifications">No upcoming stays yet — browse Explore Stays to book one.</div>}
      </section>
      <section className="client-stay-section" aria-labelledby="past-stays-heading">
        <div className="attention-head"><h2 id="past-stays-heading">Past stays</h2></div>
        {pastStays.length
          ? <div className="client-stay-list">{pastStays.map((reservation) => (
            <ClientStayCard
              key={reservation.id}
              reservation={reservation}
              listing={listingById(reservation.listing)}
              fmtDate={fmtDate}
              dayIndex={dayIndex}
              go={go}
              openListing={openListing}
              requestClientReservationAction={requestClientReservationAction}
              reviews={reviews}
              submitStayReview={submitStayReview}
            />
          ))}</div>
          : <div className="card empty-notifications">Your completed stays will appear here.</div>}
      </section>
    </div>
  );
}

export function ClientNotificationsView({ context }) {
    const { clientNotifications, markClientNotificationRead } = context;
    return (
      <div className="view active">
        <div className="page-head">
          <div>
            <h1 className="page-title">Notifications</h1>
            <div className="page-sub">Updates about your booking requests are saved in this browser.</div>
          </div>
        </div>
        {clientNotifications.length
          ? <ClientNotificationList notifications={clientNotifications} markClientNotificationRead={markClientNotificationRead} />
          : <div className="card empty-notifications">No booking updates yet. You’ll see a notification here when your request is accepted or rejected.</div>}
      </div>
    );
}

export function ClientMessagesView({ context }) {
  const { AGENTS, CAL_START, GUESTS, INBOX_THREADS, RESERVATIONS, activeThreadGuest, agentById, agentListings, agentOwners, currentAgent, currentGuestClient, currentOwner, currentRole, dayIndex, fmtDate, go, guestById, listingById, listings, notices, openGuest, openGuestThread, openListing, openListingEditor, openReservation, ownerAgents, ownerById, ownerLabel, ownerListings, ownerReservations, receivedNoticesForAgent, sendOwnerNotice, setActiveThreadGuest, conversations, sendMessage } = context;
  

    const g = guestById(currentGuestClient);
    const messages = conversations.find((conversation) => conversation.guest === currentGuestClient)?.messages || [];
    const agent = AGENTS.find((a) => a.id === listingById(RESERVATIONS.find((r) => r.guest === currentGuestClient)?.listing || 'L1')?.agentId);
    const handleSubmit = (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const message = new FormData(form).get('message');
      if (sendMessage(currentGuestClient, String(message || ''))) form.reset();
    };

    return (
      <div className="view active">
        <div className="page-head"><div><h1 className="page-title">Messages</h1><div className="page-sub">{agent ? `Your conversation with ${agent.name}, your agent` : 'Your conversation with your agent'} — just your thread, not the owner or the shared inbox.</div></div></div>
        <div className="card" style={{ height: '480px', display: 'flex', flexDirection: 'column' }}>
          <div className="thread-header"><span style={{ fontWeight: 600, fontSize: '14px' }}>{agent ? agent.name : 'Your agent'}</span></div>
          <div className="thread-messages" style={{ flex: 1 }} aria-live="polite">
            {messages.map((message) => (
              <div className={`msg ${message.sender === 'guest' ? 'mine' : 'them'}`} key={message.id}>{message.text}</div>
            ))}
          </div>
          <form className="composer" onSubmit={handleSubmit}>
            <input type="text" name="message" aria-label="Write a message" placeholder="Write a message…" maxLength="2000" />
            <button className="btn btn-primary" type="submit">Send</button>
          </form>
        </div>
      </div>
    );
  
}

export function ClientExploreView({ context }) {
  const { AGENTS, CAL_START, GUESTS, INBOX_THREADS, RESERVATIONS, activeThreadGuest, agentById, agentListings, agentOwners, currentAgent, currentGuestClient, currentOwner, currentRole, dayIndex, fmtDate, go, guestById, listingById, listings, notices, openGuest, openGuestThread, openListing, openListingEditor, openReservation, ownerAgents, ownerById, ownerLabel, ownerListings, ownerReservations, receivedNoticesForAgent, sendOwnerNotice, setActiveThreadGuest } = context;
  

    return <div className="view active">
      <div className="page-head"><div><h1 className="page-title">Explore stays</h1><div className="page-sub">Other places you might like to book next — tap a listing to see details.</div></div></div>
      <div className="explore-grid">
        {listings.map((l) => (
          <div key={l.id} className="card listing-card explore-card">
            <div className="listing-photo"><Icon name="home2" /></div>
            <div className="listing-body">
              <button className="chip-link listing-name" type="button" onClick={() => openListing(l.id)}>{l.name}</button>
              <div className="listing-meta">{l.type}</div>
              <div className="listing-stats">
                <span className="price-tag">${l.rate}/night</span>
                <button className="btn btn-ghost" type="button" onClick={(e) => { e.stopPropagation(); openListing(l.id); }} style={{ padding: '5px 10px', fontSize: '12px' }}>View</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>;
  
}

export default function ClientViews({ view, context }) {
  switch (view) {
    case 'client-booking': return <ClientBookingView context={context} />;
    case 'client-notifications': return <ClientNotificationsView context={context} />;
    case 'client-messages': return <ClientMessagesView context={context} />;
    case 'client-explore': return <ClientExploreView context={context} />;
    default: return null;
  }
}
