import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AGENTS,
  BRAND_TAG,
  CAL_DAYS,
  CAL_START,
  CHANNEL_COLOR,
  FIELD_MESSAGES_SEED,
  FIELD_STAFF,
  GUESTS,
  INBOX_THREADS,
  LISTINGS,
  MAINTENANCE_BLOCKS_SEED,
  NAV_CONFIG,
  NOTICES,
  OWNERS,
  PHOTO_TINTS,
  SEARCH_LABEL,
} from './data';
import Icon from './components/Icon';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import DashboardView from './components/DashboardView';
import CalendarView from './components/CalendarView';
import Drawer from './components/Drawer';
import AgentViews from './views/AgentViews';
import OwnerViews from './views/OwnerViews';
import ClientViews from './views/ClientViews';
import FieldViews from './views/FieldViews';
import { createInitialConversations, isConversationArray } from './state/conversations';
import { isRecordArray, usePersistentState } from './state/persistence';
import { useReservations } from './state/reservations';

const INITIAL_ROLE = 'agent';

function dayIndex(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  const diff = d.getTime() - CAL_START.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function fmtDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ownerById(id) {
  return OWNERS.find((o) => o.id === id);
}

function agentById(id) {
  return AGENTS.find((a) => a.id === id);
}

function fieldStaffById(id) {
  return FIELD_STAFF.find((f) => f.id === id);
}

function guestById(id) {
  return GUESTS.find((g) => g.id === id);
}

function listingById(id) {
  return LISTINGS.find((l) => l.id === id);
}

function ownerLabel(listing) {
  if (listing.ownerId) {
    const owner = ownerById(listing.ownerId);
    if (owner) return owner.name;
  }

  return listing.ownerName ? `${listing.ownerName} (no Clariva account)` : 'No owner account — managed directly by agent';
}

function isListingArray(value) {
  return isRecordArray(value) && value.every((listing) => (
    typeof listing.id === 'string'
    && typeof listing.name === 'string'
    && typeof listing.type === 'string'
    && Number.isFinite(listing.rate)
    && typeof listing.agentId === 'string'
    && Array.isArray(listing.photos)
    && listing.photos.every((photo) => (
      photo !== null
      && typeof photo === 'object'
      && typeof photo.type === 'string'
      && (photo.src === undefined || typeof photo.src === 'string')
      && (photo.label === undefined || typeof photo.label === 'string')
    ))
    && (listing.amenities === undefined || (
      Array.isArray(listing.amenities) && listing.amenities.every((amenity) => typeof amenity === 'string')
    ))
    && (listing.guestGuide === undefined || (
      listing.guestGuide !== null
      && typeof listing.guestGuide === 'object'
      && ['checkIn', 'checkOut', 'wifiName', 'wifiPassword', 'instructions', 'houseRules', 'localTips']
        .every((key) => listing.guestGuide[key] === undefined || typeof listing.guestGuide[key] === 'string')
    ))
  ));
}

function isReviewArray(value) {
  return isRecordArray(value) && value.every((review) => (
    typeof review.id === 'string'
    && typeof review.reservationId === 'string'
    && typeof review.guest === 'string'
    && typeof review.listing === 'string'
    && Number.isInteger(review.rating)
    && review.rating >= 1
    && review.rating <= 5
    && typeof review.comment === 'string'
    && typeof review.createdAt === 'string'
  ));
}

function isMaintenanceBlockArray(value) {
  return isRecordArray(value) && value.every((block) => (
    typeof block.id === 'string'
    && typeof block.listing === 'string'
    && typeof block.in === 'string'
    && typeof block.out === 'string'
    && typeof block.reason === 'string'
    && typeof block.createdAt === 'string'
    && typeof block.actorRole === 'string'
    && typeof block.actorId === 'string'
  ));
}

function isAuditArray(value) {
  return isRecordArray(value) && value.every((entry) => (
    typeof entry.id === 'string'
    && typeof entry.entityType === 'string'
    && typeof entry.entityId === 'string'
    && typeof entry.listingId === 'string'
    && typeof entry.action === 'string'
    && typeof entry.actorRole === 'string'
    && typeof entry.actorId === 'string'
    && typeof entry.details === 'string'
    && typeof entry.createdAt === 'string'
  ));
}

function isReviewResponseArray(value) {
  return isRecordArray(value) && value.every((response) => (
    typeof response.id === 'string'
    && typeof response.reviewId === 'string'
    && typeof response.listingId === 'string'
    && typeof response.actorRole === 'string'
    && typeof response.actorId === 'string'
    && typeof response.text === 'string'
    && typeof response.createdAt === 'string'
  ));
}

function isNoticeArray(value) {
  return isRecordArray(value) && value.every((notice) => (
    typeof notice.id === 'string'
    && typeof notice.ownerId === 'string'
    && typeof notice.agentId === 'string'
    && typeof notice.text === 'string'
    && typeof notice.date === 'string'
  ));
}

function App() {
  const [currentRole, setCurrentRole] = useState(INITIAL_ROLE);
  const [currentOwner, setCurrentOwner] = useState('O1');
  const [currentGuestClient, setCurrentGuestClient] = useState('G1');
  const [currentAgent, setCurrentAgent] = useState('A1');
  const [currentStaff, setCurrentStaff] = useState('F1');
  const [fieldMessages, setFieldMessages] = useState(() => {
    try {
      const raw = window.localStorage.getItem('clariva.field-messages.v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { /* ignore */ }
    return FIELD_MESSAGES_SEED;
  });
  useEffect(() => {
    try {
      window.localStorage.setItem('clariva.field-messages.v1', JSON.stringify(fieldMessages));
    } catch (e) { /* ignore */ }
  }, [fieldMessages]);
  const [ownerJobUpdates, setOwnerJobUpdates] = useState(() => {
    try {
      const raw = window.localStorage.getItem('clariva.owner-job-updates.v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { /* ignore */ }
    return [];
  });
  useEffect(() => {
    try {
      window.localStorage.setItem('clariva.owner-job-updates.v1', JSON.stringify(ownerJobUpdates));
    } catch (e) { /* ignore */ }
  }, [ownerJobUpdates]);

  const notifyPeople = ({ title, body, whatsappText, phone }) => {
    // Browser notification (if allowed)
    try {
      if (typeof Notification !== 'undefined') {
        if (Notification.permission === 'granted') {
          new Notification(title, { body, silent: false });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((perm) => {
            if (perm === 'granted') new Notification(title, { body });
          });
        }
      }
    } catch (e) { /* ignore */ }
    // WhatsApp deep link (opens chat with prefilled text — user sends)
    if (whatsappText) {
      try {
        const digits = String(phone || '').replace(/\D/g, '') || '';
        const url = digits
          ? `https://wa.me/${digits}?text=${encodeURIComponent(whatsappText)}`
          : `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
        window.__clarivaLastWhatsApp = url;
      } catch (e) { /* ignore */ }
    }
  };


  const [calendarStart, setCalendarStart] = useState(CAL_START);
  const [activeView, setActiveView] = useState('dashboard');
  const [drawerStack, setDrawerStack] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [listings, setListings, listingsStorageError] = usePersistentState('clariva.listings.v1', LISTINGS, isListingArray);
  const {
    reservations,
    setReservations,
    createReservation,
    decideReservation,
    syncError: reservationsSyncError,
  } = useReservations();
  const [notices, setNotices, noticesStorageError] = usePersistentState('clariva.notices.v1', NOTICES, isNoticeArray);
  const [clientNotifications, setClientNotifications, clientNotificationsStorageError] = usePersistentState(
    'clariva.client-notifications.v1',
    [],
    (value) => isRecordArray(value) && value.every((notification) => (
      typeof notification.id === 'string'
      && typeof notification.guest === 'string'
      && typeof notification.reservationId === 'string'
      && typeof notification.listingId === 'string'
      && ['confirmed', 'rejected', 'cancelled', 'date-changed', 'cancellation-rejected', 'date-change-rejected'].includes(notification.status)
      && typeof notification.message === 'string'
      && typeof notification.createdAt === 'string'
      && typeof notification.read === 'boolean'
    )),
  );
  const [reviews, setReviews, reviewsStorageError] = usePersistentState('clariva.reviews.v1', [], isReviewArray);
  const [reviewResponses, setReviewResponses, reviewResponsesStorageError] = usePersistentState('clariva.review-responses.v1', [], isReviewResponseArray);
  const [maintenanceBlocks, setMaintenanceBlocks, maintenanceStorageError] = usePersistentState('clariva.maintenance-blocks.v1', MAINTENANCE_BLOCKS_SEED, isMaintenanceBlockArray);
  const [auditHistory, setAuditHistory, auditStorageError] = usePersistentState('clariva.audit-history.v1', [], isAuditArray);
  const [conversations, setConversations, conversationsStorageError] = usePersistentState(
    'clariva.conversations.v1',
    createInitialConversations(INBOX_THREADS),
    isConversationArray,
  );
  const [activeThreadGuest, setActiveThreadGuest] = useState('G1');
  const [editDraft, setEditDraft] = useState(null);
  const [editGalleryIndex, setEditGalleryIndex] = useState(0);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  useEffect(() => {
    if (!statusMessage) return undefined;
    const t = window.setTimeout(() => setStatusMessage(''), 8000);
    return () => window.clearTimeout(t);
  }, [statusMessage]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [noticeTarget, setNoticeTarget] = useState('all');

  const listingById = useCallback((id) => listings.find((listing) => listing.id === id), [listings]);
  const resById = useCallback((id) => reservations.find((reservation) => reservation.id === id), [reservations]);
  const storageErrors = [
    listingsStorageError,
    noticesStorageError,
    clientNotificationsStorageError,
    reviewsStorageError,
    reviewResponsesStorageError,
    maintenanceStorageError,
    auditStorageError,
    conversationsStorageError,
  ].filter(Boolean);
  const reservationError = reservationsSyncError;
  const calendarReservations = useMemo(() => [
    ...reservations,
    ...maintenanceBlocks.map((block) => ({
      ...block,
      guest: '',
      channel: 'Maintenance',
      status: 'confirmed',
      maintenanceBlock: true,
      paid: 0,
      tasks: [],
    })),
  ], [maintenanceBlocks, reservations]);

  const recordAudit = (entry) => {
    const createdAt = new Date().toISOString();
    setAuditHistory((previous) => [{
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      actorRole: currentRole,
      actorId: currentRole === 'owner' ? currentOwner : currentRole === 'agent' ? currentAgent : currentGuestClient,
      createdAt,
    }, ...previous].slice(0, 1000));
  };

  const ownerListings = useMemo(() => listings.filter((l) => l.ownerId === currentOwner), [currentOwner, listings]);
  const ownerReservations = useMemo(() => {
    const ids = ownerListings.map((l) => l.id);
    return reservations.filter((r) => ids.includes(r.listing));
  }, [ownerListings, reservations]);
  const ownerAgents = useMemo(() => {
    const ids = [...new Set(ownerListings.map((l) => l.agentId))];
    return ids.map(agentById).filter(Boolean);
  }, [ownerListings]);

  const agentListings = useMemo(() => listings.filter((l) => l.agentId === currentAgent), [currentAgent, listings]);
  const agentReservations = useMemo(() => {
    const ids = new Set(agentListings.map((listing) => listing.id));
    return reservations.filter((reservation) => ids.has(reservation.listing));
  }, [agentListings, reservations]);
  const reservationsForRole = currentRole === 'owner'
    ? ownerReservations
    : currentRole === 'agent'
      ? agentReservations
      : reservations.filter((reservation) => reservation.guest === currentGuestClient);
  const hasPendingClientAction = (reservation) => reservation.clientAction?.status === 'pending';
  const pendingAgentRequests = agentReservations.filter((reservation) => (
    (reservation.dateReserved && reservation.status === 'pending') || hasPendingClientAction(reservation)
  ));
  const pendingOwnerRequests = ownerReservations.filter((reservation) => (
    (reservation.dateReserved && reservation.status === 'pending') || hasPendingClientAction(reservation)
  ));
  const unreadClientNotifications = clientNotifications.filter((notification) => (
    notification.guest === currentGuestClient && !notification.read
  ));
  const agentOwners = useMemo(() => {
    const ids = [...new Set(agentListings.map((l) => l.ownerId).filter(Boolean))];
    return ids.map(ownerById).filter(Boolean);
  }, [agentListings]);

  const receivedNoticesForAgent = useMemo(() => {
    const ownerIds = new Set(agentListings.map((l) => l.ownerId));
    return notices.filter((n) => ownerIds.has(n.ownerId) && (n.agentId === currentAgent || n.agentId === 'all'));
  }, [agentListings, notices, currentAgent]);

  const conversationThreads = useMemo(() => INBOX_THREADS.map((thread) => {
    const conversation = conversations.find((item) => item.guest === thread.guest);
    const lastMessage = conversation?.messages.at(-1);
    return {
      ...thread,
      last: lastMessage?.text || thread.last,
      unread: conversation?.unread ?? thread.unread,
    };
  }), [conversations]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (query.length < 2) return [];

    const results = [];
    const visibleListings = currentRole === 'owner' ? ownerListings : listings;
    const visibleReservations = currentRole === 'agent'
      ? reservations
      : currentRole === 'owner'
        ? ownerReservations
        : reservations.filter((reservation) => reservation.guest === currentGuestClient);

    visibleListings.forEach((listing) => {
      if (`${listing.name} ${listing.type}`.toLocaleLowerCase().includes(query)) {
        results.push({ type: 'listing', id: listing.id, label: listing.name, detail: `Listing · ${listing.type}` });
      }
    });

    if (currentRole === 'agent') {
      GUESTS.forEach((guest) => {
        if (`${guest.name} ${guest.contact}`.toLocaleLowerCase().includes(query)) {
          results.push({ type: 'guest', id: guest.id, label: guest.name, detail: 'Guest' });
        }
      });
    }

    visibleReservations.forEach((reservation) => {
      const guest = guestById(reservation.guest);
      const listing = listingById(reservation.listing);
      if (`${reservation.id} ${guest?.name || ''} ${listing?.name || ''}`.toLocaleLowerCase().includes(query)) {
        results.push({ type: 'reservation', id: reservation.id, label: reservation.id, detail: `${guest?.name || 'Guest'} · ${listing?.name || 'Listing'}` });
      }
    });

    return results.slice(0, 8);
  }, [currentGuestClient, currentRole, listingById, listings, ownerListings, ownerReservations, reservations, searchQuery]);

  const go = (view) => {
    setActiveView(view);
    setDrawerStack([]);
    setIsSidebarOpen(false);
  };

  const setRole = (role) => {
    setCurrentRole(role);
    setDrawerStack([]);
    setIsSidebarOpen(false);
    const nextView = role === 'agent'
      ? 'dashboard'
      : role === 'owner'
        ? 'owner-dashboard'
        : role === 'field'
          ? 'field-today'
          : 'client-booking';
    setActiveView(nextView);
  };

  const closeDrawer = useCallback(() => {
    setDrawerStack([]);
    setBookingError('');
  }, []);

  const openGuestThread = (guestId) => {
    closeDrawer();
    setActiveView('inbox');
    setActiveThreadGuest(guestId);
  };

  const openReservation = (id) => {
    setDrawerStack((stack) => [...stack, { type: 'reservation', id }]);
  };

  const openGuest = (id) => {
    setDrawerStack((stack) => [...stack, { type: 'guest', id }]);
  };

  const openListing = (id) => {
    setDrawerStack((stack) => [...stack, { type: 'listing', id }]);
  };

  const startOfflineReservation = (listingId) => {
    setBookingError('');
    setDrawerStack((stack) => [...stack, { type: 'offline-reservation', id: listingId }]);
  };

  const startMaintenanceBlock = (listingId = '') => {
    setBookingError('');
    setDrawerStack((stack) => [...stack, { type: 'maintenance-block', id: listingId || 'all' }]);
  };

  const createMaintenanceBlock = (event, selectedListingId) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const listingId = selectedListingId || String(formData.get('maintenance-listing-id') || '');
    const checkIn = String(formData.get('check-in') || '');
    const checkOut = String(formData.get('check-out') || '');
    const reason = String(formData.get('maintenance-reason') || '').trim();
    const listing = listingById(listingId);
    const canManage = listing && (
      (currentRole === 'owner' && listing.ownerId === currentOwner)
      || (currentRole === 'agent' && listing.agentId === currentAgent)
    );
    if (!canManage) {
      setBookingError('You can only block dates on listings you manage.');
      return false;
    }
    if (!checkIn || !checkOut || checkIn >= checkOut || checkIn < new Date().toISOString().slice(0, 10)) {
      setBookingError('Choose valid future check-in and check-out dates.');
      return false;
    }
    const conflict = calendarReservations.some((item) => (
      item.listing === listingId
      && ['pending', 'confirmed'].includes(item.status)
      && checkIn < item.out
      && checkOut > item.in
    ));
    if (conflict) {
      setBookingError('Those dates overlap a booking or maintenance block. Choose another date range.');
      return false;
    }
    const createdAt = new Date().toISOString();
    const block = {
      id: `MAINT-${Date.now()}`,
      listing: listingId,
      in: checkIn,
      out: checkOut,
      reason: reason || 'Maintenance',
      actorRole: currentRole,
      actorId: currentRole === 'owner' ? currentOwner : currentAgent,
      createdAt,
    };
    setMaintenanceBlocks((previous) => [...previous, block]);
    recordAudit({
      entityType: 'maintenance',
      entityId: block.id,
      listingId,
      action: 'maintenance-block-created',
      details: `Blocked ${fmtDate(checkIn)} to ${fmtDate(checkOut)}: ${block.reason}`,
    });
    // Notify field staff immediately — maintenance calendar + messages
    const listingName = listing?.name || listingId;
    const actorName = currentRole === 'owner'
      ? (ownerById(currentOwner)?.name || 'Owner')
      : (agentById(currentAgent)?.name || 'Agent');
    setFieldMessages((previous) => [
      {
        id: `fm-maint-${block.id}`,
        toStaffId: 'F2',
        fromRole: currentRole === 'owner' ? 'owner' : 'agent',
        fromId: currentRole === 'owner' ? currentOwner : currentAgent,
        fromName: actorName,
        listingId,
        text: `Maintenance blocked on ${listingName}: ${fmtDate(checkIn)} → ${fmtDate(checkOut)}. ${block.reason}. Open Maintenance calendar for the full schedule.`,
        at: createdAt,
        read: false,
        type: 'maintenance-alert',
      },
      {
        id: `fm-maint-all-${block.id}`,
        toStaffId: 'all',
        fromRole: currentRole === 'owner' ? 'owner' : 'agent',
        fromId: currentRole === 'owner' ? currentOwner : currentAgent,
        fromName: actorName,
        listingId,
        text: `New maintenance window: ${listingName} (${fmtDate(checkIn)} → ${fmtDate(checkOut)}).`,
        at: createdAt,
        read: false,
        type: 'maintenance-alert',
      },
      ...previous,
    ]);
    setBookingError('');
    setDrawerStack((stack) => stack.slice(0, -1));
    setStatusMessage(`Dates blocked for work at ${listing.name}. On-site team notified.`);
    return true;
  };

  const removeMaintenanceBlock = (blockId) => {
    const block = maintenanceBlocks.find((item) => item.id === blockId);
    if (!block) return false;
    const listing = listingById(block.listing);
    const canManage = listing && (
      (currentRole === 'owner' && listing.ownerId === currentOwner)
      || (currentRole === 'agent' && listing.agentId === currentAgent)
    );
    if (!canManage) {
      setStatusMessage('You can only remove maintenance blocks from listings you manage.');
      return false;
    }
    setMaintenanceBlocks((previous) => previous.filter((item) => item.id !== blockId));
    recordAudit({
      entityType: 'maintenance',
      entityId: block.id,
      listingId: block.listing,
      action: 'maintenance-block-removed',
      details: `Removed maintenance block for ${fmtDate(block.in)} to ${fmtDate(block.out)} on ${listing?.name || 'listing'}`,
    });
    setDrawerStack([]);
    setStatusMessage('Maintenance block removed.');
    return true;
  };

  const respondToReview = (event, review) => {
    event.preventDefault();
    const text = String(new FormData(event.currentTarget).get('response') || '').trim();
    if (!text || text.length > 1000) {
      setStatusMessage('Enter a response of up to 1,000 characters.');
      return false;
    }
    const listing = listingById(review.listing);
    const canManage = listing && (
      (currentRole === 'owner' && listing.ownerId === currentOwner)
      || (currentRole === 'agent' && listing.agentId === currentAgent)
    );
    if (!canManage) {
      setStatusMessage('You can only respond to reviews for listings you manage.');
      return false;
    }
    const existing = reviewResponses.find((item) => item.reviewId === review.id);
    const response = {
      id: existing?.id || `response-${review.id}`,
      reviewId: review.id,
      listingId: review.listing,
      actorRole: currentRole,
      actorId: currentRole === 'owner' ? currentOwner : currentAgent,
      text,
      createdAt: new Date().toISOString(),
    };
    setReviewResponses((previous) => existing
      ? previous.map((item) => item.reviewId === review.id ? response : item)
      : [...previous, response]);
    recordAudit({
      entityType: 'review',
      entityId: review.id,
      listingId: review.listing,
      action: existing ? 'review-response-updated' : 'review-response-created',
      details: `${existing ? 'Updated' : 'Replied to'} guest review`,
    });
    event.currentTarget.reset();
    setStatusMessage('Review response saved.');
    return true;
  };

  const startBookingRequest = (listingId) => {
    setBookingError('');
    setDrawerStack((stack) => [...stack, { type: 'booking-form', id: listingId }]);
  };

  const openThread = (guestId) => {
    setActiveThreadGuest(guestId);
    setConversations((previous) => previous.map((conversation) => (
      conversation.guest === guestId && conversation.unread
        ? { ...conversation, unread: 0 }
        : conversation
    )));
  };

  const sendMessage = (guestId, rawText) => {
    const text = rawText.trim();
    if (!text) {
      setStatusMessage('Enter a message before sending.');
      return false;
    }
    if (text.length > 2000) {
      setStatusMessage('Messages must be 2,000 characters or fewer.');
      return false;
    }

    const sender = currentRole === 'agent' ? 'agent' : 'guest';
    setConversations((previous) => {
      const existing = previous.find((conversation) => conversation.guest === guestId);
      const message = { id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, sender, text };
      if (existing) {
        return previous.map((conversation) => conversation.guest === guestId
          ? { ...conversation, unread: sender === 'guest' ? (conversation.unread || 0) + 1 : 0, messages: [...conversation.messages, message] }
          : conversation);
      }
      return [...previous, { guest: guestId, unread: sender === 'guest' ? 1 : 0, messages: [message] }];
    });
    setStatusMessage('Message sent.');
    return true;
  };

  const toggleTask = (reservationId, taskIndex) => {
    setReservations((previous) => previous.map((reservation) => (
      reservation.id === reservationId
        ? {
          ...reservation,
          tasks: reservation.tasks.map((task, index) => index === taskIndex ? { ...task, done: !task.done } : task),
        }
        : reservation
    )));
  };

  const selectSearchResult = (result) => {
    setSearchQuery('');
    setIsSearchOpen(false);
    if (result.type === 'listing') {
      openListing(result.id);
      return;
    }
    if (result.type === 'guest') {
      go('guests');
      openGuest(result.id);
      return;
    }
    if (result.type === 'reservation') {
      if (currentRole === 'client') {
        openReservation(result.id);
      } else {
        go(currentRole === 'owner' ? 'owner-financials' : 'reservations');
        openReservation(result.id);
      }
    }
  };

  const requestBooking = async (event, listingId) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const checkIn = formData.get('check-in');
    const checkOut = formData.get('check-out');
    const guestCount = Number(formData.get('guest-count'));
    const request = String(formData.get('request') || '').trim();
    const listing = listingById(listingId);

    if (!listing) {
      setBookingError('This listing is no longer available.');
      return;
    }
    if (!checkIn || !checkOut || checkIn >= checkOut) {
      setBookingError('Choose a check-out date after your check-in date.');
      return;
    }
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20) {
      setBookingError('Guest count must be between 1 and 20.');
      return;
    }
    if (request.length > 500) {
      setBookingError('Requests must be 500 characters or fewer.');
      return;
    }

    const conflicts = calendarReservations.some((reservation) => (
      reservation.listing === listingId
      && ['pending', 'confirmed'].includes(reservation.status)
      && checkIn < reservation.out
      && checkOut > reservation.in
    ));
    if (conflicts) {
      setBookingError('Those dates overlap an existing booking. Choose another date range.');
      return;
    }

    setIsBookingSubmitting(true);
    try {
      const created = await createReservation({
        guest: currentGuestClient,
        listing: listingId,
        in: checkIn,
        out: checkOut,
        channel: 'Direct',
        status: 'pending',
        paid: 0,
        paidStatus: 'Pending',
        dateReserved: true,
        request: request || '—',
        guestCount,
        tasks: [],
      });
      recordAudit({
        entityType: 'reservation',
        entityId: created.id,
        listingId,
        action: 'booking-request-created',
        details: `Client requested ${fmtDate(checkIn)} to ${fmtDate(checkOut)}`,
      });
      setBookingError('');
      setDrawerStack([]);
      setActiveView('client-booking');
      setStatusMessage(`Dates reserved for ${created.id}. The booking request is pending confirmation.`);
    } catch (error) {
      setBookingError(error.message);
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  const reserveOfflineDates = async (event, listingId) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const checkIn = String(formData.get('check-in') || '');
    const checkOut = String(formData.get('check-out') || '');
    const guestName = String(formData.get('offline-guest') || '').trim();
    const request = String(formData.get('request') || '').trim();
    const listing = listingById(listingId);
    const canManage = listing && (
      (currentRole === 'owner' && listing.ownerId === currentOwner)
      || (currentRole === 'agent' && listing.agentId === currentAgent)
    );

    if (!canManage) {
      setBookingError('You can only reserve dates on listings you manage.');
      return;
    }
    if (!checkIn || !checkOut || checkIn >= checkOut || checkIn < new Date().toISOString().slice(0, 10)) {
      setBookingError('Choose valid future check-in and check-out dates.');
      return;
    }
    if (guestName.length > 100 || request.length > 500) {
      setBookingError('Guest name must be 100 characters or fewer and notes 500 characters or fewer.');
      return;
    }
    const conflicts = calendarReservations.some((reservation) => (
      reservation.listing === listingId
      && ['pending', 'confirmed'].includes(reservation.status)
      && checkIn < reservation.out
      && checkOut > reservation.in
    ));
    if (conflicts) {
      setBookingError('Those dates overlap an existing booking. Choose another date range.');
      return;
    }

    try {
      const created = await createReservation({
        guest: 'offline',
        offlineGuestName: guestName || 'Offline guest',
        offlineBooking: true,
        bookedByRole: currentRole,
        bookedById: currentRole === 'owner' ? currentOwner : currentAgent,
        listing: listingId,
        in: checkIn,
        out: checkOut,
        channel: 'Offline',
        status: 'confirmed',
        dateReserved: true,
        paid: 0,
        paidStatus: 'Offline',
        request: request || 'Offline reservation',
        guestCount: 1,
        tasks: [],
      });
      recordAudit({
        entityType: 'reservation',
        entityId: created.id,
        listingId,
        action: 'offline-reservation-created',
        details: `Offline reservation created for ${guestName || 'Offline guest'} from ${fmtDate(checkIn)} to ${fmtDate(checkOut)}`,
      });
      setBookingError('');
      setDrawerStack((stack) => stack.slice(0, -1));
      setStatusMessage(`Dates reserved for an offline client on ${listing.name} (${fmtDate(checkIn)} to ${fmtDate(checkOut)}).`);
      return created;
    } catch (error) {
      setBookingError(error.message);
      return null;
    }
  };

  const handleReservationDecision = async (reservationId, decision) => {
    try {
      const updated = await decideReservation(reservationId, decision);
      const listing = listingById(updated.listing);
      const action = decision === 'confirmed' ? 'accepted' : 'rejected';
      const message = `Your booking request for ${listing?.name || 'the listing'} (${fmtDate(updated.in)} to ${fmtDate(updated.out)}) was ${action}.`;
      setClientNotifications((previous) => [
        ...previous.filter((notification) => notification.id !== `reservation-${updated.id}-${decision}`),
        {
          id: `reservation-${updated.id}-${decision}`,
          guest: updated.guest,
          reservationId: updated.id,
          listingId: updated.listing,
          status: decision,
          message,
          createdAt: updated.updatedAt,
          read: false,
        },
      ]);
      recordAudit({
        entityType: 'reservation',
        entityId: updated.id,
        listingId: updated.listing,
        action: `booking-request-${decision}`,
        details: `Agent ${decision} booking request for ${fmtDate(updated.in)} to ${fmtDate(updated.out)}`,
      });
      setStatusMessage(`Request ${updated.id} ${action}. The client has been notified.`);
      return updated;
    } catch (error) {
      setStatusMessage(error.message);
      return null;
    }
  };

  const requestClientReservationAction = (reservationId, action) => {
    const reservation = reservations.find((item) => item.id === reservationId);
    if (!reservation || reservation.guest !== currentGuestClient) {
      setStatusMessage('This stay is not available in the selected client account.');
      return false;
    }
    if (reservation.status !== 'confirmed' || reservation.out <= new Date().toISOString().slice(0, 10)) {
      setStatusMessage('Only upcoming, confirmed stays can be changed or cancelled.');
      return false;
    }
    if (hasPendingClientAction(reservation)) {
      setStatusMessage('A request for this stay is already awaiting agent review.');
      return false;
    }
    if (action.type === 'date-change') {
      if (!action.in || !action.out || action.in >= action.out || action.in < new Date().toISOString().slice(0, 10)) {
        setStatusMessage('Choose valid future check-in and check-out dates.');
        return false;
      }
      const conflict = calendarReservations.some((other) => (
        other.id !== reservation.id
        && other.listing === reservation.listing
        && ['pending', 'confirmed'].includes(other.status)
        && action.in < other.out
        && action.out > other.in
      ));
      if (conflict) {
        setStatusMessage('Those dates are unavailable for this listing. Choose another range.');
        return false;
      }
    }

    const requestedAt = new Date().toISOString();
    setReservations((previous) => previous.map((item) => (
      item.id === reservationId
        ? {
          ...item,
          clientAction: {
            ...action,
            status: 'pending',
            requestedAt,
            originalIn: item.in,
            originalOut: item.out,
          },
          updatedAt: requestedAt,
        }
        : item
    )));
    setStatusMessage(action.type === 'cancellation'
      ? 'Cancellation request sent to your agent.'
      : 'Date change request sent to your agent.');
    recordAudit({
      entityType: 'reservation',
      entityId: reservationId,
      listingId: reservation.listing,
      action: action.type === 'cancellation' ? 'cancellation-request-created' : 'date-change-request-created',
      details: action.type === 'cancellation'
        ? `Client requested cancellation of ${fmtDate(reservation.in)} to ${fmtDate(reservation.out)}`
        : `Client requested date change to ${fmtDate(action.in)} to ${fmtDate(action.out)}`,
    });
    return true;
  };

  const handleClientActionDecision = (reservationId, decision) => {
    const reservation = reservations.find((item) => item.id === reservationId);
    const action = reservation?.clientAction;
    if (!reservation || action?.status !== 'pending' || !['approved', 'rejected'].includes(decision)) {
      setStatusMessage('This change request has already been handled.');
      return false;
    }
    if (decision === 'approved' && action.type === 'date-change') {
      const conflict = calendarReservations.some((other) => (
        other.id !== reservationId
        && other.listing === reservation.listing
        && ['pending', 'confirmed'].includes(other.status)
        && action.in < other.out
        && action.out > other.in
      ));
      if (conflict) {
        setStatusMessage('Those dates are no longer available. Reject this request and ask the client to choose another range.');
        return false;
      }
    }

    const now = new Date().toISOString();
    const nextAction = { ...action, status: decision, reviewedAt: now };
    const updated = {
      ...reservation,
      ...(decision === 'approved' && action.type === 'cancellation' ? { status: 'cancelled' } : {}),
      ...(decision === 'approved' && action.type === 'date-change' ? { in: action.in, out: action.out } : {}),
      clientAction: nextAction,
      updatedAt: now,
    };
    setReservations((previous) => previous.map((item) => item.id === reservationId ? updated : item));

    const listing = listingById(reservation.listing);
    const dates = action.type === 'date-change'
      ? `${fmtDate(action.in)} to ${fmtDate(action.out)}`
      : `${fmtDate(reservation.in)} to ${fmtDate(reservation.out)}`;
    const result = action.type === 'cancellation'
      ? decision === 'approved' ? 'cancelled' : 'not approved'
      : decision === 'approved' ? 'changed' : 'not approved';
    const id = `client-action-${reservationId}-${action.requestedAt}`;
    setClientNotifications((previous) => [
      ...previous.filter((notification) => notification.id !== id),
      {
        id,
        guest: reservation.guest,
        reservationId,
        listingId: reservation.listing,
        status: action.type === 'cancellation'
          ? decision === 'approved' ? 'cancelled' : 'cancellation-rejected'
          : decision === 'approved' ? 'date-changed' : 'date-change-rejected',
        message: action.type === 'cancellation'
          ? `Your cancellation request for ${listing?.name || 'the listing'} (${dates}) was ${result}.`
          : `Your date change request for ${listing?.name || 'the listing'} (${dates}) was ${result}.`,
        createdAt: now,
        read: false,
      },
    ]);
    recordAudit({
      entityType: 'reservation',
      entityId: reservationId,
      listingId: reservation.listing,
      action: `${action.type}-${decision}`,
      details: action.type === 'cancellation'
        ? `Agent ${decision} cancellation request`
        : `Agent ${decision} date change request: ${fmtDate(action.in)} to ${fmtDate(action.out)}`,
    });
    setStatusMessage(`Client request for ${reservation.id} ${decision}. The client has been notified.`);
    return true;
  };

  const markClientNotificationRead = (notificationId) => {
    setClientNotifications((previous) => previous.map((notification) => (
      notification.id === notificationId ? { ...notification, read: true } : notification
    )));
  };

  const submitStayReview = (reservationId, rating, comment) => {
    const reservation = reservations.find((item) => item.id === reservationId);
    if (!reservation || reservation.guest !== currentGuestClient || reservation.status !== 'confirmed'
      || reservation.out >= new Date().toISOString().slice(0, 10)) {
      setStatusMessage('Reviews are available only for your completed confirmed stays.');
      return false;
    }
    if (reviews.some((review) => review.reservationId === reservationId)) {
      setStatusMessage('A review has already been submitted for this stay.');
      return false;
    }
    const normalizedComment = comment.trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !normalizedComment || normalizedComment.length > 1000) {
      setStatusMessage('Choose a 1–5 star rating and enter a review of up to 1,000 characters.');
      return false;
    }
    setReviews((previous) => [...previous, {
      id: `review-${reservationId}`,
      reservationId,
      guest: currentGuestClient,
      listing: reservation.listing,
      rating,
      comment: normalizedComment,
      createdAt: new Date().toISOString(),
    }]);
    recordAudit({
      entityType: 'review',
      entityId: `review-${reservationId}`,
      listingId: reservation.listing,
      action: 'guest-review-created',
      details: `Guest submitted a ${rating}-star review for reservation ${reservationId}`,
    });
    setStatusMessage('Thanks for sharing your stay review.');
    return true;
  };

  const drawerBack = () => {
    setDrawerStack((stack) => stack.slice(0, -1));
  };

  useEffect(() => {
    document.body.setAttribute('data-role', currentRole);
  }, [currentRole]);

  const renderCalendarGrid = (gridElId, listingsSubset, opts = {}) => {
    const mode = opts.mode || 'agent';
    const calendarStartDate = opts.startDate || calendarStart;
    const calendarDays = Array.from({ length: CAL_DAYS }, (_, i) => {
      const d = new Date(calendarStartDate);
      d.setDate(d.getDate() + i);
      const isToday = d.toDateString() === new Date().toDateString();
      return { date: d, isToday };
    });

    const cells = [];
    cells.push(<div key="corner" className="cal-corner" />);
    calendarDays.forEach((day, idx) => {
      cells.push(
        <div key={`head-${idx}`} className={`cal-day-head ${day.isToday ? 'today' : ''}`}>
          <span className="dow">{day.date.toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
          {day.date.getDate()}
        </div>
      );
    });

    listingsSubset.forEach((listing) => {
      cells.push(<div key={`label-${listing.id}`} className="cal-row-label">{listing.name}</div>);
      const trackCells = [];
      for (let i = 0; i < CAL_DAYS; i += 1) trackCells.push(<div key={`${listing.id}-cell-${i}`} className="cal-cell" />);
      cells.push(
        <div key={`track-${listing.id}`} className="cal-track">
          {trackCells}
          {calendarReservations.filter((r) => {
            if (r.listing !== listing.id) return false;
            if (opts.status === 'rejected') return r.status === 'rejected';
            if (r.status === 'rejected') return false;
            if (opts.status === 'pending') return r.status === 'pending';
            if (opts.status === 'confirmed') return r.status === 'confirmed' && !r.offlineBooking && !r.maintenanceBlock;
            if (opts.status === 'offline') return r.offlineBooking;
            if (opts.status === 'maintenance') return r.maintenanceBlock;
            if (opts.status === 'cancelled') return r.status === 'cancelled';
            return true;
          }).map((r) => {
            const s = Math.round((new Date(`${r.in}T00:00:00`).getTime() - calendarStartDate.getTime()) / (1000 * 60 * 60 * 24));
            const e = Math.round((new Date(`${r.out}T00:00:00`).getTime() - calendarStartDate.getTime()) / (1000 * 60 * 60 * 24));
            const startCol = Math.max(1, s + 1);
            const endCol = Math.min(CAL_DAYS + 1, e + 1);
            if (endCol <= 1 || startCol > CAL_DAYS) return null;
            const isMine = mode === 'client' && r.guest === currentGuestClient;
            const isCancelled = r.status === 'cancelled';
            const isMaintenance = Boolean(r.maintenanceBlock);
            const offlineBy = r.offlineBooking
              ? r.bookedByRole === 'owner'
                ? ownerById(r.bookedById)?.name || 'owner'
                : agentById(r.bookedById)?.name || 'agent'
              : '';
            const label = isMaintenance
              ? 'Maintenance'
              : isCancelled
              ? 'Cancelled'
              : mode === 'client'
                ? (isMine ? (r.status === 'pending' ? 'Your request · pending' : 'Your stay') : 'Reserved')
                : r.offlineBooking
                  ? `Offline hold · ${offlineBy}`
                  : guestById(r.guest)?.name || 'Guest';
            const bg = isMaintenance
              ? 'var(--danger)'
              : isCancelled
              ? 'var(--ink-faint)'
              : mode === 'client'
                ? (isMine ? 'var(--clay)' : 'var(--ink-faint)')
                : r.offlineBooking
                  ? 'var(--warning)'
                  : CHANNEL_COLOR[r.channel] || '#2C5F58';
            const clickable = mode !== 'client';
            return (
              <button
                key={`${listing.id}-${r.id}`}
                className={`cal-bar${r.status === 'pending' ? ' pending' : ''}${isCancelled ? ' cancelled' : ''}`}
                style={{ gridColumn: `${startCol}/${endCol}`, background: bg, cursor: clickable ? 'pointer' : 'default' }}
                onClick={clickable ? () => (isMaintenance ? openMaintenanceBlock(r.id) : openReservation(r.id)) : undefined}
                type="button"
                aria-label={`${label}, ${listing.name}, ${fmtDate(r.in)} to ${fmtDate(r.out)}, ${r.status}`}
                title={`${label} · ${r.status === 'pending' ? 'Reserved pending confirmation' : r.status}`}
              >
                {label}
                {mode !== 'client' && <span className="ch">· {isMaintenance ? r.reason : r.channel}</span>}
                {r.status === 'pending' && !(mode === 'client' && isMine) && <span className="ch">· Pending</span>}
              </button>
            );
          })}
        </div>
      );
    });

    return (
      <div id={gridElId} className="cal-grid" style={{ gridTemplateRows: `44px repeat(${listingsSubset.length}, 70px)`, '--days': CAL_DAYS }}>
        {cells}
      </div>
    );
  };

  const openMaintenanceBlock = (id) => {
    setDrawerStack((stack) => [...stack, { type: 'maintenance-detail', id }]);
  };

  const renderGallery = (listing) => {
    const photos = listing.photos && listing.photos.length ? listing.photos : [{ type: 'placeholder', label: 'No photos yet' }];
    const safeIndex = ((galleryIndex % photos.length) + photos.length) % photos.length;
    const photo = photos[safeIndex];
    const isImage = photo.type === 'image';
    const slide = isImage ? <img src={photo.src} alt={listing.name} className="gallery-img" /> : <div className="gallery-placeholder" style={{ background: `linear-gradient(135deg, ${PHOTO_TINTS[safeIndex % PHOTO_TINTS.length]}, var(--paper))` }}><Icon name="home2" /><span>{photo.label || 'Photo'}</span></div>;
    const canEdit = (currentRole === 'owner' && listing.ownerId === currentOwner) || (currentRole === 'agent' && !listing.ownerId && listing.agentId === currentAgent);

    return (
      <>
        <div className="gallery-frame">
          {slide}
          {photos.length > 1 && (
            <>
              <button className="gallery-arrow left" type="button" aria-label="Previous photo" onClick={() => setGalleryIndex((idx) => idx - 1)}>‹</button>
              <button className="gallery-arrow right" type="button" aria-label="Next photo" onClick={() => setGalleryIndex((idx) => idx + 1)}>›</button>
            </>
          )}
          <div className="gallery-count">{safeIndex + 1} / {photos.length}</div>
        </div>
        {canEdit && (
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} onClick={() => openListingEditor(listing.id)} type="button">
            Edit listing
          </button>
        )}
      </>
    );
  };

  const openListingEditor = (existingId) => {
    const src = existingId ? listingById(existingId) : null;
    const draft = src ? {
      id: src.id,
      name: src.name,
      type: src.type,
      rate: src.rate,
      occ: src.occ,
      photos: (src.photos || []).map((p) => ({ ...p })),
      amenities: [...(src.amenities || [])],
      guestGuide: {
        checkIn: src.guestGuide?.checkIn || '',
        checkOut: src.guestGuide?.checkOut || '',
        wifiName: src.guestGuide?.wifiName || '',
        wifiPassword: src.guestGuide?.wifiPassword || '',
        instructions: src.guestGuide?.instructions || '',
        houseRules: src.guestGuide?.houseRules || '',
        localTips: src.guestGuide?.localTips || '',
      },
      ownerId: src.ownerId || null,
      ownerName: src.ownerName || '',
      agentId: src.agentId,
    } : {
      id: `L${Date.now().toString(36)}`,
      name: '',
      type: '',
      rate: 100,
      occ: '0%',
      photos: [],
      amenities: [],
      guestGuide: { checkIn: '', checkOut: '', wifiName: '', wifiPassword: '', instructions: '', houseRules: '', localTips: '' },
      ownerId: currentRole === 'owner' ? currentOwner : null,
      ownerName: '',
      agentId: currentRole === 'agent' ? currentAgent : (ownerAgents[0]?.id || AGENTS[0].id),
    };
    setEditDraft(draft);
    setEditGalleryIndex(0);
    setDrawerStack((stack) => [...stack, { type: 'listing-edit', id: draft.id }]);
  };

  const renderEditGallery = () => {
    if (!editDraft) return null;
    const photos = editDraft.photos.length ? editDraft.photos : [{ type: 'placeholder', label: 'No photos yet' }];
    const safeIndex = ((editGalleryIndex % photos.length) + photos.length) % photos.length;
    const photo = photos[safeIndex];
    const slide = photo.type === 'image' ? <img src={photo.src} alt={editDraft.name} className="gallery-img" /> : <div className="gallery-placeholder" style={{ background: `linear-gradient(135deg, ${PHOTO_TINTS[safeIndex % PHOTO_TINTS.length]}, var(--paper))` }}><Icon name="home2" /><span>{photo.label || 'Photo'}</span></div>;

    return (
      <div className="drawer-section">
        <div className="drawer-label">Photos</div>
        <div className="gallery-frame">
          {slide}
          {photos.length > 1 && (
            <>
              <button className="gallery-arrow left" type="button" aria-label="Previous photo" onClick={() => setEditGalleryIndex((idx) => idx - 1)}>‹</button>
              <button className="gallery-arrow right" type="button" aria-label="Next photo" onClick={() => setEditGalleryIndex((idx) => idx + 1)}>›</button>
            </>
          )}
          <div className="gallery-count">{safeIndex + 1} / {photos.length}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <input id="edit-photo-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleEditPhotoUpload} />
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} type="button" onClick={() => document.getElementById('edit-photo-upload')?.click()}>+ Add photo</button>
          {editDraft.photos.length > 0 && (
            <button className="btn btn-ghost" type="button" onClick={removeEditPhoto}>Remove this photo</button>
          )}
        </div>
      </div>
    );
  };

  const handleEditPhotoUpload = (evt) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditDraft((draft) => {
        if (!draft) return draft;
        const nextPhotos = [...draft.photos, { type: 'image', src: e.target.result }];
        return { ...draft, photos: nextPhotos };
      });
      setEditGalleryIndex((prev) => prev + 1);
    };
    reader.readAsDataURL(file);
  };

  const removeEditPhoto = () => {
    if (!editDraft || !editDraft.photos.length) return;
    setEditDraft((draft) => {
      if (!draft) return draft;
      const nextPhotos = draft.photos.filter((_, idx) => idx !== editGalleryIndex);
      const nextIndex = Math.max(0, editGalleryIndex - 1);
      setEditGalleryIndex(nextIndex);
      return { ...draft, photos: nextPhotos };
    });
  };

  const saveListingEditor = () => {
    if (!editDraft) return;
    const name = document.getElementById('edit-name')?.value?.trim();
    if (!name) {
      setStatusMessage('Please enter a name for the listing.');
      document.getElementById('edit-name')?.focus();
      return;
    }
    const rateInput = document.getElementById('edit-rate');
    const rate = Number(rateInput?.value);
    if (!Number.isFinite(rate) || rate <= 0) {
      setStatusMessage('Enter a nightly rate greater than zero.');
      rateInput?.focus();
      return;
    }

    const nextDraft = {
      ...editDraft,
      name,
      type: document.getElementById('edit-type')?.value?.trim() || 'Property',
      rate,
      amenities: (document.getElementById('edit-amenities')?.value || '')
        .split('\n')
        .map((amenity) => amenity.trim())
        .filter(Boolean)
        .slice(0, 40),
      guestGuide: {
        checkIn: (document.getElementById('edit-guide-checkin')?.value || '').trim(),
        checkOut: (document.getElementById('edit-guide-checkout')?.value || '').trim(),
        wifiName: (document.getElementById('edit-guide-wifi-name')?.value || '').trim(),
        wifiPassword: (document.getElementById('edit-guide-wifi-password')?.value || '').trim(),
        instructions: (document.getElementById('edit-guide-instructions')?.value || '').trim(),
        houseRules: (document.getElementById('edit-guide-rules')?.value || '').trim(),
        localTips: (document.getElementById('edit-guide-tips')?.value || '').trim(),
      },
    };

    if (currentRole === 'agent') {
      const ownerInput = (document.getElementById('edit-owner')?.value || '').trim();
      const matched = ownerInput ? OWNERS.find((o) => o.name.toLowerCase() === ownerInput.toLowerCase()) : null;
      nextDraft.ownerId = matched ? matched.id : null;
      nextDraft.ownerName = matched ? '' : (ownerInput || '');
    }

    const existing = listings.find((l) => l.id === nextDraft.id);
    if (existing) {
      setListings((prev) => prev.map((l) => (l.id === nextDraft.id ? { ...l, ...nextDraft } : l)));
    } else {
      setListings((prev) => [...prev, { ...nextDraft }]);
    }

    setEditDraft(null);
    setDrawerStack([]);
  };

  const sendOwnerNotice = (eventOrPayload) => {
    let target = 'all';
    let text = '';
    let requestType = 'general';
    let listingId = null;
    let routeField = false;
    let formEl = null;

    if (eventOrPayload && typeof eventOrPayload.preventDefault === 'function') {
      eventOrPayload.preventDefault();
      formEl = eventOrPayload.currentTarget;
      const formData = new FormData(formEl);
      target = String(formData.get('notice-target') || noticeTarget || 'all');
      text = String(formData.get('notice-text') || '').trim();
      requestType = String(formData.get('notice-type') || 'general');
      listingId = String(formData.get('notice-listing') || '') || null;
      routeField = String(formData.get('notice-route-field-flag') || '0') === '1'
        || formData.get('notice-route-field') === 'on';
    } else if (eventOrPayload && typeof eventOrPayload === 'object') {
      target = String(eventOrPayload.target || noticeTarget || 'all');
      text = String(eventOrPayload.text || '').trim();
      requestType = String(eventOrPayload.requestType || 'general');
      listingId = eventOrPayload.listingId || null;
      routeField = Boolean(eventOrPayload.routeField);
    }

    // Repair / guest problem always alert on-site unless explicitly off
    if ((requestType === 'maintenance' || requestType === 'guest_issue') && eventOrPayload?.routeField !== false) {
      if (eventOrPayload && typeof eventOrPayload.preventDefault === 'function') {
        // keep form flag
      } else if (eventOrPayload?.routeField === undefined) {
        routeField = true;
      }
    }

    if (!text) {
      setStatusMessage('Write a short note before sending.');
      return false;
    }
    if (text.length > 2000) {
      setStatusMessage('Notes must be 2,000 characters or fewer.');
      return false;
    }

    const noticeId = `N${Date.now()}`;
    const ownerName = ownerById(currentOwner)?.name || 'Owner';
    const listingName = listingId ? (listingById(listingId)?.name || listingId) : null;
    const typePrefix = requestType !== 'general' ? `[${requestType.replace('_', ' ')}] ` : '';
    const shouldAlertOnsite = Boolean(routeField);

    setNotices((prev) => [
      ...prev,
      {
        id: noticeId,
        ownerId: currentOwner,
        agentId: target,
        date: new Date().toISOString().slice(0, 10),
        text: `${typePrefix}${text}`,
        requestType,
        listingId,
        routedToField: shouldAlertOnsite,
      },
    ]);

    if (shouldAlertOnsite) {
      const toStaff = requestType === 'maintenance' ? 'F2' : 'all';
      setFieldMessages((previous) => [
        {
          id: `fm-owner-${noticeId}`,
          toStaffId: toStaff,
          fromRole: 'owner',
          fromId: currentOwner,
          fromName: ownerName,
          listingId,
          text: listingName ? `${typePrefix}${text} — ${listingName}` : `${typePrefix}${text}`,
          at: new Date().toISOString(),
          read: false,
          type: requestType === 'maintenance' ? 'maintenance-alert' : 'owner-request',
        },
        ...previous,
      ]);
    }

    if (formEl && typeof formEl.reset === 'function') {
      formEl.reset();
    }
    setNoticeTarget('all');
    setStatusMessage(
      shouldAlertOnsite
        ? 'Sent to your agent and the on-site team.'
        : 'Sent to your agent.'
    );
    return true;
  };

  const currentStaffMember = fieldStaffById(currentStaff);

  const fieldTasks = useMemo(() => {
    const rows = [];
    reservations.forEach((r) => {
      (r.tasks || []).forEach((task, taskIndex) => {
        if (task.assignee === currentStaff) {
          rows.push({
            ...task,
            resId: r.id,
            taskIndex,
            listingId: r.listing,
            guestId: r.guest,
          });
        }
      });
    });
    return rows;
  }, [reservations, currentStaff]);

  const fieldMessagesForStaff = useMemo(
    () => fieldMessages.filter((m) => m.toStaffId === currentStaff || m.toStaffId === 'all'),
    [fieldMessages, currentStaff],
  );

  const fieldUnreadCount = fieldMessagesForStaff.filter((m) => !m.read).length;

  const assignTask = (reservationId, taskIndex, staffId) => {
    const staff = fieldStaffById(staffId);
    setReservations((previous) => previous.map((reservation) => {
      if (reservation.id !== reservationId) return reservation;
      return {
        ...reservation,
        tasks: (reservation.tasks || []).map((task, index) => (
          index === taskIndex
            ? { ...task, assignee: staffId || undefined, kind: task.kind || 'cleaning' }
            : task
        )),
      };
    }));
    const res = reservations.find((r) => r.id === reservationId);
    const task = res?.tasks?.[taskIndex];
    const listing = res ? listingById(res.listing) : null;
    if (staffId && task) {
      setFieldMessages((prev) => [
        {
          id: `fm-assign-${Date.now()}`,
          toStaffId: staffId,
          fromRole: 'agent',
          fromId: currentAgent,
          fromName: agentById(currentAgent)?.name || 'Office',
          listingId: res?.listing || null,
          text: `New job assigned: “${task.t}”${listing ? ` at ${listing.name}` : ''}. Open Today to see it.`,
          at: new Date().toISOString(),
          read: false,
          type: 'dispatch',
        },
        ...prev,
      ]);
      notifyPeople({
        title: 'New job assigned',
        body: `${task.t}${listing ? ` · ${listing.name}` : ''}`,
        whatsappText: `Clariva job for ${staff?.name || 'you'}: ${task.t}${listing ? ` at ${listing.name}` : ''}`,
        phone: staff?.phone,
      });
    }
    setStatusMessage(staff
      ? `Assigned to ${staff.name.split(' ')[0]}. They will see it under Today.`
      : 'Assignee cleared.');
    return true;
  };

  const completeFieldTask = (reservationId, taskIndex, note = '') => {
    const staff = fieldStaffById(currentStaff);
    setReservations((previous) => previous.map((reservation) => {
      if (reservation.id !== reservationId) return reservation;
      return {
        ...reservation,
        tasks: (reservation.tasks || []).map((task, index) => (
          index === taskIndex
            ? {
              ...task,
              done: true,
              overdue: false,
              completionNote: note || undefined,
              completedAt: new Date().toISOString(),
              completedBy: currentStaff,
            }
            : task
        )),
      };
    }));
    const res = reservations.find((r) => r.id === reservationId);
    const task = res?.tasks?.[taskIndex];
    if (typeof recordAudit === 'function') {
      recordAudit({
        entityType: 'task',
        entityId: `${reservationId}-${taskIndex}`,
        listingId: res?.listing || '',
        action: 'field-task-completed',
        details: `${staff?.name || 'Field staff'} completed “${task?.t || 'task'}”${note ? `: ${note}` : ''}`,
      });
    }
    // Notify owner of this home (job done feed)
    if (res?.listing) {
      const listing = listingById(res.listing);
      if (listing?.ownerId) {
        const update = {
          id: `job-${Date.now()}`,
          ownerId: listing.ownerId,
          listingId: listing.id,
          listingName: listing.name,
          taskTitle: task?.t || 'Job',
          note: note || '',
          staffId: currentStaff,
          staffName: staff?.name || 'On-site',
          reservationId,
          at: new Date().toISOString(),
          read: false,
        };
        setOwnerJobUpdates((prev) => [update, ...prev]);
        notifyPeople({
          title: 'Job done on your home',
          body: `${update.taskTitle} · ${listing.name} · ${update.staffName}`,
          whatsappText: `Clariva: ${update.staffName} finished “${update.taskTitle}” at ${listing.name}.${note ? ` Note: ${note}` : ''}`,
        });
      }
    }
    notifyPeople({
      title: 'Job marked done',
      body: `${task?.t || 'Task'} — office can see it`,
      whatsappText: `Clariva: ${staff?.name || 'On-site'} marked “${task?.t || 'task'}” done.`,
    });
    setStatusMessage('Marked done — office and owner can see this now.');
    return true;
  };

  const markFieldMessageRead = (msgId) => {
    setFieldMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, read: true } : m)));
  };

  const replyFieldMessage = (msgId, text) => {
    const staff = fieldStaffById(currentStaff);
    setFieldMessages((prev) => prev.map((m) => {
      if (m.id !== msgId) return m;
      const replies = [...(m.replies || []), {
        id: `fmr-${Date.now()}`,
        fromName: staff?.name || 'Field staff',
        fromStaffId: currentStaff,
        text,
        at: new Date().toISOString(),
      }];
      return { ...m, replies, read: true };
    }));
    notifyPeople({
      title: 'On-site reply',
      body: `${staff?.name || 'On-site'}: ${text.slice(0, 80)}`,
      whatsappText: `Clariva reply from ${staff?.name || 'on-site'}: ${text}`,
    });
    setStatusMessage('Reply sent — office can see it under On-site replies.');
    return true;
  };

  const dispatchFieldMessage = ({ toStaffId, listingId, text }) => {
    const body = String(text || '').trim();
    if (!body) {
      setStatusMessage('Write a message before sending.');
      return false;
    }
    const agent = agentById(currentAgent);
    const staff = toStaffId && toStaffId !== 'all' ? fieldStaffById(toStaffId) : null;
    const who = staff ? staff.name.split(' ')[0] : 'everyone on-site';
    const msg = {
      id: `fm-dispatch-${Date.now()}`,
      toStaffId: toStaffId || 'all',
      fromRole: 'agent',
      fromId: currentAgent,
      fromName: agent?.name || 'Office',
      listingId: listingId || null,
      text: body,
      at: new Date().toISOString(),
      read: false,
      type: 'dispatch',
    };
    setFieldMessages((prev) => [msg, ...prev]);
    try { window.__clarivaLastFieldMsg = msg; } catch (e) { /* ignore */ }
    const staffPhone = staff?.phone;
    notifyPeople({
      title: 'Message to on-site',
      body: `${who}: ${body.slice(0, 80)}`,
      whatsappText: `Clariva: ${body}`,
      phone: staffPhone,
    });
    setStatusMessage(`Sent to ${who}: “${body.slice(0, 60)}${body.length > 60 ? '…' : ''}” — switch to On-site → Inbox to read it.`);
    return true;
  };

  const markOwnerJobRead = (id) => {
    setOwnerJobUpdates((prev) => prev.map((u) => (u.id === id ? { ...u, read: true } : u)));
  };

  const openWhatsAppLast = () => {
    const url = window.__clarivaLastWhatsApp;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else setStatusMessage('Send a message or complete a job first, then try WhatsApp again.');
  };

  const requestBrowserNotifyPermission = () => {
    try {
      if (typeof Notification === 'undefined') {
        setStatusMessage('This browser does not support desktop notifications.');
        return;
      }
      Notification.requestPermission().then((perm) => {
        setStatusMessage(perm === 'granted'
          ? 'Desktop alerts on. You will get a popup when jobs are assigned or finished.'
          : 'Notifications blocked. You can enable them in browser settings.');
      });
    } catch (e) {
      setStatusMessage('Could not enable desktop alerts.');
    }
  };

  const viewContext = {
    AGENTS, CAL_START, GUESTS, INBOX_THREADS: conversationThreads, RESERVATIONS: reservations,
    roleReservations: reservationsForRole, pendingAgentRequests, pendingOwnerRequests,
    clientNotifications: clientNotifications
      .filter((notification) => notification.guest === currentGuestClient)
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt)),
    unreadClientNotifications, markClientNotificationRead,
    reviews,
    activeThreadGuest, agentById, agentListings, agentOwners, currentAgent,
    currentGuestClient, currentOwner, currentRole, dayIndex, fmtDate, go,
    guestById, listingById, listings, notices, openGuest, openGuestThread,
    openListing, openListingEditor, openReservation, ownerAgents, ownerById,
    ownerLabel, ownerListings, ownerReservations, receivedNoticesForAgent,
    sendOwnerNotice, setActiveThreadGuest, conversations, sendMessage, openThread,
    toggleTask, startBookingRequest, requestBooking, bookingError, setStatusMessage,
    submitStayReview,
    handleReservationDecision, requestClientReservationAction, handleClientActionDecision, isBookingSubmitting,
    noticeTarget, setNoticeTarget,
    FIELD_STAFF, currentStaff, currentStaffMember, fieldTasks, fieldMessages: fieldMessagesForStaff,
    completeFieldTask, assignTask, markFieldMessageRead, replyFieldMessage, dispatchFieldMessage,
    fieldMessagesAll: fieldMessages, ownerJobUpdates, markOwnerJobRead, openWhatsAppLast, requestBrowserNotifyPermission,
    maintenanceBlocks, calendarStart, setCalendarStart,
};

  const renderActivePage = () => {
    if (currentRole === 'agent') {
      if (activeView === 'dashboard') return <DashboardView openListingEditor={openListingEditor} go={go} openGuest={openGuest} openReservation={openReservation} pendingRequests={pendingAgentRequests} guestById={guestById} listingById={listingById} />;
      if (activeView === 'calendar') return <CalendarView mode="agent" listings={listings} renderCalendarGrid={renderCalendarGrid} startDate={calendarStart} onChangeStartDate={setCalendarStart} onOpenMaintenance={startMaintenanceBlock} />;
      return <AgentViews view={activeView} context={viewContext} />;
    }

    if (currentRole === 'owner') {
      if (activeView === 'owner-calendar') return <CalendarView mode="owner" listings={ownerListings} renderCalendarGrid={renderCalendarGrid} startDate={calendarStart} onChangeStartDate={setCalendarStart} onOpenMaintenance={startMaintenanceBlock} />;
      return <OwnerViews view={activeView} context={viewContext} />;
    }

    
    if (currentRole === 'field') {
      return <FieldViews view={activeView} context={viewContext} />;
    }

if (activeView === 'client-calendar') return <CalendarView mode="client" listings={listings} renderCalendarGrid={renderCalendarGrid} startDate={calendarStart} onChangeStartDate={setCalendarStart} />;
    return <ClientViews view={activeView} context={viewContext} />;
  };

  // Sidebar: numeric badges only (no "notifications" / "reservations" text beside the number)
  const reservationBadgeCount = currentRole === 'agent'
    ? pendingAgentRequests.length
    : currentRole === 'owner'
      ? pendingOwnerRequests.length
      : 0;
  const clientNotificationBadgeCount = unreadClientNotifications.length;
  const currentNavItems = NAV_CONFIG[currentRole].map((group) => ({
    ...group,
    items: group.items.map((item) => {
      if (item.view === 'reservations' || item.view === 'owner-reservations') {
        return { ...item, badge: reservationBadgeCount || undefined };
      }
      if (item.view === 'client-notifications') {
        return { ...item, badge: clientNotificationBadgeCount || undefined };
      }
      if (item.view === 'inbox') {
        const unread = (conversationThreads || []).reduce((n, t) => n + (t.unread || 0), 0);
        return { ...item, badge: unread || undefined };
      }
      if (item.view === 'tasks') {
        const open = (reservations || []).reduce(
          (n, r) => n + (r.tasks || []).filter((t) => !t.done).length,
          0,
        );
        return { ...item, badge: open || undefined };
      }
      if (item.view === 'field-messages') {
        return { ...item, badge: fieldUnreadCount || undefined };
      }
      if (item.view === 'field-today') {
        const open = fieldTasks.filter((t) => !t.done).length;
        return { ...item, badge: open || undefined };
      }
      if (item.view === 'field-calendar') {
        return { ...item, badge: (maintenanceBlocks?.length) || undefined };
      }
      if (item.view === 'agent-field-replies') {
        const n = (fieldMessages || []).filter((m) => (m.replies || []).length > 0).length;
        return { ...item, badge: n || undefined };
      }
      if (item.view === 'owner-job-updates') {
        const n = (ownerJobUpdates || []).filter((u) => u.ownerId === currentOwner && !u.read).length;
        return { ...item, badge: n || undefined };
      }
      // Never put explanatory text in badge — numbers only
      if (item.badge != null && typeof item.badge !== 'number') {
        const n = parseInt(String(item.badge).replace(/\D/g, ''), 10);
        return { ...item, badge: Number.isFinite(n) && n > 0 ? n : undefined };
      }
      return item;
    }),
  }));

  return (
    <div className={`app ${currentRole}`}>
      <TopBar
        currentRole={currentRole}
        currentOwner={currentOwner}
        currentGuestClient={currentGuestClient}
        currentAgent={currentAgent}
        currentStaff={currentStaff}
        setRole={setRole}
        ownerById={ownerById}
        guestById={guestById}
        fieldStaffById={fieldStaffById}
        BRAND_TAG={BRAND_TAG}
        SEARCH_LABEL={SEARCH_LABEL}
        AGENTS={AGENTS}
        GUESTS={GUESTS}
        OWNERS={OWNERS}
        FIELD_STAFF={FIELD_STAFF}
        setCurrentOwner={setCurrentOwner}
        setCurrentGuestClient={setCurrentGuestClient}
        setCurrentAgent={setCurrentAgent}
        setCurrentStaff={setCurrentStaff}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((isOpen) => !isOpen)}
        searchQuery={searchQuery}
        searchResults={searchResults}
        isSearchOpen={isSearchOpen}
        onSearchQueryChange={(query) => {
          setSearchQuery(query);
          setIsSearchOpen(true);
        }}
        onSearchFocus={() => setIsSearchOpen(true)}
        onSearchBlur={() => window.setTimeout(() => setIsSearchOpen(false), 150)}
        onSearchSelect={selectSearchResult}
        onCloseSearch={() => setIsSearchOpen(false)}
      />

      <Sidebar
        currentNavItems={currentNavItems}
        activeView={activeView}
        go={go}
        isOpen={isSidebarOpen}
        onNavigate={() => setIsSidebarOpen(false)}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="main">
        {storageErrors.map((error) => <div key={error} className="app-alert" role="alert">{error}</div>)}
        {reservationError && <div className="app-alert" role="alert">{reservationError}</div>}
        {statusMessage && <div className="app-status" role="status">{statusMessage}</div>}
        {renderActivePage()}
      </div>

      <Drawer
        drawerStack={drawerStack}
        closeDrawer={closeDrawer}
        drawerBack={drawerBack}
        openGuest={openGuest}
        openReservation={openReservation}
        openGuestThread={openGuestThread}
        go={go}
        currentRole={currentRole}
        currentOwner={currentOwner}
        currentAgent={currentAgent}
        renderGallery={renderGallery}
        editDraft={editDraft}
        listings={listings}
        saveListingEditor={saveListingEditor}
        ownerLabel={ownerLabel}
        ownerById={ownerById}
        agentById={agentById}
        guestById={guestById}
        listingById={listingById}
        resById={resById}
        fmtDate={fmtDate}
        dayIndex={dayIndex}
        INBOX_THREADS={INBOX_THREADS}
        CAL_START={CAL_START}
        renderEditGallery={renderEditGallery}
        RESERVATIONS={calendarReservations}
        maintenanceBlocks={maintenanceBlocks}
        auditHistory={auditHistory}
        reviews={reviews}
        reviewResponses={reviewResponses}
        onStartBooking={startBookingRequest}
        onStartOfflineReservation={startOfflineReservation}
        onStartMaintenanceBlock={startMaintenanceBlock}
        onOpenMaintenanceBlock={openMaintenanceBlock}
        onRequestBooking={requestBooking}
        onReserveOfflineDates={reserveOfflineDates}
        onCreateMaintenanceBlock={createMaintenanceBlock}
        onRemoveMaintenanceBlock={removeMaintenanceBlock}
        onRespondToReview={respondToReview}
        bookingError={bookingError}
        isBookingSubmitting={isBookingSubmitting}
        toggleTask={toggleTask}
      />
    </div>
  );
}

export default App;
