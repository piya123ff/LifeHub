import React from 'react'

export default function Card({ children, className = '', padding = 'md', ...rest }) {
  return (
    <div className={`card card-pad-${padding} ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="card-header">
      <div>
        <p className="card-header-title">{title}</p>
        {subtitle && <p className="card-header-sub">{subtitle}</p>}
      </div>
      {action && <div className="card-header-action">{action}</div>}
    </div>
  )
}
