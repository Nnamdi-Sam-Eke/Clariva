import { useEffect, useRef } from 'react';
import Icon from './Icon';

export default function Sidebar({ currentNavItems, activeView, go, isOpen, onNavigate, onClose }) {
  const sidebarRef = useRef(null);
  const focusReturn = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const sidebar = sidebarRef.current;
    const isMobile = () => window.matchMedia('(max-width: 980px)').matches;
    const updateInert = () => {
      if (sidebar) sidebar.inert = isMobile() && !isOpen;
    };
    updateInert();
    window.addEventListener('resize', updateInert);

    if (isOpen && isMobile()) {
      if (!focusReturn.current) focusReturn.current = document.activeElement;
      sidebar?.querySelector('button')?.focus();
    } else if (!isOpen && focusReturn.current) {
      focusReturn.current.focus();
      focusReturn.current = null;
    }

    const handleKeyDown = (event) => {
      if (!isOpen || !isMobile()) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab' || !sidebar) return;

      const focusable = [...sidebar.querySelectorAll('button:not([disabled])')];
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !sidebar.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !sidebar.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('resize', updateInert);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        className={`sidebar-backdrop ${isOpen ? 'show' : ''}`}
        type="button"
        aria-label="Close navigation menu"
        tabIndex={isOpen ? 0 : -1}
        onClick={onClose}
      />
      <nav ref={sidebarRef} className={`sidebar ${isOpen ? 'mobile-open' : ''}`} id="sidebar" aria-label="Main navigation">
      {currentNavItems.map((group, groupIndex) => (
        <div key={`${group.label}-${groupIndex}`} className="nav-group">
          <div className="nav-label">{group.label}</div>
          {group.items.map((item, itemIndex) => (
            <button
              key={`${group.label}-${item.view || 'item'}-${groupIndex}-${itemIndex}`}
              className={`nav-item ${activeView === item.view ? 'active' : ''}`}
              type="button"
              data-view={item.view}
              aria-label={item.text}
              aria-describedby={item.badge ? `nav-badge-description-${item.view}` : undefined}
              onClick={() => {
                if (item.view !== 'stub') go(item.view);
                onNavigate();
              }}
            >
              <Icon name={item.icon} />
              {item.text}
              {item.badge ? <>
                <span className="nav-badge" aria-hidden="true">{item.badge}</span>
                <span className="sr-only" id={`nav-badge-description-${item.view}`}>
                  {item.view === 'reservations' || item.view === 'owner-reservations'
                    ? `${item.badge} pending booking requests`
                    : item.view === 'inbox'
                      ? `${item.badge} unread messages`
                      : item.view === 'tasks'
                        ? `${item.badge} outstanding tasks`
                        : `${item.badge} notifications`}
                </span>
              </> : null}
            </button>
          ))}
        </div>
      ))}
      </nav>
    </>
  );
}
