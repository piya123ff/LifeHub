import React from 'react'

export default function StatCard({ title, value, sub, icon, accent = 'violet', style }) {
  return (
    <div className={`stat-card accent-${accent} animate-fadeup`} style={style}>
      {icon && <div className="stat-card-icon">{icon}</div>}
      <div className="stat-card-body">
        <p className="stat-card-title">{title}</p>
        <p className="stat-card-value">{value}</p>
        {sub && <p className="stat-card-sub">{sub}</p>}
      </div>
    </div>
  )
}
