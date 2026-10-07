import { useEffect, useMemo, useRef, useState } from 'react';

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromISODate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value) {
  return fromISODate(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function overlapsExistingStay(startDate, endDate, reservation) {
  return startDate < reservation.out && endDate > reservation.in;
}

export default function BookingDatePicker({ listingId, reservations, bookingError }) {
  const today = toISODate(new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [activeDate, setActiveDate] = useState(today);
  const focusDate = useRef(false);
  const occupied = useMemo(
    () => reservations.filter((reservation) => (
      reservation.listing === listingId && ['pending', 'confirmed'].includes(reservation.status)
    )),
    [listingId, reservations],
  );

  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
  const selectingCheckOut = Boolean(checkIn && !checkOut);
  const titleId = `booking-date-title-${listingId}`;

  const isUnavailable = (date) => {
    const isoDate = toISODate(date);
    if (isoDate < today) return true;
    if (!selectingCheckOut) return occupied.some((reservation) => isoDate >= reservation.in && isoDate < reservation.out);
    if (isoDate <= checkIn) return true;
    return occupied.some((reservation) => overlapsExistingStay(checkIn, isoDate, reservation));
  };
  const tabStopDate = days.find((date) => (
    date.getMonth() === visibleMonth.getMonth()
    && toISODate(date) === activeDate
    && !isUnavailable(date)
  )) || days.find((date) => date.getMonth() === visibleMonth.getMonth() && !isUnavailable(date));

  useEffect(() => {
    if (!focusDate.current) return;
    document.getElementById(`booking-day-${listingId}-${activeDate}`)?.focus();
    focusDate.current = false;
  }, [activeDate, listingId, visibleMonth]);

  const changeMonth = (offset) => {
    const targetMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
    const earliestMonth = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, 1);
    if (targetMonth < earliestMonth) return;

    setVisibleMonth(targetMonth);
    const monthLength = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
    const firstAvailableDate = Array.from({ length: monthLength }, (_, index) => (
      new Date(targetMonth.getFullYear(), targetMonth.getMonth(), index + 1)
    )).find((date) => !isUnavailable(date));
    const nextActiveDate = firstAvailableDate ? toISODate(firstAvailableDate) : '';
    setActiveDate(nextActiveDate);
    focusDate.current = Boolean(nextActiveDate);
  };

  const onSelectDate = (date) => {
    const isoDate = toISODate(date);
    if (isUnavailable(date)) return;
    setActiveDate(isoDate);
    if (!selectingCheckOut) {
      setCheckIn(isoDate);
      setCheckOut('');
      return;
    }
    setCheckOut(isoDate);
  };

  return (
    <section className="booking-date-picker" aria-labelledby={titleId}>
      <div className="booking-date-summary">
        <div>
          <span className="drawer-label">Check-in</span>
          <span className="booking-selected-date">{checkIn ? formatDate(checkIn) : 'Select a date'}</span>
        </div>
        <span aria-hidden="true">→</span>
        <div>
          <span className="drawer-label">Check-out</span>
          <span className="booking-selected-date">{checkOut ? formatDate(checkOut) : 'Select a date'}</span>
        </div>
      </div>
      <div className="booking-calendar-head">
        <h3 id={titleId}>{visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
        <div className="booking-month-controls">
          <button
            className="booking-month-button"
            type="button"
            aria-label="Previous month"
            disabled={visibleMonth.getTime() <= new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, 1).getTime()}
            onClick={() => changeMonth(-1)}
          >‹</button>
          <button
            className="booking-month-button"
            type="button"
            aria-label="Next month"
            onClick={() => changeMonth(1)}
          >›</button>
        </div>
      </div>
      <div className="booking-calendar-grid" role="group" aria-label="Choose check-in and check-out dates">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <span className="booking-weekday" key={day} aria-hidden="true">{day}</span>
        ))}
        {days.map((date) => {
          const isoDate = toISODate(date);
          const inMonth = date.getMonth() === visibleMonth.getMonth();
          const reserved = occupied.some((reservation) => isoDate >= reservation.in && isoDate < reservation.out);
          const disabled = !inMonth || isUnavailable(date);
          const selected = isoDate === checkIn || isoDate === checkOut;
          const inSelectedRange = checkIn && checkOut && isoDate > checkIn && isoDate < checkOut;
          const description = reserved
            ? selectingCheckOut && isoDate === occupied.find((reservation) => reservation.in === isoDate)?.in
              ? ', reserved, available for checkout'
              : ', reserved'
            : '';
          return (
            <button
              className={`booking-day${selected ? ' selected' : ''}${inSelectedRange ? ' in-range' : ''}${reserved ? ' reserved' : ''}`}
              type="button"
              key={isoDate}
              id={`booking-day-${listingId}-${isoDate}`}
              aria-label={`${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}${description}`}
              aria-pressed={selected}
              disabled={disabled}
              tabIndex={tabStopDate && toISODate(tabStopDate) === isoDate ? 0 : -1}
              onKeyDown={(event) => {
                const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
                const offset = offsets[event.key];
                if (!offset) return;
                event.preventDefault();
                const currentDate = fromISODate(isoDate);
                for (let step = 1; step <= 42; step += 1) {
                  const nextDate = new Date(currentDate);
                  nextDate.setDate(currentDate.getDate() + offset * step);
                  if (nextDate.getMonth() !== visibleMonth.getMonth()) break;
                  if (isUnavailable(nextDate)) continue;
                  const nextIsoDate = toISODate(nextDate);
                  setActiveDate(nextIsoDate);
                  focusDate.current = true;
                  break;
                }
              }}
              onClick={() => onSelectDate(date)}
            >
              <span>{date.getDate()}</span>
              {reserved && <small>Reserved</small>}
            </button>
          );
        })}
      </div>
      <div className="booking-availability-legend">
        <span><i className="booking-legend-dot available" />Available</span>
        <span><i className="booking-legend-dot reserved" />Reserved</span>
      </div>
      <p className="booking-date-help" aria-live="polite">
        {selectingCheckOut ? 'Choose an available check-out date. Reserved nights cannot be included.' : 'Choose an available check-in date.'}
      </p>
      {checkIn && <input type="hidden" name="check-in" value={checkIn} />}
      {checkOut && <input type="hidden" name="check-out" value={checkOut} />}
      {bookingError && <div className="booking-error" id="booking-error" role="alert">{bookingError}</div>}
    </section>
  );
}
