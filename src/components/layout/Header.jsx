import React from 'react'
import { useLocation } from 'react-router-dom'
import { MENU_ITEMS } from '../../data/menuItems.js'
import { useTheme } from '../../contexts/ThemeContext.jsx'

const PAGE_MAP = Object.fromEntries(
  MENU_ITEMS.map(m => [m.path, { label: m.label, accent: m.accent }])
)

function getTodayThai() {
  return new Intl.DateTimeFormat('th-TH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  }).format(new Date())
}

const HamburgerIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6"  x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)

const BellIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)

const MoonIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

const BlossomIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="2.2"/>
    <ellipse cx="12" cy="5.5" rx="1.8" ry="3.2"/>
    <ellipse cx="12" cy="18.5" rx="1.8" ry="3.2"/>
    <ellipse cx="5.5" cy="12" rx="3.2" ry="1.8"/>
    <ellipse cx="18.5" cy="12" rx="3.2" ry="1.8"/>
    <ellipse cx="7.5" cy="7.5" rx="1.8" ry="3.2" transform="rotate(45 7.5 7.5)" opacity="0.75"/>
    <ellipse cx="16.5" cy="16.5" rx="1.8" ry="3.2" transform="rotate(45 16.5 16.5)" opacity="0.75"/>
    <ellipse cx="16.5" cy="7.5" rx="1.8" ry="3.2" transform="rotate(-45 16.5 7.5)" opacity="0.75"/>
    <ellipse cx="7.5" cy="16.5" rx="1.8" ry="3.2" transform="rotate(-45 7.5 16.5)" opacity="0.75"/>
  </svg>
)

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      className={"theme-toggle " + (isDark ? 'theme-toggle--dark' : 'theme-toggle--pink')}
      onClick={toggleTheme}
      aria-label={isDark ? 'สลับเป็นธีมชมพู' : 'สลับเป็นธีมมืด'}
      title={isDark ? 'ธีมชมพู' : 'ธีมมืด'}
    >
      <span className="theme-toggle-track">
        <span className="theme-toggle-thumb">
          {isDark ? <MoonIcon /> : <BlossomIcon />}
        </span>
      </span>
      <span className="theme-toggle-label">
        {isDark ? 'Dark' : 'Pink'}
      </span>
    </button>
  )
}

export default function Header({ onMenuToggle, mode }) {
  const { pathname } = useLocation()
  const page  = PAGE_MAP[pathname]
  const title = page?.label ?? 'LifeHub'
  const isMobile = mode === 'mobile'

  return (
    <header className="topbar">
      {isMobile && (
        <button
          className="topbar-menu-btn"
          onClick={onMenuToggle}
          aria-label="เปิด/ปิดเมนู"
        >
          <HamburgerIcon />
        </button>
      )}

      <div className="topbar-title">
        <h1 className="topbar-heading">{title}</h1>
        {!isMobile && <p className="topbar-sub">{getTodayThai()}</p>}
      </div>

      <div className="topbar-right">
        {isMobile && (
          <span className="topbar-date">{getTodayThai()}</span>
        )}
        <ThemeToggle />
        <button className="topbar-icon-btn" aria-label="การแจ้งเตือน">
          <BellIcon />
        </button>
        <div className="topbar-avatar" aria-label="LifeHub user">LH</div>
      </div>
    </header>
  )
}
