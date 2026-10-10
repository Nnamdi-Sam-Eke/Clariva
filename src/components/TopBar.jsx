import { useState } from 'react';
import Icon from './Icon';

export default function TopBar({
  currentRole,
  currentOwner,
  currentGuestClient,
  currentAgent,
  currentStaff,
  setRole,
  ownerById,
  guestById,
  fieldStaffById,
  BRAND_TAG,
  SEARCH_LABEL,
  AGENTS,
  GUESTS,
  OWNERS,
  FIELD_STAFF = [],
  setCurrentOwner,
  setCurrentGuestClient,
  setCurrentAgent,
  setCurrentStaff,
  onToggleSidebar,
  isSidebarOpen,
  searchQuery,
  searchResults,
  isSearchOpen,
  onSearchQueryChange,
  onSearchFocus,
  onSearchBlur,
  onSearchSelect,
  onCloseSearch,
}) {
  const [activeResult, setActiveResult] = useState(0);
  const handleSearchKeyDown = (event) => {
    if (event.key === 'Escape') {
      onCloseSearch();
      return;
    }
    if (!searchResults.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveResult((index) => (index + 1) % searchResults.length);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveResult((index) => (index - 1 + searchResults.length) % searchResults.length);
    }
    if (event.key === 'Enter' && isSearchOpen) {
      event.preventDefault();
      onSearchSelect(searchResults[activeResult] || searchResults[0]);
    }
  };

  return (
    <div className="topbar">
      <button
        className="mobile-menu-toggle"
        type="button"
        aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isSidebarOpen}
        aria-controls="sidebar"
        onClick={onToggleSidebar}
      >
        <span />
        <span />
        <span />
      </button>
      <div className="brand">
        <span className="brand-mark" />Clariva<span className="brand-role-tag" id="brand-role-tag">{BRAND_TAG[currentRole]}</span>
      </div>
      <div className="search-container">
        <div className="search">
        <Icon name="home2" className="search-icon" />
        <input
          id="global-search"
          type="search"
          role="combobox"
          aria-label={SEARCH_LABEL[currentRole]}
          aria-autocomplete="list"
          aria-expanded={isSearchOpen && searchQuery.trim().length >= 2}
          aria-controls="global-search-results"
          aria-activedescendant={isSearchOpen && searchQuery.trim().length >= 2 && searchResults[activeResult] ? `search-result-${searchResults[activeResult].id}` : undefined}
          placeholder={SEARCH_LABEL[currentRole]}
          value={searchQuery}
          onChange={(event) => {
            setActiveResult(0);
            onSearchQueryChange(event.target.value);
          }}
          onFocus={onSearchFocus}
          onBlur={onSearchBlur}
          onKeyDown={handleSearchKeyDown}
        />
        </div>
        {isSearchOpen && searchQuery.trim().length >= 2 && (
        <div className="search-results" id="global-search-results" role="listbox" aria-label="Search results">
          {searchResults.length ? searchResults.map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              id={`search-result-${result.id}`}
              className={`search-result ${index === activeResult ? 'active' : ''}`}
              type="button"
              role="option"
              aria-selected={index === activeResult}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSearchSelect(result)}
            >
              <span>{result.label}</span>
              <span className="search-result-detail">{result.detail}</span>
            </button>
          )) : <div className="search-empty" role="status">No matching records.</div>}
        </div>
        )}
      </div>
      <div className="topbar-right">
        <div className="role-switch" id="role-switch" role="group" aria-label="Switch app role">
          {['agent', 'owner', 'client', 'field'].map((role) => (
            <button key={role} className={`role-btn ${currentRole === role ? 'active' : ''}`} type="button" data-role={role} onClick={() => setRole(role)}>
              {role === 'agent' ? 'Agent' : role === 'owner' ? 'Owner' : role === 'client' ? 'Client' : 'On-site'}
            </button>
          ))}
        </div>
        <select
          className="role-select"
          id="role-person-select"
          aria-label={`Select ${currentRole} account`}
          value={currentRole === 'owner' ? currentOwner : currentRole === 'client' ? currentGuestClient : currentRole === 'field' ? currentStaff : currentAgent}
          onChange={(e) => {
            if (currentRole === 'owner') setCurrentOwner(e.target.value);
            if (currentRole === 'client') setCurrentGuestClient(e.target.value);
            if (currentRole === 'agent') setCurrentAgent(e.target.value);
            if (currentRole === 'field') setCurrentStaff?.(e.target.value);
          }}
          style={{ display: 'inline-block' }}
        >
          {currentRole === 'owner' && OWNERS.map((o) => <option key={o.id} value={o.id}>Viewing as {o.name}</option>)}
          {currentRole === 'client' && GUESTS.map((g) => <option key={g.id} value={g.id}>Viewing as {g.name}</option>)}
          {currentRole === 'agent' && AGENTS.map((a) => <option key={a.id} value={a.id}>Viewing as {a.name}</option>)}
          {currentRole === 'field' && FIELD_STAFF.map((f) => <option key={f.id} value={f.id}>Viewing as {f.name}</option>)}
        </select>
        <div className="sync-pill" id="context-pill">
          {currentRole === 'agent' ? <><span className="sync-dot pulse" />All channels synced · 2m ago</> : currentRole === 'field' ? <><span className="sync-dot pulse" />Jobs synced with the office</> : <><span className="portal-dot" />{currentRole === 'owner' ? 'Read-only owner portal' : 'Guest view'}</>}
        </div>
        <div className="avatar" id="avatar">
          {currentRole === 'agent'
            ? 'SA'
            : currentRole === 'owner'
              ? ownerById(currentOwner)?.name.split(' ').map((w) => w[0]).join('')
              : currentRole === 'field'
                ? (fieldStaffById?.(currentStaff)?.name || 'FS').split(' ').map((w) => w[0]).join('')
                : guestById(currentGuestClient)?.name.split(' ').map((w) => w[0]).join('')}
        </div>
      </div>
    </div>
  );
}
