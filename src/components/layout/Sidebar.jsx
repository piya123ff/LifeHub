import React from 'react'
import { NavLink } from 'react-router-dom'
import { MENU_ITEMS } from '../../data/menuItems.js'
import './Sidebar.css'

// SVG icons
const LogoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 7l10 5 10-5-10-5z" opacity="0.9"/>
    <path d="M2 17l10 5 10-5M2 12l10 5 10-5"
      stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7"/>
  </svg>
)
const ChevronLeft = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
    stroke="currentColor" strokeWidth="2.5">
    <path d="M15 18l-6-6 6-6"/>
  </svg>
)

export default function Sidebar({ open, mode, onToggle, onClose }) {
  const collapsed = !open

  // On tablet: can toggle between icon-only and full
  // On desktop: can toggle between full and icon-only
  // On mobile: always full when visible
  const showToggle = mode !== 'mobile'

  return (
    <aside
      className={`sidebar ${collapsed ? 'sidebar--collapsed' : 'sidebar--open'}`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Brand */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" aria-hidden="true">
          <LogoIcon />
        </div>
        {!collapsed && (
          <span className="sidebar-logo-text">LifeHub</span>
        )}
      </div>

      {/* Nav items */}
      <nav className="sidebar-nav">
        {MENU_ITEMS.map((item, i) => {
          // Add divider before Backup (last item)
          const isDividerBefore = i === MENU_ITEMS.length - 1
          return (
            <React.Fragment key={item.path}>
              {isDividerBefore && <div className="sidebar-divider" aria-hidden="true" />}
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'sidebar-item--active' : ''} accent-${item.accent}`
                }
                title={collapsed ? item.label : undefined}
                onClick={mode === 'mobile' ? onClose : undefined}
              >
                <span
                  className="sidebar-icon"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: item.icon }}
                />
                {!collapsed && (
                  <span className="sidebar-label">{item.label}</span>
                )}
              </NavLink>
            </React.Fragment>
          )
        })}
      </nav>

      {/* Toggle button (tablet + desktop) */}
      {showToggle && (
        <button
          className="sidebar-toggle"
          onClick={onToggle}
          aria-label={collapsed ? 'ขยาย sidebar' : 'ย่อ sidebar'}
          title={collapsed ? 'ขยาย' : 'ย่อ'}
        >
          <span style={{
            display: 'inline-block',
            transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform var(--dur-normal) var(--ease)',
            lineHeight: 0,
          }}>
            <ChevronLeft />
          </span>
        </button>
      )}
    </aside>
  )
}
