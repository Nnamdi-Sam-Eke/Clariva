import { useCallback } from 'react';
import { RESERVATIONS as INITIAL_RESERVATIONS } from '../data';
import { isRecordArray, usePersistentState } from './persistence';

const RESERVATIONS_KEY = 'clariva.reservations.v1';

function isReservationArray(value) {
  return isRecordArray(value) && value.every((reservation) => (
    typeof reservation.id === 'string'
    && typeof reservation.guest === 'string'
    && typeof reservation.listing === 'string'
    && typeof reservation.in === 'string'
    && typeof reservation.out === 'string'
    && ['confirmed', 'pending', 'rejected', 'cancelled'].includes(reservation.status)
    && (reservation.dateReserved === undefined || typeof reservation.dateReserved === 'boolean')
    && Number.isFinite(reservation.paid)
    && Array.isArray(reservation.tasks)
    && reservation.tasks.every((task) => (
      task !== null
      && typeof task === 'object'
      && typeof task.t === 'string'
      && typeof task.done === 'boolean'
      && (task.overdue === undefined || typeof task.overdue === 'boolean')
    ))
    && (reservation.clientAction === undefined || (
      reservation.clientAction !== null
      && typeof reservation.clientAction === 'object'
      && ['cancellation', 'date-change'].includes(reservation.clientAction.type)
      && ['pending', 'approved', 'rejected'].includes(reservation.clientAction.status)
      && typeof reservation.clientAction.requestedAt === 'string'
      && (reservation.clientAction.type !== 'date-change'
        || (typeof reservation.clientAction.in === 'string' && typeof reservation.clientAction.out === 'string'))
    ))
  ));
}

export function useReservations() {
  const [reservations, setReservations, storageError] = usePersistentState(
    RESERVATIONS_KEY,
    INITIAL_RESERVATIONS,
    isReservationArray,
  );

  const createReservation = useCallback(async (reservation) => {
    const existingIds = reservations
      .map((item) => Number(item.id.replace(/\D/g, '')))
      .filter(Number.isFinite);
    const id = `RES-${Math.max(10491, ...existingIds) + 1}`;
    const now = new Date().toISOString();
    const created = { ...reservation, id, createdAt: now, updatedAt: now };
    setReservations((previous) => [...previous, created]);
    return created;
  }, [reservations, setReservations]);

  const decideReservation = useCallback(async (reservationId, decision) => {
    if (!['confirmed', 'rejected'].includes(decision)) {
      throw new Error('Choose whether to accept or reject this booking request.');
    }
    const reservation = reservations.find((item) => item.id === reservationId);
    if (!reservation || reservation.status !== 'pending') {
      throw new Error('This request has already been handled.');
    }
    const updated = { ...reservation, status: decision, updatedAt: new Date().toISOString() };
    setReservations((previous) => previous.map((item) => (
      item.id === reservationId ? updated : item
    )));
    return updated;
  }, [reservations, setReservations]);

  return {
    reservations,
    setReservations,
    createReservation,
    decideReservation,
    syncError: storageError,
  };
}
