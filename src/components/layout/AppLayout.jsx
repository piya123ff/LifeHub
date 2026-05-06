import React, { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar   from './Sidebar'
import BottomNav from './BottomNav'
import Header    from './Header'

/*
  Three layout modes:
    mobile  < 768px  → no sidebar, BottomNav fixed
    tablet  768-1199 → sidebar icon-only (collapsed), no BottomNav
    desktop ≥ 1200px → sidebar full (can toggle), no BottomNav
*/
function useViewport() {
  const [mode, setMode] = useState(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200
    if (w < 768)  return 'mobile'
    if (w < 1200) return 'tablet'
    return 'desktop'
  })

  useEffect(() => {
    function update() {
      const w = window.innerWidth
      if (w < 768)  setMode('mobile')
      else if (w < 1200) setMode('tablet')
      else setMode('desktop')
    }
    const mq1 = window.matchMedia('(max-width: 767px)')
    const mq2 = window.matchMedia('(min-width: 1200px)')
    mq1.addEventListener('change', update)
    mq2.addEventListener('change', update)
    return () => {
      mq1.removeEventListener('change', update)
      mq2.removeEventListener('change', update)
    }
  }, [])

  return mode
}

export default function AppLayout() {
  const mode     = useViewport()
  const location = useLocation()

  /*
    sidebarOpen:
      desktop → true by default (full sidebar), can toggle
      tablet  → false by default (icon-only), can toggle open
      mobile  → false by default, toggle opens overlay drawer
  */
  const [sidebarOpen, setSidebarOpen] = useState(mode === 'desktop')

  // Re-sync default state when mode changes
  useEffect(() => {
    if (mode === 'desktop') setSidebarOpen(true)
    else setSidebarOpen(false)
  }, [mode])

  // Close mobile drawer on route change
  useEffect(() => {
    if (mode === 'mobile') setSidebarOpen(false)
  }, [location.pathname, mode])

  const toggle = useCallback(() => setSidebarOpen(v => !v), [])

  const showSidebar  = mode !== 'mobile'
  const showBottomNav = mode === 'mobile'
  const showOverlay  = mode === 'mobile' && sidebarOpen

  // On mobile: sidebar as fixed overlay drawer
  const mobileSidebarStyle = mode === 'mobile' ? {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 101,
    transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: `transform var(--dur-slow) var(--ease-out)`,
  } : {}

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      {/* Mobile overlay backdrop */}
      {showOverlay && (
        <div
          className="sidebar-overlay sidebar-overlay--visible"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      {(showSidebar || mode === 'mobile') && (
        <div style={mobileSidebarStyle}>
          <Sidebar
            open={sidebarOpen}
            mode={mode}
            onToggle={toggle}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main content */}
      <div className="app-main">
        <Header
          onMenuToggle={toggle}
          mode={mode}
          sidebarOpen={sidebarOpen}
        />
        <main className="app-content" id="main-content">
          <div className="page-content animate-fadein">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom nav (mobile only) */}
      {showBottomNav && <BottomNav />}
    </div>
  )
}
