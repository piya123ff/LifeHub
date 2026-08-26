import React from 'react'
import { NavLink } from 'react-router-dom'
import { BOTTOM_NAV_ITEMS } from '../../data/menuItems.js'
import './BottomNav.css'

export default function BottomNav() {
  return (
    <nav className="bottom-nav" role="navigation" aria-label="Bottom navigation">
      {BOTTOM_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `bottom-nav-item${isActive ? ' bottom-nav-item--active' : ''}`
          }
        >
          <span
            className="bottom-nav-icon"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: item.icon }}
          />
          <span className="bottom-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
