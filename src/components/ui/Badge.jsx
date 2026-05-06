import React from 'react'

export default function Badge({ children, color = 'default', className = '' }) {
  return (
    <span className={`badge badge-${color} ${className}`}>
      {children}
    </span>
  )
}
