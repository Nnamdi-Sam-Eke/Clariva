import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { CAL_DAYS, CAL_START, LISTINGS, RESERVATIONS } from './data';

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getFutureStay() {
  const checkIn = new Date();
  checkIn.setHours(0, 0, 0, 0);
  checkIn.setDate(checkIn.getDate() + 60);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 4);
  return { checkIn, checkOut };
}

function isoOffsetFromToday(offset) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return toISODate(date);
}

function monthName(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function calendarPagesTo(date) {
  const relativeDays = Math.floor((date.getTime() - CAL_START.getTime()) / (24 * 60 * 60 * 1000));
  return Math.max(0, Math.floor(relativeDays / CAL_DAYS));
}

async function openBookingForm(user) {
  await user.click(screen.getByRole('button', { name: 'Client', exact: true }));
  await user.click(screen.getByRole('button', { name: 'Explore Stays' }));
  await user.click(screen.getByRole('button', { name: 'Villa Lagos', exact: true }));
  const listingDialog = await screen.findByRole('dialog', { name: 'Villa Lagos' });
  await user.click(within(listingDialog).getByRole('button', { name: 'Book now' }));
  return screen.findByRole('dialog', { name: 'Request to book Villa Lagos' });
}

async function openBookingMonth(user, targetMonthName) {
  for (let monthAdvance = 0; monthAdvance < 24; monthAdvance += 1) {
    if (screen.getByRole('heading', { level: 3 }).textContent === targetMonthName) return;
    await user.click(screen.getByRole('button', { name: 'Next month' }));
  }
  throw new Error(`Booking calendar did not reach ${targetMonthName}.`);
}

async function selectDate(user, date) {
  const label = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  await user.click(screen.getByRole('button', { name: new RegExp(`^${label}`) }));
}

async function submitBookingRequest(user, formDialog, checkIn, checkOut) {
  await openBookingMonth(user, monthName(checkIn));
  await selectDate(user, checkIn);
  await selectDate(user, checkOut);
  await user.click(within(formDialog).getByRole('button', { name: 'Reserve these dates & send request' }));
  await screen.findByText('BOOKING REQUEST');
}

describe('Clariva app workflows', () => {
  it('submits and reloads a pending booking request', async () => {
    const user = userEvent.setup();
    const app = render(<App />);
    const formDialog = await openBookingForm(user);
    const { checkIn, checkOut } = getFutureStay();

    await openBookingMonth(user, monthName(checkIn));
    await selectDate(user, checkIn);
    await selectDate(user, checkOut);
    fireEvent.change(within(formDialog).getByLabelText('Guests'), { target: { value: '2' } });
    await user.type(within(formDialog).getByLabelText('Special requests (optional)'), 'Late arrival');
    await user.click(within(formDialog).getByRole('button', { name: 'Reserve these dates & send request' }));

    expect(await screen.findByText('BOOKING REQUEST')).toBeTruthy();
    expect(screen.getByText(/Pending confirmation/)).toBeTruthy();
    expect(screen.queryByText('Digital door code')).toBeNull();
    expect(await screen.findByRole('status')).toHaveProperty('textContent', 'Dates reserved for RES-10492. The booking request is pending confirmation.');
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem('clariva.reservations.v1'));
      expect(saved.at(-1)).toMatchObject({
        id: 'RES-10492',
        guest: 'G1',
        listing: 'L1',
        in: toISODate(checkIn),
        out: toISODate(checkOut),
        status: 'pending',
        dateReserved: true,
        guestCount: 2,
        request: 'Late arrival',
      });
    });

    app.unmount();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Client', exact: true }));
    expect(screen.getByText('BOOKING REQUEST')).toBeTruthy();
    expect(screen.getByText(/Pending confirmation/)).toBeTruthy();

    fireEvent.change(screen.getByRole('combobox', { name: 'Select client account' }), { target: { value: 'G2' } });
    await user.click(screen.getByRole('button', { name: 'Explore Stays' }));
    await user.click(screen.getByRole('button', { name: 'Villa Lagos', exact: true }));
    const listingDialog = await screen.findByRole('dialog', { name: 'Villa Lagos' });
    await user.click(within(listingDialog).getByRole('button', { name: 'Book now' }));
    await openBookingMonth(user, monthName(checkIn));
    const lastReservedNight = new Date(checkOut);
    lastReservedNight.setDate(lastReservedNight.getDate() - 1);
    expect(screen.getByRole('button', { name: new RegExp(`^${checkIn.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}, reserved`) }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: new RegExp(`^${lastReservedNight.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}, reserved`) }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: new RegExp(`^${checkOut.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`) }).disabled).toBe(false);
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'Calendar' }));
    for (let index = 0; index < calendarPagesTo(checkIn); index += 1) {
      await user.click(screen.getByRole('button', { name: 'Next 28 days' }));
    }
    const shortDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    expect(await screen.findByRole('button', {
      name: new RegExp(`Reserved, Villa Lagos, ${shortDate(checkIn)} to ${shortDate(checkOut)}, pending`),
    })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Agent', exact: true }));
    await user.click(screen.getByRole('button', { name: 'Calendar' }));
    expect(await screen.findByRole('button', {
      name: new RegExp(`Sarah Johnson, Villa Lagos, ${shortDate(checkIn)} to ${shortDate(checkOut)}, pending`),
    })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Reservations' }));
    const requestRow = screen.getByRole('row', { name: /RES-10492/ });
    await user.click(within(requestRow).getByRole('button', { name: '$ 0' }));
    const reservationDialog = await screen.findByRole('dialog', { name: 'Reservation RES-10492' });
    expect(within(reservationDialog).getByText('2 guests')).toBeTruthy();
  }, 15000);

  it('lets a listing owner hold offline dates and hides the booking identity from clients', async () => {
    const { checkIn, checkOut } = getFutureStay();
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Owner', exact: true }));
    await user.click(screen.getByRole('button', { name: 'Listings' }));
    const listingCard = screen.getByText('Villa Lagos').closest('.listing-card');
    await user.click(within(listingCard).getByRole('button', { name: 'Villa Lagos' }));
    const details = await screen.findByRole('dialog', { name: 'Villa Lagos' });
    await user.click(within(details).getByRole('button', { name: 'Reserve dates for offline client' }));
    const offlineForm = await screen.findByRole('dialog', { name: 'Reserve dates for Villa Lagos' });
    await openBookingMonth(user, monthName(checkIn));
    await selectDate(user, checkIn);
    await selectDate(user, checkOut);
    await user.type(within(offlineForm).getByLabelText('Offline guest name (optional)'), 'Offline guest test');
    await user.click(within(offlineForm).getByRole('button', { name: 'Book now / reserve dates' }));

    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem('clariva.reservations.v1'));
      expect(saved.at(-1)).toMatchObject({
        guest: 'offline',
        offlineGuestName: 'Offline guest test',
        offlineBooking: true,
        bookedByRole: 'owner',
        bookedById: 'O1',
        listing: 'L1',
        in: toISODate(checkIn),
        out: toISODate(checkOut),
        status: 'confirmed',
        channel: 'Offline',
      });
    });
    expect(screen.getByRole('status').textContent).toContain('Dates reserved for an offline client');

    await user.click(screen.getByRole('button', { name: 'Agent', exact: true }));
    await user.click(screen.getByRole('button', { name: 'Calendar' }));
    for (let index = 0; index < calendarPagesTo(checkIn); index += 1) {
      await user.click(screen.getByRole('button', { name: 'Next 28 days' }));
    }
    const agentHold = screen.getByRole('button', { name: new RegExp(`Offline hold · Adaeze Nwosu, Villa Lagos,`) });
    expect(agentHold).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Client', exact: true }));
    await user.click(screen.getByRole('button', { name: 'Calendar' }));
    const clientHold = screen.getByRole('button', { name: new RegExp(`Reserved, Villa Lagos,`) });
    expect(clientHold.getAttribute('aria-label')).not.toContain('Adaeze');
    expect(clientHold.getAttribute('aria-label')).not.toContain('Offline guest test');

    await user.click(screen.getByRole('button', { name: 'Explore Stays' }));
    await user.click(screen.getByRole('button', { name: 'Villa Lagos', exact: true }));
    const clientListing = await screen.findByRole('dialog', { name: 'Villa Lagos' });
    await user.click(within(clientListing).getByRole('button', { name: 'Book now' }));
    await openBookingMonth(user, monthName(checkIn));
    const dayName = checkIn.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    expect(screen.getByRole('button', { name: new RegExp(`^${dayName}, reserved`) }).disabled).toBe(true);
  }, 25000);

  it('saves listing perks and guest-guide details, then accepts a review for a completed stay', async () => {
    const tomorrow = isoOffsetFromToday(1);
    const checkout = isoOffsetFromToday(4);
    const listings = LISTINGS.map((listing) => (
      listing.id === 'L1'
        ? { ...listing, amenities: [], guestGuide: {} }
        : listing
    ));
    const reservations = [
      ...RESERVATIONS,
      {
        id: 'RES-22301',
        guest: 'G1',
        listing: 'L1',
        in: tomorrow,
        out: checkout,
        channel: 'Direct',
        status: 'confirmed',
        paid: 660,
        paidStatus: 'Paid',
        request: '—',
        guestCount: 2,
        tasks: [],
      },
    ];
    window.localStorage.setItem('clariva.listings.v1', JSON.stringify(listings));
    window.localStorage.setItem('clariva.reservations.v1', JSON.stringify(reservations));
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Owner', exact: true }));
    await user.click(screen.getByRole('button', { name: 'Listings' }));
    const listingCard = screen.getByText('Villa Lagos').closest('.listing-card');
    await user.click(within(listingCard).getByRole('button', { name: 'Edit listing' }));
    const editDialog = await screen.findByRole('dialog', { name: 'Edit Villa Lagos' });
    await user.type(within(editDialog).getByLabelText(/Features & perks/), 'Wi-Fi{Enter}Snooker table{Enter}Large pool');
    await user.type(within(editDialog).getByLabelText('Check-in instructions'), 'Collect keys from the lockbox.');
    await user.type(within(editDialog).getByLabelText('Check-out instructions'), 'Leave keys on the entry table.');
    await user.type(within(editDialog).getByLabelText('Wi-Fi network'), 'Clariva Guest');
    await user.type(within(editDialog).getByLabelText('Wi-Fi password'), 'poolside-secret');
    await user.type(within(editDialog).getByLabelText('Arrival and access details'), 'Use the side entrance.');
    await user.type(within(editDialog).getByLabelText('House rules'), 'No smoking indoors.');
    await user.type(within(editDialog).getByLabelText('Local tips'), 'Try the waterfront market.');
    await user.click(within(editDialog).getByRole('button', { name: 'Save changes' }));
    expect(JSON.parse(window.localStorage.getItem('clariva.listings.v1')).find((listing) => listing.id === 'L1')).toMatchObject({
      amenities: ['Wi-Fi', 'Snooker table', 'Large pool'],
      guestGuide: {
        checkIn: 'Collect keys from the lockbox.',
        checkOut: 'Leave keys on the entry table.',
        wifiName: 'Clariva Guest',
        wifiPassword: 'poolside-secret',
        instructions: 'Use the side entrance.',
        houseRules: 'No smoking indoors.',
        localTips: 'Try the waterfront market.',
      },
    });

    await user.click(screen.getByRole('button', { name: 'Client', exact: true }));
    await user.click(screen.getByRole('button', { name: 'My Stays' }));
    const upcomingStay = within(screen.getByText('RES-22301').closest('article'));
    await user.click(upcomingStay.getByText('Guest guide'));
    expect(screen.getByText('Clariva Guest')).toBeTruthy();
    expect(screen.getByText('poolside-secret')).toBeTruthy();
    expect(screen.getByText('Collect keys from the lockbox.')).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox', { name: 'Select client account' }), { target: { value: 'G2' } });
    expect(screen.queryByText('poolside-secret')).toBeNull();
    fireEvent.change(screen.getByRole('combobox', { name: 'Select client account' }), { target: { value: 'G1' } });

    const pastStay = within(screen.getByText('RES-10482').closest('article'));
    await user.click(pastStay.getByRole('button', { name: 'Leave a review' }));
    await user.type(pastStay.getByLabelText('Your review'), 'Wonderful stay and thoughtful host.');
    await user.click(pastStay.getByRole('button', { name: 'Submit review' }));
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem('clariva.reviews.v1'))).toMatchObject([{
      reservationId: 'RES-10482',
      guest: 'G1',
      listing: 'L1',
      rating: 5,
      comment: 'Wonderful stay and thoughtful host.',
    }]));

    await user.click(screen.getByRole('button', { name: 'Agent', exact: true }));
    await user.click(screen.getByRole('button', { name: 'Listings' }));
    await user.click(screen.getByRole('button', { name: 'Villa Lagos', exact: true }));
    const details = await screen.findByRole('dialog', { name: 'Villa Lagos' });
    expect(within(details).getByText(/5.0\/5/)).toBeTruthy();
    expect(within(details).getByText('Wonderful stay and thoughtful host.')).toBeTruthy();
    const resizeHandle = within(details).getByRole('button', { name: 'Resize listing details panel' });
    const previousWidth = Number(resizeHandle.getAttribute('aria-valuenow'));
    fireEvent.keyDown(resizeHandle, { key: 'ArrowLeft' });
    expect(Number(resizeHandle.getAttribute('aria-valuenow'))).toBe(previousWidth + 40);
    await user.click(within(details).getByRole('button', { name: 'Expand listing details' }));
    expect(details.classList.contains('expanded')).toBe(true);
    await user.click(within(details).getByRole('button', { name: 'Restore listing details panel' }));
    expect(details.classList.contains('expanded')).toBe(false);
  }, 25000);

  it('filters the portfolio calendar by property, owner, agent and reservation status', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Calendar' }));
    expect(screen.getByRole('button', { name: /Sarah Johnson, Villa Lagos/ })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Filter calendar by property'), { target: { value: 'L3' } });
    fireEvent.change(screen.getByLabelText('Filter calendar by reservation status'), { target: { value: 'pending' } });
    expect(screen.getByRole('button', { name: /Tom Becker, Beach House/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Sarah Johnson, Villa Lagos/ })).toBeNull();
    fireEvent.change(screen.getByLabelText('Filter calendar by owner'), { target: { value: 'O3' } });
    fireEvent.change(screen.getByLabelText('Filter calendar by agent'), { target: { value: 'A2' } });
    expect(screen.getByText('No listings match these filters.')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Filter calendar by agent'), { target: { value: 'A1' } });
    expect(screen.getByRole('button', { name: /Tom Becker, Beach House/ })).toBeTruthy();
  });

  it('creates/removes maintenance blocks, blocks client availability and audits both changes', async () => {
    const { checkIn, checkOut } = getFutureStay();
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Owner', exact: true }));
    await user.click(screen.getByRole('button', { name: 'Listings' }));
    const listingCard = screen.getByText('Villa Lagos').closest('.listing-card');
    await user.click(within(listingCard).getByRole('button', { name: 'Villa Lagos' }));
    const details = await screen.findByRole('dialog', { name: 'Villa Lagos' });
    await user.click(within(details).getByRole('button', { name: 'Block maintenance dates' }));
    const maintenanceForm = await screen.findByRole('dialog', { name: 'Block maintenance dates' });
    await openBookingMonth(user, monthName(checkIn));
    await selectDate(user, checkIn);
    await selectDate(user, checkOut);
    await user.type(within(maintenanceForm).getByLabelText('Reason (optional)'), 'Pool repairs');
    await user.click(within(maintenanceForm).getByRole('button', { name: 'Block selected dates' }));

    await waitFor(() => expect(JSON.parse(window.localStorage.getItem('clariva.maintenance-blocks.v1'))).toMatchObject([{
      listing: 'L1',
      in: toISODate(checkIn),
      out: toISODate(checkOut),
      reason: 'Pool repairs',
      actorRole: 'owner',
      actorId: 'O1',
    }]));
    expect(JSON.parse(window.localStorage.getItem('clariva.audit-history.v1'))[0]).toMatchObject({
      entityType: 'maintenance',
      action: 'maintenance-block-created',
      actorRole: 'owner',
    });

    await user.click(screen.getByRole('button', { name: 'Client', exact: true }));
    await user.click(screen.getByRole('button', { name: 'Explore Stays' }));
    await user.click(screen.getByRole('button', { name: 'Villa Lagos', exact: true }));
    const clientDetails = await screen.findByRole('dialog', { name: 'Villa Lagos' });
    await user.click(within(clientDetails).getByRole('button', { name: 'Book now' }));
    await openBookingMonth(user, monthName(checkIn));
    const dayName = checkIn.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    expect(screen.getByRole('button', { name: new RegExp(`^${dayName}, reserved`) }).disabled).toBe(true);
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'Owner', exact: true }));
    await user.click(screen.getByRole('button', { name: 'Listings' }));
    const ownerListing = screen.getByText('Villa Lagos').closest('.listing-card');
    await user.click(within(ownerListing).getByRole('button', { name: 'Villa Lagos' }));
    const ownerDetails = await screen.findByRole('dialog', { name: 'Villa Lagos' });
    await user.click(within(ownerDetails).getByRole('button', { name: /Pool repairs/ }));
    const maintenanceDetail = await screen.findByRole('dialog', { name: 'Maintenance block' });
    await user.click(within(maintenanceDetail).getByRole('button', { name: 'Remove maintenance block' }));
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem('clariva.maintenance-blocks.v1'))).toHaveLength(0));
    expect(JSON.parse(window.localStorage.getItem('clariva.audit-history.v1'))[0].action).toBe('maintenance-block-removed');
  }, 25000);

  it('lets managing agents respond to guest reviews and records the reply in the audit history', async () => {
    const review = {
      id: 'review-RES-10482',
      reservationId: 'RES-10482',
      guest: 'G1',
      listing: 'L1',
      rating: 5,
      comment: 'Wonderful stay.',
      createdAt: new Date().toISOString(),
    };
    window.localStorage.setItem('clariva.reviews.v1', JSON.stringify([review]));
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Listings' }));
    const listingCard = screen.getByText('Villa Lagos').closest('.listing-card');
    await user.click(within(listingCard).getByRole('button', { name: 'Villa Lagos' }));
    const details = await screen.findByRole('dialog', { name: 'Villa Lagos' });
    await user.type(within(details).getByLabelText('Reply to review'), 'Thank you for staying with us!');
    await user.click(within(details).getByRole('button', { name: 'Save response' }));
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem('clariva.review-responses.v1'))).toMatchObject([{
      reviewId: review.id,
      listingId: 'L1',
      actorRole: 'agent',
      actorId: 'A1',
      text: 'Thank you for staying with us!',
    }]));
    expect(JSON.parse(window.localStorage.getItem('clariva.audit-history.v1'))[0]).toMatchObject({
      entityType: 'review',
      entityId: review.id,
      action: 'review-response-created',
    });
    await user.click(screen.getByRole('button', { name: 'Client', exact: true }));
    await user.click(screen.getByRole('button', { name: 'Explore Stays' }));
    await user.click(screen.getByRole('button', { name: 'Villa Lagos', exact: true }));
    const clientDetails = await screen.findByRole('dialog', { name: 'Villa Lagos' });
    expect(within(clientDetails).getByText('Thank you for staying with us!')).toBeTruthy();
    expect(within(clientDetails).getByText('Host response')).toBeTruthy();
  }, 15000);

  it('notifies the assigned agent and owner, then shows the client the confirmation', async () => {
    const user = userEvent.setup();
    const app = render(<App />);
    const formDialog = await openBookingForm(user);
    const { checkIn, checkOut } = getFutureStay();
    await submitBookingRequest(user, formDialog, checkIn, checkOut);

    await user.click(screen.getByRole('button', { name: 'Owner', exact: true }));
    expect(screen.getByText(/1 guest request pending/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Reservations' }));
    const ownerRow = screen.getByRole('row', { name: /RES-10492/ });
    expect(within(ownerRow).queryByRole('button', { name: 'Confirm' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Reservations' }).getAttribute('aria-describedby')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Agent', exact: true }));
    expect(screen.getByText(/1 guest request needs your attention/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Reservations' }));
    const agentRow = screen.getByRole('row', { name: /RES-10492/ });
    await user.click(within(agentRow).getByRole('button', { name: 'Accept' }));
    await waitFor(() => expect(agentRow.textContent).toContain('Confirmed'));
    expect(within(agentRow).queryByRole('button', { name: 'Reject' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Client', exact: true }));
    expect(screen.getByText('CONFIRMED STAY')).toBeTruthy();
    expect(screen.getByText(/Confirmed by your agent/)).toBeTruthy();
    expect(screen.getByText(/booking request for Villa Lagos.*was accepted/i)).toBeTruthy();
    const savedNotifications = JSON.parse(window.localStorage.getItem('clariva.client-notifications.v1'));
    expect(savedNotifications).toMatchObject([{
      guest: 'G1',
      reservationId: 'RES-10492',
      status: 'confirmed',
      read: false,
    }]);

    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(screen.getByRole('heading', { name: 'Notifications' })).toBeTruthy();
    expect(screen.getByText(/was accepted/i)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Mark as read' }));
    await waitFor(() => {
      const updatedNotifications = JSON.parse(window.localStorage.getItem('clariva.client-notifications.v1'));
      expect(updatedNotifications[0].read).toBe(true);
    });

    app.unmount();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Client', exact: true }));
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(screen.getByText(/was accepted/i)).toBeTruthy();
  }, 15000);

  it('rejects a date request and releases its dates for another booking', async () => {
    const user = userEvent.setup();
    render(<App />);
    const formDialog = await openBookingForm(user);
    const { checkIn, checkOut } = getFutureStay();
    await submitBookingRequest(user, formDialog, checkIn, checkOut);

    await user.click(screen.getByRole('button', { name: 'Agent', exact: true }));
    await user.click(screen.getByRole('button', { name: 'Reservations' }));
    const requestRow = screen.getByRole('row', { name: /RES-10492/ });
    await user.click(within(requestRow).getByRole('button', { name: 'Reject' }));
    await waitFor(() => expect(requestRow.textContent).toContain('Rejected'));

    await user.click(screen.getByRole('button', { name: 'Client', exact: true }));
    expect(screen.getByText('REQUEST DECLINED')).toBeTruthy();
    expect(screen.getByText(/booking request for Villa Lagos.*was rejected/i)).toBeTruthy();
    expect(JSON.parse(window.localStorage.getItem('clariva.client-notifications.v1'))[0]).toMatchObject({
      guest: 'G1',
      reservationId: 'RES-10492',
      status: 'rejected',
      read: false,
    });
    await user.click(screen.getByRole('button', { name: 'Explore Stays' }));
    await user.click(screen.getByRole('button', { name: 'Villa Lagos', exact: true }));
    const listingDialog = await screen.findByRole('dialog', { name: 'Villa Lagos' });
    await user.click(within(listingDialog).getByRole('button', { name: 'Book now' }));
    await openBookingMonth(user, monthName(checkIn));
    const checkInLabel = checkIn.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const releasedDate = screen.getByRole('button', { name: checkInLabel, exact: true });
    expect(releasedDate.disabled).toBe(false);
    expect(releasedDate.classList.contains('reserved')).toBe(false);
  }, 15000);

  it('lists multiple upcoming and past stays and lets a client request a date change', async () => {
    const firstIn = isoOffsetFromToday(15);
    const firstOut = isoOffsetFromToday(18);
    const nextIn = isoOffsetFromToday(25);
    const nextOut = isoOffsetFromToday(28);
    const pastIn = isoOffsetFromToday(-45);
    const pastOut = isoOffsetFromToday(-42);
    window.localStorage.setItem('clariva.reservations.v1', JSON.stringify([
      { id: 'RES-22001', guest: 'G1', listing: 'L1', in: firstIn, out: firstOut, channel: 'Direct', status: 'confirmed', paid: 660, paidStatus: 'Paid', request: '—', guestCount: 2, tasks: [] },
      { id: 'RES-22002', guest: 'G1', listing: 'L4', in: nextIn, out: nextOut, channel: 'Direct', status: 'confirmed', paid: 390, paidStatus: 'Paid', request: '—', guestCount: 1, tasks: [] },
      { id: 'RES-22003', guest: 'G1', listing: 'L3', in: pastIn, out: pastOut, channel: 'Airbnb', status: 'confirmed', paid: 540, paidStatus: 'Paid', request: '—', guestCount: 3, tasks: [] },
    ]));

    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Client', exact: true }));
    await user.click(screen.getByRole('button', { name: 'My Stays' }));
    expect(screen.getByRole('heading', { name: 'Upcoming stays' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Past stays' })).toBeTruthy();
    expect(screen.getByText('RES-22001')).toBeTruthy();
    expect(screen.getByText('RES-22002')).toBeTruthy();
    expect(screen.getByText('RES-22003')).toBeTruthy();

    const firstStay = within(screen.getByText('RES-22001').closest('article'));
    await user.click(firstStay.getByRole('button', { name: 'Request date change' }));
    const requestedIn = isoOffsetFromToday(20);
    const requestedOut = isoOffsetFromToday(23);
    fireEvent.change(firstStay.getByLabelText('New check-in'), { target: { value: requestedIn } });
    fireEvent.change(firstStay.getByLabelText('New check-out'), { target: { value: requestedOut } });
    await user.click(firstStay.getByRole('button', { name: 'Send date change request' }));

    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem('clariva.reservations.v1'));
      expect(saved.find((reservation) => reservation.id === 'RES-22001').clientAction).toMatchObject({
        type: 'date-change',
        status: 'pending',
        in: requestedIn,
        out: requestedOut,
      });
    });
    expect(screen.getByText('Date change request sent to your agent.')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Agent', exact: true }));
    await user.click(screen.getByRole('button', { name: 'Reservations' }));
    const agentRow = screen.getByRole('row', { name: /RES-22001/ });
    await user.click(within(agentRow).getByRole('button', { name: 'Approve date change' }));
    await waitFor(() => expect(agentRow.textContent).toContain(new Date(`${requestedIn}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })));
    expect(JSON.parse(window.localStorage.getItem('clariva.reservations.v1')).find((reservation) => reservation.id === 'RES-22001')).toMatchObject({
      in: requestedIn,
      out: requestedOut,
      status: 'confirmed',
      clientAction: { type: 'date-change', status: 'approved' },
    });
    expect(JSON.parse(window.localStorage.getItem('clariva.client-notifications.v1'))).toMatchObject([{
      guest: 'G1',
      reservationId: 'RES-22001',
      status: 'date-changed',
      read: false,
    }]);

    await user.click(screen.getByRole('button', { name: 'Client', exact: true }));
    expect(screen.getByText(/Date change approved/)).toBeTruthy();
    expect(screen.getByText(/date change request for Villa Lagos.*was changed/i)).toBeTruthy();
  }, 15000);

  it('lets an agent approve cancellation and notifies the client', async () => {
    const checkIn = isoOffsetFromToday(20);
    const checkOut = isoOffsetFromToday(23);
    window.localStorage.setItem('clariva.reservations.v1', JSON.stringify([{
      id: 'RES-22101',
      guest: 'G1',
      listing: 'L1',
      in: checkIn,
      out: checkOut,
      channel: 'Direct',
      status: 'confirmed',
      paid: 660,
      paidStatus: 'Paid',
      request: '—',
      guestCount: 2,
      tasks: [],
    }]));
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Client', exact: true }));
    await user.click(screen.getByRole('button', { name: 'My Stays' }));
    const stay = within(screen.getByText('RES-22101').closest('article'));
    await user.click(stay.getByRole('button', { name: 'Request cancellation' }));
    await user.click(stay.getByRole('button', { name: 'Send cancellation request' }));
    expect(JSON.parse(window.localStorage.getItem('clariva.reservations.v1'))[0].clientAction).toMatchObject({
      type: 'cancellation',
      status: 'pending',
    });

    await user.click(screen.getByRole('button', { name: 'Agent', exact: true }));
    await user.click(screen.getByRole('button', { name: 'Reservations' }));
    const row = screen.getByRole('row', { name: /RES-22101/ });
    await user.click(within(row).getByRole('button', { name: 'Approve cancellation' }));
    await waitFor(() => expect(row.textContent).toContain('Cancelled'));
    expect(JSON.parse(window.localStorage.getItem('clariva.reservations.v1'))[0]).toMatchObject({
      status: 'cancelled',
      clientAction: { type: 'cancellation', status: 'approved' },
    });

    await user.click(screen.getByRole('button', { name: 'Client', exact: true }));
    expect(screen.getByText(/Cancellation approved/)).toBeTruthy();
    expect(screen.getByText(/cancellation request for Villa Lagos.*was cancelled/i)).toBeTruthy();
  }, 15000);

  it('blocks conflicting date changes and preserves the stay when an agent rejects a request', async () => {
    const firstIn = isoOffsetFromToday(15);
    const firstOut = isoOffsetFromToday(18);
    const conflictIn = isoOffsetFromToday(25);
    const conflictOut = isoOffsetFromToday(28);
    window.localStorage.setItem('clariva.reservations.v1', JSON.stringify([
      { id: 'RES-22201', guest: 'G1', listing: 'L1', in: firstIn, out: firstOut, channel: 'Direct', status: 'confirmed', paid: 660, paidStatus: 'Paid', request: '—', guestCount: 2, tasks: [] },
      { id: 'RES-22202', guest: 'G2', listing: 'L1', in: conflictIn, out: conflictOut, channel: 'Direct', status: 'confirmed', paid: 660, paidStatus: 'Paid', request: '—', guestCount: 2, tasks: [] },
    ]));
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Client', exact: true }));
    await user.click(screen.getByRole('button', { name: 'My Stays' }));
    const stay = within(screen.getByText('RES-22201').closest('article'));
    await user.click(stay.getByRole('button', { name: 'Request date change' }));
    fireEvent.change(stay.getByLabelText('New check-in'), { target: { value: conflictIn } });
    fireEvent.change(stay.getByLabelText('New check-out'), { target: { value: conflictOut } });
    await user.click(stay.getByRole('button', { name: 'Send date change request' }));
    expect(screen.getByText('Those dates are unavailable for this listing. Choose another range.')).toBeTruthy();
    expect(JSON.parse(window.localStorage.getItem('clariva.reservations.v1'))[0].clientAction).toBeUndefined();

    fireEvent.change(stay.getByLabelText('New check-in'), { target: { value: isoOffsetFromToday(20) } });
    fireEvent.change(stay.getByLabelText('New check-out'), { target: { value: isoOffsetFromToday(23) } });
    await user.click(stay.getByRole('button', { name: 'Send date change request' }));
    await user.click(screen.getByRole('button', { name: 'Agent', exact: true }));
    await user.click(screen.getByRole('button', { name: 'Reservations' }));
    const row = screen.getByRole('row', { name: /RES-22201/ });
    await user.click(within(row).getByRole('button', { name: 'Reject request' }));
    await user.click(screen.getByRole('button', { name: 'Client', exact: true }));
    expect(screen.getByText(/Date change request for .* was not approved/)).toBeTruthy();
    expect(screen.getByText(/date change request for Villa Lagos.*was not approved/i)).toBeTruthy();
    expect(JSON.parse(window.localStorage.getItem('clariva.reservations.v1'))[0]).toMatchObject({
      in: firstIn,
      out: firstOut,
      status: 'confirmed',
      clientAction: { type: 'date-change', status: 'rejected' },
    });
    expect(JSON.parse(window.localStorage.getItem('clariva.client-notifications.v1'))[0]).toMatchObject({
      guest: 'G1',
      status: 'date-change-rejected',
      read: false,
    });
  }, 15000);

  it('disables reserved nights on that listing in the booking date picker', async () => {
    const user = userEvent.setup();
    const { checkIn, checkOut } = getFutureStay();
    const checkInISO = toISODate(checkIn);
    const checkOutISO = toISODate(checkOut);
    window.localStorage.setItem('clariva.reservations.v1', JSON.stringify([{
      id: 'RES-10999',
      guest: 'G2',
      listing: 'L1',
      in: checkInISO,
      out: checkOutISO,
      channel: 'Direct',
      status: 'pending',
      paid: 0,
      paidStatus: 'Pending',
      request: '—',
      tasks: [],
    }]));
    render(<App />);
    const formDialog = await openBookingForm(user);
    await openBookingMonth(user, monthName(checkIn));
    const lastReservedNight = new Date(checkOut);
    lastReservedNight.setDate(lastReservedNight.getDate() - 1);
    const dayName = (date) => date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    expect(screen.getByRole('button', { name: new RegExp(`^${dayName(checkIn)}, reserved`) }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: new RegExp(`^${dayName(lastReservedNight)}, reserved`) }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: new RegExp(`^${dayName(checkOut)}`) }).disabled).toBe(false);
    expect(formDialog).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Go back' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Villa Lagos' })).getByRole('button', { name: 'Close details panel' }));
    await user.click(screen.getByRole('button', { name: 'Apartment 4', exact: true }));
    const otherListingDialog = await screen.findByRole('dialog', { name: 'Apartment 4' });
    await user.click(within(otherListingDialog).getByRole('button', { name: 'Book now' }));
    await openBookingMonth(user, monthName(checkIn));
    expect(screen.getByRole('button', { name: new RegExp(`^${dayName(checkIn)}`) }).disabled).toBe(false);
  }, 15000);

  it('updates the booking picker when another tab reserves a stay', async () => {
    const user = userEvent.setup();
    const { checkIn, checkOut } = getFutureStay();
    render(<App />);
    await openBookingForm(user);
    await openBookingMonth(user, monthName(checkIn));

    const dayName = (date) => date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const firstOfFebruary = screen.getByRole('button', { name: new RegExp(`^${dayName(checkIn)}$`) });
    expect(firstOfFebruary.disabled).toBe(false);
    const reservation = {
      id: 'RES-10998',
      guest: 'G2',
      listing: 'L1',
      in: toISODate(checkIn),
      out: toISODate(checkOut),
      channel: 'Direct',
      status: 'pending',
      paid: 0,
      paidStatus: 'Pending',
      request: '—',
      tasks: [],
    };
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'clariva.reservations.v1',
      newValue: JSON.stringify([reservation]),
    }));

    await waitFor(() => expect(firstOfFebruary.disabled).toBe(true));
    expect(screen.getByRole('button', { name: new RegExp(`^${dayName(checkIn)}, reserved`) })).toBe(firstOfFebruary);
  });

  it('sends agent replies and persists task completion', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Inbox/ }));

    const reply = screen.getByRole('textbox', { name: 'Write a reply' });
    await user.click(screen.getByRole('button', { name: '✨ Suggest reply' }));
    expect(reply.value).toContain('Hi Sarah');
    await user.clear(reply);
    await user.type(reply, 'QA-free reply check');
    await user.click(screen.getByRole('button', { name: 'Send', exact: true }));
    expect(document.querySelector('.thread-messages').textContent).toContain('QA-free reply check');
    await waitFor(() => {
      const conversations = JSON.parse(window.localStorage.getItem('clariva.conversations.v1'));
      expect(conversations.find((thread) => thread.guest === 'G1').messages.at(-1).text).toBe('QA-free reply check');
    });

    await user.click(screen.getByRole('button', { name: /Tasks/ }));
    const task = screen.getByRole('button', { name: 'Mark incomplete: Pre-arrival inspection' });
    await user.click(task);
    expect(task.getAttribute('aria-pressed')).toBe('false');
    await waitFor(() => {
      const reservations = JSON.parse(window.localStorage.getItem('clariva.reservations.v1'));
      expect(reservations[0].tasks[0].done).toBe(false);
    });
  });

  it('sends an owner notice to the selected agent and exposes it in the agent portal', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Owner', exact: true }));
    await user.click(screen.getByRole('button', { name: 'Agent Hub' }));
    await user.click(screen.getAllByRole('button', { name: 'Message', exact: true })[0]);

    const target = screen.getByRole('combobox', { name: 'Send notice to' });
    expect(target.value).toBe('A1');
    await user.type(screen.getByRole('textbox', { name: 'Notice message' }), 'Maintenance update');
    await user.click(screen.getByRole('button', { name: 'Send notice' }));
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem('clariva.notices.v1')).at(-1)).toMatchObject({
        ownerId: 'O1',
        agentId: 'A1',
        text: 'Maintenance update',
      });
    });

    await user.click(screen.getByRole('button', { name: 'Agent', exact: true }));
    await user.click(screen.getByRole('button', { name: 'Notices' }));
    expect(await screen.findByText('Maintenance update')).toBeTruthy();
  });

  it('validates and persists listing edits', async () => {
    const user = userEvent.setup();
    const app = render(<App />);
    await user.click(screen.getByRole('button', { name: '+ Add listing' }));
    await user.type(screen.getByLabelText('Building / apartment name'), 'Courtyard Studio');
    await user.type(screen.getByLabelText('Type'), 'Studio');
    fireEvent.change(screen.getByLabelText('Nightly rate ($)'), { target: { value: '0' } });
    await user.click(screen.getByRole('button', { name: 'Add listing', exact: true }));
    expect(screen.getByRole('status').textContent).toContain('greater than zero');
    expect(window.localStorage.getItem('clariva.listings.v1')).toBeNull();

    fireEvent.change(screen.getByLabelText('Nightly rate ($)'), { target: { value: '150' } });
    await user.click(screen.getByRole('button', { name: 'Add listing', exact: true }));
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem('clariva.listings.v1')).at(-1)).toMatchObject({
        name: 'Courtyard Studio',
        type: 'Studio',
        rate: 150,
      });
    });

    app.unmount();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Listings' }));
    expect(await screen.findByRole('button', { name: 'Courtyard Studio' })).toBeTruthy();
  });

  it('supports keyboard search and gives the drawer modal semantics', async () => {
    const user = userEvent.setup();
    render(<App />);
    const search = screen.getByRole('combobox', { name: 'Search reservations, guests, listings…' });
    await user.type(search, 'Villa');
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockImplementation(function getClientRects() {
      return window.getComputedStyle(this).display === 'none' ? [] : [{}];
    });
    await user.keyboard('{Enter}');

    const dialog = await screen.findByRole('dialog', { name: 'Villa Lagos' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.contains(document.activeElement)).toBe(true);
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(dialog.contains(document.activeElement)).toBe(true);
    await user.keyboard('{Tab}');
    expect(dialog.contains(document.activeElement)).toBe(true);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Villa Lagos' })).toBeNull());
    expect(document.activeElement).toBe(search);
  });
});
