import React, { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar   from './Sidebar'
import BottomNav from './BottomNav'
import Header    from './Header'
import './AppLayout.css'

/*
  Viewport breakpoints (matches global CSS):
    mobile   ≤ 640px  → BottomNav + drawer sidebar (overlay)
    tablet  641–1024  → mini sidebar (icon-only, always visible) + NO bottom nav
    desktop > 1024px  → full sidebar (toggleable) + NO bottom nav
*/
function useViewport() {
  const get = () => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1280
    if (w <= 640)  return 'mobile'   // phone
    if (w <= 1024) return 'tablet'   // iPad / small laptop
    return 'desktop'                  // PC / large laptop
  }
  const [mode, setMode] = useState(get)

  useEffect(() => {
    let raf
    function update() {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setMode(get()))
    }
    window.addEventListener('resize', update, { passive: true })
    window.addEventListener('orientationchange', update, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  return mode
}

export default function AppLayout() {
  const mode     = useViewport()
  const location = useLocation()

  // Desktop: open by default | Tablet: collapsed by default | Mobile: closed
  const [sidebarOpen, setSidebarOpen] = useState(mode === 'desktop')

  // Re-sync default state when viewport mode changes
  useEffect(() => {
    if (mode === 'desktop') setSidebarOpen(true)
    else setSidebarOpen(false)
  }, [mode])

  // Close mobile drawer on route change
  useEffect(() => {
    if (mode === 'mobile') setSidebarOpen(false)
  }, [location.pathname, mode])

  // Body scroll-lock when mobile drawer is open
  useEffect(() => {
    if (mode === 'mobile' && sidebarOpen) {
      document.body.classList.add('drawer-open')
    } else {
      document.body.classList.remove('drawer-open')
    }
    return () => document.body.classList.remove('drawer-open')
  }, [mode, sidebarOpen])

  const toggle = useCallback(() => setSidebarOpen(v => !v), [])
  const close  = useCallback(() => setSidebarOpen(false),   [])

  // Show sidebar on all modes; mobile sidebar is a fixed drawer
  const showBottomNav = mode === 'mobile'
  const showOverlay   = mode === 'mobile' && sidebarOpen

  /*
    Mobile sidebar: fixed drawer that slides in from the left.
    Tablet/Desktop sidebar: sits in normal document flow (flex item).
    Width is controlled by sidebar--open / sidebar--collapsed CSS classes.
  */
  const mobileSidebarStyle = mode === 'mobile' ? {
    position:   'fixed',
    top:         0,
    left:        0,
    bottom:      0,
    zIndex:      300,
    width:       'min(84vw, 340px)',
    maxWidth:    '340px',
    transform:   sidebarOpen ? 'translateX(0)' : 'translateX(-110%)',
    transition:  'transform var(--dur-slow) var(--ease-out)',
    boxShadow:   sidebarOpen ? '4px 0 40px rgba(0,0,0,0.55)' : 'none',
    overflowX:   'hidden',
  } : {}

  return (
    <div
      className={`app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'} mode-${mode}`}
      aria-label="LifeHub app"
    >
      {/* Mobile overlay backdrop */}
      {showOverlay && (
        <div
          className="sidebar-overlay sidebar-overlay--visible"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — always in DOM, controlled by style + CSS classes */}
      <div style={mobileSidebarStyle} aria-hidden={mode === 'mobile' && !sidebarOpen}>
        <Sidebar
          open={sidebarOpen}
          mode={mode}
          onToggle={toggle}
          onClose={close}
        />
      </div>

      {/* Main content */}
      <div className="app-main">
        <Header
          onMenuToggle={toggle}
          mode={mode}
          sidebarOpen={sidebarOpen}
        />
        <main
          className="app-content"
          id="main-content"
          aria-label="เนื้อหาหลัก"
        >
          <div className="page-content animate-fadein">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      {showBottomNav && <BottomNav />}
    </div>
  )
}
